# 使用 Apifox / Postman 测试 OpenAI 兼容 API：从 401 到 SSE

> 最后核验：2026-07-15
>
> 适用范围：Apifox、Postman；Models、Chat Completions、Responses 与流式响应基础验证

[← 返回教程目录](../../README.md)

> [!TIP]
> **需要一个接口完成调试练习？**
>
> [纽智中转站](https://www.nexotoken.net/?ref=github) 提供多模型 API、每天免费额度和新人体验额度。创建 Key 后从控制台复制 Base URL 与模型 ID，再按本文测试；活动和模型状态以官网实时页面为准。

## 1. 为什么先用 API 调试工具

客户端报错时，问题可能来自客户端配置、网络、API 地址、模型权限或协议兼容。先在 Apifox/Postman 发送一个最小请求，可以把范围缩小：

- 调试工具也失败：优先检查 API、Key、地址和协议；
- 调试工具成功、客户端失败：检查客户端如何拼接路径、认证头和请求字段；
- 非流式成功、流式失败：检查 SSE 和反向代理；
- 普通聊天成功、工具失败：检查 Function Calling，而不是继续测试问答。

## 2. 创建环境变量

建立一个名为“AI API 测试”的环境，添加：

| 变量 | 示例值 | 是否敏感 |
|---|---|:---:|
| `base_url` | `https://your-api.example.com/v1` | 否 |
| `api_key` | 真实 Key | 是 |
| `model_id` | 控制台中的真实模型 ID | 否 |

请求中使用：

```text
{{base_url}}
{{api_key}}
{{model_id}}
```

Postman 推荐把 Key 放入 Vault 或标记为 sensitive 的变量；Apifox 中使用环境的私密值。本地值、共享值和导出文件的行为不同，分享 Collection 前必须检查实际导出内容。

## 3. 测试模型列表

新建 GET 请求：

```http
GET {{base_url}}/models
Authorization: Bearer {{api_key}}
```

发送后重点看：

- HTTP 状态码是否为 200；
- 返回是否包含 `data` 数组；
- 目标 `{{model_id}}` 是否在列表中；
- 响应 Header 是否有 request ID，可在排错时提供脱敏值。

有些服务不开放 `/models`，此时 404 不等于聊天接口不可用。按控制台给出的模型 ID 继续最小聊天测试。

## 4. 测试 Chat Completions

新建 POST 请求：

```http
POST {{base_url}}/chat/completions
Authorization: Bearer {{api_key}}
Content-Type: application/json
```

Body 选择 raw JSON：

```json
{
  "model": "{{model_id}}",
  "messages": [
    { "role": "user", "content": "只回复 OK" }
  ],
  "stream": false,
  "temperature": 0
}
```

成功时通常包含 `choices[0].message.content` 和 `usage`。兼容服务可能不返回所有可选字段，客户端真正依赖哪些字段仍需按目标工具验证。

## 5. 测试 Responses API

只有服务明确支持 Responses 时才创建：

```http
POST {{base_url}}/responses
Authorization: Bearer {{api_key}}
Content-Type: application/json
```

```json
{
  "model": "{{model_id}}",
  "input": "只回复 OK"
}
```

Responses 与 Chat Completions 的请求、响应和流事件不同。`/chat/completions` 返回 200 而 `/responses` 返回 404，通常表示服务只实现前者。

## 6. 在 Apifox 中调试 SSE

Apifox 提供 SSE 调试入口。将 Chat Completions Body 改为：

```json
{
  "model": "{{model_id}}",
  "messages": [
    { "role": "user", "content": "分三段介绍流式输出" }
  ],
  "stream": true
}
```

正确流式响应通常具备：

- `Content-Type` 与事件流匹配；
- 多个 `data:` 事件逐步到达，而不是最后一次性出现；
- 每个事件是客户端能解析的 JSON；
- Chat Completions 流以协议定义的结束标记结束；
- 连接结束后没有额外 HTML 错误页。

若所有内容最后一次性出现，检查 Nginx/CDN 缓冲、压缩、读取超时和服务端 flush，而不是只调大客户端超时。

## 7. 在 Postman 中检查流式响应

使用相同请求并观察响应是否增量显示。不同 Postman 版本对 SSE 的展示方式可能变化；如果界面不能清晰反映到达时间，再用 curl 交叉验证：

```bash
curl -N "https://your-api.example.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_MODEL_ID",
    "messages": [{"role":"user","content":"只回复 OK"}],
    "stream": true
  }'
```

不要把带真实 Key 的 curl 命令贴到群聊、Issue 或截图中。

## 8. 测试 Function Calling

Chat Completions 示例：

```json
{
  "model": "{{model_id}}",
  "messages": [
    { "role": "user", "content": "北京现在几点？必须调用工具。" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_time",
        "description": "获取指定城市的当前时间",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

预期响应应包含结构化工具名称和参数，而不是只用文字声称“已经调用”。完整 Agent 验证还要把工具结果作为下一轮消息发回模型。

## 9. 用测试脚本做基础断言

Postman Tests 或 Apifox 后置脚本可以写基础断言：

```javascript
pm.test("状态码为 200", function () {
  pm.response.to.have.status(200);
});

pm.test("返回 JSON", function () {
  pm.response.to.be.json;
});

pm.test("包含 choices 或 output", function () {
  const body = pm.response.json();
  pm.expect(Boolean(body.choices || body.output)).to.eql(true);
});
```

不要断言模型必须逐字输出固定长文本。生成式模型存在自然波动，协议测试应主要检查状态、字段类型和关键结构。

## 10. 按状态码排查

| 状态 | 常见原因 | 下一步 |
|---|---|---|
| 400 | JSON、模型字段或协议不兼容 | 从最小 Body 开始逐项增加字段 |
| 401 | Key 缺失、过期或认证头错误 | 检查环境变量与 Bearer 格式，不打印完整 Key |
| 403 | 模型/账户无权限 | 检查 Key 分组、模型授权和账户状态 |
| 404 | Base URL 或资源路径错误 | 检查是否重复 `/v1`、是否误用 Responses |
| 408/504 | 请求或网关超时 | 缩短输入，检查服务端和反向代理超时 |
| 429 | 频率、并发或额度限制 | 降低并发，读取 Retry-After，有限重试 |
| 5xx | 服务端或上游异常 | 保存时间、脱敏 request ID 与最小复现请求 |

## 11. 导出和分享前检查

- 删除环境中的真实 Key 和 Token；
- 检查 Collection、示例响应、控制台日志和脚本变量；
- 删除私人提示词、上传文件、客户数据和内部域名；
- 截图遮挡 Authorization、Cookie、邮箱和余额；
- 公开复现只保留占位符、状态码、协议和脱敏 request ID；
- 怀疑 Key 泄露时先撤销并新建，不要只删除帖子。

## 12. 官方来源

- [Apifox API 调试文档](https://docs.apifox.com/)
- [Apifox SSE 调试](https://docs.apifox.com/sse)
- [Postman 发送请求](https://learning.postman.com/docs/sending-requests/requests/)
- [Postman Variables 与 Vault](https://learning.postman.com/docs/use/send-requests/variables/variables/)
