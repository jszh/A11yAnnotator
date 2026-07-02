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
- **Decoratively MARKED but meaningful (hidden from AT):** an image REMOVED from the accessibility tree
  (empty `alt=""`, `role="presentation"`/`role="none"`, or `aria-hidden="true"`) is a barrier ONLY if it
  conveys INFORMATION the non-sighted user is thereby DENIED. Make this a **REDUNDANCY** call, NOT a
  pixel-richness call — a decorative photo often carries MORE visual detail than a meaningful logo, so
  "the pixels look rich" is not the test. Use the `element-crop` together with the
  `decorativeMarking.nearbyText` signal (the adjacent text): **(a)** if the image's content is REDUNDANT
  with the nearby text, or it is purely decorative (a spacer / flourish / background, or an illustrative
  photo that adds no information beyond mood — e.g. a fireworks photo next to "Happy New Year!"), then
  removing it from the tree is CORRECT → **NOT a barrier**; **(b)** if it conveys UNIQUE meaning absent
  from the surrounding text — a logo/wordmark that IDENTIFIES the page, an informative diagram/chart, or
  TEXT baked into the image — then hiding it IS a barrier (e.g. a brand logo/wordmark that identifies the
  page, or text-bearing artwork, removed from the a11y tree → REPRODUCED). Do NOT flag a removed-from-tree image merely because it
  renders visible pixels — `renderedVisible` is size-only, not a meaningfulness signal.
- **Incorrect / MISMATCHED (compare the name to the PIXELS):** a non-empty, plausible-sounding alt that
  names the WRONG thing IS a barrier — the alternative is *incorrect*, not just missing. Look at the
  `element-crop` and decide whether the accessible name actually describes what the image DEPICTS. If the
  image visibly shows one thing but the name says another — e.g. an alt naming one organisation's logo on an
  image that renders a DIFFERENT organisation's logo, or an `aria-label` naming one product's mark on an SVG/
  canvas that draws another's — the text alternative misinforms the AT user → barrier.
  This applies to `img alt`, `svg`/`canvas`/`role=img` accessible names alike: judge rendered content vs
  name, not the name's plausibility in isolation.
  **A minor WORDING VARIANT of the SAME subject is NOT a mismatch — only a genuinely DIFFERENT subject is.**
  A typo, near-homophone, singular/plural difference, or loose paraphrase that still clearly names the SAME
  thing the image depicts is adequate; do not demand letter-perfect agreement with printed/canonical text.
  Confirmed against this project's own held-out corpus ground truth: an `alt="The Giving Three"` on a book
  cover whose printed title reads "THE GIVING TREE" is a Pass, not a Fail — a sighted user glancing at that
  alt text would recognize the SAME book instantly; the one-word substitution does not misdirect them to a
  different subject. Reserve REPRODUCED for when the name points to a DIFFERENT referent entirely (the wrong
  organization's logo, the wrong book's cover, the wrong product) — not for imperfect spelling/wording of the
  CORRECT referent.
- **Wrong purpose for a functional image — ONLY when the image IS the control's SOLE name.** A linked/iconed
  control whose accessible name comes ONLY from the image must convey the ACTION (where it goes / what it does),
  not merely the picture. **But if the enclosing link/button ALREADY has its own accessible name** — its own link
  TEXT, an `aria-label`, or `aria-labelledby` (e.g. `<a>` with visible text "W3C home", or `aria-label="Web
  Accessibility Initiative"`, wrapping an `<svg>` named "star") — then the SVG/icon is NOT the control's name: it
  is decorative-or-redundant *within* an already-named control, and its own short name ("star") is FINE (judge it
  as an image: decorative/redundant ⇒ NOT a barrier). Whether the *control's* name names the action is 4.1.2/2.4.4,
  not 1.1.1 — do NOT flag the inner image's name for "describing the picture, not the link's destination" when the
  link carries its own name. Only an image that is the control's ONLY name falls under this failure mode.
- **CSS background-image carrying meaning (TT 7.C):** when `signals.backgroundImage` is present, the element
  conveys its visible content through a CSS `background-image` — there is NO `alt`, and TT's "hide
  backgrounds" step removes it, so any information it carries must ALSO exist as text (an accessible name or
  adjacent text). DECORATIVE is the DEFAULT for an ambiguous background (a texture/gradient/flourish/spacer →
  NOT a barrier). A barrier requires the crop to show the background conveys INFORMATION with no text
  equivalent: an INTERACTIVE control whose only label is the image (`backgroundImage.interactive:true`,
  `hasAccessibleName:false` — also a 4.1.2 failure), an informational icon/badge ("New", "Sold out", a
  status/warning glyph), text baked into the image, or a chart. If you cannot tell whether the background
  carries information, return PARTIAL.

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
