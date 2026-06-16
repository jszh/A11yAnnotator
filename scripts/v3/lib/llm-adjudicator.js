// Harness 3.1 — the FOURTH evidence source: a whole-obligation LLM verdict, realized as a
// `source:'llm'` SHADOW-emitting mechanism (plan 3.1 §2/§3). It directly inherits the v2.9 per-skill
// agent evaluation, but — unlike a deterministic runner — it can NEVER publish authoritative: its
// outputs are shadow observations, scored against the hand-labeled gold before any promotion, and
// even then capped at `canary` (authority.js). This module is the untrusted lane, treated like
// judgments.js: the builder consumes its artifact as DATA, never gospel.
//
// Two halves:
//   • CONSUMER  — processLlm(): validate + bind + verdict-map a frozen `llm` artifact into v3 shadow
//     observations (structured-only; free text stays in the side `llm-rationale` artifact). build-v3
//     calls this; it is a pure function over the artifact.
//   • PRODUCER  — runAdjudication(): the offline fan-out that PRODUCES that artifact. It reuses the
//     v2.9 pure signal pre-compute (a11y-eval) + skill prompts, judges per (element, skill) under a
//     budget, and binds each verdict to (xpath, sc, family). The agent call is INJECTABLE so this is
//     testable with a stub and a live API run is a thin adapter — never an accidental call.
'use strict';

const V = require('./v3-schema.js');
const A = require('../../lib/a11y-eval.js');
const oracle = require('./applicability-oracle.js');

const MECHANISM = 'llm-agent';
const V2_9_VERDICTS = ['REPRODUCED', 'NOT REPRODUCED', 'PARTIAL', 'N/A'];
const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// A legacy verdict token in an OPAQUE-ID position (evidenceRef / id) would trip build-v3's strict
// scanner and cause a non-deterministic PUBLISH REFUSAL (3.1 §2.3 / C3). Ids are opaque, so we simply
// SCRUB any ref that is literally a legacy token — it carries no meaning as an id, and dropping it
// keeps the structured record legacy-token-free by construction.
const LEGACY = new Set(['REPRODUCED', 'NOT REPRODUCED', 'N/A']);
// coerce first (a boxed `new String('N/A')` is typeof 'object' but serializes to the bare token).
const isLegacyToken = (s) => s != null && LEGACY.has(String(s).trim().toUpperCase().replace(/\s+/g, ' '));
const scrubRefs = (refs) => (Array.isArray(refs) ? refs.map(String).filter((r) => !isLegacyToken(r)) : []);
// A legacy token in an agent-controlled STRUCTURAL field (claimFamily / xpath / id / scope subfield)
// must be rejected at validation — with a CLEAR message — not survive to the terminal strict scan
// (which would be a confusing non-deterministic publish refusal) or, worse, leak via a wrapper object.
const rejectLegacy = (E, p, field, val) => { if (val != null && isLegacyToken(val)) E.push(`${p}.${field} must not be a legacy verdict token ${JSON.stringify(String(val))} (v3 schema break)`); };

// ---- CONSUMER: validate the frozen `llm` artifact shape (closed records) ----
// NOTE on the field name `agentVerdict` (NOT `verdict`): the artifact carries the RAW v2.9 token
// ('REPRODUCED'/'NOT REPRODUCED'/'PARTIAL'/'N/A'). The bundle's lenient legacy scan checks the VALUE
// of any field literally named `verdict`, so storing a raw token under `verdict` would make the
// cross-artifact gate reject the whole bundle. `agentVerdict` is the untrusted agent's raw reply — a
// non-schema string, exactly what the lenient scan is designed to tolerate. processLlm maps it to a v3
// outcome; only the mapped v3 enum ever reaches `results` (strict-scanned).
function validateLlmShape(art) {
  const E = [];
  if (art == null) return E;
  if (!isObj(art)) return ['llm: must be an object'];
  if (!Array.isArray(art.verdicts)) return ['llm.verdicts must be an array'];
  const KEYS = ['verdictId', 'sc', 'claimFamily', 'targetXpath', 'observationScope', 'agentVerdict', 'confidence', 'evidenceRefs', 'rationaleRef'];
  art.verdicts.forEach((v, i) => {
    const p = `llm.verdicts[${i}]`;
    if (!isObj(v)) return E.push(`${p}: must be an object`);
    for (const k of Object.keys(v)) if (!KEYS.includes(k)) E.push(`${p}: unknown key ${JSON.stringify(k)}`);
    if (!isStr(v.verdictId)) E.push(`${p}.verdictId required`);
    if (!V.ALL_SCS.includes(v.sc)) E.push(`${p}.sc ${JSON.stringify(v.sc)} is not a known SC`);
    if (!isStr(v.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!V2_9_VERDICTS.includes(v.agentVerdict)) E.push(`${p}.agentVerdict must be one of ${V2_9_VERDICTS.join('|')}`);
    if (v.confidence != null && !V.LLM_CONFIDENCE.includes(v.confidence)) E.push(`${p}.confidence must be ${V.LLM_CONFIDENCE.join('|')}`);
    if (v.evidenceRefs != null && !Array.isArray(v.evidenceRefs)) E.push(`${p}.evidenceRefs must be an array`);
    if (v.observationScope != null) {
      if (!isObj(v.observationScope)) E.push(`${p}.observationScope must be an object`);
      else for (const f of SCOPE_FIELDS) { if (!isStr(v.observationScope[f])) E.push(`${p}.observationScope.${f} must be a non-empty string`); else rejectLegacy(E, `${p}.observationScope`, f, v.observationScope[f]); }
    }
    // agent-controlled STRUCTURAL strings reach results — they may never be a legacy token (a boxed
    // wrapper is coerced by isLegacyToken). evidenceRefs are SCRUBBED instead (opaque ids), not rejected.
    for (const f of ['verdictId', 'targetXpath', 'rationaleRef', 'claimFamily']) rejectLegacy(E, p, f, v[f]);
  });
  return E;
}

// Bind + verdict-map the artifact into v3 shadow observations. Returns { shadowObservations[], errors[] }.
// Every record is STRUCTURED-ONLY (enum / xpath / SC / opaque id) — the rationale stays in the side
// artifact, referenced by id. An unmappable verdict is an ERROR (fail closed), not a guessed direction.
function processLlm(llmArt, opts = {}) {
  const errors = validateLlmShape(llmArt);
  if (errors.length) return { shadowObservations: [], errors };
  const shadowObservations = [];
  for (const v of (llmArt && llmArt.verdicts) || []) {
    const outcome = V.mapVerdict(v.agentVerdict, V.V2_9_VERDICT_MAP);
    if (outcome == null) { errors.push(`llm agentVerdict ${JSON.stringify(v.agentVerdict)} for ${v.targetXpath}/${v.sc} is not mappable to a v3 outcome`); continue; }
    const scope = v.observationScope || { actionTargetRef: v.targetXpath };
    shadowObservations.push(V.llmShadowObservation({
      sc: v.sc,
      claimFamily: v.claimFamily || null,
      observationScope: scope,
      observationOutcome: outcome,
      // the LLM may not assert INAPPLICABLE — N/A is an abstention (→ INCONCLUSIVE/UNKNOWN, H1).
      wcagApplicability: outcome === 'INCONCLUSIVE' ? 'UNKNOWN' : 'APPLICABLE',
      mechanism: MECHANISM,
      confidence: v.confidence,
      evidenceRefs: scrubRefs(v.evidenceRefs),
      decisionCoverageRef: v.verdictId || null,
      rationaleRef: v.rationaleRef || null,
    }));
  }
  return { shadowObservations, errors };
}

// ============================ PRODUCER (offline; the agent call is injectable) ============================

// SUBJECT SELECTION (3.1 §3 Coverage): prioritize obligations that are auto-PARTIAL (no deterministic
// CLAIM) — those give the 14 runner-less SCs a gold-gradeable opinion for the first time. We judge per
// (element, skill) — NOT per obligation — so the fan-out is the element×skill grid, not element×sc (M4).
function selectSubjects(collect, ledger, { onlyAutoPartial = true } = {}) {
  const elByXpath = {};
  for (const el of (collect && collect.elements) || []) if (el && el.xpath) elByXpath[el.xpath] = el;
  const rows = (ledger || []).filter((r) => (onlyAutoPartial ? r.autoPartial : true));
  // collapse (xpath, sc, family) obligations to (xpath, skill) judging subjects.
  const seen = new Set();
  const subjects = [];
  for (const r of rows) {
    for (const skill of oracle.skillsForFamily(r.claimFamily)) {
      const key = `${r.xpath}::${skill}`;
      if (seen.has(key)) continue;
      seen.add(key);
      subjects.push({ xpath: r.xpath, skill, sc: r.sc, claimFamily: r.claimFamily, element: elByXpath[r.xpath] || { xpath: r.xpath } });
    }
  }
  return subjects;
}

// v2.9 PURE SIGNAL PRE-COMPUTE (3.1 §3): reuse a11y-eval verbatim where the inputs exist on the
// element facts, so the agent reasons over the SAME deterministic measures v2.9 surfaced — never
// re-deriving them. Side-effect-free; returns a structured signal bundle the prompt embeds.
function precomputeSignals(element, skill) {
  element = element || {}; // the `= {}` default only fires on undefined; a malformed `null` must not crash
  const s = {};
  const num = (v) => (Number.isFinite(v) ? v : undefined);
  if (skill === 'color-and-visual-text' && element.box && typeof element.box === 'object') {
    s.targetSize = A.evalTargetSize(element.box, element.targetOpts || {});
  }
  if (element.fontPx != null) {
    s.largeText = A.isLargeText(element.fontPx, element.fontWeight);
    s.contrastThreshold = A.contrastThresholdFor(element.fontPx, element.fontWeight);
  }
  // parseRGB does `(s||'').match(...)`, so a non-string fg/bg (e.g. `{}`) would THROW and abort the
  // whole producer run — guard the types so one malformed element can't deny the page its LLM lane.
  if (typeof element.fg === 'string' && typeof element.bg === 'string') {
    const fg = A.parseRGB(element.fg), bg = A.parseRGB(element.bg);
    if (fg && bg) s.contrastRatio = A.contrastRatio([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
  }
  if (skill === 'focus-visibility' && element.focusStats) {
    s.focusRing = A.focusRingDecision({ realTabSpatial: element.focusStats });
  }
  if (skill === 'keyboard-operability') {
    s.keyboard = A.keyboardOperabilitySignal({
      role: element.role, tabindex: element.tabindex, reachedByTab: element.reachedByTab,
      respondedToSyntheticKey: element.respondedToSyntheticKey, respondsToArrows: element.respondsToArrows, focusable: element.focusable,
    });
  }
  s.boxMin = num(element.box && typeof element.box === 'object' ? Math.min(element.box.w, element.box.h) : undefined);
  return s;
}

// Assemble the agent prompt for one subject. Inherits the v2.9 skill rubric (the skills/*.md file when
// available) and embeds the pre-computed signals + the (realism-corrected) VSR transcript excerpt for
// the element. The agent must NAME the claimFamily (M3) and return {verdict, confidence, basis,
// evidenceRefs}. Pure string assembly — no I/O beyond an optional rubric read passed in via opts.
function buildPrompt(subject, signals, transcriptExcerpt, opts = {}) {
  const rubric = opts.rubric || `(rubric for skill "${subject.skill}" — judge whether a WCAG ${subject.sc} barrier is present)`;
  return [
    `You are the ${subject.skill} skill evaluating WCAG ${subject.sc} for one element.`,
    `Element xpath: ${subject.xpath}`,
    `Claim family (bind your verdict to this): ${subject.claimFamily}`,
    '--- rubric ---',
    rubric,
    '--- pre-computed deterministic signals (do not re-derive) ---',
    JSON.stringify(signals),
    '--- VSR announcement (realistic accessible name) ---',
    transcriptExcerpt ? JSON.stringify(transcriptExcerpt) : '(none)',
    '--- output ---',
    'Return STRICT JSON: {"verdict": "REPRODUCED"|"NOT REPRODUCED"|"PARTIAL"|"N/A", "confidence":"low"|"medium"|"high", "summary": string, "reasoning": string, "evidenceRefs": string[]}.',
    'REPRODUCED = a barrier is present; NOT REPRODUCED = no barrier; PARTIAL = cannot decide; N/A = abstain (do NOT use for "out of scope" — that is the oracle\'s job).',
    '"summary" = ONE sentence stating the verdict in plain language (for a human annotator). "reasoning" = ONE sentence citing the specific evidence that drove it.',
  ].join('\n');
}

// ONE sentence, normalized + bounded — for the human-readable annotation companion (NOT scored).
function oneSentence(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, 240);
}
// The compact VSR evidence an annotator should see: what the screen reader actually announced.
function compactVsr(step) {
  if (!step || typeof step !== 'object') return null;
  return { phrase: step.phrase, name: step.name, role: step.role, states: step.states, axName: step.axName, rawName: step.rawName };
}

// Run the offline adjudication. `runAgent(prompt, subject) -> { verdict, confidence, basis, evidenceRefs }`
// is INJECTABLE (default REFUSES, so a misconfigured run cannot silently hit an API). `budget` is the
// run-budget; `transcriptByXpath` maps xpath -> the realism-corrected VSR step. Returns the two frozen
// artifacts: `llm` (structured verdicts) + `llmRationale` (free text, bound by id).
async function runAdjudication(subjects, opts = {}) {
  const runAgent = opts.runAgent || (() => { throw new Error('llm-adjudicator: no runAgent configured (refusing to call an API by default)'); });
  const budget = opts.budget || null;
  const id = { file: opts.file || null, runId: opts.runId || null, pageDigest: opts.pageDigest || null };
  const transcriptByXpath = opts.transcriptByXpath || {};
  const scope = (xpath) => ({ actionTargetRef: xpath, state: opts.state || 'fresh-load', action: opts.action || 'inspect', environment: opts.environment || 'headless-chromium' });
  const verdicts = [];
  const rationales = [];
  let n = 0;
  for (const subj of subjects) {
    // a malformed budget (exceeded() that throws) must not crash the producer — degrade to "run".
    if (budget && typeof budget.exceeded === 'function') { let done = false; try { done = budget.exceeded(); } catch (e) { done = false; } if (done) break; }
    const transcriptExcerpt = transcriptByXpath[subj.xpath];
    const signals = precomputeSignals(subj.element, subj.skill);
    const prompt = buildPrompt(subj, signals, transcriptExcerpt, { rubric: opts.rubrics && opts.rubrics[subj.skill] });
    let out;
    try { out = await runAgent(prompt, subj); } catch (e) { out = null; }
    if (!out || !V2_9_VERDICTS.includes(out.verdict)) continue; // a malformed agent reply is dropped, never guessed
    const verdictId = `llm:${subj.skill}:${n++}`;
    const rationaleRef = `${verdictId}#basis`;
    verdicts.push({
      verdictId, sc: subj.sc, claimFamily: subj.claimFamily, targetXpath: subj.xpath,
      observationScope: scope(subj.xpath), agentVerdict: out.verdict,
      confidence: V.LLM_CONFIDENCE.includes(out.confidence) ? out.confidence : 'low',
      evidenceRefs: scrubRefs(out.evidenceRefs), rationaleRef,
    });
    // The ANNOTATION COMPANION (free text — lives ONLY in the side artifact, never in strict results):
    // for every verdict we record the EVIDENCE the LLM actually saw (the deterministic signals + the VSR
    // announcement) plus a 1-sentence SUMMARY and 1-sentence REASONING, so a hand-annotator can review
    // the verdict against its basis without re-deriving anything (3.1 §4 step 2: hand-label after the run).
    rationales.push({
      id: rationaleRef,
      verdictId, sc: subj.sc, targetXpath: subj.xpath, mechanism: MECHANISM, agentVerdict: out.verdict,
      summary: oneSentence(out.summary) || oneSentence(out.basis),
      reasoning: oneSentence(out.reasoning) || oneSentence(out.basis),
      evidence: { signals, vsr: compactVsr(transcriptExcerpt), evidenceRefs: scrubRefs(out.evidenceRefs) },
      basis: typeof out.basis === 'string' ? out.basis.slice(0, 2000) : '',
    });
  }
  return {
    llm: { ...id, model: opts.model || null, promptHash: opts.promptHash || null, verdicts },
    llmRationale: { ...id, rationales },
  };
}

module.exports = {
  MECHANISM, V2_9_VERDICTS, validateLlmShape, processLlm,
  selectSubjects, precomputeSignals, buildPrompt, runAdjudication, scrubRefs, isLegacyToken,
};
