# Mastra TypeScript Agent 开发完整教程

> 最后核验：2026-09-02
>
> 适用范围：Mastra 1.x、AI SDK v7、Agent、Tools、Memory、Workflow、MCP 与 Observability
>
> 预计用时：45～90 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Mastra 是什么

Mastra 是面向 TypeScript 的 Agent 应用框架，提供 Agent、类型化工具、工作流、记忆、MCP、评测与可观测性。它建立在现代 Node.js 与 AI SDK Provider 生态上，适合已经使用 TypeScript / Next.js 的团队。

适合：

- 需要在同一项目中组合 Agent 和确定性 Workflow；
- 希望通过 Provider 切换模型；
- 需要 Tool、MCP、Memory 和 Trace；
- 将 Agent 暴露给 Web、API 或其他 MCP 客户端；
- 希望用 TypeScript Schema 约束输入输出。

## 2. 创建项目

```bash
npm create mastra@latest
```

按向导选择项目名、Agent、Tools、Workflows 和模型 Provider。已有项目也可以安装核心包：

```bash
npm install @mastra/core zod
```

典型结构：

```text
src/mastra/
├── agents/
├── tools/
├── workflows/
└── index.ts
```

Mastra 1.x 要求使用子路径导入，例如 `@mastra/core/agent`，不要从旧教程复制顶层 `@mastra/core` 导入 Agent。

## 3. 配置模型

`.env`：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_MODEL=YOUR_MODEL_ID
```

安装 AI SDK Provider：

```bash
npm install @ai-sdk/openai
```

`src/mastra/agents/assistant.ts`：

```ts
import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  description: "回答一般技术问题。",
  instructions: "用简洁中文回答；不确定时明确说明。",
  model: openai(process.env.OPENAI_MODEL!),
});
```

Provider 的 `baseURL`、认证和协议由对应 AI SDK 包决定。兼容服务需要实际支持所选 Provider 发出的请求和工具调用。

## 4. 注册 Mastra 实例

`src/mastra/index.ts`：

```ts
import { Mastra } from "@mastra/core";
import { assistant } from "./agents/assistant";

export const mastra = new Mastra({
  agents: { assistant },
});
```

开发环境：

```bash
npx mastra dev
```

Studio / Dev Server 用于本地调试。公开部署前增加认证、租户隔离、限流和持久化，不要直接把开发入口暴露公网。

## 5. 创建类型化工具

`src/mastra/tools/time.ts`：

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getTime = createTool({
  id: "get-time",
  description: "返回指定 IANA 时区的当前时间。",
  inputSchema: z.object({
    timezone: z.string().describe("例如 Asia/Shanghai"),
  }),
  outputSchema: z.object({
    timezone: z.string(),
    iso: z.string(),
  }),
  execute: async ({ context }) => ({
    timezone: context.timezone,
    iso: new Intl.DateTimeFormat("sv-SE", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: context.timezone,
    }).format(new Date()),
  }),
});
```

加入 Agent：

```ts
import { getTime } from "../tools/time";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: "用户询问时间时必须调用 getTime。",
  model: openai(process.env.OPENAI_MODEL!),
  tools: { getTime },
});
```

工具输入仍要在服务端授权。Zod Schema 只能验证形状，不能判断当前用户是否允许执行。

## 6. 直接调用 Agent

```ts
const result = await assistant.generate("上海现在几点？");
console.log(result.text);
```

流式：

```ts
const result = await assistant.stream("给我三项上线检查。")

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

AI SDK v7 调整了 Provider 规范与部分事件结构。升级 Provider 前锁定版本并对流、工具、Usage 和 Reasoning 重新测试。

## 7. Memory 与线程隔离

长期会话需要安装并配置 Memory 与 Storage。设计时区分：

- thread：一条会话；
- resource / user：会话归属者；
- working memory：当前任务结构化状态；
- semantic recall：相关历史检索；
- storage：持久化后端。

每次读取和写入都同时校验租户、用户与线程，不能只依赖模型传入的 thread ID。

## 8. Workflow

Workflow 用于确定性步骤、Schema、分支和恢复：

```text
validateInput
  → retrieveContext
  → draftWithAgent
  → deterministicCheck
  → requestApproval
  → publish
```

需要外部副作用的步骤使用幂等键。恢复时从已提交检查点继续，不能重复发信、扣费或创建资源。

## 9. MCP

Mastra 可通过 `@mastra/mcp` 使用 MCP Tools，也能把本地 Tools / Agents 暴露成 MCP Server：

```bash
npm install @mastra/mcp
```

连接第三方 MCP Server 前核对启动命令、环境变量、网络域名和权限；不要把社区 MCP 当作无风险 npm 包。暴露 Agent 时必须设置清晰非空 `description`，并限制递归调用。

## 10. Workspace 与 Sandbox

Workspace 可以给 Agent 提供文件和命令能力。`LocalSandbox` 仍运行在本机权限边界内，不是强隔离安全沙箱。

处理不可信代码时使用远程隔离环境，并限制：

- 挂载目录；
- 出站网络；
- CPU、内存、磁盘与运行时间；
- 环境变量和云身份；
- 下载和导出结果大小；
- 任务结束后的销毁策略。

## 11. 可观测性与评测

Mastra 可记录 Agent、工具、Memory 与 Workflow Trace，并支持 OpenTelemetry 生态和 Scorer。

生产至少关注：

- 成功率和错误类别；
- 首 Token 与总延迟；
- Token、缓存和费用；
- 工具选择、参数与拒绝率；
- Workflow 步骤与重试；
- Scorer 趋势和版本对比。

在导出前配置敏感数据过滤。默认全量记录 Prompt 会造成隐私和凭据泄漏风险。

## 12. 常见错误

### `Agent is not exported from @mastra/core`

1.x 使用子路径：`@mastra/core/agent`。按当前官方文档统一所有导入。

### 自定义 Base URL 请求失败

检查 Provider 是否使用 `baseURL`、地址是否包含正确版本路径，以及目标是否支持 Provider 需要的协议。

### Tool Schema 正常但执行越权

Schema 只做数据校验。执行函数中加入用户、租户、资源和动作授权。

### 重启后 Memory 消失

没有配置持久 Storage，或线程标识变化。验证跨进程恢复和多用户隔离。

### Trace 看不到或泄露数据

检查 exporter、storage 和采样率；在导出链路最前面应用敏感数据过滤器。

## 13. 验收清单

- [ ] 使用 Mastra 1.x 子路径导入；
- [ ] 模型 Provider、Base URL 和协议已实际验证；
- [ ] Tool 有输入 Schema、输出 Schema 和服务端授权；
- [ ] 非流式、流式和工具调用均通过；
- [ ] Memory 持久化且租户隔离；
- [ ] Workflow 副作用具备幂等和恢复测试；
- [ ] 本地 Workspace 没被误当安全沙箱；
- [ ] MCP 连接和暴露均限制权限与递归；
- [ ] Trace 在导出前完成脱敏；
- [ ] 核心依赖已锁定。

## 14. 官方来源

- [Mastra 官方文档](https://mastra.ai/docs)
- [创建 Mastra 项目](https://mastra.ai/en/docs/local-dev/creating-a-new-project)
- [Mastra Tools 与 MCP](https://mastra.ai/docs/agents/mcp-guide)
- [Mastra AI SDK v7 支持](https://mastra.ai/blog/ai-sdk-v7-support)
- [Mastra 官方仓库](https://github.com/mastra-ai/mastra)
