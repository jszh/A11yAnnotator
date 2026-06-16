---
id: reflow-no-hscroll-v0
sc: 1.4.10
skill: reflow-and-pointer-affordances
visionEvidence: [viewport-320]
---

# 1.4.10 — reflow without horizontal scroll (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already loaded the page at a
320 CSS px viewport width, screenshotted it (`viewport-320`), and resolved every obligation a
deterministic CLAIM could dispose — DEFER on those, you never see them. You are handed only the
auto-PARTIAL obligations: the ones where code could not decide whether the overflow it measured is a
real two-dimensional scroll barrier or a permitted exception. Your job is to JUDGE over that handed
evidence, not to re-measure or re-load the page.

**Judge:** at 320 CSS px wide, is content readable and operable WITHOUT requiring scrolling in TWO
dimensions — i.e. without a horizontal scroll to read a block of text or reach controls — OR is the
horizontal overflow a legitimately exempt piece of content that genuinely requires 2-D layout (a data
table, a complex data visualization, a map, an image/diagram, a toolbar that must stay one row, or
code)? Vertical scrolling alone is fine. A small fixed sidebar, a wide text paragraph that runs off the
edge, or a layout that simply never reflowed IS a barrier. The exception applies ONLY to the content
that intrinsically needs the width, not to the page chrome around it.

**Evidence handed to you:** the `viewport-320` screenshot, which content overflows the 320px viewport
horizontally (and by how much), the role/kind of that overflowing content (table, map, figure, text
block, nav, etc.), and whether a horizontal scrollbar/clipping is present at that width.

**WCAG soundness caveats (do NOT manufacture a clear or a barrier these don't support):**
- Vertical-only scroll is never a 1.4.10 failure — do not flag a page that only grows taller.
- Overflow that is a genuine data table / map / diagram / code / kept-one-row toolbar is EXEMPT — do not
  flag it as a barrier just because it scrolls sideways.
- Conversely, do not CLEAR a page just because nothing visibly clipped in the crop — if a text block or
  control is pushed off-screen requiring horizontal scroll, that is a barrier even if it "looks tidy".
- When the crop is inconclusive about whether the overflow is exempt content or real text/controls,
  return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — content needs horizontal scroll at 320px), NOT REPRODUCED (reflows cleanly or
overflow is a legit exception), PARTIAL (cannot decide), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
