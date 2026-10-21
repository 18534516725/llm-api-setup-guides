---
title: Crawl4AI 中文教程：本地安装、网页转 Markdown 与批量采集
description: 按 Crawl4AI 0.9.5 说明浏览器安装、AsyncWebCrawler、正文质量检查、并发控制和知识库数据清洗。
---

# Crawl4AI 中文教程：本地安装、网页转 Markdown 与批量采集

> 最后核验：2026-10-21。PyPI 核对版本：0.9.5；Python >=3.10。

[← 返回教程总目录](../教程总目录.md)

## Crawl4AI 是什么

Crawl4AI 提供面向 LLM 的网页采集与 Markdown 生成。可以在自己的机器运行 Python 库，也有服务部署和托管选项。本文先讲本地库，不需要为普通单页采集配置聊天模型。

需要交互点击时参阅 [agent-browser](../coding-tools/agent-browser.md)，需要托管抓取接口时参阅 [Firecrawl](firecrawl.md)。

## 1. 安装与浏览器准备

```bash
python3.12 -m venv .venv-crawl4ai
source .venv-crawl4ai/bin/activate
python -m pip install "crawl4ai==0.9.5"
crawl4ai-setup
crawl4ai-doctor
```

Windows 创建使用 `py -3.12`，激活 `.venv-crawl4ai\Scripts\Activate.ps1`。pip 安装库和下载浏览器是两步；Linux 缺系统依赖时按官方提示处理。

## 2. 一个完整最小案例

保存为 `crawl_page.py`：

```python
import asyncio
from pathlib import Path
from crawl4ai import AsyncWebCrawler


async def main() -> None:
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://example.com")
        if not result.success:
            raise RuntimeError("抓取失败，请检查本地日志")
        text = result.markdown.raw_markdown
        Path("example.md").write_text(text, encoding="utf-8")
        print("Characters:", len(text))


if __name__ == "__main__":
    asyncio.run(main())
```

```bash
python crawl_page.py
```

预期文件包含 Example Domain 正文。首次运行先验证浏览器能启动，再加入复杂页面。

## 3. 为什么原始 Markdown 很长

网页通常有导航、页脚、广告和推荐链接。官方提供 Markdown 生成器与内容过滤策略，但过滤强度必须用自己的样本验证。过强会删除正文，过弱会增加无关 Token。

先保存原始结果，再保存清洗结果。比较标题、正文段落、表格和代码块是否保留，而不只是比较文件大小。

## 4. 动态页面怎么处理

先确认内容是初始 HTML 还是 JavaScript 渲染。对于自己的测试页面，可以使用当前版本 `CrawlerRunConfig` 的等待条件与页面配置。尽量等具体元素，不用固定长延时掩盖失败。

抓到登录页或访问限制页时，应判为采集失败，不把它当作正常知识库内容。

## 5. 批量采集的最小设计

维护 URL 清单，去重后使用低并发队列，每项记录 URL、时间、状态、输出哈希和重试次数。先测 10 页，确认目标服务和本机资源都能承受再扩大。

并发上限、请求速率、失败重试上限要分别控制。不要在每个 URL 内又创建无限重试和无限新浏览器。

## 6. CSS 提取还是 LLM 提取

| 页面特点 | 起步方式 |
|---|---|
| 固定结构列表 | CSS / XPath 等确定性规则 |
| 结构经常变化但有明确语义 | 评估 LLM 提取并定义 Schema |
| 只需正文 | Markdown 与正文清洗 |

LLM 提取增加模型调用和成本。对每个关键字段保留原文证据，缺失值用空值表达。

## 7. 部署边界

本地库运行成功后才评估 Docker 服务。当前官方服务有认证配置要求，应按所固定版本部署说明设置。不要把本地库不需要 Key 推导为公网 API 可以无认证开放。

用户提供 URL 的服务应限制协议与域名，防止访问内网、云元数据地址和本地文件。清洗网页内容时也要防止其中的提示注入影响下游 Agent。

## 8. 常见问题

- 浏览器未安装：运行 setup，检查缓存与环境。
- 系统库缺失：按 Linux 发行版要求安装。
- 正文缺失：核对渲染、等待条件和内容过滤。
- 页面重复：清理 URL 参数并使用内容哈希去重。
- 内存增长：降低并发、复用受控生命周期、检查大页面。
- 版本异常：核对包名、版本和官方安全公告，勿照搬旧依赖安装命令。

## 官方资料

- [Crawl4AI 官方项目](https://github.com/unclecode/crawl4ai)
- [官方文档](https://docs.crawl4ai.com/)
- [0.9.5 发布包](https://pypi.org/project/crawl4ai/0.9.5/)
- [Firecrawl 与 Crawl4AI 怎么选](crawler-comparison.md)
