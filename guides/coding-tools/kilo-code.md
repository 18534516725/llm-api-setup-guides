# Kilo Code 编辑器与命令行编程助手自定义 API 接入教程

> 最后核验：2026-07-14
>
> 适用范围：当前 Kilo Code VS Code 扩展与 1.0+ CLI

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **需要测试 Kilo Code 的自定义模型？**
>
> [NexoToken](https://www.nexotoken.net/?ref=github) 每天提供 20 次免费额度，新人 1 元可得 300 积分，支持支付宝、微信直充。活动、额度、模型与计费规则以官网为准。创建 Key 后从控制台复制准确协议、Base URL 和模型 ID。

## 1. 当前产品形态

Kilo Code 提供 VS Code 扩展和 CLI，两者共享新的 Provider、模型与权限配置体系。本文不套用旧版扩展截图或旧字段。

自定义 Provider 可选择三类协议：

- `OpenAI Compatible`：通常是 `/v1/chat/completions`；
- `OpenAI Responses`：要求 `/v1/responses`；
- `Anthropic Messages`：要求 `/v1/messages`。

协议必须与服务端一致。本文主示例使用 OpenAI Compatible。

## 2. 安装

VS Code：打开 Extensions，搜索 `Kilo Code`，按官方当前说明选择 **Install Pre-Release Version**；这里的 pre-release 是 Marketplace 分发通道，官方将其作为当前推荐版本。

CLI：

```bash
npm install -g @kilocode/cli
kilo --version
```

VS Code 兼容编辑器无法访问 Marketplace 时，可通过官方 Open VSX 页面或官方 GitHub Releases 的 `.vsix` 安装。不要使用来历不明的 VSIX。

## 3. 图形界面配置

1. 打开 Kilo Code 面板，点击齿轮进入 Settings；
2. 打开 `Providers` 标签；
3. 滚动到底部，点击 `Custom provider`；
4. Provider ID 填 `custom-api`；
5. Display name 填易识别名称；
6. Provider API 选择服务端真实协议；
7. Base URL 填 `https://你的接口域名/v1`；
8. 输入 Key，或在使用自定义 headers 管理认证时留空；
9. 从自动获取的模型列表选择，或手动添加准确 Model ID；
10. 提交并在模型选择器选中该模型。

自动拉取模型依赖端点提供兼容的 `/v1/models`。拉取失败不等于推理不可用，可手动添加模型。

## 4. CLI/高级 JSON 配置

用户级可信配置中加入：

```json
{
  "$schema": "https://app.kilo.ai/config.json",
  "model": "openai-compatible/你的模型ID",
  "provider": {
    "openai-compatible": {
      "options": {
        "apiKey": "{env:CUSTOM_API_KEY}",
        "baseURL": "https://你的接口域名/v1"
      },
      "models": {
        "你的模型ID": {
          "name": "你的模型显示名",
          "tool_call": true,
          "reasoning": false,
          "temperature": true,
          "limit": {
            "context": 128000,
            "output": 8192
          },
          "modalities": {
            "input": ["text"],
            "output": ["text"]
          }
        }
      }
    }
  }
}
```

设置临时 Key：

```bash
export CUSTOM_API_KEY="你的APIKey"
kilo models
kilo --model "openai-compatible/你的模型ID"
```

`{env:...}` 只在 Kilo 认定的可信配置位置解析。项目根目录里可能被提交的 `kilo.json`/`opencode.json` 不会解析外部环境变量引用，这是防止恶意仓库把 Key 发往攻击者 Base URL 的保护。凭据应放用户级配置或通过 `/connect` 保存。

## 5. 模型元数据不能猜

| 字段 | 含义 |
|---|---|
| `id` | 实际发给 API 的模型 ID；缺省等于对象 key |
| `tool_call` | 模型是否真实支持工具/函数调用 |
| `reasoning` | 是否支持扩展推理 |
| `temperature` | 是否接受 temperature 参数 |
| `attachment` / `modalities` | 是否支持图片、PDF 等输入 |
| `limit.context` | 总上下文窗口 |
| `limit.output` | 最大输出 token |
| `cost` | 仅用于本地费用显示，不改变服务端扣费 |

完全自定义模型若未设置 limit，Kilo 可能解析为 `0`：上下文自动压缩会失效，输出采用内部回退值。官方明确建议自定义模型始终填写真实 `context` 与 `output`。

不要仅因端点返回模型列表就设置 `tool_call: true`。该字段是能力声明，不会给模型增加工具能力。

## 6. 工具调用与 Agent 限制

Kilo 的 read、edit、write、apply_patch、bash、搜索、子 Agent 和 MCP 都依赖工具调用。服务端需正确处理 tools、tool choice、流式工具参数、tool 结果、多轮调用和停止原因。

典型不兼容表现：

- 只输出“我会修改”，但不调用 edit/write；
- tool arguments 被截断或不是 JSON；
- 工具结果回传后服务端 400；
- reasoning 内容吞掉全部输出；
- 模型重复调用同一工具进入 doom loop。

先用文本模型和内置工具验证，再打开图片、推理、并行工具或 MCP。

## 7. 审批与安全

在 Settings → Auto Approve 为工具设置 `Allow / Ask / Deny`。建议显式配置保守默认值，避免版本默认差异：

```json
{
  "permission": {
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": "ask",
    "external_directory": "deny",
    "task": "ask",
    "webfetch": "ask",
    "websearch": "ask"
  }
}
```

不要在首次测试开启全局 auto approve。命令、外部目录、敏感文件、MCP 写操作和子 Agent 都应审查；生产部署、数据库写入、删除和 `git push` 永远人工确认。

## 8. 最小验证

```bash
mkdir kilo-api-test && cd kilo-api-test
git init
printf '# Kilo Test\n' > README.md
kilo
```

依次执行：

```text
只读取 README.md 并告诉我标题，不要修改文件。
```

```text
在 README.md 末尾增加“连接验证成功”，展示 diff，不要提交。
```

确认出现工具审批、文件确实修改且无其他 diff。最后请求执行 `git status --short`，验证 bash 工具审批和工具结果续写。

## 9. 常见错误

| 现象 | 处理 |
|---|---|
| 自动模型列表为空 | `/v1/models` 不兼容；手动添加模型 ID |
| 401 | 检查 `/connect` 或用户级 `{env:...}`；不要把 Key 放项目配置 |
| 404 | Base URL/协议类型不匹配；不要盲目追加完整资源路径 |
| 模型可聊不能改代码 | 确认真实工具调用能力，再设置 `tool_call: true` |
| 对话不压缩 | `limit.context` 未设置或为 0 |
| 输出被截断 | 按真实上限调整 `limit.output`，减少上下文 |
| temperature 参数报错 | 将 `temperature` 设为 false，前提是模型确实不支持 |
| VS Code 与 CLI 结果不同 | 检查两者版本、当前配置层级与所选 `provider/model` |

## 10. 更新、回滚与卸载

CLI：

```bash
kilo upgrade
# 或
npm update -g @kilocode/cli
```

卸载 CLI：

```bash
npm uninstall -g @kilocode/cli
```

VS Code 在扩展页更新或卸载。回滚从官方 GitHub Releases 下载目标版本 VSIX，通过 `Install from VSIX...` 安装，并临时关闭该扩展自动更新。回滚前备份用户配置；旧版本可能不认识新 schema。卸载后撤销 Key，按需删除残留配置，不要未经检查删除共享会话数据。

## 11. 官方来源

- [Kilo Code 安装](https://kilo.ai/docs/getting-started/installing)
- [Kilo CLI](https://kilo.ai/docs/code-with-ai/platforms/cli)
- [Custom Models](https://kilo.ai/docs/code-with-ai/agents/custom-models)
- [AI Providers](https://kilo.ai/docs/ai-providers)
- [Auto-Approving Actions](https://kilo.ai/docs/getting-started/settings/auto-approving-actions)
- [How Tools Work](https://kilo.ai/docs/automate/how-tools-work)
- [Kilo Code 官方 GitHub](https://github.com/Kilo-Org/kilocode)
