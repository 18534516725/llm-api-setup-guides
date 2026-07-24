# Ollama 本地模型部署与 OpenAI 兼容 API 接入教程

> 最后核验：2026-07-24
>
> 适用范围：Windows、macOS、Linux 上的 Ollama；以本机或局域网方式提供模型 API
>
> 预计用时：10～25 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. Ollama 能解决什么问题

Ollama 可以在自己的电脑上下载、运行和管理开源模型，并通过 HTTP API 提供推理服务。它同时提供原生接口、部分 OpenAI 兼容接口和 Anthropic Messages 兼容接口，因此很多聊天客户端、SDK 和编程工具只需修改 Base URL 就能连接本地模型。

适合以下场景：

- 希望提示词和模型推理尽量留在本机；
- 想在断网环境或局域网中使用模型；
- 开发应用时需要一个可反复测试的本地 API；
- 想先用本地模型验证 Chat、Embedding、Tools 或 Responses 流程。

本地运行并不等于“任何模型都免费且无限快”。实际速度、上下文长度和并发能力取决于模型大小、量化版本、内存、显存和 CPU/GPU 卸载情况。

## 2. 安装 Ollama

从 [Ollama 官方下载页](https://ollama.com/download) 获取对应系统版本。

macOS 也可以使用 Homebrew：

```bash
brew install ollama
```

Linux 官方安装命令：

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

安装后检查：

```bash
ollama --version
```

如果桌面应用没有自动启动服务，可运行：

```bash
ollama serve
```

默认监听地址为：

```text
http://localhost:11434
```

## 3. 下载并运行第一个模型

先在 [Ollama 模型库](https://ollama.com/search) 选择适合设备的模型。示例：

```bash
ollama pull qwen3:8b
```

直接在终端对话：

```bash
ollama run qwen3:8b
```

查看本地已有模型：

```bash
ollama list
```

查看当前正在运行的模型、处理器分配和上下文：

```bash
ollama ps
```

模型名必须使用 `ollama list` 中实际存在的名称。教程中的 `qwen3:8b` 只是示例，不代表所有设备都能流畅运行。

## 4. 先验证原生 API

用最小请求确认服务和模型正常：

```bash
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "messages": [
      {"role": "user", "content": "只回复：连接成功"}
    ],
    "stream": false
  }'
```

如果这里失败，先不要配置第三方客户端。依次检查：

1. `ollama serve` 是否正在运行；
2. `ollama list` 是否存在目标模型；
3. 模型 ID 是否完整；
4. 11434 端口是否被占用或被防火墙拦截。

## 5. OpenAI 兼容接口

Ollama 官方提供部分 OpenAI API 兼容能力。常用 Base URL：

```text
http://localhost:11434/v1
```

最小 Chat Completions 请求：

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "messages": [
      {"role": "user", "content": "只回复：OpenAI 兼容接口正常"}
    ],
    "stream": false
  }'
```

Python SDK：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

response = client.chat.completions.create(
    model="qwen3:8b",
    messages=[
        {"role": "user", "content": "用一句话解释什么是本地模型"}
    ],
)

print(response.choices[0].message.content)
```

OpenAI SDK 要求 `api_key` 非空，但 Ollama 本机兼容接口会忽略这个值。不要误以为填写 `ollama` 就给服务增加了访问控制。

## 6. Responses API 与 Embedding

Ollama 从 v0.13.3 起支持 OpenAI 兼容的 `/v1/responses`，但官方明确说明不支持依赖 `previous_response_id` 或 `conversation` 的有状态续接。客户端如果强依赖这些能力，不能只凭一次文字回复就判断完全兼容。

```bash
curl http://localhost:11434/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "input": "只回复：Responses 正常"
  }'
```

Embedding 需要先下载专用向量模型，例如：

```bash
ollama pull embeddinggemma
```

再调用：

```bash
curl http://localhost:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "embeddinggemma",
    "input": ["第一段文本", "第二段文本"]
  }'
```

聊天模型和 Embedding 模型用途不同。知识库应用更换 Embedding 模型后，通常需要重新生成向量索引。

## 7. 接入桌面客户端和开发工具

在支持 OpenAI-compatible 的工具中通常填写：

```text
Provider: OpenAI Compatible
Base URL: http://localhost:11434/v1
API Key: ollama
Model ID: qwen3:8b
```

如果客户端运行在 Docker 容器中，容器内的 `localhost` 指向容器自己，不能直接访问宿主机 Ollama。macOS/Windows 的 Docker Desktop 通常可尝试：

```text
http://host.docker.internal:11434/v1
```

Linux Docker 需要显式配置宿主机网关或使用同一 Compose 网络。不要为了省事把 Ollama 直接暴露到公网。

## 8. 上下文长度和内存

Ollama 当前会按可用显存给出不同默认上下文：低于 24 GiB 通常为 4K，24～48 GiB 通常为 32K，48 GiB 及以上通常为 256K。实际值还受模型和运行环境影响，应以 `ollama ps` 为准。

临时提高服务上下文：

```bash
OLLAMA_CONTEXT_LENGTH=64000 ollama serve
```

也可以创建带固定上下文的模型：

```text
FROM qwen3:8b
PARAMETER num_ctx 32768
```

保存为 `Modelfile` 后运行：

```bash
ollama create qwen3-32k -f Modelfile
```

上下文越大，占用内存或显存越高，不会无成本提升。出现系统变卡、模型频繁装卸或大量 CPU offload 时，应先降低模型规模或上下文。

## 9. 局域网访问与安全

默认只允许本机访问最安全。确实需要给局域网其他设备使用时，可以调整监听地址：

```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

启用前至少做到：

- 只在可信局域网使用；
- 用系统防火墙限制来源 IP；
- 不在路由器上映射 11434 到公网；
- 需要跨网络访问时，使用带认证的反向代理或 VPN；
- 不把无认证端口暴露给浏览器页面或不可信容器。

Ollama 本机 API 默认没有传统 API Key 鉴权。局域网开放后，能访问端口的人可能调用模型、消耗资源或读取模型列表。

## 10. 常见问题

| 现象 | 排查方法 |
|---|---|
| Connection refused | 确认 `ollama serve` 正在运行，地址和端口正确 |
| model not found | 运行 `ollama list`，使用完整模型名，必要时先 `ollama pull` |
| 客户端 404 | Base URL 通常填到 `/v1`，不要重复拼接 `/chat/completions` |
| Docker 客户端连不上 | 容器内不要填 `localhost`，改用宿主机网关或同一网络 |
| 回复很慢 | 检查 `ollama ps` 的处理器分配，换更小或更高量化模型 |
| 内存占用过高 | 降低上下文、并发或模型大小，停止不用的模型 |
| 聊天正常但 Agent 失败 | 单独验证 Tools、流式工具参数和工具结果回传 |
| Responses 对话续接失败 | Ollama 不支持 `previous_response_id` / `conversation` 的有状态模式 |

## 11. 更新、停止与删除

更新 Ollama 后重新检查版本，并用最小请求复测。停止运行中的模型：

```bash
ollama stop qwen3:8b
```

删除模型：

```bash
ollama rm qwen3:8b
```

删除模型不可撤销，需要时必须重新下载。卸载应用前，先确认是否还要保留模型文件和自定义 `Modelfile`。

## 12. 官方资料

- [Ollama 下载](https://ollama.com/download)
- [Ollama 模型库](https://ollama.com/search)
- [Ollama API 介绍](https://docs.ollama.com/api/introduction)
- [OpenAI API 兼容说明](https://docs.ollama.com/api/openai-compatibility)
- [Anthropic Messages 兼容说明](https://docs.ollama.com/api/anthropic-compatibility)
- [上下文长度](https://docs.ollama.com/context-length)
- [Modelfile 参考](https://docs.ollama.com/modelfile)
