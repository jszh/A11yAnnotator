#!/usr/bin/env node
'use strict';
// Run the v3 LLM evidence lane over the ACT testcases where BOTH axe AND v3 produced a FALSE NEGATIVE
// (ground truth = `failed`, but neither flagged it) — i.e. worklist(.json|-proposed.json).bothFail. The
// question: on the cases the deterministic stack misses, does the (non-authoritative) LLM judge catch the
// barrier? Uses the UPDATED pipeline: ONE shared browser + tab allocator, page-level parallelism, per-item
// walls, full timing + LLM-trace logging. Writes a live `status.json` a separate monitor renders.
//
//   V3_LLM is forced ON here (this script IS the explicit, user-triggered activation; the corpus run stays
//   on-hold). Auth: Claude Code SUBSCRIPTION via CLAUDE_CODE_OAUTH_TOKEN in .env (no metered key).
//
// Usage:
//   node run-fn-llm.js                          # all 66 FN cases, LLM + vision, tools OFF
//   node run-fn-llm.js --limit=2                # smoke test (first 2)
//   node run-fn-llm.js --sc=2.4.4               # only one SC
//   node run-fn-llm.js --pages=4            # LLM/tab caps default to limits.js (overrides clamp to the limit)
//   node run-fn-llm.js --tools                  # PHASE 2: live in-process CDP tools (multi-turn)
// Then in another terminal:  node fn-llm-monitor.js

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const { orchestrate } = require('../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { makeRunAgent, makeClaudeSdkTransport, makeGeminiTransport, makeCodexTransport, makeOpenAITransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
const { collectActPage, normalizeCollectRoles } = require('../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore, sampleMemory } = require('../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../scripts/v3/lib/limits.js');
const puppeteer = require('puppeteer');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUBSET_DIR = path.join(__dirname, 'act-subset');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js'); // axe injected at collection → axe-promotion + checker-uncertainty
const LIMIT = Number(arg('limit', 0));                 // 0 = all
const SC = arg('sc', null);
const REACHES_LLM = !!arg('reaches-llm', false);       // run the REACHES-LLM set (recall on failed + SPECIFICITY on passed/inapplicable) instead of bothFail
const RUN_LLM = !arg('no-llm', false);                 // --no-llm ⇒ DETERMINISTIC-ONLY baseline (no LLM lane); measures what the detectors/axe catch alone
const RESTRICT_SC = REACHES_LLM || !!arg('restrict-sc', false); // judge ONLY the case's GT'd SC — ACT ground truth is per-SC (off-target verdicts are unscoreable + wasted spend)
const PAGE_CONC = Number(arg('pages', 8));             // pages orchestrated at once (default = cores-2 headroom; was 4 —
                                                      // too few to feed the global LLM cap once tools cap per-page conc)
// PROVIDER: 'claude' (default, subscription SDK) or 'gemini' (cross-family comparison via GEMINI_API_KEY). BOTH
// support the multi-turn tool path: claude via the Agent SDK MCP query() loop, gemini via the hand-rolled
// function-calling loop (makeGeminiToolTransport) over the SAME CDP handlers — only the agent-loop protocol differs.
const PROVIDER = arg('provider', 'claude');
// LLM concurrency is governed by limits.js — NOT a hand-picked number. Page-parallelism multiplies per-page
// concurrency, so the GLOBAL in-flight cap is clamped at the PROVIDER ceiling. Claude rides the subscription rate
// limit (LIMITS.concurrency.llm = 16; above ~19 in-flight the API rate-limits). Gemini has a SEPARATE, higher API
// quota, so its ceiling is raised (GEMINI_LLM_CAP, default 64) — an explicit --global-llm may exercise it up to that.
// An override may only go LOWER than the provider ceiling, never above. maxTabs likewise sources from limits.js.
const LLM_CAP = PROVIDER === 'gemini' ? Number(process.env.GEMINI_LLM_CAP || 64) : PROVIDER === 'codex' ? Number(process.env.CODEX_LLM_CAP || 16) : PROVIDER === 'openai' ? Number(process.env.OPENAI_LLM_CAP || 24) : LIMITS.concurrency.llm;
const GLOBAL_LLM = Math.min(LLM_CAP, Math.max(1, Number(arg('global-llm', LIMITS.concurrency.llm))));
const LLM_CONC = Math.min(LIMITS.concurrency.llm, Math.max(1, Number(arg('llm-concurrency', LIMITS.concurrency.llm)))); // per-page subjects; the global gate enforces the true cap
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Math.max(1, Number(arg('max-tabs', LIMITS.concurrency.maxTabs))));
const MAX_AUTO = Number(arg('max-auto', LIMITS.act.maxAuto));
const ELEMENT_CAP = Number(arg('element-cap', LIMITS.act.elementCap));
const RUN_WALL = Number(arg('run-wall-ms', LIMITS.act.runWallClockMs)); // experiment-lane wall-clock budget per page (defers the tail by TIME, not count)
// INSTRUMENTS lane robustness: cap concurrent keyboard-driving lanes WELL BELOW the page pool (they round-trip many
// Tab/settle presses and thrash a contended browser), and give each a generous hard timeout. A lane that exceeds it
// fails closed (no findings) — non-authoritative, so it never asserts a false NO_BARRIER, it just forgoes the catch.
const INSTRUMENTS_CONC = Math.max(1, Number(arg('instruments-conc', Math.min(PAGE_CONC, 4))));
const INSTRUMENTS_TIMEOUT = Number(arg('instruments-timeout-ms', 90000));
const instGate = makeSemaphore(INSTRUMENTS_CONC); // shared run-telemetry semaphore (.run(fn)); caps concurrent kbd-driving lanes
const VISION = arg('no-vision', false) ? false : true;
const TOOLS = !!arg('tools', false);
const CASES_FILE = arg('cases', null);                 // --cases=<file>: restrict to a whitespace-separated testcaseId list (subset eval; composes with --sc/--limit)
const RUN_NAME = arg('out', null) || 'fn-llm';
const OUT = path.join(REPO_ROOT, 'results', RUN_NAME); // --out=<name>: write to results/<name> instead of results/fn-llm (don't clobber a baseline)
// experiment identity (so the monitor can label WHICH config is running) + a fixed status path the monitor reads
// by default, so `node fn-llm-monitor.js` (no arg) always follows the latest run without retyping the run name.
const EVIDENCE_MODE = process.env.V3_HTML_EVIDENCE === '1' ? 'raw-html' : process.env.V3_MINIMAL_EVIDENCE === '1' ? 'name/role' : 'v3-signals';
const NO_VISION_RUBRIC = process.env.V3_NO_VISION_RUBRIC === '1';
const BASELINE_VISION = process.env.V3_BASELINE_VISION === '1';
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || process.env.FN_LLM_STATUS_PATH || '/tmp/llm-eval-status.json';
const STATUS_EVERY_MS = 500;

const MODEL = process.env.V3_LLM_MODEL || (PROVIDER === 'gemini' ? (arg('model', null) || 'gemini-3.5-flash') : (PROVIDER === 'codex' || PROVIDER === 'openai') ? (arg('model', null) || 'gpt-5.4') : 'claude-sonnet-4-6');
const envVal = (key) => { try { return (fs.readFileSync(path.join(REPO_ROOT, '.env'), 'utf8').split('\n').find((l) => l.startsWith(key + '=')) || '').split('=')[1].trim() || null; } catch (e) { return null; } };
const GEMINI_KEY = envVal('GEMINI_API_KEY');
// codex auth (the OpenAI Codex SDK lane): CODEX_API_KEY from .env OR ambient (`codex login`). Inert until set.
const CODEX_KEY = process.env.CODEX_API_KEY || envVal('CODEX_API_KEY');
// openai auth (the GPT hand-rolled function-calling lane): OPENAI_API_KEY from .env. Inert until set.
const OPENAI_KEY = process.env.OPENAI_API_KEY || envVal('OPENAI_API_KEY');
const TRANSPORT_CONFIG = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

// ---- FN worklist: union of approved + proposed bothFail, deduped by testcaseId ----
function loadFnCases() {
  const seen = new Set();
  const out = [];
  for (const wl of ['worklist.json', 'worklist-proposed.json']) {
    const p = path.join(SUBSET_DIR, wl);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of (data.bothFail || [])) {
      if (seen.has(c.testcaseId)) continue;
      seen.add(c.testcaseId);
      out.push({ ...c, draft: wl.includes('proposed') });
    }
  }
  return out;
}

// REACHES-LLM set: every DECIDED case the deterministic stack did NOT settle (`!axeFlag && !v3Flag`), so its
// target-SC obligation stays auto-PARTIAL and REACHES the LLM. Drawn from the proposed SUPERSET raw (approved +
// draft). `failed` ⇒ recall; `passed`/`inapplicable` ⇒ SPECIFICITY (a flagged barrier on the target SC = a false
// positive). failed-reaches = 66 here, matching the bothFail FN set exactly.
function loadReachesLlmCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const out = [];
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;          // decided by axe/v3 ⇒ does NOT reach the LLM on its SC
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue; // fixture must be present locally
    out.push({ ruleId: r.ruleId, ruleName: r.ruleName, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath, url: r.url, draft: r.approved === false });
  }
  return out;
}

const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);

// ============================ live telemetry ============================
const startedAt = Date.now();
const tel = {
  startedAt,
  runName: RUN_NAME,
  config: { fnTotal: 0, pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, perPageLlm: LLM_CONC, maxTabs: MAX_TABS, vision: VISION, tools: TOOLS, evidence: EVIDENCE_MODE, noVisionRubric: NO_VISION_RUBRIC, baselineVision: BASELINE_VISION, model: MODEL },
  phase: 'init',
  done: 0,
  total: 0,
  workers: {},     // workerId -> { idx, ruleId, sc, expected, phase, startedAt }
  inflight: {},    // callId  -> { xpath, sc, skill, startedAt }
  llm: { calls: 0, done: 0, results: 0, peakInFlight: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, costUsd: 0 },
  tabs: {},        // allocator.stats()
  mem: {},
  tally: { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 },
  recent: [],      // last N completions
  errors: [],
};

function writeStatus() {
  try {
    tel.elapsedMs = Date.now() - startedAt;
    tel.llm.inFlightNow = Object.keys(tel.inflight).length;
    const payload = JSON.stringify(tel);
    fs.writeFileSync(path.join(OUT, 'status.json'), payload);
    // mirror to a FIXED path (last-writer-wins) so the monitor can follow "the current run" with no arg; the
    // payload carries runName + config so the dashboard shows WHICH experiment owns it.
    try { fs.writeFileSync(FIXED_STATUS_PATH, payload); } catch (e) { /* best effort */ }
  } catch (e) { /* best effort */ }
}

// ============================ LLM agent: tee (token telemetry) + GLOBAL semaphore + inflight tracking ============================
const sem = makeSemaphore(GLOBAL_LLM);
let callSeq = 0;
function recordTrace(e) {
  if (!e || e.type !== 'result') return;
  const u = e.usage || {};
  tel.llm.inputTokens += (+u.input_tokens || 0);
  tel.llm.outputTokens += (+u.output_tokens || 0);
  tel.llm.cacheReadTokens += (+u.cache_read_input_tokens || 0);
  tel.llm.cacheCreateTokens += (+u.cache_creation_input_tokens || 0);
  if (typeof e.totalCostUsd === 'number') tel.llm.costUsd += e.totalCostUsd;
  tel.llm.results++;
}
// ONE config carrying the persistent token sink. It feeds BOTH the single-shot transport built here AND the
// multi-turn tool transport orchestrate builds internally (it rides `...llmTransportConfig`), so the monitor's
// token/cost counters stay honest whether tools are off or on.
const TRANSPORT_WITH_SINK = { ...TRANSPORT_CONFIG, onTraceSink: recordTrace };
// PROVIDER switch: gemini ⇒ cross-family single-shot transport (no tools, no OAuth), else the subscription SDK.
const baseTransport = PROVIDER === 'gemini'
  ? makeGeminiTransport({ apiKey: GEMINI_KEY, model: MODEL, onTraceSink: recordTrace }) // onTraceSink ⇒ Gemini tokens now hit the persistent telemetry
  : PROVIDER === 'codex'
    ? makeCodexTransport({ apiKey: CODEX_KEY, model: MODEL, effort: TRANSPORT_CONFIG.effort, onTraceSink: recordTrace, runTimeoutMs: TRANSPORT_CONFIG.runTimeoutMs }) // GPT-5.4 via the Codex SDK (vision; agent won't tool-call)
    : PROVIDER === 'openai'
      ? makeOpenAITransport({ apiKey: OPENAI_KEY, model: MODEL, effort: TRANSPORT_CONFIG.effort, onTraceSink: recordTrace, runTimeoutMs: TRANSPORT_CONFIG.runTimeoutMs }) // GPT-5.4 via Chat Completions (no-tools single-shot here; tool loop built in orchestrate)
      : makeClaudeSdkTransport(TRANSPORT_WITH_SINK);
const baseAgent = makeRunAgent({ transport: baseTransport, model: MODEL });
// GLOBAL semaphore + inflight tracking, factored so it wraps EITHER agent: the single-shot agent (here) and the
// tool agent (via orchestrate's wrapAgent hook). One global cap + one inflight view regardless of tools on/off.
const wrapAgent = (agent) => (messages, subject) => sem.run(async () => {
  const id = ++callSeq;
  tel.inflight[id] = { xpath: (subject && subject.xpath) || null, sc: (subject && subject.sc) || null, skill: (subject && (subject.skill || subject.rubricId)) || null, startedAt: Date.now() };
  tel.llm.calls++;
  const nIn = Object.keys(tel.inflight).length;        // LLM-concurrency high-water mark (real peak parallel calls)
  if (nIn > tel.llm.peakInFlight) tel.llm.peakInFlight = nIn;
  try { return await agent(messages, subject); }
  finally { delete tel.inflight[id]; tel.llm.done++; }
});
const runAgent = wrapAgent(baseAgent);

// ============================ cross-rule-indeterminate exclusion ============================
// THE EVAL-LABELING-ARTIFACT FIX. An ACT testcase carries ONE rule's expected outcome, but our harness judges the
// whole SC. For 1.1.1 the rules PARTITION images by accessibility-tree membership: 23a2a8/qt1vmo/7d6734/8fc3b6/59796f
// own IN-tree images ("has a name / descriptive name"); e88epe owns REMOVED-from-tree images ("is it decorative?").
// A page authored for an IN-tree rule and labeled passed/inapplicable can STILL contain a substantial REMOVED-from-tree
// image — inapplicable *to its own rule*, but e88epe IS applicable to that image and its verdict is a JUDGMENT
// (non-deterministic), and no e88epe label exists for the page. So the page's true 1.1.1 status is UNDETERMINED by the
// single label it carries: a correct barrier flag on the removed image would be graded a false positive against a label
// that never covered it (the W3C-wordmark-under-23a2a8 cases). Such a page is EXCLUDED from the specificity denominator
// (scored neither FP nor TN) and reported separately for audit — never silently dropped.
//
// Three guardrails keep this from excusing genuine errors (it must key on LABEL VALIDITY, never on whether WE agree):
//   1. Eligibility uses the STANDARD's applicability — e88epe applies to an image NOT in the a11y tree — NOT our
//      decorativeSuspect routing. A genuinely-clean page (NO removed image: the 7d6734 yellow circle, the e88epe
//      pdf-icon with alt="PDF") is therefore NOT excluded, and a real over-flag on it still counts as an FP.
//   2. INDETERMINACY size: below INDETERMINACY_MIN_DIM a removed image is an icon/spacer/sliver — unambiguously
//      decorative — so e88epe's verdict is deterministic and the single label IS valid ⇒ NOT excluded. (Independent of
//      the oracle's routing gate; it happens to be the same physical boundary — where decorativeness becomes a judgment.)
//   3. e88epe's OWN cases are never excluded — the owning rule's label is present, so the SC status IS determined.
const INDETERMINACY_MIN_DIM = 24; // px (min of width/height): below this a removed-from-tree image is unambiguously decorative
const E88EPE_SIBLINGS_111 = new Set(['23a2a8', 'qt1vmo', '7d6734', '8fc3b6', '59796f']); // 1.1.1 IN-tree image rules; e88epe owns REMOVED images
function crossRuleIndeterminate(tc, collect) {
  if (tc.expected === 'failed') return null;                     // only NEGATIVE-labeled cases are ever excluded
  if (!(tc.sc || []).includes('1.1.1')) return null;             // v1 encodes only the 1.1.1 in-tree/removed image partition
  if (!E88EPE_SIBLINGS_111.has(tc.ruleId)) return null;          // e88epe's own + unrelated rules: the label determines the SC
  const removedSubstantialImg = ((collect && collect.elements) || []).some((el) => {
    if (!(el.isImage === true || el.tag === 'img')) return false;
    if (el.removedFromA11yTree !== true) return false;           // e88epe applicability: image NOT in the accessibility tree
    const b = el.box; if (!b) return false;                      // two collectors: {width,height} (act-page) / {w,h} (eval-page)
    const w = b.width != null ? b.width : b.w; const h = b.height != null ? b.height : b.h;
    return w > 0 && h > 0 && Math.min(w, h) >= INDETERMINACY_MIN_DIM; // indeterminacy: large enough that decorativeness is a judgment
  });
  return removedSubstantialImg ? 'cross-rule-indeterminate:e88epe(1.1.1-removed-image)' : null;
}

// ============================ criterion-level GT override (*) ============================
// The 7 cross-rule-indeterminate 1.1.1 cases (crossRuleIndeterminate, above) were MANUALLY examined at the
// criterion level (the image + what e88epe says + our harness's verdict; see the audit). This map records that
// human judgment and REPLACES the blunt exclusion for them. The 2 aria-hidden W3C wordmarks are barriers e88epe
// fails (image-of-text denied to AT) → relabel `failed` (our catch becomes a recall TP, not an excluded would-be
// FP). The 5 decoratives (stripe texture / yellow circle / redundant PDF icon / atmospheric+redundant fireworks)
// e88epe passes → the original NEGATIVE label is CONFIRMED at criterion level and kept (so our correct clears count
// as true-negatives). Metrics computed WITH these overrides are starred (*); the raw ACT-label metrics are reported
// separately (summary.unmodified). Tiny + auditable BY DESIGN — extend ONLY after the same manual examination.
const GT_OVERRIDE = {
  '25e5364c0a1320a08e2742fa59a0f8627591bc61': { expected: 'failed', note: 'e88epe-fail: aria-hidden W3C wordmark (image-of-text) denied to AT' },        // 23a2a8
  'e15b9aca4aaa53cb3a96ae48e78e1af064b9a01d': { expected: 'failed', note: 'e88epe-fail: aria-hidden W3C wordmark denied to AT' },                         // 23a2a8
  'e8f40f5af06646ef15283302903f6c78f7d7a505': { expected: 'passed', note: 'e88epe-pass: decorative stripe texture (criterion-confirmed)' },               // 23a2a8
  'b3c602b7aa172611a22304666dd8d81d6ce8d214': { expected: 'inapplicable', note: 'e88epe-pass: decorative yellow circle' },                                // 7d6734
  '0ab8d652533229aae98191a6a43c2168e1959963': { expected: 'inapplicable', note: 'e88epe-pass: PDF icon redundant with "PDF document" text' },             // qt1vmo
  '4d04a4946e1f06834c89b91f0a765367f9d0d492': { expected: 'inapplicable', note: 'e88epe-pass: atmospheric fireworks photo, no unique information' },       // qt1vmo
  'ce2c30787caebdf1d6adcd6aedfac8fa8842a9c4': { expected: 'inapplicable', note: 'e88epe-pass: fireworks redundant with "Happy new year!"' },              // qt1vmo
};

// ============================ scoring one case ============================
function scoreCase(tc, out, collect) {
  const inScope = new Set(tc.sc || []);
  const built = out && out.built;
  const bundle = (out && out.bundle) || {};
  const rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: tc.sc, expected: tc.expected, draft: !!tc.draft, url: tc.url };

  const agentV = (bundle.llm && bundle.llm.verdicts) || [];
  const rubricV = (bundle.judgments && bundle.judgments.judgments) || [];
  const agentInScope = agentV.filter((v) => inScope.has(v.sc));
  const rubricInScope = rubricV.filter((j) => inScope.has(j.sc));

  // deterministic re-check (these should be FN ⇒ no in-scope deterministic barrier; recorded honestly)
  const shadow = (built && built.results && built.results.shadowObservations) || [];
  rec.v3Barrier = shadow.some((o) => o.source === 'deterministic' && inScope.has(o.sc) && o.wouldBe && o.wouldBe.observationOutcome === 'BARRIER_OBSERVED');

  // in-scope obligation ledger (was the LLM even ASKED about this SC?)
  const ledger = (built && built.results && built.results.obligationLedger) || [];
  const inScopeOblig = ledger.filter((r) => inScope.has(r.sc));
  rec.inScopeObligations = inScopeOblig.length;
  rec.inScopeAutoPartial = inScopeOblig.filter((r) => r.autoPartial).length;
  // a MINTED/deterministic BARRIER that FILLED an in-scope obligation (autoPartial=false, cleared=false) is the
  // harness catching it — covers the axe-decided, deterministic-detector (iframe/aria-hidden/role=none) and
  // keyboard-trap PROVISIONAL barriers that fill the ledger but never enter shadowObservations as source:
  // 'deterministic' (so rec.v3Barrier misses them, and the obligation, being filled, is no longer autoPartial →
  // it was mis-scored as noObligation/noVerdict). This is the minted-barrier analog of the v3Barrier credit.
  // ONLY a minted PROVISIONAL BARRIER counts as a catch — NOT a deferred/review PARTIAL. The old test
  // (`autoPartial === false`) also matched a deliberate PARTIAL (a checker/runner/instrument flagging the obligation
  // for REVIEW without asserting a barrier — e.g. contrast on a photo backdrop, the demoted confinement review),
  // which inflated BOTH recall and FP by scoring "the harness deferred" as "the harness caught it".
  rec.inScopeBarrierFilled = inScopeOblig.filter((r) => r.disposition === 'PROVISIONAL' && r.cleared === false).length;

  // RESPECT the obligation-ledger reconcile (audit: the scorer must not bypass a deployed FP fix). A rubric
  // LIKELY_BARRIER that the ledger RECONCILED-SUPPRESSED — e.g. the 2.4.4 link-equivalence-authoritative rule
  // cleared the obligation because link-name-equivalence-v0 settled it, so the row is PROVISIONAL/cleared with
  // `provisional.reconciled.suppressed` naming the dropped link-purpose mechanism — must NOT be re-counted here as a
  // raw catch. Without this exclusion the eval scores the RAW rubric verdict and the ledger reconcile is invisible
  // to recall/FP (the bug: a799c1/e0d32d showed barrierFilled=0 yet `caught`). Keyed by xpath::sc::rubricId.
  const reconciledSuppressed = new Set();
  for (const r of inScopeOblig) {
    const sup = r && r.cleared === true && r.provisional && r.provisional.reconciled && r.provisional.reconciled.suppressed;
    if (Array.isArray(sup)) for (const mech of sup) reconciledSuppressed.add(`${r.xpath}::${r.sc}::${String(mech).replace(/^llm-rubric:/, '')}`);
  }
  const barrierAgent = agentInScope.filter((v) => v.agentVerdict === 'REPRODUCED');
  const barrierRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_BARRIER'
    && !reconciledSuppressed.has(`${j.targetXpath}::${j.sc}::${j.rubricRef}`));
  const okAgent = agentInScope.filter((v) => v.agentVerdict === 'NOT REPRODUCED');
  const okRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_OK');
  const nVerdicts = agentInScope.length + rubricInScope.length;

  let outcome;
  // CREDIT a deterministic in-scope barrier: the harness CAUGHT it via a runner/checker (the obligation was filled
  // deterministically and correctly subtracted from the LLM lane), so it is a true catch — NOT a noObligation FN.
  // Without this, the LLM-only scorer penalized the harness for a barrier it actually found (the contrast/keyboard
  // runner cases that show v3Barrier:true but produce no LLM verdict because the obligation was already disposed).
  if (rec.v3Barrier || rec.inScopeBarrierFilled > 0) outcome = 'caught';
  else if (barrierAgent.length || barrierRubric.length) outcome = 'caught';
  else if (nVerdicts === 0) outcome = rec.inScopeAutoPartial > 0 ? 'noVerdict' : 'noObligation';
  else if (okAgent.length || okRubric.length) outcome = 'missedAgree';
  else outcome = 'uncertain';
  rec.outcome = outcome;
  rec.llmFlag = outcome === 'caught';
  // POLARITY (ACT GT is per-SC): on a `failed` case a flagged barrier is a TRUE POSITIVE (recall); on a
  // `passed`/`inapplicable` case the SAME flag is a FALSE POSITIVE (the LLM invented a barrier the GT denies).
  // CRITERION-LEVEL GT OVERRIDE (*): a hand-examined cross-rule case uses its asserted criterion-level label for
  // scoring (and is NOT excluded — the override supersedes the exclusion). `rec.expected` stays the ORIGINAL ACT
  // label (the un-modified table reads it); `rec.effectiveExpected` drives the starred metrics.
  const ov = GT_OVERRIDE[tc.testcaseId] || null;
  const effExpected = ov ? ov.expected : tc.expected;
  rec.effectiveExpected = effExpected;
  if (ov) { rec.gtOverride = true; rec.gtOverrideNote = ov.note; }
  rec.polarity = effExpected === 'failed' ? 'recall' : 'specificity';
  rec.correct = rec.polarity === 'recall' ? (outcome === 'caught') : (outcome !== 'caught');
  rec.falsePositive = rec.polarity === 'specificity' && outcome === 'caught';
  // CROSS-RULE-INDETERMINATE EXCLUSION (fallback for any cross-rule case NOT hand-resolved above): a negative-labeled
  // page whose true SC status its single ACT-rule label does not determine. Removed from the specificity denominator
  // in summarize() and reported for audit. Skipped when a GT override is present (the override resolves it).
  if (!ov) { const excl = crossRuleIndeterminate(tc, collect); if (excl) { rec.excluded = true; rec.excludedReason = excl; } }

  // surface the actual verdicts + rationale so the run is auditable
  const rats = (bundle.llmRationale && bundle.llmRationale.rationales) || [];
  const ratById = {}; for (const r of rats) ratById[r.verdictId] = r;
  rec.agentVerdicts = agentInScope.map((v) => ({ sc: v.sc, verdict: v.agentVerdict, confidence: v.confidence, claimFamily: v.claimFamily, xpath: v.targetXpath,
    summary: (ratById[v.verdictId] && ratById[v.verdictId].summary) || null }));
  rec.rubricVerdicts = rubricInScope.map((j) => ({ sc: j.sc, verdict: j.verdict, confidence: j.confidence, rubric: j.rubricRef, xpath: j.targetXpath, summary: j.summary || null }));
  // also note any OUT-of-scope barrier the LLM raised (the page may fail a DIFFERENT SC than the ACT rule targets)
  rec.otherBarriers = [
    ...agentV.filter((v) => !inScope.has(v.sc) && v.agentVerdict === 'REPRODUCED').map((v) => ({ kind: 'agent', sc: v.sc, xpath: v.targetXpath })),
    ...rubricV.filter((j) => !inScope.has(j.sc) && j.verdict === 'LIKELY_BARRIER').map((j) => ({ kind: 'rubric', sc: j.sc, rubric: j.rubricRef, xpath: j.targetXpath })),
  ];
  rec.timings = (bundle.timings && bundle.timings.stages) || null;
  return rec;
}

// ============================ main ============================
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'traces'), { recursive: true });
  let cases = REACHES_LLM ? loadReachesLlmCases() : loadFnCases();
  if (SC) cases = cases.filter((c) => (c.sc || []).includes(SC));
  if (CASES_FILE) {
    const ids = new Set(fs.readFileSync(CASES_FILE, 'utf8').split(/\s+/).filter(Boolean));
    const before = cases.length;
    cases = cases.filter((c) => ids.has(c.testcaseId));
    console.log(`--cases ${path.basename(CASES_FILE)}: ${ids.size} ids → ${cases.length} matched (of ${before})`);
  }
  if (Number.isFinite(LIMIT) && LIMIT > 0) cases = cases.slice(0, LIMIT);
  tel.total = cases.length;
  tel.config.fnTotal = cases.length;
  tel.phase = 'launching';
  writeStatus();
  console.log(`FN×LLM run: ${cases.length} cases | provider=${PROVIDER} model=${MODEL} effort=${TRANSPORT_CONFIG.effort} | pages=${PAGE_CONC} globalLLM=${GLOBAL_LLM} maxTabs=${MAX_TABS} vision=${VISION} tools=${TOOLS}`);
  console.log(`status → ${path.join(OUT, 'status.json')}  (run: node ${path.relative(process.cwd(), path.join(__dirname, 'fn-llm-monitor.js'))})`);

  if (PROVIDER === 'gemini') { if (!GEMINI_KEY) { console.error('FATAL: GEMINI_API_KEY not set (.env)'); process.exit(1); } }
  else if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const browserPid = browser.process() && browser.process().pid;
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  tel.phase = 'running';

  // status writer (+ memory sampler) on a timer
  let sampling = false;
  const statusTimer = setInterval(async () => {
    tel.tabs = alloc.stats();
    if (!sampling) { sampling = true; try { tel.mem = await sampleMemory(browserPid); } catch (e) {} finally { sampling = false; } }
    writeStatus();
  }, STATUS_EVERY_MS);
  if (statusTimer.unref) statusTimer.unref();

  const results = [];
  const allTraces = [];
  const persist = () => {
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
    // token usage rides into the DURABLE summary (not just the transient status.json): input/output (+cache) totals,
    // mean per judged verdict, and cost — so every experiment record carries its token spend.
    const tk = tel.llm;
    const tokens = { provider: PROVIDER, model: MODEL, inputTokens: tk.inputTokens, outputTokens: tk.outputTokens, totalTokens: tk.inputTokens + tk.outputTokens, cacheReadTokens: tk.cacheReadTokens, cacheCreateTokens: tk.cacheCreateTokens, costUsd: tk.costUsd, usageEvents: tk.results, meanOutputPerVerdict: tk.results ? Math.round(tk.outputTokens / tk.results) : 0 };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ ...summarize(results), tokens }, null, 2));
  };

  let cursor = 0;
  const worker = async (wid) => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) { delete tel.workers[wid]; return; }
      const tc = cases[i];
      const runId = `fn-llm-${tc.testcaseId}`;
      tel.workers[wid] = { idx: i, ruleId: tc.ruleId, sc: (tc.sc || []).join(','), expected: tc.expected, phase: 'collect', startedAt: Date.now() };
      let rec;
      try {
        // COLLECT: borrow a tab from the shared allocator, navigate + extract, release.
        const lease = await alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: urlFor(tc), elementCap: ELEMENT_CAP, file: `act:${tc.testcaseId}`, runId, sourceUrl: tc.url,
            runAxe: true, axePath: AXE_PATH, // surface axe → the axe-promotion (decided) + checker-uncertainty obligations (incomplete)
          }));
        } finally { await lease.release(); }
        tel.workers[wid].phase = 'orchestrate';
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => urlFor(tc),
          executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          // INSTRUMENTS lane (VSR + keyboard-trap + focus-rests-in-aria-hidden) — was NEVER enabled here, so the kbd
          // 2.1.2 + 6cfa84 4.1.2 deterministic catches silently never ran (those cases read as noObligation). Enable it,
          // gated to a LOWER concurrency than the page pool (the lane DRIVES the keyboard and thrashes a contended
          // browser) and bounded by a hard timeout (orchestrate races it; a slow/hung lane fails closed to no findings).
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT,
          now: collect.collectedAt + 2,
          restrictScs: RESTRICT_SC ? new Set(tc.sc || []) : undefined, // judge ONLY the case's GT'd SC (ACT GT is per-SC)
          maxAutomatic: Number.isFinite(MAX_AUTO) ? MAX_AUTO : Infinity,
          budgetOpts: { maxRunWallClockMs: RUN_WALL }, // deterministic lane bounded by TIME (2 min), not count — run as many real runners as fit, defer the tail to the LLM lane

          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: RUN_LLM, runAgent, captureVision: RUN_LLM && VISION, wrapAgent, // --no-llm ⇒ DETERMINISTIC baseline (no LLM lane, no vision capture)
          llmConcurrency: LLM_CONC,
          llmTools: TOOLS, llmTransportConfig: TRANSPORT_WITH_SINK,
          llmProvider: PROVIDER, geminiKey: GEMINI_KEY, codexKey: CODEX_KEY, openaiKey: OPENAI_KEY, // gemini/openai ⇒ hand-rolled tool loop; codex ⇒ HTTP MCP cdp server
          llmToolConcurrency: LIMITS.concurrency.llmTool,
          llmToolMaxTurns: LIMITS.llm.toolMaxTurns,
          llmToolRunTimeoutMs: LIMITS.llm.toolRunTimeoutMs,
        });
        rec = scoreCase(tc, out, collect);
        // full LLM trace → side file (offline analysis); base64 already elided by the transport.
        const traces = (out.bundle && out.bundle.llmTrace && out.bundle.llmTrace.traces) || [];
        if (traces.length) allTraces.push({ testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, traces });
      } catch (e) {
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.stack) || e) };
        tel.errors.push({ ruleId: tc.ruleId, testcaseId: tc.testcaseId, error: String((e && e.message) || e) });
      }
      results.push(rec);
      tel.done = results.length;
      tel.tally[rec.outcome] = (tel.tally[rec.outcome] || 0) + 1;
      tel.recent.unshift({ ruleId: tc.ruleId, sc: (tc.sc || []).join(','), outcome: rec.outcome, ms: Date.now() - tel.workers[wid].startedAt });
      tel.recent = tel.recent.slice(0, 10);
      persist();
      writeStatus();
    }
  };

  const nWorkers = Math.min(PAGE_CONC, cases.length || 1);
  await Promise.all(Array.from({ length: nWorkers }, (_, w) => worker(`w${w + 1}`)));

  clearInterval(statusTimer);
  tel.tabs = alloc.stats();
  alloc.close();
  await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'llm-trace.json'), JSON.stringify(allTraces, null, 2));
  persist();
  tel.phase = 'done';
  writeStatus();

  printSummary(results);
}

function summarize(results) {
  const tally = { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
  const bySc = {};
  const byExpected = {}; // expected -> outcome counts
  for (const r of results) {
    tally[r.outcome] = (tally[r.outcome] || 0) + 1;
    const e = r.expected || 'unknown';
    const be = byExpected[e] || (byExpected[e] = { n: 0, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 });
    be.n++; be[r.outcome] = (be[r.outcome] || 0) + 1;
    for (const sc of (r.sc || [])) {
      bySc[sc] = bySc[sc] || { total: 0, expected: e, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
      bySc[sc].total++; bySc[sc][r.outcome] = (bySc[sc][r.outcome] || 0) + 1;
    }
  }
  const n = results.length;
  // ── STARRED (*) metrics: criterion-level GT overrides applied (rec.polarity reflects effectiveExpected) AND any
  //    cross-rule-indeterminate fallback cases quarantined from the specificity denominator (reported, never silent).
  const recallCases = results.filter((r) => r.polarity === 'recall');
  const specAll = results.filter((r) => r.polarity === 'specificity');
  const excludedCases = specAll.filter((r) => r.excluded);
  const specCases = specAll.filter((r) => !r.excluded); // GRADED negatives only
  const recallCaught = recallCases.filter((r) => r.outcome === 'caught').length;
  const falsePos = specCases.filter((r) => r.falsePositive).length;
  const exclReasons = {}; for (const r of excludedCases) exclReasons[r.excludedReason] = (exclReasons[r.excludedReason] || 0) + 1;
  const overrides = results.filter((r) => r.gtOverride).map((r) => ({ ruleId: r.ruleId, testcaseId: r.testcaseId, original: r.expected, asserted: r.effectiveExpected, outcome: r.outcome, note: r.gtOverrideNote }));
  // ── UN-MODIFIED metrics: the raw ACT corpus as-shipped — original per-rule labels, NO override, NO exclusion.
  const isNeg = (r) => r.expected === 'passed' || r.expected === 'inapplicable';
  const recallUn = results.filter((r) => r.expected === 'failed');
  const specUn = results.filter(isNeg);
  const recallUnCaught = recallUn.filter((r) => r.outcome === 'caught').length;
  const fpUn = specUn.filter((r) => r.outcome === 'caught').length;
  return { generatedAt: new Date().toISOString(), n, model: MODEL, vision: VISION, tools: TOOLS,
    reachesLlm: REACHES_LLM, restrictSc: RESTRICT_SC, tally, byExpected,
    // starred (*) — criterion-level GT override + cross-rule exclusion applied
    recall: { failedN: recallCases.length, caught: recallCaught, recallRate: recallCases.length ? +(recallCaught / recallCases.length).toFixed(3) : null },
    specificity: { n: specCases.length, falsePositive: falsePos, falsePositiveRate: specCases.length ? +(falsePos / specCases.length).toFixed(3) : null,
      grossN: specAll.length, excluded: excludedCases.length, excludedReasons: exclReasons,
      excludedCases: excludedCases.map((r) => ({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, wouldBeFP: !!r.falsePositive, reason: r.excludedReason })) },
    gtOverrides: { count: overrides.length, cases: overrides },
    // un-modified — raw ACT labels, no override, no exclusion (the corpus as it ships)
    unmodified: {
      recall: { failedN: recallUn.length, caught: recallUnCaught, recallRate: recallUn.length ? +(recallUnCaught / recallUn.length).toFixed(3) : null },
      specificity: { n: specUn.length, falsePositive: fpUn, falsePositiveRate: specUn.length ? +(fpUn / specUn.length).toFixed(3) : null },
    },
    caughtRate: n ? +(tally.caught / n).toFixed(3) : null, bySc };
}

function printSummary(results) {
  const s = summarize(results);
  console.log('\n================= LLM eval results (recall + specificity) =================');
  console.log(`cases: ${s.n}  |  model ${s.model}  vision=${s.vision} tools=${s.tools}  restrictSC=${s.restrictSc}  reachesLLM=${s.reachesLlm}`);
  const star = s.gtOverrides && s.gtOverrides.count ? '*' : '';
  console.log(`\n  RECALL${star} — expected=failed (a flagged barrier is a TRUE POSITIVE):`);
  console.log(`    failed cases reaching the LLM: ${s.recall.failedN}  |  caught: ${s.recall.caught}  =  ${s.recall.recallRate != null ? (100 * s.recall.recallRate).toFixed(0) + '%' : '-'} recall${star}`);
  console.log(`\n  SPECIFICITY${star} — expected=passed/inapplicable (a flagged barrier is a FALSE POSITIVE):`);
  console.log(`    specificity cases: ${s.specificity.n}  |  false positives: ${s.specificity.falsePositive}  =  ${s.specificity.falsePositiveRate != null ? (100 * s.specificity.falsePositiveRate).toFixed(1) + '%' : '-'} FP rate${star}`);
  if (s.specificity.excluded) {
    console.log(`    cross-rule-indeterminate EXCLUDED: ${s.specificity.excluded} of ${s.specificity.grossN} negatives (${JSON.stringify(s.specificity.excludedReasons)})`);
    for (const c of s.specificity.excludedCases) console.log(`      - ${c.ruleId}/${c.testcaseId.slice(0, 10)} ${c.expected} (would-be FP: ${c.wouldBeFP}) — ${c.reason}`);
  }
  if (s.gtOverrides && s.gtOverrides.count) {
    console.log(`\n  * ${s.gtOverrides.count} CRITERION-LEVEL GT OVERRIDES applied (manually examined cross-rule cases; raw ACT-label metrics below):`);
    for (const o of s.gtOverrides.cases) console.log(`      - ${o.ruleId}/${o.testcaseId.slice(0, 10)}  ${o.original} → ${o.asserted}  [${o.outcome}]  — ${o.note}`);
    const u = s.unmodified;
    console.log('\n  UN-MODIFIED (raw ACT labels, no override, no exclusion):');
    console.log(`    recall:      ${u.recall.caught}/${u.recall.failedN}  =  ${u.recall.recallRate != null ? (100 * u.recall.recallRate).toFixed(0) + '%' : '-'}`);
    console.log(`    specificity: FP ${u.specificity.falsePositive}/${u.specificity.n}  =  ${u.specificity.falsePositiveRate != null ? (100 * u.specificity.falsePositiveRate).toFixed(1) + '%' : '-'} FP rate`);
  }
  for (const e of ['passed', 'inapplicable']) { const b = s.byExpected[e]; if (b) console.log(`      ${e.padEnd(13)} n=${String(b.n).padStart(3)}  FP(flagged)=${String(b.caught).padStart(3)}  clearedOK=${String(b.missedAgree).padStart(3)}  uncertain=${String(b.uncertain).padStart(3)}  noVerdict=${String(b.noVerdict).padStart(3)}  noObligation=${String(b.noObligation).padStart(3)}`); }
  console.log('\n  by SC (FP = flagged where GT says pass/inapplicable; * = recall SC):');
  console.log('    sc        exp           n  caught/FP  agree  uncert  noVerd  noOblig');
  for (const [sc, b] of Object.entries(s.bySc).sort()) {
    console.log(`    ${sc.padEnd(8)} ${String(b.expected).padEnd(13)} ${String(b.total).padStart(2)}   ${String(b.caught).padStart(7)}  ${String(b.missedAgree).padStart(5)}  ${String(b.uncertain).padStart(6)}  ${String(b.noVerdict).padStart(6)}  ${String(b.noObligation).padStart(7)}`);
  }
  console.log(`\n  raw outcome tally: ${JSON.stringify(s.tally)}`);
  console.log(`  resource peak: parallel LLM ${tel.llm.peakInFlight}/${GLOBAL_LLM}  |  tabs ${(tel.tabs && tel.tabs.peak) || '?'}/${MAX_TABS}  |  pages=${PAGE_CONC} perPageLLM=${TOOLS ? Math.min(LLM_CONC, LIMITS.concurrency.llmTool) : LLM_CONC}`);
  console.log(`\nwrote ${path.join(OUT, 'results.json')} + summary.json + llm-trace.json`);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
