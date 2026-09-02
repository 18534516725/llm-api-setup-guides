# MCP Inspector v2 调试与 CI 完整教程

> 最后核验：2026-09-02
>
> 适用范围：官方 MCP Inspector、Web / CLI / TUI、stdio、Streamable HTTP、MCP `2026-07-28`
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Inspector 能解决什么问题

MCP Inspector 是官方参考调试工具，用于直接观察 MCP Server，而不是让大模型替你猜连接状态。当前同一套核心提供三种入口：

| 模式 | 适合场景 |
|---|---|
| Web | 人工浏览 Tools、Resources、Prompts、OAuth 和 MCP Apps |
| CLI | 自动化冒烟、JSON 输出和 CI |
| TUI | 无图形界面的交互排错 |

它可以定位“Server 本身有问题”还是“宿主客户端配置有问题”。

## 2. 环境准备

当前 Inspector 要求 Node.js 22.19.0 或更高：

```bash
node --version
npm --version
npx @modelcontextprotocol/inspector --help
```

无需全局安装。CI 中建议固定经过验证的版本，避免 `latest` 自动引入破坏性变化：

```bash
npx -y @modelcontextprotocol/inspector@2.4.0 --help
```

## 3. Web 模式测试本地 stdio Server

假设服务启动命令为：

```bash
node dist/server.js
```

启动 Inspector：

```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

命令行会打印带一次性 Session Token 的本地 URL。不要把该 URL 发到 Issue、群聊或截图中。

依次检查：

1. Server 能否启动且 stderr 无异常；
2. 能否列出 Tools、Resources、Prompts；
3. Schema 与描述是否准确；
4. 正常参数能否得到结构化结果；
5. 缺失、类型错误和越权参数是否明确失败；
6. 取消后服务端工作是否真的停止。

## 4. 测试远程 HTTP Server

```bash
npx @modelcontextprotocol/inspector \
  --server-url https://mcp.example.com/mcp \
  --transport http
```

远程排错按层检查：

- DNS 与 TLS 证书；
- 反向代理路径是否保留 `/mcp`；
- Content-Type 与 Accept；
- OAuth 挑战和回调；
- 协议版本协商；
- 网关超时是否早于工具超时。

不要为了排错关闭 TLS 验证或长期使用公开无认证端点。

## 5. CLI 列出工具

本地 stdio：

```bash
npx @modelcontextprotocol/inspector --cli \
  node dist/server.js \
  --method tools/list \
  --format json > tools.json

jq '.result.tools[] | {name, description}' tools.json
```

远程 HTTP：

```bash
npx @modelcontextprotocol/inspector --cli \
  https://mcp.example.com/mcp \
  --transport http \
  --method tools/list \
  --format json
```

`--cli` 是启动器模式参数，放在目标命令之前。Server 自己的同名参数应放在目标命令之后。

## 6. CLI 调用工具

```bash
npx @modelcontextprotocol/inspector --cli \
  node dist/server.js \
  --method tools/call \
  --tool-name get_weather \
  --tool-arg city=Shanghai \
  --format json | jq '.result'
```

测试不要只覆盖成功路径：

```text
正常：city=Shanghai
缺失：不传 city
类型：传入不符合 Schema 的值
边界：超长字符串、Unicode、空字符串
越权：请求不应允许的资源
注入：要求工具泄露环境变量或改变既定操作
```

## 7. TUI 模式

```bash
npx @modelcontextprotocol/inspector --tui node dist/server.js
```

TUI 与 Web / CLI 使用同一核心连接逻辑，适合 SSH 和容器环境。终端不支持交互时改用 CLI，不要在 CI 里启动 TUI。

## 8. 现代协议验证

Inspector 支持旧版与 MCP `2026-07-28` 协议 era。验证升级时同时做：

- 自动协商能连接现代 Server；
- 强制现代协议不会静默回落；
- 旧客户端路径仍按计划工作；
- `server/discover` 返回的版本和能力正确；
- 现代请求不再依赖 `Mcp-Session-Id`；
- 多实例轮询分发不会丢业务状态。

仅仅“工具调用成功”不能证明正在使用新协议，必须记录实际协商结果。

## 9. OAuth 排错

远程 Server 需要 OAuth 时，重点检查：

- 资源元数据和授权服务器发现地址；
- Client ID、Issuer、Audience、Scope；
- 回调地址与本地端口；
- Token 过期后的重新授权；
- 403 `insufficient_scope` 后的 Scope 提升；
- Token 缓存目录的文件权限。

不要复制 Access Token 到工具参数。共享 CI 应使用短期机器身份，不复用开发者个人 Token。

## 10. MCP Apps 检查

支持 MCP Apps 的工具还需验证：

- 工具 `_meta` 是否关联存在的 `ui://` 资源；
- 资源 MIME 类型正确；
- iframe 启用了沙箱；
- CSP 默认拒绝未声明来源；
- UI 不支持时仍有文本或结构化降级；
- UI 发起的二次工具调用仍经过宿主权限检查。

Inspector 能帮助查看资源与消息，但不能替代目标宿主的兼容测试。

## 11. 接入 CI

基础冒烟脚本：

```bash
set -euo pipefail

OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

npx -y @modelcontextprotocol/inspector@2.4.0 --cli \
  node dist/server.js \
  --method tools/list \
  --format json > "$OUT"

jq -e '.result.tools | length > 0' "$OUT" >/dev/null
jq -e '.result.tools[] | select(.name == "health_check")' "$OUT" >/dev/null
```

CI 中再添加：

- 工具目录快照或 Schema 断言；
- 一只无副作用工具的调用；
- 非法参数必须失败；
- 启动和调用超时；
- Server 子进程清理；
- 输出敏感信息扫描。

不要让 CI 冒烟调用真实删除、支付、发信或生产写入工具。

## 12. 常见错误

### Inspector 页面打不开

检查 Node 版本、端口占用和终端打印的完整本地 URL。一次性 Token 过期后重新启动。

### stdio Server 解析失败

Server 把普通日志写入 stdout。协议输出留 stdout，日志全部写 stderr。

### HTTP 返回 404

检查完整 `/mcp` 路径和反向代理前缀。不要把站点根地址当 Server 地址。

### CLI 在 CI 中不退出

Server 留下子进程或工具没有响应取消。为外层命令和单次工具调用都设置超时。

### Web 成功但宿主失败

对比宿主支持的协议 era、传输、OAuth 和扩展能力。Inspector 成功只证明 Server 对 Inspector 可用。

## 13. 验收清单

- [ ] Node 版本满足当前要求；
- [ ] Web、CLI 或 TUI 至少一种可重复连接；
- [ ] Tools / Resources / Prompts 的列表和 Schema 正确；
- [ ] 正常、非法、越权和取消路径均测试；
- [ ] 已确认实际协议 era，而非只看成功响应；
- [ ] OAuth Token 没有进入命令历史和测试产物；
- [ ] MCP Apps 有沙箱、CSP 和降级验证；
- [ ] CI 固定 Inspector 版本并有超时；
- [ ] Server 子进程能完整清理。

## 14. 官方来源

- [MCP Inspector 官方文档](https://modelcontextprotocol.io/docs/tools/inspector)
- [Inspector 2026-07-28 文档](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)
- [MCP Inspector 官方仓库](https://github.com/modelcontextprotocol/inspector)
- [MCP 调试指南](https://modelcontextprotocol.io/legacy/tools/debugging)
- [MCP 2026-07-28 规范](https://modelcontextprotocol.io/specification/2026-07-28)
