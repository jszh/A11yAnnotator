# case-07 — Docs SPA on one API method but `<title>` stays the section-level "API Reference — DevDocs"

## Scenario
A documentation SPA (DevDocs). **Variant trigger: templated section-level title, identical across every
method page.** The router renders one specific API-method reference (`#/api/payments.captureCharge`) into the
body: a monospace `<h1>captureCharge</h1>` with a POST verb badge, the path, a parameters table, a returns
section, and an example request. The body unambiguously documents *captureCharge*. The title *is* set
dynamically, but the routine derives it only from the **section** (`"API Reference — DevDocs"`) and never
descends to the method — so captureCharge, refundCharge, and listCharges all get the byte-identical title.

## Element / selector carrying the issue
- `head > title` — text node `"API Reference — DevDocs"` (set dynamically from the section, not the method).
- Contradicting evidence: `h1` = "captureCharge" (with `POST` badge); breadcrumb `.bc` = "API Reference ›
  Charges › captureCharge"; nav `a[aria-current="page"]` = "captureCharge".

## Exact accessibility mechanism (what AT experiences and why it fails)
This is the F25 "templated, same title for every page" failure expressed in an SPA. The title reads like a
plausible, descriptive title — "API Reference — DevDocs" — which is exactly what makes it dangerous: it is
*section*-descriptive, not *page*-descriptive. A developer using a screen reader who opens captureCharge,
refundCharge, and listCharges in three tabs sees the same title on all three; the title cannot distinguish
the method they want, and it omits the specific method topic on screen. G88 asks the title to "Identify the
subject of the web page" and to "Be unique within the site"; a section-level title fails both for the
method-level pages in the set.

## Expected ACT-style outcome
**failed** (limb 2). Title present, non-empty, and even reasonable-looking (2779a5 passes), but identical
across every method page and therefore non-distinguishing and under-descriptive for the current view.

## Why automated tools miss it
"API Reference — DevDocs" is a non-empty, well-formed, even professional-sounding `<title>`; ACT 2779a5 passes
and axe/WAVE/Lighthouse stay silent. A length/quality heuristic would not flag it either — it is neither empty
nor obviously a placeholder. The defect only surfaces when one reads the rendered method name and reasons that
the title is the same for every method in the set and never names the specific one on screen. That is a
cross-page-set uniqueness/descriptiveness judgment that requires understanding the page content; no presence or
structure checker performs it, and the section-vs-method templating is a runtime decision absent from the head.

## Citation
> **WCAG Techniques — F25, Examples (`wcag-techniques/failures/F25.html`):**
> "A site generated using templates includes the same title for each page on the site. So the title cannot
> be used to distinguish among the pages."

> **WCAG Techniques — G88 (`wcag-techniques/general/G88.html`):**
> "The title of each web page should: Identify the subject of the web page … It may also be helpful for the
> title to … Be unique within the site or other resource to which the web page belongs."
