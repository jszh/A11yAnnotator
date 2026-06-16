---
id: contrast-over-complex-backdrop-v0
sc: 1.4.3
skill: color-and-visual-text
visionEvidence: [element-crop, surrounding-region]
---

# 1.4.3 — text contrast over a complex backdrop (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page, and you do NOT compute contrast ratios.
The deterministic C3 runner already CLEARS (or fails) every case it can compute soundly — text over a
**flat, opaque** background, where the foreground/background colors are known and the WCAG ratio is exact.
You are handed only the obligations it left at auto-PARTIAL: text rendered over a **non-uniform** backdrop
the runner cannot reduce to two colors — a photo, a gradient, a video frame, a patterned/semi-transparent
overlay, or text sitting partly on and partly off an image. That perceptual case is exactly what pixels
answer and a color computation cannot. Where a deterministic CLAIM already disposed this obligation, DEFER.

**Judge:** is the text **readable** against its actual, possibly-varying background — can a sighted user
with low-to-normal vision comfortably make out every character — across the WHOLE run of the text, not
just its easiest region? A clear, consistent separation between the glyphs and the backdrop (a solid
text-shadow/scrim, a sufficiently dark/light plate behind the text, or simply high luminance distance
everywhere the text falls) is NOT a barrier. Text that disappears into, blends with, or is only partially
legible against the busy/low-contrast region of its backdrop — e.g. light text over the bright part of a
photo, or thin text over a same-luminance gradient — IS a barrier.

**Evidence handed to you:** the `element-crop` (the text and the backdrop directly behind it) and the
`surrounding-region` (so you can see whether a scrim/plate extends under all of the text), plus the
element's role/label as context. Judge from these pixels only.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- Do NOT estimate a numeric ratio or assert a 4.5:1 / 3:1 threshold from the image — vision cannot read
  exact ratios, and the flat-backdrop cases that CAN be computed never reach you (the runner owns them).
  Judge *perceivable readability*, not a measured number.
- The WORST region governs: if the backdrop varies, a passage that is crisp over the dark third but
  vanishes over the bright third IS a barrier — do not clear it on the strength of the readable part.
- A solid text-shadow, scrim, semi-opaque plate, or outline that demonstrably lifts the text off the busy
  backdrop is a legitimate pass — do not insist on a flat color block.
- When the crop cannot settle it — JPEG/scaling artifacts, the text captured off-element or too small to
  resolve, or a backdrop whose rendered state is ambiguous — return PARTIAL rather than guessing.
- This rubric owns ONLY luminance/contrast readability of *text*. Do not judge font *size* (1.4.4/reflow),
  non-text contrast (1.4.11), alt text, or focus indicators — other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — text not reliably readable over its backdrop), NOT REPRODUCED (no barrier — text
clearly readable across its whole run), PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT
"out of scope", that is the oracle's job)}.
