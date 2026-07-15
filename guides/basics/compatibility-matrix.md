# 主流 AI 工具自定义 API 兼容性总表

> 最后核验：2026-07-15 · 覆盖 49 款工具、平台与开发框架（含 1 项停运历史资料）

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

[← 返回教程目录](../教程总目录.md)

这张表回答三个问题：**该选哪个工具、它需要什么协议、接入后哪些能力还要单独验证。**“支持自定义 API”只代表存在配置入口，不代表聊天、图片、工具调用、知识库和 Agent 全部兼容。

## 1. 一眼选工具

| 你的需求 | 优先查看 | 备选 |
|---|---|---|
| 新手桌面聊天 | [Cherry Studio](../chat-clients/cherry-studio.md)、[Chatbox](../chat-clients/chatbox.md) | [ChatWise](../chat-clients/chatwise.md) |
| 角色与提示词聊天 | [SillyTavern](../chat-clients/sillytavern.md) | 先从 release 分支与纯文本开始 |
| 本地模型与远程 API 混用 | [Jan](../chat-clients/jan.md)、[Msty](../chat-clients/msty.md) | [Cherry Studio](../chat-clients/cherry-studio.md) |
| macOS 原生客户端 | [BoltAI](../chat-clients/boltai.md) | [Chatbox](../chat-clients/chatbox.md) |
| 浏览器或 PWA 聊天 | [LobeChat](../chat-clients/lobechat.md)、[NextChat](../chat-clients/nextchat.md) | [Open WebUI](../self-hosted/open-webui.md) |
| 终端 AI 编程 | [Claude Code](../coding-tools/claude-code.md)、[Codex CLI](../coding-tools/codex-cli.md) | [Qwen Code](../coding-tools/qwen-code.md)、[Gemini CLI](../coding-tools/gemini-cli.md) |
| VS Code 编程代理 | [Cline](../coding-tools/cline.md)、[Continue](../coding-tools/continue.md) | Roo Code 已停运，不建议新装 |
| Git 驱动终端编程 | [Aider](../coding-tools/aider.md) | [OpenCode](../coding-tools/opencode.md) |
| 开源终端 Agent | [OpenCode](../coding-tools/opencode.md)、[Crush](../coding-tools/crush.md) | [goose](../coding-tools/goose.md) |
| 软件工程 Agent / 多 Agent 工作台 | [OpenHands](../coding-tools/openhands.md) | [AionUi](../coding-tools/aionui.md) |
| AI 编辑器 | [Cursor](../coding-tools/cursor.md) | 先阅读其自定义 API 限制 |
| 多套编程 API 配置切换 | [CC Switch](../coding-tools/cc-switch.md) | 它不是聊天客户端 |
| 多用户自部署聊天 | [Open WebUI](../self-hosted/open-webui.md)、[LibreChat](../self-hosted/librechat.md) | [LobeChat](../chat-clients/lobechat.md) |
| 本地文档与知识库 | [AnythingLLM](../self-hosted/anythingllm.md) | [Dify](../self-hosted/dify.md)、[FastGPT](../self-hosted/fastgpt.md) |
| 工作流与 AI 应用 | [Dify](../self-hosted/dify.md) | [FastGPT](../self-hosted/fastgpt.md) |
| 企业知识库问答 | [FastGPT](../self-hosted/fastgpt.md) | [Dify](../self-hosted/dify.md) |
| 文档解析型 RAG | [RAGFlow](../self-hosted/ragflow.md) | [MaxKB](../self-hosted/maxkb.md) |
| 自动化与 Webhook | [n8n](../automation-platforms/n8n.md) | [Flowise](../automation-platforms/flowise.md)、[Langflow](../automation-platforms/langflow.md) |
| 网页与文档双语翻译 | [沉浸式翻译](../productivity-tools/immersive-translate.md) | — |
| Obsidian 知识问答 | [Obsidian Copilot](../productivity-tools/obsidian-copilot.md) | — |
| Python / Node SDK 开发 | [OpenAI SDK](../developer-integration/openai-sdk.md) | — |
| Agent / RAG 开发框架 | [OpenAI Agents SDK](../developer-integration/openai-agents-sdk.md)、[PydanticAI](../developer-integration/pydantic-ai.md) | [CrewAI](../developer-integration/crewai.md)、[LangChain](../developer-integration/langchain.md)、[LlamaIndex](../developer-integration/llamaindex.md) |
| Next.js AI 应用 | [Vercel AI SDK](../developer-integration/vercel-ai-sdk.md) | — |
| Java / Spring Boot | [Spring AI](../developer-integration/spring-ai.md) | — |
| 图形化 API 排错 | [Apifox / Postman](../api-testing/apifox-postman.md) | 先测最小请求，再排查客户端 |

## 2. 聊天客户端

| 工具 | 运行方式 | 主要自定义入口 | 典型协议 | 关键提醒 |
|---|---|---|---|---|
| Cherry Studio | Windows / macOS / Linux | 自定义供应商 | OpenAI Chat Completions | 模型 ID 需与控制台一致；多模态、工具调用分别测试 |
| Chatbox | 桌面 / Web / 移动端 | OpenAI API Compatible | OpenAI Chat Completions | 注意 Host 是否需要 `/v1`，以界面最终请求规则为准 |
| LobeChat | Web / PWA / Docker | OpenAI-compatible provider | OpenAI 兼容接口 | 客户端和服务端部署模式的环境变量、密钥保存位置不同 |
| NextChat | Web / PWA / Docker | 环境变量或部署配置 | OpenAI Chat Completions | 公网部署必须设置访问密码并保护服务端环境变量 |
| Jan | Windows / macOS / Linux | Custom Endpoint | OpenAI Chat Completions | Base URL 填到 `/v1`；本地模型与远程接口分开验证 |
| Msty Studio | 桌面端 | Bring Your Own Provider | OpenAI 兼容接口 | Provider、模型能力和知识功能分别确认 |
| TypingMind | Web / PWA | Custom endpoint | OpenAI Chat Completions | 官方入口使用完整 `/v1/chat/completions` Endpoint |
| BoltAI | macOS | Custom OpenAI-compatible Server | OpenAI Chat Completions | 使用完整聊天端点；确认 Key 在本机的保存方式 |
| ChatWise | 桌面端 | Custom Provider | OpenAI / Anthropic 兼容接口 | 模型能力开关要按真实服务逐项验证 |
| SillyTavern | 本地 Web 前端 | Custom (OpenAI-compatible) | OpenAI Chat Completions | Endpoint 通常填到 `/v1`；release 与 staging 不要混用 |

### 适合谁

- **Cherry Studio**：希望在一个桌面应用里管理多个服务和模型；
- **Chatbox**：只想快速聊天、界面简单、本地优先；
- **LobeChat**：重视 Web 体验、PWA、会话与扩展能力；
- **NextChat**：想用较少配置部署一个轻量 Web 聊天界面。
- **Jan**：希望把本地模型与远程兼容 API 放在同一桌面客户端；
- **Msty Studio**：需要多 Provider、知识管理和桌面工作台；
- **TypingMind**：偏好成熟 Web 聊天界面并能配置完整 Endpoint；
- **BoltAI**：需要 macOS 原生体验和自定义 OpenAI-compatible Server。
- **ChatWise**：希望在桌面端管理 OpenAI / Anthropic 兼容 Provider；
- **SillyTavern**：需要角色卡、世界书和高度可调提示词的本地前端。

## 3. AI 编程工具

| 工具 | 形态 | 主要协议/入口 | Agent 能力 | 最重要的限制 |
|---|---|---|---|---|
| Claude Code | 终端代理 | Anthropic Messages 兼容配置 | 原生 | 服务必须兼容 Claude Code 所需的 Messages 与工具调用语义 |
| Codex CLI | 终端代理 | OpenAI Responses | 原生 | 只支持 Chat Completions 的服务通常无法完整替代 Responses |
| Qwen Code | 终端代理 | OpenAI / Anthropic / Gemini Provider | 原生 | Provider 分组决定 SDK 与协议，Base URL 不能跨协议混用 |
| Gemini CLI | 终端代理 | Google GenAI / Gemini 原生 API | 原生 | `GOOGLE_GEMINI_BASE_URL` 不是 OpenAI-compatible 地址 |
| Cursor | 独立编辑器 | BYOK / Override OpenAI Base URL | 部分取决于 Cursor | 自定义 Key 不代表全部 Agent、Tab 和专有功能都会走该地址 |
| Cline | VS Code 扩展 | OpenAI Compatible 等供应商入口 | 原生 | 首次先设保守审批规则，验证工具调用而不只是聊天 |
| Roo Code | 已停运的 VS Code 扩展 | 历史 OpenAI Compatible 配置 | 历史版本原生支持 | 仅供存量用户迁移；官方仓库已归档，不建议新装 |
| Continue | VS Code / JetBrains 扩展 | `config.yaml` 模型配置 | Chat / Agent / 补全按配置 | Chat、Autocomplete、Embedding、Reranker 是不同角色，需分别配置 |
| CC Switch | 桌面配置管理器 | 管理 Claude / Codex 等配置 | 不提供模型能力 | 它只切换配置；最终是否可用由目标 CLI 与 API 协议决定 |
| Aider | 终端 / Git | `openai/<model>` 与环境变量 | 代码编辑 | 以 Chat Completions 为主；先在测试仓库验证 Git 变更 |
| OpenCode | 终端代理 | 自定义 Provider 配置 | 原生 | 区分 AI SDK Chat Completions 与 Responses Provider 包 |
| Crush | 终端代理 | `openai-compat` / `anthropic` Provider | 原生 | 项目配置属于可信代码；工具调用和配置命令必须审查 |
| OpenHands | 本地 GUI / 软件工程 Agent | Custom Model + Base URL | 原生 | Docker 网络、工作区挂载和强模型工具能力缺一不可 |
| AionUi | 桌面多 Agent 工作台 | Models → Custom | 内置与外部 Agent 分开 | Custom 模型不会自动覆盖每个外部 CLI 的独立配置 |
| Kilo Code | VS Code / CLI | Custom Provider | 原生 | 审批、可信配置和模型工具能力必须一起验证 |
| Zed | 编辑器 | Agent 模型 Provider | 原生 | `chat_completions` capability 会影响使用的协议路径 |
| goose | 终端 / 桌面代理 | 声明式 Provider | 原生 | Base URL 可能要求完整 `/v1/chat/completions`，按官方字段填写 |

### 编程工具必须多测两步

普通问答成功后，再执行：

1. 让工具读取一个只含测试文件的目录并解释内容；
2. 让工具创建一个临时文件，在审批界面确认后再执行。

如果第一步能回答、第二步没有合法工具调用，说明“聊天可用”但 Agent 链路仍未完整兼容。

## 4. 自部署与知识库平台

| 工具 | 定位 | 自定义 API 入口 | 是否常需 Embedding | 部署重点 |
|---|---|---|:---:|---|
| Open WebUI | 多用户聊天前端 | OpenAI API Connections | 可选 | 连接配置、权限、持久化卷、反向代理 SSE |
| LibreChat | 多供应商聊天平台 | `librechat.yaml` Custom Endpoints | 可选 | YAML 缩进、环境变量引用、公开注册与密钥安全 |
| AnythingLLM | 本地文档/工作区问答 | Generic OpenAI 等 LLM Provider | 是 | LLM、Embedding、向量库为独立组件，换模型可能需重建索引 |
| Dify | 工作流与应用编排 | OpenAI-compatible 模型插件 | 知识库需要 | 对话模型、Embedding、Rerank 分开配置，插件版本要记录 |
| FastGPT | 知识库与应用发布 | 模型渠道 / AI Proxy | 是 | 模型渠道、向量维度、索引、应用发布链路分别验证 |
| RAGFlow | 文档解析与 RAG | OpenAI-compatible 模型配置 | 是 | Chat、Embedding、Rerank、检索测试和数据集解析分别验证 |
| MaxKB | 企业知识库与智能体 | OpenAI 模型供应商配置 | 是 | 模型、知识库、应用发布、触发器和权限链路分别检查 |

### 自部署的最小验收

- 容器重启后配置和会话仍存在；
- 新用户看不到管理员 Key；
- 普通对话和流式输出正常；
- 知识库能导入、索引、检索并引用来源；
- 反向代理不会缓冲 SSE；
- 已备份配置、数据库和持久化卷，并验证恢复流程。

## 5. 自动化与可视化工作流

| 工具 | 定位 | 兼容入口 | 关键提醒 |
|---|---|---|---|
| n8n | 业务自动化与 Webhook | OpenAI 凭据 / 节点 Base URL | 凭据、聊天、Embedding、Webhook 鉴权和执行数据保留分别设置 |
| Flowise | Chatflow / Agentflow | ChatOpenAI / Embedding 节点 | 凭据加密、数据库持久化和已发布 Flow API Key 必须配置 |
| Langflow | 可视化 AI Flow | OpenAI 兼容组件 | Chat 与 Embedding 组件独立，Webhook 和 API 需额外认证 |

工作流平台会把一次用户操作扩展成多次模型调用。上线前限制循环次数、并发、Webhook 来源和单次执行成本。

## 6. 效率工具

| 工具 | 场景 | 兼容入口 | 验证重点 |
|---|---|---|---|
| 沉浸式翻译 | 网页、PDF、字幕双语翻译 | OpenAI 兼容翻译服务 | 长文本分段、术语、并发、速率限制与隐私 |
| Obsidian Copilot | 笔记问答与 Vault QA | 第三方 OpenAI 格式模型 | 笔记内容会发送给接口；CORS 旁路模式不支持流式输出 |

翻译工具会把网页选中文本或文档片段发送给配置的 API。处理合同、病历、客户资料或公司内部页面前，先确认数据处理规则。

## 7. SDK 与开发框架

| 框架 | 语言 / 场景 | 自定义入口 | 关键提醒 |
|---|---|---|---|
| OpenAI 官方 SDK | Python / Node.js | `base_url` / `baseURL` | Chat、Responses、Embedding 是不同端点，分别验证 |
| LangChain | Python / TypeScript | `ChatOpenAI` Custom URL | 非标准响应字段可能不会保留；LLM 与 Embedding 分开配置 |
| LlamaIndex | Python RAG | `OpenAILike` / `api_base` | 必须填写上下文和工具能力元数据，换 Embedding 后重建索引 |
| Vercel AI SDK | TypeScript / Next.js | `createOpenAICompatible` | Provider 必须仅在服务端创建，流式 Usage 兼容性需验证 |
| Spring AI | Java / Spring Boot | `base-url` + `completions-path` | 小心 `/v1` 重复拼接，Tool 和 VectorStore 需独立契约测试 |
| OpenAI Agents SDK | Python Agent | `OpenAIProvider` / 自定义 OpenAI Client | 默认偏向 Responses；Chat Completions 需要显式模型类 |
| PydanticAI | Python Agent | `OpenAIProvider(base_url=...)` | 显式区分 Responses 与 Chat，结构化输出仍需 Pydantic 校验 |
| CrewAI | Python 多 Agent | `LLM(base_url=...)` | Provider 前缀决定协议；Agent 数量会放大调用与错误 |

## 8. API 测试与调试

| 工具 | 主要用途 | 关键提醒 |
|---|---|---|
| Apifox | REST、SSE、环境变量和脚本断言 | Key 使用私密环境值，分享项目和截图前彻底脱敏 |
| Postman | Collection、Variables、Vault 和请求测试 | Secret 放入 Vault；导出 Collection 不等于自动移除所有敏感内容 |

先用调试工具验证 `/models`、`/chat/completions` 或 `/responses`，再配置复杂客户端。普通非流式请求成功后，还需单独测试 SSE 与 Function Calling。

## 9. 协议覆盖速查

下表表示教程重点，不是对所有版本的永久能力承诺：

| 协议或能力 | 常见工具 |
|---|---|
| OpenAI Chat Completions | 大多数聊天客户端；Aider、Cline、OpenCode、Crush、OpenHands、AionUi 等编程工具；n8n、Flowise、Langflow；OpenAI SDK、LangChain、LlamaIndex、Vercel AI SDK、Spring AI |
| OpenAI Responses | Codex CLI；Continue、OpenCode 和部分 SDK / 框架可按配置选择，需看服务与版本支持 |
| Anthropic Messages | Claude Code；部分多供应商客户端也可原生配置 Anthropic |
| Function Calling / 工具调用 | Cline、Continue、Claude Code、Codex CLI、OpenCode、Crush、OpenHands、AionUi、Kilo Code、Zed、goose 及开发框架；Roo Code 仅作历史资料 |
| Embeddings | AnythingLLM、Dify、FastGPT、RAGFlow、MaxKB、自动化平台及 RAG 开发框架 |
| SSE 流式输出 | 大多数聊天和编程工具；反向代理配置会影响稳定性 |

## 10. Base URL 填写速查

| 输入框文字 | 通常填写 | 仍需确认 |
|---|---|---|
| Base URL / API Host | `https://your-api.example.com/v1` | 工具是否自动补 `/v1` |
| Chat Completions URL | `https://your-api.example.com/v1/chat/completions` | 是否明确要求完整端点 |
| Anthropic Base URL | 服务给出的 Messages 根地址 | 工具是否自动拼 `/v1/messages` |
| Responses Base URL | 服务给出的 API 根地址 | 是否实现 `/v1/responses` |

不要只看输入框名称猜地址。每篇教程都以对应工具的官方配置行为为准。

## 11. 能力验收清单

按需要勾选，不用的能力无需测试：

- [ ] 列出或手动添加模型；
- [ ] 单轮文本对话；
- [ ] 多轮上下文；
- [ ] 流式输出；
- [ ] 长文本；
- [ ] 图片输入；
- [ ] 工具调用；
- [ ] 文件读写审批；
- [ ] Embedding；
- [ ] 知识库检索与引用；
- [ ] 并发与 429 退避；
- [ ] 重启后的配置持久化；
- [ ] Key 撤销和轮换。

## 12. 本仓库的兼容性标注规则

- **官方支持**：产品官方文档明确给出该配置入口；
- **兼容入口**：官方提供通用 Base URL 或 OpenAI Compatible 设置，但不承诺所有第三方实现；
- **部分可用**：聊天能用，Agent、工具调用或专有能力可能不走自定义 API；
- **需要自部署**：环境变量或 YAML 配置只适用于自己部署的实例；
- **待复核**：界面或文档近期变化，教程会明确标注核验日期。

## 13. 推荐阅读顺序

1. 第一次接 API：先读 [API 接入基础](./api-basics.md)；
2. 在本页选择工具并进入对应完整教程；
3. 配置失败：查 [通用排错手册](./troubleshooting.md)；
4. 准备长期使用：完成 Key 轮换、权限和备份检查。

> 产品更新速度很快。本文只依据各项目官方文档和官方仓库整理；若界面与教程不一致，请提交 Issue，并附工具版本、操作系统和脱敏截图。
