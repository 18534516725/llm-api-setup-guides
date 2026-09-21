---
title: Anthropic Messages API 兼容性怎么验：Claude Code 之前先测什么
description: 用最小请求检查 Anthropic Messages API 的认证、模型、消息、流式和工具调用兼容性。
last_verified: 2026-09-21
---

# Anthropic Messages API 兼容性怎么验：Claude Code 之前先测什么

**直接结论：Claude Code 能否连接，关键不只是 Base URL，还包括 Messages 请求体、认证头、模型 ID 和流式事件是否一致。**

## 必须核对的字段

| 项目 | 要核对什么 |
|---|---|
| 认证 | `x-api-key` 或客户端要求的认证方式 |
| 版本 | `anthropic-version` 是否被服务端接受 |
| 请求 | `model`、`max_tokens`、`messages` |
| 流式 | `message_start`、`content_block_delta`、结束事件 |
| 工具 | JSON Schema、工具结果和拒绝行为 |

## 最小文本请求

先使用一个短提示和较小的 `max_tokens`，确认返回的是合法 Messages 响应，再开启流式和工具。不要一开始把长上下文、图片和多个工具混在一起。

## 排错顺序

1. 401：检查认证头和 Key 是否仍有效。
2. 404：检查模型 ID、端点路径和版本前缀。
3. 400：删除非标准参数，回到最小消息体。
4. 流式中断：保存最后一个事件类型，检查是否缺少结束事件。
5. 工具失败：单独验证 schema 和工具结果，不要归因于网络。

## FAQ

### OpenAI-compatible API 能直接给 Claude Code 用吗？

不能直接推断。Claude Code 需要 Anthropic Messages 兼容路径或客户端明确支持的转换层。

## 官方来源

- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)
- [Claude Code 教程](../coding-tools/claude-code.md)
- [通用排错手册](troubleshooting.md)

