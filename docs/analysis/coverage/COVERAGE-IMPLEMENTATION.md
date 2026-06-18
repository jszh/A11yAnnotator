# Coverage-analysis implementation — round 1

Implements the highest-ROI, soundest slice of the needs in
[ACT-RULES-COVERAGE-ANALYSIS.md](./ACT-RULES-COVERAGE-ANALYSIS.md) +
[WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md](./WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md), then had three adversarial
verifier agents critique each capability. **All changes are NON-AUTHORITATIVE shadow cross-signals** —
they can only *add* signal scored vs gold; they can never false-clear or false-barrier an obligation
(the AUTHORITY registry is empty, so nothing in v3 gates today regardless). Full suite green.

## Framing decision

The analyses recommend dozens of items and frame many as "new authoritative runner → CAPTURED." But the
AUTHORITY registry currently holds only `focus-visual-retry` (pinned shadow), so **nothing publishes
authoritatively** — the CAPTURED-vs-PARTIAL axis is moot for current behavior. The right reading: maximize
**scored-vs-gold coverage cheaply and soundly**. That makes *surfacing what axe already decided* the
dominant win, and *detectors over already-collected data* the natural second tier. We deliberately did NOT
take the analysis's higher-risk items (promote axe to authoritative; hand-roll WAI-ARIA validity tables —
already covered by surfacing axe's `aria-*` family; relational link/iframe instruments — out of the
single-page-DOM domain). **1.4.6 (ACT 09o5cg) is out of scope** per instruction.

## What shipped

### 1. Expanded axe-finding surfacing — the §A "highest ROI" item  ✅ verifier: WELL_IMPLEMENTED
[`axe-surface.js`](../../../scripts/v3/lib/axe-surface.js) + [`eval-page.js`](../../../scripts/eval-page.js).
axe-core runs ~90 rules at collection but v3 consumed only `{1.3.1,1.3.5,1.4.4,2.4.4,3.1.x}`, dropping
~22 ACT rules' worth of decided coverage (mostly 1.1.1 / 4.1.2). Now:
- **Wholesale SCs** added: `1.1.1` (image-alt family), `2.1.1` (scrollable-region/frame-focusable),
  `2.4.2` (document-title).
- **Per-ruleId allow-list** (`AXE_SURFACED_RULES`) for the 4.1.2 name/aria family — so each verified ACT
  reference rule (button-name, link-name, label, summary-name, frame-title, aria-required-attr,
  aria-allowed-attr, aria-roles, aria-valid-attr(-value), nested-interactive, aria-hidden-focus, …)
  surfaces **without** opening bare 4.1.2 to the noisy rest of the family.
- **Best-practice ruleId→SC map** (`BEST_PRACTICE_RULE_SC`) for rules axe tags with NO wcag SC:
  `presentation-role-conflict`→1.1.1, `empty-heading`→1.3.1.
- **`incomplete` (needs-review) surfacing**: `eval-page.js` now collects axe `incomplete` into
  `collect.axeIncomplete`; these surface as **review-tier** findings (`review:true, kind:'incomplete'`) —
  the empty-headers / empty-required-container review priors (a25f45/bc4a75/ff89c9) v3 previously dropped.

**Verified** against real ACT failed examples (ran axe with the exact eval-page config, then
`surfaceAxeFindings`): image-alt→1.1.1, button-name/frame-title/summary-name/aria-hidden-focus/label/
aria-required-attr/aria-allowed-attr/nested-interactive→4.1.2, scrollable-region-focusable→2.1.1,
td-headers-attr→1.3.1, presentation-role-conflict→1.1.1, empty-heading→1.3.1, aria-required-children
incomplete→1.3.1(review). The verifier confirmed the per-rule gate drops the 13 *unwanted* 4.1.2 rules
(e.g. `aria-roledescription`) and that nothing reaches `reconcile()`.
*Verifier doc fixes applied:* `area-alt` is tagged 2.4.4/4.1.2 (not 1.1.1) — comment corrected;
`aria-meter-name`/`aria-progressbar-name` ride wholesale 1.1.1 — now documented.

### 2. `ax-name-presence` deterministicSignal  ✅ verifier: HAS_PROBLEM (critical bug found + FIXED)
[`build-v3.js`](../../../scripts/v3/lib/build-v3.js) deterministicSignals lane. Flags a name-presence
barrier when a collected element is **in the AX tree** (`inTree:true`), has a **name-requiring CDP role**
(`NAME_REQ_SC`: image→1.1.1; button/link/checkbox/radio/switch/tab/menuitem*/textbox/combobox/listbox/
searchbox/spinbutton/slider/DisclosureTriangle→4.1.2; heading→1.3.1), and its **CDP accessible name is an
empty string**. Independent cross-signal to axe's name family via the *CDP* name path (distinct algorithm
from axe's DOM-name). CDP role strings verified empirically (img→`image`, summary→`DisclosureTriangle`,
select→`combobox`). A decorative `<img alt="">` (role `none`, `ignored` ⇒ not in tree) is correctly skipped.

- **Critical bug the verifier caught:** `eval-page.js` coerced an empty CDP name `""`→`null`
  (`x.value || null`), and the detector only fires on empty-*string* — so it was **dead on real data**,
  with a green test masking it via `axName:''` fixtures real collection never produced. **Fixed**:
  `eval-page.js` now preserves `''` (empty resolved name) distinct from `null` (unresolved); all
  `axName` consumers gate on `trim().length>0`, so `''` behaves like `null` there (no behavior change for
  label-in-name). Re-verified end-to-end: an empty `<img>`/`<button>` now yields `axName:''` and the
  detector fires; a named/decorative element does not.
- **`option` removed** from the role set (an empty `<option>` placeholder/spacer is a routine non-barrier;
  axe has no per-option name rule) — verifier false-positive finding.

### 3. ~~`page-title-presence` deterministicSignal~~ — DROPPED  ✅ verifier: HAS_PROBLEM (redundant)
Initially added a shadow 2.4.2 signal for an empty `<title>`. The verifier showed it is **fully redundant**
with the axe `document-title` rule now surfaced in item #1 — same predicate, same SC, same shadow tier,
same input, *can never disagree* (not an independent cross-signal, just a second copy). **Removed.** The
axe checkerFinding is the canonical 2.4.2-presence source. (ACT nuance confirmed: 2779a5 presence-fails an
empty title; c4a8a4 deems it Inapplicable for descriptiveness — no conflict, and we route nothing to a
descriptiveness rubric.)

## Tests
`scripts/v3/tests/checker-findings.test.js`: expanded-surfacing (wholesale + per-rule + drop-unwanted),
best-practice map, incomplete review-tier, ax-name-presence (realistic `axName:''` fixtures incl. the
`option`/decorative/null-unresolved negatives). Full v3 suite **green**.

## Highest-value SOUND next items (verifier-prioritised; not yet done)
1. **Group-label/fieldset detector (F82/H71, 3.3.2)** + **required-cue ↔ aria-required parity** — pure
   detectors over already-collected DOM; a real hole axe does **not** cover (non-redundant).
2. **`page.on('dialog')` capture** in the collector/form-error-probe — native `alert()/confirm()`
   validation text is auto-dismissed today; unblocks 3.3.1/3.3.3 (SCR18) + 4.1.3. New signal, small.
3. **`document.ariaNotify` spy + live-region replacement observation** (4.1.3) — currently DOM-invisible.
4. **Cross-viewport content-delta probe (F102, 1.4.10)** — inventory at ~1280px, diff vs the existing
   320px render for content that vanishes; a complete blind spot today (instrument-heavier — do last).

Explicitly NOT recommended: ARIA-spec validity runner (surface axe instead — done), relational
link/iframe instruments (out of domain), promote-axe-to-authoritative (needs the full readiness gate),
1.4.6 (out of scope).
