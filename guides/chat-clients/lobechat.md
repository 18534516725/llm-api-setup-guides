# LobeHub（原 LobeChat）接入 OpenAI 兼容 API：自托管完整教程

> 最后核验：2026-07-14
>
> 适用范围：LobeHub 当前自托管版本（项目原名 LobeChat）
>
> 推荐方式：使用官方 Docker Compose 安装，再通过环境变量配置

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. LobeHub 适合什么场景

LobeHub 是开源、自托管的 AI 工作空间，支持多模型、Agent、知识库、文件和多用户能力。它适合：

- 希望在浏览器中使用统一聊天入口；
- 需要自定义 OpenAI 兼容 API；
- 希望保留自己的账户、会话和文件数据；
- 准备长期维护一个个人或团队服务。

如果只是单机聊天，Cherry Studio 或 Chatbox 更轻量。LobeHub 当前完整自托管方案依赖数据库、对象存储等组件，部署和备份工作会更多。

## 2. 先理解两种使用方式

| 方式 | API 配置位置 | 适合谁 |
|---|---|---|
| LobeHub Cloud | 页面中的模型服务商设置（受云端版本策略影响） | 不想维护服务器的个人用户 |
| 自托管 LobeHub | 部署环境变量和应用内设置 | 希望自行管理数据与访问权限的用户 |

本文重点讲自托管。不同版本的设置页名称可能略有变化，但环境变量是服务端部署最稳定、最容易复现的方式。

## 3. 准备清单

- 一台安装了 Docker 与 Docker Compose 的电脑或服务器；
- 建议至少准备 4 GB 内存和足够的持久化磁盘；
- 一个 OpenAI 兼容 API Key；
- 对应的 Base URL，通常以 `/v1` 结尾；
- 至少一个准确的模型 ID；
- 公网部署时准备域名、HTTPS 和备份方案。

> [!IMPORTANT]
> Base URL、API Key、模型 ID 必须来自同一个服务控制台。不要根据模型展示名猜模型 ID。

## 4. 使用官方脚本部署

LobeHub 当前官方仓库推荐数据库版 Docker Compose。先创建独立目录：

```bash
mkdir lobehub-db
cd lobehub-db
```

运行官方交互式安装脚本：

```bash
bash <(curl -fsSL https://lobe.li/setup.sh) -l zh_CN
```

脚本会生成 Compose 和环境配置。执行脚本前应先阅读官方部署说明；在安全要求较高的环境中，也可以从官方仓库下载脚本后审阅再运行。

启动服务：

```bash
docker compose up -d
docker compose ps
```

查看日志：

```bash
docker compose logs --tail=200
```

实际访问地址、端口和初始化信息以脚本输出及生成的 Compose 文件为准。

## 5. 配置 OpenAI 兼容 API

在安装脚本生成的环境文件中设置：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
OPENAI_PROXY_URL=https://api.example.com/v1
OPENAI_MODEL_LIST=model-id-1,model-id-2
```

字段说明：

| 字段 | 是否必需 | 作用 |
|---|---:|---|
| `OPENAI_API_KEY` | 是 | 发送给兼容接口的密钥 |
| `OPENAI_PROXY_URL` | 使用自定义接口时是 | 覆盖 OpenAI 服务地址 |
| `OPENAI_MODEL_LIST` | 建议 | 明确允许使用或展示的模型 |

示例中的域名、Key 和模型都只是占位符。实际值请从服务商控制台复制。

修改后重新创建应用容器，使环境变量生效：

```bash
docker compose up -d
docker compose ps
```

如果只修改环境变量但容器没有重新创建，旧配置可能仍在进程中。

## 6. Base URL 到底填到哪一层

OpenAI 兼容接口通常采用：

```text
Base URL: https://api.example.com/v1
聊天端点: POST https://api.example.com/v1/chat/completions
模型端点: GET  https://api.example.com/v1/models
```

因此 `OPENAI_PROXY_URL` 通常填到 `/v1`：

```text
正确：https://api.example.com/v1
错误：https://api.example.com/v1/chat/completions
```

少数服务控制台给出的地址不以 `/v1` 结尾，应以控制台的“客户端接入地址”说明为准，不要机械追加两次 `/v1`。

## 7. 配置模型列表

`OPENAI_MODEL_LIST` 使用英文逗号分隔：

```dotenv
OPENAI_MODEL_LIST=model-id-1,model-id-2,model-id-3
```

注意：

- 填模型 API ID，不填营销名称；
- 不要在逗号旁加入中文标点；
- 模型 ID 区分大小写时必须原样复制；
- Key 无权访问某个模型时，即使列表里写了也无法调用；
- 新模型未显示时，先检查环境变量，再刷新页面或重新登录。

模型列表只解决“显示和选择”的问题，不会自动授予模型调用权限。

## 8. 首次启动与初始化

首次打开页面后：

1. 按页面提示创建第一个账户；
2. 完成管理员初始化；
3. 进入“设置”或“Language Model”；
4. 确认 OpenAI 服务商已启用；
5. 检查模型列表；
6. 新建空白对话，选择一个文本模型；
7. 发送一句简短消息。

首次验证不要同时启用知识库、联网搜索、文件解析、图片生成和工具调用。先证明普通文本聊天可用，再逐项开启高级能力。

## 9. 用命令行先验证接口

在排查 LobeHub 之前，可以先测试 API 本身。把占位符替换成自己的临时值，且不要把命令截图发到公开渠道：

```bash
curl https://api.example.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

测试非流式聊天：

```bash
curl https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "model-id-1",
    "messages": [{"role": "user", "content": "Reply with OK"}],
    "stream": false
  }'
```

如果命令行都失败，应先修正 Key、URL、模型权限或账户余额，不要反复重装 LobeHub。

## 10. 流式输出与高级能力

LobeHub 的普通聊天依赖 OpenAI 风格的 Chat Completions 接口。流式输出还要求服务正确返回 SSE 数据。

| 能力 | 除基础聊天外还需要什么 |
|---|---|
| 流式输出 | 服务端正确实现 `stream: true` 与 SSE |
| 图片理解 | 模型支持视觉输入，接口接受多模态消息 |
| 工具调用 | 模型和接口实现 tool/function calling |
| 知识库 | 可用的 Embedding 模型、向量存储与文件服务 |
| 图片生成 | 对应的图片模型和兼容端点 |

“能聊天”不代表这些高级能力全部可用。遇到高级功能报错时，应先回到纯文本、无工具、无附件的最小请求。

## 11. 数据库版部署的备份重点

完整自托管版本可能同时包含：

- 应用数据库；
- 对象存储中的文件；
- 身份认证相关配置；
- 环境文件中的密钥；
- Compose 文件和反向代理配置。

只复制一个容器并不等于完成备份。应根据官方部署架构分别备份数据库和对象存储，并定期验证恢复过程。

## 12. 公网部署安全清单

- 使用 HTTPS，不把内部数据库或对象存储端口暴露到公网；
- 关闭不需要的公开注册；
- 管理员使用强密码和独立账户；
- API Key 只写入服务器环境文件，不提交到 Git；
- 环境文件权限至少限制为仅部署账户可读；
- 为不同环境使用不同 Key，并设置合理限额；
- 日志、监控、报错截图中隐藏请求头和 Key；
- 更新前备份，生产环境固定版本并阅读发布说明。

## 13. 常见错误排查

### 13.1 `401 Unauthorized`

按顺序检查：

1. `OPENAI_API_KEY` 是否复制完整；
2. 环境文件中是否意外带空格、引号或换行；
3. Compose 是否读取了正确的环境文件；
4. 修改后是否重新创建容器；
5. Key 是否已禁用、过期或无权限。

### 13.2 `404 Not Found`

最常见原因是 URL 层级不对：

- 把 `/chat/completions` 误写进 Base URL；
- 漏写 `/v1`；
- 重复写成 `/v1/v1`；
- 反向代理没有转发该路径。

### 13.3 模型不存在或没有权限

- 从控制台重新复制模型 ID；
- 检查 `OPENAI_MODEL_LIST`；
- 用 `/v1/models` 查看 Key 实际可见的模型；
- 确认模型与 Key 属于同一权限范围。

### 13.4 页面一直转圈或流式中断

- 先用 `stream: false` 测试；
- 检查反向代理是否缓存 SSE；
- 增大反向代理读取超时；
- 查看应用容器和网关日志；
- 暂时关闭工具、附件与长上下文。

### 13.5 修改配置没有生效

```bash
docker compose config
docker compose up -d
docker compose logs --tail=200
```

`docker compose config` 可帮助确认变量是否被 Compose 解析，但输出可能包含敏感值，不要公开粘贴完整结果。

## 14. 更新、回滚与卸载

更新前先完成数据库、文件和环境配置备份，再按官方版本说明拉取镜像：

```bash
docker compose pull
docker compose up -d
docker compose ps
```

回滚时应恢复到升级前的镜像版本；如果升级包含数据库迁移，还要遵循对应版本的回滚说明，不能只切换镜像。

停止服务：

```bash
docker compose down
```

不要随意添加 `-v`，因为它可能删除 Compose 管理的数据卷。彻底卸载前，先确认数据库、对象存储和环境文件已经备份且不再需要。

## 15. 最小验收清单

- [ ] 通过 HTTPS 或本机地址正常打开 LobeHub
- [ ] 普通用户不能看到服务器中的 API Key
- [ ] 模型列表只显示准备开放的模型
- [ ] 新建纯文本对话可以完整结束
- [ ] 服务控制台能看到对应请求和用量
- [ ] 401、404、超时等错误不会暴露敏感信息
- [ ] 数据库和文件均有可恢复备份

## 16. 官方资料

- [LobeHub 官方仓库](https://github.com/lobehub/lobehub)
- [LobeHub Docker 部署文档](https://lobehub.com/zh/docs/self-hosting/platform/docker)
- [LobeHub 环境变量示例](https://github.com/lobehub/lobehub/blob/main/.env.example)
- [LobeHub Docker 镜像](https://hub.docker.com/r/lobehub/lobehub)

---

如果界面字段与本文略有不同，请以当前版本官方文档和部署生成的配置为准。排查时请隐藏 API Key、Cookie、内部域名和个人对话内容。
