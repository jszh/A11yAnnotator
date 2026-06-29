---
id: decorative-image-verification-v0
sc: 1.1.1
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 1.1.1 — decorative-image verification (v0 atomic rubric)

**Why you were handed this.** This image is **removed from the accessibility tree** (`alt=""`,
`role="presentation"`/`role="none"`, or `aria-hidden="true"`) and the author gave it **no accessible name**, so
the AT user gets NOTHING from it. It also renders at a **non-trivial size** (a tiny spacer/icon would not reach
you — those are excluded upstream). The author has DECLARED it decorative; your single job is to decide whether
that declaration is **honest** (genuinely decorative → correct → NOT a barrier) or whether the image actually
carries **information the non-sighted user is thereby DENIED** (→ barrier). A deterministic checker cannot make
this call — `alt=""` on a meaningful graphic looks identical to `alt=""` on a flourish.

**DEFAULT TO "correctly decorative" (NOT REPRODUCED / N/A).** Authors mark images decorative far more often
correctly than not, and over-flagging re-creates the decorative-image flood this lane is gated to avoid. Only
return **REPRODUCED** when you can name SPECIFIC information the `element-crop` carries that a sighted user
receives and that is NOT available in the nearby text. When in doubt, it is decorative.

**Judge the INFORMATION the image adds IN THIS CONTEXT — not what the image IS.**
This is a **redundancy** call against `decorativeMarking.nearbyText` (the adjacent text), NOT a recognition or
pixel-richness call. The ONLY question is: *does this image convey content the surrounding text does not?*

- **Correctly decorative → NOT a barrier (the common case):** a spacer/divider/texture/gradient/flourish; a
  mood or illustrative photo (a fireworks photo beside "Happy New Year!", a generic hero behind a heading); an
  image whose content is **REDUNDANT** with the `nearbyText`; or any image that is incidental/atmospheric.

- **Wrongly hidden → REPRODUCED (barrier) — ONLY for a concrete, nameable piece of denied information:**
  - **TEXT baked into the image** (a worded banner, a sign-up graphic, a price/label rendered as pixels) whose
    words are not reproduced as real text nearby.
  - **A graphic that encodes STATUS / STATE / MEANING** with no text equivalent — a warning/error/success glyph,
    a "New"/"Sold out"/"Beta" badge, a checkmark or ✗ that conveys a result.
  - **A DATA-BEARING graphic** — a chart, diagram, map, graph, or figure whose content exists only in the image.
  - **The SOLE conveyor of identity/content at its location** — removing it would leave a sighted user with
    information (e.g. *which* entity/section this is) that appears **nowhere** in the surrounding text. This is a
    REDUNDANCY test on the specific content, not a judgment that the image is "important-looking."

**ANTI-BIAS — do NOT flag on recognition, fame, or prominence (read this before deciding REPRODUCED):**
- That you can **identify** the image — a known company logo/wordmark, a famous landmark, a recognizable product
  or mascot — is **NOT** evidence it is informative HERE. A recognizable image used where its content is
  **redundant with the text**, or merely as branding/atmosphere, is **correctly decorative**. Never reason "this
  is the X logo, therefore it is information"; reason "the information this image adds, beyond the nearby text,
  is ___ — and the AT user is denied it." If you cannot fill that blank with something concrete, it is decorative.
- A large or visually dominant image is not informative by virtue of size — a decorative photo often has more
  detail than a meaningful diagram. `renderedVisible`/size is NOT a meaningfulness signal.
- Do not infer information from the filename or your prior knowledge of a brand — judge only the rendered pixels
  in the `element-crop` against the `nearbyText`.

**WCAG soundness caveats (do NOT manufacture a failure):**
- An empty name on a genuinely decorative image is CORRECT — the mere fact it is removed from the tree, or
  renders visible pixels, is NOT a barrier.
- You MUST see the image to call it informative: if the `element-crop` is blank/unrendered (an SVG not
  rasterised, a canvas pre-draw, a relative/remote asset that 404s under `file://`, a broken-image placeholder),
  you cannot judge → return **PARTIAL**, do not assume either way.
- Redundancy is decided against the `nearbyText` you are given — do not invent context you cannot see; if the
  surrounding text is absent and the image is ambiguous, return **PARTIAL**.
- Do not judge contrast / sizing / markup correctness here — other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — concrete information denied), NOT REPRODUCED (correctly decorative), PARTIAL (cannot
decide — crop unrendered / context unknown), N/A (abstain)}.
