# Newton’s Laws chapter — repaired out-of-context title

## Scenario and source pair

The complete physics textbook chapter from source case-01 is retained, including chapter navigation, Newton’s Laws heading, examples, and surrounding book context.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Expanded only `<title>Chapter 3</title>` to `Chapter 3: Newton’s Laws of Motion — Foundations of Physics`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title remains concise but now makes sense outside the document and distinguishes the chapter by subject and book.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Technique G88 (`wcag-techniques/general/G88.html`):**
> “Make sense when read out of context, for example by a screen reader or in a site map or list of search results.”

