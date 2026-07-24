# Google Antigravity 安装、Agent 工作流与模型边界

> 最后核验：2026-07-24
>
> 适用范围：Google Antigravity IDE；Windows、macOS、Linux
>
> 预计用时：15～30 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Antigravity 是什么

Google Antigravity 是面向 Agent 开发流程的编程环境。它既保留编辑器工作区，也提供 Agent Manager，让多个 Agent 处理规划、编码、终端和浏览器任务，并通过任务产物帮助用户审查执行过程。

它适合：

- 让 Agent 在真实项目中完成多步骤开发任务；
- 同时查看代码修改、终端命令和浏览器验证；
- 使用 MCP Server 扩展外部工具；
- 在产品提供的模型列表中切换模型。

它不是一个通用 API 客户端。MCP 中配置第三方服务的 API Key，也不等于给 Antigravity 主模型配置了任意 Base URL。

## 2. 安装与登录

从 [Antigravity 官方网站](https://antigravity.google/) 下载对应系统版本，完成安装后使用 Google 账号登录。

首次启动建议：

1. 选择一个不包含生产密钥的测试项目；
2. 检查工作区信任和终端权限；
3. 查看 Agent 的命令审批设置；
4. 确认当前选择的模型；
5. 再开始第一个任务。

产品迭代较快，系统版本要求和可用模型以下载页及客户端界面为准，不在教程中写死容易过期的模型清单和额度数字。

## 3. 编辑器与 Agent Manager

Antigravity 主要有两类工作界面：

- **Editor**：查看和编辑代码、打开终端、处理具体文件；
- **Agent Manager**：创建、分派和观察多个 Agent 任务。

刚开始使用时，不要同时启动多个会修改同一文件的任务。更稳妥的顺序是：

1. 让 Agent 只读分析项目；
2. 审查它识别出的目标文件；
3. 要求给出改动计划；
4. 批准一个小范围修改；
5. 查看 diff；
6. 运行测试；
7. 再扩大任务范围。

## 4. 第一次验证

在测试仓库中创建一个简单文件：

```text
README.md
```

向 Agent 提交：

```text
请先只读检查这个项目，说明它目前包含什么。不要修改文件，也不要执行安装命令。
```

确认只读分析符合预期后，再提交：

```text
请在 README.md 中增加“本地开发”章节，只写一条启动说明。修改前先展示计划，修改后运行 git diff。
```

验收时至少看三处：

- Agent 是否只改了指定文件；
- 终端是否执行了未授权命令；
- 最终说明是否与实际 diff 一致。

## 5. 模型选择与能力边界

在 Agent 面板或模型选择器中选择当前账号可用的模型。模型可用性、额度和消耗方式可能随账号方案、地区及产品策略变化，应以客户端实时显示为准。

截至本次核验，官方公开资料能够确认 Antigravity 提供模型选择，但没有提供一个面向所有用户、可填写任意 OpenAI-compatible Base URL 的通用主模型配置流程。因此：

- 不要照搬其他编辑器的 `OPENAI_BASE_URL` 配置；
- 不要把项目 `.env` 中的模型 Key误认为 Antigravity 自身的模型 Key；
- 不要修改内部文件尝试注入未经文档支持的 Provider；
- 需要任意自定义端点时，选择官方明确支持 Custom Provider 的工具。

## 6. MCP Server

Antigravity 支持安装和管理 MCP Server。Google 官方示例中的 Antigravity IDE 可通过 Agent 面板进入：

```text
MCP Servers → Manage MCP Servers → View raw config
```

新版本 Antigravity 的 MCP 配置可能与 Antigravity CLI 共用：

```text
~/.gemini/config/mcp_config.json
```

示例结构：

```json
{
  "mcpServers": {
    "example-docs": {
      "serverUrl": "https://mcp.example.com",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_TOKEN"
      }
    }
  }
}
```

这段内容仅说明结构。实际字段、认证头和 URL 必须来自目标 MCP Server 的官方文档。

配置后返回 Installed MCP Servers 并刷新。如果工具没有出现，依次检查 JSON 语法、网络、认证信息和服务器日志。

## 7. 安全设置

Agent 可以执行终端命令和浏览器操作，因此应把它当作拥有本机操作能力的软件：

- 不在提示词中粘贴生产密钥；
- `.env`、证书和账户文件加入忽略规则；
- 删除、部署、付款和发布操作保留人工确认；
- 第三方 MCP 只授予完成任务所需的最小权限；
- 不把工作区直接指向整个用户主目录；
- 审查 Agent 生成的命令和网页操作记录；
- 重要项目先提交或创建独立分支。

项目中需要使用 Gemini API Key 时，应保存在 `.env` 等未提交文件中，并设置 API 限制和轮换方案。这个 Key服务于你开发的应用，不代表 Antigravity 主模型已经切换为该 API。

## 8. 常见问题

| 现象 | 排查方法 |
|---|---|
| 模型列表和教程截图不同 | 以当前客户端和账号显示为准，模型目录会变化 |
| 找不到 Base URL | 当前没有可证实的通用自定义主模型入口，不要套用其他 IDE 教程 |
| Agent 修改范围过大 | 缩小任务、明确允许文件、要求先展示计划和 diff |
| 终端命令被拒绝 | 检查工作区信任、审批策略和系统权限 |
| MCP 工具不显示 | 校验配置 JSON、刷新 MCP 列表并查看目标服务认证要求 |
| 浏览器任务失败 | 检查站点登录状态、弹窗和浏览器权限，避免在敏感账户上直接试跑 |
| 配额不足 | 查看客户端的实时额度提示；切换可用模型或等待额度恢复 |

## 9. 官方来源

- [Google Antigravity](https://antigravity.google/)
- [Antigravity 官方文档](https://www.antigravity.google/docs/home)
- [Antigravity IDE Overview](https://www.antigravity.google/docs/ide-overview)
- [Google Developers Blog：Introducing Google Antigravity](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Google Codelab：在 Antigravity 配置 MCP](https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity)
