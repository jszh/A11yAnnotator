# case-02 — Type-foundry specimen of an unlicensed-for-web typeface (genuine font-representation exception, PASS)

## Scenario
A type foundry ("Atelier Foundry") publishes a retail specimen page for a new display
typeface, "Brume Display," which the visitor does not have installed and which the foundry
has not licensed for web embedding on this preview. The entire purpose of the page is to show
the visitor what the *letterforms themselves* look like — the high stroke contrast, the
teardrop terminals, the ffi/ffl ligatures, the swash Q/R/K — so they can decide whether to
buy. Re-typesetting the samples in the visitor's installed fallback font would show a
*different* typeface and defeat the purpose of the representation. The specimen images
therefore legitimately use the essential-presentation exception, and the page additionally
provides the same strings as live, selectable, resizable text plus an editable size-adjustable
preview.

This is the PASS twin to case-01's FAIL. The discriminator is *why* the visual presentation
is essential: here, substituting the font destroys the very thing being conveyed (and sold).

## Attribute tuple
- **Content domain:** developer/design tooling — type foundry e-commerce (font specimen)
- **UI component / pattern:** specimen sections with image + live fallback copy + editable preview slider
- **Host-language construct:** `<img>` (inline-SVG `data:` URI) of letterforms, paired with live text and a `range` control
- **Locale / i18n:** en
- **Failure mechanism:** NONE (boundary pass) — the exception genuinely applies because the appearance of the glyphs *is* the information

## Developer persona
A foundry's web developer who knows fonts well: they understand that a specimen must show the
*actual* typeface, that they cannot ship the unlicensed font file to every visitor, and that
WCAG nonetheless wants adjustable text. So they used the image only for the specimen, wrote
transcribing alts, and added a live fallback-font preview with a size slider to satisfy both
the "in addition to" note and the customizable branch.

## Element / selector carrying the issue
No issue. The relevant elements are the specimen images `section.spec img` (genuine exception)
and the companion live text `.livecopy p` / editable preview with `#sz` slider.

## Exact accessibility mechanism
Each specimen image's accessible name transcribes the sample string, so screen-reader users
learn the words. The *appearance* of the letterforms — which cannot be reproduced for users
lacking the font — is what the page communicates, so the image of text is essential and
permitted. Critically, the page does NOT trap users who need adjustable text: the same
strings appear as live, selectable, resizable HTML (in a fallback font, clearly labelled),
and the "type your own preview" box is editable with a working font-size slider that drives
`--preview-size`. A low-vision user can enlarge and recolour the live copy; the specimen
remains an honest depiction of the typeface.

## Expected ACT-style outcome
**passed** (SC 1.4.5). The image of text cannot be replaced by text *with the same effect*
(re-typesetting would show a different typeface — "would defeat the purpose of the
representation"), and equivalent adjustable text plus a customization control are provided.

## Why automated tools miss it
Exactly as with the failing twins, an automated tool sees `<img>` elements with non-empty alt
plus live text and cannot distinguish a genuine font specimen from an abused one. It cannot
reason that "this image shows the typeface being sold, and substituting the font would defeat
the representation." Confirming the exception genuinely applies — rather than rubber-stamping
or wrongly flagging — is a human judgment about whether the visual form is essential to the
meaning. Automated checkers have no concept of "essential presentation."

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "Representation of a font family ... A web page contains information about a particular font family. Substituting the font family with another font would defeat the purpose of the representation. The representation is included as a jpeg image which does not allow the text characteristics to be changed. The image has a text alternative."

**Reference:** WCAG 2.2 Understanding Images of Text — note on "in addition to" (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, Evaluate Results (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "The image of text cannot be replaced with text, OR ... The image of text can be visually customized."
