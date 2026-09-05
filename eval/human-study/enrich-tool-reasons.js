#!/usr/bin/env node
/**
 * enrich-tool-reasons.js - attach, to every flagged column of every sampled
 * case, the one sentence that tool gave for flagging it.
 *
 * The tool view used to show only a verdict ("reports a problem here"), which
 * asks a participant to agree or disagree with a bare assertion. What a person
 * is actually being asked to judge is the FINDING, so each column that reports
 * a problem now carries the reason its tool gave.
 *
 * The three tools say it in three different places:
 *
 *   harness  the obligation ledger entry for (xpath, SC, claim family). When
 *            the finding came from a rubric it carries a rationaleRef into the
 *            judgments block, whose `summary` is a sentence written for a
 *            human. Deterministic sources (a checker, a geometry measurement,
 *            an instrument) carry no rationale, so the sentence is built from
 *            the claim family and the kind of mechanism instead.
 *   gena11y  the violation whose xpath matches, and its `reason` field.
 *   axe      the rule's `help` string ("Images must have alternative text").
 *
 * Deliberately uniform: one plain sentence per column, no rule identifiers, no
 * mechanism names, no tool vocabulary that only one of the three has. The
 * letters are blinded per participant and the sentences should not hand back
 * what the letters hide any more than they must.
 *
 * Additive and idempotent: it only ever sets tools.<tool>.reason on the
 * existing sample, so case ids, strata and assignments are untouched.
 *
 * Usage: node eval/human-study/enrich-tool-reasons.js [--sample=<file>] [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');
const HARNESS = path.join(ROOT, 'results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired/pages');
const GENA11Y = path.join(ROOT, 'results/gena11y-56-gemini37-high-20260823-combined/results.json');
const AXE = path.join(ROOT, 'results/axe-56-20260823-server/pages');

const norm = (xp) => String(xp || '').normalize('NFC').replace(/\[1\]/g, '').replace(/\s+/g, ' ').trim();
const npage = (p) => String(p || '').normalize('NFC').replace(/\s+/g, ' ').trim();
const sentence = (s) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/[.!?\u2026]$/.test(t)) return t;
  // A handful of stored summaries are cut off at the field cap they were
  // written into, mid-word. Adding a full stop would present a fragment as a
  // finished sentence, so mark it as cut instead of tidying it up.
  return t.length >= 200 ? `${t}\u2026` : `${t}.`;
};

// --- axe -------------------------------------------------------------------
const axe = new Map(); // page -> Map(ruleId -> help)
for (const f of fs.readdirSync(AXE)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(AXE, f), 'utf8'));
  const m = new Map();
  for (const v of (d.axe && d.axe.violations) || []) m.set(v.id, v.help || v.description || '');
  axe.set(npage(d.spec ? d.spec.file : (d.rows && d.rows[0] && d.rows[0].page)), m);
}
const axeReason = (c) => {
  const m = axe.get(npage(c.page.file));
  if (!m) return '';
  const helps = (c.tools.axe.rules || []).map((r) => m.get(r)).filter(Boolean);
  return helps.length ? sentence(helps.join('; ')) : '';
};

// --- harness ---------------------------------------------------------------
// page -> { ledger: Map(`${xpath}|${sc}|${family}` -> entry), judgments: Map(id -> j),
//           shadow: Map(`${xpath}|${sc}|${family}` -> [obs]) }
const harness = new Map();
for (const f of fs.readdirSync(HARNESS)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(HARNESS, f), 'utf8'));
  const r = d.results || {};
  const ledger = new Map();
  for (const o of r.obligationLedger || []) ledger.set(`${norm(o.xpath)}|${o.sc}|${o.claimFamily || ''}`, o);
  const judgments = new Map();
  for (const j of (d.judgments && d.judgments.judgments) || []) judgments.set(j.judgmentId, j);
  const shadow = new Map();
  for (const s of r.shadowObservations || []) {
    const xp = norm(s.observationScope && s.observationScope.actionTargetRef);
    const k = `${xp}|${s.sc}|${s.claimFamily || ''}`;
    if (!shadow.has(k)) shadow.set(k, []);
    shadow.get(k).push(s);
  }
  harness.set(npage(d.spec.file), { ledger, judgments, shadow });
}

const FAMILY_PHRASE = {
  'non-text-content': 'the text alternative for this non-text content',
  'long-description': 'the long description for this content',
  'images-of-text': 'this image of text',
  'accessible-name': 'the accessible name of this control',
  'focus-indicator-visible': 'the focus indicator on this element',
  'target-size': 'the size of this target',
  'link-purpose': 'the purpose of this link',
  'use-of-color': 'the use of colour here',
  'label-in-name': 'the visible label and the accessible name of this control',
};
const familyPhrase = (fam) => FAMILY_PHRASE[fam] || `the ${String(fam || 'requirement').replace(/-/g, ' ')} of this element`;

// Instruments report a measurement, not an opinion, so their sentence can say
// exactly what was measured rather than "a check failed".
const INSTRUMENT_SENTENCE = {
  'instrument:zoom-clip-probe': 'At 200% zoom this text is clipped or overlapped instead of reflowing.',
  'instrument:text-spacing-adequate': 'Applying the required text-spacing overrides clips or overlaps this content.',
  'instrument:no-meta-refresh-delay': 'The page refreshes itself on a timer that cannot be turned off, extended or paused.',
};

/**
 * The sentence for a deterministic harness finding, which carries no rationale.
 *
 * When the mechanism is a bundled rule check the rule's own wording is used.
 * Two columns can then read identically, which is the truth - that finding did
 * come from the same rule - and is better than the alternative: a column that
 * always says "a deterministic rule check reported a failure" is a column a
 * participant can pick out by its voice, and the letters are supposed to be
 * indistinguishable.
 */
function deterministicSentence(mechanism, source, family, page) {
  if (INSTRUMENT_SENTENCE[mechanism]) return INSTRUMENT_SENTENCE[mechanism];
  const rule = /^axe:(.+)$/.exec(mechanism || '');
  if (rule) {
    const m = axe.get(npage(page));
    const help = m && m.get(rule[1]);
    if (help) return sentence(help);
  }
  if (source === 'target-size-geometry' || /^geometry:/.test(mechanism || '')) {
    return 'Measured geometry puts this target below the required minimum size.';
  }
  if (source === 'instrument' || /^instrument:/.test(mechanism || '')) {
    return `An instrumented measurement reported a failure in ${familyPhrase(family)}.`;
  }
  return `A deterministic rule check reported a failure in ${familyPhrase(family)}.`;
}

function harnessReason(c) {
  const h = harness.get(npage(c.page.file));
  if (!h) return '';
  // The sampled family first, then every other family the ledger holds for this
  // element and SC. An element-keyed row (a detected positive) carries no
  // family at all, and a family-keyed row can be the one obligation the harness
  // left PARTIAL while a sibling under the same SC reports the barrier - which
  // is the verdict the column now shows, so it has to be the sentence too.
  const fams = [c.claimFamily || ''];
  for (const [k, o] of h.ledger) {
    const [xp, sc] = k.split('|');
    if (xp === c.normalizedXpath && sc === c.sc) fams.push(o.claimFamily || '');
  }
  for (const fam of fams) {
    const o = h.ledger.get(`${c.normalizedXpath}|${c.sc}|${fam}`);
    if (!o) continue;
    const pv = o.provisional;
    if (pv && pv.outcome === 'BARRIER_OBSERVED') {
      const j = pv.rationaleRef && h.judgments.get(pv.rationaleRef);
      if (j && j.summary) return sentence(j.summary);
      return deterministicSentence(pv.mechanism, pv.source, o.claimFamily, c.page.file);
    }
    // An uncleared CLAIM is the deterministic lane's own finding - an
    // instrument that measured the page and found it failing - and carries its
    // mechanism rather than a provisional block.
    if (o.disposition === 'CLAIM' && !o.cleared) {
      return deterministicSentence(o.mechanism, 'instrument', o.claimFamily, c.page.file);
    }
    // A terminal PARTIAL that the comparison still counted as a barrier: the
    // sentence lives on the shadow observation that reached that verdict.
    const obs = h.shadow.get(`${c.normalizedXpath}|${c.sc}|${o.claimFamily || ''}`) || [];
    for (const s of obs) {
      const j = s.rationaleRef && h.judgments.get(s.rationaleRef);
      if (j && j.summary && /BARRIER/.test((s.wouldBe && s.wouldBe.observationOutcome) || '')) return sentence(j.summary);
    }
  }
  return '';
}

// --- gena11y ---------------------------------------------------------------
const gen = new Map(); // `${page}|${sc}` -> Map(xpath -> reason)
for (const row of JSON.parse(fs.readFileSync(GENA11Y, 'utf8'))) {
  const v = row.gena11y && row.gena11y.violations;
  if (!v || !v.length) continue;
  const key = `${npage(row.pageFile)}|${row.sc}`;
  if (!gen.has(key)) gen.set(key, new Map());
  const m = gen.get(key);
  for (const x of v) if (x.xpath && !m.has(norm(x.xpath))) m.set(norm(x.xpath), x.reason || '');
}
const gena11yReason = (c) => {
  const m = gen.get(`${npage(c.page.file)}|${c.sc}`);
  return m ? sentence(m.get(c.normalizedXpath) || '') : '';
};

// --- apply -----------------------------------------------------------------
const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
const stat = { harness: [0, 0], gena11y: [0, 0], axe: [0, 0] };
const missing = [];
for (const c of sample.cases) {
  const reasons = { harness: harnessReason(c), gena11y: gena11yReason(c), axe: axeReason(c) };
  for (const t of ['harness', 'gena11y', 'axe']) {
    if (!c.tools[t].flagged) { delete c.tools[t].reason; continue; }
    stat[t][1]++;
    if (reasons[t]) { c.tools[t].reason = reasons[t]; stat[t][0]++; }
    else { delete c.tools[t].reason; missing.push(`${c.caseId} ${t} ${c.sc} ${c.page.file}`); }
  }
}
sample.reasonsEnrichedAt = new Date().toISOString();

if (!args.dry) fs.writeFileSync(SAMPLE, `${JSON.stringify(sample, null, 2)}\n`);
console.log(`${args.dry ? 'DRY - ' : ''}reasons -> ${path.relative(ROOT, SAMPLE)}`);
for (const t of ['harness', 'gena11y', 'axe']) console.log(`  ${t.padEnd(8)} ${stat[t][0]}/${stat[t][1]} flagged columns have a sentence`);
if (missing.length) {
  console.log(`  MISSING  ${missing.length}`);
  for (const m of missing.slice(0, 20)) console.log(`    ${m}`);
}
