# Claude Code 接入 Anthropic 兼容 API：跨平台完整配置教程

> 最后核验：2026-07-14
>
> 适用范围：Claude Code 当前稳定版；macOS 13+、Windows 10 1809+、主流 Linux
>
> 接口要求：服务端必须兼容 Anthropic Messages API

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先弄清楚：Claude Code 不是聊天客户端

Claude Code 是在终端中运行的编程代理。它可以读取和修改项目文件、运行命令、执行测试，因此比普通聊天窗口拥有更高权限。

本教程介绍如何用自定义 API Key 和 `ANTHROPIC_BASE_URL` 连接 Anthropic 兼容接口。配置前请确认服务商明确支持 Claude Code。只有 OpenAI `/chat/completions` 兼容并不等于能运行 Claude Code。

完整兼容至少应满足：

- 提供可流式响应的 `POST /v1/messages`；
- 能接收并正确处理 Claude Code 使用的工具、思考等请求字段；
- 正确处理 `anthropic-version` 与持续变化的 `anthropic-beta` 能力请求头；
- 最好提供 `/v1/messages/count_tokens`，缺少时 Claude Code 会在本地估算上下文用量；
- 新版 Claude Code 增加能力时，网关也需要同步保持兼容。

因此“普通 Claude 对话能回复”只是基础验证，不代表工具调用、长会话和后台功能全部兼容。

## 2. 准备清单

- 有效的 API Key；
- Anthropic 兼容 Base URL；
- Claude Code 可用的模型 ID；
- Git；
- 一个用于测试的本地项目目录。

可以在[纽智中转站](https://www.nexotoken.net/?ref=github)创建 Key，并在模型列表确认 Claude Code 可用模型。Base URL 与模型 ID 都应从控制台复制。

## 3. 安装 Claude Code

以下地址来自 Claude Code 官方安装说明。高安全环境建议先把脚本下载到本地，检查域名、内容与签名/校验信息后再执行，不要对来源不明的安装命令使用管道执行。

### macOS、Linux 或 WSL

官方推荐原生安装器：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Windows CMD

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### macOS Homebrew

```bash
brew install --cask claude-code
```

### Windows WinGet

```powershell
winget install Anthropic.ClaudeCode
```

原生安装会自动更新；Homebrew 和 WinGet 需要定期手动升级。Windows 原生环境建议安装 Git for Windows；使用 Linux 工具链的用户可选择 WSL 2。

## 4. 验证安装

```bash
claude --version
claude doctor
```

如果提示找不到命令，关闭并重新打开终端。原生安装器通常把程序放到：

- macOS/Linux：`~/.local/bin/claude`
- Windows：`%USERPROFILE%\.local\bin\claude.exe`

## 5. 临时配置：推荐先用它测试

临时环境变量只对当前终端窗口生效，最适合第一次测试。

### macOS / Linux / WSL

```bash
export ANTHROPIC_BASE_URL="从控制台复制的BaseURL"
export ANTHROPIC_API_KEY="你的APIKey"
export ANTHROPIC_MODEL="从模型列表复制的模型ID"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="从模型列表复制的后台任务模型ID"
```

### Windows PowerShell

```powershell
$env:ANTHROPIC_BASE_URL = "从控制台复制的BaseURL"
$env:ANTHROPIC_API_KEY = "你的APIKey"
$env:ANTHROPIC_MODEL = "从模型列表复制的模型ID"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "从模型列表复制的后台任务模型ID"
```

### Windows CMD

```bat
set ANTHROPIC_BASE_URL=从控制台复制的BaseURL
set ANTHROPIC_API_KEY=你的APIKey
set ANTHROPIC_MODEL=从模型列表复制的模型ID
set ANTHROPIC_DEFAULT_HAIKU_MODEL=从模型列表复制的后台任务模型ID
```

`ANTHROPIC_API_KEY` 会以 `X-Api-Key` 请求头发送。不要在不确定的情况下改用 `ANTHROPIC_AUTH_TOKEN`，后者使用 Bearer 认证，服务端未必兼容。

## 6. Base URL 到底要不要带 `/v1`

Claude Code 会访问 Anthropic Messages API。不同网关对 Base URL 的定义可能不同：有的要求填域名根路径，有的要求保留额外前缀。

唯一可靠的判断方式是使用服务商专门给出的“Claude Code Base URL”。不要从 OpenAI 客户端教程中复制地址，也不要手工把 `/v1/messages` 填进 `ANTHROPIC_BASE_URL`。

## 7. 启动第一次任务

进入一个测试项目：

```bash
cd /你的项目目录
claude
```

首次建议只让它读取，不要立刻修改：

```text
请只读取当前项目并说明它使用的技术栈，不要修改任何文件，也不要执行安装命令。
```

进入后运行：

```text
/status
```

检查当前模型和认证方式是否符合预期。环境变量 API Key 的优先级高于已登录的 Claude 订阅；如果两者同时存在，Claude Code 会提示确认。

## 8. 永久配置到 settings.json

测试成功后，可以写入用户级配置：

- macOS/Linux/WSL：`~/.claude/settings.json`
- Windows：`%USERPROFILE%\.claude\settings.json`

示例：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {
    "ANTHROPIC_BASE_URL": "从控制台复制的BaseURL",
    "ANTHROPIC_API_KEY": "你的APIKey",
    "ANTHROPIC_MODEL": "从模型列表复制的模型ID",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "从模型列表复制的后台任务模型ID"
  }
}
```

如果文件已有其他配置，只合并 `env` 字段，不要整份覆盖。JSON 不允许注释、尾随逗号或重复键。

在 macOS/Linux 上限制文件权限：

```bash
chmod 600 ~/.claude/settings.json
```

> 更安全的做法是只把 Base URL 和模型写进配置，Key 放在系统密钥管理工具或启动脚本中。不要把含 Key 的用户配置复制到项目目录，更不要提交到 Git。

`ANTHROPIC_MODEL` 控制主会话模型，`ANTHROPIC_DEFAULT_HAIKU_MODEL` 控制 `haiku` 别名和部分后台功能。如果服务商只提供一款 Claude Code 兼容模型,两个变量可以先填写同一个可用模型 ID。若还会在 `/model` 中使用 `sonnet` 或 `opus` 别名,应分别配置 `ANTHROPIC_DEFAULT_SONNET_MODEL` 和 `ANTHROPIC_DEFAULT_OPUS_MODEL`,并确保这些 ID 确实在当前 Key 权限内。

## 9. 自定义模型出现在模型选择器中

如果服务商使用非标准模型 ID，可设置：

```json
{
  "env": {
    "ANTHROPIC_CUSTOM_MODEL_OPTION": "准确的模型ID",
    "ANTHROPIC_CUSTOM_MODEL_OPTION_NAME": "自定义显示名称"
  }
}
```

也可以直接设置 `ANTHROPIC_MODEL` 作为默认模型。运行中的会话可通过 `/model` 检查或切换。

## 10. 给项目增加安全边界

Claude Code 能运行命令和读取文件。建议在项目的 `.claude/settings.json` 中拒绝读取敏感文件：

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)"
    ]
  }
}
```

项目配置可以提交，但里面不能放 API Key。个人 Key 只放用户级配置或环境变量。

## 11. 常用命令

| 命令 | 用途 |
|---|---|
| `claude` | 在当前目录启动交互会话 |
| `claude --version` | 查看版本 |
| `claude doctor` | 检查安装与配置 |
| `/status` | 查看当前会话状态 |
| `/model` | 查看或切换模型 |
| `/permissions` | 调整当前会话权限 |
| `/clear` | 清空当前上下文 |

高风险命令执行前应仔细阅读。不要为了省一次确认就长期开放不受限制的文件系统和命令权限。

## 12. 常见错误

### 401 / Invalid API Key

- Key 未完整复制；
- 使用了错误认证变量；
- 终端仍保留旧 Key；
- 用户配置中的 Key 覆盖了当前预期配置。

macOS/Linux 检查变量是否存在时，不要把完整值截图：

```bash
test -n "$ANTHROPIC_API_KEY" && echo "Key 已设置" || echo "Key 未设置"
```

### 404 / Not Found

通常是 Base URL 不符合 Claude Code 接入说明，或服务端不支持 `/v1/messages`。不要用 OpenAI Chat Completions 地址代替。

### 400 / beta header / unsupported field

Claude Code 会使用工具调用、流式输出和部分扩展字段。普通聊天可用不代表 Claude Code 全兼容。先：

1. 更新 Claude Code；
2. 使用服务商明确标注支持 Claude Code 的模型；
3. 新建短会话重试；
4. 保留错误请求 ID，联系服务商核查协议兼容性。

### 403 / 模型无权限

确认 API Key 分组和模型分组匹配，并确认账户余额或免费额度适用于该模型。

### 启动后仍要求登录

关闭当前会话，确认环境变量已在同一个终端设置，再运行 `claude`。如果使用 settings.json，检查 JSON 是否有效以及文件路径是否正确。

### `command not found: claude`

重开终端并检查 `~/.local/bin` 是否在 PATH 中。Windows 可运行：

```powershell
where.exe claude
```

macOS/Linux 可运行：

```bash
which -a claude
```

### 请求很慢或中途超时

Claude Code 的任务通常比普通聊天耗时更长。不要设置过短超时。先用小项目、短任务验证，再排查网络、模型负载和上下文长度。

## 13. 取消自定义 API 配置

临时变量可在 macOS/Linux 中清除：

```bash
unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL
```

PowerShell：

```powershell
Remove-Item Env:ANTHROPIC_BASE_URL
Remove-Item Env:ANTHROPIC_API_KEY
Remove-Item Env:ANTHROPIC_MODEL
Remove-Item Env:ANTHROPIC_DEFAULT_HAIKU_MODEL
```

如果写进 settings.json，则删除对应 `env` 项。清除后运行 `/status` 确认当前认证方式，避免误以为正在使用订阅，实际仍由 API Key 计费。

## 14. 官方资料

- [Claude Code 官方安装文档](https://code.claude.com/docs/en/installation)
- [Claude Code 环境变量参考](https://code.claude.com/docs/en/env-vars)
- [Claude Code 设置参考](https://code.claude.com/docs/en/settings)
- [Claude Code 网关协议参考](https://code.claude.com/docs/en/llm-gateway-protocol)
- [Claude Code 模型配置](https://code.claude.com/docs/en/model-config)
- [Claude Code 官方 GitHub](https://github.com/anthropics/claude-code)

---

排查时可以公开错误码和请求 ID，但不要公开 Key、完整用户配置、私有仓库代码或服务端返回的敏感信息。
