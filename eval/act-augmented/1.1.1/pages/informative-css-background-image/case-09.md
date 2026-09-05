# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Record-shop catalogue table where each row's stock status (In stock / Last copy / Pre-order / Sold out) is shown ONLY by a CSS-class background-image glyph in a text-empty leading cell; row text is just artist/title/format/price (F3 example 2 mechanism).

## Exact repair

Added visually hidden status text to every unchanged CSS stock glyph. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`td.stock.sold`

## Accessibility mechanism

Each status cell now contains an accessible text equivalent—In stock, Last copy, Pre-order, or Sold out—while the original CSS glyph remains visual reinforcement. Every inventory state is available without the background image.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: added visually hidden status text to every unchanged CSS stock glyph.

## Citation retained from the source case

**Reference:** wcag-techniques/failures/F3.html

> A book distributor uses background images to provide icons against a list of book titles to indicate whether they are new, limited, in-stock, or out of stock.

