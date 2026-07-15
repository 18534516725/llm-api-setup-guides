# Crush 终端编程 Agent 接入自定义 OpenAI / Anthropic 兼容 API

> 最后核验：2026-07-15
>
> 适用范围：Charmbracelet Crush 当前版；自定义 `openai-compat` 或 `anthropic` Provider

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. Crush 的定位

Crush 是运行在终端中的开源编程 Agent，支持项目会话、模型切换、LSP、MCP 和文件/命令工具。官方明确允许通过 OpenAI-compatible 或 Anthropic-compatible API 添加自定义模型。

Agent 对协议完整度要求高于普通聊天：模型和服务端必须稳定处理工具定义、流式工具参数、多轮工具结果和较长上下文。只通过文本测试不能证明代码编辑可用。

## 2. 安装

选择一种官方方式：

```bash
# macOS / Linux Homebrew
brew install charmbracelet/tap/crush

# npm
npm install -g @charmland/crush

# Go
go install github.com/charmbracelet/crush@latest
```

Windows 可使用：

```powershell
winget install charmbracelet.crush
```

或 Scoop：

```powershell
scoop bucket add charm https://github.com/charmbracelet/scoop-bucket.git
scoop install crush
```

验证：

```bash
crush --help
crush --version
```

## 3. 配置文件优先级

Crush 从高到低读取：

1. 项目中的 `.crush.json`；
2. 项目中的 `crush.json`；
3. 用户级 `$HOME/.config/crush/crush.json`。

项目级文件可能被提交到 Git。建议把无密钥的模型定义放在项目中，把真实 Key 放到环境变量或用户级配置。

> [!WARNING]
> 官方提醒 `crush.json` 属于可信代码，其中的 `$(...)` 会在加载配置时以当前 shell 权限执行。不要在未审查配置的陌生仓库里直接启动 Crush。

## 4. 配置 OpenAI-compatible Provider

先设置环境变量：

```bash
export CUSTOM_API_KEY="YOUR_API_KEY"
```

在用户级或项目级配置写入：

```json
{
  "$schema": "https://charm.land/crush.json",
  "providers": {
    "custom-openai": {
      "name": "自定义 OpenAI 兼容接口",
      "type": "openai-compat",
      "base_url": "https://your-api.example.com/v1",
      "api_key": "$CUSTOM_API_KEY",
      "models": [
        {
          "id": "YOUR_MODEL_ID",
          "name": "YOUR_MODEL_ID",
          "context_window": 128000,
          "default_max_tokens": 8192,
          "can_reason": false,
          "supports_attachments": false
        }
      ]
    }
  }
}
```

`type` 的选择很关键：

- `openai`：面向 OpenAI 自身或明确以 OpenAI 行为为目标的路由；
- `openai-compat`：其他实现 OpenAI 兼容 API 的服务。

不要把 `type` 当显示名称。第三方兼容服务通常选 `openai-compat`。

## 5. 配置 Anthropic-compatible Provider

只有服务明确实现 Anthropic Messages 时使用：

```bash
export CUSTOM_ANTHROPIC_KEY="YOUR_API_KEY"
```

```json
{
  "$schema": "https://charm.land/crush.json",
  "providers": {
    "custom-anthropic": {
      "name": "自定义 Anthropic 兼容接口",
      "type": "anthropic",
      "base_url": "https://your-anthropic-api.example.com/v1",
      "api_key": "$CUSTOM_ANTHROPIC_KEY",
      "extra_headers": {
        "anthropic-version": "2023-06-01"
      },
      "models": [
        {
          "id": "YOUR_MODEL_ID",
          "name": "YOUR_MODEL_ID",
          "context_window": 200000,
          "default_max_tokens": 8192,
          "can_reason": true,
          "supports_attachments": false
        }
      ]
    }
  }
}
```

请求头和值应以服务端文档为准。OpenAI 兼容地址不能直接套用这段配置。

## 6. 模型元数据怎么填

- `id`：服务端真实 Model ID；
- `name`：本地显示名称；
- `context_window`：真实上下文上限；
- `default_max_tokens`：单次默认最大输出；
- `can_reason`：是否需要推理相关选项；
- `supports_attachments`：是否能处理附件。

元数据只影响客户端行为。填写更大的上下文不会提升模型能力，反而可能让 Crush 延迟压缩并触发服务端错误。

## 7. 首次启动与模型选择

在一个测试 Git 仓库中运行：

```bash
mkdir crush-api-test
cd crush-api-test
git init
printf '# Crush Test\n' > README.md
crush
```

在模型选择器中找到 `custom-openai/YOUR_MODEL_ID` 或对应 Provider。先执行只读任务：

```text
只读取 README.md 并告诉我标题，不要修改文件，不要运行命令。
```

再执行写入任务：

```text
在 README.md 末尾增加一行“连接验证成功”，展示修改并等待确认。
```

退出后检查：

```bash
git diff -- README.md
```

只有文件真的变化、diff 正确且审批流程正常，才算 Agent 基础链路通过。

## 8. MCP、LSP 与权限

先验证内置读写和命令工具，再添加 MCP。MCP 支持 `stdio`、HTTP 和 SSE，但每个 MCP 都可能获得文件、网络或外部账号权限。

配置前检查：

- 命令是否来自可信包；
- `args` 是否会执行下载脚本；
- 环境变量中是否包含高权限 Token；
- HTTP/SSE 服务是否使用 HTTPS；
- 写文件、执行命令和外部目录是否需要确认。

LSP 只提供代码结构和诊断上下文，不会替代模型的工具调用能力。

## 9. 日志与调试

```bash
crush logs
crush logs --tail 500
crush logs --follow
crush --debug
```

日志默认位于项目下的 `.crush/logs/crush.log`。分享日志前搜索并删除 Key、请求头、私有路径、代码片段和对话内容。

## 10. Provider 自动更新

Crush 会从 Catwalk 更新模型与 Provider 元数据。受限网络或需要固定配置时，可禁用：

```bash
export CRUSH_DISABLE_PROVIDER_AUTO_UPDATE=1
```

或在配置中设置：

```json
{
  "options": {
    "disable_provider_auto_update": true
  }
}
```

手动恢复内置数据：

```bash
crush update-providers embedded
```

## 11. 常见错误

| 现象 | 排查方向 |
|---|---|
| Provider 不出现 | JSON 语法、文件位置、Provider key 和环境变量 |
| 401 | Key 没有展开、Key 已撤销或认证头不兼容 |
| 404 | `base_url` 多写完整资源路径，或协议类型选错 |
| 400 unknown field | `openai` / `openai-compat` 选择不当，或高级参数不支持 |
| 普通回复正常但不改文件 | 模型或服务端工具调用不完整 |
| 工具参数被截断 | 流式 tool calls 不兼容；尝试关闭流式做对照 |
| 上下文超限 | 修正 `context_window` 和 `default_max_tokens` |
| 启动时执行陌生命令 | 立即退出并审查项目中的 `.crush.json` / `crush.json` |

## 12. 遥测与隐私

官方说明 Crush 的使用指标使用设备相关的伪匿名标识，不收集提示词和回复。需要关闭时：

```bash
export CRUSH_DISABLE_METRICS=1
# 或通用约定
export DO_NOT_TRACK=1
```

无论是否关闭指标，发送给远程模型的代码和上下文仍会离开本机。敏感仓库应使用隔离账号、最小权限 Key 和明确的数据处理规则。

## 13. 官方资料

- [Crush 官方 GitHub 与安装、配置说明](https://github.com/charmbracelet/crush)
- [Crush 配置 Schema](https://github.com/charmbracelet/crush/blob/main/schema.json)
- [Crush Releases](https://github.com/charmbracelet/crush/releases)
- [Charm 官方软件源](https://repo.charm.sh/)

---

求助时请提供 Crush 版本、操作系统、配置文件位置、脱敏 Provider 配置、模型 ID、状态码和相关日志片段，不要发送真实 Key。
