#!/usr/bin/env node
/**
 * enrich-sample.js - resolve every sampled case against the real page and
 * attach a human-readable descriptor.
 *
 * This is both an enrichment and a validation pass. A case whose xpath does
 * not resolve is unusable in the study (there would be nothing to highlight),
 * so the run fails loudly on any unresolved xpath rather than quietly shipping
 * a task that renders an empty box. Every page is loaded once and all of its
 * cases are probed in that one load.
 *
 * The descriptor (role / accessible name / text / geometry) is for the
 * OPERATOR's console only - it is never sent to the participant, who is meant
 * to judge the element as rendered, not read a summary of it.
 *
 * Usage: node eval/human-study/enrich-sample.js [--sample=<file>] [--asset-base=http://127.0.0.1:3001]
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');
const BASE = args['asset-base'] || 'http://127.0.0.1:3001';
const SETTLE_MS = Number(args.settle || 1500);
const NAV_TIMEOUT = Number(args['nav-timeout'] || 60000);

const assetUrl = (p) => `${BASE}/assets/${p.assetDir}/${encodeURIComponent(p.file)}${p.query}`;

const PROBE_ATTR = 'data-a11ystudy-probe';
const { source: RESOLVER_SRC } = require('./public/resolve-xpath.js');

async function probePage(page, cases) {
  // Resolve every xpath in one shot and stamp a probe attribute so the
  // accessibility lookup can find the node through CDP afterwards. The
  // resolver is the shared structural walker, not document.evaluate - see
  // public/resolve-xpath.js for why (SVG namespaces).
  const resolved = await page.evaluate((xpaths, attr, resolverSrc) => {
    // eslint-disable-next-line no-new-func
    const resolve = new Function(`${resolverSrc}; return resolveStudyXpath;`)();
    const out = [];
    xpaths.forEach((xp, i) => {
      let el = null;
      try { el = resolve(xp, document); } catch (e) { /* treated as unresolved below */ }
      if (!el) { out.push({ i, ok: false }); return; }
      el.setAttribute(attr, String(i));
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      out.push({
        i,
        ok: true,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: typeof el.className === 'string' ? el.className.slice(0, 160) || null : null,
        roleAttr: el.getAttribute('role'),
        type: el.getAttribute('type'),
        alt: el.getAttribute('alt'),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        href: el.getAttribute('href') ? el.getAttribute('href').slice(0, 200) : null,
        text: text.slice(0, 200),
        textLength: text.length,
        focusableAttr: el.hasAttribute('tabindex') ? el.getAttribute('tabindex') : null,
        // Descriptive only - the client asks the browser instead of guessing -
        // but it still has to be right, because the operator reads it and the
        // end-to-end test picks its fixtures from it. <video>/<audio> are
        // focusable only with `controls`; a disabled control is not focusable;
        // <iframe> is not focusable as an element.
        nativelyFocusable: (function () {
          var t = el.tagName.toLowerCase();
          if (el.disabled) return false;
          if (el.hasAttribute('tabindex')) return el.getAttribute('tabindex') !== '-1';
          if (t === 'a' || t === 'area') return el.hasAttribute('href');
          if (t === 'input') return el.type !== 'hidden';
          if (t === 'video' || t === 'audio') return el.hasAttribute('controls');
          if (el.isContentEditable) return true;
          return /^(button|textarea|select|summary)$/.test(t);
        })(),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        pageY: Math.round(r.y + (window.scrollY || 0)),
        docHeight: Math.round(document.documentElement.scrollHeight),
        hidden: cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0 ||
          el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true',
        zeroSize: r.width === 0 || r.height === 0,
        outerHTMLHead: (el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 300),
      });
    });
    return out;
  }, cases.map((c) => c.xpath), PROBE_ATTR, RESOLVER_SRC);

  // Accessible role + name straight from the browser's own a11y tree.
  // page.accessibility.snapshot({root}) rather than a hand-rolled CDP session:
  // object ids belong to the session that produced them, so DOM.describeNode on
  // a freshly-created session cannot resolve a handle puppeteer minted on its
  // own - it fails with "Could not find object with given id" for every single
  // element, and the failure is per-element and swallowed, so the run still
  // reports success with an empty role and name everywhere.
  for (const r of resolved) {
    if (!r.ok) continue;
    let h = null;
    try {
      h = await page.$(`[${PROBE_ATTR}="${r.i}"]`);
      if (!h) continue;
      const ax = await page.accessibility.snapshot({ root: h, interestingOnly: false });
      if (ax) {
        r.axRole = ax.role || null;
        r.axName = ax.name || null;
        r.axIgnored = ax.role === 'none' || ax.role === 'presentation' || !!ax.ignored;
      } else {
        r.axIgnored = true; // not in the accessibility tree at all
      }
    } catch (e) { r.axError = String(e && e.message || e); }
    finally { if (h) await h.dispose().catch(() => {}); }
  }
  await page.evaluate((attr) => {
    for (const el of document.querySelectorAll(`[${attr}]`)) el.removeAttribute(attr);
  }, PROBE_ATTR).catch(() => {});
  return resolved;
}

(async () => {
  const doc = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
  // Page-scope obligations carry a `/page-level::<family>` pseudo-path and have
  // no node; they are valid study tasks (the participant judges the page), so
  // mark them resolved-by-scope and keep them out of the element probe.
  for (const c of doc.cases.filter((x) => x.scope === 'page')) { c.element = null; c.resolved = true; }
  const byPage = new Map();
  for (const c of doc.cases.filter((x) => x.scope !== 'page')) {
    if (!byPage.has(c.page.file)) byPage.set(c.page.file, []);
    byPage.get(c.page.file).push(c);
  }
  const elementCases = doc.cases.filter((x) => x.scope !== 'page').length;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const failures = [];
  let done = 0;
  try {
    for (const [file, cases] of byPage) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      const url = assetUrl(cases[0].page);
      let navError = null;
      try {
        await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT });
      } catch (e) { navError = String(e && e.message || e); }
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      let probes = [];
      try {
        probes = await probePage(page, cases);
      } catch (e) { navError = (navError ? navError + ' | ' : '') + String(e && e.message || e); }
      cases.forEach((c, i) => {
        const p = probes.find((x) => x.i === i);
        c.element = p && p.ok ? p : null;
        c.resolved = !!(p && p.ok);
        if (!c.resolved) failures.push({ caseId: c.caseId, page: file, sc: c.sc, xpath: c.xpath, navError });
      });
      done += cases.length;
      const bad = cases.filter((c) => !c.resolved).length;
      console.log(`  ${String(done).padStart(3)}/${elementCases}  ${file.slice(0, 48).padEnd(48)} ${cases.length} case(s)${bad ? `  UNRESOLVED ${bad}` : ''}${navError ? `  nav: ${navError.slice(0, 60)}` : ''}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const el = doc.cases.map((c) => c.element).filter(Boolean);
  doc.enrichedAt = new Date().toISOString();
  doc.enrichment = {
    assetBase: BASE,
    elementCases,
    pageScopeCases: doc.cases.length - elementCases,
    resolved: el.length,
    unresolved: failures.length,
    hidden: el.filter((e) => e.hidden).length,
    zeroSize: el.filter((e) => e.zeroSize).length,
    belowFold: el.filter((e) => e.pageY > 900).length,
    axIgnored: el.filter((e) => e.axIgnored).length,
    failures,
  };
  fs.writeFileSync(SAMPLE, JSON.stringify(doc, null, 2));

  console.log(`\nresolved ${el.length}/${elementCases} element-scope cases (+${doc.cases.length - elementCases} page-scope, nothing to resolve)`);
  console.log(`  hidden ${doc.enrichment.hidden}  zero-size ${doc.enrichment.zeroSize}  below-fold ${doc.enrichment.belowFold}  ax-ignored ${doc.enrichment.axIgnored}`);
  if (failures.length) {
    console.error(`\nFAIL - ${failures.length} case(s) did not resolve; they cannot be shown to a participant:`);
    for (const f of failures.slice(0, 20)) console.error(`  ${f.caseId} ${f.sc} ${f.page}\n    ${f.xpath}`);
    process.exit(1);
  }
  console.log('OK - every case resolves to a real node');
})();
