---
title: LightRAG 中文部署教程：知识图谱、模型与检索验证
description: 安装 LightRAG 1.5.7，配置 LLM 与 Embedding、认证和本地监听，理解五种检索模式、索引迁移和知识库验收。
---

# LightRAG 中文部署教程：知识图谱、模型与检索验证

> 最后核验：2026-10-21。PyPI 核对：lightrag-hku 1.5.7，Python >=3.10。配置字段依据官方 env.example。

[← 返回教程总目录](../教程总目录.md)

## LightRAG 与普通 RAG 的区别

LightRAG 将实体与关系检索和文本块检索结合，用于文档问答和跨文档关联。图结构带来额外索引工作，也增加实体抽取、存储和维护成本，不是对所有数据都必然优于普通向量检索。

用自己标注的问题集比较质量、延迟和总成本，再决定是否需要图谱。

## 1. 安装

```bash
python3.12 -m venv .venv-lightrag
source .venv-lightrag/bin/activate
python -m pip install "lightrag-hku[api]==1.5.7"
lightrag-server --help
```

不是名为 `lightrag` 的其他包。Windows 创建用 `py -3.12`，激活 `.venv-lightrag\Scripts\Activate.ps1`。

## 2. 获取配置模板

从官方仓库所用版本取得 `env.example`，复制为工作目录中的 `.env`。服务端从对应目录加载配置；不要从不相关 Shell 目录启动后误以为配置生效。

至少核对这些字段：

```dotenv
HOST=127.0.0.1
PORT=9621
LLM_BINDING=openai
LLM_BINDING_HOST=https://api.example.com/v1
LLM_BINDING_API_KEY=YOUR_LLM_KEY
LLM_MODEL=YOUR_CHAT_MODEL
EMBEDDING_BINDING=openai
EMBEDDING_BINDING_HOST=https://api.example.com/v1
EMBEDDING_BINDING_API_KEY=YOUR_EMBEDDING_KEY
EMBEDDING_MODEL=YOUR_EMBEDDING_MODEL
EMBEDDING_DIM=1024
LIGHTRAG_API_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
WHITELIST_PATHS=/health
```

`api.example.com` 是占位地址，1024 也是示例维度，必须替换为模型真实输出维度。所有 Key、模型和端点都需要分别验证。若启用按角色的 LLM 配置，按同版本模板逐项配置。

## 3. 启动与认证

```bash
lightrag-server
curl --fail --max-time 10 http://127.0.0.1:9621/health
```

在本机打开服务日志给出的 WebUI 地址，用自己配置的认证访问。官方提醒默认监听和部分兼容路由的放行行为，公网开放前必须测试无 Key 请求被拒绝，而不是只看 UI 有登录框。

## 4. 第一批文档

只导入两三篇短文本，记录文档 ID、来源和状态。先等解析、实体抽取和索引完成，再提问。PDF 解析可配合 [MinerU](../document-processing/mineru.md) 或 [Docling](../document-processing/docling.md)，但外部解析器需要单独满足依赖。

先检查原始文本是否完整。OCR 错字和表格错位会被进一步带入图谱。

## 5. 五种查询模式

| 模式 | 起步测试问题 |
|---|---|
| naive | 文本中的一个直接事实 |
| local | 指定实体的细节与相邻关系 |
| global | 多文档主题和关系概括 |
| hybrid | 组合 local 与 global |
| mix | 综合图谱与文本块检索 |

同一问题使用相同文档和模型比较。不要把模式名称当作答案正确率保证。

## 6. 索引成本与迁移

实体关系抽取通常在导入阶段调用模型；查询阶段也会调用模型。分别测量每份文档的索引费用、查询费用、耗时和重试。

Embedding 维度、抽取模型或切块策略变化后，先创建新索引，完成固定问题回归，再切换。删除源文件后也要验证相关关系与片段是否清理。

## 7. 生产存储

默认本地 / 内存加文件存储适合小样本实验，生产按官方支持配置可靠后端，明确备份、恢复、并发和租户隔离。仅复制 `.env` 不等于完成数据备份。

以服务端用户权限控制文档访问；不要让客户端任意指定别人的 workspace 或索引。

## 8. 排错

| 问题 | 排查 |
|---|---|
| 导入一直处理中 | 抽取 LLM、限流、队列和失败任务日志 |
| 向量维度错误 | 模型真实维度与已有集合结构 |
| 能导入但答案差 | 原文、切块、实体关系与引用覆盖 |
| 访问无认证 | 放行路径、实际部署版本和所有公开路由 |
| 内存增长 | 文档规模、并发与所选存储 |

## 官方来源

- [LightRAG 项目](https://github.com/HKUDS/LightRAG)
- [配置模板](https://github.com/HKUDS/LightRAG/blob/main/env.example)
- [API Server 指南](https://github.com/HKUDS/LightRAG/blob/main/docs/LightRAG-API-Server.md)
- [lightrag-hku 1.5.7](https://pypi.org/project/lightrag-hku/1.5.7/)
