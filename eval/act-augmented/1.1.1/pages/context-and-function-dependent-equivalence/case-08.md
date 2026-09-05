# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> News aggregator grid: a newspaper front-page thumbnail is the sole content of a link to the publication's homepage, but its alt accurately describes the cover PHOTO ('Front page photo of a flooded town square under grey skies') instead of naming the publication. A correctly-labelled card (alt='The Harbor Gazette') is included for contrast.

## Exact repair

Changed only the linked front-page thumbnail alt so the link is named for its destination, The Riverside Courier. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`.grid .card:first-child a[href*="riversidecourier"] > img[alt="The Riverside Courier"]`

## Accessibility mechanism

Because the image remains the link’s sole content, its repaired alt now gives the link the purpose-correct accessible name “The Riverside Courier,” matching the publication homepage it opens.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: changed only the linked front-page thumbnail alt so the link is named for its destination, The Riverside Courier.

## Citation retained from the source case

**Reference:** wcag-understanding/non-text-content.html

> A thumbnail image of the front page of a newspaper links to the home page of the "Smallville Times". The text alternative says "Smallville Times".

