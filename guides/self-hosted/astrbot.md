# AstrBot 多平台机器人与自定义模型 API 配置教程

> 最后核验：2026-07-24
>
> 适用范围：AstrBot 当前稳定版；Docker / Docker Compose
>
> 预计用时：30～90 分钟（不含聊天平台审核）

[← 返回教程目录](../教程总目录.md)

## 1. AstrBot 能做什么

AstrBot 是开源 AI Agent 与聊天机器人平台，可把大模型、插件、知识库和工具连接到多种即时通信平台。官方模型层支持 OpenAI、Google GenAI 和 Anthropic 原生 API 格式，也可连接符合相应协议的服务。

完整链路分为三部分：

```text
聊天平台 → AstrBot 平台适配器 → 模型 Provider
```

排错时应分别验证，不能把“QQ 没回复”直接归因于模型。

## 2. Docker Compose 部署

```bash
git clone https://github.com/AstrBotDevs/AstrBot
cd AstrBot
docker compose up -d
```

查看日志：

```bash
docker compose logs -f
```

日志会显示 Dashboard 地址和首次登录信息。新版首次登录密码是启动日志中生成的随机密码，用户名通常为 `astrbot`。登录后立即修改密码。

查看容器：

```bash
docker compose ps
```

官方 Compose 默认会映射 AstrBot 所需端口。云服务器上不要直接开放整段端口给所有来源；只开放实际使用的入口，并配置防火墙和反向代理。

## 3. 添加 OpenAI-compatible 模型

登录 WebUI 后：

1. 打开 **服务提供商 / Service Providers**；
2. 点击添加 Provider；
3. 如果目标服务有专用适配器，优先选专用类型；
4. 否则选择 **OpenAI**；
5. 填写 API Key；
6. 填写 API Base URL；
7. 点击获取模型列表；
8. 添加并启用目标模型；
9. 进入配置页，把对话模型切换为该 Provider/模型；
10. 保存配置。

典型字段：

```text
API Base URL: https://api.example.com/v1
API Key: YOUR_API_KEY
Model ID: YOUR_MODEL_ID
```

Base URL 必须来自目标服务文档。AstrBot 官方示例使用包含 `/v1` 的 OpenAI-compatible 地址，但其他服务可能不同。

## 4. 用环境变量加载 API Key

AstrBot v4.13.0 起支持在 Provider 配置中引用环境变量。先在容器环境中设置：

```yaml
services:
  astrbot:
    environment:
      EXAMPLE_LLM_API_KEY: ${EXAMPLE_LLM_API_KEY}
```

在宿主机未提交的 `.env` 中：

```dotenv
EXAMPLE_LLM_API_KEY=YOUR_API_KEY
```

然后在 WebUI 的 API Key 字段填写：

```text
$EXAMPLE_LLM_API_KEY
```

确认 `.env` 已加入 `.gitignore`，并限制文件权限。

## 5. 第一次模型验证

先不连接 QQ、Telegram 或其他平台，直接在 AstrBot WebUI 的 ChatUI 测试：

```text
只回复：AstrBot 模型连接成功
```

再测试流式和上下文：

```text
请记住校验词“蓝色火箭”，下一条消息只回复校验词。
```

发送下一条：

```text
校验词是什么？
```

最后测试工具调用或 Agent 能力。只有 ChatUI 全部正常后，再处理聊天平台适配器。

## 6. 查看和切换 Provider

在聊天渠道中，管理员可以使用：

```text
/provider
```

它会列出 LLM、TTS 和 STT Provider。切换：

```text
/provider 1
```

部分扩展管理命令位于 `builtin_commands_extension` 插件中。`/provider`、`/model` 等管理命令需要 AstrBot 管理员权限。

管理员 ID 可通过：

```text
/sid
```

获取，再到 WebUI 的管理员配置中加入。不要把普通群成员设为管理员。

## 7. 连接聊天平台

进入 WebUI 的平台适配器配置，选择目标平台并严格按照 AstrBot 官方对应页面准备：

- Bot Token、App ID、Secret；
- Webhook 或 WebSocket 地址；
- 回调 URL；
- 事件订阅和消息权限；
- 允许的用户、群组和触发方式。

QQ 个人号等非官方协议方案可能涉及账号风控、平台条款和额外协议端。优先使用聊天平台官方 Bot/API。

## 8. Docker 网络

容器内的 `localhost` 只指当前容器。

如果 AstrBot 和消息协议端位于同一 Compose 网络，应使用服务名：

```text
ws://message-adapter:PORT/PATH
```

如果模型服务运行在宿主机：

- macOS/Windows Docker Desktop 可使用 `host.docker.internal`；
- Linux 需要显式配置宿主机网关；
- 更推荐把相关服务放入受控的同一 Compose 网络。

先从 AstrBot 容器内部测试目标地址：

```bash
docker compose exec astrbot sh
```

再使用容器中可用的网络工具检查 DNS 和端口。

## 9. 权限与群聊安全

- 设置管理员 ID；
- 配置用户或群组白名单；
- 群聊采用明确前缀或提及触发；
- 限制插件安装和管理命令；
- 禁止普通用户调用文件、Shell、数据库等高权限工具；
- 对长消息、图片和频率做限制；
- 不在日志中公开消息正文和密钥；
- 插件只从可信来源安装，并审查依赖和权限。

## 10. 更新与备份

更新前备份 AstrBot 数据目录和配置：

```bash
docker compose down
cp -a data "data.backup.$(date +%Y%m%d)"
git pull --ff-only
docker compose pull
docker compose up -d
```

如果仓库 Compose 从源码构建，则按仓库当前说明重新构建。不要在没有备份的情况下跨多个大版本升级。

## 11. 常见问题

| 现象 | 排查方法 |
|---|---|
| 找不到首次密码 | 查看 `docker compose logs` 中的首次登录信息 |
| 401 | 检查 Provider Key、环境变量是否进入容器、账户状态 |
| 404 | 检查 API Base URL、协议类型和模型 ID |
| 获取模型列表失败 | 手动核对服务是否实现 `/v1/models`；必要时按 WebUI 允许方式添加模型 |
| ChatUI 正常但平台无回复 | 排查平台 Token、事件订阅、回调、白名单和触发规则 |
| 容器连接失败 | 不要使用 `localhost` 连接其他容器；检查网络和服务名 |
| `/provider` 无权限 | 使用 `/sid` 获取 ID，并在 WebUI 配置管理员 |
| 插件安装失败 | 查看 WebUI Console 和容器日志，检查依赖、网络和版本 |
| 端口可访问但不安全 | 关闭公网直连，配置防火墙、TLS 和访问控制 |

## 12. 官方来源

- [AstrBot 官方文档](https://docs.astrbot.app/)
- [AstrBot Docker 部署](https://docs.astrbot.app/en/deploy/astrbot/docker.html)
- [AstrBot 连接模型服务](https://docs.astrbot.app/en/providers/start.html)
- [AstrBot 内置命令](https://docs.astrbot.app/en/use/command.html)
- [AstrBot 官方仓库](https://github.com/AstrBotDevs/AstrBot)
