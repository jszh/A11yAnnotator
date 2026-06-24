# case-02 — "click here" rescued by purpose words earlier in the same sentence (G53)

## Scenario
A SaaS pricing page lists base subscription tiers, then offers a link to the full rate
breakdown. The link text is the textbook-bad phrase **"click here"** — but it sits inside
a sentence that names the destination ("…for full pricing details, click here.") with the
purpose words *preceding* the generic phrase. This is the deliberate near-PASS: identical
boilerplate to a failing page, rescued only by its enclosing sentence.

## Attribute tuple
- **content-domain**: SaaS analytics / metering product (plans & billing)
- **UI-component/pattern**: pricing-card explanatory paragraph with an inline link
- **host-language construct**: `<a>` embedded mid-sentence inside a `<p>`
- **locale/i18n**: en
- **failure-mechanism**: NONE present — generic phrase whose purpose is supplied by same-sentence context (G53), included as the PASS boundary that separates "blocklisted phrase" from "actual failure"

## Developer persona
A front-end engineer knows "click here" is frowned upon, but a product manager insisted on
the literal CTA wording for consistency with the marketing site. As a compromise the
engineer wrote the surrounding sentence to carry the meaning ("for full pricing details,
…"), deliberately placing the descriptive words before the link so screen-reader users
reading the paragraph hear the purpose first. They believe — correctly — that the sentence
context rescues the phrase.

## Element / selector carrying the issue
- PASS: `section.card p a[href="/pricing/details"]` — accessible name "click here", enclosing
  sentence supplies "full pricing details" before the link.

## Exact accessibility mechanism
A screen-reader user reading the paragraph (the default reading mode, and the mode the
Understanding document explicitly relies on for in-context links) hears: "…for full pricing
details, click here, link." The purpose is delivered *before* the link, so the user knows
where it goes without leaving the link. The link text alone ("click here") is insufficient,
but 2.4.4 is satisfied by *link text together with its programmatically determined link
context* — and the enclosing sentence is exactly that context. This matches G53 and the
Understanding note that ambiguous link text is acceptable when the describing text precedes
the link in the same sentence.

## Expected ACT-style outcome
**passed** — the purpose is determinable from the link text combined with its same-sentence
programmatically determined context.

## Why automated tools miss it
This is a false-positive trap, not a false-negative one. A phrase-blocklist checker (some
WAVE/Lighthouse heuristics and many linters) flags the literal string "click here" and
reports a violation. That verdict is *wrong*: the sentence rescues the link under G53. No
automated tool can reliably parse the enclosing sentence, locate the purpose words, confirm
they precede the link, and judge that they describe the destination — that is the human
semantic judgment 2.4.4's in-context limb demands. The element also trivially passes ACT
c487ae (non-empty name), so name-presence checks are green either way.

## Citation
> **WCAG Techniques — G53: Identifying the purpose of a link using link text combined with the text of the enclosing sentence**
> "A web page contains the sentence 'To advertise on this page, click here.' Although the
> link phrase 'click here' is not sufficient to understand the link, the information needed
> precedes the link in the same sentence."

> **WCAG 2.2 Understanding 2.4.4 — Intent**
> "This context will be most usable if it precedes the link. (For instance, if you must use
> ambiguous link text, it is better to put it at the end of the sentence that describes its
> destination, rather than putting the ambiguous phrase at the beginning of the sentence.)"
