---
title: MarkItDown 中文教程：Office 与 PDF 批量转 Markdown
description: Microsoft MarkItDown 的安装、命令行、可选格式依赖、Python 转换、OCR 边界和输出验收。
---

# MarkItDown 中文教程：Office 与 PDF 批量转 Markdown

> 最后核验：2026-10-21。PyPI 核对版本：0.1.8；Python >=3.10,<3.15。

[← 返回教程总目录](../教程总目录.md)

## MarkItDown 是什么

MarkItDown 是 Microsoft 开源的文件转 Markdown 工具。适合把 Word、PowerPoint、Excel、PDF 等文件整理为文字分析输入。它强调结构化文本，不是高保真版式复原工具。

普通文字文档可以先用它起步；扫描件、复杂表格和公式密集文档，再对照 [MinerU](mineru.md) 与 [Docling](docling.md)。

## 1. 安装

```bash
python3.12 -m venv .venv-markitdown
source .venv-markitdown/bin/activate
python -m pip install "markitdown[all]==0.1.8"
markitdown --help
```

只处理部分格式时可按官方 extras 缩小依赖，例如 `markitdown[pdf,docx,pptx]`。extras 启用解析依赖，不会自动配置云端 OCR 或模型账户。

Windows 使用 `py -3.12` 创建虚拟环境，并激活 `.venv-markitdown\Scripts\Activate.ps1`。

## 2. 转换一个文件

```bash
markitdown sample.docx -o sample.md
markitdown slides.pptx -o slides.md
markitdown report.pdf -o report.md
```

每次指定不同输出文件，防止覆盖。检查 Markdown 的章节、表格、链接和编码。

## 3. Python 接入

0.1.8 的结果字段使用 `markdown`；`text_content` 是已软弃用的兼容别名。保存为 `convert.py`：

```python
from pathlib import Path
from markitdown import MarkItDown

source = Path("sample.docx")
result = MarkItDown().convert(str(source))
Path("sample.md").write_text(result.markdown, encoding="utf-8")
print("Converted:", source.name)
```

```bash
python convert.py
```

如果所安装版本返回不同结果类型，先检查 `python -m pip show markitdown` 和对应版本源码，不要只改字段猜测兼容。

## 4. 逐批转换怎么做

维护一张输入清单，记录文件名、哈希、输出路径和状态。先处理 5 份样本，再扩大批量。不同子目录可能有同名文件，输出名应包含稳定 ID 或相对目录。

不建议把任意用户上传 ZIP 直接交给长期服务解压转换。限制文件大小、成员数、解压后总大小和处理时间。

## 5. 扫描 PDF 为什么没有文字

普通 PDF 文字提取与 OCR 是不同能力。扫描件可能只有图片。当前官方项目有 OCR 插件与云端文档处理集成，但启用方式、依赖和模型配置需分别满足；仅安装 `[all]` 不能当作完整 OCR 验收。

若任务主要是中文扫描件，优先用专门解析方案做同文件比较，而不是把空输出直接提交给大模型补写。

## 6. 表格和幻灯片的验收

| 输入 | 重点检查 |
|---|---|
| DOCX | 标题层级、列表、表格与图片说明 |
| PPTX | 幻灯片顺序、文本框顺序、图中文字 |
| XLSX | Sheet 名、表头、日期、公式值和单位 |
| PDF | 文字层、多栏顺序、页眉页脚 |

把生成 Markdown 和原件并排检查。文件中存在某个词，不代表表格关系被正确保留。

## 7. 服务端处理边界

MarkItDown 按当前进程权限做文件和网络 I/O。接收不可信上传时使用单独工作目录和隔离进程，校验真实路径、格式和超时。只需要本地文件时，不要允许用户随意传内部网络 URL。

## 8. 常见问题

- 缺转换器：确认格式对应 extras 和系统依赖。
- 文本为空：确认扫描件、图片内容和 OCR 路径。
- 导出乱码：使用 UTF-8 写出，检查终端编码。
- 结果属性不存在：核对固定版本与示例的结果类型。
- 大文件耗时：逐批处理并限时，记录失败文件以便单独重试。

## 官方资料

- [MarkItDown 官方项目](https://github.com/microsoft/markitdown)
- [0.1.8 发布包](https://pypi.org/project/markitdown/0.1.8/)
- [三种文档解析器怎么选](pdf-parser-comparison.md)
