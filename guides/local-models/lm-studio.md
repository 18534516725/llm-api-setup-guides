# LM Studio 本地模型下载、运行与 API Server 教程

> 最后核验：2026-07-24
>
> 适用范围：LM Studio 0.4.x 及当前桌面版；Windows、macOS、Linux
>
> 预计用时：10～25 分钟（模型下载时间另计）

[← 返回教程目录](../教程总目录.md)

## 1. LM Studio 适合什么场景

LM Studio 提供图形化的模型搜索、下载、加载、聊天和本地 API Server。它既适合第一次尝试本地模型的用户，也适合需要 OpenAI-compatible、Anthropic-compatible 或 LM Studio 原生 REST API 的开发者。

常见用途：

- 不熟悉命令行，希望图形化管理本地模型；
- 用 OpenAI SDK、Codex 或其他兼容客户端连接本地模型；
- 用 Anthropic Messages 兼容端点连接相应开发工具；
- 在开发机上测试流式输出、Embedding、结构化输出和工具调用。

## 2. 安装与选择模型

1. 从 [LM Studio 官网](https://lmstudio.ai/) 下载对应系统版本；
2. 安装并启动；
3. 在模型搜索页输入模型名称；
4. 根据设备内存、显存和用途选择量化版本；
5. 下载完成后进入 Chat 或 Developer 页面加载模型。

第一次选择时不要只看参数量。还要关注：

- 文件大小能否放入内存或显存；
- 模型是否为 Instruct / Chat 版本；
- 是否支持你需要的语言、图片或工具调用；
- 量化等级越低通常越省内存，但质量可能下降；
- 上下文越大，占用的 KV Cache 越多。

## 3. 启动本地服务器

图形界面：

1. 打开 `Developer` 页面；
2. 确认目标模型已下载；
3. 点击 `Start Server`；
4. 默认地址通常为 `http://localhost:1234`。

也可以安装并使用 `lms` CLI：

```bash
npx lmstudio install-cli
lms server start
```

查看服务器状态和本地模型：

```bash
lms server status
lms ls
lms ps
```

## 4. 三类 API 不要混用

LM Studio 当前提供三类入口：

| 类型 | 常用路径 | 适合场景 |
|---|---|---|
| LM Studio 原生 REST API | `/api/v1/*` | 状态化聊天、模型管理、MCP、JIT 加载 |
| OpenAI-compatible | `/v1/chat/completions`、`/v1/responses`、`/v1/embeddings` | OpenAI SDK、Codex 和兼容客户端 |
| Anthropic-compatible | `/v1/messages` | Anthropic SDK 和 Messages 兼容工具 |

配置客户端时要按它要求的协议选择入口。把 `/api/v1/chat` 当成 OpenAI Chat Completions，或把 `/v1/messages` 当成 OpenAI 接口，都会失败。

## 5. OpenAI 兼容接口

OpenAI-compatible Base URL：

```text
http://localhost:1234/v1
```

先列出模型：

```bash
curl http://localhost:1234/v1/models
```

复制返回结果中的真实模型 ID，再测试：

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "这里填写LM Studio返回的模型ID",
    "messages": [
      {"role": "user", "content": "只回复：连接成功"}
    ],
    "stream": false
  }'
```

Python SDK：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
)

response = client.chat.completions.create(
    model="这里填写LM Studio返回的模型ID",
    messages=[
        {"role": "user", "content": "用一句话介绍本地推理"}
    ],
)

print(response.choices[0].message.content)
```

默认未启用认证时，SDK 中的非空 Key 只是满足客户端参数要求；它不是安全边界。

## 6. Responses、Embedding 与工具调用

当前 LM Studio 支持：

- `POST /v1/responses`；
- `POST /v1/chat/completions`；
- `POST /v1/embeddings`；
- `GET /v1/models`；
- 兼容端点中的流式输出和工具调用。

Responses 最小请求：

```bash
curl http://localhost:1234/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "这里填写模型ID",
    "input": "只回复：Responses 正常"
  }'
```

客户端支持某字段，不代表模型本身擅长该能力。工具调用效果取决于模型训练、聊天模板和 LM Studio 对对应格式的解析。第一次验证顺序应为：

1. 纯文本非流式；
2. 纯文本流式；
3. 结构化输出；
4. 单个无副作用工具；
5. 多轮工具调用。

## 7. 原生 REST API

LM Studio 0.4.0 起推荐使用原生 v1 REST API。它与 OpenAI 兼容接口不是同一套路径。

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "这里填写模型ID",
    "input": "只回复：原生 API 正常"
  }'
```

原生 `/api/v1/chat` 支持状态化聊天、模型加载事件等 LM Studio 特有能力。若现有应用已经使用 OpenAI SDK，则无需为了“更新”强行迁移；只有确实需要原生能力时再选择它。

## 8. 启用 API Token

默认 API Server 不要求认证。只在本机使用时仍应避免把端口暴露给不可信程序；一旦允许局域网访问，建议启用认证：

1. 打开 Developer 页的 Server Settings；
2. 开启 `Require Authentication`；
3. 生成 API Token；
4. 在客户端发送 `Authorization: Bearer YOUR_TOKEN`。

测试：

```bash
curl http://localhost:1234/v1/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

启用认证后，旧客户端如果没有更新 Key 会出现 401，这是预期行为。

## 9. 允许局域网访问

图形界面可开启 `Serve on Local Network`。CLI 也可指定监听地址：

```bash
lms server start --bind 0.0.0.0 --port 1234
```

这会扩大攻击面。启用前应：

- 打开 API Token 认证；
- 用防火墙限制来源；
- 不做公网端口映射；
- 不把 Token 写进前端网页；
- 谨慎启用 CORS；
- MCP 能访问文件或外部服务时，保持最小权限。

官方设置中 `Allow calling servers from mcp.json` 会让 API 请求触达本机 MCP，属于高权限功能，并要求先启用认证。不要在不可信网络中开放。

## 10. JIT 加载与资源管理

开启 Just-In-Time Model Loading 后，请求可按需加载模型；自动卸载可以回收闲置资源。但首次请求会更慢，而且多个大模型轮换会频繁占用磁盘、内存和显存带宽。

CLI 手动加载：

```bash
lms load 你的模型ID --identifier local-chat
```

使用稳定别名后，客户端可以固定写：

```text
local-chat
```

这样更换底层模型文件时，不必修改每个客户端的模型字段。修改别名前仍应重新验证上下文、工具和输出能力。

## 11. 接入其他客户端

支持 OpenAI-compatible 的客户端通常填写：

```text
Base URL: http://localhost:1234/v1
API Key: lm-studio（未启用认证时）
Model ID: 以 /v1/models 返回值为准
```

Docker 内的客户端不能用 `localhost` 访问宿主机。Docker Desktop 通常可用：

```text
http://host.docker.internal:1234/v1
```

如果开启认证，API Key 必须改为实际 Token。

## 12. 常见问题

| 现象 | 排查方法 |
|---|---|
| Connection refused | Server 未启动、端口变化或监听地址不对 |
| 401 | 已开启 Require Authentication，但请求未带正确 Token |
| 404 | 混用了 `/api/v1`、OpenAI `/v1` 和 Anthropic `/v1/messages` |
| model not found | 用 `/v1/models` 或 `lms ls` 获取真实模型 ID |
| 首次请求很慢 | JIT 正在加载模型；观察 Developer 日志 |
| 输出乱码或格式异常 | 模型聊天模板不匹配，尝试官方推荐的 Instruct 版本 |
| 工具调用失败 | 模型不擅长工具调用，或客户端与模板格式不兼容 |
| 局域网能访问但浏览器失败 | 检查 CORS；不要在无认证状态下随意开启 |
| 内存不足 | 换更小量化、降低上下文、减少并发或卸载其他模型 |

## 13. 官方资料

- [LM Studio 官网](https://lmstudio.ai/)
- [Local Server 基础](https://lmstudio.ai/docs/developer/core/server)
- [Server Settings](https://lmstudio.ai/docs/developer/core/server/settings)
- [原生 REST API](https://lmstudio.ai/docs/developer/rest)
- [OpenAI-compatible endpoints](https://lmstudio.ai/docs/developer/openai-compat)
- [Anthropic-compatible endpoints](https://lmstudio.ai/docs/developer/anthropic-compat)
- [lms CLI](https://lmstudio.ai/docs/cli)
- [API Changelog](https://lmstudio.ai/docs/developer/api-changelog)
