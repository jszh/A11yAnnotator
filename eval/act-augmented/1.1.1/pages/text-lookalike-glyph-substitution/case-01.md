# case-01 — F71 verbatim "cook" as a marketing hero heading

## Scenario
A weeknight-recipe site ("Weeknight Skillet") runs a big centered hero headline:
**"Anyone can cook tonight."** In any font with Greek + Cyrillic coverage the middle
word renders exactly as the English word *cook*, but it is the verbatim F71 example
string — `U+03F2 U+043E U+03BF U+006B` — in which only the final `k` is a Latin letter.
The word is a plain `<span>` inside the `<h1>` with no text alternative.

## Attribute tuple
- **content-domain:** food / recipes (consumer lifestyle)
- **UI-component / pattern:** marketing hero headline (`<h1>` with an accent `<span>`)
- **host-language construct:** heading text node containing mixed-script glyphs (raw + entity mix)
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Greek + Cyrillic
- **failure-mechanism:** F71 raw confusables — meaning carried by glyph shape, no text alternative

## Developer persona
A junior front-end dev was handed a Figma comp where the designer had typed the hero word
using a "stylish" character from an online glyph picker to get a slightly different look,
then copy-pasted the comp text straight into the JSX. The build pipeline preserved the exact
code points. Nobody ran a screen reader over the hero, and the visual QA looked perfect.

## Element / selector carrying the issue
- `section.hero > h1 > span.verb` — text content decodes to `U+03F2 U+043E U+03BF U+006B`
  (visible: "cook"); no `aria-label`, no visually-hidden Latin equivalent.

## Exact accessibility mechanism (what AT experiences)
The `<h1>` is in the accessibility tree with its full text. A screen reader reads the
heading as "Anyone can " + the confusable codepoints + " tonight." The Greek lunate
sigma, Cyrillic small o, and Greek small o are not English letters, so depending on the
TTS engine and language the user hears garbled mixed-script output (or the three glyphs
are skipped), never the word "cook." The headline's promise — the entire value
proposition — is lost for a blind user, and per F71 the look-alike range has no text
alternative.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via Failure Technique **F71**. (No name-bearing graphical element
exists, so every ACT 1.1.1 rule — image-alt, role=img name, SVG name, etc. — is
*Inapplicable*; the failure is the un-alternatived look-alike text itself.)

## Why automated tools miss it
There is no `img`, `svg`, `object`, or `role="img"` on the page, so axe-core, WAVE, and
Lighthouse have nothing to evaluate for 1.1.1 and report no issue. The `<h1>` is a valid,
non-empty, high-contrast heading — an alt/label linter sees a perfectly healthy heading.
Deciding that "ϲоοk" is Latin "cook" written in confusables (rather than legitimate
Greek/Cyrillic text) requires reading the rendered glyphs against the page language and
comparing them to the actual code points — a human reading judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "The following word looks, in browsers with appropriate font support, like the English
> word "cook", yet is composed of the string `U+03f2 U+043E U+03BF U+006B`, only one of
> which is a letter from the Western alphabet. This word will not be processed
> meaningfully, and a text alternative is not provided."
