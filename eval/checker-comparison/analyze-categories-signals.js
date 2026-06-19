'use strict';
// Map the ACT-pilot checker evidence onto the harness's DECLARED scope (categories.json: 9 categories, 22 SCs)
// and, per in-scope SC, surface (a) whether the ACT pilot can even speak to it (has failed cases), (b) the
// per-tool DECIDED signal, and (c) the per-tool UNCERTAIN signal — so an integration verdict rests on
// per-SC numbers, not the global aggregates. Output: ./evidence/categories-signal-map.json + a printed table.
const fs = require('fs');
const path = require('path');
const TOOLS = ['axe', 'ibm', 'alfa', 'qualweb', 'htmlcs'];
const FOCUSED = ['axe', 'ibm', 'alfa', 'qualweb']; // htmlcs excluded (blanket flagger; see analyze-uncertainty.js)

const cats = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'categories.json'), 'utf8'));
const scToCats = {};
for (const [key, cat] of Object.entries(cats)) {
  if (key === '_meta') continue;
  for (const sc of cat.wcag_sc) (scToCats[sc.id] = scToCats[sc.id] || []).push(key + ':' + cat.name);
}
const SCOPE = Object.keys(scToCats).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'upstream-evidence', 'act-pilot', 'raw.json'), 'utf8'));
const cases = Array.isArray(raw) ? raw : (raw.cases || raw.results || Object.values(raw).find(Array.isArray));
const isSc = (s) => /^\d\.\d+\.\d+$/.test(s);
const round = (x) => x == null ? null : Math.round(x * 100) / 100;

// index cases by SC (a case belongs to an SC iff that SC is in its valid sc[])
function emits(c, tool, kind, sc) {
  return ((c.byTool && c.byTool[tool]) || []).some((x) => x && (kind === 'violation' ? x.outcome === 'violation' : x.outcome !== 'violation') && (x.sc || []).includes(sc));
}

const map = {};
for (const sc of SCOPE) {
  const cs = cases.filter((c) => (c.sc || []).filter(isSc).includes(sc));
  const failed = cs.filter((c) => c.expected === 'failed');
  const neg = cs.filter((c) => c.expected === 'passed' || c.expected === 'inapplicable');
  const dec = {}, unc = {};
  for (const t of TOOLS) {
    dec[t] = { rec: failed.filter((c) => emits(c, t, 'violation', sc)).length, fp: neg.filter((c) => emits(c, t, 'violation', sc)).length };
    unc[t] = { rec: failed.filter((c) => emits(c, t, 'review', sc)).length, fp: neg.filter((c) => emits(c, t, 'review', sc)).length };
  }
  // failures axe's decided lane misses, and which FOCUSED tools' uncertainty would surface them
  const ndFailed = failed.filter((c) => !emits(c, 'axe', 'violation', sc));
  const focusedUncRecover = ndFailed.filter((c) => FOCUSED.some((t) => emits(c, t, 'review', sc))).length;
  const focusedUncTools = FOCUSED.filter((t) => ndFailed.some((c) => emits(c, t, 'review', sc)));
  const bestDecided = [...TOOLS].sort((a, b) => dec[b].rec - dec[a].rec)[0];
  map[sc] = {
    categories: scToCats[sc],
    actTestable: failed.length > 0,
    nFailed: failed.length, nNeg: neg.length,
    decided: dec, uncertain: unc,
    axeDecidesRecall: failed.length ? round(dec.axe.rec / failed.length) : null,
    bestDecidedTool: failed.length ? bestDecided + '(' + dec[bestDecided].rec + '/' + failed.length + ')' : null,
    axeMissedFailures: ndFailed.length,
    focusedUncertaintyRecovers: focusedUncRecover,
    focusedUncertaintyTools: focusedUncTools,
  };
}

fs.writeFileSync(path.join(__dirname, 'evidence', 'categories-signal-map.json'), JSON.stringify({ scope: SCOPE, map }, null, 1));

// ---- printed table ----
const pad = (s, n) => String(s == null ? '-' : s).padEnd(n);
console.log('categories.json scope: ' + SCOPE.length + ' SCs across 9 categories');
console.log('ACT-testable (>=1 failed case): ' + SCOPE.filter((s) => map[s].actTestable).join(', '));
console.log('NOT in ACT pilot (no failed case — untestable here): ' + SCOPE.filter((s) => !map[s].actTestable).join(', '));
console.log('\n' + pad('SC', 8) + pad('ACT?', 6) + pad('nFail', 7) + pad('axeDec', 8) + pad('bestDecided', 14) + pad('axeMiss', 9) + pad('focUncRecover', 15) + 'focUncTools');
for (const sc of SCOPE) {
  const m = map[sc];
  console.log(pad(sc, 8) + pad(m.actTestable ? 'yes' : 'NO', 6) + pad(m.nFailed, 7) + pad(m.axeDecidesRecall, 8) +
    pad(m.bestDecidedTool, 14) + pad(m.axeMissedFailures, 9) +
    pad(m.actTestable ? (m.focusedUncertaintyRecovers + '/' + m.axeMissedFailures) : '-', 15) + (m.focusedUncertaintyTools.join('+') || '-'));
}
console.log('\nwrote evidence/categories-signal-map.json');
