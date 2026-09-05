#!/usr/bin/env node
/**
 * build-sample.js - draw the 200-case human-adjudication sample from the
 * three-way comparison over the 56 saved pages.
 *
 * A "case" is one (page x SC x element) row of the harness's 774-element
 * stratified sample - the same unit the three tools were joined on in
 * results/compare-56-*\/three-way-56.json.
 *
 * Strata (200 = 40 + 40 + 120):
 *   ALL_ISSUE  40 - every tool reported a problem on THIS element
 *   ALL_CLEAN  40 - no tool reported a problem on this element
 *   DIFFER    120 - the tools split
 *
 * "Reported a problem on this element" is what the tool actually emitted for
 * that element, which is not the same as "the tool looked and said it was
 * fine": GenA11y covers 15 SCs and axe has rules for 8 of the 21 sampled SCs,
 * so on the other SCs they are silent because they have no lane at all. The
 * strata are built on what was reported (silence counts as no report), and
 * every case additionally carries `lanes` recording which tools could even
 * evaluate it, so the analysis can separate genuine agreement from silence.
 * Requiring all three lanes instead would collapse the sample to 6 SCs and
 * make "cover all SC" impossible.
 *
 * Selection is a seeded round-robin, not a flat random draw: within each
 * stratum it cycles SC by SC (and inside DIFFER, pattern by pattern within
 * each SC) so every SC that has cases in a stratum is represented before any
 * SC gets a second case, and disagreement patterns are spread as evenly as
 * the census allows. The pick inside a cell is random under the seed.
 *
 * Usage: node eval/human-study/build-sample.js [--seed=20260825] [--out=<file>]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const COMPARE = path.join(ROOT, 'results/compare-56-20260823/three-way-56.json');
const HARNESS_PAGES = path.join(ROOT, 'results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired/pages');
const PAGE_LIST = path.join(ROOT, 'eval/56-page-baselines/page-list-56.json');
const POOL_CHECK = path.join(ROOT, 'eval/human-study/sample/pool-resolvability.json');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SEED = Number(args.seed || 20260825);
const OUT = path.resolve(ROOT, args.out || 'eval/human-study/sample/study-sample-200.json');
const QUOTA = { ALL_ISSUE: 40, ALL_CLEAN: 40, DIFFER: 120 };

// mulberry32 - small, seeded, and reproducible across runs and machines.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);
const shuffle = (arr) => { // Fisher-Yates on the shared seeded stream
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const scOrder = (s) => s.split('.').map(Number);
const bySc = (a, b) => { const x = scOrder(a), y = scOrder(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

// --- inputs ---------------------------------------------------------------
const cmp = JSON.parse(fs.readFileSync(COMPARE, 'utf8'));
const pageList = JSON.parse(fs.readFileSync(PAGE_LIST, 'utf8'));
const pageSpec = new Map(pageList.pages.map((p) => [p.file, p]));
const axeHasRule = new Map(cmp.coverage.map((c) => [c.sc, !!c.axeHasRuleForSc]));

// Drop elements that cannot be shown. A few heavily dynamic snapshots do not
// reproduce the DOM the harness sampled them from, so their xpath points at
// nothing when the page is served plainly. Those rows are fine in a scoring
// join but useless as a study task, and it is better to exclude them from the
// pool BEFORE the draw than to discover the holes afterwards and patch the
// sample by hand. validate-pool.js writes the list; run it first.
const excluded = new Set();
let poolCheck = null;
if (fs.existsSync(POOL_CHECK)) {
  poolCheck = JSON.parse(fs.readFileSync(POOL_CHECK, 'utf8'));
  for (const r of poolCheck.rows || []) if (!r.usable) excluded.add(`${r.page} ${r.xpath}`);
  console.log(`  excluding ${excluded.size} unresolvable target(s) from ${path.relative(ROOT, POOL_CHECK)} (${poolCheck.passes} passes)`);
} else {
  console.warn(`WARN no ${path.relative(ROOT, POOL_CHECK)} - run validate-pool.js first or the draw may pick cases with nothing to highlight`);
}

// normalizedXpath -> the full indexed xpath the page was sampled with. The
// comparison strips "[1]" so the three tools' paths join; the study has to put
// a highlight on a real node, so recover the exact path from the run's spec.
const fullXpath = new Map(); // `${file} ${normalized}` -> full
for (const f of fs.readdirSync(HARNESS_PAGES)) {
  if (!f.endsWith('.json')) continue;
  const spec = JSON.parse(fs.readFileSync(path.join(HARNESS_PAGES, f), 'utf8')).spec;
  for (const xp of spec.xpaths || []) fullXpath.set(`${spec.file} ${xp.replace(/\[1\](?=\/|$)/g, '')}`, xp);
}

// --- stratify -------------------------------------------------------------
function classify(e) {
  const H = !!e.harnessBarrier, G = !!e.gena11yFlaggedElement, A = !!e.axeViolationElement;
  if (H && G && A) return 'ALL_ISSUE';
  if (!H && !G && !A) return 'ALL_CLEAN';
  return 'DIFFER';
}
const pattern = (e) => (e.harnessBarrier ? 'H' : '-') + (e.gena11yFlaggedElement ? 'G' : '-') + (e.axeViolationElement ? 'A' : '-');

const pool = { ALL_ISSUE: new Map(), ALL_CLEAN: new Map(), DIFFER: new Map() }; // stratum -> sc -> pattern -> [cases]
const census = {};
const skipped = [];
for (const e of cmp.elements) {
  const stratum = classify(e);
  const full = fullXpath.get(`${e.page} ${e.normalizedXpath}`);
  if (!full) throw new Error(`no full xpath for ${e.page} ${e.normalizedXpath}`);
  const spec = pageSpec.get(e.page);
  if (!spec) throw new Error(`page ${e.page} is not in page-list-56.json`);
  if (excluded.has(`${e.page} ${full}`)) { skipped.push({ page: e.page, sc: e.sc, xpath: full, stratum }); continue; }
  const c = {
    sourceKey: e.key,
    sc: e.sc,
    stratum,
    pattern: pattern(e),
    page: { file: e.page, name: spec.name, assetDir: spec.assetDir, relPath: spec.relPath, query: spec.query, noscript: !!spec.noscript },
    // 46 of the 774 sampled rows are page-scope obligations (focus order, page
    // title, meta refresh, ...) carried on a `/page-level::<family>` pseudo-path
    // rather than a real node. They stay in the study - a participant can judge
    // them fine - but there is nothing to draw a box around, so the scope is
    // recorded and the client renders the page with no target highlight.
    scope: /^\/page-level::/.test(full) ? 'page' : 'element',
    xpath: full,
    normalizedXpath: e.normalizedXpath,
    claimFamily: e.key.split('\u0000')[3] || null,
    lanes: { harness: e.harnessOutcome !== 'no-obligation', gena11y: !!e.gena11yEvaluated, axe: !!axeHasRule.get(e.sc) },
    tools: {
      harness: { flagged: !!e.harnessBarrier, outcome: e.harnessOutcome, recordKind: e.recordKind },
      gena11y: { flagged: !!e.gena11yFlaggedElement, flaggedPage: !!e.gena11yFlaggedPage, evaluated: !!e.gena11yEvaluated },
      axe: { flagged: !!e.axeViolationElement, rules: e.axeRules || null, hasRule: !!axeHasRule.get(e.sc) },
    },
  };
  const s = pool[stratum];
  if (!s.has(e.sc)) s.set(e.sc, new Map());
  const p = s.get(e.sc);
  if (!p.has(c.pattern)) p.set(c.pattern, []);
  p.get(c.pattern).push(c);
  census[stratum] = (census[stratum] || 0) + 1;
}

// Round-robin over SCs, and inside each SC over patterns, so SC coverage and
// pattern spread both come out of the draw rather than being fixed up after.
function drawRoundRobin(scMap, quota) {
  const scs = [...scMap.keys()].sort(bySc);
  const cells = new Map(scs.map((sc) => [sc, { patterns: [...scMap.get(sc).keys()].sort(), cursor: 0 }]));
  for (const sc of scs) for (const p of scMap.get(sc).values()) p.splice(0, p.length, ...shuffle(p));
  const picked = [];
  let progressed = true;
  while (picked.length < quota && progressed) {
    progressed = false;
    for (const sc of scs) {
      if (picked.length >= quota) break;
      const cell = cells.get(sc);
      const pats = scMap.get(sc);
      // advance the pattern cursor to the next pattern that still has cases
      for (let tries = 0; tries < cell.patterns.length; tries++) {
        const name = cell.patterns[cell.cursor % cell.patterns.length];
        cell.cursor++;
        const bucket = pats.get(name);
        if (bucket && bucket.length) { picked.push(bucket.pop()); progressed = true; break; }
      }
    }
  }
  return picked;
}

const drawn = [];
const shortfall = {};
for (const stratum of ['ALL_ISSUE', 'ALL_CLEAN', 'DIFFER']) {
  const got = drawRoundRobin(pool[stratum], QUOTA[stratum]);
  if (got.length < QUOTA[stratum]) {
    shortfall[stratum] = { asked: QUOTA[stratum], got: got.length, pool: census[stratum] || 0 };
    console.warn(`WARN ${stratum}: only ${got.length} of ${QUOTA[stratum]} available (pool ${census[stratum] || 0})`);
  }
  drawn.push(...got);
}

// Present in shuffled order so strata are not clustered for the participant.
const cases = shuffle(drawn).map((c, i) => ({ caseId: `C${String(i + 1).padStart(3, '0')}`, order: i + 1, ...c }));

// --- report ---------------------------------------------------------------
const tally = (fn) => cases.reduce((m, c) => (m[fn(c)] = (m[fn(c)] || 0) + 1, m), {});
const perSc = {};
for (const c of cases) {
  const s = perSc[c.sc] || (perSc[c.sc] = { total: 0, ALL_ISSUE: 0, ALL_CLEAN: 0, DIFFER: 0, patterns: {} });
  s.total++; s[c.stratum]++; s.patterns[c.pattern] = (s.patterns[c.pattern] || 0) + 1;
}
const out = {
  schema: 'human-study-sample/1',
  generatedAt: new Date().toISOString(),
  seed: SEED,
  source: { compare: path.relative(ROOT, COMPARE), runs: cmp.runs, sampledScs: cmp.sampleScs },
  quota: QUOTA,
  poolCensus: census,
  shortfall,
  excludedUnresolvable: { count: skipped.length, source: poolCheck ? path.relative(ROOT, POOL_CHECK) : null, rows: skipped },
  totals: {
    cases: cases.length,
    byStratum: tally((c) => c.stratum),
    byPattern: tally((c) => c.pattern),
    byScope: tally((c) => c.scope),
    scsCovered: Object.keys(perSc).length,
    scsInSource: cmp.sampleScs.length,
    pagesCovered: new Set(cases.map((c) => c.page.file)).size,
  },
  perSc,
  cases,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log(`sample -> ${path.relative(ROOT, OUT)}`);
console.log(`  ${cases.length} cases  |  strata ${JSON.stringify(out.totals.byStratum)}`);
console.log(`  SCs ${out.totals.scsCovered}/${out.totals.scsInSource}  pages ${out.totals.pagesCovered}/56  patterns ${JSON.stringify(out.totals.byPattern)}`);
console.log(`  scope ${JSON.stringify(out.totals.byScope)}`);
console.log('\n  SC      n  issue clean differ  patterns');
for (const sc of Object.keys(perSc).sort(bySc)) {
  const s = perSc[sc];
  const pat = Object.entries(s.patterns).sort().map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`  ${sc.padEnd(7)} ${String(s.total).padStart(2)}  ${String(s.ALL_ISSUE).padStart(5)} ${String(s.ALL_CLEAN).padStart(5)} ${String(s.DIFFER).padStart(6)}  ${pat}`);
}
