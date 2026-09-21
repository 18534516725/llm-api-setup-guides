---
title: Windows 配置 Codex CLI：PowerShell、环境变量与常见路径
description: 在 Windows PowerShell 配置 Codex CLI 的 API Key、Base URL 和 config.toml，并排查路径与权限问题。
last_verified: 2026-09-21
---

# Windows 配置 Codex CLI：PowerShell、环境变量与常见路径

**直接结论：Windows 先确认 Codex CLI 实际读取的配置目录，再用 PowerShell 设置会话级变量，避免把 Key 写进项目文件。**

## 配置顺序

1. 在 PowerShell 查看 CLI 版本和帮助，确认当前配置字段。
2. 在用户配置目录创建或编辑 `config.toml`。
3. 用会话级环境变量完成最小请求。
4. 关闭并重新打开终端，确认变量没有被旧会话缓存。
5. 运行只读任务，再测试写入和工具权限。

```powershell
$env:OPENAI_API_KEY = "sk-your-key"
codex --version
```

PowerShell、Windows Terminal、Git Bash 和 WSL 的环境变量作用域不同。不要把 PowerShell 语法直接复制到 Bash。

## 排错

- 找不到配置：确认用户目录、文件名和 TOML 语法；
- 401：检查新终端是否继承变量；
- 404：复制服务端公开模型 ID；
- 工具失败：先使用只读权限和空测试工作区。

## 相关教程

- [Codex CLI 教程](codex-cli.md)
- [API Key 安全与轮换](../basics/api-key-security-rotation.md)

