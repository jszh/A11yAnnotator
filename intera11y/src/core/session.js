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
  await page.goto(url, { waitUntil: 'load', timeout: CONFIG.navTimeoutMs }).catch(() => {});
  await awaitSettle(page, { force: true, floorMs: CONFIG.settleFloorMs });
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
