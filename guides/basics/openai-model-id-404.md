---
title: OpenAI-compatible API 报 404 model not found：模型 ID 排查
description: 解释模型展示名、模型 ID、分组权限和端点路径的区别，系统排查 404 model not found。
last_verified: 2026-09-21
---

# OpenAI-compatible API 报 404 model not found：模型 ID 排查

**直接结论：404 model not found 通常不是 Key 错，而是模型 ID 不存在、没有权限或请求发到了错误端点。**

## 先区分两类 404

- 路径 404：请求 URL 不存在，例如把 Chat 请求发到错误版本路径。
- 模型 404：端点存在，但 `model` 不在当前服务或当前 Key 可用范围内。

## 排查步骤

1. 调用服务提供的模型列表，复制精确 ID。
2. 确认模型 ID 区分大小写，不能使用页面显示名称替代。
3. 确认 API Key 所属权限范围和模型分组。
4. 用最小 Chat 请求验证，再逐步加入流式、工具和图片参数。
5. 保存请求 URL、模型 ID 和响应状态，避免只截图错误文字。

```bash
curl -sS "$BASE_URL/models" -H "Authorization: Bearer $API_KEY"
```

## 不建议的做法

- 连续猜测模型名称；
- 自动跨模型降级；
- 把供应方内部标识展示给终端用户；
- 用另一个 Key 的模型列表推断当前 Key 权限。

## 官方来源

- [API 接入基础](api-basics.md)
- [兼容 API 上线验收](compatible-api-evaluation.md)
- [通用排错手册](troubleshooting.md)

