'use strict';
// Uniform "give me a page, I'll give it back" for every lane, so they ALL share ONE browser pool when a driver
// provides it. Preference order:
//   (1) a shared tab ALLOCATOR — acquire()/release(): the global cap + FIFO + TIMER-PAUSE. The lane's work runs
//       inside fn() which starts AFTER acquire() resolves, so queue-wait is never charged to the lane's own
//       deadlines (goto timeout / VSR walk / CDP). This is the structural timer-pause, for free.
//   (2) a shared BROWSER — own tab on it (no global cap), closed after.
//   (3) legacy — launch + close an OWN browser (backward-compatible default when neither is supplied).
// The page is always returned/closed on every exit path (including fn() throwing).
const DEFAULT_CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function withLanePage(opts, fn) {
  const o = opts || {};
  if (o.tabAllocator) {
    const lease = await o.tabAllocator.acquire();
    try { return await fn(lease.page); } finally { await lease.release(); }
  }
  if (o.browser) {
    const page = await o.browser.newPage();
    try { return await fn(page); } finally { await page.close().catch(() => {}); }
  }
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: o.executablePath || DEFAULT_CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    try { return await fn(page); } finally { await page.close().catch(() => {}); }
  } finally { await browser.close().catch(() => {}); }
}

module.exports = { withLanePage };
