# SGLang 部署 OpenAI 兼容推理服务完整教程

> 最后核验：2026-08-10
>
> 适用范围：Linux、NVIDIA GPU 为主；SGLang 在线推理服务
>
> 预计用时：35～90 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. SGLang 的定位

SGLang 是面向大模型和多模态模型的高性能推理与服务框架，可启动 OpenAI-compatible API，并提供 Radix Cache、并行、量化、推测解码、结构化输出、工具解析与可观测性等能力。

适合：

- 在 GPU 服务器部署 Hugging Face 模型；
- 需要较高吞吐、缓存和批处理能力；
- 希望现有 OpenAI SDK 直接接入自建模型；
- 需要推理服务的生产监控和扩展能力。

如果只是个人电脑运行小型 GGUF，应优先看 Ollama、LM Studio 或 llama.cpp。SGLang 的安装、CUDA 和显存规划门槛明显更高。

## 2. 先检查硬件与版本

```bash
nvidia-smi
python3 --version
docker version
```

当前官方文档要求 Python 3.10 或更高，但 SGLang、PyTorch、CUDA、attention backend 的兼容组合更新很快。安装当天必须查看官方 Installation 页面，不要把博客里的旧 CUDA 命令长期复用。

同时估算：

- 模型权重占用；
- KV Cache 与计划上下文；
- 并发和 batch；
- 多 GPU 张量并行；
- 模型下载缓存空间。

## 3. 推荐的 Docker 启动方式

准备 Hugging Face Token（仅在模型要求时使用）和 API Key：

```bash
export HF_TOKEN="YOUR_HUGGING_FACE_TOKEN"
export SGLANG_API_KEY="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
```

```bash
docker run --rm --gpus all \
  --shm-size 32g \
  --ipc=host \
  -p 127.0.0.1:30000:30000 \
  -v "$HOME/.cache/huggingface:/root/.cache/huggingface" \
  -e HF_TOKEN \
  lmsysorg/sglang:latest \
  python3 -m sglang.launch_server \
    --model-path Qwen/Qwen3-4B \
    --served-model-name local-chat \
    --host 0.0.0.0 \
    --port 30000 \
    --api-key "$SGLANG_API_KEY"
```

容器内监听 `0.0.0.0`，宿主机只映射到 `127.0.0.1`。生产环境使用官方建议的较小 runtime 镜像并固定不可变版本标签；`latest` 与 `dev` 都会变化。

示例模型只用于演示启动结构。部署前应按显存、许可证和任务选择模型。

## 4. pip / uv 安装

官方当前推荐 `uv` 加速安装：

```bash
python3 -m venv .venv-sglang
source .venv-sglang/bin/activate
python -m pip install --upgrade pip uv
uv pip install --prerelease=allow sglang
```

启动：

```bash
python3 -m sglang.launch_server \
  --model-path Qwen/Qwen3-4B \
  --served-model-name local-chat \
  --host 127.0.0.1 \
  --port 30000 \
  --api-key "$SGLANG_API_KEY"
```

如果官方当前 wheel 与本机 CUDA 主版本不匹配，应按 Installation 页面选择对应 index 或 Docker 镜像，不要手工混装任意 PyTorch wheel。

## 5. 健康检查与模型列表

等待日志显示模型加载完成：

```bash
curl http://127.0.0.1:30000/health
```

```bash
curl http://127.0.0.1:30000/v1/models \
  -H "Authorization: Bearer $SGLANG_API_KEY"
```

确认客户端将使用别名 `local-chat`，而不是仓库路径。

## 6. Chat Completions

```bash
curl http://127.0.0.1:30000/v1/chat/completions \
  -H "Authorization: Bearer $SGLANG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"local-chat",
    "messages":[{"role":"user","content":"只回复：SGLang 连接成功"}],
    "temperature":0,
    "max_tokens":64,
    "stream":false
  }'
```

流式验证：

```bash
curl -N http://127.0.0.1:30000/v1/chat/completions \
  -H "Authorization: Bearer $SGLANG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"local-chat",
    "messages":[{"role":"user","content":"分三点介绍连续批处理"}],
    "stream":true
  }'
```

## 7. OpenAI Python SDK

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:30000/v1",
    api_key=os.environ["SGLANG_API_KEY"],
)

response = client.chat.completions.create(
    model="local-chat",
    messages=[{"role": "user", "content": "用一句话解释 Radix Cache。"}],
    temperature=0,
    timeout=120,
)

print(response.choices[0].message.content)
```

如果 SDK 请求失败，先用 curl 验证服务，避免把模型加载、网络和 SDK 配置三个问题混在一起。

## 8. Reasoning 模型

思考模型通常需要匹配 reasoning parser。例如 Qwen3 的结构形态为：

```bash
python3 -m sglang.launch_server \
  --model-path Qwen/Qwen3-4B \
  --served-model-name local-reasoning \
  --reasoning-parser qwen3 \
  --api-key "$SGLANG_API_KEY"
```

请求可通过 `extra_body` 传递模型支持的模板参数：

```python
response = client.chat.completions.create(
    model="local-reasoning",
    messages=[{"role": "user", "content": "计算 17×19。"}],
    extra_body={
        "chat_template_kwargs": {"enable_thinking": True},
        "separate_reasoning": True,
    },
)
```

parser 和参数必须按 SGLang 当前支持表与目标模型说明选择。错误 parser 可能把思考文本混进最终回答或导致字段为空。

## 9. 工具调用与结构化输出

工具调用通常还需要模型对应的 tool-call parser：

```bash
python3 -m sglang.launch_server \
  --model-path YOUR_TOOL_MODEL \
  --served-model-name local-tools \
  --tool-call-parser YOUR_MATCHING_PARSER \
  --api-key "$SGLANG_API_KEY"
```

验收必须检查原始响应是否包含结构化工具名和 JSON 参数，并完成“模型请求工具 → 应用执行 → 工具结果回传 → 模型总结”的完整两轮流程。

结构化输出可使用 JSON Schema、正则或 EBNF 等能力，但应先验证目标模型在受约束生成下的质量和延迟。

## 10. Embedding 与视觉模型

SGLang 提供 OpenAI-compatible 的 Embedding 和 Vision 教程入口，但服务参数与模型架构相关。

部署原则：

- 生成、Embedding 和 Rerank 使用各自专用模型；
- 视觉模型要检查图片输入格式、尺寸和显存；
- `/v1/models` 存在不等于目标任务端点可用；
- 每类模型独立做最小请求和批量请求验收。

## 11. 显存与并行调优

常见方向包括：

- 限制最大上下文；
- 调整静态内存比例；
- 多 GPU tensor parallel；
- 量化权重或 KV Cache；
- 调整并发和批处理；
- 启用匹配硬件的 attention backend。

每次只改一组参数，并记录相同测试集下的：首 Token 延迟、输出吞吐、P95/P99、显存峰值、错误率。吞吐上升但 P99 大幅恶化，可能不适合交互业务。

## 12. 生产监控

生产环境至少关注：

- 服务健康和模型加载状态；
- 正在运行、排队和失败的请求；
- prompt / generation Token；
- 首 Token 与端到端延迟；
- KV Cache 使用；
- GPU 利用率、显存、温度和功耗；
- 容器退出与 OOM。

SGLang 提供官方 Observability、Production Metrics 与 Request Tracing 文档。埋点可能包含提示词或模型输出，导出前要做隐私分级和脱敏。

## 13. 安全与部署边界

- 使用 `--api-key`，不要开放匿名公网推理；
- API Key、HF Token 使用 Secret 管理器；
- 对外通过 HTTPS 网关做限流和请求大小控制；
- 模型仓库若使用自定义代码，先做代码与许可证审查；
- 固定镜像和依赖版本，升级前跑回归；
- 不在错误响应和日志中回显 Authorization；
- 管理、指标和推理接口分开控制访问范围。

## 14. 常见问题

### CUDA_HOME 或 wheel 不匹配

停止继续混装。记录 `nvidia-smi`、Python、PyTorch 和 SGLang 版本，对照官方当前安装矩阵，优先换匹配镜像。

### 模型加载 OOM

换更小模型、减少上下文与并发、使用匹配的量化或增加 tensor parallel。不要把容器重启循环当临时解决方案。

### 请求 404

客户端 Base URL 通常是 `http://127.0.0.1:30000/v1`。检查是否重复 `/v1`，以及调用的是 Chat、Vision 还是 Embedding 端点。

### 回复里混有思考标签

检查模型模板、reasoning parser 和请求中的 `chat_template_kwargs`。不要用字符串截取代替正确解析。

### 工具调用失败

确认模型、tool parser、Schema 和客户端回传链路。先用一个无副作用工具最小化验证。

## 15. 验收清单

- [ ] 记录了镜像、SGLang、CUDA 与模型版本；
- [ ] 健康检查、模型列表、非流式和 SSE 通过；
- [ ] 错误 API Key 被拒绝；
- [ ] reasoning / tool / vision / embedding 按需独立验证；
- [ ] 真实上下文与并发下无 OOM；
- [ ] 已记录 P50、P95、P99 和吞吐；
- [ ] 指标与日志不泄露 Key 或敏感输入；
- [ ] 有可复现的升级和回滚方案。

## 16. 官方来源

- [SGLang 官方文档](https://docs.sglang.io/)
- [SGLang 安装指南](https://docs.sglang.io/docs/get-started/install)
- [SGLang OpenAI-compatible API](https://docs.sglang.io/docs/basic_usage/openai_api_completions)
- [SGLang Server Arguments](https://docs.sglang.io/docs/advanced_features/server_arguments)
- [SGLang GitHub 仓库](https://github.com/sgl-project/sglang)
