# case-01 — News article titled after its top promo banner

## Scenario
A long-form local-news article (the dominant main column, ~600 words) reports on the
Cedar Falls City Council adopting a $214M municipal budget after a contested late-night
vote on police and parks funding. The browser/AT page title, however, reads
**"Summer Sale — 20% Off Annual Subscriptions | Cedar Falls Tribune"** — text lifted from
the rotating subscription promo banner pinned to the top of the page. The title accurately
describes a real, present *peripheral* block (the promo) while saying nothing about the
page's primary subject (the budget vote).

## Attribute tuple
- **content-domain:** news / long-form editorial (civic government)
- **UI-component / pattern:** top promo / subscription marketing banner
- **host-language construct:** `<title>` templated from a marketing-region string instead of the `<article>` headline
- **locale / i18n:** en-US
- **failure-mechanism:** present-but-wrong-region — title names a peripheral promo block, not the dominant content region (F25)

## Developer persona
A CMS/marketing engineer wired the newspaper's template so that the site-wide
"current campaign" string (managed by the marketing team in a separate promo module)
is concatenated into every page's `<title>` for SEO/conversion experiments. The article's
own headline field was never mapped into the title tag. The promo team rotates the banner
copy ("Summer Sale…") without ever realizing it is overwriting the document title of every
news story.

## Element / selector carrying the issue
- `head > title` — value: `Summer Sale — 20% Off Annual Subscriptions | Cedar Falls Tribune`
- Compared against the primary region `article#... > h1#hl` — the actual topic
  ("Council approves $214M Cedar Falls budget after marathon vote…").
- The peripheral source region is `.promo-banner` (`role="region"` "Promotion").

## Exact accessibility mechanism (what AT experiences)
A screen-reader user who opens this tab hears the page announced by its title: "Summer
Sale — 20% Off Annual Subscriptions, Cedar Falls Tribune." In a list of open tabs, in
browser history, in a bookmark, or in search results, the page is filed under a sale promo.
The user has no way to tell from the title that this page is the city-budget story they were
looking for; two different news stories on the site could carry the identical promo title,
so the title also fails to *distinguish* the page. The descriptive-title expectation of the
SC ("describe the topic or purpose of the **overall content** of the document") is not met,
even though a `<title>` is present and non-empty.

## Expected ACT-style outcome
**failed** (ACT rule c4a8a4 "HTML page title is descriptive" — Expectation: the title
"describes the topic or purpose of the overall content of the document"; here it describes
a peripheral block instead).

## Why automated tools miss it
axe-core's `document-title`, WAVE, and Lighthouse only confirm a non-empty `<title>` exists.
The title's words ("Summer Sale", "Subscriptions") *do* appear in the DOM (in the promo
banner), so even a naive keyword-presence heuristic finds them and reports a pass. No
automated tool builds a model of which region is the page's PRIMARY topic versus a promo
rail, and none compares the title against the dominant content region. Deciding that the
$214M budget article — not the sale banner — is what the page is about requires human
reading comprehension and a sense of visual/semantic prominence.

## Citation
**Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of
a web page not identifying the contents* (`wcag-techniques/failures/F25.html`).

> "This describes a failure condition when the web page has a title, but the title does not
> identify the contents or purpose of the web page."

**Supporting reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
(`wcag-techniques/general/G88.html`).

> "Identify the subject of the web page"
