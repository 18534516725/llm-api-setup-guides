const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('guides/assets/javascripts/extra.js', 'utf8');
const key = 'nexotoken:traffic:https://18534516725.github.io/llm-api-setup-guides/';
function setup(fetch, cached, blocked = false) {
  const elements = Object.fromEntries(['busuanzi_site_uv', 'busuanzi_site_pv', 'site-traffic-status'].map(id => [id, { textContent: id === 'site-traffic-status' ? '' : '统计中' }]));
  const storage = new Map(cached ? [[key, JSON.stringify(cached)]] : []);
  const timers = new Map();
  let navigation;
  const context = vm.createContext({ fetch, AbortController, Date, console,
    localStorage: { getItem: k => { if (blocked) throw Error(); return storage.get(k); }, setItem: (k,v) => { if (blocked) throw Error(); storage.set(k,v); } },
    document: { referrer: '', readyState: 'complete', getElementById: id => elements[id], querySelectorAll: () => [], addEventListener: (_, fn) => fn() },
    document$: { subscribe: fn => { navigation = fn; } },
    window: { setTimeout: fn => { timers.set(fn, fn); return fn; }, clearTimeout: id => timers.delete(id) }
  });
  vm.runInContext(source, context);
  return { elements, storage, timers, navigate: () => navigation?.() };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const cached = { uv: 120, pv: 450, savedAt: Date.now() - 60000 };
test('outage preserves explicitly labelled previous totals', async () => {
  const s = setup(async () => { throw Error('502'); }, cached); await settle();
  assert.equal(s.elements.busuanzi_site_uv.textContent, '120');
  assert.match(s.elements['site-traffic-status'].textContent, /上次统计/);
});
test('first visit outage explains unavailable statistics instead of dashes', async () => {
  const s = setup(async () => ({ok: false})); await settle();
  assert.match(s.elements['site-traffic-status'].textContent, /暂不可用/);
  assert.notEqual(s.elements.busuanzi_site_uv.textContent, '--');
});
test('valid response updates both totals and stores a snapshot', async () => {
  let body;
  const s = setup(async (_, options) => { body = JSON.parse(options.body); return {ok: true, json: async () => ({busuanzi_site_uv: 1234, busuanzi_site_pv: 5678})}; }); await settle();
  assert.equal(body.url, 'https://18534516725.github.io/llm-api-setup-guides/');
  assert.equal(s.elements.busuanzi_site_uv.textContent, '1,234');
  assert.equal(JSON.parse(s.storage.get(key)).pv, 5678);
  assert.equal(s.timers.size, 0);
});
test('invalid or partial totals never overwrite the snapshot', async () => {
  for (const value of [null, '', -1, 1.5, 'bad', undefined]) {
    const s = setup(async () => ({ok: true, json: async () => ({busuanzi_site_uv: value, busuanzi_site_pv: 20})}), cached); await settle();
    assert.equal(s.elements.busuanzi_site_uv.textContent, '120');
    assert.equal(JSON.parse(s.storage.get(key)).pv, 450);
  }
});
test('storage being blocked does not prevent live statistics', async () => {
  const s = setup(async () => ({ok: true, json: async () => ({busuanzi_site_uv: 10, busuanzi_site_pv: 20})}), null, true); await settle();
  assert.equal(s.elements.busuanzi_site_uv.textContent, '10');
});
test('hung request is aborted and leaves an understandable status', async () => {
  let signal;
  const s = setup((_, options) => new Promise((resolve, reject) => { signal = options.signal; signal?.addEventListener('abort', () => reject(Error('timeout'))); }));
  for (const fn of [...s.timers.values()]) fn(); await settle();
  assert.equal(signal?.aborted, true);
  assert.match(s.elements['site-traffic-status'].textContent, /暂不可用/);
});
test('instant navigation restores totals without counting a second visit', async () => {
  let calls = 0;
  const s = setup(async () => { calls++; return {ok: true, json: async () => ({busuanzi_site_uv: 10, busuanzi_site_pv: 20})}; }); await settle();
  s.elements.busuanzi_site_uv.textContent = '统计中'; s.navigate();
  assert.equal(s.elements.busuanzi_site_uv.textContent, '10'); assert.equal(calls, 1);
});
