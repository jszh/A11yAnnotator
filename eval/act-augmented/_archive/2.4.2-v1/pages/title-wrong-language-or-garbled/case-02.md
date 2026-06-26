# case-02 — French product page, un-rendered `{{page.title}}` template token

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness)
- **Expected ACT-style outcome:** **failed**

## Scenario
A French e-commerce product page ("Maison Vélo", `<html lang="fr">`) for a city bicycle.
The body is a complete, idiomatic French product page (breadcrumb, gallery, price,
stock, specs, add-to-cart, reviews). The `<title>` shipped to production as the raw,
un-interpolated templating placeholder **`{{page.title}}`** — the Handlebars/Mustache
binding never ran, so the literal token is what the browser receives.

## Element / selector carrying the issue
`head > title` — content `{{page.title}}`.

## Exact accessibility mechanism
The user agent exposes the string `{{page.title}}` as the document title: it is
announced by the screen reader on load and shown as the tab label, default bookmark
name, and history entry. A double-curly-brace template token is not a word in any human
language; it carries zero information about the product ("Randonneur Confort 7"). The
French-reading audience cannot use it to recognise, distinguish, or return to this page
out of context. The title is present and non-empty, so structurally nothing is missing —
the defect is that the present title is a developer artifact (filler/placeholder text)
rather than a description of the page.

## Why automated tools cannot detect it
- The title is present and non-empty (it is the 14-character string `{{page.title}}`),
  so missing-/empty-title rules in axe-core, WAVE, and Lighthouse all PASS.
- No automated checker maintains a lexicon of every templating placeholder syntax in
  use (Handlebars/Mustache `{{ }}`, Jinja/Django `{% %}`/`{{ }}`, ERB `<%= %>`,
  Angular `{{ }}`, Vue, etc.). Even a hand-rolled heuristic that flagged `{{` would
  false-positive on legitimate content that contains braces. Recognising that
  `{{page.title}}` is an un-rendered binding and that it conveys nothing to the French
  audience requires human reading and judgment — the F25 categories "Filler or
  placeholder text" and "Authoring tool default titles" are inherently semantic.

## Citation

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> Verbatim quote (list of "Examples of text that are not titles"):
> "Empty text"
> "Filler or placeholder text"

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages* (`wcag-techniques/general/G88.html`)
>
> Verbatim quote (Tests › Procedure):
> "Check that the title is relevant to the content of the web page."
> "Check that the web page can be identified using the title."
