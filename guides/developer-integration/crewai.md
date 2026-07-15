# CrewAI 自定义 API、多 Agent 与工具调用教程

> 最后核验：2026-07-15
>
> 适用范围：CrewAI Python；OpenAI-compatible 或 Anthropic 原生兼容接口

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> [纽智中转站](https://www.nexotoken.net/?ref=github) 提供多模型 API 和测试额度。请根据 CrewAI Provider 前缀选择匹配的协议地址，模型状态和活动规则以官网实时页面为准。

## 1. CrewAI 的模型前缀很重要

CrewAI 的 `LLM` 使用 Provider/模型形式：

```text
openai/YOUR_MODEL_ID
anthropic/YOUR_MODEL_ID
gemini/YOUR_MODEL_ID
```

前缀决定底层 Provider 与请求格式。OpenAI-compatible 地址通常配 `openai/`；Anthropic Messages 地址配 `anthropic/`。不要只替换 Base URL，却保留错误的 Provider 前缀。

## 2. 安装

官方推荐使用 uv：

```bash
uv tool install crewai
crewai --version
```

在已有 Python 项目中：

```bash
uv add crewai
```

需要 LiteLLM 管理的扩展 Provider 时再安装：

```bash
uv add "crewai[litellm]"
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

## 4. 最小单 Agent 测试

```python
import os

from crewai import Agent, Crew, LLM, Process, Task

llm = LLM(
    model=f"openai/{os.environ['OPENAI_MODEL']}",
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    temperature=0.2,
    timeout=60.0,
    max_retries=2,
)

agent = Agent(
    role="技术编辑",
    goal="把给定内容整理成准确的简短摘要",
    backstory="你只处理用户提供的信息，不补充未经验证的事实。",
    llm=llm,
    verbose=True,
)

task = Task(
    description="把这句话压缩到 20 个汉字以内：API 接入前要确认协议、地址和模型 ID。",
    expected_output="一条不超过 20 个汉字的中文摘要",
    agent=agent,
)

crew = Crew(
    agents=[agent],
    tasks=[task],
    process=Process.sequential,
    verbose=True,
)

print(crew.kickoff())
```

先用单 Agent、单 Task 验证接口，再增加协作、工具和记忆。这样出现报错时更容易定位。

## 5. Anthropic Messages 配置

服务提供 Anthropic 原生兼容地址时：

```python
llm = LLM(
    model="anthropic/YOUR_MODEL_ID",
    api_key=os.environ["ANTHROPIC_API_KEY"],
    base_url=os.environ["ANTHROPIC_BASE_URL"],
    max_tokens=4096,
    timeout=60.0,
    max_retries=2,
)
```

对应环境变量：

```bash
export ANTHROPIC_API_KEY="YOUR_API_KEY"
export ANTHROPIC_BASE_URL="YOUR_ANTHROPIC_BASE_URL"
```

OpenAI Chat Completions 地址不能直接替代 Anthropic Messages 地址。

## 6. 两个 Agent 顺序协作

```python
researcher = Agent(
    role="资料整理员",
    goal="只提取输入中的事实",
    backstory="你不会添加输入之外的信息。",
    llm=llm,
)

editor = Agent(
    role="编辑",
    goal="把事实改写成清晰中文",
    backstory="你会保留原意并删除重复内容。",
    llm=llm,
)

extract = Task(
    description="从输入中提取事实：Qwen Code 支持配置多个模型 Provider。",
    expected_output="事实列表",
    agent=researcher,
)

rewrite = Task(
    description="根据上一任务结果写一句准确说明。",
    expected_output="一句中文说明",
    agent=editor,
    context=[extract],
)

crew = Crew(
    agents=[researcher, editor],
    tasks=[extract, rewrite],
    process=Process.sequential,
)
print(crew.kickoff())
```

每增加一个 Agent，就会增加模型调用次数和失败点。能用一个 Agent 完成的工作，不必为了形式拆成五个角色。

## 7. 工具、结构化输出与安全

- 工具参数必须由代码再次校验，Agent 不能自行获得数据库、支付或删除权限；
- 外部写操作加入人工确认、幂等和审计记录；
- `expected_output` 要具体，否则多 Agent 容易互相生成冗长内容；
- 结构化输出仍需用 Pydantic 校验；
- 设置最大执行时间、RPM 和总重试，避免循环放大成本；
- `verbose=True` 的日志可能包含提示词和工具结果，生产环境应关闭或脱敏；
- Knowledge、Memory、Embedding 与主聊天模型是不同链路，要分别配置和测试。

## 8. 常见错误

| 现象 | 排查 |
|---|---|
| 401 | Key 环境变量、Provider 前缀或认证方式不匹配 |
| 404 | Base URL 资源路径错误，或 OpenAI/Anthropic 协议混用 |
| `LLM Provider NOT provided` | 模型名缺少 `openai/`、`anthropic/` 等有效前缀 |
| 单 Agent 正常，多 Agent 失败 | 检查上下文长度、Task 输出和调用次数，逐个恢复组件 |
| 工具未调用 | 模型不支持工具，或兼容层没有正确转发 tool calls |
| JSON 校验失败 | 服务不支持结构化输出；保留校验并增加有限重试 |
| 429 | 降低 Crew 并发、RPM 和重试次数 |
| 成本异常 | 记录每个 Task/Agent 的调用与 Token，不要只看最终一次输出 |

## 9. 官方来源

- [CrewAI 官方文档](https://docs.crewai.com/)
- [CrewAI LLM 配置](https://docs.crewai.com/en/concepts/llms)
- [CrewAI Agents](https://docs.crewai.com/en/concepts/agents)
- [CrewAI 官方仓库](https://github.com/crewAIInc/crewAI)
