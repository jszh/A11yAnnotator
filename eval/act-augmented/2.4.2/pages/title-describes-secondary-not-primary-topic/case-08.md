# Miso cookie recipe — repaired primary-topic title

## Scenario and source pair

The complete recipe page from source case-02 is retained, including ingredients, five-step method, and newsletter sidebar.

**Paired failed source:** `case-02.html`

## Exact counterfactual repair

Changed only the document title from the newsletter heading to `Brown Butter Miso Chocolate Chip Cookies — sweetcrumb.kitchen`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title now describes the page’s primary recipe rather than a secondary conversion widget.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Technique G88 (`wcag-techniques/general/G88.html`):**
> “The title of each web page should: Identify the subject of the web page.”

