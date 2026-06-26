# case-06 — Software-license page titled "About this"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-06.html`

## Scenario
The "About this license" panel of an application's settings (PixelForge Studio),
describing the MIT license of the bundled "Cartograph" mapping library, with the full
license text and an SPDX fact list. The `<title>` is the pronoun-only fragment
**"About this"** — the "this" has no antecedent once the page is detached.

## Element / selector carrying the issue
`head > title` (text `About this`). The breadcrumb (`nav.crumb`), the H1 ("About this
license"), and the package line supply the on-page context; the title is the H1 with
its noun amputated.

## Exact accessibility mechanism (what AT experiences)
The page announces / shows as **"About this"**. The pronoun "this" refers to whatever
the user was just looking at; with the antecedent gone (tab list, history, window
switcher) it points at nothing. Multiple "About this …" tabs — about this license,
about this plugin, about this device — collapse to identical "About this" entries and
become mutually indistinguishable. On the page the breadcrumb and H1 make the subject
(the Cartograph MIT license) clear, so a sighted user is oriented; the failure
appears only when the truncated title is consumed out of context.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes.
- **c4a8a4 (descriptive), automated parts:** "About this" literally opens the visible
  H1 "About this license", so a title/body lexical-overlap heuristic finds strong
  agreement — yet the title is a dangling pronoun phrase. Detecting that a pronoun
  fragment cannot stand alone requires a human to imagine the title read by itself;
  no axe/WAVE/Lighthouse rule encodes referential self-sufficiency.

## Citation
> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "The title can be used to identify the web page without requiring users to read or
> interpret page content. Users can more quickly identify the content they need when
> accurate, descriptive titles appear in site maps or lists of search results."

> **Reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "In cases where the page is a document or a web application, the name of the document"
> […] "or web application would be sufficient to describe the purpose of the page."

> **Reference:** Trusted Tester v5.1.3 — *Test 12.B `2.4.2-page-title-purpose`*
> (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> "If the web page is part of a set of web pages, determine whether the Page Title is
> sufficient to **distinguish** the web page from other pages."
