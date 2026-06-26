# case-06 — Staff bio page titled only "About Our Team"

## Scenario
A law-firm staff bio page for ONE named person. The body identifies her unambiguously:
a portrait (inline SVG with `aria-label="Portrait of Dr. Amara Singh"`), an `<h1>`
"Dr. Amara Singh", her role ("Partner — Intellectual Property & Patents"), contact
details, and a two-paragraph bio. The `<title>` is just **"About Our Team"** — the
section/department label, identical on every individual's bio page.

## Element / selector carrying the issue
`head > title` (value: `About Our Team`), judged against `.bio > div > h1`
("Dr. Amara Singh"), `.role`, and the breadcrumb `[aria-current="page"]` that names her.

## Exact accessibility mechanism (what AT experiences and why it fails)
The single datum a user needs to distinguish a bio page from its siblings is the
person's NAME — and that is exactly what the title omits. A screen-reader user who
opens several attorneys' bios in tabs (to compare specialties, say) hears the identical
"About Our Team" for every one; the document name, history entry, and any bookmark all
collapse to the section label. The person's name lives only in the body `<h1>` and the
SVG's accessible name, neither of which is surfaced as the page title. Per SC 2.4.2,
the title must identify the page's content/purpose and, within a set, distinguish it
from the other pages; "About Our Team" identifies the *section* but not *which member*,
so the distinguishability limb fails.

## Why automated tools cannot detect this
"About Our Team" is present, non-empty, well-formed, and a legitimate description of
the section, so axe/WAVE/Lighthouse pass. Knowing the title should instead carry the
person's name requires reading the bio, recognising it as one profile in a team
directory, and inferring that every profile reuses the same section title. That is a
human, content-level, cross-page judgement no single-page linter performs.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability)

## Citation
> **Trusted Tester v5.1.3, `refs/trusted-tester/sc-2.4.2-page-titled.md` (Test 12.B — Evaluate Results):**
> "If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."

> **WCAG Technique G88, `wcag-techniques/general/G88.html` (Description):**
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"
