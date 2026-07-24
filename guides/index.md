---
title: 中文 AI API 接入教程
description: 从零配置 Claude Code、Codex CLI、Qwen Code、Gemini CLI、Cherry Studio、Dify 和主流 AI 工具的自定义 API。
---

# 中文 AI API 接入教程

<section class="hero" markdown>

<span class="hero__eyebrow">持续更新 · 面向中文用户</span>

## 一把 Key，接入你真正使用的 AI 工具

这里整理了 **67 篇中文实操文档**，覆盖 AI 编程工具、本地模型、聊天客户端、开发框架、知识库、自动化平台与 API 调试。每篇教程都从安装讲到首次请求，并把密钥安全、MCP 权限、401、404、429、协议不匹配和流式输出等高频问题讲清楚。

<div class="hero__actions">
  <a class="md-button md-button--primary" href="教程总目录/">浏览全部教程</a>
  <a class="md-button hero__service-button" href="https://www.nexotoken.net/?ref=github-pages-hero">获取 API Key</a>
</div>

</section>

<div class="trust-row" markdown>

**67 篇中文文档** · **55 款工具与框架** · **选择、配置、安全、验证、成本、排错一页讲完**

</div>

## 新手第一次接 API？

按这个顺序最省时间：

1. 阅读 [API 接入基础](basics/api-basics.md)，弄清 Base URL、API Key、模型 ID 和三类常见协议。
2. 还没决定买什么时，先看[订阅、官方 API 与兼容 API 怎么选](basics/subscription-api-selection.md)。
3. 打开 [兼容性总表](basics/compatibility-matrix.md)，确认目标工具需要 Chat Completions、Responses 还是 Messages。
4. 从下方选择工具，照着教程完成一次最小请求。
5. 长期使用前完成[兼容 API 上线验收](basics/compatible-api-evaluation.md)和[成本测算](basics/token-context-agent-cost.md)。
6. 使用工具扩展时先读 [MCP 入门与安全配置](basics/mcp-basics-security.md)，上线前完成 [Key 安全](basics/api-key-security-rotation.md)与[重试控制](basics/rate-limits-retries.md)。
7. 遇到状态码或流式问题，直接查 [通用排错手册](basics/troubleshooting.md)。

## 按使用场景选择教程

<div class="guide-grid" markdown>

<a class="guide-card" href="coding-tools/claude-code/">
  <span class="guide-card__icon">⌨️</span>
  <strong>AI 编程工具</strong>
  <span>Claude Code、Copilot BYOK、Kiro、TRAE、Windsurf 等</span>
</a>

<a class="guide-card" href="local-models/ollama/">
  <span class="guide-card__icon">🧠</span>
  <strong>本地模型</strong>
  <span>Ollama、LM Studio、本地 API、局域网与资源配置</span>
</a>

<a class="guide-card" href="chat-clients/cherry-studio/">
  <span class="guide-card__icon">💬</span>
  <strong>聊天客户端</strong>
  <span>Cherry Studio、ChatWise、SillyTavern、LobeChat 等</span>
</a>

<a class="guide-card" href="developer-integration/openai-sdk/">
  <span class="guide-card__icon">🧑‍💻</span>
  <strong>SDK 与 Agent</strong>
  <span>OpenAI SDK、Agents SDK、LangChain、PydanticAI、CrewAI</span>
</a>

<a class="guide-card" href="self-hosted/dify/">
  <span class="guide-card__icon">🏠</span>
  <strong>自托管与知识库</strong>
  <span>Dify、Open WebUI、RAGFlow、AnythingLLM、MaxKB</span>
</a>

<a class="guide-card" href="automation-platforms/n8n/">
  <span class="guide-card__icon">🔄</span>
  <strong>自动化工作流</strong>
  <span>n8n、Flowise、Langflow 与 AI 工作流连接</span>
</a>

<a class="guide-card" href="api-testing/apifox-postman/">
  <span class="guide-card__icon">🧪</span>
  <strong>API 测试与排错</strong>
  <span>Apifox、Postman、cURL、SSE 与状态码定位</span>
</a>

</div>

## 最常用的教程

| 教程 | 适合谁 | 关键协议 |
|---|---|---|
| [Claude Code](coding-tools/claude-code.md) | 需要终端 Agent 写代码 | Anthropic Messages |
| [Claude Code 进阶](coding-tools/claude-code-advanced.md) | 配置项目规则、Skills、Hooks 和 Subagents | Extensions / Permissions |
| [Codex CLI](coding-tools/codex-cli.md) | 使用终端编程代理 | OpenAI Responses |
| [VS Code / GitHub Copilot BYOK](coding-tools/github-copilot-byok.md) | 在 VS Code Chat 使用自己的模型 | Chat / Responses / Messages |
| [Kiro](coding-tools/kiro.md) | 先写需求、设计与任务再编码 | Specs / Hooks / MCP |
| [Cherry Studio](chat-clients/cherry-studio.md) | 第一次配置桌面客户端 | 多 Provider |
| [Dify](self-hosted/dify.md) | 搭建知识库与工作流 | Chat / Embedding / Rerank |
| [OpenAI SDK](developer-integration/openai-sdk.md) | Python / Node.js 开发者 | Responses / Chat |
| [Apifox / Postman](api-testing/apifox-postman.md) | 想先验证接口是否正常 | Models / Chat / Responses |
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
