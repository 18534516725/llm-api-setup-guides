---
title: curl 测试 OpenAI-compatible API：一条命令完成最小冒烟
description: 用 curl 分别测试模型发现、Chat、Responses 和流式接口，定位认证、路径、模型与协议错误。
last_verified: 2026-09-21
---

# curl 测试 OpenAI-compatible API：一条命令完成最小冒烟

**直接结论：先使用 curl 验证服务端，再排查客户端。这样可以把客户端配置问题和 API 本身的问题分开。**

## 模型发现

```bash
curl -sS "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY"
```

复制返回的真实模型 ID，不要手输展示名称。

## 最小 Chat 请求

```bash
curl -sS "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MODEL_ID","messages":[{"role":"user","content":"只回复 OK"}]}'
```

## 记录什么

记录状态码、响应耗时、request ID、错误类别和模型 ID。不要保存完整 Key、完整用户输入或未脱敏的内部错误。

## 下一步

Chat 成功后再测试 Responses、streaming、tools 和 usage。具体请求结构以服务端和官方 SDK 文档为准。

## 相关教程

- [API Base URL 排查](../basics/api-base-url-path-troubleshooting.md)
- [API 上线前健康检查](../basics/api-health-check.md)
- [Apifox / Postman 测试](apifox-postman.md)

