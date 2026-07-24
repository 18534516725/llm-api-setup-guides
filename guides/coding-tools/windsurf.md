# Windsurf BYOK 配置、适用范围与排错教程

> 最后核验：2026-07-24
>
> 适用范围：当前 Windsurf Editor 个人用户的官方 BYOK 功能
>
> 预计用时：5～10 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 先看结论

Windsurf 的 BYOK 不是任意 OpenAI-compatible Base URL 配置器。根据当前官方文档：

- BYOK 仅面向免费和付费的个人用户；
- 只有模型选择器中标记 `BYOK` 的模型能使用自有 Key；
- 当前官方列出的 BYOK 范围是指定 Claude 4 Sonnet / Opus 及 Thinking 变体；
- 官方入口用于添加对应服务的 API Key，没有承诺任意第三方 Base URL。

如果你的目标是填写“自定义 Base URL + 任意模型 ID”，Windsurf 当前官方 BYOK 不适合这个需求。不要通过修改二进制、抓取会话令牌或劫持网络请求来绕过产品限制。

## 2. BYOK 与 Windsurf 内置模型的区别

| 方式 | Key 由谁提供 | 模型范围 | 是否支持任意 Base URL |
|---|---|---|---|
| Windsurf 内置模型 | Windsurf | 以 IDE 模型选择器为准 | 不适用 |
| 官方 BYOK | 用户 | 仅标有 BYOK 的受支持模型 | 官方未提供通用入口 |
| 其他编辑器的 OpenAI Compatible | 用户 | 取决于编辑器和接口 | 有些工具支持，但不代表 Windsurf 支持 |

BYOK 只改变受支持模型的认证来源，不代表 Tab、Fast Context、索引、部署和其他专有功能都会改走你的 Key。

## 3. 准备工作

开始前确认：

1. 使用个人账户，而不是依赖组织统一管理的账号；
2. Windsurf 已更新到当前稳定版；
3. 已从对应官方 API 控制台创建 API Key；
4. Key 有目标模型权限和可用额度；
5. 不把网页订阅当成 API 额度。

聊天产品订阅和开发 API 通常独立计费。即使已经购买聊天订阅，也不等于拥有可用于 BYOK 的 API Key 或余额。

## 4. 添加自己的 Key

当前官方流程：

1. 打开 Windsurf；
2. 进入订阅或账户设置中的 BYOK 配置页；
3. 添加官方支持服务的 API Key；
4. 返回 Cascade；
5. 打开输入框下方的模型选择器；
6. 选择带 `BYOK` 标记的模型；
7. 新建会话完成最小测试。

如果模型没有 `BYOK` 标记，填入 Key 不会让它自动变成 BYOK 模型。支持列表可能变化，应以当前 IDE 模型选择器和官方 Models 页面为准。

## 5. 最小验证

先发送不涉及项目内容的短消息：

```text
只回复：BYOK 连接成功
```

再打开一个临时仓库，测试只读任务：

```text
只读取 README.md 并概括，不要修改文件，不要运行命令。
```

最后测试受控编辑：

```text
在 README.md 末尾新增一行“Windsurf BYOK 测试”，先展示 diff，不要提交。
```

验收时同时确认：

- Windsurf 没有认证错误；
- 目标模型旁显示 BYOK；
- 对应 API 控制台出现调用或用量；
- 文件变更只包含预期内容；
- 没有自动执行危险终端命令。

## 6. 哪些能力不能只靠一次回复判断

即使文字问答成功，也要分别测试：

- Cascade 是否能读取工作区上下文；
- 工具调用能否正确开始和结束；
- 长对话是否触发上下文或额度问题；
- Thinking 变体是否被账号和 Key 支持；
- 模型切换后是否仍然是 BYOK；
- 额度、速率限制和并发是否满足工作流。

“模型能回答”只证明基础认证和单次请求大致正常，不代表整个 Agent 链路都完整。

## 7. 隐私与安全边界

使用 BYOK 时，提示词、被选择的代码上下文、工具信息等仍可能经过 Windsurf 客户端和对应模型服务。BYOK 不等于离线运行，也不等于所有数据只在你的账户与模型服务之间直连。

建议：

- 为 Windsurf 单独创建 Key；
- 设置合理额度和告警；
- 不在截图、Issue、聊天记录或仓库中展示 Key；
- 离职、设备丢失或发现异常用量时立即撤销；
- 处理公司代码前核对组织政策、Windsurf 隐私说明和模型服务的数据规则；
- 第一次测试使用无敏感数据的临时仓库。

## 8. 常见错误

| 现象 | 原因与处理 |
|---|---|
| 找不到 BYOK | 确认是个人用户、客户端已更新，并查看模型选择器 |
| 模型没有 BYOK 标记 | 当前模型不在官方支持范围，不能靠填 Key 强制开启 |
| 输入 Key 后仍报错 | 检查 Key 是否完整、有效、有额度并有目标模型权限 |
| 想填写自定义 Base URL | 当前官方 BYOK 不是通用兼容端点功能，应选择明确支持自定义 Provider 的工具 |
| 429 | 触发模型服务限流或额度限制，等待后重试并降低并发 |
| 模型切换后用量不再出现 | 检查是否切回 Windsurf 内置模型 |
| 聊天正常但编辑失败 | 继续检查 Cascade 工具能力、权限和模型兼容性 |

## 9. 如何安全轮换 Key

1. 在模型服务控制台创建新 Key；
2. 在 Windsurf BYOK 设置中替换；
3. 新建会话完成最小验证；
4. 确认新 Key 产生请求；
5. 撤销旧 Key；
6. 检查旧 Key 最近用量是否异常。

如果配置页不支持直接替换，可删除旧 Key 后添加新 Key。不要长期保留多个用途不明的 Key。

## 10. 什么时候应该换工具

以下需求不应硬套 Windsurf BYOK：

- 必须填写自定义 Base URL；
- 必须使用任意模型 ID；
- 需要连接本地 Ollama 或 LM Studio；
- 需要完全自托管的模型链路；
- 需要精确控制 OpenAI Chat Completions / Responses 协议。

这类场景可优先查看本仓库中的 [Cline](./cline.md)、[Continue](./continue.md)、[Zed](./zed.md)、[Ollama](../local-models/ollama.md) 或 [LM Studio](../local-models/lm-studio.md) 教程。

## 11. 官方资料

- [Windsurf AI Models 与 BYOK](https://docs.windsurf.com/zh/windsurf/models)
- [Windsurf Getting Started](https://docs.windsurf.com/windsurf/getting-started)
- [Windsurf Privacy](https://windsurf.com/privacy)
- [Windsurf Security](https://windsurf.com/security)

> BYOK 支持模型和账户规则会变化。最终以 Windsurf 当前官方文档和 IDE 模型选择器为准。
