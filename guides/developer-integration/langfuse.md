# Langfuse 为 LLM / Agent 添加可观测性完整教程

> 最后核验：2026-08-10
>
> 适用范围：Langfuse Cloud / Self-hosted、Python、OpenAI SDK、Agent 与 RAG
>
> 预计用时：25～50 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 为什么 LLM 应用需要 Trace

传统日志只告诉你接口成功或失败，LLM / Agent 还需要回答：

- 用户的一次请求触发了多少次模型调用；
- 哪一步最慢、最贵或失败；
- 检索返回了什么，工具调用了什么；
- 不同 Prompt / 模型版本的质量是否变化；
- 同一 Session 中问题从哪里开始出现。

Langfuse 是开源的 LLM 工程平台，覆盖 Trace、Prompt、评测、数据集、成本和延迟分析。它既有云服务，也可自托管。

## 2. 先理解数据结构

常用层级：

```text
Session（一次连续会话）
└── Trace（一次用户请求或后台任务）
    ├── Span（检索、业务逻辑、工具）
    ├── Generation（一次模型生成）
    └── Event（关键事件）
```

稳定、语义明确的名称非常重要。评测规则、Dashboard 和数据集实验都会依赖 Trace / Observation 的名称和输入输出。

## 3. 选择 Cloud 还是自托管

初次验证使用 Cloud 最快。需要数据边界、网络策略或内部合规时再评估自托管。

当前 Langfuse Self-hosted v4 不只是一个 Web 容器，正式环境涉及数据库、ClickHouse、对象存储、队列 / 缓存及 Worker 等组件。不要把旧博客中的单容器命令直接当生产架构。

无论哪种方式，都要先确认：

- 数据存储地区和保留期；
- Prompt、输出、文件和工具结果是否允许离开应用；
- 哪些字段必须在客户端脱敏；
- 谁能访问 Trace 和导出数据。

## 4. 创建项目和凭据

在 Langfuse 项目设置创建 Public Key 与 Secret Key：

```bash
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_BASE_URL="https://cloud.langfuse.com"
export LANGFUSE_TRACING_ENVIRONMENT="development"
```

使用其他数据区域或自托管实例时，把 Base URL 改为对应地址。不要把 Secret Key 写进前端、移动端或公开仓库。

环境名只能使用文档允许的小写字母、数字、连字符和下划线，且不要以 `langfuse` 开头。

## 5. 最少改动追踪 OpenAI Python SDK

```bash
python3 -m venv .venv-langfuse
source .venv-langfuse/bin/activate
pip install -U langfuse
```

```python
import os

from langfuse import get_client
from langfuse.openai import openai


client = openai.OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.getenv("OPENAI_BASE_URL"),
)

response = client.chat.completions.create(
    name="support-answer",
    model=os.environ["OPENAI_MODEL"],
    messages=[
        {"role": "system", "content": "回答必须简洁、准确。"},
        {"role": "user", "content": "用一句话解释向量检索。"},
    ],
    metadata={"feature": "docs-demo", "prompt_version": "v1"},
)

print(response.choices[0].message.content)

# 短生命周期脚本退出前主动发送后台队列中的事件
get_client().flush()
```

运行后在 Langfuse Tracing 页面确认模型、延迟、Token 和输入输出。

## 6. 短脚本、Serverless 与后台批量

Langfuse SDK 默认在后台排队和批量发送事件。常驻服务通常无需每次调用都 flush；短脚本、Serverless 或即将被冻结的运行时必须在结束前：

```python
from langfuse import get_client

langfuse = get_client()
langfuse.flush()
```

进程永久退出时可使用 `shutdown()` 等待未发送事件并停止客户端。频繁逐条 flush 会增加延迟，不应放在普通请求热路径。

## 7. 为 Agent 设计 Trace

推荐让一次用户任务对应一条 Trace：

```text
customer-support-agent
├── classify-intent
├── retrieve-policy
├── call-order-tool
├── generate-answer
└── policy-check
```

每个 Span 记录最小必要输入、输出、开始结束时间和错误。工具调用额外记录：

- 工具名和版本；
- 脱敏参数；
- 是否获批；
- 耗时、重试与结果状态；
- 幂等键或业务 request ID。

不要把数据库凭据、Authorization、Cookie 或完整个人信息作为 metadata。

## 8. Session、User 与 Release

为了比较同一用户会话和发布版本，应传递稳定标识：

- `session_id`：一条连续会话；
- `user_id`：内部不可逆或假名化用户标识；
- `release` / version：应用发布版本；
- environment：development、staging、production。

不要直接用邮箱、手机号当 user ID。使用内部 ID 或哈希，并保证权限系统不能通过 Trace 越权查看其他租户。

## 9. 客户端脱敏优先

最安全的敏感数据是从未离开应用的数据。Langfuse 当前推荐在 SDK / OpenTelemetry 导出阶段做客户端 masking，例如 `mask_otel_spans`。

优先脱敏：

- API Key、Bearer Token、Cookie；
- 邮箱、手机号、身份证和支付信息；
- 上传文档中的客户机密；
- 工具返回中的数据库连接和内部凭据；
- Agent 读取的本地文件。

自托管的服务端 ingestion masking 可以作为第二道防线，但官方说明事件可能在 masking callback 前先进入对象存储。若敏感数据绝不能离开进程，必须做客户端脱敏。

## 10. 质量评分与用户反馈

Trace 上可以写入 Score，例如：

- 用户点赞 / 点踩；
- 任务是否完成；
- 引用是否存在；
- JSON 是否通过 Schema；
- 人工评分；
- LLM-as-a-Judge 评分。

确定性指标优先用代码评测。语义性强的“是否有帮助”再使用模型评分，并保存评分模型、rubric 和版本。

## 11. 成本与延迟分析

常用切分维度：

- feature / trace name；
- 模型与 Prompt 版本；
- environment 与 release；
- user / session；
- 成功、失败与人工评分。

重点同时看：

- P50 / P95 / P99 延迟；
- 首 Token 与端到端时间；
- 输入、输出和缓存 Token；
- 每成功任务成本，而不是每次模型调用成本；
- 重试和 Agent 循环造成的隐性放大。

## 12. 自托管上线要点

- 使用官方当前 Self-hosting 文档和版本化 Compose / Helm 配置；
- 数据库、ClickHouse、对象存储都有独立备份；
- Key、加密材料和数据库密码使用 Secret 管理器；
- Web、Worker、存储和管理入口分网络权限；
- 升级前阅读迁移说明并在副本演练；
- 为 Trace 和媒体设置数据保留与删除策略；
- 监控 ingestion 延迟、队列、存储与失败事件。

自托管默认长期保存数据并不等于符合你的合规要求；保留期和对象存储生命周期需要主动设计。

## 13. 常见问题

### 页面里看不到 Trace

检查 Base URL、Public / Secret Key 是否属于同一项目、环境过滤器是否正确。短脚本退出前调用 `flush()`。

### Trace 有模型调用但没有完整 Agent 树

OpenAI wrapper 只自动捕获模型调用；检索、工具和业务逻辑需要通过 Langfuse SDK / OpenTelemetry 创建 Span。

### 成本为 0 或模型名不识别

自定义模型可能没有内置价格。显式传递标准模型名或按官方方式配置模型价格，并把展示值与实际账单对账。

### 线上数据混进开发环境

设置 `LANGFUSE_TRACING_ENVIRONMENT`，并把 release / environment 作为部署配置，而不是由用户输入。

### Trace 中出现敏感信息

先停止发送并轮换可能泄露的凭据，再按产品的数据删除能力处理历史数据。随后在客户端增加 masking 测试，不要只依赖人工检查。

## 14. 验收清单

- [ ] 一次业务请求对应清晰 Trace；
- [ ] 模型、检索、工具和最终回答均可定位；
- [ ] development / staging / production 可过滤；
- [ ] 用户和 Session 标识已假名化；
- [ ] Key、PII 和敏感文件在客户端脱敏；
- [ ] 短运行环境不会丢失后台事件；
- [ ] 评分能关联 Prompt、模型和 release；
- [ ] 自托管备份、保留、删除和升级流程已演练。

## 15. 官方来源

- [Langfuse Observability Quickstart](https://langfuse.com/docs/observability/get-started)
- [Langfuse Trace Best Practices](https://langfuse.com/docs/observability/best-practices)
- [Langfuse Event Queuing / Batching](https://langfuse.com/docs/observability/features/queuing-batching)
- [Langfuse Masking](https://langfuse.com/docs/observability/features/masking)
- [Langfuse Self-hosting](https://langfuse.com/self-hosting)
- [Langfuse GitHub 仓库](https://github.com/langfuse/langfuse)
