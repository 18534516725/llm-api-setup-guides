# Agent Skills 编写、测试与安全完整教程

> 最后核验：2026-09-02
>
> 适用范围：Agent Skills 开放规范、`SKILL.md`、脚本与参考资料的渐进加载
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Agent Skills 是什么

Agent Skills 是一种给 AI Agent 打包“可重复工作方法”的开放格式。一个 Skill 最少是一个包含 `SKILL.md` 的目录，也可以携带脚本、参考资料和模板。

它适合固化：

- 团队代码审查和发布流程；
- 特定文档、数据或设计产物的制作步骤；
- 需要反复执行的校验、迁移和排错方法；
- 只有任务匹配时才需要加载的领域知识。

Skill 不是 MCP Server。Skill 主要提供程序化知识和随包资源；MCP 主要把运行中的外部工具、资源和服务暴露给 Agent。两者可以组合使用。

## 2. 渐进加载为什么重要

兼容客户端通常分三层加载：

1. 启动时只读取 `name` 和 `description`；
2. 任务匹配后读取完整 `SKILL.md`；
3. 真正需要时再读取 `references/`、运行 `scripts/` 或复制 `assets/`。

因此 `description` 决定能否正确触发，而文件拆分决定上下文是否被无关资料占满。

## 3. 建立第一个 Skill

目录结构：

```text
api-smoke-test/
├── SKILL.md
├── scripts/
│   └── check-endpoint.sh
├── references/
│   └── error-codes.md
└── assets/
    └── report-template.md
```

`SKILL.md`：

```markdown
---
name: api-smoke-test
description: 验证兼容 API 的认证、模型列表、流式响应与错误语义。用户要求测试 API、排查 401/404/429 或做上线验收时使用。
license: MIT
compatibility: Requires curl and jq; network access is required.
---

# API Smoke Test

## Required inputs

- Base URL
- API Key from an environment variable
- Model ID

## Workflow

1. Confirm the target host with the user.
2. Run `scripts/check-endpoint.sh` without printing the key.
3. Compare failures with `references/error-codes.md`.
4. Fill `assets/report-template.md` with sanitized evidence.

## Safety

- Never put credentials in command-line arguments, reports, or logs.
- Only send requests to the user-approved host.
- Do not perform write operations during a smoke test.
```

规范要求 `name` 与父目录同名，只能使用小写字母、数字和连字符，长度不超过 64；`description` 必填，最长 1024 字符。

## 4. description 怎么写才会触发准确

好的描述同时回答“做什么”和“什么时候使用”：

```yaml
description: 分析 Node.js 性能剖析文件并定位 CPU、内存和事件循环瓶颈。用户提到 flamegraph、heap snapshot、event loop lag 或 Node 性能优化时使用。
```

避免：

```yaml
description: 帮助开发者解决问题。
```

描述太窄会漏触发，太宽会污染无关任务。准备正例、反例和容易混淆的近邻任务进行触发测试。

## 5. 正文要写“可执行流程”

弱指令：

```text
检查代码质量并适当处理错误。
```

强指令：

```text
1. 读取 package.json 确定测试命令。
2. 运行现有测试并记录失败基线。
3. 只修改与当前失败相关的文件。
4. 重新运行同一命令。
5. 运行 git diff --check。
6. 汇报命令、退出码和剩余风险。
```

给出默认做法和停止条件，避免把十个平级选项都留给 Agent 猜。

## 6. 什么时候拆 references 和 scripts

建议 `SKILL.md` 控制在 500 行以内。以下内容放到 `references/`：

- 大型 API Schema；
- 不同框架的详细差异；
- 很长的故障码表；
- 只有特定分支才用到的说明。

反复被重新编写、且输出可机械验证的逻辑放进 `scripts/`。脚本需要：

- 明确参数与退出码；
- 默认只读或提供 dry-run；
- 不打印密钥；
- 固定依赖和输入边界；
- 失败时给出可操作错误。

## 7. 校验格式

官方提供 `skills-ref` 参考库：

```bash
skills-ref validate ./api-smoke-test
```

校验能发现目录名、Frontmatter 和字段约束问题，但不能证明工作流程有效。

## 8. 建立行为测试集

至少准备三类测试：

```json
[
  {
    "name": "positive",
    "prompt": "帮我检查这个兼容 API 为什么返回 401",
    "should_trigger": true
  },
  {
    "name": "negative",
    "prompt": "帮我写一篇 API 科普文章",
    "should_trigger": false
  },
  {
    "name": "boundary",
    "prompt": "直接修改生产环境模型配置",
    "should_trigger": true,
    "expected": "停在授权边界，不执行写操作"
  }
]
```

对每个任务运行：

1. 不加载 Skill 的基线；
2. 加载 Skill 的版本；
3. 对照具体断言评分；
4. 查看完整轨迹，定位绕路、漏步骤和越权；
5. 修改通用规则并重跑全部用例。

## 9. 有效的断言

推荐可观察、不过度绑定措辞的断言：

- 输出没有出现完整 API Key；
- 修改前运行了现有测试；
- 写操作前要求确认；
- 报告包含实际命令与退出码；
- 失败时没有宣称完成。

“结果很好”不可验证；要求一字不差的固定句子又过于脆弱。

## 10. 安全威胁模型

安装第三方 Skill 等于允许 Agent 读取一组新指令，并可能运行其中的代码。重点检查：

- 是否要求读取 SSH、云凭据或浏览器 Cookie；
- 是否把环境变量上传到外部地址；
- 是否在脚本中使用未经固定的远程下载并直接执行；
- 是否诱导绕过审批、沙箱或系统指令；
- 是否修改其他 Skill、Agent 配置或自动启动项；
- 依赖和素材的许可证是否允许再分发。

安装前阅读所有文本和脚本，在隔离环境试运行；不要仅凭 Star 数或目录收录判断安全。

## 11. 跨客户端兼容

开放规范统一了 Skill 内容格式，但不同产品的安装目录、工具名、权限模型和可选字段支持仍可能不同。

建议：

- 核心流程不绑定某个客户端专属工具名；
- 在 `compatibility` 说明系统包和网络要求；
- 把产品特例放单独参考文件；
- `allowed-tools` 仍属实验字段，不把它当唯一安全措施；
- 在每个目标客户端分别测试触发与执行。

## 12. 常见问题

### Skill 从不触发

描述缺少用户实际会说的任务词，或只描述能力没描述触发场景。用真实提示建立正例集。

### 每个任务都会加载

描述过宽。增加边界词，明确不处理的近邻任务，并把通用口号删掉。

### 加载后仍然漏步骤

把关键顺序写成编号清单，增加验证门和“失败即停止”的条件。

### 上下文消耗过大

精简正文，将长表格和低频分支移动到一层 `references/`，避免深层引用链。

## 13. 验收清单

- [ ] 目录名与 Frontmatter `name` 一致；
- [ ] `description` 同时包含能力和触发条件；
- [ ] 正文给出默认步骤、验证和停止条件；
- [ ] 长资料按需拆到一层引用；
- [ ] 脚本有参数校验、非零失败码和凭据脱敏；
- [ ] 正例、反例和边界任务均测试；
- [ ] 高风险操作仍由宿主权限与人工审批控制；
- [ ] 第三方依赖、脚本和许可证已审查；
- [ ] 已在每个目标客户端单独验证。

## 14. 官方来源

- [Agent Skills 官方规范](https://agentskills.io/specification)
- [创建 Skill 的最佳实践](https://agentskills.io/skill-creation/best-practices)
- [评测 Skill 输出质量](https://agentskills.io/skill-creation/evaluating-skills)
- [优化 Skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)
- [Agent Skills 官方仓库](https://github.com/agentskills/agentskills)
