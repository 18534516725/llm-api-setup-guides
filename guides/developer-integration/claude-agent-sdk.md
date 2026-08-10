# Claude Agent SDK 构建可执行 Agent 完整教程

> 最后核验：2026-08-10
>
> 适用范围：Claude Agent SDK Python / TypeScript、工具权限、流式事件与部署
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Agent SDK 与普通 API 的区别

Claude Agent SDK 把驱动 Claude Code 的 Agent 循环、上下文管理和内置工具作为 Python / TypeScript 库提供。Agent 可以自己规划步骤、读取文件、调用工具并持续工作，直到完成或触发限制。

它和普通 Anthropic Client SDK 不同：

- Client SDK：应用自己实现工具循环；
- Agent SDK：库负责 Agent 循环、工具执行与上下文管理；
- Claude Code CLI：面向终端交互；
- Managed Agents：由 Anthropic 托管的另一类服务。

本文严格使用官方列出的 API Key / 云平台认证方式，不把未文档化的第三方登录或参数当作正式方案。

## 2. 环境与安装

官方当前要求 Node.js 18+ 或 Python 3.10+。Python 示例：

```bash
python3 -m venv .venv-claude-agent
source .venv-claude-agent/bin/activate
python -m pip install --upgrade pip
pip install -U claude-agent-sdk
```

TypeScript：

```bash
mkdir claude-agent-demo
cd claude-agent-demo
npm init -y
npm pkg set type=module
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev tsx
```

SDK 通常会带平台对应的 Claude Code 二进制。若 Python 安装到了不含 binary 的源码分发，或 npm 跳过 optional dependencies，需要按官方 Quickstart 安装二进制并显式指定路径。

## 3. 配置认证

```bash
export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
```

SDK 不会自动读取 `.env`；需要 `.env` 时由应用自行加载。把凭据文件加入 `.gitignore`。

官方还列出了 Amazon Bedrock、Google Cloud Agent Platform、Microsoft Foundry 等认证路径，必须按各自指南配置云身份。

> [!WARNING]
> Anthropic 官方说明：未经预先批准，第三方开发者不能在自己的产品中转售或提供 claude.ai 登录与其额度。面向终端用户的 Agent 应使用文档列出的 API 认证方式。

## 4. 从只读 Agent 开始

新建 `agent.py`：

```python
import asyncio

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    query,
)


async def main() -> None:
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Glob", "Grep"],
        disallowed_tools=["Edit", "Write", "Bash"],
    )

    async for message in query(
        prompt="只读检查当前项目，概括目录结构和三个主要风险，不要修改文件。",
        options=options,
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text)
                elif hasattr(block, "name"):
                    print(f"Tool: {block.name}")
        elif isinstance(message, ResultMessage):
            print(f"Done: {message.subtype}")


asyncio.run(main())
```

在一个不含敏感文件的测试目录运行：

```bash
python agent.py
```

先检查它只使用 Read / Glob / Grep，再考虑放开编辑或命令。

## 5. 理解 allowed 与 disallowed

官方权限模型不是简单的“白名单”：

- `allowed_tools` 表示符合规则的工具可自动批准；
- 没列入 allow 的工具不一定消失，可能继续进入权限流程；
- 裸名称 `disallowed_tools=["Bash"]` 会让模型看不到该工具；
- 更细粒度的 deny 规则可拒绝特定命令模式；
- hooks、deny、ask、permission mode、allow 与回调有固定求值顺序。

因此，如果你的安全目标是“绝不允许”，应使用 deny / 移除工具，并在高风险场景增加 `PreToolUse` hook，而不是只依赖 allowed 列表。

## 6. 有控制地允许编辑

在临时 Git 仓库中测试：

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Glob", "Grep"],
    disallowed_tools=["Bash", "Write"],
    permission_mode="acceptEdits",
    system_prompt=(
        "只修改用户明确指定的文件。修改前先阅读相关代码；"
        "不要删除文件，不要接触凭据。"
    ),
)
```

`acceptEdits` 会自动批准文件操作，不能当作默认生产模式。执行后必须查看 `git diff` 并运行项目测试。

## 7. 为什么不要轻易开放 Bash

加入 `Bash` 后，Agent 可以运行测试，也可能运行安装脚本、读取环境或发出网络请求。即使模型可信，提示注入和普通错误仍可能造成破坏。

最低限度：

- 在临时容器或沙箱中执行；
- 使用非 root 用户；
- 文件系统只挂载工作目录；
- 默认禁止访问宿主机 Docker socket；
- 限制出站网络；
- 设置 CPU、内存、进程数和运行时限；
- 不把生产凭据注入 Agent 环境。

## 8. 流式事件与最终结果

`query()` 返回异步迭代器，可能产生初始化、助手文本、工具调用、工具结果和最终 Result。生产代码不要假设第一条就是文字，也不要只截取最后一个字符串。

应记录：

- Session ID；
- 允许和拒绝的工具；
- 工具名称、耗时和脱敏结果；
- 最终 subtype；
- 使用量、费用与错误类型。

不要记录完整环境变量、Authorization、用户私密文件内容或未经脱敏的工具输出。

## 9. Session 与恢复

Agent SDK 支持维护、恢复和 fork Session。业务层需要明确：

- 哪个用户拥有哪个 Session；
- Session 能否跨设备继续；
- 保存多久、如何删除；
- 恢复时工作目录是否还是同一个版本；
- Session 中是否包含已经失效的工具结果。

恢复会话前应重新做权限判断，不能因为旧 Session 曾获批就默认批准新一轮高风险操作。

## 10. MCP 与自定义工具

Agent SDK 可连接 MCP 或自定义工具。接入前逐个审查：

- 工具进程从哪里安装；
- 能读写哪些目录；
- 使用哪些网络与凭据；
- 返回内容是否可能包含提示注入；
- 是否存在不可逆操作；
- 是否支持用户级隔离。

优先使用只读工具。写工具应拆成“生成计划 / 预览”和“确认执行”两步。

## 11. 成本、超时与终止条件

Agent 会多轮调用模型和工具，一次用户请求不等于一次模型调用。至少设置：

- 最大 Agent 轮数；
- 单次工具与总任务超时；
- 模型费用 / Token 上限；
- 并发限制；
- 可取消信号；
- 重试预算。

工具已经产生副作用后，不要自动重跑整条任务。应使用幂等键并从可确认状态恢复。

## 12. 安全部署架构

推荐把每个任务放进短生命周期、低权限的执行环境：

```text
业务 API
  → 认证、配额、审批
  → 任务队列
  → 隔离的 Agent Worker
  → 受控工具与工作区
  → 脱敏事件和结果
```

官方安全部署指南强调容器隔离、最小权限、凭据保护和监控。不能因为有权限模式就跳过操作系统级隔离。

## 13. 常见问题

### API key not found

确认 Key 位于启动 Python / Node 进程的同一环境。SDK不自动读取 `.env`。

### 找不到 Claude Code binary

检查是否安装了平台 wheel / optional dependency。按官方方式安装原生 Claude Code，或在 SDK 选项中提供可执行文件路径。

### canUseTool 回调没有触发

某些 permission mode 或裸 `allowedTools` 可能在回调之前已经决定。对照官方权限求值顺序；若必须检查每次调用，使用合适的 PreToolUse hook。

### Agent 读到了不该看的文件

立即停止任务。缩小工作目录和挂载范围，使用 deny、隔离容器与独立低权限用户。Prompt 中写“不要读”不是安全边界。

### 任务一直不结束

设置最大轮数、总超时和预算；检查工具是否反复返回模糊错误，导致模型无限尝试。

## 14. 验收清单

- [ ] 先在无敏感数据的测试目录运行；
- [ ] 只读模式无法编辑和执行命令；
- [ ] 写操作具有审批或隔离；
- [ ] deny 规则用真实危险请求测试；
- [ ] 每个 Session 与用户严格绑定；
- [ ] 任务有轮数、时间、费用和并发上限；
- [ ] 日志已脱敏且可追踪工具轨迹；
- [ ] Worker 不持有生产管理员凭据；
- [ ] 中断和副作用恢复流程已演练。

## 15. 官方来源

- [Claude Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Agent SDK Quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- [Claude Agent SDK Permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- [Claude Agent SDK Cost Tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking)
- [Securely Deploying AI Agents](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
