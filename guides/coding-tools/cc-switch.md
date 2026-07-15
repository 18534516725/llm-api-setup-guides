# CC Switch 管理 Claude Code、Codex 等自定义 API：完整配置与回滚教程

> 最后核验：2026-07-14
>
> 适用范围：CC Switch 桌面版；Windows、macOS、Linux
>
> 重要定位：CC Switch 是配置管理与本地路由工具，不是模型客户端；最终兼容性取决于目标编程工具、接口协议和模型能力

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. CC Switch 到底解决什么问题

Claude Code、Codex、Gemini CLI、OpenCode 等工具各自使用不同配置文件和环境变量。手工切换时容易：

- 改错 Base URL；
- 把一个协议的 Key 写进另一个工具；
- 覆盖原有 MCP、Prompt 或其他设置；
- 忘记重启 CLI，继续使用旧配置；
- 把真实 Key 留在项目配置或终端历史中。

CC Switch 用桌面界面管理多个 Provider Profile，并把选中的配置写入相应工具。它还提供配置切换、备份、托盘操作、MCP/Prompts/Skills 管理，以及可选的本地路由功能。

CC Switch 本身不调用模型完成编程任务。真正发请求的是 Claude Code、Codex 等目标工具。

## 2. 当前支持的工具

官方 README 在核验日期列出：

- Claude Code；
- Claude Desktop；
- Codex；
- Gemini CLI；
- OpenCode；
- OpenClaw；
- Hermes Agent。

各工具支持的协议和模型能力不同。“在 CC Switch 里能新增 Provider”不代表这个 Provider 对七个工具都能通用。

## 3. 配置前先选择正确协议

这是最容易出错的一步。

| 目标工具 | 常见接口协议 | 配置前必须确认 |
|---|---|---|
| Claude Code | Anthropic Messages | 服务端是否明确兼容 Claude Code 与 `/v1/messages` |
| Codex | 固定使用 OpenAI Responses | 服务是否原生支持 Responses；仅支持 Chat Completions 时是否启用 CC Switch 本地路由转换 |
| Gemini CLI | Gemini 协议或工具支持的兼容路径 | 控制台是否有专用教程 |
| OpenCode / OpenClaw / Hermes | 依各工具配置 | 不能仅凭模型名称判断 |

不要把“OpenAI 兼容 Base URL”直接填到 Claude Code Provider，也不要把 Anthropic Base URL 填到 Codex Provider。即使同一个 Key 能调用多种模型，不同工具仍可能需要不同地址。

## 4. 准备清单

- 已安装至少一个目标编程工具；
- 已启动过目标工具一次，让它生成默认配置；
- 有效 API Key；
- 目标工具专用 Base URL；
- 准确模型 ID；
- 当前配置文件的备份；
- 一个用于验证的小型测试仓库。

建议先直接按该工具官方环境变量或配置文件完成一次最小连接，再用 CC Switch 管理切换。这样出现问题时可以区分是接口问题还是配置写入问题。

## 5. 安装 CC Switch

只从官方来源下载：

1. 打开 [CC Switch Releases](https://github.com/farion1231/cc-switch/releases/latest)；
2. 选择操作系统对应安装包；
3. 下载后核对文件名和发布页；
4. 安装并启动；
5. 允许应用检测已安装的目标工具配置。

### Windows

官方提供 MSI 安装包和便携版。便携版仍会在用户目录保存数据库与设置，不等于“完全不落盘”。

### macOS

优先使用官方 DMG。若系统提示无法验证开发者，先核对下载来源与当前发布说明，不要直接执行网上流传的全局关闭安全检查命令。

### Linux

根据发布页选择 AppImage 或相应包。Wayland/NVIDIA 出现点击或黑屏问题时，参考官方 README 的 `CC_SWITCH_GDK_BACKEND` 说明，不要随意更改系统级图形配置。

## 6. 第一次启动与导入

首次启动时，CC Switch 会检测支持工具的已有配置。建议：

1. 退出正在运行的 Claude Code、Codex 等 CLI；
2. 在 CC Switch 中逐个启用你实际使用的应用；
3. 让它导入当前默认 Provider；
4. 给导入项改一个清晰名称，例如 `官方登录-备份`；
5. 不要删除唯一的活动 Provider；
6. 完成备份后再添加自定义 Provider。

保留原始 Provider 是最简单的回滚路径。

## 7. 添加 Claude Code 自定义 Provider

只有服务端明确兼容 Anthropic Messages / Claude Code 时才使用此流程。

1. 在 CC Switch 顶部选择 `Claude` 或 `Claude Code`；
2. 点击新增 Provider；
3. 选择自定义或与控制台教程对应的类型；
4. 名称填写易识别的标签，例如 `Nexo-Claude`；
5. Base URL 填写：

   ```text
   从控制台复制的ClaudeCode专用BaseURL
   ```

6. API Key 填写：

   ```text
   你的APIKey
   ```

7. 主模型填写控制台给出的准确模型 ID；
8. 如表单提供快速/后台模型，填入该 Key 可用的对应 ID；
9. 保存；
10. 点击切换，使该 Provider 成为当前活动项；
11. 新开终端运行 Claude Code 验证。

不要在 Base URL 中手工追加 `/v1/messages`。CC Switch 与目标客户端需要的是基础地址，完整 endpoint 由客户端拼接。

## 8. 添加 Codex 自定义 Provider

截至本文核验版本，CC Switch 的 Codex 配置固定以 **Responses** 作为 Wire API，表单中不再提供 Responses / Chat Completions 选择器。接入方式分两种：

- 服务原生支持 Responses：直接配置并连接；
- 服务只有 Chat Completions：必须启用 CC Switch 的本地路由映射，由本地路由完成 Responses 与 Chat Completions 之间的转换。

1. 在 CC Switch 选择 `Codex`；
2. 新增自定义 Provider；
3. 填写易识别名称，例如 `Nexo-Codex`；
4. 填写 Codex 专用 Base URL：

   ```text
   从控制台复制的Codex专用BaseURL
   ```

5. 填写 API Key；
6. 填写准确模型 ID；
7. 服务原生支持 Responses 时，保存并切换；
8. 服务仅支持 Chat Completions 时，开启 `Needs Local Routing / 本地路由映射`，配置目标模型映射，并保持 CC Switch 本地路由服务运行；
9. 退出旧 Codex 会话，新开终端验证；
10. 在确认可以回滚后，明确停用本地路由/代理接管再测试，以确认当前方案是否依赖转换。依赖路由时，CC Switch 路由服务必须持续运行；仅关闭窗口可能仍会驻留托盘，不能视为路由已停止。

“普通 OpenAI Chat 可用”不代表 Responses API 可用。若出现 404 或响应结构错误，先确认服务是否原生实现 Responses；若没有，就检查本地路由是否开启、端口是否可达、模型映射是否正确。不要寻找旧版教程中的 Wire API 下拉框，当前版本已移除该选项。

## 9. 通用 Provider 的使用边界

CC Switch 支持用一份通用配置同步到多个应用，但只有满足以下条件才适合：

- 同一 Key 确实有多个协议权限；
- 每个应用可以单独指定正确 Base URL；
- 模型映射已明确；
- 不会用一条 URL 覆盖不同协议；
- 已分别在每个目标应用验证。

不要为了“少填一次”强行让所有工具共享完全相同的 URL 和模型字段。统一管理的目标是减少错误，不是抹平协议差异。

## 10. 模型自动发现

新版 CC Switch 支持通过 OpenAI 兼容 `/v1/models` 尝试获取模型列表。使用时要注意：

- 接口未实现 `/models` 不代表聊天接口不可用；
- 列表成功也不代表模型支持 Agent 工具调用；
- 自动发现的模型可能包含当前 Key 无权调用的项目；
- 最可靠的模型 ID 仍是控制台针对该工具给出的值。

模型拉取失败时可以手工填写，不要反复暴露 Key 到非官方测试网站。

## 11. 切换后如何确认真正生效

不要只看 CC Switch 中按钮变色。至少完成以下检查：

1. CC Switch 显示目标 Provider 为活动项；
2. 关闭旧 CLI 会话；
3. 新开终端；
4. 运行目标工具的状态命令；
5. 检查当前模型或 Provider 显示；
6. 发送只读、最小测试；
7. 在服务商控制台检查是否出现对应请求记录。

多数工具需要重启终端或 CLI 才能读取新配置。官方 README 特别说明 Claude Code 支持热切换，但为了排除旧进程缓存，首次验证仍建议新开会话。

## 12. 分层测试

### 纯回复

```text
只回复“连接成功”，不要读取文件或运行命令。
```

### 只读项目

```text
只读取当前项目的 README，并概括用途。不要修改任何文件。
```

### 工具调用

```text
读取项目的包管理配置并列出测试命令，不要执行。
```

### 写入与测试

在 Git 干净的测试仓库中执行一个可回滚的小任务。若前三步正常、工具步骤失败，问题通常在模型工具能力或协议转换，而不是 CC Switch 的切换按钮。

## 13. 通用配置片段

切换 Provider 时，目标配置文件中可能还有 MCP、插件、权限、环境变量等不应丢失的字段。CC Switch 官方提供“通用配置片段”：

1. 编辑当前已正确工作的 Provider；
2. 打开通用配置面板；
3. 从当前 Provider 提取非连接类通用字段；
4. 新建 Provider 时启用“应用通用配置”；
5. 切换后检查原有 MCP、权限与插件设置。

不要把 Key 和 Base URL 当成通用字段传播到所有应用。通用片段适合共享非秘密、跨 Provider 不变的配置。

## 14. 本地路由与热切换

CC Switch 的本地路由模式会让目标工具连接本机代理，再由本地代理转发到活动 Provider。它可以减少频繁重写配置，并支持健康检查、故障转移等能力。

使用前理解这些影响：

- CC Switch 需要持续运行；
- 本地监听端口被占用会导致连接失败；
- 防火墙可能阻止本地连接；
- 应用配置显示的是本地地址，不是实际远端地址；
- 退出 CC Switch 后目标工具可能立即失去连接；
- 路由日志可能包含请求元数据，应妥善保管。

第一次配置建议先使用普通切换。只有理解请求路径并确实需要热切换时再开启本地路由。

## 15. MCP、Prompts 与 Skills

CC Switch 可以集中管理多应用的 MCP、Prompt 和 Skill，但这些内容拥有很高权限：

- MCP 可访问本地文件、数据库或网络服务；
- Prompt 会影响 Agent 的长期行为；
- Skill 可能包含脚本和命令；
- 从 GitHub 或 ZIP 安装不等于代码可信。

导入前应检查仓库、维护者、版本和脚本。不要因“安装方便”就把未知 Skill 同步到全部编程工具。

## 16. 配置、备份与同步位置

官方 README 给出的主要本地位置：

```text
~/.cc-switch/cc-switch.db
~/.cc-switch/settings.json
~/.cc-switch/backups/
~/.cc-switch/skills/
~/.cc-switch/skill-backups/
```

其中数据库和备份可能含 Provider 连接信息。建议：

- 限制目录访问权限；
- 不上传到公开网盘或 Git 仓库；
- 开启云同步前确认服务的端到端安全与账号保护；
- 分享问题截图或数据库前先脱敏；
- 设备丢失后撤销所有相关 Key。

不要把“存在 SQLite 数据库”理解为“所有字段都已加密”。本地账号安全和磁盘加密仍然重要。

## 17. 常见错误

### 切换成功但 CLI 仍用旧配置

- 旧进程尚未退出；
- 新终端继承了旧环境变量；
- 当前活动的是另一个应用标签；
- 目标工具配置路径被自定义；
- 旧 Provider 的环境变量优先级更高。

彻底退出 CLI，新开终端，检查环境变量与状态信息。

### 401

- Key 错误或撤销；
- Base URL 和 Key 不匹配；
- 选择了错误协议；
- 目标工具使用了另一种认证头。

### 404

- Base URL 层级错误；
- 填入完整 endpoint；
- Claude/Codex 地址混用；
- 服务不支持原生 Responses，且未启用本地路由转换，或模型映射错误。

### Model not found

- 模型 ID 错误；
- 模型映射未配置；
- Key 没有模型权限；
- 热切换后客户端菜单仍缓存旧模型。

新开会话并从控制台重新复制模型 ID。

### 本地路由连接被拒绝

- CC Switch 未运行；
- 监听端口冲突；
- 本地防火墙拦截；
- 目标工具仍指向旧端口；
- 本地代理启动失败。

先关闭本地路由并回到普通 Provider 配置，确认远端接口本身可用。

### 切换后 MCP / 插件丢失

从原 Provider 提取通用配置片段，再应用到新 Provider。操作前备份，不要直接覆盖未知字段。

### 429 / 额度不足

CC Switch 不能绕过服务端限流和余额。减少并发、缩短任务、等待限流恢复并查看平台用量。

## 18. 回滚到原配置

1. 退出目标 CLI；
2. 在 CC Switch 选择首次导入并保留的原 Provider；
3. 点击切换；
4. 新开终端；
5. 若是官方账号模式，按目标工具要求重新执行 logout/login；
6. 验证原模型；
7. 确认恢复后再删除测试 Provider；
8. 在服务端撤销不用的测试 Key。

如果启用了本地路由，先关闭对应应用的代理接管，再切换回普通配置。

## 19. 卸载前的正确顺序

1. 将每个目标工具切换到可独立运行的 Provider；
2. 关闭本地路由；
3. 新开终端确认工具不依赖 CC Switch；
4. 导出必要的非敏感配置；
5. 撤销不用的 Key；
6. 再卸载 CC Switch；
7. 按需安全删除其数据库与备份目录。

直接卸载而不恢复目标工具配置，可能让 Claude Code、Codex 等仍指向已不存在的本地代理。

## 20. 官方资料

- [CC Switch 官方 GitHub](https://github.com/farion1231/cc-switch)
- [CC Switch 中文 README](https://github.com/farion1231/cc-switch/blob/main/README_ZH.md)
- [CC Switch Releases](https://github.com/farion1231/cc-switch/releases)
- [CC Switch 用户手册](https://github.com/farion1231/cc-switch/tree/main/docs/user-manual/zh)
- [CC Switch 更新日志](https://github.com/farion1231/cc-switch/blob/main/CHANGELOG.md)

> CC Switch 和目标 CLI 都在快速变化。字段名、支持应用和协议选项以当前官方版本为准；任何“一键导入”完成后，都应在目标工具中独立验证。
