# case-04 — Court e-filing document titled only "Exhibit B"

## Scenario
A court electronic-filing document viewer (CM/ECF-style, U.S. District Court). The page shows one
filed exhibit. The body is fully self-identifying: the government band, the court masthead, a docket
bar ("Case: 3:24-cv-04417-WHA · Title: Marisol Vega v. Brightline Logistics, Inc. · Document:
#42-2"), the case caption, and the document's full label "Exhibit B — Commercial Lease Agreement
dated March 14, 2022 … Exhibit B of F." But the viewer's template derived the `<title>` from only
the short-label field, yielding the bare positional fragment **`Exhibit B`**.

## Attribute tuple
- **content-domain:** government / legal — court records (PACER/CM/ECF)
- **UI-component/pattern:** document viewer with case caption + embedded page preview
- **host-language construct:** `<title>` bound to a `document.shortLabel` field, not the full caption
- **locale/i18n:** en
- **failure-mechanism:** context-dependent fragment that only makes sense beside the on-page case caption (G127 collection position stripped)

## Developer persona
A government-contractor developer maintaining the legacy ECF viewer. Each document record has a
`shortLabel` ("Exhibit B"), a `longLabel`, a `caseCaption`, and a `docketNumber`. The viewer's HTML
template used `<title>{{shortLabel}}</title>` years ago and it was never revisited; the rich caption
is assembled only in the body. It passed every automated VPAT scan, so no one flagged it.

## Element / selector carrying the issue
`head > title` (text node `Exhibit B`).

## Exact accessibility mechanism (what AT experiences, why it fails)
An attorney or paralegal using a screen reader routinely keeps a dozen exhibit tabs open across
several active cases. The tab strip, browser history, bookmarks, and the screen-reader page-title
query all read "Exhibit B" — identical across every case's exhibit B, with no case name, no
document number, and no statement of what the exhibit is. The title is meaningful only while the
case caption is on screen; isolated, it conveys nothing and cannot distinguish among the open
documents. Fails limb (b) for descriptiveness out of context and for distinguishing within a set.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A non-empty `<title>` is present, so document-title checks pass; "Exhibit B" is not a known
placeholder, so heuristic blocklists don't fire. Knowing that "Exhibit B" is a positional fragment
meaningless once it leaves the on-page caption — and that every case has one, so the pages aren't
distinguishable — is contextual legal-document reasoning no automated tool can do.

## Citation
> **WCAG Technique G88 (Providing descriptive titles for web pages), Description:**
> "A descriptive title allows a user to easily identify what web page they are using and to tell when the web page has changed. The title can be used to identify the web page without requiring users to read or interpret page content."

(Verbatim from `wcag-techniques/general/G88.html`. "Exhibit B" can be identified *only* by reading
the page content — the exact opposite of this requirement.)

> **Trusted Tester v5.1.3, Test 12.B — How to Test, step 3.a:**
> "If the web page is part of a set of web pages, determine whether the Page Title is sufficient to distinguish the web page from other pages."

(Verbatim from `refs/trusted-tester/sc-2.4.2-page-titled.md`. Every case's "Exhibit B" is identical.)
