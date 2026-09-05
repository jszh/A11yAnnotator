#!/usr/bin/env node
'use strict';

// GenA11y reports violations as model-authored XPath strings echoed back from the [path: ...] labels
// in its prompt. A hallucinated or mangled path silently fails the element-level join and would make
// GenA11y look like it found fewer of the harness's elements than it did. So before comparing, load
// each page and check every reported path actually resolves — and whether it resolves to an element
// whose tag matches the outerHTML GenA11y reported alongside it.
//
//   node eval/56-page-baselines/validate-gena11y-xpaths.js --gena11y=<run> [--base=http://127.0.0.1:3001]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(ROOT);
const { BROWSER_ARGS } = require('../../scripts/v3/lib/orchestrator.js');
const { assetUrlUnder } = require('../../scripts/lib/asset-paths.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN = path.resolve(ROOT, 'results', String(arg('gena11y', 'gena11y-56-gemini37-high-20260823-server')));
const BASE = String(arg('base', process.env.A11Y_BASE || 'http://127.0.0.1:3001'));
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
const PAGE_CONC = Math.max(1, Number(arg('pages', 8)) || 8);

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/56-page-baselines/page-list-56.json'), 'utf8'));
const byFile = new Map(list.pages.map((p) => [p.file, p]));
const results = JSON.parse(fs.readFileSync(path.join(RUN, 'results.json'), 'utf8'));

// group every reported violation xpath by the page it was reported on
const perPage = new Map();
for (const r of results) {
  const page = r.pageFile || path.basename(r.file);
  for (const v of ((r.gena11y || {}).violations || [])) {
    if (!v.xpath) continue;
    if (!perPage.has(page)) perPage.set(page, []);
    perPage.get(page).push({ sc: r.sc, xpath: v.xpath, outerHTML: v.outerHTML || '' });
  }
}

const expectedTag = (html) => {
  const m = /^\s*<\s*([a-zA-Z][\w-]*)/.exec(String(html || ''));
  return m ? m[1].toLowerCase() : null;
};

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000 });
  const pages = [...perPage.keys()];
  const rows = [];
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= pages.length) return;
      const file = pages[i];
      const spec = byFile.get(file);
      if (!spec) continue;
      const url = assetUrlUnder(BASE, file) + spec.query;
      const tab = await browser.newPage();
      try {
        await tab.goto(url, { waitUntil: 'load', timeout: 120000 });
        const checks = perPage.get(file).map((v) => ({ xpath: v.xpath, expectTag: expectedTag(v.outerHTML) }));
        const verdicts = await tab.evaluate((cs) => cs.map((c) => {
          try {
            const res = document.evaluate(c.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const el = res.singleNodeValue;
            if (!el) return { resolves: false, tag: null };
            return { resolves: true, tag: el.tagName ? el.tagName.toLowerCase() : null };
          } catch (e) { return { resolves: false, tag: null, error: String(e && e.message || e) }; }
        }), checks);
        perPage.get(file).forEach((v, k) => {
          const w = verdicts[k] || {};
          rows.push({ page: file, sc: v.sc, xpath: v.xpath, resolves: !!w.resolves,
                      expectedTag: checks[k].expectTag, actualTag: w.tag || null,
                      tagMatches: !!(w.tag && checks[k].expectTag && w.tag === checks[k].expectTag) });
        });
        console.log(`[${rows.length}] ${file} — ${perPage.get(file).length} paths checked`);
      } catch (e) {
        console.log(`${file} — ERROR ${e && e.message}`);
      } finally { await tab.close().catch(() => {}); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, pages.length) }, worker));
  await browser.close();

  const summary = {
    schema: 'gena11y-xpath-validation/1', run: path.relative(ROOT, RUN),
    reportedPaths: rows.length,
    resolves: rows.filter((r) => r.resolves).length,
    unresolved: rows.filter((r) => !r.resolves).length,
    tagMatches: rows.filter((r) => r.tagMatches).length,
    tagMismatch: rows.filter((r) => r.resolves && r.expectedTag && !r.tagMatches).length,
    bySc: Object.fromEntries([...new Set(rows.map((r) => r.sc))].sort().map((sc) => {
      const s = rows.filter((r) => r.sc === sc);
      return [sc, { reported: s.length, resolves: s.filter((r) => r.resolves).length,
                    tagMatches: s.filter((r) => r.tagMatches).length }];
    })),
    rows,
  };
  fs.writeFileSync(path.join(RUN, 'xpath-validation.json'), JSON.stringify(summary, null, 2));
  console.log(`\nreported=${summary.reportedPaths} resolves=${summary.resolves} ` +
              `unresolved=${summary.unresolved} tagMatches=${summary.tagMatches} tagMismatch=${summary.tagMismatch}`);
  console.log(`wrote ${path.relative(ROOT, RUN)}/xpath-validation.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
