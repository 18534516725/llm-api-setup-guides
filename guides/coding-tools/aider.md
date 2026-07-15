# Aider 终端结对编程助手自定义 API 接入教程

> 最后核验：2026-07-14
>
> 适用范围：当前仍维护的 Aider；自定义接口须兼容 OpenAI Chat Completions

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **需要一个可直接测试的兼容 API？**
>
> [NexoToken](https://www.nexotoken.net/?ref=github) 每天提供 20 次免费额度，新人 1 元可得 300 积分，并支持支付宝、微信直充。活动、额度与计费规则可能调整，**一切以官网最新页面为准**。创建 Key 后，请从控制台复制实际 Base URL 与模型 ID，不要猜写。

## 1. Aider 的定位与兼容边界

Aider 是在终端中运行的结对编程工具。它读取 Git 仓库、把相关文件与仓库地图交给模型，再按选定的 edit format 修改代码。它不是依赖通用 Function Calling 才能编辑文件的 Agent：文件修改主要由 Aider 解析模型文本中的 diff/代码块完成。

本教程使用 Aider 官方的 OpenAI-compatible 路径。接口至少应正确实现：

```text
POST /v1/chat/completions
Authorization: Bearer <你的APIKey>
流式 SSE（建议支持）
```

只支持 `/v1/responses` 或 Anthropic `/v1/messages` 的端点不能按本文直接配置。Base URL 通常填到 `/v1`，Aider/LiteLLM 会追加资源路径；最终以服务端文档为准。

## 2. 安装与验证

官方推荐的隔离安装方式：

```bash
python -m pip install aider-install
aider-install
aider --version
```

也可使用官方安装脚本：

```bash
# macOS / Linux
curl -LsSf https://aider.chat/install.sh | sh
```

Windows 可在 PowerShell 使用官方脚本：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://aider.chat/install.ps1 | iex"
```

若 `aider` 找不到，重新打开终端并检查安装器提示的 PATH；也可先尝试 `python -m aider --version`。

## 3. 准备三个准确参数

```text
API Key：你的APIKey
Base URL：https://你的接口域名/v1
Model ID：从模型列表复制的准确模型ID
```

模型在 Aider 中必须带 LiteLLM provider 前缀：

```text
openai/你的模型ID
```

这里的 `openai/` 表示按 OpenAI 兼容协议发送，不是模型 ID 的一部分。不要把网页展示名称、套餐名称或自行删改后的短名当成 Model ID。

## 4. 临时配置：先验证再持久化

macOS、Linux、WSL：

```bash
export OPENAI_API_KEY="你的APIKey"
export OPENAI_API_BASE="https://你的接口域名/v1"
cd /你的项目目录
aider --model "openai/你的模型ID"
```

Windows PowerShell：

```powershell
$env:OPENAI_API_KEY = "你的APIKey"
$env:OPENAI_API_BASE = "https://你的接口域名/v1"
Set-Location "C:\你的项目目录"
aider --model "openai/你的模型ID"
```

也可显式使用当前 Aider 选项：

```bash
aider --openai-api-base "https://你的接口域名/v1" \
  --model "openai/你的模型ID"
```

不要把 Key 直接写进 shell 历史。首次测试优先使用临时环境变量。

## 5. 持久配置

在用户目录或仓库根目录创建 `.aider.conf.yml`：

```yaml
model: openai/你的模型ID
openai-api-base: https://你的接口域名/v1
show-model-warnings: true
auto-commits: true
```

Key 继续放在环境变量或未提交的 `.env` 中：

```dotenv
OPENAI_API_KEY=你的APIKey
```

如果使用项目 `.env`，立即确认它已加入 `.gitignore`。用户级配置适合通用默认值，仓库级配置适合项目专属模型；当前目录加载的配置优先级更高。

## 6. 未知模型的模型元数据

Aider 从 LiteLLM 读取已知模型的上下文和价格。自定义模型常出现 unknown context window/cost 警告；警告本身不代表接口不可用，但会影响上下文与费用显示。

可在仓库根目录创建 `.aider.model.metadata.json`：

```json
{
  "openai/你的模型ID": {
    "max_tokens": 8192,
    "max_input_tokens": 120000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0,
    "output_cost_per_token": 0,
    "litellm_provider": "openai",
    "mode": "chat"
  }
}
```

这些数字必须来自服务端公开规格。价格未知时填 `0` 只表示本地不估算费用，不会改变实际计费。不要虚报更大的上下文；Aider不会替服务端放宽限制。

必要时可在 `.aider.model.settings.yml` 指定编辑格式：

```yaml
- name: openai/你的模型ID
  edit_format: diff
  use_repo_map: true
  streaming: true
```

先使用默认设置；只有模型经常输出无法应用的编辑块时，才在 `diff`、`whole` 等格式间测试。

## 7. 工具调用与 Agent 限制

- Aider 编辑文件不要求模型原生支持 `tools`，因此“聊天可用但不支持 Function Calling”的模型仍可能工作。
- 模型必须稳定遵循编辑格式；小模型常见漏标记、截断 diff 或覆盖无关代码。
- `/run`、自动 lint 和自动 test 是 Aider 本地执行能力，不等于模型服务端工具调用。
- 多文件、大仓库任务受上下文窗口和仓库地图质量限制。
- 图片、推理参数或提示缓存是否可用，取决于模型、兼容层和 Aider/LiteLLM 的共同支持。

## 8. 审批与安全

Aider 默认会把编辑写入工作区，并常用 Git 自动提交形成检查点。首次使用应在已有 Git 仓库或临时仓库中进行：

```bash
git status
aider --model "openai/你的模型ID"
```

会话内常用安全命令：

```text
/diff       查看本轮改动
/undo       撤销上一轮修改
/commit     人工触发提交
/run 命令   明确执行本地命令
```

不要让 Aider 接触生产凭据、SSH 私钥或未备份数据。可使用 `--no-auto-commits` 禁止自动提交，但这会失去便捷检查点；使用 `--no-git` 前应自行建立可靠备份。自动测试命令也可能有副作用，先人工运行并审查。

## 9. 最小验证

新建临时仓库：

```bash
mkdir aider-api-test && cd aider-api-test
git init
printf '# Aider Test\n' > README.md
git add README.md && git commit -m "initial"
aider --model "openai/你的模型ID"
```

输入：

```text
只在 README.md 末尾增加一行“连接验证成功”，不要修改其他文件。
```

然后执行 `/diff`。通过标准是：请求成功、流式输出正常、只改目标文件、diff 可解析。之后再用 `/run` 执行一个无副作用命令，例如 `git status --short`。

## 10. 常见错误

| 现象 | 原因与处理 |
|---|---|
| 401/403 | Key 无效、额度/权限不足，或变量未传入当前终端；不要打印完整 Key |
| 404 | Base URL 路径错误；通常不要把 `/chat/completions` 写进 Base URL |
| `Unknown model` 警告 | 补充模型元数据，或确认 `openai/模型ID` 写法 |
| 400 `tools`/参数错误 | 兼容层不接受某个可选参数；先恢复默认 model settings，再查服务端协议 |
| diff 无法应用 | 模型不擅长当前 edit format；尝试 `diff`/`whole` 并缩小任务 |
| 429 | 请求过快、并发或额度限制；等待后重试并缩短上下文 |
| SSL 错误 | 修复证书链；不要长期使用 `--no-verify-ssl` |

## 11. 更新、回滚与卸载

使用 `aider-install` 安装时可再次运行安装器更新。pip 安装可执行：

```bash
python -m pip install -U --upgrade-strategy only-if-needed aider-chat
```

升级前记录 `aider --version` 并备份配置。回滚时在隔离环境安装官方发布过的明确版本，不要从第三方站点下载包。卸载应与安装方式一致，例如：

```bash
python -m pip uninstall aider-chat aider-install
```

如使用 `uv tool` 或 `pipx`，分别用对应工具卸载。删除程序不会自动撤销 API Key；还应删除环境变量、未提交的 `.env`，并在控制台撤销不再使用的 Key。

## 12. 官方来源

- [Aider 安装说明](https://aider.chat/docs/install.html)
- [OpenAI-compatible APIs](https://aider.chat/docs/llms/openai-compat.html)
- [配置方式](https://aider.chat/docs/config.html)
- [选项参考](https://aider.chat/docs/config/options.html)
- [高级模型设置与元数据](https://aider.chat/docs/config/adv-model-settings.html)
- [Git 集成](https://aider.chat/docs/git.html)
- [Lint 与测试](https://aider.chat/docs/usage/lint-test.html)
- [Aider 官方 GitHub](https://github.com/Aider-AI/aider)
