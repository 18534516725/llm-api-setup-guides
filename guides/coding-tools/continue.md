# Continue 接入 OpenAI 兼容 API：YAML 配置、Agent、补全与安全指南

> 最后核验：2026-07-14
>
> 适用范围：Continue VS Code / JetBrains 扩展与 Continue CLI（`cn`）
>
> 推荐格式：`~/.continue/config.yaml`；旧 `config.json` 已弃用

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. Continue 的优势

Continue 是可配置的开源编程助手，可以为不同职责分别指定模型：

- Chat：问答与代码理解；
- Agent：工具调用、修改文件、运行命令；
- Edit / Apply：局部编辑和应用补丁；
- Autocomplete：行内补全；
- Embed / Rerank：代码库检索。

它通过 YAML 暴露 `apiBase`、`apiKey`、`model`、`roles`、`capabilities` 等字段，适合需要精细控制的用户。

## 2. 安装

### VS Code

在扩展市场搜索 `Continue`，核对官方发布者后安装。安装后从活动栏打开 Continue。

### JetBrains

进入 `Settings / Preferences → Plugins → Marketplace`，搜索 Continue，安装并重启 IDE。

### Continue CLI

官方提供 `cn` CLI。其安装方式可能变化，请以[官方 CLI 指南](https://docs.continue.dev/guides/cli)为准。CLI 与 IDE 扩展使用同一种 `config.yaml` 结构，但环境变量读取方式不同。

## 3. 当前配置文件位置

全局本地配置：

- macOS / Linux：`~/.continue/config.yaml`
- Windows：`%USERPROFILE%\.continue\config.yaml`

Continue CLI 还可以临时指定：

```bash
cn --config ./my-config.yaml
```

旧教程中的 `config.json` 已被官方标记为 Deprecated。新配置应使用 YAML，不要同时维护两份冲突配置。

## 4. 最小可用配置

```yaml
name: My Local Config
version: 1.0.0
schema: v1

models:
  - name: 自定义代码模型
    provider: openai
    model: 从模型列表复制的准确模型ID
    apiBase: 从控制台复制的OpenAI兼容BaseURL
    apiKey: ${{ secrets.NEXO_API_KEY }}
```

YAML 使用空格缩进，不要使用 Tab。`${{ secrets.NEXO_API_KEY }}` 是秘密引用，不是需要原样替换成 Key 的普通字符串。

## 5. 安全保存 API Key

推荐在以下任一 `.env` 文件中保存：

1. `<workspace-root>/.env`
2. `<workspace-root>/.continue/.env`
3. `~/.continue/.env`

内容：

```dotenv
NEXO_API_KEY=你的APIKey
```

然后在 YAML 中引用：

```yaml
apiKey: ${{ secrets.NEXO_API_KEY }}
```

重要区别：

- IDE 扩展不能直接读取你在 shell 中 `export` 的环境变量；
- IDE 使用时应放到上述 `.env` 文件并重启 IDE；
- Continue CLI 可以读取进程环境变量；
- 工作区 `.env` 必须加入 `.gitignore`，不能提交。

如果团队仓库已有 `.env` 示例，不要把真实 Key 写进示例文件。

## 6. Base URL 和接口模式

`apiBase` 应填写服务商给出的 OpenAI 兼容 Base URL，例如常见形式：

```text
https://你的接口域名/v1
```

不要填完整 `/chat/completions`，也不要照抄其他工具的 Anthropic Base URL。

Continue 对某些 OpenAI 推理模型可能默认使用 `/responses`。如果网关只兼容 Chat Completions，可显式关闭 Responses API：

```yaml
models:
  - name: 自定义代码模型
    provider: openai
    model: 从模型列表复制的准确模型ID
    apiBase: 从控制台复制的OpenAI兼容BaseURL
    apiKey: ${{ secrets.NEXO_API_KEY }}
    useResponsesApi: false
```

只有非常旧、只实现 `/completions` 的服务才考虑：

```yaml
useLegacyCompletionsEndpoint: true
```

它不是普通 OpenAI 兼容网关的默认选项，错误开启会把请求发往不合适的 endpoint。

## 7. 为不同功能分配模型角色

`roles` 控制模型承担哪些职责。官方参考中的常见角色包括：

- `chat`
- `autocomplete`
- `edit`
- `apply`
- `embed`
- `rerank`
- `summarize`

示例：让主模型负责 Chat、Edit、Apply：

```yaml
models:
  - name: 主代码模型
    provider: openai
    model: 从模型列表复制的准确模型ID
    apiBase: 从控制台复制的OpenAI兼容BaseURL
    apiKey: ${{ secrets.NEXO_API_KEY }}
    roles:
      - chat
      - edit
      - apply
```

不要默认让同一聊天模型承担 autocomplete 或 embeddings。不同角色的请求格式、延迟和模型类型可能不同。

## 8. Agent 工具能力

Continue 使用 `capabilities` 表示模型能力：

```yaml
models:
  - name: Agent 模型
    provider: openai
    model: 从模型列表复制的准确模型ID
    apiBase: 从控制台复制的OpenAI兼容BaseURL
    apiKey: ${{ secrets.NEXO_API_KEY }}
    capabilities:
      - tool_use
```

`tool_use` 只告诉 Continue 可以尝试工具模式，不会让不支持工具的接口突然兼容。服务端必须真实支持原生工具调用，或者模型本身要足够稳定地遵循 Continue 当前的 system-message tools 方案。

如果 Agent 显示 `Not Supported`：

1. 确认模型支持工具；
2. 添加 `tool_use`；
3. 重启 IDE；
4. 新建会话；
5. 用最小只读工具任务验证。

## 9. 图片输入能力

模型与接口都支持图片时可添加：

```yaml
capabilities:
  - tool_use
  - image_input
```

如果上传图片按钮出现，但请求报 400，说明能力声明与真实接口不一致。移除 `image_input` 并重启。

## 10. 完整的推荐示例

```yaml
name: Nexo Coding Config
version: 1.0.0
schema: v1

models:
  - name: Nexo Agent
    provider: openai
    model: 从模型列表复制的准确模型ID
    apiBase: 从控制台复制的OpenAI兼容BaseURL
    apiKey: ${{ secrets.NEXO_API_KEY }}
    useResponsesApi: false
    roles:
      - chat
      - edit
      - apply
    capabilities:
      - tool_use
    defaultCompletionOptions:
      temperature: 0.2
      maxTokens: 4096
```

`maxTokens` 应按模型实际输出上限调整。温度低通常更适合代码任务，但并非越低越好。

## 11. 第一次验证

### 重新加载配置

保存 YAML 后重启 IDE，或使用 Continue 当前版本提供的 Reload / 配置刷新入口。

### Chat

```text
只回复“连接成功”，不要调用工具。
```

### Plan

Plan 模式只提供内置只读工具，适合先验证：

```text
请读取当前项目结构并列出主要模块，不要修改文件。
```

### Agent

```text
读取 package.json 并说明可用的测试命令。不要运行命令。
```

最后再测试小范围写入，并逐条审批工具调用。

## 12. Chat、Plan、Agent 三种模式

| 模式 | 工具范围 | 适用场景 |
|---|---|---|
| Chat | 无工具 | 问答、解释 |
| Plan | 只读工具 | 理解项目、制定方案 |
| Agent | 读写与终端工具 | 实施修改、运行测试 |

Agent 默认在调用工具前请求许可。工具策略可设为：

- Ask First：每次询问，推荐默认；
- Automatic：自动执行；
- Excluded：不向模型提供该工具。

不要把终端、删除、网络上传工具长期设为 Automatic。

## 13. 自定义证书与企业网络

如果企业网关使用自定义 CA，出现 `fetch failed` 或证书错误，可在模型配置中使用官方支持的 `requestOptions.caBundlePath`，指向根证书或中间证书文件。

不要通过全局关闭 TLS 校验解决生产环境证书问题。关闭校验会让 Key 和代码面临中间人攻击。

## 14. 常见错误

### 配置不显示

- YAML 缩进错误；
- 使用 Tab；
- 缺少 `name`、`version`、`schema`；
- 修改了旧 `config.json`；
- IDE 未重启。

### 401

- `.env` 未被 IDE 读取；
- Secret 名称不一致；
- Key 失效；
- Base URL 与 Key 不匹配。

注意：`export NEXO_API_KEY=...` 对 IDE 扩展通常无效，只对 CLI 进程生效。

### 404

- `apiBase` 路径错误；
- 重复/缺少 `/v1`；
- Responses API 与 Chat Completions 不匹配；
- Model ID 错误。

### 请求 `/responses` 失败

为该模型添加：

```yaml
useResponsesApi: false
```

### Agent Not Supported

添加 `tool_use` 并确认服务端真实支持工具。单纯添加 capability 后仍失败，说明接口或模型能力不足。

### Tools 不执行或循环

- 模型工具能力不稳定；
- 网关没有完整转发 tool calls；
- 上下文太长；
- 输出被截断；
- 模型 ID 被 Continue 错误自动识别。

新建短会话、减少工具、明确 capabilities，再逐项验证。

### 429

减少并行任务和上下文，等待限流恢复。Agent 一次任务会产生多次请求，不能按“一条提示词”估算请求数。

## 15. 回滚配置

1. 先备份当前 `config.yaml`，但不要把含真实 Key 的 `.env` 一起公开；
2. 删除或注释新模型块；
3. 恢复之前可用模型；
4. 重启 IDE；
5. 新建会话验证；
6. 在服务端撤销不再使用的测试 Key。

若要完全重置，官方说明 Continue 数据位于 `~/.continue`（Windows 为 `%USERPROFILE%\.continue`）。删除整个目录会同时移除配置、索引和状态，应只作为备份后的最后手段。

## 16. 官方资料

- [Continue OpenAI Provider](https://docs.continue.dev/customize/model-providers/top-level/openai)
- [Continue config.yaml Reference](https://docs.continue.dev/reference)
- [Continue 模型能力](https://docs.continue.dev/customize/deep-dives/model-capabilities)
- [Continue Agent Quick Start](https://docs.continue.dev/ide-extensions/agent/quick-start)
- [Continue Secrets 与 FAQ](https://docs.continue.dev/faqs)
- [Continue CLI 配置](https://docs.continue.dev/cli/configuration)

> Continue 配置接口仍在迭代。遇到旧教程时，优先使用当前 `config.yaml` 官方参考，不要照搬已弃用的 `config.json`。
