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
const issueIdentity = (scope, skill, sv) =>
  `${scope}|${skill}|${S.scCodes(sv.sc).join(',')}|${bucketOf(sv)}|${sv.rule || ''}|${String(sv.evidence || '').trim().toLowerCase()}`;

// canonical full serialization of a BUILT issue object (used for exact comparison).
const fullIssue = i => `${i.scope}|${i.xpath}|${i.skill}|${i.verdict}|${S.scCodes(i.sc).join(',')}|${i.level || ''}|${i.bucket || ''}|${i.rule || ''}|${String(i.evidence || '').trim()}`;

const ELEMENT_KEYS = new Set(['xpath', 'axRole', 'axName', 'appearanceShot', 'appearanceNote', 'notFound', 'skills', 'anyIssue']);
const VERDICT_KEYS = new Set(['verdict', 'sc', 'level', 'evidence', 'bucket', 'rule', 'isolation', 'trust', 'basis']);
const SUMMARY_KEYS = new Set(['elements', 'elementsWithIssue', 'pageHasIssue', 'bySkill', 'pageBySkill', 'normativeFailures', 'atCompatFindings', 'bestPracticeFindings', 'issues', 'countBasis']);
const TOP_KEYS = new Set(['file', 'slug', 'noscript', 'pageSkills', 'elements', 'summary', 'provenance']);

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

  // 2) MERGE by identity with deterministic precedence (REPRODUCED > PARTIAL); among
  //    equal-precedence contributors pick the lexicographically smallest xpath. This is
  //    order-INDEPENDENT, so the normative tally is stable regardless of element order.
  // All members of a group share identical sc/bucket/rule/evidence (they ARE the
  // identity), so only the VERDICT needs precedence (REPRODUCED > PARTIAL). The
  // representative xpath is the canonical (smallest) xpath across ALL contributors,
  // so output is identical no matter which element/order carried which verdict.
  const groups = new Map();
  for (const c of cand) {
    const id = issueIdentity(c.scope, c.skill, c.sv);
    let g = groups.get(id);
    if (!g) { groups.set(id, { scope: c.scope, skill: c.skill, sv: c.sv, xpath: c.xpath }); continue; }
    if (PREC[c.sv.verdict] > PREC[g.sv.verdict]) g.sv = c.sv;
    if (c.xpath < g.xpath) g.xpath = c.xpath;
  }
  let normativeFailures = 0, atCompat = 0, bestPractice = 0;
  const issues = [];
  for (const g of groups.values()) {
    const sv = g.sv, code = S.scCode(sv.sc), bucket = bucketOf(sv);
    if (sv.verdict === 'REPRODUCED') { if (bucket === 'normative') normativeFailures++; else if (bucket === 'at-compat') atCompat++; else bestPractice++; }
    issues.push({ scope: g.scope, xpath: g.xpath, skill: g.skill, verdict: sv.verdict, sc: sv.sc || null, level: sv.level || (S.SC_LEVEL[code] || null), bucket, rule: sv.rule || null, evidence: String(sv.evidence || '').trim() });
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
  if (S.DYNAMIC_SKILLS.includes(k) && (sv.verdict === 'REPRODUCED' || sv.verdict === 'NOT REPRODUCED')) {
    if (sv.trust === 'synthetic') E(`${tag}/${k}: definite ${sv.verdict} resting on SYNTHETIC input must be PARTIAL (R22-H3)`);
    if (sv.isolation === 'shared') E(`${tag}/${k}: definite ${sv.verdict} resting on a NON-ISOLATED probe must be PARTIAL (R22-H3)`);
  }
  if (!isIssue(sv.verdict)) return; // SC/level/rule only constrained for actual issues
  const bucket = effBucket(sv);
  const codes = S.scCodes(sv.sc);
  if (bucket === 'normative') {
    if (!codes.length) E(`${tag}/${k}: NORMATIVE ${sv.verdict} issue with no WCAG SC`);
    const primary = codes[0];
    if (primary && S.SC_LEVEL[primary]) { if (!sv.level) E(`${tag}/${k}: missing level for SC ${primary}`); else if (sv.level !== S.SC_LEVEL[primary]) E(`${tag}/${k}: level ${sv.level} != ${S.SC_LEVEL[primary]} for SC ${primary}`); }
  } else {
    if (!codes.length && !sv.rule) E(`${tag}/${k}: ${bucket} observation needs a WCAG SC or a non-SC \`rule\` id`);
  }
  for (const code of codes) if (!allowed.includes(code)) E(`${tag}/${k}: SC ${code} not allowed for this skill`);
}

// R2.3-C: PROVENANCE — tie every element back to the collector inventory so a fabricated
// ("dummy") element cannot validate, and a collected element cannot be silently dropped.
function validateProvenance(E, R) {
  const p = R.provenance;
  if (!p || typeof p !== 'object') { E('provenance: missing — results must be linked to the collector inventory'); return; }
  const inv = p.collect && Array.isArray(p.collect.xpaths) ? p.collect.xpaths : null;
  if (!inv || !inv.length) { E('provenance.collect.xpaths: missing/empty inventory'); return; }
  const invSet = new Set(inv);
  const elXpaths = (R.elements || []).map(e => e.xpath);
  // no fabricated element
  for (const xp of elXpaths) if (!invSet.has(xp)) E(`provenance: element ${String(xp).slice(-30)} is not in the collector inventory (fabricated?)`);
  // no duplicate elements
  const seen = new Set();
  for (const xp of elXpaths) { if (seen.has(xp)) E(`provenance: duplicate element ${String(xp).slice(-30)}`); seen.add(xp); }
  // completeness: when the inventory is declared fully evaluated, every collected element
  // must be present (or explicitly listed as skipped with a reason).
  if (p.collect.complete === true) {
    const skipped = new Set((Array.isArray(p.collect.skipped) ? p.collect.skipped : []).map(s => typeof s === 'string' ? s : s && s.xpath));
    for (const xp of inv) if (!seen.has(xp) && !skipped.has(xp)) E(`provenance: collected element ${String(xp).slice(-30)} was dropped (not evaluated, not skipped)`);
  }
}

// Strict validator. Returns { ok, errors[] }.
function validateResults(R) {
  const errors = [];
  const E = m => errors.push(m);
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
    if (!s.countBasis) E('summary.countBasis missing');
    if (!s.bySkill) E('summary.bySkill missing'); else for (const k of S.SKILLS) { const a = s.bySkill[k], b = rs.bySkill[k]; if (!a) { E(`summary.bySkill.${k} missing`); continue; } for (const c of ['reproduced', 'partial', 'notReproduced', 'na']) if (a[c] !== b[c]) E(`summary.bySkill.${k}.${c}=${a[c]} != derived ${b[c]}`); }
    if (!s.pageBySkill) E('summary.pageBySkill missing'); else { for (const k of Object.keys(rs.pageBySkill)) if (s.pageBySkill[k] !== rs.pageBySkill[k]) E(`summary.pageBySkill.${k}=${s.pageBySkill[k]} != derived ${rs.pageBySkill[k]}`); for (const k of Object.keys(s.pageBySkill)) if (!(k in rs.pageBySkill)) E(`summary.pageBySkill has non-derived key ${k}`); }
    if (!Array.isArray(s.issues)) E('summary.issues missing'); else {
      const a = s.issues.map(fullIssue), b = rs.issues.map(fullIssue);
      if (a.length !== b.length) E(`summary.issues count ${a.length} != derived ${b.length} (duplicates or omissions)`);
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) if (a[i] !== b[i]) { E(`summary.issues[${i}] mismatch: ${a[i].slice(0, 70)} != ${b[i].slice(0, 70)}`); break; }
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { buildResults, validateResults, deriveElement, fullIssue, issueIdentity };
