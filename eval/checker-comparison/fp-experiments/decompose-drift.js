#!/usr/bin/env node
'use strict';
// Decompose each capability's run-to-run drift in a sigs.json into PRESENCE drift (the count varies → a crop /
// obligation / subject appeared or vanished between runs) vs CONTENT drift (count stable, hash varies → same set of
// items but a disposition flipped / pixels changed). "Count varying" and "hash varying" are different mechanisms:
// presence drift = the deterministic lane DISAGREED ON WHAT EXISTS; content drift = it agreed on what exists but
// DISAGREED ON ITS VALUE. The headline drift count conflates them; this splits them and lists the actual cases.
//
// Usage: node decompose-drift.js results/fp-experiments/runs/fp-stab-off-unstable/sigs.json [label]
const fs = require('fs');
const file = process.argv[2];
const label = process.argv[3] || file;
const byCase = JSON.parse(fs.readFileSync(file, 'utf8'));

const caps = [
  { name: 'subjects', hash: 'subjects', count: 'subjN' },
  { name: 'vision',   hash: 'vision',   count: 'visN' },
  { name: 'ledger',   hash: 'ledger',   count: 'ledN' },
];
const out = { presence: {}, content: {} };
const detail = { subjects: [], vision: [], ledger: [] };
let complete = 0;
const MIN = Number(process.env.MIN_RUNS) || 3;       // a case is "complete" with >=3 non-error runs (the sweep's K)

for (const [id, rec] of Object.entries(byCase)) {
  const rs = rec.runs.filter((r) => !r.error);
  if (rs.length < MIN) continue;
  complete++;
  for (const cap of caps) {
    const hashes = new Set(rs.map((r) => String(r[cap.hash])));
    if (hashes.size <= 1) continue;                    // stable on this capability
    const counts = new Set(rs.map((r) => Number(r[cap.count])));
    const kind = counts.size > 1 ? 'presence' : 'content';
    out[kind][cap.name] = (out[kind][cap.name] || 0) + 1;
    detail[cap.name].push({
      id: id.slice(0, 8), sc: rec.sc, exp: rec.expected, kind,
      counts: rs.map((r) => Number(r[cap.count])),
    });
  }
}

console.log(`\n############ ${label}  (${complete}/${Object.keys(byCase).length} cases complete, MIN_RUNS=${MIN}) ############`);
console.log(`capability   PRESENCE-drift (count varies)   CONTENT-drift (count stable, value varies)`);
for (const cap of caps) {
  const p = out.presence[cap.name] || 0, c = out.content[cap.name] || 0;
  console.log(`  ${cap.name.padEnd(10)} ${String(p).padStart(10)}                      ${String(c).padStart(10)}`);
}
for (const cap of caps) {
  if (!detail[cap.name].length) continue;
  console.log(`\n  --- ${cap.name} drift detail (count tuples across runs) ---`);
  // group by SC for readability
  const bySC = {};
  for (const d of detail[cap.name]) (bySC[d.sc] = bySC[d.sc] || []).push(d);
  for (const sc of Object.keys(bySC).sort()) {
    for (const d of bySC[sc]) {
      console.log(`    ${d.id}(${d.sc},${d.exp}) [${d.kind}] counts=${JSON.stringify(d.counts)}`);
    }
  }
}
