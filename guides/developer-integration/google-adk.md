# Google Agent Development Kit（ADK）Agent 开发完整教程

> 最后核验：2026-08-10
>
> 适用范围：Google ADK Python、工具调用、Session、评测与多模型接入
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. ADK 是什么

Agent Development Kit（ADK）是 Google 开源的 Agent 开发框架，用来构建、调试、评测和部署带工具的智能体。官方当前提供 Python、TypeScript、Go、Java 和 Kotlin 入口，本文使用资料最完整的 Python 路径。

ADK 适合：

- 从单 Agent 扩展到多 Agent；
- 管理工具、事件、Session、State 与 Memory；
- 在本地 CLI / Dev UI 中调试；
- 用测试集验证工具轨迹和最终回答；
- 接入 Gemini，或通过官方连接器使用其他模型。

它不是模型，也不会让一个不支持工具调用的模型自动拥有可靠工具能力。

## 2. 环境准备

官方 Python 快速入门当前要求 Python 3.10 或更高：

```bash
python3 --version
python3 -m venv .venv-adk
source .venv-adk/bin/activate
python -m pip install --upgrade pip
pip install -U google-adk
adk --help
```

Windows PowerShell：

```powershell
py -m venv .venv-adk
.venv-adk\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -U google-adk
adk --help
```

## 3. 创建第一个项目

```bash
adk create time_agent
```

典型结构：

```text
time_agent/
├── __init__.py
├── agent.py
└── .env
```

ADK 会寻找名为 `root_agent` 的根 Agent。不要随意改名而不调整加载逻辑。

## 4. 使用 Gemini 的最小 Agent

在 `time_agent/.env` 中设置官方 Gemini 凭据：

```dotenv
GOOGLE_API_KEY="YOUR_API_KEY"
```

不要把 `.env` 提交到 Git：

```bash
printf '\n.env\n' >> .gitignore
```

编辑 `time_agent/agent.py`：

```python
from datetime import datetime
from zoneinfo import ZoneInfo

from google.adk.agents import Agent


def get_current_time(timezone: str) -> dict:
    """返回 IANA 时区的当前时间，例如 Asia/Shanghai。"""
    try:
        now = datetime.now(ZoneInfo(timezone))
    except Exception:
        return {"status": "error", "message": "无效的 IANA 时区"}

    return {
        "status": "success",
        "timezone": timezone,
        "iso_time": now.isoformat(timespec="seconds"),
    }


root_agent = Agent(
    model="gemini-flash-latest",
    name="time_agent",
    description="通过工具查询指定时区时间。",
    instruction=(
        "你是时间助手。用户询问时间时必须调用 get_current_time；"
        "不要猜测当前时间。"
    ),
    tools=[get_current_time],
)
```

模型别名会随官方策略更新。生产环境应按稳定性要求评估固定模型 ID，而不是默认永久跟随 `latest`。

## 5. CLI 和 Dev UI 调试

在 `time_agent` 的父目录运行：

```bash
adk run time_agent
```

输入：

```text
上海现在几点？请使用工具。
```

再启动浏览器调试界面：

```bash
adk web --port 8000
```

打开 `http://127.0.0.1:8000`。

> [!WARNING]
> 官方明确说明 ADK Web 是开发调试工具，不是生产应用。不要把它直接暴露到公网。

## 6. 通过 LiteLLM 使用其他模型

ADK Python 提供官方 `LiteLlm` 连接器：

ADK 当前官方文档要求使用 `litellm>=1.84`：

```bash
pip install -U 'litellm>=1.84'
```

```python
import os

from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm


root_agent = LlmAgent(
    model=LiteLlm(
        model="openai/YOUR_MODEL_ID",
        api_base=os.environ["OPENAI_BASE_URL"],
        api_key=os.environ["OPENAI_API_KEY"],
    ),
    name="compatible_api_agent",
    description="使用 OpenAI-compatible 模型的 ADK Agent。",
    instruction="你是严谨的助手。需要工具时必须返回结构化工具调用。",
    tools=[get_current_time],
)
```

环境变量：

```bash
export OPENAI_BASE_URL="https://api.example.com/v1"
export OPENAI_API_KEY="YOUR_API_KEY"
```

模型字符串的 Provider 前缀、Base URL 与参数以 LiteLLM 和 ADK 当前文档为准。普通聊天成功不代表 ADK 所需的工具调用、流式和多轮事件都兼容。

> [!WARNING]
> ADK 官方安全公告记录：LiteLLM 的 PyPI `1.82.7`、`1.82.8` 曾在 2026-03-24 被发现包含未授权代码。如果当时安装或升级过相关版本，应按官方公告升级 ADK / LiteLLM 并轮换所有可能暴露的凭据。新环境也应锁定已审查版本并保留依赖清单。

## 7. Session、State 与 Memory

ADK 把上下文分成不同层级：

- Session：一条具体对话线程及其事件；
- State：和 Session / 用户 / 应用关联的结构化状态；
- Memory：可跨 Session 检索的长期信息。

开发阶段可使用内存实现，生产环境必须使用持久化 SessionService。用户 ID、Session ID 和应用名需要稳定且相互隔离。

不要把以下内容无筛选写入长期记忆：

- API Key、Cookie、Authorization；
- 身份证、银行卡等敏感信息；
- Agent 的原始工具返回；
- 不应跨用户共享的工作区内容。

## 8. 工具设计原则

工具函数的名称、Docstring、参数类型会影响模型选择工具的准确性：

```python
def lookup_order(order_id: str) -> dict:
    """按订单号查询订单状态，不执行退款或修改。"""
    ...
```

建议：

- 一个工具只做一件事；
- 读操作与写操作分开；
- 返回显式 `status`，不要靠自然语言猜错误；
- 参数做服务端校验；
- 写操作使用幂等键和人工确认；
- 不把数据库连接或管理员对象直接交给模型。

## 9. 多 Agent 什么时候有必要

只有职责和权限确实不同才拆分，例如：

```text
协调 Agent
├── 只读检索 Agent
├── 数据分析 Agent
└── 需要审批的执行 Agent
```

拆分后要定义：

- 每个 Agent 可见的工具；
- 交接的数据结构；
- 最大轮数、超时与总预算；
- 哪些动作必须回到用户确认；
- 如何记录跨 Agent 工具轨迹。

多 Agent 会增加 Token、延迟和排错难度，不应只为了演示“智能”。

## 10. 评测 Agent

ADK 的评测能力不只比较最终文字，还能检查工具调用轨迹。常见指标包括：

- 工具是否被调用；
- 参数是否正确；
- 工具顺序是否符合预期；
- 最终回答是否匹配参考；
- 基于 rubric 的语义质量。

至少建立三类用例：

1. 正常查询；
2. 无效参数与工具错误；
3. 提示注入、越权和需要审批的请求。

LLM-as-a-Judge 有成本和波动，应结合确定性断言，不要把唯一标准交给另一个模型。

## 11. 部署前安全边界

- Dev UI 不用于生产；
- 每个工具采用最小权限身份；
- 写操作默认审批并提供操作预览；
- 对 Session、工具参数和输出做数据分级；
- 设置最大步数、超时、并发和费用上限；
- 工具执行日志与模型对话日志分开；
- 固定并审计依赖，关注 ADK 安全公告；
- 不在客户端暴露模型或工具的服务端凭据。

## 12. 常见问题

### ADK 找不到 Agent

确认从 Agent 目录的父级运行，包中存在 `__init__.py`，并导出了 `root_agent`。

### 普通聊天正常但不调用工具

检查工具 Docstring、参数类型和 instruction；再确认模型真正支持 Function Calling，并查看事件中是否出现结构化调用。

### Windows 出现 UnicodeDecodeError

ADK 的 LiteLLM 文档建议设置 UTF-8 模式：

```powershell
$env:PYTHONUTF8="1"
```

### 多轮对话失忆

检查每次请求是否使用相同的用户与 Session ID，以及 SessionService 是否持久化。不要把模型上下文误当长期 Memory。

### Dev UI 能运行，部署后失败

检查生产进程的工作目录、环境变量、凭据身份、网络权限和持久化服务。Dev UI 不是生产部署验证。

## 13. 验收清单

- [ ] CLI 与 Dev UI 的最小 Agent 通过；
- [ ] 工具调用包含正确名称和参数；
- [ ] 工具失败时 Agent 不伪造成功；
- [ ] 不同用户和 Session 完全隔离；
- [ ] 写操作有审批、幂等和审计；
- [ ] 正常、异常和越权评测均通过；
- [ ] 依赖版本已锁定且避开安全公告版本；
- [ ] 生产入口没有暴露 ADK Web。

## 14. 官方来源

- [ADK 官方文档](https://adk.dev/)
- [ADK Python Quickstart](https://adk.dev/get-started/python/)
- [ADK LiteLLM 模型连接器](https://adk.dev/agents/models/litellm/)
- [ADK Session、State 与 Memory](https://adk.dev/sessions/)
- [ADK Agent 评测](https://adk.dev/evaluate/)
- [ADK Python GitHub 仓库](https://github.com/google/adk-python)
