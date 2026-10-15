const BUSUANZI_API_URL = 'https://cdn.busuanzi.cc/api.php';

// 自定义域上线前，全部累计数据都归属于这个地址。继续使用同一统计身份，
// 可避免 docs.nexotoken.net 被当成新站点而从零计数。
const BUSUANZI_MIGRATED_SITE_IDENTITY =
  'https://18534516725.github.io/llm-api-setup-guides/';

// Keep the original identity: changing providers/domains would start new totals.
const trafficCacheKey = `nexotoken:traffic:${BUSUANZI_MIGRATED_SITE_IDENTITY}`;
let trafficSnapshot = null;
let trafficState = 'loading';

function validCount(value) {
  return (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value)))
    && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
}

function renderTraffic() {
  for (const [id, field] of [['busuanzi_site_uv', 'uv'], ['busuanzi_site_pv', 'pv']]) {
    const element = document.getElementById(id);
    if (element) element.textContent = trafficSnapshot
      ? Number(trafficSnapshot[field]).toLocaleString('zh-CN')
      : trafficState === 'loading' ? '统计中' : '暂不可用';
  }
  const status = document.getElementById('site-traffic-status');
  if (status) {
    status.textContent = trafficState === 'live' ? '' : trafficSnapshot
      ? '上次统计 · 正在更新' : '正在加载统计';
    if (trafficState === 'unavailable') status.textContent = trafficSnapshot
      ? '上次统计 · 统计服务暂不可用' : '统计服务暂不可用，请稍后刷新';
    status.title = trafficSnapshot
      ? `最近成功获取：${new Date(trafficSnapshot.savedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}（北京时间）` : '';
  }
}

async function loadMigratedSiteTraffic() {
  try {
    const cached = JSON.parse(localStorage.getItem(trafficCacheKey));
    if (cached && validCount(cached.uv) && validCount(cached.pv)
      && Number.isFinite(cached.savedAt) && cached.savedAt > 0 && cached.savedAt <= Date.now()) {
      trafficSnapshot = cached;
    }
  } catch { /* Storage may be disabled or contain an invalid snapshot. */ }
  renderTraffic();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    // Do not retry POST automatically: a lost response may already have counted a visit.
    const response = await fetch(BUSUANZI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({ url: BUSUANZI_MIGRATED_SITE_IDENTITY, referrer: document.referrer }),
    });
    if (!response.ok) throw new Error('Traffic service unavailable');
    const counters = await response.json();
    if (!counters || !validCount(counters.busuanzi_site_uv) || !validCount(counters.busuanzi_site_pv)) {
      throw new Error('Invalid traffic counters');
    }
    trafficSnapshot = { uv: Number(counters.busuanzi_site_uv), pv: Number(counters.busuanzi_site_pv), savedAt: Date.now() };
    trafficState = 'live';
    try { localStorage.setItem(trafficCacheKey, JSON.stringify(trafficSnapshot)); }
    catch { /* Live counters remain available when storage is blocked. */ }
  } catch {
    trafficState = 'unavailable';
  } finally {
    window.clearTimeout(timeout);
    renderTraffic();
  }
}

function initializeTraffic() {
  for (const link of document.querySelectorAll('a[href^="https://www.nexotoken.net"]')) {
    link.setAttribute('rel', 'noopener noreferrer');
  }
  void loadMigratedSiteTraffic();
  // Material replaces the announcement during instant navigation.
  if (typeof document$ !== 'undefined') document$.subscribe(renderTraffic);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeTraffic, { once: true });
else initializeTraffic();
