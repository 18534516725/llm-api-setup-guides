---
title: LangChain 接入 OpenAI-compatible API：模型、工具和调试顺序
description: 在 LangChain 中配置兼容 API，分步验证聊天、结构化输出、工具调用和回调追踪。
last_verified: 2026-09-21
---

# LangChain 接入 OpenAI-compatible API：模型、工具和调试顺序

**直接结论：先验证底层模型调用，再加入 LangChain 的工具、记忆和 Agent 层。** 上层链路失败时，必须先排除 Base URL、模型 ID 和协议问题。

## 推荐顺序

1. 用最小 `ChatOpenAI` 请求验证普通文本。
2. 固定模型名和温度，验证结构化输出。
3. 注册一个只读工具，检查参数 schema。
4. 再测试 Agent 循环、回调和流式事件。
5. 对每一步记录输入长度、耗时、Token 和错误状态。

## 常见误区

- 把 LangChain 的 `model` 名称当成服务端真实 ID；
- Chat 成功后直接启用 Agent；
- 重试同时发生在 SDK、LangChain 和网关三层；
- 在 trace 中保存完整 Key 或敏感提示词。

## 相关教程

- [LangChain 官方文档](https://python.langchain.com/docs/)
- [Tool Calling 兼容性](../basics/tool-calling-compatibility.md)
- [限流、重试与并发控制](../basics/rate-limits-retries.md)

