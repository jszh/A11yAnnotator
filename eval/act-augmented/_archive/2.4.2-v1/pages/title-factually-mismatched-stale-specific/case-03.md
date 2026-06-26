# case-03 — Staff profile titled with a different colleague's name

## Scenario
A team-directory profile page. The body is entirely and consistently the profile of
**Jordan Lee**: the `<h1>`, the role line, the facts definition list (Name, Email
`jordan.lee@brightwell.example`, "Reports to Priya Raman"), the photo's `alt` text
("Portrait of Jordan Lee"), the avatar initials "JL", and a bio section headed "About
Jordan" that uses the name four times. The `<title>` reads **"Maria Gomez — Profile |
Brightwell Team"** — the name of a *different* colleague, a stale value left over from
the sibling profile this templated page was duplicated from. The title is fully
descriptive-shaped (a person's name + "Profile" + the org) — it just identifies the
wrong person.

## Element / selector carrying the issue
- `head > title` — `Maria Gomez — Profile | Brightwell Team`
- Contradicted by `article h1#person-name` (`Jordan Lee`), `dl.facts dd` (`Jordan Lee`,
  `jordan.lee@brightwell.example`), `img.avatar[alt]` (`Portrait of Jordan Lee`), and
  the `About Jordan` bio.

## Exact accessibility mechanism (what AT experiences and why it fails)
On a person-profile page the *single most identifying fact* is whose profile it is, and
the page title is the primary place AT surfaces that identity out of context — in the
tab/window list, in browser history, and as the document's announced name on load. A
screen-reader user navigating between several open profiles hears "Maria Gomez —
Profile" and reasonably concludes this is Maria's page; in fact it is Jordan's. They may
email the wrong person, attribute Jordan's role/reporting line to Maria, or skip this
page when actually looking for Jordan. The title does not identify the contents of this
page and mis-distinguishes it within the directory set. Limb-2 (descriptiveness) failure
per F25. (Critically, the `img alt` is *correct* — "Jordan Lee" — so this is not a
1.1.1 alt-text defect; the defect lives only in `<title>`.)

## Why automated tools cannot detect it
"Maria Gomez — Profile | Brightwell Team" is non-empty, unique, grammatically clean, and
shaped exactly like a good profile title — it passes 2779a5 and any descriptiveness
heuristic. Automated tooling has no notion of "the person this page is about"; it cannot
extract the body's salient identifying entity (Jordan Lee, established by heading + facts
list + alt text + bio) and compare it to the name asserted in the title. The two names
share the same syntactic slot and both look like valid people, so there is no
attribute-, contrast-, or structure-level signal to fire on. Only semantic
entity-resolution — a human or model reading the body and noticing the title names
someone else — exposes it.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG Techniques — G88 (Providing descriptive titles for web pages)
> File: `wcag-techniques/general/G88.html`
>
> "The title of each web page should: Identify the subject of the web page … Make sense when read out of context, for example by a screen reader or in a site map or list of search results."
