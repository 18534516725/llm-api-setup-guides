# Hugging Face smolagents 轻量 Agent 开发完整教程

> 最后核验：2026-08-10
>
> 适用范围：smolagents、Python、CodeAgent / ToolCallingAgent、自定义模型 API
>
> 预计用时：25～55 分钟

[← 返回教程目录](../教程总目录.md)

## 1. smolagents 的特点

smolagents 是 Hugging Face 维护的轻量 Python Agent 框架，强调少量抽象和 Code Agent。它支持：

- `CodeAgent`：让模型用代码组合工具和计算；
- `ToolCallingAgent`：使用结构化工具调用；
- Hugging Face 推理、本地模型、LiteLLM 和其他模型连接器；
- 自定义工具、受管 Agent 与 Gradio 界面；
- 本地执行器及更强隔离的远程 / 容器执行方式。

Code Agent 很灵活，但“生成并执行代码”天然属于高风险操作，必须把隔离作为架构的一部分。

## 2. 安装

```bash
python3 -m venv .venv-smolagents
source .venv-smolagents/bin/activate
python -m pip install --upgrade pip
pip install -U 'smolagents[toolkit,litellm]'
```

检查：

```bash
python -c "import smolagents; print('smolagents import ok')"
```

官方 `main` 文档可能对应源码开发版。使用 PyPI 时应切换到文档的最新稳定版本页面，并把依赖锁定到经过测试的版本。

## 3. 使用 Hugging Face 模型的最小示例

配置 Hugging Face Token 后：

```python
from smolagents import CodeAgent, InferenceClientModel

model = InferenceClientModel()
agent = CodeAgent(tools=[], model=model)

result = agent.run("计算 1 到 100 的整数和，只返回最终结果。")
print(result)
```

即使 `tools=[]`，CodeAgent 仍会生成代码完成计算。运行前理解它使用的执行环境和默认权限。

## 4. 接入 OpenAI-compatible API

使用 LiteLLMModel：

```bash
export OPENAI_BASE_URL="https://api.example.com/v1"
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_MODEL="YOUR_MODEL_ID"
```

```python
import os

from smolagents import CodeAgent, LiteLLMModel

model = LiteLLMModel(
    model_id=f"openai/{os.environ['OPENAI_MODEL']}",
    api_base=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
    temperature=0,
    max_tokens=2048,
)

agent = CodeAgent(tools=[], model=model)
print(agent.run("计算 37 × 29，并解释一行计算过程。"))
```

`openai/` Provider 前缀和 Base URL 的组合以当前 LiteLLM 文档为准。某个模型能聊天，不代表它能稳定输出 CodeAgent 所需格式。

## 5. 创建一个类型明确的工具

```python
from smolagents import tool


@tool
def calculate_shipping(weight_kg: float, region: str) -> float:
    """计算示例运费。

    Args:
        weight_kg: 包裹重量，必须大于 0。
        region: 目标区域，只允许 mainland 或 remote。

    Returns:
        以元为单位的示例运费。
    """
    if weight_kg <= 0:
        raise ValueError("weight_kg 必须大于 0")
    if region not in {"mainland", "remote"}:
        raise ValueError("region 只允许 mainland 或 remote")

    base = 12.0 if region == "mainland" else 25.0
    return round(base + max(0, weight_kg - 1) * 4.0, 2)
```

```python
agent = CodeAgent(tools=[calculate_shipping], model=model)
result = agent.run("2.5kg 包裹寄到 remote，运费是多少？必须使用工具。")
print(result)
```

工具内部仍要校验参数。模型生成的类型提示不是信任边界。

## 6. ToolCallingAgent 与 CodeAgent 怎么选

优先选择 `ToolCallingAgent` 的场景：

- 工具操作高风险；
- 希望每次动作都有固定 JSON 参数；
- 模型工具调用能力稳定；
- 流程主要是一连串独立 API 调用。

选择 `CodeAgent` 的场景：

- 需要循环、条件、聚合和复杂数据处理；
- 工具输出需要在本地组合；
- 已准备隔离执行环境；
- 能接受更复杂的审计与调试。

不要把生产数据库写权限直接交给 CodeAgent 来换取“少写几行代码”。

## 7. 本地执行器不等于绝对沙箱

官方说明：CodeAgent 默认在当前环境执行模型生成代码。smolagents 的本地执行器会解析 AST，并默认限制未授权 import，但任何本地 Python 沙箱都不可能保证完全安全。

即使禁用危险 import，允许的图像库也可能被滥用来写满磁盘；可信模型也可能因为提示注入生成危险操作。

高安全场景应使用：

- Docker / 容器隔离；
- E2B 等远程执行器；
- 临时文件系统；
- 非 root 用户；
- CPU、内存、磁盘和超时限制；
- 默认无生产凭据、无宿主机敏感目录。

## 8. 导入白名单要最小化

允许 import 时，只加入任务确实需要的包和子模块。不要为了方便直接允许广泛通配符。

安全评审要关注：

- 包能否访问文件系统；
- 是否能创建子进程；
- 是否能发网络请求；
- 是否包含可绕过限制的子模块；
- 输入文件是否来自不可信用户。

## 9. 多 Agent 与受管 Agent

smolagents 支持让管理 Agent 调用专门 Agent。拆分时给每个 Agent 清晰的 `name`、`description` 和工具集合。

合理示例：

- 检索 Agent 只能搜索和读取；
- 分析 Agent 只能处理传入数据；
- 管理 Agent 负责分配任务，不直接获得写工具。

应设置总步数、子 Agent 调用次数和预算，否则嵌套循环会迅速放大 Token 与延迟。

## 10. Gradio 调试界面

官方提供 `GradioUI` 方便观察步骤：

```python
from smolagents import GradioUI

GradioUI(agent).launch()
```

这适合本地调试，不应默认作为生产鉴权层。对外部署必须增加用户认证、速率限制、会话隔离和输入文件安全检查。

## 11. 记录与评测

不要只看最终回答。Agent 评测至少包含：

- 是否选择了正确工具；
- 参数是否正确；
- 生成代码是否访问越权资源；
- 工具错误后是否停止或安全恢复；
- 最大步骤内是否完成；
- 成本和延迟是否可接受。

建立固定任务集，并保存框架、模型、系统提示、工具 Schema 和执行器版本。否则两次评测不可比较。

## 12. 常见问题

### 模型反复输出无法解析的代码

确认模型具备足够代码与指令能力；减少工具数量和提示复杂度；先运行无工具计算用例。必要时改用 ToolCallingAgent。

### 工具没有被调用

检查工具名称、Docstring、参数和返回类型。任务提示应明确什么时候需要工具，并从运行日志确认真实调用。

### OpenAI-compatible API 报 404

检查 `api_base` 是否到 `/v1`、模型 ID 是否准确，以及 LiteLLM Provider 前缀是否匹配。先用 curl 验证 API。

### Import 被禁止

这是执行器的安全行为。只授权实际需要的精确模块，不要直接放开所有 import。

### Agent 卡住或费用失控

限制最大步数、输出 Token、总时长和模型请求频率。工具应返回清晰错误，避免 Agent 对同一失败无限尝试。

## 13. 验收清单

- [ ] 最小 Agent 和模型连接通过；
- [ ] 工具参数有类型与服务端校验；
- [ ] CodeAgent 在隔离环境运行；
- [ ] 不可信输入无法读取宿主机敏感文件；
- [ ] Import 和网络使用最小权限；
- [ ] 最大步骤、超时、并发和费用已限制；
- [ ] 工具轨迹、错误和最终结果可审计；
- [ ] 固定测试集在依赖升级后重新通过。

## 14. 官方来源

- [smolagents 官方文档](https://huggingface.co/docs/smolagents/)
- [smolagents Guided Tour](https://huggingface.co/docs/smolagents/guided_tour)
- [smolagents Models Reference](https://huggingface.co/docs/smolagents/reference/models)
- [smolagents Secure Code Execution](https://huggingface.co/docs/smolagents/tutorials/secure_code_execution)
- [smolagents GitHub 仓库](https://github.com/huggingface/smolagents)
