---
title: AI API 预算怎么算：按请求、Token 与 Agent 任务估算
description: 用输入、输出、缓存和工具循环估算 AI API 预算，避免把一次聊天价格误当成 Agent 任务成本。
last_verified: 2026-09-21
---

# AI API 预算怎么算：按请求、Token 与 Agent 任务估算

**直接结论：预算必须按完整任务计算，而不是只看一次回复的输出 Token。** 多轮上下文、工具调用、重试和缓存命中都会改变最终成本。

## 基本公式

```text
成本 = 输入 Token × 输入单价
     + 输出 Token × 输出单价
     + 缓存命中 Token × 缓存单价
     + 工具循环与重试成本
```

所有单价要确认单位、币种和计费周期。缓存 Token 是否已经包含在输入总量中，也必须从服务说明确认，不能重复计算。

## 估算步骤

1. 记录一次完整任务的输入、输出和工具调用次数。
2. 分别统计成功请求和重试请求。
3. 用短任务、中任务、长任务三档建立预算。
4. 设置单用户、单 Key 和单任务上限。
5. 上线后用账单记录校正估算，而不是继续沿用猜测。

## 常见误区

- 用聊天订阅额度换算 Token 单价；
- 把平台积分当人民币；
- 只统计成功请求，忽略失败重试；
- 用平均值隐藏长任务的 P95 成本。

## 相关教程

- [Token、上下文与 Agent 成本](token-context-agent-cost.md)
- [AI 编程用量与成本](ai-coding-usage-cost.md)
- [NexoToken 成本专题](https://www.nexotoken.net/official/tools/token-cost-calculator?ref=github-guide)

