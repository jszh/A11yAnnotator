# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Public-library catalogue search: the submit control is an icon button whose magnifying-glass image has alt='magnifying glass' (names the depicted icon, not the action 'Search'). A second submit (arrow, alt='Go') is correctly purpose-named for contrast.

## Exact repair

Changed only the search-control image alt from the depicted glyph “magnifying glass” to its action “Search”. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`form.search button[value="quick"] > img[alt="Search"]`

## Accessibility mechanism

The button, icon, form, and behavior are unchanged. The image alt now names the control’s action, so the resulting button name is “Search” rather than a description of the glyph.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: changed only the search-control image alt from the depicted glyph “magnifying glass” to its action “Search”.

## Citation retained from the source case

**Reference:** wcag-techniques/general/G94.html

> A search button uses an image of a magnifying glass.  The text alternative is "search" and not "magnifying glass".

