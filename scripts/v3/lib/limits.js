'use strict';
// SINGLE SOURCE OF TRUTH for every budget / cap / deadline DEFAULT in the harness (the "budget" inventory,
// tiers A–F). Each consumer imports its default from here and still honors a per-call override
// (opts.X ?? LIMITS.<tier>.X) — so this is a pure config KNOB-PANEL with NO logic. The budget LOGIC stays
// where it lives (budget.js makeRunBudget/withDeadline; the SDK transport in llm-agent-adapter.js); only the
// numbers' HOME moves here. Values are UNCHANGED from where they were inlined — this is behavior-preserving.

// Experiment-lane ceiling (R2.2e/Q3): DEFAULT 300000 (5 min). Raised from 120000 so the experiment lane RUNS TO
// COMPLETION on heavy pages, which makes the claim-proposal set deterministic and removes the budget-deferral
// `autoPartial` drift (measured: unrun 17-19 → 0, ledger flips → 0, ~+20s/case; the deferred experiments are fast, so
// the ceiling rarely binds and most pages finish well under it). `V3_ACT_RUN_WALLCLOCK_MS` overrides (e.g. =120000 to
// reproduce the old behaviour). caseTimeoutMs MUST stay above the ceiling (it is the hard hang-guard), so it tracks it.
const ACT_RUN_CEILING_MS = Number(process.env.V3_ACT_RUN_WALLCLOCK_MS) || 300000;

const LIMITS = Object.freeze({
  // ── A. Formal cost budgets (budget.js · Rule 8 "bounded cost"). Exhaustion ⇒ an explicit unrun/deferred
  //       record, never a silent drop or a false clear. ─────────────────────────────────────────────────
  experiment: Object.freeze({
    defaultWallClockMs: 45000,        // one attempt of one runner (DEFAULT_COST.maxWallClockMs)
    maxWallClockMs: 150000,           // hard clamp on a catalog-supplied wall (MAX_WALL_CLOCK_MS)
    defaultRetries: 1,                // DEFAULT_COST.retries
    maxRetries: 5,                    // hard clamp on catalog retries (MAX_RETRIES)
    defaultMutationRisk: 'low',       // DEFAULT_COST.mutationRisk
    runWallClockMs: 10 * 60 * 1000,   // anti-runaway PAGE CEILING (makeRunBudget default); per-item walls are the real budget — only a page's TAIL past this ceiling defers
    reachSafetyCap: 2000,             // anti-pathology Tab-press cap for the reachability walk (run-experiments)
  }),

  // ── B. Scheduling budget (scheduler.js). Over-budget candidates become budget-deferred escalations. ────
  scheduling: Object.freeze({
    maxAutomatic: Infinity,           // how many candidates auto-schedule into the plan (default: no cap)
  }),

  // ── C. LLM-lane budgets (llm-agent-adapter.js + the entry points). The LLM analog of the run pool. ─────
  llm: Object.freeze({
    maxTokens: 32000,                  // per model call (makeRunAgent) — the token budget
    // (model NAMES are config, not budgets — they stay inline in the adapter / entry points)
    httpTimeoutMs: 60000,             // makeAnthropicTransport timeoutMs (dormant API-key path)
    perTurnTimeoutMs: 60000,          // SDK per-turn stall timeout
    runTimeoutMs: 200000,             // whole single-shot call deadline (raised 120→200s; tool path uses toolRunTimeoutMs)
    maxTurns: 1,                      // single-shot default (the tool path raises it — see toolMaxTurns)
    maxRetries: 4,                    // 429/overloaded retries
    baseBackoffMs: 1000,              // exponential backoff floor (1s → … )
    maxBackoffMs: 30000,              // exponential backoff ceiling ( … → 30s)
    toolMaxTurns: 12,                 // multi-turn tool path turn cap (V3_LLM_TOOL_MAX_TURNS). 6→12: gemini's
                                      //   hand-rolled function-calling loop was exhausting turns then degrading to
                                      //   null (noVerdict); more rounds let it conclude naturally before the forced
                                      //   tools-off fallback. Ceiling only — most calls finish well under it.
    toolRunTimeoutMs: 500000,         // multi-turn tool path whole-call deadline (V3_LLM_TOOL_RUN_TIMEOUT_MS)
  }),

  // ── D. Concurrency budgets (parallelism caps). ─────────────────────────────────────────────────────────
  concurrency: Object.freeze({
    experiment: 5,                    // V3_EXPERIMENT_CONCURRENCY default (1 = byte-identical serial)
    experimentCap: 6,                 // hard ceiling on V3_EXPERIMENT_CONCURRENCY
    llm: 16,                          // V3_LLM_CONCURRENCY default. Lowered 30→16: at ~19 in-flight the API rate-limits
                                      //   + per-turn latency degrades, ballooning multi-turn tool calls (66→116s) past
                                      //   the deadline. Capping below the natural peak AVOIDS the 429s instead of
                                      //   relying on backoff to govern (backoff is now credited to the deadline too).
    llmTool: 8,                       // V3_LLM_TOOL_CONCURRENCY — with tools ON this is the PER-PAGE LLM concurrency
                                      // (orchestrator min(llmConcurrency, llmTool)); at 4 it starved the global llm=40
                                      // cap (a tools-ON FN run peaked ~16 in-flight, tabs 9/50, 0 tab contention). 8
                                      // lets PAGE_CONC×8 reach the global 40 cap. ≈ concurrent tool tabs (maxTabs heads it).
    reapAgeMarginMs: 30000,           // tool-tab reap age = toolRunTimeoutMs + this (strictly above the abort)
    reapAgeFallbackMs: 330000,        // openToolSession reapAge default when no run timeout is supplied
    maxTabs: Number(process.env.V3_MAX_TABS) || 50, // CENTRAL tab allocator cap: hard ceiling on CONCURRENTLY-OPEN
                                      // tabs across all lanes/pages (V3_MAX_TABS env override; default 50). Memory-bound
                                      // default; a CPU-bound workload (many heavy pages painting at once) should lower it.
  }),

  // ── D′. ACT-suite knobs (eval/checker-comparison/run-v3-act-suite.js + run-fn-llm.js). ──────────────────
  act: Object.freeze({
    // The deterministic experiment lane is now bounded by TIME, not COUNT: `maxAuto` is effectively uncapped (run
    // every applicable candidate) and `runWallClockMs` defers the tail once the lane has spent 2 min. So a large
    // page runs as many real trigger-and-observe runners as fit in 2 min, then the rest fall to auto-PARTIAL → LLM
    // (instead of an arbitrary first-16). The entry points pass `budgetOpts.maxRunWallClockMs = runWallClockMs`.
    maxAuto: 100000,                  // V3_ACT_MAX_AUTO — was 16; large = "no count cap" (the time budget governs)
    runWallClockMs: ACT_RUN_CEILING_MS, // experiment-lane wall-clock budget per page (default 2 min) — the real governor; gated via V3_ACT_RUN_WALLCLOCK_MS (see ACT_RUN_CEILING_MS note above)
    elementCap: 80,                   // V3_ACT_ELEMENT_CAP (live-page body scan; a pre-selected subset overrides it — see collectActPage opts.xpaths)
    caseTimeoutMs: Math.max(180000, ACT_RUN_CEILING_MS + 60000), // per-case hard hang-guard — kept STRICTLY above the lane ceiling so the time budget binds, not a hard kill (tracks the gated override)
  }),

  // ── E. Inventory / discovery quantity budgets (fail-closed DoS backstops — over-cap ⇒ the builder refuses).
  discovery: Object.freeze({
    maxSubjectsPerResult: 256,        // dynamic-subjects MAX_SUBJECTS_PER_RESULT
    maxTotalSubjects: 1024,           // dynamic-subjects MAX_TOTAL_SUBJECTS
  }),

  // ── F. Instrument safety caps & deadlines (bound work; live next to but sourced from here). ────────────
  instruments: Object.freeze({
    reachSafetyCap: 2000,             // kbd-graph REACH_SAFETY_CAP (Tab-press anti-pathology cap)
    escapeBudgetMargin: 3,            // region escape budget = focusableCount + this (kbd-graph trap probe)
    vsrCdpDeadlineMs: 60000,          // vsr-collect CDP collection deadline
    vsrWalkDeadlineMs: 120000,         // vsr-collect reading-order walk deadline
    vsrMaxSteps: 6000,                // vsr-collect step cap
    statusMaxTriggers: 25,            // status-detector probed-control cap (4.1.3)
  }),
});

module.exports = LIMITS;
