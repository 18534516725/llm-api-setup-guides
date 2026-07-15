# Qwen Code 终端编程代理自定义 API 完整教程

> 最后核验：2026-07-15
>
> 适用范围：当前 Qwen Code CLI；支持 OpenAI、Anthropic、Gemini 及相应兼容端点

[← 返回教程目录](../../README.md)

> [!TIP]
> **需要一个兼容端点完成本文验证？**
>
> [纽智中转站](https://www.nexotoken.net/?ref=github) 提供多模型 API、每天 20 次免费额度和新人体验额度。请从控制台复制真实 Base URL 与模型 ID，活动和模型状态以官网实时页面为准。

## 1. Qwen Code 能接什么接口

Qwen Code 是运行在终端里的开源编程代理。当前版本可以在 `~/.qwen/settings.json` 中声明多个模型 Provider，并用 `/model` 切换。

| `modelProviders` 分组 | 服务端应兼容 | 常见 Base URL 形式 |
|---|---|---|
| `openai` | OpenAI SDK 使用的兼容接口 | `https://your-api.example.com/v1` |
| `anthropic` | Anthropic Messages | 服务提供的 Anthropic 根地址 |
| `gemini` | Google GenAI | 服务提供的 Gemini 根地址 |

同一个域名可能同时提供多种协议，但配置不能混写。模型 ID、Base URL、认证头和工具调用格式必须与所选分组一致。

## 2. 安装与验证

当前官方包要求 Node.js 22 或更新版本。使用 npm：

```bash
npm install -g @qwen-code/qwen-code@latest
qwen --version
qwen --help
```

也可以按照官方仓库提供的安装方式操作。升级时再次运行全局安装命令；遇到旧配置问题，先记录版本，不要直接删除 `~/.qwen`。

## 3. 准备安全的环境变量

macOS、Linux、WSL：

```bash
export CUSTOM_API_KEY="YOUR_API_KEY"
```

PowerShell：

```powershell
$env:CUSTOM_API_KEY="YOUR_API_KEY"
```

CMD：

```cmd
set CUSTOM_API_KEY=YOUR_API_KEY
```

推荐把 Key 放在环境变量或 `~/.qwen/.env`，不要写入项目里的 `.qwen/settings.json`。项目配置可能被 Git 提交。

## 4. 配置 OpenAI 兼容模型

编辑用户配置：

```text
macOS/Linux/WSL：~/.qwen/settings.json
Windows：%USERPROFILE%\.qwen\settings.json
```

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "YOUR_MODEL_ID",
        "name": "自定义编程模型",
        "description": "OpenAI-compatible API",
        "baseUrl": "https://your-api.example.com/v1",
        "envKey": "CUSTOM_API_KEY",
        "generationConfig": {
          "timeout": 120000,
          "maxRetries": 2,
          "contextWindowSize": 128000
        }
      }
    ]
  },
  "security": {
    "auth": { "selectedType": "openai" }
  },
  "model": { "name": "YOUR_MODEL_ID" }
}
```

`envKey` 是环境变量名称，不是 Key 本身。`id` 是请求真正发送的模型 ID，`name` 只负责显示。`contextWindowSize` 要按模型真实规格填写。

## 5. 配置 Anthropic Messages 模型

若服务明确提供 Anthropic Messages 兼容地址，可在同一文件加入：

```json
{
  "modelProviders": {
    "anthropic": [
      {
        "id": "YOUR_MODEL_ID",
        "name": "自定义 Claude 模型",
        "baseUrl": "YOUR_ANTHROPIC_BASE_URL",
        "envKey": "CUSTOM_API_KEY"
      }
    ]
  },
  "security": {
    "auth": { "selectedType": "anthropic" }
  },
  "model": { "name": "YOUR_MODEL_ID" }
}
```

这是一个完整示例。合并多个 Provider 时只能保留一个顶层 JSON 对象，不要把两个对象直接首尾拼接。

## 6. 临时命令行验证

不想先改配置文件时，可以运行：

```bash
qwen \
  --auth-type openai \
  --model "YOUR_MODEL_ID" \
  --openaiApiKey "$CUSTOM_API_KEY" \
  --openaiBaseUrl "https://your-api.example.com/v1"
```

命令行参数可能出现在 Shell 历史中。只在自己的电脑临时验证，长期使用仍应通过环境变量和 Provider 配置管理凭据。

## 7. 第一次安全测试

```bash
mkdir qwen-code-test && cd qwen-code-test
git init
printf '# Qwen Code Test\n' > README.md
qwen
```

先输入：

```text
只读取 README.md 并告诉我标题，不要修改文件，不要执行其他命令。
```

然后运行 `/model` 检查当前模型，再测试一次受控写入：

```text
在 README.md 末尾增加一行“API 连接测试”，展示修改内容，不要提交 Git。
```

退出后检查 `git diff`。普通回答成功只证明文本对话可用；能正确发起工具调用、获得审批并产生预期 diff，才说明编程代理链路基本完整。

## 8. 工具调用与兼容限制

- OpenAI-compatible 端点需要正确处理 `tools`、`tool_choice`、流式工具参数和工具结果消息；
- Anthropic 端点需要兼容 Messages 的 content blocks 与工具调用语义；
- 图片、PDF、缓存、推理参数只能在模型和服务端都支持时开启；
- 自定义 Header 可放在 `generationConfig.customHeaders`，但禁止把固定 Bearer Token 提交进项目；
- `extra_body` 只适用于 OpenAI 兼容 Provider，Anthropic 与 Gemini 不会按同样方式处理。

## 9. 常见错误

| 现象 | 处理方法 |
|---|---|
| 模型不出现在 `/model` | 检查分组名必须是有效 auth type；确认 JSON 有效、`id` 未重复 |
| 401 | 环境变量未加载、`envKey` 拼错或 Key 无效；重新开终端后检查 |
| 404 | Base URL 多写了完整资源路径，或所选协议与服务端不一致 |
| 400 unknown field | 兼容层不接受工具、推理或多模态字段；用最小配置复测 |
| 普通聊天正常但不改文件 | 服务端工具调用格式不完整，或模型本身不适合 Agent |
| 429 | 降低并发和自动重试次数，等待服务端限流窗口恢复 |
| 请求很快截断 | 修正 `contextWindowSize` 与输出限制，新建会话再测 |

## 10. 官方来源

- [Qwen Code 官方仓库](https://github.com/QwenLM/qwen-code)
- [Model Providers 配置](https://github.com/QwenLM/qwen-code/blob/main/docs/users/configuration/model-providers.md)
- [Settings 配置参考](https://github.com/QwenLM/qwen-code/blob/main/docs/users/configuration/settings.md)
