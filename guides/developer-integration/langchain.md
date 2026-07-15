# LangChain 接入 OpenAI 兼容 API：Python / TypeScript 完整教程

> 最后核验：2026-07-14
>
> 适用范围：LangChain Python `langchain-openai` 与 JavaScript `@langchain/openai`
>
> 重要限制：`ChatOpenAI` 以 OpenAI 官方协议为目标；自定义 Base URL 可用于兼容接口的基础功能，非标准字段不会自动保留

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先理解 LangChain 的分层

LangChain 不是 API 网关。它通过模型集成包调用外部接口：

```text
你的应用
  └─ LangChain Runnable / Chain / Agent
       └─ ChatOpenAI 或 OpenAIEmbeddings
            └─ OpenAI 兼容 API
```

聊天模型、Embedding、Reranker 和向量数据库是不同组件。聊天成功不代表知识库索引已经配置完成。

## 2. 兼容范围

`ChatOpenAI` 可通过自定义 Base URL 访问实现 OpenAI Chat Completions 的服务。需要注意：

- 基础文本通常最容易兼容；
- Tool Calling 需要目标模型和接口完整支持工具字段；
- 结构化输出需要兼容 JSON Schema / Function Calling；
- Responses 只有目标服务实现该端点时才能使用；
- 第三方扩展的非标准推理字段可能不会被提取或保留；
- Embedding 必须使用单独可用的模型 ID。

## 3. 环境变量

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://your-api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
export OPENAI_EMBEDDING_MODEL="YOUR_EMBEDDING_MODEL_ID"
```

不要把 Key 放入 Notebook 输出、LangSmith trace、异常追踪附件或前端包。

## 4. Python 安装

```bash
uv add langchain-openai
```

或：

```bash
python -m pip install --upgrade langchain-openai
```

LangChain 的集成包独立发布。只升级 `langchain` 而不检查 `langchain-openai` 版本，可能导致文档参数和本地类型不一致。

## 5. Python 最小调用

```python
import os
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    timeout=30,
    max_retries=2,
    temperature=0,
)

response = model.invoke("只回复 OK")
print(response.content)
print(response.usage_metadata)
```

先确认输出为 `OK`，再开始写 Chain 或 Agent。

## 6. Python 流式输出

```python
for chunk in model.stream("用一句话解释 LangChain"):
    if chunk.content:
        print(chunk.content, end="", flush=True)
print()
```

某些兼容服务不支持流式 Usage 扩展。遇到流末尾解析错误时，先关闭相关 Usage 选项或用非流式调用定位，不要直接判断模型不可用。

## 7. Python 工具调用验证

```python
from pydantic import BaseModel, Field

class GetWeather(BaseModel):
    """查询指定城市的天气。"""
    city: str = Field(description="城市名称")

model_with_tools = model.bind_tools([GetWeather])
response = model_with_tools.invoke("查询上海天气")

print(response.tool_calls)
```

这里只验证模型能返回结构化 Tool Call，不应真的访问外部天气服务。若 `tool_calls` 为空：

1. 确认模型支持原生工具调用；
2. 检查服务是否透传 `tools` 和 `tool_choice`；
3. 检查流式工具参数是否完整；
4. 不要仅通过提示词让模型伪造 JSON。

## 8. Python 结构化输出

```python
class Result(BaseModel):
    summary: str
    score: int = Field(ge=0, le=100)

structured = model.with_structured_output(Result)
result = structured.invoke("评价：配置清晰，步骤完整。")
print(result)
```

如果服务不支持原生 JSON Schema，LangChain 可能改用工具调用或失败。不要假设所有兼容接口支持相同结构化输出模式。

## 9. Python Responses API

LangChain 官方集成可以显式请求 Responses：

```python
responses_model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    use_responses_api=True,
)

print(responses_model.invoke("只回复 OK").text)
```

使用前必须确认接口实现 `/v1/responses`。仅实现 Chat Completions 的服务不要开启该选项。

## 10. Python Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model=os.environ["OPENAI_EMBEDDING_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
)

vector = embeddings.embed_query("用于测试的短句")
print("dimension:", len(vector))
```

记录向量维度。更换 Embedding 模型后，旧向量库通常需要重新索引，不能把不同维度混进同一集合。

## 11. TypeScript 安装

```bash
pnpm add @langchain/openai @langchain/core
```

同时提交 `package.json` 与 `pnpm-lock.yaml`。

## 12. TypeScript 最小调用

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL!,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  maxRetries: 2,
  timeout: 30_000,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const response = await model.invoke("只回复 OK");
console.log(response.content);
```

Python 将 `base_url` 作为顶层参数；JavaScript 将 `baseURL` 放在 `configuration` 中。

## 13. TypeScript 流式调用

```typescript
const stream = await model.stream("用一句话解释流式输出");

for await (const chunk of stream) {
  process.stdout.write(String(chunk.content ?? ""));
}
process.stdout.write("\n");
```

若兼容接口不支持流式 Usage 元数据，可按当前 LangChain 官方参数关闭 `streamUsage` 后验证基础流式事件。

## 14. Agent 接入前的检查

创建 Agent 之前至少完成：

- [ ] 普通 `invoke`；
- [ ] `stream`；
- [ ] 单个工具调用；
- [ ] 工具结果回传后的第二轮调用；
- [ ] 多轮上下文；
- [ ] 429 与超时处理；
- [ ] 最大上下文和输出限制；
- [ ] 日志中无 Key 与私人内容。

Agent 会放大协议差异。基础测试没有通过时，不要先调 Agent Prompt。

## 15. 常见错误

### 401

检查 Key、环境变量是否加载，以及是否误把 `Bearer ` 一起写入 Key。

### 404

查看最终端点是否出现 `/v1/v1`；确认当前调用走 Chat Completions 还是 Responses。

### 400：未知字段

兼容服务没有实现 LangChain/SDK发送的扩展字段。恢复默认参数，关闭结构化输出、工具和流式 Usage 后逐项启用。

### Tool Call 能返回但 Agent 卡住

检查工具参数增量、工具调用 ID、`tool` 角色结果和下一轮消息结构，不要只看第一轮文本。

### RAG 能索引但回答无引用

分别验证检索器是否返回文档、Prompt 是否带入上下文、聊天模型是否遵守引用格式。索引成功只证明 Embedding 链路可用。

## 16. 可观测性与隐私

LangSmith 或其他 tracing 能记录 Prompt、工具参数和模型输出。启用前：

- 确认数据是否允许离开当前环境；
- 对认证头、个人信息和文档正文做脱敏；
- 为生产与开发使用不同项目；
- 设置保留期限与访问权限；
- 不把内部服务原始错误直接上传。

## 17. 升级与回滚

1. 锁定 `langchain-openai` / `@langchain/openai` 版本；
2. 保存最小文本、流式、Tool Call 和 Embedding 回归测试；
3. 升级后先运行回归测试；
4. 检查参数弃用和默认协议变化；
5. 异常时同时恢复清单与 lockfile。

## 18. 官方资料

- [LangChain Python：ChatOpenAI](https://docs.langchain.com/oss/python/integrations/chat/openai)
- [LangChain Python：Chat 模型兼容说明](https://docs.langchain.com/oss/python/integrations/chat)
- [LangChain JavaScript：ChatOpenAI 与 Custom URLs](https://docs.langchain.com/oss/javascript/integrations/chat/openai)
- [LangChain Python API Reference](https://reference.langchain.com/python/integrations/langchain_openai/)

需要完整控制请求原始结构时，先用[OpenAI 官方 SDK 教程](./openai-sdk.md)完成最小验证，再把成功参数迁移到 LangChain。
