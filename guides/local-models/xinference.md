# Xinference 本地模型、Embedding 与 Rerank 部署教程

> 最后核验：2026-07-24
>
> 适用范围：Xinference 1.x/2.x；Linux、macOS、Windows（可用后端依系统而异）
>
> 预计用时：30～90 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. Xinference 能解决什么问题

Xinference 是统一管理本地或集群推理模型的平台，可以在一个 WebUI 和 API 服务中加载：

- 大语言模型；
- Embedding 模型；
- Rerank 模型；
- 图像、音频等其他受支持模型。

它适合希望通过图形界面管理多种模型，或需要统一 API 的用户。底层仍依赖 Transformers、vLLM、llama.cpp 等推理后端，因此“Xinference 支持某个系统”不代表每一种模型格式和加速后端都支持该系统。

## 2. 创建独立环境

```bash
python3 -m venv .venv-xinference
source .venv-xinference/bin/activate
python -m pip install --upgrade pip
```

Windows PowerShell：

```powershell
py -m venv .venv-xinference
.\.venv-xinference\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

## 3. 选择安装方式

安装基础包和 Transformers 后端：

```bash
pip install "xinference[transformers]"
```

使用 vLLM 后端：

```bash
pip install "xinference[vllm]"
```

安装大部分可选能力：

```bash
pip install "xinference[all]"
```

`[all]` 体积较大，而且部分推理后端之间可能有依赖冲突。只运行一种模型时，优先安装对应后端。

检查：

```bash
xinference --help
xinference-local --help
```

## 4. 启动本地服务

只允许本机访问：

```bash
xinference-local --host 127.0.0.1 --port 9997
```

打开：

```text
WebUI: http://127.0.0.1:9997/ui
API 文档: http://127.0.0.1:9997/docs
```

需要局域网访问时：

```bash
xinference-local --host 0.0.0.0 --port 9997
```

`0.0.0.0` 会扩大暴露范围。配置鉴权、主机防火墙或反向代理之前，不要在公网服务器上这样启动。

## 5. 国内模型下载源

Xinference 默认使用 Hugging Face。需要改用 ModelScope 时：

=== "macOS / Linux"

    ```bash
    export XINFERENCE_MODEL_SRC=modelscope
    xinference-local --host 127.0.0.1 --port 9997
    ```

=== "Windows PowerShell"

    ```powershell
    $env:XINFERENCE_MODEL_SRC="modelscope"
    xinference-local --host 127.0.0.1 --port 9997
    ```

该变量改变模型来源，不会自动解决所有网络、磁盘或模型授权问题。

## 6. 通过 WebUI 启动模型

进入 WebUI 后：

1. 打开模型列表；
2. 选择 LLM、Embedding 或 Rerank 分类；
3. 找到目标模型；
4. 选择格式、量化、推理引擎和设备；
5. 设置 Model UID；
6. 点击启动；
7. 在 Running Models 中查看状态。

Model UID 是 API 调用时使用的模型标识。建议使用稳定、清晰的名称，例如：

```text
qwen3-8b
bge-m3
bge-reranker-v2-m3
```

不要把同一个 UID 分配给两个同时运行的模型。

## 7. 使用 CLI 启动模型

先查看当前版本参数：

```bash
xinference launch --help
```

示例：

```bash
xinference launch \
  --model-name qwen2.5-instruct \
  --model-engine transformers \
  --size-in-billions 7 \
  --model-format pytorch \
  --quantization none \
  --model-uid qwen2.5-instruct
```

从 Xinference v0.11.0 起，启动 LLM 时需要指定 `model_engine`。模型参数量、格式和量化等选项必须与注册模型的可用规格匹配；示例中的 7B 和 `pytorch` 只适用于对应规格，不可直接套给其他模型。

查看运行模型：

```bash
xinference list
```

停止模型：

```bash
xinference terminate --model-uid qwen2.5-instruct
```

参数名称以本机 `xinference <command> --help` 输出为最终依据，因为 CLI 会随主版本调整。

## 8. OpenAI-compatible Chat

Xinference 提供 OpenAI-compatible 接口。先从模型列表获取实际 ID：

```bash
curl http://127.0.0.1:9997/v1/models
```

Chat 请求：

```bash
curl http://127.0.0.1:9997/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-instruct",
    "messages": [
      {"role": "user", "content": "只回复：Xinference 连接成功"}
    ],
    "stream": false
  }'
```

Python：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:9997/v1",
    api_key="not-used-on-an-unauthenticated-local-instance",
)

response = client.chat.completions.create(
    model="qwen2.5-instruct",
    messages=[{"role": "user", "content": "用一句话介绍 Xinference"}],
)

print(response.choices[0].message.content)
```

示例中的 Key 只用于满足 SDK 非空校验，不是安全措施。部署启用认证后必须使用真实访问令牌。

## 9. Embedding

先在 WebUI 启动专用 Embedding 模型，再请求：

```bash
curl http://127.0.0.1:9997/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bge-m3",
    "input": [
      "什么是向量检索？",
      "向量检索通过语义相似度寻找内容。"
    ]
  }'
```

记录返回向量的维度。知识库第一次入库和后续查询必须使用兼容的 Embedding 模型与预处理方式。

## 10. Rerank

Xinference 的 Rerank 模型通过专用接口接收 query 和 documents。先在 WebUI/API 文档中确认当前实例的 Rerank 路径和请求结构，再调用。

典型请求概念：

```json
{
  "model": "bge-reranker-v2-m3",
  "query": "如何保护 API Key？",
  "documents": [
    "把密钥写进公开仓库。",
    "使用环境变量并定期轮换密钥。",
    "在日志中打印完整密钥。"
  ]
}
```

Rerank 并没有像 OpenAI Embeddings 那样统一的跨厂商协议。接入 Dify、RAGFlow 或其他知识库时，应按 Xinference 当前 API 文档和目标平台适配器同时核对。

## 11. Docker

使用官方镜像时，至少映射 Web/API 端口和持久化目录。GPU 容器还需要 NVIDIA Container Toolkit。

示意结构：

```bash
docker run -d \
  --name xinference \
  -p 9997:9997 \
  -v "$HOME/.xinference:/root/.xinference" \
  xprobe/xinference:latest \
  xinference-local --host 0.0.0.0 --port 9997
```

正式部署应固定镜像版本，不使用长期漂移的 `latest`。GPU 镜像、启动入口和挂载目录以 Xinference 官方 Docker 文档为准。

容器中的 `localhost` 指容器自己。其他容器接入时应使用同一 Compose 网络中的服务名。

## 12. 模型虚拟环境

不同模型可能依赖不同版本的 Transformers。Xinference 提供模型虚拟环境功能；在 2.0 中默认启用。需要显式控制时：

```bash
XINFERENCE_ENABLE_VIRTUAL_ENV=1 xinference-local \
  --host 127.0.0.1 \
  --port 9997
```

它能降低模型依赖互相污染的概率，但会增加磁盘占用和首次启动时间。

## 13. 生产安全

- 默认只监听 `127.0.0.1`；
- 开启 Xinference 鉴权或放在受控网关后；
- 用 TLS 保护跨主机传输；
- 防火墙只允许业务服务访问；
- 固定模型来源、版本和允许的远程代码；
- 限制单请求长度、并发和上传大小；
- 日志中不要记录完整提示词和密钥；
- 不允许未授权用户启动任意模型耗尽显存和磁盘。

## 14. 常见问题

| 现象 | 排查方法 |
|---|---|
| 模型一直下载 | 检查模型源、网络、磁盘空间和仓库授权 |
| `model_engine` 缺失 | 为 LLM 指定当前版本支持的推理引擎 |
| CUDA/PyTorch 冲突 | 在独立环境中按目标后端重新安装，不混用多个冲突后端 |
| 外部设备无法访问 | 检查 `--host 0.0.0.0`、防火墙和端口映射；先配置安全措施 |
| 404 | 检查 `/v1`、端口和 API 文档中的实际路径 |
| `model not found` | 使用 Running Models / `/v1/models` 返回的 Model UID |
| Chat 正常但 Embedding 失败 | 需要单独启动 Embedding 模型 |
| Docker 访问宿主机失败 | 容器内不能用 `localhost` 指向宿主机 |

## 15. 官方来源

- [Xinference Installation](https://inference.readthedocs.io/en/stable/getting_started/installation.html)
- [Using Xinference](https://inference.readthedocs.io/en/latest/getting_started/using_xinference.html)
- [Xinference Custom Models](https://inference.readthedocs.io/en/stable/models/custom.html)
- [Xinference Model Virtual Environments](https://inference.readthedocs.io/en/latest/models/virtualenv.html)
- [Xinference 官方仓库](https://github.com/xorbitsai/inference)
