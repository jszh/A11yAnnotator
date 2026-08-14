#!/usr/bin/env node
/**
 * Does the surviving in-page answer key inflate the reliability numbers?
 *
 * 119 served pages still render an author's explanation of the test ("Why
 * automated checkers pass this page: …"). If annotators read the verdict off the
 * page rather than judging it, agreement and label-accuracy should be markedly
 * higher on those pages than on clean ones. This contrasts the two strata.
 *
 * Usage: node eval/act-augmented/_tools/irr-leak-contrast.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const IRR = path.join(ROOT, 'eval/act-augmented/_annotator/irr');

function main() {
  const leaks = JSON.parse(fs.readFileSync(path.join(IRR, 'answer-leaks.json'), 'utf8'));
  const leakFiles = new Set(leaks.findings.filter((f) => f.prose.length || f.attributes.length).map((f) => f.file));

  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/act-augmented/_annotator/manifest.json'), 'utf8'));
  const fileOf = new Map();
  const expectedOf = new Map();
  for (const sc of m.scs) for (const a of sc.aspects) for (const p of a.pages) {
    const key = `${sc.sc}::${a.slug}::${p.id}`;
    fileOf.set(key, `eval/act-augmented/${sc.sc}/pages/${a.slug}/${p.id}.html`);
    expectedOf.set(key, p.expected === 'failed' ? 'yes' : 'no');
  }

  const byKey = new Map();
  for (const f of fs.readdirSync(path.join(ROOT, 'annotations')).filter((f) => f.endsWith('.json')).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'annotations', f), 'utf8'));
    const who = doc.meta?.annotatorName || f;
    for (const [k, a] of Object.entries(doc.annotations)) {
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ annotator: who, ...a });
    }
  }

  const strata = { leaked: [], clean: [] };
  const acc = { leaked: { n: 0, ok: 0 }, clean: { n: 0, ok: 0 } };
  for (const [k, anns] of byKey) {
    const file = fileOf.get(k);
    if (!file) continue;
    const s = leakFiles.has(file) ? 'leaked' : 'clean';
    for (const a of anns) { acc[s].n++; if (a.issueExists === expectedOf.get(k)) acc[s].ok++; }
    if (anns.length >= 2) strata[s].push([anns[0].issueExists, anns[1].issueExists]);
  }

  const kappa = (pairs) => {
    const n = pairs.length;
    if (n < 2) return { n, po: null, kappa: null };
    const po = pairs.filter(([a, b]) => a === b).length / n;
    const labels = ['yes', 'no'];
    let pe = 0;
    for (const l of labels) {
      pe += (pairs.filter(([a]) => a === l).length / n) * (pairs.filter(([, b]) => b === l).length / n);
    }
    return { n, po, kappa: pe === 1 ? null : (po - pe) / (1 - pe) };
  };

  const pct = (x) => (x == null ? 'n/a' : (x * 100).toFixed(1) + '%');
  const f3 = (x) => (x == null ? 'n/a' : x.toFixed(3));
  const L = kappa(strata.leaked), C = kappa(strata.clean);

  const annotatedLeaked = [...byKey.keys()].filter((k) => leakFiles.has(fileOf.get(k))).length;
  console.log(`annotated cases: ${byKey.size}  of which the page still leaks the answer: ${annotatedLeaked}`);
  console.log(`\ndouble-coded agreement:`);
  console.log(`  leaked pages  n=${L.n}  Po=${pct(L.po)}  kappa=${f3(L.kappa)}`);
  console.log(`  clean pages   n=${C.n}  Po=${pct(C.po)}  kappa=${f3(C.kappa)}`);
  console.log(`\nagreement with the corpus label (all annotations, both strata):`);
  console.log(`  leaked  ${acc.leaked.ok}/${acc.leaked.n} = ${pct(acc.leaked.ok / acc.leaked.n)}`);
  console.log(`  clean   ${acc.clean.ok}/${acc.clean.n} = ${pct(acc.clean.ok / acc.clean.n)}`);

  // two-proportion z-test on label accuracy between strata
  const p1 = acc.leaked.ok / acc.leaked.n, p2 = acc.clean.ok / acc.clean.n;
  const pp = (acc.leaked.ok + acc.clean.ok) / (acc.leaked.n + acc.clean.n);
  const se = Math.sqrt(pp * (1 - pp) * (1 / acc.leaked.n + 1 / acc.clean.n));
  const z = (p1 - p2) / se;
  console.log(`  difference ${((p1 - p2) * 100).toFixed(1)} pp, z=${z.toFixed(2)} -> ${Math.abs(z) > 1.96 ? 'SIGNIFICANT at .05' : 'not significant at .05'}`);

  fs.writeFileSync(path.join(IRR, 'leak-contrast.json'), JSON.stringify({
    schema: 'act-augmented-leak-contrast/1', generatedAt: new Date().toISOString(),
    annotatedCases: byKey.size, annotatedCasesWithLeak: annotatedLeaked,
    doubleCoded: { leaked: L, clean: C },
    labelAgreement: { leaked: acc.leaked, clean: acc.clean, differencePP: (p1 - p2) * 100, z },
  }, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, path.join(IRR, 'leak-contrast.json'))}`);
}

main();
