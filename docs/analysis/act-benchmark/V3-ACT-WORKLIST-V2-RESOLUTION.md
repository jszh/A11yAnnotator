# Builder worklist v2 — resolution

Companion to [V3-ACT-WORKLIST-V2.md](./V3-ACT-WORKLIST-V2.md). Records how each draft-only ACT signal was
acted on. Guiding principle: **fix the false barriers deterministically; for cases that are not
deterministically tractable (or where a hand-rolled deterministic check would be unsound on a draft rule),
capture the root cause in the rubric/skill.** The v2 list is explicitly *pipeline-polishing signal, not an
authoritative benchmark* (draft rules, unstable `expected`), so nothing here hard-codes a draft verdict.

All changes are **non-authoritative** (the AUTHORITY registry stays empty; runner outcomes land in
`shadowObs`, rubric verdicts ride the LLM lane). No corpus run was triggered; the LLM/instrument/checker
lanes remain env-gated and inert.

Verification: full v3 suite **356 pass / 0 fail / 0 todo** (was 352 — added the 4 B6 guards below).

---

## B. V3 false barriers — ELIMINATED (both deterministic)

### B-1 · `afw4f7` Passed Example 7 — `1.4.3` `<button style="color:#666;background:#000" aria-label="Close">X</button>`
- **Why ACT passes it:** the lone visible "X" "does not express anything in human language" — it is a
  decorative close *icon*, and the button's accessible name comes from `aria-label="Close"`. The glyph
  carries no contrast requirement (the same human-language exemption as Passed Example 6's pure symbols).
- **Root cause in v3:** the non-language exemption used `/[\p{L}\p{N}]/u` — "X" is a letter, so
  `notExemptText` stayed `true` and the genuine 3.66:1 ratio flagged a barrier.
- **Fix** ([exp-runners.js](../../../scripts/v3/lib/exp-runners.js) `measureContrast`): a `singleCharIcon`
  exemption — a **length-1 letter** whose accessible name is supplied **separately** (`aria-label` /
  `aria-labelledby`) and does **not contain** the glyph is treated as a decorative icon ⇒
  `notExemptText:false`. `BARRIER_OBSERVED` requires `notExemptText` (catalog.js:49) ⇒ no barrier.
- **Guarded against over-exemption** (B6 correct-guards): a single letter that *is* the content (an A–Z
  index link, no overriding name), a glyph whose `aria-label` equals the glyph, and any multi-character
  worded button all stay checked (`notExemptText:true`).
- **Verified:** probed the real ACT file — runner emits `thresholdFailed:true, notExemptText:false`;
  screenshot confirms a faint grey "X" on black (genuinely ~3.66:1), so the exemption is the right call,
  not a mis-measurement.

### B-2 · `36b590` Passed Example 1 — `3.3.1` number field pre-set to an invalid value with a referenced static error
- **Why ACT passes it:** `<input type="number" value="0" aria-describedby="error">` plus a visible
  `<span id="error">Invalid value for age…</span>` — the error **is** identified (statically, associated).
- **Root cause in v3:** the form-error probe credits only error surfaces that *change* after submit (a
  before/after diff, to stop a persistent cart status from masking a barrier). A pre-existing, unchanged,
  field-referenced error message was skipped ⇒ `errorNotIdentified:true` ⇒ false barrier.
- **Fix** ([exp-runners.js](../../../scripts/v3/lib/exp-runners.js) `probeFormError`): in the after-loop, an
  **unchanged** surface the field itself **references** (`aria-describedby`/`aria-errormessage`) and that is
  **error-styled by markup** (role/class/data/id) now counts as static identification.
- **Guarded against false clear** (B6 correct-guard): an unchanged, **unreferenced** surface, and a
  referenced **plain hint** (not error-styled), are NOT credited — a real barrier is still flagged.

**New regression guards:** [regression-wcag-method.test.js](../../../scripts/v3/tests/regression-wcag-method.test.js)
§B6 (4 tests) over fixtures `b6-contrast-icon-glyph.html` and `b6-error-static-referenced.html`.

---

## A. BOTH-FAIL — root-cause capture

| rule | SC | ACT rule name | disposition |
|---|---|---|---|
| `b49b2e` | 2.4.6 | Heading is descriptive | **rubric** → heading-descriptive-v0 |
| `5effbb` | 2.4.4 | Link in context is descriptive | **rubric** → link-purpose-v0 |
| `fd3a94` | 2.4.4 | Links w/ identical names serve equivalent purpose | **rubric** → link-purpose-v0 |
| `d0f69e` | 1.3.1 | Table header cell has assigned cells | **rubric** → info-relationships-v0 |
| `047fe0` | 2.4.10/H69 | Document has heading for non-repeated content | **rubric** → info-relationships-v0 (Ex1) |
| `e88epe` | 1.1.1 | Image not in a11y tree is decorative | **rubric** → alt-text-adequacy-v0 (+ residual) |
| `cc0f0a` | 2.4.6 | Form field label is descriptive | **rubric** captures cause (+ enumeration residual) |
| `kb1m8s` | 1.3.1/4.1.2 | ARIA global properties used where prohibited | **residual** (axe-incomplete) |
| `4b1c6c` | 4.1.2 | Iframes w/ identical names equivalent purpose | **residual** (cross-element) |
| `80af7b` | 2.1.2 | Focusable element has no keyboard trap | **instrument** → self-refocus trap detector (Failed Ex1-2) |

### Rubric updates (each lands on an already-enumerated subject; non-authoritative)

- **heading-descriptive-v0** — added the **specific-but-mismatched** failure mode: a heading that reads as a
  clear topic in isolation but does not describe the content it labels (e.g. "Weather" over opening hours,
  `b49b2e`). Descriptiveness is judged relative to the introduced content; PARTIAL if the viewport doesn't
  show enough of it.
- **link-purpose-v0** — reinforced **generic-in-context** ("More"/"details" whose context restates the
  topic but never names the destination, `5effbb`) and the **identical-names / different-purpose** mode
  (two "contact us" links to different pages, `fd3a94`), with an explicit evidence cue (sibling links +
  destinations) and a PARTIAL guard when sibling destinations aren't visible. Notes it applies to
  `role=link` as to `<a>`.
- **info-relationships-v0** — added **broken table header association** (a header column/row with no data
  cell it governs, `d0f69e`) and made the **visual-heading-not-marked** pattern explicit (a styled
  `<strong>`/`<div>` standing in for a heading — covers `047fe0` Failed Example 1's `<strong
  style="font-size:18pt">`). PARTIAL if the grid isn't fully visible.
- **alt-text-adequacy-v0** — added **decoratively-MARKED but meaningful**: a logo/diagram/content photo
  removed from the a11y tree by empty `alt=""` / `role=presentation` / `aria-hidden` is a barrier
  (`e88epe`). The call hinges on the rendered pixels actually conveying content. *Forward coverage* — see
  the enumeration residual below.

**Adversarial verification** (render → screenshot → judge against the updated rubric, CLAUDE.md discipline):
8 synthetic cases (each new failure mode + a matched control) judged **8/8** correctly; vision agrees with
the rubric (the screenshot confirms the visual condition each rubric relies on). Fixture: `/tmp/rubric-verify.html`.

### Instrument — `80af7b` keyboard self-refocus trap (2.1.2), NEW detector

The failing cases are a **lone** focusable that re-grabs its **own** focus on blur
(`onblur="setTimeout(() => this.focus(), 10)"`). Neither existing detector sees it: the per-component runner
*and* the instrument's `detectKeyboardTraps` are **region-anchored** (modal/dialog `TRAP_REGION_SEL`) — with
no region there is nothing to anchor, and their escape probe reads focus **synchronously, before** the async
refocus fires.

New instrument [`detectFocusRetentionTraps`](../../../scripts/v3/lib/kbd-graph.js) (wired into
[run-instruments.js](../../../scripts/v3/lib/run-instruments.js) as `keyboard-trap-self-refocus`, sc 2.1.2,
non-authoritative). It does a **settled** forward Tab-walk to surface elements that retain focus, then
confirms each: an element X is a trap iff — with ≥2 focusables on the page — focusing X and pressing **Tab
and Shift+Tab** *both* return focus to **X itself** after settling past the async refocus, and focus left X
synchronously at least once (proving an *active* refocus, not a single-focusable wrap).

**Empirical design + adversarial verification** (drive the real pages, observe focus, CLAUDE.md discipline):
- Validated against **all 16 `80af7b` examples**: **0 false positives** on every passed (7) + inapplicable
  (4); **catches** Failed Examples 1 & 2 (the self-refocus traps). Failed 3-5 (mutual bounce) are the
  unsound-to-separate boundary documented in Residuals.
- **0 false positives** across the v3 adversarial fixtures (modal trap, role-less trap, positive-tabindex,
  fixed-nav, 80-focusable deep page) **and** the full `fx-trap-*` / `fx-modal-*` corpus (13 fixtures,
  including the `fx-trap-defocus-fp` false-positive guard) — none of which are *same-element* refocus traps.
- End-to-end: `runInstruments` emits the `keyboard-trap-self-refocus` finding on the trap fixture.
- Pinned by `kbd-graph.test.js` (catch + a correct-guard over `fx-v3-self-refocus-trap.html` /
  `fx-v3-self-refocus-ok.html`, the latter including the Passed-Example-7 sibling-progression bounce).

---

## Residuals — root-caused, deliberately not implemented now

These are documented rather than coded because a hand-rolled deterministic check would be unsound on an
*unstable draft rule*, or the fix needs collector/instrument plumbing that is out of this change's scope.

- **`d0f69e` (th-no-cells) & `kb1m8s` (prohibited-aria) — axe abstains, not silent.** axe-core returns
  these as **`incomplete`** (needs-review), not violations — and v3 collects only axe *violations*
  (`collect.axe`), so the review signal is dropped. The role=`grid` case (`1a0ee1b5`) and `aria-braillelabel`
  (`1345bf06`) axe is fully silent on. **Sound fix:** collect axe `incomplete` (a separate
  `collect.axeIncomplete`) and surface it as **review-tier** checker findings (`review:true`,
  `calibrated:false`) — a non-authoritative cross-signal, *zero* false-clear risk. Hand-rolling table-cell
  association / the ARIA prohibition matrix in v3 is rejected: axe abstains *for soundness reasons* and the
  expected outcomes are draft-unstable, so a hard check would risk false barriers. (The structural causes
  are also mirrored into info-relationships-v0 so the LLM lane can engage them.)
- **`80af7b` mutual-bounce variants (Failed Examples 3-5).** A pair of controls whose `onblur` hands focus
  to the *other* (`moveFocusToButton`), so focus hops btn1↔btn2. These are **NOT soundly separable** from the
  rule's own PASSED bounce examples: Passed Example 7 (`nextElementSibling`/`previousElementSibling`, no
  escape) and our `fx-trap-redirect` fixture (focusout-redirect, no escape) are *behaviourally identical*
  2-element cycles, yet one is labelled pass and the others trap. Any cycle-based detector would
  false-positive Passed Example 7, so the instrument deliberately leaves the bounce class to the
  collection-time `drive-page.js` `tabWalk` / the annotation lane. (The self-refocus *same-element* variant
  IS now caught — see the Instrument section above.)
- **`e88epe` enumeration.** The sampler ([sample-elements.js](../../../scripts/sample-elements.js)) **by design**
  skips `role=presentation`/`none` and hidden elements — exactly the tree-excluded images this rule is
  about — and the ACT mirror's `w3c-logo.png` 404s under `file://` (blank crop ⇒ rubric PARTIAL regardless).
  Catching it end-to-end needs a *targeted* decorative/hidden-image sampling path (emit such `<img>` with a
  `decorativeMarked` flag) + an oracle branch enumerating a 1.1.1 "verify-decorative" obligation + non-404
  assets. Not worth broadening corpus-wide sampling for 5 unverifiable draft cases; the rubric already owns
  the judgment for when such an image reaches it.
- **`cc0f0a` (form-field label descriptive, 2.4.6).** 2.4.6 descriptiveness is not enumerated for form-field
  *labels* (form fields enumerate 3.3.2 `field-label` + error families). heading-descriptive-v0 already
  judges *form labels*, so the root cause is captured there; wiring a 2.4.6 obligation onto labelled fields
  **and** feeding the rubric the field's type/`name` cue (the viewport alone can't show that "Menu"
  mislabels a `name="fname"` input) is the follow-up. Not folded into field-label-v0 (that would mis-attribute
  a 2.4.6 issue to SC 3.3.2).
- **`4b1c6c` (iframes, identical names / equivalent purpose, 4.1.2)** and **`047fe0` Failed Example 2**
  (an off-screen but programmatically-present `<h1>`) — cross-element / genuinely-ambiguous draft cases, left
  to the annotation lane.

---

## Files touched

- [scripts/v3/lib/exp-runners.js](../../../scripts/v3/lib/exp-runners.js) — `singleCharIcon` (1.4.3) +
  static-referenced-error credit (3.3.1).
- [scripts/v3/llm-rubrics/heading-descriptive-v0.md](../../../scripts/v3/llm-rubrics/heading-descriptive-v0.md),
  [link-purpose-v0.md](../../../scripts/v3/llm-rubrics/link-purpose-v0.md),
  [info-relationships-v0.md](../../../scripts/v3/llm-rubrics/info-relationships-v0.md),
  [alt-text-adequacy-v0.md](../../../scripts/v3/llm-rubrics/alt-text-adequacy-v0.md) — root-cause failure modes.
- [scripts/v3/tests/regression-wcag-method.test.js](../../../scripts/v3/tests/regression-wcag-method.test.js)
  §B6 + fixtures `b6-contrast-icon-glyph.html`, `b6-error-static-referenced.html`.
- [scripts/v3/lib/kbd-graph.js](../../../scripts/v3/lib/kbd-graph.js) `detectFocusRetentionTraps` +
  [run-instruments.js](../../../scripts/v3/lib/run-instruments.js) wiring (`keyboard-trap-self-refocus`, 2.1.2);
  [kbd-graph.test.js](../../../scripts/v3/tests/kbd-graph.test.js) + fixtures
  `assets/saved/fx-v3-self-refocus-trap.html`, `fx-v3-self-refocus-ok.html`.

To re-score against the ACT scorer (overwrites the curated `upstream-evidence/v3-act-subset-proposed/*`):
`node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --proposed --rule=afw4f7 --max-auto=10 --element-cap=60`
(swap `--rule` for `36b590`; restore with `--proposed --limit=0` + `build-worklist-proposed.js`).
