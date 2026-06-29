---
id: images-of-text-v0
sc: 1.4.5
skill: color-and-visual-text
visionEvidence: [element-crop, surrounding-region]
---

# 1.4.5 — images of text (v0 atomic rubric)

**Division of labor (v3.2).** The collector identified an image element (an `<img>`, `role=img`, SVG/canvas
drawing) and screenshotted its rendered pixels. No deterministic tool can tell a raster of TEXT from a photo,
so the obligation is auto-PARTIAL and handed to you. Your decision splits into TWO sub-questions you answer in
order: (1) PRESENCE — does the image contain a meaningful run of baked-in TEXT at all? (2) EXCEPTION — if it
does, is that text an EXEMPT case (logo / essential presentation)? Where a deterministic CLAIM already disposed
this obligation, DEFER.

**(1) PRESENCE — read the pixels, do NOT guess.** If a tool session is available, **call
`ocr_image_text(targetXpath)`** to read any text BAKED INTO the image (pair with `request_hi_res_crop` first
when the element-crop is small/blurry — empty OCR on a low-res crop is NOT "no text"). OCR gives you the
objective text content rather than a guess from a thumbnail; a NON-EMPTY meaningful OCR result establishes the
image carries text, an EMPTY result on a sharp, fully-rendered crop is genuine evidence of NO text. If no tool
is available, read the text from the crop directly. Pure photos / icons / illustrations with no meaningful
lettering ⇒ **NOT REPRODUCED** (1.4.5 does not apply — there is no image-of-text).

**(2) JUDGE the exception.** When the image DOES render meaningful text — words, sentences, labels, or a
heading drawn as a picture — that conveys information and **could be presented as real, selectable HTML text**,
that IS a 1.4.5 barrier (REPRODUCED) — author it as text — UNLESS an exception below holds.

**This is NOT a barrier (do not flag):**
- **Logotypes / wordmarks / brand names** — text that is part of a logo is the ESSENTIAL exception
  (the W3C / a company logo with its name in it is fine).
- **Essential presentation** — text whose particular visual form is the point: a screenshot/diagram
  demonstrating an interface, a chart/graph with axis labels, sample renderings, signatures, a font
  specimen, mathematical/code imagery where layout carries meaning.
- **Functional glyph / single-letter ICONS** — a SHORT glyph or single letter used as an ICON or control
  where the visual FORM itself is the information and the accessible name describes the FUNCTION rather than
  transcribing the glyph: e.g. a small "A" and a large "A" button for decrease/increase text size, "B"/"I"
  for bold/italic, an "X" close control, "+"/"−" steppers. These are icons, NOT a block of text rendered as a
  picture — the size/shape conveys the control's meaning, so they are essential — NOT a 1.4.5 barrier. (A
  genuine image-of-text is a RUN of words/sentences whose textual CONTENT is the message; a lone functional
  glyph whose alt names its action is not — mirrors the 1.4.5 single-char-icon exemption the runner applies.)
- **Images with no meaningful text** — photos, icons, illustrations, decorative graphics. Incidental
  text inside a photograph (a street sign in a snapshot) is not the image's conveyed content.

**Evidence handed to you:** the `element-crop` (the image's rendered pixels) and `surrounding-region`
(to see whether the same text also appears as real text nearby, which can change the call), plus the
element's role/accessible name as context.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- This rubric owns ONLY *images of text* (1.4.5). Do NOT judge whether the alt text is adequate (1.1.1),
  the contrast of the rendered text (1.4.3), or sizing — other rubrics own those.
- Seeing the content is REQUIRED: if the `element-crop` is blank, transparent, or unrendered (an SVG/canvas
  captured before it painted, a remote/relative asset that 404s — e.g. under `file://`, leaving a
  broken-image glyph) AND `ocr_image_text` (after `request_hi_res_crop`) also returns nothing, you cannot tell
  text-image from photo — return PARTIAL, do not guess. (A normally rendered SVG/canvas that DID paint is fine
  to judge — the trigger is BLANK PIXELS with no readable text, not the element type.)
- A small amount of incidental/decorative lettering is not the same as an image whose PURPOSE is to
  present a block of textual content — judge what the image is FOR.
- When it is genuinely ambiguous whether the rendered text is a logo/essential case vs. avoidable
  text-as-image, return PARTIAL rather than over-flagging.
- If the `svgLiveText` signal is present (an `<svg>` rendering live `<text>`/`<tspan>`), the text is REAL and
  machine-readable, NOT flattened pixels — it is NOT an image of text and carries no 1.4.5 barrier (NOT
  REPRODUCED). 1.4.5 targets text BAKED INTO a raster/painted image, not accessible vector text.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — meaningful text presented as an image that could be real text), NOT REPRODUCED
(no barrier — logo/essential/no-meaningful-text), PARTIAL (cannot decide from the crop), N/A (abstain —
NOT "out of scope", that is the oracle's job)}.
