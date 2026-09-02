# A2A Agent2Agent 协议完整入门

> 最后核验：2026-09-02
>
> 适用范围：A2A Protocol 1.0、Python `a2a-sdk`、Agent Card、JSON-RPC 与长任务
>
> 预计用时：45～90 分钟

[← 返回教程目录](../教程总目录.md)

## 1. A2A 解决什么问题

Agent2Agent（A2A）是让不同框架、不同组织、不同服务器上的 Agent 互相发现和协作的开放协议。它适合将一个 Agent 当作远程服务使用，同时保留其内部模型、记忆与工具实现的封装。

A2A 关注：

- 通过 Agent Card 发现能力；
- 协商文本、文件和结构化数据等模态；
- 发送消息并跟踪长任务；
- 流式状态和 Artifact；
- 取消、恢复与跨框架协作。

它与 MCP 互补：MCP 主要让 Agent 使用工具和数据；A2A 让一个 Agent 与另一个自主 Agent 协作。

## 2. 核心对象

| 对象 | 作用 |
|---|---|
| Agent Card | 声明名称、接口、能力、输入输出模态和 Skills |
| Message | 用户或 Agent 之间的一次消息 |
| Task | 可持续、可查询和可取消的工作单元 |
| Artifact | 任务产生的文档、数据或其他结果 |
| Agent Executor | 把协议请求桥接到实际 Agent 逻辑 |
| Event Queue | 推送任务状态、消息和 Artifact 更新 |

A2A 中的 Agent Skill 是 Agent Card 的能力说明，不要与 `SKILL.md` 开放格式混为一谈。

## 3. 环境准备

```bash
python3 -m venv .venv-a2a
source .venv-a2a/bin/activate
python -m pip install --upgrade pip
pip install --upgrade "a2a-sdk[http-server]" uvicorn
python -c "import a2a; print('A2A SDK imported')"
```

Windows PowerShell：

```powershell
py -m venv .venv-a2a
.venv-a2a\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install --upgrade "a2a-sdk[http-server]" uvicorn
python -c "import a2a; print('A2A SDK imported')"
```

## 4. 实现最小 Executor

`agent_executor.py`：

```python
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.types import Message, Part, Role


class EchoAgentExecutor(AgentExecutor):
    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        text = context.get_user_input()
        message = Message(
            role=Role.ROLE_AGENT,
            message_id="echo-response",
            parts=[Part(text=f"收到：{text}", media_type="text/plain")],
        )
        await event_queue.enqueue_event(message)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        raise NotImplementedError("此示例没有长任务")
```

SDK 版本间的数据类型包装可能调整。若导入路径与已安装版本不一致，以同版本官方 quickstart 为准，不要混用旧博客代码。

## 5. 声明 Agent Card

```python
from a2a.types import AgentCapabilities, AgentCard, AgentInterface, AgentSkill

echo_skill = AgentSkill(
    id="echo",
    name="回显消息",
    description="原样返回用户输入，用于连接测试。",
    tags=["echo", "test"],
    examples=["请回显 hello"],
)

agent_card = AgentCard(
    name="Echo Agent",
    description="用于验证 A2A 连接的只读 Agent。",
    version="1.0.0",
    default_input_modes=["text/plain"],
    default_output_modes=["text/plain"],
    capabilities=AgentCapabilities(streaming=False),
    supported_interfaces=[
        AgentInterface(
            protocol_binding="JSONRPC",
            url="http://127.0.0.1:9999",
        )
    ],
    skills=[echo_skill],
)
```

Card 是公开契约，不要放内部主机名、密钥、调试端口或只有管理员能用的隐藏能力。

## 6. 启动服务

官方 Python SDK 提供请求处理器和 Starlette 路由辅助。组合方式：

```python
import uvicorn
from starlette.applications import Starlette

from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.routes import create_agent_card_routes, create_jsonrpc_routes
from a2a.server.tasks import InMemoryTaskStore

from agent_executor import EchoAgentExecutor
from card import agent_card

handler = DefaultRequestHandler(
    agent_executor=EchoAgentExecutor(),
    task_store=InMemoryTaskStore(),
    agent_card=agent_card,
)

routes = []
routes.extend(create_agent_card_routes(agent_card))
routes.extend(create_jsonrpc_routes(handler, "/"))
app = Starlette(routes=routes)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9999)
```

开发环境运行：

```bash
python server.py
```

只绑定 `127.0.0.1`。公开部署前必须增加 TLS、认证、限流和任务持久化。

## 7. 从 Card 开始验证

客户端不应硬编码对方所有能力，而应：

1. 获取公开 Agent Card；
2. 校验 URL、协议绑定和支持的模态；
3. 只选择需要的 Skill；
4. 根据能力决定是否使用流式和长任务；
5. 对扩展 Card 重新鉴权。

不要自动信任 Card 中的外部 URL。远程发现需要 SSRF 防护、域名白名单、DNS 重绑定防护和响应大小限制。

## 8. 从 Message 升级到 Task

即时回答可直接返回 Message。以下场景应使用 Task：

- 处理需要数十秒或更久；
- 会产生多个 Artifact；
- 需要暂停等待用户输入；
- 客户端需要轮询、流式观察或取消；
- 服务重启后仍要恢复。

生产 Task Store 至少保存租户、创建者、状态、版本、过期时间和幂等键。内存 Store 仅适合教程与测试。

## 9. 多 Agent 编排

一个协调 Agent 调用多个远程 Agent 时，不要无限转发：

```text
用户
  └─ 协调 Agent
      ├─ 检索 Agent（只读）
      ├─ 分析 Agent（无外部写权限）
      └─ 执行 Agent（需要审批）
```

设置：

- 最大委派深度与总步数；
- 每个远程 Agent 的超时、并发和预算；
- 消息和 Artifact 的数据分级；
- 跨组织发送前的用户同意；
- 失败、部分成功和取消的聚合规则。

## 10. 身份与授权

Agent Card 描述能力，不授予权限。服务端每次请求仍需：

- 验证访问 Token 或受信服务身份；
- 检查 audience、scope、租户与任务所有权；
- 对读、写、删除和外部发送分别授权；
- 防止通过 Task ID 越权读取状态或 Artifact；
- 不把下游凭据传进上游模型上下文；
- 对 Agent 之间的消息做提示注入和数据泄漏检查。

## 11. 可观测性

建议为一次跨 Agent 调用记录：

- 入口请求 ID 与 Trace ID；
- 本地 Task ID 和远程 Task ID；
- Agent Card 版本与协议绑定；
- 状态迁移、重试与取消；
- 延迟、Token、工具次数和 Artifact 大小；
- 脱敏后的错误分类。

不要默认记录完整 Prompt、文件内容和认证头。

## 12. 常见错误

### 能获取 Card 但调用 404

检查 Card 中接口 URL、协议绑定、反向代理前缀和服务实际路由是否一致。

### 长任务重启后消失

使用了 `InMemoryTaskStore`。换成持久化 Store，并为执行器设计可恢复步骤。

### 多 Agent 反复互相委派

缺少委派深度、已访问 Agent 集合或职责边界。协调层必须检测循环。

### 取消后仍继续产生费用

协议取消只到达入口，没有向模型请求、工具和子 Agent 传播。使用统一取消信号并等待资源释放。

## 13. 验收清单

- [ ] Card 只暴露真实、公开且可用的能力；
- [ ] 客户端按 Card 协商协议和模态；
- [ ] Task Store 能跨实例和重启恢复；
- [ ] Task 与 Artifact 均验证租户和所有权；
- [ ] 取消能传播到模型、工具和下游 Agent；
- [ ] 有最大委派深度、总步数、超时和预算；
- [ ] 外部 URL 获取具备 SSRF 防护；
- [ ] 日志和 Trace 已脱敏；
- [ ] 使用同版本官方客户端完成互操作测试。

## 14. 官方来源

- [A2A Protocol 官方文档](https://a2a-protocol.org/latest/)
- [A2A Python Quickstart](https://a2a-protocol.org/latest/tutorials/python/1-introduction/)
- [A2A Python SDK API](https://a2a-protocol.org/dev/sdk/python/api/index.html)
- [A2A 官方仓库](https://github.com/a2aproject/A2A)
- [A2A 规范](https://a2a-protocol.org/latest/specification/)
