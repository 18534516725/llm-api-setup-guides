# AI API 限流、重试与并发控制实战

> 最后核验：2026-07-23
>
> 适合：遇到 429、偶发 5xx、批量任务失败，或准备把 AI 调用接入生产应用的用户

[← 返回教程目录](../教程总目录.md)

429 不等于接口坏了。它通常表示请求速率、Token 速率、并发或额度中的某一项达到限制。可靠的客户端需要同时做到：看懂限制、控制发送速度、只重试临时错误，并避免重复产生副作用。

## 1. 常见限制维度

| 维度 | 含义 | 常见触发场景 |
|---|---|---|
| RPM | 每分钟请求数 | 大量短请求 |
| TPM | 每分钟 Token 数 | 长上下文或大输出 |
| 输入 TPM | 输入 Token 速率 | 批量文档、RAG |
| 输出 TPM | 输出 Token 速率 | 长篇生成 |
| 并发数 | 同时进行的请求 | Agent、多用户、队列突发 |
| 日/月额度 | 使用或消费上限 | 预算耗尽 |

平均速率低不代表不会限流。很多服务使用令牌桶等机制，几秒内的突发流量也可能触发 429。

## 2. 先读取响应信息

出现错误时保存脱敏后的：

- HTTP 状态码；
- `retry-after`；
- 限流相关响应头；
- 请求 ID；
- 错误类型；
- 模型与时间；
- 本次预计输入和输出规模。

不要在日志中记录完整 Key、敏感提示词或原始业务数据。

如果响应提供 `retry-after`，应优先遵守。没有该字段时，再使用带随机抖动的指数退避。

## 3. 哪些错误可以重试

| 情况 | 自动重试 | 说明 |
|---|:---:|---|
| 400 请求格式错误 | 否 | 修改参数或协议 |
| 401 认证失败 | 否 | 检查或轮换 Key |
| 403 权限不足 | 否 | 检查项目和模型权限 |
| 404 路径或模型不存在 | 否 | 修正 Base URL 或模型 ID |
| 408 / 网络瞬断 | 有限 | 请求可能已到达服务端 |
| 409 冲突 | 视接口 | 先理解冲突语义 |
| 429 限流 | 是 | 遵守 `retry-after` |
| 500 / 502 / 503 / 529 | 有限 | 退避后重试 |
| 流式响应中途断开 | 谨慎 | 不能简单拼接两次输出 |

不要把所有异常都放进无限循环。重试必须有次数、总时间和预算上限。

## 4. 指数退避加抖动

一种常用计算：

```text
等待时间 = min(上限, 基础时间 × 2^尝试次数) + 随机抖动
```

例如基础时间 0.5 秒、上限 8 秒：

```text
第 1 次：约 0.5～1.0 秒
第 2 次：约 1.0～1.5 秒
第 3 次：约 2.0～2.5 秒
第 4 次：约 4.0～4.5 秒
```

随机抖动能避免大量客户端在同一时刻再次请求，形成“惊群”。

## 5. JavaScript 重试示例

```javascript
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(send, {
  maxAttempts = 4,
  baseDelayMs = 500,
  maxDelayMs = 8000,
} = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await send();
    } catch (error) {
      lastError = error;
      const status = error?.status;
      const retryable =
        status === 408 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 529;

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const retryAfterSeconds = Number(error?.headers?.get?.("retry-after"));
      const retryAfterMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : 0;
      const backoffMs = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** (attempt - 1)
      );
      const jitterMs = Math.floor(Math.random() * 500);

      await sleep(Math.max(retryAfterMs, backoffMs + jitterMs));
    }
  }

  throw lastError;
}
```

实际 SDK 的错误对象结构可能不同，应按当前 SDK 文档读取状态码和响应头。官方 SDK 若已经内置重试，不要在外层再叠加大量重试。

## 6. Python 重试示例

```python
import random
import time

RETRYABLE_STATUS = {408, 429, 500, 502, 503, 529}

def request_with_retry(send, max_attempts=4):
    last_error = None

    for attempt in range(max_attempts):
        try:
            return send()
        except Exception as error:
            last_error = error
            status = getattr(error, "status_code", None)

            if status not in RETRYABLE_STATUS or attempt == max_attempts - 1:
                raise

            delay = min(8.0, 0.5 * (2 ** attempt))
            time.sleep(delay + random.uniform(0, 0.5))

    raise last_error
```

生产代码还应处理 `retry-after`、总截止时间、取消信号和日志指标。

## 7. 给整个操作设置截止时间

单次超时和总截止时间不是一回事：

```text
单次请求超时：30 秒
最多尝试：4 次
整个操作截止：60 秒
```

如果没有总截止时间，多个超时和退避相加可能让用户等待几分钟。交互式聊天通常应更快失败；离线批处理可以等待更久，但必须可取消。

## 8. 用队列控制并发

不要对几百条数据直接 `Promise.all()`。应限制并发：

```javascript
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, run)
  );
  return results;
}
```

从小并发开始，观察 429、延迟和 Token 消耗后逐步提高。服务官方文档也建议逐渐爬升流量，避免突然放大。

## 9. 请求数不高为什么仍然 429

可能原因：

- 单次上下文太长，触发 Token 速率；
- `max_tokens` 设置很大，系统按预估输出计入限制；
- 多个进程共用同一项目额度；
- Agent 一次用户操作产生多轮模型调用；
- SDK 与业务层都在重试；
- 定时任务在整点同时启动；
- 限制按更短时间窗口执行；
- 已达到消费或账户额度。

排查时要看全局流量，而不是只看当前函数。

## 10. 流式请求中断怎样处理

流式响应在 HTTP 200 后仍可能出现错误或断开。处理策略：

1. 标记输出是否收到正式完成事件；
2. 记录已显示给用户的内容长度；
3. 不把第二次生成直接拼到第一次后面；
4. 允许用户选择“重新生成”或“从已知上下文继续”；
5. 工具调用中断时检查工具是否已经执行；
6. 计费和用量以服务实际记录为准。

对于会写数据的工具，重试前必须确认前一次是否已经产生副作用。

## 11. 幂等与重复操作

文本生成通常可以重新请求，但以下动作不能盲目重试：

- 创建订单；
- 付款或退款；
- 发邮件和消息；
- 写数据库；
- 删除文件；
- 提交代码或发布内容。

可用手段：

- 服务支持时使用幂等键；
- 给业务操作生成唯一任务 ID；
- 执行前查询状态；
- 保存工具调用 ID 与结果；
- 把“模型生成参数”和“实际执行动作”分开；
- 高风险动作要求人工确认。

## 12. 重试预算

重试会增加 Token 和费用。建议同时限制：

```text
每次操作最多尝试次数
每次操作最长时间
每个用户并发数
每分钟请求与 Token 预算
每天费用预算
Agent 最大工具轮数
```

当系统已明显过载时，快速失败并排队通常比持续重试更可靠。

## 13. 监控哪些指标

| 指标 | 目的 |
|---|---|
| 请求成功率 | 判断总体可用性 |
| 429 比例 | 判断容量和突发问题 |
| 重试后成功率 | 判断重试是否有效 |
| 平均尝试次数 | 发现隐藏的成本 |
| 首 Token 时间 | 观察交互体验 |
| 总耗时 P50/P95/P99 | 发现长尾 |
| 输入/输出 Token | 容量和成本规划 |
| 队列长度与等待时间 | 判断是否需要扩容或降载 |
| 中途断流率 | 发现流式链路问题 |

日志应能通过请求 ID 定位，但不保存完整敏感内容。

## 14. 上线前测试

- [ ] 400、401、403、404 不会自动重试；
- [ ] 429 会优先遵守 `retry-after`；
- [ ] 5xx 使用有限的指数退避和抖动；
- [ ] SDK 重试与业务重试没有重复叠加；
- [ ] 每个操作有总截止时间；
- [ ] 批处理有队列和并发上限；
- [ ] 流式中断不会被当成完整成功；
- [ ] 有副作用的工具调用具备幂等保护；
- [ ] 重试次数和额外 Token 可监控；
- [ ] 达到预算时能停止而不是继续消耗。

## 15. 官方参考

- [Anthropic：Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Anthropic：Errors](https://platform.claude.com/docs/en/api/errors)
- [OpenAI：Rate limits guide](https://platform.openai.com/docs/guides/rate-limits)

下一步：使用[流式、工具与长上下文完整测试](./streaming-tools-context-testing.md)验证客户端，再用[兼容 API 上线验收清单](./compatible-api-evaluation.md)做完整记录。
