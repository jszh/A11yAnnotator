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

**REDUNDANCY MUST BE QUOTED — text you cannot quote does not exist.** Clearing this image BECAUSE its
information is available elsewhere is a factual claim about the page, and it carries a citation standard: QUOTE
the specific `nearbyText` (or name the specific element and quote its text) that carries the equivalent
information. If you cannot quote it from the evidence handed to you, the equivalent text does not exist — an
unquoted "the same data appears in an adjacent table/caption" is a fabricated redundancy, and the image must
then be judged as the only path by which that content reaches any user. A claim that a table or list exists is
checkable — the signals/DOM excerpt handed to you would show such a structure; do not assert structures the
evidence does not contain. **The quote must come from TEXTUAL evidence — `nearbyText`, the DOM/signals
excerpt, or a tool's text result — NEVER from pixels inside the candidate's own crop.** Words you can read
inside the `element-crop`, or inside the candidate's own footprint within the `surrounding-region`, are the
IMAGE'S OWN rendered content — the very content whose denial is in question — and citing them as the
"adjacent" equivalent clears the image with itself. Before quoting anything you saw in the pixels, confirm
the same words exist in the textual evidence; if the only place the information appears is rendered inside
the candidate image, it is NOT redundant — no text carries it, and the AT user is denied it. If, however,
the excerpt/signals handed to you are capped or plausibly incomplete
for the specific place the equivalent text would live, you can verify neither its presence nor its absence —
return PARTIAL (cannot verify from the provided excerpt) rather than treating the unquotable text as absent.
*That escape is constrained to CONTENT-BEARING locations:* "the place the equivalent text would live" means
somewhere page content lives — adjacent prose, a caption or description block, a data table or list. A
location that structurally cannot carry the image's content — a labelled user-entry control (its label names
what the USER enters, not what the image shows), a navigation link, button chrome — is not such a place, so
an excerpt truncated at form controls or widget chrome has not hidden the image's equivalent text and does
NOT make this escape fire.
(A flourish/spacer/mood photo that adds no information needs no such quote — this
standard applies only when redundancy with on-page content is your ground for clearing.)

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
