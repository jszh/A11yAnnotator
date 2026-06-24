# case-04 — image-of-text headline at 3.54:1 that LOOKS large but measures 15.75pt (normal): FAILS AA at 4.5:1, and no tool can size or sample it

## Scenario
Riverside Library's monthly newsletter is a CMS / HTML-email layout. The marketing team baked the
masthead headline "Summer Reading Begins" into a flat banner with their image tool and dropped it
in as an `<img>` — so the headline is an **image of text**, not live DOM text. The glyph colour in
the image is `#888888` on a `#ffffff` canvas = **3.5449:1**, and the glyphs are drawn at
`font-size: 21` in an SVG shown at its intrinsic 1:1 size, so they render ~21px tall = **15.75pt**
by the user-agent metric (`1pt = 1.333px`). 15.75pt at normal weight is **below** the 18pt
large-scale boundary, so it is **normal-scale** text and the **4.5:1** threshold applies.
3.5449:1 < 4.5:1, so the correct 1.4.3 (AA) verdict is **FAIL**. The trap: the banner *looks* like
a big display headline, so a reviewer who eyeballs it as "large text" applies the relaxed **3:1**
and 3.54:1 wrongly "passes." Telling the two apart requires a human to recognise it is an image of
text, eyedropper the actual glyph/canvas pixels, and **measure the glyph height** to classify it as
normal-scale — none of which an automated contrast tool does for text inside an image.

## Attribute tuple + developer persona
- **content-domain:** public library / municipal newsletter
- **UI-component/pattern:** masthead headline baked into an image (HTML-email / CMS "image of text" banner)
- **host-language construct:** `<img alt="Summer Reading Begins" src="data:image/svg+xml,…">` — the
  headline glyphs (`#888888` on `#ffffff`, `font-size:21`) live inside the image; all live DOM text
  on the page is dark-on-white and well above 4.5:1
- **locale/i18n:** en-US
- **failure-mechanism:** image-of-text where the size determination flips the threshold — the glyph
  measures 15.75pt (normal → 4.5:1), not large-scale, so 3.54:1 fails; a "it's a big banner → 3:1"
  shortcut wrongly passes it
- **developer persona:** A marketing coordinator who exports headline banners from a design tool and
  pastes them into the newsletter CMS. They picked a soft brand grey that "looks like a heading,"
  assume large display text only needs 3:1, and never realise (a) the exported glyphs are only ~21px
  / 15.75pt — normal-scale — nor (b) that no contrast scanner inspects the colour or size of text
  baked into an image.

## Element / selector carrying the issue
- FAILS (element under test): `.masthead img` — an image of text. Sampled glyph pixels `#888888`
  on canvas `#ffffff` = **3.5449:1**; rendered glyph em ~21px = **15.75pt**, weight 400. Normal-scale
  (15.75pt < 18pt) → **4.5:1** applies → 3.5449:1 < 4.5:1 → **FAIL**.
- Controls (all PASS): `.kicker`, `.body`, `h2`, `.pick .ttl`, `.pick .by` are live DOM text in
  `#1b1b1b` on white, well above 4.5:1.

## Exact accessibility mechanism
For the ~20/40-acuity reader 1.4.3 targets, the relaxed 3:1 is granted only to genuinely *large*
text; normal-size text needs the full 4.5:1. The point size must be obtained the way a user agent
would: the rendered glyph em is ~21px, and `21px ÷ 1.333 = 15.75pt`, which is under the 18pt
large-scale boundary, so this is normal text governed by 4.5:1. Because the headline is an **image
of text**, an automated contrast checker (which samples DOM text-node colours via the CSSOM) reads
nothing — it cannot pick the foreground/background colours of glyphs inside an image, and it cannot
measure the glyph height to classify the scale. A human must instead identify the image of text,
eyedropper the least-contrast glyph and adjacent canvas pixels (`#888888` / `#ffffff` = 3.5449:1),
and measure the glyph to confirm 15.75pt (normal) before applying 4.5:1. A reviewer who assumes
"banner headline ⇒ large text ⇒ 3:1," or who never samples the image at all, turns a real FAIL into
a false pass.

## Expected outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The headline is an image of text whose glyphs
measure 15.75pt (normal-scale, weight 400) at 3.5449:1 against the image canvas. Normal text requires
4.5:1; 3.5449:1 does not meet it. The relaxed 3:1 would apply only if the text were large-scale
(≥18pt, or ≥14pt bold), which a measurement of the glyph shows it is not.

## Why automated tools miss it
Verified empirically with Puppeteer + axe-core 4.12.1: the `color-contrast` rule reports **0
violations and 0 incomplete** for the masthead, and a full axe run surfaces no 1.4.3 finding at all.
axe inspects DOM text nodes through the CSSOM; it never descends into the pixels of an `<img>`, so it
can neither read the glyph colour (`#888888` on `#ffffff` = 3.5449:1, confirmed by sampling the
rendered image pixels) nor measure the glyph size to decide whether the relaxed 3:1 or the strict
4.5:1 applies. This mirrors the Trusted Tester process exactly: ANDI's automated contrast pass cannot
evaluate text inside an image, and TT has no tool to measure text size inside an image either — both
the colour sampling and the large-scale determination are pushed onto a human with the Colour Contrast
Analyser. (An ACT/AAA-oriented evaluation that *did* attempt this text would in any case demand the
stricter 4.5:1 for non-large text, the same threshold the AA criterion requires here.)

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "18 point text or 14 point bold text is judged to be large enough to require
> a lower contrast ratio."
>
> **Quote (verbatim):** "The ratio between sizes in points and CSS pixels is `1pt = 1.333px`,
> therefore `14pt` and `18pt` are equivalent to approximately `18.5px` and `24px`."
>
> **Reference:** Trusted Tester SC 1.4.3 process, Test 13.C
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the page contains an image of text alone (or an image with text and no
> other significant content), test the image of text with CCA (ANDI: color contrast cannot detect
> text inside images)."
>
> **Quote (verbatim):** "if the text in the image is large-scale (≥18pt or 14pt bold), **3:1**
> applies. TT has not identified a tool to compare text size in images, so this determination is not
> in the process — but use 3:1 if it can be satisfactorily demonstrated the text is large-scale."
