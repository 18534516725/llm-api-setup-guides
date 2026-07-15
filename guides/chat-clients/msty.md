# Msty Studio 接入 OpenAI 兼容 API：自定义提供方完整教程

> 最后核验：2026-07-14
>
> 适用范围：Msty Studio Desktop 当前版；旧版 Msty App 1.x 的菜单名称可能不同
>
> 预计用时：5～10 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. 官方支持结论与适用范围

Msty Studio 官方 Online Providers 文档明确提供 `Bring Your Own Provider`：只要服务采用 OpenAI-compatible API，就能在 Model Providers 中接入。适用于托管模型、自建网关和私有推理端点。

本文聚焦 Msty Studio Desktop。Msty App 1.x 仍可用，其旧界面路径通常是 `Settings > Remote Model Providers > Add New Provider > Open AI Compatible`；官方旧版教程同样明确使用以 `/v1` 结尾的 API Endpoint。

## 2. 安装 Msty Studio

1. 从 [Msty 官方网站](https://msty.ai/) 进入下载页；
2. 选择对应的 macOS、Windows 或 Linux 安装包；
3. 安装并打开 Msty Studio；
4. 初次使用可以跳过本地模型下载，直接添加在线提供方；
5. 确认能打开侧栏中的 `Model Hub`。

Linux 用户按官方安装包类型执行 AppImage 或 deb 安装。不要从第三方下载站输入自己的付费 Key。

## 3. 数据保存与隐私

Msty 官方隐私政策说明，Studio/App 的会话数据保存在本地，不上传到 Msty 服务器，也不收集产品使用遥测。桌面版内容位于本机；具体数据和日志路径可从设置中查看。

本地保存不等于远程推理不联网。使用 OpenAI-compatible 在线端点时，当前消息、必要的历史上下文、附件解析结果和模型参数会直接发送至你配置的服务。若启用实时数据、网页读取或第三方工具，还会产生额外网络请求。

## 4. 准备三项信息

```text
API Endpoint: https://your-api.example.com/v1
API Key: YOUR_API_KEY
Model ID: YOUR_MODEL_ID
```

这里的 Endpoint 是 OpenAI 兼容 API 根地址，通常以 `/v1` 结尾。不要直接填网页控制台地址，也不要默认填完整 `/v1/chat/completions`，因为 Msty 需要基于根地址获取模型并发送聊天请求。

## 5. 添加 OpenAI-compatible 提供方

### Msty Studio 当前界面

1. 打开侧栏 `Model Hub`；
2. 进入 `Model Providers`；
3. 点击 `Add Provider`；
4. 选择 `OpenAI-compatible` 或对应的自定义兼容端点选项；
5. Name 填便于识别的名称；
6. Endpoint 填 `https://your-api.example.com/v1`；
7. API Key 填真实 Key；
8. 保存。

### Msty App 1.x 旧界面

1. 打开 `Settings`；
2. 进入 `Remote Model Providers`；
3. 点击 `Add New Provider`；
4. Provider 选择 `Open AI Compatible`；
5. 填 Name、API Endpoint 和 API Key；
6. 点击 `Fetch Models` 或手动添加模型；
7. 保存。

## 6. 添加与整理模型

如果端点实现了模型列表，Msty 会尝试获取模型。若列表为空但聊天 API 可用：

1. 在该提供方下选择添加模型；
2. Model ID 粘贴 `YOUR_MODEL_ID`；
3. 设置易读的本地名称；
4. 按实际能力设置 purpose tags；
5. 保存，并在模型选择器中确认可见。

Msty 的用途标签用于分类与 UI 能力展示，不会为模型创造服务端不具备的能力。第一次只保留 Text；确认后再标记 Coding、Vision、Tools、Streaming 或 Thinking。

## 7. 最小验证

1. 新建对话；
2. 选择刚添加的 `YOUR_MODEL_ID`；
3. 关闭实时数据、Toolbox、附件和额外参数；
4. 发送：

```text
只回复两个字：正常
```

验证以下结果：

- 开始返回内容且能结束；
- 没有 401、403、404 或 429；
- 重启 Msty 后提供方和模型仍存在；
- API 控制台记录到本次请求。

## 8. Base URL 拼接规则

典型关系是：

```text
API Endpoint: https://your-api.example.com/v1
模型列表:     https://your-api.example.com/v1/models
聊天接口:     https://your-api.example.com/v1/chat/completions
```

常见错误：

- 少写 `/v1`，服务返回 404；
- 把 `/v1/chat/completions` 填进根 Endpoint，客户端重复拼接；
- URL 中有空格或全角标点；
- 填了管理后台网址而非 API 地址。

## 9. 流式、工具与多模态限制

### 流式输出

需要端点返回标准 SSE 流。出现输出卡住、重复或无法收尾时，先关闭 Streaming 标签或流式参数测试。非流式正常通常表明问题在流格式、缓冲或网络代理。

### Thinking

Msty Studio 对 OpenAI-compatible 模型只保证通用的 None/Default 思考设置。不同服务的推理参数和返回字段不完全一致，不要直接套用某个内置提供方的高级预设。

### 工具

Provider-native tools 和 Msty Toolbox 是两层能力。自定义端点需要支持 OpenAI tool calling，模型也需具备工具能力；工具预设存在不代表当前模型可执行。

### 图片与附件

Vision 标签、图片请求格式和模型能力必须一致。文档或知识库还可能需要嵌入模型，聊天模型可用不代表知识库索引已配置。

## 10. 费用与上下文控制

- 不同任务新建对话，避免无关历史反复发送；
- 给模型设置合理的上下文和最大输出；
- 初次不要启用实时搜索与自动工具；
- 导入大文件或知识库前先确认嵌入费用；
- 在 API 控制台设置余额提醒与 Key 限额。

## 11. 常见错误

### 401：鉴权失败

重新复制 Key，清除空格；确认 Key 未禁用，并且端点采用 Bearer 鉴权。不要使用登录密码、授权码或许可证 Key。

### 403：没有权限

检查目标模型是否对当前 Key 开放。模型 ID 正确不等于 Key 有权限。

### 404：地址错误

先确认 Endpoint 是否以正确的 `/v1` 结束。不要在根地址中重复 `/v1`，也不要把完整聊天端点填入根地址字段。

### Fetch Models 失败

兼容服务可能不提供 `/models`。手动添加准确 Model ID，再用空白文本对话验证；不要仅凭模型列表失败判定聊天接口不可用。

### 400：参数不兼容

关闭 Thinking、Tools、Vision、实时数据和自定义模型参数。用纯文本成功后一次恢复一项。

### 429：限流或额度不足

暂停重试、缩短上下文、降低并发，并在控制台核对额度和速率限制。

## 12. 安全建议

- Key 只粘贴到官方客户端；
- 使用独立 Key 和最小必要额度；
- 远程 Endpoint 必须使用可信 HTTPS；
- 截图、日志和导出文件中隐藏 Key；
- 对敏感文件配置知识库排除规则；
- 异常用量出现后立即轮换 Key。

## 13. 更新、回滚与卸载

Msty 官方说明桌面应用会后台更新；未更新时可从官网下载新版安装器覆盖安装，通常无需先卸载。升级前仍建议从 Settings 使用数据备份功能，并记录当前版本。

出现回归时：

1. 备份会话、工作区和配置；
2. 关闭实验性渲染或新参数做交叉测试；
3. 从官方渠道安装已知可用版本；
4. 用最小纯文本请求验证；
5. 确认数据完整后再清理旧备份。

卸载应用前先确认本地数据和知识库已有备份。不要把“卸载程序”和“删除本地数据目录”视为同一个动作。

## 14. 官方资料

- [Msty Studio Online Providers](https://docs.msty.ai/studio/managing-models/online-providers)
- [Msty Studio Managing Models](https://docs.msty.ai/studio/managing-models)
- [Msty 官方隐私政策](https://msty.ai/privacy/)
- [Msty App 1.x Onboarding](https://docs.msty.app/getting-started/onboarding)
- [Msty App 1.x OpenAI-compatible 配置示例](https://docs.msty.app/how-to-guides/openai-deep-research-with-msty)
- [Msty App 1.x Changelog 与更新说明](https://docs.msty.app/getting-started/changelog)

---

求助时请注明 Msty Studio 或 Msty App 1.x、应用版本、系统、脱敏 Endpoint、模型 ID 与 HTTP 状态码。不要发送完整 Key。
