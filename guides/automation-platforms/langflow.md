# Langflow 接入 OpenAI 兼容 API：可视化流程、RAG 与 Webhook 完整教程

> 最后核验：2026-07-14
>
> 适用范围：Langflow 当前自托管版
>
> 推荐路径：先用 OpenAI 组件验证聊天，再独立验证 Embedding 和向量库

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 官方确认的兼容方式

Langflow 当前官方源码中的 OpenAI Chat Model 和 OpenAI Embeddings 组件都包含 `OpenAI API Base`：聊天默认指向 OpenAI API 根路径，允许改为其他 OpenAI 兼容地址；模型名输入支持自定义。

本教程采用以下边界：

- Chat 与 Embedding 分别配置、分别测试；
- `OpenAI API Base` 填版本根路径，不填具体端点；
- Rerank 不是 OpenAI 标准能力，只使用独立组件和凭据；
- Langflow API Key、组件模型 Key、Webhook Key 是不同层次的凭据。

## 2. 准备信息

```text
OpenAI API Base: https://<你的-api-域名>/v1
Chat Model: <聊天模型ID>
Embedding Model: <Embedding模型ID>
Component API Key: <你的API-Key>
Langflow Server: https://<你的-langflow-域名>
```

## 3. Docker 部署与持久化

快速体验：

```bash
docker run -d \
  --name langflow \
  --restart unless-stopped \
  -p 7860:7860 \
  -v langflow-data:/app/langflow \
  langflowai/langflow:<固定版本>
```

访问 `http://<服务器地址>:7860`。生产环境应使用官方 Compose 示例与 PostgreSQL：

```bash
git clone https://github.com/langflow-ai/langflow.git
cd langflow/docker_example
docker compose up -d
docker compose ps
```

官方部署文档要求持久化 Langflow 配置目录与 PostgreSQL 数据。生产环境固定版本、启用 HTTPS，并至少设置：

```text
LANGFLOW_AUTO_LOGIN=False
LANGFLOW_SUPERUSER=<管理员用户名>
LANGFLOW_SUPERUSER_PASSWORD=<强密码>
LANGFLOW_SECRET_KEY=<随机强密钥>
LANGFLOW_NEW_USER_IS_ACTIVE=False
LANGFLOW_ENABLE_SUPERUSER_CLI=False
LANGFLOW_WEBHOOK_AUTH_ENABLE=True
```

不要使用示例默认用户名、密码或密钥。

## 4. 配置聊天模型

1. 新建 Project 和 Flow；
2. 添加 `OpenAI` / `OpenAI Chat Model` 组件；
3. `OpenAI API Key` 填 `<你的API-Key>` 或引用安全的 Global Variable；
4. 展开高级字段，将 `OpenAI API Base` 设为 `https://<你的-api-域名>/v1`；
5. `Model Name` 手填 `<聊天模型ID>`；
6. 首测关闭复杂工具与 JSON 参数，设置合理超时和重试。

最小 Flow：

```text
Chat Input → Prompt → OpenAI Chat Model → Chat Output
```

运行“只回复 OK”。成功后分别测试 streaming、结构化输出、图片和工具调用；这些能力不能从普通聊天成功推断。

## 5. Embedding 独立链路

添加 `OpenAI Embeddings` 组件：

| 字段 | 值 |
|---|---|
| OpenAI API Key | `<Embedding专用API-Key>` |
| OpenAI API Base | `https://<你的-api-域名>/v1` |
| Model | `<Embedding模型ID>` |

最小入库流：

```text
File / Text → Split Text → OpenAI Embeddings → Vector Store（写入）
```

最小检索流：

```text
Chat Input → OpenAI Embeddings → Vector Store（搜索）→ Data/Message Output
```

先观察检索结果，再接聊天模型。插入和查询必须使用相同模型、维度、集合与命名空间；模型换维度后重建索引。

## 6. Rerank 独立链路

在组件目录中选择当前版本正式提供且与你的服务匹配的 Rerank 组件：

```text
Query + Retrieved Documents → Reranker → Top Documents
```

创建独立凭据，用少量固定文本比较排序前后结果。若没有匹配的官方组件或服务文档，就不配置 Rerank；不要猜测 `/v1/rerank`。基础 RAG 在无 Rerank 时仍可通过向量相似度工作。

## 7. 最小 RAG Flow

```text
Chat Input
  → Embedding
  → Vector Store Search
  →（可选 Rerank）
  → Prompt（问题 + 片段）
  → OpenAI Chat Model
  → Chat Output
```

验收方法：

1. 写入带 `<唯一测试词>` 的短文档；
2. 直接验证搜索结果确实命中；
3. 再让模型基于片段回答；
4. 对不存在的问题要求明确回答“不知道”；
5. 保存 Flow 后使用 API 片段测试同一输入。

## 8. 发布 API 与 Webhook

Langflow 大多数 API 端点使用 Langflow API Key，通过请求头发送：

```text
x-api-key: <Langflow-API-Key>
```

运行 Flow 的典型路径为：

```text
POST https://<你的-langflow-域名>/api/v1/run/<Flow-ID>
```

Webhook 默认由 `LANGFLOW_WEBHOOK_AUTH_ENABLE=True` 要求认证，并验证 Key 所属用户拥有该 Flow。不要为了方便在公网关闭它。

安全要点：

- Component API Key 调外部模型，Langflow API Key 调本实例；
- API Key 继承创建者权限，使用最小权限普通用户创建；
- `x-api-key` 放请求头，不放 URL、前端源码或日志；
- 限制 CORS 到明确域名，默认通配设置不适合生产；
- 在可信代理处设置速率、正文大小、超时和审计；
- 对 API Request 组件启用 SSRF 防护，并精确设置必要 allowlist。

## 9. Docker 网络

容器内 `localhost` 指 Langflow 容器：

- 同一 Compose 网络用 `http://<模型服务名>:<端口>/v1`；
- Docker Desktop 访问宿主机可用 `host.docker.internal`；
- Linux 使用 host-gateway 或容器可达网关；
- 跨主机使用内网 DNS 与最小防火墙规则。

出现 SSL 错误应修复证书链或挂载可信 CA，不应在生产绕过校验。

## 10. 凭据与权限

Langflow 官方区分三类凭据：实例 API Key、组件 API Key、认证环境变量。建议：

- 组件 Key 存为加密 Global Variable 或安全环境引用；
- 设置 `LANGFLOW_REMOVE_API_KEYS=True`，减少 Flow 数据中保存 Key；
- 导出 Flow 时选择不包含 API Key；
- 备份 `LANGFLOW_SECRET_KEY`，丢失后已有加密数据可能无法读取；
- 删除 Langflow 中的变量不会吊销外部 Key，仍需在签发端轮换；
- 限制自定义组件与 API Request 的编辑权限。

## 11. 常见错误

### 认证失败：401 / 403

检查 `x-api-key` 与组件模型 Key 是否混用、Key 所属用户是否拥有 Flow、Webhook 认证是否开启。

### 路径或模型不存在：404 / model not found

检查 Base URL 是否停在 `/v1`、模型 ID 是否可手填、反向代理路径以及服务是否实现 `/chat/completions`。

### Chat 成功但 Embedding 失败

确认服务实现 `/embeddings`，Key 有 Embedding 权限，输入未超限，向量维度与存量索引一致。

### API 能运行，Webhook 失败

检查 `LANGFLOW_WEBHOOK_AUTH_ENABLE`、Flow 所有者、请求头、Webhook 路径和代理是否转发 Header。

### 容器 PermissionError

官方镜像以非 root 用户运行。检查挂载目录属主、卷是否由旧镜像以 root 初始化，不要用全局 `chmod 777` 掩盖问题。

### 429 / 超时

减少候选片段、上下文和并发；设置有上限重试；避免 Flow 中循环无限调用模型。

## 12. 备份、升级、回滚与卸载

至少备份：PostgreSQL、`/app/langflow`、`LANGFLOW_SECRET_KEY`、环境文件、Flow JSON 与当前镜像标签。备份后必须在隔离环境验证登录、解密和运行 Flow。

升级：固定旧版本 → 数据库和卷快照 → 阅读发布说明 → 测试副本升级 → 修改为固定新镜像 → `docker compose pull && docker compose up -d` → 验证 Chat、Embedding、RAG、API 与 Webhook。

回滚时恢复旧镜像和升级前数据库快照。仅回退容器而继续用迁移后的数据库可能失败。

卸载前确认备份。`docker compose down` 通常保留卷；只有确认永久删除数据时才删除 Langflow 与 PostgreSQL 卷。

## 13. 官方资料

- [Langflow 模型组件文档](https://docs.langflow.org/components-models)
- [Langflow 官方 OpenAI Chat 组件源码](https://github.com/langflow-ai/langflow/blob/main/src/lfx/src/lfx/components/openai/openai_chat_model.py)
- [Langflow 官方 OpenAI Embeddings 组件源码](https://github.com/langflow-ai/langflow/blob/main/src/lfx/src/lfx/components/openai/openai.py)
- [Docker 部署与持久化升级](https://docs.langflow.org/deployment-docker)
- [API Key、Webhook 与认证](https://docs.langflow.org/api-keys-and-authentication)
- [Langflow API 入门](https://docs.langflow.org/api-reference-api-examples)
- [向量数据与知识库](https://docs.langflow.org/knowledge)
- [Langflow 官方 GitHub](https://github.com/langflow-ai/langflow)

---

**核验结论**：截至 2026-07-14，Langflow 官方源码明确允许 OpenAI Chat 与 Embeddings 分别覆盖 `OpenAI API Base` 并使用自定义模型名；Rerank 必须单独配置。
