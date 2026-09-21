---
title: Tool Calling 兼容性怎么测：从 schema 到工具结果
description: 验证 AI API 工具调用的 JSON Schema、参数生成、工具结果回传、并发和拒绝行为。
last_verified: 2026-09-21
---

# Tool Calling 兼容性怎么测：从 schema 到工具结果

**直接结论：普通聊天成功不代表 Tool Calling 兼容。至少要验证工具声明、参数 JSON、工具结果和多轮结束状态。**

## 四步测试

1. 注册一个只读工具，参数只包含一个必填字符串。
2. 让模型生成工具调用，严格解析参数 JSON。
3. 把工具结果作为下一轮输入回传。
4. 验证模型最终回答、usage 和结束原因。

逐步增加可选参数、数组、枚举和多个工具。每次失败都记录原始请求结构和服务端返回的公开错误摘要。

## 需要记录的能力

| 能力 | 结果 |
|---|---|
| JSON Schema 校验 | 通过 / 失败 |
| 工具参数完整性 | 通过 / 失败 |
| 工具结果回传 | 通过 / 失败 |
| 并行工具调用 | 未测试 / 通过 / 失败 |
| 流式工具事件 | 未测试 / 通过 / 失败 |

不要因为服务端“接受了 tools 字段”就标记为完整兼容。

## 相关教程

- [兼容 API 上线验收](compatible-api-evaluation.md)
- [Responses API 与 Chat Completions](responses-vs-chat-completions.md)

