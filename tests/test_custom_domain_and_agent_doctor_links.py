from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OLD_ORIGIN = "https://18534516725.github.io/llm-api-setup-guides/"
DOCS_ORIGIN = "https://docs.nexotoken.net/"
AGENT_PRODUCT = "https://www.nexotoken.net/official/tools/agent-doctor?ref=docs-guide"
AGENT_REPOSITORY = "https://github.com/18534516725/Agent-Doctor"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def test_custom_domain_is_the_single_public_docs_origin():
    assert read("guides/CNAME").strip() == "docs.nexotoken.net"
    assert f"site_url: {DOCS_ORIGIN}" in read("mkdocs.yml")
    assert f"Sitemap: {DOCS_ORIGIN}sitemap.xml" in read("guides/robots.txt")

    for relative in [
        "README.md",
        "mkdocs.yml",
        "guides/robots.txt",
        ".github/ISSUE_TEMPLATE/config.yml",
    ]:
        assert OLD_ORIGIN not in read(relative), f"{relative} 仍指向旧 GitHub Pages 域名"


def test_docs_home_and_relevant_guides_link_agent_doctor_with_context():
    home = read("guides/index.md")
    assert AGENT_PRODUCT in home
    assert AGENT_REPOSITORY in home

    for relative in [
        "guides/coding-tools/codex-cli.md",
        "guides/coding-tools/claude-code.md",
        "guides/basics/troubleshooting.md",
    ]:
        assert AGENT_PRODUCT in read(relative), f"{relative} 缺少 Agent Doctor 场景入口"
