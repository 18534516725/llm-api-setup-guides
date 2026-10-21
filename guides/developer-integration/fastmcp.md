---
title: FastMCP 4 中文教程：Python MCP Server 开发与调试
description: 用 FastMCP 4.1.3 开发工具、资源与 HTTP MCP 服务，并通过 Python Client 和 Inspector 验证，说明认证与版本迁移边界。
---

# FastMCP 4 中文教程：Python MCP Server 开发与调试

> 最后核验：2026-10-21。PyPI 核对：4.1.3，Python >=3.10。本文使用独立 `fastmcp` 包。

[← 返回教程总目录](../教程总目录.md)

## FastMCP 与 MCP SDK 有什么区别

FastMCP 是面向 Python 的 MCP 应用框架，负责把函数包装成工具、处理客户端和传输等能力。历史上 FastMCP 1.0 被纳入官方 Python SDK；当前独立项目与 `mcp.server.fastmcp` 不是同一套版本。

第一次开发 MCP，可先看 [协议入门](../basics/mcp-basics-security.md)。本文目标是完成一个真实可调用的加法工具，不调用付费模型。

## 1. 安装

```bash
python3.12 -m venv .venv-fastmcp
source .venv-fastmcp/bin/activate
python -m pip install "fastmcp==4.1.3"
python -c "import importlib.metadata; print(importlib.metadata.version('fastmcp'))"
```

Windows 使用 `py -3.12` 创建环境并激活 `.venv-fastmcp\Scripts\Activate.ps1`。

## 2. 写第一个 Server

保存为 `server.py`：

```python
from fastmcp import FastMCP

mcp = FastMCP("Arithmetic Demo")


@mcp.tool
def add(a: int, b: int) -> int:
    """将两个整数相加，不访问文件或网络。"""
    return a + b


if __name__ == "__main__":
    mcp.run()
```

函数签名用于生成参数 Schema，说明文字帮助 Agent 判断何时调用。工具名称和描述应准确，不把有副作用的动作包装成“查询”。

## 3. 不经过模型先测试

保存为 `client.py`：

```python
import asyncio
from fastmcp import Client
from server import mcp


async def main() -> None:
    async with Client(mcp) as client:
        tools = await client.list_tools()
        print([tool.name for tool in tools])
        result = await client.call_tool("add", {"a": 20, "b": 22})
        print(result)


asyncio.run(main())
```

```bash
python client.py
```

验收：工具列表包含 `add`，结果表达 42。再测试缺少参数、错误类型和不存在的工具，确认失败能够被识别。

## 4. 接入 stdio 客户端

客户端启动命令使用该虚拟环境 Python 的绝对路径，参数指向 `server.py` 的绝对路径。这样避免 GUI 客户端找不到你 Shell 中的环境。

stdio 使用标准输出传协议数据，业务调试日志写标准错误。不要加 `print('server ready')` 污染协议输出。

## 5. 改成 HTTP

将启动行替换为：

```python
mcp.run(transport="http", host="127.0.0.1", port=8000)
```

按启动日志确认 MCP endpoint，再用同版本客户端连接。先本机测试，跨网络部署时增加 HTTPS、认证和工具授权。普通 HTTP 200 不等于工具调用成功。

## 6. Resources 与 Prompts

Resources 适合提供可读取资料，Prompts 适合提供可复用交互模板，Tools 适合执行带参数的操作。不要把所有内容都塞成一个能任意执行 Shell 的工具。

给读文件工具限制根目录；给数据库工具限制查询范围；给写工具设置身份授权、审批和幂等。模型指令不能代替服务端权限。

## 7. Inspector 与协议迁移

使用 [MCP Inspector](../api-testing/mcp-inspector.md) 验证列举、调用、错误与取消。新旧 MCP era 和 FastMCP 主版本需要分别核对，不能把“框架是 4.x”推导为任意 Host 支持全部扩展。

已有 2.x / 3.x 项目先阅读官方迁移指南，保留原环境，对比 Schema、返回类型、认证和生命周期后再切换。

## 8. 排错

| 问题 | 检查 |
|---|---|
| 工具看不到 | 装饰器、模块导入、客户端是否连到正确服务 |
| Schema 不符合预期 | 类型注解、默认参数与依赖版本 |
| stdio 启动失败 | Python 路径、工作目录、stdout 污染 |
| HTTP 404 | endpoint 与服务启动配置 |
| 本机成功远程失败 | 网络、TLS、认证、代理与 Host 能力 |

## 官方来源

- [FastMCP 项目](https://github.com/PrefectHQ/fastmcp)
- [官方 Quickstart](https://gofastmcp.com/getting-started/quickstart)
- [Client 文档](https://gofastmcp.com/clients/client)
- [4.1.3 发布包](https://pypi.org/project/fastmcp/4.1.3/)
