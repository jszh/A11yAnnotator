# case-06 — Movie detail page titled with the wrong film in the same franchise

## Scenario
A film-database detail page. The `<title>` reads **"The Matrix (1999) — Film Details |
ReelIndex"**, but the page is the detail record for the **sequel**, *The Matrix
Reloaded (2003)*. The body fixes the entity unambiguously: the breadcrumb's current page
("The Matrix Reloaded"), the poster ("THE MATRIX RELOADED (2003)"), a "Part 2 of the
Matrix trilogy" badge, the `<h1>` ("The Matrix Reloaded (2003)"), release date
May 15 2003, runtime 138 min, cast members marked "(new in Reloaded)", a synopsis that
says it "picks up after the events of the first film," and a trilogy list that marks
Reloaded as "you are here." The title names a real, closely related, *same-franchise*
film — and even gets the year wrong (1999 vs 2003). It is descriptive-shaped with very
high lexical overlap ("The Matrix") yet identifies the adjacent entity, not this page.

## Element / selector carrying the issue
- `head > title` — `The Matrix (1999) — Film Details | ReelIndex`
- Contradicted by `.hero h1` (`The Matrix Reloaded (2003)`), `.badge`
  (`Part 2 of the Matrix trilogy`), `nav.crumbs [aria-current="page"]`
  (`The Matrix Reloaded`), the `Released: May 15, 2003` fact, and the trilogy list
  marking Reloaded "you are here."

## Exact accessibility mechanism (what AT experiences and why it fails)
For a catalogue of closely related items (a film trilogy), the title is what lets a user
tell the entries apart. AT announces "The Matrix (1999)"; a user looking up the
*original* 1999 film accepts this page, then encounters Reloaded-specific facts (2003,
the Architect, new cast) and is confused — or, scanning tabs, the user who actually
wanted Reloaded skips this page because its name says the wrong film/year. Because the
two films share a franchise name, the error is easy to miss yet fully misidentifies the
record. The title does not identify the contents of this page and mis-distinguishes it
within the trilogy set. Limb-2 (descriptiveness) failure per F25.

> Boundary note (what would PASS): had the `<title>` read "The Matrix Reloaded (2003) —
> Film Details | ReelIndex", it would correctly identify this page and pass 2.4.2. The
> only defect is the specific entity/year asserted; the shape, length, and host-language
> markup are already correct.

## Why automated tools cannot detect it
"The Matrix (1999) — Film Details | ReelIndex" is non-empty, unique, idiomatic, and
exactly the right shape for a film page — it passes 2779a5 and any descriptiveness
heuristic. Lexical overlap is *very high* (the franchise token "The Matrix" saturates
the body), so an overlap-based check is actively fooled. Catching the failure requires
distinguishing two real, similarly named entities — knowing that *The Matrix* and
*The Matrix Reloaded* are different films, extracting which one this page documents
(Reloaded, via "Part 2", the 2003 date, the new cast, "you are here"), and noticing the
title names the other. That is world-knowledge entity disambiguation, not a rule a
linter can run.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG Understanding 2.4.2 Page Titled — Examples (A set of web pages)
> File: `wcag-understanding/page-titled.html`
>
> "Specific patterns are pages titled \"X Pattern | APG | WAI | W3C\" (e.g., \"Alert and Message Dialogs Pattern | APG | WAI | W3C\")"
