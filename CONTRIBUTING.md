# 贡献指南

感谢你帮助完善主流 AI 工具自定义 API 接入教程。这个仓库欢迎新增教程、修正过期步骤、补充官方来源和改进排错说明。

## 贡献前先确认

新增产品必须同时满足：

1. 产品仍在维护，或文档明确标注已停运/历史状态；
2. 官方文档或官方仓库能确认其支持自定义 API、Base URL 或兼容供应商；
3. 配置步骤不依赖破解、修改内部数据库或绕过产品限制；
4. 示例不包含真实 API Key、Cookie、内部地址、私人数据或未经脱敏的日志；
5. 不披露任何服务的内部供应商、内部渠道和非公开路由信息。

只有社区帖子、视频或二手教程，没有官方资料佐证的产品，不应直接标记为“官方支持”。可以先提交教程需求，等待更多证据。

## 文档放在哪里

| 类别 | 目录 | 示例 |
|---|---|---|
| 聊天客户端 | `guides/chat-clients/` | Cherry Studio、LobeChat |
| 编程工具 | `guides/coding-tools/` | Claude Code、Cline |
| 自部署与知识库 | `guides/self-hosted/` | Open WebUI、Dify |
| 自动化平台 | `guides/automation-platforms/` | n8n、Flowise |
| 效率工具 | `guides/productivity-tools/` | 沉浸式翻译 |
| 开发集成 | `guides/developer-integration/` | OpenAI SDK、LangChain |
| API 测试 | `guides/api-testing/` | Apifox、Postman |
| 基础知识 | `guides/basics/` | 协议基础、通用排错 |

文件名使用小写英文和连字符，例如 `obsidian-copilot.md`。

## 新教程的必备结构

建议从 [`guides/教程模板.md`](./guides/教程模板.md) 复制结构。每篇教程至少包含：

- 标题、最后核验日期、适用版本和返回目录链接；
- 仓库统一的配套 API 提示块；
- 产品定位与适用人群；
- 官方安装方式；
- 协议、Base URL、认证和模型 ID 规则；
- UI、配置文件或环境变量的逐步操作；
- 最小连通性测试；
- 流式输出、工具调用、多模态或 RAG 等能力边界；
- 按状态码或症状组织的排错方法；
- Key、日志、权限、数据发送范围等安全提醒；
- 更新、备份、回滚和卸载；
- 官方文档与官方 GitHub 链接。

## 统一提示块

```markdown
> [!NOTE]
> 本文适用于任何符合对应协议的 API。还没有测试 Key 时，可查看 [教程配套 API](https://www.nexotoken.net/?ref=github)。
```

如果写具体模型价格，必须标注核验日期并提醒以官网实时页面为准。

## 示例与占位符

推荐：

```text
https://your-api.example.com/v1
YOUR_API_KEY
YOUR_MODEL_ID
```

禁止：

- 真实 Key 或看起来像真实 Key 的长随机字符串；
- 真实用户邮箱、手机号、IP、订单号和聊天内容；
- 内部供应商名称、内部渠道字段和原始服务端错误；
- 把 Key 写入浏览器前端代码或提交到 Git；
- 使用无法确认来源的安装脚本。

## 官方来源规则

优先级从高到低：

1. 产品官方文档；
2. 产品官方 GitHub 仓库中的 README、源码和发布说明；
3. 官方 Marketplace 或扩展商店页面；
4. 官方维护者在仓库 Issue/Discussion 中的明确说明。

博客、论坛、视频和搜索摘要只能用于发现线索，不能单独作为关键配置结论的依据。

## 提交前检查

```bash
git diff --check
python3 -m venv .venv-docs
.venv-docs/bin/python -m pip install -r requirements-docs.txt
.venv-docs/bin/mkdocs build --strict
```

还要人工确认：

- 所有 Markdown 代码围栏成对闭合；
- 相对链接在移动文件后仍然有效；
- Base URL 没有错误地重复 `/v1`；
- 没把“能聊天”写成“Agent 完整兼容”；
- 没有把停止维护的产品推荐给新用户；
- README 与兼容性矩阵已同步。

本地预览文档站：

```bash
.venv-docs/bin/mkdocs serve
```

打开终端显示的本地地址，检查桌面和手机宽度下的导航、表格、代码块与推广入口。不要提交 `.venv-docs/` 或 `site/`。

## 提交信息

推荐格式：

```text
docs: add Aider setup guide
docs: update Dify model configuration
fix: correct Chatbox base URL example
```

一个 Pull Request 尽量只处理一个工具或一类紧密相关的文档，方便核对官方资料。

## 报告错误

- 普通步骤错误：使用“教程纠错”Issue 模板；
- 新工具需求：使用“新增教程”Issue 模板；
- 涉及真实 Key、私人日志或安全漏洞：不要公开提交 Issue，按 [安全说明](./SECURITY.md) 私下报告。
