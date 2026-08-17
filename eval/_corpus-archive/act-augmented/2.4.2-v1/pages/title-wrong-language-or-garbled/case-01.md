# case-01 — German article body, English boilerplate `<title>`

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness, audience/language-dependent)
- **Expected ACT-style outcome:** **failed**

## Scenario
A regional German news site ("Tageskurier Norddeutschland"). The document is
`<html lang="de">` and the entire article — headline, byline, body, sidebar,
navigation, footer — is substantive, idiomatic German. The `<title>`, however, is the
CMS's un-localized English boilerplate **"Welcome to our website"**: the `<head>`
template was never translated for the German locale.

## Element / selector carrying the issue
`head > title` — content `Welcome to our website`.
(The body is correct; the defect is isolated to the title element.)

## Exact accessibility mechanism
A screen-reader user on this page hears the document title announced as the English
phrase "Welcome to our website" when the page loads, and that same string is what the
user agent exposes as the tab name, the default bookmark name, the browser-history
entry, and the search-result heading. The page's audience are German readers (the body
is German, `lang="de"`). For them the title:

1. is in a language many of them may not read, and
2. even if read, names no topic — it is generic boilerplate ("Welcome to our
   website"), not "Hamburg / Radwegenetz / 2030".

So the title cannot be used for **out-of-context identification** (in a tab strip of
several open pages, in history, in a list of search results) by the audience that
actually reads this page. That is precisely the function G88 / SC 2.4.2 require a title
to serve. The title is present and well-formed, so the SC failure is purely semantic:
present-but-not-usable-for-this-audience.

## Why automated tools cannot detect it
- axe-core / WAVE / Lighthouse check that a `<title>` exists and is non-empty.
  "Welcome to our website" is a present, non-empty, perfectly well-formed English
  title, so every one of them PASSES.
- A non-English (or here, English-on-a-German-page) title is **not per se a failure** —
  countless valid pages carry foreign-language or brand-boilerplate titles. A tool
  cannot decide whether the title's language mismatches *this page's audience* and
  thereby defeats identification without reading the German body, inferring the
  intended audience, and judging that the English boilerplate is useless to them.
  That is a human semantic/linguistic judgment.

## Citation

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> Verbatim quote:
> "The title of each web page should:
> - Identify the subject of the web page
> - Make sense when read out of context, for example by a screen reader or in a site map or list of search results
> - Be short"

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> Verbatim quote:
> "This describes a failure condition when the web page has a title, but the
> title does not identify the contents or purpose of the web page."
