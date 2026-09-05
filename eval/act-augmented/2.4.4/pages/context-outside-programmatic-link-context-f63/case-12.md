# case-12 — paired PASS repair of case-05

## Scenario and source pair

The complete Trailhead Outfitters product grid, three cards, visible “View” links, and destinations are preserved from the failed source.

**Paired failed source:** `case-05.html`

**Balance batch:** `initial-79-context-v3`

**Hard-negative type:** `context-extraction`

## Exact counterfactual repair

Added an ID to each existing product-name paragraph and each View link, then used self-first `aria-labelledby` to join the visible action to the matching external product name. No card content or destination changed.

## Primary selector

`.card .action a[aria-labelledby]`

## Accessibility mechanism

The links compute to “View Summit 22L Hiking Pack,” “View Trace 14L Trail Runner Vest,” and “View Basin 30L Overnight Pack,” even though the visual card structure remains unchanged.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

Every rendered button still says only “View.” Correct judgment depends on resolving a reference outside the extracted anchor and checking that each referenced product name agrees with its destination.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `.card .action a[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
