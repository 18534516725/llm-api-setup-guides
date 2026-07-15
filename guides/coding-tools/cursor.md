# Cursor 接入自定义 OpenAI 兼容 API：配置、验证与限制说明

> 最后核验：2026-07-14
>
> 适用范围：Cursor 桌面版的 BYOK（自带 API Key）功能
>
> 重要结论：Cursor 官方只承诺受支持供应商的 BYOK；通用 `Override OpenAI Base URL` 属于兼容入口，不等于任意 OpenAI 兼容服务都能完整运行 Cursor Agent

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先看结论：Cursor 的兼容范围比普通聊天客户端窄

Cursor 支持在 `Cursor Settings → Models` 中填写自己的 API Key。官方文档明确说明：

- 自定义 Key 只适用于标准聊天模型；
- Tab Completion 等依赖专用模型的功能仍使用 Cursor 内置服务；
- OpenAI BYOK 官方只承诺标准、非推理聊天模型；
- 即使使用自己的 Key，请求仍会经过 Cursor 后端完成最终提示词组装；
- “填写了自定义 Base URL”并不代表 Cursor 的全部内置模型、Agent、补全和后台功能都会走该地址。

因此，Cursor 更适合把 OpenAI 兼容接口用于普通 Chat 或部分模型调用。若你的核心诉求是让编程 Agent 完整走自定义接口，优先考虑仍在维护的 Cline 或 Continue。

## 2. 支持能力速查

| 能力 | 自定义 OpenAI 兼容接口的预期情况 |
|---|---|
| 标准 Chat | 兼容性最好，仍需实际验证 |
| 自定义模型 ID | 取决于当前版本是否提供添加模型入口 |
| Agent 工具调用 | 不保证；依赖模型、接口和 Cursor 当前实现 |
| 推理模型 | OpenAI BYOK 官方文档标注为不支持 |
| Tab Completion | 不走自定义 Key，继续使用 Cursor 内置模型 |
| Apply、索引、后台模型 | 可能依赖 Cursor 自有服务，不应视为完全 BYOK |
| 完全直连 | 否；官方说明请求仍经过 Cursor 后端 |

## 3. 准备清单

- Cursor 账号；
- 有效 API Key；
- 服务商明确提供的 OpenAI 兼容 Base URL；
- 可用的准确模型 ID；
- 一个不含敏感数据的测试项目；
- 服务端至少能处理流式 `POST /v1/chat/completions`。

不要把控制台中的“网站地址”“充值地址”当成 Base URL，也不要把完整的 `/chat/completions` 请求路径填进 Base URL。

## 4. 安装 Cursor

1. 打开 [Cursor 下载页](https://cursor.com/downloads)；
2. 下载与你的 Windows、macOS 或 Linux 系统匹配的安装包；
3. 完成安装并启动 Cursor；
4. 登录账号；
5. 如需迁移 VS Code，在 `Cursor Settings → General → Account` 中使用 VS Code Import。

打开 Cursor 设置的常用快捷键是 `Ctrl/Cmd + Shift + J`。也可以用命令面板搜索 `Cursor Settings`。

## 5. 配置 API Key 与 Base URL

不同版本的设置项位置和文字可能略有变化，按以下顺序查找：

1. 打开 `Cursor Settings`；
2. 进入 `Models`；
3. 找到 `API Keys` 或 OpenAI 配置区；
4. 启用 OpenAI API Key；
5. 在 Key 输入框填写：

   ```text
   你的APIKey
   ```

6. 如果界面提供 `Override OpenAI Base URL`，启用后填写：

   ```text
   从控制台复制的OpenAI兼容BaseURL
   ```

7. 点击 `Verify`；
8. 在模型列表选择或添加控制台给出的准确模型 ID。

### 当前版本没有 Base URL 入口怎么办

不要修改 Cursor 的内部数据库、Secret Storage 或未公开配置来“强行写入”。如果当前版本只显示官方 API Key，而没有 `Override OpenAI Base URL`，则该版本没有可依赖的通用自定义端点配置路径。可改用仍在维护的 Cline、Continue，或在更新 Cursor 后重新检查。

### Base URL 应该填到哪一层

填写服务商在 Cursor/OpenAI 兼容教程中明确给出的地址，常见形式是：

```text
https://你的接口域名/v1
```

但不能仅凭“常见形式”手工拼接。部分网关包含额外前缀，删掉或重复添加 `/v1` 都会导致 404。

## 6. 模型 ID 的正确填写方式

模型 ID 是请求 JSON 中 `model` 字段的实际值，不是宣传名称。例如控制台可能同时展示：

- 显示名称：便于人阅读；
- 模型 ID：供 API 请求使用；
- 分组或渠道：平台内部路由信息，不应填入客户端。

只复制“模型 ID”。区分大小写，不要自行去掉日期、版本后缀或厂商前缀。

如果 Cursor 的模型选择器无法添加任意名称，说明当前版本只接受其识别的模型集合。这时即便接口本身兼容，也可能无法在 Cursor 中选择该模型。

## 7. 分层验证：不要一上来就跑大型 Agent 任务

### 第一步：设置页验证

点击 `Verify`。成功只代表认证和基础请求通过，不代表 Agent、工具调用和长上下文全部兼容。

### 第二步：纯聊天验证

新建一个 Chat，先不要附加代码库，输入：

```text
只回复：连接成功
```

### 第三步：只读代码理解

打开一个测试项目，使用 Ask 或只读模式：

```text
请只读取当前文件并概括它的职责，不要修改文件，不要运行命令。
```

### 第四步：小范围编辑

选中几行测试代码，让 Cursor 添加注释或做一次可人工核对的小改动。检查 diff 后再接受。

### 第五步：Agent 验证

只有前四步正常后，再测试一个可回滚的小任务：

```text
为这个纯函数补一个单元测试。执行前先说明计划；不要安装新依赖。
```

若 Chat 正常、Agent 报工具或参数错误，通常是兼容边界，而非 Key 失效。

## 8. Agent 与工具调用的真实限制

Cursor Agent 会读取代码、发送工具定义、调用终端并进行多轮交互。OpenAI 兼容接口若只实现“输入文本、返回文本”，通常不足以支撑 Agent。

完整 Agent 至少要求：

- 正确接收 OpenAI 风格的 `tools` 和 `tool_choice`；
- 流式返回工具调用名称和增量参数；
- 保留多轮 `tool` 消息；
- 能处理较长的系统提示和项目上下文；
- 不删除 Cursor 使用的请求字段；
- 在上下文超限、限流时返回标准、可解析的错误。

Cursor 官方 BYOK 页面并未承诺通用 OpenAI 兼容网关可完整支持 Agent。因此不要把“Chat 能回复”写成“Cursor 全功能兼容”。

## 9. 与内置模型共存时的注意事项

`Override OpenAI Base URL` 是 OpenAI 路径的全局覆盖项。启用后：

- OpenAI 系列请求可能全部指向自定义地址；
- 某些内置模型可能暂时不再可用；
- 同时启用多个 BYOK 供应商时可能出现路由冲突；
- 关闭 Override 后才会恢复默认 OpenAI 路径。

实际切换时建议一次只启用一组自定义 OpenAI 配置，并新建 Chat 验证，避免旧会话继续引用旧模型。

## 10. 隐私与代码安全

Cursor 官方说明，即使使用自定义 API Key，请求仍经过 Cursor 后端进行最终提示词组装。这意味着“使用自己的 Key”不等于“代码只在本机与接口服务商之间传输”。

建议：

- 在 `Cursor Settings → General → Privacy Mode` 检查隐私设置；
- 不向公共或个人 Key 发送生产密钥、客户数据和未脱敏日志；
- 用 `.cursorignore`、项目权限与仓库结构排除不应进入上下文的文件；
- 不把 `.env`、私钥、云凭据、数据库导出文件主动附加到 Chat；
- 企业代码先确认组织的数据处理与合规要求。

## 11. 常见错误

### Verify 失败或 401

- Key 复制不完整或已失效；
- Base URL 与 Key 不属于同一个服务；
- Key 前后混入空格或换行；
- 网关认证头与 OpenAI Bearer 认证不兼容；
- Cursor 当前版本不接受该通用端点。

重新复制 Key，不要在截图或日志中展示完整值。

### 404 / Not Found

- Base URL 少了或重复了 `/v1`；
- 填入了 `/v1/chat/completions` 完整路径；
- 服务商给的是其他客户端协议地址；
- 模型请求被发往了错误路径。

### Model not found

- 把显示名称当成模型 ID；
- 模型 ID 大小写或后缀不一致；
- 当前 Key 没有该模型权限；
- Cursor 选择器不接受该自定义 ID。

### Chat 可用，Agent 不可用

这是最常见的部分兼容：接口不支持原生工具调用，或 Cursor 对该模型未启用 Agent。改用明确支持工具调用的模型，或切换到对自定义接口支持更完整的编程客户端。

### 429 / Rate limit

缩短任务、减少并行 Agent、等待限流窗口恢复。不要无限自动重试，否则会快速消耗额度。

### Tab Completion 仍计入 Cursor 用量

这是预期行为。官方明确说明 Tab Completion 等专用功能继续使用 Cursor 内置模型，不走自定义 Key。

## 12. 回滚到 Cursor 默认配置

1. 打开 `Cursor Settings → Models`；
2. 关闭 `Override OpenAI Base URL`；
3. 禁用或移除自定义 OpenAI Key；
4. 重新选择 Cursor 内置模型；
5. 新建 Chat，不要继续复用旧会话；
6. 若界面状态异常，完整退出并重启 Cursor。

不要通过删除应用配置目录来回滚，除非你已备份编辑器设置且普通切换无效。

## 13. 什么时候不建议用 Cursor 接中转 API

以下情况建议换用 Cline 或 Continue：

- 必须让所有 Agent 请求都走自定义接口；
- 需要任意模型 ID；
- 需要完全可控的请求格式；
- 服务端只支持特定 OpenAI 兼容字段组合；
- 组织要求请求不得经过 Cursor 后端；
- 需要将 Chat、Agent、补全、Embedding 分别配置到不同端点。

## 14. 官方资料

- [Cursor 安装文档](https://docs.cursor.com/get-started/installation)
- [Cursor API Keys 文档](https://docs.cursor.com/settings/api-keys)
- [Cursor 隐私与安全说明](https://docs.cursor.com/account/privacy)
- [Cursor 模式说明](https://docs.cursor.com/agent/custom-modes)
- [Cursor 下载页](https://cursor.com/downloads)

> 界面和兼容范围可能随版本变化。若官方文档与本文不一致，以 Cursor 当前官方文档和客户端实际界面为准。
