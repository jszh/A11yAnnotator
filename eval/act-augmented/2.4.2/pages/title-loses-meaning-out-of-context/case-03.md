# case-03 — API reference page titled only "GET /users"

## Scenario
An auto-generated REST API reference (Helios Identity API v3). The page documents one endpoint.
On-page context is complete: a masthead "Helios Identity API · v3 (stable)", a left rail grouping
endpoints under "Users", a breadcrumb "Helios Identity API v3 › Users › List users", the endpoint
signature, parameters, and example request/response. But the OpenAPI doc generator set the
`<title>` to the bare operation string **`GET /users`** — no product, no version, no section.

## Attribute tuple
- **content-domain:** developer API documentation portal
- **UI-component/pattern:** OpenAPI-generated endpoint reference (sidebar + params table + code samples); no `<h1>`, an `.endpoint` heading div instead
- **host-language construct:** templated `<title>` derived from `{method} {path}`
- **locale/i18n:** en
- **failure-mechanism:** title is so generic it cannot distinguish the page from countless near-identical pages elsewhere on the web

## Developer persona
A platform engineer who configured the docs generator's title template as
`{{operation.method}} {{operation.path}}` because it looked clean and unique *within* this API.
They didn't account for "GET /users" being one of the most common endpoint strings on the internet
— shared by their own Billing API, competitors' docs, and Stack Overflow tabs — so it is useless
once it leaves this page's masthead.

## Element / selector carrying the issue
`head > title` (text node `GET /users`). (This page deliberately has no `<h1>`; the visible heading
is the `.endpoint` div, realistic for generated reference pages — the title is the load-bearing
artifact for 2.4.2 regardless.)

## Exact accessibility mechanism (what AT experiences, why it fails)
A developer keeps many doc tabs open across products and APIs. The screen reader / tab strip /
bookmark shows "GET /users" with no way to tell whether it is the Identity API, the Billing API, a
rival's docs, or an old version. The title identifies the operation but not the *page* — it strips
the product, version, and section that make it meaningful out of context, and it does not
distinguish this page from the dozens of "GET /users" pages that exist. Fails limb (b).

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The `<title>` is present and non-empty, so 2.4.2 passes mechanically; "GET /users" is not a
placeholder string. Recognizing that this title is so generic it collides with countless pages
across the wider web — and so cannot identify *this* page out of context — requires world knowledge
about how common "GET /users" is and how API docs are navigated. That is human judgment, not a
DOM check.

## Citation
> **WCAG Technique G88 (Providing descriptive titles for web pages), Description — the title should:**
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"

(Verbatim from `wcag-techniques/general/G88.html`. The same Description also lists, as helpful,
that the title "Identify the site or other resource to which the web page belongs" and
"Be unique within the site or other resource to which the web page belongs" — both omitted here.)

> **Understanding SC 2.4.2, Intent:**
> "When titles appear in site maps or lists of search results, users can more quickly identify the content they need." (Source wraps across two lines; line break normalized to a space.)

(Verbatim from `wcag-understanding/page-titled.html`. In a search-results list, "GET /users" cannot
be told apart from any other product's identical endpoint.)
