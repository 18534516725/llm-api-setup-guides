---
title: curl 测试 OpenAI-compatible API：一条命令完成最小冒烟
description: 用 curl 分别测试模型发现、Chat、Responses 和流式接口，定位认证、路径、模型与协议错误。
last_verified: 2026-09-21
---

# curl 测试 OpenAI-compatible API：一条命令完成最小冒烟

**直接结论：先使用 curl 验证服务端，再排查客户端。这样可以把客户端配置问题和 API 本身的问题分开。**

> 本次补充：2026-11-19。新增离线检查与 Responses 验收步骤；未用真实 Key 调用模型，不代表任何平台或模型已通过端到端测试。

## 先检查，不发请求

以下示例适用于 macOS / Linux 的 shell。先在自己的终端设置 `BASE_URL`、`API_KEY`、`MODEL_ID`，不要把 Key 写入文档、截图或版本库。Base URL 使用服务商提供的 API 根路径（通常含 `/v1`），不要填网站首页或完整 `/responses` 路径。

```bash
# 只检查是否设置，不打印变量内容，不联网
for name in BASE_URL API_KEY MODEL_ID; do
  printenv "$name" >/dev/null || echo "$name 尚未导出"
done
```

`GET /models` 只能验证模型发现接口，不能证明有模型调用权限，也不能证明 Responses、流式或工具调用兼容。下面的 POST 会调用模型，可能计费；确认价格与额度后再手动运行。不启用自动重试。输出 Token 上限不是金额上限，超时或断流也不保证不计费。

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

## Responses 流式与工具参数：先生成本地测试文件

在临时目录中运行下面步骤，只会生成 JSON，不发送请求。测试使用无副作用的虚构函数 `echo_marker`，不读取文件、不执行 shell，也不连接外部工具。

```bash
python3 - <<'PYTHON'
import json, os
payload = {
    "model": os.environ["MODEL_ID"],
    "input": "Call echo_marker with marker set to OK.",
    "stream": True,
    "max_output_tokens": 128,
    "tools": [{
        "type": "function",
        "name": "echo_marker",
        "description": "Return a test marker; no external action.",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {"marker": {"type": "string"}},
            "required": ["marker"],
            "additionalProperties": False
        }
    }],
    "tool_choice": {"type": "function", "name": "echo_marker"}
}
with open("responses-smoke.json", "x", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
print("仅生成本地 JSON，尚未发送请求")
PYTHON
python3 -m json.tool responses-smoke.json >/dev/null
```

文件已存在时会停止，避免覆盖原文件。离线 JSON 校验通过只说明语法有效，不说明远端支持这些字段。若只测文本流，使用独立测试文件，将 `input` 改为“只回复 OK”，并移除 `tools` 和 `tool_choice`。

### 可选：确认费用后才发送一次

```bash
curl -N -sS --connect-timeout 10 --max-time 60 \
  -w '\nHTTP_STATUS=%{http_code}\n' \
  "${BASE_URL%/}/responses" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @responses-smoke.json
```

`-N` 关闭 curl 的输出缓冲，并不能关闭服务端代理缓冲。不要加 `-v`、`--trace` 或 `set -x` 后分享输出，避免泄露认证头。终端仍可能显示服务商错误内容，分享前先脱敏。

### 如何判定，而不是看到 200 就算通过

- 文本流：检查 `response.output_text.delta` 以及结束状态，不要用 Chat 的 `choices[].delta` 解析 Responses。
- 函数流：检查 `response.function_call_arguments.done`、最终 `function_call` 项的 `name`、`call_id` 和可解析的 `arguments`；本例期望 `echo_marker` 与 `{"marker":"OK"}`。
- 完整结束：检查 `response.completed`；`response.failed`、`response.incomplete`、错误事件或提前断流都不是完整成功。128 的输出上限可能不足以容纳某些推理模型的推理与输出，不能据此直接判平台不兼容。
- 此处只检查模型生成工具请求，不执行函数，也不发送 `function_call_output`，因此**不是完整工具调用闭环测试，更不是 Codex 全功能验收**。
- 保存状态码、脱敏 request ID、终态和 usage。不要把 `[DONE]`、首个字符或 HTTP 200 单独当成成功证据。

字段依据：[OpenAI 流式响应](https://developers.openai.com/api/docs/guides/streaming-responses)、[函数调用](https://developers.openai.com/api/docs/guides/function-calling)。服务商支持范围和实际计费仍需分别确认。

## 记录什么

记录状态码、响应耗时、request ID、错误类别和模型 ID。不要保存完整 Key、完整用户输入或未脱敏的内部错误。

## 下一步

Chat 成功不代表 Responses 成功；先明确目标客户端使用哪种协议，再做相应验收。参见 [Responses 与 Chat Completions 区别](../basics/responses-vs-chat-completions.md) 和 [Codex CLI 配置与分层排错](../coding-tools/codex-cli.md)。

## 相关教程

- [API Base URL 排查](../basics/api-base-url-path-troubleshooting.md)
- [API 上线前健康检查](../basics/api-health-check.md)
- [Apifox / Postman 测试](apifox-postman.md)

