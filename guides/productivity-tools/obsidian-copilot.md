# Obsidian Copilot 接入 OpenAI 兼容 API：自定义模型、CORS 与 Vault QA

> 最后核验：2026-07-14
>
> 适用范围：Obsidian 1.7.2+ 与 Copilot for Obsidian 当前版（桌面端、官方支持的移动端）
>
> 预计用时：10～15 分钟

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **需要可用于 Obsidian 的 API Key？**
>
> 可以使用 **[NexoToken](https://www.nexotoken.net/?ref=github)**：每天 20 次免费，新人 1 元得 300 积分，支持支付宝 / 微信直充。活动内容与额度可能调整，请以官网实时页面为准。
>
> **[👉 注册并获取 API Key](https://www.nexotoken.net/?ref=github)**

## 1. 官方支持结论与范围

Copilot for Obsidian 官方 Settings 文档明确支持添加任意采用 OpenAI API 格式的第三方模型。自定义模型表单提供 `3rd party (openai format)`、Base URL、模型名、API Key 和 CORS 选项。

本文配置聊天模型。Vault QA 还需要可用的嵌入模型和索引；聊天成功不代表 Vault QA 已完成。

## 2. 安装 Obsidian 与 Copilot

1. 从 [Obsidian 官网](https://obsidian.md/) 安装 Obsidian；
2. 打开目标 Vault；
3. 进入 `Settings > Community plugins`；
4. 开启社区插件；
5. 点击 Browse，搜索 `Copilot for Obsidian`；
6. 点击 Install，再点击 Enable；
7. 确认侧栏或命令面板能打开 Copilot Chat。

只安装作者为官方仓库所列团队的插件。社区插件能访问 Vault 内容，应像安装桌面程序一样审慎。

## 3. 数据保存与隐私边界

Obsidian Vault 本身是本地文件夹。Copilot 可以把会话自动保存为 Vault 中的 Markdown，默认会话目录可在设置中修改；插件设置存放在 Vault 的插件配置内。

官方仓库说明：免费版消息和笔记只发送到你配置的模型提供方；部分 Plus 功能在你主动调用文件转换等操作时会使用其服务。自定义远程 API 时，当前问题、被引用笔记、历史上下文、图片和工具定义可能发送到该 API。

建议先在测试 Vault 验证，设置排除目录，避免把密码库、日记或客户资料意外加入上下文。

## 4. 准备配置

```text
API Key: YOUR_API_KEY
Base URL: https://your-api.example.com/v1
Model ID: YOUR_MODEL_ID
```

Copilot 的字段是 Base URL，不是 TypingMind/BoltAI 那种完整 Chat Completions URL。通常填到 `/v1`；若 API 文档明确要求其他根路径，以其说明为准。

不要默认填：

```text
https://your-api.example.com/v1/chat/completions
```

否则插件可能再次拼接聊天路径。

## 5. 添加自定义聊天模型

1. 打开 `Obsidian Settings > Copilot`；
2. 进入 `Basic` 或 `Model` 设置；
3. 找到 API Keys / Model Settings；
4. 点击 `Add Model` 或 `Add Custom Model`；
5. Provider 选择 `3rd party (openai format)`；
6. Model Name / Model ID 填 `YOUR_MODEL_ID`；
7. Base URL 填 `https://your-api.example.com/v1`；
8. API Key 填真实 Key；
9. CORS 先保持关闭；
10. 保存并按界面提示 Reload；
11. 将新模型设为 Default Chat Model，或在聊天面板选择它。

不同版本可能把 Add Model 放在 Set Keys 弹窗或 Model 标签页中，字段含义不变。

## 6. 最小验证

先创建一个不含敏感内容的空白测试笔记，然后：

1. 打开 Copilot Chat；
2. 选择 `YOUR_MODEL_ID`；
3. 使用 Chat 模式，不启用 Vault QA、Agent、网页、图片或命令；
4. 不引用当前笔记；
5. 发送：

```text
只回复：Obsidian Copilot 连接成功
```

通过标准：回复能开始并结束，重载插件后模型仍存在，API 控制台出现请求。

## 7. CORS 与流式输出

Copilot 官方文档建议：出现 CORS 错误时，可编辑该模型并开启 `CORS` 旁路。该模式使用 Obsidian 的请求 API 绕过浏览器式跨域限制，但官方明确说明它不支持 LLM 流式响应。

推荐顺序：

1. CORS 关闭，测试正常流式直连；
2. 若开发者控制台明确显示 CORS 拦截，再开启 CORS；
3. 接受开启后回复可能一次性出现；
4. 不要为了流式输出而关闭系统 TLS 校验或使用未知代理。

“没有逐字输出”在 CORS 旁路下可能是设计限制，不一定是故障。

## 8. Vault QA 与嵌入模型

Vault QA 需要把笔记转换为向量。若要使用自定义 OpenAI-compatible 嵌入端点：

- 确认服务实现兼容 embeddings API；
- 单独添加准确的嵌入模型 ID；
- 设置需要索引和排除的目录、标签、文件类型；
- 用少量非敏感笔记建立测试索引；
- 更换嵌入模型后重新索引，不混用旧向量；
- 遇到 429 时降低 Requests per Minute。

聊天端点只有 `/chat/completions` 而没有 `/embeddings` 时，普通 Chat 仍可用，但不能据此假设 Vault QA 可用。

## 9. 工具、多模态与上下文限制

### Agent / Tools

Agent 模式依赖工具调用。自定义模型和端点必须正确支持 OpenAI tools/function calling；基础文本兼容不代表 Agent 可用。先从单个低风险工具测试。

### 图片

只有模型支持视觉，且设置中的 Vision 能力已正确标记时才发送图片。官方设置允许把 Markdown 内嵌图片加入上下文，但这会把图片内容发送到远程服务。

### 文件与笔记

`@` 引用、当前笔记、Relevant Notes、Vault QA 和自动命令都可能扩大上下文。发送前检查上下文列表，给敏感目录配置排除规则。

### Token Limit

Copilot 的 Token Limit 指输出上限；设置过高会挤占输入空间。Conversation Turns 越多，重复发送的历史越多，费用和上下文压力越大。

## 10. 常见错误

### 401 Unauthorized

重新复制 Key，清除首尾空格；确认 Key 未过期，并且自定义模型条目使用了正确 Key。

### 403 Forbidden

检查 Key 是否有 `YOUR_MODEL_ID` 权限。模型条目存在不代表服务端授权。

### 404 Not Found

检查 Base URL 是否正确到 `/v1`，是否误填完整 `/chat/completions`，以及 Model ID 是否准确。

### CORS error / Failed to fetch

先确认 URL 和证书正常，再查看开发者控制台。若确为跨域限制，开启模型的 CORS 选项并接受非流式限制。

### Chat 可用但 Vault QA 失败

这是两条不同链路。检查嵌入模型、`/embeddings` 兼容性、索引状态、排除规则和速率限制。

### 400 或工具调用失败

切回 Chat 模式，关闭图片、Agent、命令和自定义参数。纯文本恢复后逐项启用。

### 429

暂停重试，降低 Requests per Minute、减少索引范围、缩短对话并检查额度。

## 11. 安全建议

- 先在测试 Vault 中验证插件和模型；
- 使用单独、有限额、可撤销的 Key；
- 在屏幕录制和 Issue 中隐藏 Key、Base URL 查询参数和私人笔记名；
- 设置 Vault QA 的 inclusions/exclusions；
- 不给 Agent 工具超出任务所需的权限；
- 把 `.obsidian/plugins` 和会话笔记纳入安全备份，但不要公开提交含 Key 的配置。

## 12. 更新、回滚与卸载

更新前备份整个 Vault，至少备份 `.obsidian` 与 Copilot 会话目录。社区插件更新后若出现问题：

1. 记录 Obsidian 和插件版本；
2. 禁用后重新启用插件；
3. 用最小文本聊天排除模型端问题；
4. 必要时从官方 GitHub Releases 获取已知可用版本手动回滚；
5. 回滚前复制当前插件目录。

卸载：在 `Settings > Community plugins` 禁用并卸载 Copilot。已保存到 Vault 的聊天 Markdown 不会自动删除；确认备份后再手动清理会话目录、索引与插件配置。

## 13. 官方资料

- [Copilot Settings 与自定义模型](https://www.obsidiancopilot.com/en/docs/settings)
- [Copilot Getting Started](https://www.obsidiancopilot.com/en/docs/getting-started)
- [Copilot 官方 GitHub](https://github.com/logancyang/obsidian-copilot)
- [Copilot 官方 Releases](https://github.com/logancyang/obsidian-copilot/releases)
- [Obsidian 官方社区插件说明](https://help.obsidian.md/community-plugins)

---

求助时请提供 Obsidian 版本、Copilot 版本、平台、Chat/Vault QA/Agent 模式、脱敏 Base URL、模型 ID 和 HTTP 状态码。不要发送完整 Key 或私人笔记内容。
