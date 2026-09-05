/**
 * assign.js - turning the 200-case sample into per-participant task lists.
 *
 * Two ways in, because the operator needs both:
 *   split()  - divide the whole sample across N participants, optionally with a
 *              shared anchor block so inter-rater agreement is measurable.
 *   select() - apply a JSON selection dict, either explicit case ids or a
 *              filter over page / SC / stratum / pattern / scope.
 *
 * Both are seeded so a study can be re-created exactly from its parameters.
 */

function rng(seed) { // mulberry32, same generator the sampler uses
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const asArray = (v) => (v == null ? null : Array.isArray(v) ? v.map(String) : [String(v)]);

/**
 * Filter the sample by a selection object. Every field is optional and all
 * present fields must match (AND); within a field any value matches (OR).
 *   { cases: [...], pages: [...], scs: [...], strata: [...], patterns: [...],
 *     abilities: ['vision'|'screenreader'|'other'], scope: 'element'|'page',
 *     limit: n, seed: n }
 */
function selectCases(cases, sel) {
  if (Array.isArray(sel)) sel = { cases: sel };
  sel = sel || {};
  if (sel.cases) {
    // Explicit list: honour the operator's order exactly, drop unknown ids.
    const byId = new Map(cases.map((c) => [c.caseId, c]));
    const hits = [], missing = [];
    for (const id of asArray(sel.cases)) (byId.has(id) ? hits : missing).push(id);
    return { caseIds: hits, missing };
  }
  const pages = asArray(sel.pages);
  const scs = asArray(sel.scs || sel.sc);
  const strata = asArray(sel.strata || sel.stratum);
  const patterns = asArray(sel.patterns || sel.pattern);
  // Which ability a participant needs to reach a verdict at all - see
  // tag-ability.js. Filtering on it is how the operator staffs the study.
  const abilities = asArray(sel.abilities || sel.ability);
  const scope = sel.scope ? String(sel.scope) : null;
  let hits = cases.filter((c) => (
    (!pages || pages.includes(c.page.file) || pages.includes(c.page.name)) &&
    (!scs || scs.includes(c.sc)) &&
    (!strata || strata.includes(c.stratum)) &&
    (!patterns || patterns.includes(c.pattern)) &&
    (!abilities || abilities.includes(c.ability)) &&
    (!scope || c.scope === scope)
  ));
  if (sel.shuffle) hits = shuffled(hits, rng(Number(sel.seed || 20260825)));
  if (sel.limit != null) hits = hits.slice(0, Number(sel.limit));
  return { caseIds: hits.map((c) => c.caseId), missing: [] };
}

/**
 * Divide the sample across n participants.
 *
 * mode 'interleave' (default) deals the cases round-robin off a shuffled deck,
 * which keeps each participant's stratum and SC mix close to the whole sample's;
 * 'block' hands out contiguous slices of the shuffled deck instead.
 *
 * `anchor` cases are assigned to EVERY participant so the operator has a common
 * subset to compute inter-rater agreement on. They are drawn stratified across
 * the three strata so the anchor block is not accidentally all-clean.
 */
function split(cases, { n, mode = 'interleave', anchor = 0, seed = 20260825 } = {}) {
  n = Math.max(1, Number(n) || 1);
  anchor = Math.max(0, Math.min(Number(anchor) || 0, cases.length));
  const rand = rng(Number(seed));

  let anchorIds = [];
  let rest = cases;
  if (anchor > 0) {
    const byStratum = new Map();
    for (const c of cases) {
      if (!byStratum.has(c.stratum)) byStratum.set(c.stratum, []);
      byStratum.get(c.stratum).push(c);
    }
    const decks = [...byStratum.keys()].sort().map((k) => shuffled(byStratum.get(k), rand));
    const picked = [];
    let i = 0;
    while (picked.length < anchor && decks.some((d) => d.length)) {
      const d = decks[i % decks.length];
      i++;
      if (d.length) picked.push(d.pop());
    }
    anchorIds = picked.map((c) => c.caseId);
    const set = new Set(anchorIds);
    rest = cases.filter((c) => !set.has(c.caseId));
  }

  const deck = shuffled(rest, rand);
  const buckets = Array.from({ length: n }, () => []);
  if (mode === 'block') {
    const per = Math.ceil(deck.length / n);
    deck.forEach((c, i) => buckets[Math.min(n - 1, Math.floor(i / per))].push(c.caseId));
  } else {
    deck.forEach((c, i) => buckets[i % n].push(c.caseId));
  }
  // Anchor cases go first for everyone, then the participant's own share, and
  // the whole list is shuffled per participant so order effects do not line up
  // across participants.
  return buckets.map((own) => shuffled([...anchorIds, ...own], rand));
}

module.exports = { selectCases, split, rng, shuffled };
