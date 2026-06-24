#!/usr/bin/env node
// Compare two SC-pipeline runs (v1 vs v2) for the review diff.
// Usage: node compare-runs.js <labelA> <resultA.json> <pagesRootA> <labelB> <resultB.json> <pagesRootB>
// Metrics per run: aspects, pages, valid (corrected), human-judgment share, citation-grounding
// share, persona/attribute-conditioning share, and mean intra-aspect diversity (dupcheck).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function pageIsValid(expected, v) {
  if (!v) return false;
  const errOk = expected !== 'failed' || v.errorIsReal === true;
  return v.recommendation === 'keep' && v.requiresHumanJudgment === true && v.expectedOutcomeCorrect === true && errOk;
}
function dupMax(dir) {
  try {
    const o = JSON.parse(execSync(`node ${path.join(__dirname, 'dupcheck.js')} "${dir}"`, { encoding: 'utf8' }));
    return o.maxCombined;
  } catch (e) { return null; }
}
function docHas(md, res) {
  const m = md.toLowerCase();
  return {
    citation: /quote|citation|understanding|trusted tester|technique|en 301|verbatim/.test(m) && /["“][^"”]{15,}["”]|>/.test(md),
    persona: /persona|developer|junior|designer|agency|cms author|pasted|copied|stack overflow/.test(m),
    attribute: /domain|component|locale|mechanism|attribute|tuple/.test(m),
    whyAuto: /automat|axe|lighthouse|wave|linter|cannot detect|would miss|requires human/.test(m),
  };
}
function analyze(label, resultPath, pagesRoot) {
  const d = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const ars = d.aspectResults || [];
  let pages = 0, valid = 0, human = 0, withVerdict = 0;
  const aspectDiv = [];
  const docFlags = { citation: 0, persona: 0, attribute: 0, whyAuto: 0, docs: 0 };
  for (const ar of ars) {
    const byFile = {}; for (const v of (ar.verdicts || [])) if (v && v.file) byFile[v.file] = v;
    const built = (ar.built && ar.built.pages) || [];
    for (const pg of built) {
      pages++;
      const v = byFile[pg.file];
      if (v) { withVerdict++; if (v.requiresHumanJudgment) human++; if (pageIsValid(pg.expected, v)) valid++; }
    }
    const dir = path.join(pagesRoot, ar.aspect);
    if (fs.existsSync(dir)) {
      const dm = dupMax(dir); if (dm !== null) aspectDiv.push(dm);
      for (const f of fs.readdirSync(dir).filter(x => /\.md$/.test(x))) {
        const fl = docHas(fs.readFileSync(path.join(dir, f), 'utf8'));
        docFlags.docs++;
        for (const k of ['citation', 'persona', 'attribute', 'whyAuto']) if (fl[k]) docFlags[k]++;
      }
    }
  }
  const meanDiv = aspectDiv.length ? +(aspectDiv.reduce((a, b) => a + b, 0) / aspectDiv.length).toFixed(3) : null;
  return {
    label, aspects: ars.length, pages, valid,
    validPct: pages ? Math.round(100 * valid / pages) : 0,
    humanPct: withVerdict ? Math.round(100 * human / withVerdict) : 0,
    meanDiversity: meanDiv, maxDiversity: aspectDiv.length ? Math.max(...aspectDiv) : null,
    citationPct: docFlags.docs ? Math.round(100 * docFlags.citation / docFlags.docs) : 0,
    personaPct: docFlags.docs ? Math.round(100 * docFlags.persona / docFlags.docs) : 0,
    attributePct: docFlags.docs ? Math.round(100 * docFlags.attribute / docFlags.docs) : 0,
    whyAutoPct: docFlags.docs ? Math.round(100 * docFlags.whyAuto / docFlags.docs) : 0,
    allAspectsHave5: d.finalReport ? d.finalReport.allAspectsHave5ValidPages : undefined,
  };
}

const [, , la, ra, pa, lb, rb, pb] = process.argv;
const A = analyze(la, ra, pa), B = analyze(lb, rb, pb);
const rows = [
  ['aspects', A.aspects, B.aspects],
  ['pages built', A.pages, B.pages],
  ['VALID (human-judgment)', `${A.valid} (${A.validPct}%)`, `${B.valid} (${B.validPct}%)`],
  ['requiresHumanJudgment share', `${A.humanPct}%`, `${B.humanPct}%`],
  ['mean intra-aspect dup (lower=more diverse)', A.meanDiversity, B.meanDiversity],
  ['worst intra-aspect dup', A.maxDiversity, B.maxDiversity],
  ['docs w/ citation', `${A.citationPct}%`, `${B.citationPct}%`],
  ['docs w/ persona', `${A.personaPct}%`, `${B.personaPct}%`],
  ['docs w/ attribute tuple', `${A.attributePct}%`, `${B.attributePct}%`],
  ['docs w/ "why auto-tools miss"', `${A.whyAutoPct}%`, `${B.whyAutoPct}%`],
  ['all aspects >=5 valid', String(A.allAspectsHave5), String(B.allAspectsHave5)],
];
console.log(`\n| metric | ${A.label} | ${B.label} |`);
console.log('|---|---|---|');
for (const r of rows) console.log(`| ${r[0]} | ${r[1]} | ${r[2]} |`);
console.log('\nJSON:', JSON.stringify({ A, B }));
