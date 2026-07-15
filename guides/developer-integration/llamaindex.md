# LlamaIndex 接入 OpenAI 兼容 API：OpenAILike、Embedding 与 RAG

> 最后核验：2026-07-14
>
> 适用范围：LlamaIndex Python 的 `OpenAILike`、`OpenAIEmbedding` 与 `Settings`
>
> 推荐做法：聊天使用 `OpenAILike` 明确填写模型元数据，Embedding 单独配置并单独验证

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. LlamaIndex 的三条链路

```text
文档加载与切分
  └─ Embedding API → 向量索引
                        └─ 检索相关片段
                              └─ Chat API → 最终回答
```

任意一条失败，RAG 都无法完整工作。必须先分别测试 LLM 与 Embedding，再创建索引。

## 2. 为什么使用 OpenAILike

LlamaIndex 的 `OpenAILike` 是面向 OpenAI 兼容 API 的薄封装，允许自定义：

- `model`；
- `api_base`；
- `api_key`；
- `context_window`；
- `is_chat_model`；
- `is_function_calling_model`；
- 超时、重试和输出长度。

准确填写模型元数据很重要。框架无法从一个自定义模型 ID 自动推断上下文、聊天类型和工具能力。

## 3. 安装

```bash
uv add llama-index-core llama-index-llms-openai-like llama-index-embeddings-openai
```

或：

```bash
python -m pip install --upgrade \
  llama-index-core \
  llama-index-llms-openai-like \
  llama-index-embeddings-openai
```

LlamaIndex 使用拆分后的集成包。遇到 ImportError 时先检查包名与版本，不要从旧教程复制已迁移的导入路径。

## 4. 环境变量

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://your-api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
export OPENAI_EMBEDDING_MODEL="YOUR_EMBEDDING_MODEL_ID"
```

生产环境使用 Secret 管理。不要把文档正文、Key 或原始检索结果写进公开 Notebook。

## 5. 测试聊天模型

```python
import os
from llama_index.llms.openai_like import OpenAILike

llm = OpenAILike(
    model=os.environ["OPENAI_MODEL"],
    api_base=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
    context_window=128_000,
    max_tokens=1024,
    is_chat_model=True,
    is_function_calling_model=False,
    timeout=30,
    max_retries=2,
)

response = llm.complete("只回复 OK")
print(response.text)
```

`context_window` 示例不是对所有模型的真实承诺。必须按控制台提供的能力填写，过高会导致估算和截断行为错误。

## 6. 流式测试

```python
stream = llm.stream_complete("用一句话解释 LlamaIndex")

for chunk in stream:
    print(chunk.delta, end="", flush=True)
print()
```

非流式正常、流式失败时检查 SSE、代理缓冲和兼容服务返回的增量字段。

## 7. 配置 Embedding

```python
from llama_index.embeddings.openai import OpenAIEmbedding

embed_model = OpenAIEmbedding(
    model=os.environ["OPENAI_EMBEDDING_MODEL"],
    api_base=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
    timeout=30,
    max_retries=2,
)

vector = embed_model.get_text_embedding("用于测试的短句")
print("dimension:", len(vector))
```

记录实际维度。向量数据库 Collection 的维度必须一致，更换 Embedding 模型后通常需要重建索引。

## 8. 设置全局模型

```python
from llama_index.core import Settings

Settings.llm = llm
Settings.embed_model = embed_model
```

大型项目更推荐把模型对象显式传入 Index 或 Query Engine，减少测试之间共享全局状态。

## 9. 最小 RAG 示例

```python
from llama_index.core import Document, VectorStoreIndex

documents = [
    Document(text="项目代号是 Bluebird，发布日期是 2026 年 7 月。"),
    Document(text="项目负责人是测试用户，本示例不包含真实个人信息。"),
]

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model,
)

query_engine = index.as_query_engine(llm=llm, similarity_top_k=2)
response = query_engine.query("项目代号是什么？")

print(response)
for node in response.source_nodes:
    print(node.score, node.node.get_content()[:80])
```

预期回答 `Bluebird`，且 `source_nodes` 包含对应文本。只看最终答案无法判断检索是否真正生效。

## 10. Tool Calling

只有模型与兼容接口完整支持原生工具调用时才设置：

```python
tool_llm = OpenAILike(
    model=os.environ["OPENAI_MODEL"],
    api_base=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
    is_chat_model=True,
    is_function_calling_model=True,
    context_window=128_000,
)
```

这个布尔值是能力声明，不会给模型增加能力。错误开启可能让 Agent 进入失败循环。

## 11. 文档切分

索引质量不只取决于模型：

- 代码、Markdown、PDF 使用合适解析器；
- Chunk 不要大到挤占回答上下文；
- 保留来源、标题、权限标签等元数据；
- 相邻片段适度重叠；
- OCR 文档先检查乱码；
- 为不同租户增加检索过滤，不能只靠 Prompt 隔离数据。

## 12. 常见错误

### ImportError

当前版本缺少拆分集成包，或使用了旧版导入路径。核对官方 API Reference 与已安装版本。

### 模型无法识别

自定义模型优先用 `OpenAILike`，并明确填写 `context_window` 与模型类型。

### 404

检查 `api_base` 是否重复 `/v1`，并确认服务实现聊天或 Embedding 对应端点。

### Embedding 维度错误

当前模型输出维度与现有 Collection 不一致。创建新集合并重新索引，不要强行混用向量。

### 能检索但回答错误

打印 `source_nodes`：

- 没有正确片段：调整切分、Embedding、Top K 和过滤；
- 有正确片段：检查回答 Prompt、上下文长度和聊天模型；
- 分数异常：检查索引是否混入其他模型生成的向量。

### 429 / Timeout

降低 Embedding 批量大小与并发，设置有限重试；大批文档导入应支持断点、幂等和进度记录。

## 13. 数据与安全

- 文档会被发送给 Embedding API；检索片段会被发送给聊天 API；
- 导入合同、客户资料和代码前确认数据处理规则；
- 向量和元数据也可能泄露语义信息，需要访问控制和备份加密；
- 日志不记录 Key、完整文档或未经脱敏的原始错误；
- 多租户检索必须在数据库查询层过滤；
- 删除文档时同步删除节点、向量、缓存和备份生命周期中的副本。

## 14. 上线验收

- [ ] LLM 非流式与流式；
- [ ] Embedding 维度固定；
- [ ] 小型索引可查询；
- [ ] `source_nodes` 引用正确；
- [ ] 重新启动后索引可恢复；
- [ ] 文档更新和删除生效；
- [ ] 租户过滤不可绕过；
- [ ] 429、超时和失败导入可恢复；
- [ ] Key 和文档正文不进入公开日志。

## 15. 升级与回滚

同时记录 `llama-index-core` 与各集成包版本。升级后运行 LLM、Embedding、索引持久化和查询回归测试。若 Embedding 行为或维度变化，不要在原索引上直接覆盖，先建立新索引并验证切换。

## 16. 官方资料

- [LlamaIndex：OpenAILike API Reference](https://docs.llamaindex.ai/en/stable/api_reference/llms/openai_like/)
- [LlamaIndex：Settings 迁移与配置](https://docs.llamaindex.ai/en/stable/module_guides/supporting_modules/settings/)
- [LlamaIndex：Embedding 模型](https://docs.llamaindex.ai/en/stable/module_guides/models/embeddings/)
- [LlamaIndex 官方 GitHub](https://github.com/run-llama/llama_index)

先分别跑通 LLM 与 Embedding，再进入 RAG。把所有问题都归因于“模型不兼容”会掩盖索引、切分和向量库错误。
