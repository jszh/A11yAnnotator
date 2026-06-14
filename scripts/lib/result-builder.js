// Deterministic result builder + validator (W2 — fixes C5).
//
// The agent emits ONLY per-element { xpath, axRole, axName, skills{<skill>:{verdict,
// sc, level, evidence, bucket?}} } records (+ pageSkills). buildResults() derives every
// aggregate (anyIssue, summary.bySkill, elementsWithIssue, summary.issues) so the agent
// can never introduce arithmetic drift. validateResults() rejects any file whose
// aggregates, verdicts, SCs, or notFound handling violate RESULT-CONTRACT.md.
'use strict';
const S = require('./result-schema.js');

const isIssue = v => v === 'REPRODUCED' || v === 'PARTIAL';

function deriveElement(el) {
  const skills = el.skills || {};
  const anyIssue = S.SKILLS.some(k => skills[k] && isIssue(skills[k].verdict));
  return { ...el, anyIssue };
}

function buildResults(input) {
  const elements = (input.elements || []).map(deriveElement);
  const bySkill = {};
  for (const k of S.SKILLS) bySkill[k] = { reproduced: 0, partial: 0, notReproduced: 0, na: 0 };
  const issues = [];
  const seen = new Set();
  for (const el of elements) {
    for (const k of S.SKILLS) {
      const sv = (el.skills || {})[k]; if (!sv) continue;
      const v = sv.verdict;
      if (v === 'REPRODUCED') bySkill[k].reproduced++;
      else if (v === 'PARTIAL') bySkill[k].partial++;
      else if (v === 'NOT REPRODUCED') bySkill[k].notReproduced++;
      else bySkill[k].na++;
      if (isIssue(v)) {
        const evid = String(sv.evidence || '').trim();
        const key = `${k}|${S.scCode(sv.sc) || ''}|${evid.toLowerCase().slice(0, 120)}`;
        if (!seen.has(key)) {
          seen.add(key);
          issues.push({ xpath: el.xpath, skill: k, verdict: v, sc: sv.sc || null, level: sv.level || (S.SC_LEVEL[S.scCode(sv.sc)] || null), bucket: sv.bucket || 'normative', evidence: evid });
        }
      }
    }
  }
  const elementsWithIssue = elements.filter(e => e.anyIssue).length;
  return {
    file: input.file, slug: input.slug, noscript: !!input.noscript,
    pageSkills: input.pageSkills || {},
    elements,
    summary: {
      elements: elements.length,
      elementsWithIssue,
      bySkill,
      issues,
      countBasis: { subVerdict: 'element×skill REPRODUCED|PARTIAL', elementWithIssue: '≥1 issue sub-verdict', dedupedDefect: 'summary.issues: dedup by (skill, sc, normalized-evidence)' },
    },
  };
}

// Returns { ok, errors[] }. Pure (works on a results object alone). The notFound
// dynamic-verdict check needs the drive bundle, so it is enforced in the sweep where
// drive.json is available; here we enforce the self-contained invariants.
function validateResults(R) {
  const errors = [];
  const E = (m) => errors.push(m);
  if (!R || !Array.isArray(R.elements)) { E('results: missing elements[]'); return { ok: false, errors }; }

  for (const el of R.elements) {
    const tag = (el.xpath || '?').slice(-22);
    const skills = el.skills || {};
    for (const k of S.SKILLS) {
      const sv = skills[k];
      if (!sv) { E(`${tag}: missing skill key "${k}"`); continue; }
      if (!S.VERDICTS.includes(sv.verdict)) { E(`${tag}/${k}: verdict not in enum: ${JSON.stringify(sv.verdict)}`); continue; }
      if (sv.verdict === 'REPRODUCED' && !String(sv.evidence || '').trim()) E(`${tag}/${k}: REPRODUCED with empty evidence`);
      if (sv.verdict === 'PARTIAL' && !String(sv.evidence || '').trim()) E(`${tag}/${k}: PARTIAL with no reason/evidence`);
      if (isIssue(sv.verdict)) {
        const code = S.scCode(sv.sc);
        if (code && !S.SKILL_SCS[k].includes(code)) E(`${tag}/${k}: SC ${code} not allowed for this skill`);
        if (sv.bucket && !S.BUCKETS.includes(sv.bucket)) E(`${tag}/${k}: bucket not in enum: ${JSON.stringify(sv.bucket)}`);
      }
    }
    // anyIssue must equal the derived value
    const derivedAny = S.SKILLS.some(k => skills[k] && isIssue(skills[k].verdict));
    if (!!el.anyIssue !== derivedAny) E(`${tag}: anyIssue=${el.anyIssue} but derived ${derivedAny}`);
  }

  // aggregate consistency vs a deterministic rebuild
  const rebuilt = buildResults({ file: R.file, slug: R.slug, noscript: R.noscript, elements: R.elements, pageSkills: R.pageSkills });
  if (R.summary) {
    if (typeof R.summary.elementsWithIssue === 'number' && R.summary.elementsWithIssue !== rebuilt.summary.elementsWithIssue)
      E(`summary.elementsWithIssue=${R.summary.elementsWithIssue} != derived ${rebuilt.summary.elementsWithIssue}`);
    if (R.summary.bySkill) for (const k of S.SKILLS) {
      const a = R.summary.bySkill[k], b = rebuilt.summary.bySkill[k];
      if (a && b) for (const cell of ['reproduced', 'partial', 'notReproduced', 'na'])
        if (typeof a[cell] === 'number' && a[cell] !== b[cell]) E(`summary.bySkill.${k}.${cell}=${a[cell]} != derived ${b[cell]}`);
    }
    if (Array.isArray(R.summary.issues) && R.summary.issues.length !== rebuilt.summary.issues.length)
      E(`summary.issues length ${R.summary.issues.length} != derived ${rebuilt.summary.issues.length}`);
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { buildResults, validateResults, deriveElement };
