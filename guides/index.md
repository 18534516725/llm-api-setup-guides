---
title: 中文 AI API 接入教程
description: 88 篇中文 AI API 中转、Base URL、Codex、Claude Code、Cursor、Cherry Studio 与主流工具配置和排错教程。
---

# 中文 AI API 接入教程

<section class="hero" markdown>

<span class="hero__eyebrow">持续更新 · 面向中文用户</span>

## 一把 Key，接入你真正使用的 AI 工具

这里整理了 **88 篇中文实操文档**，覆盖 AI 编程工具、本地模型、聊天客户端、开发框架、知识库、自动化平台、可观测性与自动化评测。每篇教程都从安装讲到首次请求，并把密钥安全、MCP 权限、401、404、429、协议不匹配和流式输出等高频问题讲清楚。

<div class="hero__actions">
  <a class="md-button md-button--primary" href="教程总目录/">浏览全部教程</a>
  <a class="md-button hero__service-button" href="https://www.nexotoken.net/?ref=github-pages-hero">获取 API Key</a>
</div>

</section>

<div class="trust-row" markdown>

**88 篇中文文档** · **74 款工具与框架** · **选择、配置、安全、验证、成本、排错一页讲完**

</div>

## 本地诊断与项目证据

需要在 Codex、Claude Code 等 AI 编程客户端中核对任务进度、Token、费用精度和跨客户端交接时，可以使用 [Agent Doctor by NexoToken](https://www.nexotoken.net/official/tools/agent-doctor?ref=docs-guide)。它在本机运行并将数据保存在本地 SQLite；源码、安装包和反馈入口位于 [Agent Doctor GitHub 仓库](https://github.com/18534516725/Agent-Doctor)。

## 新手第一次接 API？

按这个顺序最省时间：

1. 不确定服务怎么选时，先看 [API 中转站是什么、怎么用、怎么选](basics/api-relay-guide.md)。
2. 阅读 [API 接入基础](basics/api-basics.md)，弄清 Base URL、API Key、模型 ID 和三类常见协议。
3. 还没决定买什么时，查看[订阅、官方 API 与兼容 API 怎么选](basics/subscription-api-selection.md)。
4. 打开 [兼容性总表](basics/compatibility-matrix.md)，确认目标工具需要 Chat Completions、Responses 还是 Messages。
5. 从下方选择工具，照着教程完成一次最小请求。
6. 长期使用前完成[兼容 API 上线验收](basics/compatible-api-evaluation.md)和[成本测算](basics/token-context-agent-cost.md)。
7. 使用工具扩展时先读 [MCP 入门与安全配置](basics/mcp-basics-security.md)，上线前完成 [Key 安全](basics/api-key-security-rotation.md)与[重试控制](basics/rate-limits-retries.md)。
8. 遇到状态码或流式问题，直接查 [通用排错手册](basics/troubleshooting.md)。

## 按问题快速找到教程

| 问题 | 主教程 |
|---|---|
| 服务选择、使用流程与风险检查 | [API 中转站完整指南](basics/api-relay-guide.md) |
| Base URL、Key、模型 ID 与协议 | [API 接入基础](basics/api-basics.md) |
| Codex API 配置 | [Codex CLI](coding-tools/codex-cli.md) |
| Claude Code API 配置与连接错误 | [Claude Code](coding-tools/claude-code.md) |
| Cursor 或 Cherry Studio 配置 | [Cursor](coding-tools/cursor.md) · [Cherry Studio](chat-clients/cherry-studio.md) |
| 401、404、429、5xx 与 SSE | [通用排错手册](basics/troubleshooting.md) |

## 按使用场景选择教程

<div class="guide-grid" markdown>

<a class="guide-card" href="coding-tools/claude-code/">
  <span class="guide-card__icon">⌨️</span>
  <strong>AI 编程工具</strong>
  <span>Claude Code、Qoder CLI、Antigravity、Copilot BYOK、Kiro 等</span>
</a>

<a class="guide-card" href="local-models/ollama/">
  <span class="guide-card__icon">🧠</span>
  <strong>本地模型</strong>
  <span>Ollama、llama.cpp、LocalAI、vLLM、SGLang 与本地 API</span>
</a>

<a class="guide-card" href="chat-clients/cherry-studio/">
  <span class="guide-card__icon">💬</span>
  <strong>聊天客户端</strong>
  <span>Cherry Studio、ChatWise、SillyTavern、LobeChat 等</span>
</a>

<a class="guide-card" href="developer-integration/openai-sdk/">
  <span class="guide-card__icon">🧑‍💻</span>
  <strong>SDK 与 Agent</strong>
  <span>OpenAI SDK、Google ADK、Claude Agent SDK、LangGraph、smolagents</span>
</a>

<a class="guide-card" href="self-hosted/dify/">
  <span class="guide-card__icon">🏠</span>
  <strong>自托管与知识库</strong>
  <span>Dify、OpenClaw、AstrBot、LangBot、RAGFlow、MaxKB</span>
</a>

<a class="guide-card" href="automation-platforms/n8n/">
  <span class="guide-card__icon">🔄</span>
  <strong>自动化工作流</strong>
  <span>n8n、Flowise、Langflow 与 AI 工作流连接</span>
</a>

<a class="guide-card" href="api-testing/apifox-postman/">
  <span class="guide-card__icon">🧪</span>
  <strong>API 测试与排错</strong>
  <span>Apifox、Postman、Promptfoo、Ragas、SSE 与回归评测</span>
</a>

</div>

## 最常用的教程

| 教程 | 适合谁 | 关键协议 |
|---|---|---|
| [Claude Code](coding-tools/claude-code.md) | 需要终端 Agent 写代码 | Anthropic Messages |
| [Claude Code 进阶](coding-tools/claude-code-advanced.md) | 配置项目规则、Skills、Hooks 和 Subagents | Extensions / Permissions |
| [Codex CLI](coding-tools/codex-cli.md) | 使用终端编程代理 | OpenAI Responses |
| [Qoder CLI](coding-tools/qoder-cli.md) | 使用内置或受支持的 Custom Models | Qoder Provider / MCP |
| [vLLM](local-models/vllm.md) | 在 GPU 服务器部署兼容推理服务 | Chat / Responses / Embedding |
| [Xinference](local-models/xinference.md) | 统一管理 LLM、Embedding 与 Rerank | OpenAI-compatible / Rerank |
| [LiteLLM Proxy](self-hosted/litellm-proxy.md) | 统一多个模型端点与业务 Key | OpenAI-compatible Gateway |
| [SGLang](local-models/sglang.md) | 在 GPU 服务器部署高吞吐推理 | Chat / Reasoning / Tools |
| [VS Code / GitHub Copilot BYOK](coding-tools/github-copilot-byok.md) | 在 VS Code Chat 使用自己的模型 | Chat / Responses / Messages |
| [Kiro](coding-tools/kiro.md) | 先写需求、设计与任务再编码 | Specs / Hooks / MCP |
| [Cherry Studio](chat-clients/cherry-studio.md) | 第一次配置桌面客户端 | 多 Provider |
| [Dify](self-hosted/dify.md) | 搭建知识库与工作流 | Chat / Embedding / Rerank |
| [OpenAI SDK](developer-integration/openai-sdk.md) | Python / Node.js 开发者 | Responses / Chat |
| [Google ADK](developer-integration/google-adk.md) | 构建、调试和评测工具型 Agent | Tools / Session / Eval |
| [Langfuse](developer-integration/langfuse.md) | 追踪 LLM / Agent 的延迟、成本和质量 | Tracing / Evaluation |
| [Apifox / Postman](api-testing/apifox-postman.md) | 想先验证接口是否正常 | Models / Chat / Responses |
| [Promptfoo](api-testing/promptfoo.md) | 自动比较 Prompt、模型与 Agent | Assertions / Red Team |
| [Ragas](api-testing/ragas.md) | 定位 RAG 检索与幻觉问题 | Retrieval / Faithfulness |
| [兼容 API 上线验收](basics/compatible-api-evaluation.md) | 准备长期使用或部署应用 | 协议 / 用量 / 稳定性 / 安全 |
| [流式、工具与长上下文测试](basics/streaming-tools-context-testing.md) | 普通聊天成功但 Agent 仍不可用 | SSE / Tools / Context |
| [MCP 入门与安全配置](basics/mcp-basics-security.md) | 给 AI 客户端连接外部工具与数据 | Tools / Resources / Permissions |
| [API Key 安全与轮换](basics/api-key-security-rotation.md) | 本地、CI 和生产环境管理凭据 | Secrets / Rotation / Incident |
| [限流、重试与并发控制](basics/rate-limits-retries.md) | 解决 429、批处理和偶发 5xx | Retry / Backoff / Idempotency |
| [AI 编程用量与成本优化](basics/ai-coding-usage-cost.md) | 分析 Agent CLI Token 与估算成本 | ccusage / Usage / Context |

## 教程内容原则

- **真实可执行：** 命令、路径和字段都尽量对照当前官方文档核验。
- **先讲兼容边界：** 不把 Chat Completions、Responses 和 Messages 混为一谈。
- **先验证再扩展：** 每篇先完成最小请求，再介绍流式、工具调用、RAG 等能力。
- **不泄露密钥：** 示例使用明显占位符，提醒读者避免把完整 Key 发到 Issue 或截图里。
- **欢迎纠错：** 发现界面或字段变化，可以直接[提交教程纠错](https://github.com/18534516725/llm-api-setup-guides/issues/new?template=guide-correction.yml)。

想一次看完全部分类？进入[中文教程总目录](教程总目录.md)。
