# llama.cpp 与 llama-server 本地模型 API 完整教程

> 最后核验：2026-08-10
>
> 适用范围：GGUF 模型、macOS / Linux / Windows、CPU / GPU
>
> 预计用时：25～60 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. llama.cpp 适合谁

llama.cpp 是 C/C++ 本地推理项目，核心优势是运行 GGUF 模型、支持多种硬件后端，并提供轻量的 `llama-server`。

适合：

- 在个人电脑或边缘设备运行量化模型；
- 不想安装完整 Python 推理栈；
- 给 OpenAI SDK 或聊天客户端提供本地兼容接口；
- 需要精细控制上下文、GPU offload、并发和采样。

如果只想点几下下载和聊天，LM Studio 更省事；如果追求多 GPU 高并发，通常应同时评估 vLLM 或 SGLang。

## 2. 认识 GGUF、量化和内存

GGUF 文件通常带有 `Q4_K_M`、`Q5_K_M`、`Q8_0` 等量化标记。量化越重，文件和内存通常越小，但质量和速度不只由位数决定。

部署前至少核对：

- 模型许可证是否允许你的用途；
- 模型是否是 Instruct / Chat 版本；
- GGUF 是否包含正确 chat template；
- 文件大小能否放入可用内存与显存；
- 模型原生上下文和你计划设置的上下文是否匹配。

模型文件能放进磁盘，不代表运行时一定能放进内存。

## 3. 安装 llama.cpp

macOS Homebrew：

```bash
brew install llama.cpp
llama-server --version
```

Windows 可从官方 GitHub Releases 下载与你的 CPU / GPU 后端匹配的压缩包，解压后在目录中运行 `llama-server.exe`。

Linux 可使用官方 Release、包管理器或从源码构建。需要 CUDA、HIP、Vulkan 等加速时，应按官方 Build 文档选择后端，不能只安装 CPU 二进制后再期待自动使用 GPU。

## 4. 第一次启动

最简单的官方形式可以直接从 Hugging Face 获取兼容模型：

```bash
export LLAMA_API_KEY="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"

llama-server \
  -hf ggml-org/gemma-3-1b-it-GGUF \
  --alias local-chat \
  --host 127.0.0.1 \
  --port 8080 \
  --api-key "$LLAMA_API_KEY"
```

也可以使用本地文件：

```bash
llama-server \
  -m /absolute/path/to/model.gguf \
  --alias local-chat \
  --host 127.0.0.1 \
  --port 8080 \
  --api-key "$LLAMA_API_KEY"
```

`--alias` 决定兼容 API 中稳定的模型名。默认监听地址就是本机，但显式写出更容易审计。

## 5. 健康检查与模型列表

模型加载期间 `/health` 可能返回 503，准备好后返回 200：

```bash
curl -i http://127.0.0.1:8080/health
```

```bash
curl http://127.0.0.1:8080/v1/models \
  -H "Authorization: Bearer $LLAMA_API_KEY"
```

确认 `id` 为 `local-chat`。如果不设置别名，模型路径可能成为 ID，不利于客户端迁移。

## 6. Chat Completions

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local-chat",
    "messages": [{"role":"user","content":"只回复：llama.cpp 连接成功"}],
    "temperature": 0,
    "stream": false
  }'
```

流式验证：

```bash
curl -N http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"local-chat",
    "messages":[{"role":"user","content":"分三点介绍 GGUF"}],
    "stream":true
  }'
```

## 7. OpenAI Responses 与 Python SDK

当前 `llama-server` 也提供 `/v1/responses` 兼容入口：

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key=os.environ["LLAMA_API_KEY"],
)

response = client.responses.create(
    model="local-chat",
    input="用一句话解释量化模型。",
)

print(response.output_text)
```

该入口内部能力仍受模型和服务实现限制。某个 Responses 请求成功，不代表托管文件、内置工具等所有云端功能都存在。

## 8. 上下文、并发与 GPU Offload

常见启动结构：

```bash
llama-server \
  -m /absolute/path/to/model.gguf \
  --alias local-chat \
  -c 16384 \
  -np 4 \
  -ngl 99 \
  --host 127.0.0.1 \
  --port 8080 \
  --api-key "$LLAMA_API_KEY"
```

- `-c`：总上下文容量；
- `-np`：并行序列数量；
- `-ngl`：尝试 offload 到 GPU 的层数。

并发并非免费。增加上下文和并行槽都会增加 KV Cache 占用。建议从一个请求开始，用真实提示词逐步增大，而不是一次把参数拉满。

## 9. 工具调用与结构化输出

OpenAI 风格工具调用通常需要启用 Jinja 模板处理：

```bash
llama-server \
  -m /absolute/path/to/tool-capable-model.gguf \
  --alias local-tools \
  --jinja \
  --api-key "$LLAMA_API_KEY"
```

是否能正确生成 `tool_calls` 同时取决于：

- 模型本身是否训练过工具调用；
- GGUF 内的 chat template 是否正确；
- llama.cpp 是否识别该工具格式；
- 客户端是否正确回传工具结果。

不要为了消除报错随意强制套用 ChatML 模板。格式不匹配可能“能回答但不会正确调用工具”。

## 10. Embedding 与 Rerank

必须为任务使用专用模型。Embedding 示例：

```bash
llama-server \
  -m /absolute/path/to/embedding-model.gguf \
  --alias local-embedding \
  --embedding \
  --pooling cls \
  --port 8081 \
  --api-key "$LLAMA_API_KEY"
```

```bash
curl http://127.0.0.1:8081/v1/embeddings \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"local-embedding","input":["你好","本地向量检索"]}'
```

Pooling、文本前缀和向量用途以模型卡为准。Rerank 服务使用专用模型和 `--reranking`，不要复用生成模型。

## 11. Docker 启动

CPU 镜像示例：

```bash
docker run --rm \
  -p 127.0.0.1:8080:8080 \
  -v /absolute/path/to/models:/models:ro \
  ghcr.io/ggml-org/llama.cpp:server \
  -m /models/model.gguf \
  --alias local-chat \
  --host 0.0.0.0 \
  --port 8080 \
  --api-key CHANGE_ME
```

容器内必须监听 `0.0.0.0`，宿主机端口仍绑定 `127.0.0.1`。CUDA 使用官方对应镜像并添加 `--gpus all`，具体标签以当前官方文档为准。

## 12. 监控与性能判断

加上 `--metrics` 后可访问 Prometheus 格式的 `/metrics`：

```bash
llama-server ... --metrics
curl http://127.0.0.1:8080/metrics
```

重点观察：

- prompt 与生成吞吐；
- 正在处理和排队的请求数；
- 首 Token 延迟与总时长；
- 上下文实际用量；
- 内存、显存和系统交换空间。

只看每秒 Token 不够。面向交互时首 Token 延迟和队列长度往往更重要。

## 13. 安全边界

- 不要把无鉴权服务监听到公网或整个局域网；
- 使用 `--api-key` 或 `--api-key-file`；
- 跨机器访问时在前面加 TLS 反向代理；
- 默认不要启用实验性内置文件、Shell 或 MCP 工具；
- 不要允许服务读取任意宿主机目录；
- 模型和二进制升级后重新跑协议与质量测试。

## 14. 常见问题

### 启动即内存不足

换更小模型或更低量化，降低 `-c`、`-np` 和 GPU offload。检查是否发生大量 swap；仅仅进程没有退出不代表可用。

### 返回乱码或角色混乱

优先检查模型是不是 Chat/Instruct 版本以及 chat template 是否正确。不要先调温度。

### 404

确认客户端 Base URL 为 `http://127.0.0.1:8080/v1`，不要让客户端重复拼接 `/v1`。

### 工具调用只返回普通文本

确认使用工具模型、`--jinja` 和正确模板，并查看原始 JSON 中是否真的有结构化 `tool_calls`。

### 速度突然下降

检查上下文是否越来越长、GPU 是否因显存不足回退、是否发生 thermal throttling，以及并发是否导致排队。

## 15. 验收清单

- [ ] `/health` 返回 200；
- [ ] `/v1/models` 显示稳定别名；
- [ ] 非流式、SSE 和 SDK 均通过；
- [ ] 错误 Key 被拒绝；
- [ ] 真实上下文下内存与延迟可接受；
- [ ] 工具、Embedding 或 Rerank 按实际用途分别验证；
- [ ] 未向不可信网络开放端口；
- [ ] 记录了二进制、模型文件和量化版本。

## 16. 官方来源

- [llama.cpp 官方仓库](https://github.com/ggml-org/llama.cpp)
- [llama-server 官方文档](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [llama.cpp Build 指南](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)
- [llama.cpp Docker 文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md)
