# case-03 — Appointment-card carousel: one card's `<pre>` medication schedule won't wrap and overflows 320px

## Scenario
A patient portal, "MyCare", shows "Upcoming Visits" as a horizontally-scrolling row of
appointment cards. The STRIP scroll is the intended carousel navigation; every card is
`width:300px` and reads top-to-bottom. The "Medication Review" card embeds the patient's
current medication schedule in a `<pre>` block so the columns line up. `<pre>` uses
`white-space:pre`, so its lines do not wrap, and the longest line ("Metoprolol succ. ER 50 mg
08:00, 20:00 take with food") is far wider than 320px. That single panel therefore needs an
in-panel horizontal scrollbar to read the schedule, while every other panel fits.

## Attribute tuple
- **Content domain:** healthcare / patient portal (EHR)
- **UI component / pattern:** appointment-card horizontal scroller (carousel of visit panels)
- **Host-language construct:** `overflow-x:auto` flex strip; cards `width:300px`; rogue card
  contains `pre.schedule` (default `white-space:pre`, lines do not wrap) with `overflow-x:auto`
- **Locale / i18n:** en
- **Failure mechanism:** one panel holds a non-wrapping preformatted block whose lines exceed
  320 CSS px, requiring within-panel horizontal scrolling — and whose layout does NOT carry
  essential 2D meaning (so the Reflow exception does not apply)

## Developer persona
An EHR vendor's developer needed to show a tidy two-column med list inside an appointment card.
Reaching for the quickest aligned layout, they pasted the schedule into a `<pre>` block (copied
from the clinical notes view, which renders monospace) instead of building a responsive
definition-list or stacked label/value rows. On a desktop the `<pre>` fit inside the card, so
it shipped. The med list's meaning survives wrapping into label/value pairs — it is not code or
ASCII art — so the preformatting was avoidable.

## Element / selector carrying the issue
`section.visit pre.schedule` inside the second card ("Medication Review"). Its widest line is
~430px and does not wrap (`white-space:pre`), exceeding the 300px panel and the 320px viewport.
The three other appointment panels contain only reflowing text and conform.

## Exact accessibility mechanism
The carousel STRIP scroll is allowed navigation between visits. The failure is per-panel: at a
320 CSS px viewport, the `<pre>` schedule's longest lines extend well past the panel and the
viewport, so a low-vision user at ~400% zoom must scroll horizontally within that one panel to
read the dose times and notes. Crucially, this `<pre>` does NOT meet the Reflow exception for
content "that requires two-dimensional layout for understanding": it is a simple
drug/dose/time/notes list whose meaning is preserved when reflowed into stacked label/value
pairs (unlike Python indentation or ASCII art, which the Understanding doc cites as genuine
exceptions). So the over-wide preformatted block is a real within-panel reflow failure, not an
excepted section.

## Expected ACT-style outcome
**failed** (SC 1.4.10). One panel of the horizontally-scrolling carousel contains a
non-wrapping preformatted block that does not fit 320 CSS px and whose layout is not essential,
so the panel requires two-dimensional scrolling to read.

## Why automated tools miss it
The `<pre>` is valid markup, the text is readable, headings nest — axe/WAVE/Lighthouse report
nothing. Reflow at 320px is a rendered measurement static tools do not perform. Even an
overflow detector would flag the allowed strip scroll and, on hitting the `<pre>`, could not
decide the load-bearing question: does this preformatted layout carry essential meaning (Reflow
exception, pass) or is it over-wide content that should wrap (fail)? That meaning judgment —
is the 2D layout necessary? — is exactly what WCAG assigns to a human evaluator.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Examples → "Preformatted text conveys meaning" (`wcag-understanding/reflow.html`)
> "The presentation of text where the layout has specific meaning, such as code indentation for Python or \"ascii art\" as just two examples, would lose meaning if the layout were not presented correctly. This success criterion does not apply where that meaning would be lost. However, this is not the case for most other instances of text where text wrapping can be applied without loss of meaning."

**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."

**Reference:** WCAG 2.2 Understanding — Reflow, Intent (`wcag-understanding/reflow.html`)
> "When lines of text extend beyond the edge of a viewport, users will be forced to scroll back-and-forth to read line by line. This can cause them to lose their place and can significantly increase both physical and cognitive effort."
