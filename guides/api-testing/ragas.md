# Ragas 评测 RAG 检索、忠实度与回答质量完整教程

> 最后核验：2026-08-10
>
> 适用范围：Ragas、Python、RAG / LLM / Agent 评测、OpenAI-compatible API
>
> 预计用时：35～70 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 为什么 RAG 不能只测最终回答

一个 RAG 回答错误，可能来自完全不同的环节：

```text
用户问题
  → 检索没找到
  → 找到了但排序靠后
  → 上下文正确但模型忽略
  → 模型基于上下文又编造
  → 最终表述不符合要求
```

Ragas 是面向 LLM 应用的评测框架，提供 RAG、Agent、自然语言比较和通用 rubric 等指标。它帮助把“感觉回答不错”变成可重复的数据集和实验。

## 2. 指标对应什么问题

常见 RAG 指标：

| 指标 | 主要回答的问题 |
|---|---|
| Context Precision | 排在前面的检索片段是否大多相关 |
| Context Recall | 参考答案需要的信息是否被检索出来 |
| Faithfulness | 回答中的事实能否从检索上下文推出 |
| Response Relevancy | 回答是否真正回应用户问题 |
| Answer Accuracy / Correctness | 回答与参考答案是否一致 |

指标不是越多越好。应先根据故障模式选择，再确认它需要哪些字段、是否依赖参考答案、LLM 或 Embedding。

## 3. 快速创建评测项目

官方当前推荐用 `uvx` 创建完整模板：

```bash
uvx ragas quickstart rag_eval
cd rag_eval
uv sync
```

或：

```bash
python3 -m venv .venv-ragas
source .venv-ragas/bin/activate
pip install -U ragas
ragas quickstart rag_eval
cd rag_eval
pip install -e .
```

生成结构通常包括：

```text
rag_eval/
├── pyproject.toml
├── rag.py
├── evals.py
└── evals/
    ├── datasets/
    ├── experiments/
    └── logs/
```

先原样运行模板，再替换成自己的 RAG，便于区分环境问题和业务问题。

## 4. 配置评测模型

评测模型负责分析上下文、事实或 rubric，不一定与被测生成模型相同。

OpenAI-compatible 示例：

```bash
export EVAL_API_KEY="YOUR_EVALUATOR_API_KEY"
export EVAL_BASE_URL="https://api.example.com/v1"
export EVAL_MODEL="YOUR_EVALUATOR_MODEL_ID"
```

```python
import os

from openai import OpenAI
from ragas.llms import llm_factory

client = OpenAI(
    api_key=os.environ["EVAL_API_KEY"],
    base_url=os.environ["EVAL_BASE_URL"],
)

evaluator_llm = llm_factory(
    os.environ["EVAL_MODEL"],
    provider="openai",
    client=client,
    temperature=0,
)
```

Ragas 依赖结构化输出。某个兼容模型能普通聊天，不代表能稳定完成评测 Schema。先用少量样本验证解析成功率。

## 5. 构造正确的数据集

单轮样本的核心字段：

```python
from ragas import EvaluationDataset
from ragas.dataset_schema import SingleTurnSample

samples = [
    SingleTurnSample(
        user_input="退款申请期限是多久？",
        response="订单支付后 7 天内可以申请退款。",
        retrieved_contexts=[
            "退款政策：订单支付完成之日起 7 天内可提交退款申请。"
        ],
        reference="订单支付后 7 天内可申请退款。",
    ),
]

dataset = EvaluationDataset(samples=samples)
```

注意：

- `retrieved_contexts` 必须是检索器真实返回，不是事后挑选的理想片段；
- `response` 必须是线上同版本 Prompt / 模型生成结果；
- `reference` 应由领域专家或可信资料形成；
- 保存文档 ID、排序和检索参数，便于定位问题。

## 6. 运行一组 RAG 指标

```python
from ragas import evaluate
from ragas.metrics import (
    AnswerCorrectness,
    ContextPrecision,
    ContextRecall,
    Faithfulness,
)

metrics = [
    ContextPrecision(llm=evaluator_llm),
    ContextRecall(llm=evaluator_llm),
    Faithfulness(llm=evaluator_llm),
    AnswerCorrectness(llm=evaluator_llm),
]

result = evaluate(dataset=dataset, metrics=metrics)
print(result)
```

不同 Ragas 版本的类名、数据模型和适配器曾有明显变化。项目必须锁定版本，并以所用稳定版本的 API Reference 为准；不要混用 0.1、0.2 和当前文档示例。

## 7. 单样本定位 Faithfulness

调试一个失败样本时，可单独评分：

```python
import asyncio

from ragas.dataset_schema import SingleTurnSample
from ragas.metrics import Faithfulness

sample = SingleTurnSample(
    user_input="退款申请期限是多久？",
    response="支付后 30 天内都能退款。",
    retrieved_contexts=[
        "退款政策：订单支付完成之日起 7 天内可提交退款申请。"
    ],
)

metric = Faithfulness(llm=evaluator_llm)
score = asyncio.run(metric.single_turn_ascore(sample))
print(score)
```

低 Faithfulness 说明回答不受上下文支持，但不能单独说明检索召回是否足够。

## 8. 如何读组合结果

典型组合：

| 现象 | 可能问题 |
|---|---|
| Precision 低、Recall 高 | 找到了信息，但噪声多或排序差 |
| Precision 高、Recall 低 | 返回片段准确但覆盖不够 |
| 检索指标高、Faithfulness 低 | 模型忽略上下文或产生幻觉 |
| Faithfulness 高、Correctness 低 | 回答忠于上下文，但上下文或参考答案有问题 |
| 指标都高、用户仍不满意 | 格式、语气、完整性或业务流程未被指标覆盖 |

不要只汇报平均分。查看低分样本、分位数和不同问题类型。

## 9. 建立可信测试集

测试集至少覆盖：

- 高频真实问题；
- 同义改写、错别字和口语；
- 跨文档问题；
- 时间敏感和版本敏感问题；
- 文档中没有答案的问题；
- 权限相关问题；
- Prompt Injection 和恶意文档；
- 表格、列表与长文档。

把数据分为开发集和留出集。不要反复针对同一测试集调到高分后再把它当客观结果。

## 10. 评测模型也会产生偏差

LLM-based 指标可能受以下影响：

- 评测模型版本变化；
- 温度和随机性；
- 中文、领域术语能力；
- Prompt 与结构化输出兼容；
- 参考答案质量；
- 自我偏好：模型更偏爱与自身风格相似的回答。

建议：

- 温度设为 0；
- 固定模型 ID 和 Ragas 版本；
- 对关键样本做人工双人标注；
- 测量指标与人工判断的一致性；
- 保存失败解析和重试次数；
- 结合不依赖 LLM 的 Exact Match / Schema / 字符串规则。

## 11. 控制成本与可复现性

每个样本 × 每个指标可能触发多次评测模型调用。上线前估算：

```text
总调用 ≈ 样本数 × 指标数 × 每指标内部调用数 × 重试
```

优化方式：

- 提交时跑小型关键集；
- 定时跑完整集；
- 开发阶段缓存稳定的评测结果；
- 先用确定性规则淘汰格式错误；
- 为评测单独设置额度和并发；
- 保存实验 CSV、配置和 Git SHA。

缓存命中结果不能用来测当前 API 延迟。

## 12. 按组件修复，不要盲调 Prompt

- Recall 低：检查分块、索引、查询改写和召回数量；
- Precision 低：检查 Embedding、过滤、混合检索和 Rerank；
- Faithfulness 低：加强引用约束、上下文组织和无答案策略；
- Correctness 低：核对知识库、参考答案和时效；
- 延迟高：分解检索、Rerank、生成和评测耗时。

每次只改变一个主要变量，并用相同留出集比较。

## 13. 常见问题

### KeyError 或字段验证失败

检查所选指标需要的字段。Context Recall 通常需要 reference；Faithfulness 需要 response 和 retrieved contexts。

### 结构化输出解析失败

换更可靠的评测模型，确认兼容端点支持目标请求和 JSON 结构；减少并发并查看脱敏错误。不要把失败样本当 0 分静默吞掉。

### 分数每次变化很大

固定模型、温度、Ragas 版本和数据顺序。对关键用例多次运行并报告区间，不只报告一次平均值。

### 评测非常慢或频繁 429

降低并发和指标数，增加有限退避，检查评测模型配额。先在小样本验证代码和字段。

### 高分但线上效果差

测试集可能不代表真实流量，或离线数据没有使用真实检索结果。按真实问题类型分层采样并做线上用户反馈闭环。

## 14. 验收清单

- [ ] 数据集来自真实问题并有留出集；
- [ ] 检索上下文是系统真实返回；
- [ ] 指标与故障模式一一对应；
- [ ] 评测模型、参数和 Ragas 版本固定；
- [ ] 关键指标与人工标注做过一致性检查；
- [ ] 失败解析、重试和 429 没有被隐藏；
- [ ] 实验保存 Git SHA、配置和结果；
- [ ] 敏感问题、上下文和评测结果按权限保护。

## 15. 官方来源

- [Ragas Quickstart](https://docs.ragas.io/en/stable/getstarted/quickstart/)
- [Ragas Evaluate a Simple LLM Application](https://docs.ragas.io/en/stable/getstarted/evals/)
- [Ragas Available Metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/)
- [Ragas LLM Adapters](https://docs.ragas.io/en/stable/howtos/llm-adapters/)
- [Ragas GitHub 仓库](https://github.com/explodinggradients/ragas)
