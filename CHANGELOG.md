# 更新记录

本项目使用日期记录文档批次。产品界面和 API 能力变化很快，具体教程中的“最后核验”日期比本页更重要。

## 2026-07-24

### 第十阶段：本地推理、Agent 框架与多平台机器人

- 新增 Qoder CLI 教程，纠正“完全不支持自定义模型”的旧结论，说明受控 Custom Models、Credits 与 Teams 边界；
- 新增 Google Antigravity 教程，覆盖 Agent Manager、模型选择、MCP、安全审核和当前自定义主模型边界；
- 新增 OpenClaw、AstrBot 与 LangBot 教程，覆盖模型 Provider、Gateway、聊天平台、Pipeline、Docker 网络与权限；
- 新增 Pot 划词翻译与 OCR 教程，覆盖 OpenAI 服务、快捷键、多服务并行和本地 HTTP 调用；
- 新增 vLLM 与 Xinference 本地推理教程，覆盖 Chat、Embedding、Rerank、工具调用、显存和生产安全；
- 新增 LangGraph 1.x 教程，使用当前 `create_agent`、StateGraph、InMemorySaver 与 PostgreSQL checkpointer；
- 新增 Embedding 与 Rerank 指南，覆盖向量维度、切块、两阶段检索、评测和无中断索引迁移；
- 同步更新 README、在线首页、教程总目录、站点导航和兼容性矩阵；
- 中文文档达到 77 篇，覆盖 64 款工具、平台与开发框架。

### 第九阶段：本地模型与新一代 AI 编辑器

- 新增 Ollama 本地模型教程，覆盖安装、模型管理、OpenAI / Anthropic 兼容接口、Responses、Embedding、上下文和局域网安全；
- 新增 LM Studio 教程，覆盖图形化模型管理、原生 REST API、OpenAI / Anthropic 兼容端点、API Token、JIT 加载和 Docker 连接；
- 新增 TRAE 自定义模型教程，明确 v3.5.51 版本边界、Base URL 与完整 Endpoint 的区别、Agent 分层验证和 Key 轮换；
- 新增 Windsurf BYOK 教程，依据官方资料明确个人用户、受支持模型与“非通用自定义 Base URL”的限制；
- 新增 Kiro 规范驱动开发教程，覆盖 Specs、Steering、Hooks、MCP、任务审核，并移除无官方依据的通用自定义端点说法；
- 新增 VS Code / GitHub Copilot BYOK 教程，区分 BYOK Chat 与 Copilot 订阅，覆盖 Custom Endpoint 的 Chat、Responses 和 Messages；
- 新增 Claude Code 进阶教程，按当前官方机制重写 CLAUDE.md、Rules、Auto Memory、Skills、Hooks 和 Subagents；
- 新增 AI 编程用量与成本优化，覆盖 ccusage 多数据源、报表、估算边界、上下文与缓存优化；
- 同步更新 README、在线首页、教程总目录、站点导航和兼容性矩阵；
- 中文文档达到 67 篇，覆盖 55 款工具、平台与开发框架。

## 2026-07-23

### 第八阶段：MCP、安全与稳定性基础

- 新增 MCP 入门与安全配置，解释 Tools、Resources、Prompts、stdio、远程连接、最小权限和审批边界；
- 新增 API Key 安全与轮换，覆盖本地、CI、容器、无中断轮换、Git 泄露和应急处置；
- 新增 AI API 限流、重试与并发控制，覆盖 429、指数退避、抖动、队列、幂等、流中错误和重试预算；
- 依据 MCP、OpenAI、Anthropic 与 GitHub 官方资料重新组织全部内容；
- 同步更新 README、在线首页、教程总目录、站点导航和基础教程交叉链接；
- 中文文档达到 59 篇，继续覆盖 49 款工具、平台与开发框架。

## 2026-07-19

### 第七阶段：选择、成本与兼容性验收体系

- 新增“AI 订阅、官方 API 与兼容 API 怎么选”，明确聊天产品、开发接口、兼容服务和本地模型的适用边界；
- 新增兼容 API 上线验收清单，覆盖协议、流式、工具调用、账单、稳定性、密钥、数据和退出方案；
- 新增 Token、上下文与 Agent 成本教程，补齐多轮对话、工具循环、RAG、缓存和预算计算；
- 新增流式输出、工具调用与长上下文完整测试，提供 Chat Completions、Responses、Messages 和编程 Agent 的分层测试方法；
- 全部内容依据官方文档重新组织，不包含账号共享、会话令牌提取或平台规则绕过步骤；
- 同步更新 README、在线首页、教程总目录、站点导航和兼容性矩阵；
- 中文文档达到 56 篇，继续覆盖 49 款工具、平台与开发框架。

## 2026-07-15

### 第六阶段：新一代桌面客户端与软件工程 Agent

- 新增 ChatWise 与 SillyTavern 自定义兼容 API 教程；
- 新增 Crush、OpenHands 与 AionUi 编程 Agent 配置、安全和工具调用验证教程；
- 同步更新 README、在线首页、教程总目录、站点导航和兼容性矩阵；
- 中文文档达到 52 篇，覆盖 49 款工具、平台与开发框架。

### 第五阶段：在线文档站与长期维护体系

- 使用 MkDocs Material 建设 GitHub Pages 中文文档站，增加站内搜索、中文导航、深浅色主题、移动端布局、站点地图和社交分享元信息；
- 新增文档站首页、404 页面、教程模板、SEO robots 文件和 2:1 社交预览封面；
- 增加文档站严格构建、Pages 自动部署、每周外链巡检和 Dependabot；
- 补齐 Pull Request 模板、Issue 配置、社区行为准则与长期维护手册；
- 将教程总目录改为中文文件名，并统一各教程的返回入口。

### 第四阶段：终端 Agent、Agent 框架与 API 调试

- 新增 Qwen Code 与 Gemini CLI 自定义 API 教程，明确 OpenAI、Anthropic、Gemini 原生协议边界；
- 新增 OpenAI Agents SDK、PydanticAI 与 CrewAI 开发指南；
- 新建 API 测试与调试分类，加入 Apifox / Postman 的 Models、Chat、Responses、SSE 和 Function Calling 测试流程；
- 同步更新首页、总目录与兼容性矩阵；
- 中文文档达到 47 篇，覆盖 44 款工具、平台与开发框架。

## 2026-07-14

### 第一阶段：建立完整教程框架

- 发布 Cherry Studio、Chatbox、Claude Code、Codex CLI 和 Open WebUI 完整教程；
- 增加 README 快速开始、通用问题和 NexoToken 配套入口；
- 添加 MIT License。

### 第二阶段：分类与主流工具覆盖

- 按聊天客户端、编程工具、自部署平台、效率工具和基础知识重构目录；
- 新增 LobeChat、NextChat、Cursor、Cline、Continue、CC Switch、LibreChat、AnythingLLM、Dify、FastGPT、沉浸式翻译；
- 将停止运营的 Roo Code 标记为历史迁移资料；
- 新增 API 基础、17 款工具兼容性总表和通用排错手册；
- 更新 GitHub About、Homepage 和 Topics。

### 第三阶段：生态扩充

- 新增 Jan、Msty Studio、TypingMind、BoltAI 和 Obsidian Copilot；
- 新增 Aider、OpenCode、Kilo Code、Zed 和 goose 编程工具教程；
- 新增 n8n、Flowise、Langflow、RAGFlow 和 MaxKB 平台教程；
- 新增 OpenAI Python/Node SDK、LangChain、LlamaIndex、Vercel AI SDK 和 Spring AI 开发指南；
- 新增分类总索引、贡献规范、安全说明和结构化 Issue 模板；
- 教程正文达到 40 篇、覆盖 37 款工具/平台/框架，合计超过 10,000 行；
- 所有新增教程继续以官方资料为依据，并统一执行链接、敏感信息和 Markdown 校验。
