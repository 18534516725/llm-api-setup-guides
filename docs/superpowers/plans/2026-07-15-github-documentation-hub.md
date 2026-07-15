# GitHub 中文 AI 教程站建设 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有教程仓库建设成可搜索、可自动部署、可持续校验和维护的 GitHub Pages 中文 AI 教程站。

**Architecture:** 以 `guides/` 为 MkDocs 内容根目录，Material for MkDocs 负责导航、搜索、主题和 SEO；Node.js 标准库校验器负责仓库特有的链接、示例和密钥检查；GitHub Actions 分别负责提交质量检查、Pages 部署和每周外链巡检。仓库设置通过 GitHub REST API 更新并在修改后重新读取验证。

**Tech Stack:** Markdown、MkDocs、Material for MkDocs、Python 3、Node.js 20、GitHub Actions、GitHub Pages、GitHub REST API

---

### Task 1: 文档质量校验器

**Files:**
- Create: `scripts/lib/markdown-validator.mjs`
- Create: `scripts/validate-docs.mjs`
- Create: `tests/markdown-validator.test.mjs`

- [ ] **Step 1: 写入失败测试**

测试覆盖 Markdown 链接目标解析、明显占位密钥放行、疑似真实密钥拦截、JSON 代码块解析和标题检查：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMarkdownLinks,
  findSuspiciousSecrets,
  validateJsonBlocks,
  validateRequiredHeading,
} from '../scripts/lib/markdown-validator.mjs';

test('extractMarkdownLinks ignores web and anchor-only links', () => {
  assert.deepEqual(extractMarkdownLinks('[本地](../../../README.md) [网页](https://example.com) [锚点](#安装)'), ['../../../README.md']);
});

test('placeholder keys are accepted', () => {
  assert.deepEqual(findSuspiciousSecrets('API_KEY=sk-your-key'), []);
});

test('long concrete secret-like values are rejected', () => {
  assert.equal(findSuspiciousSecrets('API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456').length, 1);
});

test('invalid JSON blocks report an error', () => {
  assert.equal(validateJsonBlocks('```json\n{"a":}\n```').length, 1);
});

test('document requires one H1 heading', () => {
  assert.equal(validateRequiredHeading('正文').length, 1);
});
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `node --test tests/markdown-validator.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现纯函数校验模块**

实现并导出测试中的四个函数；链接提取忽略 `http:`、`https:`、`mailto:`、图片和纯锚点；密钥扫描允许 `your-*`、`example`、`placeholder`、环境变量表达式；JSON 错误返回行号和解析消息；标题检查要求恰好存在可识别的一级标题。

- [ ] **Step 4: 运行单元测试并确认通过**

Run: `node --test tests/markdown-validator.test.mjs`

Expected: 所有测试 PASS，失败数为 0。

- [ ] **Step 5: 实现全仓命令行入口**

`scripts/validate-docs.mjs` 递归扫描 Markdown，逐文件执行内部链接、JSON、Python、标题和敏感值检查；错误格式为 `文件:行号 错误说明`，无错误时输出扫描文件数与代码块数并以 0 退出。

- [ ] **Step 6: 运行全仓校验**

Run: `node scripts/validate-docs.mjs`

Expected: exit 0，并输出全部 Markdown 文件已通过。

### Task 2: MkDocs 文档站与 SEO

**Files:**
- Create: `mkdocs.yml`
- Create: `requirements-docs.txt`
- Create: `guides/index.md`
- Create: `guides/assets/stylesheets/extra.css`
- Create: `guides/assets/javascripts/extra.js`
- Create: `guides/robots.txt`
- Create: `guides/404.md`
- Create: `guides/教程模板.md`
- Create: `guides/assets/images/social-preview.png`
- Modify: `guides/README.md`
- Modify: `README.md`

- [ ] **Step 1: 固定当前稳定构建依赖**

从 PyPI 官方元数据读取 `mkdocs` 与 `mkdocs-material` 当前稳定版本并写入：

```text
mkdocs==1.6.1
mkdocs-material==9.7.6
```

- [ ] **Step 2: 配置站点**

`mkdocs.yml` 设置站名、站点描述、Pages URL、仓库链接、编辑链接、中文搜索、Material 主题、深浅色切换、代码复制、导航标签、站点地图、社交元信息和完整中文导航。`docs_dir` 为 `guides`，`site_dir` 为 `site`，严格构建不得引用不存在的页面。

- [ ] **Step 3: 建设文档站首页与样式**

首页首屏包含教程数量、覆盖分类、站内搜索提示、“开始阅读”和“获取 API Key”两个行动入口；下方用分类卡片链接到入门、编程工具、客户端、开发集成、自托管、自动化与 API 测试。CSS 只增强品牌色、卡片布局、行动按钮和移动端间距，并保持 Material 的无障碍与主题能力。

- [ ] **Step 4: 添加 SEO 与辅助页面**

`robots.txt` 允许抓取并指向 Sitemap；404 页面提供首页、教程索引与问题反馈入口；教程模板包含适用对象、准备工作、安装、配置、验证、常见问题、安全和更新时间。

- [ ] **Step 5: 复制并复用社交预览图**

把已生成的 2:1 封面复制到 `guides/assets/images/social-preview.png`，供 Pages 分享元信息与用户上传 GitHub Social preview 使用。

- [ ] **Step 6: 安装依赖并严格构建**

Run: `python3 -m venv .venv-docs && .venv-docs/bin/pip install -r requirements-docs.txt && .venv-docs/bin/mkdocs build --strict`

Expected: exit 0，`site/` 生成且无 warning。

### Task 3: GitHub 自动化与社区健康

**Files:**
- Create: `.github/workflows/docs-quality.yml`
- Create: `.github/workflows/pages.yml`
- Create: `.github/workflows/link-check.yml`
- Create: `.github/dependabot.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `CODE_OF_CONDUCT.md`
- Create: `MAINTENANCE.md`
- Create: `.editorconfig`
- Create: `.gitignore`
- Modify: `CONTRIBUTING.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: 添加提交质量工作流**

对 push 和 pull_request 使用 Node 20 运行测试与校验器，使用 Python 3 安装固定依赖并执行 `mkdocs build --strict`。权限设为 `contents: read`，所有第三方 Action 固定到经过核验的主版本。

- [ ] **Step 2: 添加 Pages 部署工作流**

仅在 `main` 推送和手工触发时执行；构建 job 上传 `site/` Pages Artifact，deploy job 使用 `pages: write` 与 `id-token: write`，environment URL 读取部署输出。

- [ ] **Step 3: 添加每周外链巡检**

使用 GitHub 官方或广泛维护的链接检查 Action，每周运行一次并支持手工触发；只报告外部链接问题，不直接修改内容。

- [ ] **Step 4: 补齐社区文件**

PR 模板要求内容、验证和安全自检；Issue 配置指向现有教程请求和纠错表单；Code of Conduct 使用 Contributor Covenant 2.1 中文版并提供维护者联系入口；维护指南列出周、月、版本发布与季度检查清单。

- [ ] **Step 5: 更新贡献与变更记录**

补充 `api-testing` 分类、教程模板、校验命令、Pages 本地预览方法和本次站点建设记录。

- [ ] **Step 6: 配置 Dependabot 与忽略文件**

Dependabot 每周检查 GitHub Actions；忽略 `.venv-docs/`、`site/`、系统文件和编辑器临时文件。

### Task 4: 全量验证、提交与推送

**Files:**
- Verify: all tracked files

- [ ] **Step 1: 运行单元测试**

Run: `node --test tests/*.test.mjs`

Expected: 0 failures。

- [ ] **Step 2: 运行文档校验**

Run: `node scripts/validate-docs.mjs`

Expected: 0 errors。

- [ ] **Step 3: 严格构建站点**

Run: `.venv-docs/bin/mkdocs build --strict`

Expected: exit 0 and no warnings。

- [ ] **Step 4: 检查差异和敏感内容**

Run: `git diff --check && git status --short && git diff --stat`

Expected: 无空白错误，只包含本计划范围文件。

- [ ] **Step 5: 提交建设变更**

```bash
git add .
git commit -m "feat: build searchable GitHub documentation hub"
```

- [ ] **Step 6: 推送 main**

Run: `git push origin main`

Expected: 远端接受提交，`git rev-parse HEAD` 与 `git rev-parse origin/main` 一致。

### Task 5: GitHub 仓库设置与上线复核

**Files:**
- Remote settings only

- [ ] **Step 1: 更新仓库元数据**

设置 Homepage 为 `https://18534516725.github.io/llm-api-setup-guides/`；Description 保持中文教程定位；Topics 更新为 20 个覆盖核心工具、协议、教程语言和使用场景的词。

- [ ] **Step 2: 精简功能与合并策略**

保持 Issues 开启，关闭未使用的 Wiki 和 Projects；开启 Squash Merge、自动删除已合并分支，并保留维护者直接维护 `main` 的能力。

- [ ] **Step 3: 开启安全功能**

确认 Secret Scanning 与 Push Protection 开启；开启 Dependabot 安全更新和私密漏洞报告；不读取、不输出任何凭据。

- [ ] **Step 4: 启用 Pages**

将 Pages 构建来源设置为 GitHub Actions。等待部署工作流完成并确认首页返回 200、标题正确、静态资源加载成功。

- [ ] **Step 5: 复核远端状态**

重新读取仓库信息、Topics、Pages、Actions、社区健康和安全设置；读取最新工作流运行结果。若 Social preview 无可用 API，则保留仓库内封面文件并明确给出唯一需要用户在网页端完成的上传步骤。
