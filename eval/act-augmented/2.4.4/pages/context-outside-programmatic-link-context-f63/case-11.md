# case-11 — paired PASS repair of case-03

## Scenario and source pair

The complete Heliograph investor-relations recordings page and all three visible “Listen” links are preserved from the failed source.

**Paired failed source:** `case-03.html`

**Balance batch:** `initial-79-context-v3`

**Hard-negative type:** `context-extraction`

## Exact counterfactual repair

Added stable IDs to the existing recording terms and links, then gave each link a self-first `aria-labelledby` reference to its matching external `dt`. No visible wording, recording metadata, or destination changed.

## Primary selector

`dl.media a.listen[aria-labelledby]`

## Accessibility mechanism

Each computed link name begins with “Listen” and continues with the correct recording title, such as “Listen Q1 FY2025 earnings call Recorded May 8, 2025 · 52 min.” The external IDREF supplies the missing purpose.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The visible links remain three identical “Listen” controls. A screenshot-only or isolated-element evaluator can still call them ambiguous unless it resolves the multi-node accessible name and matches each external term.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `dl.media a.listen[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
