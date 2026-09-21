# OrcaReplay 录制与离线重放 AI Agent 请求

> 最后核验：2026-09-14
>
> 适用范围：orcareplay 0.2.4（npm，Node 20+）；OpenAI 兼容协议 `/v1/chat/completions`，Anthropic `/v1/messages`，OpenAI Responses

[← 返回教程总目录](../教程总目录.md)

## 1. 这篇教程适合谁

**适合**：把 Agent 或 LLM 应用接到中转站、自建网关、vLLM/Ollama 之后，需要回答这两个问题的人。

- 「它刚才为什么那么做？」——去问 Agent，它是根据自己上下文窗口的摘要复述的，而摘要里已经没有工具返回值、没有 shell 退出码、也没有那些没人提起却确实被改掉的文件。答案通顺、自信，偶尔是错的。
- 「昨天那次能复现吗？」——重跑要花钱，而且模型未必再做同样的选择，你跑出来的是**另一次**运行。

OrcaReplay 把 Agent 当子进程启动，**只给这个子进程**改模型服务地址，指向本地一个代理，代理把逐字节的请求与响应存下来。之后可以在**不联系任何模型服务、不需要 Key** 的情况下把那次运行原样再跑一遍。Agent 的代码一行都不用动。

**不覆盖**：它不是评测框架（那是 Promptfoo / Ragas 的事），不是可观测平台，也**不是沙箱**——见第 7 节。

## 2. 准备工作

| 项目 | 要求 |
|---|---|
| 运行时 | Node.js 20 以上（`node --version` 确认） |
| 操作系统 | Windows / macOS / Linux 均可，本文在 Windows 10 + Git Bash 核验 |
| Base URL | 录制阶段需要一个可用的上游，例如 `https://your-relay.example.com/v1`；重放阶段**不需要** |
| API Key | 仅录制阶段需要，形如 `sk-your-key`；重放阶段不需要 |
| 模型 ID | 与你上游一致，例如 `gpt-4o-mini` |
| 协议 | OpenAI 兼容 `/v1/chat/completions`（也支持 Anthropic `/v1/messages` 与 Responses） |

## 3. 安装与版本确认

```bash
npm install -g orcareplay
orca --version   # 应输出 0.2.4
```

装完的命令名是 **`orca`**，不是 `orcareplay`。不想全局安装可以用 `npx -y orcareplay <子命令>`，同样可用。

三个平台安装方式一致。Windows 上注意两点：命令在 PowerShell 与 Git Bash 都能跑；下面第 5 节提到的 `--worktree` 在 Windows 上尤其重要，因为 Python 虚拟环境里正在使用的 `python.exe` 无法被覆盖。

## 4. 配置步骤

### 4.1 判断你的框架属于哪一类

这是接中转站时最费时间的一步，也是本文最值钱的部分。「把地址指向代理」听起来只有一种做法，实际至少有三类，全部为本次实测结果：

**第一类：读标准环境变量 `OPENAI_BASE_URL`——零改动可录。**

| 框架 | 核验版本 | 原因 |
|---|---|---|
| Haystack | 3.1.1 | `OpenAIChatGenerator` 的 `api_base_url` 默认 `None`，SDK 回落到环境变量 |
| Google ADK | 走 LiteLlm | 只传 model id 时不传 base_url |
| Semantic Kernel | 1.44.1 | `OpenAIChatCompletion` **根本没有 `base_url` 参数**，构造 `AsyncOpenAI()` 时不传 |
| AgentScope | 2.0.8 | `base_url` 挂在 credential 上，默认 `None` |
| browser-use | — | `ChatOpenAI(base_url=None)` 直接透传 |
| LightRAG | 1.5.7 | `gpt_4o_mini_complete` 走裸 SDK |
| CopilotKit（Node） | 1.71.1 | 不传 client 时懒构造 `new OpenAI()` 无参 |

**第二类：自己写了优先级，且与 SDK 默认行为不一致——最容易踩坑。**

| 框架 | 实际优先级 |
|---|---|
| LangChain（Python `langchain-openai` 与 JS `@langchain/openai` 一致） | `configuration.baseURL` → `OPENAI_API_BASE` → `OPENAI_BASE_URL` |
| PraisonAI | `OPENAI_API_BASE` 优先于 `OPENAI_BASE_URL` |
| goose | `OPENAI_HOST` 压过 `OPENAI_BASE_URL` |
| Open WebUI | 只读 **`OPENAI_API_BASE_URL`**（第三种拼法，且只在首启写进数据库） |

> **裸 OpenAI SDK 只读 `OPENAI_BASE_URL`，完全忽略 `OPENAI_API_BASE`。** 所以环境里残留一个旧教程留下的 `OPENAI_API_BASE`，会静默压过你刚设的 `OPENAI_BASE_URL`，请求带着 Key 发到别处，而且不报错。接中转站前先 `echo $OPENAI_API_BASE` 看一眼。

**第三类：地址写死在自己的配置里，根本不读环境变量。**

nanobot、mistral-vibe、Cursor、Kilo、Flowise（节点的 Base Path 字段）、Langflow（组件字段）、EvalScope（`--api-url` 命令行参数）、DeepSeek Harness（`llm-pi-ai` 插件的 `providers.baseURL`）都属于这一类。

判断方法：去它源码里 `grep -rn "base_url\|OPENAI_BASE_URL\|baseURL"`，看构造客户端时传没传。

### 4.2 第一、二类：直接录

```bash
orca record generic-openai -- python my_agent.py
```

`orca record` 只为这个子进程设置地址变量，你的 shell 和其他程序不受影响。

### 4.3 第三类：起固定端口的代理，再改框架自己的配置

```bash
orca attach --port 8080
```

然后在框架配置里把 provider 的 base URL 填成 `http://127.0.0.1:8080/v1`。

> **Langflow 用户注意**：1.12.1 对自定义 base URL 施加 SSRF 策略，**默认屏蔽 loopback**，会报 `SSRF Protection: Hostname 127.0.0.1 resolves to blocked IP address(es)`。需要用 `LANGFLOW_SSRF_ALLOWED_HOSTS=127.0.0.1` 放行。这条同样影响所有想接本地 Ollama / vLLM / LM Studio 的人。

## 5. 最小验证

成本最低的验证：录一次最短的对话，然后**把上游断开**再重放。

```bash
# 1) 录
orca record generic-openai -- python hello.py
# info recorded run=run_5381c38c5274 events=6 exit=0

# 2) 断开上游（关掉中转站的网络、或直接拔网线）

# 3) 放
orca replay last --worktree
```

成功时最后一行长这样：

```text
info replay.done reused=1/1 exact=1 divergences=0 unmatched=0 exit=0
```

四个数的含义，这是可核对的结论而不是感觉：

- `reused=1/1` —— 1 次交换全部命中录像；
- `exact=1` —— 请求与录下来的**逐字节相同**；
- `divergences=0` —— 没有漂移；如果对不上会报出差了多少字符，而不是归一化后悄悄放过；
- `unmatched=0` —— 没有录像无法服务的请求。

**怎么确认请求真的走了目标地址**：录制时 `orca record` 的首行会打印 `proxy=http://127.0.0.1:<port>`；在程序里打印客户端解析出的 base_url，应当等于这个值。例如 Semantic Kernel 打印 `model.client.base_url`，CopilotKit 打印 `adapter.openai.baseURL`。

## 6. 常见错误

| 现象 | 原因与解法 |
|---|---|
| `warn capture.empty exchanges=0 cause="the agent never called the proxy"` | 框架属于第二或第三类，没读 `OPENAI_BASE_URL`。按 4.1 重判类别；若环境里有 `OPENAI_API_BASE` 残留，先清掉 |
| 认证失败 401，且报错文案是 OpenAI 原文 | 请求根本没走代理，直接打到了官方地址。同上 |
| 模型不存在 / 404 | 中转站的模型 ID 与官方不同，按上游文档改 `--model` 或代码里的模型名 |
| `replay.failed: git checkout-index failed: unable to unlink old 'venv/Scripts/python.exe'` | 重放会把录制时的文件树还原回来，碰上正在使用的解释器。**加 `--worktree` 在隔离副本里重放** |
| Node 项目重放报 `ERR_MODULE_NOT_FOUND` | 相反的情况：`--worktree` 的副本来自版本控制，`node_modules` 被 gitignore 了。Node 项目在原目录重放 |
| `unmatched=N` 且提示 `/v1/embeddings ... cannot be replayed` | **embedding 调用目前不被捕获**，见第 7 节 |
| 客户端靠 `GET /v1/models` 发现模型，结果列表为空 | 代理目前不处理这个 GET。Open WebUI 可用 `OPENAI_API_CONFIGS` 显式声明 `model_ids` 跳过发现 |

## 7. 安全提醒

- **录像里有那次运行的全部内容**：提示词、返回值、你贴进去的任何东西。往外发之前必须脱敏，而且脱敏工具只能匹配已知的密钥形态和高熵字符串，**它不知道某个内网域名或客户名字是机密**，脱敏之后还要人看一眼。
- 不要把完整 API Key 提交到 Git、Issue、聊天截图或录屏；用环境变量或系统密钥存储保存。怀疑泄露时立即撤销旧 Key。
- **`egress=blocked` 挡的是模型侧出网，不是网络隔离。** 重放时模型不会被调用，但 **Agent 录下来的工具调用会真的再执行一次**——那次跑过的 `curl`、装过的包、写过的数据库，重放会再干一遍。**它不是沙箱。** 首次重放前先读录像里记录的 shell 命令。
- **重放成功 ≠ 确定性结论。** 模型并没有被重新提问，是把录下的回复喂回去。它能回答「录下的那次还能不能复现」，答不了「重新跑一次是不是还会失败」。
- **embedding 调用目前不被捕获。** 代理只认 `/v1/chat/completions`、`/v1/messages` 和两种 Responses 路径；`/v1/embeddings` 会被透传到真实上游，**录制时不会有任何提示**，重放时才会明确拒绝。因此「查询阶段做 embedding」的 RAG 流程无法完整重放；只在建索引阶段 embedding、查询阶段纯 chat 的流程不受影响。

## 8. 参考资料与核验记录

- [OrcaReplay 官方仓库](https://github.com/Continuum-AI-Corp/OrcaReplay)（Apache-2.0）—— 2026-09-14 核验
- [npm orcareplay](https://www.npmjs.com/package/orcareplay) —— 0.2.4，2026-09-14 核验
- 第 4.1 节各框架的行为，均为 2026-09-13 至 09-14 在一个确定性本地上游（替代真实服务商）上实测所得，非文档推断；`exact` 的比对是逐字节比对。
- Langflow SSRF 行为出自 `lfx/base/models/provider_ssrf.py` 的模块 docstring，并在 1.12.1 上双向实测（默认拒绝、放行后通过）。

> 利益披露：本文作者是 OrcaReplay 的维护者。上述第二类各框架的变量优先级与 Langflow 的 SSRF 行为，与本工具无关，任何指向自定义端点的场景都会遇到。
