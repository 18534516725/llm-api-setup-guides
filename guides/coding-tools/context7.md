---
title: Context7 中文教程：为编程 Agent 获取版本匹配的文档
description: 介绍 Context7 CLI＋Skills 和 MCP 两种接入方式、库 ID 与版本选择，以及文档检索失败、来源和隐私核验。
---

# Context7 中文教程：为编程 Agent 获取版本匹配的文档

> 最后核验：2026-10-21。当前官方 README 要求 ctx7 CLI 使用 Node.js 22.13 或更新版本。

[← 返回教程总目录](../教程总目录.md)

## Context7 是什么

Context7 把库文档与代码示例提供给编程 Agent，减少模型凭旧知识猜 API 的情况。它负责文档上下文，不是聊天模型，也不能保证取回的每个例子都适合你的依赖版本。

每次仍需检查项目 lockfile、文档版本和 API 签名。它适合与 [Repomix](repomix.md) 配合：一个提供官方资料，一个整理自己的代码。

## 1. 两种接入方式

| 方式 | 适合情境 |
|---|---|
| CLI＋Skills | Agent 能调用终端，希望由 Skill 指导检索 |
| MCP | 客户端支持 MCP，希望直接调用文档工具 |

初次选择一种，避免同一任务重复检索。CLI 安装不等于 MCP 已配置，Skill 出现也不等于远程服务连通。

## 2. 官方交互安装

```bash
node --version
pnpm dlx ctx7@latest setup
```

官方命令使用 `npx ctx7 setup`，上面以 pnpm 的一次性执行方式运行同一包。安装会进行 OAuth、生成 Key 并配置选定客户端；先检查它要写入的客户端与作用域，再按交互提示操作。

不要把个人配置写入公开业务仓库，也不要在日志中暴露生成的 Key。

## 3. 手动 MCP 配置

官方当前远程入口：

```text
https://mcp.context7.com/mcp
```

使用客户端支持的 HTTP MCP 配置，认证头按官方说明为：

```text
Authorization: Bearer YOUR_API_KEY
```

这是参数说明，不是可公开保存的真实凭证。Claude Code、Cursor、Codex 等客户端的 JSON / TOML 格式不同，参照各自同版本的 MCP 配置方式。

## 4. 第一次验证

让 Agent 查询一个项目真实依赖，例如：

```text
先读取本项目 package.json 与 lockfile，确认 Next.js 的实际版本。
使用 Context7 查找该版本相关的请求处理文档。
先输出来源、版本和适用条件，再给最小实现建议。
不要修改文件。
```

验收实际发生了工具 / CLI 检索，并检查引用的是目标库，而不是同名非官方项目。只有回答中说“已使用 Context7”不足以证明调用成功。

## 5. 库 ID 与版本

已知库 ID 时在提示中给出官方检索所识别的 ID，可减少匹配歧义。版本要求要写清楚，例如“当前 lockfile 的主版本”，不要只说“用最新 API”。

取不到指定版本时明确资料缺口，回到官方同版本文档和源码；不要静默使用不兼容的新版本例子。

## 6. 与 MCP、Skills 和模型的关系

Context7 MCP 提供文档检索工具；配套 Skill 指导何时和怎样检索；模型负责理解并生成代码。工具没有替代类型检查、编译和行为测试。

一次可验收流程是：确认依赖 → 获取匹配文档 → 写最小实现 → 运行检查 → 根据失败回查资料。

## 7. 常见问题

| 现象 | 排查 |
|---|---|
| setup 无法启动 | Node.js 版本、包管理器、代理 |
| MCP 没有工具 | 配置作用域、HTTP 支持、重连与启动日志 |
| 401 / 配额错误 | Key、账户状态与计划额度 |
| 找错库 | 库 ID、发布者、版本与来源 |
| 示例不能编译 | 当前依赖与文档版本是否一致 |

## 8. 更新与移除

官方提供 `ctx7 remove` 来移除生成的配置。使用原安装环境执行；全局安装的 CLI 包需另行卸载。不要为移除一个工具清空整个 MCP 配置文件。

发送检索问题时尽量使用库名与公开 API，不把私有源码、用户数据或秘密一起发给文档服务。

## 官方来源

- [Context7 项目](https://github.com/upstash/context7)
- [客户端安装说明](https://context7.com/docs/resources/all-clients)
- [MCP 配置基础](../basics/mcp-basics-security.md)
