# Promptfoo 自动化评测 Prompt、模型与 AI Agent 完整教程

> 最后核验：2026-08-10
>
> 适用范围：Promptfoo、OpenAI-compatible API、断言、回归测试与 Red Team
>
> 预计用时：30～60 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Promptfoo 解决什么问题

手动和模型聊几句无法回答这些问题：

- 新 Prompt 是否让旧用例退化；
- 换模型后 JSON、工具调用和拒答是否还正确；
- 低成本模型能否达到同样质量；
- API 更新后延迟、错误率和安全性是否变化；
- 提示注入或越权输入能否绕过规则。

Promptfoo 是开源 LLM 评测和 Red Team 工具。它把 Prompt、Provider、测试变量和断言写入配置，生成可重复的测试矩阵。

## 2. 安装与初始化

官方快速入口使用当前版本的 npx：

```bash
mkdir promptfoo-eval
cd promptfoo-eval
npx promptfoo@latest init --example getting-started
```

或安装全局 CLI：

```bash
npm install -g promptfoo
promptfoo --version
```

在 CI 中应锁定经过验证的版本，不能每次构建都无审查地使用 `latest`。

## 3. 第一个可重复评测

新建 `promptfooconfig.yaml`：

```yaml
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json

description: 中文客服回答回归测试

prompts:
  - |
    你是客服助手。只根据给定政策回答；不知道就说“无法确认”。
    政策：{{policy}}
    问题：{{question}}

providers:
  - id: openai:chat:YOUR_MODEL_ID
    label: candidate-model
    config:
      temperature: 0

tests:
  - vars:
      policy: 订单支付后 7 天内可申请退款。
      question: 支付 3 天后可以退款吗？
    assert:
      - type: icontains
        value: 可以
      - type: not-icontains
        value: 30 天

  - vars:
      policy: 订单支付后 7 天内可申请退款。
      question: 退款多久到账？
    assert:
      - type: icontains
        value: 无法确认
```

环境变量：

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_API_BASE_URL="https://api.example.com/v1"
```

执行：

```bash
npx promptfoo@latest eval
npx promptfoo@latest view
```

Viewer 适合本地审查，不要把带完整用户数据的评测结果直接公开。

## 4. 对比多个模型或 Prompt

```yaml
prompts:
  - file://prompts/v1.txt
  - file://prompts/v2.txt

providers:
  - id: openai:chat:MODEL_A
    label: model-a
  - id: openai:chat:MODEL_B
    label: model-b

tests:
  - file://tests/*.yaml
```

Promptfoo 会运行 Prompt × Provider × Test 的组合。控制组合数量，否则费用会按乘法增长。

每次结果应记录：

- Prompt Git SHA；
- Provider 和准确模型 ID；
- 温度、Token 上限等参数；
- 测试集版本；
- Promptfoo 版本；
- 评测时间和 API 区域。

## 5. 断言应该分层

确定性断言优先：

```yaml
assert:
  - type: contains-json
  - type: javascript
    value: |
      const data = JSON.parse(output);
      return typeof data.answer === 'string' && data.answer.length > 0;
```

常见层次：

1. HTTP / 运行是否成功；
2. JSON 和 Schema；
3. 必须包含 / 禁止包含；
4. 业务规则；
5. 语义相似或 LLM-as-a-Judge；
6. 人工抽样。

不要只用“像不像参考答案”判断结构化接口，也不要要求生成式回答逐字一致。

## 6. 测试 OpenAI-compatible API

Promptfoo 官方 OpenAI Provider 支持通过 `apiBaseUrl` 或环境变量连接兼容端点。单个目标可直接使用：

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
export OPENAI_API_BASE_URL="https://api.example.com/v1"
```

如果兼容服务只实现 Chat Completions，就使用 `openai:chat:` Provider；需要 Responses 时应使用对应 Provider 形式并独立测试。不要因为 Chat 通过就假设 Responses、Embedding 和工具也通过。

## 7. HTTP Target 测试完整应用

当你要测的是自己的 RAG / Agent API，而不是裸模型，可以配置 HTTP Provider / Target，把变量映射到业务请求，并从 JSON 响应提取最终回答。

此时至少测试：

- 认证失败；
- 缺少字段；
- 超时与 429；
- 检索为空；
- 工具失败；
- Session 越权；
- 响应中是否泄露内部错误。

测试环境使用专用低权限 Key，不能把生产管理员凭据放进评测配置。

## 8. 工具调用怎么评测

不要只断言最终回答正确。对 Agent 保存并检查：

- 工具名称；
- JSON 参数；
- 调用顺序；
- 是否调用了被禁止的工具；
- 工具错误后是否安全停止；
- 最终回答是否基于真实工具结果。

付款、发信、删文件等工具应在模拟环境运行。回归测试绝不能对真实业务产生副作用。

## 9. Red Team 快速入口

Promptfoo 的 Red Team 能针对 Prompt Injection、越权、数据泄露、RAG Poisoning 等类别生成和执行攻击测试：

```bash
npx promptfoo@latest redteam setup
```

无 UI：

```bash
npx promptfoo@latest redteam init --no-gui
npx promptfoo@latest redteam run
npx promptfoo@latest redteam report
```

> [!WARNING]
> Red Team 会生成冒犯、有害或攻击性内容。只对你拥有或获准测试的系统运行，并控制结果的访问和保留范围。

攻击生成模型与被测目标是两个不同角色。阅读配置，确认数据是否会发送到远程生成 / 评分服务。对敏感系统需要明确 Provider 和远程功能开关。

## 10. 在 CI 中阻止退化

示例流程：

```bash
npx promptfoo@latest eval \
  --no-cache \
  --output results.json
```

CI 应：

- 使用固定 CLI 版本；
- 从 Secret 管理器注入 Key；
- 对提交运行小型确定性集；
- 定时运行完整语义 / Red Team 集；
- 保存脱敏结果和基线；
- 失败时输出用例 ID，而不是完整用户内容和凭据。

不要让随机 LLM 评分一次波动就阻断所有发布。关键规则使用确定性断言，语义指标设置基线、容差和重复策略。

## 11. 缓存、并发与费用

缓存适合重复调试，但正式基准前应明确是否清缓存。否则可能把缓存响应误当实时模型表现。

控制：

- Provider 并发；
- 请求间隔与 429 退避；
- 每个用例最大输出；
- Prompt × 模型 × 测试集组合数；
- 评分模型调用数；
- Red Team 插件和每类攻击数量。

## 12. 常见问题

### 401

确认 Key 在运行 Promptfoo 的同一进程环境中，并检查 `OPENAI_API_BASE_URL` 是否指向正确端点。不要在 YAML 中提交真实 Key。

### 404

检查 Provider 是 Chat 还是 Responses，以及 Base URL 是否重复 `/v1`。先用 curl 发送同一最小请求。

### 断言偶尔失败

降低温度、检查模型是否变更、区分确定性规则与语义波动。不要通过无限放宽阈值隐藏真实退化。

### 结果和实际应用不一致

确保评测使用了完全相同的 system prompt、模板、模型参数、工具 Schema、检索结果和后处理。

### Red Team 成本异常

减少插件、策略和每类用例数，区分攻击生成、目标调用和评分调用三部分成本。

## 13. 验收清单

- [ ] Prompt、Provider、参数和测试集均版本化；
- [ ] 关键业务规则使用确定性断言；
- [ ] 正常、边界、错误和越权用例齐全；
- [ ] Agent 工具在模拟环境测试；
- [ ] 评测 Key 为低权限且未进入仓库；
- [ ] 结果不包含敏感用户数据；
- [ ] CI 快速集稳定，完整集按计划运行；
- [ ] 缓存、并发、重试与费用有明确设置。

## 14. 官方来源

- [Promptfoo Getting Started](https://www.promptfoo.dev/docs/getting-started/)
- [Promptfoo Configuration](https://www.promptfoo.dev/docs/configuration/guide/)
- [Promptfoo OpenAI Provider](https://www.promptfoo.dev/docs/providers/openai/)
- [Promptfoo Red Team Quickstart](https://www.promptfoo.dev/docs/red-team/quickstart/)
- [Promptfoo GitHub 仓库](https://github.com/promptfoo/promptfoo)
