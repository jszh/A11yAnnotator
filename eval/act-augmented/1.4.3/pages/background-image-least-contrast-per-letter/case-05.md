# case-05 — News hero with a text-shadow that rescues the dark third but not the bright third

## Scenario
A newspaper lead-story hero (The Meridian Dispatch). The large white headline carries a
text-shadow — the common "make hero text readable over any photo" trick. The cityscape background
image is a dark stormy left third (where white + shadow reads, ~10–14:1) ramping to a blown-out
overcast sky on the right two-thirds. Over the bright sky the least-contrast pixel — the flat
bright sky immediately inside the thin glyph strokes — is ~1:1, so the right-hand words fail
*per-letter* even though the shadow makes them look outlined.

## Attribute tuple
- **content-domain:** news / long-form editorial (newspaper hero)
- **UI-component/pattern:** lead-story hero with kicker + large headline + byline, all with text-shadow
- **host-language construct:** CSS `background-image` (local PNG cityscape) + `text-shadow` on the `<h1>`
- **locale/i18n:** en-US
- **failure-mechanism:** F83 background-image least-contrast where `text-shadow` is mistaken for a contrast fix — the shadow darkens only a 1–2px glyph-edge halo, not the stroke interior, which still sits on bright sky

## Developer persona
A front-end dev on the news desk added `text-shadow: 0 1px 2px rgba(0,0,0,.85)` to every hero
headline after an editor complained that one photo's title was hard to read. The shadow fixed
that dark photo and "looked crisp" on the others, so it became the house rule. Nobody realised
the shadow only outlines the glyph edge; over a bright sky the interior of each stroke is still
white-on-white.

## Element / selector carrying the issue
`.hero h1` (with `text-shadow`) — the failing glyphs are the words over the bright sky, e.g.
**Bright** and **Storm Front**, whose stroke interiors sit on the blown-out part of the cityscape.

## Exact accessibility mechanism
The headline is real DOM text (`color:#fff`, plus `text-shadow`) over a `background-image`.
WCAG contrast is computed from the foreground/background colours, not the shadow; sampling the
rendered background pixels behind the words:
- behind **Bright**: worst-case contrast **3.75:1** — below 4.5:1.
- behind **Storm Front**: worst-case contrast **4.24:1** — below 4.5:1.
- behind **Skyline** (over the dark left): worst-case **14.56:1** — passes.
- best-case pixel across the headline: **~18:1**.

The text-shadow adds a thin dark halo at the glyph edge, so the words *look* outlined, but the
least-contrast pixel — the bright sky inside a thin stroke — is still ~1:1 for white. A low-vision
reader sees ghost-outlined words they cannot fill in. ACT samples the best-case pixel (~18:1) and
passes; it does not model text-shadow at all, and the per-letter least-contrast check on the
bright-side words finds them below 4.5:1.

## Expected ACT-style outcome
**failed** — F83 applies. Quickcheck against the lightest sky pixel behind the white text fails
on the right, and the per-letter check shows the bright-side words below 4.5:1. The shadow does
not raise the least-contrast interior pixel to threshold.

## Why automated tools miss it
Three compounding reasons: (1) scanners cannot read the cityscape raster and fall back to the
solid `#1a2230` (~15:1, "pass"); (2) their contrast model ignores `text-shadow` entirely, so they
would not even attempt to credit or discount it; (3) they have no per-region/per-letter
worst-case pixel concept. Judging that the shadow outlines but does not raise the least-contrast
interior pixel over the bright sky is a visual, per-letter determination.

## Citation
> **WCAG Technique F83** (`wcag-techniques/failures/F83.html`):
> "When there is not sufficient contrast between the background image and the text, features of
> the background image can be confused with the text making it difficult to accurately read the
> text."

> **WCAG 2.2 Understanding 1.4.3** (`wcag-understanding/contrast-minimum.html`):
> "Because authors do not have control over user settings for font smoothing/anti-aliasing, when
> evaluating this Success Criterion, refer to the foreground and background colors obtained from
> the user agent, or the underlying markup and stylesheets, rather than the text as presented on
> screen."
