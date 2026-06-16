# Per-page evaluation agent — streamlined plan (v2: appearance + dynamic + full reporting)

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
the **cached axe run**, page `structure`, and per element: CDP `axRole`/`axName`,
`inTree`, attrs, `box`, computed `color`/`effBg`/`outline`/`fontPx`, exact
`contrastSolid`+`contrastThreshold`, and flags `isInteractive`/`isFormField`/
`isImage`/`needsPixelContrast`. **Reuse this for every element/skill. Never re-run axe.**

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
  - `focusIndicator{visibleDiffPct, indicatorPresent, computedOutline,
    computedBoxShadow, method, focusShot}` — `method:"real-tab-diff"` = visual diff
    of unfocused vs. real-keyboard-focused crop (authoritative); `"computed-only"` =
    couldn't diff (off-screen) so based on computed outline/shadow.
  - `srWalk{stops[]{xpath,speech,isTarget}, reachedBySR, targetSpeech}` — a LOCAL
    SR-cursor walk: land on the target, go back 5, then 15 forward — the SR reading
    order + what's voiced around the element. `targetSpeech` is the SR phrase AT it.
  - For interactive elements (Pass B): `keyboard{native|respondedToEnter,
    respondedToSpace, respondedToKeyboard}`, `arrowKeys{respondsToArrows}` (composite
    widgets), `activate{clicked, navTo{href,newTab}, focusMoved, focusMovedTo,
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
2. **color-and-visual-text** — passing `contrastSolid` is trusted; a **failing**
   `contrastSolid` is a CANDIDATE → confirm with `verify-finding.js --xpath <xp>
   --pixel-contrast --shot c<n>.png` + read the crop (collector reads element-level
   color, which differs when text is in a child). `needsPixelContrast` → pixel-contrast.
   Color-only (1.4.1, axe `link-in-text-block`) and text-in-image (1.4.5) from the shot.
3. **keyboard-operability** — `localTabWalk.reachedByTab` (did real keyboard reach
   it). If `isInteractive` but `reachedByTab:false` AND not in `tabWalk.stops` →
   2.1.1 candidate. For custom widgets, `keyboard.respondedToKeyboard`
   (Enter/Space) and `arrowKeys.respondsToArrows` show operability; native elements
   are operable by definition. axe `focus-order-semantics`/`tabindex`.
4. **focus-management** — from `tabWalk`/`localTabWalk`: `trapDetected`, order vs
   DOM order, element reached but `inViewport:false` (2.4.11 obscured/off-screen).
   Modal (from `activate.modal`): `focusMovedIntoDialog` (focus enters the modal),
   `closedByEscapeOrButton`, and `focusReturnedToTrigger` (focus RETURN after close
   — false ⇒ 2.4.3 focus-order defect). Use `srWalk`/`tabWalk` order to compare
   reading vs focus vs visual order.
5. **focus-visibility** — use the element's `focusIndicator{visibleDiffPct,
   indicatorPresent, computedOutline, computedBoxShadow, method, focusShot}` from
   drive.json, corroborated by the `tabWalk` stop.
   - **ALWAYS do a VISUAL check** — Read the pair `shots/elN.png` (unfocused) and
     `shots/elN_focus.png` (keyboard-focused) and look for a real focus indicator.
   - For a focus-diff **POSITIVE** (`indicatorPresent:true`) you MUST confirm by eye
     that the pixel change is a genuine, adequate focus ring/outline — NOT an
     animation, caret, hover tooltip, or layout shift. If the change isn't a real
     indicator, override to a fail with the screenshot as evidence.
   - `indicatorPresent:false` under real keyboard focus ⇒ 2.4.7 REPRODUCED; confirm
     on the shot pair (the two look identical). `method:"computed-only"` means the
     element was off-screen for the diff — lean on the shots + computed outline.
   - Judge adequacy against 2.4.7 (some indicator, AA) vs the stronger 2.4.13
     (Focus Appearance, AAA — size/contrast). If never reached in the walk AND not
     diffable, say so → PARTIAL.
6. **dynamic-announcement** — from `activate`: `liveRegionChanged`/`liveMutations`/
   `vsrAnnouncement` present ⇒ the change IS announced (NOT REPRODUCED as a defect,
   record it); a state change with NO announcement (`expandedChanged`/`pressedChanged`
   or `dialogOpened` but no live/announcement) ⇒ 4.1.3 candidate. `srWalk.targetSpeech`
   shows what the SR actually voices at the element. On `scriptsDisabled` pages →
   PARTIAL (app handlers can't fire — note "noscript: snapshot can't hydrate"); still
   check the static live-region infrastructure (collect `liveRegions`).
7. **reflow-and-pointer-affordances** — inherit the page reflow verdict; per element
   target size (`box.w`/`box.h` < 24 → 2.5.8, axe `target-size`); `hover` → 1.4.13
   three conditions: `dismissibleByEsc` (false ⇒ not Dismissible),
   `persistentWhileHovered` (false ⇒ not Persistent), `tooltipAppearsOnHover`.
8. **forms-instructions-errors** — when `isFormField`: real label (not just
   placeholder/title)? `required`/`aria-required`, `aria-describedby` target exists,
   `aria-invalid`. Missing label → 3.3.2/1.1.1; axe `label`/`aria-input-field-name`.
   Use page-level `drive.forms[]` for error identification on invalid submit:
   `ariaInvalidSet`/`alertAppeared`/`errorAnnouncedLive` false + `nativeValidationOnly`
   ⇒ 3.3.1 (errors not programmatically identified) / 3.3.3 (no suggestion) candidate.
9. **page-structure** (per element) — is THIS element a mis-marked heading / empty
   heading / heading-level skip? Else `N/A (page-level, see pageSkills)`.
10. **grouping-and-reading-order** (per element) — is THIS element inside a
    list-semantics-stripped list, or out of reading order? Else `N/A (page-level)`.

## 5. Write results — every skill recorded explicitly, then a filtered summary
`eval-results/<slug>/results.json`:
```json
{
  "file": "<FILE>", "slug": "<slug>", "noscript": <bool>,
  "pageSkills": {
    "page-structure": {"verdict","sc","level","evidence"},
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
        "keyboard-operability":       {"verdict","sc","level","evidence"},
        "focus-management":           {"verdict","sc","level","evidence"},
        "focus-visibility":           {"verdict","sc","level","evidence"},
        "dynamic-announcement":       {"verdict","sc","level","evidence"},
        "reflow-and-pointer-affordances": {"verdict","sc","level","evidence"},
        "forms-instructions-errors":  {"verdict","sc","level","evidence"},
        "page-structure":             {"verdict","evidence"},
        "grouping-and-reading-order": {"verdict","evidence"}
      },
      "anyIssue": <bool>
    }
    // ... one object PER sampled element; skills{} ALWAYS has all 10 keys.
  ],
  "summary": {
    "elements": N, "elementsWithIssue": M,
    "bySkill": { "<skill>": {"reproduced":x,"partial":y,"notReproduced":z,"na":w}, ... all 10 ... },
    "issues": [
      // ONLY REPRODUCED + PARTIAL — the actionable list, deduped page-level once
      {"xpath","skill","verdict","sc","level","evidence"}
    ]
  }
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
- Behavioral skills now have a REAL driver: prefer a definite REPRODUCED / NOT
  REPRODUCED from `drive.json` over PARTIAL. Reserve PARTIAL for what the driver
  genuinely couldn't reach (off-screen-never-tabbed elements, `scriptsDisabled`
  announcement checks on noscript pages). ~5% of presumed issues are contradicted
  by evidence → record NOT REPRODUCED with the proof.
- Final message: 4–6 lines (counts by verdict, standout issues, problems). The
  files are the real output.
