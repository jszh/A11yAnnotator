# case-04 — Symbolic "✕" / "‹" / "›" glyph buttons below 3:1 (FAIL) vs >3:1 (PASS)

## Scenario
A festival ticketing site's stage-photo gallery dialog. Its only controls are text-character
glyphs used as symbols: "✕" (U+2715) to close, "‹"/"›" (U+2039/U+203A) to navigate. The failing
glyphs are `#5e6b82` on the `#4a5366` bar (~1.4:1). A reference row shows the identical glyphs in
`#e9edf3` (~6.6:1), which PASS. Because these are literal characters with valid `aria-label`s, a
contrast tool typically treats them as text or skips them — missing that they are graphical
objects subject to 3:1.

## Attribute tuple
- **Content domain:** events / ticketing
- **UI component / pattern:** modal dialog + carousel/gallery navigation (APG dialog + carousel)
- **Host-language construct:** `<button>` with numeric character entities as the visible glyph; `aria-label` for the name
- **Locale / i18n:** en
- **Failure mechanism:** symbolic text characters (non-text content) presented below 3:1; tool skips them as "text"

## Developer persona
A junior dev building the gallery used "icon-free" glyph buttons — pasting `&#10005;` for close
and angle quotes for prev/next — to avoid bundling an icon font. They picked a muted slate color
(`#5e6b82`) so the controls "wouldn't fight the photos," tuning it by eye on a bright monitor.
They added `aria-label`s after an audit flagged a missing name, then assumed the buttons were
"accessible now" because the name check passed — unaware the glyph's own contrast is in scope.

## Element / selector carrying the issue
`.glyph-btn--fail` — the three glyph buttons (`✕` close, `‹` prev, `›` next) at ~1.4:1
(`#5e6b82` on `#4a5366`). The PASS reference is `.glyph-btn--pass` (same glyphs at ~6.6:1).

## Exact accessibility mechanism
The SC states that text characters used as symbols — "used for their visual appearance, rather
than expressing something in human language" — fall under the definition of non-text content and
must reach 3:1. The "✕", "‹" and "›" here are not language; they are an icon set rendered with
characters. At ~1.4:1 a low-vision user cannot perceive the Close or navigation affordances and
is trapped in the dialog visually, even though a screen reader announces the `aria-label`s
(programmatic name does not substitute for visible non-text contrast). The PASS row proves the
fix is purely contrast: identical glyphs at ~6.6:1 satisfy the SC.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The symbolic glyph buttons are graphical objects below 3:1; the PASS
reference row is the boundary variant.

## Why automated tools miss it
Contrast scanners branch on element type. A `<button>` whose content is the single character "✕"
looks like TEXT, so a tool either (a) evaluates it under the 4.5:1/3:1 *text* rule for SC 1.4.3
rather than non-text contrast, (b) ignores it as a trivial one-glyph node, or (c) marks the
control "passing" because it has an accessible name. None of these recognizes that the glyph is a
graphical object whose appearance — not its character value — carries the meaning. Classifying an
"X" as a symbol versus a letter is a meaning judgement a parser cannot perform.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "When text characters are used as symbols – used for their visual appearance, rather than \"expressing something in human language\" – they fall under the definition of non-text content."

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Even though the two buttons use text characters — an uppercase \"X\", often used for \"Close\" buttons, and a \">\" character, to act as a right-pointing arrow — they count as non-text characters/symbols. Their contrast ratio of just above 3:1 passes this success criterion."
