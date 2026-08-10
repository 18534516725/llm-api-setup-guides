# LiteLLM Proxy 统一模型网关部署与接入教程

> 最后核验：2026-08-10
>
> 适用范围：LiteLLM Proxy、Docker、Python / OpenAI SDK
>
> 预计用时：25～50 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文以本地网关为例，适用于符合对应协议的官方 API、自建推理服务或兼容 API。还没有测试 Key 时，可查看[教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. LiteLLM Proxy 解决什么问题

LiteLLM 有两种主要用法：Python SDK 直接嵌入应用，以及独立运行的 Proxy Server。本文重点讲后者。

Proxy 适合把多个模型端点放到统一入口后面，并为调用方提供 OpenAI-compatible API。常见用途包括：

- 为不同应用提供稳定的模型别名；
- 把不同厂商或自建服务统一为 `/v1/chat/completions` 等接口；
- 集中处理认证、限流、预算、日志与回退；
- 在不改业务代码的情况下切换实际模型部署。

它不是“装上就自动兼容一切”。Responses、工具调用、图像、音频和 Embedding 是否完整可用，仍取决于 LiteLLM 当前适配器与目标模型端点。

## 2. 部署前准备

建议准备：

- Docker 及 Docker Compose，或 Python 3 环境与 `uv`；
- 至少一个可工作的模型 API；
- 目标 API 的 Base URL、Key 和准确模型 ID；
- 一个随机、足够长的网关主密钥。

先为本教程建立独立目录：

```bash
mkdir litellm-gateway
cd litellm-gateway
```

## 3. 编写最小配置

新建 `config.yaml`：

```yaml
model_list:
  - model_name: app-chat
    litellm_params:
      model: openai/YOUR_MODEL_ID
      api_base: os.environ/UPSTREAM_API_BASE
      api_key: os.environ/UPSTREAM_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

这里故意使用稳定别名 `app-chat`。业务端只认识这个名字，之后更换实际模型时无需逐个修改客户端。

`openai/` 表示让 LiteLLM 使用 OpenAI-compatible 路径处理请求。若目标是其他原生 Provider，必须按 LiteLLM 官方 Provider 文档填写前缀，不能只改 URL。

## 4. 用 Docker Compose 启动

新建 `compose.yaml`：

```yaml
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-stable
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    ports:
      - "127.0.0.1:4000:4000"
    volumes:
      - ./config.yaml:/app/config.yaml:ro
    environment:
      UPSTREAM_API_BASE: ${UPSTREAM_API_BASE}
      UPSTREAM_API_KEY: ${UPSTREAM_API_KEY}
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
    restart: unless-stopped
```

生产环境应把镜像固定到经过验证的版本或 digest；`main-stable` 仍是可变标签，不适合长期不经测试自动升级。

新建 `.env`，不要提交到 Git：

```dotenv
UPSTREAM_API_BASE=https://api.example.com/v1
UPSTREAM_API_KEY=YOUR_UPSTREAM_API_KEY
LITELLM_MASTER_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
```

```bash
printf '\n.env\n' >> .gitignore
docker compose up -d
docker compose logs -f litellm
```

看到服务监听 `4000` 后退出日志跟随。

## 5. 不使用 Docker 的安装方式

官方快速入口支持 `uv tool`：

```bash
uv tool install 'litellm[proxy]'
litellm --config config.yaml --port 4000
```

这种方式适合本地验证。长期运行仍应交给容器编排、systemd 或其他进程管理器，并固定依赖版本。

## 6. 验证模型列表和聊天

```bash
export LITELLM_MASTER_KEY="CHANGE_ME_TO_A_LONG_RANDOM_SECRET"

curl http://127.0.0.1:4000/v1/models \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

确认列表中存在 `app-chat`，再发送最小请求：

```bash
curl http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "app-chat",
    "messages": [{"role": "user", "content": "只回复：LiteLLM 连接成功"}],
    "temperature": 0,
    "stream": false
  }'
```

先验证非流式，再把 `stream` 改为 `true` 并使用 `curl -N` 检查 SSE。

## 7. OpenAI Python SDK 接入

```bash
pip install -U openai
```

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:4000/v1",
    api_key=os.environ["LITELLM_MASTER_KEY"],
)

response = client.chat.completions.create(
    model="app-chat",
    messages=[{"role": "user", "content": "用一句话解释模型网关。"}],
    timeout=60,
)

print(response.choices[0].message.content)
```

业务代码只保存网关 Key，不应接触实际模型端点的 Key。

## 8. 多模型与模型别名

在 `model_list` 中继续增加项目：

```yaml
model_list:
  - model_name: app-chat
    litellm_params:
      model: openai/YOUR_CHAT_MODEL
      api_base: os.environ/UPSTREAM_API_BASE
      api_key: os.environ/UPSTREAM_API_KEY

  - model_name: app-embedding
    litellm_params:
      model: openai/YOUR_EMBEDDING_MODEL
      api_base: os.environ/UPSTREAM_API_BASE
      api_key: os.environ/UPSTREAM_API_KEY
```

不要把生成模型当 Embedding 模型。增加后分别调用 `/v1/chat/completions` 与 `/v1/embeddings` 验证，而不是只看 `/v1/models`。

## 9. 回退与重试的正确边界

网关可以做重试和 fallback，但配置前应先回答：

- 两个部署是否使用同一种协议；
- 是否支持相同上下文长度、工具、JSON Schema 和多模态输入；
- 回退后模型质量和计费是否可接受；
- 请求是否幂等，失败重试会不会重复执行外部动作。

聊天生成通常可以有限重试；已经执行付款、发信或写数据库的 Agent 工具不能因为模型超时就盲目重放。

## 10. 虚拟 Key、预算和数据库

LiteLLM Proxy 支持虚拟 Key、团队、预算和用量记录等网关能力。这类功能通常需要持久化数据库。

上线前应：

1. 按当前官方文档准备支持的数据库；
2. 用管理员主 Key 创建业务虚拟 Key；
3. 每个应用或环境使用独立 Key；
4. 设置预算、模型范围与到期策略；
5. 验证禁用或超额后确实被拒绝。

不要把 `master_key` 发给普通应用，也不要在前端 JavaScript 中使用任何网关密钥。

## 11. 生产安全清单

- 容器端口默认只绑定 `127.0.0.1`；
- 对外通过 HTTPS 反向代理，并限制请求体和超时；
- 上游 Key 只使用环境变量或 Secret 管理器；
- `config.yaml` 中不写真实 Key；
- 主 Key 与业务虚拟 Key 分离并定期轮换；
- 日志避免记录 Authorization、完整提示词和上传内容；
- 管理接口与模型调用接口使用不同网络访问策略；
- 先在测试环境升级 LiteLLM，再发布生产。

## 12. 常见错误

### 401 Unauthorized

先区分是网关拒绝调用方 Key，还是目标模型端点拒绝网关使用的 Key。检查请求是否带 `Authorization: Bearer ...`，并确认读取的是当前环境变量。

### 404 或路径重复

目标 `api_base` 通常填写到 `/v1`，LiteLLM 再拼接资源路径。若目标服务要求特殊路径，以对应 Provider 文档为准。不要凭经验反复增加 `/v1`。

### 模型不存在

调用方填写的是 `model_name`，不是 `litellm_params.model` 后面的真实模型名。修改配置后重启，并重新请求 `/v1/models`。

### 普通聊天成功但工具调用失败

检查实际模型、目标接口、LiteLLM 转换和客户端四层是否都支持工具结构。纯文本回答“我调用了工具”不算通过。

### Docker 启动后配置未生效

```bash
docker compose config
docker compose logs --tail=200 litellm
```

检查挂载路径、YAML 缩进和环境变量是否存在，不要在公开日志中打印 Key。

## 13. 上线验收

- [ ] `/v1/models` 只展示预期别名；
- [ ] 非流式与 SSE 均能完成；
- [ ] 错误 Key 返回 401；
- [ ] 目标模型不可用时行为符合重试预算；
- [ ] 应用只能调用授权模型；
- [ ] 日志和监控不含密钥；
- [ ] 重启后配置与用量数据符合预期；
- [ ] 备份和升级回滚流程已演练。

## 14. 官方来源

- [LiteLLM 官方文档](https://docs.litellm.ai/)
- [LiteLLM Proxy 配置](https://docs.litellm.ai/docs/proxy/configs)
- [LiteLLM Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys)
- [LiteLLM GitHub 仓库](https://github.com/BerriAI/litellm)
