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
    for (const c of list) {
      const rec = { sc: c.sc, xpath: c.xpath, found: false };
      for (const q of [c.xpath, c.xpath.replace(/\[1\]/g, '')]) {
        const { searchId, resultCount } = await cdp.send('DOM.performSearch', { query: q }).catch(() => ({ resultCount: 0 }));
        if (!resultCount) continue;
        const { nodeIds } = await cdp.send('DOM.getSearchResults', { searchId, fromIndex: 0, toIndex: 1 });
        await cdp.send('DOM.discardSearchResults', { searchId }).catch(() => {});
        const ax = await cdp.send('Accessibility.getPartialAXTree', { nodeId: nodeIds[0], fetchRelatives: false }).catch(() => null);
        const n = ax && ax.nodes && ax.nodes[0];
        if (n) Object.assign(rec, { found: true, role: n.role && n.role.value, name: (n.name && n.name.value) || '', ignored: !!n.ignored });
        break;
      }
      out[c.caseId] = rec;
    }
    await page.close().catch(() => {});
  }
  await browser.close();
  process.stdout.write(JSON.stringify(out, null, 1));
})();
