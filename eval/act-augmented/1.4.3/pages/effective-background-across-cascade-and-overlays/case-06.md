# case-06 — Boundary PASS: off-white menu text on a strong dark scrim composited over a bright photo

## Scenario
A restaurant site ("Tide & Pine") has a hero whose background is a CSS multiple-background: a
**strong** dark scrim `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72))` layered over the
same bright beach photo used in case-02. The menu text element (`.menu`) has **no background of
its own** (transparent) and an off-white color (`#f2f2f2`). Because the 72%-black scrim is
applied uniformly across the whole band, even the photo's brightest region (the sun) resolves to
a dark backdrop (~`#474744`), so `#f2f2f2` against it is ~8.3:1 — a genuine, comfortable PASS.

This is the **boundary / passed** variant: it shares the exact structure that makes the failing
cases tool-opaque (transparent text element, no single solid background, a scrim composited over
a photo), but here the effective composited backdrop is dark enough that the text passes. It
sharpens the aspect: the verdict turns on the *composite*, not on the photo, the scrim alone, or
a white-canvas assumption.

## Attribute tuple
- **content-domain:** restaurant / hospitality (seasonal menu)
- **UI-component/pattern:** centered hero menu over a scrim-over-photo background
- **host-language construct:** `background: linear-gradient(rgba(0,0,0,.72) …), url(photo)` on the hero; transparent `.menu` with off-white text
- **locale/i18n:** en-US (with accented menu copy: crème fraîche)
- **failure-mechanism:** none — control case; the strong scrim makes the worst-case composite dark, so least-contrast still clears 4.5:1
- **diversity-seed:** same Squarespace "dark-overlay caption" family as the failing cases, here tuned correctly

## Developer persona
An agency designer themed this from the *same* dark-overlay hero block that produced the
case-02 failure — but this client wanted "moody and dark," so the designer cranked the scrim to
72% black across the whole hero instead of a light frosted wash. The result is a backdrop dark
enough to carry off-white text everywhere, including over the sun. It is the right way to do what
case-02 got wrong.

## Element / selector carrying the issue
`.menu`, `.menu h1`, `.menu .course`, `.menu .desc` — off-white text on the transparent menu
element, whose effective backdrop is the dark-scrim-over-photo composite. (No failure; included
to anchor the pass boundary.)

## Exact accessibility mechanism
A low-vision sighted user reads the menu — "Charred leek & smoked trout", "Cedar-roasted halibut"
— comfortably: off-white on the dark composite is ~8.3:1 even at the brightest (sun) region
behind the glyphs, well above 4.5:1. The structure is identical to the failing cases (transparent
text element, scrim over a photo, no single solid background a tool can read), but compositing the
strong scrim over the worst-case photo region yields a dark backdrop, so the least-contrast
judgment clears the threshold.

## Expected ACT-style outcome
**passed** — SC 1.4.3 (Contrast (Minimum), Level AA). The text's contrast against its true
composited backdrop is ~8.3:1 (≥ 4.5:1) across the worst-case region.

## Why automated tools miss it (i.e., get the PASS wrong)
A naive checker mis-handles even this *correct* page. The `.menu` element has a transparent
background, so a CSSOM walker finds no opaque background; many tools then fall back to a **white**
canvas and report off-white-on-white as a contrast **failure** (a false positive), while others
cannot reduce the `.hero` multiple-background to one color and **skip** the node. Both are wrong.
The real backdrop is `rgba(0,0,0,0.72)` composited over the brightest photo region (~`#474744`),
which a tool would have to rasterize and sample to confirm the pass. Reaching the correct
*passed* verdict requires the same human visual/structural composite judgment the failing cases
need — demonstrating the aspect is about computing the effective backdrop, not about the
presence/absence of a declared color.

## Citation
> **Reference:** WCAG Technique G18 — "Ensuring that a contrast ratio of at least 4.5:1 exists
> between text (and images of text) and background behind the text"
> (`wcag-techniques/general/G18.html`)
>
> **Quote (verbatim):** "The objective of this technique is to make sure that users can read text
> that is presented over a background. For Success Criterion 1.4.3, this technique describes the
> minimum contrast ratio for text that is less than 18 point (if not bold) and less than 14 point
> (if bold)."
>
> **Reference:** WCAG Technique F83 (`wcag-techniques/failures/F83.html`)
>
> **Quote (verbatim):** "First do a quick check to see if the contrast between the text and the
> area of the image that is darkest (for dark text) or lightest (for light text) meets or exceeds
> that required by the Success Criterion (1.4.3 Contrast (Minimum) or 1.4.6 Contrast (Enhanced)).
> If the contrast meets or exceeds the specified contrast, then there is no failure."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If text is not selectable or appears on a background image, determine
> the contrast using the **Colour Contrast Analyser (CCA)**."
