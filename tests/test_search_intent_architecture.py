from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PILLAR = ROOT / "guides/basics/api-relay-guide.md"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def test_api_relay_pillar_answers_the_complete_decision_journey():
    text = PILLAR.read_text(encoding="utf-8")
    assert text.startswith("---\n")
    for heading in [
        "# API 中转站是什么",
        "## API 中转站怎么用",
        "## API 中转站怎么选",
        "## 最小请求验证",
        "## 常见错误排查",
        "## 常见问题 FAQ",
        "## 使用限制",
    ]:
        assert heading in text
    for link in [
        "api-basics.md",
        "compatible-api-evaluation.md",
        "token-context-agent-cost.md",
        "troubleshooting.md",
        "../coding-tools/codex-cli.md",
        "../coding-tools/claude-code.md",
    ]:
        assert link in text
    assert 'export AI_API_KEY=' not in text
    assert 'read -rsp "API Key: " AI_API_KEY' in text


def test_pillar_is_registered_in_every_public_entry_point():
    expected = {
        "README.md": "./guides/basics/api-relay-guide.md",
        "guides/index.md": "basics/api-relay-guide.md",
        "guides/教程总目录.md": "basics/api-relay-guide.md",
        "mkdocs.yml": "basics/api-relay-guide.md",
    }
    for relative, link in expected.items():
        assert link in read(relative), f"{relative} 缺少 API 中转站支柱页入口"


def test_public_document_count_is_synchronized():
    public_guides = list((ROOT / "guides").glob("*/*.md"))
    assert len(public_guides) == 121
    for relative in [
        "README.md",
        "guides/index.md",
        "guides/教程总目录.md",
        "CHANGELOG.md",
        "mkdocs.yml",
    ]:
        assert "121 篇中文" in read(relative), f"{relative} 文档数量未同步"
    assert "83 款工具" in read("README.md")
    assert "83 款工具" in read("guides/index.md")


def test_each_high_intent_query_has_one_metadata_rich_owner_page():
    owners = {
        "guides/basics/api-basics.md": ["API Base URL 是什么", "OpenAI-compatible API"],
        "guides/coding-tools/codex-cli.md": ["Codex API Key 配置", "config.toml"],
        "guides/coding-tools/claude-code.md": ["Claude Code API Key 配置", "连接失败"],
        "guides/coding-tools/cursor.md": ["Cursor API Key 配置", "Override Base URL"],
        "guides/chat-clients/cherry-studio.md": ["Cherry Studio API 地址", "连接失败"],
        "guides/basics/troubleshooting.md": ["401", "404", "429"],
    }
    for relative, phrases in owners.items():
        text = read(relative)
        assert text.startswith("---\n"), f"{relative} 缺少 YAML 元数据"
        assert "title:" in text.split("---", 2)[1]
        assert "description:" in text.split("---", 2)[1]
        assert "last_verified: 2026-09-21" in text.split("---", 2)[1]
        if "最后核验：" in text:
            assert "最后核验：2026-09-21" in text, f"{relative} 可见核验日期与元数据冲突"
        assert text.count("\n# ") == 1, f"{relative} 必须只有一个 H1"
        assert "## 常见问题 FAQ" in text, f"{relative} 缺少搜索问题 FAQ"
        assert "api-relay-guide.md" in text, f"{relative} 缺少支柱页上下文链接"
        for phrase in phrases:
            assert phrase in text, f"{relative} 缺少搜索意图：{phrase}"


def test_readme_routes_queries_without_keyword_stuffing():
    text = read("README.md")
    assert "# AI API 中转站与自定义 API 接入教程" in text
    assert "## 🔎 按问题直达" in text
    assert "## 常见搜索问题 FAQ" in text
    assert text.count("API 中转站") <= 16
    for phrase in ["Codex API Key 配置", "Claude Code API Key 配置", "API Base URL 是什么"]:
        assert phrase in text
