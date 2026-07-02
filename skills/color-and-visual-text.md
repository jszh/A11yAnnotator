---
name: color-and-visual-text
description: Judge the perceptual meaning behind contrast and color signals the runner already measured — information carried by color alone, text baked into raster images, and non-text contrast — over handed evidence, not your own tool runs.
covers: cat_6 (primary)
wcag: 1.4.1 Use of Color (A); 1.4.3 Contrast (Minimum) (AA); 1.4.5 Images of Text (AA); 1.4.11 Non-text Contrast (AA, WCAG 2.1)
instruments: contrast math (--contrast), pixel sampling (--pixel-contrast), computed styles (--eval), vision (screenshots), axe
behavioral: no (static)
---


# color-and-visual-text

## v3.2 division of labor
You do **not** investigate and you do **not** drive tools. The collector and the
deterministic runners have already loaded the page, walked the DOM, computed
styles, sampled pixels, run axe, and recorded the (realism-corrected) VSR
transcript. They **hand you** their signals plus the declared vision crops. Your
only job is to **judge meaning** over that evidence — the perceptual residue a
deterministic check cannot resolve.

**Defer to the runner.** Where a deterministic runner already disposed an
obligation, do not re-open it:
- **1.4.3 Contrast (Minimum) is owned by the runner.** The a11y-eval contrast
  engine measures the ratio against the correct threshold and emits the verdict.
  Do **not** re-judge 1.4.3 here, and do not recompute its ratio.
- You receive only the **auto-PARTIAL residue**: findings the runner could not
  fully dispose because meaning is perceptual — color used as the sole channel,
  text fused into a raster, or a non-text-contrast boundary that needs an eye on
  the crop. Judge those; pass everything else through as the runner left it.

## What you JUDGE
Scope yourself to three obligations, judged over the handed contrast signal +
crops. (Again: **not** 1.4.3 — the runner owns it.)

- **1.4.1 Use of Color (A) — colour-only meaning.** Decide whether hue is the
  *sole* carrier of information. Over the crop and the handed DOM signal: is a
  state/series/category distinguished only by color, with no dash, pattern,
  icon, label, shape, underline, or sufficient lightness difference? Per F73's
  Procedure a **≥3:1 luminance separation** between the color-cued element and
  what it must be told apart from is itself a satisfying non-color cue (a
  lightness difference survives color-vision loss). So: series differing only
  by `stroke` (no `stroke-dasharray`, no text label) at SIMILAR lightness
  (<3:1 between the series colors), or a link set apart from body text only by
  a hue swap at similar lightness, is colour-only meaning → REPRODUCED; series
  or link colors separated by ≥3:1 luminance, or any non-color redundant cue →
  NOT REPRODUCED. EXCEPTION (F81): a state whose meaning relies on perceiving
  a SPECIFIC color (green=valid / red=invalid) needs an additional non-color
  indicator REGARDLESS of contrast ratio — the ≥3:1 escape does NOT apply there.
- **1.4.5 Images of Text (AA) — text-as-image.** The handed signal already tells
  you the node is an `<img>`/`<canvas>` (its "text" is not DOM text and cannot
  be zoomed or restyled). Judge the crop: does it bake **essential** text into
  the raster (a meme caption, an ad slogan, a screenshot of prose) rather than
  incidental/logotype text? An `alt` that describes the subject instead of the
  embedded words corroborates. Essential baked text → REPRODUCED.
- **1.4.11 Non-text Contrast (AA, WCAG 2.1) — non-text contrast.** Judge over the
  handed contrast signal + crop whether a UI-component boundary or a graphical
  object meant to be perceived clears **3:1**. Trust `worstOverBackground` and
  your eyes for a control sitting over a busy or photographic image; the worst
  overlapped spot governs, not the cosmetic center.

## Evidence you are handed
You judge over these — you do not gather them.

- **Precomputed a11y-eval contrast signals.** For each finding the runner hands
  you: the resolved computed `color`/`backgroundColor` pair (ancestors already
  walked through transparent layers); the exact `--contrast` ratio; for
  composited backgrounds (`background-image`, gradient, semitransparent overlay,
  or a `transparent`-resolved own background) the `--pixel-contrast` output —
  `palette` (dominant colors + %), `estimatedText`/`estimatedBg`,
  `contrastTextVsBg`, and `worstOverBackground` (text vs every other prominent
  cluster). The relevant thresholds, already applied by the runner: **1.4.3
  (AA)** 4.5:1 normal text, 3:1 large text, where large text = **≥ 24px** (18pt)
  OR **≥ 18.66px** (14pt) bold; **1.4.11 (AA)** 3:1 for UI-component boundaries
  and graphical objects. The handed signal also flags the DOM facts you need for
  1.4.1/1.4.5 (e.g. `stroke`/`stroke-dasharray`, node tag, `alt`) and the axe
  results (`color-contrast`, `link-in-text-block`).
- **The (realism-corrected) VSR announcement transcript.** What a screen-reader
  user is actually told about the affected element — already realism-corrected,
  so read it as the user's experience, not as a fact to re-derive.
- **The declared vision crops.** The saved element/region screenshots the
  runner pinned for this finding (the composited button crop, the chart/legend,
  the raster image). Judge these; do not request or generate new ones.

## WCAG soundness caveats (these STOP a false clear or a false barrier)
- **Don't trust the finding's stated hex.** The sweetgreen claim was inverted —
  real **16.75:1**, not 1.14:1. Judge the handed measured ratio, never the
  number the finding asserts.
- **The large-text threshold split is load-bearing.** Large text = **≥ 24px**
  (18pt) OR **≥ 18.66px** (14pt) bold. The old "14px bold" cutoff was a BUG (14px is
  not 14pt); the handed signal already matches `lib/a11y-eval.js`
  `isLargeText`/`contrastThresholdFor`. If a verdict you are reasoning over rests on
  the buggy split, it is unsound — flag it rather than ratify it.
- **axe `incomplete` is not `pass`.** For composited backgrounds axe-core reports
  `color-contrast` as *incomplete*; treat that as "the pixel-sampled signal
  governs", never as a clear.
- **Over photographic/composited backgrounds, the segmentation is a heuristic.**
  The estimator picks most-frequent = background, farthest-luminance = text and
  can mis-pick when an image region outnumbers the text. Confirm
  `estimatedText`/`estimatedBg` against the crop and let `worstOverBackground`
  and your eyes govern. Quantization rounds colors to 16 levels/channel, so the
  ratio can differ by a few tenths from the true value (sweetgreen: sampled
  16.75 vs computed 18.8) — fine for pass/fail, not for audit-grade exact figures.
- **Colour-only and text-in-image remain perceptual judgments.** A passing
  contrast number does not clear 1.4.1 or 1.4.5, and a failing one does not by
  itself prove them; judge the channel and the raster on their own terms.

## Output
One verdict per finding: **REPRODUCED** / **NOT REPRODUCED** / **PARTIAL** / **N/A**.
