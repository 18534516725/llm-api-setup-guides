---
title: API Base URL 怎么填：路径、版本与 404 排查
description: 解释 Base URL、API 路径和版本前缀的区别，用最小请求定位 404、重复 /v1 与错误端点问题。
last_verified: 2026-09-21
---

# API Base URL 怎么填：路径、版本与 404 排查

**直接结论：先确认客户端字段需要“服务根地址”还是“完整接口地址”，再只保留一次版本前缀。** `https://api.example.com/v1`、`https://api.example.com` 和 `https://api.example.com/v1/chat/completions` 不是同一个字段的通用答案。

## 三个地址层级

| 层级 | 示例 | 常见用途 |
|---|---|---|
| 服务根 | `https://api.example.com` | 文档或网关入口 |
| API 根 | `https://api.example.com/v1` | OpenAI SDK、客户端自定义端点 |
| 完整接口 | `.../v1/chat/completions` | curl 或调试工具 |

## 最小验证顺序

1. 查看目标客户端字段旁的官方说明。
2. 用 `/models` 或文档规定的健康接口验证路径。
3. 再发送一个最小文本请求。
4. 若返回 404，检查是否重复拼接 `/v1`、是否误填了完整接口路径、模型 ID 是否存在。

```bash
curl -sS "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY"
```

## 常见错误

- `.../v1/v1/...`：客户端已经自动追加版本前缀。
- `.../chat/completions/chat/completions`：把完整接口地址填进了根地址字段。
- 只改模型名仍 404：先检查协议和端点，不要把路径错误当成模型错误。

## FAQ

### Base URL 要不要以斜杠结尾？

除非官方文档明确要求，通常去掉末尾斜杠，避免 SDK 拼接出双斜杠。

### 不同客户端能共用同一个 Base URL 吗？

只有当它们使用相同协议、路径规则和能力时才可以。详细能力应参考[兼容性总表](compatibility-matrix.md)。

## 官方来源

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [API 接入基础](api-basics.md)
- [通用排错手册](troubleshooting.md)

