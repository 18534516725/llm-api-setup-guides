---
title: Node.js OpenAI SDK 接入兼容 API：环境变量与流式验证
description: 在 Node.js 中使用 OpenAI SDK 配置兼容端点，验证环境变量、请求路径、流式和重试边界。
last_verified: 2026-09-21
---

# Node.js OpenAI SDK 接入兼容 API：环境变量与流式验证

**直接结论：把 Key 放在环境变量，显式设置 `baseURL`，先完成短文本请求，再开启流式和工具。**

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const result = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL ?? "MODEL_ID",
  messages: [{ role: "user", content: "只回复 OK" }],
});
console.log(result.choices[0]?.message?.content);
```

## 验证清单

- 启动进程前确认环境变量存在但不打印值；
- 检查 `baseURL` 是否已经包含版本前缀；
- 单独测试 Chat、Responses 和 streaming；
- 为重试设置次数、退避和幂等边界；
- 日志只记录状态、耗时和 request ID。

## 官方来源

- [OpenAI Node Library](https://github.com/openai/openai-node)
- [API Base URL 排查](../basics/api-base-url-path-troubleshooting.md)
- [SSE 流式排查](../basics/sse-streaming-debug.md)

