# n8n 接入 OpenAI 兼容 API：自动化、RAG 与 Webhook 完整教程

> 最后核验：2026-07-14
>
> 适用范围：n8n Cloud 与当前自托管稳定版；界面名称可能随小版本调整
>
> 推荐路径：先验证聊天，再单独验证 Embedding，最后组合 RAG 与 Webhook

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 适用场景与边界

n8n 是通用工作流自动化平台。它的 AI 节点可以与 Webhook、定时任务、数据库、邮件和 SaaS 节点组合，适合自动摘要、内容分类、知识库问答和人工审批。

本教程只采用官方文档或官方仓库能确认的能力：

- 官方 `OpenAI` 凭据源码包含 `Base URL`，默认值为 OpenAI API 根路径，并允许覆盖；
- 同一凭据可供 `Chat OpenAI`、`Embeddings OpenAI` 等节点使用；
- OpenAI 兼容只表示请求协议相近，不保证 Responses API、工具调用、图片、结构化输出都兼容；
- OpenAI 标准没有通用 Rerank 端点。Rerank 必须使用 n8n 中相应的独立节点与独立凭据，或用 HTTP Request 调用已有正式文档的接口；不要猜端点。

## 2. 准备信息

准备以下占位信息：

| 项目 | 示例占位符 |
|---|---|
| API Key | `<你的API-Key>` |
| Base URL | `https://<你的-api-域名>/v1` |
| 聊天模型 | `<聊天模型ID>` |
| Embedding 模型 | `<Embedding模型ID>` |
| n8n 公网地址 | `https://<你的-n8n-域名>` |

Base URL 应停在版本根路径：

```text
正确： https://<你的-api-域名>/v1
错误： https://<你的-api-域名>/v1/chat/completions
错误： https://<你的-api-域名>/v1/models
```

n8n 的凭据测试会在 Base URL 后请求 `/models`。如果兼容服务没有实现模型列表，即使聊天端点可用，凭据测试也可能失败；此时应先用官方支持的节点运行最小工作流验证，不要降低 TLS 安全或暴露 Key。

## 3. 自托管安装与持久化

Cloud 用户可跳到第 4 节。官方 Docker 文档确认 `/home/node/.n8n` 必须持久化；即使使用 PostgreSQL，该目录仍可能包含加密密钥、日志与其他实例数据。

```bash
docker volume create n8n_data

docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -e TZ="Asia/Shanghai" \
  -e GENERIC_TIMEZONE="Asia/Shanghai" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RUNNERS_ENABLED=true \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n:<固定版本>
```

生产环境建议使用 PostgreSQL，并把数据库、`.n8n` 卷和 `N8N_ENCRYPTION_KEY` 一起纳入备份。首次启动后访问：

```text
http://<服务器地址>:5678
```

公网部署应置于可信反向代理后并启用 HTTPS。反向代理场景至少配置：

```text
WEBHOOK_URL=https://<你的-n8n-域名>/
N8N_PROXY_HOPS=1
```

最后一层代理需正确传递 `X-Forwarded-For`、`X-Forwarded-Host` 与 `X-Forwarded-Proto`。

## 4. 创建 OpenAI 凭据

1. 进入 `Credentials`，点击 `Create Credential`；
2. 搜索并选择 `OpenAI`；
3. `API Key` 填 `<你的API-Key>`；
4. `Base URL` 填 `https://<你的-api-域名>/v1`；
5. `Organization ID` 仅在目标服务明确要求时填写，否则留空；
6. 只有服务文档明确要求额外请求头时才启用 `Add Custom Header`；
7. 保存并记录该凭据的用途，例如“兼容 API－聊天与向量”。

不要把 API Key 放入 Set、Code、Webhook 输出或工作流名称。凭据对象会加密保存，工作流节点只引用凭据。

## 5. 聊天链路独立验证

创建最小工作流：

```text
Manual Trigger → Basic LLM Chain
                     ↑
               Chat OpenAI
```

配置 `Chat OpenAI`：

| 字段 | 建议值 |
|---|---|
| Credential | 第 4 节创建的 OpenAI 凭据 |
| Model | `<聊天模型ID>`；允许手填时使用精确 ID |
| Temperature | 首测设为较低值 |
| Max Tokens | 设合理上限 |

在 Basic LLM Chain 中输入“只回复 OK”，执行节点并确认：

- 返回正文为正常文本；
- 执行结束而不是一直等待流；
- 执行详情没有泄露凭据；
- 用量与延迟符合预期。

普通聊天成功不代表工具调用、JSON、图片或 Responses API 可用。每项高级能力都要单独建最小工作流。

## 6. Embedding 链路独立验证

添加 `Embeddings OpenAI` 节点，仍可引用 OpenAI 凭据，但生产环境建议为 Embedding 使用独立 Key，以便单独限额和轮换。

| 字段 | 建议值 |
|---|---|
| Model | `<Embedding模型ID>` |
| Credential | `<Embedding专用凭据>` |
| Batch Size | 首测保持小值 |

最小验证可使用支持插入和检索的向量存储节点：

```text
文档加载器 → 文本切分器 → Embeddings OpenAI → 向量存储（Insert Documents）
Manual Trigger → 向量存储（Retrieve）
```

先只插入一句唯一测试文本，再查询关键词。若插入成功但检索无结果，检查：

- 插入与检索是否使用同一向量库、集合和命名空间；
- 两端是否使用同一个 Embedding 模型；
- 向量维度是否一致；
- 文本切分是否产生空文档。

更换向量维度后必须重建索引，不能把新旧向量混在同一集合。

## 7. Rerank 独立链路

Rerank 不属于 OpenAI 通用协议。正确做法是：

1. 先让向量检索独立成功；
2. 在当前 n8n 版本的节点面板中选择正式提供的 reranker 节点；
3. 为该节点创建独立凭据；
4. 输入少量候选片段，观察排序是否符合预期；
5. 再接回完整 RAG 链。

如果当前版本没有与你的 Rerank 服务匹配的官方节点，也没有该服务的正式 API 文档，就跳过 Rerank。不要把 `https://<你的-api-域名>/v1/rerank` 当作必然存在的接口。

## 8. 最小 RAG 工作流

推荐拆成“入库”和“问答”两个工作流，便于独立重跑和限流。

入库流程：

```text
Manual/Schedule Trigger
  → 文档来源
  → 文本切分
  → Embeddings OpenAI
  → 持久化向量存储（Insert Documents）
```

问答流程：

```text
Chat Trigger
  → Vector Store Retriever
  →（可选：独立 Rerank）
  → Question and Answer Chain
  → Chat OpenAI
```

最小验收：

1. 文档写入一个唯一事实，如“测试项目代号是 `<唯一测试词>`”；
2. 从检索器直接查询，确认命中原文；
3. 再问模型对应问题；
4. 检查答案与引用片段一致；
5. 用一个文档中不存在的问题验证模型不会编造。

## 9. Webhook 发布与验证

开发时 Webhook 节点提供测试 URL，生产运行需发布/启用工作流后使用生产 URL。典型流程：

```text
Webhook → 校验请求 → AI/RAG 链 → Respond to Webhook
```

安全要求：

- Webhook 路径使用不可预测值，但不要把“隐蔽 URL”当作唯一认证；
- 在反向代理或工作流首节点校验签名、时间戳和重放窗口；
- 限制请求体大小、Content-Type、来源 IP 与速率；
- 不在响应中返回执行详情、内部 URL、凭据或原始异常；
- 测试 URL 不用于生产，生产工作流变更后重新核对 URL；
- 对外部回调使用幂等键，防止重复触发产生重复费用。

## 10. Docker 网络问题

容器内的 `localhost` 是 n8n 容器本身。

- 同一 Compose 网络中的服务：使用服务名，例如 `http://<api-service>:<端口>/v1`；
- Docker Desktop 访问宿主机：可用 `http://host.docker.internal:<端口>/v1`；
- Linux 可显式添加 `host.docker.internal:host-gateway`，或使用可达的网关地址；
- 跨主机服务：使用内网 DNS，并通过防火墙只开放必要源地址。

不要为了“连通”把管理接口和数据库直接暴露到公网。自签名证书报错应修复 CA 信任链，不应长期关闭证书校验。

## 11. 权限、密钥与执行数据安全

- 开发、测试、生产使用不同项目和 Key；
- 为聊天、Embedding、Rerank 分配独立 Key 与额度；
- 只向需要编辑节点的成员共享凭据；
- 限制工作流编辑权，因为表达式、Code 和 HTTP Request 节点可能读取或转发敏感数据；
- 定期运行 n8n 官方安全审计，检查无保护 Webhook、危险节点与过期实例；
- 设置执行数据保留策略，敏感请求避免长期保存成功执行详情；
- 轮换 Key 前先新增并验证，再替换引用，最后吊销旧 Key；
- 导出凭据时不要使用明文 `--decrypted`，除非在受控迁移窗口并立即安全删除文件。

## 12. 常见错误

### 认证失败：401 / 403

- Key 错误、过期或没有目标模型权限；
- Base URL 指向了错误环境；
- 误填 Organization ID；
- 额外 Header 与 `Authorization` 冲突。

### 凭据测试 404

- Base URL 多写了具体端点；
- 服务没有实现 `/models`；
- 反向代理错误重写 `/v1/models`。

### 聊天成功但 Agent 失败

- 模型或兼容服务不支持工具调用；
- 工具调用字段、流式格式或 JSON 参数不兼容；
- 工具没有连接到 Agent 的 Tool 端口。

### Embedding 404 或维度错误

- 服务没有 `/v1/embeddings`；
- 填了聊天模型 ID；
- 索引维度与当前模型不同；
- Docker 容器无法解析 Base URL。

### Webhook 显示错误域名

检查 `WEBHOOK_URL`、`N8N_PROXY_HOPS` 和反向代理转发头，然后重新发布工作流。

### 429、超时或内存过高

- 降低并发、批量大小和上下文长度；
- 对 429/临时 5xx 使用有上限的指数退避；
- 避免让循环节点无限重试；
- 大文件采用持久化二进制存储并设置清理策略。

## 13. 备份、升级、回滚与卸载

### 备份

至少备份：

- PostgreSQL 或 SQLite 数据库；
- `/home/node/.n8n` 持久卷；
- `N8N_ENCRYPTION_KEY` 和生产环境变量；
- 外部二进制存储；
- 工作流导出。

官方 CLI 支持：

```bash
docker exec <n8n容器名> n8n export:workflow --backup --output=/home/node/.n8n/backups/workflows/
docker exec <n8n容器名> n8n export:credentials --backup --output=/home/node/.n8n/backups/credentials/
```

备份必须在另一位置保留并定期演练恢复。加密凭据依赖原加密密钥。

### 升级与回滚

1. 记录当前镜像标签，阅读目标版本发布说明；
2. 停止写入并完成数据库与卷快照；
3. 在测试环境用副本升级；
4. 固定目标镜像标签，拉取后重新创建容器；
5. 验证登录、凭据解密、聊天、Embedding、Webhook 和定时任务；
6. 回滚时恢复旧镜像及与其配套的升级前数据库快照。

不要只回退镜像而保留已执行新版本迁移的数据库。

### 卸载

```bash
docker stop n8n
docker rm n8n
```

确认备份可恢复后，才按实际卷名删除持久卷。删除 `n8n_data` 会永久删除本地数据。

## 14. 官方资料

- [n8n OpenAI 凭据文档](https://docs.n8n.io/integrations/builtin/credentials/openai/)
- [n8n 官方 OpenAI 凭据源码（包含 Base URL）](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/credentials/OpenAiApi.credentials.ts)
- [n8n Docker 安装](https://docs.n8n.io/hosting/installation/docker/)
- [反向代理下配置 Webhook URL](https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/)
- [n8n CLI 导入导出](https://docs.n8n.io/hosting/cli-commands/)
- [n8n 安全审计](https://docs.n8n.io/hosting/securing/security-audit/)
- [n8n RAG 指南](https://docs.n8n.io/advanced-ai/rag-in-n8n/)

---

**核验结论**：截至 2026-07-14，n8n 官方仓库明确提供可覆盖的 OpenAI `Base URL`，可用于聊天和 Embedding 节点。Rerank 不属于该兼容凭据所保证的能力，必须单独配置和验证。
