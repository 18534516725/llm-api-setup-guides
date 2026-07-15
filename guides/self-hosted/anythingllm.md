# AnythingLLM 接入 OpenAI 兼容 API：桌面版、Docker 与知识库完整教程

> 最后核验：2026-07-14
>
> 适用范围：AnythingLLM Desktop 与 Self-hosted 当前版本
>
> 推荐方式：个人用 Desktop；团队用 Docker；LLM Provider 选择 `OpenAI (Generic)`

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. AnythingLLM 适合什么场景

AnythingLLM 是本地优先的 AI 工作空间，重点能力包括文档问答、RAG、工作区、Agents 和多用户部署。适合：

- 希望对 PDF、Word、文本等资料做知识库问答；
- 需要自定义 OpenAI 兼容模型；
- 个人希望用桌面应用保存数据；
- 团队希望在服务器部署共享工作区。

如果只需要普通聊天，AnythingLLM 会比轻量客户端复杂；如果需要文档与 Agent，它的完整工作区更有价值。

## 2. 关键概念：聊天模型与 Embedding 是两套配置

| 配置 | 用途 | 常见端点 |
|---|---|---|
| LLM Provider | 生成回答 | `/v1/chat/completions` |
| Embedding Provider | 把文档转换为向量 | `/v1/embeddings` |
| Vector Database | 保存、检索向量 | 本地或外部向量库 |

“聊天成功”不代表“文档嵌入成功”。首次配置应先验证 LLM，再测试知识库。

## 3. 安装方式选择

### 3.1 Desktop

个人用户优先从 AnythingLLM 官方下载页或 GitHub Releases 安装 Desktop。它支持 macOS、Windows 与 Linux，安装后通过图形界面完成设置。

优点：安装简单、数据本机保存。限制：不适合作为多人公共服务。

### 3.2 Docker Self-hosted

团队、多用户或远程访问使用 Docker。官方建议至少约 2 GB 内存和 10 GB 磁盘，实际需求随文档、向量和用户数量增加。

## 4. Docker 安装

拉取官方镜像：

```bash
docker pull mintplexlabs/anythingllm
```

Linux/macOS 创建持久化目录：

```bash
export STORAGE_LOCATION=$HOME/anythingllm
mkdir -p "$STORAGE_LOCATION"
touch "$STORAGE_LOCATION/.env"
```

仅监听本机启动：

```bash
docker run -d \
  --name anythingllm \
  --restart unless-stopped \
  -p 127.0.0.1:3001:3001 \
  --cap-add SYS_ADMIN \
  -v "$STORAGE_LOCATION:/app/server/storage" \
  -v "$STORAGE_LOCATION/.env:/app/server/.env" \
  -e STORAGE_DIR=/app/server/storage \
  mintplexlabs/anythingllm
```

打开：

```text
http://localhost:3001
```

`SYS_ADMIN` 是官方 Docker 示例中用于浏览器相关能力的配置，会扩大容器权限。若不需要相关功能，应结合当前版本官方说明评估是否可以移除，并在隔离环境中运行。

## 5. 在界面中配置 `OpenAI (Generic)`

首次引导或进入 `Settings` 后：

1. 打开 `LLM Preference` / `AI Providers`；
2. 选择 **OpenAI (Generic)**，不要选普通 OpenAI；
3. 填写 `Base URL`；
4. 填写 `API Key`；
5. 填写模型名称 / Chat Model；
6. 填写模型上下文窗口；
7. 保存配置；
8. 新建工作区并发送短消息。

示例：

```text
Provider:      OpenAI (Generic)
Base URL:      https://api.example.com/v1
API Key:       YOUR_API_KEY
Chat Model:    model-id-1
Context Window: 按模型官方值或保守值填写
```

官方特别提醒：Generic OpenAI 是面向开发者的高可配置选项，只有目标接口确实兼容 OpenAI 请求与响应时才应使用。

## 6. Base URL 规则

通常填写：

```text
https://api.example.com/v1
```

不要填写：

```text
https://api.example.com/v1/chat/completions
```

AnythingLLM 会自行拼接聊天路径。若出现 404，检查：

- `/v1` 是否缺失；
- 是否重复成 `/v1/v1`；
- 是否误填完整端点；
- 容器能否访问该域名。

## 7. 模型 ID 与上下文窗口

模型名称必须是 API 接受的准确 ID，不是产品展示名。上下文窗口应谨慎填写：

- 填得过小：长文档和长对话会被提前截断；
- 填得过大：可能构造超出模型限制的请求；
- 不确定时：先采用服务控制台说明或保守值；
- 修改模型后：同步检查上下文窗口。

AnythingLLM 还会把系统提示、历史消息和检索到的文档片段计入上下文。

## 8. 使用环境变量预配置

Docker 或自动化部署可在挂载的 `.env` 中设置：

```dotenv
LLM_PROVIDER=generic-openai
GENERIC_OPEN_AI_BASE_PATH=https://api.example.com/v1
GENERIC_OPEN_AI_MODEL_PREF=model-id-1
GENERIC_OPEN_AI_MODEL_TOKEN_LIMIT=8192
GENERIC_OPEN_AI_API_KEY=YOUR_API_KEY
```

字段说明：

| 变量 | 作用 |
|---|---|
| `LLM_PROVIDER` | 选择 `generic-openai` |
| `GENERIC_OPEN_AI_BASE_PATH` | OpenAI 兼容 Base URL |
| `GENERIC_OPEN_AI_MODEL_PREF` | 默认聊天模型 ID |
| `GENERIC_OPEN_AI_MODEL_TOKEN_LIMIT` | 模型上下文窗口 |
| `GENERIC_OPEN_AI_API_KEY` | API Key |

当前版本还支持 Generic OpenAI 自定义请求头：

```dotenv
GENERIC_OPEN_AI_CUSTOM_HEADERS=X-Custom-Header:placeholder-value
```

只在服务明确要求时使用，敏感值不得提交到 Git。

修改后重新创建容器：

```bash
docker restart anythingllm
docker logs --tail=200 anythingllm
```

## 9. 首次聊天验证

1. 创建一个空工作区；
2. 不上传文档；
3. Chat Mode 选择普通聊天；
4. 关闭 Agent 和工具；
5. 发送“只回复 OK”；
6. 确认响应正常结束；
7. 在 API 控制台检查请求与用量。

如果这里失败，先解决 LLM 配置，不要开始排查 Embedding 和向量库。

## 10. 配置文档 Embedding

如果兼容服务同时提供 OpenAI 风格 Embeddings，可在设置中选择通用 OpenAI 兼容 Embedding，并填写：

```text
Embedding Base URL: https://api.example.com/v1
Embedding API Key:  YOUR_EMBEDDING_API_KEY
Embedding Model:    embedding-model-id
```

对应环境变量示例：

```dotenv
EMBEDDING_ENGINE=generic-openai
EMBEDDING_BASE_PATH=https://api.example.com/v1
EMBEDDING_MODEL_PREF=embedding-model-id
EMBEDDING_MODEL_MAX_CHUNK_LENGTH=8192
GENERIC_OPEN_AI_EMBEDDING_API_KEY=YOUR_EMBEDDING_API_KEY
```

> [!IMPORTANT]
> 不要把聊天模型 ID 当作 Embedding 模型。若服务没有 Embeddings 接口，使用 AnythingLLM 内置 Embedder 或另一种受支持的嵌入方案。

## 11. 创建第一个知识库工作区

1. 新建工作区；
2. 上传一个内容明确、体积小的测试文档；
3. 等待文档解析完成；
4. 将文档移动或嵌入到当前工作区；
5. 提问一个答案明确存在于文档中的问题；
6. 检查引用内容是否对应原文；
7. 再逐步增加更多文档。

测试文档越简单，越容易区分“解析失败”“嵌入失败”“检索失败”和“生成失败”。

## 12. Chat、Query 与 Agent 模式

| 模式 | 主要用途 | 排错优先级 |
|---|---|---|
| Chat | 普通对话 | 首先验证 |
| Query | 基于工作区文档回答 | LLM 成功后验证 |
| Agent | 调用工具执行任务 | 最后开启 |

工具调用还依赖模型支持。当前版本可通过 `PROVIDER_SUPPORTS_NATIVE_TOOL_CALLING` 声明 Generic OpenAI 支持原生工具调用：

```dotenv
PROVIDER_SUPPORTS_NATIVE_TOOL_CALLING=generic-openai
```

只有服务和模型确实支持工具调用时才开启。错误声明会导致 Agent 行为异常。

## 13. Docker 中的 `localhost` 陷阱

容器里的 `localhost` 不是宿主机。连接宿主机服务通常使用：

```text
http://host.docker.internal:端口/v1
```

Linux 启动参数可能还需：

```bash
--add-host=host.docker.internal:host-gateway
```

云端 HTTPS API 直接填写公开 Base URL 即可。

## 14. 流式、多模态和工具能力

- Generic OpenAI 支持流式聊天，但服务端必须正确实现 SSE；
- 多模态需要模型与兼容接口共同支持图片消息；
- 工具调用需要模型、接口和 AnythingLLM Provider 同时支持；
- RAG 需要独立 Embedding 和向量库；
- TTS、STT 也有各自 Provider，聊天 API 可用不代表语音可用。

排错遵循：纯文本 → 流式 → 文档 → 工具 → 多模态。

## 15. 多用户与公网安全

- 启用多用户模式并创建独立管理员；
- 使用 HTTPS，不直接暴露 3001 端口；
- 只开放必要的工作区和功能；
- Key 放在挂载的 `.env` 或秘密管理工具中；
- 为部署创建独立限额 Key；
- 定期备份 `/app/server/storage`；
- 限制上传文件类型和大小；
- 日志、截图中隐藏 Key、Cookie、邮箱和文档内容；
- 高权限 Agent 工具应默认关闭并逐个审核。

## 16. 常见错误

### 16.1 `401 Unauthorized`

- 检查 Generic OpenAI API Key；
- 确认环境变量名没有拼错；
- 修改后重启容器；
- 检查 Key 是否有目标模型权限。

### 16.2 `404 Not Found`

- 不要把 `/chat/completions` 写进 Base URL；
- 检查 `/v1` 是否缺失或重复；
- 确认容器 DNS 和网络正常；
- 用 curl 验证同一 URL。

### 16.3 `model not found`

- 从控制台复制准确模型 ID；
- 区分 Chat Model 与 Embedding Model；
- 检查 Key 的模型权限；
- 不使用界面营销名称。

### 16.4 普通聊天可用，上传文档失败

这是两条链路。检查：

- 文档是否解析成功；
- Embedding Provider 是否配置；
- Embedding 模型是否存在；
- 向量库是否可写；
- 文档是否已真正嵌入工作区。

### 16.5 流式输出停住

- 先验证非流式；
- 去掉文档、Agent 和附件；
- 检查反向代理缓冲与超时；
- 缩短上下文；
- 查看 `docker logs` 和 API 请求记录。

### 16.6 配置保存后又恢复

- 确认 `/app/server/storage` 已持久化；
- 检查挂载目录权限；
- 检查 `.env` 是否覆盖界面配置；
- 查看容器日志是否有数据库写入错误。

## 17. 备份、更新与回滚

停止容器以获得更一致的文件备份：

```bash
docker stop anythingllm
```

备份整个 `STORAGE_LOCATION`，其中包含数据库、配置和工作区数据。完成后启动：

```bash
docker start anythingllm
```

更新：

```bash
docker pull mintplexlabs/anythingllm
docker stop anythingllm
docker rm anythingllm
```

然后使用相同挂载和参数重新创建容器。数据在持久化目录中，不应随容器删除。

回滚时改用之前验证过的镜像标签，并阅读对应版本的数据迁移说明。

## 18. 卸载

Desktop 请先按官方“数据存储位置”说明备份，再使用系统卸载方式并按需删除应用数据目录。

Docker：

```bash
docker stop anythingllm
docker rm anythingllm
```

只有确认备份完成且不再需要数据时，才删除 `STORAGE_LOCATION`。删除容器本身不会自动删除宿主机持久化目录。

## 19. 验收清单

- [ ] 空工作区普通聊天成功
- [ ] Base URL 最终路径正确
- [ ] Chat Model 与 Embedding Model 没有混用
- [ ] 小型测试文档可以解析、嵌入和检索
- [ ] 服务控制台可核对用量
- [ ] 公网实例启用身份认证和 HTTPS
- [ ] 持久化目录已备份并验证可恢复

## 20. 官方资料

- [AnythingLLM 官方文档](https://docs.anythingllm.com/)
- [OpenAI (Generic) LLM 配置](https://docs.anythingllm.com/setup/llm-configuration/cloud/openai-generic)
- [AnythingLLM Docker Quickstart](https://docs.anythingllm.com/installation-docker/quickstart)
- [AnythingLLM 官方仓库](https://github.com/Mintplex-Labs/anything-llm)
- [AnythingLLM 环境变量示例](https://github.com/Mintplex-Labs/anything-llm/blob/master/docker/.env.example)
- [AnythingLLM Releases](https://github.com/Mintplex-Labs/anything-llm/releases)

---

AnythingLLM 更新较快，菜单和变量可能变化。升级前请核对官方文档；提交日志或截图求助时务必隐藏 Key、文档内容和账户信息。
