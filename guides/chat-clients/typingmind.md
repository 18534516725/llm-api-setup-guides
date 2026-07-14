# TypingMind 接入 OpenAI 兼容 API：自定义 Endpoint 完整教程

> 最后核验：2026-07-14
>
> 适用范围：TypingMind Web 与 PWA 当前版
>
> 预计用时：5～10 分钟

[← 返回教程目录](../../README.md)

> [!TIP]
> **还没有 API Key？**
>
> 本教程可配合 **[NexoToken](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费，新人 1 元得 300 积分，支持支付宝 / 微信直充。活动内容与额度可能调整，请以官网实时页面为准。
>
> **[👉 注册并开始配置](https://www.nexotoken.net/?ref=github)**

## 1. 官方支持结论

TypingMind 官方 OpenAI 文档明确允许修改 `Custom endpoint`，并要求该地址与 OpenAI Chat Completions 端点完全兼容。这里填写的是完整聊天端点，不是只到 `/v1` 的 Base URL。

适合：

- 希望在浏览器或 PWA 中使用自有 Key；
- 需要自定义模型 ID、上下文长度和能力开关；
- 希望默认本地保存聊天，同时保留导出备份能力；
- 服务能处理浏览器跨域请求，或你愿意明确启用可选代理。

## 2. 打开或安装 TypingMind

直接访问 [TypingMind 官网](https://www.typingmind.com/) 即可使用。也可以安装 PWA：

- Chrome / Edge 桌面端：打开网站后使用地址栏安装图标；
- iPhone / iPad：Safari 分享菜单选择“添加到主屏幕”；
- Android：Chrome 菜单选择“添加到主屏幕”或“安装应用”。

PWA 与浏览器版本使用相同的本地存储，并自动获取当前 Web 版本。

## 3. 数据保存与隐私

TypingMind 官方隐私政策说明，默认 Local/Static 模式把 API Key、聊天、提示词和设置保存在当前浏览器的 Local Storage 与 IndexedDB，官方无法读取或恢复。不同浏览器和设备的数据彼此独立。

注意三个边界：

1. 清理站点数据可能永久删除本地聊天；
2. 登录并启用 Cloud Sync 后，所选数据会进入 TypingMind Cloud；
3. 发送消息时，提示词、上下文与附件仍会发往你配置的模型服务。

## 4. 准备配置

```text
API Key: YOUR_API_KEY
Chat Completions Endpoint: https://your-api.example.com/v1/chat/completions
Model ID: YOUR_MODEL_ID
```

TypingMind 的 `Custom endpoint` 需要完整地址：

```text
https://your-api.example.com/v1/chat/completions
```

不要只填：

```text
https://your-api.example.com/v1
```

## 5. 方式一：修改 OpenAI Custom endpoint

如果希望使用 OpenAI 提供方入口：

1. 打开左侧 `Models`；
2. 切换到 `API key`；
3. 在 OpenAI 区域填入 Key；
4. 展开高级或可选字段；
5. 在 `Custom endpoint` 填完整 Chat Completions URL；
6. 保存；
7. 选择或添加目标模型测试。

此方式会让 OpenAI 类模型共用该自定义聊天端点。若要为不同模型配置不同地址，使用“Add Custom Model”。

## 6. 方式二：添加 Custom Model

1. 进入 `Models`；
2. 点击 `Add Custom Model`；
3. Name 填本地显示名称；
4. API Type 选择 `OpenAI Chat Completions API`；
5. Endpoint URL 填 `https://your-api.example.com/v1/chat/completions`；
6. Model ID 填 `YOUR_MODEL_ID`；
7. Context Length 按模型服务文档填写，不要猜；
8. Authentication 选择通过 HTTP Header 发送 API Key；
9. Header 名通常为 `Authorization`，值使用界面提供的 API Key 模板或 Bearer 形式；
10. 点击 `Test`，通过后保存。

不要把真实 Key 直接写进会被分享或导出的模型说明文字。

## 7. 最小验证

能力开关先只保留 System Role 和 Streaming（若服务明确支持）。关闭插件、图片、Thinking、文件和联网功能，发送：

```text
只回复：TypingMind 连接成功
```

验证：

- 测试按钮通过；
- 新聊天能输出并结束；
- 刷新页面后模型配置仍存在；
- API 控制台能看到请求；
- 浏览器开发者工具没有 CORS 拦截。

## 8. CORS 与可选代理

TypingMind 默认从浏览器直接请求模型服务，所以服务端必须允许相应网页 Origin、方法和请求头。如果控制台出现 CORS 错误，说明浏览器在响应交给 TypingMind 前就拦截了它。

处理顺序：

1. 优先让 API 服务正确启用 HTTPS 和 CORS；
2. 确认允许 `Authorization`、`Content-Type` 等必要请求头；
3. 仅在理解隐私影响后启用 TypingMind 的可选代理；
4. 不要使用关闭浏览器安全机制的启动参数作为长期方案。

官方说明内置代理为可选功能；启用后请求会经过代理转发，隐私路径与默认直连不同。

## 9. 流式、工具与多模态限制

### Streaming

只有端点返回兼容的 SSE 数据时，才能开启 `Support Streaming Output`。输出卡住或乱码时，关闭该开关测试非流式。

### Plugins / Tools

仅在模型与端点支持 OpenAI functions/tools 时启用。TypingMind 的 AI Agent、插件或 MCP 能力可能加入额外提示和工具定义，基础聊天成功不代表工具调用成功。

### Image Input

只有兼容接口接受 OpenAI 图片消息格式且模型支持视觉时，才开启图片输入。先用小图测试，避免上传私密原图。

### Thinking

推理模型的参数和返回字段可能不同。未获服务文档确认时不要勾选 Thinking，先保证普通文本正常。

## 10. 上下文与费用

- Context Length 填得过大不会扩大服务端真实上限；
- 长对话会重复发送历史，输入用量会增长；
- 文件解析、知识库、插件和自动标题可能产生额外请求；
- 不同主题新建聊天；
- 在 API 控制台设置限额并定期核对用量。

## 11. 常见错误

### 401 Unauthorized

Key 错误、过期或鉴权 Header 配置不正确。重新复制 Key，并确认 Header 是服务要求的形式。

### 403 Forbidden

Key 没有模型或接口权限。核对 Model ID 和授权，不要不断重试。

### 404 Not Found

Custom endpoint 必须是完整聊天端点。检查是否漏写 `/chat/completions`、重复 `/v1`，或误填管理后台网址。

### CORS error

请求可能根本没有到达业务接口。查看浏览器 Network/Console，优先修复服务端 CORS；必要时再评估可选代理。

### Test 通过但聊天失败

关闭插件、Thinking、图片和自定义参数，新建空白聊天。测试请求往往比真实会话简单，参数兼容问题可能只在聊天中出现。

### 429 Too Many Requests

等待限流恢复、缩短上下文、减少并发，并检查余额或速率限制。

## 12. 备份、安全与迁移

在 `Settings > App data & storage` 使用 Export 下载 JSON 备份，可选择聊天、提示词、插件、文件夹、Agents 与模型设置等数据。备份可能包含敏感信息，保存到加密位置。

安全建议：

- 启用本地敏感数据加密选项；
- 不在公共浏览器配置付费 Key；
- 不把导出 JSON 上传到公开仓库；
- 为 TypingMind 创建独立、可撤销的 Key；
- 发现异常用量后立即轮换 Key。

## 13. 更新、回滚与卸载

Web/PWA 自动使用当前版本，传统意义上的版本回滚通常不可用。界面更新前后若出现问题：

1. 先导出完整数据；
2. 记录浏览器版本和错误截图；
3. 用无痕窗口做不带旧缓存的最小测试，但不要在其中长期保存 Key；
4. 检查模型服务与浏览器 CORS；
5. 再联系官方支持。

卸载 PWA 只移除应用入口，不一定删除浏览器站点数据。若要清理数据，先导出，再在浏览器站点设置中删除；此操作可能不可恢复。

## 14. 官方资料

- [TypingMind OpenAI 与 Custom endpoint](https://docs.typingmind.com/manage-and-connect-ai-models/openai)
- [TypingMind Proxy 设置](https://docs.typingmind.com/general-settings/proxy)
- [安装 TypingMind PWA](https://docs.typingmind.com/install-typingmind-app)
- [导出与导入数据](https://docs.typingmind.com/cloud-sync-and-backup/export-import-data)
- [TypingMind 隐私政策](https://docs.typingmind.com/security-and-compliance/privacy-policy)
- [TypingMind Custom endpoints 更新说明](https://docs.typingmind.com/changelog/typingmind/custom-endpoints)

---

求助时请提供浏览器/PWA 类型、脱敏后的完整 Endpoint、模型 ID、HTTP 状态码和 CORS 控制台信息。不要发送完整 Key。
