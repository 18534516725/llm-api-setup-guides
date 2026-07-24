# VS Code / GitHub Copilot BYOK 与 Custom Endpoint 接入教程

> 最后核验：2026-07-24
>
> 适用范围：当前稳定版 Visual Studio Code 的 Language Models / BYOK 功能
>
> 预计用时：5～15 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合所选协议并满足 VS Code Agent 要求的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先分清 VS Code BYOK 与 Copilot 订阅

VS Code 当前允许添加自己的模型 Key 或 Custom Endpoint，并在 Chat 中使用。官方文档明确：

- BYOK Chat 无需 GitHub 登录；
- 无需购买 Copilot 计划；
- 可以连接受支持云端 Provider、本地模型或自定义端点；
- BYOK 主要覆盖 Chat 和 Utility Tasks；
- 语义搜索、内联代码补全和依赖 Embedding 的部分功能仍需要 GitHub / Copilot 服务。

因此，“BYOK Chat 能用”不等于 GitHub Copilot 的所有功能都能由自定义模型替代。

## 2. 准备信息

自定义端点需要：

```text
API Key: YOUR_API_KEY
API Type: Chat Completions / Responses / Messages
Endpoint URL: 对应协议的完整请求地址
Model ID: YOUR_MODEL_ID
Context: 真实输入与输出上限
```

Custom Endpoint 使用完整模型 URL，不要把三个协议混用：

```text
Chat Completions: https://your-api.example.com/v1/chat/completions
Responses:        https://your-api.example.com/v1/responses
Messages:         https://your-api.example.com/v1/messages
```

## 3. 打开 Language Models 管理器

任选一种方式：

1. 打开 Chat；
2. 点击模型选择器；
3. 选择齿轮图标 `Manage Language Models`；

或打开命令面板，运行：

```text
Chat: Manage Language Models
```

管理器可以查看模型能力、上下文、可见性和 Provider 分组。

## 4. 添加内置 Provider

如果服务已出现在 Provider 列表中：

1. 点击 `Add Models`；
2. 选择对应 Provider；
3. 输入分组名称；
4. 填写 API Key 和 Provider 要求的地址；
5. 根据提示补充模型信息；
6. 保存后从 Chat 模型选择器选中模型。

不同 Provider 的认证与 URL 规则不同。不要把某个 Provider 的 Base URL 直接套到另一个 Provider。

## 5. 添加 Custom Endpoint

自托管或兼容服务使用：

1. `Chat: Manage Language Models`；
2. 点击 `Add Models`；
3. 选择 `Custom Endpoint`；
4. 输入模型分组名称；
5. 输入显示名和 API Key；
6. 选择 `Chat Completions`、`Responses` 或 `Messages`；
7. VS Code 打开 `chatLanguageModels.json`；
8. 填写模型 ID、完整 URL、能力和上下文；
9. 保存并重启 VS Code（模型未出现时）。

`Custom Endpoint` 已替代旧的 OpenAI Compatible 入口；旧设置 `github.copilot.chat.customOAIModels` 已被官方标记为弃用，不建议新教程继续使用。

## 6. 配置示例

以下是结构示例，字段值必须改成接口真实信息：

```json
[
  {
    "name": "My API",
    "vendor": "customendpoint",
    "apiKey": "YOUR_API_KEY",
    "apiType": "responses",
    "models": [
      {
        "id": "YOUR_MODEL_ID",
        "name": "My Coding Model",
        "url": "https://your-api.example.com/v1/responses",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 120000,
        "maxOutputTokens": 8000
      }
    ]
  }
]
```

注意：

- `apiType` 必须与 URL 协议一致；
- `id` 是服务实际模型 ID；
- `toolCalling` 只能在端点完整支持工具调用时开启；
- 输入与输出上限之和不能超过真实上下文窗口；
- 不要把含真实 Key 的配置复制到仓库、Issue 或截图中。

## 7. Agent 为什么看不到模型

VS Code 官方说明：用于 Agent 的模型必须支持 Tool Calling。普通文字聊天可用，但模型没有工具能力时，可能不会出现在 Agent 模型列表。

验证顺序：

1. 普通 Chat 非流式；
2. 多轮对话；
3. 流式输出；
4. 单个只读工具；
5. 文件编辑；
6. 终端审批。

不要把 `toolCalling` 强行设为 `true` 来“解锁”模型。服务端不支持时会出现 400、空工具调用或循环。

## 8. 本地模型

VS Code BYOK 可以在无需 GitHub 登录、Copilot 计划和互联网连接的情况下使用本地模型 Chat。

当前官方建议 Ollama 用户安装 Ollama 官方发布的 VS Code 模型 Provider 扩展；旧的内置 Ollama Provider 已弃用。也可以通过支持的 Provider 扩展连接其他本地运行时。

参考：

- [Ollama 本地模型教程](../local-models/ollama.md)
- [LM Studio 本地 API Server](../local-models/lm-studio.md)

本地模型目前不能通过 VS Code BYOK 接管内联建议；语义搜索和依赖 Embedding 的功能也不属于离线 BYOK 范围。

## 9. Utility Models

标题、摘要、提交信息、重命名建议和意图识别等后台任务可以单独选择模型：

```json
{
  "chat.utilityModel": "你的通用模型",
  "chat.utilitySmallModel": "你的快速低成本模型"
}
```

具体值从当前设置候选中选择，不要手写不存在的展示名。小任务建议使用延迟低、成本低的模型，复杂 Chat 再使用更强模型。

## 10. Business / Enterprise 管理策略

Copilot Business 或 Enterprise 用户是否能使用 BYOK，取决于组织管理员是否启用 `Bring Your Own Language Model Key in VS Code` 策略。

如果个人 VS Code 有入口、公司设备却没有：

- 不要尝试绕过组织策略；
- 联系组织管理员确认政策；
- 检查工作区是否处于 Restricted Mode；
- 确认使用的 VS Code 版本和账号类型。

## 11. 安全建议

- 每个工具使用独立 Key；
- 为 Key 设置额度、模型范围和告警；
- 不在工作区文件中保存真实 Key；
- 第一次在临时仓库测试 Agent；
- 保留文件写入和终端命令确认；
- 使用 HTTPS 远程端点；
- 泄露后立即撤销并检查用量；
- 企业代码遵守组织的数据和模型使用政策。

## 12. 常见问题

| 现象 | 处理 |
|---|---|
| 找不到 Manage Language Models | 更新 VS Code，确认 Chat 功能可用 |
| Custom Endpoint 404 | 检查是否填写了所选协议的完整 Endpoint |
| 401 | Key 错误、过期或认证格式不兼容 |
| 模型不在 Agent 列表 | 模型未声明或未真正支持 Tool Calling |
| 模型保存后不出现 | 重启 VS Code，检查 JSON 和 Provider 配置 |
| Chat 正常但内联补全没变化 | BYOK Chat 不等于接管 Inline Suggestions |
| 本地模型没有语义搜索 | 语义搜索与 Embedding 功能仍依赖相关服务 |
| 公司账号没有 BYOK | 需要管理员启用组织政策 |
| 上下文显示错误 | 修正 `maxInputTokens` 和 `maxOutputTokens`，两者之和不得超真实窗口 |

## 13. 官方资料

- [VS Code：AI Language Models 与 BYOK](https://code.visualstudio.com/docs/agent-customization/language-models)
- [VS Code BYOK 发布说明](https://code.visualstudio.com/blogs/2026/06/18/byok-vscode)
- [GitHub Copilot BYOK 概念](https://docs.github.com/en/copilot/concepts/models/bring-your-own-key)
- [VS Code AI 安全](https://code.visualstudio.com/docs/copilot/security)
