---
title: Embedding 与 Rerank API 怎么选：接口、维度和评测
description: 区分 Embedding 与 Rerank 的请求方式、向量维度、批量限制和检索质量评测方法。
last_verified: 2026-09-21
---

# Embedding 与 Rerank API 怎么选：接口、维度和评测

**直接结论：Embedding 负责把文本变成向量，Rerank 负责对候选结果重新排序；两者不能用同一个模型或同一个接口想当然替代。**

## 先确认接口契约

- Embedding：输入文本数组、返回向量数组和维度；
- Rerank：查询、候选文档、相关性分数或排序结果；
- 批量大小、最大输入长度、语言覆盖和归一化方式都可能不同。

## 迁移检查

1. 保存旧模型的向量维度和距离函数。
2. 使用同一批查询、文档和标注结果对照。
3. 重新建立索引，不要把不同维度的向量混在一起。
4. 分别记录召回率、Top-k 命中率和最终回答忠实度。

## 安全与成本

Embedding 输入可能包含用户文档，上传前应确认数据政策；Rerank 通常在候选集上重复调用，需要设置批量和预算上限。

## 相关教程

- [Embedding 与 Rerank](embedding-rerank.md)
- [兼容 API 上线验收](compatible-api-evaluation.md)

