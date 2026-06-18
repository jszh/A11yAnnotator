'use strict';
// Empirical probe for the iframe/image/zero-element noObligation cases (task ask #2/#3).
// For each target testcase: load the page, inspect the RAW DOM independently of the collector
// (img/iframe/canvas/svg existence, naturalWidth, client/bounding box, computed role, aria-hidden,
// src resolution), then run collectActPage + deriveObligations, and probe iframe traversal.
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const PAGES = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');

const TARGETS = [
  { code: 'akn7bn', sc: '2.1.1', tc: '62673162e22ee1e95e962522b1d1c3b549dbfc49', note: 'iframe srcdoc tabindex=-1' },
  { code: '4b1c6c', sc: '4.1.2', tc: 'c1cc2a71e88c5fec2bc41175d63339404747bf00', note: 'two iframes title=List of Contributors' },
  { code: '4b1c6c', sc: '4.1.2', tc: 'ac65ce86f38bce79d12b797567bb8d85875aab88', note: 'two iframes aria-label' },
  { code: '4b1c6c', sc: '4.1.2', tc: '4d33680e81b31e47fc46d3b6543cc050e369525b', note: 'mixed title/aria-label' },
  { code: 'qt1vmo', sc: '1.1.1', tc: 'bac67a5a2ada971100bbec89961ad3e6c869f268', note: 'canvas aria-label' },
  { code: '0va7u6', sc: '1.4.5', tc: 'bf023941401d04f61ce739ee10fcc15f87d298a7', note: 'div background-image' },
  { code: '0va7u6', sc: '1.4.5', tc: '45041ac39ebf8f9d8ff642ea0bb56e947f0ac76e', note: 'input type=image' },
  { code: 'e88epe', sc: '1.1.1', tc: '9ff50232e74195770418bcfb23c1508dfcef639a', note: 'img role=none alt' },
  { code: 'e88epe', sc: '1.1.1', tc: '0d0061ffdf406f0d9b21aaa00f5d557e4137e0b2', note: 'inline svg' },
  { code: 'e88epe', sc: '1.1.1', tc: '6d108d00cc7a54f66547f02d7e7606342b11f801', note: 'canvas fillText' },
];

// Raw-DOM inspector, run IN PAGE. Walks top document only (mirrors collector scope).
function inPageInspect() {
  function rect(el) { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }
  function computedRole(el) {
    // approximate: explicit role attr wins; else native role for known tags
    const ra = el.getAttribute('role');
    if (ra) return 'role=' + ra;
    const t = el.tagName.toLowerCase();
    return 'native:' + t;
  }
  const out = { url: location.href, title: document.title, imgs: [], iframes: [], canvases: [], svgs: [], inputImages: [], bgImageDivs: [] };
  for (const el of document.querySelectorAll('img')) {
    out.imgs.push({
      src: el.getAttribute('src'), currentSrc: el.currentSrc, complete: el.complete,
      naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight,
      clientWidth: el.clientWidth, clientHeight: el.clientHeight, box: rect(el),
      roleAttr: el.getAttribute('role'), ariaHidden: el.getAttribute('aria-hidden'),
      alt: el.getAttribute('alt'), computedDisplay: getComputedStyle(el).display,
    });
  }
  for (const el of document.querySelectorAll('input[type=image]')) {
    out.inputImages.push({
      src: el.getAttribute('src'), alt: el.getAttribute('alt'),
      naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight,
      box: rect(el), roleAttr: el.getAttribute('role'), ariaHidden: el.getAttribute('aria-hidden'),
    });
  }
  for (const el of document.querySelectorAll('iframe')) {
    out.iframes.push({
      src: el.getAttribute('src'), srcdoc: el.getAttribute('srcdoc') ? '(srcdoc present)' : null,
      title: el.getAttribute('title'), ariaLabel: el.getAttribute('aria-label'),
      tabindex: el.getAttribute('tabindex'), roleAttr: el.getAttribute('role'),
      ariaHidden: el.getAttribute('aria-hidden'), box: rect(el),
      hasContentDocument: !!el.contentDocument,
    });
  }
  for (const el of document.querySelectorAll('canvas')) {
    out.canvases.push({ id: el.id, width: el.width, height: el.height, box: rect(el), ariaLabel: el.getAttribute('aria-label'), roleAttr: el.getAttribute('role') });
  }
  for (const el of document.querySelectorAll('svg')) {
    out.svgs.push({ box: rect(el), roleAttr: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label'), ariaHidden: el.getAttribute('aria-hidden') });
  }
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none' && bg.includes('url(')) out.bgImageDivs.push({ tag: el.tagName.toLowerCase(), bg: bg.slice(0, 80), box: rect(el) });
  }
  // childFrame walk: same-origin reachability + element counts
  out.frameWalk = [];
  for (const fr of document.querySelectorAll('iframe')) {
    let info = { src: fr.getAttribute('src'), reachable: false };
    try {
      const doc = fr.contentDocument;
      if (doc) {
        info.reachable = true;
        info.bodyEls = doc.querySelectorAll('body *').length;
        info.title = doc.title;
        info.focusableInside = doc.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').length;
        info.firstLink = (doc.querySelector('a[href]') || {}).outerHTML || null;
      }
    } catch (e) { info.error = String(e).slice(0, 80); }
    out.frameWalk.push(info);
  }
  return out;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  for (const t of TARGETS) {
    const localPath = path.join(PAGES, t.code, t.tc + '.html');
    const url = 'file://' + localPath;
    const page = await browser.newPage();
    const consoleErrs = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 120)); });
    const failedReq = [];
    page.on('requestfailed', (r) => failedReq.push(r.url().split('/').pop() + ' :: ' + (r.failure() && r.failure().errorText)));
    let raw, collect, obls, oblScs;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 350)); // let canvas/img settle
      raw = await page.evaluate(inPageInspect);
      // separate page for collect (collectActPage navigates itself)
      const page2 = await browser.newPage();
      collect = normalizeCollectRoles(await collectActPage(page2, { url, elementCap: 80, file: 'probe:' + t.code, runId: 'probe', sourceUrl: url }));
      await page2.close();
      obls = oracle.deriveObligations(collect);
      oblScs = [...new Set(obls.map((o) => o.sc))].sort();
    } catch (e) {
      raw = { error: String(e.stack || e).slice(0, 300) };
    }
    await page.close();
    console.log('\n================================================================');
    console.log(`### ${t.code}/${t.tc.slice(0, 8)}  SC=${t.sc}  (${t.note})`);
    console.log('  failedRequests:', failedReq.length ? failedReq : 'none');
    console.log('  consoleErrors:', consoleErrs.length ? consoleErrs : 'none');
    console.log('  RAW DOM:', JSON.stringify(raw, null, 2));
    if (collect) {
      const els = (collect.elements || []).map((e) => ({ tag: e.tag, role: e.sampledRole || e.roleAttr, roleAttr: e.roleAttr, focusable: e.focusable, box: e.box, axName: e.axName }));
      console.log('  COLLECT elementCount:', collect.elementCount, 'elements:', JSON.stringify(els));
      console.log('  deriveObligations SCs:', oblScs, ' (in-scope', t.sc, oblScs.includes(t.sc) ? 'PRESENT' : 'ABSENT', ')');
    }
  }
  await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
