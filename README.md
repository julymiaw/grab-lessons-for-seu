# 东南大学选课助手

在学校选课页面批量添加教学班，按设置的间隔自动提交，并跟踪队列最终结果。保留原有面板，支持自动搜索、循环和分组发送。

[安装 v3.5.1](https://raw.githubusercontent.com/julymiaw/grab-lessons-for-seu/main/东南大学抢课助手修改版-3.5.1.user.js) · [GitHub 源码](https://github.com/julymiaw/grab-lessons-for-seu) · [问题反馈](https://github.com/julymiaw/grab-lessons-for-seu/issues)

## 使用

1. 安装 Tampermonkey 和脚本，打开[学校选课系统](https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons)。同一页面只启用一份选课助手。
2. 展开课程，点击教学班旁的“添加”；也可输入“课程号 + 教学班序号”，多个编码用空格、逗号或分号分隔。
3. 在设置中选择单次／循环、同步／异步、单个／分组，再点击“一键抢课”。
4. 面板分别显示提交中、排队中和最终结果。确认选课成功后，课程自动从待选列表移除；“停止抢课”结束后续发送。

当前页面找不到的课程可自动搜索，未找到的编码保留在输入框中。待选列表支持查看详情和删除课程；设置及待选课程可在刷新后恢复。

## 发送方式

- **同步**：当前一门／组的 HTTP 请求返回后，等待设置的间隔，再发送下一门／组。
- **异步**：发送当前一门／组后，按设置的间隔继续发送下一门／组。
- **分组**：每次同时发送设定数量的课程，默认 3 门。
- **循环**：继续尝试尚未选上、且没有未决提交的课程，可设置循环次数。

队列结果单独跟踪，A 课程排队不会挡住 B 课程发送。同一教学班正在提交、排队或结果待核实时不重复发送。收到最终推送后更新状态；未收到推送时查询官网已选课程。“待核实”的课程可在官网已选列表中确认。

### 默认间隔

| 设置 | 默认值 |
| --- | --- |
| 同步单个 | 300 ms |
| 异步单个 | 350 ms |
| 分组发送 | 1000 ms |
| 搜索翻页 | 500 ms |

已有的自定义设置会保留。需要二次确认的课程会弹出官网确认框，确认后继续提交。

## 保存与隐私

设置和待选课程保存在当前站点的本地存储中。token、`secretVal` 从当前会话读取，不持久化，不上传到第三方。

## 开发

源码分为界面、选课核心和官网适配三个模块，构建后生成一个可直接安装的用户脚本。

使用 Node.js 22 或以上及 pnpm：

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
```

安装文件：`东南大学抢课助手修改版-3.5.1.user.js`。

- `src/seu-core.js`：课程解析、队列状态、提交与调度。
- `src/compat-runtime.js`：官网请求与页面集成。
- `src/legacy-ui.js`：操作面板。
- `tools/build.cjs`：生成安装文件。

[更新日志](https://github.com/julymiaw/grab-lessons-for-seu/blob/main/CHANGELOG.md) · [测试记录](https://github.com/julymiaw/grab-lessons-for-seu/blob/main/docs/test-results.md) · [历史 3.4.1 源码](https://github.com/julymiaw/grab-lessons-for-seu/blob/ba58ba651ca3e0d1ef89c5a8503ad1653c593ed2/东南大学抢课脚本修改版.js)

Greasy Fork：[原发布页](https://greasyfork.org/zh-CN/scripts/482811) · [测试发布页](https://greasyfork.org/zh-CN/scripts/594721)。各页面的发布版本单独更新。
