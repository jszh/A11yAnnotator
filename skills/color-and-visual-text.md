---
name: color-and-visual-text
description: Verify contrast with exact math, and use vision for the perceptual cases axe can't reach — information carried by color alone, and text baked into raster images.
covers: cat_6 (primary)
wcag: 1.4.1 Use of Color (A); 1.4.3 Contrast (Minimum) (AA); 1.4.5 Images of Text (AA); 1.4.11 Non-text Contrast (AA, WCAG 2.1)
instruments: contrast math (--contrast), pixel sampling (--pixel-contrast), computed styles (--eval), vision (screenshots), axe
behavioral: no (static)
---

> **v3.2 division of labor (LLM lane).** In Harness v3.2 you do NOT investigate or drive tools — the
> collector and the deterministic runners already measured the page and HAND you their signals + the
> (realism-corrected) VSR transcript + vision crops. Your job is to JUDGE MEANING over that evidence,
> not to re-run `--eval`/`/ax-node` or drive a submit. Where a deterministic runner already disposed an
> obligation (a CLAIM exists) you are NOT asked about it — the builder only hands you the auto-PARTIAL
> residue, so DEFER to the runner and never re-litigate (e.g. do not re-judge 1.4.3 contrast the runner
> owns). KEEP every WCAG soundness caveat below: they are what STOP a false clear or false barrier.


# color-and-visual-text

> **Tooling note.** All `--eval`/`--xpath`/`--contrast`/`--pixel-contrast` below
> are flags of `scripts/verify-finding.js`. `--eval "<body>"` runs your string as
> a function body **inside the page** (`page.evaluate`), so `getComputedStyle`,
> `document`, `getBoundingClientRect`, etc. are the ordinary browser globals there
> — there is no custom `getComputedStyle`; it's the DOM API.

## When to run
Findings about low-contrast text/UI, charts/legends/status distinguished only by
color, or memes/ads/screenshots that bake text into an image.

## Procedure — contrast (1.4.3, 1.4.11)
First decide which background you're dealing with:

**A. Solid, single-layer background** (element or an ancestor has an opaque
`backgroundColor`, no image/gradient):
1. `--eval` the *computed* colors: `getComputedStyle(el).color` + the effective
   `backgroundColor` (walk ancestors while it's `rgba(...,0)`/transparent).
2. `--contrast "r,g,b|r,g,b"` → exact ratio. Thresholds: **1.4.3 (AA)** = 4.5:1
   normal text, 3:1 large text — large = **≥24px (18pt)** OR **≥18.66px (14pt) bold**
   (NOT "≥18.66px / ≥14px bold" — that was the harness bug; this matches
   `lib/a11y-eval.js` `isLargeText`/`contrastThresholdFor`); **1.4.11 (AA)** = 3:1 for
   UI-component boundaries and graphical objects. **Don't trust the finding's
   stated hex** — the sweetgreen claim was inverted (real 16.75:1, not 1.14:1).

**B. Composited background — REQUIRED whenever the resolved background is
`transparent`, or there's a `background-image`/gradient, or a semitransparent
element/image sits behind the text** (`getComputedStyle` returns only the
element's *own* background and axe-core reports `color-contrast` as *incomplete*
for these — they are **not** covered by method A):
3. `--pixel-contrast --xpath <xp>` (or `--sel`). It screenshots the element and
   samples the **final rendered pixels**, returning: `palette` (dominant colors +
   %), `estimatedText`/`estimatedBg`, `contrastTextVsBg`, and
   `worstOverBackground` (text vs every other prominent cluster — the worst spot a
   button-over-image actually overlaps). It also saves the crop to `/tmp`.
   - Example: Domino's "Join Now" — `getComputedStyle` gives `ownBg rgba(0,0,0,0)`
     (transparent, unusable); pixel sampling gives blue text on a cream composite
     = **4.63:1**.
4. **Confirm with vision** — read the saved crop; verify the estimated text/bg
   pair matches what you see (the estimator can mis-pick if an image region is
   more frequent than the text). For a button over a busy/photographic image,
   trust `worstOverBackground` and your eyes over a single number.
5. Cross-check axe `color-contrast`, but treat its `incomplete` results as "method
   B required", not "passes".

## Procedure — color-only (1.4.1) and text-in-image (1.4.5) — vision
4. **Color as sole channel** — screenshot the chart/legend/status. Is the *only*
   distinction hue (no dashes/patterns/labels/icons)? Confirm in DOM that series
   differ only by `stroke`, with no `stroke-dasharray` or text label → REPRODUCED.
   For the specific **link-in-a-text-block** case (a link distinguished from
   surrounding text by color alone, no underline), axe has a dedicated rule:
   `--axe link-in-text-block` (1.4.1, enabled by default) — run it before falling
   back to vision.
5. **Text in raster** — confirm the element is an `<img>`/`<canvas>` (so its
   "text" is not DOM text and can't be zoomed/restyled), then read the PNG: does
   it contain essential text (meme, ad, screenshot)? The `alt` describing the
   subreddit rather than the embedded text corroborates.

## Classify
- **REPRODUCED** — measured ratio below threshold; or color is the sole channel; or essential text is baked into an image.
- **NOT REPRODUCED** — ratio passes (record it — sweetgreen was 18.8:1, not 1.14:1); or a non-color cue exists.
- **PARTIAL** — chart needs a second series added (live) to show the color-only legend.

## Limits
Method A (solid bg) is deterministic — prefer it over eyeballing. Method B (pixel
sampling) is the only thing that handles `background-image`, gradients,
semitransparent overlays, and transparent-resolved backgrounds — but its
text/background segmentation is a heuristic (most-frequent = background,
farthest-luminance = text); over photographic backgrounds confirm the pair with
vision and report `worstOverBackground`. Quantization rounds colors to 16
levels/channel, so the ratio can differ by a few tenths from the true value
(sweetgreen: sampled 16.75 vs computed 18.8) — fine for pass/fail, not for
audit-grade exact figures. Color-only and text-in-image remain vision judgments.
