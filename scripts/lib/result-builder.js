// Deterministic result builder + STRICT validator (W2 / R2.1-B / R2.3-C).
//
// The agent emits ONLY per-element { xpath, axRole, axName, skills{<skill>:{verdict,
// sc, level, evidence, bucket?}} } records plus page-level `pageSkills`. buildResults()
// derives every aggregate (anyIssue, summary.bySkill, elementsWithIssue, deduped
// summary.issues INCLUDING page-level findings, bucket-aware normative tally) so the
// agent never hand-writes a total. validateResults() rejects any file whose shape,
// verdicts, SCs, levels, buckets, aggregates, provenance, completeness, or notFound
// handling violate RESULT-CONTRACT.md. scripts/tools/build-results.js is the only
// accepted output path.
//
// R2.3-C ROOT FIXES (R22-C1 completeness, R22-C2 determinism):
//  - COMPLETENESS: every verdict (incl N/A and NOT REPRODUCED) needs evidence/reason;
//    page-level categories are inherently applicable so N/A is rejected; results must
//    carry PROVENANCE tying every element back to the collector inventory (no dummy
//    element), and may not silently drop a collected element.
//  - DETERMINISM: issue dedup uses FULL evidence (not a 120-char prefix) and a
//    canonical merge PRECEDENCE (REPRODUCED > PARTIAL) so the normative tally cannot
//    depend on element order; issues are sorted canonically; the validator compares
//    rebuilt arrays EXACTLY (length + per-index, detecting duplicates) and rejects any
//    unexpected schema key (extra skills, extra summary fields, corrupted rule, ...).
'use strict';
const S = require('./result-schema.js');

const isIssue = v => v === 'REPRODUCED' || v === 'PARTIAL';
const bucketOf = sv => sv.bucket || 'normative';
const PREC = { 'REPRODUCED': 2, 'PARTIAL': 1 };
// Dedup/merge IDENTITY of a defect: scope + skill + SC(s) + bucket + rule + the FULL
// normalized evidence. Deliberately EXCLUDES xpath (a defect described identically on
// two elements is one defect — the long-standing contract) and EXCLUDES verdict (so a
// REPRODUCED and a PARTIAL of the SAME defect MERGE rather than racing on order).
const normEvidence = e => String(e || '').trim().replace(/\s+/g, ' ');
const issueIdentity = (scope, skill, sv) =>
  `${scope}|${skill}|${S.scCodes(sv.sc).join(',')}|${bucketOf(sv)}|${sv.rule || ''}|${normEvidence(sv.evidence).toLowerCase()}`;

// canonical full serialization of a BUILT issue object (used for exact comparison).
const fullIssue = i => `${i.scope}|${i.xpath}|${i.skill}|${i.verdict}|${S.scCodes(i.sc).join(',')}|${i.level || ''}|${i.bucket || ''}|${i.rule || ''}|${normEvidence(i.evidence)}`;

const ELEMENT_KEYS = new Set(['xpath', 'axRole', 'axName', 'appearanceShot', 'appearanceNote', 'notFound', 'skills', 'anyIssue']);
const VERDICT_KEYS = new Set(['verdict', 'sc', 'level', 'evidence', 'bucket', 'rule', 'isolation', 'trust', 'basis']);
const SUMMARY_KEYS = new Set(['elements', 'elementsWithIssue', 'pageHasIssue', 'bySkill', 'pageBySkill', 'normativeFailures', 'atCompatFindings', 'bestPracticeFindings', 'issues', 'countBasis']);
const TOP_KEYS = new Set(['file', 'slug', 'noscript', 'pageSkills', 'elements', 'summary', 'provenance']);
// R2.4-F: nested structures are also strict — no smuggled keys inside derived objects.
const ISSUE_KEYS = new Set(['scope', 'xpath', 'skill', 'verdict', 'sc', 'level', 'bucket', 'rule', 'evidence']);
const COUNTBASIS_KEYS = new Set(['subVerdict', 'elementWithIssue', 'dedupedDefect', 'normativeFailures']);
const BYSKILL_CELL_KEYS = new Set(['reproduced', 'partial', 'notReproduced', 'na']);

function deriveElement(el) {
  const skills = el.skills || {};
  const anyIssue = S.SKILLS.some(k => skills[k] && isIssue(skills[k].verdict));
  return { ...el, anyIssue };
}

function buildResults(input) {
  const elements = (input.elements || []).map(deriveElement);
  const pageSkills = input.pageSkills || {};
  const bySkill = {};
  for (const k of S.SKILLS) bySkill[k] = { reproduced: 0, partial: 0, notReproduced: 0, na: 0 };

  // 1) gather ALL candidate issues (element + page) — un-deduped.
  const cand = [];
  for (const el of elements) {
    for (const k of S.SKILLS) {
      const sv = (el.skills || {})[k]; if (!sv) continue;
      const v = sv.verdict;
      if (v === 'REPRODUCED') bySkill[k].reproduced++;
      else if (v === 'PARTIAL') bySkill[k].partial++;
      else if (v === 'NOT REPRODUCED') bySkill[k].notReproduced++;
      else bySkill[k].na++;
      if (isIssue(v)) cand.push({ scope: 'element', xpath: el.xpath, skill: k, sv });
    }
  }
  const pageBySkill = {};
  for (const k of S.PAGE_SKILLS) {
    const sv = pageSkills[k]; if (!sv || !sv.verdict) continue;
    pageBySkill[k] = sv.verdict;
    if (isIssue(sv.verdict)) cand.push({ scope: 'page', xpath: 'page-level', skill: k, sv });
  }

  // 2) MERGE by identity, choosing ONE canonical contributor: highest VERDICT precedence
  //    (REPRODUCED > PARTIAL), then the lexicographically smallest xpath AMONG that
  //    winning verdict. The emitted issue's xpath AND raw fields both come from that one
  //    contributor — so the representative xpath always carries the winning verdict
  //    (R23-M1), and output is byte-stable regardless of element order or raw casing.
  const groups = new Map();
  for (const c of cand) {
    const id = issueIdentity(c.scope, c.skill, c.sv);
    const g = groups.get(id);
    if (!g) { groups.set(id, { scope: c.scope, skill: c.skill, best: c }); continue; }
    const cur = g.best;
    const better = PREC[c.sv.verdict] > PREC[cur.sv.verdict]
      || (PREC[c.sv.verdict] === PREC[cur.sv.verdict] && c.xpath < cur.xpath);
    if (better) g.best = c;
  }
  let normativeFailures = 0, atCompat = 0, bestPractice = 0;
  const issues = [];
  for (const g of groups.values()) {
    const c = g.best, sv = c.sv, code = S.scCode(sv.sc), bucket = bucketOf(sv);
    if (sv.verdict === 'REPRODUCED') { if (bucket === 'normative') normativeFailures++; else if (bucket === 'at-compat') atCompat++; else bestPractice++; }
    issues.push({ scope: g.scope, xpath: c.xpath, skill: g.skill, verdict: sv.verdict, sc: sv.sc || null, level: sv.level || (S.SC_LEVEL[code] || null), bucket, rule: sv.rule || null, evidence: String(sv.evidence || '').trim().replace(/\s+/g, ' ') });
  }
  // 3) CANONICAL ORDER — identity-sorted, so output is byte-stable across input order.
  issues.sort((a, b) => fullIssue(a) < fullIssue(b) ? -1 : fullIssue(a) > fullIssue(b) ? 1 : 0);

  const elementsWithIssue = elements.filter(e => e.anyIssue).length;
  const pageHasIssue = Object.values(pageBySkill).some(isIssue);
  const out = {
    file: input.file, slug: input.slug, noscript: !!input.noscript,
    pageSkills,
    elements,
    summary: {
      elements: elements.length,
      elementsWithIssue,
      pageHasIssue,
      bySkill, pageBySkill,
      normativeFailures, atCompatFindings: atCompat, bestPracticeFindings: bestPractice,
      issues,
      countBasis: {
        subVerdict: 'element×skill REPRODUCED|PARTIAL (+ page-level)',
        elementWithIssue: '≥1 element issue sub-verdict',
        dedupedDefect: 'summary.issues: merge by (scope, skill, sc, bucket, rule, FULL-evidence); REPRODUCED>PARTIAL',
        normativeFailures: 'merged REPRODUCED with bucket=normative only',
      },
    },
  };
  if (input.provenance) out.provenance = input.provenance;
  return out;
}

// SC is required only for NORMATIVE issues (R21-M3); best-practice/at-compat may carry
// an optional `rule` id instead of a WCAG SC.
const effBucket = sv => sv.bucket || 'normative';

// Validate a single skill verdict object (element or page scope). `allowed` = SC list.
function validateSkillVerdict(E, tag, k, sv, allowed) {
  if (!sv || typeof sv !== 'object') { E(`${tag}/${k}: verdict record missing/not an object`); return; }
  for (const key of Object.keys(sv)) if (!VERDICT_KEYS.has(key)) E(`${tag}/${k}: unexpected key "${key}" in verdict record`);
  if (!S.VERDICTS.includes(sv.verdict)) { E(`${tag}/${k}: verdict not in enum: ${JSON.stringify(sv.verdict)}`); return; }
  // R2.3-C: EVERY verdict — including N/A and NOT REPRODUCED — must carry a reason.
  if (!String(sv.evidence || '').trim()) E(`${tag}/${k}: ${sv.verdict} with empty evidence/reason`);
  if (sv.bucket && !S.BUCKETS.includes(sv.bucket)) E(`${tag}/${k}: bucket not in enum: ${JSON.stringify(sv.bucket)}`);
  // R2.3-D (R22-H3): a DEFINITE dynamic verdict may not rest on synthetic or
  // non-isolated evidence. trust/isolation are stamped from the driver's behavioralTrust
  // (trusted+isolated probe). Enforce enum + the mandatory downgrade to PARTIAL.
  if (sv.trust != null && !['trusted', 'synthetic'].includes(sv.trust)) E(`${tag}/${k}: trust not in enum: ${JSON.stringify(sv.trust)}`);
  if (sv.isolation != null && !['isolated', 'shared'].includes(sv.isolation)) E(`${tag}/${k}: isolation not in enum: ${JSON.stringify(sv.isolation)}`);
  if (S.BEHAVIORAL_SKILLS.includes(k) && (sv.verdict === 'REPRODUCED' || sv.verdict === 'NOT REPRODUCED')) {
    if (sv.trust === 'synthetic') E(`${tag}/${k}: definite ${sv.verdict} resting on SYNTHETIC input must be PARTIAL (R22-H3)`);
    if (sv.isolation === 'shared') E(`${tag}/${k}: definite ${sv.verdict} resting on a NON-ISOLATED probe must be PARTIAL (R22-H3)`);
  }
  const codes = S.scCodes(sv.sc);
  // R2.4-F (R23-M2): SC/level are REQUIRED only for issues, but when PRESENT on ANY verdict
  // (incl NOT REPRODUCED / N/A — which may cite the SC they checked) they must still be
  // allowed for the skill and carry the matching level. Validate uniformly, don't skip.
  for (const code of codes) if (!allowed.includes(code)) E(`${tag}/${k}: SC ${code} not allowed for this skill`);
  for (const code of codes) if (S.SC_LEVEL[code] && sv.level && sv.level !== S.SC_LEVEL[code]) E(`${tag}/${k}: level ${sv.level} != ${S.SC_LEVEL[code]} for SC ${code}`);
  if (!isIssue(sv.verdict)) return; // the REQUIRED-SC / required-level rules below are issue-only
  const bucket = effBucket(sv);
  if (bucket === 'normative') {
    if (!codes.length) E(`${tag}/${k}: NORMATIVE ${sv.verdict} issue with no WCAG SC`);
    const primary = codes[0];
    if (primary && S.SC_LEVEL[primary]) { if (!sv.level) E(`${tag}/${k}: missing level for SC ${primary}`); }
  } else {
    if (!codes.length && !sv.rule) E(`${tag}/${k}: ${bucket} observation needs a WCAG SC or a non-SC \`rule\` id`);
  }
}

// R2.3-C / R2.4-A: PROVENANCE — tie every element back to the INDEPENDENT collector
// inventory so a fabricated element cannot validate, and completeness is DEFAULT-CLOSED:
// every collected element must be evaluated OR listed in `skipped[{xpath, reason}]`. The
// old `complete` flag was derived FROM the records (circular — dropping an element flipped
// it false and disabled the check); it is gone. Completeness is always enforced.
const PROV_COLLECT_KEYS = new Set(['xpaths', 'count', 'skipped', 'collectedAt']);
function validateProvenance(E, R) {
  const p = R.provenance;
  if (!p || typeof p !== 'object') { E('provenance: missing — results must be linked to the collector inventory'); return; }
  if (Object.keys(p).some(k => k !== 'collect')) E('provenance: only a `collect` block is permitted');
  const c = p.collect;
  if (!c || typeof c !== 'object') { E('provenance.collect: missing'); return; }
  for (const k of Object.keys(c)) if (!PROV_COLLECT_KEYS.has(k)) E(`provenance.collect: unexpected key "${k}"`);
  const inv = Array.isArray(c.xpaths) ? c.xpaths : null;
  if (!inv || !inv.length) { E('provenance.collect.xpaths: missing/empty inventory'); return; }
  const invSet = new Set(inv);
  if (invSet.size !== inv.length) E('provenance.collect.xpaths: duplicate entries in the inventory');
  if (c.count != null && c.count !== inv.length) E(`provenance.collect.count=${c.count} != inventory length ${inv.length}`);
  // skipped entries must be structured {xpath, reason}, in the inventory, reason non-empty.
  const skippedSet = new Set();
  for (const s of (Array.isArray(c.skipped) ? c.skipped : [])) {
    if (!s || typeof s !== 'object' || !s.xpath || !String(s.reason || '').trim()) { E('provenance.collect.skipped: each entry needs {xpath, reason} with a non-empty reason'); continue; }
    if (!invSet.has(s.xpath)) E(`provenance.collect.skipped: ${String(s.xpath).slice(-30)} is not in the inventory`);
    skippedSet.add(s.xpath);
  }
  const elXpaths = (R.elements || []).map(e => e.xpath);
  const seen = new Set();
  for (const xp of elXpaths) {
    if (!invSet.has(xp)) E(`provenance: element ${String(xp).slice(-30)} is not in the collector inventory (fabricated?)`);
    if (seen.has(xp)) E(`provenance: duplicate element ${String(xp).slice(-30)}`);
    seen.add(xp);
  }
  // DEFAULT-CLOSED completeness: every collected element is evaluated OR skipped-with-reason.
  for (const xp of inv) if (!seen.has(xp) && !skippedSet.has(xp)) E(`provenance: collected element ${String(xp).slice(-30)} was dropped (not evaluated, not skipped-with-reason)`);
  for (const xp of skippedSet) if (seen.has(xp)) E(`provenance: ${String(xp).slice(-30)} is both evaluated and skipped`);
}

// R2.4-B: distil drive.json into the per-element + page evidence the binding needs.
function driverEvidenceFrom(drive) {
  const byXpath = {};
  for (const e of (drive && drive.elements) || []) {
    const bt = e.behavioralTrust || {};
    byXpath[e.xpath] = {
      keyboard: bt.keyboard || null,
      arrowKeys: bt.arrowKeys || null,
      activation: bt.activation || null,
      focusProbed: !!(e.focusIndicator && (e.focusIndicator.present === true || e.focusIndicator.present === false)),
    };
  }
  const forms = (drive && drive.forms) || [];
  // forms are reloaded per-probe (always isolated); trust hinges on a trusted submit.
  const formsTrust = { probed: forms.length > 0, allTrustedIsolated: forms.length > 0 && forms.every(f => f.submitMethod === 'trusted') };
  return { byXpath, formsTrust };
}

// R2.4-B (R23-C2): bind a DEFINITE behavioral verdict to the DRIVER's own evidence
// (`drive.json` behavioralTrust / focusIndicator / forms), NOT the agent's self-attested
// trust/isolation. Returns { ok, reason }. `ev` is the per-element driver evidence;
// `formsTrust` is page-level. A definite verdict the driver did not support → PARTIAL.
function behavioralSupport(skill, verdict, ev, formsTrust) {
  if (skill === 'forms-instructions-errors') {
    if (!formsTrust || !formsTrust.probed) return { ok: false, reason: 'no form was submit-probed by the driver' };
    if (!formsTrust.allTrustedIsolated) return { ok: false, reason: 'a form submission was synthetic/non-trusted' };
    return { ok: true };
  }
  if (!ev) return { ok: false, reason: 'element was not behaviorally probed by the driver' };
  if (skill === 'focus-visibility') return ev.focusProbed ? { ok: true } : { ok: false, reason: 'no definite focus-indicator probe (element unreached/indeterminate)' };
  if (skill === 'focus-management' || skill === 'dynamic-announcement') {
    const a = ev.activation;
    if (!a) return { ok: false, reason: 'no activation probe (element gone/not activated)' };
    if (a.trusted !== true || a.isolated !== true) return { ok: false, reason: 'activation was synthetic or non-isolated' };
    return { ok: true };
  }
  if (skill === 'keyboard-operability') {
    const k = ev.keyboard;
    if (k && k.exercised) return (k.trusted === true && k.isolated === true) ? { ok: true } : { ok: false, reason: 'keyboard probe was synthetic or non-isolated' };
    if (k && k.exercised === false && k.trusted === null) {
      // native presumption: supports "operable" (no issue), NOT a keyboard FAILURE claim.
      return verdict === 'NOT REPRODUCED' ? { ok: true } : { ok: false, reason: 'native presumption cannot support a keyboard FAILURE — must be exercised' };
    }
    const a = ev.arrowKeys;
    if (a && a.trusted === true && a.isolated === true) return { ok: true };
    return { ok: false, reason: 'no trusted+isolated keyboard/arrow probe' };
  }
  return { ok: true };
}

// Strict validator. Returns { ok, errors[] }. `opts.driverEvidence` = { byXpath, formsTrust }
// binds definite behavioral verdicts to the driver's evidence (R2.4-B); when absent, the
// binding is skipped (library/unit use) — the mandatory gate (build-results.js) always
// supplies it.
function validateResults(R, opts = {}) {
  const errors = [];
  const E = m => errors.push(m);
  const DE = opts.driverEvidence || null;
  if (!R || typeof R !== 'object') return { ok: false, errors: ['results: not an object'] };
  for (const key of Object.keys(R)) if (!TOP_KEYS.has(key)) E(`results: unexpected top-level key "${key}"`);
  if (!Array.isArray(R.elements)) { E('results: missing elements[]'); return { ok: false, errors }; }
  if (R.elements.length === 0) E('results: empty elements[] — a page evaluation must sample ≥1 element');
  if (!R.summary || typeof R.summary !== 'object') E('results: missing summary');
  if (!R.pageSkills || typeof R.pageSkills !== 'object') E('results: missing pageSkills');

  validateProvenance(E, R);

  for (const el of R.elements) {
    const tag = (el.xpath || '?').slice(-22);
    for (const key of Object.keys(el)) if (!ELEMENT_KEYS.has(key)) E(`${tag}: unexpected element key "${key}"`);
    const skills = el.skills || {};
    for (const key of Object.keys(skills)) if (!S.SKILLS.includes(key)) E(`${tag}: unexpected skill key "${key}"`);
    for (const k of S.SKILLS) {
      const sv = skills[k];
      if (!sv) { E(`${tag}: missing skill key "${k}"`); continue; }
      validateSkillVerdict(E, tag, k, sv, S.SKILL_SCS[k]);
      if (el.notFound && S.DYNAMIC_SKILLS.includes(k) && (sv.verdict === 'REPRODUCED' || sv.verdict === 'NOT REPRODUCED'))
        E(`${tag}/${k}: definite ${sv.verdict} on notFound element (must be PARTIAL)`);
      // R2.4-B: bind definite behavioral verdicts to the DRIVER's evidence, not the
      // agent's self-report. Authoritative — even an agent-stamped trust:"trusted" fails
      // if the driver shows no trusted+isolated probe.
      if (DE && S.BEHAVIORAL_SKILLS.includes(k) && (sv.verdict === 'REPRODUCED' || sv.verdict === 'NOT REPRODUCED')) {
        const sup = behavioralSupport(k, sv.verdict, DE.byXpath && DE.byXpath[el.xpath], DE.formsTrust);
        if (!sup.ok) E(`${tag}/${k}: definite ${sv.verdict} not supported by driver evidence (${sup.reason}) — must be PARTIAL`);
      }
    }
    const derivedAny = S.SKILLS.some(k => skills[k] && isIssue(skills[k].verdict));
    if (!!el.anyIssue !== derivedAny) E(`${tag}: anyIssue=${el.anyIssue} but derived ${derivedAny}`);
  }

  // R21-C1/R2.3-C: ALL page skills present, valid, and NOT N/A (inherently applicable).
  for (const key of Object.keys(R.pageSkills || {})) if (!S.PAGE_SKILLS.includes(key)) E(`pageSkills: unexpected key "${key}"`);
  for (const k of S.PAGE_SKILLS) {
    const sv = (R.pageSkills || {})[k];
    if (!sv || !sv.verdict) { E(`pageSkills: missing required key "${k}"`); continue; }
    if (sv.verdict === 'N/A') E(`pageSkills/${k}: N/A is not permitted — page structure, reading order, and reflow are inherently applicable`);
    validateSkillVerdict(E, 'page', k, sv, S.PAGE_SKILL_SCS[k]);
  }

  // R21-C1: the COMPLETE summary must equal a deterministic rebuild — every field,
  // and FULL issue objects compared as EXACT canonical arrays (length + per-index),
  // which detects duplicates a Set would hide.
  if (R.summary && typeof R.summary === 'object') {
    for (const key of Object.keys(R.summary)) if (!SUMMARY_KEYS.has(key)) E(`summary: unexpected key "${key}"`);
    const rebuilt = buildResults({ file: R.file, slug: R.slug, noscript: R.noscript, elements: R.elements, pageSkills: R.pageSkills, provenance: R.provenance });
    const s = R.summary, rs = rebuilt.summary;
    for (const f of ['elements', 'elementsWithIssue', 'pageHasIssue', 'normativeFailures', 'atCompatFindings', 'bestPracticeFindings']) {
      if (!(f in s)) E(`summary.${f} missing`); else if (s[f] !== rs[f]) E(`summary.${f}=${JSON.stringify(s[f])} != derived ${JSON.stringify(rs[f])}`);
    }
    if (!s.countBasis) E('summary.countBasis missing'); else for (const key of Object.keys(s.countBasis)) if (!COUNTBASIS_KEYS.has(key)) E(`summary.countBasis: unexpected key "${key}"`);
    if (!s.bySkill) E('summary.bySkill missing'); else for (const k of S.SKILLS) { const a = s.bySkill[k], b = rs.bySkill[k]; if (!a) { E(`summary.bySkill.${k} missing`); continue; } for (const key of Object.keys(a)) if (!BYSKILL_CELL_KEYS.has(key)) E(`summary.bySkill.${k}: unexpected key "${key}"`); for (const c of ['reproduced', 'partial', 'notReproduced', 'na']) if (a[c] !== b[c]) E(`summary.bySkill.${k}.${c}=${a[c]} != derived ${b[c]}`); }
    if (!s.pageBySkill) E('summary.pageBySkill missing'); else { for (const k of Object.keys(rs.pageBySkill)) if (s.pageBySkill[k] !== rs.pageBySkill[k]) E(`summary.pageBySkill.${k}=${s.pageBySkill[k]} != derived ${rs.pageBySkill[k]}`); for (const k of Object.keys(s.pageBySkill)) if (!(k in rs.pageBySkill)) E(`summary.pageBySkill has non-derived key ${k}`); }
    if (!Array.isArray(s.issues)) E('summary.issues missing'); else {
      for (let i = 0; i < s.issues.length; i++) { const it = s.issues[i]; if (it && typeof it === 'object') for (const key of Object.keys(it)) if (!ISSUE_KEYS.has(key)) E(`summary.issues[${i}]: unexpected key "${key}"`); }
      const a = s.issues.map(fullIssue), b = rs.issues.map(fullIssue);
      if (a.length !== b.length) E(`summary.issues count ${a.length} != derived ${b.length} (duplicates or omissions)`);
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) if (a[i] !== b[i]) { E(`summary.issues[${i}] mismatch: ${a[i].slice(0, 70)} != ${b[i].slice(0, 70)}`); break; }
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { buildResults, validateResults, deriveElement, fullIssue, issueIdentity, driverEvidenceFrom, behavioralSupport };
