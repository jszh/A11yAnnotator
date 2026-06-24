# case-03 — Nonprofit footer: four brand glyphs all labelled "social media"

## Scenario
A food-bank donation page ("Riverbend Food Network") ends with a footer social row of
four icon links: Facebook, X/Twitter, Instagram, and YouTube, each an inline-SVG brand
glyph in a circular button. The four links point to four different platform profiles,
but every one of them carries the identical non-empty `aria-label="social media"`. Each
link individually satisfies the name-presence floor (c487ae/F89), yet a screen-reader
user navigating the four hears the same generic phrase four times and cannot tell which
opens which platform — the only thing that distinguishes them is the rendered logo.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** footer social-link row (set of icon-only brand links)
- **host-language construct:** four `<a aria-label="social media"><svg aria-hidden="true">…</svg></a>`
- **locale/i18n:** en-US
- **failure-mechanism:** one generic label cloned across distinct destinations — present, identical, and non-descriptive of each link's specific purpose

## Developer persona
A volunteer set the site up on a themed CMS whose "Social Links" block takes a single
label field and a list of URLs. The theme author wired that one field — defaulted to
"social media" — onto every generated link's `aria-label`, assuming editors would
override per-network. The volunteer pasted the four profile URLs, saw the icons render
correctly, and never touched the label, because on screen the logos already make the
networks obvious. The accessibility scanner reported zero link-name errors, so it
looked done.

## Element / selector carrying the issue
`footer nav.social a[aria-label="social media"]` — four instances, each wrapping a
different brand SVG (Facebook / X / Instagram / YouTube) and pointing to a different
profile URL.

## Exact accessibility mechanism
All four `<a>` elements are in the accessibility tree with role `link` and the same
accessible name `"social media"` (each inner SVG is `aria-hidden="true"`, so the name is
exactly the label). A screen-reader user listing links hears "social media, social
media, social media, social media." The purpose of each link — *which platform it
opens* — is carried solely by the visual logo and is absent from the accessible name and
from any programmatic context. Each link passes the non-empty-name floor but fails to
let the user determine its purpose, so 2.4.4 fails for the set.

## Expected ACT-style outcome
**failed** (SC 2.4.4 Link Purpose (In Context)). c487ae *passes* (every name is
non-empty); F89 inapplicable (none of the image links is unnamed).

## Why automated tools miss it
Each link has a non-empty accessible name, so axe-core / WAVE / Lighthouse pass the
"links must have discernible text" rule. A same-name heuristic might note the four
labels are identical, but per ACT rule fd3a94 identical-named links are only a failure
when they *do not* serve the same purpose — and a tool cannot know that Facebook, X,
Instagram, and YouTube are four distinct destinations, nor read the rendered logos to
see they differ. Determining that "social media" describes none of the four specifically
requires a human to recognise each brand glyph and compare it to the shared label.

## Citation
> **Reference:** WCAG 2.2 Understanding — "Intent of Link Purpose (In Context)"
> (`wcag-understanding/link-purpose-in-context.html`)
>
> **Quote (verbatim):** "It is also a best practice for links with different purposes
> and destinations to have different link text."
>
> **Reference:** Trusted Tester v5.1.3 — Test 6.A `2.4.4-link-purpose`
> (`refs/trusted-tester/sc-2.4.4-link-purpose.md`)
>
> **Quote (verbatim):** "Determine whether the ANDI Output, in combination with the
> programmatically determined link context … adequately describes the link's purpose or
> function."
