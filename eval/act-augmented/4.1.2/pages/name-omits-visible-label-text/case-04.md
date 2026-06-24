# case-04 — Pagination "Next" link whose accessible name is an unspeakable chevron glyph

## Scenario
A literary-magazine essays index with pagination (page 2 of 9). The forward control visibly reads
**Next** followed by a decorative chevron. A developer set `aria-label="›"` (U+203A, single
right-pointing angle quotation mark) on the anchor to "clean up" the name. The accessible name is now
a lone punctuation glyph — a character a speech user cannot speak — wholly replacing the visible
word "Next".

## Attribute tuple
- **Content domain:** news / long-form editorial (literary review)
- **UI component / pattern:** pagination nav (`<nav aria-label="Essay pages">` with page links)
- **Host-language construct:** `<a>` with visible text "Next" + `aria-label` set to a glyph
- **Locale / i18n:** en
- **Failure mechanism:** `aria-label` replaces the visible word with a single symbol; divergence type = **GLYPH-ONLY / unspeakable**
- **ARIA anti-pattern (facets.json):** "icon-font or SVG glyph as the only label" applied via aria-label

## Developer persona
A designer-developer wanted the arrow to "be the label" for visual minimalism and copied the chevron
character straight into `aria-label`, assuming a screen reader would say "next". They never tested
with voice control (no word to speak) or a braille display (terse symbol).

## Element / selector carrying the issue
`a.pgbtn[aria-label]` — `<a class="pgbtn" aria-label="›">Next <span aria-hidden>›</span></a>`

## Exact accessibility mechanism
`aria-label` overrides the child text, so "Next" is suppressed. Verified in Chromium: `role=link`,
`accName="›"`. Depending on the screen reader / verbosity, U+203A is announced as a symbol name
("right single angle quotation mark"), as "greater than"-style punctuation, or skipped entirely —
never as the visible word "Next". A speech-input user has no spoken token for "›", so the control is
unreachable by voice. Name is technically non-empty (ACT rule c487ae PASSES) but conveys nothing
operable and omits the visible label.

## Expected ACT-style outcome
**failed** (F111 check #1 true, #2 true — a glyph is a non-empty name — #3 false).

## Why automated tools miss it
The name is a non-empty string, so c487ae and axe/WAVE/Lighthouse pass; none classify "is this a
single non-speakable punctuation glyph that doesn't match the visible word 'Next'?". That requires
reading the rendered "Next" and judging that "›" is neither the visible label nor a speakable name —
a human visual+linguistic judgment outside automated 4.1.2 coverage.

## Citation
> "Success Criterion 4.1.2 Name, Role, Value requires a programmatically determinable name for all
> user interface components. Names may be visible or invisible. Occasionally, the name needs to be
> visible, in which case it is identified as a label."
— WCAG Understanding, **Name, Role, Value** (`wcag-understanding/name-role-value.html`), Intent note
