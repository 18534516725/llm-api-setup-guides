# RAGFlow 接入 OpenAI 兼容 API：模型、数据集与智能体完整教程

> 最后核验：2026-07-14
>
> 适用范围：RAGFlow 当前自托管稳定版；生产环境使用固定 Release
>
> 推荐路径：聊天、Embedding、检索、Rerank、Agent 逐层验证

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 官方兼容入口

RAGFlow 官方文档明确说明：当模型未列入内置供应商、但 API 与 OpenAI 兼容时，可在 `Model providers` 页面选择 `OpenAI-API-Compatible` 配置。该入口要求 Base URL、API Key、模型名和模型类型。

能力必须分开确认：

- Chat 模型用于对话与 Agent；
- Embedding 模型用于文档和查询向量化；
- Rerank 模型独立配置，可不启用；
- 模型 API Key 与 RAGFlow 对外 API Key 不同。

## 2. 部署要求与安装

官方仓库当前列出的基础要求包括 4 核 CPU、16 GiB 内存、50 GiB 磁盘、Docker 24+ 与 Compose 2.26.1+。知识库规模较大时需要更多磁盘、内存与备份空间。x86 预构建镜像与 ARM 支持情况应以目标 Release 说明为准。

Linux 先检查：

```bash
sysctl vm.max_map_count
sudo sysctl -w vm.max_map_count=262144
```

安装固定 Release：

```bash
git clone https://github.com/infiniflow/ragflow.git
cd ragflow
git checkout <稳定Release标签>
cd docker
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
```

首次启动需要等待数据库、文档引擎、对象存储和 RAGFlow 就绪。查看日志：

```bash
docker compose -f docker-compose.yml logs --tail=200
```

默认 Web 入口以当前 Compose 端口为准。公网必须启用 HTTPS、强密码和访问控制。

## 3. 持久化与关键配置

官方 Docker 配置包含：

- `.env`：镜像、端口、数据库和对象存储密码；
- `service_conf.yaml.template`：后端服务模板；
- `docker-compose.yml` / base compose：服务、网络和卷；
- `ragflow-logs`：运行日志；
- MySQL、文档引擎、对象存储、Redis/Valkey 等数据卷。

部署后立即替换默认密码和 secret，限制数据库、对象存储与搜索引擎端口只在可信网络可达。切换文档引擎或执行 `down -v` 可能清空数据，禁止在未备份时操作。

## 4. 准备模型信息

```text
Base URL: https://<你的-api-域名>/v1
Chat Model: <聊天模型ID>
Embedding Model: <Embedding模型ID>
Model API Key: <你的API-Key>
```

Base URL 的 `/v1` 规则取决于目标兼容服务是否以该路径作为根，以及当前 RAGFlow 表单如何拼接。官方示例使用版本根路径；遇到 404 时应检查实际请求日志，不能盲目重复或删除 `/v1`。

## 5. 添加聊天模型

1. 登录后打开用户设置；
2. 进入 `Model providers`；
3. 选择 `OpenAI-API-Compatible`；
4. 添加模型，类型选择 `chat`；
5. Model Name 填 `<聊天模型ID>`；
6. Base URL 填 `https://<你的-api-域名>/v1`；
7. API Key 填 `<聊天专用API-Key>`；
8. 保存并运行模型测试；
9. 在系统模型设置中将已验证模型选为默认 Chat Model（如需要）。

先只测试短文本。工具调用、视觉、结构化输出和超长上下文都要另测。

## 6. 添加 Embedding 模型

仍在模型供应商页面独立添加：

| 字段 | 建议值 |
|---|---|
| Provider | `OpenAI-API-Compatible` |
| Model Type | `embedding` |
| Model Name | `<Embedding模型ID>` |
| Base URL | `https://<你的-api-域名>/v1` |
| API Key | `<Embedding专用API-Key>` |

Embedding 决定索引向量。数据集开始解析后，不要直接换成不同维度模型；需要迁移时创建测试数据集、完整重建索引并对固定问题集回归。

## 7. Rerank 独立配置

RAGFlow 支持在检索设置中选择 Rerank 模型；未选择时使用关键词相似度与向量余弦相似度组合。Rerank 会替换组合评分中的向量相似度部分并增加延迟。

正确步骤：

1. 在官方 `Supported models` 中确认目标供应商支持 rerank 类型；
2. 使用对应供应商入口、Base URL 和独立 Key 添加 rerank 模型；
3. 在少量固定候选片段上单测；
4. 再在数据集检索测试中选择该模型；
5. 比较命中率、排序和耗时。

`OpenAI-API-Compatible` 不等于自动兼容任意 `/rerank`。没有官方支持记录时跳过，不猜字段或端点。

## 8. 创建最小数据集

1. 新建 Dataset；
2. 选择已验证的 Embedding 模型；
3. 上传一份短文本，写入“测试代号是 `<唯一测试词>`”；
4. 选择适合内容的 chunk 方法；
5. 等待解析和索引完成；
6. 打开 Retrieval test；
7. 输入与唯一事实对应的问题；
8. 先不启用 Rerank，确认命中原文；
9. 再按需开启 Rerank 对比。

解析失败优先检查任务执行器、对象存储、文档引擎和 Embedding 请求。检索错误先看分块与向量，不要先换 Chat 模型。

## 9. 最小聊天与 Agent 验证

新建 Chat/Assistant，绑定测试数据集和 Chat 模型：

```text
用户问题 → 混合检索 →（可选 Rerank）→ Chat Model → 带来源回答
```

验收：命中问题返回正确事实及引用；未命中问题明确无法从知识库确认；多轮追问不串入其他用户数据。

Agent 流程从最简单结构开始：

```text
Begin → Retrieval → Generate → End
```

每新增工具、条件、MCP 或代码节点都单独测试。模型普通聊天成功不代表工具调用成功。

## 10. API、Webhook 与权限

RAGFlow 可为对话/Agent 提供 API。对外调用使用 RAGFlow 生成的 API Key，而不是模型 Key。生产建议：

- 为每个应用和环境分配独立 API Key；
- 在网关处做 HTTPS、限流、正文大小、IP/身份校验和审计；
- Key 只放服务端 Header，不放浏览器代码、查询串或公开示例；
- 定期吊销不用的 Key；
- Webhook 回调校验签名、时间戳和幂等键；
- 不把原始模型异常、内部服务地址或完整日志返回用户；
- 数据集、Assistant 与团队成员使用最小可见范围。

## 11. Docker 网络

- 同一 Compose 网络中的模型服务使用容器服务名；
- Docker Desktop 访问宿主机可用 `host.docker.internal`；
- 官方 Compose 提供 host-gateway 示例，Linux 应确认解析与防火墙；
- 容器内 `localhost` 不代表宿主机；
- 用 `docker compose exec <服务名> curl ...` 从实际调用容器测试 DNS、TLS 和端点。

不要为排错直接暴露 MySQL、对象存储或文档引擎公网端口。

## 12. 常见错误

### 添加模型 401 / 403

Key 错误、模型未授权、Header 不匹配或访问了错误环境。分别为 Chat 和 Embedding 检查权限。

### 路径不存在：404

Base URL 与 `/v1` 拼接错误、模型名错误、反向代理重写路径，或目标服务没有 `/models`、`/chat/completions`、`/embeddings`。

### 网络异常（network abnormal）

系统仍在初始化、Web/API 端口映射错误、反向代理错误或后端依赖未健康。先看所有 Compose 服务状态与 RAGFlow 日志。

### 文档一直解析

检查 task executor、Embedding、对象存储、文档引擎资源与 `vm.max_map_count`，以及磁盘是否已满。

### 检索为空或质量差

检查解析文本、chunk 方法、Embedding 一致性、相似度阈值和 Top K；最后才引入 Rerank。

### 429 / 超时

降低解析并发与候选数量，缩短上下文，对临时错误有上限退避，避免请求风暴。

## 13. 备份、升级、回滚与卸载

完整备份至少包括：MySQL 一致性备份、文档引擎索引、对象存储、缓存中需要保留的数据、所有持久卷、`.env`、`service_conf.yaml.template`、Compose 文件、日志和当前 Git/镜像标签。

升级流程：

1. 阅读 Release Notes 与兼容性变更；
2. 停止写入，完成一致性快照并演练恢复；
3. 在副本环境让代码标签、entrypoint 与镜像版本一致；
4. 升级后验证登录、模型、解析、检索、Rerank、聊天和 API；
5. 再切生产。

回滚必须恢复旧代码/镜像和升级前全套数据快照。只回退 RAGFlow 容器不足以回退数据库与索引迁移。

卸载时先 `docker compose down` 保留卷。确认备份可恢复后才删除卷和宿主机数据目录；`down -v` 会删除数据，必须谨慎。

## 14. 官方资料

- [RAGFlow 官方 GitHub 与安装说明](https://github.com/infiniflow/ragflow)
- [官方支持模型与 OpenAI-API-Compatible 说明](https://ragflow.io/docs/dev/supported_models)
- [模型 API Key 配置](https://ragflow.io/docs/dev/llm_api_key_setup)
- [Docker 配置说明](https://github.com/infiniflow/ragflow/blob/main/docker/README.md)
- [官方 Compose](https://github.com/infiniflow/ragflow/blob/main/docker/docker-compose.yml)
- [数据集检索测试](https://ragflow.io/docs/dev/run_retrieval_test)
- [RAGFlow Release Notes](https://github.com/infiniflow/ragflow/blob/main/docs/release_notes.md)

---

**核验结论**：截至 2026-07-14，RAGFlow 官方文档明确提供 `OpenAI-API-Compatible` 模型供应商入口；Chat、Embedding 与 Rerank 必须按模型类型独立验证，不能相互推断。
