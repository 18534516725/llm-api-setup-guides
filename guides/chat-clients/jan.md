# Jan 接入 OpenAI 兼容 API：自定义端点、模型与排错

> 最后核验：2026-07-14
>
> 适用范围：Jan Desktop 当前稳定版（Windows 10+、macOS 12+、Ubuntu 20.04+）
>
> 预计用时：5～10 分钟

[← 返回教程目录](../../README.md)

> [!TIP]
> **还没有可用的 API Key？**
>
> 本教程可配合 **[NexoToken](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费，新人 1 元得 300 积分，支持支付宝 / 微信直充。活动内容与额度可能调整，请以官网实时页面为准。
>
> **[👉 注册并开始配置](https://www.nexotoken.net/?ref=github)**

## 1. 适合什么场景

Jan 是开源、本地优先的桌面 AI 客户端，既能运行本地模型，也能连接云端模型。官方“Custom Endpoints”文档明确支持任何采用 OpenAI 或 Anthropic 线格式的端点；本文只讲 OpenAI-compatible。

适合希望做到以下事情的用户：

- 在同一客户端混用本地模型和远程 API；
- 自行填写 Base URL、API Key 和模型 ID；
- 让聊天记录、设置和日志主要留在本机；
- 在服务端未实现模型列表时手动添加模型。

## 2. 安装 Jan

1. 打开 [Jan 官方下载页](https://www.jan.ai/)；
2. 选择 Windows、macOS 或 Linux 安装包；
3. 完成安装并首次启动；
4. 在首次隐私提示中按需选择是否允许可选分析；
5. 打开 `Settings`，确认版本信息和数据目录可见。

也可以从 [Jan 官方 GitHub Releases](https://github.com/menloresearch/jan/releases) 获取发布包。只从官方站点或官方仓库下载，不安装来历不明的修改版。

## 3. 数据保存与隐私边界

Jan 官方说明：模型、会话、设置和日志保存在 Jan Data Folder；聊天、设置和所用模型不属于其分析采集内容。你可在 `Settings > General` 打开或迁移数据目录。

但连接远程 API 时，下列内容仍会离开设备：

- 当前提示词及被带入上下文的历史消息；
- 主动附加的图片、文件或其解析内容；
- 系统提示词、工具定义和模型参数。

这些内容由你配置的 API 服务处理。发送机密材料前，应核对相应服务的隐私、日志和留存规则。

## 4. 准备配置

请准备：

```text
API Key: YOUR_API_KEY
Base URL: https://your-api.example.com/v1
Model ID: YOUR_MODEL_ID
```

Jan 的 OpenAI-compatible `Base URL` 通常必须包含服务端要求的版本路径 `/v1`。Jan 会在其后请求 `/models` 和聊天端点，所以不要填完整的 `/v1/chat/completions`。

正确：

```text
https://your-api.example.com/v1
```

通常错误：

```text
https://your-api.example.com
https://your-api.example.com/v1/chat/completions
```

若 API 文档给出了不同的版本前缀，以 API 文档为准。

## 5. 添加自定义提供方

1. 打开 Jan；
2. 进入 `Settings > Model Providers`；
3. 点击提供方列表旁的 `Add Provider`；
4. API 格式选择 `OpenAI-compatible`；
5. Provider name 填一个仅供本地识别的名称；
6. Base URL 填 `https://your-api.example.com/v1`；
7. API key 填 `YOUR_API_KEY` 对应的真实值；
8. 点击 `Create` 或保存。

不要选择 Anthropic-compatible。线格式选错时，即使 URL 和 Key 正确，请求也会失败。

## 6. 获取或手动添加模型

保存时，Jan 会尝试访问：

```text
https://your-api.example.com/v1/models
```

如果模型列表能正常返回，选择需要的模型即可。如果列表为空或报错，但服务确认支持 Chat Completions：

1. 打开刚创建的提供方；
2. 进入 `Models`；
3. 点击 `+`；
4. 粘贴准确的 `YOUR_MODEL_ID`；
5. 保存模型。

展示名和模型 ID 不是一回事。请求中发送的是模型 ID，必须与 API 控制台一致。

## 7. 能力开关

Jan 不会自动识别自定义端点中每个模型的全部能力。第一次只按普通文本模型配置；纯文本验证成功后，再逐项启用：

- Vision / Image：模型和兼容接口都支持图片输入时开启；
- Tools：接口完整支持 OpenAI tools/function calling 时开启；
- Audio：端点实现了 Jan 所需的音频输入输出时开启；
- Thinking：确认返回格式能被当前 Jan 版本解析后开启。

客户端显示开关不代表服务端具备该能力。错误勾选常导致 400、空白回复或工具调用卡住。

## 8. 最小验证

1. 新建空白 Thread；
2. 在模型选择器中选择 `YOUR_MODEL_ID`；
3. 不上传文件，不启用工具；
4. 发送：

```text
只回复：连接成功
```

通过标准：

- 没有立即出现 401、403 或 404；
- 能看到内容并正常结束；
- 新建会话后模型仍可选择；
- API 控制台出现对应请求记录。

## 9. 流式、工具与多模态限制

### 流式输出

OpenAI-compatible 服务需要返回规范的 SSE 数据。若文字到一半停止、重复或一直加载，先关闭流式输出做非流式测试；非流式正常通常说明 SSE 格式或网络中间层不兼容。

### 工具调用

Jan 支持工具能力，但自定义端点必须正确接收 `tools`、返回 `tool_calls`，并接受工具结果消息。只兼容基础文本聊天的服务不能因开启 Jan 工具而自动获得工具能力。

### 图片和音频

多模态需要模型、请求格式和服务端三者同时支持。先用纯文本连通，再用一张小图测试；不要用含隐私的大文件做首测。

## 10. 常见错误

### 401 Unauthorized

- 重新复制 Key，清除首尾空格；
- 确认 Key 未过期或被禁用；
- 确认端点接受 Bearer API Key；
- 不要把网页登录密码当 API Key。

### 403 Forbidden

- 检查 Key 是否有目标模型权限；
- 确认模型 ID 与授权范围匹配；
- 不要通过反复重试绕过权限问题。

### 404 Not Found

- Base URL 是否遗漏 `/v1`；
- 是否误填了完整 `/chat/completions`，导致 Jan 再次拼接路径；
- 是否把 API 控制台网页地址填成接口地址；
- 服务是否使用了不同版本前缀。

### No models listed

服务可能未实现 `GET /v1/models`。只要聊天端点可用，就在提供方的 Models 区域手动添加准确 ID。

### 400 或参数不支持

新建空白会话，关闭工具、图片、音频、推理和自定义采样参数，仅发纯文本。恢复后一次只开启一项能力。

### 429 Too Many Requests

等待限流窗口恢复，缩短上下文，并检查额度。Jan 支持配置备用 Key，但这不是扩大单个账户配额的手段，且只应使用你有权使用的 Key。

## 11. 安全建议

- 不在截图、Issue、聊天导出或公开仓库中展示 Key；
- 为客户端单独创建 Key，并设置合理额度；
- 使用 HTTPS 远程端点；
- 不建议启用 `Ignore SSL Certificates`；
- 发现异常用量后立即撤销旧 Key；
- 导出或复制 Jan Data Folder 前，按敏感数据备份处理。

## 12. 更新、回滚与卸载

更新前先备份 Jan Data Folder。遇到新版本兼容问题时：

1. 记录当前版本和错误；
2. 导出重要会话或复制数据目录；
3. 从官方 Releases 获取可信的上一版本；
4. 回滚后先用纯文本会话验证；
5. 不要在未备份时执行 Factory Reset。

普通卸载不会替代数据清理。需要彻底卸载时，先备份，再按官方系统安装文档删除应用与 Jan 数据目录。删除数据目录、Factory Reset 都不可逆。

## 13. 官方资料

- [Jan Custom Endpoints](https://www.jan.ai/docs/desktop/remote-models/custom-endpoint)
- [Jan Quickstart](https://www.jan.ai/docs/desktop/quickstart)
- [Jan Settings 与数据目录](https://www.jan.ai/docs/desktop/settings)
- [Jan Privacy](https://www.jan.ai/docs/desktop/privacy)
- [Jan Troubleshooting](https://www.jan.ai/docs/desktop/troubleshooting)
- [Jan 官方 GitHub](https://github.com/menloresearch/jan)

---

求助时请提供 Jan 版本、系统、HTTP 状态码、脱敏后的 Base URL 和模型 ID。完整 API Key 必须打码。
