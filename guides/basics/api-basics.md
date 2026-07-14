# AI API 接入基础：Base URL、API Key、模型 ID 与协议

> [!TIP]
> 本仓库使用 [纽智中转站](https://www.nexotoken.net/?ref=github) 作为中文配置示例：每天 20 次免费额度，新人可用 ¥1 购买 300 积分，支持支付宝与微信直充。活动规则核验于 2026-07-14，请以官网实时页面为准。

[← 返回教程目录](../../README.md)

如果你第一次给 Cherry Studio、Claude Code、Dify 之类的工具配置自定义 API，真正需要理解的只有四件事：**服务地址、密钥、模型 ID、协议**。这篇先把它们讲清楚，再去看具体工具教程会轻松很多。

## 1. 一次请求经过了什么

```text
AI 工具
  └─ 携带 API Key 向 Base URL 发起请求
       └─ 请求某个协议端点，例如 /v1/chat/completions
            └─ 服务根据 model 字段选择模型
                 └─ 以普通 JSON 或流式 SSE 返回结果
```

四个要素缺一不可：

| 要素 | 例子 | 常见错误 |
|---|---|---|
| Base URL | `https://your-api.example.com/v1` | 多写或少写 `/v1`，重复拼接端点 |
| API Key | `YOUR_API_KEY` | 复制不完整、首尾空格、放错字段 |
| 模型 ID | `YOUR_MODEL_ID` | 把展示名称当成真实 ID |
| 协议 | Chat Completions / Responses / Anthropic Messages | 工具和服务支持的协议不一致 |

## 2. Base URL 到底应该填哪一段

Base URL 是客户端拼接接口路径时使用的根地址。不同工具的输入框行为不完全一致：

- 输入框写着 **Base URL / API Host / Endpoint Root**：通常填到 `/v1`。
- 输入框明确写着 **Chat Completions URL**：通常要填完整的 `/v1/chat/completions`。
- 工具会自动显示最终请求地址：以它的预览结果为准，避免出现 `/v1/v1`。
- 教程和服务控制台有明确示例：优先照该示例，不要凭经验补路径。

假设控制台给出的根地址是：

```text
https://your-api.example.com/v1
```

常见端点可能是：

```text
GET  https://your-api.example.com/v1/models
POST https://your-api.example.com/v1/chat/completions
POST https://your-api.example.com/v1/responses
POST https://your-api.example.com/v1/messages
```

最后一个端点属于哪种协议、是否可用，必须以服务说明为准。

### 快速判断路径问题

出现 404 时，按顺序检查：

1. 工具实际请求的完整 URL 是什么；
2. 是否重复出现 `/v1/v1`；
3. 是否把完整端点填进了只需要根地址的输入框；
4. 当前服务是否真的实现了该端点；
5. URL 末尾的斜杠是否触发了错误拼接。

## 3. API Key 如何工作

OpenAI 风格接口通常使用 Bearer 认证：

```http
Authorization: Bearer YOUR_API_KEY
```

Anthropic Messages 风格通常使用专用 Key 请求头，并带协议版本头。正常情况下，客户端会根据你选择的供应商类型自动生成这些请求头；你只需要把 Key 填入密钥框，不要把 `Bearer ` 一并粘贴进去，除非工具明确要求。

### Key 安全底线

- 不把 Key 写进 README、Issue、聊天截图或公开仓库；
- 不把 Key 直接写进前端网页代码；
- 命令行优先使用环境变量或受保护的配置文件；
- 为不同设备或工具创建不同 Key，方便单独撤销；
- 怀疑泄露时立即删除旧 Key 并创建新 Key；
- 日志和报错截图发给别人前，遮住认证头和完整请求体。

示例中的 `YOUR_API_KEY` 永远只是占位符。

## 4. 模型名称和模型 ID 不是一回事

工具界面可能显示一个便于阅读的名称，但请求体里的 `model` 必须是服务实际接受的模型 ID。

```json
{
  "model": "YOUR_MODEL_ID",
  "messages": [
    { "role": "user", "content": "只回复 OK" }
  ]
}
```

正确获取方式：

1. 优先从服务控制台的模型列表复制；
2. 若服务支持模型列表接口，可请求 `/v1/models`；
3. 在客户端中手动添加时，模型 ID 原样粘贴，显示名称可以自定义；
4. 不要根据营销名称自行猜测大小写、连字符或版本后缀。

模型 ID 错误通常表现为 400 或 404，也可能提示模型不存在、无权限或不属于当前分组。

## 5. 三类常见文本生成协议

### OpenAI Chat Completions

典型端点：

```text
POST /v1/chat/completions
```

它围绕 `messages` 数组组织对话，兼容面最广，常见桌面客户端和自部署平台大多支持。

### OpenAI Responses

典型端点：

```text
POST /v1/responses
```

Responses 是较新的统一接口形态，可承载文本、工具调用等能力。Codex CLI 等工具可能依赖它。**支持 Chat Completions 不等于支持 Responses**，接入前必须单独确认。

### Anthropic Messages

典型端点：

```text
POST /v1/messages
```

Claude Code 等 Anthropic 生态工具通常使用 Messages 语义和相应请求头。把 OpenAI 兼容地址直接填进 Anthropic 专用配置不一定能用，除非服务同时实现了该协议或工具自带转换层。

## 6. “兼容”不代表功能完全相同

一个服务能返回普通聊天文本，只说明最基本链路可用。以下能力需要分别验证：

- 流式输出；
- 工具调用 / Function Calling；
- 图片输入与其他多模态内容；
- JSON Schema 或结构化输出；
- Prompt Caching；
- Embeddings 与重排序；
- 文件上传、联网搜索、代码执行；
- 超长上下文和最大输出长度。

对于编程代理，工具调用比“能聊天”重要得多。首次验证应让代理读取一个测试目录、生成计划或修改一个无关紧要的临时文件；不要只问“你好”。

## 7. 最小化连通性测试

先用客户端自带的“测试连接”按钮。如果需要命令行定位问题，可在确认服务支持 Chat Completions 后使用：

```bash
curl --fail-with-body --show-error \
  https://your-api.example.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_MODEL_ID",
    "messages": [{"role":"user","content":"只回复 OK"}],
    "stream": false
  }'
```

注意：在共享终端、Shell 历史或录屏环境中直接写真实 Key 会留下痕迹。更稳妥的方式是临时环境变量：

```bash
read -s API_KEY
export API_KEY
curl --fail-with-body --show-error \
  https://your-api.example.com/v1/models \
  -H "Authorization: Bearer ${API_KEY}"
unset API_KEY
```

## 8. 推荐的接入顺序

1. 在服务控制台复制 Base URL、Key 和模型 ID；
2. 查看本仓库对应工具教程，确认它需要哪种协议；
3. 先添加一个文本模型，关闭复杂插件；
4. 新建空白会话，发送“只回复 OK”；
5. 再测试流式输出、上下文、多模态或工具调用；
6. 最后才调整温度、上下文长度、代理和高级参数。

一次只改变一个变量，排错会快很多。

## 9. 配置记录模板

可以把下面的非敏感信息保存到自己的笔记中，**不要填写完整 Key**：

```text
工具：
工具版本：
操作系统：
供应商类型：OpenAI Compatible / Anthropic Compatible
Base URL：
模型 ID：
协议：Chat Completions / Responses / Messages
流式输出：开启 / 关闭
配置日期：
Key 末四位：
```

## 10. 官方参考

- [OpenAI API Reference：认证、请求 ID 与 REST API](https://platform.openai.com/docs/api-reference/introduction)
- [Anthropic API 文档](https://docs.anthropic.com/en/api/overview)
- [GitHub：在 Markdown 中使用相对链接](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths)

下一步：打开[兼容性总表](./compatibility-matrix.md)选择工具，遇到错误时查阅[通用排错手册](./troubleshooting.md)。
