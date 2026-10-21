---
title: Repomix 中文教程：把代码仓库整理成 AI 可读上下文
description: 介绍 Repomix 的本地打包、文件筛选、忽略规则、Token 控制、压缩与敏感信息核验，避免把整个仓库无差别上传给模型。
---

# Repomix 中文教程：把代码仓库整理成 AI 可读上下文

> 最后核验：2026-10-21。命令依据官方 CLI，输出格式以所固定版本为准。

[← 返回教程总目录](../教程总目录.md)

## Repomix 适合什么任务

Repomix 把多个源码文件整理成一个适合模型阅读的文件，并提供文件树、Token 统计和筛选能力。适合代码问答、架构理解、迁移前评估和把有限上下文交给不直接访问仓库的模型。

它不会把项目自动变成高质量知识库，也不会保证打包文件一定小于模型上下文。没有源码、只有发布包时，参阅 [REA](rea.md)。

## 1. 在独立测试目录试用

需要当前 CLI 支持的 Node.js 环境：

```bash
pnpm dlx repomix@latest --help
pnpm dlx repomix@latest
```

默认生成 `repomix-output.xml`。这是导出产物，通常不应提交到业务仓库。命令首次运行会下载依赖，团队使用应固定版本。

## 2. 先缩小范围

例如只需要理解前端组件和构建配置：

```bash
pnpm dlx repomix@latest --include "src/**,package.json" --output review-context.xml
```

先确认这些路径确实存在。后端账单问题不应附上所有用户上传文件；一个组件问题也不需要打包全部历史文档。

## 3. 忽略敏感和无关文件

项目根目录可放 `.repomixignore`，例如：

```gitignore
.env
.env.*
*.pem
*.key
logs/**
uploads/**
backups/**
review-context.xml
repomix-output.*
```

官方还支持 Git 忽略规则及 Secretlint 检查。自动检查不能保证识别所有内部数据，导出后仍需人工检查。不要关闭安全检查来消除告警。

## 4. Token 太多怎么办

依次采取：

1. 删除依赖目录和生成文件。
2. 只保留目标模块及直接依赖。
3. 区分实现文件、接口契约、测试与配置。
4. 大仓库按问题拆包。
5. 在允许丢失部分细节时再评估压缩。

```bash
pnpm dlx repomix@latest --include "src/**" --compress --output compressed-context.xml
```

`--compress` 基于代码结构提取关键部分，适合理解结构；分析细小分支、注释约定和精确行为时应回到原文件。

## 5. 给 AI 的提问方式

```text
附件是选定模块的源码快照。
请解释请求从入口到数据层的调用链，并引用文件路径和符号名。
只根据附件判断；缺失的依赖列为未知，不要补造实现。
先给分析，不修改代码。
```

打包文件里的源码和注释也可能包含不可信指令。分析工具应把其作为资料，而非高于用户要求的命令。

## 6. 交付前验收

| 检查项 | 通过标准 |
|---|---|
| 范围 | 只包含本次问题所需文件 |
| 凭证 | 没有真实 Key、私钥、数据库备份 |
| 数据 | 没有用户信息、日志正文、会话状态 |
| 成本 | Token 数和模型可用输入预算匹配 |
| 版本 | 记录仓库提交、Repomix 版本和筛选条件 |
| 结果 | AI 的关键判断能回到原文件核对 |

## 7. 常见问题

**为什么少了文件？** 检查 include、Git 忽略、`.repomixignore` 和安全检查报告。

**为什么一个文件占用很多 Token？** 检查压缩资源、lockfile、生成代码与长文本；仅当问题需要它们时才保留。

**本地打包是否意味着不会外传？** 本地 CLI 的打包与后续上传给模型是两个步骤。提交附件前仍要核对目标服务和内容。

**能否用网页版？** 官方提供在线入口。私有源码应先确认数据处理方式，优先按组织规定在本地整理。

## 来源与下一步

- [Repomix 官方仓库](https://github.com/yamadashy/repomix)
- [Repomix 官方文档](https://repomix.com/guide/)
- [Token 与上下文成本](../basics/token-context-agent-cost.md)
- [API Key 泄露处置](../basics/api-key-leak-response.md)
