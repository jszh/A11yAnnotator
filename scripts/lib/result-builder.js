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
    issues.push({ scope, xpath, skill, verdict: sv.verdict, sc: sv.sc || null, level: sv.level || (S.SC_LEVEL[code] || null), bucket, evidence: String(sv.evidence || '').trim() });
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

// Strict validator. Returns { ok, errors[] }. Self-contained: needs only the results
// object (the notFound dynamic check uses an element-level `notFound` flag if present).
function validateResults(R) {
  const errors = [];
  const E = m => errors.push(m);
  if (!R || typeof R !== 'object') return { ok: false, errors: ['results: not an object'] };
  if (!Array.isArray(R.elements)) E('results: missing elements[]');
  if (!R.summary || typeof R.summary !== 'object') E('results: missing summary');
  if (!R.pageSkills || typeof R.pageSkills !== 'object') E('results: missing pageSkills');

  for (const el of R.elements || []) {
    const tag = (el.xpath || '?').slice(-22);
    const skills = el.skills || {};
    for (const k of S.SKILLS) {
      const sv = skills[k];
      if (!sv) { E(`${tag}: missing skill key "${k}"`); continue; }
      if (!S.VERDICTS.includes(sv.verdict)) { E(`${tag}/${k}: verdict not in enum: ${JSON.stringify(sv.verdict)}`); continue; }
      if (isIssue(sv.verdict)) {
        if (!String(sv.evidence || '').trim()) E(`${tag}/${k}: ${sv.verdict} with empty evidence/reason`);
        const codes = S.scCodes(sv.sc);
        if (!codes.length) E(`${tag}/${k}: ${sv.verdict} issue with no WCAG SC`);
        for (const code of codes) if (!S.SKILL_SCS[k].includes(code)) E(`${tag}/${k}: SC ${code} not allowed for this skill`);
        const primary = codes[0];
        if (primary && sv.level && S.SC_LEVEL[primary] && sv.level !== S.SC_LEVEL[primary]) E(`${tag}/${k}: level ${sv.level} != ${S.SC_LEVEL[primary]} for SC ${primary}`);
        if (sv.bucket && !S.BUCKETS.includes(sv.bucket)) E(`${tag}/${k}: bucket not in enum: ${JSON.stringify(sv.bucket)}`);
      }
      // T6: no definite DYNAMIC verdict on a notFound element
      if (el.notFound && S.DYNAMIC_SKILLS.includes(k) && (sv.verdict === 'REPRODUCED' || sv.verdict === 'NOT REPRODUCED'))
        E(`${tag}/${k}: definite ${sv.verdict} on notFound element (must be PARTIAL)`);
    }
    const derivedAny = S.SKILLS.some(k => skills[k] && isIssue(skills[k].verdict));
    if (!!el.anyIssue !== derivedAny) E(`${tag}: anyIssue=${el.anyIssue} but derived ${derivedAny}`);
  }

  // page-skill SC validity
  for (const k of S.PAGE_SKILLS) {
    const sv = (R.pageSkills || {})[k]; if (!sv || !sv.verdict) continue;
    if (!S.VERDICTS.includes(sv.verdict)) E(`pageSkills/${k}: verdict not in enum`);
    if (isIssue(sv.verdict)) { const codes = S.scCodes(sv.sc); if (!codes.length) E(`pageSkills/${k}: issue with no SC`); for (const c of codes) if (!S.PAGE_SKILL_SCS[k].includes(c)) E(`pageSkills/${k}: SC ${c} not allowed`); }
  }

  // aggregates must EXACTLY equal the deterministic rebuild (content, not just length)
  if (R.summary && Array.isArray(R.elements)) {
    const rebuilt = buildResults({ file: R.file, slug: R.slug, noscript: R.noscript, elements: R.elements, pageSkills: R.pageSkills });
    const s = R.summary, rs = rebuilt.summary;
    if ('elementsWithIssue' in s && s.elementsWithIssue !== rs.elementsWithIssue) E(`summary.elementsWithIssue=${s.elementsWithIssue} != derived ${rs.elementsWithIssue}`);
    if ('normativeFailures' in s && s.normativeFailures !== rs.normativeFailures) E(`summary.normativeFailures=${s.normativeFailures} != derived ${rs.normativeFailures}`);
    if (s.bySkill) for (const k of S.SKILLS) { const a = s.bySkill[k], b = rs.bySkill[k]; if (a && b) for (const c of ['reproduced', 'partial', 'notReproduced', 'na']) if (a[c] !== b[c]) E(`summary.bySkill.${k}.${c}=${a[c]} != derived ${b[c]}`); }
    if (Array.isArray(s.issues)) {
      const norm = arr => new Set(arr.map(i => `${i.scope}|${i.skill}|${S.scCode(i.sc) || ''}|${String(i.evidence || '').trim().toLowerCase().slice(0, 120)}`));
      const a = norm(s.issues), b = norm(rs.issues);
      if (a.size !== b.size) E(`summary.issues count ${a.size} != derived ${b.size}`);
      for (const k of b) if (!a.has(k)) E(`summary.issues missing derived issue: ${k.slice(0, 60)}`);
      for (const k of a) if (!b.has(k)) E(`summary.issues has a non-derived issue: ${k.slice(0, 60)}`);
    } else E('summary.issues missing');
    if (!s.countBasis) E('summary.countBasis missing');
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { buildResults, validateResults, deriveElement };
