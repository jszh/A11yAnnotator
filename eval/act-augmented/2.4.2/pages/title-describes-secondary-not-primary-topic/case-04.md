# case-04 — Help article titled after its top announcement (maintenance) bar, cross-language

## Scenario
A product help-center article whose dominant main column is a step-by-step support article,
**"Resetting your password."** The document `<title>` is
**"Maintenance planifiée samedi 02 h–05 h HE — Aide Cendre"** — the text of the transient
service-status announcement bar pinned to the top of the page. Because this is a bilingual
(EN/FR) support product, the announcement bar copy is in French; the article body and the
`<html lang>` are English. The title accurately names a real, present *peripheral* status
banner about Saturday maintenance, not the page's actual subject (password reset). This is
the long-tail / i18n variant: the title is both *wrong-region* and *wrong-language*.

## Attribute tuple
- **content-domain:** SaaS help center / support knowledge base
- **UI-component / pattern:** top announcement / service-status bar (`role="region"` "Avis de service")
- **host-language construct:** `<title>` populated from the announcement-bar string; title language (fr) ≠ document `lang="en"`
- **locale / i18n:** bilingual EN/FR product; French announcement, English article — mismatched title language
- **failure-mechanism:** present-but-wrong-region (transient banner) compounded by a cross-language title under `lang="en"`

## Developer persona
A support engineer added a site-wide "incident/announcement" component that, when active,
injects its message at the top of every help page. To boost visibility of incidents, a
template hook also pushes the active announcement string into `document.title` ("so people
see it even in their tab"). The hook fires for the French announcement even on the English
locale's pages, and never reverts the title to the article's own `<h1>`. QA tested the
banner's appearance but never checked the tab title.

## Element / selector carrying the issue
- `head > title` — value: `Maintenance planifiée samedi 02 h–05 h HE — Aide Cendre`
- Primary region: `article.kb > h1#atitle` ("Resetting your password").
- Peripheral source region: `.announce` (`role="region"` "Avis de service"), `span[lang="fr"]`.
- Language mismatch: `<html lang="en">` vs. a French-language `<title>`.

## Exact accessibility mechanism (what AT experiences)
On load, a screen reader set to English announces the page as "Maintenance planifiée samedi
zero deux h zero cinq h H E, Aide Cendre," mispronouncing the French because the document is
declared `lang="en"` and the `<title>` carries no language override. A blind user trying to
locate the "reset my password" instructions among open tabs hears only a maintenance notice
in a mangled foreign-sounding string, and cannot tell this is the password-reset article.
The title fails limb (b) of SC 2.4.2 — it does not identify the topic/purpose of the overall
content — and the transient banner it names will be stale once maintenance is over, leaving
a permanently misleading title.

## Expected ACT-style outcome
**failed** (ACT rule c4a8a4 — the title describes a peripheral, transient announcement
region rather than the article's topic). (The cross-language `<title>` is an aggravating
factor relevant to 3.1.2, but the 2.4.2 failure stands on the wrong-region judgment alone.)

## Why automated tools miss it
The `<title>` is present and non-empty, so axe-core `document-title`, WAVE, and Lighthouse
pass 2.4.2. The announcement words appear in the DOM, so keyword-overlap heuristics match.
`<html lang="en">` is present, so a naive language-attribute check is satisfied too. No tool
can determine that the page is principally about resetting a password rather than about
Saturday maintenance — that requires reading the article, recognizing the announcement as a
transient peripheral banner, and judging which region is the page's primary topic.

## Citation
**Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of
a web page not identifying the contents* (`wcag-techniques/failures/F25.html`).

> "This describes a failure condition when the web page has a title, but the title does not
> identify the contents or purpose of the web page."

**Supporting reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
(`wcag-understanding/page-titled.html`).

> "The intent of this success criterion is to help users find content and orient themselves
> within it by ensuring that each web page has a descriptive title. Titles identify the
> current location without requiring users to read or interpret page content."
