# Embedding 与 Rerank 模型选型、接入和迁移指南

> 最后核验：2026-07-24
>
> 适用范围：知识库、RAG、语义搜索、推荐与去重系统
>
> 预计用时：20～40 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 两类模型分别做什么

典型 RAG 检索链路：

```text
用户问题
  ↓
Embedding：把问题变成向量
  ↓
向量库：召回一批候选片段
  ↓
Rerank：用问题重新给候选片段排序
  ↓
把靠前片段交给 LLM 回答
```

Embedding 负责快速扩大召回，Rerank 负责在较小候选集中提高排序精度。两者不是同一种模型，也不能互相替代。

## 2. Embedding 接口

OpenAI-compatible Embeddings 的常见请求：

```bash
export API_KEY="YOUR_API_KEY"

curl https://api.example.com/v1/embeddings \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_EMBEDDING_MODEL_ID",
    "input": [
      "什么是向量检索？",
      "如何保护 API Key？"
    ]
  }'
```

核心返回结构：

```json
{
  "data": [
    {
      "embedding": [0.0123, -0.0456, 0.0789],
      "index": 0
    }
  ],
  "model": "YOUR_EMBEDDING_MODEL_ID"
}
```

实际向量通常有数百到数千维。这里省略了大部分数字。

## 3. Rerank 接口没有完全统一标准

常见概念结构：

```json
{
  "model": "YOUR_RERANK_MODEL_ID",
  "query": "如何保护 API Key？",
  "documents": [
    "使用环境变量保存密钥并定期轮换。",
    "把密钥写进 README 方便团队查看。",
    "公开日志有助于排查所有认证问题。"
  ],
  "top_n": 2
}
```

响应通常包含原文索引和相关性得分：

```json
{
  "results": [
    {"index": 0, "relevance_score": 0.97},
    {"index": 2, "relevance_score": 0.12}
  ]
}
```

但不同服务可能使用：

- `/v1/rerank`、`/rerank` 或其他路径；
- `documents` 字符串数组或对象数组；
- `top_n`、`top_k` 等不同字段；
- 不同认证头和响应字段。

接入时必须同时查看服务端和 RAG 平台的适配器说明。

## 4. 三条兼容规则

### 规则一：入库和查询使用同一向量空间

文档入库用模型 A，查询也必须用模型 A 或官方明确兼容的版本。不同模型生成的向量不能直接比较。

### 规则二：维度必须一致

向量库集合创建时通常固定维度。模型返回 1024 维，而集合配置为 1536 维，会直接写入失败。

### 规则三：更换模型要重建索引

“不能换 Embedding 模型”并不准确。可以换，但必须：

1. 创建新集合或新索引；
2. 用新模型重新处理全部文档；
3. 验证召回质量；
4. 切换查询流量；
5. 保留旧索引用于回滚；
6. 确认稳定后再删除旧索引。

## 5. 选型维度

不要只看排行榜。至少考虑：

| 维度 | 需要确认 |
|---|---|
| 语言 | 中文、英文、多语言、代码或混合内容 |
| 输入长度 | 单段最大 Token；超长文本如何切块 |
| 向量维度 | 存储空间、索引内存与数据库支持 |
| 查询/文档前缀 | 模型是否要求 `query:`、`passage:` 等模板 |
| 稠密/稀疏/多向量 | 目标数据库和应用是否支持 |
| 归一化 | 模型输出是否归一化，使用何种距离函数 |
| 延迟与并发 | 在线查询的 P95/P99 延迟 |
| 费用 | 入库总量、增量更新和查询次数 |
| 部署方式 | 云 API、本地 CPU、GPU 或混合 |
| 许可 | 模型和数据是否允许目标用途 |

## 6. 相似度与归一化

常见距离：

- Cosine similarity；
- Dot product；
- Euclidean/L2 distance。

使用哪一种应由模型说明和向量数据库配置共同决定。不要只因为“余弦最常见”就忽略模型是否已经归一化或官方推荐其他方式。

最小自检：

```python
import math


def norm(vector: list[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))


print(norm(your_embedding))
```

多条向量的范数都接近 `1`，通常表示结果经过 L2 归一化，但最终仍以模型文档为准。

## 7. 文档切块

Embedding 模型不能弥补不合理的切块。常见问题：

- 块太大：多个主题混在一起，相关句子被稀释；
- 块太小：上下文断裂，答案缺条件；
- 没有重叠：跨段信息丢失；
- 重叠过多：召回结果大量重复；
- 忽略标题：正文失去章节语义；
- 表格直接拆行：字段和数值失去对应关系。

建议先按文档结构切块，再设置有限重叠，并把标题路径作为元数据或正文前缀。

## 8. 是否需要 Rerank

以下情况优先考虑：

- 文档数量较大；
- 多篇文档主题相近；
- 初步召回包含大量“关键词像但答案不对”的片段；
- 需要把召回数量从 30～100 条压缩到 3～10 条；
- 生成模型上下文昂贵，想减少无关文本。

以下情况可能暂时不需要：

- 数据量很小；
- 查询简单且结果已经稳定；
- 延迟预算很紧；
- 没有经过评测，加入 Rerank 只是增加复杂度。

## 9. 两阶段检索参数

示例：

```text
向量召回 top_k = 40
Rerank top_n = 6
最终送入 LLM = 4～6 条
```

这不是通用最佳值。应使用真实问题集评测：

- 正确答案是否进入初步 top_k；
- Rerank 是否把正确片段排到前面；
- 无关片段是否减少；
- 延迟和费用增加多少；
- 最终回答质量是否提升。

如果正确片段根本没有进入初步召回，Rerank 无法把它找回来。应先修复 Embedding、切块或过滤。

## 10. 建立最小评测集

准备至少四类问题：

1. 文档中有直接答案；
2. 需要同义表达才能召回；
3. 多篇文档容易混淆；
4. 文档中没有答案。

每条记录：

```json
{
  "question": "退款期限是多少？",
  "expected_document_ids": ["policy-refund-2026"],
  "expected_answer": "支付后 7 天内"
}
```

评测指标可以从简单版本开始：

- Recall@K：正确文档是否进入前 K；
- MRR：第一个正确结果排第几；
- nDCG：多个相关结果的排序质量；
- 无答案误召回率；
- 检索 P95 延迟；
- 单次查询成本。

## 11. 完整验收脚本思路

对每个问题执行：

```text
Embedding(query)
→ vector search top_k
→ 保存初排结果
→ rerank
→ 保存重排结果
→ 比较 expected_document_ids
→ 记录延迟与费用
```

同时保留不经过 Rerank 的基线。没有基线就无法判断复杂度增加是否值得。

## 12. 常见平台配置映射

在 Dify、RAGFlow、FastGPT、LangBot、Xinference 等平台中，字段名称不同，但含义通常可映射为：

| 平台字段 | 实际含义 |
|---|---|
| Provider | 请求协议或供应商适配器 |
| Base URL / Endpoint | API 根地址或完整接口地址 |
| API Key | 认证凭据 |
| Model Name | 服务端模型 ID |
| Dimension | Embedding 向量长度 |
| Top K | 初步召回数量 |
| Top N | Rerank 后保留数量 |
| Score Threshold | 最低相关性阈值 |

Rerank 分数通常不能跨模型直接比较。更换模型后要重新校准阈值。

## 13. 数据与安全

- 远程 Embedding/Rerank 会接收原始问题和文档片段；
- 敏感文档应确认数据留存和训练政策；
- API Key 用环境变量或密钥系统保存；
- 多租户向量库按租户隔离；
- 文档删除时同步删除向量和缓存；
- 日志只记录必要的文档 ID 与指标；
- 对上传内容防止 Prompt Injection 和恶意文件；
- 本地模型服务也要配置鉴权和网络隔离。

## 14. 常见问题

| 现象 | 排查方法 |
|---|---|
| 向量维度不匹配 | 检查模型实际输出和向量库集合维度 |
| 召回完全不相关 | 检查模型语言、切块、前缀、距离函数和过滤条件 |
| 换模型后效果异常 | 不能复用旧向量，重新生成完整索引 |
| Rerank 404 | 接口不是统一标准，核对完整路径和 Provider 类型 |
| Rerank 后正确结果下降 | 检查模型语言与领域、文档长度、top_n 和分数阈值 |
| 中文问英文文档效果差 | 选择多语言模型或增加查询改写，但要通过评测确认 |
| 成本过高 | 批量入库、缓存稳定文档向量、缩小候选集并记录调用量 |
| 延迟过高 | 减少 top_k、缩短片段、并行请求或部署更近的模型服务 |

## 15. 官方与基础资料

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Cohere Rerank Documentation](https://docs.cohere.com/docs/rerank)
- [Jina AI Reranker API](https://jina.ai/reranker/)
- [Hugging Face MTEB](https://huggingface.co/spaces/mteb/leaderboard)
- [Qdrant Distance Metrics](https://qdrant.tech/documentation/concepts/collections/#collection-basics)
