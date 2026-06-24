# case-05 — Korean banner: CSS letter-spacing (PASS) vs literal spaces "대 한 민 국" (FAIL)

## Scenario
A Korean cultural-heritage photo-exhibition page has a hero banner whose word 대한민국 (Daehan-
minguk, "Republic of Korea") is rendered very wide. The hero does it the correct way — CSS
`letter-spacing` on an intact text node `대한민국`. Lower on the page a subheading reads
대 한 민 국 의 빛, where the same word has a literal space typed between every syllable block.
The two look almost identical, but the hero passes and the subheading fails F32: the spaces
inside the word make a Korean screen reader read four isolated syllables instead of the word.

## Attribute tuple
- **Content domain:** government / civic — national cultural-heritage exhibition microsite
- **UI component / pattern:** hero banner heading + section subheading
- **Host-language construct:** `<h1>` widened by CSS `letter-spacing` (PASS) vs `<p class="subhead">` with literal U+0020 spaces between Hangul syllables (FAIL)
- **Locale / i18n:** ko (CJK/Hangul; syllable-by-syllable mis-reading)
- **Failure mechanism:** literal white space within a word vs. the correct CSS technique — the boundary between F32 and C8-style visual spacing

## Developer persona
A junior designer at a cultural agency knew the hero should use the "letter spacing" CSS control
(a senior had set that up). But when they added the lyrical subheading later, in a hurry, they
just hit the space bar between syllables in the CMS rich-text box to "match the spread" — copying
the look, not the technique. They never realized the two paths diverge for a screen reader.

## Element / selector carrying the issue
`p.subhead` — text `대 한 민 국 의 빛` (literal spaces inside the word 대한민국). The PASS control
is `.banner h1` (`대한민국`), whose identical visual width comes from `letter-spacing` with no
spaces in the text node.

## Exact accessibility mechanism
`letter-spacing` is a pure CSS rendering property: it widens glyph advance without altering the
character stream, so the hero's accessible text stays 대한민국 and a Korean screen reader reads
the word "Daehan-minguk." The subheading instead contains U+0020 between syllables, so its text
is 대␣한␣민␣국␣…; the engine reads four separate syllables ("dae, han, min, guk"), losing the word.
This is exactly F32 — white space within a word changing its programmatic recognition — and it
sits one step from the correct technique, which is the human-judgment boundary.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The page fails because of the spaced subheading (F32). The hero is the
boundary PASS, demonstrating the correct CSS alternative on the same page.

## Why automated tools miss it
Both the hero and the subheading are valid `lang="ko"` text with no missing attributes, so
axe/WAVE/Lighthouse flag nothing. No automated rule segments Korean Hangul into words, nor
distinguishes "widened by `letter-spacing`" (fine) from "widened by literal spaces in the text"
(F32). The two render nearly identically; only reading Korean and inspecting the character stream
reveals the difference — a visual+linguistic human judgement.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "When blank characters are inserted to control letter spacing within a word, they may change the interpretation of the word or cause it not to be programmatically recognized as a single word."

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "The objective of this technique is to describe how using white space characters, such as space, tab, line break, or carriage return, to format individual words visually can be a failure to present meaningful sequences properly."
