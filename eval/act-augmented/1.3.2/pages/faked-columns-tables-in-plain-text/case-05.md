# case-05 — Chords-over-lyrics chart: vertical space alignment ties each chord to a syllable (F33 variant)

## Scenario
A user-submitted guitar chord chart for the song "Harbor Lights." It uses the universal
"chords above lyrics" convention: a chord line and a lyric line alternate, and each chord is padded
with leading spaces so that — in a monospace font — it sits directly **above** the exact syllable
where the chord change happens. The musical meaning is the *vertical* spatial relationship between
the two lines: "play G on 'walked', C on 'water', G on 'lie'." There is no `<ruby>`, no table, no
data attribute — only the leading-space alignment encodes which chord goes with which word.

## Attribute tuple
- **Content domain:** music / hobbyist chord-chart sharing site
- **UI-component / pattern:** chords-over-lyrics chart (alternating chord line + lyric line) in a monospaced region
- **Host-language construct:** `<div style="white-space:pre">` monospace; chords positioned by leading spaces; `<span>` only colors them
- **Locale / i18n:** en-US
- **Failure-mechanism:** F33 variant — white-space characters create a *vertical* two-row column alignment in plain text; linearization separates each chord line from its lyric line, destroying the chord-to-syllable mapping

## Developer persona
A community contributor pasted a plaintext chord chart (the kind shared on guitar forums for
decades, formatted with the spacebar) into the site's "submit a chart" box. The platform stores it
verbatim and renders it in a monospace `<div>` with `white-space:pre`, adding a `<span class="chord">`
to color the chord rows blue. It looks exactly like every chord sheet a guitarist has ever read.

## Element / selector carrying the issue
`.chart` (the `white-space:pre` region) — specifically the alternating chord lines whose leading
spaces position each chord above a syllable in the following lyric line. The `span.chord` colors but
creates no programmatic tie.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted player reads vertically: eyes drop from each chord to the syllable directly beneath it,
  so "G" over "walked" and "C" over "water" are unambiguous.
- A screen reader reads in document (line) order: it speaks the entire chord line as a detached run
  of chord names — *"G C G"* — and then, separately, the entire lyric line — *"I walked down to the
  water where the old boats lie."* The vertical alignment that paired each chord with its syllable
  exists only as runs of spaces, which AT collapses, so the listener hears the chords stripped of the
  words they belong to and cannot reconstruct where any chord change falls. The sequence in which the
  content is linearized (all chords, then all words) destroys the meaning the 2-D layout conveyed.

Verified intent: there is no `<ruby>`/`<rt>`, no table, no `aria-*` association between chord and
syllable; the relationship is purely the rendered monospace vertical grid.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — white-space characters fake a positional grid in plain text; the linear read
order separates chords from the syllables they align over, scrambling the meaning; F33 variant).

## Why automated tools miss it
Every line is valid text and the `span.chord` only changes color/weight (it passes contrast and ARIA
checks). There is no table, list, or missing attribute to flag. axe / WAVE / Lighthouse process the
character stream and have no notion of the rendered monospace grid, so they cannot perceive that a
chord's leading spaces place it above a particular syllable, nor judge that reading the chord line
and lyric line separately severs that pairing. Recognizing the vertical alignment as meaningful and
seeing that linearization breaks it is inherently visual + semantic.

## Citation
> "Assistive technologies will interpret content in the reading order of the current language. Using
> white space characters to create multiple columns does not provide the information in a natural
> reading order."
— wcag-techniques/failures/F33.html (Description)

> "A sequence is meaningful if the order of content in the sequence cannot be changed without
> affecting its meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)

> "This success criterion may help people who rely on assistive technologies that read content aloud.
> The meaning evident in the sequencing of the information in the default presentation will be the
> same when the content is presented in spoken form."
— wcag-understanding/meaningful-sequence.html (Benefits of Meaningful Sequence)
