# case-04 — Editorial pull-quote rendered as an image of text via CSS ::before generated content

## Scenario
A long-form article in "The Meridian Review" features a large italic pull-quote
("We stopped designing streets for cars and started designing them for the people who actually
live here."). The quote is **not** live text and **not** an `<img>`: it is painted by a CSS
`::before` pseudo-element whose `content:""` box carries a `background-image` SVG of the quote
glyphs. The quote words exist nowhere in the DOM — only a `<figcaption>` attribution
("— Lena Voss…") is real text. This is the canonical WCAG "A quote" example (italicized,
indented, styled text), implemented as an image of text rather than as live HTML+CSS.

## Attribute tuple
- **Content domain:** news / long-form editorial (urban affairs)
- **UI component / pattern:** article pull-quote `<figure>` with `<figcaption>`
- **Host-language construct:** `figure.pullquote::before { content:""; background-image:url(data:image/svg+xml...) }` (image of text in generated content)
- **Locale / i18n:** en
- **Failure mechanism:** image-of-text delivered through a `::before` pseudo-element — no `<img>`, no alt, quote words absent from the DOM

## Developer persona
The newsroom's design lead wanted pull-quotes to use a specific licensed display face that the
CMS body font didn't include. A developer built a "pull-quote component" that rendered the
chosen quote to an SVG at publish time and injected it via `::before`, reasoning that
generated content is "decorative" and that the article body already carried the gist. The
component passed the team's axe CI run with zero violations, so it shipped.

## Element / selector carrying the issue
`figure.pullquote::before` — its `background-image` SVG contains the three `<text>` lines of
the quotation. (The `<figcaption>` attribution is live text and is not the issue.)

## Exact accessibility mechanism
A sighted reader sees a prominent green italic quotation. A low-vision reader who enlarges text
or applies a high-contrast user stylesheet cannot change the quote at all — generated-content
background images ignore font-size, color, and forced-colors settings and pixelate on zoom. A
screen-reader / braille user gets the figure's `aria-label` ("Pull quote from city planner Lena
Voss") and the attribution, but never the quote's words, because `::before` content is not text
and is not in the accessibility tree as text. The exact effect — italic, indented, large serif —
is the textbook achievable-in-CSS case (live `<blockquote>` + `font-style`, `text-indent`,
`font-size`). No essential/logotype exception applies to an editorial quotation. Image of text
where presentation was achievable → fail.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The pull-quote's visual presentation is achievable with the technologies
in use, yet it is delivered as an image of text and is neither customizable nor essential.

## Why automated tools miss it
There is no `<img>`, so image-alt rules never fire. The text lives in a `::before`
`background-image`, which axe-core, WAVE, and Lighthouse do not rasterize or OCR — they cannot
read generated-content pixels, and they have no rule for "this pseudo-element is an image of
text". The `<figure>` has a name and the article has ample real text, so nothing looks empty.
Detecting that the styled quotation is an image of text, and judging that the italic/indented
look was achievable as live HTML+CSS, is exactly the human reasoning WCAG describes in its
"A quote" example.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, Examples → A quote (`wcag-understanding/images-of-text.html`)
> "A web page contains a quote. The quote itself is presented as italicized text, indented from the left margin. ... CSS is used to position the text; set the spacing between lines; as well as display the text's font family, size, color and decoration."

**Reference:** WCAG Technique C22 — Using CSS to control visual presentation of text (`wcag-techniques/css/C22.html`)
> "The `::before` and `::after` pseudo-elements can be used to insert decorative non-text content before or after blocks of text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, Evaluate Results (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "The image of text cannot be replaced with text, OR ... The image of text can be visually customized."
