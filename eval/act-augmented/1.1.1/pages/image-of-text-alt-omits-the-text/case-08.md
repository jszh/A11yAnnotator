# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Marketing-email promo banner rendered as a flattened image (inline-SVG data: URI). Pixels read 'SUMMER SALE / 20% OFF EVERYTHING / Use code SAVE20 at checkout / Ends Sunday, August 31'. alt='Summer sale promotional banner' truthfully labels the image but reproduces none of the load-bearing words; a screen-reader user can never enter SAVE20.

## Exact repair

Replaced only the generic banner alt with all meaningful text visible in the unchanged promotional image. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`img.hero[alt^="Summer Sale"]`

## Accessibility mechanism

The alt now reproduces SUMMER SALE, 20% off everything, code SAVE20, checkout instruction, and the August 31 deadline. The image’s load-bearing text has a complete text equivalent.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced only the generic banner alt with all meaningful text visible in the unchanged promotional image.

## Citation retained from the source case

**Reference:** refs/trusted-tester/sc-1.1.1-non-text-content.md

> If the image is of **meaningful text**, ANDI Output must contain the **same text**.

