---
title: MinerU 4 中文教程：安装、PDF 转 Markdown 与 OCR
description: 按 MinerU 4.0 系列介绍虚拟环境安装、mineru-kit 解析、中文扫描件、输出核验、模型与硬件选择及常见问题。
---

# MinerU 4 中文教程：安装、PDF 转 Markdown 与 OCR

> 最后核验：2026-10-21。PyPI 核对版本：4.0.12；Python >=3.10,<3.15。配置依据官方 4.x 文档。

[← 返回教程总目录](../教程总目录.md)

## MinerU 是什么

MinerU 将 PDF、图片和 Office 等文档转换为便于大模型处理的结构化内容。它适合扫描件 OCR、论文公式、表格和多栏布局。解析后的 Markdown 仍需检查，尤其是合并单元格、图片内文字和阅读顺序。

4.x 引入了新的命令和文档库工作流。不要把旧版 `mineru -p ... -o ...` 教程与 4.x 安装直接拼接。

## 1. 安装到独立环境

安装 Python 3.12 后：

```bash
python3.12 -m venv .venv-mineru
source .venv-mineru/bin/activate
python -m pip install --upgrade pip
python -m pip install "mineru==4.0.12"
mineru-kit --help
```

Windows 将创建命令替换为 `py -3.12 -m venv .venv-mineru`，激活使用 `.venv-mineru\Scripts\Activate.ps1`。依赖下载和模型下载是不同阶段，pip 成功不代表解析模型已经缓存完成。

## 2. 解析第一个 PDF

准备一份自己可使用的短文档 `document.pdf`：

```bash
mineru-kit parse document.pdf -o document.md --tier standard
```

先用 3～5 页验证环境，再处理整本扫描件。检查输出是否生成、页数是否覆盖、标题和正文是否完整。

需要图形界面可运行：

```bash
mineru-kit webui
```

使用启动日志给出的本地地址；不要在没有认证和访问限制时公开暴露解析服务。

## 3. 硬件与模型怎么选

| 环境 | 起步建议 |
|---|---|
| CPU / 普通电脑 | 默认安装，先测短文件的时间和内存 |
| macOS | 官方说明默认安装已适合该平台，不必照搬 NVIDIA extras |
| NVIDIA GPU | 根据官方说明评估 full 安装和匹配的驱动 / torch |
| Windows GPU | 特别核对 GPU torch 的单独安装要求 |

官方 4.x 默认路径涉及 ONNX CPU 与 llama.cpp / Vulkan；能安装并不代表每种硬件都有相同吞吐。不要在未测量时写“所有电脑秒转”。

## 4. 文档库与渐进读取

需要对长文档逐页读取、搜索和稳定定位时，使用官方文档库流程：

```bash
mineru server start
mineru parse "document.pdf" --json
mineru list
```

解析结果可提供 `doc:.../tier:.../page:...` 等定位信息。后续读取使用返回的真实定位符，避免每次重新解析整份文件。不要把示例定位 ID 当作自己的文档 ID。

## 5. PDF 转 Markdown 后怎样验收

挑选至少四种页面：普通正文、多栏页面、复杂表格、含公式或图片页面。逐页检查：

- 标题级别、段落和页内阅读顺序；
- 中文数字、英文缩写、负号与单位；
- 表格列是否错位、表头是否丢失；
- 脚注、页码是否混入正文；
- 公式是否保留，图片引用是否可找到；
- 是否出现原文没有的解释或填补内容。

关键业务字段如金额、日期和合同条款应回到原页核对。

## 6. 接入知识库

保留原文件、解析版本、文件哈希和页码关联。先按标题与段落切分，再做 Embedding；不要把跨页表格机械切成不带表头的碎片。

推荐先完成 [Embedding 与 Rerank](../basics/embedding-rerank.md) 的维度和检索验收，再导入 [LightRAG](../self-hosted/lightrag.md) 或已有知识库。

## 7. 常见问题

| 现象 | 优先排查 |
|---|---|
| 命令不存在 | 激活环境、安装包版本、CLI 新旧代际 |
| 首次运行很慢 | 模型首次下载、缓存路径、CPU 推理 |
| 显存不足 | 减小并发、短文件测试、确认实际后端 |
| 扫描件乱码 | 分辨率、旋转、语言和 OCR 质量 |
| PDF 无法打开 | 加密、损坏、权限和格式，不要重复重装依赖 |
| 服务无法连接 | server 是否启动、端口、环境是否一致 |

## 8. 隐私与复现

本地与远程解析应明确选择。当前官方说明不会仅因普通本地解析而自动上传官方服务；使用远程后端前仍需检查配置与数据政策。不要把客户原件、模型缓存和中间图片提交到教程仓库。

记录模型、硬件、包版本和运行参数；本文没有提供未经测试的速度排行榜。

## 官方来源

- [MinerU 官方仓库](https://github.com/opendatalab/MinerU)
- [SDK 与 API 指南](https://opendatalab.github.io/MinerU/usage/sdk_api/)
- [当前发布包](https://pypi.org/project/mineru/4.0.12/)
- [与 Docling、MarkItDown 的选型对照](pdf-parser-comparison.md)
