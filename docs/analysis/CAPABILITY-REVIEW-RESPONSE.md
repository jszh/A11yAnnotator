# Capability Review — Response & Disposition

**Date:** 2026-06-17
**Responds to:** [`CAPABILITY-REVIEW.md`](CAPABILITY-REVIEW.md) (62 findings across the 12 CDP tools + arch)
**Method:** every high-impact finding was **independently re-verified against the live code BEFORE any fix**
(9 verifiers, live CDP probes), the genuine ones were fixed, then **all fixes were adversarially examined**
(6 verifiers — formulas validated against reference data, the SSRF fix proven with a two-origin probe).
**Commits:** [`859b1ac`](#) (revisions) · [`eb129c0`](#) (adversarial-pass residual)
**Status:** v3 suite **417/417**, foundation **190/190**. Soundness rails preserved (objective-return,
mutating-on-clone, shadow-capped).

> **Reading this doc (auditor):** the **Disposition** column is the verdict of independent re-verification —
> NOT the review's claim taken on faith. Where it says REFUTED / OVER-RATED, the review was wrong and no
> code changed. Where it says FIXED, the **Adversarial** column records whether breaking it succeeded.

---

## 1. Headline: the review was right about most things, and wrong about three

Re-verification **confirmed ~30 findings** and **corrected the review on three** — caught precisely because
findings were checked against the code rather than trusted:

| Review claim | Severity claimed | Re-verified verdict |
|---|---|---|
| `request_hi_res_crop` captures a blank region below the fold | **CRITICAL** | **REFUTED** — it already pins the viewport AND `scrollIntoView`-centers the target; the clip is correct. No change. |
| `set_state` hover: the after-frame **cursor sprite** forces `pixelsChanged:true` | **HIGH** | **PREMISE WRONG** — headless Chrome renders no cursor in screenshots. Applied the *real* improvement instead (park the pointer to (10000,10000) before the baseline frame ⇒ hover is genuinely fail-closed). |
| `verify-finding.js:53,162` mirror the contrast-rounding bug | medium | **OVER-FLAGGED** — those `contrast`/`cr` results are **display-only diagnostics** (no threshold gate), and the file is a standalone dev script not in the pipeline/tests. Left unchanged. |

Of the original 2 criticals, **one was real** (`observe_state` visibilityCause) and **one was refuted**.

---

## 2. Disposition — confirmed findings (FIXED)

All FIXED in `859b1ac` unless noted. **Adversarial** = result of Phase-3 attempt to break the fix.

### `observe_state_after_activation` — the real critical
| Finding | Disp. | Fix | Adversarial |
|---|---|---|---|
| `visibilityCause` absent — the tool's whole purpose (critical) | CONFIRMED | Before-DOM node tagging (`data-v3-pre`/`-pv`) ⇒ classify each newly-visible text as `inserted\|display\|visibility\|aria-hidden\|text-changed` | **HOLDS** — inserted/toggled/text-changed all classify correctly; tagging is on the throwaway clone |
| `anyNewTextInLiveRegion` false-positive when region injected with its message (med) | CONFIRMED | `liveRegionPreExisted` gate; split into `anyNewTextInLiveRegion` (pre-existing ⇒ clean 4.1.3) vs `anyNewTextInNewLiveRegion` (created ⇒ INCONCLUSIVE) | **HOLDS** — injected-with-message ⇒ `false`/`true`; pre-existing ⇒ `true`/`false` |
| `[aria-live]` matches `aria-live="off"`; omits `alertdialog` (med) | CONFIRMED | Selector → `polite\|assertive\|status\|alert\|log\|alertdialog\|output` | HOLDS |
| visibility test ignores ancestor `display:none` (med) | CONFIRMED | `el.checkVisibility({checkVisibilityCSS,checkOpacity})` | HOLDS |
| `focusMovedToChange` absent (med) | CONFIRMED | added (focus landed inside revealed content) | HOLDS |
| no perceivable/safe gate (med) | CONFIRMED | perceivability gate (refuse hidden/zero-size target). *isSafe is partial — see Deferred* | HOLDS |

### `query_ax_node`
| Finding | Disp. | Fix | Adversarial |
|---|---|---|---|
| `nameFrom` fabricated — emits all candidate slots (high) | CONFIRMED | filter to non-superseded sources with a present value | HOLDS |
| `requiredStatesMissing` never computed; synthesized default reported present (high) | CONFIRMED | read live `aria-*`; per-role ARIA set for an **explicit** widget; native/option/tab exempt | **1 residual** (native + redundant role false-positive) → fixed `eb129c0` + test |
| `isAriaHidden` misses `ariaHiddenSubtree` (med) | CONFIRMED | include both reasons | HOLDS |
| coord path drops IDREF, returns `null` (med) | CONFIRMED | returns `'unresolved-on-coordinate-path'` | HOLDS |
| dead `resolveNode` (low) + dead `resolveXpath` export (low) | CONFIRMED | removed both | HOLDS |

### WCAG-correctness
| Finding | Disp. | Fix | Adversarial |
|---|---|---|---|
| `compute_contrast_ratio.passes` on the **rounded** ratio (high/wcag) | CONFIRMED | added `a11y-eval.contrastRatioRaw`; `passes` on unrounded; display stays 2-dp | **HOLDS** — 2.998 ⇒ `passes:false`, display `3.00`; foundation `contrastRatio` byte-unchanged |
| `compare_named_regions` uses CIE76 where F13 mandates ΔE2000 (high) | CONFIRMED | implemented **CIEDE2000** | **HOLDS** — validated vs the Sharma et al. reference pairs |
| `resolve_part_color` diffs vs `cs.color` not the part's property (high) | CONFIRMED | diff vs the **best-matching** used-colour; surface `sourceProperty` | **HOLDS** — purple-border false-flag gone; false-clear still caught |

### Concurrency & security
| Finding | Disp. | Fix | Adversarial |
|---|---|---|---|
| `resolve_destination` SSRF: guard runs AFTER the foreign GET (high/security) | CONFIRMED | `setRequestInterception` aborts foreign-origin **pre-flight** | **HOLDS** — proven with a two-origin probe (foreign origin gets 0 bytes) |
| `ocr_image_text` + `compare_named_regions` `scrollIntoView` the SHARED page (high) | CONFIRMED | document-relative clip + `captureBeyondViewport`; no scroll | **HOLDS** — shared `scrollY` unchanged; below-fold still captured |
| tool-session runs at default 800×600 vs collector 1280×900 (med) | CONFIRMED | pin base page + every `freshClone` to 1280×900 | HOLDS (also fixes the `set_state`/`render_with_overrides` viewport-mismatch findings) |

### Robustness
| Finding | Disp. | Fix | Adversarial |
|---|---|---|---|
| `probe_sr` returns full log incl. focus phrases (med); `emptyQueue` on error paths (med) | CONFIRMED | add `liveRegionAnnouncements` (polite/assertive subset); `{error,probeFailed:true}` on instrument failure | HOLDS |
| `measure_geometry` `overlapFraction` of-target only (med); `gapPx` hypot (med); culprit edge omits `clientLeft` (low) | CONFIRMED | `overlapFractionOfTarget`+`OfOther`; `gapX`/`gapY`+`overlapsOrAdjacent`; `contentRight` uses `clientLeft`/`scrollLeft`; +`stateUsed`/`targetXpath` echo | HOLDS |
| `compare_named_regions` "dominant" is the MEAN (med) | CONFIRMED | relabel + `colorSpread` (high ⇒ mean unrepresentative) + `luminanceDelta` | HOLDS |
| `ocr` engine literal hardcoded (med); no bbox validation on explicit rect (med) | CONFIRMED | sidecar reports the **resolved** label; clamp the explicit rect (`clampedToViewport`) | HOLDS |
| `set_state` `placeholder-shown` true with no placeholder (low) | CONFIRMED | gate on a real `placeholder` attr | HOLDS |

---

## 3. Deferred — consciously NOT fixed this pass (lower priority)

These are real (mostly med/low spec-deviations & doc-hygiene) but were de-prioritized below the
criticals/highs. None is a soundness hole; each degrades *coverage* or *contract honesty* only, and the
verdict stays shadow regardless. Recorded here so the auditor sees the full scope, not a silent partial.

| Finding | Sev | Why deferred |
|---|---|---|
| `resolve_destination` `instantRedirect`/`redirectDelayMs` (ACT fd3a94 instant-only); compare-sibling-set mode | med/low | The SSRF leak (the security half) is fixed; the redirect-timing + set-comparison are 2.4.4 *coverage*, additive |
| `resolve_part_color` full spec'd contract (cascade reuse, pseudo/SVG, opacity/gradient/filter flags, bbox gate, translucency refusal) | med | The load-bearing false-clear half (`sourceProperty`) is fixed; the rest is contract breadth |
| `measure_geometry` `occludedElements[]` hit-test; `viewportWidth` emulation for the 1.4.10 non-320 use | med | Additive 1.4.13/1.4.10 modes; the occlusion *numbers* are now correct |
| `render_with_overrides` error on unresolvable `targetXpath` (vs full-viewport fallback) | med | Robustness nicety; not a soundness/coverage gap |
| round-2 detector precision: `dangling-IDREF` all-tokens-missing; `group-label` radio/checkbox-narrowing | low | Shadow-only precision; review-tier already |
| `ocr` per-glyph confidence; language config | low | Per-line confidence + Latin coverage are adequate for the shadow sharpener |
| arch: hoist a single retry deadline (no leak; backstops hold) | low | Downgraded by the review itself; bounded |
| `compute_contrast` wide-gamut (`oklch`/`color(srgb)`) resolve-to-sRGB | low | Currently refused as inconclusive (sound, just narrower) |
| **Doc-hygiene:** stale 1.4.5 `render_with_overrides` rows; align §4.10/§4.11/§4.12 with shipped behavior; scope the PARALLELISM "byte-identical" claim to concurrency-1 | low | Doc-only; tracked for a doc pass |

---

## 4. Adversarial examination (Phase 3) — summary

6 independent verifiers attempted to **break** each fix and validated formulas/logic against ground truth
(not "looks right"):

- **CIEDE2000** checked against the published Sharma et al. test pairs — not just "red ≠ blue".
- **SSRF pre-flight** proven by standing up two local origins and confirming the foreign origin receives
  **zero bytes** with the fix (vs the request firing without it).
- **4.1.3 pre-existence** confirmed with an injected-with-message region vs a pre-existing one.
- **contrast** confirmed `passes:false` at 2.998 while the display value reads `3.00`, foundation unaffected.
- **`visibilityCause`** confirmed across inserted / display / visibility / aria-hidden / text-changed.

**Verdict: every revision HOLDS, rails preserved, WCAG-correct.** One residual (the `requiredStatesMissing`
native + redundant-role false-positive) — fixed in `eb129c0` with a regression test.

---

## 5. Soundness rails — unchanged

| Rail | Status |
|---|---|
| #1 Objective return, never a verdict | **HOLDS** — no fix introduced a pass/fail; `passes`/`perceptiblyDistinct`/`divergent` remain disclaimed mechanical flags |
| #2 Read-only / fresh-clone | **STRENGTHENED** — the two read-only tools that scrolled the shared page no longer do; mutating tools still refuse without a clone |
| #3 Shadow / canary-capped | **HOLDS** — no tool-path change rewrites the mechanism; every affected verdict stays shadow |

---

## 6. Tests added (regression guard)

`+6` cdp-tools tests: contrast-unrounded-passes; `requiredStatesMissing` (explicit vs native vs redundant-role);
`nameFrom` contributing-source; `visibilityCause` + 4.1.3 pre-existence; ΔE2000 + `luminanceDelta` + `colorSpread`;
`resolve_part_color` `sourceProperty`. Suite: **v3 417/417 · foundation 190/190**.
