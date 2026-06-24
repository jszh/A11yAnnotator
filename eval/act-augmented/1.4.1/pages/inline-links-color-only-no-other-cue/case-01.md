# case-01 — Dark-mode editorial blog: inline links hue-only at ~2.5:1 link-vs-text

## Scenario
A finished long-form coffee-industry blog post ("How we cut our cold-brew steep time in
half") on a dark editorial theme. Four inline story links sit inside running prose. Body
text is near-white `#e8e8ea` on `#0e0f12`; the links are brand blue `#6f93cf` with
`text-decoration:none` and **no** weight/size/family/style difference. A sighted
colour-perceiving reader spots the blue; a grayscale or color-blind reader cannot tell the
links from prose.

## Attribute tuple
- **content-domain:** news / long-form editorial (independent coffee blog)
- **UI-component/pattern:** `<article>` body copy with inline `<a>` links (no nav chrome)
- **host-language construct:** static hand-authored HTML5 + CSS custom properties (dark theme)
- **locale/i18n:** en-US
- **failure-mechanism:** F73 — un-underlined inline links distinguished from body text by hue only, link-vs-text lightness under 3:1, no hover/focus cue at all

## Developer persona
A solo founder-blogger built the theme in a hurry by copying a "minimalist dark blog"
CSS snippet from a design-inspiration site. The snippet set `a { color: var(--accent);
text-decoration: none; }` for a "clean" look and chose the accent purely for brand vibe.
She eyeballed it on her own monitor, saw the blue clearly, and never checked it in
grayscale or against the link-vs-text contrast rule.

## Element / selector carrying the issue
`article a` (the four inline links, e.g. `a[href="/notes/grind-distribution"]`).

## Exact accessibility mechanism
Measured: link `#6f93cf` vs body `#e8e8ea` is **2.54:1** lightness contrast — below the 3:1
escape-hatch threshold — so hue is the ONLY differentiator. (For reference link-vs-bg is
6.16:1 and body-vs-bg 15.66:1, so 1.4.3 is satisfied.) A user with no color perception, or
viewing in grayscale / a monochrome display, sees uniform-lightness text and cannot locate
the four clickable phrases inside the prose. Because there is no underline, weight, italic,
size, or family change — and no hover/focus cue either — color is the sole means of
distinguishing the links, which is exactly the visual element 1.4.1 protects.

## Expected ACT-style outcome
**failed** — F73 applies: inline links are not visually evident without color vision, and
the lightness difference does not reach the 3:1 G183 escape hatch.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse have **no** link-vs-surrounding-text contrast rule. Their
contrast checks measure foreground-vs-background (1.4.3); here the link passes 1.4.3
(6.16:1 on the dark bg) so they report nothing. They treat an un-underlined colored `<a>`
inside a `<p>` as fine. Deciding that hue is the *only* cue, and that 2.54:1 lightness is
*not enough*, requires comparing the link color to the adjacent text color and applying the
3:1 rule — a perceptual judgment no scanner performs.

## Citation
> **WCAG Technique F73** (`wcag-techniques/failures/F73.html`):
> "Removing the underline and leaving only the color difference for such links would be a
> failure because there would be no other visual indication (besides color) that it is a
> link."
