# case-04 — Editor toolbar buttons are images of the WORDS "Bold"/"Italic"/"Spell check" (symbolic-character exception misapplied, FAIL)

## Scenario
A webmail compose window has a formatting toolbar. The WCAG symbolic-characters exception
would let the buttons use images of the *symbolic* glyphs "B", "I", "ABC" — sequences that do
not express anything in human language. But this developer thought single letters were too
cryptic, so they replaced the glyphs with **full word labels** rendered as images: the button
faces are pictures reading "Bold", "Italic", "Underline", "Spell check". Those are English
words — a sequence that *does* express something in human language — so the symbolic exception
does not apply. They are ordinary label text baked into pixels and should be live text. Each
button also carries a matching `aria-label`, so a screen reader announces it correctly and
1.1.1 / 4.1.2 pass; the defect is purely 1.4.5 — the visible word labels cannot be resized or
restyled and pixelate on zoom.

## Attribute tuple
- **Content domain:** productivity / webmail client
- **UI component / pattern:** APG toolbar (`role="toolbar"`) of formatting buttons
- **Host-language construct:** `<button>` whose visible face is an `<img>` (inline-SVG `data:` URI) of a word, plus a matching `aria-label`
- **Locale / i18n:** en
- **Failure mechanism:** human-language word labels rendered as images of text, wrongly claimed under the symbolic-text-characters exception

## Developer persona
A front-end developer themed an open-source rich-text editor for a corporate webmail product.
Usability feedback said the bare "B / I" icons confused non-technical staff, so they swapped in
spelled-out labels — and, wanting pixel-perfect kerning that matched the brand font (not
installed on users' machines), they rendered each label as a small SVG image rather than live
text. They added correct `aria-label`s, saw the a11y checker go green, and shipped it, unaware
that imaging *words* (vs symbolic glyphs) reintroduces a 1.4.5 problem.

## Element / selector carrying the issue
`.toolbar button > img` — all four toolbar buttons. Each button's visible label is an image of
a full English word ("Bold", "Italic", "Underline", "Spell check"). The decorative `alt=""` on
the inner image plus the button's `aria-label` make the name correct for AT; the visible text
is the un-adjustable raster.

## Exact accessibility mechanism
The button labels are human-language words that exist only as SVG `<text>` glyphs inside
images. The accessible name comes from `aria-label` (so braille / screen-reader output is
fine), but a **sighted** low-vision user who relies on OS/browser font scaling, a larger UI
font, a dyslexia-friendly typeface, or forced-colors / high-contrast mode cannot adjust these
labels: they are fixed pixels that blur on zoom and won't recolour with the user's stylesheet.
Because "Bold" / "Italic" / "Underline" / "Spell check" express meaning in human language, they
are *not* symbolic characters, so live text could and should convey the same effect and
information. This is the avoidable-image-of-text condition 1.4.5 forbids.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The button labels are human-language text that can be replaced by live
text with the same effect; they are not symbolic glyphs, not logotypes, and not customizable,
so no exception applies. (Contrast this with the genuine PASS for "B"/"I"/"ABC" symbolic
glyphs.)

## Why automated tools miss it
Each button has a correct accessible name (`aria-label`), the inner image is correctly marked
decorative (`alt=""`), roles are valid, and contrast is fine — so axe-core / WAVE / Lighthouse
report no violations. No automated tool OCRs the button faces to discover the labels are full
words rather than symbols, and none can apply the "does this sequence express something in
human language?" test that separates an exempt symbolic glyph from a non-exempt word label.
That is precisely the human semantic judgment the symbolic-character exception requires.

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "Symbolic text characters ... Some of the buttons use text characters that do not form a sequence that expresses something in human language. For example \"B\" to increase font weight, \"I\" to italicize the text and \"ABC\" to check the spelling. The symbolic text characters are included as gif images which do not allow the text characteristics to be changed. The buttons have text alternatives."

**Reference:** WCAG 2.2 Understanding Images of Text — In brief (`wcag-understanding/images-of-text.html`)
> "What to do: Use text instead of pictures of text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."
