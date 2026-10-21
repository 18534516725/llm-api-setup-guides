---
title: Deep Agents 中文教程：规划、文件上下文与研究助手
description: 从 create_deep_agent 开始，配置模型、工具和研究任务，解释与 LangChain、LangGraph 的关系及文件、子 Agent、记忆边界。
---

# Deep Agents 中文教程：规划、文件上下文与研究助手

> 最后核验：2026-10-21。PyPI 核对：deepagents 0.7.29，Python >=3.11。

[← 返回教程总目录](../教程总目录.md)

## Deep Agents 是什么

Deep Agents 是建立在 LangChain 和 LangGraph 之上的 Agent harness，内置规划、文件操作、上下文管理和子 Agent 等能力。适合多步骤任务，而不是仅需要一轮文本回复的简单接口。

| 层次 | 作用 |
|---|---|
| LangChain | 模型、工具与基础 Agent 组件 |
| LangGraph | 状态图、运行与持久化机制 |
| Deep Agents | 组合规划、文件、委派和上下文管理 |

## 1. 安装

```bash
python3.12 -m venv .venv-deepagents
source .venv-deepagents/bin/activate
python -m pip install "deepagents==0.7.29" langchain-openai
```

Windows 使用 `py -3.12` 创建，并激活 `.venv-deepagents\Scripts\Activate.ps1`。设置 `OPENAI_API_KEY` 和 `OPENAI_MODEL`；兼容服务额外设置 `OPENAI_BASE_URL`，并确认支持工具调用。

## 2. 一个可运行的研究草稿案例

保存为 `research.py`：

```python
import os
from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["OPENAI_MODEL"],
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.getenv("OPENAI_BASE_URL"),
)


def read_project_brief() -> str:
    """读取本示例固定的项目需求，不进行外部搜索。"""
    return "项目需要中文文档检索、来源页码、可删除索引，先做单用户原型。"


agent = create_deep_agent(
    model=model,
    tools=[read_project_brief],
    system_prompt="你是技术研究助手。区分给定事实和方案建议，不虚构外部搜索。",
)
result = agent.invoke({"messages": [{
    "role": "user",
    "content": "读取项目需求，列出三步原型计划和需要验证的问题。"
}]})
print(result["messages"][-1].content)
```

```bash
python research.py
```

这是基于固定资料的研究草稿，不是联网调查。需要实时来源时，再接入明确的搜索 / 抓取工具并保留 URL。

## 3. 为什么普通聊天能通，Agent 会失败

Agent 要求模型输出正确的工具调用参数，还要支持工具结果继续回传。用同一模型分别测试纯回复、单工具、两轮工具和错误参数；不要仅凭 `/models` 或普通聊天成功判定兼容。

## 4. 文件系统后端

默认状态文件与真实本机文件不是一回事。选择后端前明确文件是否只活在当前运行、是否跨会话持久化、是否能执行 Shell，以及根目录边界。

需要执行代码时优先使用受控 [E2B](e2b.md) 或 [Daytona](daytona.md) 等环境；不要把本机整个主目录交给自动 Agent。

## 5. 子 Agent 怎样使用

子 Agent 适合上下文可独立、输出契约清楚的子任务。为每个角色限制工具和资料范围，要求输出来源、结论与未知。主 Agent 汇总时也应校验来源，不因为“另一个 Agent 说了”就视为事实。

委派会增加调用次数、延迟和成本。先单 Agent 跑通，再对比拆分是否减少返工。

## 6. 记忆与持久化

同一运行中的文件、检查点和跨用户长期记忆是不同机制。先定义用户、会话和租户的身份边界，再选择 Store / checkpointer。服务重启后验证状态是否真的恢复。

长期偏好和知识库事实不要混存；需要专门记忆层时看 [Mem0](mem0.md)。

## 7. 上线前验收

- 给任务设置费用、轮数和运行时间边界。
- 验证工具失败、网络中断、取消和重复执行。
- Trace 中脱敏用户输入和凭证。
- 文件与 Shell 权限由后端限制，不依赖 Prompt。
- 保存模型、依赖版本与检索资料快照。

## 8. 常见问题

工具循环不结束时检查模型能力、重复工具结果和停止条件；文件找不到时检查后端作用域；报告缺来源时先确认是否真的安装并调用搜索工具。上下文压缩会丢失细节，关键事实应保存为可追溯状态。

## 官方资料

- [Deep Agents 项目](https://github.com/langchain-ai/deepagents)
- [官方概览](https://docs.langchain.com/oss/python/deepagents/overview)
- [API 参考](https://reference.langchain.com/python/deepagents/)
- [LangGraph 教程](langgraph.md)
