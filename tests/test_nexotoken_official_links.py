from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

EXPECTED = {
    "guides/coding-tools/codex-cli.md": [
        "/official/guides/codex-api-base-url",
        "/official/guides/codex-config-toml",
    ],
    "guides/coding-tools/claude-code.md": ["/official/guides/claude-code-custom-api"],
    "guides/coding-tools/cursor.md": ["/official/guides/cursor-compatible-api"],
    "guides/chat-clients/cherry-studio.md": ["/official/guides/cherry-studio-compatible-api"],
    "guides/basics/token-context-agent-cost.md": ["/official/guides/codex-token-cache-cost"],
    "guides/basics/troubleshooting.md": [
        "/official/guides/codex-error-troubleshooting",
        "/official/guides/claude-code-error-troubleshooting",
    ],
    "guides/basics/subscription-api-selection.md": ["/official/guides/codex-vs-claude-code"],
    "guides/basics/compatible-api-evaluation.md": ["/official/guides/ai-api-billing-model-selection"],
}


def test_contextual_official_links_exist_without_replacing_tutorial_entry():
    for relative, paths in EXPECTED.items():
        text = (ROOT / relative).read_text(encoding="utf-8")
        for path in paths:
            assert f"https://www.nexotoken.net{path}?ref=github-guide" in text
        assert "教程配套 API" in text


def test_contextual_official_links_use_only_approved_origin_and_campaign():
    for relative in EXPECTED:
        text = (ROOT / relative).read_text(encoding="utf-8")
        official_links = [
            token.split(")", 1)[0]
            for token in text.split("(")[1:]
            if token.startswith("https://www.nexotoken.net/official/")
        ]
        assert official_links
        for link in official_links:
            if "/official/tools/agent-doctor" in link:
                assert link.endswith("?ref=docs-guide")
            else:
                assert link.endswith("?ref=github-guide")
