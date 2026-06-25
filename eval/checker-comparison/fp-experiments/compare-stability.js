#!/usr/bin/env node
'use strict';
// Compare two evidence-stability sigs.json (BEFORE vs AFTER the harness fixes): per-capability drift count + per-SC
// breakdown, side by side. A "drifting" case = its signature for that capability differs across the run replicates.
// Capabilities: collect, subjects, visionRaw (exact-byte → SETTLE effect), vision (perceptual → after metric), ledger
// (auto-PARTIAL disposition → 300s-ceiling effect).
//
// Usage: node compare-stability.js <baseline/sigs.json> <fixed/sigs.json>
const fs = require('fs');
const CAPS = ['collect', 'subjects', 'visionRaw', 'vision', 'ledger'];
const MIN = Number(process.env.MIN_RUNS) || 3;

function drift(file) {
  const byCase = JSON.parse(fs.readFileSync(file, 'utf8'));
  const res = { complete: 0, total: Object.keys(byCase).length, cap: {} };
  for (const c of CAPS) res.cap[c] = { count: 0, bySC: {}, ids: [] };
  for (const [id, rec] of Object.entries(byCase)) {
    const rs = (rec.runs || []).filter((r) => !r.error);
    if (rs.length < MIN) continue;
    res.complete++;
    for (const c of CAPS) {
      if (rs.some((r) => r[c] === undefined)) continue;
      const vals = new Set(rs.map((r) => String(r[c])));
      if (vals.size > 1) { res.cap[c].count++; res.cap[c].bySC[rec.sc] = (res.cap[c].bySC[rec.sc] || 0) + 1; res.cap[c].ids.push(id.slice(0, 8)); }
    }
  }
  return res;
}

const [, , fA, fB] = process.argv;
if (!fA || !fB) { console.error('usage: compare-stability.js <baseline sigs.json> <fixed sigs.json>'); process.exit(1); }
const A = drift(fA), B = drift(fB);
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '—';

console.log(`\n=== STABILITY: BEFORE vs AFTER (MIN_RUNS=${MIN}) ===`);
console.log(`  baseline: ${fA}  (${A.complete}/${A.total} complete)`);
console.log(`  fixed   : ${fB}  (${B.complete}/${B.total} complete)\n`);
console.log(`  capability     BEFORE(drift)      AFTER(drift)     Δ`);
for (const c of CAPS) {
  const a = A.cap[c].count, b = B.cap[c].count;
  const note = c === 'visionRaw' ? '  (settle effect)' : c === 'vision' ? '  (perceptual: settle+metric)' : c === 'ledger' ? '  (300s-ceiling effect)' : '';
  console.log(`  ${c.padEnd(11)}  ${String(a).padStart(4)} (${pct(a, A.complete).padStart(5)})     ${String(b).padStart(4)} (${pct(b, B.complete).padStart(5)})    ${(b - a >= 0 ? '+' : '') + (b - a)}${note}`);
}
for (const c of CAPS) {
  if (!A.cap[c].count && !B.cap[c].count) continue;
  console.log(`\n  --- ${c} drift by SC ---`);
  const scs = [...new Set([...Object.keys(A.cap[c].bySC), ...Object.keys(B.cap[c].bySC)])].sort();
  for (const sc of scs) console.log(`    ${sc.padEnd(8)} before=${A.cap[c].bySC[sc] || 0}  after=${B.cap[c].bySC[sc] || 0}`);
}
