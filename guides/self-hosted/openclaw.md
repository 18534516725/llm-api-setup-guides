# OpenClaw 自托管助手与自定义模型 Provider 配置教程

> 最后核验：2026-07-24
>
> 适用范围：OpenClaw 当前稳定版；本机或服务器部署
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

> [!WARNING]
> OpenClaw 可以连接聊天渠道、执行命令、操作浏览器和调用外部工具。不要直接在生产账号、重要服务器或包含敏感文件的主目录中试跑。

## 1. OpenClaw 能做什么

OpenClaw 是可自托管的个人 AI 助手和 Agent 运行环境。它通过 Gateway 统一管理：

- 模型 Provider 与模型选择；
- Web Control UI；
- Telegram、Discord、Slack、WhatsApp 等消息渠道；
- 工作区、工具、浏览器、记忆与 Skills；
- 后台守护进程和定时任务。

OpenClaw 的“模型可连接”不等于“Agent 能完整工作”。工具调用、视觉、上下文、流式输出和模型协议都需要分别验证。

## 2. 安装

### macOS / Linux

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows PowerShell

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

完成后运行引导并安装守护进程：

```bash
openclaw onboard --install-daemon
```

向导会配置工作区、模型、Gateway 和可选渠道。第一次可以跳过不需要的聊天渠道，先在本机 Control UI 完成模型验证。

## 3. 检查 Gateway

```bash
openclaw gateway status
openclaw status
```

默认 Gateway 端口通常为 `18789`。打开控制台：

```bash
openclaw dashboard
```

如状态异常：

```bash
openclaw doctor
openclaw config validate
```

不要在配置无效时反复重启；先修复校验错误。

## 4. 优先使用交互配置

只配置模型：

```bash
openclaw configure --section model
```

完整配置：

```bash
openclaw configure
```

向导适合官方内置 Provider。配置完成后查看：

```bash
openclaw models list
openclaw models status
```

## 5. 添加 OpenAI-compatible 自定义 Provider

OpenClaw 在 `models.providers` 中定义自定义模型服务。先确认活动配置文件：

```bash
openclaw config file
```

建议使用 CLI 写配置，因为它会进行结构校验。下面创建一个名为 `example` 的 Provider：

```bash
# 交互运行时可先导出；守护进程请放入 ~/.openclaw/.env
export EXAMPLE_API_KEY="YOUR_API_KEY"

openclaw config set models.providers.example '{
  "baseUrl": "https://api.example.com/v1",
  "apiKey": {
    "source": "env",
    "provider": "default",
    "id": "EXAMPLE_API_KEY"
  },
  "api": "openai-completions",
  "models": [
    {
      "id": "YOUR_MODEL_ID",
      "name": "My OpenAI-compatible Model"
    }
  ]
}' --strict-json --merge
```

字段说明：

| 字段 | 含义 |
|---|---|
| `example` | 自定义 Provider ID；模型引用会使用这个前缀 |
| `baseUrl` | 服务文档给出的 API Base URL |
| `apiKey` | SecretRef 环境变量引用，不在配置中保存真实密钥 |
| `api` | 协议适配器；这里是 OpenAI Chat Completions |
| `models[].id` | 服务实际模型 ID |
| `models[].name` | 在界面中显示的名称 |

设置默认模型：

```bash
openclaw models set example/YOUR_MODEL_ID
```

模型引用必须包含 Provider：

```text
example/YOUR_MODEL_ID
```

如果启用了模型 allowlist，还需要把该引用加入允许列表：

```bash
openclaw config set agents.defaults.models '{
  "example/YOUR_MODEL_ID": {}
}' --strict-json --merge
```

## 6. 选择正确协议

OpenClaw 支持多种 Provider API 适配器。不能只改 Base URL 而忽略协议。

常见类型：

```text
openai-completions
openai-responses
anthropic-messages
```

选择规则：

- 服务提供 `/v1/chat/completions`：选择 OpenAI Completions/Chat 对应适配器；
- 服务提供 `/v1/responses`：选择 OpenAI Responses；
- 服务提供 Anthropic Messages 请求格式：选择 `anthropic-messages`；
- 端点只“部分兼容”时，以工具调用和流式测试结果为准。

Base URL 是否包含 `/v1` 由服务端路由决定。正确做法是先查看服务文档或用 curl 请求完整端点，再把端点拆成 Base URL 和协议，而不是随机增删路径。

## 7. 校验和探测

```bash
openclaw config validate
openclaw models list --provider example
openclaw models status
```

执行真实模型探测：

```bash
openclaw models status --probe --probe-provider example
```

`--probe` 会产生真实请求，可能消耗额度并触发限流。

Control UI 中先测试：

```text
只回复：OpenClaw 模型连接成功
```

然后测试工具调用：

```text
请读取当前工作区的文件名，不要修改任何内容。
```

最后在测试目录中做一次可审查写入。聊天正常但工具调用失败时，应检查模型工具能力、协议适配和 OpenClaw 权限，而不是只更换提示词。

## 8. 配置 Anthropic Messages Provider

服务明确实现 Anthropic Messages 时，结构示例：

```bash
export EXAMPLE_ANTHROPIC_KEY="YOUR_API_KEY"

openclaw config set models.providers.example-anthropic '{
  "baseUrl": "https://api.example.com",
  "apiKey": {
    "source": "env",
    "provider": "default",
    "id": "EXAMPLE_ANTHROPIC_KEY"
  },
  "api": "anthropic-messages",
  "models": [
    {
      "id": "YOUR_MODEL_ID",
      "name": "My Anthropic-compatible Model"
    }
  ]
}' --strict-json --merge
```

不要把 OpenAI Chat Completions 地址放进 `anthropic-messages`。

Gateway 作为 systemd/launchd 守护进程运行时通常不会继承当前 Shell 的临时变量。把 Key 放入权限受限的全局运行环境文件：

```text
~/.openclaw/.env
```

内容：

```dotenv
EXAMPLE_API_KEY=YOUR_API_KEY
EXAMPLE_ANTHROPIC_KEY=YOUR_API_KEY
```

不要把 Provider Key 只放在项目工作区的 `.env`；OpenClaw 会把工作区 `.env` 视为低信任来源，并忽略受保护的 Provider 凭据。

## 9. 聊天渠道

模型验证完成后再添加渠道：

```bash
openclaw channels add
openclaw channels list
openclaw channels status
```

每个平台都应使用官方 Bot 或应用机制，并遵守平台规则。聊天渠道上线前：

- 只允许自己的账号或白名单；
- 群聊默认不响应或仅在明确提及时响应；
- 管理命令仅限管理员；
- 禁止陌生用户触发终端、文件、浏览器和付费工具；
- 对消息和工具调用设置频率限制。

## 10. Gateway 安全

运行完整检查：

```bash
openclaw status --all
openclaw security audit
```

生产建议：

- Gateway 默认只在受信网络开放；
- 配置 Gateway 鉴权；
- 远程访问使用 VPN、Tailscale 或受控反向代理；
- 工作区指向专用目录，不是整个主目录；
- Agent 使用低权限系统用户；
- 容器或沙箱隔离高风险命令；
- 密钥使用环境变量或 SecretRef；
- 对写入、发送、删除和付款操作保留确认；
- 定期检查渠道会话和已安装插件。

## 11. 配置修改与恢复

读取配置：

```bash
openclaw config get agents.defaults.model --json
openclaw config get models.providers.example --json
```

修改后：

```bash
openclaw config validate
openclaw doctor
```

`config set` 对受保护对象默认避免破坏性覆盖。添加 Provider 或模型时使用 `--merge`；只有明确准备替换整个对象时才使用 `--replace`。

## 12. 常见问题

| 现象 | 排查方法 |
|---|---|
| Gateway 未启动 | `openclaw gateway status`、`openclaw doctor`、检查端口 |
| 配置被拒绝 | `openclaw config validate`，检查 JSON 和 Provider schema |
| 401 | 检查环境变量是否进入守护进程环境、Key 和认证方式 |
| 404 | 核对 `baseUrl` 与所选 `api` 适配器 |
| `Model is not allowed` | 将完整 `provider/model` 加入 `agents.defaults.models` |
| 模型列表有但无法用 | 运行 `openclaw models status --probe` 查看认证、限流和格式 |
| 对话正常、工具失败 | 检查模型工具能力、协议和工具权限 |
| CLI 改了模型但旧会话没变化 | 会话可能固定了模型；在会话中恢复默认模型或新建会话 |
| 渠道连接正常但不回复 | 检查白名单、触发规则、管理员和消息平台权限 |

## 13. 官方来源

- [OpenClaw Getting Started](https://docs.openclaw.ai/start/getting-started)
- [OpenClaw Model Providers](https://docs.openclaw.ai/concepts/model-providers)
- [OpenClaw Models](https://docs.openclaw.ai/concepts/models)
- [OpenClaw Config CLI](https://docs.openclaw.ai/cli/config)
- [OpenClaw Models CLI](https://docs.openclaw.ai/cli/models)
- [OpenClaw Security](https://docs.openclaw.ai/gateway/security)
