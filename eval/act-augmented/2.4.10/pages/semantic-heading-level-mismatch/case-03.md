# case-03 — API docs: two co-equal endpoints marked h2 and h3 (DELETE demoted under POST)

## Scenario
A developer-docs page ("Webhooks API — Endpoints", `h1`) documents two endpoints on the same
`/v2/webhooks` collection: **POST Create a webhook** and **DELETE Delete a webhook**. The
intro states there are two endpoints and that "neither is a sub-operation of the other."
"Create a webhook" is `h2`; "Delete a webhook" is `h3`. The demotion makes the AT outline
read DELETE as a child operation of POST. A later peer section, "Verifying deliveries", is
correctly `h2`. No numeric level is skipped (h1 → h2 → h3 → h2).

## Attribute tuple
- **content-domain**: developer docs / REST API reference
- **UI-component/pattern**: endpoint reference blocks with HTTP verb badges, code samples,
  parameter tables
- **host-language construct**: native headings; verb badge is an inline `<span>`, so the
  accessible name of each heading is the full "VERB + summary" text
- **locale/i18n**: en
- **failure-mechanism**: (b) two co-equal peer sections given different levels so one falsely
  nests under the other

## Developer persona
The docs are generated from an OpenAPI spec by a script that emits one heading per operation
and increments the level for each subsequent operation under a resource (a bug in the
generator's "section depth" counter). The first operation came out `h2`, the next `h3`. The
author skimmed the rendered page, saw two tidy endpoint blocks, and shipped it — the level
bug is only visible in the heading tree, not in the visual layout (the theme styles `h2` and
`h3` identically).

## Element / selector carrying the issue
- FAIL: the `h3` whose text is **"DELETE Delete a webhook"**
  (`.wrap > h3`). It should be `h2`, a sibling of the POST endpoint's `h2`.

## Exact accessibility mechanism
A blind developer navigating the reference by heading level hears:
> "POST Create a webhook, heading level 2 · DELETE Delete a webhook, heading level 3 ·
> Verifying deliveries, heading level 2."
The level-3 placement says DELETE is *part of* the Create operation — for an API reference
this is actively misleading: it suggests a relationship (sub-operation, nested resource) that
does not exist. A developer scanning for "the delete endpoint" as a top-level operation may
skip past it because it is filed one tier down, under POST. The levels assert containment the
REST semantics explicitly deny. The levels say "child of Create"; the content says "sibling
endpoint."

## Expected ACT-style outcome
**failed** — peer endpoints are given different levels, so the nesting contradicts the true
hierarchy (H69/G141 "properly nested").

## Why automated tools miss it
The sequence h1 → h2 → h3 → h2 is strictly non-skipping, so axe-core `heading-order`,
Lighthouse, and WAVE report a valid outline; all headings are non-empty and descriptive.
Recognising that POST and DELETE are sibling operations on one collection — not a
parent/child pair — requires understanding REST semantics and reading the explicit
"there are two endpoints … neither is a sub-operation of the other" sentence. No automated
tool reasons about API structure or document meaning.

## Citation
> **WCAG Techniques — H69 (Description)**
> "When headings are nested hierarchically, the most important information is given the
> highest logical level, and subsections are given subsequent logical levels.(i.e.,
> `h2` is a subsection of `h1`). Providing this type of structure will help users
> understand the overall organization of the content more easily."

> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "This clearly indicates the organization of the content, facilitates navigation within the
> content, and provides mental 'handles' that aid in comprehension of the content."
