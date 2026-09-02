# ACP Agent Client Protocol 完整入门

> 最后核验：2026-09-02
>
> 适用范围：Agent Client Protocol、ACP v2 草案、TypeScript SDK、本地 stdio 编程 Agent
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. ACP 解决什么问题

Agent Client Protocol（ACP）用于标准化编辑器 / IDE 与编程 Agent 之间的通信。目标类似 LSP：编辑器无需为每个 Agent 开发一套私有协议，Agent 也无需绑定单一界面。

ACP 适合传递：

- 会话创建、恢复、关闭和取消；
- 用户 Prompt 与流式回复；
- 工具调用、计划、差异和终端状态；
- Agent 发起的权限申请；
- 文件系统和终端等客户端能力。

它不负责模型 API 的标准化，也不等同于 MCP。ACP 连接“客户端与编程 Agent”；MCP 连接“Agent 与工具 / 数据”。

## 2. 当前稳定性边界

ACP 官方文档已经提供可用 SDK 与生态列表，但 v2 协议仍应按草案 / 实验能力对待，远程 HTTP 与 WebSocket 支持也仍在完善。

生产集成应：

- 固定协议与 SDK 版本；
- 在初始化时协商能力；
- 忽略未知字段而不是崩溃；
- 为预览功能准备禁用开关；
- 不把本地 stdio 的安全假设直接复制到远程连接。

## 3. 一次典型会话

```text
Client                         Agent
  |------ initialize ---------->|
  |<----- capabilities ----------|
  |------ auth/login ----------->|  可选
  |------ session/new ---------->|
  |------ session/prompt ------->|
  |<----- session/update --------|  文本、工具、计划、进度
  |<----- request_permission ----|  高风险动作
  |------ permission result ---->|
  |<----- prompt result ----------|
  |------ session/cancel -------->|  可随时取消
```

前台任务结束时 Agent 应回到 idle 状态，并给出停止原因。

## 4. 安装 TypeScript SDK

```bash
mkdir acp-demo
cd acp-demo
npm init -y
npm install @agentclientprotocol/sdk
npm install -D typescript tsx @types/node
npm pkg set type=module
```

SDK 同时提供 Agent 侧和 Client 侧连接实现。根据角色分别使用 `AgentSideConnection` 或 `ClientSideConnection`。由于 v2 API 仍可能变化，完整实现应从与所安装版本一致的官方 examples 起步。

## 5. 最小 Agent 结构

一个本地 Agent 至少要有：

```text
acp-agent/
├── package.json
├── src/
│   ├── main.ts          # stdio 入口
│   ├── connection.ts    # ACP 方法和通知
│   ├── sessions.ts      # 会话状态
│   └── permissions.ts   # 权限策略
└── tests/
```

不要把协议处理、模型调用、文件修改和权限判断全塞进一个回调。这样才能分别测试协议兼容和业务行为。

## 6. 初始化与能力协商

初始化阶段双方交换版本与能力。只调用对方明确声明支持的方法：

- Agent 有认证方法时，才调用 `auth/login` / `auth/logout`；
- 客户端声明 Elicitation 能力时，Agent 才请求结构化输入；
- 会话恢复、终端、文件系统等可选表面需要逐项协商；
- 自定义能力放在规定的扩展命名空间，不能覆盖标准字段。

协议升级时应对“新客户端 + 旧 Agent”和“旧客户端 + 新 Agent”分别做测试。

## 7. 会话模型

关键方法包括：

- `session/new`：创建新会话；
- `session/prompt`：提交一次用户请求；
- `session/list`：列出可恢复会话；
- `session/resume`：恢复并回放必要历史；
- `session/close`：关闭会话；
- `session/cancel`：取消正在运行的操作。

会话 ID 应不可预测，并绑定用户与工作区。恢复会话前重新授权，不能因为知道 ID 就获得历史、文件或终端访问权。

## 8. 流式更新

Agent 使用 `session/update` 发送：

- 文本或思考状态片段；
- 工具调用与结果；
- 计划和任务进度；
- 终端显示状态；
- 配置选项变化。

客户端需要按事件类型渲染，并处理乱序、重复、取消后的迟到事件。协议通知没有响应，不要把“成功写入管道”当作 UI 已消费。

## 9. 权限请求是核心安全边界

文件写入、命令执行、联网和删除操作应通过 `session/request_permission` 交给客户端决策。

权限界面至少展示：

- 谁请求；
- 将执行什么动作；
- 目标文件、命令或域名；
- 本次允许还是记住规则；
- 拒绝后 Agent 如何继续。

“总是允许”必须有清晰作用域，不能把对单一命令的同意扩大为整个 Shell 权限。

## 10. 文件与路径安全

ACP 要求协议中的文件路径使用绝对路径。实现仍需：

- 将路径限制在当前工作区；
- 解析软链接后再次检查边界；
- 阻止 `..`、设备文件和敏感目录逃逸；
- 读取与写入采用不同权限；
- 应用补丁前展示 Diff；
- 对二进制、大文件和编码异常设置限制。

不要把模型产生的路径未经规范化直接交给系统调用。

## 11. stdio 进程管理

本地 Agent 通常由编辑器作为子进程启动。要求：

- stdout 只输出协议消息；
- 诊断写 stderr；
- 捕获 SIGTERM / Ctrl+C 并取消子任务；
- 设最大消息大小和请求超时；
- Agent 退出后清理孙进程；
- 不从不可信项目自动加载可执行配置。

任何调试 `console.log` 混进 stdout 都可能破坏 JSON-RPC 帧。

## 12. 互操作测试

至少覆盖：

1. 初始化和能力降级；
2. 新建、连续对话和恢复会话；
3. 流式文本与工具事件；
4. 用户允许、拒绝和取消；
5. Agent 崩溃与重启；
6. 非法 JSON、未知方法和超大消息；
7. 路径逃逸与软链接；
8. 客户端断开后的进程清理。

先用官方示例 Agent / Client 做一端基准，再替换成自己的实现，能快速判断问题在哪一侧。

## 13. 常见错误

### 客户端启动后没有任何输出

检查 stdout 是否混入日志、消息是否逐帧刷新、进程启动参数和工作目录是否正确。

### 会话恢复后重复执行工具

历史回放与新事件没有去重。为消息和工具调用保存稳定 ID，并把恢复标记与执行标记分开。

### 拒绝权限后 Agent 一直重试

拒绝结果没有进入 Agent 上下文，或系统指令没有定义替代路径。设置最大申请次数并返回可解释的拒绝原因。

### 不同编辑器行为不一致

某项能力并非双方都支持。记录初始化协商结果，不要根据产品名称猜能力。

## 14. 验收清单

- [ ] stdout 只包含合法协议消息；
- [ ] 所有可选能力都经过协商；
- [ ] 会话 ID 绑定用户和工作区；
- [ ] 写文件、Shell 和联网操作有独立权限；
- [ ] 路径规范化后仍限制在工作区；
- [ ] 取消能终止模型、工具和子进程；
- [ ] 重连不会重复执行有副作用的工具；
- [ ] 未知字段和能力可安全降级；
- [ ] 已与至少一个官方示例实现互测。

## 15. 官方来源

- [ACP 官方介绍](https://agentclientprotocol.com/get-started/introduction)
- [ACP v2 协议概览](https://agentclientprotocol.com/protocol/overview)
- [ACP TypeScript SDK](https://agentclientprotocol.com/libraries/typescript)
- [ACP Agents 生态列表](https://agentclientprotocol.com/get-started/agents)
- [ACP 官方协议仓库](https://github.com/agentclientprotocol/agent-client-protocol)
