# Roo Code 历史配置与迁移指南：停止运营后的存量用户说明

> 最后核验：2026-07-14
>
> 适用范围：已经安装 Roo Code 的存量用户、配置导出与迁移排查
>
> 停运提醒：Roo Code 扩展已停止运营，官方 GitHub 仓库于 2026-05-15 归档；本文不建议新用户安装，仅保留历史配置和迁移资料

[← 返回教程目录](../教程总目录.md)

> [!TIP]
> **正在把存量配置迁移到仍维护的编程工具？**
>
> **[纽智中转站](https://www.nexotoken.net/?ref=github)** 每天提供 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。迁移到 Cline 或 Continue 后，可以用新建 Key 和控制台给出的 Base URL 做最小验证。
>
> **[👉 获取迁移后的测试 Key](https://www.nexotoken.net/?ref=github)**

## 1. Roo Code 是什么

Roo Code 是 VS Code 系编辑器中的开源编程 Agent，可以读取文件、修改代码、运行命令，并通过不同 Mode 组织任务。它提供独立的 `OpenAI Compatible` 配置入口，可填写 Base URL、API Key、模型与模型元数据。

截至本文核验日期，扩展已经停止运营，官方仓库归档且不再接受常规代码更新。现有扩展和文档只适合作为历史参考，后续模型协议变化、编辑器升级和安全问题不会获得正常维护。**新用户请直接选择仍在维护的 [Cline](./cline.md) 或 [Continue](./continue.md)。**

## 2. 最关键的兼容限制：只支持原生工具调用

Roo Code 官方文档明确说明，OpenAI Compatible 提供商只使用原生工具调用，没有 XML 工具协议回退。

这意味着模型与接口必须完整支持：

- OpenAI 风格 `tools` 数组；
- `tool_choice`；
- assistant 返回的 `tool_calls`；
- 流式工具调用参数增量；
- 后续 `tool` 角色消息；
- 多轮、连续工具调用。

如果模型只能聊天，或只能通过提示词模拟工具调用，就不能可靠运行 Roo Code。配置界面中勾选“支持工具”也不会给模型凭空增加能力。

## 3. 停运后的处理建议

### 新用户

不要再安装 Roo Code，也不要从网盘、群文件或非官方镜像寻找旧版 VSIX。直接使用仍在维护的 [Cline](./cline.md) 或 [Continue](./continue.md)。

### 已安装用户

1. 记录现有 Provider 类型、Base URL 结构、模型 ID 和高级参数，**不要导出或截图完整 Key**；
2. 在目标工具中新建 Key 并重新配置，不要继续复制长期使用的旧 Key；
3. 用临时目录测试文本、工具调用、文件审批和命令审批；
4. 确认迁移成功后撤销 Roo Code 使用的旧 Key；
5. 卸载扩展并检查工作区是否残留不再需要的配置或自动批准规则。

下文配置步骤只用于帮助存量用户理解旧配置并完成迁移，不代表建议继续长期使用。

## 4. 准备参数

```text
Base URL: 从控制台复制的OpenAI兼容BaseURL
API Key: 你的APIKey
Model ID: 从模型列表复制的准确模型ID
```

同时确认该模型明确支持原生 Function Calling / Tool Calling。只标注“支持 OpenAI 接口”还不够。

## 5. 创建 OpenAI Compatible 配置档

1. 打开 Roo Code 面板；
2. 点击齿轮进入 `Settings → Providers`；
3. 点击配置档选择器旁边的 `+`；
4. 给配置档起一个易识别的名字，例如 `自定义-代码模型`；
5. 在 `API Provider` 选择 `OpenAI Compatible`；
6. 填写 Base URL；
7. 填写 API Key；
8. 选择或输入准确 Model ID；
9. 按实际能力填写 Model Configuration；
10. 保存配置档并切换到它。

Roo Code 的 API Configuration Profiles 可以分别保存提供商、Key、模型、温度、思考预算、限流间隔和模型专属设置。

## 6. Base URL 与 Model ID

Base URL 通常到版本前缀为止，例如：

```text
https://你的接口域名/v1
```

不要填完整的 `/chat/completions`。也不要猜测是否应带 `/v1`，以服务商针对 Roo Code/OpenAI 兼容客户端的说明为准。

Model ID 必须是 API 请求实际使用的字符串。不要填写网页展示名，也不要自行删掉前缀、日期或版本后缀。

## 7. Model Configuration 怎么填

官方配置页列出的高级项包括：

| 配置 | 作用 | 填写原则 |
|---|---|---|
| Max Output Tokens | 最大输出长度 | 不超过接口限制 |
| Context Window | 总上下文窗口 | 按真实值填写 |
| Image Support | 图片输入 | 模型和网关都支持才开启 |
| Computer Use | 计算机交互能力 | 不确定时关闭 |
| Input Price | 输入价格估算 | 只影响本地统计 |
| Output Price | 输出价格估算 | 只影响本地统计 |

价格字段不是计费配置，填错不会改变平台实际扣费。上下文与输出上限填得过高，反而可能产生 400 或截断。

## 8. 配置请求间隔

每个 Profile 可以设置 Rate Limit，即两次请求之间的最小等待秒数。默认 `0` 表示不主动限速。

如果经常遇到 429，可尝试：

- 将请求间隔设为 1～3 秒；
- 减少同时运行的任务；
- 缩短上下文；
- 不在失败后连续点击重试。

本地请求间隔只能降低突发频率，不能绕过服务端额度或并发上限。

## 9. 第一次验证

### 纯文本

```text
只回复：连接成功。不要调用工具。
```

### 原生工具调用

```text
读取当前项目根目录文件列表，然后停止。不要修改文件。
```

观察任务时间线中是否出现结构化工具调用、参数和工具结果。

### 多轮工具调用

```text
读取 README，再根据其中的测试命令检查 package.json。只读取，不执行命令。
```

### 最小写操作

先提交或备份工作区，再让 Roo Code 在临时文件中做一次小改动。确认 diff 与审批流程正常后，才用于真实任务。

## 10. 如何判断工具调用兼容

兼容时应看到：

1. 模型返回工具名；
2. 参数 JSON 完整、可解析；
3. Roo Code 执行或请求批准；
4. 工具结果回传给模型；
5. 模型基于结果继续或结束。

以下现象通常表示不兼容：

- 模型把工具调用当普通文本输出；
- 参数 JSON 截断；
- 请求包含 tools 后直接 400；
- 工具执行完成后模型重复相同调用；
- 流式响应中工具名有、参数为空；
- 简单聊天正常，一进入任务就失败。

## 11. Profile 切换与 Mode 绑定

Roo Code 可以：

- 从 Settings 的下拉框切换 Profile；
- 在聊天界面切换 Profile；
- 将 Profile 与特定 Mode 关联；
- 为常用 Profile 置顶；
- 让每个已开始的任务保持原来的 Profile。

“任务保持原 Profile”很重要：切换全局配置后，旧任务可能仍使用开始时的模型。验证新配置时应新建任务，而不是继续旧会话。

## 12. 权限与自动批准

Roo Code 能操作文件和终端。建议：

- 第一次使用关闭自动批准；
- 先从只读任务开始；
- 命令执行逐条审核；
- 不自动批准删除、部署、Git 推送、网络上传；
- 使用 `.rooignore` 排除秘密文件；
- 每个大任务前建立 Git 提交或工作区备份。

模型质量差时，自动批准会把“偶尔错误”放大为连续错误。

## 13. Key 存储与配置导出

官方文档称 API Key 存储于 VS Code Secret Storage。仍需注意：

- 不把 Key 写进项目文件；
- 不在截图中展示设置页；
- 导出设置前检查是否包含敏感字段；
- 操作系统账号被入侵时，Secret Storage 也不是绝对安全；
- 不再使用的 Key 应在服务端撤销。

## 14. 常见错误

### Invalid API Key / 401

- Key 无效或已撤销；
- Base URL 与 Key 不匹配；
- Key 前后有空格；
- 服务端认证格式不兼容。

### 404

- Base URL 路径错误；
- 重复或缺失 `/v1`；
- 把 endpoint 当 Base URL；
- 选择了错误协议。

### Model Not Found

- Model ID 错误；
- Key 无模型权限；
- 当前 Profile 仍指向旧模型；
- 旧任务保留了创建时的 Profile。

### Tool-calling error / 400

Roo Code 没有 XML 工具回退。必须换用原生工具调用兼容的模型和接口，不能靠关闭某个显示选项解决。

### 流式参数解析失败

接口可能只在非流式模式返回完整 tool call，却没有正确实现流式增量。Roo Code 依赖流式工具事件时就会失败。

### 429

增加 Profile 请求间隔，减少并发，等待限流恢复。

### 更换 Profile 后仍调用旧模型

旧任务会记住起始 Profile。新建任务测试，必要时重载 VS Code 窗口。

## 15. 回滚与卸载

### 切回其他配置

1. 打开 Providers；
2. 选择之前可用的 Profile；
3. 新建任务验证；
4. 确认后再删除测试 Profile；
5. 在服务端撤销不用的 Key。

### 撤销代码改动

使用 Roo Code Checkpoint（若当前版本可用）或 Git：

```bash
git status
git diff
```

不要在有未提交用户改动的工作区中使用粗暴恢复命令。

### 卸载前

由于项目已归档，若决定迁移：先备份必要的规则和非敏感配置，再卸载扩展；不要把 API Key 连同配置备份长期存放。

## 16. 官方资料

- [Roo Code：连接提供商](https://docs.roocode.com/getting-started/connecting-api-provider)
- [Roo Code：OpenAI Compatible](https://docs.roocode.com/providers/openai-compatible)
- [Roo Code：API Configuration Profiles](https://docs.roocode.com/features/api-configuration-profiles)
- [Roo Code 官方 GitHub（已归档）](https://github.com/RooCodeInc/Roo-Code)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline)

> 本文保留是为了服务现有用户。新部署应把“仓库已归档、无后续安全更新承诺”纳入技术选型，而不是只看当前能否连接。
