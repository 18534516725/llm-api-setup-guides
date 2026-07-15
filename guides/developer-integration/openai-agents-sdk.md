# OpenAI Agents SDK 自定义 API 与多 Agent 开发教程

> 最后核验：2026-07-15
>
> 适用范围：OpenAI Agents SDK for Python；自定义 Responses 或 Chat Completions 兼容接口

[← 返回教程目录](../../README.md)

> [!TIP]
> **想先验证自定义 Agent 接口？**
>
> [纽智中转站](https://www.nexotoken.net/?ref=github) 提供多模型 API、每天免费测试额度和新人体验额度。请从控制台确认目标模型支持 Responses 还是 Chat Completions，并复制准确 Base URL 与模型 ID。

## 1. 先选择 API 形态

Agents SDK 默认倾向使用 Responses API，但也能通过 `OpenAIChatCompletionsModel` 接入 OpenAI-compatible Chat Completions。

| 服务端能力 | 推荐模型类 | 典型端点 |
|---|---|---|
| 完整 Responses | `OpenAIResponsesModel` | `/v1/responses` |
| 只有 Chat Completions | `OpenAIChatCompletionsModel` | `/v1/chat/completions` |

Chat Completions 可以支持函数工具，但不具备所有 Responses 专属能力。工具搜索、托管工具、响应状态延续等功能不能假设在两种路径上完全等价。

## 2. 创建项目

```bash
mkdir agents-sdk-test && cd agents-sdk-test
python -m venv .venv
```

激活环境：

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

安装：

```bash
python -m pip install --upgrade openai-agents
```

## 3. 环境变量

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://your-api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
```

PowerShell：

```powershell
$env:OPENAI_API_KEY="YOUR_API_KEY"
$env:OPENAI_BASE_URL="https://your-api.example.com/v1"
$env:OPENAI_MODEL="YOUR_MODEL_ID"
```

`.env` 必须加入 `.gitignore`。不要在 Python 源码中硬编码真实 Key。

## 4. Responses API 最小示例

只有服务明确实现 `/v1/responses` 时才使用：

```python
import asyncio
import os

from agents import Agent, OpenAIProvider, RunConfig, Runner


async def main() -> None:
    provider = OpenAIProvider(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ["OPENAI_BASE_URL"],
        use_responses=True,
    )

    agent = Agent(
        name="助手",
        instructions="回答要简洁，不要编造信息。",
        model=os.environ["OPENAI_MODEL"],
    )

    result = await Runner.run(
        agent,
        "只回复 OK",
        run_config=RunConfig(model_provider=provider),
    )
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
```

保存为 `main.py`，运行 `python main.py`。若得到 404，先确认服务是否真的实现 Responses，不要立即修改 SDK 代码。

## 5. Chat Completions 兼容示例

很多兼容服务只提供 Chat Completions：

```python
import asyncio
import os

from agents import Agent, AsyncOpenAI, OpenAIChatCompletionsModel, Runner

client = AsyncOpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    timeout=60.0,
    max_retries=2,
)

model = OpenAIChatCompletionsModel(
    model=os.environ["OPENAI_MODEL"],
    openai_client=client,
)

agent = Agent(
    name="助手",
    instructions="回答要准确、简洁。",
    model=model,
)


async def main() -> None:
    result = await Runner.run(agent, "只回复 OK")
    print(result.final_output)


asyncio.run(main())
```

使用非官方 Key 时，SDK 的默认 tracing 仍可能尝试连接默认追踪服务。若没有单独配置追踪凭据，应在测试代码中关闭：

```python
from agents import set_tracing_disabled

set_tracing_disabled(True)
```

关闭 tracing 不会关闭模型请求，只是不再导出追踪数据。

## 6. 测试函数工具

```python
from agents import Agent, Runner, function_tool


@function_tool
def add(a: int, b: int) -> int:
    """计算两个整数的和。"""
    return a + b


agent = Agent(
    name="计算助手",
    instructions="需要计算时必须调用工具。",
    model=model,
    tools=[add],
)

result = Runner.run_sync(agent, "23 加 19 等于多少？")
print(result.final_output)
```

验证时不只看最终答案，还要确认模型确实产生了合法工具调用。能猜出 `42` 不代表 Function Calling 已经兼容。

## 7. 多 Agent 转交

```python
from agents import Agent, Runner

english = Agent(
    name="English",
    instructions="Only answer in English.",
    model=model,
)

chinese = Agent(
    name="中文",
    instructions="只使用中文回答。",
    model=model,
)

triage = Agent(
    name="分流",
    instructions="根据用户语言转交给对应助手。",
    model=model,
    handoffs=[english, chinese],
)

result = Runner.run_sync(triage, "请用一句话介绍你自己")
print(result.final_output)
```

Handoff 本质上也依赖模型的工具选择能力。普通对话可用而转交失败时，先回到单个函数工具测试。

## 8. 生产使用要补什么

- 为每次运行设置业务超时、并发和总重试上限；
- 对工具参数做类型校验和权限校验，模型输出不能当作授权；
- 对外部写操作加入人工确认或幂等键；
- 限制最大轮次，防止 Agent 互相转交形成循环；
- 日志不得记录完整 Key、Authorization、私人提示词或工具返回的敏感数据；
- 分开记录模型用量和 tracing 成本；
- 只有兼容端点提供完整 Responses WebSocket 时才启用 WebSocket transport。

## 9. 常见错误

| 现象 | 排查 |
|---|---|
| 401 | Key 未加载、认证头不兼容或模型权限不足 |
| `/responses` 404 | 服务只实现 Chat Completions，改用对应模型类 |
| 400 unsupported parameter | 移除 Responses 专属设置或模型不支持的字段 |
| 工具参数为空/截断 | 流式 tool call 兼容不完整；先关闭流式并用单工具复测 |
| 模型请求成功但 tracing 报错 | 关闭 tracing，或单独配置 tracing exporter 与 Key |
| Agent 循环 | 限制轮次，简化 handoff 描述，检查工具结果是否被正确回传 |
| 429 / 5xx | 指数退避、限制总重试，并记录脱敏 request ID |

## 10. 官方来源

- [OpenAI Agents SDK Python](https://openai.github.io/openai-agents-python/)
- [Models 与自定义 Provider](https://openai.github.io/openai-agents-python/models/)
- [SDK 全局配置](https://openai.github.io/openai-agents-python/config/)
- [官方 GitHub 仓库](https://github.com/openai/openai-agents-python)

