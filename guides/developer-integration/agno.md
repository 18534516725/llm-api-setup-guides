---
title: Agno 中文教程：模型接入、只读工具与 AgentOS 服务
description: 介绍 Agno 3.1.7 的 Agent、只读 Workspace、Session 存储与 AgentOS，分开验证模型能力、会话隔离与服务鉴权。
---

# Agno 中文教程：模型接入、只读工具与 AgentOS 服务

> 最后核验：2026-10-21。PyPI 核对：Agno 3.1.7。示例使用 Python 3.12。

[← 返回教程总目录](../教程总目录.md)

## Agno 的三层结构

Agno SDK 用来写 Agent；AgentOS 运行时把 Agent 暴露为服务；管理界面连接运行时进行测试与管理。安装 SDK 不代表服务已部署，也不代表所有接口已经完成用户鉴权。

适合需要工具、会话、知识库和服务 API 的项目。只需一个模型请求时，直接用 SDK 更简单。

## 1. 安装

```bash
python3.12 -m venv .venv-agno
source .venv-agno/bin/activate
python -m pip install "agno==3.1.7" openai
```

准备 `OPENAI_API_KEY` 与 `OPENAI_MODEL`。模型 ID 使用账户真实可用值。自定义模型服务要先检查协议、工具和流式支持；不同 Agno Provider 的配置参数不能混用。

## 2. 最小 Agent

保存为 `agent.py`：

```python
import os
from agno.agent import Agent

agent = Agent(
    name="Documentation Assistant",
    model=f"openai:{os.environ['OPENAI_MODEL']}",
    instructions="用中文回答，不确定时说明依据不足。",
    markdown=True,
)
agent.print_response("给一个文档检索原型列出三项验收标准。", stream=True)
```

```bash
python agent.py
```

这里采用官方 model 字符串路径。需要自定义端点时，按当前 Provider 文档显式配置并分别测试，不能把所有兼容服务当作内置官方 Provider。

## 3. 加入只读 Workspace

先创建仅含测试文本的 `demo-workspace` 目录，再添加：

```python
from agno.tools.workspace import Workspace

workspace = Workspace(
    root="./demo-workspace",
    allowed=["read", "list", "search"],
)
```

把 `tools=[workspace]` 传给 Agent。要求它列出文件并引用内容，确认没有获得写入和 Shell 权限。根目录与软链接行为应按实际版本验收。

## 4. Session 与数据库

官方提供 SQLite 等存储集成。单机原型可先使用：

```python
from agno.db.sqlite import SqliteDb

db = SqliteDb(db_file="agent-sessions.db")
```

然后通过 Agent 的 `db`、历史上下文等选项接入。数据库文件是运行数据，不提交仓库。生产使用应检查并发、备份、迁移与恢复。

## 5. 暴露为 AgentOS

安装匹配版本的 OS extras：

```bash
python -m pip install "agno[os]==3.1.7"
```

在独立 `workbench.py` 中定义 Agent 后：

```python
from agno.os import AgentOS

agent_os = AgentOS(agents=[agent])
app = agent_os.get_app()
```

按官方服务方式或使用 uvicorn 本机启动：

```bash
uvicorn workbench:app --host 127.0.0.1 --port 7777
```

读取本机 `/docs` 验证当前接口契约，再执行测试请求。公网部署前配置认证、TLS 和跨用户访问控制。

## 6. 记忆、知识库和多 Agent

会话历史用于连续对话；长期记忆用于偏好与事实提取；知识库用于外部文档检索。分别设置保存范围、删除方式和来源。

多个 Agent 的工具范围独立定义。工具输出进入其他 Agent 时应标明来源和不可信性质，避免把检索文本变成高权限指令。

## 7. 排错与验收

| 问题 | 排查 |
|---|---|
| 模型不识别 | Provider 前缀、模型 ID 和账户权限 |
| Stream 报错 | 用非流式和最小工具测试分层定位 |
| 会话串数据 | 用户身份由后端确定，检查 session / user 绑定 |
| OS 启动缺依赖 | OS extras 与 SDK 版本一致 |
| 工具无结果 | 根目录、真实文件权限、工具注册 |

最终至少验证纯回复、只读工具、同会话续聊、跨用户隔离和服务重启后的数据恢复。

## 官方来源

- [Agno 项目](https://github.com/agno-agi/agno)
- [第一个 Agent](https://docs.agno.com/first-agent)
- [Agno 官方文档](https://docs.agno.com/)
