# Remediation plan — round 2 (response to the independent audit)

Date: 2026-06-14

Addresses every finding in [`INDEPENDENT-HARNESS-AUDIT.md`](INDEPENDENT-HARNESS-AUDIT.md)
(C1–C5, H1–H7, test gaps) with the refinements agreed in the auditor exchange (native-control
presumption gate, focus-evidence redesign, schema validation early, AX-states as a dependency).
It reuses the prior stage's QA framework — **unit** (pure logic), **integration** (live server
+ fixtures), **inspection** (manual visual/normative checks), **regression** (corpus-wide
invariants) — and adds **deterministic synthetic fixtures** so normative behaviour is tested by
construction, not on flaky real pages.

> **Status of round-1 output:** frozen as "prototype round 1." The fixed harness from the
> previous stage is **net-positive but not ground truth** — it can swap old false positives for
> new ones (T3 over-exemption, always-on-shadow focus, the unreachable keyboard-failure branch).
> No headline totals are republished until W7.

---

## Design principles (carried from the exchange)

1. **Normative-first.** A wrong rubric can't be rescued by better measurement. Correct the WCAG
   mapping (skills + plan) before generating any more data.
2. **One coupled foundation.** *Corrected output contract ↔ schema/validator ↔ AX-state
   collection* land together (W1–W3) — the schema must encode the corrected SC mapping, and
   enforcing 4.1.2 state rules + the native-presumption gate both need AX states.
3. **Trusted input only for behavioural claims.** No verdict rests on `dispatchEvent`/`el.click()`.
4. **Deterministic aggregates.** Agents emit per-element verdict + evidence ONLY; a builder
   derives every total and a validator rejects internally inconsistent runs.
5. **Evidence proves the normative thing.** Focus indicator = a *focus-dependent, visually
   distinguishable* change; target size = the actual circle geometry; 3.3.1 = a demonstrated
   unidentified error. Heuristics (forced `:focus-visible`, `display:inline`, center-distance)
   are corroboration or triage, never the verdict.
6. **PARTIAL on conflicting/again-unprovable signals**, not a forced definite.

---

## Work-streams (in execution order)

### W0 — Fix the test framework itself (precondition)
**Addresses:** test-audit (run-all broken, silent-skip, no-op sweep, value-domain).
- Move `regression-sweep.js` out of the `node --test` glob (→ `scripts/tools/`), so it stops
  being loaded as a test (the `MODULE_NOT_FOUND` cause). Canonical command becomes
  `node --test scripts/tests/*.test.js`.
- Integration suite must **fail loudly, not skip-green**, when its server precondition is unmet:
  add a `server-precondition.test.js` that hard-fails if `:3001` is down (or auto-spawns the
  server for the run). CI treats "0 executed" as failure.
- Repair the sweep: the T3 block is a no-op; replace with real checks (below). Add a
  value-domain assertion (`present ∈ {true,false,null}`), not mere key existence.
- **Tests:** a meta-test that asserts `node --test scripts/tests/*.test.js` exits 0 and runs
  >0 tests; a sweep self-test on a tiny fixture corpus with a known violation.
- **Done:** documented command runs all suites; no path silently passes with zero assertions.

### W1 — Correct the normative rules (skills + AGENT-PLAN) and define the output contract
**Addresses:** C1 (4.1.3), C2 (3.3.1), C4 (2.5.8 definition), H5 (1.3.1), H6-doc (threshold).
- **4.1.3 (C1):** rewrite plan Step 6 + `dynamic-announcement.md`. A bare `aria-expanded`/
  `aria-pressed`/`aria-selected` change → **4.1.2** (state exposure). A dialog opening →
  **focus-management / 3.2.x change-of-context**. Reserve 4.1.3 for *status messages* per
  [Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html):
  success/result/progress/error info that does **not** receive focus. Require the agent to first
  establish such a message visibly/non-textually appeared.
- **3.3.1 (C2):** rewrite forms guidance. Native HTML validation can **meet** 3.3.1
  ([Understanding 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)).
  Do **not** infer failure from missing `aria-invalid`/alert/live-region. A finding requires a
  *demonstrated* unidentified error (W5 captures the evidence). 3.3.3 needs the actual message.
- **2.5.8 (C4):** state the normative test (circle-to-target geometry; inline = "in a sentence
  or constrained by line-height," a semantic condition) — `display:inline` is triage only.
- **1.3.1 (H5):** in `page-structure.md`/`grouping-and-reading-order.md`, split into three
  buckets — **normative failure**, **AT-compat risk**, **best practice**. Missing landmarks =
  best practice; heading-level skip = AT-compat/best-practice (not a hard 1.3.1); `list-style:none`
  = Safari/VO-specific exposure risk (verify, don't assert on Chrome); duplicate heading text =
  not a failure per se.
- **H6-doc:** fix `skills/color-and-visual-text.md` large-text thresholds to match the helper
  (18pt = 24px; 14pt-bold = 18.66px). One source of truth.
- **Output contract:** produce `eval-results/RESULT-CONTRACT.md` — the canonical
  condition→SC→level map (consumed by W2's schema). E.g. "state change w/o status message →
  4.1.2 not 4.1.3"; "targetSize.fail → 2.5.8"; "missing landmark → best-practice, not 1.3.1."
- **Tests (unit + doc-consistency):**
  - `docs.test.js`: assert `color-and-visual-text.md` threshold strings equal the lib constants;
    assert the plan/skills contain **no** `expanded|pressed|dialog ⇒ 4.1.3` mapping; assert
    forms guidance does not derive 3.3.1 from "missing ARIA."
  - unit cases for the corrected SC mapping table.
- **Done:** no doc contradicts the helper; the contract file is the single SC authority.

### W2 — Deterministic result builder + schema validation
**Addresses:** C5 (anyIssue/bySkill/counts/issue-list/notFound inconsistencies).
- New `scripts/lib/result-builder.js`: input = per-element `{xpath, skills{verdict,sc,level,
  evidence}}` (+ collect/drive refs); output = the full `results.json` with **all aggregates
  derived** (`anyIssue`, `summary.bySkill`, `elementsWithIssue`, `summary.issues` with a single
  documented dedup rule). Agents stop hand-writing summaries.
- New `scripts/lib/result-schema.js` (+ validator): rejects a run when — required fields missing;
  `verdict ∉ {REPRODUCED,PARTIAL,NOT REPRODUCED,N/A}`; `anyIssue ≠ derived`; any `bySkill` cell ≠
  counted; `elementsWithIssue`/`issues` ≠ derived; a **definite dynamic** verdict on a `notFound`
  element; a REPRODUCED with empty `evidence`; an `sc` not permitted for that skill by
  `RESULT-CONTRACT.md`.
- Define "issue" precisely (sub-verdict vs deduped defect vs element vs page) and stamp the count
  basis into the JSON so "N actionable findings" is unambiguous.
- **Tests (unit + regression):**
  - `result-builder.test.js`: given crafted element records → exact `bySkill`/`anyIssue`/issues;
    the **C5 counterexamples** (an element with a REPRODUCED but `anyIssue:false`; a mismatched
    `bySkill` cell; a definite verdict on `notFound`) must each be **rejected** by the validator.
  - sweep: every generated `results.json` passes the validator (hard gate before W7).
- **Done:** it is impossible to emit a results file whose aggregates disagree with its records.

### W3 — Collect AX states (dependency of W1 enforcement + W4 gate)
**Addresses:** H7; enables C1's 4.1.2 routing and C3's native-presumption gate.
- `eval-page.js`: emit from the CDP AX tree + DOM — `checked/selected/expanded/pressed/disabled/
  current/level/valuetext/required/invalid`, plus `tabindexEffective`, `roleOverridesNative`,
  and an `obscured` flag (point-hit-test at the element centre).
- **Tests (integration on fixtures):** `states.html` fixture with a checked checkbox, an
  expanded disclosure, a disabled button, a `role`-overridden native tag → assert each state is
  reported.
- **Done:** name-role-**state** and the native gate have the data they require.

### W4 — Trusted input + mutation isolation + keyboard logic
**Addresses:** C3 (synthetic events, `keyboardOperabilitySignal` `focusable` bug, localTabWalk
edge, trap heuristic, mutation persistence), and the native-presumption refinement.
- Replace, in `drive-page.js`: Enter/Space → `page.keyboard.press` on the really-focused element;
  activation → `ElementHandle.click()` / `page.mouse`; hover → `page.mouse.move` over the real
  point; Escape → `page.keyboard.press('Escape')`. **Isolate every mutating probe** in a fresh
  reload or a new page (no cross-probe contamination, even for non-navigation mutations).
- **Native presumption gate:** presume Enter/Space when static preconditions hold (enabled,
  effective `tabindex ≥ 0`, no conflicting role override, not obscured, no pointer-only sibling
  carrying the affordance); otherwise exercise with trusted input. `disabled` *suppresses the
  presumption* but is not itself a finding.
- Pass `focusable` (+ the static preconditions) into `keyboardOperabilitySignal` so its
  `operable:false` branch is reachable (fixes the never-a-definite-failure bug).
- Fix `localTabWalk`: start strictly *before* the target (handle `ti==startIdx`); confirm the
  target (or a descendant) actually receives focus.
- Fix trap detection: prove a trap with forward **and** backward movement that cannot leave the
  component boundary — do **not** flag normal wraparound/revisits (raising the cap to 120 made
  this worse).
- **Tests (integration on fixtures):**
  - `kbd-div-onclick.html` (div+onclick, no key handler) → `operable:false`.
  - `kbd-trusted-only.html` (button that ignores synthetic events, acts on trusted) →
    `operable:true` (proves we use trusted input).
  - `roving-tablist.html` → active tab Tab-reachable, others via arrows, none flagged 2.1.1.
  - `trap-real.html` vs `wraparound.html` → trap flagged only for the real trap.
  - `first-focusable.html` (target is element #0) → reached, not falsely unreachable.
- **Done:** no behavioural verdict rests on untrusted input; mutations don't leak; the keyboard
  signal can return all three states correctly.

### W5 — Evidence redesign (focus, target-size, forms, VSR, traps)
**Addresses:** H1 (focus), C4 (target geometry), C2/forms capture, H3 (walk speech).
- **Focus (`focusRingDecision` + driver):** real Tab to the target → confirm it owns focus →
  scroll + **validated fresh crop** → diff **unfocused vs focused real pixels**, measured
  **spatially** (changed-region bbox, thickness, contrast vs adjacent — mapping to 2.4.7 visible /
  2.4.13 ≥2px-perimeter @ ≥3:1), not a crop-area %. Computed outline/shadow counts **only if it
  differs from the unfocused computed value** (kills the always-on-shadow false positive). Forced
  `:focus-visible` = corroboration only. Conflicting signals → PARTIAL.
- **Target-size (`evalTargetSize`):** implement circle-to-**rectangle** *and* circle-to-circle
  intersection against every adjacent target (per the spacing exception); `inline` becomes
  `indeterminate` unless a semantic in-sentence/line-height context is shown; apply only to real
  pointer targets.
- **Forms (driver + skill):** capture `submitBlocked`, invalid fields, `validationMessage`,
  `validity.*`, `document.activeElement` movement, and a screenshot of any native message. 3.3.1
  only when an error was *demonstrated* and *not* identified in text.
- **VSR (H3):** clear/sentinel `lastSpokenPhrase()` between every `tabWalk`/`srWalk` stop and
  attribute only **changed** phrases; set the VSR active node directly if the API allows, else
  mark attribution `uncertain`. Update the plan (it currently *claims* walk speech is filtered).
- **Tests (unit + integration on fixtures):**
  - `focus-alwayson-shadow.html` → `present:false`; `focus-js-class.html` (class added on focus
    event) → `present:true` **via real Tab** (forced-only would miss it);
    `focus-thin-large.html` (1px border on a 600px control) → `present:true` (spatial, not %).
  - `target-small-near-large.html` (10×10 target, large neighbour edge <12px, centre 30px) →
    **fail** (the auditor's counterexample); `target-in-sentence.html` → exempt.
  - `form-native-validation.html` → not auto-3.3.1; captures `validationMessage`.
  - `stale-speech.html` → walk speech filtered/attributed correctly.
- **Done:** each evidence type proves the normative property; the documented counterexamples pass.

### W6 — Strengthen the suite with normative counterexamples
**Addresses:** test-audit (happy-path only, no normative coverage).
- Land all W3–W5 fixtures under `scripts/tests/fixtures/` (served by the existing server or
  `file://`). Add integration tests that prove **trusted** Enter/Space/click/hover/Escape
  behaviour end-to-end (not just selected real pages).
- Add `schema.test.js` (W2), `docs.test.js` (W1), and expand the sweep (W0) to cover present
  value-domain, T6 notFound, T10 walk speech, T12, T13 trap, T14 structure-cleanliness, and the
  C5 aggregate invariants.
- **Done:** the suite fails on a regression of any C/H finding, and on schema/count drift.

### W7 — Regenerate + independently adjudicate
**Addresses:** H2 (old bundles unreliable), and the "don't republish yet" conclusion.
- Regenerate `collect.json`/`drive.json` with the corrected harness (ideally the ~254 touched
  elements first, then full); re-run agents under the corrected plan; **gate every run through
  the W2 validator**.
- Independently adjudicate a **stratified sample** (confirmed failures, passes, and partials, per
  skill) before recomputing any headline totals. Publish the adjudicated agreement rate.
- **Done:** new totals carry a documented contract, a passing validator, and a sampled
  human-adjudicated accuracy estimate — only then do they replace "prototype round 1."

---

## Verification framework

### Test layout (extends the previous stage)
```
scripts/lib/        a11y-eval.js · result-builder.js · result-schema.js
scripts/tools/      regression-sweep.js            (moved out of the test glob — W0)
scripts/tests/
  unit.test.js          pure logic (existing + new geometry/focus/contract cases)
  result-builder.test.js  aggregate derivation + C5 rejection cases
  schema.test.js          validator rejects corrupt outputs
  docs.test.js            skill/plan ↔ helper/contract consistency
  states.test.js          AX-state collection (W3)
  behavior.test.js        trusted Enter/Space/click/hover/Escape (W4)
  evidence.test.js        focus/target/forms/VSR normative counterexamples (W5)
  integration.test.js     real pages (existing) + server precondition (W0)
  fixtures/*.html         deterministic known-answer constructs
```
Run: `node --test scripts/tests/*.test.js` (fixed) · `node scripts/tools/regression-sweep.js <dir>`.

### Coverage matrix (finding → method → key assertion / counterexample)
| Finding | Unit | Integration / fixture | Inspection | Regression |
|---|---|---|---|---|
| C1 4.1.3 scope | SC-map cases | `aria-expanded` fixture → 4.1.2 not 4.1.3 | review 6 dialog/expanded findings | no `state⇒4.1.3` in output |
| C2 3.3.1 native | — | `form-native-validation` → not auto-fail; captures message | review issued 3.3.1s | no 3.3.1 from "missing ARIA" |
| C3 trusted input / kbd | `keyboardOperabilitySignal` all 3 states | `kbd-div-onclick`→false, `trusted-only`→true | — | no synthetic-only definite verdict |
| C3 trap / localTabWalk | — | `trap-real` vs `wraparound`; `first-focusable` | — | wraparound not flagged |
| C4 target-size geometry | circle-rect + circle-circle cases incl. {10×10 near large} | `target-small-near-large`→fail | Home Artera footer re-review | no pass on circle-rect intersect |
| C5 result integrity | builder derivation | — | — | validator rejects anyIssue/bySkill/notFound drift |
| H1 focus evidence | always-on-shadow→false; focus-dependent-only | `focus-js-class`→true (real Tab); `focus-thin-large`→true | shot-pair spot checks | `present∈{T,F,null}` value-domain |
| H3 VSR walk speech | `meaningfulAnnouncement` on walks | `stale-speech` fixture | notes cross-check | no repeated unfiltered walk speech |
| H4 consent | — | `consent.html` → headings excluded from structure | both states evaluated | structure has no consent headings |
| H5 1.3.1 buckets | bucket classifier | — | landmark/heading/list findings re-tier | no missing-landmark⇒1.3.1 |
| H6 contrast | alpha-composite cases | — | — | doc threshold == lib |
| H7 AX states | — | `states.html` all states present | — | required state fields present |

### Inspection checklist (manual, per the auditor's "independent adjudication")
- Re-read the wrong/blank crops cited in H2 against regenerated shots.
- Adjudicate the stratified W7 sample blind to the agent verdict.
- Confirm consent-present vs consent-dismissed are evaluated as **two** states (H4), not one.

---

## Dependency graph & sequencing
```
W0 (test infra) ─┐
W1 (rules + contract) ──┬──► W2 (builder+schema, encodes contract)
W3 (AX states) ─────────┘        │
        └───────────────► W4 (trusted input + gate, needs states)
                                  └──► W5 (evidence redesign)
                                          └──► W6 (counterexample suite)
                                                  └──► W7 (regenerate + adjudicate)
```
W1+W2+W3 are the **coupled foundation** — do them together before any regeneration. W4–W5 consume
it. W7 is gated on a green W6 + a passing validator.

## Definition of done (whole effort)
1. No skill/plan text contradicts the helper or `RESULT-CONTRACT.md`; 4.1.3/3.3.1/2.5.8/1.3.1
   map per WCAG.
2. Every behavioural verdict is produced by trusted input on an isolated page.
3. No results file can be emitted with inconsistent aggregates (validator-gated).
4. Focus/target/forms/VSR evidence each prove the normative property; all counterexample
   fixtures pass.
5. `node --test scripts/tests/*.test.js` runs every suite (no silent skips) and the sweep checks
   real invariants.
6. Regenerated corpus + a stratified, independently-adjudicated accuracy estimate before any
   headline total is republished.
