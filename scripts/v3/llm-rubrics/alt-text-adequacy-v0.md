---
id: alt-text-adequacy-v0
sc: 1.1.1
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 1.1.1 — alt-text adequacy (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The collector already extracted the
image, its `alt`/accessible name, and its surrounding context, and screenshotted the element. Your job
is to JUDGE whether the text alternative conveys the same *purpose and content* the image conveys. Where a
deterministic runner already disposed this obligation, DEFER — you are only handed auto-PARTIAL ones.

**Judge:** does the announced text alternative serve the image's PURPOSE for a non-sighted user — not
"is alt present" (that is mechanical) but "does it say what a sighted user gets"? Four failure modes:
- **Missing / placeholder:** an informative image with empty/placeholder/filename alt ("image",
  "img_1234.png") IS a barrier. A genuinely DECORATIVE image correctly has an empty name (NOT a barrier).
- **Decoratively MARKED but meaningful (hidden from AT):** an image that conveys meaning or identity — a
  logo/wordmark, an informative diagram, a content photo — that has been REMOVED from the accessibility
  tree by an empty `alt=""`, `role="presentation"`/`role="none"`, or `aria-hidden="true"` IS a barrier:
  the author asserted "decorative" but the pixels carry content a non-sighted user is now denied (ACT
  e88epe — e.g. a `<img alt="">` or `aria-hidden` W3C logo). Judge the PIXELS: if a meaningful image was
  marked decorative, REPRODUCED. (A truly decorative flourish correctly marked decorative is NOT a barrier
  — the call hinges on whether the rendered image actually conveys something.)
- **Incorrect / MISMATCHED (compare the name to the PIXELS):** a non-empty, plausible-sounding alt that
  names the WRONG thing IS a barrier — the alternative is *incorrect*, not just missing. Look at the
  `element-crop` and decide whether the accessible name actually describes what the image DEPICTS. If the
  image visibly shows one thing but the name says another — e.g. alt "ERCIM logo" on an image rendering
  the **W3C** logo, `aria-label="W3C"` on an SVG that draws the **HTML5** logo, or `aria-label="HTML 5
  logo"` on a canvas painting the **W3C** logo — the text alternative misinforms the AT user → barrier.
  This applies to `img alt`, `svg`/`canvas`/`role=img` accessible names alike: judge rendered content vs
  name, not the name's plausibility in isolation.
- **Wrong purpose for a functional image:** a linked/iconed control's name must convey the ACTION (where
  it goes / what it does), not merely the picture.

**Evidence handed to you:** the accessible name, the `element-crop` (the image's RENDERED pixels) and
`surrounding-region`, the role, and whether the image is linked/functional.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- An empty name on a genuinely DECORATIVE image is correct — do not flag it.
- The mismatch judgment REQUIRES seeing the image: if the `element-crop` is blank or unrendered (an SVG
  not rasterized, a canvas captured before its draw, a remote/relative asset that 404s — e.g. under
  `file://`), you cannot compare name-to-pixels — return PARTIAL, do not assume a mismatch. A broken-image
  placeholder or missing-asset glyph is NOT the image's depicted content — do not read it as either a
  match or a mismatch; return PARTIAL.
- You cannot see the page's intent for an ambiguous image — when the crop is inconclusive, return PARTIAL.
- Do not judge contrast/sizing here; another rubric owns those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
