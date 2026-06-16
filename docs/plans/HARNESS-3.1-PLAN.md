# Harness 3.1 Plan — the LLM-adjudicated outcome + v2.9 pipeline inheritance

Status: PROPOSED (2026-06-15). Builds on the in-flight round2 VSR/keyboard instrument wiring
(`vsr-collect.js`, `vsr-analysis.js`, `vsr-graph.js`, `kbd-graph.js`, `order-check.js`,
`run-instruments.js`). Nothing here weakens a v3 invariant: the harness still never publishes an
uncalibrated clear, and every obligation still receives exactly one *authoritative* disposition.

---

## 1. Goal

Today v3 has two evidence lanes that can touch an obligation:

| Lane | Source | Authority | Where it surfaces |
|---|---|---|---|
| Deterministic experiment | `exp-runners.js` (trusted) | `CLAIM` (authoritative) or shadow | `claims` / `shadowObservations` |
| Safe sink | un-proposed / unproven | `PARTIAL` | `partials`, `obligationLedger` |
| Atomic semantic judgment | `judgments.js` (LLM + rubric) | recommendation-only (no rubric calibrated) | `adjudicationRecommendations` |
| VSR/keyboard instruments | `run-instruments.js` | non-authoritative shadow | `instrumentFindings` |

What is missing: a **whole-obligation LLM verdict for every obligation**, produced by directly
inheriting the v2.9 agent pipeline, recorded so it can be **scored against the hand-labeled gold**
(memory: `ground-truth-hand-labeled-after-harness`). The atomic `judgments.js` lane only covers the
handful of rubric-scoped meaning calls (alt adequacy, error helpfulness); it does **not** give the
14 SCs with no deterministic runner an opinion that gold can grade. v3.1 adds that as a first-class,
non-authoritative **fourth outcome type**.

The strategic payoff: this is the only principled path to eventually *clearing* the uncovered SCs.
An LLM mechanism that demonstrates both-direction precision against gold can be promoted by the
existing `authority.js` machinery from `shadow` → `canary` → `authoritative` — exactly like a
deterministic mechanism. Until then it is a graded opinion, never a clear.

---

## 2. The fourth outcome type — `LLM_ADJUDICATED`

### 2.1 What it is (and is not)

It is a **non-authoritative observation carrying one of the existing three directions** plus LLM
provenance and a confidence band. It is NOT a fourth value on the observation axis — v3 deliberately
keeps observation / applicability / conformance orthogonal (`v3-schema.js`), and "who judged it" is a
fourth *orthogonal* axis (evidence source), not a fourth observation. So:

```
observationOutcome ∈ { BARRIER_OBSERVED, NO_BARRIER_OBSERVED, INCONCLUSIVE }   // unchanged
source             ∈ { deterministic, instrument, llm }                        // NEW axis
authoritative      = false                                                     // ALWAYS for llm
```

`LLM_ADJUDICATED` records `{ obligationId, sc, claimFamily, xpath, observationOutcome, confidence,
basis, evidenceRefs, source: 'v2.9-agent', rubricRef? }`. It **annotates** an obligation; it never
becomes the obligation's `disposition` (reconcile still enforces exactly one CLAIM|PARTIAL per
obligation). "Uncertain" is structural: an `llm` outcome can never clear or barrier, regardless of
how confident the agent is, until a per-(sc, direction) authority promotion says otherwise.

### 2.2 Schema changes (`v3-schema.js`)

- Add `EVIDENCE_SOURCES = ['deterministic', 'instrument', 'llm']`.
- Add `LLM_CONFIDENCE = ['low', 'medium', 'high']`.
- Add constructor `llmAdjudication({...})` returning `{ disposition: 'LLM_ADJUDICATED',
  authoritative: false, source: 'llm', ... }`, mirroring `partial()`/`claim()`.
- Add `V2_9_VERDICT_MAP` (single source of truth for the inheritance mapping):
  `REPRODUCED → BARRIER_OBSERVED`, `NOT REPRODUCED → NO_BARRIER_OBSERVED`,
  `PARTIAL → INCONCLUSIVE`, `N/A → (applicability) INAPPLICABLE`.

### 2.3 Output surfacing (`build-v3.js`)

Mirror the existing `instrumentFindings` block (lines ~273–281):

- New top-level `results.llmAdjudications[]` + `summary.llmAdjudications` count.
- Fail-closed coupling to the strict legacy scanner: the agent emits legacy tokens
  (`REPRODUCED` / `NOT REPRODUCED` / `N/A`) — these MUST be mapped to v3 directions and the raw
  rationale sanitized **before** the strict `findLegacyLabelStrict(results)` runs (build-v3.js:319),
  or publication refuses. Add the mapping at ingestion, store rationale under a scanned-but-tolerated
  field, and unit-test that a REPRODUCED-laden rationale cannot reach the strict output.

---

## 3. Inherit the v2.9 pipeline — `lib/llm-adjudicator.js`

A new untrusted-lane module (treated like `judgments.js`: the builder consumes its artifact as data,
never gospel). It directly inherits v2.9's per-skill agent evaluation:

- **Signal pre-computation — reuse v2.9 pure logic verbatim.** `a11y-eval.js` ports cleanly (it is
  side-effect-free and unit-tested): `evalTargetSize` (2.5.8/2.5.5), `focusRingDecision` /
  `focusSpatialVerdict` (2.4.7/2.4.13), `contrastRatio`/`isLargeText` (1.4.3/1.4.11),
  `keyboardOperabilitySignal`/`isRovingTabindexItem` (2.1.1/2.4.3), `isVsrNoisePhrase`/
  `meaningfulAnnouncement` (1.3.2/4.1.3/4.1.2), `CONSENT_SELECTORS` (the `underOverlay` flag).
- **Evidence — reuse v2.9 instruments + the realism-corrected VSR transcript.** The agent reads the same
  screenshots and collector facts v2.9 used, PLUS the v3 VSR transcript with the v2.9 CDP accessible-name
  correction applied (see §5.2 — the name slot the agent judges must be the *real* announced name, not a
  Guidepup artifact). The 4.1.2 meaning call (announced name vs purpose/visible text) is only sound on the
  realistic name; the raw VSR name would inject false mismatches the agent then has to relitigate.
- **Verdict — inherit the v2.9 skill rubric prompts.** For each enumerated obligation (prioritize
  auto-PARTIAL ones with no deterministic CLAIM), the agent returns
  `{ verdict, confidence, basis, evidenceRefs }`; `V2_9_VERDICT_MAP` lifts it into a v3 direction.
- **Coverage.** Because this runs per obligation across all 10 categories, it gives the 14
  runner-less SCs (1.1.1, 1.3.1, 1.4.1, 1.4.5, 1.4.11, 2.4.2, 2.4.4, 2.4.6, 2.4.13, 2.5.3, 2.5.5,
  2.5.8, 3.3.3, 4.1.3) a gold-gradeable opinion for the first time.

`adjudicationRecommendations` (the atomic rubric judgments) become a **special case** of this lane —
same `source: 'llm'`, same scoring path — so there is one LLM provenance model, not two.

---

## 4. Gold comparison + calibration/promotion loop

This is the reason the outcome exists. The loop (memory: ground truth is hand-labeled AFTER the run):

1. **Run** harness → `results.llmAdjudications` recorded (non-authoritative).
2. **Hand-label** gold via the annotator (`server.js`) → `gold: [{ xpath, sc, goldOutcome }]`.
3. **Score** (`metrics.js`, extend the existing `scoreClears`): add
   `scoreLlmAdjudications(results.llmAdjudications, gold)` → per-(sc, direction) confusion matrix
   (TP/FP/FN/TN), both-direction precision, and the false-clear CI already implemented. Reuse the
   `unlabelledClears` fail-closed guard (every scored outcome must carry a gold label or the bound is
   void — audit R2-M1).
4. **Power-gate** with the existing statistical-power check (metrics.js:40) so a thin gold set bounds
   regressions, not a low-FN claim.
5. **Promote** via `authority.js`: register an `llm:<skill|sc>` mechanism per direction, default
   `shadow`. When readiness (`goldSized`, `sealedEval`, `independentRaters`, `measurementValidated`)
   plus the both-direction precision threshold are met, flip to `canary`/`authoritative`. Only then
   may an `llm` outcome graduate to authoritative — the same gate every mechanism passes.

Net: the LLM agent is wired in as just another mechanism on the existing promotion rails. No new trust
primitive; the fail-closed default (`shadow`) is unchanged.

---

## 5. VSR wiring — v3 (just implemented) vs v2.9

| Aspect | v2.9 (`server.js` + `drive-page.js` + `a11y-eval.js`) | v3 (round2, just implemented) |
|---|---|---|
| VSR injection | annotator HTTP server + iframe; `/ax-node`, `/sr-order` | self-contained blob-URL ESM import into the Puppeteer page (`vsr-collect.ensureVsr`) — no server/annotator coupling |
| Walk scope | LOCAL window per sampled element (~5 before, ~15 after) | ONE full-document forward pass + full backward pass (`vsr-graph.backwardWalk`) |
| Announced name | **OVERWRITES** the VSR name with Chrome's authoritative CDP `axName`, keeping the VSR's role+states (server.js:494–510) — a deliberate **realism** fix | currently keeps the raw VSR name — **v3.1 must ADOPT the v2.9 correction** (§5.2.0); the raw name is a Guidepup artifact, not what a real AT announces |
| noscript raw markup | handled in server.js | **ported** to `vsr-collect.js` |
| "end of X" boundaries | recognized in server.js | **ported** to `vsr-collect.js` |
| Reading-order check | agent eyeballs `/sr-order` vs visual | deterministic, column-aware `order-check.visualOrderDivergence` (BAGEL-style, sound-first) — NEW |
| Trap detection | keyboard sentinel walk in drive-page; **no** VSR-cursor trap | `vsr-graph.classifyVsrTraps` forward/backward/cycle + `kbd-graph` LOTUS escape probes — NEW |
| Meaning alignment | agent (4.1.2 skill) | `vsr-analysis.meaningFindings`: no-accessible-name (sound barrier) + name/visible-text overlap (review candidate) — NEW, fail-honest |
| Output role | feeds the LLM agent as a signal | NON-AUTHORITATIVE `instrumentFindings`, scored vs gold |

### 5.1 What v3 got right (keep)

- **Decoupled** the VSR from the annotator server → portable, no HTTP dependency.
- **Whole-document** forward+backward walk → correct basis for 1.3.2 + VSR-trap; v2.9's local windows
  could not see global order.
- **Deterministic, sound-first analyzers** (`order-check` column clustering, trap graphs) → moved the
  mechanical part out of agent judgment.

> **Correction (was wrong in the first draft).** The first draft praised v3 for keeping the *raw*
> VSR name and framed v2.9's name-correction as "laundering." That is backwards. See §5.2.0.

### 5.2 v3.1 VSR hardening items (gaps vs v2.9 to close)

0. **Adopt the v2.9 CDP accessible-name correction (REALISM — primary).** `vsr-collect.js` keeps the
   Guidepup VSR's raw announced name. That name is **not realistic**: Guidepup follows ARIA mechanically
   and mis-voices the name slot in ways no shipping AT does — e.g. it duplicates `nameFrom:contents`
   ("link, About, About"), and for `nameFrom:n/a` roles (paragraph/list/article) it voices the bare role
   instead of reading the text. v2.9 deliberately corrects this (server.js:494–510): it substitutes
   Chrome's authoritative `axName` — the standard accessible-name computation a real AT uses — into the
   name slot while keeping the VSR's role + states, and falls back to `textContent` for bare-role nodes.
   **Reasoning:** the harness models what a real screen-reader *user hears*; the announced name that the
   1.3.2/4.1.2 checks (and the §3 LLM lane) judge must therefore be the real accessible name, not a VSR
   implementation artifact. This does **not** launder the 4.1.2 check — it makes it sound: the mismatch
   we want is *real announced name vs purpose/visible label*, and judging the raw VSR string instead
   would manufacture false mismatches (the "About, About" artifact) and obscure real ones.
   - *Implementation:* v3's `vsr-collect` is pure `page.evaluate` with no CDP; adopting this needs a per-
     step CDP `axName` lookup (as server.js does) plus the bare-role `textContent` fallback. `eval-page.js`
     already computes the authoritative CDP name from the same source, so the resolver is shared, not new.
   - *Expected simplification (verify):* with the real `axName` in the name slot, an unlabeled `<select>`
     surfaces as an **empty** name (a clean "no accessible name" 4.1.2 barrier), so the `optionLeak`
     artifact-compensation heuristic in `vsr-analysis.meaningFindings` should become unnecessary.
   - *Keep raw too:* retain the original voiced phrase alongside the corrected name (e.g. `rawPhrase`) so
     a genuine role/state divergence is still inspectable — we correct the NAME slot only, exactly as v2.9.
   - *Port hazard:* v2.9 preserves the trailing STATE only when `vsr.itemText()` is a clean prefix of the
     post-role segment (server.js:507); on any mismatch it drops state to `''`. The v3 port should isolate
     state robustly (e.g. parse role/name/state from the phrase + itemText explicitly) rather than inherit
     that silent drop, so a control's announced state isn't lost when the name swap doesn't prefix-match.

1. **Inherit the phrase-noise filters.** `vsr-collect.js` / `vsr-analysis.js` re-derive parsing and do
   not reuse `a11y-eval.isVsrNoisePhrase` / `meaningfulAnnouncement`. Inherit them so root/landmark
   "document"/"navigation" phrases and sticky/stale announcements cannot pollute the transcript or the
   meaning check.
2. **Port 4.1.3 status-message capture.** v2.9's `drive-page` triggers an action and captures whether a
   live region announced (`meaningfulAnnouncement` + the `[aria-live]`/`role=status|alert|log`/`output`
   inventory from `eval-page.js:189`). v3 has the VSR but no action→announcement instrument. Add it as
   a new detector in `run-instruments.js` feeding both an `instrumentFinding` and the LLM lane.
3. **Reconcile transcript identity for the LLM lane.** The LLM adjudicator must consume the SAME raw
   transcript object the instruments consumed (one collection per page), not re-walk — bind by `runId`.

---

## 6. Work items (file-by-file)

| # | File | Change |
|---|---|---|
| 1 | `lib/v3-schema.js` | `EVIDENCE_SOURCES`, `LLM_CONFIDENCE`, `llmAdjudication()`, `V2_9_VERDICT_MAP` |
| 2 | `lib/llm-adjudicator.js` (new) | inherit v2.9 signal pre-compute (`a11y-eval`) + skill prompts; emit `{verdict,confidence,basis,evidenceRefs}` per obligation; map to direction |
| 3 | `lib/build-v3.js` | ingest `bundle.llmAdjudications`, map+sanitize before strict scan, surface `results.llmAdjudications` + summary |
| 4 | `lib/bundle-loader.js` / `orchestrator.js` | load the llm-adjudication artifact (parallel to judgments/instruments); bind by `runId` |
| 5 | `lib/metrics.js` | `scoreLlmAdjudications()` → per-(sc,direction) confusion + both-direction precision, reuse `unlabelledClears` guard + power gate |
| 6 | `lib/authority.js` | register `llm:<skill\|sc>` mechanisms, default `shadow`, readiness-gated promotion |
| 7 | `lib/vsr-collect.js` | **adopt the v2.9 CDP `axName` correction + bare-role `textContent` fallback (§5.2.0)**; retain `rawPhrase`; revise the header comment that currently justifies NOT porting the correction; then inherit `a11y-eval` phrase-noise filters (§5.2.1) |
| 8 | `lib/vsr-analysis.js` | drop the now-redundant `optionLeak` artifact heuristic once §5.2.0 lands (verify against gold first) |
| 9 | `lib/run-instruments.js` | add 4.1.3 action→announcement detector (§5.2.2) |
| 10 | `tests/` | adjudication shape + verdict-map + strict-scan-cannot-leak-legacy + gold-scoring + authority-promotion + name-correction (no "About, About"; unlabeled-select → empty name) fixtures |

Phasing: 1–3 (outcome type + builder surfacing, no browser) → 4 (wiring) → 5–6 (gold loop) →
7–9 (VSR realism + hardening) → 10 throughout.

---

## 7. Invariants preserved

- Exactly one *authoritative* disposition per obligation (CLAIM|PARTIAL); `LLM_ADJUDICATED` annotates,
  never replaces.
- No uncalibrated clear ever published: `llm` outcomes are `authoritative: false` and gated by
  `authority.js` (default `shadow`) just like every other mechanism.
- Strict output stays legacy-token-free: v2.9 verdicts are mapped + rationale sanitized before the
  `findLegacyLabelStrict` gate.
- The VSR remains an INSTRUMENT, not ground truth (memory: `vsr-is-harness-instrument`); gold remains
  hand-labeled after the run (memory: `ground-truth-hand-labeled-after-harness`).
</content>
