# case-06 — Bubble infographic: five pale circles (sized by reach) with faint inner icons; circle-vs-page AND icon-vs-circle both <3:1 → FAIL

## Scenario
A college advancement report shows "Where our alumni connect" as a bubble infographic in inline
SVG: five circles whose **area** encodes community size, each with a small **icon** inside
marking the platform (LinkedIn, Facebook, Instagram, Discord, Mastodon). This item has *two*
graphical objects per platform that are both required for understanding: (1) the circle — you
must perceive it against the white page to judge size; (2) the inner icon — you must perceive it
against the circle to know which platform. Both fail 3:1: circle `#DCE6F1` vs white page is
~1.26:1, and icon `#B8CCE4` vs circle is ~1.30:1. There are no member counts, no legend, no
table. The circle sizes are the data and the icons are the identity, so both sets of graphical
objects are required and both are below 3:1 → **fail**. This reproduces the Understanding
"Infographics (Fail)" example as inline SVG.

## Attribute tuple
- **content-domain:** higher-ed / college advancement & alumni relations
- **UI-component/pattern:** inline-SVG bubble infographic (area-encoded circles + inner icons)
- **host-language construct:** five `<circle fill>` bubbles, each with a faint inner `<rect>`/
  `<circle>`/`<path>` icon and a `<text>` platform name
- **locale/i18n:** en-US
- **failure-mechanism:** multi-object graphic — two required graphical objects (circle vs page,
  icon vs circle) both below 3:1 (G207); platform names do not convey the size, so no equivalent
  text exempts the circles.

## Developer persona
A communications designer built the infographic in a vector tool using the college's pale "sky"
brand tint for every bubble and a slightly darker tint of the same hue for the icons, to keep it
"clean and on-brand." She exported it as inline SVG and labelled each bubble with the platform
name. She judged size by eye on her high-quality monitor and never tested that the circles sit
~1.26:1 against white or that the same-hue icons sit ~1.30:1 against the circles.

## Element / selector carrying the issue
Two graphical-object families: the bubble `<circle fill="#DCE6F1">` elements (~1.26:1 vs the
white page) and the inner icon shapes (`<rect>`/`<circle>`/`<path>` at `#B8CCE4`, ~1.30:1 vs the
circle). The `<text>` platform names are the decoy "alternative" — they identify each platform
but do not convey the **size**, which is what the circles encode.

## Exact accessibility mechanism (what AT experiences, why it fails)
A user with moderately low vision cannot reliably perceive the pale circles against the white
page, so the relative-size comparison that the whole infographic exists to communicate is lost;
and even where a circle is perceived, the same-hue icon inside it (~1.30:1) is invisible, so the
platform identity from the *graphic* is lost too. The text names rescue identity but not size —
"which community is biggest" remains unreadable. A screen-reader user gets only the topic
sentence in the `aria-label`. Per the Understanding infographic example, "the graphical objects
are the circles (measured against the background) and the icons in each circle (measured against
the circle's background)"; both are below 3:1 here → **fail**.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The infographic SVG is labelled and each circle has a text platform name, so axe-core, WAVE and
Lighthouse pass it. None of them recognise this as a bubble chart where circle *area* is the
data, compute circle-vs-page **and** icon-vs-circle contrast as two separate required graphical
objects, or reason that the platform names convey identity but not size — so the faint circles
remain required for understanding. Treating one infographic as a *set* of graphical objects, each
measured against its own adjacent surface, and judging which are required, is a human
determination. The identical layout with dark circle borders, dark icons, and printed member
counts would pass (the Understanding "Infographics (Pass)" variant); nothing in the markup tells
a scanner which case it is looking at.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — Infographics example (Fail):**
> "Discerning the circles is required to understand the size of network and discerning the icons
> in each circle is required to identify which network it shows."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page reproduces that exact
failure: both the circles (~1.26:1 vs page) and the inner icons (~1.30:1 vs circle) are required
graphical objects and both are below 3:1.)

> **WCAG 2.2 Understanding, Non-text Contrast — Infographics:**
> "In the context of graphics contrast, each item within such an infographic should be treated
> as a set of graphical objects, regardless of whether it is in one file or separate files."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The two required objects per item —
circle against the page and icon against the circle — must each be tested at 3:1; both fail.)
