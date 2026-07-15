# Zed 编辑器原生编程智能体自定义 API 接入教程

> 最后核验：2026-07-14
>
> 适用范围：当前 Zed 原生 Agent 的 LLM Provider；不适用于外部 Agent 自己的认证配置

[← 返回教程目录](../../README.md)

> [!TIP]
> **需要测试 Zed 的自定义 API？**
>
> [NexoToken](https://www.nexotoken.net/?ref=github) 每天提供 20 次免费额度，新人 1 元可得 300 积分，支持支付宝、微信直充。活动、模型、额度与计费规则以官网为准。请从控制台复制准确 Base URL、协议和模型 ID。

## 1. 先分清 Zed Agent 与外部 Agent

本文配置的是 Zed 原生 Agent、Inline Assistant、提交信息生成和线程摘要等 Zed 自有 AI 功能。

如果你在 Zed 中启动的是 External Agent 或 Terminal Thread，认证和 Base URL 通常由外部 CLI 自己管理，修改 Zed 的 `language_models` 不会自动改变它们。

## 2. 安装

macOS：从官网下载安装，或：

```bash
brew install --cask zed
```

Linux 官方脚本：

```bash
curl -f https://zed.dev/install.sh | sh
```

Windows 可使用官网下载器或：

```powershell
winget install -e --id ZedIndustries.Zed
```

启动后在命令面板执行 `zed: about` 查看版本。

## 3. 图形界面添加 Provider

1. 打开命令面板，执行 `agent: open settings`；
2. 进入 LLM Providers；
3. 点击 `Add Provider`；
4. 选择 OpenAI-compatible；
5. 填写 Provider 名称、API URL、模型 ID 和上下文窗口；
6. 在 UI 输入 API Key。

Zed 把 UI 输入的 Key 存在系统钥匙串，而不是 `settings.json`。自定义 Provider ID `my-gateway` 对应环境变量 `MY_GATEWAY_API_KEY`；非空环境变量优先于钥匙串，并且必须重启 Zed 才会重新读取。

## 4. settings.json 配置

通过命令面板打开 Zed settings 文件，加入：

```json
{
  "language_models": {
    "openai_compatible": {
      "my-gateway": {
        "api_url": "https://你的接口域名/v1",
        "available_models": [
          {
            "name": "你的模型ID",
            "display_name": "你的模型显示名",
            "max_tokens": 128000,
            "max_output_tokens": 8192,
            "capabilities": {
              "tools": true,
              "images": false,
              "parallel_tool_calls": false,
              "prompt_cache_key": false,
              "chat_completions": true,
              "interleaved_reasoning": false,
              "max_tokens_parameter": false
            }
          }
        ]
      }
    }
  }
}
```

不要把 Key 写入此文件。设置环境变量的示例：

```bash
export MY_GATEWAY_API_KEY="你的APIKey"
```

macOS 从 Dock 启动的 Zed 不一定继承终端临时环境；最稳妥方式是通过 LLM Providers UI 存入系统钥匙串。

## 5. Chat Completions 与 Responses 切换

OpenAI-compatible 模型默认 `chat_completions: true`，Zed 使用 Chat Completions。若端点只支持 Responses，改为：

```jsonc
"capabilities": {
  "tools": true,
  "images": false,
  "parallel_tool_calls": false,
  "prompt_cache_key": false,
  "chat_completions": false,
  "interleaved_reasoning": false,
  "max_tokens_parameter": false
}
```

这会让该模型使用 Responses endpoint。不要同时靠修改 Base URL 资源路径来“强制切换”；协议由 capability 决定。

推理模型可添加服务端真实支持的 `reasoning_effort`。合法值包括 `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`，但不能因为 Zed接受字段就假定接口接受所有档位。

## 6. 模型元数据与能力

- `max_tokens`：上下文窗口，必填；
- `max_output_tokens`：最大输出，建议填真实值；
- `tools`：是否能进行 Agent 工具调用；
- `images`：是否接受图片；
- `parallel_tool_calls`：是否支持并行工具；
- `chat_completions`：true 走 Chat Completions，false 走 Responses；
- `interleaved_reasoning`：Chat Completions 是否使用独立 reasoning_content；
- `max_tokens_parameter`：服务端是否接受相应 token 参数。

能力声明必须与端点一致。默认值并不保证你的兼容服务完整实现。

## 7. 工具调用与 Agent 限制

Zed Agent 可读写文件、运行终端、搜索、使用 MCP 和展示 review diff。模型与服务端必须完整支持流式工具调用和工具结果回传。

若模型只聊天，将 `tools` 设为 false 并使用 Ask/Minimal profile；强行设 true 可能导致空 tool calls、重复循环或 400。Agent Profiles 决定工具是否可用，Tool Permissions 决定可用工具是否需要确认；两者不是同一个开关。

## 8. 审批与安全

Zed v0.224.0+ 使用 `agent.tool_permissions`。推荐保守配置：

```json
{
  "agent": {
    "tool_permissions": {
      "default": "confirm",
      "tools": {
        "terminal": {
          "default": "confirm",
          "always_allow": [
            { "pattern": "^git\\s+(status|diff|log)" }
          ],
          "always_confirm": [
            { "pattern": "git\\s+push" },
            { "pattern": "sudo\\s" }
          ]
        },
        "edit_file": { "default": "confirm" },
        "delete_path": { "default": "confirm" }
      }
    }
  }
}
```

规则使用 Rust regex，优先级是内置保护、always_deny、always_confirm、always_allow、工具默认、全局默认。全局 allow 并非沙箱；首次测试不要开启。

## 9. 最小验证

打开一个临时 Git 仓库，选择刚添加的模型和 Ask profile，输入：

```text
只读取 README.md 并概括，不要编辑，不要运行命令。
```

确认文本请求成功后切换 Write profile：

```text
在 README.md 末尾增加“连接验证成功”，展示 review diff，不要提交。
```

最后让它运行 `git status --short`，确认终端审批出现。检查 Zed review 和外部 `git diff` 都只有目标修改。

## 10. 常见错误

| 现象 | 处理 |
|---|---|
| 401 | 环境变量覆盖了钥匙串旧 Key；unset 后重启 Zed，或更新变量 |
| 404 | `api_url` 或 `chat_completions` 协议选择错误 |
| 400 reasoning/tool 字段 | 关闭未确认能力，按服务端支持逐项开启 |
| 模型能答但不改文件 | `tools` 能力不实，或当前 Profile 禁用了编辑工具 |
| 没有审批 | 检查 `agent.tool_permissions.default`，以及版本是否低于 0.224.0 |
| SSH 项目 Key 不生效 | Zed Provider 在本地进程初始化；环境变量来自本地 Zed 进程 |
| JSON 设置失效 | 检查逗号、层级，并确认没有重复覆盖 `language_models` |

## 11. 更新、回滚与卸载

Zed 默认后台检查更新并在重启后应用。Homebrew/winget 安装则用对应包管理器更新。关闭自动更新可在 Settings Editor 修改 Auto Update。

Linux 官方脚本安装可指定官方版本回滚：

```bash
curl -f https://zed.dev/install.sh | ZED_VERSION=你的目标版本 sh
```

Linux 脚本安装卸载：

```bash
zed --uninstall
```

macOS/Windows 按安装来源卸载。卸载程序前备份 settings，卸载后从系统钥匙串移除不再使用的 Key，并在服务端撤销 Key。

## 12. 官方来源

- [Zed 安装](https://zed.dev/docs/installation)
- [Zed 更新](https://zed.dev/docs/update)
- [Use API Access：自定义兼容端点](https://zed.dev/docs/ai/use-api-access)
- [Zed Agent](https://zed.dev/docs/ai/zed-agent)
- [Agent Profiles](https://zed.dev/docs/ai/agent-profiles)
- [Tool Permissions](https://zed.dev/docs/ai/tool-permissions)
- [Zed 官方 GitHub](https://github.com/zed-industries/zed)
