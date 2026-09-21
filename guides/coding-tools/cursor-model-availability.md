---
title: Cursor 自定义模型不可用：模型列表、BYOK 与 Agent 排查
description: 排查 Cursor 中模型不显示、BYOK 不生效、聊天成功但 Agent 失败等常见问题。
last_verified: 2026-09-21
---

# Cursor 自定义模型不可用：模型列表、BYOK 与 Agent 排查

**直接结论：Cursor 的模型选择、BYOK、Override Base URL 和 Agent 能力是不同层级，不能只看模型名称是否显示。**

## 排查顺序

1. 确认当前 Cursor 版本和配置入口。
2. 检查 API Key、Base URL 和模型 ID 是否来自同一服务。
3. 先发普通短文本请求。
4. 再测试流式、上下文和工具调用。
5. 查看客户端实际发送的协议和错误状态，不要只看 UI 提示。

## 常见现象

- 模型不显示：可能是客户端白名单或模型列表格式限制；
- 聊天可用、Agent 不可用：工具调用或上下文能力不匹配；
- 401：Key 未保存或被旧配置覆盖；
- 404：模型 ID 或 Base URL 路径错误。

## 相关教程

- [Cursor 完整配置](cursor.md)
- [Tool Calling 兼容性](../basics/tool-calling-compatibility.md)
- [NexoToken Cursor 专题](https://www.nexotoken.net/official/guides/cursor-compatible-api?ref=github-guide)

