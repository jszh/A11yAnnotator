# case-06 — English dashboard, incoherently mixed-language `<title>`

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness; multilingual garble)
- **Expected ACT-style outcome:** **failed**

## Scenario
An enterprise project-management dashboard ("Tasklane", `<html lang="en">`). The body —
sidebar nav, metric cards, an active-projects table, status pills — is clear English.
The `<title>` is an incoherent concatenation of homepage boilerplate from four locales:
**"Página Home Welcome Bienvenue"** (Spanish "Página", English "Home"/"Welcome", French
"Bienvenue"). This is the classic residue of a broken i18n build that concatenated every
locale's label instead of selecting one.

## Element / selector carrying the issue
`head > title` — content `Página Home Welcome Bienvenue`.

## Exact accessibility mechanism
The user agent exposes "Página Home Welcome Bienvenue" as the document title (screen
reader on load, tab name, bookmark, history). No single audience can parse this as a
meaningful phrase — it is a mixed-language word-salad — and it names only generic
"home/welcome" concepts, never the actual page topic (a Q3 project dashboard). An
English-reading user (the page's audience) cannot use it to recognise, distinguish, or
return to this dashboard among other open tabs or in search results. The title is
present and non-empty, so the failure is semantic: the present title is meaningless and
non-descriptive for the audience.

## Why automated tools cannot detect it
- The title is present, non-empty, and composed of real words from real languages —
  axe-core / WAVE / Lighthouse missing-/empty-title rules PASS.
- A language detector cannot help: the title is all-Latin-script and genuinely
  multilingual, and legitimate brand titles deliberately mix languages
  ("Bonjour · Hello · Welcome"). There is no reliable automated signal distinguishing a
  curated multilingual greeting from this broken concatenation, and neither flags the
  deeper problem — that it fails to name *this* page's topic. Recognising the jumble as
  build garbage that defeats identification for the English audience requires a human
  reading the title and the body.

## Citation

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages* (`wcag-techniques/general/G88.html`)
>
> Verbatim quote (Description):
> "The objective of this technique is to give each web page a descriptive title. Descriptive titles help users find content, orient themselves within it, and navigate through it."

> **Reference:** WCAG Understanding 2.4.2 Page Titled (`wcag-understanding/page-titled.html`, Intent)
>
> Verbatim quote (HTML source line-wrapping normalized to single spaces; wording unchanged):
> "Titles identify the current location without requiring users to read or interpret page content. When titles appear in site maps or lists of search results, users can more quickly identify the content they need. User agents make the title of the page easily available to the user for identifying the page. For instance, a user agent may display the page title in the  window title bar or as the name of the tab containing the page."
