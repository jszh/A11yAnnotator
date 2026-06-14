# Per-page evaluation agent — streamlined plan (v3: aligned with the fixed harness)

> **v3 (2026-06-14):** updated for the harness fixes in `scripts/lib/a11y-eval.js`,
> `eval-page.js`, `drive-page.js` (see `eval-results/HARNESS-ISSUES.md` and
> `eval-results/CHANGES.md`). Key behaviour changes: focus uses tri-state
> `focusIndicator.present` (T1/T8), keyboard uses `keyboardSignal` (T2), target-size
> uses `targetSize` (T3), contrast trusts the corrected threshold + `contrastReliable`
> (T4/T5/T11), and verdicts are calibrated to the evidence (PARTIAL when
> indeterminate). **Re-run requires regenerating collect/drive with the fixed scripts.**

You evaluate **one saved page**. You will be told its `--file`, `slug`, `index`,
and whether it is `noscript`. For **every** sampled element you must:
- run **all 10 skills** and record a sub-verdict for **every one of them, one by
  one** (never omit a skill — an element can fail several),
- check the element's **appearance** (read its screenshot), and
- check its **dynamic / interactive behavior** by actually exercising it (the
  driver does this for you — you read its output).

Two data sources are produced by two scripts, then you reason over both.

## 0. Read the skills (once)
Read `skills/README.md` and the 10 `skills/*.md`. Follow them exactly — verdict
scale, thresholds, WCAG SC + level, conformance-level cautions (2.4.10/2.4.13/
2.4.11 levels; missing-h1 = best-practice).

## 1. STATIC bundle — your own browser, ONE load (cached axe)
```
node scripts/eval-page.js --file "<FILE>" > eval-results/<slug>/collect.json
```
(If `collect.json` already exists and is valid, reuse it — skip this.) It returns
the **cached axe run**, page `structure`, `consentHidden` (cookie banners removed),
and per element: CDP `axRole`/`axName` (+ `mediaErrorName`/`axNameAuthorSupplied`),
`inTree`, attrs, `box`, computed `color`/`effBg`/`outline`/`fontPx`, exact
`contrastSolid`+`contrastThreshold` (WCAG-correct) + `contrastReliable`/
`needsPixelContrast` (+ `textInChildDiffColor`/`bgWalkCrossedOverlay`),
**`targetSize{passes,reason}`** (2.5.8 with exceptions), and flags
`isInteractive`/`isFormField`/`isImage`. **Reuse this for every element/skill. Never
re-run axe.** (Regenerate `collect.json`/`drive.json` with the fixed scripts before
re-evaluating — older bundles lack these fields and carry the old harness bugs.)

## 2. DYNAMIC bundle + appearance — your own browser, ONE load
```
mkdir -p eval-results/<slug>/shots
node scripts/drive-page.js --file "<FILE>" --shotdir eval-results/<slug>/shots > eval-results/<slug>/drive.json
```
This **actually exercises** the page (real keyboard, real clicks, VSR injected,
navigation suppressed so probes can't unload the page):
- `tabWalk` — a global REAL `Tab` walk: `stops[]` (xpath, outlineOrShadow,
  inViewport, speech), `trapDetected`, `offScreenStops`, `noOutlineStops`, `count`.
- `elements[]` — one record per sampled element with:
  - `appearanceShot` (elN.png, unfocused) and, for focusables, a keyboard-focused
    `focusIndicator.focusShot` (elN_focus.png).
  - `localTabWalk{positioned, targetIndexInFocusables, reachedByTab, stopsToReach,
    stops[]}` — a LOCAL real-keyboard walk that starts ~5 focusables before the
    target and tabs forward to REACH it (so every target, even deep ones, is
    reached by real keyboard — fixes the global-walk cap).
  - `focusIndicator{present, basis, forcedFocusVisibleDiffPct, focusedOutline,
    visibleDiffPct, computedOutline, computedBoxShadow, method, cropValidTab,
    baseBlankFrame, focusShot}` — **`present` is the verdict signal (true/false/null)**;
    it combines a forced `:focus-visible` read (CDP) with the tab diff, so it is
    reliable even when the tab screenshot lands on the wrong region (the old false
    "no ring" bug). `basis` says which signal decided it.
  - `srWalk{stops[]{xpath,speech,isTarget}, reachedBySR, targetSpeech}` — a LOCAL
    SR-cursor walk: land on the target, go back 5, then 15 forward — the SR reading
    order + what's voiced around the element. `targetSpeech` is the SR phrase AT it.
  - For interactive elements (Pass B): `keyboard{native|respondedToEnter,
    respondedToSpace, respondedToKeyboard}`, **`keyboardSignal{operable,confident,
    reason}`** (custom widgets — the verdict signal, roving-tabindex aware),
    `arrowKeys{respondsToArrows}` (composite widgets, REAL keys), `activate{clicked,
    navTo{href,newTab}, focusMoved, focusMovedTo,
    urlChanged, titleChanged, viewChanged, contextChange, expandedChanged,
    pressedChanged, dialogOpened, liveRegionChanged, liveMutations[],
    vsrAnnouncement, modal{focusMovedIntoDialog, closedByEscapeOrButton,
    focusReturnedToTrigger}}`, and `hover{tooltipAppearsOnHover,
    persistentWhileHovered, dismissibleByEsc}`.
- `forms[]` — page-level error-on-submit probe per `<form>`: `{fields, hasRequired,
  ariaInvalidSet, alertAppeared, errorTextGrew, errorAnnouncedLive,
  nativeValidationOnly}` after submitting invalid (3.3.1/3.3.3).
- `scriptsDisabled:true` on noscript pages — app click handlers can't fire (their
  JS blanks the snapshot, VERIFIED), so announcement/activation evidence is absent
  → those sub-verdicts are PARTIAL with that reason. Tab-walk, focus indicators,
  SR walk, and hover STILL work (CSS-driven) even there.

**Read the appearance shot for every element** (`eval-results/<slug>/shots/elN.png`,
matched by the interaction's `xpath`) — appearance feeds name-adequacy (does the
name match what's shown), contrast (is text legible), focus-visibility (is the
ring visible), and state visibility. Note when a shot is blank/zero-size.

## 3. Page-level skills (run ONCE, from the bundles)
- **page-structure**: title descriptive? heading tree empty/skipped/non-heading?
  (If `structure.headings` is empty but the page clearly has headings — JS-injected
  — recover with `verify-finding.js --file "<FILE>" --eval "return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map(h=>h.tagName+':'+h.textContent.trim().slice(0,40))"`.)
  Landmarks present (`hasMain`/`hasNav`)? Cross-ref axe `heading-order`/`empty-heading`/
  `page-has-heading-one`/`document-title`/`landmark-*`/`region`.
- **grouping-and-reading-order**: `structure.listStyleNone` > 0 → VoiceOver list
  strip. Cross-ref axe `list`/`listitem`/`landmark-unique`. Compare the
  `tabWalk` order / VSR `speech` sequence to the visual order for reading-order sanity.
- **reflow** (one follow-up): `verify-finding.js --file "<FILE>" --viewport 320x900
  --eval "return {sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, ratio:+(document.documentElement.scrollWidth/320).toFixed(2)}"`.
  ratio > ~1.05 ⇒ 1.4.10 overflow.

## 4. Per-element — record ALL 10 skills, one by one. For each sampled element:
Use collect (static), the matching drive `interactions[]` entry + the `tabWalk`
stop whose `xpath` matches (dynamic), and the appearance shot (vision).

1. **name-role-state** — `axName` adequacy vs the appearance shot + visible
   purpose. Empty/null name on interactive/image → 1.1.1/4.1.2; generic/ambiguous
   → 2.4.4. Cross-ref axe `link-name`/`button-name`/`image-alt`/`label-content-name-mismatch`.
   **T12:** if collect sets `mediaErrorName:true` / `axNameAuthorSupplied:false`, the
   name is the browser's offline media-fallback ("Unable to play media."), NOT
   author-supplied — do NOT judge the name on it → PARTIAL (note "offline media").
2. **color-and-visual-text** — `contrastThreshold` from collect is now WCAG-correct
   (18pt/14pt-bold) — trust it; do not re-derive large-text. Trust `contrastSolid`
   only when `contrastReliable:true`. **T5/T11:** when `contrastReliable:false` /
   `needsPixelContrast:true` (set on `textInChildDiffColor` or `bgWalkCrossedOverlay`
   — text in a differently-coloured child, or the bg walk crossed a card/overlay), the
   element-level ratio is UNRELIABLE → confirm with `verify-finding.js --xpath <xp>
   --pixel-contrast --shot c<n>.png` and read the crop. A **failing** reliable
   `contrastSolid` is still a CANDIDATE to confirm by pixel. Color-only (1.4.1, axe
   `link-in-text-block`) and text-in-image (1.4.5) from the shot.
3. **keyboard-operability** — native elements are operable by definition. For custom
   widgets use **`keyboardSignal{operable,confident,reason}`** (T2), NOT a raw
   `reachedByTab:false`. **`operable:false`** → 2.1.1 REPRODUCED; **`operable:true`** →
   operable; **`operable:null`** → PARTIAL (indeterminate — the offline snapshot only
   had synthetic/limited evidence; do NOT issue a confident 2.1.1). A non-active
   roving-tabindex item (`role=tab/menuitem/option/radio` with `tabindex=-1`) being
   unreachable by Tab is CORRECT design, not a defect — `arrowKeys.respondsToArrows`
   (now real keys) shows it operates. axe `focus-order-semantics`/`tabindex`.
4. **focus-management** — from `tabWalk`/`localTabWalk`: `trapDetected`, order vs
   DOM order, element reached but `inViewport:false` (2.4.11 obscured/off-screen).
   **2.1.2 is TRI-STATE (R2.5-D):** `trapDetected:true` = a trap candidate (the page
   interfered with Tab — `trapInterference` ∈ preventDefault / focus-frozen / focus-redirect
   / background-defocus); `false` = wraparound, not a trap; **`null` + `trapIndeterminate:true`**
   = a bounded cycle whose escape could NOT be positively demonstrated (focus confined in a
   dialog, or listeners possibly suppressed) → record **PARTIAL**, don't assert pass or fail.
   If `tabWalk.advisedExitHint` is set, a non-standard exit MAY satisfy 2.1.2 if adequately
   advised — record **PARTIAL** and verify the advisement.
   Modal (from `activate.modal`): `focusMovedIntoDialog` (focus enters the modal),
   `closedByEscapeOrButton`, and `focusReturnedToTrigger` (focus RETURN after close
   — false ⇒ 2.4.3 focus-order defect). Use `srWalk`/`tabWalk` order to compare
   reading vs focus vs visual order.
5. **focus-visibility** — **use `focusIndicator.present` (TRI-STATE), not the old
   `indicatorPresent` boolean or a raw `visibleDiffPct`** (T1/T8). The driver now
   forces `:focus-visible` via CDP and reads the outline + a fresh diff, so `present`
   is authoritative:
   - **`present:true`** → a real ring exists → 2.4.7 NOT REPRODUCED. (`basis` says how:
     `forced-focus-visible-diff`, `computed-while-focused-outline` — e.g. `outline:auto`
     is the UA ring —, or `tab-diff`.)
   - **`present:false`** → genuinely no ring even when focus-visible is forced (e.g.
     `:focus-visible{outline:none}`) → 2.4.7 REPRODUCED.
   - **`present:null`** → indeterminate (no valid crop AND no forced read possible) →
     **PARTIAL**. NEVER conclude "no ring" from `visibleDiffPct:0`, a wrong/blank crop
     (`cropValidTab:false` / `baseBlankFrame:true`), or a `computed-only`/unfocused
     outline read — the old harness produced false "no ring" exactly this way.
   - **`present` confidence depends on `basis` (M4).** `real-keyboard-diff` (real Tab
     pixels) is strongest; `forced-focus-visible`/`computed-while-focused-outline` are
     good but can't see JS-driven focus styles — when the basis is forced/computed-only,
     do the **visual shot-pair check** to corroborate, and prefer PARTIAL over a confident
     verdict if the shot is wrong-region/blank. Only override a `present:true` to a fail
     if you can see the change is an animation/caret/tooltip.
   - **R2-H4:** `present` now uses a **spatial** measure (`focusIndicator.spatial` —
     changed-region area + perimeter band, area-independent), so a thin ring on a large
     control is detected. Cite `focusIndicator.basis`/`spatial` as evidence.
   - **2.4.13 Focus Appearance (AAA)** is **captured as PROXIES, NOT enforced**:
     `focusIndicator.focusAppearance{enforced:false, proxyOnly:true, areaPx,
     thicknessProxyPx, maxSampledContrast, roughMeetsProxy}` — record it for
     completeness, but do not raise a 2.4.13 finding unless AAA is in scope. The fields
     are deliberately named as *proxies* (`thicknessProxyPx`, `maxSampledContrast`,
     `roughMeetsProxy`) — they are diagnostic only and do not establish AAA conformance.
6. **dynamic-announcement** — **C1: scope 4.1.3 to STATUS MESSAGES only.** A bare
   `expandedChanged`/`pressedChanged`/`aria-selected` change is **4.1.2** (state
   exposure), and `dialogOpened` is **focus-management/change-of-context** — NEITHER is
   a 4.1.3 failure; do not flag 4.1.3 for an un-voiced expand/toggle/dialog. 4.1.3
   applies only when the action emits a *status message* (success/result/progress/error
   that doesn't take focus). For an in-scope status: `liveRegionChanged`/`liveMutations`/
   `vsrAnnouncement` present ⇒ announced (NOT REPRODUCED); a visible status message with
   none ⇒ 4.1.3 REPRODUCED. See `skills/dynamic-announcement.md` step 6. **T9:**
   `vsrAnnouncement` is now noise-filtered — a value here is a REAL announcement; the
   `"document"` root artifact is gone (raw is in `vsrRaw` for reference, ignore it).
   `srWalk.targetSpeech` shows what the SR voices at the element (sticky/stale repeats
   filtered). On `scriptsDisabled` pages → PARTIAL ("noscript: snapshot can't
   hydrate"); still check the static live-region infrastructure (collect `liveRegions`).
7. **reflow-and-pointer-affordances** — inherit the page reflow verdict. **T3/R21-H3:
   target size — use collect's `targetSize{verdict,reason,…}` TRI-STATE, NOT a raw
   `box<24` rule.** `verdict:'pass'` → NOT a 2.5.8 defect (cite `reason`).
   `verdict:'needs-judgment'` (`requiresJudgment:true` — unproven inline / no neighbour
   geometry / non-rectangular shape `shapeUncertain`) → **PARTIAL** unless you can
   resolve it by eye (is it in a sentence? does a 24×24 square fit the shape?).
   `verdict:'fail'` → 2.5.8 REPRODUCED **only after** confirming none of the
   harness-unprovable exceptions apply — `checkExceptions:['equivalent','essential']`:
   is there an adequately-sized control elsewhere for the same function (Equivalent), or
   is the exact presentation Essential? If so → NOT REPRODUCED/N/A. Cross-ref axe
   `target-size`. `hover` → 1.4.13 three conditions: `dismissibleByEsc` (false ⇒ not
   Dismissible), `persistentWhileHovered` (false ⇒ not Persistent), `tooltipAppearsOnHover`.
8. **forms-instructions-errors** — when `isFormField`: real label (not just
   placeholder/title)? `required`/`aria-required`, `aria-describedby` target exists,
   `aria-invalid`. Missing label → 3.3.2/1.1.1; axe `label`/`aria-input-field-name`.
   **C2:** error identification (3.3.1) requires a **demonstrated** detected error with
   **no text identification by any means** — native HTML5 validation (the field's
   `validationMessage`, UA focus to the field) generally **meets** 3.3.1. Do NOT infer a
   3.3.1 failure from missing `aria-invalid`/alert/live-region alone. Use `drive.forms[]`:
   only `submitBlocked` AND no `validationMessage` AND no visible/announced text error ⇒
   3.3.1 REPRODUCED; a native message that's just not associated/announced ⇒ 3.3.3 /
   robustness note, not an automatic 3.3.1. No driven submit ⇒ PARTIAL, never definite.
   **T15:** ignore `forms[]` entries with `skipped:true` (0-field cookie/hidden/modal forms).
9. **page-structure** (per element) — is THIS element a mis-marked heading / empty
   heading / heading-level skip? Else `N/A (page-level, see pageSkills)`.
10. **grouping-and-reading-order** (per element) — is THIS element inside a
    list-semantics-stripped list, or out of reading order? Else `N/A (page-level)`.

## 5. Write results — emit RECORDS only; the builder derives + validates the rest
**R2-C1: you do NOT hand-write `summary`/`anyIssue`.** Write only per-element verdicts
+ `pageSkills` to `eval-results/<slug>/records.json`, then run the MANDATORY builder,
which derives every aggregate and HARD-GATES the output through the strict validator:
```
node scripts/tools/build-results.js eval-results/<slug>/records.json eval-results/<slug>/results.json eval-results/<slug>/collect.json eval-results/<slug>/drive.json
```
Both `collect.json` and `drive.json` are REQUIRED. The builder derives **provenance** from
the collector inventory, NOT from your records (a fabricated element can't validate; a
collected element can't be silently dropped — declare any un-evaluated one in
`records.skipped:[{xpath,reason}]`). It also binds every **definite behavioral verdict** to
the **driver's own evidence** in `drive.json` (`behavioralTrust`/`focusIndicator`/`forms`) —
NOT to any `trust`/`isolation` you write. If the driver shows no trusted+isolated probe for
that element/skill, a definite `REPRODUCED`/`NOT REPRODUCED` is rejected and you must use
`PARTIAL`. Native-keyboard presumption supports only “operable” (`NOT REPRODUCED`), never a
keyboard *failure*. If it exits non-zero it prints the contract violations — fix and re-run.
`results.json` only exists if it validated.

Every **NORMATIVE** issue verdict must carry a valid `sc` (and matching `level`). A
best-practice/AT-compat observation may instead carry a non-SC `rule` id (with
`bucket:"best-practice"`/`"at-compat"`) so it doesn't count as an SC failure — do NOT
invent a fake SC for it. EVERY verdict — including `N/A` and `NOT REPRODUCED` — must carry
a one-line `evidence`/reason, and page-level skills may never be `N/A` (they are inherently
applicable). A DEFINITE behavioral verdict (`REPRODUCED`/`NOT REPRODUCED` on keyboard/focus/
announcement/forms) must rest on a TRUSTED + ISOLATED probe AND **AGREE WITH THE DRIVER'S
OBSERVED OUTCOME** (R2.5-A) — the builder reads `drive.json` itself and REJECTS a verdict
that contradicts it: a "no focus ring" (2.4.7) when `focusIndicator.present:true`; a
keyboard "inoperable" (2.1.1) when a key response was observed; a status "not announced"
(4.1.3) when a meaningful `vsrAnnouncement` was captured; an "error not identified" (3.3.1)
when the FIELD'S OWN form set `nativeTextIdentification:true`. Where the driver did not
prove the claimed outcome (synthetic/non-isolated probe, no probe, or a contradiction) you
MUST use `PARTIAL`. Native-keyboard presumption supports only `NOT REPRODUCED` (operable),
never a keyboard failure. SKIPS: any collected element you don't evaluate goes in
`records.skipped:[{xpath,reason}]` with a SUBSTANTIVE reason; skips are capped at 25% of the
inventory and cannot coexist with a "0 failures" result when the collector's axe found
critical/serious violations.

`records.json` shape:
```json
{
  "file": "<FILE>", "slug": "<slug>", "noscript": <bool>,
  "pageSkills": {
    "page-structure": {"verdict","sc","level","evidence","bucket?"},
    "grouping-and-reading-order": {...},
    "reflow": {...}
  },
  "elements": [
    {
      "xpath": "...", "axRole": "...", "axName": "...",
      "appearanceShot": "eval-results/<slug>/shots/elN.png",
      "appearanceNote": "<one line: what the shot shows>",
      "skills": {
        "name-role-state":            {"verdict","sc","level","evidence"},
        "color-and-visual-text":      {"verdict","sc","level","evidence"},
        "keyboard-operability":       {"verdict","sc","level","evidence","trust","isolation"},
        "focus-management":           {"verdict","sc","level","evidence","trust","isolation"},
        "focus-visibility":           {"verdict","sc","level","evidence","trust","isolation"},
        "dynamic-announcement":       {"verdict","sc","level","evidence","trust","isolation"},
        "reflow-and-pointer-affordances": {"verdict","sc","level","evidence"},
        "forms-instructions-errors":  {"verdict","sc","level","evidence"},
        "page-structure":             {"verdict","evidence"},
        "grouping-and-reading-order": {"verdict","evidence"}
      },
      // dynamic skills (keyboard/focus/announcement): `trust`/`isolation` are OPTIONAL
      // but a DEFINITE verdict resting on synthetic/shared evidence is rejected — use
      // PARTIAL. best-practice/at-compat verdicts may carry `rule` instead of `sc`.
      "anyIssue": <bool>
      "notFound": <bool, optional — set when the driver could not locate the element>
    }
    // ... one object PER sampled element; skills{} ALWAYS has all 10 keys.
  ]
  // NO "summary" — the builder derives elements/elementsWithIssue/bySkill/pageBySkill/
  // normativeFailures/issues (element + page-level, deduped) and writes them.
}
```
- `verdict` ∈ `REPRODUCED` | `PARTIAL` | `NOT REPRODUCED` | `N/A`. Every skill key
  must be present for every element; use `N/A` **with a one-line reason** when the
  skill doesn't apply (e.g. forms on a non-field). PARTIAL must say what couldn't
  be exercised.
- `eval-results/<slug>/notes.md`: PROBLEMS only — collector/driver errors,
  not-found xpaths, blank shots, snapshot-fidelity gaps, server/timeout issues,
  ambiguities. Short bullets.

## Rules
- **Read-only** except inside `eval-results/<slug>/`.
- Tools: `eval-page.js`, `drive-page.js`, `verify-finding.js`, `/ax-node`, and your
  vision (Read the shots). Two browser loads per page (collect + drive) plus a few
  targeted `verify-finding.js` follow-ups — don't launch browsers you don't need.
- **Calibrate confidence to the evidence (do NOT force a definite verdict).** Prefer
  a definite REPRODUCED / NOT REPRODUCED when the driver gives a determinate signal,
  but record **PARTIAL whenever the signal is explicitly indeterminate**:
  `focusIndicator.present:null`, `keyboardSignal.operable:null`, `appearanceOffScreen`,
  `baseBlankFrame:true`, `mediaErrorName:true`, `notFound`, `scriptsDisabled`. A
  confident verdict on indeterminate evidence is the #1 error mode found in the audit
  — roughly **10–15%** of presumed issues are contradicted or unconfirmable, not ~5%.
- **T6: never assert a definite DYNAMIC verdict (keyboard/focus/announcement) on a
  `notFound` element** — the driver couldn't exercise it → PARTIAL. (A static
  name/contrast verdict from collect is still fine if collect resolved it.)
- **R21-H4: calibrate behavioral confidence to the PROBE'S TRUST.** Every behavioral
  probe records how it was driven. A definite REPRODUCED / NOT REPRODUCED requires
  **trusted** input; if the verdict rests on a SYNTHETIC fallback or a non-isolated
  probe, record **PARTIAL** with the reason. Specifically: `activate.synthetic:true`
  (or `clickMethod` ≠ `trusted`), `forms[].submitMethod` ∈ {`synthetic-fallback`,
  `requestSubmit`}, or `keyboard.method` not `trusted-keys` ⇒ the activation /
  error-identification / keyboard verdict it feeds is **PARTIAL**, not definite.
- **T16: real failures OUTSIDE the sampled set** that axe flags (e.g. unnamed ad
  links, invalid widget ARIA) → report as a **separate count in `notes.md`**, clearly
  labelled "unsampled," so the tallies don't silently undercount.
- Treat `tabWalk.trapDetected`/`budgetExceeded` and `forms[].skipped` as harness
  bookkeeping, not page findings.
- **M2 consent is a SEPARATE STATE, not just bookkeeping.** `consentHidden.consentState`
  inventories the cookie/consent overlay BEFORE it was neutralised, **VISIBLE-only**:
  `visibleControls`, `unlabelledVisibleControls`, `visibleHeadings`, `hasDialogRole`, and
  a `basis` note. Hidden/non-focusable controls are excluded (they are not user-facing),
  and a container matching multiple selectors is counted once. If a consent overlay is
  present, evaluate IT too — but the inventory is STATIC/visible-only: it does NOT prove
  the overlay's keyboard reachability or focus trap, so consent findings (e.g.
  `unlabelledVisibleControls` → 4.1.2, its own trap, heading order) are **PARTIAL** until
  exercised live. Don't silently drop them, and don't raise them as definite from the
  inventory alone.
- Final message: 4–6 lines (counts by verdict, standout issues, problems). The
  files are the real output.
