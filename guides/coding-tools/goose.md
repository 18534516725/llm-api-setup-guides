# goose 本地通用编程智能体自定义 API 接入教程

> 最后核验：2026-07-14
>
> 项目状态：仍在维护；官方仓库已从原组织迁移至 Linux Foundation 旗下 AAIF 的 `aaif-goose/goose`

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. goose 与兼容要求

goose 是本地运行的通用 Agent，提供 Desktop、CLI 和 API，并通过内置 Developer 工具与 MCP 执行文件、命令和外部操作。

本文使用官方 Custom Provider，支持 OpenAI Compatible、Anthropic Compatible 和 Ollama Compatible。OpenAI 路径需要兼容 Chat Completions，并且用于 Agent 时模型必须支持工具调用。

```text
POST /v1/chat/completions
流式响应
tools / tool_calls / tool 结果消息
```

只支持普通文本或仅支持 Responses 的端点不能直接按本文的 OpenAI Compatible 配置工作。

## 2. 安装

官方 README 当前仍展示 `stable` 地址，但该标签的脚本资产可能暂时失效。使用 GitHub Releases 的 `latest` 入口获取当前最新正式版本：

```bash
curl -fsSL https://github.com/aaif-goose/goose/releases/latest/download/download_cli.sh | bash
goose --version
```

Desktop 请从官方站点或官方 GitHub Releases 下载对应平台包。高安全环境应先把脚本下载到本地审阅，或手动下载当前 Release 资产并核对其 SHA-256 与来源。

## 3. 最简单的内置 OpenAI Provider 路径

goose 内置 OpenAI provider 支持通过 `OPENAI_HOST` 指向自定义兼容端点：

```bash
export OPENAI_API_KEY="你的APIKey"
export OPENAI_HOST="https://你的接口域名"
export GOOSE_PROVIDER="openai"
export GOOSE_MODEL="你的模型ID"
goose session start
```

`OPENAI_HOST` 的路径拼接随端点与 goose 版本而异。官方当前实现会构造 Chat Completions URL；若控制台提供的是 Base URL，请优先使用下一节的 Custom Provider，它能明确写完整请求 URL，减少路径歧义。

## 4. CLI 交互式 Custom Provider

运行：

```bash
goose configure
```

依次选择：

1. `Custom Providers`；
2. `Add A Custom Provider`；
3. API Type 选 `OpenAI Compatible`；
4. Name 填 `custom_api`；
5. API URL 填实际端点；
6. 选择是否需要认证并输入 Key；
7. 填写可用模型 ID；
8. 按服务端能力选择 Streaming；
9. 仅在确有要求时添加自定义 headers。

Key 会优先安全存储在系统 keychain；若 keyring 不可用，官方实现可能使用本地 secrets 文件，应保护其权限。

## 5. 声明式 JSON 配置

Custom Provider 目录：

- macOS/Linux：`~/.config/goose/custom_providers/`
- Windows：`%APPDATA%\Block\goose\config\custom_providers\`

创建 `custom_api.json`：

```json
{
  "name": "custom_api",
  "engine": "openai",
  "display_name": "自定义兼容接口",
  "description": "OpenAI-compatible Chat Completions",
  "api_key_env": "CUSTOM_API_KEY",
  "base_url": "https://你的接口域名/v1/chat/completions",
  "models": [
    {
      "name": "你的模型ID",
      "context_limit": 128000
    }
  ],
  "headers": {},
  "supports_streaming": true,
  "requires_auth": true
}
```

这里是五篇教程中最容易混淆的差异：**goose 声明式 Custom Provider 官方示例的 `base_url` 是完整 Chat Completions URL**，包括 `/v1/chat/completions`；不要照搬其他工具只到 `/v1` 的写法。

设置 Key 并启动：

```bash
export CUSTOM_API_KEY="你的APIKey"
goose session start --provider custom_api
```

在配置流程中选择 `你的模型ID`，或按当前 CLI 提示设置模型。真实 Key 不应写进 JSON。

## 6. 模型元数据

Custom Provider 的每个模型至少填写：

- `name`：实际 API 模型 ID；
- `context_limit`：真实上下文窗口；
- `supports_streaming`：Provider 是否支持流式；
- `requires_auth`：端点是否需要认证；
- `headers`：仅填写服务端明确要求的非秘密或通过安全方式注入的头。

上下文填大不会提升能力。服务端若没有 `/models` 或模型探测失败，静态列表仍可使用，但模型 ID 必须准确。

## 7. 工具调用与 Agent 限制

goose 官方文档明确指出其使用 tool calling，并列出部分不支持工具调用的模型不能使用。自定义端点必须保留：工具 schema、tool call ID、流式参数拼接、tool role 回传以及多轮顺序。

只验证“你好”远远不够。工具不兼容时常见：首轮文本成功，读文件后 400；参数为空；tool call ID 丢失；模型不断重复同一调用。

MCP 扩展还会引入外部网络、凭据和写操作。先只启用 Developer 的最小只读能力，验证后再逐个增加扩展。

## 8. 审批与安全

goose 的工具可直接在本机执行。不同界面和版本的审批呈现可能不同，因此不要把“出现确认框”当成唯一安全边界：

- 第一次在临时 Git 仓库使用；
- 只启用任务必需扩展；
- 审查每个命令、路径与 MCP 参数；
- 不给生产云凭据、数据库写权限或广泛主目录访问；
- 不自动批准删除、部署、支付、发送消息和 `git push`；
- 对不可信仓库使用容器、虚拟机或低权限账户隔离。

模型的工具能力与本地权限是两层：模型能提出调用，不代表该调用应该被批准。

## 9. 最小验证

```bash
mkdir goose-api-test && cd goose-api-test
git init
printf '# goose Test\n' > README.md
goose session start --provider custom_api
```

先输入：

```text
只读取 README.md 并复述标题，不要修改，不要运行其他命令。
```

再输入：

```text
在 README.md 末尾增加“连接验证成功”，展示变更，不要提交。
```

最后请求执行 `git status --short`。通过标准是：流式回复正常、read/write/shell 工具能完成多轮、只改目标文件、没有无审批的高风险动作。

## 10. 常见错误

| 现象 | 排查 |
|---|---|
| 404 | 声明式 `base_url` 是否缺少或重复 `/v1/chat/completions` |
| 401 | `api_key_env` 与当前终端变量名不一致，或 keychain 中是旧 Key |
| 模型列表为空 | 手动在 `models` 中填写准确 ID；检查模型发现端点 |
| 首轮成功、工具后 400 | tool calls/tool results 协议不完整 |
| 流式卡住 | `supports_streaming` 与服务端能力不符；先关闭流式复测 |
| 上下文过早失败 | 修正 `context_limit`，新建短会话复测 |
| 自定义 header 无效 | CLI 对不同协议的 header 支持有差异；编辑 JSON 并按官方字段配置 |

## 11. 更新、回滚与卸载

CLI 官方更新命令：

```bash
goose update
```

也可从官方 Releases 下载指定历史版本资产进行回滚。回滚前记录版本、备份配置与自定义 Provider JSON；配置格式可能随版本变化。

卸载方式取决于安装来源：包管理器安装用对应 remove/uninstall；脚本安装先用 `command -v goose` 确认二进制位置，再按官方安装说明/安装器移除。不要直接递归删除配置目录；先备份会话与配置。最后删除不再使用的 custom provider、环境变量和 keychain 凭据，并撤销 Key。

## 12. 官方来源

- [goose 官方 GitHub（当前仓库）](https://github.com/aaif-goose/goose)
- [官方安装文档源码](https://github.com/aaif-goose/goose/blob/main/documentation/docs/getting-started/installation.md)
- [Provider 与 Custom Provider 官方文档源码](https://github.com/aaif-goose/goose/blob/main/documentation/docs/getting-started/providers.md)
- [官方 Releases](https://github.com/aaif-goose/goose/releases)
- [环境变量官方文档源码](https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/environment-variables.md)
