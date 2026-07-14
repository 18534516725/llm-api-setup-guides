# NextChat 接入 OpenAI 兼容 API：网页、Docker 与自定义模型完整教程

> 最后核验：2026-07-14
>
> 适用范围：NextChat（原 ChatGPT-Next-Web）当前版本
>
> 推荐方式：个人使用可在设置页配置；多人使用建议 Docker 自托管并设置访问密码

[← 返回教程目录](../../README.md)

> [!TIP]
> **还没有可接入 NextChat 的 API？**
>
> 本教程可直接配合 **[纽智中转站](https://www.nexotoken.net/?ref=github)** 使用：每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。创建 Key 后，请从控制台复制 Base URL 和准确的模型 ID。
>
> **[👉 立即注册并获取 API Key](https://www.nexotoken.net/?ref=github)**

## 1. NextChat 适合什么场景

NextChat 是轻量、跨平台的聊天客户端和可自托管 Web 应用，适合：

- 想快速搭建个人 AI 聊天网页；
- 需要自定义 OpenAI 兼容 Base URL；
- 希望用环境变量统一配置模型和密钥；
- 需要在桌面、移动端或浏览器使用相近界面。

它的部署负担比完整知识库平台小，但权限管理相对简单。把实例开放给多人时，必须设置 `CODE` 或在外层增加可靠的身份认证。

## 2. 两种配置模式

| 模式 | Key 在哪里 | 特点 |
|---|---|---|
| 用户自行配置 | 每个用户在设置页填写 | 部署者不承担用户调用费用 |
| 服务器统一配置 | `OPENAI_API_KEY` 环境变量 | 用户输入访问密码后共享服务器 Key |

个人使用可以直接在设置页填写。公开或多人部署应优先采用服务器统一配置，并限制谁能访问。

## 3. 你需要准备什么

- OpenAI 兼容 API Key；
- Base URL，通常填到服务根地址或 `/v1` 前缀，以控制台说明为准；
- 准确的模型 ID；
- Docker 20+（使用容器部署时）；
- 一段与 API Key 不同的访问密码。

示例统一使用：

```text
Base URL: https://api.example.com
API Key:  YOUR_API_KEY
模型 ID:  model-id-1
```

NextChat 官方 `BASE_URL` 的默认值是 `https://api.openai.com`。它会在内部拼接 API 路径，因此某些部署应填域名根地址，某些兼容服务则要求包含 `/v1`。优先复制服务控制台专门标注的 NextChat/OpenAI Base URL。

## 4. 方法一：在 NextChat 设置页配置

打开 NextChat 后：

1. 点击左下角或侧边栏的“设置”；
2. 找到“模型服务商”或 OpenAI 配置；
3. 在 `API Key` 中粘贴自己的 Key；
4. 在“接口地址”或 `Endpoint` 中填 Base URL；
5. 在“自定义模型”中加入准确模型 ID；
6. 保存并返回聊天页；
7. 新建对话并选择刚添加的模型。

如果页面只提供 Endpoint 而没有单独的 `/v1` 说明，按服务控制台给出的客户端配置填写，不要直接填完整 `/chat/completions`。

> [!WARNING]
> 浏览器版的用户侧 Key 会保存在浏览器本地存储中。不要在公共电脑使用，也不要把包含配置参数的分享链接发到公开群聊。

## 5. 方法二：Docker 自托管

拉取官方镜像：

```bash
docker pull yidadaa/chatgpt-next-web
```

仅监听本机并配置兼容 API：

```bash
docker run -d \
  --name nextchat \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e OPENAI_API_KEY=YOUR_API_KEY \
  -e BASE_URL=https://api.example.com \
  -e CODE=YOUR_ACCESS_PASSWORD \
  -e CUSTOM_MODELS=+model-id-1,+model-id-2 \
  yidadaa/chatgpt-next-web
```

打开：

```text
http://localhost:3000
```

首次进入时输入 `CODE` 设置的访问密码。

## 6. 使用 Docker Compose

长期维护更适合 Compose：

```yaml
services:
  nextchat:
    image: yidadaa/chatgpt-next-web
    container_name: nextchat
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      BASE_URL: ${BASE_URL}
      CODE: ${NEXTCHAT_ACCESS_CODE}
      CUSTOM_MODELS: ${CUSTOM_MODELS}
    restart: unless-stopped
```

在同目录创建不提交到 Git 的 `.env`：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
BASE_URL=https://api.example.com
NEXTCHAT_ACCESS_CODE=YOUR_ACCESS_PASSWORD
CUSTOM_MODELS=+model-id-1,+model-id-2
```

启动与查看日志：

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=200 nextchat
```

## 7. 环境变量详解

| 变量 | 用途 | 建议 |
|---|---|---|
| `OPENAI_API_KEY` | 服务器统一使用的 API Key | 不写入镜像，不提交 Git |
| `BASE_URL` | 覆盖 OpenAI API 地址 | 使用控制台给出的 Base URL |
| `CODE` | 页面访问密码，可用英文逗号分隔多个 | 公网部署必须设置 |
| `CUSTOM_MODELS` | 添加、隐藏或重命名模型 | 用于兼容服务的模型列表 |
| `HIDE_USER_API_KEY` | 设为 `1` 后隐藏用户 Key 输入 | 统一管理 Key 时可开启 |
| `DISABLE_FAST_LINK` | 设为 `1` 后禁用从 URL 解析预设 | 公网实例建议评估开启 |
| `ENABLE_BALANCE_QUERY` | 是否启用余额查询 | 兼容服务未实现时保持关闭 |

环境变量变化后需要重新部署或重新创建容器才会生效。

## 8. `CUSTOM_MODELS` 的完整语法

官方支持三种操作：

```dotenv
CUSTOM_MODELS=+model-id-1,-old-model,model-id-2=友好显示名
```

- `+模型ID`：增加模型；
- `-模型ID`：隐藏内置模型；
- `模型ID=显示名`：自定义界面显示名；
- 多项使用英文逗号分隔。

推荐先只添加一个模型：

```dotenv
CUSTOM_MODELS=+model-id-1
```

验证成功后再批量添加，以免无法判断是哪一个 ID 写错。

## 9. Base URL 规则与路径判断

常见兼容接口最终请求形态是：

```text
POST https://api.example.com/v1/chat/completions
```

但 `BASE_URL` 是否包含 `/v1` 取决于兼容服务给 NextChat 的地址形式。判断方法：

1. 先看服务控制台的 NextChat 配置示例；
2. 没有专用示例时，看 OpenAI SDK 的 `baseURL` 示例；
3. 请求 404 时查看 NextChat 日志中的最终路径；
4. 如果出现 `/v1/v1/`，去掉一层 `/v1`；
5. 如果请求直接到 `/chat/completions` 而服务要求 `/v1/chat/completions`，补上 `/v1`。

不要把完整 `/chat/completions` 填进 `BASE_URL`。

## 10. 首次验证

按最小变量原则测试：

1. 只配置一个 Key、一个 Base URL、一个模型；
2. 新建空白对话；
3. 关闭联网、插件、MCP、附件和图片；
4. 发送“只回复 OK”；
5. 等待流式响应正常结束；
6. 在服务控制台核对请求与用量。

成功后再设置系统提示词、上下文条数、温度和其他高级功能。

## 11. 会话参数建议

| 参数 | 建议起点 | 说明 |
|---|---:|---|
| Temperature | `0.3`～`0.7` | 越低通常越稳定 |
| Top P | 默认 | 不熟悉时不与温度同时大幅调整 |
| 上下文消息数 | 较小值开始 | 历史越长，输入 Token 越多 |
| 最大输出 | 中等值 | 过大可能增加延迟和费用 |
| 流式输出 | 开启 | 兼容服务 SSE 有问题时临时关闭排查 |

这些只是客户端请求参数，模型或兼容接口可能忽略不支持的字段。

## 12. 流式、图片、工具与 MCP 限制

- 流式输出要求接口正确实现 SSE；
- 图片输入要求模型本身支持视觉，并接受 OpenAI 风格的多模态消息；
- 自定义模型不代表自动具备图片或工具能力；
- MCP 需要部署时设置 `ENABLE_MCP=true`，还需要单独配置 MCP 服务；
- 兼容 API 只实现基础 Chat Completions 时，高级功能可能不可用。

遇到问题时，先退回普通文本聊天，而不是同时排查模型、工具和客户端。

## 13. 多人部署的权限设计

### 共享服务器 Key

配置 `OPENAI_API_KEY` 和 `CODE`。优点是用户不用管理 Key，缺点是所有请求共享同一额度。

### 用户自带 Key

不向用户提供服务器 Key，让每个人在设置页填写自己的 Key。适合人数较少、彼此独立的场景。

### 隐藏用户 Key 输入

服务器统一提供 Key 时可以设置：

```dotenv
HIDE_USER_API_KEY=1
```

但它不是企业级权限系统。正式团队场景还应在反向代理或统一身份平台增加登录、访问审计和速率限制。

## 14. 公网安全清单

- 必须配置 `CODE`，且不要与 API Key 相同；
- 使用 HTTPS；
- 关闭不需要的用户 Key 输入和快速链接解析；
- 不在公开仓库、镜像层或前端代码中硬编码 Key；
- 为部署单独创建限额 Key；
- 定期轮换 Key 和访问密码；
- 不公开包含设置页、请求头或浏览器存储的截图；
- 外层增加访问限制、速率限制和日志告警。

## 15. 常见错误

### 15.1 `401 Unauthorized`

- 检查 API Key 是否完整；
- 区分页面访问密码 `CODE` 与 API Key；
- 确认容器读取了新变量；
- 检查服务控制台中 Key 是否仍有效。

### 15.2 `404 Not Found`

- 检查 `/v1` 是否遗漏或重复；
- 不要把 `/chat/completions` 写入 `BASE_URL`；
- 查看容器日志中的最终请求路径；
- 确认反向代理转发规则没有删改路径。

### 15.3 模型不显示

- 用 `+model-id` 添加到 `CUSTOM_MODELS`；
- 确认使用英文逗号；
- 重新创建容器并刷新页面；
- 清理旧会话后重新选择模型。

### 15.4 `model not found`

展示名不等于 API 模型 ID。从服务控制台复制准确 ID，并确认该 Key 有调用权限。

### 15.5 流式响应中断

- 暂时关闭流式验证非流式请求；
- 检查 Nginx/CDN 是否缓存响应；
- 增大代理读取超时；
- 缩短上下文、去掉附件和工具；
- 检查服务端是否返回规范 SSE。

### 15.6 修改环境变量后仍是旧配置

```bash
docker compose config
docker compose up -d --force-recreate
docker compose logs --tail=200 nextchat
```

注意：`docker compose config` 的输出可能含敏感值，不要公开粘贴。

## 16. 更新、回滚和卸载

更新：

```bash
docker pull yidadaa/chatgpt-next-web
docker stop nextchat
docker rm nextchat
```

然后使用原来的 `docker run` 参数重新创建。Compose 部署则执行：

```bash
docker compose pull
docker compose up -d
```

回滚时把镜像标签固定到之前验证过的版本，再重新创建容器。更新前建议导出重要会话和保存当前配置。

卸载容器：

```bash
docker stop nextchat
docker rm nextchat
```

浏览器本地会话、同步数据和反向代理配置不会因删除容器自动清除，需要按实际部署方式分别处理。

## 17. 最小验收清单

- [ ] 未登录或不知道 `CODE` 的用户无法使用共享 Key
- [ ] Base URL 最终拼接路径正确
- [ ] 模型 ID 在新对话中可选择
- [ ] 普通文本请求可正常流式结束
- [ ] 服务控制台能看到请求和用量
- [ ] Key 未出现在仓库、前端源码、截图或日志分享中
- [ ] 更新和回滚步骤已经记录

## 18. 官方资料

- [NextChat 官方仓库](https://github.com/ChatGPTNextWeb/NextChat)
- [NextChat 环境变量文档](https://docs.nextchat.dev/quickstart/selfhost/env)
- [NextChat Vercel 部署文档](https://docs.nextchat.dev/quickstart/selfhost/vercel)
- [NextChat Ollama 配置示例](https://docs.nextchat.dev/models/ollama)
- [NextChat Releases](https://github.com/ChatGPTNextWeb/NextChat/releases)

---

不同版本可能调整菜单名称。配置前请查看当前版本官方说明，排错截图务必遮住 API Key、访问密码、Cookie 和个人对话。
