# 东南大学选课助手

面向东南大学选课页面的 Tampermonkey 用户脚本。支持教学班添加、自动搜索、分组提交和队列结果核验。

## 安装与使用

1. 安装 Tampermonkey，并[安装 v3.5.0 脚本](https://raw.githubusercontent.com/julymiaw/grab-lessons-for-seu/main/东南大学抢课助手修改版-3.5.0.user.js)。同一页面只启用一份选课脚本。
2. 登录[学校选课系统](https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons)，进入课程列表。
3. 展开课程，在教学班旁点击“添加”；也可在助手中输入“课程号 + 教学班序号”，多个编码用空格分隔。找不到的编码保留在输入框中。
4. 按需调整提交方式和间隔，再开始抢课。只有最终推送确认成功，或在官网已选列表中查到教学班，才从待选列表移除。

[GitHub 源码](https://github.com/julymiaw/grab-lessons-for-seu) · [问题反馈](https://github.com/julymiaw/grab-lessons-for-seu/issues) · [Greasy Fork 原发布页](https://greasyfork.org/zh-CN/scripts/482811)

## 功能

- **课程列表**：显示课程与教师信息，支持查看详情、添加和删除待选教学班。
- **自动搜索**：按当前轮次开放的推荐课程、方案内课程、方案外课程、体育项目、通选课分页查找；每页数量和查询间隔可设置。
- **提交设置**：支持单次／循环、同步／异步、单个／分组，分组数量可调整。运行时锁定编辑，可停止后续请求。
- **结果核验**：HTTP 入队不等于选课成功。通过官网 WebSocket 最终推送和已选课程列表确认；未决结果保留为“待核实”，阻止重复提交。
- **配置恢复**：本地保存设置和待选课程，重新加载后从当前会话取得课程凭据；不持久化 token 或 `secretVal`。
- **原有面板**：保留 v3 面板、悬浮入口及拖动操作，不覆盖官网的选课事件监听。

### 调度行为

单个模式最多有 1 门课程正在处理；分组模式最多有设定数量的课程正在处理。课程处理包括等待队列最终结果，超时后查询已选列表。

同步模式在当前组处理完成后开始计算间隔；异步模式先计算间隔，但仍受上述在途数量限制。上一门／组尚未处理完成时，后续课程会等待；异步并不表示无限并发。同一轮全部在途任务结束后，才进入下一轮循环。

志愿轮次，以及需要填写实验班或教材选项的课程，请通过官网操作。

## 版本与验证

v3.5.0 来自 [PR #3](https://github.com/julymiaw/grab-lessons-for-seu/pull/3)，由贡献者提供并反馈实际运行。维护者目前无法登录选课系统，合并后只完成本地构建与离线测试，尚未独立复现实网选课。

当前仓库使用 JavaScript 核心、页面适配和保留的 v3 UI；不再使用先前的 TypeScript／Lit 实验工程。历史 v3.4.1 与 v4 测试版源码可在[合并前的提交](https://github.com/julymiaw/grab-lessons-for-seu/tree/ba58ba651ca3e0d1ef89c5a8503ad1653c593ed2)查看。[Greasy Fork 原测试版页面](https://greasyfork.org/zh-CN/scripts/594721)上的版本与发布状态单独维护，不代表 GitHub 当前版本。

## 本地构建与测试

使用 Node.js 22 或以上及 pnpm：

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
```

构建产物为根目录的 `东南大学抢课助手修改版-3.5.0.user.js`。测试使用模拟页面、HTTP 与 WebSocket，不访问学校；覆盖队列状态、301 二次确认、未决请求、停止、配置恢复、分组调度及按钮交互。

- `src/seu-core.js`：课程解析、队列状态、提交与调度。
- `src/compat-runtime.js`：官网接口和页面集成。
- `src/legacy-ui.js`：保留的 v3 面板。
- `tools/build.cjs`：生成可安装用户脚本。
- `tools/summarize-har.cjs`：本地抓包摘要工具；原始 HAR 不提交仓库。

欢迎反馈页面或接口变化；请勿提交登录凭据、token、`secretVal` 或个人选课记录。仅选择本人需要修读的课程，请遵守学校选课规定。
