#!/usr/bin/env node
'use strict';
// The browser's computed role and accessible name for every element-level expert-study case in the name-bearing
// criteria (1.1.1, 2.4.4, 4.1.2), read from Chrome's accessibility tree on the saved page (1280×900, settled).
// The scorer uses it to set aside expert "passes" on elements the browser exposes with no name at all: the
// judgment there is about what a person sees, while the criterion is about what assistive technology receives.
//
//   node intera11y/eval/expert-ax-names.js > intera11y/eval/expert-ax-names.json      (needs the annotator server)
const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../src/core/config.js');
const { launchBrowser, openPage } = require('../src/core/session.js');
const { CORPORA } = require('./corpora.js');

const SRC = path.join(CONFIG.root, 'docs/chi-evidence/claim5-expert-study');
const SCS = new Set(['1.1.1', '2.4.4', '4.1.2']);

(async () => {
  const cases = [];
  for (const f of ['round1-manifest.json', 'round2-manifest.json']) {
    for (const c of JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')).cases) if (SCS.has(c.sc) && c.scope !== 'page' && c.xpath) cases.push(c);
  }
  const pages = new Map(CORPORA['saved-pages']().map((p) => [String(p.meta.file).normalize('NFC'), p]));
  const byPage = new Map();
  for (const c of cases) { const k = String(c.page.file).normalize('NFC'); if (!byPage.has(k)) byPage.set(k, []); byPage.get(k).push(c); }
  const browser = await launchBrowser();
  const out = {};
  for (const [file, list] of byPage) {
    const p = pages.get(file);
    if (!p) continue;
    const page = await openPage(browser, p.url).catch(() => null);
    if (!page) continue;
    const cdp = await page.createCDPSession();
    await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    // objects are resolved on this CDP session: a Puppeteer handle's objectId belongs to another session
    const axOf = async (expression) => {
      const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: false }).catch(() => null);
      const objectId = r && r.result && r.result.objectId;
      if (!objectId) return null;
      const { nodeId } = await cdp.send('DOM.requestNode', { objectId }).catch(() => ({}));
      if (!nodeId) return null;
      const ax = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false }).catch(() => null);
      const n = ax && ax.nodes && ax.nodes[0];
      return n ? { role: n.role && n.role.value, name: (n.name && n.name.value) || '', ignored: !!n.ignored } : null;
    };
    for (const c of list) {
      const rec = { sc: c.sc, xpath: c.xpath, found: false };
      // the element, and — for a component host whose shadow root holds exactly one link or button — that inner
      // control, which is what assistive technology lands on
      const find = `(() => { const f = (q) => { try { return document.evaluate(q, document, null, 9, null).singleNodeValue; } catch (e) { return null; } };
        const xp = ${JSON.stringify(c.xpath)}; return f(xp) || f(xp.replace(/\\[1\\]/g, '')); })()`;
      const a = await axOf(find);
      if (a) Object.assign(rec, { found: true, ...a });
      const b = a ? await axOf(`(() => { const e = ${find}; if (!e || !e.shadowRoot) return null;
        const ls = e.shadowRoot.querySelectorAll('a[href],[role="link"],button,[role="button"]'); return ls.length === 1 ? ls[0] : null; })()`) : null;
      if (b) rec.innerControl = b;
      out[c.caseId] = rec;
    }
    await page.close().catch(() => {});
  }
  await browser.close();
  process.stdout.write(JSON.stringify(out, null, 1));
})();
