from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_first_party_counter_has_no_legacy_requests_or_misleading_start_date():
    script = (ROOT / "guides/assets/javascripts/extra.js").read_text(encoding="utf-8")
    template = (ROOT / "guides/overrides/main.html").read_text(encoding="utf-8")
    config = (ROOT / "mkdocs.yml").read_text(encoding="utf-8")
    assert "https://www.nexotoken.net/api/public/docs-traffic" in script
    assert "busuanzi" not in script + config + template
    assert "统计始于 2026-07-15" in template
    assert "不含旧统计" not in template
    assert "docs-site-uv" in script and "docs-site-pv" in script
    assert "nexotoken:docs-traffic:v2:snapshot" in script
