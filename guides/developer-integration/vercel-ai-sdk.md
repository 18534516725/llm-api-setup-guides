# Vercel AI SDK 接入 OpenAI 兼容 API：流式、工具调用与 Next.js

> 最后核验：2026-07-14
>
> 适用范围：AI SDK Core、`@ai-sdk/openai-compatible` 与 Node.js / Next.js 服务端
>
> 关键入口：`createOpenAICompatible({ name, apiKey, baseURL })`

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **需要验证 Vercel AI SDK 的兼容接口？**
>
> **[纽智中转站](https://www.nexotoken.net/?ref=github)** 提供每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。请从控制台复制 Base URL、Key 和模型 ID，活动规则以官网实时页面为准。
>
> **[👉 获取测试 Key](https://www.nexotoken.net/?ref=github)**

## 1. 适用场景

Vercel AI SDK 适合构建：

- Next.js / Node.js 流式聊天；
- React AI 界面；
- Tool Calling 与结构化对象生成；
- 多模型 Provider Registry；
- 服务端流式响应和用量统计。

`@ai-sdk/openai-compatible` 用于实现 OpenAI 风格接口的服务。它不是万能协议转换器，目标端点仍需正确实现请求、SSE 与工具字段。

## 2. 安装

```bash
pnpm add ai @ai-sdk/openai-compatible
```

使用 Next.js 时还需要项目自身的 React / Next.js 依赖。提交变更时同时提交 `package.json` 与 `pnpm-lock.yaml`。

## 3. 环境变量

`.env.local`：

```dotenv
AI_API_KEY=YOUR_API_KEY
AI_BASE_URL=https://your-api.example.com/v1
AI_MODEL=YOUR_MODEL_ID
```

把 `.env.local` 加入 `.gitignore`。变量不能以 `NEXT_PUBLIC_` 开头，否则会进入浏览器包。

## 4. 创建兼容 Provider

新建 `src/lib/ai-provider.ts`：

```typescript
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL;

if (!apiKey || !baseURL) {
  throw new Error("Missing AI_API_KEY or AI_BASE_URL");
}

export const compatible = createOpenAICompatible({
  name: "compatible",
  apiKey,
  baseURL,
  includeUsage: true,
});
```

`baseURL` 通常填到 `/v1`。不要填完整 `/chat/completions`，也不要把 Key 写成源代码字符串。

## 5. 最小文本测试

```typescript
import { generateText } from "ai";
import { compatible } from "./src/lib/ai-provider";

const modelId = process.env.AI_MODEL;
if (!modelId) throw new Error("Missing AI_MODEL");

const { text, usage } = await generateText({
  model: compatible(modelId),
  prompt: "只回复 OK",
});

console.log(text);
console.log(usage);
```

先在服务端执行，确认返回 `OK`，再接 React 页面。

## 6. 流式文本

```typescript
import { streamText } from "ai";
import { compatible } from "./src/lib/ai-provider";

const result = streamText({
  model: compatible(process.env.AI_MODEL!),
  prompt: "用一句话解释 SSE",
});

for await (const part of result.textStream) {
  process.stdout.write(part);
}
```

如果服务不返回兼容的流式 Usage，可将 `includeUsage` 调整为 `false` 验证文本流。非流式正常而流式失败，优先检查 SSE 和反向代理缓冲。

## 7. Next.js Route Handler

`app/api/chat/route.ts`：

```typescript
import { streamText } from "ai";
import { compatible } from "@/lib/ai-provider";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const result = streamText({
    model: compatible(process.env.AI_MODEL!),
    messages,
  });

  return result.toUIMessageStreamResponse();
}
```

生产环境必须添加登录认证、限流、消息数量与长度限制。不要把任意浏览器请求直接转发给付费 API。

## 8. 工具调用

```typescript
import { generateText, tool } from "ai";
import { z } from "zod";

const result = await generateText({
  model: compatible(process.env.AI_MODEL!),
  prompt: "北京现在几点？",
  tools: {
    getTime: tool({
      description: "查询指定时区的时间",
      inputSchema: z.object({
        timeZone: z.string(),
      }),
      execute: async ({ timeZone }) => ({
        timeZone,
        time: new Intl.DateTimeFormat("zh-CN", {
          timeZone,
          dateStyle: "full",
          timeStyle: "long",
        }).format(new Date()),
      }),
    }),
  },
});

console.log(result.text);
console.log(result.steps);
```

首次测试使用无副作用工具。模型和服务必须支持原生 Tool Calling；能返回文本不代表工具参数流完整。

## 9. Provider Registry

多个模型可统一管理：

```typescript
import { createProviderRegistry } from "ai";
import { compatible } from "./ai-provider";

export const registry = createProviderRegistry({
  compatible,
});

const model = registry.languageModel(
  `compatible:${process.env.AI_MODEL!}`,
);
```

Registry 只管理命名与查找，不会替你转换协议或验证模型能力。

## 10. 自定义 Header

只有服务官方说明要求额外 Header 时才添加：

```typescript
export const compatible = createOpenAICompatible({
  name: "compatible",
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL!,
  headers: {
    "X-Client-Name": "my-server-app",
  },
});
```

不要把用户输入直接拼成 Header，也不要把认证 Header 输出到日志。

## 11. 常见错误

### 401

环境变量未加载、Key 无效或部署平台没有配置 Secret。重新部署后再检查运行时变量。

### 404

确认 `baseURL` 没有重复 `/v1`，并检查兼容包调用的是哪个端点。

### 流结束时报解析错误

关闭 `includeUsage` 交叉验证。某些服务能流式输出文本，但未实现兼容的 Usage 块。

### Tool 没有执行

检查模型能力、`tools` 请求字段、流式 Tool Call 参数和 AI SDK 步骤限制。不要通过无限增加最大步骤数掩盖协议问题。

### Serverless 超时

缩短上下文、调整平台函数时限、设置上游超时并支持取消。客户端断开时应尽量终止无用请求。

## 12. 安全与成本控制

- Provider 只在服务端模块实例化；
- 不把 Key 放入 Client Component；
- API Route 必须认证和限流；
- 限制消息数量、单条长度、附件大小和工具循环次数；
- 对 Prompt、Tool 参数和日志做隐私审查；
- 记录脱敏请求 ID、模型和 Usage，不记录认证头；
- 为预览、测试、生产使用不同 Key；
- Webhook 和工具执行需要独立授权，不能信任模型生成的参数。

## 13. 上线验收

- [ ] 服务端非流式文本；
- [ ] 服务端流式文本；
- [ ] 浏览器断开后请求取消；
- [ ] 单个无副作用工具；
- [ ] Tool 结果回传；
- [ ] 401 / 429 / 5xx 用户提示；
- [ ] 未登录用户无法调用；
- [ ] Key 不出现在浏览器 Network 和构建产物；
- [ ] 部署平台超时足够；
- [ ] 日志已脱敏。

## 14. 升级与回滚

AI SDK 的方法和返回结构会随大版本演进：

1. 锁定 `ai` 与 Provider 包版本；
2. 保存文本、流式和 Tool Call 回归测试；
3. 同时升级相互兼容的包；
4. 提交 lockfile；
5. 异常时整体恢复依赖清单与 lockfile。

## 15. 官方资料

- [AI SDK：OpenAI Compatible Providers](https://ai-sdk.dev/providers/openai-compatible-providers)
- [AI SDK Core：Provider Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management)
- [AI SDK Core：生成文本](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
- [AI SDK Core：工具与 Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK GitHub](https://github.com/vercel/ai)

如果兼容性问题难以定位，先使用[OpenAI 官方 SDK教程](./openai-sdk.md)验证同一端点，再判断差异来自 API 还是 AI SDK 适配层。
