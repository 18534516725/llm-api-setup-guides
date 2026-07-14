# 主流 AI 工具自定义 API 兼容性总表

> 最后核验：2026-07-14

> [!TIP]
> 想先低成本验证工具是否接得通，可以使用 [纽智中转站](https://www.nexotoken.net/?ref=github)：每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。活动与模型状态以官网实时页面为准。

[← 返回教程目录](../../README.md)

这张表回答三个问题：**该选哪个工具、它需要什么协议、接入后哪些能力还要单独验证。**“支持自定义 API”只代表存在配置入口，不代表聊天、图片、工具调用、知识库和 Agent 全部兼容。

## 1. 一眼选工具

| 你的需求 | 优先查看 | 备选 |
|---|---|---|
| 新手桌面聊天 | [Cherry Studio](../chat-clients/cherry-studio.md)、[Chatbox](../chat-clients/chatbox.md) | [LobeChat](../chat-clients/lobechat.md) |
| 浏览器或 PWA 聊天 | [LobeChat](../chat-clients/lobechat.md)、[NextChat](../chat-clients/nextchat.md) | [Open WebUI](../self-hosted/open-webui.md) |
| 终端 AI 编程 | [Claude Code](../coding-tools/claude-code.md)、[Codex CLI](../coding-tools/codex-cli.md) | — |
| VS Code 编程代理 | [Cline](../coding-tools/cline.md)、[Continue](../coding-tools/continue.md) | Roo Code 已停运，不建议新装 |
| AI 编辑器 | [Cursor](../coding-tools/cursor.md) | 先阅读其自定义 API 限制 |
| 多套编程 API 配置切换 | [CC Switch](../coding-tools/cc-switch.md) | 它不是聊天客户端 |
| 多用户自部署聊天 | [Open WebUI](../self-hosted/open-webui.md)、[LibreChat](../self-hosted/librechat.md) | [LobeChat](../chat-clients/lobechat.md) |
| 本地文档与知识库 | [AnythingLLM](../self-hosted/anythingllm.md) | [Dify](../self-hosted/dify.md)、[FastGPT](../self-hosted/fastgpt.md) |
| 工作流与 AI 应用 | [Dify](../self-hosted/dify.md) | [FastGPT](../self-hosted/fastgpt.md) |
| 企业知识库问答 | [FastGPT](../self-hosted/fastgpt.md) | [Dify](../self-hosted/dify.md) |
| 网页与文档双语翻译 | [沉浸式翻译](../productivity-tools/immersive-translate.md) | — |

## 2. 聊天客户端

| 工具 | 运行方式 | 主要自定义入口 | 典型协议 | 关键提醒 |
|---|---|---|---|---|
| Cherry Studio | Windows / macOS / Linux | 自定义供应商 | OpenAI Chat Completions | 模型 ID 需与控制台一致；多模态、工具调用分别测试 |
| Chatbox | 桌面 / Web / 移动端 | OpenAI API Compatible | OpenAI Chat Completions | 注意 Host 是否需要 `/v1`，以界面最终请求规则为准 |
| LobeChat | Web / PWA / Docker | OpenAI-compatible provider | OpenAI 兼容接口 | 客户端和服务端部署模式的环境变量、密钥保存位置不同 |
| NextChat | Web / PWA / Docker | 环境变量或部署配置 | OpenAI Chat Completions | 公网部署必须设置访问密码并保护服务端环境变量 |

### 适合谁

- **Cherry Studio**：希望在一个桌面应用里管理多个服务和模型；
- **Chatbox**：只想快速聊天、界面简单、本地优先；
- **LobeChat**：重视 Web 体验、PWA、会话与扩展能力；
- **NextChat**：想用较少配置部署一个轻量 Web 聊天界面。

## 3. AI 编程工具

| 工具 | 形态 | 主要协议/入口 | Agent 能力 | 最重要的限制 |
|---|---|---|---|---|
| Claude Code | 终端代理 | Anthropic Messages 兼容配置 | 原生 | 服务必须兼容 Claude Code 所需的 Messages 与工具调用语义 |
| Codex CLI | 终端代理 | OpenAI Responses | 原生 | 只支持 Chat Completions 的服务通常无法完整替代 Responses |
| Cursor | 独立编辑器 | BYOK / Override OpenAI Base URL | 部分取决于 Cursor | 自定义 Key 不代表全部 Agent、Tab 和专有功能都会走该地址 |
| Cline | VS Code 扩展 | OpenAI Compatible 等供应商入口 | 原生 | 首次先设保守审批规则，验证工具调用而不只是聊天 |
| Roo Code | 已停运的 VS Code 扩展 | 历史 OpenAI Compatible 配置 | 历史版本原生支持 | 仅供存量用户迁移；官方仓库已归档，不建议新装 |
| Continue | VS Code / JetBrains 扩展 | `config.yaml` 模型配置 | Chat / Agent / 补全按配置 | Chat、Autocomplete、Embedding、Reranker 是不同角色，需分别配置 |
| CC Switch | 桌面配置管理器 | 管理 Claude / Codex 等配置 | 不提供模型能力 | 它只切换配置；最终是否可用由目标 CLI 与 API 协议决定 |

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

### 自部署的最小验收

- 容器重启后配置和会话仍存在；
- 新用户看不到管理员 Key；
- 普通对话和流式输出正常；
- 知识库能导入、索引、检索并引用来源；
- 反向代理不会缓冲 SSE；
- 已备份配置、数据库和持久化卷，并验证恢复流程。

## 5. 效率工具

| 工具 | 场景 | 兼容入口 | 验证重点 |
|---|---|---|---|
| 沉浸式翻译 | 网页、PDF、字幕双语翻译 | OpenAI 兼容翻译服务 | 长文本分段、术语、并发、速率限制与隐私 |

翻译工具会把网页选中文本或文档片段发送给配置的 API。处理合同、病历、客户资料或公司内部页面前，先确认数据处理规则。

## 6. 协议覆盖速查

下表表示教程重点，不是对所有版本的永久能力承诺：

| 协议或能力 | 常见工具 |
|---|---|
| OpenAI Chat Completions | Cherry Studio、Chatbox、LobeChat、NextChat、Open WebUI、LibreChat、AnythingLLM、Dify、FastGPT、沉浸式翻译 |
| OpenAI Responses | Codex CLI；Continue 可按配置选择，需看服务与版本支持 |
| Anthropic Messages | Claude Code；部分多供应商客户端也可原生配置 Anthropic |
| Function Calling / 工具调用 | Cline、Continue、Claude Code、Codex CLI，以及部分聊天客户端；Roo Code 仅作历史资料 |
| Embeddings | AnythingLLM、Dify、FastGPT、Open WebUI 等知识库场景 |
| SSE 流式输出 | 大多数聊天和编程工具；反向代理配置会影响稳定性 |

## 7. Base URL 填写速查

| 输入框文字 | 通常填写 | 仍需确认 |
|---|---|---|
| Base URL / API Host | `https://your-api.example.com/v1` | 工具是否自动补 `/v1` |
| Chat Completions URL | `https://your-api.example.com/v1/chat/completions` | 是否明确要求完整端点 |
| Anthropic Base URL | 服务给出的 Messages 根地址 | 工具是否自动拼 `/v1/messages` |
| Responses Base URL | 服务给出的 API 根地址 | 是否实现 `/v1/responses` |

不要只看输入框名称猜地址。每篇教程都以对应工具的官方配置行为为准。

## 8. 能力验收清单

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

## 9. 本仓库的兼容性标注规则

- **官方支持**：产品官方文档明确给出该配置入口；
- **兼容入口**：官方提供通用 Base URL 或 OpenAI Compatible 设置，但不承诺所有第三方实现；
- **部分可用**：聊天能用，Agent、工具调用或专有能力可能不走自定义 API；
- **需要自部署**：环境变量或 YAML 配置只适用于自己部署的实例；
- **待复核**：界面或文档近期变化，教程会明确标注核验日期。

## 10. 推荐阅读顺序

1. 第一次接 API：先读 [API 接入基础](./api-basics.md)；
2. 在本页选择工具并进入对应完整教程；
3. 配置失败：查 [通用排错手册](./troubleshooting.md)；
4. 准备长期使用：完成 Key 轮换、权限和备份检查。

> 产品更新速度很快。本文只依据各项目官方文档和官方仓库整理；若界面与教程不一致，请提交 Issue，并附工具版本、操作系统和脱敏截图。
