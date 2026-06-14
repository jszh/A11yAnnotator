// Can we sample a page that has hung JS by pausing the debugger first?
// 1. Load the page (JS enabled), let it hang.
// 2. CDP: Debugger.enable + Debugger.pause — V8 can interrupt at safepoints.
// 3. Run the scan script via Runtime.evaluate while paused.
// 4. Compare against the no-JS baseline for the same page.

const puppeteer = require('puppeteer');

const SERVER = 'http://127.0.0.1:3001';
const TARGETS = process.argv.slice(2);
if (!TARGETS.length) {
  console.error('usage: node scripts/bench-hang-sample.js <relPath> ...');
  process.exit(1);
}

// Scan script as a string so we can pass to Runtime.evaluate
const SCAN_SCRIPT = `(() => {
  const INTERACTIVE = new Set(['button','link','checkbox','radio','switch','tab','menuitem','menuitemcheckbox','menuitemradio','option','combobox','textbox','searchbox','spinbutton','slider','listbox','treeitem','gridcell']);
  function isHidden(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.hasAttribute('hidden')) return true;
    let cur = el;
    while (cur && cur.nodeType === 1) {
      if (cur.hasAttribute('inert')) return true;
      if (cur.getAttribute('aria-hidden') === 'true') return true;
      const cs = getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
      if (parseFloat(cs.opacity) === 0) return true;
      cur = cur.parentElement;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return true;
    return false;
  }
  function isTabFocusable(el) {
    const ti = el.getAttribute('tabindex');
    if (ti !== null) return parseInt(ti, 10) >= 0;
    if (el.disabled) return false;
    const t = el.tagName.toLowerCase();
    if ((t==='a'||t==='area') && el.hasAttribute('href')) return true;
    if (['button','input','select','textarea'].includes(t)) return true;
    if (el.isContentEditable) return true;
    return false;
  }
  function getRole(el) {
    const r = el.getAttribute('role'); if (r) return r;
    const t = el.tagName.toLowerCase();
    if (t==='a'||t==='area') return el.hasAttribute('href') ? 'link' : null;
    if (t==='input') {
      const tp = (el.getAttribute('type')||'text').toLowerCase();
      return ({checkbox:'checkbox',radio:'radio',button:'button',submit:'button',reset:'button',image:'button',range:'slider',search:'searchbox',number:'spinbutton',email:'textbox',password:'textbox',text:'textbox',tel:'textbox',url:'textbox'})[tp] || 'textbox';
    }
    return ({button:'button',select:'combobox',textarea:'textbox',summary:'button',details:'group'})[t] || null;
  }

  const all = document.querySelectorAll('*');
  let atFocusable = 0;
  const roleHist = {};
  for (const el of all) {
    if (isHidden(el)) continue;
    const role = getRole(el);
    if (isTabFocusable(el) || (role && INTERACTIVE.has(role))) {
      atFocusable++;
      const key = role || 'focusable';
      roleHist[key] = (roleHist[key] || 0) + 1;
    }
  }
  return JSON.stringify({ totalDom: all.length, atFocusable, roleHist });
})()`;

async function setupPage(browser, disableJs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  if (disableJs) await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('about:') || u.startsWith('blob:')) req.continue();
    else req.abort();
  });
  return page;
}

async function tryHangSample(browser, target) {
  const page = await setupPage(browser, false);
  const cdp  = await page.createCDPSession();
  const url  = SERVER + '/assets/' + target.split('/').map(encodeURIComponent).join('/');

  // Kick off goto but don't await — it'll hang.
  const gotoP = page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => 'nav-timed-out');
  // Give the page a few seconds to start running its JS so the DOM is somewhat populated.
  await new Promise(r => setTimeout(r, 8000));

  // Pause the JS engine. This issues an interrupt that V8 honors at the next safepoint
  // even inside a synchronous busy-loop.
  await cdp.send('Debugger.enable');
  await cdp.send('Debugger.pause');
  // small delay for the pause to take effect
  await new Promise(r => setTimeout(r, 500));

  // Evaluate the scan. Runtime.evaluate runs even while the debugger is paused.
  let result;
  try {
    const t0 = Date.now();
    const res = await cdp.send('Runtime.evaluate', {
      expression: SCAN_SCRIPT,
      returnByValue: true,
      awaitPromise: false,
      timeout: 60000,
    });
    const ms = Date.now() - t0;
    if (res.exceptionDetails) {
      result = { error: res.exceptionDetails.text };
    } else {
      const v = res.result.value;
      const parsed = typeof v === 'string' ? JSON.parse(v) : v;
      result = { ...parsed, ms };
    }
  } catch (e) {
    result = { error: e.message };
  }

  // Resume so we can clean up
  try { await cdp.send('Debugger.resume'); } catch {}
  try { await cdp.detach(); } catch {}
  await page.close();
  return result;
}

async function noJsSample(browser, target) {
  const page = await setupPage(browser, true);
  const url  = SERVER + '/assets/' + target.split('/').map(encodeURIComponent).join('/');
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (_) {}
  await new Promise(r => setTimeout(r, 5000));
  const res = await page.evaluate(SCAN_SCRIPT);
  await page.close();
  return typeof res === 'string' ? JSON.parse(res) : res;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    protocolTimeout: 240000,
  });

  for (const t of TARGETS) {
    console.log(`\n# ${t}`);
    let hang = null, noJs = null;
    try { hang = await tryHangSample(browser, t); }
    catch (e) { hang = { error: e.message }; }
    try { noJs = await noJsSample(browser, t); }
    catch (e) { noJs = { error: e.message }; }
    console.log('  hang-paused:', JSON.stringify(hang));
    console.log('  no-JS      :', JSON.stringify(noJs));
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
