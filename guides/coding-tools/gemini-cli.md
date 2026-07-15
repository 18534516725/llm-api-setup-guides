# Gemini CLI 自定义 API 地址与代理配置教程

> 最后核验：2026-07-15
>
> 适用范围：Google Gemini CLI；自定义地址使用 Gemini 原生协议，不是 OpenAI Chat Completions

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 最重要的协议区别

Gemini CLI 当前允许通过 `GOOGLE_GEMINI_BASE_URL` 覆盖 Gemini API 根地址，但它仍使用 Google GenAI SDK 的请求格式。

```text
GOOGLE_GEMINI_BASE_URL ≠ OPENAI_BASE_URL
Gemini 原生 generateContent ≠ /v1/chat/completions
```

只有服务明确标注“Gemini 原生协议”或“Google GenAI 兼容”时才使用本文方法。若服务只给出 OpenAI-compatible Base URL，请改用 Qwen Code、OpenCode、Aider 等支持相应协议的工具。

## 2. 安装

需要 Node.js 20 或更新版本：

```bash
npm install -g @google/gemini-cli
gemini --version
gemini --help
```

也可以不全局安装，临时运行：

```bash
npx @google/gemini-cli
```

Windows 原生终端可以使用，涉及大量 Shell 工具和类 Unix 项目时也可选择 WSL。

## 3. 配置 API Key 和 Base URL

macOS、Linux、WSL：

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
export GOOGLE_GEMINI_BASE_URL="YOUR_GEMINI_BASE_URL"
```

PowerShell：

```powershell
$env:GEMINI_API_KEY="YOUR_API_KEY"
$env:GOOGLE_GEMINI_BASE_URL="YOUR_GEMINI_BASE_URL"
```

CMD：

```cmd
set GEMINI_API_KEY=YOUR_API_KEY
set GOOGLE_GEMINI_BASE_URL=YOUR_GEMINI_BASE_URL
```

官方要求远程 Base URL 使用 HTTPS；只有 `localhost`、`127.0.0.1` 或 `[::1]` 允许 HTTP。地址由服务控制台原样提供，不要自己猜 `/v1`、`/v1beta` 或 `generateContent` 路径。

如果服务要求固定 API 版本，可按文档设置：

```bash
export GOOGLE_GENAI_API_VERSION="v1"
```

不要盲目设置。服务端只实现 `v1beta` 时强制改成 `v1` 会直接得到 404。

## 4. 启动与认证选择

```bash
cd /你的项目目录
gemini
```

首次认证选择 API Key 方式。`GOOGLE_GEMINI_BASE_URL` 只在 Gemini API Key 认证路径中覆盖 Gemini 请求地址；Google 登录和 Vertex AI 使用不同的认证、变量与端点。

如果你选择 Vertex AI，应查看 `GOOGLE_VERTEX_BASE_URL`、项目、区域和应用默认凭据配置，不要与本文的 Gemini API Key 变量混用。

## 5. 项目配置文件

Gemini CLI 支持用户级和项目级 `settings.json`。行为配置可以写进项目的 `.gemini/settings.json`，但 API Key 不应写进去。

一个保守的项目示例：

```json
{
  "general": {
    "previewFeatures": false
  },
  "tools": {
    "sandbox": true
  }
}
```

配置字段随版本变化较快。编辑前先对照当前官方配置参考；升级后若启动报 schema 错误，先移除非必要字段，不要删除整个用户目录。

## 6. 第一次安全验证

```bash
mkdir gemini-cli-test && cd gemini-cli-test
git init
printf '# Gemini CLI Test\n' > README.md
gemini
```

先要求只读：

```text
请只读取 README.md，告诉我文件标题。不要修改文件，也不要执行额外命令。
```

确认模型能回答后，再测试一次有边界的改动：

```text
在 README.md 末尾加入一行“连接验证”，展示 diff，不要提交。
```

退出后运行：

```bash
git diff
```

不要在包含生产密钥、证书或未提交工作成果的目录完成第一次测试。

## 7. 代理和网络问题

HTTP 代理与 API Base URL 是两件事：

- Base URL 决定请求发送到哪个 API 服务；
- `HTTPS_PROXY` / `HTTP_PROXY` 决定网络连接经过哪个代理；
- 企业证书环境还可能需要配置 CA；
- 代理必须正确转发长连接和流式响应。

若浏览器能打开服务页面但 CLI 连接失败，检查终端的 DNS、TLS、系统时间、代理变量和证书链，而不是只反复更换 Key。

## 8. 常见错误

| 现象 | 排查方向 |
|---|---|
| 401 / 403 | Key 无效、权限不足，或认证方式不是 Gemini API Key |
| 404 | Base URL、API 版本或 Gemini 原生路径不兼容 |
| 400 JSON 格式错误 | 把 OpenAI-compatible 地址当成 Gemini 原生地址，或服务端兼容不完整 |
| 启动后仍访问官方地址 | 当前认证路径没有读取 `GOOGLE_GEMINI_BASE_URL`；退出后重新设置变量并启动 |
| 工具调用失败 | 模型或兼容层不支持 Gemini Function Calling 的完整请求与响应 |
| 流式中断 | 检查反向代理缓冲、读超时、SSE/流式事件转发和客户端版本 |
| 429 | 降低并发，减少自动重试并等待限流恢复 |

## 9. Key 安全

- `.env`、`.gemini` 中的私有配置和日志不要提交到公开仓库；
- 不要把完整 Key 粘贴进 Issue、终端录屏或截图；
- 工具读取项目文件前，先排除 `.env`、私钥和客户数据；
- 长期使用应定期轮换 Key，并在服务端设置额度或调用限制；
- 遇到问题只分享状态码、请求路径和脱敏后的错误类型。

## 10. 官方来源

- [Gemini CLI 官方仓库](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI 配置参考](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md)
- [Gemini CLI 文档](https://geminicli.com/docs/)
