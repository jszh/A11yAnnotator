// Deterministic result builder + STRICT validator (W2 / R2.1-B — fixes C5 + R2-C1).
//
// The agent emits ONLY per-element { xpath, axRole, axName, skills{<skill>:{verdict,
// sc, level, evidence, bucket?}} } records plus page-level `pageSkills`. buildResults()
// derives every aggregate (anyIssue, summary.bySkill, elementsWithIssue, deduped
// summary.issues INCLUDING page-level findings, bucket-aware normative tally) so the
// agent never hand-writes a total. validateResults() rejects any file whose shape,
// verdicts, SCs, levels, buckets, aggregates, or notFound handling violate
// RESULT-CONTRACT.md. scripts/tools/build-results.js is the only accepted output path.
'use strict';
const S = require('./result-schema.js');

const isIssue = v => v === 'REPRODUCED' || v === 'PARTIAL';
const bucketOf = sv => sv.bucket || 'normative';
const issueKey = (scope, skill, sv) => `${scope}|${skill}|${S.scCode(sv.sc) || ''}|${String(sv.evidence || '').trim().toLowerCase().slice(0, 120)}`;

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
  const issues = [];
  const seen = new Set();
  let normativeFailures = 0, atCompat = 0, bestPractice = 0;
  const pushIssue = (scope, xpath, skill, sv) => {
    const key = issueKey(scope, skill, sv);
    if (seen.has(key)) return; seen.add(key);
    const code = S.scCode(sv.sc);
    const bucket = bucketOf(sv);
    if (sv.verdict === 'REPRODUCED') { if (bucket === 'normative') normativeFailures++; else if (bucket === 'at-compat') atCompat++; else bestPractice++; }
    issues.push({ scope, xpath, skill, verdict: sv.verdict, sc: sv.sc || null, level: sv.level || (S.SC_LEVEL[code] || null), bucket, rule: sv.rule || null, evidence: String(sv.evidence || '').trim() });
  };
  for (const el of elements) {
    for (const k of S.SKILLS) {
      const sv = (el.skills || {})[k]; if (!sv) continue;
      const v = sv.verdict;
      if (v === 'REPRODUCED') bySkill[k].reproduced++;
      else if (v === 'PARTIAL') bySkill[k].partial++;
      else if (v === 'NOT REPRODUCED') bySkill[k].notReproduced++;
      else bySkill[k].na++;
      if (isIssue(v)) pushIssue('element', el.xpath, k, sv);
    }
  }
  // R2-C1: fold PAGE-LEVEL findings into the same issue list + tallies.
  const pageBySkill = {};
  for (const k of S.PAGE_SKILLS) {
    const sv = pageSkills[k]; if (!sv || !sv.verdict) continue;
    pageBySkill[k] = sv.verdict;
    if (isIssue(sv.verdict)) pushIssue('page', 'page-level', k, sv);
  }
  const elementsWithIssue = elements.filter(e => e.anyIssue).length;
  const pageHasIssue = Object.values(pageBySkill).some(isIssue);
  return {
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
        dedupedDefect: 'summary.issues: dedup by (scope, skill, sc, normalized-evidence)',
        normativeFailures: 'REPRODUCED with bucket=normative only',
      },
    },
  };
}

// SC is required only for NORMATIVE issues (R21-M3); best-practice/at-compat may carry
// an optional `rule` id instead of a WCAG SC.
const effBucket = sv => sv.bucket || 'normative';

// Validate a single skill verdict object (element or page scope). `allowed` = SC list.
function validateSkillVerdict(E, tag, k, sv, allowed) {
  if (!S.VERDICTS.includes(sv.verdict)) { E(`${tag}/${k}: verdict not in enum: ${JSON.stringify(sv.verdict)}`); return; }
  if (!isIssue(sv.verdict)) { if (sv.bucket && !S.BUCKETS.includes(sv.bucket)) E(`${tag}/${k}: bucket not in enum`); return; }
  if (!String(sv.evidence || '').trim()) E(`${tag}/${k}: ${sv.verdict} with empty evidence/reason`);
  if (sv.bucket && !S.BUCKETS.includes(sv.bucket)) E(`${tag}/${k}: bucket not in enum: ${JSON.stringify(sv.bucket)}`);
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

// Strict validator. Returns { ok, errors[] }. Self-contained: needs only the results
// object (the notFound dynamic check uses an element-level `notFound` flag if present).
function validateResults(R) {
  const errors = [];
  const E = m => errors.push(m);
  if (!R || typeof R !== 'object') return { ok: false, errors: ['results: not an object'] };
  if (!Array.isArray(R.elements)) { E('results: missing elements[]'); return { ok: false, errors }; }
  if (R.elements.length === 0) E('results: empty elements[] — a page evaluation must sample ≥1 element');
  if (!R.summary || typeof R.summary !== 'object') E('results: missing summary');
  if (!R.pageSkills || typeof R.pageSkills !== 'object') E('results: missing pageSkills');

  for (const el of R.elements) {
    const tag = (el.xpath || '?').slice(-22);
    const skills = el.skills || {};
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

  // R21-C1: ALL page skills must be present with a valid verdict record.
  for (const k of S.PAGE_SKILLS) {
    const sv = (R.pageSkills || {})[k];
    if (!sv || !sv.verdict) { E(`pageSkills: missing required key "${k}"`); continue; }
    validateSkillVerdict(E, 'page', k, sv, S.PAGE_SKILL_SCS[k]);
  }

  // R21-C1: the COMPLETE summary must equal a deterministic rebuild — every field,
  // and FULL issue objects (not a truncated key).
  if (R.summary && typeof R.summary === 'object') {
    const rebuilt = buildResults({ file: R.file, slug: R.slug, noscript: R.noscript, elements: R.elements, pageSkills: R.pageSkills });
    const s = R.summary, rs = rebuilt.summary;
    for (const f of ['elements', 'elementsWithIssue', 'pageHasIssue', 'normativeFailures', 'atCompatFindings', 'bestPracticeFindings']) {
      if (!(f in s)) E(`summary.${f} missing`); else if (s[f] !== rs[f]) E(`summary.${f}=${JSON.stringify(s[f])} != derived ${JSON.stringify(rs[f])}`);
    }
    if (!s.countBasis) E('summary.countBasis missing');
    if (!s.bySkill) E('summary.bySkill missing'); else for (const k of S.SKILLS) { const a = s.bySkill[k], b = rs.bySkill[k]; if (!a) { E(`summary.bySkill.${k} missing`); continue; } for (const c of ['reproduced', 'partial', 'notReproduced', 'na']) if (a[c] !== b[c]) E(`summary.bySkill.${k}.${c}=${a[c]} != derived ${b[c]}`); }
    if (!s.pageBySkill) E('summary.pageBySkill missing'); else for (const k of Object.keys(rs.pageBySkill)) if (s.pageBySkill[k] !== rs.pageBySkill[k]) E(`summary.pageBySkill.${k}=${s.pageBySkill[k]} != derived ${rs.pageBySkill[k]}`);
    if (!Array.isArray(s.issues)) E('summary.issues missing'); else {
      const full = i => `${i.scope}|${i.xpath}|${i.skill}|${i.verdict}|${S.scCodes(i.sc).join(',')}|${i.level || ''}|${i.bucket || ''}|${String(i.evidence || '').trim()}`;
      const a = new Set(s.issues.map(full)), b = new Set(rs.issues.map(full));
      if (a.size !== b.size) E(`summary.issues count ${a.size} != derived ${b.size}`);
      for (const k of b) if (!a.has(k)) E(`summary.issues missing/corrupted derived issue: ${k.slice(0, 70)}`);
      for (const k of a) if (!b.has(k)) E(`summary.issues has a non-derived/corrupted issue: ${k.slice(0, 70)}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { buildResults, validateResults, deriveElement };
