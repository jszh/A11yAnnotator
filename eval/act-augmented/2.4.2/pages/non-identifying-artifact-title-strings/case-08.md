# Q3 revenue article — repaired identifying title

## Scenario and source pair

The complete Northwind Q3 revenue article from source case-01 is retained unchanged, including its masthead, management quotes, revenue-by-segment table, and outlook.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Replaced only the authoring default `<title>Untitled Document</title>` with `<title>Northwind Trading Posts Record Q3 Revenue — Investor Relations</title>`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title now identifies the article’s Q3-revenue subject and makes sense in a tab, bookmark, search result, or screen-reader page list.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Technique G88 (`wcag-techniques/general/G88.html`):**
> “The title of each web page should: Identify the subject of the web page.”

