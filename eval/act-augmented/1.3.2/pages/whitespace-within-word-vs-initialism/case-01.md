# case-01 — Tracked-out hero "W E L C O M E" (&nbsp;) vs. CSS-spaced "FAQ" initialism

## Scenario
A boutique yoga studio's landing page has a calm hero band whose headline reads, visually,
`W E L C O M E` in wide-tracked uppercase. To get that look the designer typed the single
English word "Welcome" with a non-breaking space between every letter
(`W&nbsp;E&nbsp;L&nbsp;C&nbsp;O&nbsp;M&nbsp;E`). Elsewhere the primary nav has a `FAQ` link
that is *also* visually tracked-out — but correctly, with CSS `letter-spacing`, so its text
node is the single token "FAQ". Both look the same on screen; only one is an F32 failure.

## Attribute tuple
- **Content domain:** wellness / small-business marketing site (yoga studio)
- **UI component / pattern:** hero banner headline + primary `<nav>` link
- **Host-language construct:** `<h1>` text node with literal `&nbsp;` entities; sibling `<a>` styled with CSS `letter-spacing`
- **Locale / i18n:** en
- **Failure mechanism:** white space (`&nbsp;`) inserted *within* a real word to control intra-word spacing (F32), placed next to a legitimate initialism carve-out to force classification

## Developer persona
A solo founder built the site in a drag-and-drop theme. In the hero text box they could not
get the letters far enough apart with the spacing slider, so they "padded" them by holding the
space bar — which the editor stored as `&nbsp;` entities. For the FAQ link they happened to use
the theme's "letter spacing" style control instead, which emits real CSS. They never realized
the two produce different results for a screen reader.

## Element / selector carrying the issue
`header.hero h1` — its text content is `W E L C O M E`
(non-breaking spaces between letters of one word). The PASS control is `nav a.faq`
(and `main a.faq`), whose text node is the bare initialism `FAQ` with only CSS letter-spacing.

## Exact accessibility mechanism
The accessible name / reading text of the `<h1>` is the literal string with seven tokens
separated by U+00A0. A screen reader does not recognize "Welcome"; depending on the engine it
spells it letter-by-letter ("W, E, L, C, O, M, E") or reads it as fragments. The visual
"word" is destroyed in the programmatic text. By contrast the `FAQ` link's text node is a
single token; `letter-spacing` is a pure rendering property that never enters the text, so AT
reads "F A Q" / "FAQ" as the initialism — which F32 explicitly excludes as a failure.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The hero word fails F32 ("using white space characters to control
spacing within a word"). The `FAQ` link is the carve-out and passes — its presence on the same
page is what makes the classification non-trivial.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse ship no rule that scans text-node characters for intra-word
white space, and even a naive "single-letter-then-space" regex would flag *both* the hero and
the `FAQ` link — yet F32 says the initialism is NOT a failure. Telling the broken word from the
harmless initialism (and from legitimate CSS tracking) is a linguistic/semantic decision about
whether the spaced string is a real word, which no scanner makes.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "This example has white spaces within a word to space out the letters in a heading. Screen readers may read each letter individually instead of the word \"Welcome.\""

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "Inserting white space characters into an initialism is not an example of this failure, since the white space does not change the interpretation of the initialism and may make it easier to understand."
