# 搜索意图关键词架构设计

## 目标

让 `18534516725/llm-api-setup-guides` 更准确覆盖中文开发者当前搜索的 AI API 中转、Codex、Claude Code、Base URL、兼容 API 与常见错误排查需求，同时保持教程真实、可执行，避免关键词堆砌和重复页面互相竞争。

## 数据来源与边界

- 2026-08-12 实时搜索联想：`API中转站怎么用/搭建/原理/使用教程`、`Codex API Key配置/获取/价格/中转`、`Claude Code API Key配置/API中转/400错误/连接失败`、`Codex中转站配置/教程/GitHub`、`OpenAI Compatible API URL/curl/endpoints`、`Cursor API配置`、`Cherry Studio API地址/连接失败`、`API Base URL是什么`。
- 当前搜索结果页面，用于判断搜索意图和竞争页面结构，不把结果排名误写成搜索量。
- Google Search Console 与 Bing Webmaster Tools 尚在积累数据，因此本轮不声称具体搜索量；后续以 Queries、Keyword Research 的真实曝光数据校准。
- 技术字段和操作步骤只采用对应项目的官方文档或仓库现有已核验内容，不虚构价格、稳定性、排名和服务承诺。

## 方案

### 1. 单一支柱页

新增 `guides/basics/api-relay-guide.md`，集中回答：

- API 中转站是什么、适合谁、怎么用；
- Base URL、API Key、模型 ID 和协议之间的关系；
- 如何按协议、能力、计费、稳定性、安全和账单选择；
- 如何用最小请求完成验证；
- 如何排查 401、404、429、5xx、流式和工具调用问题；
- 中转服务与官方 API、聊天订阅的区别。

该页不发布未经核验的站点排行榜，不堆供应商名称，不承诺最低价或稳定性。

### 2. 现有页面各自承接一个意图

- `api-basics.md`：API Base URL 是什么、OpenAI-compatible URL/endpoints/curl。
- `codex-cli.md`：Codex API Key、config.toml、Responses API、中转 API 配置。
- `claude-code.md`：Claude Code API Key、自定义 Base URL、Messages API、400/连接错误。
- `cursor.md`：Cursor API Key、Override Base URL、BYOK 能力边界。
- `cherry-studio.md`：Cherry Studio API 地址、密钥、连接失败。
- `troubleshooting.md`：401、404、429、5xx 与连接失败。

不为同一个关键词复制第二篇内容；使用支柱页与现有教程之间的上下文链接形成主题集群。

### 3. 仓库入口与元信息

- README 的 H1、首屏摘要、常见任务入口和 FAQ 明确覆盖核心搜索意图。
- GitHub Description、MkDocs `site_name`/`site_description`、文档首页口径统一为 88 篇中文文档、74 款工具与框架。
- GitHub Topics 保留工具生态词，并补充 `api-relay`、`codex-api`、`claude-api` 等高相关主题。
- README 和文档站都突出“配置、验证、排错”，不把教程仓库伪装成无依据排行榜。

### 4. 质量保护

新增自动测试确保：

- README、文档首页和仓库描述的篇数一致；
- 新支柱页进入 README、文档首页、总目录和 MkDocs 导航；
- 六个核心页面各有唯一主标题、描述、FAQ 和上下文内链；
- 不出现秘密值、未核验排名或机械重复关键词；
- MkDocs 严格构建及现有双向链接测试通过。

## 成功标准

发布后仓库结构能明确回答核心搜索问题，页面之间没有重复竞争；GitHub 和文档站元信息一致；自动测试通过。实际排名效果在 Search Console/Bing 数据形成后，以曝光词、平均排名、点击率和收录页数评估，不提前承诺排名提升。
