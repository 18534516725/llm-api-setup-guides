---
title: Python OpenAI SDK 接入兼容 API：Base URL、Responses 与错误处理
description: 使用 Python OpenAI SDK 配置兼容端点，分别验证 Chat、Responses、流式和错误重试。
last_verified: 2026-09-21
---

# Python OpenAI SDK 接入兼容 API：Base URL、Responses 与错误处理

**直接结论：先固定 SDK 版本和服务端协议，再设置 `base_url`；不要假设 SDK 支持的每个字段都被兼容服务实现。**

## 最小配置

```python
from openai import OpenAI

client = OpenAI(api_key="sk-your-key", base_url="https://api.example.com/v1")
result = client.chat.completions.create(
    model="MODEL_ID",
    messages=[{"role": "user", "content": "只回复 OK"}],
)
print(result.choices[0].message.content)
```

完成 Chat 验证后，再分别测试 Responses、streaming、tools 和 usage。捕获异常时保留状态码和 request ID，过滤 Key、完整提示词和内部诊断信息。

## 常见问题

- `base_url` 重复 `/v1`：检查 SDK 和服务端的拼接规则；
- 404 model：复制精确模型 ID；
- 400 参数错误：删除非标准参数，回到最小请求；
- 流式解析失败：按事件读取，不要一次性 `json.loads` 整个响应。

## 官方来源

- [OpenAI Python Library](https://github.com/openai/openai-python)
- [Responses API 与 Chat Completions](../basics/responses-vs-chat-completions.md)

