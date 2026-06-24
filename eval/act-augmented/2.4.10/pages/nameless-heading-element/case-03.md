# case-03 — Recipe blog where the "Method" heading is a divider image whose `alt` is the asset's file name (`<h2><img alt="divider-line-ornament-2x.png"></h2>`)

## Scenario
A self-hosted WordPress food blog post, "Slow-Braised Short Rib Ragu", is organised into four
sections — **Before you start**, **Ingredients**, the cooking **Method**, and **To serve**.
Three use plain text `<h2>` headings. The Method section's heading, however, is a decorative
dashed-rule divider image promoted to be the heading's only content. The author never typed a
title there, and the blog's media library auto-populated the image's `alt` with the uploaded
**file name**: `<h2><img alt="divider-line-ornament-2x.png" src="(dashed rule SVG)"></h2>`.
Because that alt is non-empty, the heading has a discernible accessible name — but the name is
`divider-line-ornament-2x.png`, which names the *image asset*, not the *section*. A sighted
reader sees a faint dashed rule and reads the numbered steps below it as "the method"; a
screen-reader user hears the section announced by a filename.

## Attribute tuple
- **content-domain**: food & recipes — personal cooking blog post
- **UI-component/pattern**: long-form article with `<section aria-labelledby>` blocks and a decorative "divider" ornament reused as a section title
- **host-language construct**: `<h2>` whose only child is an `<img>` carrying a **non-empty but meaningless** `alt` (the asset file name), referenced by `aria-labelledby`
- **locale/i18n**: en-GB
- **failure-mechanism**: filename-as-heading-name — the heading IS named (so empty-heading passes) but the name is the image's file name, naming the asset rather than the section

## Developer persona
The blogger maintains the site in the WordPress block editor. Wanting a visual break before the
cooking steps, they dropped the theme's "dashed rule" ornament block in as the section's title
instead of typing "Method". When the rule image was uploaded, the media library auto-filled its
`alt` attribute from the file name (`divider-line-ornament-2x.png`) — a common CMS default the
author never edited. The post looks polished and every section visually has a divider, so the
missing word "Method" went unnoticed. The non-empty (if nonsensical) alt is exactly what lets
the page slip past empty-heading checks.

## Element / selector carrying the issue
- FAIL: `h2#h-method` (`.divider`) — its only child is `<img alt="divider-line-ornament-2x.png">`;
  accessible name computes to `"divider-line-ornament-2x.png"`. Role `heading`, level 2, visible,
  not ignored. The recipe's Method (sear, soften, braise) sits under this heading, which names a
  PNG, not the cooking step.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree: `#h-method` computes to
`role="heading", name="divider-line-ornament-2x.png", level=2, ignored=false` — a present,
exposed heading with a non-empty accessible name that is the image's file name. The
`aria-labelledby` even propagates that filename to the section: `role="region",
name="divider-line-ornament-2x.png"`. A screen-reader heading list reads:

> "Before you start, heading level 2 · Ingredients, heading level 2 ·
> **divider-line-ornament-2x.png, heading level 2** · To serve, heading level 2."

A blind cook navigating by heading to find the cooking steps lands on a heading named after a
PNG and cannot tell it is the Method. Sighted users read the dashed rule as the section break
and the steps as obviously "the method"; the heading's actual name conveys nothing.

## Expected ACT-style outcome
**failed** — a section heading is present and exposed but, holding only a divider image whose
name is the asset's file name, provides no section name. Visual presentation (the rule) is doing
the work of identifying the section, which the success criterion does not accept.

## Why automated tools miss it
This rewrite deliberately defeats the automated check that caught the previous version of this
case. With `alt=""` (the prior version), axe-core's `empty-heading` rule correctly fired,
because that rule evaluates the heading's accessible name, not literal emptiness. Here the alt
is **non-empty** (`divider-line-ornament-2x.png`), so the heading HAS discernible text and
`empty-heading` PASSES; `image-alt` PASSES (the image has alt text); `heading-order` PASSES
(`h1` then four `h2`s). Verified: axe-core 4.12.1 (zero config) reports **no violations** on this
file. No automated checker can tell that the discernible text `divider-line-ornament-2x.png` is a
meaningless file name rather than a real section title — recognising that the present name is not
a SECTION name, and that the section is the recipe's Method, requires human semantic and visual
judgment.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "This clearly indicates the organization of the content, facilitates navigation within the content, and provides mental "handles" that aid in comprehension of the content. Other page elements may complement headings to improve presentation (e.g., horizontal rules and boxes), but visual presentation is not sufficient to identify document sections."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to another and will know the purpose of each section."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content**
> "Check that each section on the page starts with a heading."
