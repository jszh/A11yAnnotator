const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let puppeteer = null;
try { puppeteer = require('puppeteer'); } catch(e) { console.warn('puppeteer not found — AX tree features disabled'); }

const PORT = 3001;
const APP_ROOT = __dirname;
const ASSETS_DIR = path.join(APP_ROOT, 'assets');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.ico':  'image/x-icon',
};

// ─── Mock Yahoo Finance chart data (for /yapi) ──────────────────────────────
// Deterministic OHLCV series aligned with the saved snapshots' visible values
// (SHOP legend bar O121.19 H121.22 L121.10 C121.12, prior close 121.70;
// AAPL 252.13 / META 607.26 from the saved comparison legend).

const MOCK_QUOTES = {
  SHOP: { open: 120.90, low: 120.45, high: 122.05, close: 121.70, nextOpen: 121.12 },
  AAPL: { open: 248.20, low: 247.65, high: 251.80, close: 251.49, nextOpen: 252.13 },
  META: { open: 601.10, low: 598.40, high: 609.80, close: 606.20, nextOpen: 607.26 },
};

function mockSeriesShape(t) { // t in [0,1] → price position in [0,1], deterministic
  const anchors = [[0,.23],[.06,.13],[.13,0],[.22,.33],[.32,.55],[.40,.43],[.50,.70],[.60,.80],[.70,.66],[.80,.76],[.90,.59],[1,.63]];
  let i = 0;
  while (i < anchors.length - 2 && anchors[i + 1][0] < t) i++;
  const [x0, y0] = anchors[i], [x1, y1] = anchors[i + 1];
  const u = Math.max(0, Math.min(1, (t - x0) / (x1 - x0 || 1)));
  const s = u * u * (3 - 2 * u); // smoothstep
  return y0 + (y1 - y0) * s + 0.02 * Math.sin(63 * t + 2) * Math.sin(17.3 * t);
}

function mockYahooChart(symbol, params) {
  const q = MOCK_QUOTES[symbol.toUpperCase()] || { open: 99.2, low: 98.1, high: 101.6, close: 100.8, nextOpen: 100.4 };
  const interval = params.get('interval') || '1m';
  const stepMin = { '1m':1,'2m':2,'5m':5,'15m':15,'30m':30,'60m':60,'90m':90,'1h':60 }[interval];
  const day1Open = Date.UTC(2026, 2, 23, 13, 30, 0) / 1000;  // 2026-03-23 09:30 EDT
  const day1Close = day1Open + 390 * 60;
  const day2Open = Date.UTC(2026, 2, 24, 13, 30, 0) / 1000;
  const ts = [], open = [], high = [], low = [], close = [], volume = [];
  const span = v => q.low + (q.high - q.low) * v;
  if (stepMin) {
    const n = Math.floor(390 / stepMin);
    for (let i = 0; i <= n; i++) {
      const t0 = i / n, t1 = Math.min(1, (i + 0.9) / n);
      const o = span(mockSeriesShape(t0)), c = i === n ? q.close : span(mockSeriesShape(t1));
      ts.push(day1Open + i * stepMin * 60);
      open.push(+o.toFixed(2)); close.push(+c.toFixed(2));
      high.push(+Math.max(o, c, span(mockSeriesShape((t0 + t1) / 2)) + 0.04).toFixed(2));
      low.push(+Math.min(o, c, span(mockSeriesShape((t0 + t1) / 2)) - 0.04).toFixed(2));
      volume.push(Math.round(40000 + 140000 * Math.abs(Math.sin(7.1 * i + 0.4) * Math.sin(2.3 * i))));
    }
    // next-session opening bar — matches the saved legend OHLC for SHOP
    ts.push(day2Open);
    const no = q.nextOpen;
    open.push(+(no + 0.07).toFixed(2)); high.push(+(no + 0.10).toFixed(2));
    low.push(+(no - 0.02).toFixed(2)); close.push(+no.toFixed(2));
    volume.push(154000);
  } else { // daily/weekly/monthly granularity
    const stepDays = interval === '1wk' ? 7 : interval === '1mo' ? 30 : 1;
    const n = 120;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const c = i === n - 1 ? q.close : span(mockSeriesShape(t));
      const o = i === 0 ? q.open : close[i - 1];
      ts.push(day1Close - (n - 1 - i) * stepDays * 86400);
      open.push(+o.toFixed(2)); close.push(+c.toFixed(2));
      high.push(+(Math.max(o, c) + 0.6).toFixed(2)); low.push(+(Math.min(o, c) - 0.6).toFixed(2));
      volume.push(Math.round(2e6 + 6e6 * Math.abs(Math.sin(3.7 * i))));
    }
  }
  const period = (s, e) => ({ timezone: 'EDT', start: s, end: e, gmtoffset: -14400 });
  return { chart: { result: [{
    meta: {
      currency: 'USD', symbol: symbol.toUpperCase(), exchangeName: 'NMS', fullExchangeName: 'NasdaqGS',
      instrumentType: 'EQUITY', firstTradeDate: 1432823400, regularMarketTime: day2Open,
      hasPrePostMarketData: true, gmtoffset: -14400, timezone: 'EDT', exchangeTimezoneName: 'America/New_York',
      regularMarketPrice: q.nextOpen, fiftyTwoWeekHigh: q.high + 8, fiftyTwoWeekLow: q.low - 25,
      regularMarketDayHigh: q.high, regularMarketDayLow: q.low, regularMarketVolume: 4500000,
      chartPreviousClose: q.close, previousClose: q.close, scale: 3, priceHint: 2,
      currentTradingPeriod: {
        pre: period(day2Open - 5.5 * 3600, day2Open),
        regular: period(day2Open, day2Open + 6.5 * 3600),
        post: period(day2Open + 6.5 * 3600, day2Open + 10.5 * 3600),
      },
      tradingPeriods: [[period(day2Open, day2Open + 6.5 * 3600)]],
      dataGranularity: interval, range: params.get('range') || '1d',
      validRanges: ['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'],
    },
    timestamp: ts,
    indicators: { quote: [{ open, high, low, close, volume }], adjclose: [{ adjclose: close }] },
  }], error: null } };
}

function mockYahooQuote(symbol) {
  const q = MOCK_QUOTES[symbol.toUpperCase()] || { open: 99.2, low: 98.1, high: 101.6, close: 100.8, nextOpen: 100.4 };
  const names = { SHOP: 'Shopify Inc.', AAPL: 'Apple Inc.', META: 'Meta Platforms, Inc.' };
  const t = Date.UTC(2026, 2, 24, 13, 30, 0) / 1000;
  return {
    language: 'en-US', region: 'US', quoteType: 'EQUITY', typeDisp: 'Equity',
    symbol: symbol.toUpperCase(), shortName: names[symbol.toUpperCase()] || symbol,
    longName: names[symbol.toUpperCase()] || symbol,
    currency: 'USD', exchange: 'NMS', fullExchangeName: 'NasdaqGS', market: 'us_market',
    marketState: 'REGULAR', tradeable: false, triggerable: true,
    regularMarketPrice: q.nextOpen, regularMarketChange: +(q.nextOpen - q.close).toFixed(2),
    regularMarketChangePercent: +((q.nextOpen - q.close) / q.close * 100).toFixed(4),
    regularMarketTime: t, regularMarketDayHigh: q.high, regularMarketDayLow: q.low,
    regularMarketOpen: q.open, regularMarketPreviousClose: q.close, regularMarketVolume: 4500000,
    fiftyTwoWeekHigh: q.high + 8, fiftyTwoWeekLow: q.low - 25, priceHint: 2,
    exchangeTimezoneName: 'America/New_York', exchangeTimezoneShortName: 'EDT',
    gmtOffSetMilliseconds: -14400000, sourceInterval: 15, exchangeDataDelayedBy: 0,
    esgPopulated: false, hasPrePostMarketData: true, firstTradeDateMilliseconds: 1432823400000,
  };
}

// Console flood guard: some snapshots' scripts log tens of thousands of
// messages per second (observed: Notion at ~40k/s, from a subframe), ballooning
// JS heaps and flooding every attached CDP client (annotator, sampler, SR
// engine). Page console output has no annotation value — cap it. Injected into
// every served asset HTML document (top page AND subframes).
// Off-origin retry-loop damper: offline CSP makes off-origin fetch/XHR fail,
// and some snapshots' telemetry retries instantly forever (observed: Notion's
// Splunk logger at ~25k attempts/s, each emitting a browser CSP-violation
// console entry no console.* wrapper can cap). First 25 attempts per URL keep
// normal failure semantics; after that the same URL returns a forever-pending
// promise, which stops retry loops dead without faking success.
const NET_DAMPER = '<script id="a11y-net-damper">(function(){var counts={},LIM=25;function over(u){try{if(!/^https?:\\/\\//.test(u)||u.indexOf(location.origin)===0)return false;var k=u.split("?")[0];counts[k]=(counts[k]||0)+1;if(counts[k]===LIM+1)console.warn("[a11y] off-origin retry loop damped:",k);return counts[k]>LIM;}catch(e){return false;}}var of=window.fetch;window.fetch=function(input,init){var u=String(typeof input==="string"?input:(input&&input.url)||"");if(over(u))return new Promise(function(){});return of.apply(this,arguments);};var oo=XMLHttpRequest.prototype.open,os=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this.__a11yDamped=over(String(u));return oo.apply(this,arguments);};XMLHttpRequest.prototype.send=function(){if(this.__a11yDamped)return;return os.apply(this,arguments);};})();<\u002fscript>';

const CONSOLE_GUARD = '<script id="a11y-console-guard">(function(){var MAX=2000,n=0,done=false;var w=console.warn.bind(console);["log","warn","error","info","debug","trace","dir","table"].forEach(function(k){var o=console[k]&&console[k].bind(console);if(!o)return;console[k]=function(){if(done)return;if(++n>MAX){done=true;w("[a11y] console output capped after "+MAX+" messages (runaway logging)");return;}return o.apply(null,arguments);};});})();<\u002fscript>';
function injectConsoleGuard(html) {
  if (html.includes('a11y-console-guard')) return html;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, '<head$1>' + CONSOLE_GUARD + NET_DAMPER);
  return CONSOLE_GUARD + NET_DAMPER + html;
}

// Fetch/XHR shim injected into offline Yahoo snapshots: reroutes the data-API
// hosts (blocked by connect-src 'self') to the local /yapi mock.
const YAPI_SHIM = `<script id="a11y-yapi-shim">(function(){
  var RE=/^https?:\\/\\/(query[12]\\.finance\\.yahoo\\.com|guce\\.yahoo\\.com|3p-geo\\.yahoo\\.com|3p-udc\\.yahoo\\.com|finance\\.yahoo\\.com)(?!\\/assets\\/)/;
  function map(u){try{var s=String(u);if(RE.test(s)){var p=new URL(s);var m='/yapi'+p.pathname+p.search;console.log('[shim]',s.slice(0,120),'→',m.slice(0,100));return m;}}catch(e){}return u;}
  var of=window.fetch;window.fetch=function(input,init){try{console.log('[shim] fetch:',String(typeof input==='string'?input:input&&input.url).slice(0,150))}catch(e){}
    if(typeof input==='string')return of.call(this,map(input),init);
    if(input&&input.url){var m=map(input.url);if(m!==input.url)return of.call(this,new Request(m,input),init);}
    return of.call(this,input,init);};
  var oo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){
    arguments[1]=map(u);return oo.apply(this,arguments);};
  document.addEventListener('DOMContentLoaded',function(){
    document.write=function(){console.log('[shim] post-parse document.write BLOCKED')};
    document.writeln=document.write;
    document.open=function(){console.log('[shim] post-parse document.open BLOCKED');return document;};
  });
})();</script>`;

// ─── AX engine ──────────────────────────────────────────────────────────────

let vsrBrowserPath = null;
try { vsrBrowserPath = require.resolve('@guidepup/virtual-screen-reader/browser.js'); }
catch(e) { console.warn('virtual-screen-reader not found — SR speech disabled'); }

let browser = null;
const pageCache   = new Map(); // file → { page, cdp }  (LRU, capped)
// Each cached entry is a live Chrome tab — without a cap, querying many pages
// accumulates tabs and leaks gigabytes (52 pages ≈ 7.5 GB observed).
const PAGE_CACHE_MAX = 1;
async function evictPagesOver(limit) {
  while (pageCache.size > limit) {
    const [oldestKey, oldest] = pageCache.entries().next().value;
    pageCache.delete(oldestKey);
    try { await oldest.page.close(); } catch (e) {}
  }
}
const pageLoading = new Map(); // file → Promise<entry>
const vsrRunning = new Map(); // file → Promise  (currently executing VSR op)
const vsrPending = new Map(); // file → {fn,resolve,reject}  (at most one queued per file)

// Serializes VSR ops per page with depth-1 queue: a new call while one is running
// replaces any already-queued (but not yet started) op, resolving it with null.
// This means we always run the *latest* requested operation, never stale ones.
function withVsrLock(file, fn) {
  if (!vsrRunning.has(file)) {
    return _startVsr(file, fn);
  }
  // Replace any superseded pending op (cancel it by resolving null)
  const prev = vsrPending.get(file);
  if (prev) prev.resolve(null);
  return new Promise((resolve, reject) => vsrPending.set(file, { fn, resolve, reject }));
}
function _startVsr(file, fn) {
  const p = Promise.resolve().then(fn).then(
    result => { _vsrDone(file); return result; },
    err    => { _vsrDone(file); throw err; }
  );
  vsrRunning.set(file, p);
  return p;
}
function _vsrDone(file) {
  vsrRunning.delete(file);
  const pending = vsrPending.get(file);
  if (!pending) return;
  vsrPending.delete(file);
  _startVsr(file, pending.fn).then(pending.resolve, pending.reject);
}

let browserLaunching = null;

async function launchBrowser() {
  if (!puppeteer) return null;
  if (browser && browser.isConnected()) return browser;
  if (browserLaunching) return browserLaunching;
  browserLaunching = (async () => {
    try {
      const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      // Deny downloads browser-wide. Saved pages run auth/SDK iframes (Reebok
      // Shop-Pay /authorize, Microsoft silentauth/bscframe) that Chrome treats
      // as attachment downloads, littering the user's Downloads folder with
      // 0-byte files. We never want a download from a snapshot.
      try { const bc = await b.target().createCDPSession(); await bc.send('Browser.setDownloadBehavior', { behavior: 'deny' }); }
      catch (e) { console.warn('setDownloadBehavior failed:', e.message); }
      b.on('disconnected', () => {
        console.warn('AX engine disconnected — clearing caches');
        pageCache.clear(); pageLoading.clear();
        vsrRunning.clear(); vsrPending.clear();
        if (browser === b) browser = null;
      });
      browser = b;
      console.log('AX engine ready');
      return b;
    } catch(e) {
      console.warn('Puppeteer launch failed:', e.message);
      browser = null;
      throw e;
    } finally {
      browserLaunching = null;
    }
  })();
  return browserLaunching;
}

function getEngineStatus() {
  if (!puppeteer) return 'unavailable';
  if (browserLaunching) return 'starting';
  if (!browser) return 'down';
  return browser.isConnected() ? 'up' : 'down';
}

if (puppeteer) launchBrowser().catch(() => {});

// ─── Dev-server process manager ─────────────────────────────────────────────
// id → { proc, status: 'starting'|'running'|'stopped' }
const devServers = new Map();

function startDevServer(id, cwd, cmd, args) {
  if (devServers.has(id) && devServers.get(id).status !== 'stopped') return devServers.get(id).status;
  const resolvedCwd = cwd ? (path.isAbsolute(cwd) ? cwd : path.join(APP_ROOT, cwd)) : APP_ROOT;
  const proc = spawn(cmd, args || [], { cwd: resolvedCwd, shell: false });
  const entry = { proc, status: 'starting' };
  devServers.set(id, entry);
  const onData = (data) => {
    if (entry.status === 'starting' && /ready|compiled|localhost:\d|http:\/\//i.test(data.toString()))
      entry.status = 'running';
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);
  proc.on('exit', () => { entry.status = 'stopped'; entry.proc = null; });
  setTimeout(() => { if (entry.status === 'starting') entry.status = 'running'; }, 6000);
  return 'starting';
}

function stopDevServer(id) {
  const entry = devServers.get(id);
  if (entry && entry.proc) { entry.proc.kill('SIGTERM'); entry.status = 'stopped'; }
  devServers.delete(id);
}

function shutdownCleanup() {
  if (browser) browser.close();
  devServers.forEach((_, id) => stopDevServer(id));
}
process.on('exit', shutdownCleanup);
// A bare process.on(SIGNAL) handler REPLACES default termination — without the
// explicit exit() the server would swallow Ctrl-C / kill and live on.
['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => { shutdownCleanup(); process.exit(0); }));

async function getOrLoadPage(fileOrUrl) {
  const isUrl = fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://');
  // A missing asset would render the server's own 404 page and produce a
  // plausible-but-fabricated AX answer — fail loudly instead.
  if (!isUrl && !fs.existsSync(path.join(ASSETS_DIR, fileOrUrl))) {
    throw new Error('asset not found: ' + fileOrUrl);
  }
  // Ensure the browser is alive (auto-relaunch after sleep/disconnect)
  if (!browser || !browser.isConnected()) await launchBrowser();
  if (!browser) throw new Error('AX engine unavailable');
  // Return cached page if still alive
  if (pageCache.has(fileOrUrl)) {
    const entry = pageCache.get(fileOrUrl);
    try {
      await entry.page.title();
      pageCache.delete(fileOrUrl); pageCache.set(fileOrUrl, entry); // refresh LRU position
      return entry;
    } catch(e) { pageCache.delete(fileOrUrl); }
  }
  // Deduplicate concurrent loads of the same key
  if (pageLoading.has(fileOrUrl)) return pageLoading.get(fileOrUrl);

  const p = (async () => {
    // Evict BEFORE loading the next page: heavy snapshots can hold 500+ MB
    // renderers, and overlapping old+new pages caused multi-GB spikes.
    await evictPagesOver(PAGE_CACHE_MAX - 1).catch(() => {});
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 900 }); // ≈ iframe area of the annotator at 1920×1080
    page.setDefaultTimeout(20000);
    const cdp  = await page.createCDPSession();
    await cdp.send('Accessibility.enable');
    // Load asset pages through the SAME offline/noscript serving the annotator
    // iframe uses — the SR tool must describe the page the user actually sees.
    // Raw serving runs page JS that blanks/rewrites/navigates snapshots, and
    // live-network hangs were wedging the shared engine browser.
    let navUrl = fileOrUrl;
    if (!isUrl) {
      let noscript = false;
      try {
        const pj = JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, 'pages.json'), 'utf8'));
        const list = Array.isArray(pj) ? pj : pj.pages;
        const hit = (list || []).find(pg => ((pg.subdir ? pg.subdir + '/' : '') + pg.file) === fileOrUrl);
        noscript = !!(hit && hit.noscript);
      } catch (e) {}
      navUrl = `http://127.0.0.1:${PORT}/assets/${fileOrUrl.split('/').map(encodeURIComponent).join('/')}?offline=1${noscript ? '&noscript=1' : ''}`;
    }
    // Tolerate slow loads: a partial DOM is exactly what the iframe shows too.
    await page.goto(navUrl, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    if (vsrBrowserPath) {
      try {
        const vsrUrl = `http://127.0.0.1:${PORT}/virtual-sr.js`;
        await page.evaluate(async (u) => {
          const mod = await import(u);
          window.__vsr = mod.virtual;
        }, vsrUrl);
      } catch(e) { console.warn('VSR injection failed:', e.message); }
    }
    const entry = { page, cdp };
    pageCache.set(fileOrUrl, entry);
    pageLoading.delete(fileOrUrl);
    return entry;
  })();

  pageLoading.set(fileOrUrl, p);
  try { return await p; } catch(e) { pageLoading.delete(fileOrUrl); throw e; }
}

async function queryAXNode(file, xpath) {
  const { cdp } = await getOrLoadPage(file);

  // Resolve element via document.evaluate (browser's native XPath)
  const evalResult = await cdp.send('Runtime.evaluate', {
    expression: `(function(){
      var r=document.evaluate(${JSON.stringify(xpath)},document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null);
      return r.singleNodeValue;
    })()`,
    returnByValue: false,
  });

  if (!evalResult.result || evalResult.result.subtype === 'null' || !evalResult.result.objectId) {
    return null;
  }

  // Get backendNodeId so we can query the AX tree
  const { node } = await cdp.send('DOM.describeNode', { objectId: evalResult.result.objectId });
  if (!node) return null;

  const { nodes } = await cdp.send('Accessibility.getAXNodeAndAncestors', {
    backendNodeId: node.backendNodeId,
  });
  const axNode = nodes && nodes[0];
  if (!axNode) return null;

  const getProp = name => {
    const p = (axNode.properties || []).find(p => p.name === name);
    return p ? p.value.value : undefined;
  };

  // Map CDP reason names to readable labels
  const REASON_LABELS = {
    ariaHiddenElement:    'aria-hidden',
    ariaHiddenSubtree:    'aria-hidden ancestor',
    notRendered:          'not rendered',
    presentationalRole:   'presentational role',
    notInteresting:       'not interesting',
    uninteresting:        'not interesting',
    emptyAlt:             'empty alt',
    emptyText:            'empty text',
    inertElement:         'inert',
    inertSubtree:         'inert ancestor',
    ignoredByAccessibility: 'ignored',
  };
  const ignoredReasons = (axNode.ignoredReasons || [])
    .map(r => REASON_LABELS[r.name] || r.name)
    .filter(Boolean);

  const hasChildrenResult = await cdp.send('Runtime.callFunctionOn', {
    objectId: evalResult.result.objectId,
    functionDeclaration: 'function() { return this.childElementCount > 0; }',
    returnByValue: true,
  });
  const hasChildren = hasChildrenResult.result.value || false;

  return {
    inTree:        !axNode.ignored,
    role:          axNode.role  && axNode.role.value  || null,
    name:          axNode.name  && axNode.name.value  || null,
    focusable:     getProp('focusable') || false,
    ignoredReasons,
    hasChildren,
  };
}

async function querySpeechOnly(file, xpath, axName) {
  const { page } = await getOrLoadPage(file);
  const result = await page.evaluate(async (xp, axName) => {
    if (!window.__vsr) return null;
    const el = (function() {
      const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return r.singleNodeValue;
    })();
    if (!el) return null;
    let speech = null;
    try {
      const vsr = window.__vsr;
      await vsr.start({ container: document.body });
      const atTarget = () => vsr.activeNode === el || el.contains(vsr.activeNode);
      // Strategy 1: direct focusin
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await new Promise(r => setTimeout(r, 0));
      if (atTarget()) {
        speech = await vsr.lastSpokenPhrase() || null;
      }
      // Strategy 2: focusable descendant
      if (!speech) {
        const child = el.querySelector('a, button, input, select, textarea, [tabindex]');
        if (child) {
          child.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
          await new Promise(r => setTimeout(r, 0));
          if (atTarget()) speech = await vsr.lastSpokenPhrase() || null;
        }
      }
      // Strategy 2.5: jump to nearest preceding focusable, walk forward briefly
      if (!speech) {
        const focusables = document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]');
        let anchor = null;
        for (const f of focusables) {
          const pos = el.compareDocumentPosition(f);
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) anchor = f;
          else if (!(pos & Node.DOCUMENT_POSITION_CONTAINS)) break;
        }
        if (anchor) {
          anchor.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
          await new Promise(r => setTimeout(r, 0));
          if (vsr.activeNode === anchor) {
            for (let i = 0; i < 400; i++) {
              await vsr.next();
              if (!vsr.activeNode) break;
              if (atTarget()) { speech = await vsr.lastSpokenPhrase() || null; break; }
            }
          }
        }
      }
      // Strategy 3: traverse forward to find el or a node inside it
      if (!speech) {
        const deadline = Date.now() + 20000;
        for (let i = 0; i < 12000 && Date.now() < deadline; i++) {
          await vsr.next();
          if (!vsr.activeNode) break;
          if (atTarget()) { speech = await vsr.lastSpokenPhrase() || null; break; }
        }
      }
      // Use Chrome's authoritative accessible name (axName) for the NAME slot,
      // keeping the role + states the VSR voiced. The VSR phrase is
      // "role, name[, ...states]" and vsr.itemText() is its name verbatim, so
      // stripping itemText isolates the trailing states. (This replaces the old
      // forward look-ahead, which re-read the element's own subtree and
      // duplicated nameFrom:contents names — e.g. a plain link voiced
      // "link, About, About".)
      if (speech && axName) {
        const itemText = await vsr.itemText();
        const ci = speech.indexOf(', ');
        if (ci > 0) {
          const role  = speech.slice(0, ci);
          const after = speech.slice(ci + 2);
          const states = (itemText && after.startsWith(itemText)) ? after.slice(itemText.length) : '';
          speech = role + ', ' + axName + states;
        }
      }
      // VSR follows ARIA strictly: roles like "paragraph", "list", "article" have
      // nameFrom:n/a so VSR returns just the role name. Real SRs read the text.
      // If speech is a bare role with no accompanying text, fall back to textContent.
      const BARE_ROLES = /^(paragraph|list|listitem|article|region|main|banner|contentinfo|navigation|complementary|form|search|figure|table|row|cell|columnheader|rowheader|dialog|alertdialog|separator|generic|none|section|group|alert|emphasis|strong|code|mark|time|term|definition|deletion|insertion|subscript|superscript)$/i;
      if (speech && BARE_ROLES.test(speech.trim())) {
        const txt = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 200);
        speech = txt || null;
      }
      await vsr.stop();
    } catch(e) { try { await window.__vsr.stop(); } catch(_) {} }
    return speech;
  }, xpath, axName);
  return result;
}

async function querySROrder(file, xpath, endOf) {
  const { page } = await getOrLoadPage(file);
  return page.evaluate(async (xp, endOf) => {
    if (!window.__vsr) return null;
    const targetEl = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!targetEl) return null;

    const vsr = window.__vsr;

    function getXPath(e) {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      if (e === document.documentElement) return '/html';
      // local-name() is case-sensitive; SVG preserves case (clipPath etc.)
      var ns = e.namespaceURI;
      var isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
      const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : '/*[local-name()=\'' + t + '\'][' + idx + ']');
    }

    function toElement(n) {
      while (n && !n.tagName) n = n.parentNode;
      return n;
    }

    function elInfo(e) {
      e = toElement(e);
      if (!e || e === document.body || e === document.documentElement) return null;
      return { xpath: getXPath(e), tag: e.tagName.toLowerCase(), elId: e.id || '', txt: (e.textContent || '').trim().slice(0, 40) };
    }

    try { await vsr.start({ container: document.body }); } catch(_) { return null; }

    // Position SR cursor at targetEl using multiple strategies:
    // 1. focusin on targetEl itself (fast path for direct AT nodes)
    // 2. focusin on a focusable descendant (jumps cursor into subtree)
    // 3. focusin on ancestors walking up (gets cursor nearby)
    // 4. Full traversal from start as last resort
    let effectiveTarget = null;
    const tryFocus = async (el) => {
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await new Promise(r => setTimeout(r, 0));
      return vsr.activeNode === el;
    };
    // Strategy 1: direct focusin
    if (await tryFocus(targetEl)) {
      effectiveTarget = targetEl;
    }
    // Strategy 2: focusable descendant (positions cursor inside target subtree)
    if (!effectiveTarget) {
      const child = targetEl.querySelector('a, button, input, select, textarea, [tabindex]');
      if (child) {
        child.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await new Promise(r => setTimeout(r, 0));
        if (vsr.activeNode && targetEl.contains(vsr.activeNode)) {
          effectiveTarget = targetEl;
        }
      }
    }
    // Strategy 3: jump to the nearest PRECEDING focusable element, then walk
    // forward a short distance. Linear traversal from the document start can't
    // reach footer elements on huge pages within any sane time budget; a
    // focusin on a nearby anchor gets the cursor within a few dozen steps.
    if (!effectiveTarget) {
      const focusables = document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]');
      let anchor2 = null;
      for (const f of focusables) {
        const pos = targetEl.compareDocumentPosition(f);
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) anchor2 = f;
        else if (!(pos & Node.DOCUMENT_POSITION_CONTAINS)) break;
      }
      if (anchor2 && await tryFocus(anchor2)) {
        for (let i = 0; i < 400; i++) {
          await vsr.next();
          const n = vsr.activeNode;
          if (!n) break;
          if (n === targetEl || targetEl.contains(n)) { effectiveTarget = targetEl; break; }
        }
      }
    }
    // Strategy 4: walk up ancestors to find one VSR recognizes, then traverse down
    if (!effectiveTarget) {
      let anchor = null;
      for (let el = targetEl.parentElement; el && el !== document.body; el = el.parentElement) {
        if (await tryFocus(el)) { anchor = el; break; }
      }
      if (anchor) {
        for (let i = 0; i < 500; i++) {
          await vsr.next();
          const n = vsr.activeNode;
          if (!n) break;
          if (n === targetEl || targetEl.contains(n)) { effectiveTarget = targetEl; break; }
        }
      }
    }
    // Strategy 5: traverse from start (large pages; time-bounded)
    if (!effectiveTarget) {
      const deadline = Date.now() + 20000;
      for (let i = 0; i < 12000 && Date.now() < deadline; i++) {
        await vsr.next();
        const n = vsr.activeNode;
        if (!n) break;
        if (n === targetEl || targetEl.contains(n)) {
          effectiveTarget = targetEl;
          break;
        }
      }
    }
    if (!effectiveTarget) { await vsr.stop(); return null; }

    let prevSpeech = null, nextSpeech = null, prevEl = null, nextEl = null;

    // Nodes inside <noscript> are raw text (the parser stores unparsed markup
    // there when scripting is enabled). Chrome never renders them and its AX
    // tree ignores them, but the virtual SR prunes by computed style only and
    // would read the markup aloud — skip them like a real SR does.
    const inNoscript = (n) => {
      while (n && !n.tagName) n = n.parentNode;
      return !!(n && n.closest && n.closest('noscript'));
    };

    // Prev (skipping noscript content)
    let prevNode = null;
    for (let i = 0; i < 50; i++) {
      await vsr.previous();
      const n = vsr.activeNode;
      if (!n) break;
      if (inNoscript(n)) continue;
      prevNode = n;
      break;
    }
    if (prevNode && prevNode !== effectiveTarget) {
      prevSpeech = await vsr.lastSpokenPhrase() || null;
      prevEl = prevNode;
    }

    // Next: navigate forward from prevNode.
    // For ul/ol (not endOf), jump inside to first child.
    // For everything else (or endOf), skip the target subtree entirely.
    const jumpInside = !endOf && /^(ul|ol)$/i.test(effectiveTarget.tagName);
    let nextNode = null;
    let passedTarget = false;
    for (let i = 0; i < 2000; i++) {
      await vsr.next();
      const n = vsr.activeNode;
      if (!n) break;
      if (inNoscript(n)) continue; // never surface noscript raw text
      const inSubtree = n === effectiveTarget || effectiveTarget.contains(n);
      if (jumpInside) {
        if (!passedTarget) {
          if (inSubtree) passedTarget = true;
          continue; // no delay needed while passing through target
        }
        await new Promise(r => setTimeout(r, 20));
        nextNode = n;
        break;
      }
      if (inSubtree) continue; // no delay needed while skipping target subtree
      await new Promise(r => setTimeout(r, 20));
      nextNode = n;
      break;
    }
    if (nextNode) {
      nextSpeech = await vsr.lastSpokenPhrase() || null;
      const nl = nextSpeech ? nextSpeech.toLowerCase() : '';
      if (!nl || nl === 'end of document' || nl.startsWith('end of web area')) nextSpeech = null;
      else nextEl = nextNode;
    }

    await vsr.stop();
    return { prevSpeech, nextSpeech, prev: elInfo(prevEl), next: elInfo(nextEl) };
  }, xpath, !!endOf);
}

// ─── Static file helper ─────────────────────────────────────────────────────

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

http.createServer((req, res) => {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  // GET /ax-node?file=name.html&xpath=... or ?url=http://...&xpath=...
  if (pathname === '/ax-node') {
    const file    = url.searchParams.get('file');
    const pageUrl = url.searchParams.get('url');
    const xpath   = url.searchParams.get('xpath');
    const key     = pageUrl || file;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (!key || !xpath || !browser) { res.end('null'); return; }
    if (pageUrl) {
      try { const u = new URL(pageUrl); if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') { res.end('null'); return; } } catch(e) { res.end('null'); return; }
    } else {
      const fp = path.join(ASSETS_DIR, file); if (!fp.startsWith(ASSETS_DIR)) { res.end('null'); return; }
    }
    (async () => {
      try {
        const ax = await queryAXNode(key, xpath);
        // Pass Chrome's authoritative name into the speech build so it owns the
        // NAME slot (role + states still come from the VSR). If the VSR can't
        // position on the node, speech stays null — we stay faithful and don't
        // fabricate an announcement.
        const speech = vsrBrowserPath ? await withVsrLock(key, () => querySpeechOnly(key, xpath, ax && ax.name)).catch(() => null) : null;
        res.end(JSON.stringify(ax ? { ...ax, speech } : null));
      } catch(e) {
        console.error('AX query error:', e.message);
        res.end('null');
      }
    })();
    return;
  }

  // GET /sr-order?file=name.html&xpath=... or ?url=http://...&xpath=...
  if (pathname === '/sr-order') {
    const file    = url.searchParams.get('file');
    const pageUrl = url.searchParams.get('url');
    const xpath   = url.searchParams.get('xpath');
    const key     = pageUrl || file;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (!key || !xpath || !browser || !vsrBrowserPath) {
      console.log('SR order early exit:', { key:!!key, xpath:!!xpath, browser:!!browser, vsr:!!vsrBrowserPath });
      res.end('null'); return;
    }
    if (pageUrl) {
      try { const u = new URL(pageUrl); if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') { res.end('null'); return; } } catch(e) { res.end('null'); return; }
    } else {
      const fp = path.join(ASSETS_DIR, file); if (!fp.startsWith(ASSETS_DIR)) { res.end('null'); return; }
    }
    (async () => {
      try {
        const endOf = url.searchParams.get('endOf') === '1';
        console.log('SR order: starting traversal for', key, xpath, endOf ? '(endOf)' : '');
        const srOrder = await withVsrLock(key, () => querySROrder(key, xpath, endOf));
        console.log('SR order result:', srOrder);
        res.end(JSON.stringify(srOrder));
      } catch(e) {
        console.error('SR order error:', e.message);
        res.end('null');
      }
    })();
    return;
  }

  // /engine/status (GET) and /engine/restart (POST) — Puppeteer health & manual relaunch
  if (pathname === '/engine/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: getEngineStatus() }));
    return;
  }
  if (pathname === '/engine/restart') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (!puppeteer) { res.end(JSON.stringify({ status: 'unavailable' })); return; }
    (async () => {
      try {
        if (browser) { try { await browser.close(); } catch(e) {} }
        browser = null;
        pageCache.clear(); pageLoading.clear();
        vsrRunning.clear(); vsrPending.clear();
        await launchBrowser();
        res.end(JSON.stringify({ status: getEngineStatus() }));
      } catch(e) {
        res.end(JSON.stringify({ status: 'down', error: e.message }));
      }
    })();
    return;
  }

  // /dev-server/* — start, stop, status for managed child processes
  if (pathname.startsWith('/dev-server/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const action = pathname.slice('/dev-server/'.length); // 'start' | 'stop' | 'status'
    if (action === 'status') {
      const id = url.searchParams.get('id');
      const entry = id && devServers.get(id);
      res.end(JSON.stringify({ status: entry ? entry.status : 'stopped' }));
    } else {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        let body = {};
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch(e) {}
        const { id, cwd, cmd, args } = body;
        if (!id) { res.end(JSON.stringify({ error: 'Missing id' })); return; }
        if (action === 'start') {
          if (!cmd) { res.end(JSON.stringify({ error: 'Missing cmd' })); return; }
          // Clear puppeteer cache for this URL so it reloads with the new server
          pageCache.delete(id);
          const status = startDevServer(id, cwd, cmd, args);
          res.end(JSON.stringify({ status }));
        } else if (action === 'stop') {
          stopDevServer(id);
          res.end(JSON.stringify({ status: 'stopped' }));
        } else {
          res.end('{}');
        }
      });
    }
    return;
  }

  // GET /proxy?target=URL — fetch a localhost dev-server page and serve same-origin
  // so the iframe can access contentDocument for INJECT_JS injection.
  // A <base> tag is injected so relative asset URLs resolve against the dev server.
  if (pathname === '/proxy') {
    const target = url.searchParams.get('target');
    if (!target) { res.writeHead(400); res.end('Missing target'); return; }
    let targetUrl;
    try { targetUrl = new URL(target); } catch(e) { res.writeHead(400); res.end('Invalid URL'); return; }
    if (targetUrl.hostname !== 'localhost' && targetUrl.hostname !== '127.0.0.1') {
      res.writeHead(403); res.end('Only localhost URLs may be proxied'); return;
    }
    const proto = targetUrl.protocol === 'https:' ? require('https') : require('http');
    const proxyReq = proto.get(target, { headers: { Accept: 'text/html,application/xhtml+xml' } }, proxyRes => {
      // Follow one redirect level
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const loc = new URL(proxyRes.headers.location, target).href;
        res.writeHead(302, { Location: '/proxy?target=' + encodeURIComponent(loc) });
        res.end(); return;
      }
      const chunks = [];
      proxyRes.on('data', c => chunks.push(c));
      proxyRes.on('end', () => {
        let html = Buffer.concat(chunks).toString('utf8');
        // Remove any existing <base> tags, then inject ours so relative URLs
        // (scripts, styles, images) load from the dev server origin.
        html = html.replace(/<base[^>]*>/gi, '');
        const base = `<base href="${targetUrl.origin}/">`;
        if (/<head/i.test(html)) html = html.replace(/(<head[^>]*>)/i, '$1' + base);
        else html = base + html;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
    });
    proxyReq.on('error', e => { res.writeHead(502); res.end('Proxy error: ' + e.message); });
    return;
  }

  // GET /virtual-sr.js — serve virtual screen reader browser build
  if (pathname === '/virtual-sr.js') {
    if (!vsrBrowserPath) { res.writeHead(404); res.end(''); return; }
    serveFile(vsrBrowserPath, res);
    return;
  }

  // GET /pages — serve or auto-generate pages.json
  if (pathname === '/pages') {
    const pagesPath = path.join(ASSETS_DIR, 'pages.json');
    fs.readFile(pagesPath, 'utf8', (err, data) => {
      if (!err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
        return;
      }
      fs.readdir(ASSETS_DIR, (err2, files) => {
        if (err2) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('[]'); return; }
        const pages = files
          .filter(f => /\.html?$/i.test(f))
          .map(f => ({ name: f.replace(/\.html?$/i, ''), file: f }));
        const json = JSON.stringify(pages, null, 2);
        fs.writeFile(pagesPath, json, () => {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(json);
      });
    });
    return;
  }

  // GET /assets — list HTML files
  if (pathname === '/assets' || pathname === '/assets/') {
    fs.readdir(ASSETS_DIR, (err, files) => {
      if (err) { res.writeHead(200); res.end('[]'); return; }
      const htmlFiles = files.filter(f => /\.html?$/i.test(f));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(htmlFiles));
    });
    return;
  }

  // GET /vendor/* — locally vendored CDN libraries (tailwind, react, babel, …)
  if (pathname.startsWith('/vendor/')) {
    const vendorDir = path.join(APP_ROOT, 'vendor');
    const filePath = path.join(APP_ROOT, pathname);
    if (!filePath.startsWith(vendorDir)) { res.writeHead(403); res.end('Forbidden'); return; }
    serveFile(filePath, res);
    return;
  }

  // GET /yfin/* — Yahoo Finance webcore module chunks (chart engine etc.).
  // Saved Yahoo snapshots reference these via a dynamic module manifest on
  // s.yimg.com, which the offline CSP blocks. Offline HTML rewrites that base
  // URL to /yfin/; this route serves a vendored copy from vendor/yfin/, and on
  // first miss fetches the (immutable, hash-versioned) chunk from s.yimg.com,
  // rewrites any nested s.yimg.com chunk URLs to /yfin/, and caches it to disk
  // — so after a warm-up run the page is fully offline again.
  if (pathname.startsWith('/yfin/')) {
    const name = decodeURIComponent(pathname.slice('/yfin/'.length));
    if (!/^[\w.@-]+$/.test(name)) { res.writeHead(403); res.end('Forbidden'); return; }
    const dir = path.join(APP_ROOT, 'vendor', 'yfin');
    const cached = path.join(dir, name);
    const sendJs = body => {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(body);
    };
    fs.readFile(cached, 'utf8', (err, body) => {
      if (!err) { sendJs(body); return; }
      const upstream = 'https://s.yimg.com/uc/finance/webcore/js/' + name;
      require('https').get(upstream, { headers: { 'User-Agent': 'Mozilla/5.0' } }, up => {
        if (up.statusCode !== 200) { console.log(`[yfin] MISS ${name} → upstream ${up.statusCode}`); res.writeHead(404); res.end(); return; }
        let buf = '';
        up.setEncoding('utf8');
        up.on('data', c => buf += c);
        up.on('end', () => {
          buf = buf.replace(/https:\/\/s\.yimg\.com\/uc\/finance\/webcore\/js\//g, '/yfin/');
          fs.mkdir(dir, { recursive: true }, () => fs.writeFile(cached, buf, () => {}));
          console.log(`[yfin] fetched+cached ${name} (${buf.length}b)`);
          sendJs(buf);
        });
      }).on('error', e => { console.log(`[yfin] fetch error ${name}: ${e.message}`); res.writeHead(502); res.end(); });
    });
    return;
  }

  // GET /yfin2/* — same caching-vendor scheme for Yahoo's SvelteKit app
  // chunks (finance.yahoo.com/assets/_app/immutable/…), which hold the
  // advanced-chart renderer. Paths may contain subdirs (nodes/, chunks/,
  // entry/), all hash-versioned and immutable.
  // (alias: the saved SvelteKit boot computes base from location, so under
  // /assets/saved/ it requests /assets/assets/_app/immutable/… — same chunks)
  const YFIN2_ALIAS = '/assets/assets/_app/immutable/';
  if (pathname.startsWith('/yfin2/') || pathname.startsWith(YFIN2_ALIAS)) {
    if (pathname.endsWith('.css')) console.log('[yfin2] css req ' + pathname.slice(-50));
    const name = decodeURIComponent(pathname.startsWith('/yfin2/')
      ? pathname.slice('/yfin2/'.length)
      : pathname.slice(YFIN2_ALIAS.length));
    if (name.includes('..') || !/^[\w./@~+-]+$/.test(name)) { res.writeHead(403); res.end('Forbidden'); return; }
    const dir = path.join(APP_ROOT, 'vendor', 'yfin2');
    const cached = path.join(dir, name);
    const ctype = name.endsWith('.css') ? 'text/css' : 'application/javascript';
    fs.readFile(cached, 'utf8', (err, body) => {
      if (!err) { res.writeHead(200, { 'Content-Type': ctype }); res.end(body); return; }
      const upstream = 'https://finance.yahoo.com/assets/_app/immutable/' + name;
      require('https').get(upstream, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' } }, up => {
        if (up.statusCode !== 200) { console.log(`[yfin2] MISS ${name} → upstream ${up.statusCode}`); res.writeHead(404); res.end(); return; }
        let buf = '';
        up.setEncoding('utf8');
        up.on('data', c => buf += c);
        up.on('end', () => {
          buf = buf
            .replace(/https:\/\/finance\.yahoo\.com\/assets\/_app\/immutable\//g, '/yfin2/')
            .replace(/https:\/\/s\.yimg\.com\/uc\/finance\/webcore\/js\//g, '/yfin/');
          fs.mkdir(path.dirname(cached), { recursive: true }, () => fs.writeFile(cached, buf, () => {}));
          console.log(`[yfin2] fetched+cached ${name} (${buf.length}b)`);
          res.writeHead(200, { 'Content-Type': ctype });
          res.end(buf);
        });
      }).on('error', e => { console.log(`[yfin2] fetch error ${name}: ${e.message}`); res.writeHead(502); res.end(); });
    });
    return;
  }

  // GET /yapi/* — mock Yahoo Finance data API (offline stand-in for
  // query1/query2.finance.yahoo.com, which connect-src 'self' blocks). The
  // offline fetch/XHR shim rewrites those hosts to /yapi/. v8 chart requests
  // get deterministic mock candles aligned with the snapshot's saved quote
  // values; everything else gets an empty-but-valid JSON envelope.
  // Yahoo internal same-origin resource API (ybar notifications etc.)
  if (pathname.startsWith('/tdv2_fp/')) {
    console.log(`[yapi] (tdv2_fp) ${pathname.slice(0, 110)}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }

  // Yahoo same-origin BFF gateway (/xhr/...): route loads fetch these
  // relative paths. Market-data shapes get our aligned mocks; telemetry gets
  // stubs; everything else (i18n, config, feature meta) is proxy-cached once
  // from the live site into vendor/yxhr/ and offline thereafter.
  if (pathname.startsWith('/xhr/') || pathname === '/data/uncached' || pathname === '/__rapidworker-1.2.js') {
    console.log(`[yxhr] ${pathname.slice(0, 110)}`);
    if (pathname === '/__rapidworker-1.2.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end('// stub');
      return;
    }
    if (pathname.includes('/getcrumb')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('a11yMockCrumb01');
      return;
    }
    const chartM = pathname.match(/\/finance\/chart\/([^/?]+)/) || pathname.match(/\/fchart\/([^/?]+)/);
    if (chartM) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockYahooChart(decodeURIComponent(chartM[1]), url.searchParams)));
      return;
    }
    if (pathname.includes('/finance/quote')) {
      const syms = (url.searchParams.get('symbols') || url.searchParams.get('symbol') || 'SHOP').split(',');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ quoteResponse: { result: syms.map(mockYahooQuote), error: null } }));
      return;
    }
    if (/beacon|telemetry|\/data\/uncached/.test(pathname)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }
    // /xhr/config is cookie-gated upstream (403); serve the minimal shape the
    // page-init chain destructures (P.i13n.event_params, P.footer, …)
    if (pathname === '/xhr/config') {
      const cfgName = url.searchParams.get('name') || '';
      const cfg = cfgName === 'pages'
        ? { i13n: { event_params: {}, keys: {} }, footer: {}, page: 'home' }
        : {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cfg));
      return;
    }
    // proxy-cache from live finance.yahoo.com (GET and POST — /xhr/config is
    // a POST endpoint; cache key includes the request body)
    let reqBody = '';
    req.on('data', c => reqBody += c);
    req.on('end', () => {
      const key = require('crypto').createHash('sha1').update(req.method + pathname + url.search + reqBody).digest('hex').slice(0, 16);
      const dir = path.join(APP_ROOT, 'vendor', 'yxhr');
      const cached = path.join(dir, key + '.json');
      fs.readFile(cached, 'utf8', (err, body) => {
        if (!err) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(body); return; }
        const upReq = require('https').request({
          hostname: 'finance.yahoo.com', path: pathname + url.search, method: req.method,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
            'Accept': 'application/json',
            ...(reqBody ? { 'Content-Type': req.headers['content-type'] || 'application/json', 'Content-Length': Buffer.byteLength(reqBody) } : {}),
          },
        }, up => {
          let buf = '';
          up.setEncoding('utf8');
          up.on('data', c => buf += c);
          up.on('end', () => {
            if (up.statusCode !== 200 || !buf) { console.log(`[yxhr] upstream ${up.statusCode} ${req.method} ${pathname.slice(0, 80)} → {}`); buf = '{}'; }
            else { fs.mkdir(dir, { recursive: true }, () => fs.writeFile(cached, buf, () => {})); console.log(`[yxhr] cached ${req.method} ${pathname.slice(0, 80)} (${buf.length}b)`); }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(buf);
          });
        });
        upReq.on('error', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); });
        upReq.end(reqBody);
      });
    });
    return;
  }

  if (pathname.startsWith('/yapi/')) {
    console.log(`[yapi] ${pathname}${url.search || ''}`);
    // crumb: real endpoint returns a bare text token
    if (pathname.includes('/getcrumb')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('a11yMockCrumb01');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    const chartMatch = pathname.match(/^\/yapi\/v\d+\/finance\/chart\/([^/?]+)/);
    if (chartMatch) {
      res.writeHead(200);
      res.end(JSON.stringify(mockYahooChart(decodeURIComponent(chartMatch[1]), url.searchParams)));
      return;
    }
    if (pathname.match(/^\/yapi\/v\d+\/finance\/quote(?:$|\?)/) || pathname === '/yapi/v7/finance/quote') {
      const syms = (url.searchParams.get('symbols') || 'SHOP').split(',');
      res.writeHead(200);
      res.end(JSON.stringify({ quoteResponse: { result: syms.map(mockYahooQuote), error: null } }));
      return;
    }
    if (pathname.match(/^\/yapi\/v\d+\/finance\/quoteSummary\//)) {
      res.writeHead(200);
      res.end(JSON.stringify({ quoteSummary: { result: [{}], error: null } }));
      return;
    }
    res.writeHead(200);
    res.end('{}');
    return;
  }

  // GET /assets/* — serve asset file. ?offline=1 on an HTML asset:
  //   1. rewrites known CDN script/css URLs to locally vendored copies so
  //      pages that depend on tailwind/react/babel still render fully, and
  //   2. attaches a CSP that blocks off-origin scripts and XHR/fetch (the
  //      things that can hang or alter a page) while permitting passive
  //      resources (images & fonts) so visual fidelity is preserved.
  if (pathname.startsWith('/assets/')) {
    const rel      = pathname.slice('/assets/'.length);
    const filePath = path.join(ASSETS_DIR, rel);
    if (!filePath.startsWith(ASSETS_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const offline = url.searchParams.get('offline') === '1' && (ext === '.html' || ext === '.htm');
    if (offline) {
      const noscript = url.searchParams.get('noscript') === '1';
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        // noscript mode: neutralize the page's own <script> tags. Some saved
        // SPA snapshots (e.g. Next.js sites with origin checks) blank their
        // own SSR DOM when their runtime crashes at this origin — the static
        // snapshot renders perfectly without scripts. A leading type attr
        // wins over any later one, so this disables execution wholesale.
        // The annotator's injected scripts are added at runtime and unaffected.
        if (noscript) html = html.replace(/<script\b/gi, '<script type="text/plain"');
        // Strip meta refresh (snapshots redirect the iframe to dead paths)
        // and meta CSP (would block the annotator's injected scripts).
        html = html.replace(/<meta[^>]+http-equiv=["']?(refresh|content-security-policy)["']?[^>]*>/gi, '');
        // Console flood guard: some snapshots' scripts log tens of thousands of
        // messages per second offline (observed: Notion at ~40k/s), ballooning
        // the page's JS heap and flooding every attached CDP client (annotator,
        // sampler, SR engine). Page console output has no annotation value —
        // cap it. Injected first in <head> so it wraps console before page JS.
        html = injectConsoleGuard(html);
        // CDN → local vendor rewrites
        html = html
          .replace(/https:\/\/cdn\.tailwindcss\.com\/?(?=")/g, '/vendor/tailwind.js')
          .replace(/https:\/\/unpkg\.com\/react@18\/umd\/react\.development\.js/g, '/vendor/react.development.js')
          .replace(/https:\/\/unpkg\.com\/react-dom@18\/umd\/react-dom\.development\.js/g, '/vendor/react-dom.development.js')
          .replace(/https:\/\/unpkg\.com\/react@18\/umd\/react\.production\.min\.js/g, '/vendor/react.production.min.js')
          .replace(/https:\/\/unpkg\.com\/react-dom@18\/umd\/react-dom\.production\.min\.js/g, '/vendor/react-dom.production.min.js')
          .replace(/https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js/g, '/vendor/babel.min.js')
          .replace(/https:\/\/unpkg\.com\/babel-standalone@6\/babel\.min\.js/g, '/vendor/babel6.min.js')
          .replace(/https:\/\/unpkg\.com\/htm@3\.1\.1\/dist\/htm\.umd\.js/g, '/vendor/htm.umd.js')
          .replace(/https:\/\/unpkg\.com\/lucide@latest\/?(?=")/g, '/vendor/lucide.js')
          .replace(/https:\/\/unpkg\.com\/@phosphor-icons\/web\/?(?=")/g, '/vendor/phosphor.js')
          .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/(6\.\d+\.\d+)\/css\/all\.min\.css/g, '/vendor/fa/$1/css/all.min.css');
        // Yahoo Finance: route module chunks through /yfin (vendored cache)
        // and inject the data-API shim so the chart engine can boot offline.
        // Experimental (&yjs=1): let saved Yahoo Finance pages boot their own
        // JS chart stack offline — module chunks vendored via /yfin + /yfin2,
        // data API mocked at /yapi. Outcome of the experiment: the full module
        // graph loads, kit.start() completes, and the mock API is consumed,
        // but SvelteKit hydration silently mounts nothing against a Save-As
        // DOM, so the chart engine never initializes. Kept opt-in for future
        // work; default serving uses the static mock-SVG charts instead.
        if (url.searchParams.get('yjs') === '1' &&
            (html.includes('s.yimg.com/uc/finance/webcore/js/') || html.includes('finance.yahoo.com/assets/_app/immutable/'))) {
          // SvelteKit boot repairs (see CHANGES.md "Mock charts"):
          // 1. <base> pins relative URL resolution to the real asset path so we
          //    can then spoof location to the canonical route path — kit's
          //    client router matches routes against location.pathname, and
          //    without a match the route load() crashes and nothing mounts.
          // 2. The mount target: Save-As serialized the boot script inside a
          //    bogus nested div#svelte in the ybar notifications panel; the
          //    real app root is body > div#svelte (verified on the live page).
          const canon = (html.match(/<link[^>]+rel="canonical"[^>]+href="https:\/\/finance\.yahoo\.com([^"]*)"/) || [])[1];
          const baseAndSpoof = `<base href="${pathname}">` +
            (url.searchParams.get('csr') === '1' ? '<script>window.__forceCSR = 1;</script>' : '') +
            (canon ? `<script>history.replaceState(history.state, '', ${JSON.stringify(canon)} + location.search);</script>` : '');
          html = html
            .replace(/https:\/\/s\.yimg\.com\/uc\/finance\/webcore\/js\//g, '/yfin/')
            .replace(/https:\/\/finance\.yahoo\.com\/assets\/_app\/immutable\//g, '/yfin2/')
            .replace(/<head([^>]*)>/i, '<head$1>' + baseAndSpoof + YAPI_SHIM)
            .replace('const element = document.currentScript.parentElement;',
                     'const element = document.body.querySelector(":scope > #svelte") || document.currentScript.parentElement;')
            // debug markers around the SvelteKit boot (temporary)
            .replace(/\]\)\.then\(\(\[kit, app\]\) => \{/, ']).then(([kit, app]) => { window.__kitArrived = 1;')
            .replace(/kit\.start\(app, element, \{/, 'try { window.__kitStartCalled = 1; kit.start(app, element, {')
            .replace(/error: null\s*\}\);/, 'error: null }); window.__kitStarted = 1; } catch (e) { window.__kitErr = String(e && e.stack || e); }')
            .replace(/\]\)\.then\(\(\[kit, app\]\) => \{([\s\S]*?)\}\);\s*\}\s*<\/script>/, ']).then(([kit, app]) => {$1}).catch(e => { window.__bootErr = String(e && e.stack || e); });}</script>');
        }
        const csp = [
          "default-src 'self' data: blob:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
          "style-src 'self' 'unsafe-inline' data: https:",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https:",
          "connect-src 'self' data: blob:",
          "frame-src 'self' data:",
          "media-src 'self' data: blob:",
          "worker-src 'self' blob:",
        ].join('; ');
        res.writeHead(200, { 'Content-Type': MIME[ext], 'Content-Security-Policy': csp });
        res.end(html);
      });
      return;
    }
    // Subframe documents (saved_resource.html etc.) are served statically —
    // inject the console guard there too; runaway logging often lives in them.
    if (ext === '.html' || ext === '.htm') {
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] });
        res.end(injectConsoleGuard(html));
      });
      return;
    }
    serveFile(filePath, res);
    return;
  }

  // Static app files
  const filePath = path.join(APP_ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(APP_ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.access(filePath, err => {
    if (!err) { serveFile(filePath, res); return; }
    // Soft-404: saved snapshots reference site-absolute subresources
    // (e.g. Next.js /_next/static/css/…) that were never captured. A hard
    // 404 makes SPA runtimes abort hydration and blank the page, so when
    // the request comes from an asset page, return an empty 200 of the
    // right type instead.
    const ref = req.headers.referer || '';
    if (ref.includes('/assets/')) {
      const ext = path.extname(pathname).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end('');
      return;
    }
    console.log('[404] ' + pathname.slice(0, 140));
    res.writeHead(404); res.end('Not found');
  });

}).listen(PORT, '127.0.0.1', () => {
  console.log(`A11y Annotator → http://localhost:${PORT}`);
  console.log(`Place HTML files in: ${ASSETS_DIR}`);
});
