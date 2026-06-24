# case-06 — "Learn more" inside a figcaption that names the chart's subject (borderline PASS)

## Scenario
A public-health dashboard shows a bar chart of childhood MMR coverage. Below it, the
`<figcaption>` is one sentence ending in a **"learn more"** link. The caption sentence
names what the link is about — "the methodology and clinic-level breakdown behind this 2025
dip in MMR coverage" — immediately before the generic phrase. The link lives *inside* the
figcaption, so the caption is its programmatically determined context. This is the hardest
borderline: a generic phrase that a blocklist would flag, but which the same-block caption
rescues.

## Attribute tuple
- **content-domain**: healthcare / population-health analytics dashboard
- **UI-component/pattern**: `<figure>`/`<figcaption>` data-visualization with an inline caption link
- **host-language construct**: `<a>` inside a `<figcaption>` (the link's containing block)
- **locale/i18n**: en
- **failure-mechanism**: NONE present — generic "learn more" rescued by same-block (figcaption) context naming the destination subject; included as the borderline PASS the judge must read the caption to confirm

## Developer persona
A data engineer on the public-health team standardized every chart's caption as a single
descriptive sentence ending in a "learn more" link, because the design system mandates a
uniform CTA string. To stay compliant they made a habit of writing the caption so the
*subject* is stated before "learn more" — here, "…behind this 2025 dip in MMR coverage, learn
more." They rely on the figcaption being the link's container so the context counts.

## Element / selector carrying the issue
- PASS: `figure figcaption a[href="/reports/mmr-2025-methodology"]` — accessible name "learn
  more"; enclosing figcaption sentence names "the methodology and clinic-level breakdown
  behind this 2025 dip in MMR coverage" before the link.

## Exact accessibility mechanism
A screen-reader user reading the figure caption hears the full sentence, ending "…behind
this 2025 dip in MMR coverage, learn more, link." The purpose — the methodology behind the
2025 MMR dip — is delivered in the same block (the figcaption is the link's containing
element) and *precedes* the link, satisfying the in-context limb of 2.4.4 and matching G53's
"information needed precedes the link." The figcaption is genuine programmatic link context
(the link is a descendant of it; the figcaption is also the figure's accessible name via
`aria-labelledby`). Thus the generic phrase is rescued and the link passes.

## Expected ACT-style outcome
**passed** — purpose is determinable from the link text combined with its same-block
(figcaption) programmatically determined context.

## Why automated tools miss it
This is a false-positive trap. "Learn more" is on phrase blocklists, so heuristic tools
flag a violation — incorrectly, because the figcaption rescues it. A name-presence tool
(c487ae, axe `link-name`) passes the element but for the wrong reason (it never evaluates
context). Reaching the *correct* PASS requires a human to read the caption, locate the
subject words ("2025 dip in MMR coverage"), confirm they sit in the link's containing block
and precede the link, and judge that they convey the destination's purpose. No automated
tool performs that reading; the chart values are an `aria-label` on a `role="img"`, so even
the data is opaque to text analysis.

## Citation
> **WCAG 2.2 Understanding 2.4.4 — Intent**
> "This can be achieved by putting the description of the link in the same sentence,
> paragraph, list item, or table cell as the link… because these are directly associated
> with the link itself."

> **WCAG Techniques — G53: Identifying the purpose of a link using link text combined with the text of the enclosing sentence**
> "Check that the link is part of a sentence. Check that text of the link combined with the
> text of its enclosing sentence describes the purpose of the link."
