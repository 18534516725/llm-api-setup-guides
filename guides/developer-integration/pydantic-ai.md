# PydanticAI 自定义 OpenAI 兼容 API 完整教程

> 最后核验：2026-07-15
>
> 适用范围：PydanticAI；OpenAI Responses、Chat Completions 与结构化 Agent 输出

[← 返回教程目录](../../README.md)

> [!TIP]
> [纽智中转站](https://www.nexotoken.net/?ref=github) 可用于测试多模型 API。创建 Key 后先确认模型支持的协议、工具调用与结构化输出，再替换本文占位符；活动和价格以官网实时页面为准。

## 1. 为什么要明确模型类

当前 PydanticAI 的 OpenAI Provider 有两条主要路径：

| 模型类 | API | 使用条件 |
|---|---|---|
| `OpenAIResponsesModel` | Responses | 服务完整实现 `/v1/responses` |
| `OpenAIChatModel` | Chat Completions | 服务实现 `/v1/chat/completions` |

`openai:` 前缀默认偏向 Responses。使用第三方兼容接口时，显式创建 Provider 和模型类更容易定位问题。

## 2. 安装与环境变量

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install "pydantic-ai-slim[openai]"
```

Windows PowerShell 激活命令是 `.venv\Scripts\Activate.ps1`。

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://your-api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
```

## 3. Chat Completions 最小示例

```python
import os

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

provider = OpenAIProvider(
    base_url=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
)

model = OpenAIChatModel(
    os.environ["OPENAI_MODEL"],
    provider=provider,
)

agent = Agent(model, instructions="回答准确、简洁，不确定时直接说明。")
result = agent.run_sync("只回复 OK")
print(result.output)
```

## 4. Responses API 示例

服务明确支持 Responses 时只需更换模型类：

```python
from pydantic_ai.models.openai import OpenAIResponsesModel

model = OpenAIResponsesModel(
    os.environ["OPENAI_MODEL"],
    provider=provider,
)

agent = Agent(model)
result = agent.run_sync("只回复 OK")
print(result.output)
```

不要因为模型名称属于 GPT 系列就默认端点一定支持 Responses。接口能力由实际服务实现决定。

## 5. 结构化输出

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent


class Book(BaseModel):
    title: str
    author: str
    score: int = Field(ge=1, le=10)


book_agent = Agent(
    model,
    output_type=Book,
    instructions="根据用户描述整理图书信息，缺失信息不要编造。",
)

result = book_agent.run_sync("《三体》，作者刘慈欣，评分 9")
print(result.output.model_dump())
```

若兼容端点不支持原生 JSON Schema，框架可能通过工具调用或提示词完成结构化输出。上线前要用缺字段、错误类型和长文本案例测试，不要只测一个理想输入。

## 6. 函数工具

```python
from pydantic_ai import Agent, RunContext

tool_agent = Agent(model, instructions="需要换算时调用工具。")


@tool_agent.tool
def celsius_to_fahrenheit(ctx: RunContext[None], celsius: float) -> float:
    return celsius * 9 / 5 + 32


result = tool_agent.run_sync("20 摄氏度是多少华氏度？")
print(result.output)
```

测试时检查工具是否实际执行、参数是否为数值、结果是否正确回传。模型直接心算得出答案不算工具兼容验证。

## 7. 自定义 AsyncOpenAI 客户端

需要统一超时和重试时：

```python
from openai import AsyncOpenAI
from pydantic_ai.providers.openai import OpenAIProvider

client = AsyncOpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    timeout=60.0,
    max_retries=2,
)

provider = OpenAIProvider(openai_client=client)
```

不要在 SDK 和业务层同时设置过多重试。多层重试相乘会放大请求数量和延迟。

## 8. 常见错误

| 现象 | 处理 |
|---|---|
| Responses 404 | 改用 `OpenAIChatModel`，或换到真正支持 Responses 的地址 |
| 结构化输出验证失败 | 检查工具调用/JSON Schema 能力，保留 Pydantic 校验，不要直接信任原始文本 |
| 工具调用循环 | 简化工具描述，限制重试和步骤，检查工具结果消息格式 |
| 400 unknown field | 移除服务端不支持的 Responses、推理或结构化字段 |
| 401 / 403 | 检查环境变量、Key 权限与模型 ID |
| 429 | 降低并发，设置有上限的退避重试 |
| 日志泄露输入 | 关闭敏感内容记录，生产环境只保留必要的脱敏元数据 |

## 9. 官方来源

- [PydanticAI OpenAI 模型](https://pydantic.dev/docs/ai/models/openai/)
- [PydanticAI Agent](https://pydantic.dev/docs/ai/core-concepts/agent/)
- [PydanticAI Tools](https://pydantic.dev/docs/ai/tools/)
- [PydanticAI 官方仓库](https://github.com/pydantic/pydantic-ai)
