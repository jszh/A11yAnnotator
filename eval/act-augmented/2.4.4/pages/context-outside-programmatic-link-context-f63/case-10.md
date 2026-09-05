# Bank documents — external table labels

## Scenario and source pair

The full Riverbend Credit Union document email remains unchanged, including separate table rows for labels, metadata, and actions.

**Paired failed source:** `case-02.html`

**Coverage lane:** external reference

## Exact counterfactual repair

Added IDs to the existing document-label cells and links, then used self-first `aria-labelledby` references from each `View` link to its matching label cell. No unrelated content or destination was removed.

## Primary selector

`#statement-view, #tax-view`

## Accessibility mechanism

The external IDREF creates accurate names such as `View June 2025 Account Statement` while retaining the visible label and the original table layout.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **wcag-techniques/failures/F63.html:**
> “An audio site provides links to where its player can be downloaded. The information about what would be downloaded by the link is in the preceding row of the layout table, which is not programmatically determined context for the link.”

