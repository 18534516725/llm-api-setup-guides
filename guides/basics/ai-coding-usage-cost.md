# AI 编程工具用量监控与成本优化：ccusage 实战指南

> 最后核验：2026-07-24
>
> 适用范围：Claude Code、Codex、OpenCode、Goose、Kilo、Qwen、Gemini CLI、GitHub Copilot CLI 等本地有用量记录的工具
>
> 预计用时：10～20 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 先分清“用量”“估算成本”和“剩余额度”

这三个数字不是一回事：

| 指标 | 含义 | 可信来源 |
|---|---|---|
| Token 用量 | 本地日志记录的输入、输出和缓存 Token | 工具本地记录或 API Usage |
| 估算成本 | Token 乘以价格表得到的理论费用 | ccusage 等本地分析工具 |
| 剩余额度 / 限流窗口 | 服务端当前允许继续使用的配额 | 官方账户页、API 响应和服务端 Usage |

ccusage 擅长分析本地记录和估算成本，但不能替代服务端账单。订阅套餐、动态路由、免费额度、缓存政策和特殊折扣都会让估算值与实际扣费不同。

## 2. ccusage 是什么

ccusage 是一个读取本地 Agent CLI 用量记录并生成报表的开源工具。当前官方项目支持多种数据源，包括 Claude Code、Codex、OpenCode、Goose、Kilo、Qwen、GitHub Copilot CLI 和 Gemini CLI 等。

它可以生成：

- 按日、周、月统计；
- 按会话统计；
- 按工具查看；
- Token 与缓存用量；
- 基于模型价格的估算成本；
- JSON 输出；
- Claude Code 五小时窗口视图和状态栏信息。

## 3. 不安装直接运行

需要本机已安装 Node.js。推荐先运行：

```bash
npx ccusage@latest
```

也可以使用：

```bash
pnpm dlx ccusage
bunx ccusage
```

第一次执行会从包仓库下载工具。对供应链要求较高的环境，应先检查官方仓库、包名、版本和依赖，再固定版本运行。

## 4. 常用报表

全部检测到的数据源：

```bash
npx ccusage@latest daily
npx ccusage@latest weekly
npx ccusage@latest monthly
npx ccusage@latest session
```

只看某个工具：

```bash
npx ccusage@latest claude daily
npx ccusage@latest codex daily
npx ccusage@latest opencode weekly
npx ccusage@latest goose session
npx ccusage@latest qwen daily
npx ccusage@latest gemini daily
```

以当前命令帮助为准：

```bash
npx ccusage@latest --help
```

不要照抄几个月前的子命令。ccusage 已从单一 Claude Code 工具扩展为多数据源工具，旧教程的命令结构可能过时。

## 5. Claude Code Blocks 视图

```bash
npx ccusage@latest blocks
```

Blocks 用于按 Claude Code 的五小时窗口整理本地用量。它可以帮助观察一段工作窗口内的消耗节奏，但不是官方“剩余订阅额度”查询器。

实时视图：

```bash
npx ccusage@latest blocks --live
```

如果当前版本不支持某个参数，以 `--help` 和官方文档为准。

## 6. Statusline

ccusage 提供 Claude Code 状态栏输出：

```bash
npx ccusage@latest statusline
```

正式配置前先单独运行，确认输出时间和性能可接受。状态栏会频繁执行，不要在其中加入昂贵网络请求或写入操作。

Statusline 是辅助观察工具。订阅限制、官方用量和账户状态仍以服务端页面为准。

## 7. JSON 输出与自己的报表

需要自动分析时使用 JSON，而不是解析彩色表格：

```bash
npx ccusage@latest daily --json
```

具体参数以当前版本帮助为准。可以把 JSON 送入 `jq`：

```bash
npx ccusage@latest daily --json | jq .
```

如果要保存报告：

```bash
npx ccusage@latest weekly --json > usage-weekly.json
```

用量文件可能暴露项目路径、模型和工作时间。不要把原始 JSON 提交到公开仓库。

## 8. 为什么 Agent 比普通聊天更耗 Token

一次 Agent 任务通常包含：

1. 系统提示与项目规则；
2. 用户任务；
3. 文件搜索和读取；
4. 工具定义；
5. 多次工具调用结果；
6. 修改后的再次检查；
7. 测试和错误日志；
8. 最终总结。

每轮可能重新携带部分历史、规则和工具信息。会话越长、读取文件越多、工具循环越多，总用量通常越高。

## 9. 最有效的成本优化

### 先缩小任务范围

差：

```text
把整个项目优化一下。
```

更好：

```text
只分析登录接口的 401 问题。
先定位原因并报告，不修改其他模块。
```

明确目录、文件、目标和禁止事项，可减少无关搜索与重复尝试。

### 精简常驻说明

- CLAUDE.md 只放每次都需要的事实；
- 大型流程做成 Skill；
- 不同目录使用路径 Rules；
- 不把整份 API 手册常驻加载；
- 删除重复和冲突说明。

### 分阶段工作

先诊断，再设计，再实现，再验证。让 Agent 一次同时研究、重构、升级依赖、写文档和部署，容易造成大量回退。

### 控制工具输出

- 日志只取相关时间和行数；
- 测试先跑相关用例，再跑完整套件；
- 搜索使用明确关键词和目录；
- 大型生成目录、依赖和构建产物应排除；
- 不把完整数据库导出或超长日志塞进上下文。

### 为任务选择模型

- 文件定位、格式调整用快速模型；
- 架构、复杂调试、安全审查用更强模型；
- Utility Tasks 使用低延迟模型；
- 推理强度只在复杂任务中提高。

## 10. 缓存的正确理解

Prompt Cache 可能降低重复上下文的计费或延迟，但不能假定：

- 所有服务都支持缓存；
- 所有模型缓存价格相同；
- 任意请求都能命中；
- 本地估算与实际账单完全一致。

连续处理同一项目、保持稳定的系统说明通常更有利于重复前缀复用；频繁修改常驻提示、切换模型或跨服务会影响缓存。具体命中和价格以服务端 Usage 与价格文档为准。

## 11. 建立每周复盘

建议每周固定记录：

| 项目 | 观察内容 |
|---|---|
| 总用量 | 与上周相比是否异常 |
| 高消耗会话 | 是否因范围过大、日志过长或循环失败 |
| 模型分布 | 简单任务是否误用高成本模型 |
| 缓存 | 输入和缓存 Token 是否符合预期 |
| 失败请求 | 401、429、5xx 和工具循环是否反复发生 |
| 实际账单 | 与本地估算差异及原因 |

不要只追求 Token 越少越好。一次准确完成的高质量任务，可能比多次低价失败更省。

## 12. 隐私与安全

ccusage 官方说明其读取本地工具生成的用量文件。使用前仍应：

- 从官方仓库确认包名；
- 在高安全环境固定版本；
- 不公开原始会话文件；
- 不把报告中的路径和项目名直接发到 Issue；
- 检查自动化脚本是否会上传 JSON；
- 删除报告前确认是否属于审计记录。

本地记录可能包含会话元数据甚至完整对话文件。ccusage 的报表用途不等于可以随意共享原始数据目录。

## 13. 常见问题

| 现象 | 处理 |
|---|---|
| 报表为空 | 当前工具没有本地记录，或数据目录不是默认位置 |
| 实际账单与估算不同 | 检查模型价格、缓存、订阅、免费额度和服务端折扣 |
| Blocks 与官方剩余额度不同 | Blocks 是本地窗口分析，不是服务端配额真值 |
| 找不到旧命令 | 运行当前版本 `--help`，使用新的多数据源命令 |
| npx 每次很慢 | 使用 pnpm/bun 缓存，或固定可信版本 |
| JSON 暴露项目路径 | 分享前脱敏，不提交原始报告 |
| 某个工具没有数据 | 查看 ccusage 对该数据源的专用文档和默认目录 |
| Token 突然增加 | 检查长会话、规则膨胀、日志、工具循环和模型切换 |

## 14. 官方资料

- [ccusage 官方 GitHub](https://github.com/ccusage/ccusage)
- [ccusage 文档](https://ccusage.com/guide/)
- [ccusage Installation](https://ccusage.com/guide/installation)
- [ccusage Data Sources](https://ccusage.com/guide/#data-sources)
- [Claude Code 成本管理](https://code.claude.com/docs/en/costs)
- [OpenAI API Usage](https://platform.openai.com/usage)
