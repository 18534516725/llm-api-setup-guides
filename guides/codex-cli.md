# OpenAI Codex CLI 接入兼容 API：Responses 协议完整教程

> 最后核验：2026-07-14
>
> 适用范围：当前版本 Codex CLI
>
> 关键前提：自定义提供方必须支持 OpenAI Responses API

[← 返回教程目录](../README.md)

> [!TIP]
> **想直接测试 Codex CLI，又不想准备外币卡？**
>
> **[纽智中转站](https://www.nexotoken.net/?ref=github)** 提供 Codex / Responses 兼容模型，每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。注册后创建 Key，再按本文配置 `model_providers` 即可。
>
> **[👉 立即注册并测试 Codex CLI](https://www.nexotoken.net/?ref=github)**

## 1. Codex CLI 是什么

Codex CLI 是在终端中工作的编程代理，可以检查代码、修改文件、运行命令、执行测试和做代码审查。

这篇教程使用 Codex 官方的 `model_providers` 配置连接自定义 API。不要照搬只修改 `OPENAI_BASE_URL` 的旧教程；当前官方配置支持为每个提供方分别指定 Base URL、Key 环境变量和协议。

## 2. 接口兼容性必须先确认

Codex 自定义提供方当前使用 `responses` 协议。服务商至少需要正确实现：

```text
POST /v1/responses
```

只支持 `/v1/chat/completions` 的接口不能直接用于本教程。即使普通聊天客户端可用，也不代表 Codex 的工具调用、流式事件和 Responses 输入输出格式完整兼容。

可以在[纽智中转站](https://www.nexotoken.net/?ref=github)创建 API Key，并选择明确标注支持 Codex/Responses 的模型。

## 3. 安装 Codex CLI

### macOS / Linux 官方安装器

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

### npm

先安装当前 LTS 版 Node.js，然后执行：

```bash
npm install -g @openai/codex
```

### Homebrew

```bash
brew install --cask codex
```

### Windows

在 PowerShell 中运行官方安装器：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

Codex 可在 Windows 原生使用。依赖 Linux 工具链的项目通常更适合在 WSL 2 内安装并运行。安装后重新打开终端。

## 4. 验证安装

```bash
codex --version
codex --help
```

如果找不到命令：

- npm 安装：检查 npm 全局 bin 目录是否在 PATH；
- 官方安装器：重新打开终端；
- Windows：确认是在安装时使用的同一环境中运行，避免把 WSL 和 PowerShell 混用。

## 5. 设置 API Key 环境变量

本教程把 Key 放在自定义变量 `NEXO_API_KEY` 中。变量名可以自定义，但必须与后面 `env_key` 完全一致。

### macOS / Linux / WSL

```bash
export NEXO_API_KEY="你的APIKey"
```

### Windows PowerShell

```powershell
$env:NEXO_API_KEY = "你的APIKey"
```

### Windows CMD

```bat
set NEXO_API_KEY=你的APIKey
```

第一次先使用临时变量。确认配置成功后，再决定是否写入 shell 配置或系统凭据管理工具。

## 6. 创建 Codex 配置文件

用户级配置路径：

- macOS/Linux/WSL：`~/.codex/config.toml`
- Windows：`%USERPROFILE%\.codex\config.toml`

写入以下内容，并替换三处示例值：

```toml
model = "从模型列表复制的模型ID"
model_provider = "nexotoken"
model_reasoning_effort = "medium"

[model_providers.nexotoken]
name = "NexoToken"
base_url = "从控制台复制的ResponsesBaseURL"
env_key = "NEXO_API_KEY"
wire_api = "responses"
```

配置说明：

| 字段 | 含义 |
|---|---|
| `model` | 实际发送给接口的模型 ID |
| `model_provider` | 选择下面定义的提供方 ID |
| `base_url` | Responses API 的 Base URL，通常以 `/v1` 结尾，以控制台说明为准 |
| `env_key` | Codex 从哪个环境变量读取 Key |
| `wire_api` | 当前自定义提供方只支持 `responses` |

`openai`、`ollama`、`lmstudio` 是 Codex 内置提供方 ID，不要拿它们作为自定义表名覆盖。这里使用独立 ID `nexotoken`。

## 7. TOML 常见语法错误

正确：

```toml
model = "模型ID"

[model_providers.nexotoken]
base_url = "https://示例地址/v1"
```

容易出错的情况：

- 使用中文引号；
- 同一字段写两次；
- 把 `[model_providers.nexotoken]` 写成 JSON 花括号；
- Base URL 后误加 `/responses`；
- `model_provider` 的值与表名不一致；
- 把真实 Key 直接写入 `config.toml`。

官方不建议把 bearer token 明文写进配置，应使用 `env_key`。

## 8. 启动第一个会话

进入一个 Git 项目：

```bash
cd /你的项目目录
codex
```

第一次建议使用只读任务：

```text
请只分析这个项目的目录结构和启动方式，不要修改文件，不要安装依赖。
```

进入会话后运行：

```text
/status
```

检查：

- Provider 是否为 `nexotoken`；
- Model 是否为你配置的模型 ID；
- 当前目录是否正确；
- 权限和沙箱是否符合预期。

## 9. 首次写入测试

不要直接在重要仓库做第一次写入。可以创建一个临时 Git 仓库：

```bash
mkdir codex-test
cd codex-test
git init
printf '# Codex Test\n' > README.md
git add README.md
git commit -m "chore: initial checkpoint"
codex
```

然后输入：

```text
在 README.md 末尾增加一行“配置验证成功”，完成后展示 diff，不要提交。
```

检查 diff 正确后再进入真实项目。

Windows PowerShell 如果没有 `printf`，可用以下命令创建测试文件：

```powershell
New-Item -ItemType Directory codex-test
Set-Location codex-test
git init
Set-Content -Path README.md -Value "# Codex Test"
git add README.md
git commit -m "chore: initial checkpoint"
codex
```

## 10. 权限与沙箱建议

用户级配置可使用较保守的默认值：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
```

- `workspace-write` 允许在工作区内修改，但限制工作区外写入；
- `on-request` 会在需要时请求确认；
- 不建议为了省确认步骤长期使用不受限制权限；
- 执行数据库、部署、删除文件和发布操作前必须人工复核。

## 11. 为项目添加 AGENTS.md

在仓库根目录运行 `/init` 可以生成 `AGENTS.md`。它适合记录：

- 项目启动与测试命令；
- 包管理器要求；
- 代码风格；
- 禁止修改的目录；
- 完成任务前必须执行的检查。

不要把 API Key、数据库密码或私人信息写进 `AGENTS.md`，因为它通常会提交到仓库。

## 12. 常用命令

| 命令 | 用途 |
|---|---|
| `codex` | 在当前目录启动 |
| `codex --version` | 查看版本 |
| `codex resume` | 恢复之前的会话 |
| `codex exec "任务"` | 非交互执行单个任务 |
| `/status` | 查看会话配置 |
| `/model` | 选择模型与推理强度 |
| `/permissions` | 查看或调整权限 |
| `/review` | 审查代码改动 |
| `/init` | 为项目生成 AGENTS.md |

自动化中使用 `codex exec` 前，先在交互模式验证模型、权限和输出。不要把可写权限的 Codex 暴露给不可信的公开输入。

## 13. 常见错误排查

### Missing environment variable / Key 未设置

`env_key` 写的是 `NEXO_API_KEY`，环境变量也必须同名。确认变量存在，但不要打印完整 Key：

```bash
test -n "$NEXO_API_KEY" && echo "Key 已设置" || echo "Key 未设置"
```

PowerShell：

```powershell
if ($env:NEXO_API_KEY) { "Key 已设置" } else { "Key 未设置" }
```

### 401 Unauthorized

- Key 复制不完整；
- Key 已失效；
- 打开了新终端但没有重新设置临时变量；
- `env_key` 拼写错误。

### 403 / 模型无权限

确认 Key 分组、模型分组和模型 ID 匹配，并检查余额或免费额度适用范围。

### 404 Not Found

- Base URL 是否以服务商要求的 `/v1` 结尾；
- 是否误写成完整 `/v1/responses`；
- 服务端是否真的提供 Responses API；
- 是否把网站控制台地址当成 API 地址。

### 400 / Unsupported parameter / Invalid event

这是协议兼容性问题的常见表现。Codex 需要 Responses 流式事件、工具调用及相关字段。更新 Codex 后，用明确支持 Codex 的模型重试；普通 Chat Completions 能用不能证明 Responses 完整兼容。

### 模型 ID 无效

复制准确模型 ID，区分大小写。显示名称、昵称和模型 ID 不是一回事。

### 请求中途断开

1. 使用短任务和小仓库重试；
2. 降低上下文规模；
3. 暂时关闭额外 MCP 工具；
4. 更新 Codex；
5. 保留请求 ID 和时间点，联系服务商排查。

## 14. 升级和回退配置

升级 Codex：

```bash
npm install -g @openai/codex@latest
```

Homebrew：

```bash
brew upgrade --cask codex
```

如果要恢复官方登录方式：

1. 从 `config.toml` 删除或注释自定义 `model_provider` 和对应表；
2. 清除自定义 Key 环境变量；
3. 运行 `codex login`；
4. 用 `codex login status` 和 `/status` 双重确认。

## 15. 官方资料

- [Codex CLI 官方文档](https://developers.openai.com/codex/cli/)
- [Codex 配置基础](https://developers.openai.com/codex/config-basic/)
- [Codex 配置参考](https://developers.openai.com/codex/config-reference/)
- [Codex 官方 GitHub](https://github.com/openai/codex)

---

求助时请提供 Codex 版本、操作系统、错误码、模型 ID、Base URL 是否含 `/v1` 和 `/status` 的非敏感部分。API Key 必须完全遮住。
