# case-10 — paired PASS repair of case-04

## Scenario and source pair

The complete Harbourview Realty page, both property headings, and both repeated per-listing navigation groups are preserved from the failed source.

**Paired failed source:** `case-04.html`

**Balance batch:** `initial-79-context-v3`

**Hard-negative type:** `context-extraction`

## Exact counterfactual repair

Corrected the second navigation region’s stale heading reference. Also assigned stable IDs to all six links and gave each link a self-first `aria-labelledby` containing its own ID followed by the correct listing heading ID. No visible wording, property data, or destination changed.

## Primary selector

`.listing-links a[aria-labelledby]`

## Accessibility mechanism

Each computed link name begins with its visible action and includes the correct listing heading. For example, `#birch-map` computes to “Map 8 Birch Lane — Riverside,” while `#maple-map` computes to “Map 14 Maple Court — Old Town.” The repaired result does not depend on a navigation landmark label being treated as link context.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page still renders two identical Floor plan / Map / Book viewing link sets. Correct evaluation requires resolving each self-first multi-ID accessible name and matching the referenced heading to the link destination rather than relying on visible repetition or the surrounding landmark alone.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `.listing-links a[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
