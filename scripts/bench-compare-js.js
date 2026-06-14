// Compare candidate counts and AT-role distribution with vs without JS.
// Loads each target page twice (one tab each) and reports the diff.

const puppeteer = require('puppeteer');

const SERVER = 'http://127.0.0.1:3001';
const TARGETS = process.argv.slice(2);
if (!TARGETS.length) {
  console.error('usage: node scripts/bench-compare-js.js <relPath1> <relPath2> ...');
  process.exit(1);
}

async function loadAndScan(browser, target, disableJs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  if (disableJs) await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('about:') || u.startsWith('blob:')) req.continue();
    else req.abort();
  });
  const url = SERVER + '/assets/' + target.split('/').map(encodeURIComponent).join('/');
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); }
  catch (_) {}
  await new Promise(r => setTimeout(r, 5000));
  const stats = await page.evaluate(() => {
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
      if (t==='a' || t==='area') return el.hasAttribute('href') ? 'link' : null;
      if (t==='input') {
        const tp = (el.getAttribute('type')||'text').toLowerCase();
        return ({checkbox:'checkbox',radio:'radio',button:'button',submit:'button',reset:'button',image:'button',range:'slider',search:'searchbox',number:'spinbutton',email:'textbox',password:'textbox',text:'textbox',tel:'textbox',url:'textbox'})[tp] || 'textbox';
      }
      return ({button:'button',select:'combobox',textarea:'textbox',summary:'button',details:'group'})[t] || null;
    }

    const all = document.querySelectorAll('*');
    let totalDom = all.length;
    let atFocusable = 0;
    const roleHist = {};
    for (const el of all) {
      if (isHidden(el)) continue;
      const role = getRole(el);
      const tab = isTabFocusable(el);
      const interactive = role && INTERACTIVE.has(role);
      if (tab || interactive) {
        atFocusable++;
        const key = role || 'focusable';
        roleHist[key] = (roleHist[key] || 0) + 1;
      }
    }
    return { totalDom, atFocusable, roleHist };
  });
  await page.close();
  return stats;
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
    let withJs = null, noJs = null;
    try { withJs = await loadAndScan(browser, t, false); } catch (e) { console.log('  with JS    FAIL:', e.message); }
    try { noJs  = await loadAndScan(browser, t, true);  } catch (e) { console.log('  no JS      FAIL:', e.message); }
    if (withJs) console.log(`  with JS    DOM=${withJs.totalDom}  AT-focusable=${withJs.atFocusable}`);
    if (noJs)   console.log(`  no JS      DOM=${noJs.totalDom}  AT-focusable=${noJs.atFocusable}`);
    if (withJs && noJs) {
      const allRoles = new Set([...Object.keys(withJs.roleHist), ...Object.keys(noJs.roleHist)]);
      const diffs = [];
      for (const r of allRoles) {
        const a = withJs.roleHist[r] || 0, b = noJs.roleHist[r] || 0;
        if (a !== b) diffs.push(`${r}: ${a}→${b}`);
      }
      console.log('  role diffs:', diffs.length ? diffs.join(', ') : '(identical)');
    }
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
