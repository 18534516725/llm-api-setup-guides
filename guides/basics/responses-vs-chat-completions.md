---
title: Responses API 与 Chat Completions 区别：怎么选端点
description: 对比 Responses API 与 Chat Completions 的请求结构、工具调用、流式事件和客户端兼容边界。
last_verified: 2026-09-21
---

# Responses API 与 Chat Completions 区别：怎么选端点

**直接结论：客户端声明支持哪种协议就使用哪种端点，不要因为都叫 OpenAI-compatible 就混用。** 普通聊天成功，不能证明工具调用、推理事件或 Responses 事件流也兼容。

## 核心差异

| 项目 | Chat Completions | Responses |
|---|---|---|
| 输入 | `messages` | `input` 或输入项数组 |
| 输出读取 | `choices[0].message` | `output` / 事件流 |
| 工具调用 | `tool_calls` | response output item |
| 流式事件 | delta 片段 | 类型更细的事件 |
| 兼容性 | 老客户端更常见 | 新 Agent 工作流常用 |

## 选择步骤

1. 阅读客户端的协议名称和完整请求路径。
2. 用官方示例构造最小请求。
3. 分别验证普通文本、流式、工具调用和 usage。
4. 在[兼容 API 上线验收](compatible-api-evaluation.md)中记录每项结果。

不要把 `/v1/chat/completions` 改成 `/v1/responses` 作为唯一排错手段；服务端可能只实现其中一种。

## FAQ

### Chat 请求成功，为什么 Agent 仍然失败？

Agent 还依赖工具调用、事件顺序、参数 schema 和权限确认。必须单独测试，不能由普通文本请求推断。

### 能否在同一个客户端里切换两种协议？

只有客户端和服务端都提供明确的协议选项时才可以。每个 Provider 都应保存自己的端点和能力说明。

## 官方来源

- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [流式、工具与长上下文测试](streaming-tools-context-testing.md)

