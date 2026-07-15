# AionUi 多 Agent 桌面工作台接入自定义 OpenAI 兼容 API

> 最后核验：2026-07-15
>
> 适用范围：AionUi 当前桌面版；Settings → Models → Custom
>
> 预计用时：10～15 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. AionUi 是什么

AionUi 是开源桌面 AI 工作台，可以运行内置 Agent，并管理多种 CLI Agent、模型、技能和工作区。官方 LLM 配置文档提供 `Custom` 平台，用于连接 OpenAI-compatible 服务。

自定义模型主要决定内置 Agent 的推理链路。外部 CLI Agent 可能有自己独立的登录、环境变量和配置文件；在 AionUi 中添加模型不等于自动修改所有外部 CLI。

## 2. 安装

从以下官方入口下载当前版本：

- [AionUi 官网](https://aionui.com/)
- [AionUi GitHub Releases](https://github.com/iOfficeAI/AionUi/releases)

按操作系统选择官方安装包，安装并启动。首次运行时确认工作区目录，不要直接选择包含生产密钥和大量私人文件的目录。

## 3. 打开模型配置

1. 打开 AionUi；
2. 进入 `Settings`；
3. 打开 `Models`；
4. 点击 `Add Model`；
5. 平台选择 `Custom`；
6. 填写 Base URL、API Key 和模型名称；
7. 保存。

官方 Wiki 说明 Custom 使用 OpenAI-compatible 接口，适合未内置的平台或本地 Ollama、LM Studio 等兼容服务。

## 4. 填写自定义接口

```text
Platform: Custom
Base URL: https://your-api.example.com/v1
API Key: YOUR_API_KEY
Model Name: YOUR_MODEL_ID
```

对于无需认证的本地服务，界面若要求非空 Key，可使用明显的本地占位值；远程服务必须使用真实、可撤销的 API Key。

常见拼接：

```text
Base URL: https://your-api.example.com/v1
Models: https://your-api.example.com/v1/models
Chat: https://your-api.example.com/v1/chat/completions
```

不要把网页控制台地址或完整 `/chat/completions` 填入 Base URL。

## 5. 多 Key 轮换的边界

AionUi 官方配置说明支持多 API Key。是否使用前应确认：

- 服务是否允许同一账号创建多个 Key；
- 轮换是否会掩盖单 Key 的 429 或额度问题；
- 每个 Key 是否具有相同模型权限；
- 日志是否会意外记录所有 Key；
- 团队设备是否应该共享同一组凭据。

新手先使用一个独立 Key 完成验证，确认稳定后再考虑轮换。

## 6. 最小聊天验证

1. 新建内置 Agent 会话；
2. 选择 Custom 下的 `YOUR_MODEL_ID`；
3. 不挂载文件，不启用技能和外部工具；
4. 发送：

```text
只回复：连接正常
```

确认回复完整、能停止生成、切换会话后模型仍可选择。然后重启 AionUi，检查设置是否持久化。

## 7. 工作区与文件验证

使用临时目录：

```bash
mkdir aionui-api-test
cd aionui-api-test
git init
printf '# AionUi Test\n' > README.md
```

把该目录作为测试工作区，依次执行：

```text
只读取 README.md，复述标题，不要修改。
```

```text
在 README.md 末尾增加“连接验证成功”，展示修改，不要提交。
```

在终端运行 `git diff` 确认实际变化。不同 Agent 的工具协议和审批机制不同，应分别验证，不能用内置 Agent 的结果代替 Claude Code、Codex 或其他 CLI 的测试。

## 8. 外部 CLI Agent 为什么可能不生效

AionUi 可以管理多种 Agent，但外部 CLI 通常仍读取自己的：

- 环境变量；
- 用户配置文件；
- OAuth 登录状态；
- Provider / Model 设置；
- MCP 和权限规则。

如果内置 Agent 能用、外部 CLI 不能用，应进入对应 CLI 的独立教程配置，不要反复修改 AionUi 的 Custom Model。

## 9. 模型能力与技能

OpenAI-compatible 的基本聊天通过后，再测试：

- 流式输出；
- 图片或附件；
- 结构化输出；
- function/tool calling；
- 技能与 MCP；
- 多轮长上下文。

技能可能读取工作区、执行命令或访问网络。只安装可信来源，运行前审查说明、脚本和权限。模型不支持稳定工具调用时，技能可能循环、参数为空或声称完成但没有实际结果。

## 10. 常见错误

| 现象 | 排查方向 |
|---|---|
| 无法获取模型 | 手动填写准确 Model ID；服务可能没有 `/models` |
| 401 | Key 错误、多 Key 中存在失效 Key，或认证方式不匹配 |
| 404 | Base URL 缺少或重复 `/v1`，误填完整聊天端点 |
| 400 | 关闭工具、图片、推理参数，用纯文本验证 |
| 内置 Agent 可用、CLI 不可用 | 外部 CLI 使用独立配置和凭据 |
| 声称改完但文件未变 | 工具调用、工作区授权或模型能力失败 |
| 429 | 停止轮换掩盖问题，检查额度、并发和上下文 |

## 11. 安全、备份与更新

- 使用测试工作区完成第一次配置；
- Key 不写入项目文件或聊天内容；
- 不向未知技能提供高权限环境变量；
- 执行前提交当前 Git 改动；
- 升级前导出或备份模型、会话、工作区和技能配置；
- 只从官网或官方 Releases 下载更新；
- 不再使用时撤销 API Key，而不只是删除本地配置。

## 12. 官方资料

- [AionUi 官方 GitHub](https://github.com/iOfficeAI/AionUi)
- [AionUi LLM Configuration Wiki](https://github.com/iOfficeAI/AionUi/wiki/LLM-Configuration)
- [AionUi 官网](https://aionui.com/)
- [AionUi Releases](https://github.com/iOfficeAI/AionUi/releases)

---

求助时请提供 AionUi 版本、操作系统、使用的内置或外部 Agent 名称、脱敏 Base URL、Model ID 和错误状态码，不要发送完整 Key。
