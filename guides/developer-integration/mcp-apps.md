# MCP Apps 交互式工具开发完整教程

> 最后核验：2026-09-02
>
> 适用范围：MCP Apps 扩展、`@modelcontextprotocol/ext-apps`、TypeScript、沙箱 iframe
>
> 预计用时：60～120 分钟

[← 返回教程目录](../教程总目录.md)

## 1. MCP Apps 是什么

传统 MCP Tool 返回文本或结构化数据。MCP Apps 允许工具再声明一个交互式 UI 资源，让图表、表单、仪表盘或画布直接显示在支持该扩展的宿主中。

核心关系：

```text
Tool 定义
  └─ _meta 指向 ui:// 资源
       └─ HTML / JS View 在沙箱 iframe 中渲染
            └─ 通过宿主转发结果、消息与工具调用
```

MCP Apps 是 MCP Extension，不是所有 MCP 客户端都支持。Server 必须保留非 UI 降级结果。

## 2. 适用与不适用场景

适合：

- 需要缩放、筛选的图表；
- 需要用户确认或补充字段的表单；
- 结构化结果预览；
- 地图、设计画布、媒体播放器；
- 多步操作的可视化状态。

不适合：

- 一两行文字就能表达的结果；
- 必须脱离会话长期运行的完整网站；
- 需要不受限制 DOM、Cookie 或浏览器权限的页面；
- 客户端生态尚不支持但又没有降级方案的核心功能。

## 3. 创建项目

要求 Node.js 18 或更高：

```bash
mkdir my-mcp-app
cd my-mcp-app
npm init -y
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk express cors
npm install -D typescript vite vite-plugin-singlefile tsx @types/node @types/express @types/cors
npm pkg set type=module
```

典型结构：

```text
my-mcp-app/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts
├── mcp-app.html
└── src/
    └── mcp-app.ts
```

## 4. 配置构建

`package.json` 脚本：

```json
{
  "type": "module",
  "scripts": {
    "build": "INPUT=mcp-app.html vite build",
    "serve": "tsx server.ts"
  }
}
```

Windows 建议使用 `cross-env` 处理 `INPUT`。

`vite.config.ts`：

```ts
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist",
    rollupOptions: { input: process.env.INPUT },
  },
});
```

单文件打包可以减少 CSP 来源配置，但并非强制。

## 5. 注册 UI 资源和 Tool

Server 端使用官方辅助函数：

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const here = path.dirname(fileURLToPath(import.meta.url));
const resourceUri = "ui://time-app/main";

export function createServer() {
  const server = new McpServer({ name: "time-app", version: "1.0.0" });

  registerAppResource(server, "time-view", resourceUri, {}, async () => ({
    contents: [{
      uri: resourceUri,
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(path.join(here, "dist/mcp-app.html"), "utf8"),
    }],
  }));

  registerAppTool(server, "get-time", {
    title: "查询服务器时间",
    description: "返回当前 UTC 时间，并提供交互式视图。",
    inputSchema: { timezone: z.string().default("UTC") },
    _meta: { ui: { resourceUri } },
  }, async ({ timezone }) => {
    const iso = new Date().toISOString();
    return {
      content: [{ type: "text", text: `${timezone}: ${iso}` }],
      structuredContent: { timezone, iso },
    };
  });

  return server;
}
```

具体辅助函数签名可能随 SDK 版本变化，安装后以同版本官方 quickstart 为准。

## 6. 编写 View

`mcp-app.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>服务器时间</title>
  </head>
  <body>
    <main>
      <strong>服务器时间：</strong>
      <code id="time">等待结果</code>
    </main>
    <script type="module" src="/src/mcp-app.ts"></script>
  </body>
</html>
```

`src/mcp-app.ts`：

```ts
import { App } from "@modelcontextprotocol/ext-apps";

const output = document.querySelector<HTMLElement>("#time")!;
const app = new App({ name: "time-view", version: "1.0.0" });

app.ontoolresult = (result) => {
  const data = result.structuredContent as { iso?: string } | undefined;
  output.textContent = data?.iso ?? "没有收到结构化时间";
};

await app.connect();
```

不要用 `innerHTML` 渲染 Tool 返回的未知文本；优先 `textContent` 或经过审查的组件。

## 7. 构建和本地测试

```bash
npm run build
npm run serve
```

再使用官方 MCP Apps 示例 Host 或支持该扩展的客户端测试。至少验证：

- UI 资源能读取；
- Tool 文本结果独立可用；
- 结构化结果能送达 View；
- View 销毁和重新打开不残留状态；
- 宿主主题和尺寸变化不破版；
- 不支持 MCP Apps 的客户端仍看到有意义文本。

## 8. Host 通信边界

View 不能直接获得宿主的全部权限。需要通过官方 App API 与 Host 通信，常见能力包括：

- 接收工具输入和结果；
- 通知尺寸、主题和宿主上下文变化；
- 请求打开链接；
- 请求宿主代为调用 Tool；
- 发送供模型处理的消息。

Host 必须对 View 发起的请求重新授权。Tool A 返回的 UI 不能因此自动获得 Tool B 的写权限。

## 9. CSP 与网络

MCP Apps 使用沙箱 iframe 和默认拒绝 CSP。建议：

- 资源尽量单文件打包；
- 只声明实际需要的脚本、样式、图片和 API 来源；
- 禁止任意 `connect-src *`；
- 不把 API Key 注入 View；
- 外部链接通过宿主确认打开；
- 摄像头、麦克风等权限默认不申请；
- Tool Server 代替 View 调用需要凭据的后端。

即使 iframe 隔离，也要防范 XSS、点击劫持式诱导和恶意 Tool 结果。

## 10. 数据设计

区分三种输出：

- `content`：给模型和不支持 UI 的客户端；
- `structuredContent`：给模型与 View 的结构化结果；
- UI Resource：负责展示逻辑，不携带用户秘密。

大型数据不要全部塞进模型可见结果。返回摘要、分页标识或受控资源引用，并在服务端继续执行授权。

## 11. 可访问性与响应式

- 所有交互可用键盘完成；
- 表单控件有 label；
- 颜色不是唯一状态信号；
- 支持窄宽度和宿主动态高度；
- 跟随明暗主题但保持对比度；
- 加载、空数据、失败和取消均有明确状态；
- 动画尊重 `prefers-reduced-motion`。

View 显示在会话中，不能假设拥有普通桌面网页的完整尺寸。

## 12. 常见错误

### Tool 正常但 UI 不显示

检查宿主是否支持 MCP Apps、`resourceUri` 是否一致、资源 MIME 类型和构建产物路径是否正确。

### UI 中数据为空

确认 Tool 返回 `structuredContent`，View 在连接后注册处理器，并兼容首次结果到达顺序。

### 外部字体或图片被拦截

CSP 未声明来源。优先内联或自托管资源，不要直接放宽全部域名。

### 在某个客户端可用，另一个不可用

Host 支持范围和 App API 版本不同。保留文本降级并按目标客户端逐一测试。

## 13. 验收清单

- [ ] Tool 与 `ui://` 资源关联正确；
- [ ] 文本降级不依赖 UI；
- [ ] View 使用沙箱和最小 CSP；
- [ ] 未向 View 暴露服务端凭据；
- [ ] 未知文本不通过 `innerHTML` 直接渲染；
- [ ] View 二次调用仍需宿主授权；
- [ ] 键盘、主题、窄屏和错误状态均验证；
- [ ] 在官方测试 Host 和至少一个目标客户端通过；
- [ ] 依赖版本已固定并记录兼容范围。

## 14. 官方来源

- [MCP Apps 官方概览](https://modelcontextprotocol.io/extensions/apps/overview)
- [构建 MCP App](https://modelcontextprotocol.io/extensions/apps/build)
- [MCP Apps Quickstart](https://apps.extensions.modelcontextprotocol.io/api/documents/quickstart.html)
- [MCP Apps 官方仓库](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Apps 规范](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
