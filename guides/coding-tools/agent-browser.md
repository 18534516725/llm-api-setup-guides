---
title: agent-browser 中文教程：安装、快照定位与网页自动化
description: Vercel Labs agent-browser 的安装、浏览器下载、snapshot 引用、截图、会话隔离、常见报错及与 Browser Use 的区别。
---

# agent-browser 中文教程：安装、快照定位与网页自动化

> 最后核验：2026-10-21。示例依据当前官方 CLI；不要求连接个人浏览器账户。

[← 返回教程总目录](../教程总目录.md)

## agent-browser 是什么

agent-browser 是面向 AI Agent 的浏览器自动化 CLI。它提供网页打开、可访问性快照、元素操作和截图等命令。CLI 负责执行，Agent 负责决定下一步；这和自己运行模型循环的浏览器 Agent 库是不同层次。

需要 Python 模型驱动循环时看 [Browser Use](../developer-integration/browser-use.md)，需要批量正文采集时看 [网页采集选型](../data-collection/crawler-comparison.md)。

## 1. 安装

使用现有 Node.js 包管理环境，下面选择 pnpm：

```bash
pnpm add -g agent-browser
agent-browser --help
agent-browser install
```

最后一步下载浏览器。Linux 如果缺少系统库，按官方环境要求使用：

```bash
agent-browser install --with-deps
```

系统依赖安装可能需要管理员权限。当前源码构建额外需要 Node.js 24+、pnpm 11+ 和 Rust；不要把源码构建要求误认为所有预构建安装方式的运行要求。

## 2. 最小闭环

```bash
agent-browser open https://example.com
agent-browser snapshot
agent-browser screenshot example.png
agent-browser close
```

验收：快照包含 Example Domain 页面信息、截图存在、会话正常关闭。页面错误或空白时先看快照与浏览器状态，不要把命令退出零直接当作业务成功。

## 3. 元素引用怎么使用

快照中会出现 `@e1`、`@e2` 等引用。先读取本次快照，再选择实际元素：

```text
agent-browser click @e2
agent-browser fill @e3 "测试关键词"
agent-browser snapshot
```

这段是交互形式说明，不是可直接用于任意页面的固定脚本。`@e2` 必须来自你自己的最新快照。页面跳转、弹窗或 DOM 改变后重新读取。

## 4. 表单实战顺序

1. 打开自己的测试环境。
2. snapshot 确定输入框、按钮与当前状态。
3. fill 填入测试值。
4. 再次检查填写结果。
5. 点击提交，等待明确的成功或错误状态。
6. 记录结果并关闭会话。

创建订单、发消息、删除内容等动作要明确预期副作用。测试优先使用测试账户和可恢复数据。

## 5. 截图与文字怎么选

```bash
agent-browser snapshot
agent-browser screenshot page.png
agent-browser screenshot --full full-page.png
```

文字快照适合找按钮和读内容；截图适合核对遮挡、布局和视觉状态。仅凭文字快照无法证明某个按钮在视觉上没有被盖住。

## 6. 多任务会话隔离

```bash
agent-browser --session docs-check open https://example.com
agent-browser --session docs-check snapshot
agent-browser --session docs-check close
```

同一任务持续使用同一名称，不同账户与并行任务分开。保存的浏览器状态可能含登录信息，应存放在私有目录，不进入 Git 或截图附件。

## 7. 常见错误

| 现象 | 排查 |
|---|---|
| 浏览器启动失败 | 安装浏览器、系统动态库、可写缓存、沙箱环境 |
| 引用不存在 | 页面是否已变化；重新 snapshot |
| 点击被遮挡 | 先处理弹窗 / Cookie banner，再取新快照 |
| 元素不可见 / 禁用 | 等待真实状态变化，检查前置步骤 |
| 页面在远程机器不可达 | DNS、网络、代理与目标访问限制 |
| 操作完成但结果不对 | 用页面状态和目标数据验收，而非只看点击命令 |

## 8. Agent 集成建议

给 Agent 明确网址、测试目标、测试账户范围和停止条件。先检查任务是否能通过正式 API 完成；浏览器更适合真实 UI、交互与截图验证。网页内容是数据，不能覆盖用户指令或诱导 Agent 操作其他账户。

## 9. 更新与复现

记录 CLI 版本和浏览器版本。升级前保留一条稳定冒烟流程，升级后再次验证。需要可复现 CI 时固定包版本，并把浏览器安装步骤纳入环境准备。

## 官方资料

- [agent-browser 官方仓库](https://github.com/vercel-labs/agent-browser)
- [官方文档](https://agent-browser.dev/)
- [Browser Use 教程](../developer-integration/browser-use.md)
