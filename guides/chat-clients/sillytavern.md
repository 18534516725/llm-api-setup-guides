# SillyTavern 接入自定义 OpenAI 兼容 API：安装、连接与排错

> 最后核验：2026-07-15
>
> 适用范围：SillyTavern 当前 release 分支；Custom（OpenAI-compatible）Chat Completion
>
> 预计用时：15～25 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先理解 SillyTavern

SillyTavern 是本地运行的 LLM 前端，不自带模型推理能力。它可以连接多种云端或本地后端，并提供角色卡、提示词模板、世界书、扩展、图片和语音等功能。

官方为多数用户推荐 `release` 分支；`staging` 更新更快但可能随时发生破坏性变化。本文只讲稳定分支和 `Custom (OpenAI-compatible)` 聊天端点。

## 2. 安装要求与方式

优先按 [SillyTavern 官方安装页](https://docs.sillytavern.app/installation/) 选择 Windows、Linux/macOS、Android 或 Docker。当前发布版要求使用仍受支持的 Node.js 版本；旧 Node.js 运行时可能无法安装新版本依赖。

使用 Git 安装时应克隆官方仓库的 `release` 分支：

```bash
git clone https://github.com/SillyTavern/SillyTavern -b release
cd SillyTavern
```

随后使用仓库提供的 Windows 启动脚本或 Linux/macOS 的 `start.sh`。不要把服务直接暴露到公网；远程访问前必须配置认证、白名单和反向代理安全策略。

## 3. 准备三项信息

```text
Custom Endpoint: https://your-api.example.com/v1
API Key: YOUR_API_KEY
Model ID: YOUR_MODEL_ID
```

官方明确提示：Custom Endpoint 通常填到 `/v1`，不要追加 `/chat/completions`。SillyTavern 会按 Chat Completions 规则拼接请求。

## 4. 创建连接配置

1. 启动 SillyTavern 并打开本地页面；
2. 点击顶部的 `API Connections`；
3. API 类型选择 `Chat Completion`；
4. `Chat Completion Source` 选择 `Custom (OpenAI-compatible)`；
5. 在 Custom Endpoint 填 `https://your-api.example.com/v1`；
6. 填入 API Key；
7. 点击连接或测试按钮。

官方不会保证每一个声称 OpenAI-compatible 的服务都完全兼容。连接按钮成功只说明基础请求可用，角色提示词、流式输出、工具调用和多模态仍需单独测试。

## 5. 选择模型

如果端点实现 `/v1/models`，模型会出现在列表中。否则：

1. 在自定义模型输入框手动填写 `YOUR_MODEL_ID`；
2. 确保大小写、连字符和版本后缀完全一致；
3. 必要时启用 `Bypass API status check`，仅跳过状态检查；
4. 使用 `Test Message` 发送最小请求。

`Bypass API status check` 不会修复错误地址，也不会增加协议兼容能力。

## 6. 最小聊天验证

先使用简单角色或空白对话，关闭扩展、工具、图片生成和复杂采样参数，发送：

```text
请只回复：连接正常
```

检查：

- 能生成完整回复；
- 停止按钮和重新生成可用；
- 切换模型后请求使用了正确 ID；
- 重启后连接配置仍存在；
- 没有把 Key 输出到聊天或日志。

## 7. Prompt Post-Processing

自定义兼容端点可能对消息角色顺序有额外要求。SillyTavern 提供多种 Prompt Post-Processing：合并连续消息、半严格、严格、单用户消息等。

调整顺序：

1. 先使用 `None`；
2. 遇到角色交替或 system message 错误时，再尝试合并；
3. 只有服务明确要求时才启用严格模式；
4. 每次只修改一个选项。

带 `no tools` 的后处理会移除工具调用。需要工具时选择相应的 `with tools` 变体，并确认模型与服务端都支持。

## 8. 流式输出与采样参数

OpenAI-compatible 的最低目标是基础 Chat Completions。以下参数并非每个服务都支持：

- `stream` 与 SSE；
- reasoning / thinking；
- logprobs；
- response format；
- tool choice；
- 特殊采样器。

出现 400 时先恢复默认参数。非流式成功、流式失败时，重点检查 SSE 格式、反向代理缓冲和结束标记。

## 9. 公网部署安全

默认按本机应用使用。若要从其他设备访问：

- 不要直接开放无认证端口；
- 启用基本认证或受控 SSO；
- 配置可信反向代理和来源 IP；
- 限制允许访问的私网或账号；
- 不把 `config.yaml`、`secrets.json` 和用户数据提交到 Git；
- 定期更新 release 分支，关注官方安全说明。

角色卡、聊天、世界书和扩展配置也可能包含隐私信息，备份时按敏感数据处理。

## 10. 常见错误

### 401 或 Unauthorized

确认 Key 属于 API 服务而不是网站登录密码；删除首尾空格并重新保存。

### 404

Custom Endpoint 通常填到 `/v1`。不要填写完整 `/v1/chat/completions`，也不要重复 `/v1/v1`。

### 模型列表为空

服务可能不提供 `/models`。手动输入 Model ID，并用 Test Message 验证。

### 400 消息格式错误

关闭工具和额外采样参数；检查 Prompt Post-Processing；用单轮纯文本缩小范围。

### 回复正常但工具失败

普通聊天兼容不等于 tool calling 兼容。检查后处理是否移除 tools，以及流式工具参数是否完整。

### 429

减少上下文、降低并发、停止自动重试，并在服务端查看额度和速率限制。

## 11. 更新与备份

按照官方更新指南更新 `release` 分支，不要把 `staging` 直接覆盖到生产数据目录。更新前备份用户数据、角色、聊天、世界书、设置和扩展配置。

回滚时优先使用官方 release 标签或已验证版本，并保留当前数据副本。若新旧版本数据格式发生迁移，不要只替换程序文件后继续写入同一数据目录。

## 12. 官方资料

- [SillyTavern 官方文档](https://docs.sillytavern.app/)
- [安装指南](https://docs.sillytavern.app/installation/)
- [Quick Start](https://docs.sillytavern.app/usage/quick-start/)
- [Chat Completions 与 Custom Endpoint](https://docs.sillytavern.app/usage/api-connections/openai/)
- [官方 GitHub 仓库](https://github.com/SillyTavern/SillyTavern)
- [官方 Releases](https://github.com/SillyTavern/SillyTavern/releases)

---

求助时请注明 SillyTavern 版本、分支、Node.js 版本、操作系统、脱敏 Endpoint、模型 ID 和状态码，不要上传完整配置或 Key。
