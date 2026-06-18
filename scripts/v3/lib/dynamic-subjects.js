// Harness 3.0 — dynamic / provisional subjects (plan Rule 13; audit Rule 13 gap).
//
// Some experiments reveal NEW subjects only after an action (activating a control opens a dialog;
// the dialog's focusable children are new obligations). Rule 13 requires that such post-action
// subjects enter ONLY with typed discovery provenance (which action revealed them) AND a canonical
// content-addressed fingerprint, and that the builder then DETERMINISTICALLY EXPANDS their atomic
// obligations and reconciles each to a disposition — nothing discovered disappears, nothing is
// smuggled. A discovered subject's FAMILIES are derived by the same independent oracle from the
// subject's raw surface facts (not the runner's measurement), so a discovered subject can only carry
// the obligations its declared structure supports.
'use strict';

const crypto = require('crypto');
const oracle = require('./applicability-oracle.js');

// The canonical, content-addressed fingerprint of a discovered subject: a hash over its xpath and the
// normalized surface facts. A subject whose declared `fingerprint` does not equal this is rejected —
// so a forged subject cannot claim an identity its facts do not produce.
function fingerprintOf(subject) {
  const f = (subject && subject.surfaceFacts) || {};
  const canon = JSON.stringify({
    xpath: (subject && subject.xpath) || null,
    focusable: f.focusable === true, hasText: f.hasText === true, role: typeof f.role === 'string' ? f.role : null,
    isFormField: f.isFormField === true, inModal: f.inModal === true, underOverlay: f.underOverlay === true, hasHoverContent: f.hasHoverContent === true,
  });
  return 'sha256:' + crypto.createHash('sha256').update(canon).digest('hex');
}

// Static obligations are implicitly bounded by the collected element count; a DISCOVERED subject set is
// bounded only by what a (possibly buggy/compromised) runner result asserts. Without a cap, a result
// claiming 200k subjects expands to ~1.8M obligations (~1GB heap) and DoSes the build BEFORE any gate
// runs (gap-fill red-team). These caps are generous for legitimate discovery (a dialog rarely reveals
// >256 focusable subjects) yet bound the blowup; a breach is a FAIL-CLOSED error (the builder refuses),
// enforced BEFORE expansion so the pathological expansion never materializes.
const LIMITS = require('./limits.js'); // discovery DoS backstops (tier E)
const MAX_SUBJECTS_PER_RESULT = LIMITS.discovery.maxSubjectsPerResult;
const MAX_TOTAL_SUBJECTS = LIMITS.discovery.maxTotalSubjects;

// Expand the obligations contributed by dynamically-discovered subjects across all experiment results.
// Returns { obligations[], subjects[], errors[] }. A malformed/unprovenanced/forged-fingerprint subject
// is an ERROR (fail-closed); a well-formed one yields one obligation per oracle-derived family.
function expandDiscovered(experiments) {
  const obligations = [];
  const subjects = [];
  const errors = [];
  const seen = new Set();
  let totalSubjects = 0;
  for (const r of (experiments && experiments.results) || []) {
    const list = (r && r.discoveredSubjects) || [];
    if (!Array.isArray(list)) { errors.push(`result ${r && r.claimId}: discoveredSubjects must be an array`); continue; }
    // bound BEFORE the inner loop so an over-cap result never expands (DoS backstop, fail-closed).
    if (list.length > MAX_SUBJECTS_PER_RESULT) { errors.push(`result ${r && r.claimId}: ${list.length} discovered subjects exceeds per-result cap ${MAX_SUBJECTS_PER_RESULT} (over-cap ⇒ refuse)`); continue; }
    for (const s of list) {
      if (totalSubjects >= MAX_TOTAL_SUBJECTS) { errors.push(`discovered-subject total exceeds run cap ${MAX_TOTAL_SUBJECTS} (over-cap ⇒ refuse)`); break; }
      totalSubjects++;
      const from = r && r.claimId;
      if (!s || typeof s.xpath !== 'string' || !s.xpath) { errors.push(`discovered subject from ${from} requires a non-empty xpath`); continue; }
      if (typeof s.viaAction !== 'string' || !s.viaAction) { errors.push(`discovered subject ${s.xpath} from ${from} requires typed discovery provenance (viaAction)`); continue; }
      if (s.surfaceFacts != null && (typeof s.surfaceFacts !== 'object' || Array.isArray(s.surfaceFacts))) { errors.push(`discovered subject ${s.xpath} from ${from}: surfaceFacts must be an object`); continue; }
      const expected = fingerprintOf(s);
      if (s.fingerprint !== expected) { errors.push(`discovered subject ${s.xpath} from ${from}: fingerprint ${JSON.stringify(s.fingerprint)} != canonical ${expected} (content-address forgery)`); continue; }
      if (seen.has(s.fingerprint)) continue;  // identical subject discovered twice ⇒ dedupe deterministically
      seen.add(s.fingerprint);
      const el = { xpath: s.xpath, ...(s.surfaceFacts || {}) };
      const fams = oracle.familiesFor(el);
      for (const fam of fams) {
        const sc = oracle.scForFamily(fam);
        obligations.push({ obligationId: oracle.oblId(s.xpath, sc, fam), xpath: s.xpath, sc, claimFamily: fam });
      }
      subjects.push({ xpath: s.xpath, fingerprint: s.fingerprint, viaAction: s.viaAction, discoveredBy: from, families: fams });
    }
  }
  return { obligations, subjects, errors };
}

module.exports = { fingerprintOf, expandDiscovered, MAX_SUBJECTS_PER_RESULT, MAX_TOTAL_SUBJECTS };
