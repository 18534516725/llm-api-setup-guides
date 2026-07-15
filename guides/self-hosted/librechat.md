# LibreChat 接入 OpenAI 兼容 API：Docker 与 Custom Endpoint 完整教程

> 最后核验：2026-07-14
>
> 适用范围：LibreChat 当前稳定版，自托管 Docker 部署
>
> 推荐方式：`librechat.yaml` 定义端点，`.env` 保存密钥

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **还没有可接入 LibreChat 的 API？**
>
> 本教程可直接配合 **[纽智中转站](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。创建 Key 后，请从控制台复制 Base URL 和准确模型 ID。
>
> **[👉 立即注册并获取 API Key](https://www.nexotoken.net/?ref=github)**

## 1. LibreChat 适合什么场景

LibreChat 是开源、多用户的 AI 对话平台，支持多种模型端点、文件、Agents、工具和权限配置。它适合：

- 团队共用一个网页聊天入口；
- 同时连接多个 OpenAI 兼容 API；
- 由管理员统一管理 Key 和模型；
- 需要较完整的自托管能力。

相比单机客户端，LibreChat 需要维护容器、数据库、配置文件和备份。只想个人聊天时，Chatbox 或 Cherry Studio 更省事。

## 2. 三个配置文件各管什么

官方 Custom Endpoint 方案涉及三处：

| 文件 | 作用 | 是否保存 Key |
|---|---|---:|
| `librechat.yaml` | 定义端点、Base URL、模型和显示方式 | 只引用变量 |
| `.env` | 保存 API Key 等敏感值 | 是 |
| `docker-compose.override.yml` | 把 YAML 挂载进容器 | 否 |

这条链任何一环缺失，端点都可能不显示。

## 3. 准备工作

- 已安装 Git、Docker 和 Docker Compose；
- 至少 4 GB 内存，正式使用建议更多；
- OpenAI 兼容 API Key；
- 通常以 `/v1` 结尾的 Base URL；
- 至少一个准确模型 ID；
- 公网部署所需的域名、HTTPS 和备份方案。

## 4. 安装 LibreChat

从官方仓库获取代码：

```bash
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat
```

按官方示例创建环境文件：

```bash
cp .env.example .env
```

启动默认 Docker 服务：

```bash
docker compose up -d
docker compose ps
```

端口和服务组成可能随版本调整，请以官方 README、Compose 文件和启动日志为准。

## 5. 挂载 `librechat.yaml`

复制官方 Override 示例：

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

确认 `api` 服务包含：

```yaml
services:
  api:
    volumes:
      - type: bind
        source: ./librechat.yaml
        target: /app/librechat.yaml
```

如果已有 `docker-compose.override.yml`，只合并这段挂载，不要覆盖自己的其他配置。

## 6. 添加 OpenAI 兼容 Custom Endpoint

在项目根目录创建或编辑 `librechat.yaml`：

```yaml
version: 1.3.13
cache: true

endpoints:
  custom:
    - name: "Nexo Compatible"
      apiKey: "${NEXO_API_KEY}"
      baseURL: "https://api.example.com/v1"
      models:
        default:
          - "model-id-1"
          - "model-id-2"
        fetch: true
      titleConvo: true
      titleModel: "model-id-1"
      summarize: false
      modelDisplayLabel: "Nexo Compatible"
```

`Nexo Compatible` 只是端点显示名，域名与模型均为占位符。不要把真实 Key 直接写进 YAML。

在 `.env` 中加入：

```dotenv
NEXO_API_KEY=YOUR_API_KEY
```

## 7. 关键字段说明

| 字段 | 作用 | 建议 |
|---|---|---|
| `name` | 端点内部名称 | 使用唯一名称，不冒用内置端点名 |
| `apiKey` | 鉴权 Key | 引用 `${变量名}` |
| `baseURL` | API 基础地址 | 通常到 `/v1`，不要包含 `/chat/completions` |
| `models.default` | 手动模型列表 | 填服务控制台的模型 ID |
| `models.fetch` | 是否请求模型列表 | 接口支持 `/models` 时可开 |
| `titleConvo` | 是否自动生成标题 | 排错时可先关闭 |
| `titleModel` | 标题所用模型 | 必须真实可调用 |
| `summarize` | 是否启用总结 | 首次配置建议关闭 |

如果接口没有实现 `GET /v1/models`，设置：

```yaml
models:
  default: ["model-id-1", "model-id-2"]
  fetch: false
```

## 8. 重启并验证配置

```bash
docker compose down
docker compose up -d
docker compose logs --tail=200 api
```

打开 LibreChat 后：

1. 登录或完成首个账户初始化；
2. 打开端点选择器；
3. 选择 `Nexo Compatible`；
4. 选择 `model-id-1`；
5. 新建空白对话；
6. 发送“只回复 OK”；
7. 在服务控制台核对请求用量。

首次不要上传文件、调用工具、开启联网或使用 Agent。

## 9. 让每个用户填写自己的 Key

管理员不想共享统一 Key 时，可在自定义端点中写：

```yaml
apiKey: "user_provided"
```

用户会在 Web 界面中提供自己的 Key。注意，自定义端点的 `user_provided` 直接写字符串，不使用 `${}`。

两种模式比较：

| 模式 | 优点 | 风险/代价 |
|---|---|---|
| 管理员统一 Key | 用户开箱即用、便于统一模型 | 额度共享，必须加强访问控制 |
| `user_provided` | 每人独立计费与限额 | 用户需自行安全保管 Key |

## 10. Base URL 与协议规则

OpenAI 兼容端点默认走 OpenAI 风格客户端，常见请求为：

```text
GET  https://api.example.com/v1/models
POST https://api.example.com/v1/chat/completions
```

`baseURL` 应填：

```text
https://api.example.com/v1
```

不要填完整的聊天地址。LibreChat 还支持原生 Anthropic 兼容端点，但那是另一套协议；只有目标明确实现原生 Messages API 时才应设置：

```yaml
provider: "anthropic"
```

如果只是通过 OpenAI 兼容格式调用某个 Claude 模型，不要设置 `provider: anthropic`。

## 11. 多端点配置

可以在 `endpoints.custom` 下继续增加对象：

```yaml
endpoints:
  custom:
    - name: "General Models"
      apiKey: "${GENERAL_API_KEY}"
      baseURL: "https://api.example.com/v1"
      models:
        default: ["model-id-1"]
        fetch: false

    - name: "Coding Models"
      apiKey: "${CODING_API_KEY}"
      baseURL: "https://coding-api.example.com/v1"
      models:
        default: ["coding-model-id"]
        fetch: false
```

不同用途最好使用不同 Key，方便限额、轮换和审计。

## 12. 自定义请求头与参数

某些兼容服务需要额外请求头，LibreChat 自定义端点支持：

```yaml
headers:
  X-Custom-Header: "${CUSTOM_HEADER_VALUE}"
```

敏感头的值仍应来自 `.env`。不要添加服务没有要求的头，也不要复制别人的供应商专用配置。

个别模型不接受通用参数时，可以使用 `dropParams`：

```yaml
dropParams:
  - "stop"
```

只有明确看到“不支持某参数”的错误后再添加，不要一次删除大量参数。

## 13. 流式与高级能力边界

官方兼容性矩阵表明，自定义 OpenAI 兼容端点支持流式响应；视觉、工具等能力仍取决于具体模型和接口实现。

| 能力 | 依赖 |
|---|---|
| 流式聊天 | 规范 SSE 与 `stream: true` |
| 图片输入 | 模型支持视觉、兼容多模态消息 |
| 文件与 RAG | LibreChat RAG API、Embedding 配置和文件存储 |
| 工具调用 | 模型与端点支持 tool calling |
| Agents/MCP | LibreChat Agents 端点及额外配置 |

基础聊天成功后，再按照官方文档配置 RAG、Agents 和 MCP。

## 14. Docker 网络陷阱

容器里的 `localhost` 指容器自身。连接宿主机服务时通常使用：

```text
http://host.docker.internal:端口/v1
```

Linux 可能需要在 Compose 中增加：

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

云端 HTTPS API 不需要这个设置。

## 15. 安全清单

- `.env` 加入 `.gitignore`，绝不提交；
- 不在 `librechat.yaml` 写明文 Key；
- 关闭不需要的公开注册；
- 使用 HTTPS 和强管理员密码；
- 服务器统一 Key 时为用户设置额度与访问控制；
- 不公开 `docker compose config` 完整输出；
- 日志和报错截图隐藏 Key、Cookie、邮箱和对话；
- 定期备份数据库、上传文件与配置文件。

## 16. 常见错误

### 16.1 自定义端点不显示

依次检查：

1. `librechat.yaml` 是否位于项目根目录；
2. Override 是否挂载到 `/app/librechat.yaml`；
3. YAML 缩进和引号是否正确；
4. `.env` 是否存在对应变量；
5. 是否重启了 `api` 服务；
6. `docker compose logs api` 是否有校验错误。

### 16.2 `401 Unauthorized`

- `.env` 中的变量名必须与 `${NEXO_API_KEY}` 完全一致；
- 不要在 Key 两端留下空格或中文引号；
- 确认 Key 有目标模型权限；
- 重启服务以重新加载环境变量。

### 16.3 `404 Not Found`

- 检查 `/v1` 是否缺失或重复；
- 不要把 `/chat/completions` 写入 `baseURL`；
- 检查反向代理是否保留路径；
- 用 curl 单独验证最终地址。

### 16.4 模型列表为空

- 接口支持 `/models`：保留 `fetch: true` 并检查日志；
- 接口不支持：改为 `fetch: false` 并填写 `models.default`；
- 模型存在但无法调用：检查 Key 权限，不只是列表。

### 16.5 聊天成功但标题生成失败

`titleModel` 也会触发请求。把它改成已验证模型，或先设置：

```yaml
titleConvo: false
```

### 16.6 流式中途断开

- 先禁用流式验证普通响应；
- 暂时关闭标题、总结、工具和附件；
- 检查反向代理 SSE 缓冲和超时；
- 缩短上下文；
- 查看 API 容器日志与服务端请求记录。

## 17. 更新、回滚与卸载

更新前备份数据库、上传文件、`.env`、`librechat.yaml` 和 Override：

```bash
git pull
docker compose pull
docker compose up -d
docker compose ps
```

生产环境应固定版本并阅读迁移说明。回滚不仅要恢复代码或镜像，还要考虑数据库迁移的兼容性。

停止服务：

```bash
docker compose down
```

不要随意使用 `docker compose down -v`，它可能删除数据卷。彻底卸载前先验证备份可恢复。

## 18. 验收清单

- [ ] 自定义端点在选择器中出现
- [ ] 只显示准备开放的模型
- [ ] 纯文本请求可正常结束
- [ ] 流式输出无乱码或中断
- [ ] 服务控制台可核对用量
- [ ] 普通用户看不到管理员 Key
- [ ] 数据库、文件与配置有备份

## 19. 官方资料

- [LibreChat 官方仓库](https://github.com/danny-avila/LibreChat)
- [Custom Endpoints 快速入门](https://www.librechat.ai/docs/quick_start/custom_endpoints)
- [Custom Endpoint 字段参考](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/custom_endpoint)
- [LibreChat 兼容性矩阵](https://www.librechat.ai/docs/compatibility)
- [LibreChat 环境变量文档](https://www.librechat.ai/docs/configuration/dotenv)

---

不同版本的 YAML Schema 可能更新，升级前请检查官方示例。请求协助时只提供脱敏后的配置，绝不粘贴真实 Key。
