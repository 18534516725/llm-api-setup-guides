from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEGACY_SITE_IDENTITY = "https://18534516725.github.io/llm-api-setup-guides/"
BUSUANZI_API = "https://cdn.busuanzi.cc/api.php"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def test_custom_domain_reuses_the_pre_migration_site_counter_identity():
    config = read("mkdocs.yml")
    script = read("guides/assets/javascripts/extra.js")

    # 不再让第三方脚本用当前 hostname 自动创建一套从零开始的统计。
    assert "busuanzi.min.js" not in config

    # 自定义域继续写入迁移前的同一统计身份，累计值不会因换域名清零。
    assert LEGACY_SITE_IDENTITY in script
    assert BUSUANZI_API in script
    assert "location.href" not in script
    assert "busuanzi_site_uv" in script
    assert "busuanzi_site_pv" in script

