# December bank statement — repaired instance title

## Scenario and source pair

The realistic December 2005 Meridian Bank statement from source case-01 is retained in full: account, period metadata, transactions, balances, breadcrumb, and download.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the stale month token in `<title>` from November to December. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title now agrees with the rendered statement and distinguishes this December instance from sibling monthly statements.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Technique F25 (`wcag-techniques/failures/F25.html`):**
> “This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page.”

