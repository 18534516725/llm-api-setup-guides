---
title: REA 中文教程：安装、MCP 配置与 Electron 静态分析
description: 介绍 morluto/rea Reverse Engineer Anything 的安装、doctor、MCP 接入、JavaScript 静态分析、原生引擎选择和证据核验。
---

# REA 中文教程：安装、MCP 配置与 Electron 静态分析

> 最后核验：2026-10-21。依据官方仓库与安装指南核对；本文没有声称已对商业软件完成逆向实测。

[← 返回教程总目录](../教程总目录.md)

## REA 是什么，能做什么

REA（Reverse Engineer Anything）把逆向分析工具接到编程 Agent，通过 MCP 或 CLI 分析已发布软件、JavaScript / Electron 包、原生二进制和运行行为。官方项目是 `morluto/rea`，npm 包名是 `rea-agents`。

它适合回答“发布包里如何实现某个功能”“两个版本有什么变化”“某个结论对应哪些代码证据”。反编译结果通常是伪代码，不能视为完整恢复了原始源码；界面相似也不能证明内部实现相同。

如果你已有完整源码，先用普通代码搜索、依赖图和测试。只需要把源码整理给模型时，看 [Repomix](repomix.md)。

## 1. 安装前区分三个部分

| 部分 | 负责什么 | 是否等于另外两部分已经就绪 |
|---|---|---|
| REA CLI / MCP Server | 调度分析并返回证据 | 否 |
| Agent Skill | 指导 Agent 选择分析路径 | 否 |
| 分析引擎 | 原生反编译、Android 等特定分析 | 否 |

静态 JavaScript 分析不要求 Hopper、Ghidra 或 IDA。原生程序需要对应引擎；Android 路径还可能需要 Java 与 JADX。先确定目标类型，再安装必要部分。

## 2. 检查环境和配置计划

先安装满足当前官方要求的 Node.js，确认：

```bash
node --version
npx --version
npx -y rea-agents@latest --help
```

下面以 Codex 为例，其他客户端替换为官方支持的 client ID：

```bash
npx -y rea-agents@latest doctor --client codex --json
npx -y rea-agents@latest setup --client codex --dry-run --json
```

`npx` 首次执行会下载包；doctor 检查配置不等于当前 Agent 已连接。查看 dry-run 中的配置路径、备份与 Skill 替换范围后，再执行安装。

## 3. 接入 MCP

```bash
npx -y rea-agents@latest setup --client codex
```

按照交互提示审查变更，然后重启或重新连接对应 Agent。确认实际工具列表里出现 REA 工具，再开始分析。只有 Skill 描述出现、但工具不存在，说明工作流说明已安装，MCP 连接尚未完成。

生产或团队文档应记录实际安装版本，后续用该版本复现；`latest` 是首次选取当前版本的入口，不是可重复构建的版本锁。

## 4. 第一个案例：分析自己的 JavaScript 发布目录

选一个自己维护的、没有凭证和客户数据的构建目录：

```bash
npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/demo-app --json
```

Windows 使用完整路径，例如 `D:/projects/demo-app/dist`。路径包含空格时加引号。ASAR 也走官方支持的 JavaScript 应用分析路径，不要把归档当成本地源码目录随意执行。

重点检查结果中的模块、导入关系、Electron 主进程 / 渲染进程边界、Evidence、limitations 与 unknowns。命中一个字符串只能证明字符串存在，不能证明代码执行过。

## 5. 给 Agent 的调查指令

```text
分析我提供的 demo-app 发布目录，解释搜索功能的数据流。
先做静态分析，不启动目标程序。
每个结论给出文件、符号或其他证据，并区分已确认事实与推测。
列出仍需运行时验证的部分，不要把伪代码说成原始源码。
```

这比“把这个应用完整复刻出来”更容易得到可检查结果。先限定一个功能，再根据证据扩大范围。

## 6. 原生程序如何选择引擎

| 目标 | 先检查什么 |
|---|---|
| PE / ELF / Mach-O | 架构、符号、选定原生分析引擎是否可用 |
| .NET | 是否为托管程序集；NativeAOT 不能按普通 IL 处理 |
| APK | 归档结构、Java / JADX 条件、原生库是否另需分析 |
| Electron | ASAR / JavaScript 静态路径，必要时再观察运行行为 |

setup 不是所有引擎的通用安装器。不要因为一个原生引擎缺失，就把已可用的 JavaScript 分析环境反复重装。

## 7. 常见问题

| 现象 | 检查顺序 |
|---|---|
| Agent 没有工具 | 客户端配置作用域 → MCP 启动日志 → 重连 → 实际工具列表 |
| doctor 正常但不能调用 | doctor 检查配置；当前会话仍可能没有连接 |
| 原生反编译不可用 | 引擎路径、许可、架构与官方支持范围 |
| Linux 子进程检查失败 | 官方说明要求的 procps 兼容 `ps` 是否在 PATH |
| 输出缺少结论 | 看限制与证据覆盖，缩小到指定模块 / 符号 |

## 8. 结果怎么验收

- 保存目标文件哈希、REA 版本与引擎版本。
- 区分静态发现、运行观察和模型推断。
- 每条核心结论可以追溯到具体证据。
- 分析未知包时先静态检查，需要运行时使用隔离环境。
- 公开报告去掉凭证、用户数据和无关私有内容。

分析范围应是自己拥有或获准检查的软件。本文案例仅做本地静态分析，没有绕过许可或提取账户凭证的步骤。

## 官方资料

- [REA 官方仓库](https://github.com/morluto/rea)
- [安装与客户端配置](https://github.com/morluto/rea/blob/main/docs/installation.md)
- [CLI 与 Evidence](https://github.com/morluto/rea/blob/main/docs/cli.md)
- [REA 官网与案例](https://rea.tools/)
