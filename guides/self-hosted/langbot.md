# LangBot 多平台机器人、模型与知识库配置教程

> 最后核验：2026-07-24
>
> 适用范围：LangBot 当前稳定版；Docker Compose
>
> 预计用时：30～90 分钟（不含平台应用审核）

[← 返回教程目录](../教程总目录.md)

## 1. LangBot 的定位

LangBot 是面向即时通信平台的开源 Agent 应用平台，提供：

- 多聊天平台适配；
- LLM、Embedding 和 Rerank 模型管理；
- Pipeline 与 Agent 编排；
- 知识库；
- 插件和外部 AI 应用连接。

它把模型、消息渠道和处理 Pipeline 分开管理。第一次部署应按“模型 → Pipeline → WebUI 测试 → 消息平台”的顺序进行。

## 2. Docker Compose 部署

```bash
git clone https://github.com/langbot-app/LangBot
cd LangBot/docker
docker compose up -d
```

查看状态：

```bash
docker compose ps
docker compose logs -f
```

默认 WebUI：

```text
http://127.0.0.1:5300
```

Compose 还会为消息平台适配器预留端口。生产环境只开放实际使用的端口。

## 3. 首次安全设置

打开 WebUI 后：

1. 完成管理员初始化；
2. 修改默认凭据；
3. 不允许公网直接访问无 TLS 的管理页；
4. 检查数据卷是否持久化；
5. 再配置模型 Key。

远程使用建议通过反向代理提供 HTTPS，并增加 IP 限制、单点登录或其他访问控制。

## 4. 添加 LLM

进入模型配置，添加 LLM。官方当前界面要求的核心字段包括：

| 字段 | 内容 |
|---|---|
| Model Name | 服务实际模型 ID |
| Model Provider | 与目标 API 协议匹配的 Provider |
| Request URL | 目标服务要求的请求地址 |
| API Key | `YOUR_API_KEY` |

如果是 OpenAI-compatible 服务，应选择对应 Provider，并按照服务文档填写 Request URL。这里可能要求完整请求 URL，而不只是 Base URL，因此不要机械复制其他工具的配置。

根据模型真实能力选择：

- Visual Capability；
- Function Calling。

勾选并不会让不支持视觉或工具调用的模型获得该能力。配置完成后需要实测。

## 5. 第一次模型测试

先用最小对话：

```text
只回复：LangBot 模型连接成功
```

再测试多轮上下文：

```text
记住数字 2749，下一条消息只返回这个数字。
```

接着询问：

```text
刚才的数字是什么？
```

启用 Function Calling 时，再创建一个无副作用测试工具，验证模型是否返回结构化工具调用。不要第一次就连接文件删除、数据库写入或外部消息发送工具。

## 6. 配置 Embedding

需要 LangBot 知识库时，添加专用 Embedding 模型：

```text
Model Name: YOUR_EMBEDDING_MODEL_ID
Model Provider: 与服务协议匹配的类型
Request URL: 服务提供的 Embedding 地址
API Key: YOUR_API_KEY
```

先用两段文本测试并记录向量维度。知识库入库和查询必须使用相同或兼容的模型与维度。

更换 Embedding 模型后，应重新处理现有知识库，不能把不同向量空间的数据混在一个索引中。

## 7. 配置 Rerank

Rerank 用于对初步检索结果重新排序。配置时检查：

- LangBot 支持的 Provider 类型；
- 服务端要求的 Request URL；
- 模型 ID；
- query/documents 请求格式；
- 单次允许的文档数量和长度。

Rerank 接口并没有完全统一的跨厂商标准。不能只因为 Chat 和 Embedding 使用同一域名，就推断 Rerank 地址和格式相同。

## 8. Pipeline

模型添加后，在 Pipeline 中选择：

- 默认 LLM；
- System Prompt；
- 可用工具；
- 知识库；
- 记忆和上下文策略；
- 消息过滤与触发方式。

先创建一个最小 Pipeline：

```text
消息输入 → LLM → 文本回复
```

验证后再加入知识库、工具、外部工作流和多 Agent。一次增加多个组件会让错误难以定位。

## 9. 连接消息平台

LangBot 官方支持多种消息平台。具体能力和连接方式以当前文档为准。

通用步骤：

1. 在目标平台创建官方 Bot 或应用；
2. 获取 App ID、Token、Secret；
3. 配置事件订阅和回调地址；
4. 在 LangBot 添加对应平台适配器；
5. 绑定已经测试通过的 Pipeline；
6. 先在私聊或测试群验证；
7. 配置白名单、管理员和限流。

个人账号协议方案可能存在封号、合规和稳定性风险，优先使用平台官方 API。

## 10. Docker 网络

如果消息适配器、模型服务或外部工作流也在 Docker 中，应放入可控网络并使用服务名访问：

```text
http://model-service:8000/v1
```

不能在 LangBot 容器中使用：

```text
http://localhost:8000/v1
```

除非模型服务就在同一个容器内。

查看网络：

```bash
docker network ls
docker compose config
```

从 LangBot 容器中测试目标服务的 DNS 和端口，再排查应用配置。

## 11. 知识库验收

准备三份短文档：

- 一份直接包含答案；
- 一份主题相近但答案不同；
- 一份完全无关。

用明确问题测试：

```text
根据知识库回答：测试产品的退款期限是多少？
```

检查：

- 正确文档是否进入召回结果；
- Rerank 是否把正确段落排在前面；
- 回答是否给出引用；
- 无答案时是否明确说明不知道；
- 更改查询措辞后结果是否稳定。

## 12. 备份与更新

更新前：

```bash
docker compose ps
docker compose logs --tail=100
```

备份 Compose 文件、环境变量模板和持久化数据卷。然后按官方升级说明拉取新版本：

```bash
git pull --ff-only
docker compose pull
docker compose up -d
```

如果当前版本从源码构建，则使用当前仓库提供的构建方式。更新后重新测试模型、Pipeline、知识库和消息平台。

## 13. 安全检查

- API Key 使用环境变量或受控密钥系统；
- 管理后台不直接暴露公网；
- 消息平台设置白名单和频率限制；
- 工具写操作需要审批；
- 上传文档进行类型、大小和内容限制；
- 知识库按用户或团队隔离；
- 日志不记录完整 Key、隐私消息和敏感文档；
- 插件和镜像固定可信版本；
- 数据目录定期备份并测试恢复。

## 14. 常见问题

| 现象 | 排查方法 |
|---|---|
| 5300 无法访问 | 检查容器状态、端口映射和防火墙 |
| 401 | 检查 Key、环境变量和 Provider 认证方式 |
| 404 | Request URL 可能需要完整端点；核对官方模型配置说明 |
| 模型回复但工具不调用 | 检查 Function Calling 选项、模型能力和响应结构 |
| 知识库没有结果 | 检查文档处理、Embedding 模型、维度和检索阈值 |
| Rerank 失败 | 核对 Provider、专用接口格式、模型 ID 和文档长度 |
| WebUI 正常但平台不回复 | 检查平台事件、回调、Token、Pipeline 绑定和白名单 |
| 容器间连接失败 | 使用 Compose 服务名，不使用 `localhost` |

## 15. 官方来源

- [LangBot 官方文档](https://docs.langbot.app/)
- [LangBot Docker Deployment](https://docs.langbot.app/en/deploy/langbot/docker)
- [LangBot Configure Models](https://docs.langbot.app/en/usage/models/readme)
- [LangBot 官方仓库](https://github.com/langbot-app/LangBot)
