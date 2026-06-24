# case-03 — German legal terms page: a 58-letter compound noun with word-break:keep-all overflows 320px

## Scenario
A German legal-protection insurer (Bodensee Rechtsschutz AG) publishes its policy terms
(`lang="de"`). The page is a fluid serif document; German prose has normal spaces and reflows
fine at 320 CSS px. The defect is one genuine German compound noun — a "Bandwurmwort" naming a
fictional-but-grammatical authority,
`Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft` (the classic
long-German-word example, 79 chars) — printed as a defined term. The author put
`word-break:keep-all; overflow-wrap:normal; hyphens:none` on defined terms so terms are never
split in the PDF export. For ordinary words that is harmless, but for this single compound it
suppresses every break opportunity, so the one word is 716px wide and forces a page-level
horizontal scrollbar at 320px (probed: document 755px vs 320px; neutralizing only `span.defterm`
returns the page to exactly 320px).

## Attribute tuple
- **Content domain:** legal / insurance terms & conditions
- **UI component / pattern:** definition / "Begriffsbestimmungen" clause with a styled defined term
- **Host-language construct:** `<span class="defterm" style="word-break:keep-all; overflow-wrap:normal; hyphens:none">` in serif body prose
- **Locale / i18n:** German (`lang="de"`) — a real i18n cause: German genuinely forms single words with no internal spaces
- **Failure mechanism:** an unbreakable **compound word** (not a URL/token) with all wrap/hyphenation actively disabled → horizontal overflow at 320px

## Developer persona
An agency themed a generic legal-terms template. A reviewer complained that German hyphenation
broke a brand term awkwardly in the printed PDF, so the dev globally set
`word-break:keep-all; hyphens:none` on `.defterm` to "never split a defined term." They tested
only the desktop/print layout. The compound noun, copied verbatim from the client's filing,
then overflows the 320px zoom view because the very rule meant to protect short terms forbids the
hyphenation/wrap that long German compounds rely on.

## Element / selector carrying the issue
`span.defterm` containing
`Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft`, inside the
`.klausel` "4.1 Begriffsbestimmungen" block.

## Exact accessibility mechanism
For a low-vision German reader at 400% zoom, the policy paragraphs reflow into the narrow column,
but the defined-term word runs far off the right edge and drags a page-level horizontal scrollbar
with it. They must scroll left-right to read the term and cannot be sure no other content is
hidden off-screen. German is precisely the case Reflow contemplates: long compounds have no space
to break at, so the language relies on either soft hyphenation or `overflow-wrap`. By setting
`keep-all` + `hyphens:none` + `overflow-wrap:normal`, the author removed every escape. The fix is
to allow hyphenation/`overflow-wrap:anywhere` at narrow widths (C33), or insert soft hyphens —
neither of which alters the word's meaning. Screen-reader users are unaffected (the word is
spoken in full).

## Expected ACT-style outcome
**failed** (SC 1.4.10). The compound word is non-excepted text content that cannot be displayed at
320 CSS px without horizontal scrolling because all break opportunities are suppressed; no
two-dimensional-layout exception applies to a single word of running text.

## Why automated tools miss it
ACT `b4f0c3` passes (zoom allowed). The word is valid text; no markup linter objects. Automated
tools do not render at 320px, do not measure whether a single token overflows, and have no model
of German morphology to know `word-break:keep-all` on a 79-letter compound is fatal where it is
harmless on a 6-letter term. Recognizing that *this specific word in this specific language with
these specific CSS rules* overflows — versus the identical CSS being fine elsewhere on the page —
needs rendering plus linguistic/visual judgment a human supplies.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Basic text reflow (`wcag-understanding/reflow.html`)
> "By default, a long line of text will wrap to fit within the available viewport. For text written in left-to-right (LTR) and right-to-left (RTL) horizontal languages, it will wrap within the width of the viewport."

**Reference:** WCAG Technique C33 — Description (`wcag-techniques/css/C33.html`)
> "Long sets of characters without a space, such as URLs shown as content, can break reflow when the page is zoomed."
