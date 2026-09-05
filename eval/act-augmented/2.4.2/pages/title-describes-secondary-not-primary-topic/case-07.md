# Cedar Falls budget story — repaired primary-topic title

## Scenario and source pair

The long-form Cedar Falls budget story from source case-01 is retained with its promotion strip, masthead, article, sidebar, newsletter, and footer.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the document title from the peripheral subscription promotion to `Council Approves $214M Cedar Falls Budget — Cedar Falls Tribune`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title now identifies the dominant budget article rather than the unrelated promotional block.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Technique G88 (`wcag-techniques/general/G88.html`):**
> “The title of each web page should: Identify the subject of the web page.”

