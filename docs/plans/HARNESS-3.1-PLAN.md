# Harness 3.1 Plan — the LLM evidence source + v2.9 pipeline inheritance

Status: **IMPLEMENTED (2026-06-16)**. Builds on the round2 VSR/keyboard instrument wiring
(`vsr-collect.js`, `vsr-analysis.js`, `vsr-graph.js`, `kbd-graph.js`, `order-check.js`,
`run-instruments.js`). Nothing here weakens a v3 invariant: the harness still never publishes an
uncalibrated clear, and every obligation still receives exactly one *authoritative* disposition.

> **Implementation note (2026-06-16).** Shipped: the LLM fourth evidence source as a `source:'llm'`
> shadow-emitting mechanism (`llm-adjudicator.js`), the judgments unify (M1 — `judgments.RUBRICS`
> deleted, atomic rubrics emit `llm-rubric:*` shadow obs), per-mechanism + asymmetric + coverage gold
> scoring (`metrics.js`), the LLM-mechanism authority cap at `canary` with model/prompt/gold-blinding
> provenance (`authority.js`), the `llm`/`llmRationale` stages with M5 content-binding, the CDP
> `axName` correction in `vsr-collect.js` (§5.2.0, probe-verified), the §5.2.1 phrase-noise filter, and
> the §5.2.2 4.1.3 action→announcement detector (`status-detector.js`). Two design refinements emerged
> from implementation + a 5-skeptic adversarial pass (all findings fixed with regression tests):
> (a) LLM/rubric shadow obs are kept OUT of obligation reconciliation entirely (pure annotations) —
> `reconcile` errors on a duplicate disposition, so an LLM opinion on an already-CLAIMed obligation
> would otherwise crash the build; (b) the artifact stores the raw v2.9 token under `agentVerdict`
> (not `verdict`) and every agent-controlled structural string is coerced + legacy-token-rejected at
> validation, and the strict scanner now coerces boxed primitives — closing a `new String('N/A')`
> leak. Item 8 (`optionLeak` removal) is DEFERRED pending gold verification (the heuristic is retained
> as a sound fallback for the raw `cdpCorrect:false` path). Suites green: v3 242, pure 190.

> **Revision note (post critical-review).** This supersedes the first draft, which modeled the LLM as a
> separate `llmAdjudications[]` array with its own promotion path. That array was invisible to the
> existing scoring/authority machinery (which reads only `claims` + `shadowObservations`), so it could
> never actually be promoted, and it overstated the LLM's ability to *clear* SCs. The corrected design
> makes the LLM a **shadow-emitting mechanism** that reuses the existing rails. See §8 for the full list
> of corrections.

---

## 1. Goal

Today v3 has these evidence lanes that can touch an obligation:

| Lane | Source | Authority | Where it surfaces |
|---|---|---|---|
| Deterministic experiment | `exp-runners.js` (trusted) | `CLAIM` (authoritative) or gold-gated shadow | `claims` / `shadowObservations` |
| Safe sink | un-proposed / unproven | `PARTIAL` | `partials`, `obligationLedger` |
| Atomic semantic judgment | `judgments.js` (LLM + rubric) | recommendation-only (no rubric calibrated) | `adjudicationRecommendations` |
| VSR/keyboard instruments | `run-instruments.js` | non-authoritative shadow | `instrumentFindings` |

What is missing: a **whole-obligation LLM verdict**, produced by directly inheriting the v2.9 agent
pipeline, recorded so it can be **scored against the hand-labeled gold** (memory:
`ground-truth-hand-labeled-after-harness`). The atomic `judgments.js` lane only covers a handful of
rubric-scoped meaning calls (alt adequacy, error helpfulness); it does **not** give the 14 SCs with no
deterministic runner an opinion that gold can grade. v3.1 adds the LLM as a **fourth evidence source**
feeding the *existing* non-authoritative shadow lane — not a new disposition and not a new array.

### Honest value (what this does and does not buy)

- **Does:** a barrier-flagging opinion across all 10 categories, including the 14 runner-less SCs, for
  human review; and a *measured* agreement signal vs gold that tells us where an LLM is reliable.
- **Does NOT (near-term):** earn authoritative **clears**. The clear-promotion gate in `metrics.js`
  requires **zero** false clears on a fully gold-labeled set (`promotionEligible = unlabelledClears===0
  && labelledClears>0 && falseClears===0`). A realistic LLM will produce the occasional false clear, so
  LLM clears stay `shadow`/unpublished indefinitely under that gate — by design. The clear lane stays the
  domain of deterministic runners.
- **Plausible future ceiling:** the *barrier* direction (false barriers are review-noise, not safety
  failures) MAY reach a `canary` state under a deliberate, asymmetric threshold (§4) — never automatic,
  and gated on a held-out sealed eval because an LLM does not generalize off a gold set the way a
  deterministic mechanism does (§8/H4).

---

## 2. The fourth evidence source — `source: 'llm'` shadow observations

### 2.1 What it is (and is not)

The LLM is realized as a **mechanism** (like `focus-visual-retry` is a mechanism) whose outputs are
**shadow observations**, never authoritative claims. v3 keeps observation / applicability / conformance
orthogonal (`v3-schema.js`); "who produced it" is a *fourth orthogonal axis* (evidence source), not a
fourth observation value and not a new disposition:

```
observationOutcome ∈ { BARRIER_OBSERVED, NO_BARRIER_OBSERVED, INCONCLUSIVE }   // unchanged
source             ∈ { deterministic, instrument, llm }                        // NEW axis (tag)
authoritative      = false                                                     // ALWAYS for llm
```

Each LLM verdict becomes a record in `results.shadowObservations` of the shape `scoreClears` already
consumes — `{ sc, observationScope: { actionTargetRef: xpath }, wouldBe: { observationOutcome,
wcagApplicability }, source: 'llm', mechanism: 'llm-agent', claimFamily, confidence, evidenceRefs,
decisionCoverageRef }`. Because it is a shadow observation, the obligation's disposition is **untouched**
(it stays auto-`PARTIAL` when no deterministic CLAIM exists). "Uncertain" is structural: an `llm` outcome
can never clear or barrier until `authority.js` promotes its `(mechanism, direction)` off the
default-`shadow` state, and the clear direction is effectively gated out (§1).

This reuses, for free: `scoreClears` (sees `shadowObservations.wouldBe`), the `unlabelledClears`
fail-closed guard, the statistical-power sizing, and `authority.js` promotion — no parallel machinery.

### 2.2 Schema changes (`v3-schema.js`)

- Add `EVIDENCE_SOURCES = ['deterministic', 'instrument', 'llm']` and `LLM_CONFIDENCE =
  ['low','medium','high']`.
- Extend the shadow-observation record with `source`, `mechanism`, `claimFamily`, `confidence`,
  `evidenceRefs`, `decisionCoverageRef` (all structured/enumerated — see 2.3 on why no free text).
- Add `V2_9_VERDICT_MAP` (single source of truth): `REPRODUCED → BARRIER_OBSERVED`,
  `NOT REPRODUCED → NO_BARRIER_OBSERVED`, `PARTIAL → INCONCLUSIVE`, **`N/A → INCONCLUSIVE` (abstain)**.
  The LLM may **not** assert `INAPPLICABLE` — applicability is owned by the independent oracle
  (`applicability-oracle.js`); an LLM "N/A" is an abstention, not an applicability ruling (§8/H1).

### 2.3 Output surfacing + strict-scan safety (`build-v3.js`)

The LLM verdicts ride the existing `shadowObservations` array, so they pass through
`findLegacyLabelStrict(results)` ([build-v3.js:319]). That scanner rejects **any** string value (and
key) whose whole, normalized value equals a legacy token (`REPRODUCED` / `NOT REPRODUCED` / `N/A`) —
there are no exempt fields on the strict path. An LLM `evidenceRef` or rationale that is literally
`"N/A"` would therefore cause a **non-deterministic publish refusal**.

Resolution (this is the C3 fix — the first draft's "sanitize" was underspecified):

- **Structured-only in `results`.** Everything the strict scanner sees is an enum, an xpath, an SC code,
  or an opaque id — never agent free text. `observationOutcome`/`wcagApplicability` come from
  `V2_9_VERDICT_MAP`; `confidence` is an enum; `evidenceRefs` are ids.
- **Free text in a side artifact.** The agent's natural-language rationale lives in a separate
  `llm-rationale.json` artifact bound by id, scanned with the *lenient* `findLegacyLabel` (keys +
  verdict-fields only), so legitimate prose containing a token is safe and a stray whole-value token in
  a non-verdict field cannot block publication.
- Unit-test: an `evidenceRef`/rationale equal to `"N/A"` must not reach the strict-scanned `results`.

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
  correction applied (§5.2.0 — the name slot the agent judges must be the *real* announced name, not a
  Guidepup artifact). The 4.1.2 meaning call (announced name vs purpose/visible text) is only sound on
  the realistic name; the raw VSR name would inject false mismatches the agent then has to relitigate.
- **Verdict — inherit the v2.9 skill rubric prompts.** The agent returns `{ verdict, confidence, basis,
  evidenceRefs }`; `V2_9_VERDICT_MAP` lifts it into a v3 direction.
- **Binding (M3).** Each verdict binds to `(xpath, sc, claimFamily)` and the agent must name the
  `claimFamily`. Gold and `scoreClears` key on `(xpath, sc)`, which is sufficient while family↔sc is 1:1,
  but carry the family so a future multi-family SC (the oracle warns 2.4.7 can be one) is unambiguous.
- **Batching + budget (M4).** Judge per `(element, skill)` as v2.9 did — NOT one LLM call per obligation
  (that multiplies cost by the obligations-per-element fan-out). Drive the fan-out from `budget.js`.
- **Coverage.** Prioritize obligations that are auto-`PARTIAL` (no deterministic CLAIM); this gives the
  14 runner-less SCs (1.1.1, 1.3.1, 1.4.1, 1.4.5, 1.4.11, 2.4.2, 2.4.4, 2.4.6, 2.4.13, 2.5.3, 2.5.5,
  2.5.8, 3.3.3, 4.1.3) a gold-gradeable opinion for the first time.

**Consolidation (M1) — full unify, committed.** Round2 is committed to git and frozen, so there is no
collision risk in refactoring the existing judgments lane. v3.1 makes `authority.js` the **single**
calibration/promotion gate for every LLM opinion:

- `judgments.js` keeps its shape validation + binding but **stops owning calibration**: it emits its
  atomic rubric judgments as `source:'llm'` shadow observations with `mechanism: 'llm-rubric:<rubricRef>'`
  and a verdict map (`LIKELY_BARRIER → BARRIER_OBSERVED`, `LIKELY_OK → NO_BARRIER_OBSERVED`,
  `UNCERTAIN → INCONCLUSIVE`).
- the whole-obligation agent emits `mechanism: 'llm-agent'` (per §2).
- both promote per `(mechanism, direction)` through `authority.AUTHORITY`; the parallel
  `judgments.RUBRICS` registry is **deleted**.
- `adjudicationRecommendations` becomes a **derived view** over the un-promoted `source:'llm'` shadow
  observations — one source of truth, one review queue.

Unify the *gate*, not the *mechanisms*: the agent and each rubric stay DISTINCT mechanism identities so
each is calibrated on its own reliability, never pooled.

---

## 4. Gold comparison + calibration loop

The loop (memory: ground truth is hand-labeled AFTER the run):

1. **Run** harness → LLM verdicts recorded as `source:'llm'` shadow observations (non-authoritative);
   the run artifact is content-bound to `pageDigest`/`runId` and scoring rejects a mismatch (M5).
2. **Hand-label** gold via the annotator (`server.js`) → `gold: [{ xpath, sc, goldOutcome }]`, labeled
   **blind to the LLM output** (the annotator must not show the model verdict to the labeler) — otherwise
   the precision estimate is circular (§8/H3).
3. **Score per mechanism + direction.** `metrics.js`:
   - extend `scoreClears` to **group/filter by `mechanism`** (so LLM shadow clears are scored apart from
     deterministic shadow clears, which it currently lumps together);
   - add `scoreBarriers` for the BARRIER direction (precision / false-barrier rate) — none exists today,
     and the two directions need **asymmetric** thresholds (a false clear is dangerous; a false barrier
     is review-noise) (§8/M2);
   - report **decision coverage** (the INCONCLUSIVE/abstention rate). Precision on the *decided* subset
     is gameable by abstaining on every hard case, so promotion gates on coverage too (§8/H2).
4. **Power-gate** with the existing zero-event sizing (`requiredZeroEventN`, e.g. 149 for a 2% bound) so
   a thin gold set bounds regressions, not a low-FN claim.
5. **Promote** via `authority.js`: register the LLM as `llm-agent/<direction>` (or per skill), default
   `shadow`. Readiness for the LLM mechanism is STRICTER than for a deterministic one, because an LLM
   calibrated on gold does **not** generalize to unseen pages the way fixed code does (§8/H4):
   - the existing flags (`goldSized`, `sealedEval`, `independentRaters`, `measurementValidated`), AND
   - **`sealedEval` is mandatory, not optional** — held-out pages the calibration never saw;
   - **a pinned `(model, prompt)` provenance** (model id + prompt hash) — a model/prompt change
     invalidates the promotion (§8/H5); carry it in the authority `provenance` refs;
   - **`goldBlinded`** provenance — gold was labeled without sight of the model output;
   - realistically, the LLM is **capped at `canary`** (barrier direction) with ongoing drift monitoring;
     authoritative clears are not a target under the current gate.

Net: the LLM is one more mechanism on the existing promotion rails, with stricter, LLM-specific readiness
evidence. The fail-closed default (`shadow`) is unchanged.

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
| 1 | `lib/v3-schema.js` | `EVIDENCE_SOURCES`, `LLM_CONFIDENCE`; extend the shadow-observation record with `source`/`mechanism`/`claimFamily`/`confidence`/`evidenceRefs`/`decisionCoverageRef`; `V2_9_VERDICT_MAP` (N/A→INCONCLUSIVE) |
| 2 | `lib/llm-adjudicator.js` (new) | inherit v2.9 signal pre-compute (`a11y-eval`) + skill prompts; judge per `(element, skill)` under `budget.js`; bind `(xpath, sc, family)`; emit `source:'llm'` shadow obs + a side `llm-rationale` artifact |
| 3 | `lib/build-v3.js` | ingest LLM shadow obs into `shadowObservations` (structured-only); rationale to side artifact; `adjudicationRecommendations` becomes a derived view; keep strict scan green |
| 3b | `lib/judgments.js` | **full unify (M1):** emit atomic judgments as `source:'llm'` `mechanism:'llm-rubric:<id>'` shadow obs + verdict map (LIKELY_BARRIER/LIKELY_OK/UNCERTAIN → BARRIER/NO_BARRIER/INCONCLUSIVE); **delete `RUBRICS`**; calibration moves to `authority.js` |
| 4 | `lib/bundle-loader.js` / `orchestrator.js` | load the LLM + rationale artifacts; content-bind to `pageDigest`/`runId`, reject mismatch (M5) |
| 5 | `lib/metrics.js` | group/filter `scoreClears` by `mechanism`; add `scoreBarriers` (asymmetric thresholds); report decision-coverage (abstention) |
| 6 | `lib/authority.js` | register `llm-agent/*` **and `llm-rubric:*/*`** mechanisms, default `shadow`; add `(model,prompt)` + `goldBlinded` provenance; mandatory `sealedEval`; cap barrier at `canary` |
| 7 | `lib/vsr-collect.js` | **adopt the v2.9 CDP `axName` correction + bare-role `textContent` fallback (§5.2.0)**; retain `rawPhrase`; revise the header comment that currently justifies NOT porting the correction; then inherit `a11y-eval` phrase-noise filters (§5.2.1) |
| 8 | `lib/vsr-analysis.js` | drop the now-redundant `optionLeak` artifact heuristic once §5.2.0 lands (verify against gold first) |
| 9 | `lib/run-instruments.js` | add 4.1.3 action→announcement detector (§5.2.2) |
| 10 | `tests/` | shadow-obs `source:'llm'` shape + verdict-map (N/A→INCONCLUSIVE) + strict-scan-cannot-leak-legacy + per-mechanism gold scoring + abstention-coverage + authority `(model,prompt)`/blinding gates + name-correction (no "About, About"; unlabeled-select → empty name) |

Phasing: 1–3, 3b (LLM source on the shadow lane + judgments unify, no browser) → 4 (wiring + binding) →
5–6 (gold loop: per-mechanism scoring, asymmetric/blinded/pinned promotion) → 7–9 (VSR realism +
hardening) → 10 throughout.

---

## 7. Invariants preserved

- Exactly one *authoritative* disposition per obligation (CLAIM|PARTIAL); an `llm` shadow observation
  annotates, never replaces — same as a deterministic shadow observation.
- No uncalibrated clear ever published: `llm` outcomes are `authoritative:false`, default-`shadow` in
  `authority.js`; the clear-promotion gate (zero false clears, full gold labeling) keeps LLM clears out.
- One calibration gate: every mechanism — deterministic, `llm-agent`, or `llm-rubric:*` — promotes only
  through `authority.js`; there is no parallel rubric registry (`judgments.RUBRICS` is deleted).
- Applicability stays oracle-owned: the LLM may not assert `INAPPLICABLE` (N/A → INCONCLUSIVE abstain).
- Strict output stays legacy-token-free: only structured/enumerated fields ride `results`; agent free
  text lives in a side artifact scanned leniently.
- Determinism of the build is preserved: the LLM runs offline into a frozen, content-bound artifact; the
  builder is a pure function over it.
- The VSR remains an INSTRUMENT, not ground truth (memory: `vsr-is-harness-instrument`); gold remains
  hand-labeled after the run (memory: `ground-truth-hand-labeled-after-harness`).

---

## 8. Corrections folded in from the critical review

| # | Severity | Issue | Resolution in this plan |
|---|---|---|---|
| C1 | critical | Separate `llmAdjudications[]` array was invisible to `scoreClears`/`authority.js` (which read only claims + shadowObservations) → unpromotable | LLM is a **shadow-emitting mechanism** (`source:'llm'`); reuses scoreClears + authority unchanged (§2) |
| C2 | critical | Overstated "only path to clearing the 14 SCs" — the zero-false-clear gate effectively bars LLM clears | Reframed value to barrier-flagging + agreement measurement; clears explicitly gated out (§1, §4) |
| C3 | critical | Strict scanner rejects any whole-value legacy token in *any* field → non-deterministic publish refusal on LLM phrasing | Structured-only in `results`; free text in a side artifact scanned leniently (§2.3) |
| H1 | high | `N/A → INAPPLICABLE` usurps the independent applicability oracle and routes into the clear-gate | `N/A → INCONCLUSIVE` (abstain); applicability stays oracle-owned (§2.2) |
| H2 | high | Abstention/selection bias inflates precision-on-decided | Report + gate on decision coverage (§4) |
| H3 | high | Gold contaminated if labeled with sight of the model verdict | Gold labeled **blind**; `goldBlinded` provenance (§4) |
| H4 | high | LLM gold-calibration doesn't generalize like deterministic code | Mandatory sealed/held-out eval; cap at `canary`; drift monitoring (§4) |
| H5 | high | No model/prompt version pinning | Pinned `(model, prompt)` in authority provenance; upgrade invalidates (§4) |
| M1 | med | Three parallel calibration registries | **Full unify (committed — round2 frozen, no collision):** `authority.js` is the single gate; `judgments.js` emits `source:'llm'` shadow obs and `judgments.RUBRICS` is **deleted** (§3, work item 3b) |
| M2 | med | No barrier-direction scorer; "both-direction precision" was net-new | Add `scoreBarriers` with asymmetric thresholds (§4) |
| M3 | med | Binding by `(xpath, sc)` only | Bind `(xpath, sc, family)`; agent names the family (§3) |
| M4 | med | Per-obligation LLM calls multiply cost | Batch per `(element, skill)` under `budget.js` (§3) |
| M5 | med | Stale artifact could score against the wrong page | Content-bind to `pageDigest`/`runId`; reject mismatch (§4) |

---

## 9. Implementation deltas & additions (2026-06-16)

What the implementation changed or added relative to §§1–8, with the reason. All deltas are covered by
tests (v3 242, pure 190) and a 5-skeptic adversarial pass.

### 9.1 Producer vs consumer (clarified)
`lib/llm-adjudicator.js` is split into two halves, mirroring `judgments.js`:
- **Consumer** `processLlm()` — a PURE function the builder runs over a frozen `llm.json`: validate →
  bind → verdict-map → emit `source:'llm'` shadow obs. This is what keeps `buildV3` deterministic.
- **Producer** `runAdjudication()` — the OFFLINE pass that CREATES `llm.json` (+ `llm-rationale.json`):
  select auto-PARTIAL subjects → pre-compute `a11y-eval` signals + VSR excerpt → prompt per
  `(element, skill)` → call the INJECTABLE `runAgent` → write the artifacts. Inert by default (no
  `runAgent` ⇒ refuses), so a misconfigured/headless run can never hit an API. This is the pass that
  will run over the saved corpus once the hold is lifted; the builder only ever sees its frozen output.

### 9.2 Deviations forced by the real code (each is a correctness fix, not a scope change)
- **LLM/rubric shadow obs are kept OUT of obligation reconciliation entirely** (pure annotations on
  `results.shadowObservations`, a separate `annotationObs` list). `obligations.reconcile` raises a
  *duplicate disposition* error when two dispositions share an `obligationId`, so an LLM opinion on an
  obligation a deterministic runner already CLAIMed (or PARTIAL'd) would have CRASHED the build.
  Annotation-only is the only way to honor §2.1's "disposition untouched" in every case.
- **Raw v2.9 token stored under `agentVerdict`, not `verdict`.** A field literally named `verdict` is a
  VERDICT_FIELD scanned by the bundle's lenient legacy scan, so a raw `REPRODUCED`/`N/A` there would
  reject the whole bundle. `agentVerdict` is the untrusted agent's raw reply (a non-schema string the
  lenient scan tolerates); `processLlm` maps it to a v3 enum — only the enum reaches `results`.
- **LLM mechanisms are CAPPED at `canary` in `authority.js`** (canary never publishes). This is the
  cleanest guarantee no LLM opinion ever publishes authoritative, satisfying §7; `validateAuthority`
  rejects a registry that marks an `llm-agent`/`llm-rubric:*` entry `authoritative`.

### 9.3 Adversarial hardening (findings fixed + regression-tested)
- **C3 reinforced (HIGH):** a boxed `new String('N/A')` is `typeof 'object'` and evaded the strict
  scanner but serializes to the bare token. Fix: coerce agent-controlled strings to primitives at
  construction, REJECT legacy tokens in structural fields (`claimFamily`/scope/ids) at validation (a
  clear early error, not a confusing terminal refusal), and the strict scanner now coerces boxed
  primitives as a backstop.
- **4.1.3 detector soundness (HIGH ×3):** triggers inside `aria-hidden`, `visibility:hidden`/`opacity:0`
  triggers, and re-parented PRE-EXISTING content were false-flagged. Fix: an AT-perceivability gate, a
  "new text only" check (vs a pre-click `body.innerText` snapshot), and a navigation-resilient
  per-trigger loop (a scripted-nav control is skipped, and a navigation keeps findings gathered so far).
- **MED/LOW:** `precomputeSignals` no longer crashes on a malformed element; the barrier/clear scorers
  are mutually exclusive (no double-count); sectioning containers (`article`…) removed from the VSR
  text-fallback roles so they don't fold a subtree into a bogus name.

### 9.4 VSR realism specifics (§5.2.0–§5.2.2 as built)
- The CDP name-slot correction overwrites ONLY the name (role + states preserved — we avoid the v2.9
  prefix-match state-drop), retains `rawName`/`rawPhrase`/`axName`, and restricts the textContent
  fallback to leaf-ish nameFrom:contents roles (probe-verified: unlabeled `<select>` → name='', so the
  `optionLeak` heuristic is now redundant on the corrected path — its REMOVAL stays deferred until
  verified against gold, per item 8).
- §5.2.1 phrase-noise filter drops only RECOGNIZED non-empty noise phrases (an empty announcement is
  not landmark noise — a nameless widget must survive for the 4.1.2 check).

### 9.5 Annotation companion — evidence + summary + reasoning per verdict (NEW, requested)
Goal: hand-annotation after the run should never re-derive anything. For every LLM verdict the PRODUCER
records, in the side `llm-rationale.json` (free text — lenient-scanned, NEVER in strict `results`):
- `evidence` = exactly what the LLM saw — the deterministic `a11y-eval` `signals` + the VSR announcement
  (`name`/`role`/`states`/`axName`/`rawName`) + the agent's `evidenceRefs`;
- `summary` = ONE sentence stating the verdict in plain language;
- `reasoning` = ONE sentence citing the evidence that drove it;
- plus `verdictId`/`sc`/`targetXpath`/`mechanism`/`agentVerdict` for joining.
The structured `results.adjudicationRecommendations` review queue carries the `rationaleRef` pointer, so
the annotation tool resolves verdict → its evidence + summary + reasoning. The rubric lane is symmetric:
`judgments.json` records carry optional `rationale`/`summary`/`reasoning` (same lenient-scanned home).
For deterministic CLAIMs/shadows the evidence is the experiment outcome flags already in
`experiments.json` (joined by `(xpath, sc)`); for instrument findings it is the finding `detail`.
</content>
