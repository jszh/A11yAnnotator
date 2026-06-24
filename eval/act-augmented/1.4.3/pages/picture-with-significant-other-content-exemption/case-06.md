# case-06 — Nonprofit pull-quote image of text at 3.17:1: passes ONLY because it is large-scale (boundary)

## Scenario
A Riverkeep Conservancy "2025 Impact Report" page features a pull-quote rendered as a flat
**image of text** (set in a hand-serif for a designed look) on a near-white card — no
significant other visual content, so it is **in scope** (not exempt). The lettering is `#888888`
on `#f4f2ed` = **3.17:1**: below the 4.5:1 required for normal text, but at/above the 3:1
required for **large-scale** text. The image renders large (font-size 40 across a full-width
card, well above the ~18pt/24px large-scale threshold), so the correct threshold is 3:1, and
3.17:1 **meets** it — the page **passes**. The point of the page is that you cannot decide
pass/fail from the number alone; you must first judge the rendered size.

## Attribute tuple
- **Content domain:** nonprofit / annual impact report
- **UI component / pattern:** editorial pull-quote (figure with attribution)
- **Host-language construct:** single `<img>` pull-quote (inline-SVG `data:` URI) with transcribing `alt`
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the size-threshold boundary; the trap is a reviewer who applies 4.5:1 without first determining the image text is large-scale

## Developer persona
The conservancy's volunteer designer set the founder's quote in a serif display face and
exported it as one image to preserve the typography in the PDF and the web report. They picked a
soft grey-on-cream "for an understated, editorial feel." It happens to land at 3.17:1 — which is
fine because the quote is rendered large, but only a reviewer who confirms the large-scale size
can say so.

## Element / selector carrying the issue
`figure.pull img#quoteImg` — the quote glyphs are SVG `<text>` `fill="#888888"` on the `#f4f2ed`
card (3.17:1), rendered at a large display size. The size judgment determines whether 4.5:1 or
3:1 is the applicable threshold.

## Exact accessibility mechanism
A low-vision user reads large text more easily at lower contrast, which is exactly why the SC
relaxes the threshold to 3:1 for large-scale text (Understanding 1.4.3). Here the quote is
rendered large (≈40px in the image, > 24px / 18pt), so 3:1 applies; at 3.17:1 the rendering
meets the requirement and the SC is satisfied. The catch is that Trusted Tester notes there is
no tool to compare text size *inside an image*, so a human must demonstrate the image text is
large-scale before applying 3:1 — otherwise the default 4.5:1 governs and 3.17:1 would fail. A
tester eyedroppers 3.17:1 with the Colour Contrast Analyser, confirms the rendered text is
large-scale, and concludes PASS.

## Expected ACT-style outcome
**passed** (SC 1.4.3). No live text node exists for ACT afw4f7. The in-scope image of text
renders at 3.17:1 and is large-scale, so the applicable 3:1 threshold is met and the page
passes. (A reviewer who fails this page applied 4.5:1 without first establishing large-scale.)

## Why automated tools miss it
The quote is an `<img>` with no live text node, so axe/WAVE/Lighthouse compute no contrast and
cannot read the text or judge its rendered size — they neither flag nor clear it. The decision
requires (1) recognising this is an in-scope image of text (not an exempt picture), (2)
determining from the rendered pixels that the text is large-scale so the 3:1 threshold applies,
and (3) eyedroppering 3.17:1. All three are human-only; the size determination in particular is
the judgment Trusted Tester explicitly leaves to the human.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.4.3, Test 13.C step 4.c note (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "if the text in the image is large-scale (≥18pt or 14pt bold), 3:1 applies. TT has not identified a tool to compare text size in images, so this determination is not in the process — but use 3:1 if it can be satisfactorily demonstrated the text is large-scale."

**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "Text that is larger and has wider character strokes is easier to read at lower contrast. The contrast requirement for larger text is therefore lower."
