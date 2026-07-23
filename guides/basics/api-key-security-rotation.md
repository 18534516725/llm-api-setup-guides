# API Key 安全与轮换：从本地开发到泄露处置

> 最后核验：2026-07-23
>
> 适合：使用 AI 客户端、SDK、CI/CD、自托管应用或团队共享项目的用户

[← 返回教程目录](../教程总目录.md)

API Key 通常等同于一段可计费、可访问服务的密码。把 Key 藏在代码变量名里并不会更安全；真正有效的是隔离、最小权限、受控存放、可撤销和持续监控。

## 1. 先做密钥资产表

不要记录完整 Key，只记录管理信息：

| 字段 | 示例 |
|---|---|
| 用途 | 本地开发 / CI / 生产后端 |
| 负责人 | 团队或个人 |
| 创建时间 | 2026-07-23 |
| 权限 | 只读 / 指定模型 / 指定项目 |
| Key 指纹 | 末四位或平台提供的 ID |
| 存放位置 | 密钥管理服务中的条目名称 |
| 最近轮换 | 日期 |
| 撤销条件 | 离职、泄露、设备丢失、异常用量 |

每个环境使用独立 Key。这样某个设备泄露时，可以只撤销受影响的凭据。

## 2. 绝对不要放在哪里

- 浏览器前端 JavaScript；
- 移动应用安装包；
- Git 仓库，包括私有仓库；
- README、Issue、聊天消息和截图；
- Dockerfile 的 `ENV`；
- 可下载的构建产物；
- 前端环境变量，如打包后可见的 `VITE_*`；
- Shell 历史、CI 日志或错误追踪正文。

前端需要调用 AI 时，应由前端请求自己的后端，再由后端使用服务端 Key 发起请求，并在后端完成用户鉴权、限流和预算控制。

## 3. 本地开发的安全做法

临时输入：

```bash
read -s OPENAI_API_KEY
export OPENAI_API_KEY
```

程序读取环境变量：

```python
import os

api_key = os.environ["OPENAI_API_KEY"]
```

```javascript
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("缺少 OPENAI_API_KEY");
}
```

结束后清理：

```bash
unset OPENAI_API_KEY
```

如果使用 `.env`：

```dotenv
OPENAI_API_KEY=YOUR_API_KEY
```

同时确保 `.gitignore` 包含：

```gitignore
.env
.env.*
!.env.example
```

`.env.example` 只保留变量名：

```dotenv
OPENAI_API_KEY=
AI_BASE_URL=
AI_MODEL_ID=
```

## 4. 不要用错误方式验证

以下命令会把完整 Key 打印到屏幕：

```bash
echo "$OPENAI_API_KEY"
```

更安全的检查是只确认变量非空：

```bash
test -n "$OPENAI_API_KEY" && echo "Key 已加载"
```

日志中最多记录平台给出的 Key ID 或经过批准的短指纹。不要自行记录前缀加末四位，除非确认这种组合不会降低安全性。

## 5. CI/CD 中如何存放

把 Key 放进 CI 平台的 Secret，而不是工作流 YAML：

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

同时做到：

- 限制哪些分支和环境能读取生产 Secret；
- 外部 Pull Request 不注入敏感变量；
- 审核脚本是否会打印全部环境变量；
- 生产发布使用独立环境审批；
- 定期检查长期不用的 Secret；
- 能用短期身份凭据时，不使用长期静态 Key。

不要运行来源不明、会读取全部环境变量的构建脚本。

## 6. 容器与服务器部署

不要把 Key 烘焙进镜像：

```dockerfile
# 错误示例
ENV OPENAI_API_KEY=真实密钥
```

应在运行时注入：

```yaml
services:
  app:
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

生产环境进一步使用云密钥服务、容器 Secret 或受控文件挂载。确保：

- 文件只对运行用户可读；
- 备份不意外包含明文 Key；
- 崩溃转储和诊断页面不输出环境变量；
- 管理后台不会把完整 Key 回显到浏览器。

## 7. Key 权限和预算

服务支持时应配置：

- 项目级或应用级 Key；
- 只允许需要的模型和接口；
- 读取、写入和管理权限分离；
- IP 白名单或可信网络；
- 单 Key 用量告警；
- 每日或每月预算；
- 请求速率和并发上限。

预算不是安全边界，但可以降低异常使用的损失。

## 8. 无中断轮换流程

推荐采用“双 Key 窗口”：

1. 创建新 Key，但暂不撤销旧 Key；
2. 把新 Key 更新到密钥管理系统；
3. 重新发布或刷新应用配置；
4. 用健康检查确认新 Key 已生效；
5. 检查所有实例、定时任务和 CI；
6. 撤销旧 Key；
7. 验证旧 Key 已无法使用；
8. 更新资产表和轮换日期。

不要先删旧 Key 再找配置位置。多实例系统还要考虑滚动发布期间新旧版本并存。

## 9. 什么时候必须立即轮换

- Key 出现在公开或私有 Git 历史；
- Key 被粘贴到 Issue、聊天或工单；
- 日志、截图或录屏包含完整认证信息；
- 电脑、服务器或团队账号失窃；
- 出现无法解释的用量、地区或请求模式；
- 员工、外包或合作方不再需要访问；
- 依赖或 MCP Server 可能读取过该凭据。

如果 Key 已经提交到 Git，删除当前文件不够，因为历史提交中仍然存在。

## 10. 泄露后的正确处置顺序

1. **立即撤销或禁用旧 Key**；
2. 创建权限更小的新 Key；
3. 更新合法应用并验证；
4. 查看用量、账单、审计日志和异常时间段；
5. 确认泄露范围：仓库、日志、构建产物、聊天或设备；
6. 清理 Git 历史和缓存副本；
7. 通知受影响人员并保存事件记录；
8. 修复导致泄露的流程；
9. 增加 Secret 扫描和 Push Protection；
10. 持续观察异常用量。

“先从仓库删掉再说”会留下可利用窗口。撤销凭据永远优先于美化历史。

## 11. Git 泄露如何处理

先撤销 Key，再清理历史。历史改写会改变提交哈希，团队仓库需要统一协调，不要在不了解影响时直接强推。

预防措施：

- 启用 GitHub Secret Scanning；
- 启用 Push Protection；
- 提交前检查暂存内容；
- 在本地使用 Secret 扫描工具；
- 示例统一使用 `YOUR_API_KEY`；
- 测试使用明显无效的假值。

如果 GitHub 阻止了包含 Secret 的 Push，优先移除 Secret，不要因为“稍后再修”而绕过保护。

## 12. 客户端和桌面工具注意事项

配置 Key 前确认：

- Key 保存在哪里，是否使用系统钥匙串；
- 配置能否被云同步；
- 导出配置时是否包含凭据；
- 插件是否能读取同一配置目录；
- 调试日志是否记录请求头；
- 卸载客户端后凭据是否仍留在本地。

共享电脑上不要使用长期 Key。给第三方工具授权时使用独立、可单独撤销的凭据。

## 13. 日常检查清单

- [ ] 每个环境和应用使用独立 Key；
- [ ] 前端与安装包不包含长期 Key；
- [ ] 仓库、Issue 和日志没有真实 Key；
- [ ] CI Secret 不向不可信任务开放；
- [ ] 权限、模型和预算为最小范围；
- [ ] 能根据 Key ID 找到负责人和用途；
- [ ] 轮换过程经过实际演练；
- [ ] 有异常用量告警；
- [ ] 离职与设备丢失会触发撤销；
- [ ] 泄露时先撤销、再清理和复盘。

## 14. 官方参考

- [OpenAI：Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [GitHub：Secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [GitHub：Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)

下一步：阅读[限流、重试与并发控制](./rate-limits-retries.md)，避免安全配置完成后又因无限重试造成费用和稳定性问题。
