# TRAE IDE 自定义模型与 Base URL 配置教程

> 最后核验：2026-07-24
>
> 适用范围：支持 Custom Model / Custom baseURL 的当前 TRAE IDE；旧版界面可能没有该入口
>
> 预计用时：5～10 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议、并能完成 TRAE 所需请求的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 先确认版本

TRAE 官方更新记录显示，Custom Model 的自定义 baseURL 支持在 2026 年 4 月的 v3.5.51 中加入。更早版本、灰度版本或不同发行区域的入口可能不同。

开始前：

1. 打开 `Help / 帮助 > About / 关于`；
2. 记录完整版本号；
3. 更新到当前稳定版；
4. 重启后再检查模型菜单。

如果界面里只有固定模型、没有 Custom Model 或 Base URL，不要用代理劫持、改 hosts、安装未知证书等方式绕过。先确认是否安装了支持该功能的官方版本。

## 2. 准备三项信息

```text
Base URL 或 Request URL：以服务文档为准
API Key：YOUR_API_KEY
Model ID：YOUR_MODEL_ID
```

模型 ID 必须是接口实际接受的标识，不是网页上的中文展示名。可先用服务控制台或 `/v1/models` 查询。

## 3. 添加自定义模型

当前常见入口：

1. 打开 TRAE 的 AI 对话面板；
2. 点击输入框附近的模型选择器；
3. 选择 `Add Model / 添加模型`；
4. 进入 `Custom Config / 自定义配置`；
5. 选择与接口匹配的协议或 Provider；
6. 填写 Base URL、API Key、Model ID；
7. 保存后从模型列表选中它。

也可以在 Settings 中搜索 `Models` 或 `Custom Model`。TRAE 界面会持续更新，应以当前客户端显示的字段名称为准。

## 4. Base URL 还是完整请求地址

这是最容易出错的一步。不同版本或配置面板可能显示：

| 字段名称 | 常见填写方式 |
|---|---|
| Base URL / API Base | `https://your-api.example.com/v1` |
| Request URL / Endpoint / Full URL | `https://your-api.example.com/v1/chat/completions` |

不要只凭“都是 URL”随便填写。判断方法：

1. 阅读输入框下方说明或占位符；
2. 看是否有 `Full URL` 开关；
3. 先用接口文档给出的最小请求验证；
4. 404 时检查最终路径是否缺失或重复了 `/v1/chat/completions`。

如果填入 `/v1` 后日志显示请求只发到 `/v1`，说明该字段可能要求完整 Endpoint；如果最终出现 `/v1/chat/completions/chat/completions`，说明客户端又自动拼接了一次。

## 5. 配置前先测接口

OpenAI Chat Completions 示例：

```bash
curl https://your-api.example.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_MODEL_ID",
    "messages": [
      {"role": "user", "content": "只回复：连接成功"}
    ],
    "stream": false
  }'
```

确认：

- HTTP 状态为 200；
- 返回中有 assistant 内容；
- 模型 ID 没被服务拒绝；
- Key 有该模型权限；
- 非流式请求能正常结束。

接口测试失败时先修接口配置，不要在 TRAE 里反复删除和重加。

## 6. TRAE 内最小验证

先打开一个没有敏感信息的临时项目，选择新模型，发送：

```text
只回复“TRAE 连接成功”，不要读取文件，不要运行命令。
```

通过后再测试只读上下文：

```text
只读取 README.md，总结三点，不要修改文件，不要执行终端命令。
```

最后测试一次受控编辑：

```text
在 README.md 末尾新增一行“TRAE 测试”，先展示修改内容，不要提交。
```

检查外部 `git diff`，确认只有预期改动。普通聊天成功并不代表文件编辑、终端、Tools 和长上下文全部兼容。

## 7. Rules、AGENTS.md 与权限

TRAE 当前支持 Rules、嵌套规则、MCP、Hooks 和 Agent 工具。模型会接触的内容可能包括：

- 当前文件和选中代码；
- 工作区索引与搜索结果；
- Rules / AGENTS.md；
- 终端输出；
- MCP 返回的数据；
- 你主动上传的文件或图片。

首次连接新 API 时：

- 使用测试仓库；
- 关闭自动执行或保留确认；
- 不加载生产密钥、客户数据和私人配置；
- 不给 MCP 过大的文件、网络或数据库权限；
- 对删除、安装、推送和外部请求保持人工确认。

## 8. Key 轮换与配置变更

部分 TRAE 版本可能不允许直接编辑已保存自定义模型的 API Key、Base URL 或 Model ID。如果字段呈灰色：

1. 先记录非敏感配置；
2. 删除旧自定义模型；
3. 用新 Key 重新创建；
4. 完成最小验证；
5. 在服务端撤销旧 Key。

不要把完整 Key 写入项目规则、README、截图或公开 Issue。

## 9. 常见问题

| 现象 | 排查方法 |
|---|---|
| 找不到自定义模型入口 | 检查版本和发行渠道，更新后重启 |
| 添加模型失败 | 先用 cURL 验证 URL、Key、模型 ID |
| 401 | Key 错误、过期、复制不完整或认证头不兼容 |
| 403 | Key 没有模型权限，或账户策略限制 |
| 404 | Base URL 与完整 Endpoint 填法不匹配 |
| 400 | 请求参数、模型能力或协议不兼容 |
| 普通聊天正常但 Agent 失败 | 单独检查工具调用、流式和工具结果回传 |
| 保存后模型不出现 | 重启客户端，检查是否保存到当前账号或工作区 |
| Key 无法编辑 | 删除旧配置后用新 Key 重建，再撤销旧 Key |

## 10. 官方与可信资料

- [TRAE 官网](https://www.trae.ai/)
- [TRAE Changelog](https://www.trae.ai/changelog)
- [TRAE 官方中文社区](https://forum.trae.cn/)
- [腾讯云 CloudBase 的 TRAE 自定义配置说明](https://docs.cloudbase.net/ai/ai-tools/trae)

> 产品界面变化较快。提交纠错时请提供 TRAE 版本、系统、字段名称和脱敏截图，不要公开完整 API Key。
