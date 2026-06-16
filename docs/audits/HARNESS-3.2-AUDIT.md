# Independent Audit — Harness 3.2 (the PROVISIONAL disposition)

**Date:** 2026-06-16
**Scope:** commits `9209fd2` (spine, items 1–7) + `3c50d92` (rubrics + vision + gold loaders, items 8–12), on branch `round3-llm-evidence-lane`, against the 3.1 baseline `b763e5b`.
**Plan under review:** [docs/plans/HARNESS-3.2-PLAN.md](../plans/HARNESS-3.2-PLAN.md) (claimed "FULLY IMPLEMENTED").
**Method:** read-only git throughout (no reset/stash/edit). Independent diff reading + `node` repros, then an 8-dimension adversarial workflow (49 sub-agents; every finding verified by two skeptics — one "is it real," one "does it matter"). 20 findings, 0 refuted outright, several downgraded by the materiality lens. The workflow's completeness critic failed on a transient API 500 and was replaced by the auditor's own analysis.

---

## Bottom line

The commit is **real, well-engineered, and green** — `v3 273/273` and `pure 190/190` both verified by re-running the suites. **No safety invariant is violated in the code as it actually runs:** the never-authoritative cap holds, `CLAIM`-always-wins holds, barrier-dominates-clear holds, vision crops stay out of `results`, and the default `runAgent` refuses. Every "dangerous-direction" finding below is **latent** (no family triggers it yet), **non-default** (gated mode, on hold), or **operator-misconfiguration** — not a live hole.

**The one narrative correction:** "FULLY IMPLEMENTED" is accurate for the **spine (items 1–7)** but overstates the **LLM lane (items 8–12)**. The lane is *authored and unit-tested in isolation* but **not wired end-to-end** — and the new atomic rubrics never reach a prompt. The plan header admits "gold + vision frames pending," but the gap is wider: rubric *selection*, vision *capture invocation*, and CLI *flags* are also unconnected.

The harness is therefore **safe as-is**; the findings concern (1) overclaimed completeness, (2) latent traps to fix before relying on gated mode, (3) determinism polish, and (4) test debt on the safety guards.

---

## What is solid (verified-true)

- **Tests green, independently reproduced:** `node --test scripts/v3/tests/*.test.js` → 273 pass / 0 fail; `node --test scripts/tests/*.test.js` → 190 pass / 0 fail.
- **The spine is faithfully built** ([v3-schema.js](../../scripts/v3/lib/v3-schema.js), [obligations.js](../../scripts/v3/lib/obligations.js), [authority.js](../../scripts/v3/lib/authority.js), [metrics.js](../../scripts/v3/lib/metrics.js), [build-v3.js §5b](../../scripts/v3/lib/build-v3.js)) and already carries adversarial hardening: `PROVISIONAL` only fills obligations with *no* deterministic disposition (never overrides a `CLAIM`/`PARTIAL`); the `cleared` aggregate is restricted to `disposition === 'CLAIM'`; prototype-chain provenance is rejected (`ownTrimStr`); `clearTarget` is clamped so an operator can only make the clear gate *stricter*; the merge fails closed on a non-decisive set.
- **○-tier reads REAL collector fields** — the new oracle branches read `el.box` ([eval-page.js:394](../../scripts/eval-page.js)), `el.axName` (eval-page.js:460), and `structure.title` (eval-page.js:194), with [coverage-registry.js](../../scripts/v3/lib/coverage-registry.js) mirroring each. So the ○-tier does **not** silently under-enumerate on real artifacts (a concern raised and refuted).
- **Multimodal mechanics are real** (`D12-3`): `buildMessages` emits genuine image blocks, `runAdjudication` returns a real `llmVision` side artifact, crops never touch `results`, and the no-accidental-API guard is doubly gated (`runLlm && runAgent` + default-refusing `runAgent`).

---

## Findings

Severity shown as **claimed → adjudicated** (after the materiality lens). "✓ both" = independently confirmed by the auditor *and* the workflow.

### A. "Implemented" vs "wired" — the headline cluster

| ID | Sev | Finding |
|---|---|---|
| **D12-1** | high → **real (low live)** | **The 8 authored atomic rubrics never reach any prompt.** `runAdjudication` reads only `llmRubrics.skills` ([llm-adjudicator.js:224](../../scripts/v3/lib/llm-adjudicator.js)) and stamps `mechanism:'llm-agent'` (:267); `loadRubrics().rubrics{}` and its per-rubric `visionEvidence` have zero production consumers. The live prompt always uses the broad per-skill rubric, never `llm-rubric:<id>`. |
| **D12-2** | low | The `llm-rubric:*` mechanism is emitted only by [judgments.js:72](../../scripts/v3/lib/judgments.js) from an externally-supplied `rubricRef` — decoupled from the authored rubric files. Green `llm-rubric:*` tests prove the plumbing, not that the authored set drives anything. |
| **D10-1** | medium → low | **`skills/*.md` "re-scope" (item 10) is a prepended banner, not a rewrite.** All 10 files changed by +9 lines (a `> v3.2 division of labor` blockquote); the bodies still contain the full `--eval`/`/ax-node`/"drive a submit" procedures the plan says were "replaced." ✓ both |
| **D11-1** | medium → low | **Vision capture is not wired into the files item 11 names.** `eval-page.js`/`drive-page.js` are untouched by the diff; `captureVision`/`mergeVision` ([vision-capture.js](../../scripts/v3/lib/vision-capture.js)) have only test callers; and the production CLI [run-evaluation.js](../../scripts/v3/tools/run-evaluation.js) calls `orchestrate` without `runLlm`/`runAgent`/`visionByXpath`/`gold`. **Consequence: the entire 3.2 LLM+vision lane is unreachable from a real run today.** |
| **D4-2** | low | `gold-loader.loadGold()` has no non-test caller; `build-v3` reads a pre-flattened `opts.gold`. The loader is correct but inert. |
| **D9-1** | medium → low | Only 8 atomic rubrics exist; the plan's per-skill vision table implies rubrics for focus (2.4.7/2.4.13), reflow (1.4.10/2.5.5), forms (3.3.1/3.3.2), dynamic-announcement (4.1.3), grouping (1.3.2/2.4.3), and color (1.4.1/1.4.5/1.4.11) — none of which have a rubric file. |

### B. Latent correctness bugs (safe today; fix before trusting gated mode)

| ID | Sev | Finding |
|---|---|---|
| **D-GATE-1** | high → **low live** | **`clearTarget` clamp is one-sided.** [metrics.js:174](../../scripts/v3/lib/metrics.js) `Math.min(clearTarget, 0.02)` guards only the upper bound; a numeric `clearTarget ≤ 0` makes `requiredZeroEventN` negative, collapsing the 149-floor so a **single labelled clear passes the gated clear gate** — exactly the B-F3 case the comment claims to defend. `provisionOpts` is threaded unvalidated. Fix: two-sided clamp / `Math.max(need, 149)`. |
| **D-GATE-3** | medium → low | **Gated clear gate is unreachable per-run.** The 149 *corpus-level* bound is re-derived from one page's observations (`scoreMechanism(scoringView, …)`), so it needs ≥149 fully-adjudicated clears for one mechanism on a single page, and it double-gates the registry's standing `goldSized`. Repro: a perfect page (2 clears, 0 false, coverage 1.0) → `clearCanaryEligible:false`. ✓ both |
| **D-GATE-2** | medium → low | **Gold keying is family- AND mechanism-blind.** `goldIndex`/`recKey` key on `(xpath, sc)` only ([metrics.js:69-70](../../scripts/v3/lib/metrics.js)); a gold clear authored for one family/mechanism is credited to another (the dangerous direction). Latent (no SC currently maps to >1 family) but unsound by construction; `1.3.1` is the documented future multi-family case. ✓ both |

### C. Determinism / byte-stability

| ID | Sev | Finding |
|---|---|---|
| **D1-1 / D-1** | medium → low | **`mergeProvisional` has no tie-break.** `pick()` sorts on confidence only; on a tie the winner is input-order-dependent, and `supportRefs`/`conflict.blockedClears` are unsorted — so the published provisional block (`mechanism`/`rationaleRef`) can differ byte-for-byte across producer emission orders. The sibling `families.sort()` in the same file shows the established discipline this path skips. Safety-neutral (`cleared`/conflict-presence are set-based). Found by two dimensions independently. |
| **D-2** | low | `gold-loader` iterates `readdirSync` without `.sort()`, unlike its sibling `rubric-loader` (which documents the fix). Duplicate `xpath::sc` labels resolve last-write-wins by filesystem order. |

### D. Test debt — the safety guards work but nothing pins them (mutation-survivable)

| ID | Sev | Finding |
|---|---|---|
| **D7-1** | high → low | **No test that a PROVISIONAL clear doesn't set authoritative `cleared`.** Replacing the `disposition === 'CLAIM'` guard at [obligations.js:94](../../scripts/v3/lib/obligations.js) with `c.cleared` passes **all** tests. |
| **D7-2** | high → low | **No test isolates the gated authority-half gate.** Replacing [build-v3.js:309](../../scripts/v3/lib/build-v3.js) `provisionFor(...)` with `if (false)` — letting a mechanism emit `calibrated:true` with no canary/provenance — passes **all** tests. |
| **D7-3** | medium → low | No test that a provisional clear can't override a deterministic *shadow-PARTIAL* (only the `CLAIM` half of invariant (a) is pinned; code is correct). |
| **D7-4 / B5b-1** | low | `adjudicationRecommendations.promotedTo` is never asserted, and it is **mechanism-granular** — an abstaining (INCONCLUSIVE) obs can falsely read `promotedTo:'PROVISIONAL'` when a *different* decisive obs of the same mechanism filled the row, contradicting the plan's "an abstention must not look like a disposition." |

### E. Documentation

| ID | Sev | Finding |
|---|---|---|
| **D9-2 / D4-1** | low → info | Plan says rubrics live in `lib/llm-rubrics/`; actual is `scripts/v3/llm-rubrics/`, and the work-item table uses a `lib/` prefix throughout instead of `scripts/v3/lib/`. The loader resolves correctly — prose only. |

---

## Recommended priority

1. **Reconcile the plan's "FULLY IMPLEMENTED"** to reflect that items 8–12 are authored + unit-tested but not wired end-to-end (rubric selection `D12-1`, vision capture `D11-1`, CLI flags, gold-loader `D4-2`). This is the finding most likely to mislead later. *(Done — see the plan's corrected status header + "Audit reconciliation" note.)*
2. **Fix `D-GATE-1`** (two-sided clamp) — the only finding touching the dangerous direction's actual gate.
3. **Add the three mutation-killing tests** (`D7-1`, `D7-2`, `D7-3`) — they pin the invariants that currently pass even when broken.
4. Decide the `D-GATE-3` calibration-locus question (standing vs per-run) before enabling gated mode; then the determinism polish (C) and doc fixes (E).

## Provenance

No code was changed during this audit. Git was read-only throughout (working tree untouched apart from the pre-existing untracked `CLAUDE.md`/`refs/`). Workflow run id `wf_b9463fac-b39`; full machine-readable findings retained in the run transcript.
