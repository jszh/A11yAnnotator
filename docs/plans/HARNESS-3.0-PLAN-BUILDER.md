# Harness 3.0 — Critical Review & Revised Plan (Claude)

Date: 2026-06-14

**What this is.** A critical companion to `HARNESS-3.0-PLAN.md`. I read that plan in full,
stress-tested it against the lessons of the R2.1–R2.9 rounds (where every round of NEW gate
code leaked a *fail-open-by-omission* hole), and propose a revised scope. The original plan
is strong; I keep its spine, harden five specific gaps, and **re-sequence so the highest-value
90% ships first and the highest-risk 10% is gated behind proof.** This does not replace the
original — it sharpens it.

---

## 1. Verdict on the original plan

**Keep, almost verbatim — these are correct and hard-won:**

- The builder stays the *sole* publication gate; agents request and propose, never author
  authoritative outcomes or aggregates. (Consistent with R2.1-B.)
- **Support-based binding extended to experiments via typed predicates** — a definite verdict
  must be *positively demonstrated* by a typed outcome, not the absence of contradiction. This
  is the R2.8 crown jewel and the plan rightly carries it forward.
- **Allowlisted catalog operations only** — catalog IDs + bounded params, never agent-authored
  JS/selectors/prompts. This is the single most important defense against page-text prompt
  injection; do not weaken it.
- Automatic-first; the agent is consulted *only* for contextual selection, never to invent or
  execute. No forced resolution — ambiguity stays `PARTIAL`.
- **Separate planner and evaluator calls with separate schemas**, so a planner's *expectation*
  can never be read as an experiment's *measured outcome*. Excellent; this is the same
  support-based discipline applied to the agent loop.
- `experiments.json` produced *only* by the trusted runner; `judgments.json` kept separate and
  basis-labelled.

I agree with the entire "Do not make a 3.0 requirement" boundary list (no arbitrary browsing,
no exhaustive state-machine exploration, no definite automation of subjective exceptions, no
cross-AT announcement conformance).

---

## 2. The five changes I'd make

### Δ1 — Lead with precision, not PARTIAL-reduction. Make the gold benchmark Phase 0's *blocking* deliverable.

The Objective leads with "reduce honest `PARTIAL`." The plan later admits "reducing the number
of partials is not itself a success." That caveat belongs in the **objective**, as a hard gate
on every phase: *more **correct** definite verdicts, with measured precision in **both**
directions, and zero increase in false definites.* PARTIAL-reduction is a lagging proxy and
optimizing it directly rewards exactly the overconfidence the support gate exists to prevent.

Concretely: a hand-adjudicated **gold set per skill** (even 20–40 elements each) is the
prerequisite for *everything*. Without labels you cannot tell "3.0 helped" from "3.0 made
confident mistakes." Every experiment must be scored P/R in both directions
(`PARTIAL→REPRODUCED` and `PARTIAL→NOT-REPRODUCED/N-A`) on that set before it is allowed to
emit a definite verdict. This is the single highest-leverage reordering in this document.

### Δ2 — The deterministic experiment runner is the whole spine. Demote the agent planner and semantic skills to smaller, later, higher-bar add-ons.

The plan frames "experiments" and "semantic judgment" as two co-equal capabilities. The impact
baseline says otherwise. Four automatic experiments (C1 activation-AX-diff, C2 focus-visual-retry,
C3 pixel-contrast, C4 role-keyboard) cover **~736 of ~900 partials and ~340 of ~358
unsupported-definite verdicts** — and three of those four need *no agent and no semantic skill*.
Semantic skills (3.0-D) directly address ~14 partials plus some exceptions; the Level-3 planner
addresses only the long tail.

So 3.0's win is overwhelmingly a **deterministic, allowlisted experiment runner bound through
the existing support gate.** I'd reframe the planner and semantic skills as optional risk-bearing
extensions that ship only after the spine is proven on the gold set.

### Δ3 — Fold every new evidence artifact into the *existing* `crossArtifactErrors()` gate. One gate, N artifacts.

We just built (R2.9-B) a single `crossArtifactErrors(records, collect, drive)` enforcing
`file`/`runId`/`pageDigest`/freshness and *driver-target ⊆ collector inventory*, used identically
by the CLI and the sweep. `experiments.json` and `judgments.json` are **new cross-artifact
surfaces** and the plan describes their identity binding only abstractly. Every R2.x re-audit
caught a hole of exactly this shape: a new artifact whose identity wasn't bound to the others.

Requirement: extend the *same* function to an evidence bundle —
`crossArtifactErrors(records, collect, drive, experiments?, judgments?)` — enforcing that every
artifact shares `runId` + `pageDigest`, every `experiments.targetXpath` and
`judgments.targetXpath` is in the collector inventory, and each carries its own completion
timestamp ≥ `collectedAt`. Do **not** write a second parallel identity check for experiments;
that divergence *is* the bug.

### Δ4 — Per-experiment **directional** support, defined once in the catalog and consumed by the builder.

The plan treats an experiment's outcome as symmetric across verdict directions. It isn't. An
experiment's measurement is usually sound in *one* direction and noisy in the other, and the
risky direction is whichever produces a *wrong definite*:

- **C2 focus-visual-retry:** caret/animation noise tends to fabricate a *positive* ring diff →
  false `present:true` → wrongly **clears** a real 2.4.7 failure. So a definite `NOT REPRODUCED`
  must require focus-*dependence* corroboration (ring present on focus AND absent without);
  otherwise the safe direction is `REPRODUCED`/`PARTIAL`.
- **C4 role-keyboard:** "key fired but no functional/state outcome" must **never** support
  `operable`. Only an observed functional+state change supports `NOT REPRODUCED`; a non-response
  supports `REPRODUCED` only when the control is genuinely the interactive target.
- **C1 activation-AX-diff for 4.1.3:** here the "AX exposure ≠ AT actually announced" caveat
  does **not** weaken the result, because 4.1.3 is about *programmatic determinability*, which
  is exactly what the AX tree measures — so AX diff is a sound oracle in all three directions
  (visible+exposed → NOT REPRODUCED; visible+unexposed → REPRODUCED; no visible change → N/A).
  The caveat *does* bite for SCs about actual perception (e.g. 4.1.2 name/role/state used as a
  perception claim) — keep those weaker.

Encode this as a **directional support predicate in the catalog entry** (`supports: {REPRODUCED:
[...conditions], NOT_REPRODUCED:[...stricter conditions]}`), defined **once** and consumed by the
builder. The plan's own pitfall — "outcome schemas drift from builder support predicates" — is
solved by a single source of truth (the catalog is data; the builder reads it), mirroring R2.9-B.

### Δ5 — Split the semantic rubrics: mechanize the measurable core; the irreducibly subjective residue stays non-definite in 3.0.

Several "semantic" rubrics are actually *measurements* mislabelled as judgment, and a rubric
does not make an LLM's purpose-inference *measured*:

- "Accessible-name empty/generic/whitespace", "two targets reach the same `href`",
  "another control meets target size (2.5.8 Equivalent exception)" → **deterministic**; move to
  the collector/experiment side and allow definite verdicts there.
- "Link purpose from context", "essential presentation", "name communicates apparent purpose",
  "is this text *functioning* as a heading" → **irreducibly subjective**; in 3.0 these emit at
  most `PARTIAL` + an adjudication-queue entry, **never an auto-definite REPRODUCED/NOT-REPRODUCED.**

Reason: semantic definites re-introduce agent self-report as authority dressed in a rubric, for
the smallest payoff in the whole plan and the largest false-definite risk. "validated" in the
builder only proves the rubric ID and evidence refs *exist*, not that the claim is *true*. Earn
semantic definites later, behind a measured high-confidence precision threshold on the gold set
(the original plan's Phase-3 exit gate — I'd just forbid definites until that gate is *passed*,
not merely *measured*).

---

## 3. Two architectural simplifications

1. **Collapse the candidate pipeline for the automatic path.** `candidate-generator → scheduler
   → merger` is one deterministic function for Level-1/2 pages: given `collect+drive` and the
   support predicates, emit `experiment-plan.json` directly. Emit `experiment-candidates.json`
   *only* when there are Level-3 candidates that actually need the planner. Fewer artifacts =
   fewer identity-binding seams (see Δ3).

2. **Batch by isolation class, not by element.** Running C1–C4 per element with a fresh reload
   each is thousands of page loads over the corpus. Group a page's experiments by risk class
   (`read-only` probes share one reload; only `local-mutation`/`navigation-risk` force a fresh
   isolated reload). This is also the natural place to enforce the 3.0-F budgets.

---

## 4. Revised scope & sequencing

**Phase 0 — Contracts + GOLD BENCHMARK (blocking).** Experiment/judgment schemas; the
catalog-as-data support registry; extended `crossArtifactErrors` for the evidence bundle; frozen
baseline metrics; **and a hand-adjudicated per-skill gold set.** Exit: no experiment/judgment can
authorize a definite verdict without a registered *directional* predicate + evidence ref, and the
gold set exists with both-direction labels.

**Phase 1 — The deterministic spine (the 90% win).** Candidate→plan (collapsed), Level-1/2
scheduler, C2 focus-visual-retry, C1 activation-AX-diff, C3 pixel-contrast, C6 controlled-form-
submit, builder support-references, batched-by-isolation runner. Exit: adversarial fixtures
green; clear candidates resolve with **no** agent call; **measured both-direction precision on
the gold set meets threshold; zero increase in known false definites** (hard gate, not a metric).

**Phase 2 — Keyboard recipes + the one high-severity contextual case.** C4 role-keyboard recipes
(Level-2 automatic when role is reliable). C5 modal/trap/advised-exit. Introduce the Level-3
planner **only** for C5's advised-exit/scope selection (genuinely needs context, high severity) —
*not* a general planner yet. Exit: planner cannot escape the allowlist; page text cannot inject a
non-catalog ID/param; automatic scheduling stays identical without the planner.

**Phase 3 — Narrow semantic skills (non-definite first).** Ship the subjective rubrics as
`PARTIAL`+adjudication only; mechanize the measurable rubrics on the deterministic side. Promote a
rubric to *definite* only after it passes (not merely reports) a precision threshold on the gold
set, with prompt-injection and counterfactual-pair tests green.

**Phase 4 — Breadth & external reconciliation (deferred).** C7 consent two-state; adaptive target
hit-testing; a *second* static engine (IBM Equal Access) / ACT-rule reconciliation; metric-tuned
prioritization; general Level-3 planner if the long tail justifies it. Everything new-dependency
lives here, behind demonstrated accuracy gains.

---

## 5. Risks the original under-weights

- **3.0 will *revise* the frozen corpus, not just fill it.** Pixel contrast may turn some old
  *passes* into fails (the plan notes "173 old contrast passes used uncertain static evidence");
  re-gating revises existing definites. The corpus must be **re-frozen and re-adjudicated**, not
  patched in place — and that revision is a *feature* (correcting wrong passes), but it must be
  surfaced, counted, and reviewed, never silent.
- **Dependency sprawl.** Equal Access, Playwright ARIA snapshots, and new VSR coverage are each a
  new reconciliation problem. In 3.0 reuse only what's already in-repo (Puppeteer/CDP, the
  existing `verify-finding.js --pixel-contrast`, the existing focus spatial analysis and VSR
  hook). Defer new engines to Phase 4 behind an evaluation.
- **An experiment that turns `PARTIAL→definite` *creates* a false-positive risk that honest
  PARTIAL did not have.** The bar for an experiment to emit a definite must be at least the bar
  we'd hold a human auditor to — which is the whole point of Δ4's directional predicates and Δ1's
  precision gate.

---

## 6. One-line summary

Keep the plan's spine (builder-as-gate, support-based binding, allowlisted catalog, automatic-
first, separate planner/evaluator). **Build the deterministic experiment runner first and prove
it on a gold set; bind every new artifact through the existing `crossArtifactErrors`; make each
experiment's support *directional* and catalog-defined; and let semantic skills be non-definite
until they earn definites by measured precision.** Defer the general agent planner and external
engines. The 3.0 win is a disciplined, *measured* escalation ladder — not more capability.
