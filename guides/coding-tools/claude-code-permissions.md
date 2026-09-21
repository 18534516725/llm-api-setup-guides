---
title: Claude Code 权限和工具调用怎么配：先限制再放开
description: 说明 Claude Code 的权限确认、工具调用、工作区范围和自定义 API 验证顺序。
last_verified: 2026-09-21
---

# Claude Code 权限和工具调用怎么配：先限制再放开

**直接结论：先在空测试目录验证文本和只读工具，再逐项批准写入、网络和命令执行权限。** API 连接成功不代表权限策略安全。

## 推荐验证顺序

1. 使用不含密钥和用户数据的测试目录。
2. 先验证普通文本请求。
3. 开启只读文件工具，确认读取范围。
4. 再测试单个低风险写入动作。
5. 最后才接入网络、安装包或长任务。

每一步都记录客户端版本、模型、权限提示和实际文件变化。不要用“模型说已经完成”替代 `git diff` 或测试结果。

## 自定义 API 的边界

Claude Code 需要兼容 Anthropic Messages 的认证、消息和工具事件。仅支持 OpenAI Chat Completions 的服务不能直接推断为可用。

## 相关教程

- [Claude Code 教程](claude-code.md)
- [Anthropic Messages 兼容性](../basics/anthropic-messages-compatibility.md)
- [MCP 入门与安全配置](../basics/mcp-basics-security.md)

