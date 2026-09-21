---
title: AI API SSE 流式响应中断：事件、代理与超时排查
description: 从响应头、事件格式、代理缓冲、读取超时和结束事件定位 AI API 流式输出中断。
last_verified: 2026-09-21
---

# AI API SSE 流式响应中断：事件、代理与超时排查

**直接结论：先确认服务端确实返回 `text/event-stream`，再区分“没有事件”“代理缓冲”和“客户端解析失败”。**

## 最小检查

```bash
curl -N -i "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MODEL_ID","messages":[{"role":"user","content":"只回复 OK"}],"stream":true}'
```

检查 `Content-Type`、首个事件到达时间、事件之间是否持续输出，以及是否有明确结束标记。

## 常见原因

| 现象 | 优先检查 |
|---|---|
| 首字节很晚 | 上游排队、代理缓冲、超时 |
| 一次性返回全文 | 客户端未开启流式或代理合并响应 |
| 中途断开 | idle timeout、连接复用、网络切换 |
| JSON 解析失败 | 把 SSE 行当成完整 JSON 解析 |

客户端应按事件边界增量解析，不能假设每个 TCP 包都是一个完整事件。

## 相关教程

- [流式、工具与长上下文测试](streaming-tools-context-testing.md)
- [限流、重试与并发控制](rate-limits-retries.md)

