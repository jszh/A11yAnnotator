# case-07 — Arabic (RTL) e-service article, untranslated English CMS default `<title>`

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness; wrong-language for RTL audience)
- **Expected ACT-style outcome:** **failed**

## Scenario
An Arabic government e-services article ("البوابة الوطنية للخدمات الإلكترونية",
`<html lang="ar" dir="rtl">`) explaining how to apply for an e-Visa. The body — RTL
header, headings, lead paragraph, numbered steps, an info note — is substantive,
idiomatic Arabic. The `<title>` is the untranslated English CMS default
**"Home | National Portal"**: the head template was never localized for the Arabic
locale, so the generic English homepage title shipped on this content page.

## Element / selector carrying the issue
`head > title` — content `Home | National Portal`.

## Exact accessibility mechanism
The user agent exposes "Home | National Portal" as the document title — announced by the
screen reader, shown as the (LTR) tab label, the bookmark, and the history entry — on a
page whose audience reads Arabic. The title fails on two counts at once:

1. **Wrong language:** it is Latin-script English; an Arabic-only reader cannot read it
   to identify the page among open tabs, in history, or in a search-result list.
2. **Generic / wrong page:** even an English reader gets "Home", not "e-Visa
   application guide" — the title does not name this page's contents and does not
   distinguish it from the site's other pages (an F25 template-reuse failure).

The title is present and well-formed, so the SC failure is semantic: an
audience-unreadable, generic title that defeats out-of-context identification.

## Boundary this case illustrates (why the failure is genuinely judgment-dependent)
The *same* page would **pass** if the title led with the Arabic topic and merely
appended an English label, e.g.
`كيفية تقديم طلب التأشيرة الإلكترونية | National Portal`. Foreign words / Latin script
in a title are **not per se a failure**; an Arabic-reading audience can identify the
page from a leading Arabic topic even with a trailing English brand fragment. The
failure here is that the title is *only* in a language the audience cannot use AND is
generic — a distinction no script/language detector can draw.

## Why automated tools cannot detect it
- "Home | National Portal" is a present, non-empty, well-formed English title;
  axe-core / WAVE / Lighthouse missing-/empty-title rules PASS.
- A language detector would correctly say "title: English, body: Arabic", but
  language-mismatch is not a usable failure signal (the bilingual variant above is
  valid; many pages legitimately carry brand/Latin fragments). Deciding that this
  English-only, generic title is useless to the Arabic audience requires reading the
  title and the body and reasoning about who reads the page — a human task.

## Citation

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> Verbatim quote (Evaluate Results — PASS if ALL true):
> "The Page Title accurately identifies the contents or purpose of the web page, AND"
> "If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> Verbatim quote (Examples):
> "A site generated using templates includes the same title for each
> page on the site. So the title cannot be used to distinguish among
> the pages."
