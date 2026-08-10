# LocalAI 本地多模态兼容 API 部署完整教程

> 最后核验：2026-08-10
>
> 适用范围：LocalAI、Docker / Podman、本地 LLM 与多模态模型
>
> 预计用时：30～70 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. LocalAI 是什么

LocalAI 是开源的本地推理 API 平台。它把 llama.cpp、vLLM、Whisper、图像生成等不同后端放在统一服务后面，提供 OpenAI-compatible 及其他兼容接口，并带有模型管理和 Web 界面。

适合：

- 希望一个服务同时管理文本、Embedding、语音或图像模型；
- 想让现有 OpenAI SDK / 客户端连接本地模型；
- 需要图形化模型安装和基本聊天界面；
- 需要在本地或内网控制数据路径。

LocalAI 不是单个推理引擎。不同模型会调用不同 backend，因此同一台机器上不同功能的硬件要求和兼容性可能完全不同。

## 2. 部署前检查

```bash
docker version
docker compose version
```

同时确认：

- 磁盘有足够模型空间；
- Docker 可访问目标硬件；
- 端口 `8080` 未被占用；
- 目标模型许可证允许你的用途；
- 已决定只在本机使用，还是通过受保护的内网入口提供服务。

## 3. CPU 模式快速启动

```bash
docker run --name local-ai --rm \
  -p 127.0.0.1:8080:8080 \
  localai/localai:latest
```

打开：

```text
http://127.0.0.1:8080
```

官方还提供 NVIDIA CUDA、AMD、Intel 和 Vulkan 镜像。必须选择与机器对应的镜像和设备参数；把 CPU 镜像加上 `--gpus all` 不会自动得到完整 GPU 支持。

生产部署应固定经过验证的版本标签或 digest，不要长期跟随 `latest`。

## 4. 使用 Compose 持久化

新建 `compose.yaml`：

```yaml
services:
  localai:
    image: localai/localai:latest
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      LOCALAI_API_KEY: ${LOCALAI_API_KEY}
    volumes:
      - ./models:/models
      - ./data:/data
    restart: unless-stopped
```

新建 `.env`：

```dotenv
LOCALAI_API_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
```

```bash
printf '\n.env\n' >> .gitignore
mkdir -p models data
docker compose up -d
docker compose logs -f localai
```

> [!WARNING]
> 官方说明中，简单的 `LOCALAI_API_KEY` 具有完整管理员能力，没有角色隔离。不要把它直接发给普通用户或写进浏览器前端。

需要多用户、管理员/用户角色、OAuth 和每用户 Key 时，应评估 `LOCALAI_AUTH=true` 的认证模式，并按当前官方认证文档完成配置与验收。

## 5. 安装第一个模型

进入 Web 界面的 Models 页面，选择与你硬件匹配的小型 Chat/Instruct 模型并安装。官方快速入门当前以模型画廊为主要新手路径。

选择模型时检查：

- 模型类型是不是 Chat / Instruct；
- 下载大小与运行内存；
- 是否支持目标语言；
- 是否支持工具调用或视觉；
- 量化与 backend 是否匹配当前硬件。

不要根据名称相似就把模型用于错误任务。例如生成模型、Embedding 模型和语音模型不是同一类端点。

## 6. 验证模型列表

```bash
export LOCALAI_API_KEY="CHANGE_ME_TO_A_LONG_RANDOM_SECRET"

curl http://127.0.0.1:8080/v1/models \
  -H "Authorization: Bearer $LOCALAI_API_KEY"
```

复制响应中的准确模型 ID。网页显示名、画廊条目名和 API 模型 ID 可能不完全相同。

## 7. Chat Completions

```bash
export LOCALAI_MODEL="YOUR_INSTALLED_MODEL_ID"

curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer $LOCALAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$LOCALAI_MODEL\",
    \"messages\": [{\"role\":\"user\",\"content\":\"只回复：LocalAI 连接成功\"}],
    \"temperature\": 0,
    \"stream\": false
  }"
```

流式请求使用 `curl -N` 并设置 `"stream": true`。如果所有内容最后一次出现，检查 LocalAI 日志和反向代理缓冲。

## 8. OpenAI Python SDK

```bash
pip install -U openai
```

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key=os.environ["LOCALAI_API_KEY"],
)

response = client.chat.completions.create(
    model=os.environ["LOCALAI_MODEL"],
    messages=[{"role": "user", "content": "用一句话介绍本地推理。"}],
    timeout=120,
)

print(response.choices[0].message.content)
```

本地 CPU 首次加载可能较慢。不要用无限超时掩盖模型根本无法装入内存的问题。

## 9. Embedding、语音和图像

LocalAI 提供多类兼容端点，但必须先安装相应模型和 backend：

```text
文本聊天        /v1/chat/completions
向量            /v1/embeddings
语音识别        /v1/audio/transcriptions
语音合成        /v1/audio/speech
图像生成        /v1/images/generations
```

具体字段和能力应以 LocalAI 当前 Try it out / Features 文档以及模型配置为准。成功安装一个聊天模型，不会让其他端点自动可用。

Embedding 验证结构：

```bash
curl http://127.0.0.1:8080/v1/embeddings \
  -H "Authorization: Bearer $LOCALAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"YOUR_EMBEDDING_MODEL_ID",
    "input":["query: 什么是 LocalAI？","passage: LocalAI 提供本地模型兼容 API。"]
  }'
```

文本前缀和向量维度遵循模型卡，不要直接照搬其他 Embedding 模型的规则。

## 10. Function Calling 与内置 Agent

LocalAI 兼容工具调用，并在 Web 界面中提供带 MCP 的 Agent 能力。但是否正常依赖：

- 模型有没有工具调用训练；
- 模型模板和 backend 是否支持；
- 工具 Schema 是否足够明确；
- 工具执行权限是否被限制。

Agent 能调用命令、网络或外部系统时，应把它视为可执行程序，而不是聊天页面。先用无副作用的时间、计算工具验收，再逐步开放写操作。

## 11. 局域网与反向代理

不要直接把 `8080` 暴露到公网。推荐结构：

```text
客户端 → HTTPS 反向代理 / 身份认证 → LocalAI 内网端口
```

至少限制：

- TLS；
- 允许的来源和网络；
- 请求体大小与上传类型；
- 并发和速率；
- 读取与流式超时；
- 管理页面的访问范围。

如果只是本机使用，保持宿主机端口绑定 `127.0.0.1` 是最简单的防线。

## 12. 资源与性能排查

```bash
docker stats local-ai
docker logs --tail=200 local-ai
```

记录：

- 模型首次加载耗时；
- 首 Token 延迟；
- 生成速度；
- 内存 / 显存峰值；
- 并发增加后的排队时间；
- 长上下文请求是否导致 OOM。

不要只用一句短问题测试生产容量。应使用真实文档长度、真实并发和真实输出上限。

## 13. 常见问题

### Connection refused

```bash
docker ps --filter name=local-ai
docker logs --tail=200 local-ai
lsof -i :8080
```

确认容器仍运行、端口映射正确、模型加载没有导致进程退出。

### 401 Unauthorized

启用 `LOCALAI_API_KEY` 后，调用必须带 Bearer Key。确认 Compose 中读取到环境变量，并避免把 Key 打印到日志。

### 模型安装成功但请求说 model not found

重新请求 `/v1/models`，使用其中的准确 ID。检查模型配置、文件挂载和容器重启后的持久化路径。

### CPU 很高但迟迟没有回复

模型可能过大、上下文过长或量化不适合。先换更小模型和短请求，观察是否开始返回首 Token。

### GPU 没有被使用

检查镜像类型、设备映射、宿主机驱动和 LocalAI backend 日志。容器能看到 GPU 不等于模型已 offload。

## 14. 验收清单

- [ ] 容器重启后模型仍存在；
- [ ] `/v1/models`、Chat 和 SSE 通过；
- [ ] 错误 Key 被拒绝；
- [ ] 管理界面未向不可信网络开放；
- [ ] 每类 API 都使用对应模型单独验证；
- [ ] 真实负载下资源和延迟可接受；
- [ ] 日志中没有密钥和敏感提示词；
- [ ] 升级前已备份模型配置与数据目录。

## 15. 官方来源

- [LocalAI 官方概览](https://localai.io/docs/overview/)
- [LocalAI Quickstart](https://localai.io/basics/getting_started/)
- [LocalAI Docker 安装](https://localai.io/installation/docker/)
- [LocalAI API 示例](https://localai.io/basics/try/)
- [LocalAI GitHub 仓库](https://github.com/mudler/LocalAI)
