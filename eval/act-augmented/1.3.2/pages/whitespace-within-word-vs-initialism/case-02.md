# case-02 — Japanese vertical row header "東<br>京<br>都" changes the kanji reading

## Scenario
A logistics dashboard shows a quarterly shipment table whose row headers are prefecture names
rendered as vertical text: 東京都, 大阪府, 京都府. The author created the vertical look by putting a
`<br>` between every kanji (`東<br>京<br>都`). Visually it is the correct prefecture name. But
for a Japanese screen reader the line break splits the single word 東京都 (Tokyo-to) into three
isolated characters, so each kanji is read with a different (wrong) reading — 東 as "Higashi",
京 as "Kyo", 都 as "Miyako" — giving "Higashi Kyo Miyako" instead of "Tokyo-to". The same word
appears correctly as one token (東京都) in the summary prose below the table.

## Attribute tuple
- **Content domain:** SaaS analytics / logistics dashboard
- **UI component / pattern:** data `<table>` with `scope="row"` header cells
- **Host-language construct:** `<th scope="row">` whose text is interrupted by `<br>` line breaks
- **Locale / i18n:** ja (CJK; reading-meaning shift, not space-count)
- **Failure mechanism:** line-break white-space characters inserted within a word, changing its interpretation (F32 vertical-text example)

## Developer persona
A back-end engineer localized an internal report to Japanese and wanted the narrow row headers
to read top-to-bottom like print tables. Not knowing CSS `writing-mode: vertical-rl`, they
inserted `<br>` between each character — it looked right in the browser, the table validated,
and they shipped. They never heard it through a Japanese screen reader.

## Element / selector carrying the issue
`table th[scope="row"]` — e.g. the first row header `東<br>京<br>都`. The correct-rendering
control is the prose token `東京都` inside `.summary` (`<strong>` in the first summary
paragraph), which has no internal breaks.

## Exact accessibility mechanism
A `<br>` is a forced line break that, for AT text extraction, terminates the run; the header's
accessible text becomes three separate character nodes rather than the lexeme 東京都. Japanese
kanji are polyphonic: in isolation 東 defaults to "Higashi", 京 to "Kyo", 都 to "Miyako", but
as the compound 東京都 they read "Tō-kyō-to". Breaking the word forces the wrong reading, which
changes meaning — exactly F32's CJK case. The summary's 東京都 is one uninterrupted node and
reads correctly, proving the failure is the spacing, not the characters.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The vertical row headers fail F32 (line-break characters within a word
change its interpretation). Table semantics themselves are valid, so the only defect is the
intra-word breaks.

## Why automated tools miss it
The table passes every structural rule (scoped headers, caption, `lang="ja"`, no empty cells),
so axe/WAVE/Lighthouse report nothing. No automated rule extracts CJK text, segments it into
words, and checks whether `<br>`-induced splits alter on'yomi/kun'yomi readings. Detecting the
"Higashi Kyo Miyako" mis-reading requires reading Japanese and knowing that the compound reading
differs from the isolated-character readings — a language-specific human judgement.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "In Japanese, Han characters (kanji) may have multiple readings that mean very different things. In this example, the word is read incorrectly because screen readers may not recognize these characters as a word because of the white space between the characters. The characters mean \"Tokyo,\" but screen readers say \"Higashi Kyo\"."

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "However screen readers are not able to read the words in vertical text correctly because the line breaks occur within the word. In the following example, \"東京都\"(Tokyo-to) will be read \"Higashi Kyo Miyako\"."
