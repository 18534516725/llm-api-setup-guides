const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('guides/assets/javascripts/extra.js', 'utf8');
const key = 'nexotoken:docs-traffic:v1:snapshot';
const visitorKey = 'nexotoken:docs-traffic:v1:visitor';
const startedAt = '2026-10-15T00:00:00.000Z';
const totals = (pv = 450, uv = 120) => ({ sitePv: pv, siteUv: uv, startedAt, source: 'self-hosted', historicalIncluded: false });
function setup(fetch, cached, blocked = false, noCrypto = false) {
  const elements = Object.fromEntries(['docs-site-uv', 'docs-site-pv', 'site-traffic-status', 'docs-traffic-since'].map(id => [id, {textContent: '统计中'}]));
  const storage = new Map(cached ? [[key, JSON.stringify(cached)]] : []);
  const timers = new Map();
  let navigation;
  const location = {pathname: '/', search: '', hash: ''};
  const context = vm.createContext({ fetch, AbortController, Date, console, crypto: noCrypto ? {} : webcrypto, location,
    localStorage: { getItem: k => { if (blocked) throw Error(); return storage.get(k) || null; }, setItem: (k,v) => { if (blocked) throw Error(); storage.set(k,v); } },
    document: { readyState: 'complete', getElementById: id => elements[id], querySelectorAll: () => [], addEventListener: (_, fn) => fn() },
    document$: { subscribe: fn => { navigation = fn; fn(); } },
    window: { setTimeout: fn => { timers.set(fn, fn); return fn; }, clearTimeout: id => timers.delete(id) }
  });
  vm.runInContext(source, context);
  return { elements, storage, timers, context, location, navigate: path => { if (path) location.pathname = path; navigation?.(); } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const cached = { ...totals(), savedAt: Date.now() - 60000 };
test('outage preserves explicitly labelled first-party snapshot', async () => {
  const s = setup(async () => { throw Error('502'); }, cached); await settle();
  assert.equal(s.elements['docs-site-uv'].textContent, '120');
  assert.match(s.elements['site-traffic-status'].textContent, /上次统计/);
});
test('first visit outage explains unavailable statistics', async () => {
  const s = setup(async () => ({ok: false})); await settle();
  assert.match(s.elements['site-traffic-status'].textContent, /暂不可用/);
});
test('POST uses only first-party API, random visitor and event IDs; caches valid totals', async () => {
  const calls = [];
  const s = setup(async (url, options) => { calls.push([url, options]); return {ok: true, json: async () => totals(5678, 1234)}; }); await settle();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://www.nexotoken.net/api/public/docs-traffic');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].cache, 'no-store');
  const body = JSON.parse(calls[0][1].body);
  assert.deepEqual(Object.keys(body).sort(), ['eventId', 'visitorId']);
  assert.match(body.visitorId, /^[0-9a-f-]{36}$/);
  assert.equal(s.storage.get(visitorKey), body.visitorId);
  assert.equal(s.elements['docs-site-uv'].textContent, '1,234');
  assert.equal(JSON.parse(s.storage.get(key)).sitePv, 5678);
  assert.match(s.elements['docs-traffic-since'].textContent, /2026-10-15/);
  assert.match(s.elements['docs-traffic-since'].textContent, /不含旧统计/);
  assert.equal(s.timers.size, 0);
});
test('invalid or partial totals never overwrite a valid snapshot', async () => {
  for (const value of [null, '', -1, 1.5, 'bad', undefined]) {
    const s = setup(async () => ({ok: true, json: async () => ({...totals(), siteUv: value})}), cached); await settle();
    assert.equal(s.elements['docs-site-uv'].textContent, '120');
    assert.equal(JSON.parse(s.storage.get(key)).sitePv, 450);
  }
});
test('blocked storage uses GET without counting a fresh visitor', async () => {
  let options;
  const s = setup(async (_, o) => { options = o; return {ok: true, json: async () => totals(20, 10)}; }, null, true); await settle();
  assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
  assert.equal(s.elements['docs-site-uv'].textContent, '10');
});
test('hung request is aborted and status becomes unavailable', async () => {
  let signal;
  const s = setup((_, options) => new Promise((resolve, reject) => { signal = options.signal; signal.addEventListener('abort', () => reject(Error('timeout'))); }));
  for (const fn of [...s.timers.values()]) fn(); await settle();
  assert.equal(signal.aborted, true);
  assert.match(s.elements['site-traffic-status'].textContent, /暂不可用/);
});
test('instant navigation counts new path once, retaining browser identity', async () => {
  const bodies = [];
  const s = setup(async (_, options) => { bodies.push(JSON.parse(options.body)); return {ok: true, json: async () => totals(20 + bodies.length, 10)}; }); await settle();
  s.elements['docs-site-uv'].textContent = '统计中'; s.navigate(); await settle();
  assert.equal(s.elements['docs-site-uv'].textContent, '10'); assert.equal(bodies.length, 1);
  s.navigate('/new/'); s.navigate('/new/'); await settle();
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].visitorId, bodies[1].visitorId);
  assert.notEqual(bodies[0].eventId, bodies[1].eventId);
});
test('duplicate script execution does not subscribe or count again', async () => {
  let calls = 0;
  const s = setup(async () => { calls++; return {ok: true, json: async () => totals()}; }); await settle();
  vm.runInContext(source, s.context); await settle(); assert.equal(calls, 1);
});
test('legacy or malformed cache cannot masquerade as new totals', async () => {
  for (const value of [{uv: 9999, pv: 99999, savedAt: Date.now()}, {...cached, source: 'legacy'}, {...cached, startedAt: 'bad'}, {...cached, savedAt: Date.now() + 60000}]) {
    const s = setup(async () => { throw Error(); }, value); await settle();
    assert.equal(s.elements['docs-site-uv'].textContent, '暂不可用');
  }
});
test('out-of-order navigation responses cannot reduce current totals', async () => {
  const pending = [];
  const s = setup(() => new Promise(resolve => pending.push(resolve)));
  s.navigate('/second/');
  pending[1]({ok:true,json:async()=>totals(22, 11)}); await settle();
  pending[0]({ok:true,json:async()=>totals(21, 10)}); await settle();
  assert.equal(s.elements['docs-site-pv'].textContent, '22');
  assert.equal(s.elements['docs-site-uv'].textContent, '11');
});
test('empty self-hosted store is distinct from unavailable historical totals', async () => {
  const s = setup(async () => ({ok:true, json:async()=>({...totals(0,0), startedAt:null})}), null, true); await settle();
  assert.equal(s.elements['docs-site-pv'].textContent, '0');
  assert.match(s.elements['docs-traffic-since'].textContent, /不含旧统计/);
});

test('unavailable crypto reads totals without generating visitor IDs', async () => {
  let options;
  const s = setup(async (_, o) => { options = o; return {ok: true, json: async () => totals()}; }, null, false, true);
  await settle(); assert.equal(options.method, 'GET'); assert.equal(s.storage.has(visitorKey), false);
});
test('hash and search changes do not count extra page views', async () => {
  let calls = 0;
  const s = setup(async () => { calls++; return {ok: true, json: async () => totals()}; }); await settle();
  s.location.hash = '#heading'; s.navigate();
  s.location.search = '?q=api'; s.navigate(); await settle();
  assert.equal(calls, 1);
});
