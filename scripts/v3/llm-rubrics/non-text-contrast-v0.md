---
id: non-text-contrast-v0
sc: 1.4.11
skill: color-and-visual-text
visionEvidence: [element-crop, surrounding-region]
---

# 1.4.11 — non-text contrast (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page and you do NOT compute contrast ratios.
The deterministic non-text-contrast runner already CLEARS (or fails) every UI component / graphical object
it can reduce to two flat, opaque colors — a solid button edge against a solid page, an icon glyph against
a solid fill — where the ratio is exact. You are handed only the obligations it left at auto-PARTIAL:
graphical objects and component boundaries whose adjacent colors the runner cannot reduce — a control
edged against a gradient/photo/overlay, an icon over a busy backdrop, a chart segment whose boundary is
anti-aliased into its neighbor. That perceptual case is what pixels answer. Where a deterministic CLAIM
already disposed this obligation, DEFER. This rubric owns ONLY non-text contrast — defer text contrast
(1.4.3 owns that), and focus indicators (their own focus runner owns those).

**Judge:** are the visual boundaries needed to **perceive** the component, or the parts of a graphical
object needed to understand it, distinguishable from their adjacent colors — does ≈3:1 separation read to
the eye everywhere the boundary falls? A toggle whose track is barely a shade off the page background, an
icon whose strokes melt into the surface behind them, a chart whose two adjacent wedges are
indistinguishable, a focusable input whose only visible boundary is a hairline the same luminance as the
field — IS a barrier. A component with a clearly separated edge / fill, or a graphical object whose
meaning-bearing parts stand off their surroundings, is NOT a barrier.

**Evidence handed to you:** the `element-crop` (the component or graphical object and the colors directly
adjacent to it) and the `surrounding-region` (so you can see whether the boundary is separated along its
WHOLE run, not just one corner), plus the element's role/label as context. Judge from these pixels only.

**Interpreting the deterministic evidence (and why it is uncertain):** this obligation reached you BECAUSE
the deterministic lane could not decide it — most often a `contrast.uncertainReason` saying the adjacent
color "could not be computed because the backdrop is a gradient/photo/overlay" (or the component edge is
anti-aliased, semi-transparent, or rendered over a non-uniform surface). Read that reason as *where to
look* — the side the runner could not sample is the side you must judge from the pixels. The runner having
sampled the OTHER side as a pass does not clear the case; the worst boundary governs. CRITICAL invariant:
ABSENCE OF A DETERMINISTIC FINDING IS NOT A PASS. The runner did not stay silent because the component is
fine — it stayed silent because it could not measure this boundary at all. Never read "no computed ratio"
as "≥3:1"; reason from the rendered separation you can see, and if you cannot see it, abstain.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- Do NOT estimate a numeric ratio or assert "exactly 3:1" from the image — vision cannot read exact ratios,
  and the flat-color cases that CAN be computed never reach you. Judge *perceivable distinguishability*.
- 1.4.11 governs only the parts REQUIRED to perceive/operate — a component's identifying boundary or a
  graphical object's information-bearing strokes. Decorative gradients, pure aesthetic shading, and parts
  not needed to understand the object are out of scope; do not flag them.
- Inactive/disabled components and pure decoration are exempt — do not flag a greyed-out control's low
  contrast as a barrier.
- When the crop cannot settle it — JPEG/scaling artifacts, the boundary captured off-element, a rendered
  state that is ambiguous — return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — a needed
boundary/graphical part is not distinguishable from its adjacent color), NOT REPRODUCED (no barrier —
clearly distinguishable), PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
