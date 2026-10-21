---
title: Docling 中文教程：PDF 解析、OCR 与结构化 Markdown
description: 从 Docling 安装和 DocumentConverter 开始，介绍 PDF 转 Markdown、表格核验、离线模型准备、JSON 导出与知识库接入。
---

# Docling 中文教程：PDF 解析、OCR 与结构化 Markdown

> 最后核验：2026-10-21。PyPI 核对版本：2.141.0；Python >=3.10。

[← 返回教程总目录](../教程总目录.md)

## Docling 适合什么

Docling 是文档解析工具，提供统一的 DoclingDocument 表达与多种导出格式。它适合把 PDF、Office、网页等内容接入 RAG，并保留比纯文字提取更丰富的结构。

它不负责证明内容真实，也不能保证恢复原始排版。做面向人的高保真 Word 编辑与“提取给模型阅读”是两种需求。

## 1. 安装

建议 Python 3.12 和独立环境：

```bash
python3.12 -m venv .venv-docling
source .venv-docling/bin/activate
python -m pip install "docling==2.141.0"
docling --help
```

Windows 创建使用 `py -3.12 -m venv .venv-docling`，激活 `.venv-docling\Scripts\Activate.ps1`。首次解析可能需要下载模型；预留磁盘和网络时间。

## 2. 命令行转换

把短 PDF 放到当前目录：

```bash
docling sample.pdf
```

检查命令报告的输出位置。远程 URL 也是支持路径之一，但私有服务应先下载到获准目录，再做本地转换，不要让服务无校验地访问任意 URL。

## 3. 完整 Python 示例

保存为 `convert_document.py`：

```python
from pathlib import Path
from docling.document_converter import DocumentConverter


def main() -> None:
    source = Path("sample.pdf")
    if not source.is_file():
        raise FileNotFoundError(source)
    result = DocumentConverter().convert(str(source))
    output = Path("output")
    output.mkdir(exist_ok=True)
    (output / "sample.md").write_text(
        result.document.export_to_markdown(), encoding="utf-8"
    )
    print("Saved:", output / "sample.md")


if __name__ == "__main__":
    main()
```

```bash
python convert_document.py
```

预期生成 UTF-8 Markdown。检查正文、表格与章节顺序；文件非空只是第一层验收。

## 4. 为什么还要保留结构化文档

Markdown 适合阅读和模型输入；结构化表示更适合追踪文档元素、页码、表格和来源。需要 JSON 时使用同版本 DoclingDocument 的导出接口，并保存原文件哈希。

不要仅保存最终回答而丢掉源页关联，否则知识库引用难以追溯。

## 5. OCR 与表格处理

先判断 PDF 是否有文字层。扫描件需要 OCR，多栏和复杂表格需要检查布局恢复。默认结果不好时，按官方文档选择 Pipeline / OCR 后端；一次只改变一个配置并保留对照结果。

验收至少包含：中文页面、双栏论文、跨页表格、带公式页面。用人工标注的问题检查检索能否找到正确原页，而不是只比较 Markdown 长度。

## 6. 离线与部署准备

离线部署前应在可联网环境中按官方模型下载流程准备所需资产，再配置离线路径。只缓存 pip wheel 不等于缓存推理模型。

服务化可研究官方 `docling-serve`，MCP 可研究官方 Docling MCP 路径。CLI 安装不代表 API 服务或 MCP 已经启动，两者要独立验证。

## 7. 批处理策略

先单文件成功，再逐批处理。为每份文档记录成功 / 失败、耗时、页数和输出路径；失败只重试该文件。控制并发，避免多个模型实例同时争夺内存。

改模型或解析配置后，把新索引视为新版本，与旧版检索结果做对照再切换。

## 8. 排错表

| 问题 | 检查 |
|---|---|
| 首次转换卡住 | 模型下载、缓存权限和网络 |
| 内存不足 | 大图、页数、并发、所选 Pipeline |
| OCR 结果差 | 旋转、分辨率、语言和文字层 |
| 结果路径找不到 | CLI 输出日志、当前目录与权限 |
| 表格错误 | 回原页核对列、合并单元格和单位 |

## 来源与相关教程

- [Docling 官方项目](https://github.com/docling-project/docling)
- [安装与用法](https://docling-project.github.io/docling/)
- [Docling 2.141.0](https://pypi.org/project/docling/2.141.0/)
- [PDF 解析工具对比方法](pdf-parser-comparison.md)
