---
title: 中文 AI API 接入教程
description: 从零配置 Claude Code、Codex CLI、Qwen Code、Gemini CLI、Cherry Studio、Dify 和主流 AI 工具的自定义 API。
---

# 中文 AI API 接入教程

<section class="hero" markdown>

<span class="hero__eyebrow">持续更新 · 面向中文用户</span>

## 一把 Key，接入你真正使用的 AI 工具

这里整理了 **47 篇中文实操文档**，覆盖 AI 编程工具、聊天客户端、开发框架、知识库、自动化平台与 API 调试。每篇教程都从安装讲到首次请求，并把 401、404、429、协议不匹配和流式输出等高频问题讲清楚。

<div class="hero__actions">
  <a class="md-button md-button--primary" href="教程总目录/">浏览全部教程</a>
  <a class="md-button hero__service-button" href="https://www.nexotoken.net/?ref=github-pages-hero">获取 API Key</a>
</div>

</section>

<div class="trust-row" markdown>

**47 篇中文文档** · **44 款工具与框架** · **安装、配置、验证、排错一页讲完**

</div>

## 新手第一次接 API？

按这个顺序最省时间：

1. 阅读 [API 接入基础](basics/api-basics.md)，弄清 Base URL、API Key、模型 ID 和三类常见协议。
2. 打开 [兼容性总表](basics/compatibility-matrix.md)，确认你的工具需要 Chat Completions、Responses 还是 Messages。
3. 从下方选择工具，照着教程完成一次最小请求。
4. 遇到状态码或流式问题，直接查 [通用排错手册](basics/troubleshooting.md)。

## 按使用场景选择教程

<div class="guide-grid" markdown>

<a class="guide-card" href="coding-tools/claude-code/">
  <span class="guide-card__icon">⌨️</span>
  <strong>AI 编程工具</strong>
  <span>Claude Code、Codex CLI、Qwen Code、Gemini CLI、Aider 等</span>
</a>

<a class="guide-card" href="chat-clients/cherry-studio/">
  <span class="guide-card__icon">💬</span>
  <strong>聊天客户端</strong>
  <span>Cherry Studio、Chatbox、LobeChat、NextChat 等</span>
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
| [Codex CLI](coding-tools/codex-cli.md) | 使用终端编程代理 | OpenAI Responses |
| [Cherry Studio](chat-clients/cherry-studio.md) | 第一次配置桌面客户端 | 多 Provider |
| [Dify](self-hosted/dify.md) | 搭建知识库与工作流 | Chat / Embedding / Rerank |
| [OpenAI SDK](developer-integration/openai-sdk.md) | Python / Node.js 开发者 | Responses / Chat |
| [Apifox / Postman](api-testing/apifox-postman.md) | 想先验证接口是否正常 | Models / Chat / Responses |

## 教程内容原则

- **真实可执行：** 命令、路径和字段都尽量对照当前官方文档核验。
- **先讲兼容边界：** 不把 Chat Completions、Responses 和 Messages 混为一谈。
- **先验证再扩展：** 每篇先完成最小请求，再介绍流式、工具调用、RAG 等能力。
- **不泄露密钥：** 示例使用明显占位符，提醒读者避免把完整 Key 发到 Issue 或截图里。
- **欢迎纠错：** 发现界面或字段变化，可以直接[提交教程纠错](https://github.com/18534516725/llm-api-setup-guides/issues/new?template=guide-correction.yml)。

想一次看完全部分类？进入[中文教程总目录](教程总目录.md)。
