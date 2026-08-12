# Search Intent Keyword Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve discovery for current Chinese AI API search intents without duplicating existing tutorials or keyword stuffing.

**Architecture:** Add one missing pillar guide for API relay selection and usage, then route each high-intent keyword cluster to an existing authoritative tutorial. Keep README, MkDocs metadata, navigation, GitHub repository metadata, and published document counts synchronized through automated tests.

**Tech Stack:** Markdown, MkDocs Material, Python pytest, GitHub repository metadata.

---

### Task 1: Add keyword architecture contract tests

**Files:**
- Create: `tests/test_search_intent_architecture.py`

- [ ] **Step 1: Write failing tests**

Create tests that assert the new pillar file exists; README, `guides/index.md`, `guides/教程总目录.md`, and `mkdocs.yml` link to it; public count is `88`; six intent pages expose descriptive H1/FAQ/context links; and README avoids excessive exact-keyword repetition.

- [ ] **Step 2: Run tests to verify RED**

Run: `.venv-docs/bin/python -m pytest tests/test_search_intent_architecture.py -q`

Expected: failures for missing `api-relay-guide.md`, missing navigation, stale count, and missing FAQ markers.

- [ ] **Step 3: Commit the RED tests**

```bash
git add tests/test_search_intent_architecture.py
git commit -m "test: define search-intent content contracts"
```

### Task 2: Publish the API relay pillar guide

**Files:**
- Create: `guides/basics/api-relay-guide.md`
- Modify: `mkdocs.yml`
- Modify: `guides/教程总目录.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write the complete pillar guide**

Include a direct answer, terminology table, official API/subscription/compatible API comparison, six-part selection framework, minimum curl verification, 401/404/429/5xx troubleshooting table, security checklist, FAQ, limitations, and contextual links to the existing API basics, compatibility evaluation, cost, troubleshooting, Codex, and Claude Code pages.

- [ ] **Step 2: Register it in navigation and indexes**

Add `API 中转站选择与使用` under `新手入门`, add it as the first decision guide in `教程总目录.md`, record the 2026-08-12 publication in `CHANGELOG.md`, and update the published count to 88 while retaining 74 tools/frameworks.

- [ ] **Step 3: Run the focused tests**

Run: `.venv-docs/bin/python -m pytest tests/test_search_intent_architecture.py -q`

Expected: pillar/navigation/count assertions pass; existing-page FAQ assertions may remain RED.

- [ ] **Step 4: Commit**

```bash
git add guides/basics/api-relay-guide.md mkdocs.yml guides/教程总目录.md CHANGELOG.md
git commit -m "docs: add AI API relay selection pillar guide"
```

### Task 3: Rebuild README and documentation homepage intent routing

**Files:**
- Modify: `README.md`
- Modify: `guides/index.md`

- [ ] **Step 1: Replace stale and diffuse entry copy**

Use one natural H1 covering AI API relay, Codex, Claude Code, and compatible API configuration; update the visual count from 87 to 88; add a compact “按问题直达” table that sends each query to its unique owner page; keep GitHub Pages and NexoToken calls to action distinct.

- [ ] **Step 2: Add search-intent FAQ without keyword stuffing**

Answer “API 中转站是什么/怎么用”, “Base URL 是什么”, “Codex and Claude Code protocols”, and “401/404/429” once each, linking to detailed pages.

- [ ] **Step 3: Run focused tests and commit**

Run: `.venv-docs/bin/python -m pytest tests/test_search_intent_architecture.py -q`

```bash
git add README.md guides/index.md
git commit -m "docs: align repository entry points with search intent"
```

### Task 4: Strengthen existing intent-owner tutorials

**Files:**
- Modify: `guides/basics/api-basics.md`
- Modify: `guides/coding-tools/codex-cli.md`
- Modify: `guides/coding-tools/claude-code.md`
- Modify: `guides/coding-tools/cursor.md`
- Modify: `guides/chat-clients/cherry-studio.md`
- Modify: `guides/basics/troubleshooting.md`

- [ ] **Step 1: Add concise metadata and direct answers**

Add YAML title/description/updated metadata where absent and a first-screen answer that naturally states the page’s owned query and compatibility boundary.

- [ ] **Step 2: Add query-derived FAQ sections**

Add non-duplicative answers for Codex Key/config/price boundaries, Claude Code Key/400/connection errors, Cursor API compatibility, Cherry Studio endpoint/connectivity, Base URL URL/endpoints/curl, and generic 401/404/429 errors.

- [ ] **Step 3: Add contextual cluster links**

Each page links to the pillar guide and only the most relevant sibling guides. No page repeats provider rankings or unsupported claims.

- [ ] **Step 4: Run focused tests and commit**

Run: `.venv-docs/bin/python -m pytest tests/test_search_intent_architecture.py tests/test_nexotoken_official_links.py -q`

```bash
git add guides/basics/api-basics.md guides/coding-tools/codex-cli.md guides/coding-tools/claude-code.md guides/coding-tools/cursor.md guides/chat-clients/cherry-studio.md guides/basics/troubleshooting.md
git commit -m "docs: answer high-intent API configuration queries"
```

### Task 5: Synchronize repository metadata and verify the full site

**Files:**
- Modify: `mkdocs.yml`
- Modify externally: GitHub repository description, homepage, and topics

- [ ] **Step 1: Update MkDocs metadata**

Set the site name/description to accurately describe 88 Chinese AI API relay and setup documents without unsupported superlatives.

- [ ] **Step 2: Run complete verification**

Run:

```bash
.venv-docs/bin/python -m pytest -q
.venv-docs/bin/mkdocs build --strict
git diff --check
```

Expected: all tests pass, strict site build succeeds, and diff check is clean.

- [ ] **Step 3: Update GitHub metadata**

After pushing content commits, set the repository description to the synchronized 88-document wording, retain the GitHub Pages homepage, and replace low-priority topics with `api-relay`, `codex-api`, and `claude-api` while staying within GitHub’s topic limit.

- [ ] **Step 4: Verify public metadata**

Query the GitHub REST API and confirm description, homepage, topics, default branch, and latest commit match the intended release.

- [ ] **Step 5: Final commit and push**

```bash
git add mkdocs.yml
git commit -m "chore: synchronize public search metadata"
git fetch origin --prune
git merge --ff-only origin/main
git push origin main
```
