# case-06 — BOUNDARY (PASS): critical safety step emphasised AND given markup + a text word

## Scenario
A product maintenance guide (AquaPure HX-3 filter replacement). The one safety-critical step —
shutting off the water supply before opening the housing — is given **special status** by visual
emphasis (bold + larger), exactly the risky pattern of the failing cases. But here the author
did *both* things WCAG accepts: (1) the emphasised step uses **`<strong>`** (semantic,
programmatically-determinable emphasis per H49), not a bare CSS weight on a `<span>`; and (2) the
step is introduced by the literal word **"Important:"** in text (G117). So the special status is
both programmatically determinable and available in the text stream. This is the pass side of the
boundary: presentation **plus** a text/markup equivalent.

## Attribute tuple
- **content-domain:** consumer product / appliance maintenance instructions
- **UI-component/pattern:** ordered procedure list with one critical step
- **host-language construct:** `<strong>` (semantic emphasis) + an in-text "Important:" label
- **locale/i18n:** en
- **failure-mechanism:** none — this is the corrected form (H49 markup + G117 text equivalent),
  included as the contrast/boundary case for the aspect

## Developer persona
A technical writer who *does* know accessibility authored this guide. They wanted the critical
step to stand out, so they used `<strong>` (which conveys importance to assistive tech and also
renders bold) and added a small CSS rule for extra size — and, crucially, they began the step
with the word "Important:" so the status is spoken even if emphasis is ignored. They deliberately
avoided conveying the warning by styling alone.

## Element / selector carrying the issue (here: carrying the correct pattern)
`strong.critical` in the second list item: `<strong class="critical">Important: turn the blue
inlet valve fully clockwise to shut off the water supply…</strong>`. The status is carried by the
`<strong>` element (markup) and by the word "Important:" (text), not by presentation alone.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user reaches the second step and hears the word "Important:" as part of the text
(the text equivalent, per G117), so the special status is conveyed regardless of styling. In
addition, the content is wrapped in `<strong>`, which is programmatically determinable as strong
importance and which several screen-reader configurations can expose (e.g. NVDA "report font
attributes" / formatting, VoiceOver "bold" announcements) — satisfying H49. A braille user reads
the literal "Important:". The larger font-size is now redundant decoration on top of a status
that is already in markup and in text, so removing the styling would lose nothing. The special
status is both programmatically determinable and available in text — 1.3.1 is met.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (i.e., why this still needs a human)
Critically, an automated tool would treat this page and a *failing* bold-only page almost
identically: axe/WAVE/Lighthouse largely ignore presentation, do not score the presence of the
word "Important:", and do not reason about whether emphasis is matched by a text equivalent.
`<strong>` is not required by any automated rule, and its absence is never flagged. So a checker
cannot tell that *this* page passes (status is in markup + text) while case-01/case-05 fail
(status is in font weight only). The pass/fail verdict turns on reading whether the emphasised
meaning is ALSO carried by markup or text — the exact human judgment this aspect isolates.

## Citation
> **WCAG Techniques, G117 — example "Indicating new content with boldface and a text indicator":**
> "WCAG 2.2 is new, so is indicated in bold face. To avoid conveying information solely by
> presentation, the word "(new)" is included after it as well."

(Verbatim from `wcag-techniques/general/G117.html`. This page applies the same remedy — visual
emphasis PLUS a text indicator ("Important:") — so the special status is available in text and
the page passes.)

> **WCAG Techniques, H49 — "Using semantic markup to mark emphasized or special text":**
> "The `em` and `strong` elements are designed to indicate structural emphasis that may be
> rendered in a variety of ways (font style changes, speech inflection changes, etc.)."

(Verbatim from `wcag-techniques/html/H49.html`. The critical step uses `<strong>`, the
programmatically-determinable emphasis H49 prescribes, rather than CSS weight alone.)
