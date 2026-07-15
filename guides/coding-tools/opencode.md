# OpenCode 终端编程智能体自定义 API 接入教程

> 最后核验：2026-07-14
>
> 适用范围：当前 OpenCode CLI/TUI；官方支持自定义 OpenAI 兼容 Provider

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先选对协议包

OpenCode 基于 AI SDK 连接模型。官方对自定义端点给出两条明确路径：

| 服务端能力 | `npm` 字段 | 典型资源 |
|---|---|---|
| OpenAI 兼容 Chat Completions | `@ai-sdk/openai-compatible` | `/v1/chat/completions` |
| OpenAI Responses | `@ai-sdk/openai` | `/v1/responses` |

不要因为两者都叫“OpenAI 兼容”就混用。只支持 Chat Completions 的网关不能用 Responses 包；反之亦然。Base URL 一般填到 `/v1`，不填完整资源路径。

## 2. 安装

官方安装脚本：

```bash
curl -fsSL https://opencode.ai/install | bash
```

或使用包管理器：

```bash
npm install -g opencode-ai
# 或
pnpm install -g opencode-ai
# macOS/Linux Homebrew
brew install anomalyco/tap/opencode
```

Windows 官方建议优先 WSL；也可使用 npm、Scoop 或 Chocolatey。验证：

```bash
opencode --version
opencode --help
```

## 3. 推荐配置流程

进入任意项目并启动：

```bash
cd /你的项目目录
opencode
```

在 TUI 输入 `/connect`，滚动到 `Other`：

1. Provider ID 填 `custom-gateway`；
2. 输入你的 API Key；
3. OpenCode 将凭据保存到用户数据目录的 `auth.json`；
4. 这一步只保存凭据，仍需创建配置文件。

Provider ID 必须与下面 JSON 的 key 完全一致。可用以下命令检查：

```bash
opencode auth list
```

## 4. Chat Completions 配置

在项目根目录创建 `opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "custom-gateway/你的模型ID",
  "provider": {
    "custom-gateway": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "自定义兼容接口",
      "options": {
        "baseURL": "https://你的接口域名/v1"
      },
      "models": {
        "你的模型ID": {
          "name": "你的模型显示名",
          "limit": {
            "context": 128000,
            "output": 8192
          }
        }
      }
    }
  }
}
```

`models` 的对象 key 是实际模型 ID；`model` 使用 `provider/model`。`name` 只是界面显示名。

## 5. Responses 配置

若控制台明确说明端点实现 `/v1/responses`，仅把 Provider 包改为：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "custom-responses/你的模型ID",
  "provider": {
    "custom-responses": {
      "npm": "@ai-sdk/openai",
      "name": "自定义 Responses 接口",
      "options": {
        "baseURL": "https://你的接口域名/v1"
      },
      "models": {
        "你的模型ID": {
          "name": "你的模型显示名",
          "limit": { "context": 128000, "output": 8192 }
        }
      }
    }
  }
}
```

为这个 Provider 再执行一次 `/connect → Other`，ID 填 `custom-responses`。不要把一个凭据 ID 配到另一个 Provider 名下。

## 6. 用环境变量管理 Key

若不使用 `/connect`，可在用户级可信配置中引用环境变量：

```bash
export CUSTOM_API_KEY="你的APIKey"
```

```jsonc
"options": {
  "apiKey": "{env:CUSTOM_API_KEY}",
  "baseURL": "https://你的接口域名/v1"
}
```

不要把真实 Key 或固定 `Authorization` 值提交到仓库。项目配置适合共享无密钥的 Provider/模型定义，凭据应留在用户凭据存储或环境变量。

## 7. 模型元数据

自定义 Provider 不会自动获得 models.dev 中所有信息。建议按真实规格填写：

- `limit.context`：总上下文窗口；
- `limit.output`：单次最大输出；
- 显示名：只影响选择器；
- Provider/模型专属 `options`：只有服务端明确支持时才加。

填得过大不会提升模型能力，反而会延迟压缩并触发 400；填得太小会过早压缩。可在 TUI 用 `/models` 检查注册结果。

## 8. 工具调用与 Agent 限制

OpenCode 的 `read`、`edit`、`write`、`bash`、搜索和 MCP 都依赖模型能稳定产生工具调用。服务端需完整转发工具定义、tool choice、流式 tool calls、tool 结果消息和多轮上下文。

仅能普通聊天时可能出现：回复“我已修改”但没有 diff、工具参数为空、连续重复调用或在第一轮后 400。模型目录能出现不代表 Agent 能力已通过。

先用内置工具验证，再添加 MCP。并发工具调用、图片、推理字段和提示缓存只在模型、协议包与服务端三者都支持时开启。

## 9. 审批与安全

当前 OpenCode 使用 `permission`，值为 `ask`、`allow` 或 `deny`。建议首次配置：

```jsonc
{
  "permission": {
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": "ask",
    "external_directory": "deny",
    "webfetch": "ask",
    "websearch": "ask"
  }
}
```

把它合并进现有 `opencode.json`，不要创建第二个顶层 JSON 对象。`edit` 同时控制 write/edit/apply_patch。不要在重要仓库首次使用 `--auto`；该参数会自动批准未明确 deny 的请求。

## 10. 最小验证

```bash
mkdir opencode-api-test && cd opencode-api-test
git init
printf '# OpenCode Test\n' > README.md
opencode
```

先输入只读任务：

```text
只读取 README.md 并复述标题，不要修改文件，不要运行命令。
```

再输入写入任务：

```text
在 README.md 末尾增加“连接验证成功”，展示修改，不要提交。
```

应看到工具审批、实际 diff，且 `git diff` 只有目标改动。最后可运行：

```bash
opencode run --model "custom-gateway/你的模型ID" "只解释当前目录有哪些文件"
```

## 11. 常见错误

| 现象 | 排查 |
|---|---|
| Provider 不出现 | `/connect` 的 ID 与 JSON key 不一致，或 JSON 语法错误 |
| 模型不出现 | `models` key 与 `provider/model` 不一致；运行 `/models` |
| 404 | Base URL 多写了 `/chat/completions`，或协议包选错 |
| 400 unknown field | Chat Completions/Responses 包选错，或服务端兼容不完整 |
| 401 | `opencode auth list` 检查凭据 ID；重新连接，不输出完整 Key |
| 工具循环/空参数 | 模型或流式 tool calls 不兼容；换明确支持工具调用的模型 |
| 上下文溢出 | 按真实值修正 `limit.context/output`，新建会话复测 |

## 12. 更新、回滚与卸载

```bash
opencode upgrade
opencode upgrade v你的目标版本
```

也可用 `--method npm|pnpm|bun|brew|curl` 指定原安装方式。升级前备份配置和记录当前版本。卸载前先预览：

```bash
opencode uninstall --dry-run
opencode uninstall --keep-config --keep-data
```

完全卸载可运行 `opencode uninstall`。撤销不再使用的 Key；回滚后若配置 schema 不兼容，先用最小 Provider 配置测试，不要直接删除会话数据。

## 13. 官方来源

- [OpenCode 安装与快速开始](https://opencode.ai/docs/)
- [Providers 与自定义 Provider](https://opencode.ai/docs/providers/)
- [CLI：upgrade、uninstall、auth](https://opencode.ai/docs/cli/)
- [Permissions](https://opencode.ai/docs/permissions/)
- [Tools](https://opencode.ai/docs/tools/)
- [OpenCode 官方 GitHub](https://github.com/anomalyco/opencode)
