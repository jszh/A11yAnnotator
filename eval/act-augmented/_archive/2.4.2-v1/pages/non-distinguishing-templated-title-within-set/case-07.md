# case-07 — Paginated news listing, "Page 4 of 12" (BOUNDARY: PASS)

## Scenario
A paginated section-listing page for a local newspaper. The body shows it is page 4 of
a 12-page list: a "Page 4 of 12" indicator, three story summaries, and a pagination nav
with page 4 marked `aria-current="page"`. Unlike case-04..06, the `<title>` here
**correctly carries the per-page variable**: **"Latest News — Page 4 of 12 | Meridian
Times"**. This is the deliberate contrast / boundary case for the aspect.

## Element / selector carrying the issue (here: the element that makes it PASS)
`head > title` (value: `Latest News — Page 4 of 12 | Meridian Times`), consistent with
`.section-head h1` ("Latest News"), `.section-head .pageno` ("Page 4 of 12"), and
`nav.pagination [aria-current="page"]` (page 4).

## Why this is the sharp boundary
Pagination is exactly the case the aspect analysis flags as legitimately ambiguous:
sibling listing pages share a topic ("Latest News"), so a shared section label is not
automatically a failure the way a per-item page (one post, one SKU, one bio) is. The
deciding factor is whether the title carries the page's distinguishing variable. The
**failing** sibling would be titled bare "Latest News" on every page — page 4 then
sounds identical to page 1, and a screen-reader user paging through cannot tell where
they are or return to a specific page. This page instead embeds "Page 4 of 12" in the
title, so each of the 12 pages produces a distinct, position-bearing accessible name.
Limb 1 (topic relevance) and Limb 2 (distinguishability within the set) are both
satisfied, following the G88 pattern of putting the page-identifying part first/with the
site name.

## What AT experiences
The document / tab name announces "Latest News — Page 4 of 12 | Meridian Times". A
screen-reader user can tell this is page 4, distinguish it from the other 11 pages in
the set, bookmark it meaningfully, and find it again in history or search results. No
barrier.

## Why automated tools cannot adjudicate this either
Automated tools pass any non-empty title, so they would "pass" both this page and its
bare-"Latest News" failing sibling identically — they cannot tell the well-titled
paginated page from the badly-titled one, because both have present, non-empty,
relevant titles. Confirming this page actually *passes* limb 2 (rather than just
having a non-empty title) still requires the human judgement that the title encodes the
page's distinguishing index; the tool's "pass" here is coincidental, not a real
evaluation of distinguishability.

## Expected ACT-style outcome
**passed** (SC 2.4.2, Level A — title is relevant AND distinguishes this page within
the set)

## Citation
> **WCAG Technique G88, `wcag-techniques/general/G88.html` (Examples — A newspaper web page):**
> "A website that only permits viewing of the current edition titles its web page \"National News, Front Page\". A website that permits editions from different dates to be viewed titles its web page, \"National News, Front Page, Oct 17, 2005\"."

> **Trusted Tester v5.1.3, `refs/trusted-tester/sc-2.4.2-page-titled.md` (Test 12.B — Evaluate Results):**
> "The Page Title accurately identifies the contents or purpose of the web page, AND … the Page Title accurately distinguishes the web page from other pages in the web site."
