'use strict';
// axe-core, run once on the unmodified page, restricted to rules mapped to the criteria InterA11y tests. Its
// violations and needs-review items become per-element facts (by InterA11y XPath). They are evidence for
// applicability and for the judge, never a verdict on their own: an ARIA authoring error is a 4.1.2 failure only
// when it changes what assistive technology gets for a user interface component.
const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../core/config.js');
const { key } = require('../lib/xpath.js');

const AXE_SRC = fs.readFileSync(path.join(CONFIG.root, 'axe.min.js'), 'utf8');
const TAGS = ['wcag412', 'wcag211', 'wcag212', 'wcag141', 'wcag1413', 'wcag247', 'wcag243', 'wcag331', 'wcag413', 'wcag244', 'wcag143', 'wcag111'];

async function runAxe(page) {
  await page.evaluate(AXE_SRC);
  return page.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, elementRef: true, resultTypes: ['violations', 'incomplete'] });
    const rows = [];
    for (const kind of ['violations', 'incomplete']) {
      for (const rule of r[kind]) {
        const scs = rule.tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => t.replace(/^wcag(\d)(\d)(\d+)$/, '$1.$2.$3'));
        for (const n of rule.nodes) {
          const el = n.element;
          rows.push({
            xpath: el && el.nodeType === 1 ? window.__ia.xpathOf(el) : null,
            rule: rule.id, kind: kind === 'violations' ? 'violation' : 'needs-review', scs, impact: n.impact,
            message: (n.failureSummary || rule.help || '').replace(/\s+/g, ' ').slice(0, 300),
          });
        }
      }
    }
    return { version: window.axe.version, rows };
  }, TAGS);
}

async function axeFacts(page) {
  try {
    const { version, rows } = await runAxe(page);
    const byKey = new Map();
    for (const row of rows) {
      if (!row.xpath) continue;
      const k = key(row.xpath);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(row);
    }
    return { version, rows, byKey, forSc: (sc) => rows.filter((r) => r.scs.includes(sc)), of: (xpath) => byKey.get(key(xpath)) || [] };
  } catch (e) {
    return { error: String(e && e.message || e).slice(0, 200), rows: [], byKey: new Map(), forSc: () => [], of: () => [] };
  }
}

module.exports = { axeFacts };
