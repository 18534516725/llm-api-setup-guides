# OpenAI Python / Node.js SDK 接入兼容 API：完整开发指南

> 最后核验：2026-07-14
>
> 适用范围：OpenAI 官方 Python SDK 与 JavaScript / TypeScript SDK
>
> 核心结论：官方 SDK 支持自定义 Base URL，但目标服务必须实现你实际调用的端点和响应格式

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 什么时候应该直接使用 SDK

官方 SDK 适合：

- 在自己的后端服务中调用模型；
- 需要类型提示、流式事件、超时和自动重试；
- 想在 Chat Completions 与 Responses 之间明确选择；
- 需要记录请求 ID、Token 用量和结构化错误；
- 不想手工维护 HTTP 请求与 SSE 解析。

如果只是给现成客户端填 Key，请查看对应客户端教程，不需要写代码。

## 2. 先确认协议

| SDK 调用 | 典型端点 | 兼容服务必须支持 |
|---|---|---|
| `client.chat.completions.create()` | `/v1/chat/completions` | Chat Completions 请求、响应和流事件 |
| `client.responses.create()` | `/v1/responses` | Responses 输入、输出、工具和流事件 |
| `client.embeddings.create()` | `/v1/embeddings` | Embedding 模型和向量响应 |

Chat Completions 能用，不代表 Responses 一定能用。首次接入先按控制台明确标注的协议选择方法。

## 3. 准备环境变量

macOS / Linux / WSL：

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_BASE_URL="https://your-api.example.com/v1"
export OPENAI_MODEL="YOUR_MODEL_ID"
```

PowerShell：

```powershell
$env:OPENAI_API_KEY = "YOUR_API_KEY"
$env:OPENAI_BASE_URL = "https://your-api.example.com/v1"
$env:OPENAI_MODEL = "YOUR_MODEL_ID"
```

不要把真实 Key 提交到 `.env.example`、Git、前端 JavaScript 或移动端安装包。`.env` 应加入 `.gitignore`，生产环境使用部署平台的 Secret 管理功能。

## 4. Python 安装

使用 uv：

```bash
uv add openai
```

或使用 pip：

```bash
python -m pip install --upgrade openai
```

确认版本：

```bash
python -c "import openai; print(openai.__version__)"
```

## 5. Python：Chat Completions 最小测试

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
    timeout=30.0,
    max_retries=2,
)

response = client.chat.completions.create(
    model=os.environ["OPENAI_MODEL"],
    messages=[
        {"role": "user", "content": "只回复 OK"},
    ],
)

print(response.choices[0].message.content)
print("request_id:", response._request_id)
```

预期输出包含 `OK`。`_request_id` 可用于排错；分享日志时仍需删除 Key、私人输入和内部信息。

## 6. Python：Responses 最小测试

只有控制台明确说明支持 Responses 时才使用：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
)

response = client.responses.create(
    model=os.environ["OPENAI_MODEL"],
    input="只回复 OK",
)

print(response.output_text)
```

如果 `/chat/completions` 正常而这里 404，通常是服务没有实现 Responses，不是 SDK 安装失败。

## 7. Python：流式输出

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
)

stream = client.chat.completions.create(
    model=os.environ["OPENAI_MODEL"],
    messages=[{"role": "user", "content": "用一句话介绍流式输出"}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
print()
```

非流式正常、流式失败时，检查 SSE、反向代理缓冲、读取超时和流事件格式。

## 8. Python：结构化错误处理

```python
import openai

try:
    response = client.chat.completions.create(
        model=os.environ["OPENAI_MODEL"],
        messages=[{"role": "user", "content": "只回复 OK"}],
    )
except openai.AuthenticationError:
    print("认证失败：检查 Key，禁止输出完整认证头")
except openai.RateLimitError:
    print("触发限流：降低并发并稍后重试")
except openai.APIConnectionError:
    print("连接失败：检查 Base URL、DNS、TLS 和代理")
except openai.APIStatusError as exc:
    print("status:", exc.status_code)
    print("request_id:", exc.request_id)
```

SDK 默认会对部分连接错误、408、409、429 和 5xx 自动重试。业务层仍应限制总重试次数，避免失败循环产生额外请求。

## 9. Node.js / TypeScript 安装

本仓库推荐 pnpm：

```bash
pnpm add openai
```

提交项目时必须同时提交 `package.json` 和 `pnpm-lock.yaml`。

## 10. Node.js：Chat Completions 最小测试

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 30_000,
  maxRetries: 2,
});

const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL!,
  messages: [{ role: "user", content: "只回复 OK" }],
});

console.log(response.choices[0]?.message.content);
console.log("request_id:", response._request_id);
```

Node SDK 使用 `baseURL`，Python SDK 使用 `base_url`；不要混写。

## 11. Node.js：Responses 与流式输出

```typescript
const stream = await client.responses.create({
  model: process.env.OPENAI_MODEL!,
  input: "用一句话说明流式输出",
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  }
}
process.stdout.write("\n");
```

Responses 的事件类型与 Chat Completions 不相同。不要把两者的流式解析代码混用。

## 12. 服务端代理接口示例

浏览器不应直接持有服务端 Key。前端请求自己的后端，由后端调用 SDK：

```typescript
import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "32kb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.post("/api/chat", async (req, res) => {
  const prompt = String(req.body?.prompt ?? "").slice(0, 4000);
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ text: response.choices[0]?.message.content ?? "" });
});
```

生产环境还必须增加身份认证、限流、输入校验、超时、日志脱敏和用量控制。

## 13. Base URL 常见错误

### 重复 `/v1`

```text
https://your-api.example.com/v1/v1/chat/completions
```

SDK 会在 Base URL 后追加资源路径，因此通常填到 `/v1` 即可。

### 误填完整端点

不要把 `/v1/chat/completions` 当成 SDK 的 Base URL，否则其他资源和路径拼接会失败。

### 环境变量没有加载

确认启动应用的进程继承了变量。Docker、IDE、systemd 和 CI 各自有独立环境，不要只在另一个终端执行 `export`。

## 14. 能力兼容清单

基础文本成功后，按项目实际需要逐项验证：

- [ ] SSE 流式输出；
- [ ] Tool / Function Calling；
- [ ] JSON Schema 或结构化输出；
- [ ] 图片输入；
- [ ] Embeddings；
- [ ] Token 用量字段；
- [ ] 请求 ID；
- [ ] 超时与取消；
- [ ] 429 退避；
- [ ] Responses 事件；
- [ ] 长上下文与最大输出限制。

“OpenAI 兼容”通常优先保证基础文本接口，扩展字段和高级端点需要单独验证。

## 15. 日志与安全

- 生产日志记录状态码、耗时、模型 ID 和脱敏请求 ID即可；
- 不记录 Authorization、完整请求体、私人文档或原始服务端错误；
- 为开发、测试、生产创建不同 Key；
- 给用户输入设置长度、文件类型和并发限制；
- Key 轮换后重启持有旧环境变量的进程；
- 不要通过 `verify=False` 或关闭 TLS 校验解决证书错误。

## 16. 升级与回滚

升级 SDK 前：

1. 提交并锁定当前依赖；
2. 在测试分支升级；
3. 运行文本、流式、工具调用和错误处理测试；
4. 检查 SDK 发布说明中的弃用与类型变化；
5. 生产异常时恢复旧 lockfile 并重新部署。

不要只回退 `package.json` 而保留新 lockfile，也不要在生产服务器直接进行无版本约束的全局升级。

## 17. 官方资料

- [OpenAI API Reference](https://developers.openai.com/api/reference/overview)
- [OpenAI Python 官方 SDK](https://github.com/openai/openai-python)
- [OpenAI Node.js 官方 SDK](https://github.com/openai/openai-node)
- [OpenAI 模型、端点与能力目录](https://developers.openai.com/api/docs/models)
- [OpenAI API 生产最佳实践](https://developers.openai.com/api/docs/guides/production-best-practices)

遇到问题时先用同一组 Base URL、Key 和模型 ID 做非流式最小测试，再逐步加入框架、代理、工具和业务逻辑。
