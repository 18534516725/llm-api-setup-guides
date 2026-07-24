# vLLM 部署 OpenAI 兼容推理服务完整教程

> 最后核验：2026-07-24
>
> 适用范围：Linux、受支持的 GPU/加速器；vLLM 在线推理服务
>
> 预计用时：30～90 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. vLLM 适合什么场景

vLLM 是面向高吞吐大模型推理的开源引擎，可把 Hugging Face 模型或本地模型目录启动为 HTTP 服务。它提供 OpenAI-compatible 的 Chat Completions、Completions、Responses、Embeddings 等接口，但具体能力取决于模型类型、任务和启动参数。

适合：

- 在 GPU 服务器上部署开源模型；
- 给现有 OpenAI SDK 或客户端提供兼容接口；
- 需要并发、连续批处理和吞吐调优；
- 希望掌控模型文件、服务日志和数据边界。

不适合把任意办公电脑直接变成生产推理集群。模型权重、KV Cache、并发和上下文都会占用显存，部署前必须根据目标模型和硬件测算。

## 2. 环境准备

先检查：

```bash
nvidia-smi
python3 --version
```

vLLM 与 Python、PyTorch、CUDA 的支持组合会更新。安装前查看 [vLLM Installation](https://docs.vllm.ai/en/latest/getting_started/installation/) 中与你的硬件对应的安装方式。

建议使用独立虚拟环境：

```bash
python3 -m venv .venv-vllm
source .venv-vllm/bin/activate
python -m pip install --upgrade pip
pip install vllm
```

检查：

```bash
vllm --version
vllm serve --help
```

不要在已有 PyTorch 训练环境中直接安装，以免依赖版本互相覆盖。

## 3. 启动第一个 Chat 服务

示例模型：

```bash
export VLLM_API_KEY="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"

vllm serve Qwen/Qwen3-8B \
  --host 127.0.0.1 \
  --port 8000 \
  --dtype auto \
  --api-key "$VLLM_API_KEY"
```

关键点：

- `--host 127.0.0.1` 只允许本机访问；
- `--port 8000` 设置端口；
- `--api-key` 为 `/v1` 兼容接口增加 Bearer Token 校验；
- 首次启动会下载模型，所需空间不等于模型参数量的简单倍数。

先不要加入长上下文、量化、LoRA 和工具调用参数。最小服务正常后再逐项增加。

## 4. 检查模型列表

```bash
curl http://127.0.0.1:8000/v1/models \
  -H "Authorization: Bearer $VLLM_API_KEY"
```

返回的 `id` 就是客户端应填写的模型 ID。

如需给客户端一个稳定别名：

```bash
vllm serve Qwen/Qwen3-8B \
  --host 127.0.0.1 \
  --port 8000 \
  --served-model-name qwen3-8b \
  --api-key "$VLLM_API_KEY"
```

之后客户端模型名填写：

```text
qwen3-8b
```

## 5. Chat Completions

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-8b",
    "messages": [
      {"role": "user", "content": "只回复：vLLM 连接成功"}
    ],
    "temperature": 0,
    "stream": false
  }'
```

Chat 接口要求模型存在可用的 chat template。启动报错或回复格式异常时，应检查模型仓库提供的模板说明，不要随意套用其他模型模板。

## 6. 使用 OpenAI Python SDK

```bash
pip install openai
export OPENAI_BASE_URL="http://127.0.0.1:8000/v1"
export OPENAI_API_KEY="$VLLM_API_KEY"
export OPENAI_MODEL="qwen3-8b"
```

```python
import os

from openai import OpenAI

client = OpenAI(
    base_url=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
)

response = client.chat.completions.create(
    model=os.environ["OPENAI_MODEL"],
    messages=[
        {"role": "user", "content": "用一句话解释连续批处理。"}
    ],
)

print(response.choices[0].message.content)
```

## 7. 流式输出

```bash
curl -N http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-8b",
    "messages": [
      {"role": "user", "content": "分三点介绍 vLLM"}
    ],
    "stream": true
  }'
```

客户端应持续收到 SSE 数据，而不是等待整个回答结束后一次返回。

## 8. 部署 Embedding 模型

Embedding 需要使用相应模型，并让 vLLM 以正确任务运行。示例：

```bash
vllm serve intfloat/multilingual-e5-large \
  --host 127.0.0.1 \
  --port 8001 \
  --runner pooling \
  --served-model-name multilingual-e5-large \
  --api-key "$VLLM_API_KEY"
```

请求：

```bash
curl http://127.0.0.1:8001/v1/embeddings \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "multilingual-e5-large",
    "input": ["query: 什么是向量检索？", "passage: 向量检索通过语义向量寻找相近内容。"]
  }'
```

模型要求的 `query:`、`passage:` 前缀要以模型卡为准。不要把普通生成模型默认当成 Embedding 模型。

## 9. 工具调用

工具调用是否可用同时取决于：

- 模型是否训练过工具调用；
- 模型的 chat template；
- vLLM 是否有匹配的 tool-call parser；
- 客户端能否正确处理 `tool_calls`。

常见启动结构：

```bash
vllm serve YOUR_TOOL_MODEL \
  --served-model-name your-tool-model \
  --enable-auto-tool-choice \
  --tool-call-parser YOUR_MODEL_PARSER \
  --api-key "$VLLM_API_KEY"
```

`YOUR_MODEL_PARSER` 不能凭模型名字猜测，必须查 vLLM 的 Tool Calling 文档和目标模型说明。普通聊天成功不能证明 Agent 工具调用兼容。

## 10. 显存与上下文调优

常用参数：

```text
--gpu-memory-utilization
--max-model-len
--tensor-parallel-size
--max-num-seqs
```

调优原则：

1. 先用默认参数启动；
2. 记录空载显存；
3. 用真实长度请求测试；
4. 逐步增加并发；
5. 同时观察吞吐、首 Token 延迟和失败率；
6. 每次只修改一个主要参数。

降低 `--gpu-memory-utilization` 不一定能解决所有 OOM：数值过低也可能没有足够空间装载模型或 KV Cache。应结合错误发生阶段判断。

多卡张量并行示例：

```bash
vllm serve YOUR_MODEL \
  --tensor-parallel-size 2 \
  --api-key "$VLLM_API_KEY"
```

模型和卡数必须适合并行切分，部署前查看对应平台说明。

## 11. 生产安全

`--api-key` 主要保护 `/v1` 前缀下的 OpenAI-compatible 接口。vLLM 官方安全文档明确提醒：同一 HTTP 服务上可能还存在未被该参数保护的其他敏感端点。

生产环境至少应：

- 在内网监听；
- 使用防火墙或安全组限制来源；
- 通过反向代理配置 TLS、认证、限流和请求体大小；
- 不把管理端点直接暴露到公网；
- 固定已审查的模型与 chat template；
- 关闭不需要的动态 LoRA、远程代码等高风险能力；
- 对日志中的提示词、密钥和业务数据做保护。

`--trust-remote-code` 会执行模型仓库提供的 Python 代码。只有审查并固定可信版本后才能使用。

## 12. 常见问题

| 现象 | 排查方法 |
|---|---|
| CUDA OOM | 降低上下文或并发，选择更小/量化模型，检查其他 GPU 进程 |
| Chat 返回 400 | 检查模型是否有 chat template、请求字段和模型 ID |
| 401 | 请求头必须是 `Authorization: Bearer <key>` |
| 404 | 检查端口、`/v1` 路径和服务实际模型名 |
| 模型下载慢 | 预先下载到本地缓存，确认磁盘空间和网络 |
| 工具调用输出普通文本 | 模型、模板或 parser 不匹配 |
| Embedding 接口失败 | 确认部署的是 Embedding 模型，并使用正确 runner/task |
| 并发后延迟暴涨 | 记录队列、KV Cache、批处理和 GPU 利用率，逐步调 `max-num-seqs` |

## 13. 官方来源

- [vLLM Installation](https://docs.vllm.ai/en/latest/getting_started/installation/)
- [vLLM OpenAI-Compatible Server](https://docs.vllm.ai/en/latest/serving/openai_compatible_server/)
- [vLLM Tool Calling](https://docs.vllm.ai/en/latest/features/tool_calling/)
- [vLLM Security](https://docs.vllm.ai/en/latest/usage/security/)
- [vLLM 官方仓库](https://github.com/vllm-project/vllm)
