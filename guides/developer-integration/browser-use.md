# Browser Use 浏览器自动化 Agent 完整教程

> 最后核验：2026-09-02
>
> 适用范围：Browser Use 开源 Python 包、CLI、兼容模型、MCP 与浏览器安全
>
> 预计用时：45～90 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Browser Use 是什么

Browser Use 是让 Agent 操作浏览器的开源框架和工具集，可完成导航、读取页面、点击、填写表单、截图和结构化任务。它既提供 Python Agent，也提供可直接控制浏览器的 CLI 和 MCP Server。

适合：

- 需要真实浏览器渲染和交互的测试；
- 没有稳定 API 的内部网页流程；
- 对网页信息进行有边界的采集与核验；
- 为 Agent 提供受控浏览器能力。

如果网站有正式 API，应优先 API。浏览器自动化更慢、更脆弱，也更容易接触 Cookie、个人数据和高风险操作。

## 2. 安装开源版本

```bash
python3 -m venv .venv-browser-use
source .venv-browser-use/bin/activate
python -m pip install --upgrade pip
pip install "browser-use[cli]" python-dotenv
browser-use --help
```

CLI 首次运行可能下载 Chromium。生产环境固定 Python、浏览器和 Browser Use 版本。

## 3. 先用 CLI 理解页面

```bash
browser-use --headed open https://example.com
browser-use state
browser-use screenshot example.png
browser-use get title
browser-use close
```

`state` 会列出当前可交互元素及索引：

```bash
browser-use click 5
browser-use input 3 "hello@example.com"
browser-use wait text "Success"
```

元素索引会随页面变化，不要跨页面长期缓存。

## 4. 最小 Python Agent

`.env`：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_MODEL=YOUR_MODEL_ID
```

`run_agent.py`：

```python
import asyncio
import os

from dotenv import load_dotenv
from browser_use import Agent, ChatOpenAI

load_dotenv()


async def main() -> None:
    llm = ChatOpenAI(
        model=os.environ["OPENAI_MODEL"],
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ.get("OPENAI_BASE_URL"),
    )
    agent = Agent(
        task=(
            "打开 https://example.com，只读取页面主标题和第一段文字。"
            "不要点击外部链接，不要填写表单。"
        ),
        llm=llm,
    )
    history = await agent.run(max_steps=10)
    print(history.final_result())


asyncio.run(main())
```

运行：

```bash
python run_agent.py
```

自定义模型必须同时具备框架所需的视觉、结构化输出或工具能力。普通聊天成功不代表浏览器任务可靠。

## 5. 使用已有 Chrome 的风险

CLI 支持连接真实 Chrome 和用户 Profile：

```bash
browser-use connect
browser-use --profile "Default" open https://example.com
```

这会让 Agent 接触登录态、Cookie 和个人数据。默认使用独立的临时 Profile；只有确实需要登录且已评估范围时才连接日常 Profile。

不要通过导出 Cookie、Token 或浏览器存储绕过服务认证。

## 6. 限制可访问域名

```python
from browser_use import Browser

browser = Browser(
    allowed_domains=["example.com", "*.example.com"],
)
```

域名限制之外还要：

- 阻止 `localhost`、内网 IP 和云元数据地址；
- 限制下载类型与大小；
- 禁止任意 `file://` 读取；
- 将认证域与业务域分别声明；
- 对重定向后的最终域名再次检查。

## 7. 敏感数据

Browser Use 支持用占位名称提供敏感数据。原则：

- 不把秘密直接写进任务 Prompt；
- 按域名分配不同凭据；
- 关闭敏感页面的视觉上传；
- 只给当前任务最小权限账号；
- 任务结束后清理临时 Profile 和下载；
- 日志、截图、录屏和 Trace 都按敏感数据处理。

即使框架会替换占位符，也要检查模型、浏览器、代理和云会话各自的数据边界。

## 8. 为高风险动作加确认

以下操作默认停在确认前：

- 提交订单、付款或退款；
- 发消息、邮件或公开发帖；
- 删除、覆盖或下载敏感数据；
- 修改账户、权限和安全设置；
- 接受法律协议；
- 上传文件到外部站点。

确认页展示最终对象、金额、内容和不可逆影响。不要让 Agent 把“登录”自动理解成“同意后续全部操作”。

## 9. 作为 MCP Server

本地启动：

```bash
uvx --from "browser-use[cli]" browser-use --mcp
```

例如接入支持 MCP 的客户端：

```bash
claude mcp add browser-use -- \
  uvx --from "browser-use[cli]" browser-use --mcp
```

MCP 只是连接协议，不会自动降低浏览器权限。Server 的启动环境、Profile、域名、下载目录和凭据都需单独限制。

## 10. 可靠性设计

网页 UI 会变化。提高稳定性：

- 任务写明成功条件和禁止动作；
- 优先语义和可访问性信息，不只依赖坐标；
- 对关键页面保存截图和结构化状态；
- 每一步后检查 URL 与页面状态；
- 设置 `max_steps`、总超时和失败预算；
- 不对非幂等提交盲目重试；
- 验证最终业务结果，而不只看 Agent 总结。

## 11. 自动化测试建议

测试环境使用专用账号和隔离数据：

1. 正常流程；
2. 页面加载慢与元素延迟；
3. 登录过期；
4. 弹窗、重定向和新标签；
5. 禁止域名跳转；
6. 高风险动作确认；
7. 任务取消与浏览器清理；
8. 页面改版后的回归。

不要在生产真实账户上做破坏性自动化验收。

## 12. 常见错误

### 找不到元素或点错位置

重新获取 `state`，等待目标文本出现，并检查页面是否进入新 iframe / 标签页。不要重复使用旧索引。

### 自定义模型不断循环

模型的结构化动作能力不稳定，或任务成功条件不清。降低最大步数，先换官方推荐模型建立基线。

### 登录后立刻退出

Profile 没持久化、第三方 Cookie 被限制或站点触发安全校验。不要用 Cookie 导出绕过登录。

### 本机数据意外进入模型

连接了日常 Profile、允许 `file://` 或截图包含敏感页面。立即停止、轮换受影响凭据并审查日志与录屏。

## 13. 验收清单

- [ ] 已确认该流程没有更合适的正式 API；
- [ ] 使用独立浏览器 Profile 和最小权限账号；
- [ ] 域名、内网、文件和下载边界均限制；
- [ ] 秘密不在 Prompt、日志、截图或代码中；
- [ ] 支付、发送、删除和权限修改要求人工确认；
- [ ] 设置最大步数、超时和费用上限；
- [ ] 非幂等操作不自动重试；
- [ ] 最终结果由页面或后端状态验证；
- [ ] 取消后浏览器和子进程完整清理。

## 14. 官方来源

- [Browser Use 官方文档](https://docs.browser-use.com/)
- [Browser Use CLI](https://docs.browser-use.com/open-source/browser-use-cli)
- [Agent 配置](https://docs.browser-use.com/open-source/customize/agent/basics)
- [支持的模型](https://docs.browser-use.com/open-source/supported-models)
- [Browser Use MCP Server](https://docs.browser-use.com/open-source/customize/integrations/mcp-server)
- [Browser Use 官方仓库](https://github.com/browser-use/browser-use)
