---
title: Vercel AI SDK 自定义 Base URL：Provider、流式与工具调用
description: 配置 Vercel AI SDK 的自定义 Provider，验证 Base URL、流式输出、工具调用和浏览器端密钥安全。
last_verified: 2026-09-21
---

# Vercel AI SDK 自定义 Base URL：Provider、流式与工具调用

**直接结论：自定义 Provider 应只在服务端创建，浏览器端不要暴露 API Key；先验证 text，再验证 stream 和 tools。**

## 实施步骤

1. 在服务端环境变量中保存 Key 和 Base URL。
2. 按 SDK 当前版本创建 Provider。
3. 用最小模型调用确认请求路径和返回结构。
4. 通过服务端路由向浏览器转发流式结果。
5. 单独验证工具调用和错误事件。

## 安全边界

- 不把 Key 放入 `NEXT_PUBLIC_*`；
- 不把完整请求头写入前端日志；
- 限制用户可选模型和工具；
- 设置请求超时、输出上限和速率限制。

## 排错

先在服务端打印脱敏后的 URL、状态码和 request ID。若普通响应成功而流式失败，检查响应头、代理缓冲和事件解析，不要先修改 React 组件。

## 官方来源

- [Vercel AI SDK 文档](https://ai-sdk.dev/docs)
- [SSE 流式排查](../basics/sse-streaming-debug.md)
- [API Key 安全与轮换](../basics/api-key-security-rotation.md)

