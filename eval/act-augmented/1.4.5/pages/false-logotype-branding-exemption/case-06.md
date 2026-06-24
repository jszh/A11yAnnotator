# case-06 — Footer "logo wall" of partner wordmarks (exempt) with one tile that is a legal disclaimer sentence (not exempt)

## Scenario
A charity's footer shows a "Our supporters" logo wall: six tiles in one grid, each an
inline-SVG image styled identically (same box, same muted grey, same height). Five tiles are
genuine partner-company wordmarks — "Helix Bank", "Verdant Foods", "Ardent Mobility",
"Kestrel Labs", "Northstar Media" — each an exempt logotype. The sixth tile, given the
identical logo treatment, is not a logo at all: its pixels spell a legal/financial disclaimer,
"Registered charity No. 1180992. Donations are tax deductible where the law allows." Someone
styled the disclaimer to blend into the partner strip, but it is informational legal text — not
a brand name — that must be live so a donor can enlarge, recolour, or copy the registration
number. One tile of substantive text wears the logo costume.

## Attribute tuple
- **Content domain:** nonprofit / donation site
- **UI component / pattern:** footer partner/supporter "logo wall" (grid of brand marks)
- **Host-language construct:** six `<img>` with inline-SVG `data:` URIs; the FAIL one's `alt` reproduces a two-line disclaimer
- **Locale / i18n:** en
- **Failure mechanism:** a legal disclaimer sentence rendered as an image and styled to pass as a partner logo within a wall of legitimate logos

## Developer persona
A volunteer web maintainer built the supporter wall by pasting in partner logo files. When the
trustees later required a registration-number/tax disclaimer in the footer, the maintainer
matched the print collateral by exporting the disclaimer as the same kind of grey graphic and
slotting it into the logo grid so "the footer stays tidy and consistent." They added accurate
alt text and assumed that, sitting among logos, it was covered by the same logo allowance.

## Element / selector carrying the issue
`footer .logo-wall img[alt^="Registered charity No. 1180992"]` — the sixth tile; its
disclaimer text exists only as SVG glyphs. The five sibling tiles are exempt wordmarks.

## Exact accessibility mechanism
The disclaimer image's `alt` reproduces its two lines, so the words reach a screen reader
(1.1.1 satisfied) — isolating this to 1.4.5. The harm is visual and interactive: the
registration number "1180992" is rasterised glyphs at a fixed small size, so a low-vision donor
cannot enlarge it without pixelation, cannot recolour it for contrast, and cannot select/copy
the number to verify or cite the charity. The logotype/branding exemption covers marks whose
presentation is essential to a brand identity; a charity-registration disclaimer's information
is fully expressible as styled live text, so text must be used. The five wordmarks legitimately
invoke the exemption; the disclaimer does not.

## Expected ACT-style outcome
**failed** (SC 1.4.5), driven by the disclaimer tile. The five partner-wordmark images
considered alone are **passed/inapplicable** under the logotype exemption.

## Why automated tools miss it
All six tiles are `<img>` with correct non-empty `alt`, so axe/WAVE/Lighthouse `image-alt`
passes for every one and there is no missing-text-alternative finding. No automated tool OCRs
the tiles to separate five brand wordmarks from one disclaimer sentence, and none can reason
that a charity-registration statement is informational rather than branding. Spotting the one
informational tile hiding in a wall of legitimate logos is a human semantic/visual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc."

**Reference:** WCAG 2.2 Understanding — Images of Text, "A logo containing text" example
(`wcag-understanding/images-of-text.html`)
> "The logo contains logotype (text as part, or all, of the logo). The visual presentation of the text is essential to the identity of the logo ..."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1a
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Logotypes (text that is part of a logo or brand name) cannot be replaced by text."
