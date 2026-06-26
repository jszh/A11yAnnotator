# Current false-barriers — full list with file names

24 deterministic false-barriers; **3 CLEARED by a micro-check** (✓) + **14 FIXED deterministically in the runner**, leaving **7** (the irreducibly-ambiguous + perceptual cases, mostly micro-check-handled). Each tagged by cause:
`DETECTION` = runner should catch it deterministically (fixable in the runner) · `MEASUREMENT` = deterministic
measurement gap · `AMBIGUOUS-EXEMPT` = true-vs-false exemption is adversarially ambiguous (unsafe to auto-clear) ·
`PERCEPTUAL` = "is there an adequate cue" judgment (unsafe to auto-clear).

## C4 — 1.4.11 non-text contrast (6)
- `eval/capability-tests/1.4.11/adjacent-color-subsumption-and-comparison-surface/case-16.html` — inverse-surface-trap — **FIXED (subject marked; fill vs adjacent passes)** (adjacent-surface sampling)
- `eval/capability-tests/1.4.11/adjacent-color-subsumption-and-comparison-surface/case-18.html` — fill-vs-track — **FIXED (nested fill-vs-track → abstain, sub-part)**
- `eval/capability-tests/1.4.11/boundary-is-only-cue-context-flip/case-19.html` — decorative-non-component — **AMBIGUOUS-EXEMPT** (decorative rule vs grouping rule)
- `eval/capability-tests/1.4.11/boundary-is-only-cue-context-flip/case-21.html` — essential-exemption (brand colour swatch) — **AMBIGUOUS-EXEMPT**
- `eval/capability-tests/1.4.11/exemption-boundaries-inactive-hover-essential-symbolic/case-23.html` — redundant-labeled-exempt — **AMBIGUOUS-EXEMPT**
- `eval/capability-tests/1.4.11/state-indicator-contrast-adjacent-surface/case-23.html` — tab-underline-clear-pass — **FIXED (::after pseudo-cue → abstain)**

## C6 — 1.4.10 reflow (5; 2 cleared)
- `eval/capability-tests/1.4.10/f102-content-disappears-no-equivalent/case-12.html` — nav-collapses-to-accessible-hamburger — **FIXED (ancestor aria-controls revealable)** (equivalent the runner didn't credit; micro-check not high-confidence here)
- ✓ `eval/capability-tests/1.4.10/f102-content-disappears-no-equivalent/case-13.html` — table-to-stacked-cards-same-data — **CLEARED** (equivalent-content-on-reflow)
- `eval/capability-tests/1.4.10/f102-content-disappears-no-equivalent/case-14.html` — progressive-disclosure-show-more — **FIXED (read-full/more link → equivalent)**
- ✓ `eval/capability-tests/1.4.10/f102-content-disappears-no-equivalent/case-22.html` — icon-label-swap-text-to-aria — **CLEARED** (equivalent-content-on-reflow)
- `eval/capability-tests/1.4.10/long-unbreakable-string-overflow-c33/case-22.html` — url-in-scroll-container-author-affordance — **FIXED (unbreakable-string scroller = C33 affordance)** (author scroll affordance)

## C5 — 3.3.x form binding (2)
- `eval/capability-tests/3.3.3/suggestion-reachability-proximity/case-13.html` — date-suggestion-proximate — **FIXED (count bound/live messages regardless of keywords)** (runner saw "no suggestion"; one is present)
- `eval/capability-tests/3.3.3/suggestion-reachability-proximity/case-18.html` — focus-moved-to-message — **FIXED (count bound/live messages)**

## C1 — 1.4.x / 4.1.2 interaction (9; 1 cleared)
- `eval/capability-tests/C1-state-color/inline-link-color-state/case-14.html` — underline-appears-on-hover-and-focus (G183) — **FIXED (runner now drives hover+focus, sees the underline)**
- `eval/capability-tests/C1-state-color/inline-link-color-state/case-19.html` — link-not-embedded-in-text-block — **PERCEPTUAL** (use-of-color applicability)
- ✓ `eval/capability-tests/C1-state-color/state-dependent-text-contrast/case-21.html` — disabled-state-exempt — **CLEARED** (essential/inactive exemption)
- `eval/capability-tests/C1-state-color/state-indicator-contrast/case-19.html` — essential-exemption — **AMBIGUOUS-EXEMPT**
- `eval/capability-tests/C1-state-color/ui-status-color-state/case-13.html` — color-plus-text-label-every-state — **PERCEPTUAL** (text-label cue the runner missed)
- `eval/capability-tests/C1-state-color/ui-status-color-state/case-20.html` — required-with-text-required-label — **PERCEPTUAL**
- `eval/capability-tests/C1-dynamic-nrv/dynamic-named-component-text-alt-stale/case-21.html` — media-icon-img-alt-updates — **FIXED (deterministic: readNRV now reads child img alt)** (the alt DOES update; runner missed it)
- `eval/capability-tests/C1-dynamic-nrv/stale-name-after-activation/case-14.html` — play-pause-aria-label-updates — **FIXED (deterministic: genuine name-update now beats the glyph fail)**
- `eval/capability-tests/C1-dynamic-nrv/value-not-settable-or-change-not-notified/case-15.html` — native-range-input — **FIXED (deterministic: native value-controls exposed by the platform)**

## C2 — 3.3.2 reveal-state (0)
- none.

## C8 — small signals (2)
- `eval/capability-tests/C8-signals/glyph-substitution/case-22.html` — pua-icon-aria-hidden-with-link-text — **FIXED (text excludes aria-hidden subtrees)** (container/link text should mark it decorative)
- `eval/capability-tests/C8-signals/long-description-presence/case-19.html` — longdesc-link-to-inpage-section — **FIXED (adjacent description-link → in-page section detected)** (the longdesc source isn't being resolved)

## Summary by cause (of the 18 remaining; 3 DETECTION ones were just fixed in the runner)
- **DETECTION** (8) — fixable in the deterministic runner (3 C1 dynamic-nrv ones now FIXED: native-range, play-pause, img-alt).
- **AMBIGUOUS-EXEMPT** (4) — unsafe to auto-clear (true vs false exemption look alike); leave as over-flag.
- **PERCEPTUAL** (4) — use-of-color cue judgment; unsafe to auto-clear via LLM.
- **MEASUREMENT** (2) — C4 adjacent-surface sampling; deterministic fix.
