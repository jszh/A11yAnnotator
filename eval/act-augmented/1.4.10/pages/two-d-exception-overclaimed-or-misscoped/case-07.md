# case-07 — Docs page: fixed-width video causes a page-level horizontal scrollbar, but ALL prose reflows (PASS control)

## Scenario
A developer-docs tutorial embeds a fixed-720px-wide video player with no `max-width: 100%`, so a
page-level horizontal scrollbar appears at 320 CSS px. A video is a fixed-dimension medium with a 1.4.10
exception, and the Understanding doc states explicitly that a page-level horizontal scrollbar caused
solely by such excepted media PASSES — provided every non-excepted section reflows. Here all prose
(`max-width:70ch`), the on-this-page nav, the callout, the headings, and the code block
(`white-space:pre-wrap; overflow-wrap:anywhere`, so even a long broker string wraps) DO reflow into the
320px column. This is the Understanding doc's "BBC Earth video" pass, included to stop the evaluator from
flagging any horizontal scrollbar reflexively.

## Attribute tuple
- **Content domain:** developer docs / API reference (database product)
- **UI component / pattern:** embedded video figure + code block + on-this-page TOC + callout
- **Host-language construct:** `<video>` with fixed width and NO `max-width:100%` (intentionally over-wide)
- **Locale / i18n:** en
- **Failure mechanism:** none — page-level scrollbar owed entirely to an excepted fixed-dimension medium (PASS)

## Developer persona
A docs engineer embedded a product demo video at its native 720px and never added `max-width:100%`, so
at high zoom the page gains a horizontal scrollbar. They were careful, though, with everything else:
prose is capped at 70ch, code uses `white-space:pre-wrap; overflow-wrap:anywhere` so long connection
strings wrap, and the TOC/callout have no fixed widths. They left this as a deliberate "does this pass?"
fixture: the scrollbar exists, but only because of the excepted video.

## Element / selector carrying the issue
No issue. Contrast anchors: `figure.demo video` (the excepted fixed-dimension medium that legitimately
causes the page scrollbar) versus the reflowing non-excepted regions `article` prose, `nav.toc`,
`.callout`, and `pre` (which wraps long tokens). A naive evaluator might wrongly flag the page-level
horizontal scrollbar.

## Exact accessibility mechanism
At 320 CSS px a low-vision user reads all headings, paragraphs, the callout, the TOC, and the code block
in a single vertical column with no horizontal scrolling — even the long Kafka broker string wraps rather
than overflowing. The only horizontal scroll on the page is produced by the 720px video, which is a
fixed-dimension medium covered by the exception. Per the Understanding doc, this scenario passes: a
page-level horizontal scrollbar due to excepted media is permitted when all non-excepted content reflows.
The video would ideally get `max-width:100%`, but its absence is a UX nit, not a Reflow failure.

## Why automated tools miss it
A scanner can detect a page-level horizontal scrollbar but cannot determine its CAUSE or whether it is
permitted. Flagging "horizontal scrollbar present" would be a false positive here. Tools have no model of
"this scrollbar is owed entirely to an excepted fixed-dimension video, and every other section reflows."
Confirming the PASS — like confirming a FAIL — requires the human judgment that the only 2D scroll comes
from excepted media. Nothing is missing in the markup (the video has an accessible name; a transcript is
promised).

## Expected ACT-style outcome
**passed** (SC 1.4.10). The page-level scrollbar is caused solely by an excepted video; all non-excepted
content reflows.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Pass: A video player without a max-width: 100% CSS property causes it to remain full-sized at smaller (zoomed in) viewports. The rest of the page content reflows within 320 CSS pixel wide container. So, while there is a large horizontal scrollbar at the page level, it is due to the video player which has a reflow exception."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Reflow does not prohibit web pages from presenting both horizontal and vertical scrollbars for individual sections of content. Nor does it disallow the use of bidirectional scrollbars at the page (viewport) level in order to support the viewing of excepted content, so long as the non-excepted content only needs scrolling in one direction."

**Reference:** EN 301 549 Annex C — C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.4.10 Reflow. (Do not need to meet or test)"
