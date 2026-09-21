---
title: API Key 泄露怎么办：撤销、轮换与日志排查清单
description: 发现 API Key 出现在 Git、日志、截图或客户端后，按优先级完成撤销、轮换、审计和恢复。
last_verified: 2026-09-21
---

# API Key 泄露怎么办：撤销、轮换与日志排查清单

**直接结论：先撤销旧 Key，再清理公开文件和日志，最后创建最小权限的新 Key。不要先花时间改提交历史而让旧 Key继续有效。**

## 立即处置

1. 在服务端禁用或撤销疑似泄露的 Key。
2. 检查最近调用、余额、模型和 IP 记录。
3. 创建新的 Key，限制用途、额度和来源。
4. 更新本地环境变量、CI Secret 和部署配置。
5. 通知受影响的协作者，不在工单中粘贴完整凭证。

## 清理泄露位置

- GitHub、Issue、Pull Request 和 Gist；
- CI 日志、构建产物和 Docker 层；
- 屏幕截图、录屏和聊天记录；
- 客户端配置备份和 shell history。

删除文件不能让已经公开的 Key 自动失效。要把“撤销”作为独立步骤记录。

## 预防

- 使用环境变量或系统密钥环；
- 不把真实 Key 放进教程示例；
- 为不同工具使用不同 Key；
- 设置过期时间和用量告警；
- 定期轮换并验证旧 Key 已失效。

## 官方来源

- [GitHub Secret scanning](https://docs.github.com/en/code-security/secret-scanning)
- [API Key 安全与轮换](api-key-security-rotation.md)

