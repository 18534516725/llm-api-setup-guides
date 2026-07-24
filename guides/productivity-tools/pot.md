# Pot 划词翻译、OCR 与 OpenAI 服务配置教程

> 最后核验：2026-07-24
>
> 适用范围：Pot 3.x；Windows、macOS、Linux
>
> 预计用时：10～20 分钟

[← 返回教程目录](../教程总目录.md)

> [!NOTE]
> 本文适用于 Pot 当前提供的 OpenAI 服务以及其他由官方插件明确支持的服务。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。

## 1. Pot 能解决什么问题

Pot 是跨平台划词翻译和 OCR 工具，支持：

- 选中文字后按快捷键翻译；
- 呼出输入框手动翻译；
- 截图 OCR 与截图翻译；
- 多个翻译服务并行返回；
- 外部程序通过本地 HTTP 接口调用；
- 使用 `.potext` 插件扩展服务。

它和浏览器整页翻译工具的区别是：Pot 面向桌面系统中的任意可选文本、截图和外部调用，而不只处理网页。

## 2. 安装

### Windows

```powershell
winget install Pylogmon.pot
```

也可以从 [GitHub Releases](https://github.com/pot-app/pot-desktop/releases/latest) 下载与架构对应的安装包。

### macOS

```bash
brew tap pot-app/homebrew-tap
brew install --cask pot
```

升级：

```bash
brew upgrade --cask pot
```

### Linux

从 Releases 下载发行版对应的 deb、AppImage 或其他包。Arch Linux 用户也可选择 AUR 包：

```bash
yay -S pot-translation
```

安装后打开 Pot，并按系统提示授予辅助功能、屏幕录制或截图权限。只授予实际需要的权限。

## 3. 设置第一个快捷键

打开偏好设置，为以下功能设置不冲突的全局快捷键：

- 划词翻译；
- 输入翻译；
- 截图 OCR；
- 截图翻译。

先只启用“输入翻译”：

1. 按快捷键呼出输入窗口；
2. 输入一句中文；
3. 按回车；
4. 确认至少一个内置翻译服务正常返回。

这样可以先排除快捷键和窗口权限问题，再配置自定义模型。

## 4. 添加 OpenAI 翻译服务

在 Pot 中进入：

```text
偏好设置 → 服务设置 → 翻译 → 添加内置服务 → OpenAI
```

不同小版本的标签可能略有差异，但应选择 Pot 内置的 **OpenAI** 服务，而不是随意安装来源不明的插件。

按照当前界面填写：

| 字段 | 填写内容 |
|---|---|
| API Key | `YOUR_API_KEY` |
| API URL / Base URL | 服务文档给出的 OpenAI-compatible 地址 |
| Model | 服务实际提供的模型 ID |
| Prompt | 可选；定义目标语言、术语和输出格式 |

Base URL 是否包含 `/v1` 必须以服务端文档和 Pot 当前字段说明为准。不要在 404 后盲目组合路径，应先用 curl 验证服务端的完整 Chat Completions 地址。

例如服务文档规定：

```text
Base URL: https://api.example.com/v1
Chat endpoint: /chat/completions
```

则在 Pot 中填写：

```text
https://api.example.com/v1
```

保存后，将这个服务加入翻译服务列表并启用。

## 5. 翻译提示词

通用提示词示例：

```text
你是专业翻译助手。把输入准确翻译为目标语言：
1. 保留代码、命令、URL、Markdown 和专有名词；
2. 不解释翻译过程；
3. 不添加原文没有的信息；
4. 只输出译文。
```

技术文档可增加：

```text
API、Token、Context、Embedding、Rerank 等术语保留英文，并在必要时使用自然中文解释。
```

提示词越长，每次请求消耗的输入 Token 越多。先使用简短规则，只有在输出确实不稳定时再增加约束。

## 6. 第一次验证

依次测试三类文本：

### 普通句子

```text
这个功能将在下一个版本中默认启用。
```

### 技术文本

```text
Set the API base URL before creating the client.
```

### 含格式文本

```markdown
Run `pnpm build`, then open https://example.com/docs.
```

验收：

- 目标语言正确；
- 代码、命令和 URL 未被翻译或破坏；
- 没有出现额外解释；
- 三次调用都能稳定返回。

## 7. 多服务并行翻译

Pot 可以同时启用多个翻译服务。建议最多保留两到三个有明确用途的结果：

- 一个低延迟服务用于日常短句；
- 一个更强模型用于长文和技术内容；
- 一个传统翻译服务作为对照或备用。

并行服务会增加请求次数、费用和失败点。不要因为界面支持就一次启用十个模型。

## 8. OCR

Pot 支持系统 OCR、Tesseract 等离线方式，也支持部分在线 OCR 服务。

第一次测试：

1. 打开一张文字清晰的截图；
2. 使用“截图 OCR”快捷键；
3. 框选单行文本；
4. 检查识别结果；
5. 再测试“截图翻译”。

OCR 错误和翻译错误是两条独立链路。文字识别已经错误时，更换翻译模型不会修复原文。

## 9. 外部调用

Pot 提供本机 HTTP 接口，默认监听端口为 `60828`。例如打开输入翻译：

```bash
curl http://127.0.0.1:60828/input_translate
```

翻译请求：

```bash
curl -X POST http://127.0.0.1:60828/translate \
  -H "Content-Type: text/plain; charset=utf-8" \
  --data-binary "需要翻译的文字"
```

这个本地接口可以触发桌面功能，不应暴露到公网。自动化脚本也应限制输入来源，避免敏感剪贴板内容被意外提交给在线翻译服务。

## 10. 安全与隐私

- 在线翻译会把原文发送给配置的服务；
- 不翻译密钥、合同、客户资料和未公开代码；
- API Key 不出现在截图、同步配置和公开日志中；
- 安装插件前检查仓库、发布者和权限；
- 设备丢失或 Key 泄露后立即撤销并重新生成；
- 使用多服务并行翻译时，原文会同时发送给多个服务。

## 11. 常见问题

| 现象 | 排查方法 |
|---|---|
| 快捷键无反应 | 检查快捷键冲突、辅助功能和屏幕录制权限 |
| 401 | Key 无效、过期或没有目标服务权限 |
| 404 | 核对服务文档中的 Base URL 和 Chat 路径，不要重复拼接 `/v1` |
| `model not found` | 使用服务端实际模型 ID，不要填显示名称 |
| 有回复但没有译文 | 简化 Prompt，要求只输出译文，并确认模型可正常遵循指令 |
| 截图翻译乱码 | 先单独检查 OCR，再处理翻译服务 |
| macOS 无法打开 | 按官方安装说明处理开发者验证和辅助功能权限 |
| Linux 窗口或截图异常 | 检查 Wayland、WebKitGTK 和桌面环境兼容说明 |

## 12. 官方来源

- [Pot 官方文档](https://pot-app.com/docs/)
- [Pot 服务设置](https://pot-app.com/docs/config/service.html)
- [Pot 官方仓库](https://github.com/pot-app/pot-desktop)
- [Pot Releases](https://github.com/pot-app/pot-desktop/releases/latest)
