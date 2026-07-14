# Dify 接入 OpenAI 兼容 API：模型、知识库与工作流完整教程

> 最后核验：2026-07-14
>
> 适用范围：Dify Cloud 与当前自托管版（插件化模型供应商界面）
>
> 推荐路径：先完成纯文本模型测试，再配置 Embedding、知识库和工作流

[← 返回教程目录](../../README.md)

> [!TIP]
> **还没有可用于 Dify 的 OpenAI 兼容 API？**
>
> 本教程可配合 **[纽智中转站](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。
>
> **[👉 注册并获取 API Key](https://www.nexotoken.net/?ref=github)**

## 1. Dify 适合什么场景

Dify 是面向 AI 应用的可视化开发平台，核心能力包括模型管理、提示词编排、Chatflow、Workflow、Agent、知识库/RAG、应用发布与运行日志。它适合：

- 做企业知识库问答、客服机器人和内部助手；
- 用可视化节点串联模型、条件、代码、HTTP 与工具；
- 给 Web 应用或后端提供统一的应用 API；
- 在一个工作区管理多个模型和多个应用；
- 需要私有化部署、团队协作或数据边界控制。

如果只需要个人聊天，桌面客户端更轻量；如果要把模型做成可复用业务流程，Dify 更合适。

## 2. 先理解三个概念

| 名称 | 在 Dify 中的作用 | 配置时最容易混淆的地方 |
|---|---|---|
| 模型供应商插件 | 连接模型 API | OpenAI 兼容接口应使用 `OpenAI-API-compatible` 插件 |
| 模型 | 一个可被节点选择的具体模型 ID | 名称必须与 API 控制台提供的 ID 完全一致 |
| 应用 | Chatbot、Agent、Chatflow 或 Workflow | 应用 API Key 与模型 API Key 不是同一个 Key |

模型 Key 用于 Dify 调用模型；应用 Key 用于外部系统调用已经发布的 Dify 应用。不要互换。

## 3. 准备信息

开始前准备：

- OpenAI 兼容 API Key；
- Base URL，例如 `https://<你的-api-域名>/v1`；
- 至少一个聊天模型 ID；
- 要做知识库时，另准备一个 Embedding 模型 ID；
- 自托管时准备 Docker、Docker Compose、域名、HTTPS 与备份空间。

URL 规则：

```text
推荐： https://<你的-api-域名>/v1
不要： https://<你的-api-域名>/v1/chat/completions
不要： https://<你的-api-域名>/v1/models
```

Dify 的插件会在 Base URL 后拼接具体端点。只有界面明确要求“完整请求 URL”时才填写完整端点。

## 4. 自托管 Dify（可选）

Dify Cloud 用户可直接跳到第 5 节。官方仓库给出的最低要求为 2 核 CPU、4 GiB 内存；实际运行知识库、插件和多用户任务时应预留更多资源。

```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
docker compose up -d
docker compose ps
```

首次安装通常访问：

```text
http://<服务器地址>/install
```

完成管理员初始化后再开放公网。部署时还应：

1. 修改 `.env` 中所有默认密钥和密码；
2. 使用 Nginx、Caddy 或负载均衡配置 HTTPS；
3. 只开放必要端口；
4. 限制后台管理入口；
5. 持久化并备份数据库、对象存储、向量库和 `.env`；
6. 生产环境固定版本，不直接长期追踪不确定的开发分支。

查看运行状态与日志：

```bash
docker compose ps
docker compose logs --tail=200 api worker plugin_daemon
```

服务名称可能随版本调整，以当前官方 `docker-compose.yaml` 为准。

## 5. 安装 OpenAI 兼容模型插件

当前 Dify 的模型接入采用插件机制：

1. 使用管理员或有权限的工作区账户登录；
2. 打开右上角头像或工作区菜单；
3. 进入 `设置` → `模型供应商`；
4. 如果列表中没有 `OpenAI-API-compatible`，进入插件市场；
5. 搜索并安装官方 `langgenius/openai_api_compatible` 插件；
6. 返回 `模型供应商`，找到 `OpenAI-API-compatible`。

安装插件会引入可执行代码。自托管环境应只安装可信发布者的插件，并在升级前查看权限与变更记录。

## 6. 添加聊天模型

点击 `添加模型`，按实际界面填写：

| 字段 | 建议值 |
|---|---|
| Model Type / 模型类型 | `LLM` |
| Model Name / 模型名称 | `<控制台中的精确模型ID>` |
| API Key | `<你的API-Key>` |
| Endpoint URL / URL | `https://<你的-api-域名>/v1` |
| Completion Mode | 优先 `Chat` |
| Context Size | 按模型资料填写，不确定时保守设置 |
| Max Tokens | 不超过模型输出上限 |
| Streaming | API 支持 SSE 流式时开启 |
| Vision / Tool Call | 只有模型和接口都支持时开启 |

保存时 Dify 会发起凭据验证。验证失败先检查 Key、URL 和模型 ID，不要靠反复打开能力开关碰运气。

### Chat 与 Completion 的区别

主流对话模型通常使用：

```text
POST /v1/chat/completions
```

只有明确使用旧式文本补全协议时才选 Completion。模式选错常表现为 404、请求结构错误或返回内容无法解析。

## 7. 最小化验证

不要一上来测试 Agent 或知识库。先创建一个最小应用：

1. 点击 `创建应用`；
2. 选择简单 Chatbot 或 Chatflow；
3. 在 LLM 节点选择新模型；
4. 提示词只写“请简短回答用户问题”；
5. 发送“只回复 OK”；
6. 确认正常返回、流式输出能结束；
7. 打开运行日志，核对模型、耗时和 Token 用量；
8. 回到 API 控制台核对对应请求。

如果非流式成功、流式失败，关闭 Streaming 再测，并检查接口是否返回标准 SSE 数据。

## 8. 配置 Embedding 模型

知识库的高质量索引需要 Embedding 模型，聊天模型不能直接替代它。

在 `OpenAI-API-compatible` 中再次添加模型：

| 字段 | 建议值 |
|---|---|
| Model Type | `Text Embedding` |
| Model Name | `<Embedding模型ID>` |
| API Key | `<你的API-Key>` |
| Endpoint URL | `https://<你的-api-域名>/v1` |

通常会调用：

```text
POST /v1/embeddings
```

重要限制：同一知识库建立索引后，不应随意更换向量维度不同的模型。要更换时，先在测试知识库验证，再重新索引全部文档。

## 9. 创建知识库与 RAG

1. 进入 `知识库`，新建知识库；
2. 上传一份内容明确、篇幅较短的测试文件；
3. 选择索引方式：
   - `高质量`：使用 Embedding，适合语义检索；
   - `经济`：偏关键词检索，资源需求较低；
4. 选择分段模式：普通文本、父子分段或问答分段；
5. 设置分段长度与重叠；
6. 选择已验证的 Embedding 模型；
7. 等待索引完成；
8. 先用知识库的召回测试检查命中片段；
9. 再把知识库绑定到应用的知识检索节点。

### 分段建议

- 产品说明、FAQ：以标题和自然段为边界；
- 长制度文档：可用父子分段，兼顾召回与上下文；
- 已有标准问答：可使用问答分段；
- 表格或扫描 PDF：先检查文本提取质量；
- 分段太短会丢上下文，太长会降低召回精度并增加 Token。

## 10. Rerank 与检索调优

如果接口另有兼容的 Rerank 模型，可在插件中按 `Rerank` 类型添加。没有 Rerank 也能完成基础 RAG。

推荐调优顺序：

1. 先检查文档解析和分段；
2. 再检查 Embedding 模型是否正确；
3. 使用召回测试观察 Top K 命中；
4. 再调整相似度阈值；
5. 最后才加入 Rerank；
6. 用固定问题集对比调整前后的答案与引用。

Rerank 只能重排已召回片段，不能修复完全没有召回到的内容。

## 11. Workflow / Chatflow 配置建议

稳定的工作流应逐层增加复杂度：

```text
开始 → LLM → 结束
开始 → 知识检索 → LLM → 结束
开始 → 条件判断 → 不同 LLM 分支 → 结束
```

每增加一个节点都单独运行一次。Agent 的工具调用依赖模型的 Tool Call 兼容性；普通聊天成功不代表工具调用、结构化输出、图片输入一定可用。

## 12. 参数怎么设置

| 参数 | 建议 |
|---|---|
| Temperature | 知识问答用较低值，创作用较高值 |
| Max Tokens | 设为满足输出的合理上限，避免无限放大成本 |
| Context | 给知识片段、历史消息和系统提示留出共同空间 |
| Vision | 仅在模型与接口都支持图片消息时开启 |
| Tool Call | 先用一个简单工具测试，再扩展工具集 |
| JSON 输出 | 先验证模型是否稳定遵守结构，再用于生产解析 |

模型能力开关是告诉 Dify“可以这样调用”，不会让不支持的接口凭空获得能力。

## 13. 常见错误

### 保存时提示 401

- Key 粘贴不完整或带空格；
- Key 已失效；
- 把 Dify 应用 Key 填成了模型 Key；
- Authorization 格式不被目标接口接受。

### 404 或 Not Found

- Base URL 漏了 `/v1`；
- Base URL 多写了 `/chat/completions`；
- Completion Mode 选错；
- 反向代理重写了路径。

### 模型验证通过，应用运行失败

- 验证请求和正式请求使用了不同能力；
- 开启了接口不支持的工具、视觉或 JSON 参数；
- 工作流引用了另一个未授权模型；
- 流式响应格式不兼容。

先关闭工具、图片、知识库和流式输出，回到最小纯文本请求定位。

### 知识库一直索引失败

- 未配置 Text Embedding 模型；
- 聊天可用但 `/embeddings` 不可用；
- 文档没有成功提取文本；
- Embedding 输入长度超过限制；
- 自托管实例的 Worker、对象存储或向量库异常。

### Docker 中访问宿主机接口失败

容器内的 `localhost` 指容器自己。Docker Desktop 常用：

```text
http://host.docker.internal:<端口>/v1
```

Linux 应使用可从容器网络访问的宿主机地址，并正确配置防火墙或 host-gateway。

### 429、超时或 5xx

- 降低工作流并发与批量任务速度；
- 缩短一次请求的上下文；
- 对可重试请求增加指数退避；
- 查看 Dify 运行日志与 API 控制台状态；
- 不要在客户端无限立即重试。

## 14. 安全清单

- 不把 API Key 写进提示词、代码节点输出或公开截图；
- 不把 `.env`、数据库备份和私钥提交到 Git；
- 为开发、测试、生产使用不同 Key；
- 给 Key 设置额度、权限和轮换周期；
- 公开应用使用 Dify 应用 API，不把模型 Key 发到浏览器；
- 定期检查运行日志、异常调用和插件权限；
- 对包含敏感信息的知识库设置最小可见范围；
- 公网部署启用 HTTPS、强密码、备份和访问控制。

## 15. 升级、备份与回滚

升级前必须保存：

- 当前 Dify 版本或 Git 标签；
- 当前 `docker-compose.yaml` 与 `.env`；
- PostgreSQL 数据；
- Redis、向量库、对象存储及持久化卷中需要保留的数据；
- 已安装插件与关键模型配置清单。

建议流程：

1. 阅读目标版本发布说明和升级说明；
2. 停止写入或安排维护窗口；
3. 完成一致性备份并验证可恢复；
4. 在测试环境用备份副本演练升级；
5. 生产升级后测试登录、模型、知识库、工作流和应用 API；
6. 出现不可接受问题时恢复旧版本 Compose/镜像和升级前数据快照。

不要只回退镜像而继续使用已被新版本迁移过的数据库。数据库结构不兼容时必须按官方升级说明恢复配套快照。

## 16. 官方资料

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify 官方 GitHub 与 Docker Compose 快速开始](https://github.com/langgenius/dify)
- [Dify Marketplace：OpenAI-API-compatible](https://marketplace.dify.ai/plugin/langgenius/openai_api_compatible)
- [Dify 模型供应商插件说明](https://docs.dify.ai/en/develop-plugin/dev-guides-and-walkthroughs/creating-new-model-provider)
- [Dify 知识库 API 字段说明](https://docs.dify.ai/api-reference/knowledge-bases/update-knowledge-base)

---

求助时请提供 Dify 版本、部署方式、插件版本、模型类型、脱敏后的 Base URL 结构、HTTP 状态码和最小复现步骤。务必删除 Key、Cookie、知识库原文和用户对话。
