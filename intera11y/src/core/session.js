'use strict';
// Browser session for one page: the base page (the PageModel is read from it) and a factory for fresh pages
// (every mutating probe and tool gets its own freshly-loaded page, so nothing one step does can leak into
// another). All pages share one viewport, pinned before navigation.
const puppeteer = require('puppeteer');
const { awaitSettle } = require('../lib/v3.js');
const { CONFIG } = require('./config.js');
const { installHelpers, installListenerLog } = require('../model/inpage.js');
const { bounded } = require('./deadline.js');

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none',
  '--hide-scrollbars', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows'];

async function launchBrowser() {
  return puppeteer.launch({ executablePath: CONFIG.chromePath, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 180000 });
}

// Every page gets its own window. Tabs that share a window are background tabs, and Chromium throttles their
// timers and animation frames (measured on Linux headless: a keyboard walk that takes 8 s alone ran out its
// 10-minute limit with 24 pages open) — which also changes focus behaviour. A page in its own window is visible.
const newWindowPage = (browser) => browser.newPage({ type: 'window' });

async function openPage(browser, url, viewport = CONFIG.viewport) {
  const page = await newWindowPage(browser);
  await page.setViewport(viewport);
  // Each page must also behave as the focused page (focus events and :focus-visible differ on an unfocused one).
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
  // A native alert()/confirm() freezes the page's JS realm until dismissed; every page auto-dismisses and
  // records what was said (a native alert is how some pages identify errors — evidence for 3.3.1 / 4.1.3).
  page.__dialogs = [];
  page.on('dialog', (d) => { page.__dialogs.push({ type: d.type(), message: d.message() }); d.dismiss().catch(() => {}); });
  await page.evaluateOnNewDocument(installHelpers);
  await page.evaluateOnNewDocument(installListenerLog);
  let lastNav = Date.now();
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) lastNav = Date.now(); });
  // a slow page is tested as far as it loaded; a page that did not load at all (the server is down, a 4xx/5xx) is
  // an error — tested, its error page would read as a page with nothing to test
  const res = await page.goto(url, { waitUntil: 'load', timeout: CONFIG.navTimeoutMs }).catch((e) => ({ failed: e }));
  if (res && res.failed && !/timeout/i.test(String(res.failed.message))) { await page.close().catch(() => {}); throw new Error(`page did not load: ${String(res.failed.message).slice(0, 200)}`); }
  if (res && !res.failed && /^https?:/.test(url) && res.status() >= 400) { await page.close().catch(() => {}); throw new Error(`page did not load: HTTP ${res.status()}`); }
  await awaitSettle(page, { force: true, floorMs: CONFIG.settleFloorMs });
  // a page that reloads or redirects itself after its load event (a script's location.reload) is tested once it has
  // stopped navigating and has a document body: a probe started in between reads a document still being parsed
  // (document.body is null). Bounded: a page that keeps navigating is tested as it is at the limit.
  const until = Date.now() + CONFIG.navQuietMaxMs;
  let navigated = false;
  const loadedAt = lastNav;
  while (Date.now() < until) {
    if (Date.now() - lastNav >= CONFIG.navQuietMs) {
      const ready = await bounded(page.evaluate(() => document.readyState === 'complete' && !!document.body).catch(() => false), 5000, false);
      if (ready) break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  if (lastNav !== loadedAt) navigated = true;
  if (navigated) await awaitSettle(page, { force: true, floorMs: CONFIG.settleFloorMs });
  return page;
}

async function openSession(browser, url) {
  const page = await openPage(browser, url);
  const open = new Set([page]);
  const freshPage = async (viewport) => {
    const p = await openPage(browser, url, viewport || CONFIG.viewport);
    open.add(p);
    p.once('close', () => open.delete(p));
    return p;
  };
  // Runs fn on a fresh page and always closes it.
  const withFreshPage = async (fn, viewport) => {
    const p = await freshPage(viewport);
    try { return await fn(p); } finally { await bounded(p.close().catch(() => {}), 15000); }
  };
  // a page whose renderer hangs must not hold the session open
  const close = async () => { await Promise.all([...open].map((p) => bounded(p.close().catch(() => {}), 15000))); };
  return { url, page, freshPage, withFreshPage, close };
}

module.exports = { launchBrowser, openPage, openSession };
