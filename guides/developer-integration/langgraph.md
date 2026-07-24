# LangGraph 接入 OpenAI-compatible API 与持久化教程

> 最后核验：2026-07-24
>
> 适用范围：LangChain 1.x、LangGraph 1.x、Python
>
> 预计用时：20～40 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文使用 LangChain 1.x 的 `create_agent`。旧教程中的 `langgraph.prebuilt.create_react_agent` 已不应作为新项目默认入口。

## 1. LangGraph 与 LangChain Agent 的关系

LangGraph 是用于构建有状态工作流和 Agent 的底层图运行时。LangChain 的 `create_agent` 运行在 LangGraph 之上，适合快速创建带工具、状态和中间件的 Agent。

选择方式：

- 只需要标准工具调用 Agent：使用 `create_agent`；
- 需要自定义节点、条件边、循环和审批：直接使用 `StateGraph`；
- 需要断点续跑：编译时加入 checkpointer；
- 需要跨会话长期数据：使用 store，而不只是消息 checkpointer。

## 2. 安装

```bash
python3 -m venv .venv-langgraph
source .venv-langgraph/bin/activate
python -m pip install --upgrade pip
pip install -U langchain langgraph langchain-openai
```

检查：

```bash
python -c "import langchain, langgraph; print('imports ok')"
```

## 3. 环境变量

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
```

Windows PowerShell：

```powershell
$env:OPENAI_API_KEY="YOUR_API_KEY"
$env:OPENAI_BASE_URL="https://api.example.com/v1"
$env:OPENAI_MODEL="YOUR_MODEL_ID"
```

把 `.env` 加入 `.gitignore`。本文代码直接读取环境变量，不在源码中写 Key。

## 4. 先验证模型

新建 `check_model.py`：

```python
import os

from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    temperature=0,
    timeout=60,
    max_retries=2,
)

response = model.invoke("只回复：LangGraph 模型连接成功")
print(response.content)
```

运行：

```bash
python check_model.py
```

这一步失败时先排查 API，不要继续加入 Agent 和状态图。

## 5. 最小工具调用 Agent

新建 `agent.py`：

```python
import os

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI


@tool
def multiply(a: int, b: int) -> int:
    """计算两个整数的乘积。"""
    return a * b


model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    temperature=0,
    timeout=60,
    max_retries=2,
)

agent = create_agent(
    model=model,
    tools=[multiply],
    system_prompt="你是严谨的助手。需要计算乘法时必须调用 multiply 工具。",
)

result = agent.invoke(
    {
        "messages": [
            {"role": "user", "content": "请计算 37 × 29，只给出结果。"}
        ]
    }
)

print(result["messages"][-1].content)
```

运行：

```bash
python agent.py
```

正确结果应为 `1073`。同时检查运行结果中是否产生工具调用。模型直接口算正确，并不能证明 Function Calling 兼容。

## 6. 添加短期记忆

`InMemorySaver` 适合本地开发：

```python
import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
)

agent = create_agent(
    model=model,
    tools=[],
    checkpointer=InMemorySaver(),
)

config = {"configurable": {"thread_id": "demo-user-1"}}

agent.invoke(
    {"messages": [{"role": "user", "content": "记住我的代号是北极星。"}]},
    config,
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "我的代号是什么？"}]},
    config,
)

print(result["messages"][-1].content)
```

同一个 `thread_id` 会继续同一条线程。不同用户必须使用不同且不可碰撞的 ID。

`InMemorySaver` 在进程退出后不会保留数据，也不适合多实例生产部署。

## 7. 手写 StateGraph

当工作流不只是“模型自动选工具”时，可以直接定义图：

```python
import os

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, MessagesState, StateGraph

model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    temperature=0,
)


def call_model(state: MessagesState):
    response = model.invoke(state["messages"])
    return {"messages": [response]}


builder = StateGraph(MessagesState)
builder.add_node("call_model", call_model)
builder.add_edge(START, "call_model")
builder.add_edge("call_model", END)
graph = builder.compile()

result = graph.invoke(
    {"messages": [{"role": "user", "content": "只回复：状态图正常"}]}
)

print(result["messages"][-1].content)
```

这里每个节点接收状态并返回状态增量。后续可加入：

- 分类节点；
- 检索节点；
- 工具节点；
- 人工审批节点；
- 根据状态选择分支的条件边。

## 8. PostgreSQL 持久化

生产环境使用数据库 checkpointer：

```bash
pip install -U "psycopg[binary,pool]" langgraph-checkpoint-postgres
```

示例：

```python
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "user-123"}}
    result = graph.invoke(
        {"messages": [{"role": "user", "content": "你好"}]},
        config,
    )
```

`setup()` 会初始化 checkpointer 所需结构，部署前应使用专用数据库账号、TLS 和最小权限。不要把数据库连接串提交到仓库。

## 9. 流式输出

```python
for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "分三点解释 LangGraph"}]},
    stream_mode="updates",
):
    print(chunk)
```

不同 `stream_mode` 返回的结构不同。前端接入前先打印事件，确认需要转发的是 Token、消息、状态更新还是自定义进度。

## 10. 错误处理

建议分层处理：

```text
HTTP/认证错误 → 模型客户端
结构化输出错误 → 节点内校验与有限重试
工具参数错误 → 工具函数再次校验
可恢复业务中断 → checkpoint + resume
不可恢复错误 → 记录脱敏上下文并终止
```

不要对所有异常无限重试。工具写操作还需要幂等键，避免恢复后重复执行。

## 11. 安全与成本

- 工具参数必须由代码校验；
- 删除、付款、发布和外部消息需要人工审批；
- 每条线程设置最大步骤数和超时；
- 日志不记录完整 Key、隐私输入和工具返回；
- 对用户隔离 `thread_id` 和长期存储 namespace；
- 记录每个节点的调用次数与 Token；
- 兼容端点必须测试工具调用、流式输出和错误格式；
- 不可信内容可能通过 Prompt Injection 诱导工具越权。

## 12. 常见问题

| 现象 | 排查方法 |
|---|---|
| 401 | Key、环境变量、认证头或 Provider 配置不匹配 |
| 404 | 检查 Base URL、模型 ID 和 Chat Completions 路径 |
| `create_react_agent` 弃用提示 | 新项目改用 `langchain.agents.create_agent` |
| 工具没有调用 | 检查模型 Function Calling、兼容层和工具 schema |
| 第二轮忘记上下文 | 检查 checkpointer 和 `thread_id` 是否一致 |
| 不同用户串话 | 为每个会话生成独立 thread ID，并隔离长期存储 |
| 重启后记忆丢失 | `InMemorySaver` 不持久化，改用数据库 checkpointer |
| 流式事件无法解析 | 检查 `stream_mode`，不要假定所有 chunk 都是文本 |
| 循环调用费用异常 | 设置递归/步骤上限、超时和总重试预算 |

## 13. 官方来源

- [LangChain Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph v1 Migration Guide](https://docs.langchain.com/oss/python/migrate/langgraph-v1)
