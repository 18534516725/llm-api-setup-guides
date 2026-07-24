# Claude Code 进阶配置：CLAUDE.md、Rules、Skills、Hooks 与 Subagents

> 最后核验：2026-07-24
>
> 适用范围：当前 Claude Code；开始前先完成 [Claude Code 基础接入](./claude-code.md)
>
> 预计用时：20～40 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 五种扩展各自解决什么问题

| 能力 | 作用 | 最适合 |
|---|---|---|
| CLAUDE.md | 每次会话加载的持久说明 | 项目事实、命令、长期约定 |
| `.claude/rules/` | 模块化、可按路径加载的规则 | 单体仓库、不同语言或目录 |
| Skills | 按需加载的知识与可复用流程 | 发布、审查、领域手册 |
| Hooks | 在生命周期事件中确定执行 | 校验、阻止危险动作、记录 |
| Subagents | 独立上下文中的专门执行者 | 大量检索、专项审查、隔离任务 |

选择原则：

- 每次都要知道的短事实写 CLAUDE.md；
- 只对特定目录生效的要求写 Rules；
- 反复使用的流程做成 Skill；
- 必须在固定事件执行的检查用 Hook；
- 会产生大量中间上下文的独立任务交给 Subagent。

## 2. CLAUDE.md 的加载范围

常用位置：

| 范围 | 位置 |
|---|---|
| 用户级 | `~/.claude/CLAUDE.md` |
| 项目级 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` |
| 本地项目偏好 | `./CLAUDE.local.md` |
| 目录级 | 子目录中的 `CLAUDE.md` |

Claude Code 会把启动目录上方发现的文件按层级加入上下文，而不是简单“最近文件覆盖上级文件”。子目录中的 CLAUDE.md 会在读取该目录文件时按需加载。

项目级文件适合提交到 Git；`CLAUDE.local.md` 适合个人设置，应加入 `.gitignore`。

## 3. 写一份有效的 CLAUDE.md

示例：

```markdown
# 项目说明

## 技术栈
- Node.js 22、TypeScript、pnpm。
- 前端使用 React，后端使用 Fastify。

## 必须使用的命令
- 安装依赖：pnpm install
- 单元测试：pnpm test
- 生产构建：pnpm build

## 约定
- 不运行 npm install。
- API 输入在路由入口校验。
- 修复缺陷时补充回归测试。
- 不提交 .env、Token、证书或生产数据。

## 完成标准
- 运行相关测试和类型检查。
- 用 git diff 确认没有无关修改。
- 未经明确要求不要推送远端。
```

避免：

- “写得漂亮一点”这类模糊要求；
- 复制整份 API 手册；
- 互相冲突的规则；
- 把 Key、数据库密码写进去；
- 用行为提示代替真正的权限控制。

CLAUDE.md 是上下文，不是强制安全机制。必须阻止的操作应使用权限设置、沙箱或 PreToolUse Hook。

## 4. `/init`、`/memory` 与 Auto Memory

运行：

```text
/init
```

可让 Claude 分析项目并生成 CLAUDE.md 初稿；如果文件已存在，它会提出改进建议。生成内容必须人工删减和校正。

运行：

```text
/memory
```

可以查看当前加载的 CLAUDE.md、Rules 和 Auto Memory，也可以切换 Auto Memory。

Auto Memory 与 CLAUDE.md 不同：

- CLAUDE.md 由人维护，用于明确要求；
- Auto Memory 由 Claude 根据工作过程记录；
- Auto Memory 默认按仓库存放在本机；
- 启动时只加载 `MEMORY.md` 的前 200 行或 25KB；
- 可随时用 `/memory` 审查、编辑或删除。

不要依赖旧教程中的 `#` 快捷写入说法。需要长期明确规则时，直接编辑 CLAUDE.md 或明确要求“把这条加入 CLAUDE.md”。

## 5. 用 Rules 拆分大型项目约定

目录：

```text
.claude/rules/
├── frontend.md
├── backend.md
└── security.md
```

Rules 适合让不同文件路径加载不同说明，避免根 CLAUDE.md 过长。示例：

```markdown
---
paths:
  - "frontend/**/*.{ts,tsx}"
---

# 前端约定

- 所有用户文案使用 i18n。
- 组件必须支持亮色与暗色主题。
- 提交前运行 pnpm --dir frontend build。
```

路径规则应与仓库真实目录一致。可以用 `/memory` 检查某次会话加载了哪些说明。

## 6. Skills：按需加载流程与知识

项目 Skill 的典型结构：

```text
.claude/skills/release-check/
└── SKILL.md
```

```markdown
---
name: release-check
description: 发布前检查版本、测试、构建和敏感信息
---

# 发布检查

1. 查看工作区状态和目标分支。
2. 运行相关测试与生产构建。
3. 检查依赖锁文件。
4. 扫描密钥和私钥。
5. 展示提交文件清单。
6. 未经确认不要推送或部署。
```

Skill 适合多步骤流程和低频参考资料。内容只有相关时才加载，比把所有细节塞进 CLAUDE.md 更节省常驻上下文。

## 7. Hooks：确定性执行检查

Hook 命令会从标准输入接收 JSON，而不是依赖未经确认的环境变量。下面示例在 Bash 工具执行前阻止明显的强制推送。

`.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/check-bash.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/check-bash.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"

case "$command" in
  *"git push --force"*|*"git push -f"*)
    echo "已阻止强制推送，请使用普通快进推送。" >&2
    exit 2
    ;;
esac

exit 0
```

添加执行权限：

```bash
chmod +x .claude/hooks/check-bash.sh
```

先在临时仓库验证。Hook 脚本本身拥有本机进程权限，必须像生产代码一样审查；不要从不可信仓库直接运行项目 Hooks。

## 8. Subagents：隔离上下文

项目 Subagent：

```text
.claude/agents/security-reviewer.md
```

```markdown
---
name: security-reviewer
description: 审查鉴权、输入校验、敏感信息和高风险变更
tools:
  - Read
  - Grep
  - Glob
model: inherit
permissionMode: plan
maxTurns: 20
---

你是只读安全审查员。

只检查当前任务涉及的代码，按严重程度报告：
1. 鉴权与越权；
2. 注入和输入校验；
3. 密钥、日志和隐私；
4. 文件、网络和命令执行风险；
5. 缺失的安全测试。

不要修改文件，不要执行写入命令。
```

Subagent 使用独立上下文，适合读很多文件后只返回总结。通过 `tools`、`permissionMode`、`maxTurns` 和 `disallowedTools` 控制范围。高风险环境不要使用 `bypassPermissions`。

## 9. 推荐组合

一个稳妥的项目配置可以是：

1. CLAUDE.md 只保留技术栈、命令和全局约定；
2. `.claude/rules/` 按前端、后端和数据库分范围；
3. Skills 保存发布、排错和代码审查流程；
4. Hook 阻止确定的危险命令；
5. Subagent 完成只读安全审查；
6. MCP 只连接必要外部系统并使用最小权限。

不要一开始就把全部机制都启用。先解决一个真实重复问题，再增加一个配置。

## 10. 验证清单

- [ ] `/memory` 能看到预期 CLAUDE.md 和 Rules；
- [ ] 新会话能正确复述项目命令；
- [ ] 路径规则只在对应目录生效；
- [ ] Skill 可按名称调用；
- [ ] Hook 在临时仓库阻止测试命令；
- [ ] Hook 不影响普通只读命令；
- [ ] Subagent 只能使用声明的工具；
- [ ] 配置中没有真实 Key；
- [ ] `git diff` 只包含预期文件。

## 11. 常见问题

| 现象 | 处理 |
|---|---|
| CLAUDE.md 没加载 | 用 `/memory` 检查位置和当前启动目录 |
| 多层规则冲突 | 删除重复表述，明确单一规则来源 |
| 上下文过大 | 精简 CLAUDE.md，改用路径 Rules 或按需 Skill |
| `/compact` 后规则像丢失 | 根 CLAUDE.md 会重新注入；子目录规则在再次读取该目录时加载 |
| Skill 不出现 | 检查目录、Frontmatter 和描述 |
| Hook 一直报错 | 直接用保存的 JSON 样例测试脚本，并检查可执行权限与 `jq` |
| Hook 没阻止操作 | 确认事件、matcher 和退出码；PreToolUse 用退出码 2 阻止 |
| Subagent 权限过大 | 明确 `tools` / `disallowedTools`，使用 `plan` 或默认审批 |

## 12. 官方资料

- [Claude Code Memory 与 CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Claude Code 扩展能力总览](https://code.claude.com/docs/en/features-overview)
- [Agent Skills](https://code.claude.com/docs/en/skills)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Permissions](https://code.claude.com/docs/en/permissions)
