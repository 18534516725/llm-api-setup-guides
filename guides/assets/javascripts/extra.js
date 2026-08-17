const BUSUANZI_API_URL = 'https://cdn.busuanzi.cc/api.php';

// 自定义域上线前，全部累计数据都归属于这个地址。继续使用同一统计身份，
// 可避免 docs.nexotoken.net 被当成新站点而从零计数。
const BUSUANZI_MIGRATED_SITE_IDENTITY =
  'https://18534516725.github.io/llm-api-setup-guides/';

const trafficCounterIds = ['busuanzi_site_uv', 'busuanzi_site_pv'];

function showTrafficFallback() {
  for (const id of trafficCounterIds) {
    const value = document.getElementById(id);
    if (value?.textContent?.trim() === '统计中') {
      value.textContent = '--';
    }
  }
}

async function loadMigratedSiteTraffic() {
  try {
    const response = await fetch(BUSUANZI_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        url: BUSUANZI_MIGRATED_SITE_IDENTITY,
        referrer: document.referrer,
      }),
    });

    if (!response.ok) {
      throw new Error(`traffic counter responded with ${response.status}`);
    }

    const counters = await response.json();
    for (const id of trafficCounterIds) {
      const value = document.getElementById(id);
      const count = Number(counters[id]);
      if (value && Number.isFinite(count) && count >= 0) {
        value.textContent = count.toLocaleString('zh-CN');
      }
    }
  } catch {
    showTrafficFallback();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  for (const link of document.querySelectorAll('a[href^="https://www.nexotoken.net"]')) {
    link.setAttribute('rel', 'noopener noreferrer');
  }

  void loadMigratedSiteTraffic();
  window.setTimeout(showTrafficFallback, 6000);
});
