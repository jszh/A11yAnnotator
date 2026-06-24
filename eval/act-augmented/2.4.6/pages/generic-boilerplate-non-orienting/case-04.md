# case-04 — Dashboard card headed "Stuff" over a monthly-recurring-revenue chart

## Scenario
An internal operations dashboard shows four metric cards. Three carry descriptive `<h2>`
card titles ("Active subscriptions", "Support backlog", "Churn rate"); the fourth is headed
**"Stuff"** above a bar chart that is, in fact, **monthly recurring revenue (Jan–Jun)**.
"Stuff" is so generic it is almost useless, yet it is not an outright topic mismatch — a
chart genuinely is "stuff" on the dashboard — which puts it squarely in the
true-but-non-orienting tier rather than the deliberate-mismatch tier ACT covers.

## Attribute tuple
- **content-domain**: SaaS analytics — internal operations dashboard
- **UI-component/pattern**: metric-card grid; one card holds an inline `<svg role="img">` bar chart
- **host-language construct**: `<section aria-labelledby>` card with an `<h2>` title; chart is inline SVG with `aria-label`
- **locale/i18n**: en-GB (GBP)
- **failure-mechanism**: a heading so generic it does not orient ("Stuff") while the descriptive truth lives in the SVG's `aria-label`, not the heading

## Developer persona
A full-stack engineer building an internal tool dropped in the revenue card last during a
sprint and typed "Stuff" as a placeholder title meant to be renamed before the demo. They
*did* take the time to give the SVG a proper `aria-label` (because a linter had previously
flagged an unlabelled chart), so the card's accessible-name check passes — but the
human-facing heading was never fixed, and on an internal tool nobody filed a bug.

## Element / selector carrying the issue
- FAIL: `h2#c3` (text "Stuff") — the card title over the monthly-recurring-revenue chart.
- PASS (contrast headings, same page): `h2#c1` "Active subscriptions", `h2#c2` "Support
  backlog", `h2#c4` "Churn rate" — descriptive, so the generic one stands out.

## Exact accessibility mechanism
A screen-reader user navigating the dashboard by heading hears: "Active subscriptions …
Support backlog … Stuff … Churn rate." The card landmark named "Stuff" gives no clue it
holds revenue; the user only discovers the topic if they drill into the card and reach the
SVG, whose `aria-label` correctly says "Monthly recurring revenue …". So the *chart* is
accessible (1.1.1 / 4.1.2 satisfied) while the *card heading* fails 2.4.6: it does not
describe the topic or purpose of the card's content, and it is conspicuously less
orienting than its three descriptive siblings. The descriptive information exists on the
page but is carried by the image's accessible name, not by the heading the SC governs.

## Expected ACT-style outcome
**failed** — one heading ("Stuff") is present and not a mismatch but far too generic to
describe its content; the three sibling headings pass and sharpen the contrast.

## Why automated tools miss it
The `<h3>` is non-empty and in valid order; axe-core, WAVE, and Lighthouse pass it. The SVG
*has* a correct accessible name, so the image checks pass too — there is literally nothing
empty or missing on the page. A tool cannot tell that "Stuff" under-describes a revenue
chart, nor that the descriptive text lives in the SVG label rather than the heading.
Catching it requires a human to read the heading against the chart's content (and its
`aria-label`) and judge the heading non-orienting — exactly the graded judgment the corpus
omits.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — In brief**
> "Goal: A page's content is described in headings and labels. … Why it's important: People
> can orient themselves, especially those with cognitive or visual disabilities."

> **WCAG Techniques — G130: Providing descriptive headings**
> "Check that each heading identifies its section of the content."

> **Trusted Tester 5.1.3 — Test 10.A (`2.4.6-heading-purpose`)**
> "PASS if: The heading describes the topic or purpose of its content."
