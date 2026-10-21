---
title: Firecrawl 中文教程：网页转 Markdown、Crawl 与 API 接入
description: 使用 Firecrawl v2 API 完成网页采集、正文提取、站点抓取和结果核验，区分云服务、自部署、抓取 Key 与模型 Key。
---

# Firecrawl 中文教程：网页转 Markdown、Crawl 与 API 接入

> 最后核验：2026-10-21。示例采用官方 v2 HTTP API，避免与旧版 SDK 接口混用。

[← 返回教程总目录](../教程总目录.md)

## Firecrawl 是什么

Firecrawl 面向 AI 应用提供网页搜索、抓取和内容提取能力。常见用途是把公开网页转换成 Markdown，再进入知识库或研究助手。抓取是数据获取步骤，模型问答是另一项服务。

初次使用建议先做单页 scrape，再做有限范围 crawl。本站教程不把“能抓一页”描述为“能稳定抓任何网站”。

## 1. 准备 Key 与环境

在官方服务创建 API Key，保存为环境变量 `FIRECRAWL_API_KEY`。它与聊天模型 Key 分开管理，不要把模型 Key 发到抓取接口。

需要 curl；处理 JSON 可安装 jq。不要把真实 Key 写入文章、命令截图或 Git。

## 2. 单页转 Markdown

```bash
curl --fail-with-body --max-time 90 \
  https://api.firecrawl.dev/v2/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"],"onlyMainContent":true}'
```

验收同时看 HTTP、业务成功状态和返回 Markdown。检查内容是不是正文，而不是验证码、登录页或错误提示。

PowerShell 中建议明确使用 `curl.exe`，并通过输入文件提供 JSON，避免把 Shell 引号问题误认为 API 问题。

## 3. 整站抓取先设边界

```bash
curl --fail-with-body --max-time 90 \
  https://api.firecrawl.dev/v2/crawl \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","limit":5,"scrapeOptions":{"formats":["markdown"]}}'
```

crawl 是异步任务：保存返回的 job ID，按官方状态接口查询进度，检查是否还有分页结果。提交成功不等于全部页面已经完成。

先把 `limit` 控制在很小范围，再根据有效页面比例和实际扣费扩大。限制路径、域名和深度，避免分页、筛选参数形成无限 URL。

## 4. Scrape、Map、Crawl、Search 怎么选

| 能力 | 使用情境 |
|---|---|
| Scrape | 已有明确 URL，提取一页 |
| Map | 先发现站点可能的 URL |
| Crawl | 在有限规则下遍历并采集 |
| Search | 先搜索再获取结果，需核对额外费用和范围 |

不要用整站 Crawl 代替只需一个页面的 Scrape。

## 5. 提取 JSON 的正确顺序

先确认正文抓对，再为产品名、日期等字段定义 Schema。字段不存在时允许空值，不要求模型猜测。对价格、库存和日期保留来源 URL 与采集时间。

结构化输出不代表事实已核验。抽取后用字段类型、枚举、范围和原文片段检查。

## 6. 云服务与自部署

云服务负责部分浏览器、调度与基础设施；自部署需要维护组件、队列、存储和运行资源。开源代码与托管服务功能不保证完全相同，部署前逐项检查自己要用的接口。

自部署按官方仓库的当前部署说明和配置模板操作，固定 Git 提交或镜像版本。不要复制过时 Compose 后声称覆盖云端全部能力。

## 7. 接入 RAG

为每页保存 URL、标题、抓取时间、内容哈希和清洗规则。去掉导航、页脚、重复内容后再切块；重复抓到同一页不应创建多个相同向量。

引用应能回到真实原页。内容删除或更新后，旧索引也要同步处理。

## 8. 常见问题

| 现象 | 排查 |
|---|---|
| 401 | 抓取服务 Key、环境变量和账户状态 |
| 429 | 计划限流、并发和退避，不是无限重试 |
| 返回验证码 | 页面访问限制；换官方 API 或获准的数据方式 |
| Markdown 为空 | 渲染时机、页面正文、采集选项 |
| Crawl 一直不结束 | URL 数量、范围、任务状态和等待上限 |
| 费用超预期 | 页面数、重试、搜索 / 提取等功能计费 |

## 来源与相关

- [Firecrawl 官方项目](https://github.com/firecrawl/firecrawl)
- [Firecrawl 官方文档](https://docs.firecrawl.dev/)
- [Crawl4AI 教程](crawl4ai.md)
- [采集工具选型](crawler-comparison.md)
