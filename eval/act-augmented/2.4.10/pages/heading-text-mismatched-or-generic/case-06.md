# case-06 — News roundup with short single-word headings that DO name their sections (PASS boundary)

## Scenario
A local newspaper's "Tuesday Roundup" page is split into four sections, each opened by a
short, single-word `<h2>`: **"Weather"**, **"Sports"**, **"Markets"**, **"Traffic"**.
Superficially these resemble the generic/placeholder pattern that fails elsewhere in this
aspect (they are terse common nouns). But each heading actually and unambiguously **names** the
section it introduces: the "Weather" section is the forecast, "Sports" is last night's scores,
"Markets" is the finance roundup, "Traffic" is the commute/road report. This page is the
deliberate PASS foil so the aspect is judged on heading-to-body **fit**, not on heading brevity.

## Attribute tuple
- **content-domain**: news / long-form editorial (local daily roundup)
- **UI-component/pattern**: masthead + stacked content sections, each with mixed media (forecast tiles, a scores table, a ticker line, a traffic advisory)
- **host-language construct**: `<section aria-labelledby>` with `<h2 id>` headings
- **locale/i18n**: en-US
- **failure-mechanism**: NONE — terse but correct headings; included as the boundary case proving short ≠ failing when the word truly names the section

## Developer persona
A newsroom editor who knows that scannable, single-word section labels ("Weather", "Sports")
are exactly how readers navigate a daily roundup — and who chose each word to correctly name its
section. This is competent authoring, not a defect: it demonstrates that brevity is not the
2.4.10 trigger; mis-fit is.

## Element / selector carrying the issue
- PASS: `h2#n-weather` ("Weather") over the forecast — correctly names its section.
- PASS: `h2#n-sports` ("Sports") over the scores — correctly names its section.
- PASS: `h2#n-markets` ("Markets") over the finance roundup — correctly names its section.
- PASS: `h2#n-traffic` ("Traffic") over the commute report — correctly names its section.

## Exact accessibility mechanism
A screen-reader user opening the heading list hears:

> "Weather · Sports · Markets · Traffic"

— and can jump straight to the section they want, because each word predicts its content. A
reader looking for the bridge-lane closure goes to "Traffic" and finds it; one wanting the
overnight scores goes to "Sports" and finds them. The headings introduce and identify their
sections exactly as 2.4.10 intends, providing precisely the mental "handles" the SC describes.
There is no mismatch, no placeholder, and no content-free word: a one-word heading is fully
compliant when it correctly names its own section.

## Expected ACT-style outcome
**passed** — each section has a heading, and the heading text accurately introduces/identifies
the section it sits above. (This is the boundary twin of the placeholder, copied, generic-word,
swapped, and crossed-binding failures: it shows the SC turns on heading-to-content fit, not on
heading length or genericness of the word in isolation.)

## Why automated tools miss it (and why their PASS is correct here)
Automated tools pass this page for the same shallow reason they pass the failing cases —
headings are present, non-empty and ordered. The difference is that here the automated PASS is
the **correct** verdict, and only a human reading each body can *confirm* the fit (an automated
tool cannot verify that "Weather" really introduces a forecast; it just sees a non-empty
heading). This case exists to ensure the aspect's judgment is "does the word name *this*
section?" — for which the answer here is yes — rather than penalising brevity, which would
mis-classify competent authoring as a failure.

## Citation
> **WCAG 2.2 Understanding — Examples of Section Headings**
> "A menu contains different sections for different courses. Each section has a heading:
> Appetizers, Salad, Soup, Entree, Dessert." (Single-word section headings that correctly name
> their sections are the SC's own model of compliance.)

> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
