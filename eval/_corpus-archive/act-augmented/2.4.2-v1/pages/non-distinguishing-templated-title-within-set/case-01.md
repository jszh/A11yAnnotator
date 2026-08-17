# case-01 — Dated blog post titled only "Engineering Blog"

## Scenario
A single, fully-rendered blog post. The body is unmistakably ONE specific dated
article: an `<h1>` "Why we migrated our ingest pipeline to Rust", a byline, a
`<time datetime="2024-03-02">March 2, 2024</time>` stamp, tags, and a footer that
reads "This is post 47 of the Engineering Blog. Browse the full archive for the
other 46 posts." The `<title>`, however, is just **"Engineering Blog"** — the
section label that would be byte-identical on all 47 posts.

## Element / selector carrying the issue
`head > title` (value: `Engineering Blog`), judged against the page's own body
evidence: `article > h1`, `.post-meta time`, and `footer.site` ("post 47 of …").

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user lands here from a search-result list or a set of open tabs.
The accessible name announced for the document / tab is the `<title>`: **"Engineering
Blog"**. That string is topically relevant — it correctly names the section — but it
is the templated CONSTANT, not the per-page variable. Every one of the 47 posts would
announce the identical "Engineering Blog", so the user cannot tell *this* post from
the other 46, cannot distinguish it among tabs, and cannot re-find it in history or a
bookmark list. The per-page identity ("Why we migrated … to Rust", March 2 2024)
lives only in the body `<h1>`/`<time>`, which the title bar / tab / search snippet
never surfaces. SC 2.4.2 Limb 2 (distinguishability within a set) therefore fails:
the title does not distinguish the page from other pages in the set.

## Why automated tools cannot detect this
The `<title>` is present, non-empty, and a real English phrase that genuinely matches
the page topic — so axe-core (`document-title`), WAVE, Lighthouse, and HTML-CS all
pass it. Detecting the failure requires (a) reading the body to infer that this is
ONE item in an obvious collection, and (b) judging that "Engineering Blog" is the
template constant that repeats verbatim on siblings — a semantic, cross-page
inference a single-page automated tool cannot make without crawling, and even with a
crawl it cannot decide the pages *should* differ.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability)

## Citation
> **WCAG Technique F25 (Failure), `wcag-techniques/failures/F25.html`:**
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

> **Trusted Tester v5.1.3, `refs/trusted-tester/sc-2.4.2-page-titled.md` (Test 12.B):**
> "If the web page is part of a set of web pages, determine whether the Page Title is sufficient to distinguish the web page from other pages."
