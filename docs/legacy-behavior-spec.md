# 旧版 v3.4.0 行为契约

> 本文档根据 `东南大学抢课脚本修改版.js` 整理。它描述的是旧版**可观察行为**，用于 v4 的回归与差分测试；不要求复刻旧版已知缺陷。本文不记录真实 token、个人课程或接口响应样本。

## 1. 兼容性边界

旧版只在以下页面运行：

```text
newxk.urp.seu.edu.cn/xsxk/elective/grablessons?*
```

它假定页面已暴露以下全局对象和节点：

| 依赖 | 用途 | v4 是否必须兼容 |
| --- | --- | --- |
| `grablessonsVue` | 当前批次、课程类型、课程列表、校区和 Element UI 消息提示 | 是 |
| `axios` / `Qs` | 同源请求及表单编码 | 否；只需保持请求语义 |
| `#xsxkapp` | 脚本 UI 的挂载点 | 是；允许有 `document.body` 兜底 |
| Element UI 课程表 DOM | 在详情中插入“添加”按钮 | 是，需单独适配和测试 |

## 2. 必须保持的外部接口行为

### 2.1 添加课程请求

请求：

```http
POST /elective/clazz/add
batchId: <courseBatch>
Content-Type: application/x-www-form-urlencoded

clazzType=<courseType>&clazzId=<classID>&secretVal=<secretVal>
```

成功条件是 JSON 响应的 `code === 200`。成功后该课程必须从待抢列表删除，并提示成功。

当首个响应 `code === 301` 时，旧版意图是以相同课程再次发送确认请求：

```text
clazzType、clazzId、secretVal 保持不变，额外发送 isConfirm=1
```

注意：旧版实际将 `clazzId` 错写为不存在的 `course.courseCode`。这是已知 bug，v4 应遵循上面的意图，使用 `classID`。

失败响应必须保留课程，并显示服务器返回的 `msg`。网络异常在旧版没有可靠处理；v4 的正确兼容目标是保留课程、显示错误并恢复可操作状态。

### 2.2 课程搜索请求

请求：

```http
POST /elective/clazz/list
Content-Type: application/json

{
  "teachingClassType": "TJKC | FANKC | FAWKC | TYKC | XGKC",
  "pageNumber": 1,
  "pageSize": 20,
  "orderBy": "",
  "campus": "<grablessonsVue.currentCampus.code>"
}
```

成功响应要求 `code === 200`，读取 `data.rows` 和 `data.total`。搜索顺序严格为：

```text
TJKC → FANKC → FAWKC → TYKC → XGKC
```

每个类型从第 1 页向后读取，在以下任一条件停止该类型：没有待找课程、`rows` 为空、`pageNumber * pageSize >= total`。每一页之间等待 `settings.search.pageDelay`，默认 500 ms。

## 3. 课程编码与解析契约

用户输入可由空格分隔多个编码；旧版在手动输入时会先转换为大写。

编码格式为：

```text
前 8 位 KCH（课程号） + 后续 KXH（教学班序号）
```

对非 `XGKC` 类型：在 `courseList` 找 `course.KCH`，再在 `course.tcList` 找 `teacher.KXH`。

对 `XGKC` 类型：直接在课程对象上匹配 `course.KXH`，并把该课程对象作为教学班信息。

成功加入的记录最少保留：

```text
courseBatch, classID, courseType, secretVal,
courseName, teacherName, department, location,
selectedCount, totalCapacity
```

失败时，输入框必须只保留未成功添加的课程编码。重复添加已在列表中的课程不应制造第二条记录。

## 4. 页面交互契约

### 4.1 脚本面板

旧版在 `#xsxkapp` 下添加浮动入口、右侧面板、输入框、待抢课程列表、开始按钮和设置/停止按钮。列表只展示当前 `currentBatch.code` 的课程；课程记录仍可跨批次保存在本地。

运行时应禁止：手动输入、删除待抢课程、通过页面添加课程、修改设置。停止后应恢复。

### 4.2 课程详情“添加”按钮

旧版监听文档点击。当一条 `tr.el-table__row` 进入 `expanded` 状态后，等待约 100 ms；从其下一行的 `td.el-table__expanded-cell` 中找到文字含“选择”的 Element UI 小型主按钮，并在同一父节点追加“添加”按钮。

点击“添加”时：

1. 读取主行第一列 `td span` 的课程号。
2. 从相应 `.el-card__body .one-row span` 读取教学班序号。
3. 拼接为课程编码，交给与手动输入相同的添加逻辑。

页面结构变动时，此功能最可能失效；v4 应只修改页面适配层，不修改领域、请求或 UI 模块。

### 4.3 设置

旧版存在以下有效设置：

| 设置 | 默认值 | 影响 |
| --- | --- | --- |
| `isCyclic` | `true` | 待抢列表处理完后是否再次从剩余课程开始 |
| `isAsync` | `false` | 是否等待上一批请求的响应 |
| `isGrouped` | 实际默认 `false` | 单次发 1 门或并发发 3 门 |
| `enableSearch` | `true` | 当前页找不到时是否跨类型搜索 |
| 四组 `interval` | 300/1000/350/1000 ms | 对应同步/异步 × 单个/分组的发送间隔 |
| `search.pageSize` | 20 | 搜索每页数量 |
| `search.pageDelay` | 500 ms | 搜索翻页等待时间 |

`cycleCount` 和 `savedCourseCodes` 没有完整参与旧版业务，不属于必须兼容项。

## 5. 抢课调度契约

开始时，取当前批次全部待抢课程。

- 单个模式：每轮取 1 门。
- 分组模式：每轮取 3 门。
- 同步模式：等待本轮请求全部结算后，再等待当前间隔。
- 异步模式：立即发出本轮请求，再等待当前间隔。
- 单次模式：遍历初始列表后结束。
- 循环模式：仅剩余未成功课程再次进入下一轮。

v4 必须避免旧版的两个错误：异步任务未被追踪导致停止后继续修改状态；慢响应在循环开始前未完成导致重复提交。修复这些错误视为行为改进，而不是不兼容。

## 6. 本地存储与迁移

旧版使用 `localStorage["july"]`，数据为：

```json
{ "enrollDict": { "课程编码": "课程记录" }, "settings": "设置" }
```

旧版同时持久化 token，并在 token 变化后清空/搜索重建课程列表。测试版兼容这一恢复机制：持久化 token 用于判断会话变化，变化后通过当前页面和搜索接口重新取得 `secretVal`，并保留未恢复的课程编码。

## 7. 差分测试清单

在获得脱敏页面/响应 fixture 后，应逐项验证：

1. 每类课程数据都能从“课程号 + 教学班序号”解析出同样的 `classID`、`secretVal` 和展示信息。
2. 当前页成功、课程号不存在、教学班不存在、重复添加时，列表和剩余输入一致。
3. 五个课程类型的搜索顺序、分页边界与最终待找列表一致。
4. `200`、`301→200`、`301→失败`、普通失败、网络失败时的请求体、保留/删除行为一致；301 使用修正后的 `classID`。
5. 四种发送组合在虚拟时钟下满足分组大小、请求顺序和间隔约束。
6. 停止时不产生新的请求，所有在途请求不再改变 UI 状态。
7. 每份页面 DOM fixture 中恰好注入一个“添加”按钮，点击后产生正确编码。

## 8. 非兼容项记录

以下变更是有意的，不作为回归：Shadow DOM UI、原生 `fetch` 替代 Axios/Qs、存储键从 `july` 迁移至 `grab-lessons-for-seu:v4`、不保存 token、网络错误可恢复、301 确认参数修正。
