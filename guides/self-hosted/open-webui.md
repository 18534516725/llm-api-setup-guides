# Open WebUI 接入 OpenAI 兼容 API：Docker 部署与管理教程

> 最后核验：2026-07-14
>
> 适用范围：Open WebUI 当前稳定版
>
> 推荐方式：Docker，本地或私有服务器部署

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. Open WebUI 适合什么场景

Open WebUI 是可自部署的 AI Web 界面，支持多用户、多个模型连接、知识库和权限管理。它比单机聊天客户端更适合：

- 家庭或小团队共用；
- 在浏览器中访问统一 AI 入口；
- 同时连接多个 OpenAI 兼容接口；
- 需要独立管理用户和可见模型。

如果你只想在个人电脑上快速聊天，Cherry Studio 或 Chatbox 更省事。如果要让多人使用，Open WebUI 更合适，但也需要承担更新、备份和安全维护。

## 2. 部署前准备

- 已安装 Docker Desktop 或 Docker Engine；
- 至少预留数 GB 磁盘空间；
- API Key、OpenAI 兼容 Base URL、模型 ID；
- 服务器部署时准备域名、HTTPS 和防火墙。

可以从[纽智中转站](https://www.nexotoken.net/?ref=github)创建 Key。请从控制台复制 Base URL 和模型 ID。

## 3. 本机安全启动

只在当前电脑使用时，建议仅监听本机地址：

```bash
docker pull ghcr.io/open-webui/open-webui:main

docker run -d \
  -p 127.0.0.1:3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart unless-stopped \
  ghcr.io/open-webui/open-webui:main
```

说明：

| 参数 | 作用 |
|---|---|
| `127.0.0.1:3000:8080` | 只允许本机访问 3000 端口 |
| `open-webui:/app/backend/data` | 持久化账户、配置和对话 |
| `--restart unless-stopped` | Docker 重启后自动恢复 |
| `:main` | 官方当前主线镜像 |

打开：

```text
http://localhost:3000
```

## 4. 使用 Docker Compose

希望长期维护时，可以使用以下 `compose.yaml`：

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    ports:
      - "127.0.0.1:3000:8080"
    volumes:
      - open-webui:/app/backend/data
    restart: unless-stopped

volumes:
  open-webui:
```

启动：

```bash
docker compose up -d
docker compose ps
```

查看日志：

```bash
docker compose logs --tail=200 open-webui
```

## 5. 创建第一个管理员

首次打开页面时注册的第一个账户通常会成为管理员。请：

1. 使用不容易猜到的密码；
2. 不要在开放公网后才创建管理员；
3. 登录后先检查用户注册设置；
4. 不需要公开注册时立即关闭注册入口。

如果在服务器上部署，建议先通过 SSH 隧道或仅本机监听完成管理员初始化，再配置反向代理。

## 6. 添加 OpenAI 兼容连接

使用管理员账户：

1. 打开“管理员设置”或 `Admin Settings`；
2. 进入 `Connections`；
3. 找到 `OpenAI` 连接管理；
4. 点击“添加连接”；
5. 填写：
   - URL：服务商提供的 Base URL，通常以 `/v1` 结尾；
   - API Key：控制台创建的 Key；
6. 保存并验证连接。

不要把完整 `/chat/completions` 写进 URL。Open WebUI 会根据功能调用 `/models`、`/chat/completions`、`/embeddings` 等端点。

## 7. 模型列表为空怎么办

Open WebUI 通常通过：

```text
GET /v1/models
```

自动发现模型。如果服务商没有实现模型列表接口，或者 Key 只能看到部分模型：

1. 编辑该连接；
2. 找到 `Model IDs (Filter)`；
3. 手动加入准确的模型 ID；
4. 保存后刷新模型选择器。

`Model IDs (Filter)` 是允许列表。填写后只显示列表中的模型，也适合团队隐藏昂贵或不希望使用的模型。

## 8. 多连接与模型重名

如果接入多个服务，而它们存在同名模型，可在连接中设置 `Prefix ID`，例如：

```text
team-a/
```

模型在界面中会显示成带前缀的形式，便于区分来源。前缀只用于 Open WebUI 内部管理，实际发送的模型 ID 仍由连接配置处理。

## 9. 首次对话验证

1. 回到首页；
2. 在顶部模型选择器中选择刚添加的模型；
3. 新建空白对话；
4. 发送一条短文本；
5. 确认能正常流式结束；
6. 在服务商控制台检查本次用量。

首次不要同时开启知识库、联网搜索、工具调用和图片。先证明基础聊天可用，再逐项增加能力。

## 10. API 兼容能力说明

Open WebUI 基础聊天需要：

```text
POST /v1/chat/completions
```

其他功能还可能需要：

| 功能 | 常见端点 |
|---|---|
| 自动发现模型 | `GET /v1/models` |
| 知识库向量化 | `POST /v1/embeddings` |
| 文字转语音 | `POST /v1/audio/speech` |
| 语音转文字 | `POST /v1/audio/transcriptions` |
| 图片生成 | `POST /v1/images/generations` |

聊天可用但知识库失败，通常是没有配置 Embedding 模型或接口不支持 `/embeddings`，不应直接判断整个 API 不可用。

## 11. Docker 网络中的 localhost 陷阱

Open WebUI 运行在容器内时，容器里的 `localhost` 指容器自身，不是宿主机。

如果你连接的是宿主机上运行的本地模型服务，通常使用：

```text
http://host.docker.internal:端口/v1
```

Linux 还可能需要启动参数：

```bash
--add-host=host.docker.internal:host-gateway
```

云端 API 不需要这个设置，直接填写服务商提供的 HTTPS Base URL。

## 12. 公网部署安全清单

不要直接把容器 3000 端口裸露到公网。正式部署至少应做到：

- 使用 Nginx、Caddy 或云负载均衡终止 HTTPS；
- 关闭不需要的公开注册；
- 管理员使用强密码；
- 只开放 80/443 等必要端口；
- 定期更新镜像；
- 定期备份数据卷；
- 限制普通用户可见模型；
- 不在 Compose 文件中明文提交 API Key；
- 日志和截图中隐藏 Key、请求头与个人对话。

多人场景最好每个用途使用独立 Key，便于限额、轮换和追踪异常用量。

## 13. 更新 Open WebUI

更新前先备份，然后：

```bash
docker pull ghcr.io/open-webui/open-webui:main
docker stop open-webui
docker rm open-webui
```

再使用原来的 `docker run` 命令启动。因为数据保存在命名卷 `open-webui` 中，删除容器不会删除数据卷。

Compose 部署：

```bash
docker compose pull
docker compose up -d
docker compose ps
```

生产环境建议固定具体版本标签，阅读发布说明并在测试环境升级后再更新正式实例。

## 14. 备份与恢复

### 备份命名卷

先停止容器,避免备份过程中数据库仍在写入而产生不一致快照:

```bash
docker stop open-webui
```

再执行备份:

```bash
docker run --rm \
  -v open-webui:/data \
  -v "$PWD":/backup \
  alpine \
  tar czf /backup/open-webui-backup.tar.gz -C /data .
```

备份完成后重新启动:

```bash
docker start open-webui
```

如果备份命令失败,也应先检查备份文件是否有效,再恢复服务。备份文件包含用户、配置和聊天数据，必须加密保存。

### 恢复前注意

1. 停止 Open WebUI；
2. 先备份当前数据；
3. 确认备份来源和版本；
4. 恢复后检查管理员登录、连接和随机几条对话；
5. 不要在生产实例上直接试验未知备份。

## 15. 常见错误排查

### 页面打不开

```bash
docker ps --filter name=open-webui
docker logs --tail=200 open-webui
```

检查容器是否运行、3000 端口是否被占用，以及访问地址是否为 `http://localhost:3000`。

### 401 Unauthorized

重新创建 Key 并更新连接。注意 Key 的首尾空格，不要把后台登录密码填进去。

### 403 / 模型不可用

确认 Key 分组与模型权限，检查 `Model IDs (Filter)` 是否包含了无权限模型。

### 404 / No models

- URL 是否包含正确的 `/v1`；
- 是否误填完整 `/chat/completions`；
- `/v1/models` 是否受支持；
- 不支持自动发现时手动填写 Model IDs。

### 连接验证成功，但聊天失败

验证可能只检查模型列表。新建纯文本对话，关闭工具和附件；如果仍失败，检查 `/chat/completions` 协议和模型权限。

### 知识库失败

单独配置可用的 Embedding 模型，并确认提供方支持 `/v1/embeddings`。聊天模型不能自动当作向量模型使用。

### 502 / 504

通常来自反向代理超时或上游连接问题。先绕过反向代理在本机测试，再检查 WebSocket、流式响应和代理超时设置。

## 16. 停止和卸载

停止但保留数据：

```bash
docker stop open-webui
```

删除容器但保留数据：

```bash
docker rm open-webui
```

删除数据卷会永久清除账户、配置和对话。只有确认备份有效并明确不再需要数据时，才应执行卷删除操作。

## 17. 官方资料

- [Open WebUI 官方快速开始](https://docs.openwebui.com/getting-started/quick-start/)
- [连接 OpenAI 兼容服务](https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-openai-compatible/)
- [Open WebUI 官方 GitHub](https://github.com/open-webui/open-webui)

---

向他人求助时，请提供部署方式、镜像版本、容器日志中的错误码、Base URL 是否含 `/v1`、模型 ID。务必删除日志中的 Key、Cookie 和个人对话。
