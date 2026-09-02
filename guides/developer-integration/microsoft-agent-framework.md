# Microsoft Agent Framework 完整开发教程

> 最后核验：2026-09-02
>
> 适用范围：Microsoft Agent Framework Python、OpenAI Responses、工具、Session、Workflow 与 A2A
>
> 预计用时：45～90 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 框架定位

Microsoft Agent Framework（MAF）是用于构建、编排和运行生产级 Agent 的开源框架，提供 Python、.NET，并有独立 Go SDK。它把模型客户端、Agent、工具、上下文、工作流、中间件和遥测拆成可组合层。

适合：

- 从单 Agent 扩展到顺序、并发、交接或群组工作流；
- 需要 Session、检查点、人工确认和可恢复执行；
- 同时支持多种模型后端；
- 需要 OpenTelemetry 与中间件；
- 通过 A2A 暴露或调用远程 Agent。

## 2. 安装

```bash
python3 -m venv .venv-maf
source .venv-maf/bin/activate
python -m pip install --upgrade pip
pip install agent-framework python-dotenv
```

确认导入：

```bash
python -c "import agent_framework; print('Agent Framework imported')"
```

框架更新较快，生产项目使用 lockfile 固定实际验证版本。

## 3. 配置模型

`.env`：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_MODEL=YOUR_MODEL_ID
```

加入 `.gitignore`：

```gitignore
.env
.venv-maf/
```

MAF 的 `OpenAIChatClient` 使用 Responses API。兼容服务必须真正支持目标模型需要的 Responses、流式和工具调用，不要只凭 Chat Completions 成功判断。

## 4. 最小 Agent

`agent.py`：

```python
import asyncio
import os

from dotenv import load_dotenv
from agent_framework import Agent
from agent_framework.openai import OpenAIChatClient

load_dotenv()


async def main() -> None:
    client = OpenAIChatClient(
        model=os.environ["OPENAI_MODEL"],
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ.get("OPENAI_BASE_URL"),
    )
    agent = Agent(
        client=client,
        name="Assistant",
        instructions="使用简洁中文回答；不确定时明确说明。",
    )
    response = await agent.run("用两句话解释 Agent Framework。")
    print(response)


if __name__ == "__main__":
    asyncio.run(main())
```

运行：

```bash
python agent.py
```

如果所安装版本的 OpenAI Client 参数名不同，查看同版本 provider sample；不要从旧版 AutoGen 示例复制构造参数。

## 5. 添加工具与审批

```python
from typing import Annotated

from agent_framework import Agent, tool
from pydantic import Field


@tool(approval_mode="always_require")
def create_ticket(
    title: Annotated[str, Field(description="工单标题")],
) -> dict:
    """创建工单；此操作会写入外部系统。"""
    return {"status": "created", "title": title}


agent = Agent(
    client=client,
    instructions="创建工单前展示标题并等待审批。",
    tools=[create_ticket],
)
```

官方示例有时为简洁使用 `never_require`，生产写操作不应照搬。读写工具分离，服务端仍需参数校验、身份授权和幂等控制。

## 6. 多轮 Session

```python
session = agent.create_session()

first = await agent.run("记住项目代号是 Aurora。", session=session)
second = await agent.run("项目代号是什么？", session=session)

print(second)
```

Session 保存对话状态，但“创建了 Session”不等于已经持久化。生产环境需要可靠 Session Store，并按用户、租户和应用隔离。

## 7. 流式输出

```python
async for chunk in agent.run(
    "列出三项上线检查。",
    session=session,
    stream=True,
):
    if chunk.text:
        print(chunk.text, end="", flush=True)
```

客户端要处理文本以外的工具、审批、错误和完成事件。连接断开后是否继续执行，应由业务策略明确决定。

## 8. Context Provider 与 Memory

Agent Pipeline 会依次让历史和上下文 Provider 加入消息、工具或中间件。把不同来源分开：

- 会话历史；
- 用户长期偏好；
- RAG 检索结果；
- 本轮运行状态；
- 权限和组织策略。

不要把检索文本当系统指令，也不要把一个用户的长期记忆加载给另一个用户。

## 9. Workflow 什么时候使用

当流程有确定顺序、并发、重试或人工节点时，用 Workflow 比让模型自由循环更可靠：

```text
接收输入
  → 确定性校验
  → 并行检索
  → Agent 汇总
  → 人工审批
  → 外部写入
```

每一步定义输入输出 Schema、超时、重试、幂等和恢复点。不要把所有业务状态藏在自然语言上下文中。

## 10. Agent Harness

MAF 提供 Harness，用于长任务中的规划、Todo、上下文压缩、文件和工具审批。Harness 适合复杂工程任务，但权限也更高。

启用前设置：

- 工作区边界；
- Shell、文件与网络审批；
- 最大轮数和费用；
- 上下文压缩后的关键状态保存；
- 中断与恢复策略；
- 不可信仓库的指令注入防护。

## 11. A2A 集成

MAF 可以托管 A2A Server 或将远程 A2A Agent 作为能力使用。连接远程 Agent 时检查 Card、认证、数据地域和超时，并限制递归委派。

本地工具、MCP 工具和 A2A Agent 的权限模型不同，不能只用统一的“tools”开关代替细粒度授权。

## 12. 中间件与可观测性

Agent、Chat Client 和 Function 均有中间件 / 遥测层。至少记录：

- Trace ID、用户和会话的不可逆标识；
- 模型、延迟、Token 和重试；
- 工具名称、耗时、审批结果；
- 工作流步骤与恢复；
- 脱敏后的错误分类。

Prompt、工具参数和响应可能含敏感数据，默认不应全量进入 Trace。

## 13. 常见错误

### `OpenAIChatClient` 请求 404

检查 Base URL 是否包含正确 `/v1`、服务是否支持 Responses、模型 ID 是否存在。不要改成 Chat Completions 后就宣称完全兼容。

### Agent 不调用工具

检查工具 Docstring、参数 Schema、指令和模型结构化工具能力。查看轨迹而不是只看最终文本。

### Session 重启后丢失

默认状态没有接入持久 Store。显式配置持久化并测试跨进程恢复。

### 写工具没有弹出审批

工具审批模式或宿主审批处理器未配置。服务端权限判断不能依赖 UI 是否弹窗。

## 14. 验收清单

- [ ] 最小 Agent 的非流式与流式请求通过；
- [ ] 目标服务支持实际使用的 Responses 能力；
- [ ] 工具正常、非法和拒绝路径均测试；
- [ ] 写操作有审批、授权和幂等；
- [ ] Session 能跨进程恢复且租户隔离；
- [ ] Workflow 有超时、重试和检查点；
- [ ] Harness 文件、Shell 和网络权限已限制；
- [ ] 遥测已脱敏并可按 Trace 定位问题；
- [ ] 依赖版本已锁定。

## 15. 官方来源

- [Microsoft Agent Framework 官方仓库](https://github.com/microsoft/agent-framework)
- [Agent Framework 官方文档](https://learn.microsoft.com/agent-framework/)
- [第一个 Agent](https://learn.microsoft.com/agent-framework/get-started/your-first-agent)
- [Agent Pipeline](https://learn.microsoft.com/agent-framework/agents/agent-pipeline)
- [Agent Harness](https://learn.microsoft.com/agent-framework/get-started/harness)
