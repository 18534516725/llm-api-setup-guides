# Qoder CLI 安装、Custom Models 与使用边界

> 最后核验：2026-07-24
>
> 适用范围：Qoder CLI；macOS、Linux、Windows Terminal
>
> 预计用时：10～20 分钟

[← 返回教程目录](../教程总目录.md)

## 1. 先理解 Qoder CLI 的模型体系

Qoder CLI 是运行在终端中的编程代理，可以读取项目、修改文件、执行命令并调用 MCP 工具。它的模型选择分为三类：

- **Tiered Models**：Lite、Efficient、Auto、Performance、Ultimate 等平台模型档位；
- **Frontier Models**：Qoder 在一段时间内提供的前沿模型；
- **Custom Models**：使用自己在受支持供应商处申请的 API Key。

需要特别注意：Qoder 的 Custom Models 并不是任意 OpenAI-compatible Base URL。官方当前采用受控的供应商和模型列表，用户选择供应商、模型并填写 API Key，不能据此推断它支持任意中转地址或本地模型服务。

Custom Models 当前适用于个人方案，不适用于 Teams 账号。使用自定义模型时，模型费用由对应供应商结算，不消耗 Qoder Credits；但 Browser Agent、Code Review Agent、Repo Wiki 等使用固定模型的功能仍可能消耗 Credits。

## 2. 安装

### macOS 或 Linux：安装脚本

```bash
curl -fsSL https://qoder.com/install | bash
```

### macOS 或 Linux：Homebrew

```bash
brew install qoderai/qoder/qodercli --cask
```

### macOS、Linux 或 Windows：npm

先安装受支持的 Node.js，再执行：

```bash
npm install -g @qoder-ai/qodercli
```

检查版本：

```bash
qodercli --version
```

官方当前支持 arm64、amd64；Windows on Arm 暂不支持。Windows 用户应在 Windows Terminal 中使用 npm 安装方式。

## 3. 登录

直接启动：

```bash
qodercli
```

首次运行会引导登录。也可以在交互界面输入：

```text
/login
```

可选择浏览器登录，或粘贴在 Qoder 账户页面生成的 Personal Access Token。

在 CI 等非交互环境中，可以使用环境变量：

=== "macOS / Linux"

    ```bash
    export QODER_PERSONAL_ACCESS_TOKEN="YOUR_QODER_PERSONAL_ACCESS_TOKEN"
    qodercli
    ```

=== "Windows PowerShell"

    ```powershell
    $env:QODER_PERSONAL_ACCESS_TOKEN="YOUR_QODER_PERSONAL_ACCESS_TOKEN"
    qodercli
    ```

不要把 Personal Access Token 写入公开仓库、终端截图或构建日志。

## 4. 选择内置模型

进入 Qoder CLI 后输入：

```text
/model
```

在模型选择器中：

- 使用方向键移动；
- 使用 `Tab` 切换 Tiered、Frontier、Custom；
- 按 `Enter` 确认；
- 按 `Esc` 退出。

选择结果会保存到：

```text
~/.qoder/settings.json
```

也可以只为当前会话指定模型档位：

```bash
qodercli --model lite
qodercli --model efficient
qodercli --model auto
```

命令行参数不会覆盖持久化选择。

## 5. 添加 Custom Model

在 Qoder CLI 中：

1. 输入 `/model`；
2. 切换到 **Custom**；
3. 选择 **Add custom model...**；
4. 依次选择 Provider、Model Type、Model；
5. 输入该供应商签发的 API Key；
6. 等待连接验证；
7. 保存后选择该模型。

官方当前列出的供应商包括 Alibaba Cloud Model Studio、DeepSeek、Z.ai、Kimi 和 MiniMax。实际列表可能通过产品更新发生变化，应以 `/model` 中的 Custom 页面为准。

如果手里的服务只提供以下信息：

```text
Base URL + API Key + 任意模型 ID
```

但不在 Qoder 的 Custom Provider 列表里，就不能按通用 OpenAI-compatible 方法直接接入。此时应选择支持自定义 Base URL 的工具，而不是修改未知配置文件强行绕过。

## 6. 第一次验证

在一个测试 Git 仓库中启动：

```bash
mkdir qoder-cli-test
cd qoder-cli-test
git init
qodercli
```

先使用只读任务：

```text
请列出当前目录结构，并说明你没有修改任何文件。
```

再测试一个可审查的小改动：

```text
创建 README.md，写入项目名称和一句用途说明。执行前先告诉我将修改什么。
```

完成后退出 Qoder，再检查：

```bash
git status --short
git diff
```

不要第一次就在包含密钥、生产配置或未提交重要改动的项目中测试自动编辑。

## 7. MCP 工具

Qoder CLI 支持 MCP。添加一个 stdio MCP Server 的官方命令形式：

```bash
qodercli mcp add playwright -- npx -y @playwright/mcp@latest
```

CLI 已经运行时，可在交互界面重新加载：

```text
/mcp reload
```

MCP Server 获得的权限取决于启动命令和运行环境。接入文件系统、浏览器、数据库或云服务前，应确认：

- 工具能访问哪些目录和账户；
- 是否会执行写入、发送、删除或付费操作；
- 是否需要人工确认；
- 日志中会不会记录提示词、密钥和业务数据。

## 8. 自动更新设置

Qoder CLI 默认启用自动更新。手动更新：

```bash
qodercli update
```

如需关闭自动更新，编辑 `~/.qoder/settings.json`：

```json
{
  "general": {
    "enableAutoUpdate": false
  }
}
```

关闭后需要自行关注版本与安全更新。

## 9. 常见问题

| 现象 | 排查方法 |
|---|---|
| `qodercli` 找不到 | 重新打开终端，检查 npm、Homebrew 或安装脚本的 bin 目录是否在 `PATH` |
| 登录后仍要求认证 | 检查 PAT 是否有效；交互登录优先于环境变量 |
| Custom 页面为空 | 确认账号类型；Teams 当前不支持 Custom Models |
| 找不到任意 Base URL 输入框 | 这是当前产品边界，不要把 Custom Models 当作通用兼容端点 |
| 添加自定义模型失败 | 检查 Key、供应商账户余额、网络和所选模型权限 |
| 模型能对话但 Agent 失败 | 用测试仓库检查文件读写和工具能力；不同模型的工具调用能力不同 |
| Credits 仍有消耗 | 检查是否调用 Browser Agent、Code Review Agent 或 Repo Wiki 等固定模型功能 |

## 10. 官方来源

- [Qoder CLI Quick Start](https://docs.qoder.com/en/cli/quick-start)
- [Qoder CLI Model](https://docs.qoder.com/en/cli/model)
- [Qoder Custom Models](https://docs.qoder.com/user-guide/chat/custom-models)
- [Qoder CLI MCP Servers](https://docs.qoder.com/en/cli/mcp-servers)
