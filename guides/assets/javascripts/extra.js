(() => {
  // Material can execute extra scripts again during instant navigation.
  if (window.nexoDocsTrafficInitialized) return;
  window.nexoDocsTrafficInitialized = true;

  const API_URL = 'https://www.nexotoken.net/api/public/docs-traffic';
  // Never reuse third-party snapshots: these totals have a new, explicit start date.
  const CACHE_KEY = 'nexotoken:docs-traffic:v1:snapshot';
  const VISITOR_KEY = 'nexotoken:docs-traffic:v1:visitor';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let snapshot = null;
  let state = 'loading';
  let lastPath = null;
  let requestSequence = 0;
  let latestSuccess = 0;

  function validTotals(value) {
    return value && value.source === 'self-hosted' && value.historicalIncluded === false
      && Number.isSafeInteger(value.siteUv) && value.siteUv >= 0
      && Number.isSafeInteger(value.sitePv) && value.sitePv >= value.siteUv
      && ((value.startedAt === null && value.sitePv === 0 && value.siteUv === 0)
        || (typeof value.startedAt === 'string' && Number.isFinite(Date.parse(value.startedAt))));
  }

  function render() {
    for (const [id, field] of [['docs-site-uv', 'siteUv'], ['docs-site-pv', 'sitePv']]) {
      const element = document.getElementById(id);
      if (element) element.textContent = snapshot ? snapshot[field].toLocaleString('zh-CN')
        : state === 'loading' ? '统计中' : '暂不可用';
    }
    const status = document.getElementById('site-traffic-status');
    if (status) {
      status.textContent = state === 'live' ? '' : snapshot ? '上次统计 · 正在更新' : '正在加载统计';
      if (state === 'unavailable') status.textContent = snapshot
        ? '上次统计 · 暂时无法更新' : '统计暂不可用，请稍后刷新';
      status.title = snapshot
        ? `最近成功获取：${new Date(snapshot.savedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}（北京时间）` : '';
    }
    const since = document.getElementById('docs-traffic-since');
    if (since) {
      const date = snapshot?.startedAt
        ? new Date(snapshot.startedAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }) : null;
      since.textContent = date ? `自建统计始于 ${date} · 不含旧统计` : '自建统计 · 不含旧统计';
    }
  }

  function visitBody() {
    // With storage blocked, read totals instead of inventing a visitor each page load.
    try {
      let visitorId = localStorage.getItem(VISITOR_KEY);
      if (!UUID.test(visitorId || '')) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, visitorId);
      }
      return JSON.stringify({ visitorId, eventId: crypto.randomUUID() });
    } catch { return null; }
  }

  async function loadTraffic() {
    const sequence = ++requestSequence;
    state = 'loading';
    render();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const body = visitBody();
      const response = await fetch(API_URL, {
        method: body ? 'POST' : 'GET',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body } : {}),
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw new Error('Traffic unavailable');
      const totals = await response.json();
      if (!validTotals(totals)) throw new Error('Invalid totals');
      if (sequence < latestSuccess) return;
      latestSuccess = sequence;
      // Concurrent navigation responses in the same series must not lower totals.
      if (!snapshot || snapshot.startedAt !== totals.startedAt || totals.sitePv >= snapshot.sitePv) {
        snapshot = { sitePv: totals.sitePv, siteUv: totals.siteUv, startedAt: totals.startedAt,
          source: 'self-hosted', historicalIncluded: false, savedAt: Date.now() };
      }
      state = 'live';
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot)); }
      catch { /* Live display remains available without local storage. */ }
    } catch {
      if (sequence >= latestSuccess) state = 'unavailable';
    } finally {
      window.clearTimeout(timeout);
      render();
    }
  }

  function onPage() {
    for (const link of document.querySelectorAll('a[href^="https://www.nexotoken.net"]')) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
    render();
    if (lastPath === location.pathname) return;
    lastPath = location.pathname;
    void loadTraffic();
  }

  function initialize() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (validTotals(cached) && Number.isFinite(cached.savedAt)
        && cached.savedAt > 0 && cached.savedAt <= Date.now()) snapshot = cached;
    } catch { /* Corrupt, blocked or absent cache does not prevent a live request. */ }
    onPage();
    if (typeof document$ !== 'undefined') document$.subscribe(onPage);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
