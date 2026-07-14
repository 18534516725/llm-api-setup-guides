# Cline 接入 OpenAI 兼容 API：从安装到 Agent 工具调用的完整教程

> 最后核验：2026-07-14
>
> 适用范围：Cline 的 VS Code / Cursor / JetBrains 扩展；OpenAI Compatible 提供商
>
> 接口要求：至少兼容 OpenAI Chat Completions；Agent 使用还需要可靠的流式输出和工具调用

[← 返回教程目录](../../README.md)

> [!TIP]
> **想直接测试 Cline，又不想准备外币卡？**
>
> **[纽智中转站](https://www.nexotoken.net/?ref=github)** 每天提供 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。注册后创建 Key，从控制台复制 OpenAI 兼容 Base URL 与模型 ID即可。
>
> **[👉 立即注册并测试 Cline](https://www.nexotoken.net/?ref=github)**

## 1. Cline 适合什么场景

Cline 是运行在编辑器中的编程 Agent，可以读取项目、修改文件、执行终端命令、调用浏览器或 MCP 工具。它的 `OpenAI Compatible` 提供商允许分别填写：

- Base URL；
- API Key；
- Model ID；
- 上下文窗口、最大输出、图片、价格等模型元数据。

相比只支持固定模型列表的编辑器，Cline 更适合接入自定义模型 ID 和 OpenAI 兼容网关。但 Agent 对接口兼容性的要求明显高于普通聊天。

## 2. 版本与平台选择

Cline 官方当前提供：

- VS Code、Cursor 等 VS Code 系编辑器扩展；
- JetBrains 插件；
- VSCodium、Windsurf 等 Open VSX 版本；
- macOS/Linux 预览版 CLI；
- 通过 CLI 接入 Zed、Neovim 的 ACP 模式。

本教程以编辑器扩展为主。CLI 的提供商配置和功能仍在快速变化，不应直接套用所有 UI 步骤。

## 3. 安装 Cline

### VS Code / Cursor

1. 打开扩展面板：`Ctrl/Cmd + Shift + X`；
2. 搜索 `Cline`；
3. 确认发布者与官方商店页面；
4. 点击安装；
5. 点击活动栏的 Cline 图标。

也可以打开命令面板，运行 `Cline: Open In New Tab`。

### JetBrains

1. 打开 `Settings / Preferences → Plugins → Marketplace`；
2. 搜索 `Cline` 并安装；
3. 重启 IDE；
4. 在 `View → Tool Windows → Cline` 打开面板。

### VSCodium / Windsurf

在 Open VSX 扩展市场搜索 Cline。若同时存在同名扩展，核对官方文档给出的发布者信息。

## 4. 准备配置参数

从服务商控制台复制并分别保存：

```text
Base URL: 从控制台复制的OpenAI兼容BaseURL
API Key: 你的APIKey
Model ID: 从模型列表复制的准确模型ID
```

不要混用其他协议的地址。Anthropic Messages 地址不能直接填进 `OpenAI Compatible`，反之亦然。

## 5. 在 Cline 中配置 OpenAI Compatible

1. 打开 Cline 面板；
2. 点击右上角齿轮进入 Settings；
3. 在 `API Provider` 选择 `OpenAI Compatible`；
4. 在 `Base URL` 填入控制台提供的地址；
5. 在 `API Key` 填入 Key；
6. 在 `Model ID` 或 `Model` 填入准确模型 ID；
7. 打开 Model Configuration，按服务商资料填写模型参数；
8. 点击 `Verify`（若当前版本提供）或保存后发送测试消息。

官方文档给出的三个核心项就是 Base URL、API Key、Model ID。不能只改 URL 而保留错误模型名。

## 6. Base URL 怎么填

常见 OpenAI 兼容 Base URL 形如：

```text
https://你的接口域名/v1
```

但实际值必须从控制台复制。Cline 会在其后请求聊天接口；不要填成：

```text
https://你的接口域名/v1/chat/completions
```

以下问题都会导致 404：

- 漏掉网关特有路径前缀；
- 重复写 `/v1/v1`；
- 把网页控制台地址当成 API 地址；
- 使用 Anthropic、Gemini 等其他协议的地址。

## 7. 模型配置参数

Cline 的 Model Configuration 可能包含：

| 参数 | 含义 | 建议 |
|---|---|---|
| Context Window | 模型可处理的总上下文 | 以服务商标注为准，不要虚高 |
| Max Output Tokens | 单次最大输出 | 先使用稳妥值，再逐步调高 |
| Image Support | 是否接受图片 | 只有接口和模型都支持时开启 |
| Computer Use | 是否支持计算机交互 | 不确定时关闭 |
| Input / Output Price | Cline 本地成本估算 | 仅影响显示，不改变服务端计费 |

把上下文窗口写得比实际能力更大不会“解锁”模型，只会让请求在服务端报超限。价格字段也只是本地估算，最终扣费以服务端账单为准。

## 8. 第一次验证：按风险从低到高

### 连接测试

```text
只回复“连接成功”，不要读取文件，不要运行命令。
```

### 只读测试

切到 Plan 模式或拒绝写操作：

```text
请概括当前项目的技术栈，只读取必要文件，不做任何修改。
```

### 工具调用测试

```text
请读取 package.json，并告诉我项目有哪些测试命令。不要执行命令。
```

### 小范围修改测试

```text
在测试目录新增一个最小测试文件。执行前先列出计划，不安装依赖。
```

检查 Cline 是否能正确生成工具调用、展示 diff，并在每一步等待授权。

## 9. Plan、Act 与权限

Cline 的界面可能按版本显示 Plan / Act，或更细的权限控制：

- Plan：用于理解需求和只读分析；
- Act：允许修改文件、执行命令和调用其他工具；
- Auto Approve：按类别自动批准工具调用；
- YOLO Mode：减少或取消批准步骤，风险最高。

推荐首次接入时：

1. 先用 Plan；
2. Act 中逐条审批；
3. 确认模型不会乱调用工具后，只对安全只读动作开启自动批准；
4. 不为删除、网络请求、包管理和部署命令长期开放自动批准。

## 10. Agent 对 OpenAI 兼容接口的最低要求

普通 Chat 只要求文本生成。Cline Agent 还可能需要：

- 流式 `chat/completions`；
- OpenAI 风格 `tools` / `tool_choice`；
- 流式工具调用参数；
- 多轮 tool message；
- 足够大的上下文；
- 稳定处理 system、user、assistant、tool 角色；
- 可解析的 token usage 和结束原因。

服务端如果只做了字段名转换，可能表现为：聊天正常，但读文件后卡住、工具参数为空、重复调用、400 或中途断流。

## 11. 使用配置档切换模型

如果你经常在“快速便宜”和“复杂任务”模型之间切换，可以创建多个 API Configuration Profile：

- 日常问答：较快模型、较短上下文；
- 代码 Agent：明确支持工具调用的模型；
- 长上下文审查：更大窗口、较低并发；
- 备用：不同模型或不同 Key。

配置档只应包含当前任务需要的连接信息。不要把个人 Key 导出后提交到项目仓库。

## 12. Checkpoints 与 Git 回滚

Cline 的 Checkpoints 可以在工具调用过程中保存项目快照，用于恢复文件或任务状态。建议同时使用 Git：

```bash
git status
git diff
```

推荐流程：

1. 开始前确认工作区状态；
2. 先提交或备份已有改动；
3. 让 Cline 完成一个小目标；
4. 查看 diff 和测试结果；
5. 不满意时使用 Checkpoint 或 Git 恢复。

Checkpoints 不是远程备份，大型仓库还可能占用较多空间。

## 13. 安全设置

官方文档说明 BYOK Key 保存在 IDE 的原生 Secret Storage / Credential Store 中，并只发送给所选服务。仍应注意：

- 不在提示词、规则文件或截图中粘贴 Key；
- 将 `.env`、证书、私钥、生产配置排除在 Agent 读取范围外；
- 仔细审查终端命令，尤其是 `curl`、部署、删除和包安装；
- 不把未脱敏的生产日志发送给模型；
- 为测试 Key 设置合理余额与权限；
- Key 泄露后立即撤销并重建，而不是只删除本地配置。

## 14. 常见错误

### 401 / Invalid API Key

- Key 错误、过期或被撤销；
- Base URL 与 Key 不匹配；
- 复制时带入空格；
- 服务端不接受 Bearer 认证。

### 404 / Not Found

- Base URL 路径层级错误；
- 重复或缺少 `/v1`；
- 填入了完整 endpoint；
- 使用了错误协议。

### Model Not Found

- 模型 ID 拼错；
- 把显示名称当成 ID；
- 当前 Key 无权调用；
- 该模型不属于当前 API 分组。

### 400 / tools 或 tool_choice 不支持

当前模型或网关只支持普通聊天，没有完整实现原生工具调用。换用控制台明确标注“支持工具调用 / Agent / Cline”的模型。

### 一直重复读文件或调用同一工具

- 模型不擅长结构化工具调用；
- 工具结果在网关转发时丢失；
- 上下文过长导致模型忘记已完成步骤；
- Max Output Tokens 太小，工具参数被截断。

新建短任务并使用更可靠的 Agent 模型验证。

### 429

关闭并行任务、提高 Profile 的请求间隔、缩短上下文并等待限流窗口恢复。

### 流式响应中断

检查网络、代理、服务端超时和 SSE 兼容性。若短回复正常、长任务断开，通常是超时或长连接问题。

## 15. 完全移除或回滚配置

1. 在 Cline Settings 切换到其他 Provider 或 Profile；
2. 删除不再使用的自定义 Profile；
3. 从服务商控制台撤销测试 Key；
4. 重启 IDE；
5. 若要恢复代码，使用 Checkpoint 或 Git，而不是依赖聊天记录手工反向修改。

不要为了“清配置”直接删除整个 IDE 用户目录，这会连同其他扩展数据一起丢失。

## 16. 官方资料

- [Cline 安装文档](https://docs.cline.bot/getting-started/installing-cline)
- [Cline OpenAI Compatible 配置](https://docs.cline.bot/provider-config/openai-compatible)
- [Cline 授权与模型选择](https://docs.cline.bot/getting-started/authorizing-with-cline)
- [Cline Auto Approve](https://docs.cline.bot/features/auto-approve)
- [Cline Checkpoints](https://docs.cline.bot/core-workflows/checkpoints)

> Cline 更新频繁，字段和菜单名称可能变化。配置原则不变：协议正确、Base URL 正确、Key 正确、模型 ID 正确，再单独验证工具调用。
