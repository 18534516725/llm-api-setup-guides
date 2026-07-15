# OpenHands 本地 GUI 接入自定义 API：安装、模型配置与安全验证

> 最后核验：2026-07-15
>
> 适用范围：OpenHands Local GUI 当前版；Settings 中的 Custom Model 与 Base URL

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. OpenHands 是什么

OpenHands 是可以操作代码、终端和开发环境的软件工程 Agent。Local GUI 允许自带 LLM 和 API Key，并通过高级设置填写自定义模型与 Base URL。

它会多次调用模型并执行工具，成本、权限和协议要求都高于普通聊天。模型列表能保存不代表 Agent 能可靠完成任务。

## 2. 环境要求

官方 Local GUI 支持：

- macOS + Docker Desktop；
- Linux；
- Windows + WSL 2 + Docker Desktop。

建议至少 4 GB 内存；真实 Agent 工作负载通常还需要更多资源。Docker 必须正常运行，并允许 OpenHands 创建隔离运行环境。

## 3. 使用 uv 安装

安装官方要求的 `uv` 后运行：

```bash
uv tool install openhands --python 3.12
```

启动 GUI：

```bash
openhands serve
```

需要把当前目录挂载给工作区时：

```bash
openhands serve --mount-cwd
```

浏览器打开：

```text
http://localhost:3000
```

`--mount-cwd` 会让 Agent 接触当前目录。第一次不要在包含生产密钥或重要未提交改动的目录中运行。

## 4. 配置自定义模型

启动后的首次设置或 `Settings → LLM` 中：

1. 打开 Advanced 设置；
2. 选择或填写 LLM Provider；
3. `Custom Model` 按 Provider 前缀填写；
4. `Base URL` 填服务端给出的 API 根地址；
5. 填写 API Key；
6. 保存并新建会话。

OpenAI-compatible 的常见格式：

```text
Custom Model: openai/YOUR_MODEL_ID
Base URL: https://your-api.example.com/v1
API Key: YOUR_API_KEY
```

OpenHands 使用 Provider/模型前缀进行路由。不能只填展示名称，也不要随意省略 `openai/` 前缀。

## 5. Docker 网络中的 Base URL

当模型服务运行在宿主机，而 OpenHands Agent 运行在 Docker 中时，容器里的 `localhost` 指向容器自身。

官方本地模型示例使用：

```text
http://host.docker.internal:8000/v1
```

常见端口：

- Ollama：`11434`；
- SGLang / vLLM：`8000`。

云端 HTTPS API 不需要替换成 `host.docker.internal`。Linux 环境还要确认 Docker 主机映射与防火墙规则。

## 6. 环境变量方式

OpenHands 也支持环境变量，包括：

```bash
export LLM_BASE_URL="https://your-api.example.com/v1"
export LLM_API_KEY="YOUR_API_KEY"
export LLM_MODEL="openai/YOUR_MODEL_ID"
```

具体变量和优先级可能随版本变化，使用前核对官方 Environment Variables Reference。当前 CLI 临时覆盖已保存设置时还需要使用 `--override-with-envs`；Web 自托管部署则按官方配置说明传入环境变量。不要把 `.env`、shell 历史或含密钥的启动脚本提交到 Git。

## 7. 最小验证

准备隔离测试目录：

```bash
mkdir openhands-api-test
cd openhands-api-test
git init
printf '# OpenHands Test\n' > README.md
openhands serve --mount-cwd
```

第一步只读：

```text
读取 README.md，告诉我标题。不要修改文件，不要运行安装命令。
```

第二步受控写入：

```text
在 README.md 末尾增加“连接验证成功”。不要安装依赖，不要提交 Git。
```

完成后在宿主机检查：

```bash
git diff -- README.md
```

如果 Agent 只在聊天中声称完成、但文件没有变化，通常是工具调用或运行环境链路没有通过。

## 8. 模型能力要求

官方提醒本地或较弱模型可能出现长时间等待、JSON 格式错误和 Agent 表现不佳。至少验证：

- 流式输出能正常结束；
- 工具名称和 JSON 参数完整；
- 工具结果能继续进入下一轮；
- 长上下文不会立即溢出；
- 模型能遵循“只读”“等待确认”等限制；
- 429 能按预期退避而不是无限重试。

普通 Chat Completions 能回复文本，不等于适合 OpenHands。

## 9. 重试与限流

OpenHands 支持调整重试：

```bash
export LLM_NUM_RETRIES=4
export LLM_RETRY_MIN_WAIT=5
export LLM_RETRY_MAX_WAIT=30
export LLM_RETRY_MULTIPLIER=2
```

不要把重试次数设得过高来掩盖 401、404 或额度不足。Agent 一次任务包含多轮调用，过度重试会快速放大费用。

## 10. 权限与数据安全

- 在临时 Git 仓库完成第一次验证；
- 挂载目录前移除 `.env`、证书和生产凭据；
- 使用只允许必要模型和额度的独立 Key；
- 审查 Agent 执行的 shell 命令和网络访问；
- 不把 Docker socket 暴露给不可信用户；
- 运行前提交或备份当前工作，便于回滚；
- 敏感项目使用隔离机器或受控运行环境。

OpenHands 能修改文件和执行命令，权限风险不能只靠提示词解决。

## 11. 常见错误

| 现象 | 排查方向 |
|---|---|
| 模型不在列表 | 打开 Advanced，填写带 Provider 前缀的 Custom Model |
| 401 | Key 无效、环境变量未传入或 Provider 前缀不匹配 |
| 404 | Base URL 路径错误，或容器无法访问宿主机地址 |
| Docker 中连接拒绝 | 不要使用容器内 `localhost`；检查 `host.docker.internal` |
| JSON/tool call 错误 | 模型或服务端不满足 Agent 工具调用要求 |
| 429 反复出现 | 降低任务规模和并发，检查额度，合理设置退避 |
| 文件没有变化 | 工作目录未挂载、权限不足或工具调用失败 |
| 任务成本异常 | 长上下文、多轮工具和重试共同放大调用量 |

## 12. 更新、迁移与清理

用原安装方式更新 OpenHands，并在升级前备份 `$HOME/.openhands`。旧版本用户可能需要按官方说明迁移历史数据目录。

更新后先在测试仓库重新跑只读和写入任务，再进入真实项目。卸载应用不会自动撤销远程 API Key；不再使用时应在服务端撤销。

## 13. 官方资料

- [OpenHands Quick Start](https://docs.openhands.dev/overview/quickstart)
- [Local GUI Setup](https://docs.openhands.dev/openhands/usage/run-openhands/local-setup)
- [LLM 配置概览](https://docs.openhands.dev/openhands/usage/llms/llms)
- [Local LLMs 与 Base URL](https://docs.openhands.dev/openhands/usage/llms/local-llms)
- [Environment Variables Reference](https://docs.openhands.dev/openhands/usage/environment-variables)
- [OpenHands 官方 GitHub](https://github.com/All-Hands-AI/OpenHands)

---

求助时请提供 OpenHands 版本、安装方式、系统、Docker 版本、脱敏 Custom Model/Base URL、状态码和相关日志，不要发送 Key 或私人代码。
