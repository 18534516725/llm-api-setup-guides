# BoltAI 接入 OpenAI 兼容 API：自定义 Server 配置与排错

> 最后核验：2026-07-14
>
> 适用范围：BoltAI for macOS；v1 与 v2 的菜单名称可能不同
>
> 预计用时：5～10 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 官方支持结论

BoltAI 官方教程明确提供 `OpenAI-compatible Server`，可连接采用 OpenAI Chat Completions 格式的远程服务或本地服务器。其 URL 字段要求填写完整聊天端点，而不是只到 `/v1` 的根地址。

BoltAI 是原生 macOS 客户端，适合希望在聊天窗口、菜单栏和 AI Command 中使用自有模型服务的用户。部分功能和界面取决于许可证、应用代际与当前版本。

## 2. 安装 BoltAI

1. 打开 [BoltAI 官网](https://boltai.com/)；
2. 下载官方独立版，或使用官方列出的分发渠道；
3. 将应用安装到 Applications 并启动；
4. 如果要使用全局快捷键或跨应用 AI Command，按需授予辅助功能权限；
5. 先确认普通聊天窗口能打开，再配置 API。

只在确实需要时授予系统权限。单纯聊天通常不需要让应用控制所有其他程序。

## 3. 数据保存与隐私

BoltAI 的独立版聊天数据（含生成图片）保存在：

```text
~/Library/Application Support/co.podzim.BoltGPT
```

偏好设置位于：

```text
~/Library/Preferences/co.podzim.BoltGPT.plist
```

不同分发版本的数据目录可能带有不同后缀。BoltAI v2 可选 Cloud Sync；不启用时可本地使用。即使聊天保存在本机，远程推理时提示词、历史上下文、附件和工具定义仍会发送到你配置的 API 服务。

## 4. 准备配置

```text
API Key: YOUR_API_KEY
Chat Completions URL: https://your-api.example.com/v1/chat/completions
Model ID: YOUR_MODEL_ID
Context Length: 按模型服务文档填写
```

BoltAI 官方自定义服务器教程要求“exact URL for the chat completions endpoint”，因此应填写：

```text
https://your-api.example.com/v1/chat/completions
```

而不是：

```text
https://your-api.example.com/v1
```

## 5. 添加自定义服务

### v1 常见路径

1. 打开 `Settings > Models`；
2. 点击 `+`；
3. 选择 `OpenAI-compatible Server`；
4. 填写友好名称；
5. URL 填完整 Chat Completions URL；
6. API Key 填真实 Key；
7. Model ID 填 `YOUR_MODEL_ID`；
8. Context Length 按官方模型信息填写；
9. 服务明确支持 SSE 时启用 Streaming；
10. 保存。

### v2 常见路径

进入 `Settings > AI Services`，点击 Add，选择界面中的 OpenAI-compatible / custom server 类型。字段含义相同。若当前 v2 构建没有该通用选项，不要硬套其他提供方；可使用仍受维护的 v1，或等待 v2 补齐对应入口。

## 6. 模型列表与手动模型

较新的 BoltAI v1 支持从自定义 AI 服务获取模型列表，并允许自定义模型列表端点，默认通常为 `/v1/models`。如果列表失败：

- 确认服务实现 `GET /v1/models`；
- 检查模型列表端点与聊天端点不是同一个 URL；
- 直接填写准确 Model ID；
- 不要把显示名称当作请求中的 `model`。

模型列表不可用不一定表示聊天不可用。

## 7. 最小验证

1. 把自定义服务选为当前聊天服务；
2. 新建空白聊天；
3. 关闭插件、MCP、图片、联网与自定义参数；
4. 发送：

```text
只回复：BoltAI 连接成功
```

确认输出开始、能正常结束，重启后服务仍存在，并在 API 控制台看到对应请求。

如果要在 AI Command 中使用自定义服务，官方教程要求把它设为默认 AI service；先验证聊天，再测试跨应用命令。

## 8. 流式、工具与多模态限制

### Streaming

端点必须返回 OpenAI 兼容 SSE。若卡住、重复或没有结束标记，关闭 Streaming 再试。非流式正常通常说明流式响应或中间网络层不兼容。

### Tool Use 与 MCP

BoltAI 支持工具和 MCP，但自定义服务仍需正确接收 `tools` 并返回标准工具调用。客户端能连接 MCP，不代表任意文本模型能调用工具。先用无工具聊天验证，再开启一个工具做单次测试。

### 图片

需要模型和端点都支持 OpenAI 兼容图片消息。不要用含隐私的截图做第一次测试。

### Responses API

部分 BoltAI 内置模型可使用 Responses API，但本文配置的是 Chat Completions。除非当前自定义服务表单与 API 文档明确支持，否则不要把 `/v1/responses` 填进 Chat Completions URL。

## 9. 常见错误

### 401 / 403

重新复制 Key，确认未过期且有目标模型权限。检查应用中是否选中了正确服务，不要在 Issue 或邮件里发送完整 Key。

### 404

检查是否填写完整 `/v1/chat/completions`，是否重复 `/v1`，以及 URL 是否被误填为控制台网页地址。

### 模型列表空白

模型列表端点可能未实现或路径不同。手动指定 Model ID，或在支持的版本中配置正确的 model listing endpoint。

### 400 参数不支持

关闭工具、图片、推理、插件和额外参数，新建空白聊天。纯文本成功后逐项恢复。

### 429

等待限流恢复、缩短上下文，并检查额度。不要连续快速重试。

### AI Command 无响应

先确认聊天可用，再把自定义服务设为默认服务，并检查 macOS 辅助功能权限。AI Command 在官方教程中仍标注为可能存在兼容差异。

## 10. 安全建议

- 给 BoltAI 单独创建可撤销、有限额的 Key；
- 远程服务使用可信 HTTPS；
- 截图、Console 日志和数据库备份中隐藏 Key；
- MCP 服务器只授予完成任务所需的权限；
- 启用 Cloud Sync 前阅读当前隐私说明和加密设置；
- 异常用量出现后立即撤销 Key。

## 11. 更新、回滚与卸载

升级前备份应用数据目录。BoltAI v1 与 v2 可存在功能差异，迁移前确认所需自定义服务、聊天和命令功能已在目标版本可用。

回滚时从官方 Previous Versions 页面下载可信版本，恢复前先保留现有数据库副本。不要让两个应用版本同时修改同一份数据。

彻底卸载前：

1. 退出 BoltAI；
2. 复制 Application Support 数据目录；
3. 删除应用；
4. 仅在确认备份可用后清理数据目录和 plist。

官方警告，清理卸载可能删除所有 BoltAI 数据。

## 12. 官方资料

- [BoltAI 自定义 OpenAI-compatible Server](https://docs.boltai.com/docs/guides/how-to-set-up-a-custom-openai-compatible-server-in-boltai)
- [BoltAI v1.35.3 模型列表端点更新](https://boltai.com/changelog/v1353/68380c816f0869ed64ef30ab)
- [BoltAI Changelog](https://boltai.com/changelog)
- [BoltAI 完全卸载与数据目录](https://docs.boltai.com/docs/troubleshooting/how-to-completely-uninstall-boltai)
- [BoltAI 官方网站](https://boltai.com/)

---

求助时请提供 BoltAI 版本、v1/v2、macOS 版本、脱敏后的完整聊天端点、模型 ID 和 HTTP 状态码。完整 Key 必须打码。
