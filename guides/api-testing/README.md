# API 测试与调试教程

[← 返回教程总目录](../README.md)

这一分类用于在接入客户端或开发框架之前，直接验证 API 本身。优先确认四件事：

1. Base URL 和认证头正确；
2. 模型 ID 有权限；
3. 服务实现了目标协议；
4. 流式输出、工具调用和错误响应符合客户端预期。

## 已发布教程

| 教程 | 适合场景 |
|---|---|
| [Apifox / Postman 测试 AI API](./apifox-postman.md) | 图形界面测试 Models、Chat Completions、Responses 与 SSE |

> [!WARNING]
> API 调试工具会保存请求历史。不要把包含真实 Key、私人提示词或客户数据的 Collection、环境和截图公开分享。

