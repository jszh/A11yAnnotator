// Audit toolkit surfaces OTHER than SR navigation (covered by sr-audit.js).
// Read-only: never modifies pages.
//
// Usage: node scripts/toolkit-audit.js [--phase inframe|props|all] [--count 120] [--seed 99]
//
// Phase "inframe" (all Saved pages, annotator iframe, no AX engine):
//   1. xpath round-trip: getXPath(el) -> document.evaluate -> same node?
//   2. mkId hash collisions: distinct xpaths hashing to the same a11yId
//   3. tab-order tool: entries hidden by an ancestor, zero-rect entries,
//      closed-details leaks, contenteditable=false leaks; visible tabbables
//      MISSING from the order (summary, audio/video[controls], iframe)
//   4. sample-highlight resolver: does resolve() (xpath -> elId -> tag+name)
//      pick the same node the xpath resolves to? duplicate sample xpaths?
//   5. axe integration: does the scan complete, how many node targets get an aid
//
// Phase "props" (seeded element sample, uses /ax-node):
//   front-end property panel (getRole / getA11yName / isFocusable heuristics)
//   vs Chrome's real AX tree (role / name / focusable from CDP).

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const PHASE = flag('phase', 'all');
const COUNT = parseInt(flag('count', '120'), 10);
const SEED = parseInt(flag('seed', '99'), 10);
const BASE = 'http://127.0.0.1:3001';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chromePath() {
  const guesses = [process.env.PUPPETEER_EXECUTABLE_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
}

async function fetchJson(url, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: ctl.signal });
    const j = await r.json();
    return { ok: true, ms: Date.now() - t0, data: j };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, err: e.name === 'AbortError' ? 'timeout' : String(e.message).slice(0, 80) };
  } finally { clearTimeout(t); }
}

function loadMeta() {
  const pagesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
  const pageList = Array.isArray(pagesJson) ? pagesJson : pagesJson.pages;
  const meta = {};
  for (const p of pageList) {
    if (p.group !== 'Saved') continue;
    const rel = (p.subdir ? p.subdir + '/' : '') + p.file;
    meta[rel] = { value: rel, noscript: !!p.noscript, name: p.name };
  }
  return meta;
}

// ── in-frame audit, executed inside the annotator iframe ─────────────────────
// Relies on INJECT_JS globals: getXPath, getTabOrder. `samples` is this page's
// sample list ({xpath,tag,name}).
function inFrameAudit(samples) {
  const out = { injected: typeof getXPath === 'function' && typeof getTabOrder === 'function' };
  if (!out.injected) return out;

  // 1+2: xpath round-trip + mkId collisions
  const all = Array.from(document.querySelectorAll('*'))
    .filter(e => !/^(SCRIPT|STYLE)$/.test(e.tagName) || e.namespaceURI !== 'http://www.w3.org/1999/xhtml');
  const CAP = 20000;
  const els = all.slice(0, CAP);
  out.totalElements = all.length;
  out.roundTripTested = els.length;
  const fails = [];
  const hashes = new Map();
  const collisions = [];
  for (const el of els) {
    let xp = '';
    try { xp = getXPath(el); } catch (e) { fails.push({ tag: el.tagName, ns: el.namespaceURI, err: String(e).slice(0, 60) }); continue; }
    let h = 5381;
    for (let i = 0; i < xp.length; i++) { h = ((h << 5) + h) ^ xp.charCodeAt(i); h = h >>> 0; }
    const key = 'x' + h.toString(36);
    if (hashes.has(key) && hashes.get(key) !== xp) collisions.push([hashes.get(key).slice(-70), xp.slice(-70)]);
    else hashes.set(key, xp);
    let node = null;
    try { node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } catch (e) {}
    if (node !== el) fails.push({ tag: el.tagName, ns: (el.namespaceURI || '').split('/').pop(), xpath: xp.slice(-110), resolvedTo: node ? node.tagName : null });
  }
  out.roundTripFails = fails.length;
  out.roundTripCamelCase = fails.filter(f => f.tag && f.tag !== f.tag.toUpperCase() && f.tag !== f.tag.toLowerCase()).length;
  out.roundTripExamples = fails.slice(0, 8);
  out.aidCollisions = collisions.length;
  out.aidCollisionExamples = collisions.slice(0, 4);

  // 3: tab-order issues
  const order = getTabOrder();
  out.tabOrderLen = order.length;
  const hiddenAnc = [], zeroRect = [], closedDet = [], ceFalse = [];
  const inOrder = new Set(order);
  order.forEach((el, i) => {
    const brief = { i, tag: el.tagName.toLowerCase(), id: el.id || '', txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) };
    let a = el.parentElement;
    while (a && a.tagName !== 'HTML') {
      if (getComputedStyle(a).display === 'none') { hiddenAnc.push({ ...brief, by: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') }); break; }
      a = a.parentElement;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) zeroRect.push(brief);
    const det = el.closest('details:not([open])');
    if (det && !(el.tagName === 'SUMMARY' && det.querySelector('summary') === el)) closedDet.push(brief);
    if (el.matches('[contenteditable]') && el.contentEditable !== 'true' &&
        el.getAttribute('tabindex') === null &&
        !el.matches('a[href],area[href],button,input,select,textarea')) ceFalse.push(brief);
  });
  const missing = [];
  document.querySelectorAll('summary, audio[controls], video[controls], iframe').forEach(el => {
    if (inOrder.has(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    let a = el;
    while (a && a.tagName !== 'HTML') { if (getComputedStyle(a).display === 'none' || getComputedStyle(a).visibility === 'hidden') return; a = a.parentElement; }
    missing.push({ tag: el.tagName.toLowerCase(), id: el.id || '', txt: (el.textContent || '').trim().slice(0, 40) });
  });
  out.tabIssues = {
    hiddenAncestorN: hiddenAnc.length, hiddenAncestor: hiddenAnc.slice(0, 6),
    zeroRectN: zeroRect.length, zeroRect: zeroRect.slice(0, 6),
    closedDetailsN: closedDet.length, closedDetails: closedDet.slice(0, 4),
    contenteditableFalseN: ceFalse.length, contenteditableFalse: ceFalse.slice(0, 4),
    missingTabbableN: missing.length, missingTabbable: missing.slice(0, 6),
  };

  // 4: sample-highlight resolver (replicates SAMPLE_INJECT_JS resolve())
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const claimed = new Set();
  let viaXpath = 0, viaMeta = 0, viaNone = 0, mismatches = [];
  const seenXp = new Set(); let dupXpaths = 0;
  for (const s of samples) {
    if (seenXp.has(s.xpath)) dupXpaths++; seenXp.add(s.xpath);
    let truth = null;
    try { truth = document.evaluate(s.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } catch (e) {}
    let el = (truth && !claimed.has(truth)) ? truth : null;
    let via = el ? 'xpath' : null;
    if (!el && s.elId) { const c = document.getElementById(s.elId); if (c && !claimed.has(c)) { el = c; via = 'elId'; } }
    if (!el) {
      const key = norm(s.name).slice(0, 40);
      if (s.tag && key) {
        const cands = document.getElementsByTagName(s.tag);
        for (let i = 0; i < cands.length; i++) {
          const c = cands[i];
          if (claimed.has(c)) continue;
          const al = norm(c.getAttribute && c.getAttribute('aria-label'));
          const tx = norm(c.textContent).slice(0, 120);
          if ((al && al.slice(0, 40) === key) || (tx && tx.slice(0, 40) === key)) { el = c; via = 'meta'; break; }
        }
      }
    }
    if (el) claimed.add(el);
    if (via === 'xpath') viaXpath++; else if (via) viaMeta++; else viaNone++;
    if (truth && el && el !== truth) mismatches.push({ xpath: s.xpath.slice(-90), via, pickedTag: el.tagName, truthTag: truth.tagName });
  }
  out.sampleResolver = { n: samples.length, viaXpath, viaMeta, viaNone, dupXpaths, mismatchN: mismatches.length, mismatches: mismatches.slice(0, 6) };
  return out;
}

// front-end property snapshot for one element (runs in iframe)
function feProps(xp) {
  try {
    const el = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!el) return null;
    return { tag: el.tagName.toLowerCase(), role: getRole(el), name: getA11yName(el), focusable: isFocusable(el) };
  } catch (e) { return { err: String(e).slice(0, 80) }; }
}

async function main() {
  const meta = loadMeta();
  const samplesAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/samples-saved.json'), 'utf8'));

  const RECYCLE_EVERY = 6;
  let browser = null, page = null;
  async function freshBrowser() {
    if (browser) { try { await browser.close(); } catch (e) {} }
    browser = await puppeteer.launch({ headless: true, executablePath: chromePath(), args: ['--no-sandbox'], protocolTimeout: 180000 });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('assetSelect') && document.getElementById('assetSelect').options.length > 1, { timeout: 30000 });
    // capture axe + sample-status messages from the iframe
    await page.evaluate(() => {
      window.__axeResults = null;
      window.__sampleStatus = null;
      window.addEventListener('message', e => {
        const d = e.data;
        if (!d) return;
        if (d.t === 'axe') {
          const nodes = (d.violations || []).flatMap(v => v.nodes || []);
          window.__axeResults = {
            violations: (d.violations || []).length,
            error: d.error || null,
            nodes: nodes.length,
            nodesWithAid: nodes.filter(n => n.aid).length,
          };
        }
        if (d.t === 'sample-status') window.__sampleStatus = { resolved: d.resolved, total: d.total };
      });
    });
  }
  async function selectPage(value) {
    await page.evaluate(() => { window.__axeResults = null; window.__sampleStatus = null; });
    const found = await page.evaluate(v => {
      const sel = document.getElementById('assetSelect');
      for (const o of sel.options) if (o.value === v) { sel.value = v; sel.dispatchEvent(new Event('change')); return true; }
      return false;
    }, value);
    if (!found) return null;
    await new Promise(r => setTimeout(r, 7000));
    return page.mainFrame().childFrames()[0] || null;
  }

  // resume support: merge any previous partial run
  let report = { inframe: {}, props: [] };
  if (args.includes('--resume') && fs.existsSync('/tmp/toolkit-audit.json')) {
    try { report = JSON.parse(fs.readFileSync('/tmp/toolkit-audit.json', 'utf8')); report.props = report.props || []; } catch (e) {}
  }

  // ── Phase 1: in-frame audits over all Saved pages ──────────────────────────
  if (PHASE === 'all' || PHASE === 'inframe') {
    await freshBrowser();
    const rels = Object.keys(meta);
    let pi = 0;
    let done = 0;
    for (const rel of rels) {
      pi++;
      if (report.inframe[rel] && !report.inframe[rel].fatal) continue; // resumed
      done++;
      if (done > 1 && (done - 1) % RECYCLE_EVERY === 0) { process.stdout.write('(recycle) '); await freshBrowser(); }
      process.stdout.write(`[${pi}/${rels.length}] ${rel.slice(6, 55)} `);
      const frame = await selectPage(rel);
      if (!frame) { console.log('— NO IFRAME'); report.inframe[rel] = { fatal: 'no iframe' }; continue; }
      const samples = [];
      const entry = samplesAll[rel];
      if (entry && entry.sampled) for (const list of Object.values(entry.sampled)) for (const it of list) samples.push({ xpath: it.xpath, tag: it.tag || '', name: it.name || '', elId: it.elId || '' });
      let res;
      try {
        res = await frame.evaluate(inFrameAudit, samples);
        if (res && res.injected === false) { // injection late — wait and retry once
          await new Promise(r => setTimeout(r, 8000));
          const frame2 = page.mainFrame().childFrames()[0];
          res = frame2 ? await frame2.evaluate(inFrameAudit, samples) : res;
        }
      } catch (e) { res = { fatal: String(e.message).slice(0, 120) }; }
      if (res && !res.fatal && res.injected === false) res.fatal = 'INJECT_JS helpers missing in iframe';
      // wait up to 25 more seconds for axe to finish
      let axe = null, sampleStatus = null;
      for (let i = 0; i < 25; i++) {
        ({ axe, sampleStatus } = await page.evaluate(() => ({ axe: window.__axeResults, sampleStatus: window.__sampleStatus })));
        if (axe) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      res.axe = axe;
      res.uiSampleStatus = sampleStatus;
      report.inframe[rel] = res;
      const ti = res.tabIssues || {}, sr = res.sampleResolver || {};
      console.log(res.fatal ? '— FATAL: ' + res.fatal :
        `rt:${res.roundTripFails}/${res.roundTripTested} col:${res.aidCollisions} tab:${res.tabOrderLen}(h${ti.hiddenAncestorN},z${ti.zeroRectN},m${ti.missingTabbableN}) smp:${sr.viaXpath}/${sr.n}${sr.mismatchN ? '!MM' + sr.mismatchN : ''} axe:${axe ? (axe.error ? 'ERR' : axe.violations) : 'none'}`);
      fs.writeFileSync('/tmp/toolkit-audit.json', JSON.stringify(report, null, 1));
    }
  }

  // ── Phase 2: property accuracy on seeded sample ────────────────────────────
  if (PHASE === 'all' || PHASE === 'props') {
    const all = [];
    for (const [rel, pageEntry] of Object.entries(samplesAll))
      for (const els of Object.values(pageEntry.sampled || {}))
        for (const el of els) all.push({ rel, ...el });
    all.sort((a, b) => (a.rel + a.xpath).localeCompare(b.rel + b.xpath));
    const rand = mulberry32(SEED);
    for (let i = 0; i < Math.min(COUNT, all.length); i++) {
      const j = i + Math.floor(rand() * (all.length - i));
      [all[i], all[j]] = [all[j], all[i]];
    }
    let picked = all.slice(0, Math.min(COUNT, all.length));
    const haveProps = new Set(report.props.map(p => p.rel + '|' + p.xpath));
    picked = picked.filter(el => !haveProps.has(el.rel + '|' + el.xpath));
    const byPage = new Map();
    for (const el of picked) {
      if (!byPage.has(el.rel)) byPage.set(el.rel, []);
      byPage.get(el.rel).push(el);
    }
    console.log(`\nprops phase: ${picked.length} elements across ${byPage.size} pages (seed ${SEED})`);
    await freshBrowser();
    let pi = 0;
    for (const [rel, els] of byPage) {
      pi++;
      if (pi > 1 && (pi - 1) % RECYCLE_EVERY === 0) { process.stdout.write('(recycle) '); await freshBrowser(); }
      process.stdout.write(`[${pi}/${byPage.size}] ${rel.slice(6, 55)} (${els.length}) `);
      const frame = await selectPage(rel);
      if (!frame) { console.log('— NO IFRAME'); continue; }
      for (const el of els) {
        const fe = await frame.evaluate(feProps, el.xpath).catch(e => ({ err: String(e.message).slice(0, 80) }));
        const q = 'file=' + encodeURIComponent(rel) + '&xpath=' + encodeURIComponent(el.xpath);
        const ax = await fetchJson(`${BASE}/ax-node?${q}`, 60000);
        report.props.push({
          rel, xpath: el.xpath, tag: el.tag,
          fe,
          ax: ax.ok ? ax.data : { err: ax.err },
        });
        process.stdout.write('.');
      }
      console.log('');
      fs.writeFileSync('/tmp/toolkit-audit.json', JSON.stringify(report, null, 1));
    }
  }

  if (browser) await browser.close();
  fs.writeFileSync('/tmp/toolkit-audit.json', JSON.stringify(report, null, 1));
  console.log('\nwrote /tmp/toolkit-audit.json');
}

main().catch(e => { console.error(e); process.exit(1); });
