# case-06 — BOUNDARY PASS: white text over a busy aurora photo, but a baked scrim keeps the worst-case pixel safe

## Scenario
A tour operator hero (Aurora Trails, Tromsø) that deliberately mirrors the failing cases: live
white headline over a high-variance photographic background (a vivid aurora-over-forest with a
bright moon patch that *would* threaten white text). The difference is that a solid dark scrim is
baked into the raster across the text band, with a hard luminance ceiling, so the least-contrast
pixel behind **every** letter stays at or above ~5:1. This sharpens the aspect: "text over a busy
image" is **not** automatically an F83 failure — the determining question is the worst-case pixel
behind the letters, and here the author guaranteed it.

## Attribute tuple
- **content-domain:** travel / outdoor-activity booking (guided night hikes)
- **UI-component/pattern:** full-bleed hero with overlaid headline + CTA (identical shell to case-01)
- **host-language construct:** CSS `background-image` (local PNG aurora) with a baked-in dark scrim band under the `<h1>`
- **locale/i18n:** en (Norwegian place names)
- **failure-mechanism:** NONE — the high-variance image's worst-case pixel behind the text is held above 4.5:1 by a composited scrim (the correct fix for F83)

## Developer persona
A developer who had previously been bitten by an F83 audit finding learned the lesson: instead of
hoping a busy hero photo is dark enough, they pre-composited a dark scrim band into the exported
image exactly where the headline sits, and checked the worst-case pixel behind the title with an
eyedropper before shipping. The aurora still shows above and below the band; the text band is
uniformly safe.

## Element / selector carrying the issue
`.hero h1` — white headline over `bg-06-forest-scrim.png`. No element fails; this is the control.

## Exact accessibility mechanism
The headline is real DOM text (`color:#fff`) over a `background-image`. Sampling the rendered
pixels behind the entire headline box:
- worst-case contrast anywhere behind the text: **8.38:1** — at or above 4.5:1 everywhere.
- best-case pixel: **~18:1**.

Even the brightest pixel the title overlaps (the scrim-capped moon region) keeps white above
threshold. A low-vision reader can read every word. Under F83's procedure the Quickcheck (white vs
the lightest pixel behind the text) already meets 4.5:1, so the failure condition does not apply.

## Expected ACT-style outcome
**passed** — F83 does NOT apply. The Quickcheck succeeds: contrast between the text and the
lightest part of the image behind it meets the required ratio, so there is no failure.

## Why automated tools miss it
This case sharpens the aspect from the tool's side too: scanners STILL cannot read the raster and
STILL fall back to the solid `#06140d` (~16:1), so they would "pass" it — but for the **wrong
reason** (they never measured the image; they got lucky). A human applying F83 confirms the pass
for the **right** reason: the worst-case pixel behind the letters is ~8:1. The contrast between a
correct pass (measured worst-case is safe) and a coincidental pass (tool never looked) is itself a
judgment automated tools cannot make.

## Citation
> **WCAG Technique F83 — Procedure (Quickcheck)** (`wcag-techniques/failures/F83.html`):
> "First do a quick check to see if the contrast between the text and the area of the image that
> is darkest (for dark text) or lightest (for light text) meets or exceeds that required by the
> Success Criterion (1.4.3 Contrast (Minimum) or 1.4.6 Contrast (Enhanced)). If the contrast meets
> or exceeds the specified contrast, then there is no failure."

> **EN 301 549 — C.9.1.4.3 Contrast (minimum)** (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`):
> "Result   Pass: Check 1 is true   Fail: Check 1 is false   Not applicable: If any requirement
> precondition is false or the web page does not contain content relevant to WCAG 2.2 Success
> Criterion 1.4.3 Contrast (Minimum)."
