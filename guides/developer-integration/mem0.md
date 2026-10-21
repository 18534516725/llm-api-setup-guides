---
title: Mem0 中文教程：长期记忆、用户隔离与模型配置
description: 使用 Mem0 OSS 建立记忆、检索与删除闭环，说明模型和 Embedding 依赖、持久化、用户授权及托管平台与开源库的差异。
---

# Mem0 中文教程：长期记忆、用户隔离与模型配置

> 最后核验：2026-10-21。PyPI 核对：mem0ai 2.2.1，Python >=3.10。本文围绕 OSS Python 库，不把 main 分支或托管平台的新接口混入固定版本。

[← 返回教程总目录](../教程总目录.md)

## 长期记忆与聊天记录有什么区别

聊天历史保留会话消息；RAG 检索外部文档；长期记忆从交互中保存可复用的信息，例如用户偏好。Mem0 为这种记忆提供写入、检索与管理能力。

它不会让模型自然拥有无限上下文。存什么、何时读、是否过期和如何删除仍需应用设计。

## 1. 安装与准备

```bash
python3.12 -m venv .venv-mem0
source .venv-mem0/bin/activate
python -m pip install "mem0ai==2.2.1"
```

准备模型账户和可用的文本 / Embedding 能力。默认构造会使用默认 Provider 配置；不能把“库开源”理解为不产生模型费用。

如果配置兼容服务，LLM 与 Embedding 要分别设置和验证；两者可能需要不同模型、端点与 Key。不要直接改变默认向量维度后复用旧索引。

## 2. 最小记忆闭环

设置 `OPENAI_API_KEY` 后，在独立测试目录保存 `memory_demo.py`：

```python
from mem0 import Memory

memory = Memory()
user_id = "tutorial-user-001"

added = memory.add(
    [{"role": "user", "content": "我偏好简体中文和简短的代码示例。"}],
    user_id=user_id,
)
print("Add result:", added)

found = memory.search(query="这个用户喜欢怎样的回答？", filters={"user_id": user_id}, top_k=3)
print("Search result:", found)
```

```bash
python memory_demo.py
```

使用虚构偏好，不使用真实个人信息。2.2.1 的 search 使用 filters 传用户范围，top_k 限制条数；不要照搬旧版 search(user_id=...) 参数。先核对返回对象再遍历。

## 3. 写入不等于逐字存储

记忆提取可能只保存其中一部分信息，也可能识别为重复。验收时看提取结果和后续检索，而不只看请求是否成功。

设计 10～20 条虚构会话，包含重复偏好、偏好改变、含糊表达和互相冲突的陈述，检查是否误把猜测存成事实。

## 4. 用户身份从哪里来

后端根据登录身份确定 `user_id`，不能直接信任前端传入任意用户 ID。数据库和检索都要校验租户范围。用户 A 的记忆 ID 即使被 B 猜到，也不能被读写。

至少测试 A 写入后 A 能检索、B 检索不到、B 不能按 ID 删除 A 的记忆。

## 5. 删除与偏好纠正

读取结果中的真实 memory ID，使用同版本删除接口：

```python
memory.delete(memory_id="替换为自己测试记录的真实ID")
```

这是操作形式，执行前先选中本用户的测试记录。删除后重新检索，并检查向量、元数据、缓存与备份策略是否满足你的应用要求。

偏好更新涉及事实时间。保留“何时表达”的信息，避免过去偏好在当前检索中继续占优。

## 6. 持久化与环境隔离

本地默认存储适合实验。生产明确配置向量库、数据目录、备份和迁移，分别隔离开发、测试与正式用户。重启应用后使用同一虚构用户验证记忆是否仍然存在。

修改 Embedding 模型或维度通常需要新集合与重建流程，先做对照再切换。

## 7. 开源库、自托管服务和托管平台

三种入口的认证、接口和高级检索功能不同。官方 README 对托管平台基准也注明了专有优化，不应把其分数直接当作本地 OSS 的实测成绩。

迁移到新版本时先阅读对应 migration guide，用测试集合验证新增、检索、删除和字段变化。不要用 main 文档的接口反推旧包行为。

## 8. 常见问题

| 现象 | 排查 |
|---|---|
| 写入后搜不到 | 是否提取成功、过滤条件、索引持久化 |
| 无 Embedding 结果 | 模型权限、端点、维度和批量限制 |
| 用户数据串联 | 服务端身份绑定与集合隔离 |
| 成本高 | 写入频率、提取模型、重复消息和检索预算 |
| 参数不识别 | 包版本与文档版本，特别是新旧检索参数 |

## 官方来源

- [Mem0 官方项目](https://github.com/mem0ai/mem0)
- [Mem0 文档](https://docs.mem0.ai/)
- [mem0ai 2.2.1](https://pypi.org/project/mem0ai/2.2.1/)
- [上下文与成本](../basics/token-context-agent-cost.md)
