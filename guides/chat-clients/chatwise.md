# ChatWise 接入 OpenAI / Anthropic 兼容 API：自定义 Provider 完整教程

> 最后核验：2026-07-15
>
> 适用范围：ChatWise 当前桌面版；自定义 OpenAI-compatible 或 Anthropic-compatible 服务
>
> 预计用时：5～10 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. ChatWise 适合什么场景

ChatWise 是桌面 AI 聊天客户端，官方的 Custom Provider 功能允许添加 OpenAI-compatible 或 Anthropic-compatible 服务。它适合希望在一个桌面界面里管理多个模型、手动声明模型能力，并使用文档、图片或 MCP 工具的用户。

自定义 Provider 只代表客户端允许填写端点，不代表所有兼容服务都支持图片、音频、视频、推理、工具调用和结构化输出。第一次配置应只测试纯文本。

## 2. 安装与打开设置

1. 从 [ChatWise 官网](https://chatwise.app/) 下载对应系统的安装包；
2. 完成安装并启动应用；
3. 使用 `Command + ,`（macOS）或应用设置入口打开 Settings；
4. 进入 `Providers`；
5. 点击 `+` 添加提供方。

不要从第三方软件下载站安装，也不要把 Key 粘贴到来历不明的修改版客户端。

## 3. 准备配置数据

OpenAI-compatible 通常准备：

```text
Provider Name: 自定义 OpenAI 接口
API Endpoint: https://your-api.example.com/v1
API Key: YOUR_API_KEY
Model ID: YOUR_MODEL_ID
```

Anthropic-compatible 必须使用服务明确提供的 Anthropic 协议地址和模型 ID，不能把 OpenAI Chat Completions 地址直接当作 Anthropic 地址。

## 4. 添加自定义 Provider

1. 打开 `Settings → Providers`；
2. 点击 `+`；
3. 选择预设或创建 Custom Provider；
4. 根据服务端协议选择 OpenAI-compatible 或 Anthropic-compatible；
5. 填写名称、API Key 和 Endpoint；
6. 保存后进入模型配置。

如果界面提供独立的 Endpoint 类型，优先选择与服务端文档完全一致的协议。名称只用于本地识别，不影响请求。

## 5. 获取或手动添加模型

官方文档给出两种方式：

### 从 API 获取

如果服务实现了 `/models`，点击获取模型。获取成功后仍应核对 Model ID，而不是只看显示名称。

### 手动添加

模型列表为空时，手动填写：

- Model ID：服务端实际标识；
- Display Name：本地显示名称；
- Context Length：按真实规格填写；
- Image / Audio / Video：仅在服务与模型都支持时启用；
- Reasoning：仅在接口能处理对应参数时启用。

能力开关不会让普通文本模型自动获得多模态或工具能力。填错上下文长度还可能导致请求超限。

## 6. Base URL 规则

典型 OpenAI-compatible 关系：

```text
Base URL:      https://your-api.example.com/v1
Models:       https://your-api.example.com/v1/models
Chat:         https://your-api.example.com/v1/chat/completions
```

除非输入框明确要求完整 Endpoint，否则不要填写 `/chat/completions`。出现 404 时检查：

- `/v1` 是否缺失或重复；
- 是否误填控制台网页地址；
- 是否选错 OpenAI / Anthropic 协议；
- URL 是否带空格、中文标点或多余斜杠。

## 7. 最小验证

1. 新建对话；
2. 选择刚添加的模型；
3. 关闭联网搜索、附件、MCP 和高级推理；
4. 发送：

```text
只回复：连接正常
```

确认能开始输出、正常结束，并且没有 401、404、429。然后重启 ChatWise，确认 Provider 和模型仍存在。

## 8. 文档、图片与工具调用

ChatWise 可以声明图片、音视频等模型能力，但自定义服务是否兼容需要逐项验证。处理 PDF 时，模型不原生支持 PDF 的情况下，客户端可能先提取文字再发送；这和原生文件输入不是同一条链路。

MCP 工具还会执行本地命令或访问外部服务。首次添加工具时：

- 使用绝对命令路径解决 `command not found`；
- 仔细检查 MCP 的命令、参数和环境变量；
- 不给未知 MCP 传递主 API Key；
- 先用只读工具测试，再开放写文件和命令执行。

## 9. 常见问题

| 现象 | 处理方法 |
|---|---|
| 无法获取模型 | 服务可能未实现 `/models`；手动填写准确 Model ID |
| 401 | 重新复制 Key，确认没有空格，检查协议对应的认证方式 |
| 404 | 检查 `/v1` 拼接和 Provider 类型，不要填完整聊天端点 |
| 400 unknown field | 关闭推理、多模态、工具和额外参数后重试 |
| 一直等待 | 关闭流式输出交叉测试，检查服务是否返回标准 SSE |
| 工具不执行 | 模型或服务不支持 tool calling；先验证普通聊天 |
| 429 | 降低并发和上下文长度，在服务端检查额度与速率限制 |

## 10. 数据、备份与安全

- 为桌面客户端创建独立、可撤销的 Key；
- 不在截图、导出文件和 Issue 中展示完整 Key；
- 上传文档前确认其中没有客户资料、密码和私人信息；
- 公共电脑使用后删除 Provider 和本地会话；
- macOS 数据通常位于 `$HOME/Library/Application Support/app.chatwise`；
- Windows 数据通常位于 `%APPDATA%\app.chatwise`。

升级或迁移前使用 ChatWise 的备份与导出功能。复制应用数据目录前先退出应用，避免数据库正在写入。

## 11. 官方资料

- [ChatWise Getting Started](https://docs.chatwise.app/)
- [ChatWise Custom Provider](https://docs.chatwise.app/custom-provider)
- [ChatWise Documents](https://docs.chatwise.app/documents)
- [ChatWise Tools / MCP](https://docs.chatwise.app/tools)
- [ChatWise Backup and Export](https://docs.chatwise.app/backup-and-export)
- [ChatWise 官网](https://chatwise.app/)

---

求助时请提供 ChatWise 版本、操作系统、Provider 类型、脱敏 Endpoint、Model ID 和错误状态码，不要发送完整 API Key。
