<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=LLM%20API%20Setup%20Guides&fontSize=48&fontColor=fff&animation=fadeIn&fontAlignY=32&desc=%E4%B8%80%E6%8A%8A%20Key%EF%BC%8C%E7%8E%A9%E8%BD%AC%E6%89%80%E6%9C%89%20AI%20%E5%B7%A5%E5%85%B7&descSize=18&descAlignY=55" alt="LLM API Setup Guides" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=800&color=36BCF7&center=true&vCenter=true&width=760&lines=67+%E7%AF%87%E4%B8%AD%E6%96%87+AI+%E5%B7%A5%E5%85%B7%E4%BF%9D%E5%A7%86%E7%BA%A7%E6%8E%A5%E5%85%A5%E6%95%99%E7%A8%8B;%E5%AE%A2%E6%88%B7%E7%AB%AF+%2F+%E7%BC%96%E7%A8%8B%E4%BB%A3%E7%90%86+%2F+%E6%9C%AC%E5%9C%B0%E6%A8%A1%E5%9E%8B+%2F+RAG;%E6%8C%81%E7%BB%AD%E6%A0%B8%E5%AF%B9%E5%AE%98%E6%96%B9%E6%96%87%E6%A1%A3%EF%BC%8C%E6%AC%A2%E8%BF%8E+Star+%E2%AD%90" alt="Typing SVG" />

<br/>

[![GitHub stars](https://img.shields.io/github/stars/18534516725/llm-api-setup-guides?style=for-the-badge&logo=github&color=FFD700)](https://github.com/18534516725/llm-api-setup-guides)
[![Last commit](https://img.shields.io/github/last-commit/18534516725/llm-api-setup-guides?style=for-the-badge&color=32CD32)](https://github.com/18534516725/llm-api-setup-guides/commits)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](https://github.com/18534516725/llm-api-setup-guides/pulls)

<br/>

[🌐 在线文档站](https://18534516725.github.io/llm-api-setup-guides/) &nbsp;·&nbsp; [📖 教程目录](#-教程目录) &nbsp;·&nbsp; [🔑 快速开始](#quick-start) &nbsp;·&nbsp; [❓ 常见问题](#-常见问题所有工具通用) &nbsp;·&nbsp; [💬 交流群](#-交流与反馈)

</div>

---

# AI 客户端自定义 API / 中转 API 接入教程

<div align="center">

## 教程配套 API

本仓库适用于任何符合对应协议的 API。还没有测试 Key 时，可以使用 NexoToken 完成教程中的配置与验证。

[![获取配套 API Key](https://img.shields.io/badge/%E8%8E%B7%E5%8F%96%E9%85%8D%E5%A5%97_API_Key-%E6%9F%A5%E7%9C%8B%E6%8E%A5%E5%85%A5%E4%BF%A1%E6%81%AF-6C5CE7?style=for-the-badge)](https://www.nexotoken.net/?ref=github)

</div>

---

## 💡 这个仓库解决什么问题

你是否遇到过:

- 🤔 下载了 Cherry Studio / Chatbox,打开一脸懵,不知道 API Key 往哪填
- 😤 网上教程零散过时,照着配完一堆 401 / 404 报错
- 💸 想用 Claude / GPT 写代码,却卡在海外信用卡和网络环境上
- 🔀 每个工具配置方式都不一样,换个客户端就要重新摸索一遍

**本仓库把主流 AI 工具的接入方式全部整理成统一格式的详细教程**:
每篇都包含安装、配置、首次验证、安全提醒和常见报错排查,持续更新。

> ✅ 教程全部按公开标准协议编写,覆盖 OpenAI Chat Completions、OpenAI Responses 和 Anthropic Messages。使用前请确认服务支持对应工具所需的协议,再替换 Base URL、Key 和模型 ID。

---

## 📖 教程目录

> 当前共 **67 篇中文文档，覆盖 55 款工具、平台与开发框架**。不知道选哪个？先打开支持站内搜索的 **[在线中文文档站](https://18534516725.github.io/llm-api-setup-guides/)**，或查看 **[GitHub 教程总目录](./guides/教程总目录.md)** 和 **[兼容性总表](./guides/basics/compatibility-matrix.md)**。

### 💬 聊天客户端 `guides/chat-clients/`

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Cherry Studio](./guides/chat-clients/cherry-studio.md)** | 多模型桌面客户端，自定义供应商配置完整 | ⭐ | ✅ 已发布 |
| **[Chatbox](./guides/chat-clients/chatbox.md)** | 轻量、本地优先，适合第一次接 API | ⭐ | ✅ 已发布 |
| **[LobeChat](./guides/chat-clients/lobechat.md)** | Web / PWA / Docker，多服务商与扩展能力 | ⭐⭐ | ✅ 已发布 |
| **[NextChat](./guides/chat-clients/nextchat.md)** | 轻量 Web 客户端，适合快速私有部署 | ⭐⭐ | ✅ 已发布 |
| **[Jan 本地 AI 客户端](./guides/chat-clients/jan.md)** | 自定义端点、本地模型与远程兼容接口 | ⭐⭐ | ✅ 已发布 |
| **[Msty Studio AI 工作台](./guides/chat-clients/msty.md)** | 自带 Provider、多模型与知识管理 | ⭐⭐ | ✅ 已发布 |
| **[TypingMind 网页客户端](./guides/chat-clients/typingmind.md)** | 自定义完整 Endpoint 与 Web 配置 | ⭐⭐ | ✅ 已发布 |
| **[BoltAI macOS 客户端](./guides/chat-clients/boltai.md)** | 自定义 OpenAI-compatible Server | ⭐⭐ | ✅ 已发布 |
| **[ChatWise 桌面客户端](./guides/chat-clients/chatwise.md)** | OpenAI / Anthropic 兼容 Custom Provider | ⭐ | ✅ 已发布 |
| **[SillyTavern LLM 前端](./guides/chat-clients/sillytavern.md)** | 角色聊天与 Custom OpenAI-compatible Endpoint | ⭐⭐ | ✅ 已发布 |

### ⌨️ AI 编程工具 `guides/coding-tools/`

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Claude Code](./guides/coding-tools/claude-code.md)** | 终端编程代理，Anthropic Messages 兼容配置 | ⭐⭐ | ✅ 已发布 |
| **[Claude Code 进阶](./guides/coding-tools/claude-code-advanced.md)** | CLAUDE.md、Rules、Skills、Hooks 与 Subagents | ⭐⭐⭐ | ✅ 已发布 |
| **[Codex CLI](./guides/coding-tools/codex-cli.md)** | 终端编程代理，OpenAI Responses 协议 | ⭐⭐ | ✅ 已发布 |
| **[Qwen Code](./guides/coding-tools/qwen-code.md)** | OpenAI / Anthropic / Gemini 多 Provider 终端代理 | ⭐⭐ | ✅ 已发布 |
| **[Gemini CLI](./guides/coding-tools/gemini-cli.md)** | Gemini 原生 API、自定义 Base URL 与安全配置 | ⭐⭐ | ✅ 已发布 |
| **[VS Code / GitHub Copilot BYOK](./guides/coding-tools/github-copilot-byok.md)** | Custom Endpoint、三类协议与功能边界 | ⭐⭐ | ✅ 已发布 |
| **[Kiro](./guides/coding-tools/kiro.md)** | Specs、Steering、Hooks、MCP 与分阶段执行 | ⭐⭐ | ✅ 已发布 |
| **[TRAE IDE](./guides/coding-tools/trae.md)** | Custom Model、Base URL、Agent 验证与版本边界 | ⭐⭐ | ✅ 已发布 |
| **[Windsurf BYOK](./guides/coding-tools/windsurf.md)** | 官方 BYOK 范围、配置、安全与能力边界 | ⭐ | ✅ 已发布 |
| **[Cursor](./guides/coding-tools/cursor.md)** | BYOK、Override Base URL 与 Agent 限制说明 | ⭐⭐ | ✅ 已发布 |
| **[Cline](./guides/coding-tools/cline.md)** | VS Code 编程代理，OpenAI Compatible 接入 | ⭐⭐ | ✅ 已发布 |
| **[Roo Code（历史资料）](./guides/coding-tools/roo-code.md)** | 已停止运营；仅供存量用户迁移与排错 | — | ⚠️ 已停运 |
| **[Continue](./guides/coding-tools/continue.md)** | Chat、Agent、补全、Embedding 分角色配置 | ⭐⭐⭐ | ✅ 已发布 |
| **[CC Switch](./guides/coding-tools/cc-switch.md)** | Claude / Codex 等 CLI 配置管理与切换 | ⭐⭐ | ✅ 已发布 |
| **[Aider 终端编程助手](./guides/coding-tools/aider.md)** | Git 驱动的代码编辑与 Chat Completions | ⭐⭐ | ✅ 已发布 |
| **[OpenCode 终端编程代理](./guides/coding-tools/opencode.md)** | Chat Completions / Responses 分协议配置 | ⭐⭐⭐ | ✅ 已发布 |
| **[Crush 终端编程 Agent](./guides/coding-tools/crush.md)** | OpenAI / Anthropic 兼容 Provider 与工具验证 | ⭐⭐⭐ | ✅ 已发布 |
| **[OpenHands 软件工程 Agent](./guides/coding-tools/openhands.md)** | Local GUI、自定义模型、Docker 与 Base URL | ⭐⭐⭐ | ✅ 已发布 |
| **[AionUi 多 Agent 工作台](./guides/coding-tools/aionui.md)** | Custom 模型、工作区与外部 CLI 边界 | ⭐⭐ | ✅ 已发布 |
| **[Kilo Code 编程代理](./guides/coding-tools/kilo-code.md)** | VS Code、CLI 与自定义 Provider | ⭐⭐ | ✅ 已发布 |
| **[Zed 编辑器 AI 助手](./guides/coding-tools/zed.md)** | Agent、模型能力与协议切换 | ⭐⭐ | ✅ 已发布 |
| **[goose 开源编程代理](./guides/coding-tools/goose.md)** | 声明式 Provider 与完整聊天端点 | ⭐⭐⭐ | ✅ 已发布 |

### 🧠 本地模型 `guides/local-models/`

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Ollama](./guides/local-models/ollama.md)** | 本地模型、兼容 API、上下文与局域网安全 | ⭐⭐ | ✅ 已发布 |
| **[LM Studio](./guides/local-models/lm-studio.md)** | 图形化模型管理、API Server、认证与 JIT | ⭐⭐ | ✅ 已发布 |

### 🏠 自部署与知识库 `guides/self-hosted/`

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Open WebUI](./guides/self-hosted/open-webui.md)** | Docker 多用户聊天、连接与反向代理 | ⭐⭐⭐ | ✅ 已发布 |
| **[LibreChat](./guides/self-hosted/librechat.md)** | Custom Endpoints、YAML 与 Docker 部署 | ⭐⭐⭐ | ✅ 已发布 |
| **[AnythingLLM](./guides/self-hosted/anythingllm.md)** | 本地文档、工作区与 RAG 完整链路 | ⭐⭐ | ✅ 已发布 |
| **[Dify](./guides/self-hosted/dify.md)** | 模型插件、知识库、工作流与应用发布 | ⭐⭐⭐ | ✅ 已发布 |
| **[FastGPT](./guides/self-hosted/fastgpt.md)** | 模型渠道、Embedding、知识库与应用 API | ⭐⭐⭐ | ✅ 已发布 |
| **[RAGFlow 文档知识库](./guides/self-hosted/ragflow.md)** | 模型、数据集、检索与 Agent | ⭐⭐⭐ | ✅ 已发布 |
| **[MaxKB 企业知识库](./guides/self-hosted/maxkb.md)** | 模型、知识库、智能体与应用发布 | ⭐⭐⭐ | ✅ 已发布 |

### 🔄 自动化与工作流 `guides/automation-platforms/`

| 工具 | 中文用途 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[n8n 自动化工作流](./guides/automation-platforms/n8n.md)** | AI 节点、RAG、Webhook 与凭据管理 | ⭐⭐⭐ | ✅ 已发布 |
| **[Flowise 可视化 AI 编排](./guides/automation-platforms/flowise.md)** | Chatflow、Agentflow、RAG 与 API 发布 | ⭐⭐⭐ | ✅ 已发布 |
| **[Langflow 可视化工作流](./guides/automation-platforms/langflow.md)** | Flow、组件、RAG 与 Webhook | ⭐⭐⭐ | ✅ 已发布 |

### 🧩 效率工具 `guides/productivity-tools/`

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[沉浸式翻译](./guides/productivity-tools/immersive-translate.md)** | 网页、PDF、字幕翻译与自定义 API | ⭐ | ✅ 已发布 |
| **[Obsidian Copilot 知识库助手](./guides/productivity-tools/obsidian-copilot.md)** | 自定义模型、Vault QA 与 CORS | ⭐⭐ | ✅ 已发布 |

### 🧑‍💻 SDK 与开发框架 `guides/developer-integration/`

| 文档 | 中文用途 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[OpenAI Python / Node.js SDK](./guides/developer-integration/openai-sdk.md)** | Responses、Chat、流式、重试与错误处理 | ⭐⭐ | ✅ 已发布 |
| **[LangChain 开发框架](./guides/developer-integration/langchain.md)** | Python / TypeScript、Tool Calling 与 Embedding | ⭐⭐⭐ | ✅ 已发布 |
| **[LlamaIndex RAG 框架](./guides/developer-integration/llamaindex.md)** | OpenAILike、向量索引与来源验证 | ⭐⭐⭐ | ✅ 已发布 |
| **[Vercel AI SDK](./guides/developer-integration/vercel-ai-sdk.md)** | Next.js 流式聊天、工具调用与 Provider | ⭐⭐⭐ | ✅ 已发布 |
| **[Spring AI Java 框架](./guides/developer-integration/spring-ai.md)** | Spring Boot、ChatClient 与生产部署 | ⭐⭐⭐ | ✅ 已发布 |
| **[OpenAI Agents SDK](./guides/developer-integration/openai-agents-sdk.md)** | Responses / Chat、自定义 Provider 与多 Agent | ⭐⭐⭐ | ✅ 已发布 |
| **[PydanticAI](./guides/developer-integration/pydantic-ai.md)** | 结构化输出、工具调用与 OpenAI-compatible API | ⭐⭐⭐ | ✅ 已发布 |
| **[CrewAI](./guides/developer-integration/crewai.md)** | 多 Agent、任务协作与自定义 LLM | ⭐⭐⭐ | ✅ 已发布 |

### 🧪 API 测试与调试 `guides/api-testing/`

| 文档 | 解决什么问题 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Apifox / Postman 测试 AI API](./guides/api-testing/apifox-postman.md)** | Models、Chat、Responses、SSE 与状态码排查 | ⭐⭐ | ✅ 已发布 |

### 📚 基础与排错 `guides/basics/`

| 文档 | 解决什么问题 |
|:---|:---|
| **[API 接入基础](./guides/basics/api-basics.md)** | Base URL、Key、模型 ID、Chat Completions、Responses、Messages |
| **[订阅、官方 API 与兼容 API 怎么选](./guides/basics/subscription-api-selection.md)** | 分清聊天订阅与 API，按聊天、开发、Agent 和私有部署场景决策 |
| **[兼容 API 上线验收](./guides/basics/compatible-api-evaluation.md)** | 协议、能力、账单、稳定性、密钥和数据安全评分 |
| **[Token、上下文与 Agent 成本](./guides/basics/token-context-agent-cost.md)** | 计算多轮对话、工具循环、RAG 与缓存的真实消耗 |
| **[流式、工具与长上下文测试](./guides/basics/streaming-tools-context-testing.md)** | SSE、Function Calling、上下文截断、Usage 与 Agent 完整测试 |
| **[MCP 入门与安全配置](./guides/basics/mcp-basics-security.md)** | Tools、Resources、Prompts、最小权限、审批和越界测试 |
| **[API Key 安全与轮换](./guides/basics/api-key-security-rotation.md)** | 环境变量、CI、容器、无中断轮换和泄露处置 |
| **[限流、重试与并发控制](./guides/basics/rate-limits-retries.md)** | 429、退避、队列、幂等、流式中断和重试预算 |
| **[AI 编程用量与成本优化](./guides/basics/ai-coding-usage-cost.md)** | ccusage、多工具报表、估算边界、上下文与成本优化 |
| **[兼容性总表](./guides/basics/compatibility-matrix.md)** | 按场景选工具，判断聊天、Agent、Embedding 和部署要求 |
| **[通用排错手册](./guides/basics/troubleshooting.md)** | 400 / 401 / 403 / 404 / 429 / 5xx、SSE、Docker、RAG 排错 |

> 📌 想要的工具不在列表里？[提交教程需求](https://github.com/18534516725/llm-api-setup-guides/issues/new)，请写明工具版本、官网地址和你希望配置的协议。

---

<a id="quick-start"></a>

## 🔑 开始之前:你需要一把 API Key

所有教程都需要 **Base URL + API Key + 准确的模型 ID**。不同工具使用的协议可能是 OpenAI Chat Completions、OpenAI Responses 或 Anthropic Messages,请以具体教程为准。获取途径任选:

| 途径 | 优点 | 门槛 |
|:---|:---|:---|
| **官方 API**<br>(OpenAI / Anthropic / Google) | 功能最全,第一手 | 海外信用卡 + 网络环境 |
| **聚合 / 中转服务** | 支付宝微信付款,国内直连,一把 Key 调多家模型 | 邮箱注册即可 |

本仓库教程示例使用 **[纽智中转站](https://www.nexotoken.net/?ref=github)** 演示。以下活动信息核验于 2026-07-14,后续规则以注册页和控制台实时展示为准:

- 🆓 新注册、未充值账户当前有每日 20 次免费额度,每日北京时间 00:00 重置
- 🧪 未充值账号当前可 **¥1 购买 300 积分**体验付费线路,适合低成本走完教程
- 📊 模型广场展示当前可用模型、价格与运行状态,并提供 Claude Code / Codex 兼容模型

> 💡 同一协议下的核心配置相近,但 Base URL、认证方式和模型能力仍可能不同。多比价、小额试用、按需选择,是这个领域的通用生存法则。

---

## ❓ 常见问题(所有工具通用)

<details>
<summary><b>🔴 报错 401 Unauthorized</b></summary>
<br/>

Key 复制不完整或已删除。回服务商后台重新复制完整 Key,注意首尾不要带空格。
</details>

<details>
<summary><b>🔴 报错 404 Not Found</b></summary>
<br/>

Base URL 填错。注意有的工具要填到 `/v1` 结尾,有的会自动补全,详见各工具教程中的填写说明。
</details>

<details>
<summary><b>🔴 提示"余额不足"但明明有免费额度</b></summary>
<br/>

部分服务的免费额度只在特定分组/模型生效。确认调用的模型在免费池内,或检查是否选对了分组。
</details>

<details>
<summary><b>🟡 响应很慢</b></summary>
<br/>

先换一个可用模型或稍后重试。若模型与服务商明确支持 prompt caching,长对话中的缓存读取通常比普通输入便宜,具体折扣与生效条件以当前价格文档为准。
</details>

---

## 💬 交流与反馈

- 🐛 教程有错、步骤过时 → [提 Issue](https://github.com/18534516725/llm-api-setup-guides/issues)
- ➕ 想补充其他工具的教程 → 欢迎 PR
- 💬 配置卡住了想找人问 → QQ 群 **822274386**,在线必回

## ⭐ 收藏这个仓库

如果这些教程帮到了你,点个 **Star** ⭐ 是最大的支持——也方便你下次换工具时找回这里。

[![Star this repository](https://img.shields.io/badge/Star-%E6%94%B6%E8%97%8F%E6%95%99%E7%A8%8B-FFD700?style=for-the-badge&logo=github)](https://github.com/18534516725/llm-api-setup-guides)

## 📄 License

MIT · 教程可自由转载,注明出处即可

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" alt="页面底部装饰" width="100%"/>

**由 [纽智中转站](https://www.nexotoken.net/?ref=github) 维护 · 持续更新中**

</div>
