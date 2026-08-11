from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

EXPECTED = {
    "guides/coding-tools/codex-cli.md": "/official/guides/codex-api-base-url",
    "guides/coding-tools/claude-code.md": "/official/guides/claude-code-custom-api",
    "guides/coding-tools/cursor.md": "/official/guides/cursor-compatible-api",
    "guides/chat-clients/cherry-studio.md": "/official/guides/cherry-studio-compatible-api",
    "guides/basics/token-context-agent-cost.md": "/official/guides/codex-token-cache-cost",
}


def test_contextual_official_links_exist_without_replacing_tutorial_entry():
    for relative, path in EXPECTED.items():
        text = (ROOT / relative).read_text(encoding="utf-8")
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
        assert all(link.endswith("?ref=github-guide") for link in official_links)
