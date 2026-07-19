# 流式输出、工具调用与长上下文完整测试

> 最后核验：2026-07-19
>
> 适合：普通聊天已经成功，但需要确认编程 Agent、自动化或生产应用是否真正兼容的用户

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

一个接口能回答“你好”，只证明认证、路径和最基础文本链路可用。Claude Code、Codex CLI、Cline、Dify 等工具还依赖流式事件、工具调用、上下文管理、用量统计和错误恢复。本文提供一套从简单到完整的测试顺序。

## 1. 测试前准备

准备：

- 一个只用于测试的 Key；
- 明确的 Base URL、模型 ID 和协议；
- curl 以及可选的 Apifox / Postman；
- 一个不含真实数据的测试目录；
- 一份测试记录表。

```bash
export AI_BASE_URL="https://your-api.example.com/v1"
read -s AI_API_KEY
export AI_API_KEY
export AI_MODEL_ID="YOUR_MODEL_ID"
```

不要在录屏、共享终端或 Issue 中直接粘贴真实 Key。测试完成后执行：

```bash
unset AI_API_KEY
```

## 2. 建立测试基线

先发送非流式、低随机性的最小请求：

```bash
curl --fail-with-body --show-error \
  "$AI_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$AI_MODEL_ID\",
    \"messages\": [{\"role\": \"user\", \"content\": \"只回复 BASELINE_OK\"}],
    \"stream\": false,
    \"temperature\": 0
  }"
```

保存完整响应到本地受保护的测试记录中，重点看：

- 状态码与 `Content-Type`；
- 模型 ID；
- 正文所在字段；
- 停止原因；
- `usage`；
- 请求 ID；
- 首次响应和总耗时。

后面的测试都应与这个基线使用同一个模型和相近时间段，减少无关变量。

## 3. 测试 SSE 是否真的流式

### Chat Completions

```bash
curl -N --fail-with-body --show-error \
  "$AI_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$AI_MODEL_ID\",
    \"messages\": [{\"role\": \"user\", \"content\": \"分五行解释什么是流式输出\"}],
    \"stream\": true
  }"
```

`-N` 会关闭 curl 的输出缓冲。合格结果应当：

- 很快出现第一个事件，而不是结束时一次性显示；
- 多个 `data:` 片段依次到达；
- 每个 JSON 片段能按协议解析；
- 正常出现结束标记或完成事件；
- 连接结束前没有混入 HTML 错误页。

### Responses API

只有服务明确支持 Responses 时才测试：

```bash
curl -N --fail-with-body --show-error \
  "$AI_BASE_URL/responses" \
  -H "Authorization: Bearer $AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$AI_MODEL_ID\",
    \"input\": \"分五行解释什么是流式输出\",
    \"stream\": true
  }"
```

Responses 使用有类型的语义事件。至少应能处理创建、文本增量、完成和错误事件，不能照搬 Chat Completions 的结束逻辑。

### Anthropic Messages

Anthropic 风格接口通常需要专用认证头与版本头，且 Base URL 拼接规则由服务文档决定：

```bash
curl -N --fail-with-body --show-error \
  "https://your-api.example.com/v1/messages" \
  -H "x-api-key: $AI_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "{
    \"model\": \"$AI_MODEL_ID\",
    \"max_tokens\": 512,
    \"messages\": [{\"role\": \"user\", \"content\": \"分五行解释什么是流式输出\"}],
    \"stream\": true
  }"
```

Messages 流包含 `message_start`、内容块事件、`message_delta` 和 `message_stop` 等事件。实现应允许未来出现未知事件类型，而不是遇到新事件就崩溃。

## 4. 定位“伪流式”和缓冲

如果响应最后一次性出现，分别测试：

1. 直连接口；
2. 经过 Nginx / CDN / 网关；
3. 经过最终客户端。

| 现象 | 可能位置 |
|---|---|
| 直连就一次性返回 | 上游或接口实现未流式 flush |
| 直连正常、Nginx 后缓冲 | 代理缓冲或压缩配置 |
| curl 正常、客户端一次性显示 | 客户端事件解析或 UI 更新 |
| 开始正常、中途断开 | 读取超时、网络中断或流中错误 |
| 返回 HTML | CDN、鉴权页或反向代理错误页 |

不要只把超时调大。首先确认事件是否持续到达、代理是否缓冲以及客户端是否正确解析不同协议。

## 5. 测试流中错误

SSE 返回 HTTP 200 后仍可能出现错误事件。客户端需要同时处理：

- 建连前的 HTTP 4xx / 5xx；
- 建连后的协议错误事件；
- 没有完成事件的意外断流；
- 用户主动取消；
- JSON 片段跨多个网络包；
- 心跳或未知事件。

测试记录应区分“HTTP 成功”和“生成完整成功”。只统计 200 会高估可用率。

## 6. 工具调用第一轮：模型是否返回结构化调用

Chat Completions 示例：

```json
{
  "model": "YOUR_MODEL_ID",
  "messages": [
    { "role": "user", "content": "查询订单 A-100 的状态，必须使用工具。" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_order_status",
        "description": "按订单号查询订单状态",
        "parameters": {
          "type": "object",
          "properties": {
            "order_id": {
              "type": "string",
              "description": "订单号，例如 A-100"
            }
          },
          "required": ["order_id"],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

预期是结构化的工具名称、调用 ID 和 JSON 参数，而不是模型用自然语言说“我调用了工具”。

检查：

- 工具名称完全匹配；
- 参数是合法 JSON；
- `order_id` 值正确；
- 没有编造未提供的工具；
- 停止原因与工具调用一致；
- 流式模式下参数片段能正确合并。

永远把模型生成的工具参数当作不可信输入，在执行前做 Schema、权限和业务校验。

## 7. 工具调用第二轮：回传结果并完成回答

真正的工具链路至少有两次模型交互：

1. 应用把工具定义发给模型；
2. 模型请求调用 `get_order_status`；
3. 应用校验参数并执行本地函数；
4. 应用把 `{"status":"shipped"}` 与对应调用 ID 发回；
5. 模型根据结果生成最终回答。

第二轮必须保留协议要求的调用 ID 和上下文。若只测第一轮，无法发现这些问题：

- 工具结果角色或内容块格式错误；
- 调用 ID 丢失；
- 模型收到结果后再次重复调用；
- 多个并行工具结果顺序错乱；
- 推理模型所需的响应项目未被保留。

完整通过标准：应用真实执行了一个无副作用的测试函数，并得到引用该结果的最终回答。

## 8. 测试多个工具与拒绝执行

再增加两个安全工具，例如 `search_docs` 和 `get_time`，测试：

- 模型能否选对工具；
- 缺少必填参数时是否先询问；
- `tool_choice: none` 时是否停止调用；
- 强制指定工具时是否遵从；
- 工具返回错误时是否能解释或重试；
- 达到最大轮数时应用是否停止。

涉及转账、删除、发消息或执行命令的工具必须有人类审批和服务端权限校验。提示词中的“请先确认”不能替代代码层控制。

## 9. 多轮上下文测试

使用不依赖外部知识的合成事实：

```text
第 1 轮：记住测试项目代号是 LIME-742，不要解释。
第 2 轮：项目颜色是银色。
第 3 轮：只回复项目代号和颜色。
```

检查客户端是否正确携带历史、角色顺序是否正确，以及切换模型或 Provider 后上下文是否仍按预期处理。

不能只凭模型碰巧答对常识判断上下文有效，因此应使用随机、无现实含义的测试值。

## 10. 长上下文分层测试

不要一上来发送最大窗口。按阶梯增加合成文档长度：

```text
短：约 2K Token
中：约 8K Token
长：约 32K Token
更长：按目标模型和服务文档确定
```

在文档开头、中间和结尾分别放置唯一标记：

```text
BEGIN_MARKER=ALPHA_731
MIDDLE_MARKER=BRAVO_284
END_MARKER=CHARLIE_965
```

让模型只返回三个标记及所在章节。检查：

- 请求是否被接受；
- 三处内容是否都可检索；
- 输入 Token 是否与预估数量大致一致；
- 是否出现静默截断；
- 总耗时和首 Token 时间如何变化；
- 接近窗口时返回明确错误还是丢弃旧内容。

这种“标记检索”只能测试传输、基本召回和截断，不能证明模型在所有长文任务上的理解质量。正式场景还应使用代表性任务评测摘要、引用和跨段推理。

## 11. 最大输出与停止原因

分别设置很小和正常的输出上限：

- 小上限用于确认 `max_tokens`、`max_output_tokens` 或协议对应字段是否生效；
- 正常上限用于确认完整输出；
- 检查达到限制时是否返回明确停止原因；
- 流式模式中检查最后一个增量和完成事件是否一致。

客户端不能把因长度限制而中断的内容标记为“完整成功”。对于 JSON、代码补丁和工具参数，截断可能导致语法无效。

## 12. Usage 完整性测试

至少检查：

| 字段 | 要确认的事情 |
|---|---|
| 输入 Token | 是否包含系统提示、历史和工具定义 |
| 输出 Token | 是否覆盖文本、工具参数及协议定义内容 |
| 总 Token | 是否与分项逻辑一致 |
| 缓存读取 | 重复前缀后是否出现且可对账 |
| 缓存创建 | 是否按服务规则记录 |
| 推理 Token | 目标模型若提供，客户端是否保留 |

某些协议的流式 Usage 只在最后事件出现。客户端若在收到正文后提前关闭连接，可能丢失最终用量。

## 13. 并发、429 与退避

只在服务允许范围内做低强度并发测试。从 1 个并发逐步增加，不要直接压到高并发。

合格客户端应：

- 识别 429；
- 优先遵守 `retry-after`；
- 使用指数退避并加入随机抖动；
- 设置最大重试次数和总超时；
- 不重试认证、权限和参数错误；
- 防止多个任务同时重试形成尖峰；
- 能在日志中关联原请求与重试请求。

Anthropic 官方文档提醒，流量突然增长也可能触发加速限制；平滑提升流量比瞬间突发更可靠。

## 14. 编程 Agent 的最终验收

在一个临时 Git 仓库或无关紧要的测试目录中准备：

```text
agent-test/
├── README.md
├── input.txt
└── expected/
```

依次让 Agent：

1. 只读目录并概括文件；
2. 提出修改计划，不执行；
3. 经人工批准后创建一个新文件；
4. 读取新文件并验证内容；
5. 展示变更差异；
6. 遇到故意设置的无权限路径时停止并解释。

通过标准：

- 文件读取、写入和反馈均由合法工具调用完成；
- 审批设置有效；
- 没有越过测试目录；
- 工具失败后不会无限循环；
- 最终说明与真实文件变化一致；
- 用量和模型轮次可以查看。

不要用真实项目作为第一次 Agent 兼容性测试。

## 15. 测试记录模板

```text
测试日期：
工具及版本：
操作系统：
协议：Chat Completions / Responses / Messages
Base URL：仅记录非敏感地址
模型 ID：
Key：只记末四位

非流式：通过 / 失败
SSE 首 Token 时间：
SSE 完整结束：通过 / 失败
工具调用第一轮：通过 / 失败
工具结果回传：通过 / 失败
多轮上下文：通过 / 失败
长上下文档位：
截断行为：
Usage 完整：通过 / 失败
429 恢复：通过 / 失败
Agent 文件工具：通过 / 失败

请求 ID：
脱敏错误信息：
结论与待办：
```

## 16. 官方参考

- [OpenAI：流式响应](https://developers.openai.com/api/docs/guides/streaming-responses)
- [OpenAI：Function Calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：对话状态与上下文窗口](https://developers.openai.com/api/docs/guides/conversation-state)
- [Anthropic：流式 Messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Anthropic：Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Anthropic：上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Anthropic：API 错误](https://platform.claude.com/docs/en/api/errors)

通过后，把结果填入[兼容 API 上线评分表](./compatible-api-evaluation.md)；遇到具体状态码时查看[通用排错手册](./troubleshooting.md)。
