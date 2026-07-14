# Flowise 接入 OpenAI 兼容 API：智能体工作流、RAG 与 API 发布完整教程

> 最后核验：2026-07-14
>
> 适用范围：Flowise 当前自托管版与 Flowise Cloud
>
> 推荐路径：聊天、Embedding、Rerank 分开验证后再组装 Agentflow

[← 返回教程目录](../../README.md)

> [!TIP]
> **需要可用于 Flowise 的 OpenAI 兼容 API？**
>
> 可配合 **[NexoToken（纽智中转站）](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。
>
> 套餐、模型、额度与活动规则可能变化，**以官网实时规则为准**。

## 1. 能力与兼容边界

Flowise 是可视化 AI 编排平台，提供 Chatflow、Agentflow、数据入库和 API 发布。官方 `ChatOpenAI` 文档明确支持自定义 Base URL、请求头和自定义模型名；官方也提供可填写 Base Path 的 OpenAI 兼容 Embedding 组件。

需要区分：

- 聊天通常调用 `/v1/chat/completions`；
- Embedding 调用 `/v1/embeddings`，模型与向量维度独立；
- Rerank 不是 OpenAI 标准能力，使用独立 Rerank 节点和凭据；
- Flowise 的 Chatflow API Key 与模型 API Key 用途不同，不能互换。

## 2. 准备信息

```text
Base URL: https://<你的-api-域名>/v1
聊天模型: <聊天模型ID>
Embedding 模型: <Embedding模型ID>
模型 API Key: <你的API-Key>
Flowise 地址: https://<你的-flowise-域名>
```

Base Path 不应包含 `/chat/completions` 或 `/embeddings`。只有具体节点明确要求完整 URL 时才填完整端点。

## 3. Docker 部署与持久化

```bash
git clone https://github.com/FlowiseAI/Flowise.git
cd Flowise/docker
cp .env.example .env
docker compose up -d
docker compose ps
```

默认访问 `http://<服务器地址>:3000`。官方 Docker 说明要求持久化 flows、日志、凭据和存储，`.env` 中至少核对：

```text
DATABASE_PATH=/root/.flowise
LOG_PATH=/root/.flowise/logs
SECRETKEY_PATH=/root/.flowise
BLOB_STORAGE_PATH=/root/.flowise/storage
```

Compose 应把 `/root/.flowise` 映射到卷或宿主机目录。生产环境建议使用 PostgreSQL、固定镜像版本、HTTPS 与反向代理，不直接暴露管理端口。

## 4. 配置聊天模型

1. 新建 Chatflow 或 Agentflow；
2. 添加 `ChatOpenAI`，未列出模型时使用 `ChatOpenAI Custom`；
3. 创建 OpenAI 凭据，Key 填 `<你的API-Key>`；
4. 展开 `Additional Parameters`；
5. `Base Path` 填 `https://<你的-api-域名>/v1`；
6. `Model Name` 填 `<聊天模型ID>`；
7. 额外 Header 只按服务正式文档添加。

最小链路：

```text
ChatOpenAI → LLM Chain / Conversation Chain
```

输入“只回复 OK”。确认普通文本成功后，再逐项测试 streaming、JSON、视觉和工具调用。不要因聊天成功就默认 Agent 工具调用兼容。

## 5. 配置 Embedding

使用 `OpenAI Embeddings` 或官方提供的可自定义 OpenAI 兼容 Embedding 节点：

| 字段 | 值 |
|---|---|
| API Key | `<Embedding专用API-Key>` |
| Base Path | `https://<你的-api-域名>/v1` |
| Model Name | `<Embedding模型ID>` |

最小入库链：

```text
Document Loader → Text Splitter → OpenAI Embeddings → Vector Store
```

先用一段唯一文本做 Upsert，再用同一向量库检索。生产环境为聊天和 Embedding 分配独立 Key；更换向量维度时重建索引。

## 6. 独立 Rerank 链路

Rerank 必须选择 Flowise 中与目标服务匹配的独立 reranker 组件，创建独立凭据，并先用 3～5 个候选文本验证排序：

```text
用户问题 + 初步召回片段 → Rerank → Top N 片段
```

没有官方匹配组件或正式 API 文档时跳过 Rerank。不要假定 OpenAI Base Path 自动提供 `/rerank`。Rerank 只能重排已召回内容，不能弥补完全漏召回。

## 7. 最小 RAG 与 Agentflow

先创建 Upsert 流程完成文档入库，再建立问答流：

```text
输入 → Retriever →（可选 Rerank）→ Prompt → ChatOpenAI → 输出
```

验证顺序：

1. 检索器直接命中测试原文；
2. LLM 使用命中片段回答；
3. 未命中时按提示明确“不知道”；
4. 记录引用、延迟与 Token；
5. 再增加工具、条件、循环和记忆。

Agentflow 中工具调用依赖模型兼容性。每次只加一个节点并重新测试，避免同时排查模型、向量库和工具。

## 8. API、Webhook 与访问控制

Flowise 的 flow 默认可能通过 Chatflow ID 被调用。官方建议在 Dashboard 的 `API Keys` 中创建 Key，并在对应 flow 里绑定。调用时发送：

```text
Authorization: Bearer <Flowise-Flow-API-Key>
```

安全要求：

- 模型 Key 只保存在 Credential，不能交给调用 Flow 的客户端；
- 为每个环境和调用方分配不同 Flow API Key；
- 启用 flow 级限流，反向代理同步设置请求体和速率限制；
- `NUMBER_OF_PROXIES` 应按实际可信代理层数校准，防止 IP 伪造；
- Webhook/Prediction 输入做长度、类型、文件和提示注入检查；
- 禁止在返回值中透出环境变量、节点内部错误或完整执行日志。

当前版本应用级认证采用账户登录机制。生产环境必须覆盖默认 JWT、refresh token、session 与 token hash secrets，关闭不安全的 TLS 选项。

## 9. Docker 网络

- 同一 Compose 网络：Base Path 使用模型服务名，如 `http://<model-api>:<端口>/v1`；
- Docker Desktop 访问宿主机：`http://host.docker.internal:<端口>/v1`；
- Linux：添加 host-gateway 或使用容器可达网关；
- 容器内 `localhost` 只指 Flowise 自身。

新版本可能启用更严格的 HTTP/SSRF 检查。应精确配置允许的内部目标，不要为了省事全局关闭安全检查。

## 10. 密钥与权限安全

Flowise 会用加密密钥保护第三方凭据。官方文档说明随机密钥保存在 `SECRETKEY_PATH`；路径或密钥丢失会出现“Credentials could not be decrypted”。因此：

- 持久化并备份 `SECRETKEY_PATH`；
- 可用 `FLOWISE_SECRETKEY_OVERWRITE` 固定强密钥，但必须进入秘密管理系统；
- 不把 `.env`、数据库、密钥或导出的 flow JSON 提交 Git；
- 最小化管理权限，限制自定义代码、HTTP 和文件节点；
- 删除 Flowise 中的凭据不会吊销外部 Key，仍需到密钥签发端轮换或删除。

## 11. 常见错误

### 认证失败：401 / 403

检查模型 Key 与 Flow API Key 是否混用、模型权限、Base Path、额外 Header 和 flow 是否绑定正确 Key。

### 路径不存在：404

通常是 Base Path 多写具体端点、漏 `/v1`、模型 ID 错误或反向代理改写路径。

### 聊天成功但 Embedding 失败

目标服务可能只兼容聊天；确认 `/v1/embeddings`、Embedding 模型权限、输入长度和向量维度。

### 凭据无法解密（Credentials could not be decrypted）

恢复原加密密钥和 `SECRETKEY_PATH`。不要反复生成新密钥，否则已有凭据仍无法解密。

### 容器重启后 flow 消失

检查 `/root/.flowise` 卷映射、数据库地址和文件权限。空数据库启动不等于旧数据被删除，先停止写入再定位原卷。

### 429 / 超时

降低 Upsert 批量和 Agentflow 并发；限制循环；对临时错误使用有上限退避；缩短检索 Top K 和上下文。

## 12. 备份、升级、回滚与卸载

官方数据库文档要求停应用、隔离写入、备份数据库并实际测试备份。至少保存：

- SQLite 文件或 PostgreSQL/MySQL 一致性备份；
- `/root/.flowise` 数据、日志与 blob；
- 加密密钥、`.env` 和 Compose；
- 关键 flow 导出及镜像标签。

升级流程：固定旧版本 → 备份并恢复演练 → 阅读发布说明 → 测试环境升级 → 拉取固定新镜像 → 验证登录、凭据、聊天、Embedding、RAG 与 API → 再切生产。

回滚必须恢复旧镜像与升级前数据库/卷快照。卸载前先验证备份；`docker compose down` 保留卷，`docker compose down -v` 会删除卷，后者只能在明确不再需要数据时使用。

## 13. 官方资料

- [Flowise 官方文档](https://docs.flowiseai.com/)
- [ChatOpenAI：自定义 Base URL 与模型](https://docs.flowiseai.com/integrations/langchain/chat-models/azure-chatopenai)
- [官方 Docker README](https://github.com/FlowiseAI/Flowise/blob/main/docker/README.md)
- [数据库与备份](https://docs.flowiseai.com/configuration/databases)
- [凭据加密环境变量](https://docs.flowiseai.com/configuration/environment-variables)
- [Flow 级 API Key](https://docs.flowiseai.com/configuration/authorization/chatflow-level)
- [Flow 限流](https://docs.flowiseai.com/configuration/rate-limit)
- [Flowise 官方 GitHub](https://github.com/FlowiseAI/Flowise)

---

**核验结论**：截至 2026-07-14，Flowise 官方文档明确支持 ChatOpenAI 自定义 Base Path、Header 与模型名，Embedding 也可独立配置兼容 Base Path；Rerank 必须作为独立链路配置。
