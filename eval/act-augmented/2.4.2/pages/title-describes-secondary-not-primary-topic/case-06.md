# case-06 — BOUNDARY PASS: busy museum page whose title correctly names the primary exhibition

## Scenario
A museum exhibition feature page deliberately built to be **just as rich and mixed-content as
the failing cases**: a top membership-promo strip, a sponsor logo rail, a "Gift shop pick of
the week" sidebar promo, a newsletter-signup widget, a "Now on view" related-exhibitions
rail, and a footer tagline. Its dominant main column is a feature about a specific exhibition,
**"Hokusai: Beyond the Great Wave."** Here the `<title>` —
**"Hokusai: Beyond the Great Wave — Pelham Museum of Art"** — **correctly names the primary
exhibition**, not the gift-shop pin, the sponsor, the newsletter, or any related show. This
is the contrast/boundary case: the page has every peripheral block type that supplied a
*wrong* title in cases 01–05, yet the title is right, so it passes.

## Attribute tuple
- **content-domain:** cultural institution / museum exhibition (events/ticketing adjacent)
- **UI-component / pattern:** gift-shop promo + sponsor rail + newsletter widget + related-shows rail (all peripheral, none used for the title)
- **host-language construct:** `<title>` correctly bound to the primary `<article>` heading
- **locale / i18n:** en-US
- **failure-mechanism:** none — correct title on an equally busy page (the affirmative of the aspect)

## Developer persona
A museum web team uses a CMS where the exhibition's own "page title" field is mapped to
`<title>` and the peripheral blocks (promo, sponsors, newsletter, related) are separate
modules that never touch the title. The editor filled in the exhibition title field properly.
This is what *correct* authoring looks like under the same structural pressure that produced
the failures.

## Element / selector carrying the (non-)issue
- `head > title` — value: `Hokusai: Beyond the Great Wave — Pelham Museum of Art`
- Primary region: `article.exhibit > h1#ex` ("Hokusai: Beyond the Great Wave") — the title
  matches this dominant region.
- Peripheral blocks present but NOT used for the title: `.member-strip`, `.sponsors`,
  `aside .promo` (gift-shop), `aside .nl` (newsletter), `aside .related` (other shows),
  `footer .tagline`.

## Exact accessibility mechanism (what AT experiences)
On load, a screen reader announces "Hokusai: Beyond the Great Wave, Pelham Museum of Art."
A user scanning open tabs, history, bookmarks, or search results immediately recognizes the
page as the Hokusai exhibition — its actual primary topic — and can distinguish it from the
museum's other exhibition pages. The orientation/identification purpose of SC 2.4.2 is fully
served despite the surrounding promotional clutter.

## Expected ACT-style outcome
**passed** (ACT rule c4a8a4 — the title "describes the topic or purpose of the overall
content of the document"; the overall content is the Hokusai exhibition, and the title names
exactly that).

## Why automated tools (and naive heuristics) could get this WRONG
Automated tools pass this for the trivial reason that a non-empty `<title>` exists — but they
would *also* have passed cases 01–05 for the same reason, so a tool's "pass" here carries no
real signal. More importantly, a naive descriptiveness heuristic of the form "flag busy pages
whose title only matches a small fraction of the visible text" could **false-positive** here:
most of this page's words belong to peripheral blocks (sponsors, gift shop, newsletter,
related shows), so the title's token overlap with the full page text is modest — yet the
title is correct. Reaching the right verdict (PASS) requires the *same* human judgment as the
failures, applied affirmatively: identify the primary topic, then confirm the title names
THAT region. This case proves the aspect is about *which region* the title describes, not
about page busyness or token coverage.

## Citation
**Reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
(`wcag-understanding/page-titled.html`).

> "The intent of this success criterion is to help users find content and orient themselves
> within it by ensuring that each web page has a descriptive title."

**Supporting reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
(`wcag-techniques/general/G88.html`).

> "Identify the subject of the web page"
