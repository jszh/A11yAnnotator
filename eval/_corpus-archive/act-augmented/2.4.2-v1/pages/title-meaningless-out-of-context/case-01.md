# case-01 — Checkout shipping step titled "Step 2 of 4"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-01.html`

## Scenario
A multi-step e-commerce checkout. The body is unambiguously the **shipping-address
step** of order #NW-48127 at "Northwind Outfitters" — a step indicator, recipient
fields, address fields, and a delivery-speed fieldset. The `<title>` is the bare
relative fragment **"Step 2 of 4"**.

## Element / selector carrying the issue
`head > title` (text node `Step 2 of 4`). The on-page step indicator
`ol.steps li[aria-current="step"]` ("2. Shipping") supplies the context the title
relies on.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user who lands here, or who Alt-Tabs / reviews the window list,
hears the page announced as **"Step 2 of 4"**. There is no site name, no flow name,
no subject. The title is deictic: it means "the second of four steps **of the thing
you were just doing**", interpretable only relative to the previous page. With
several wizards open (checkout, a survey, a tax form) every tab announces some
"Step N of M" and the user cannot distinguish them. In browser history days later,
"Step 2 of 4" recalls nothing. The page is fully identifiable while the body is
visible, and useless once the title is consumed detached — exactly the
out-of-context scenario 2.4.2 exists for.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes — the `<title>` exists and is non-empty.
- **c4a8a4 (descriptive title), automated parts:** the strings "Step" and "2 of 4"
  appear verbatim in the visible step indicator and the lead paragraph, so a
  title-vs-body lexical-overlap heuristic finds agreement. axe-core, WAVE, and
  Lighthouse only check that a non-empty title exists; none model "read this title
  alone in a tab / history / site map." Judging that "Step 2 of 4" cannot identify
  the page out of context is a human contextual judgement.

## Citation
> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "The title of each web page should:" … "Make sense when read out of context, for
> example by a screen reader or in a site map or list of search results"

> **Reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "the current location without requiring users to read or interpret page content. When"
> […] "titles appear in site maps or lists of search results, users can more quickly
> identify" […] "the content they need."

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the
> title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> "This describes a failure condition when the web page has a title, but the" […]
> "title does not identify the contents or purpose of the web page."
