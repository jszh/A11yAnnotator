# case-05 — Museum collection object titled only "Lámina 12" (Plate 12), Spanish locale

## Scenario
A natural-history museum's digital-collection object viewer (Museo Nacional de Historia Natural),
Spanish locale (`<html lang="es">`). Each plate of a digitised botanical portfolio is one page.
The body fully identifies the object: institution band, breadcrumb "Colecciones digitales ›
Ilustración botánica › Flora Mexicana, Tomo II › Lámina 12 de 48", a collection over-line, the H1
"Lámina 12: Dalia silvestre", the Latin name, and a metadata list (collection, work, plate 12 of
48, author, technique, inventory № MNHN-IB-1803-0212). But the i18n template built the `<title>`
from only the localised plate label + number, yielding the bare fragment **`Lámina 12`** (Plate 12).

## Attribute tuple
- **content-domain:** GLAM — museum / digital cultural-heritage collection (botanical illustration)
- **UI-component/pattern:** object/record viewer with image plate + metadata `<dl>` + action buttons
- **host-language construct:** i18n `<title>` assembled from `{plateLabel} {plateNumber}` translation keys
- **locale/i18n:** es (Spanish) — the non-descriptive title is well-formed in another language
- **failure-mechanism:** localised positional fragment that loses all collection context out of context (G127)

## Developer persona
A digital-collections developer who internationalised the viewer. They added translation keys for
the plate label (`plate.label` → "Lámina") and concatenated it with the plate number for the
`<title>`, so the title would localise cleanly. They never considered that "Lámina 12" — like
"Plate 12" in English — strips the portfolio, subject, and collection that the body carries, and is
identical for plate 12 of every other digitised work.

## Element / selector carrying the issue
`head > title` (text node `Lámina 12`), in a `lang="es"` document.

## Exact accessibility mechanism (what AT experiences, why it fails)
A Spanish-speaking screen-reader user browsing the collection, or anyone who saved several plates to
tabs, hears/sees "Lámina 12" with no portfolio ("Flora Mexicana, Tomo II"), no subject ("Dalia
silvestre"), and no collection. It is identical to plate 12 of any other digitised work and, in a
Europeana or Google result, gives nothing to choose by. The title is meaningful only beside the
on-page metadata; isolated it conveys no topic and no collection position. Fails limb (b).

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A `<title>` is present and non-empty (2.4.2 passes); "Lámina 12" is well-formed Spanish and on no
placeholder list. Judging descriptiveness is already a human task; doing it across a different
natural language compounds the difficulty — an automated tool has no notion that this localised
"Plate 12" loses all collection context, nor that it collides with every other work's plate 12.

## Citation
> **WCAG Technique G127 (Identifying a web page's relationship to a larger collection of web pages), Description:**
> "The objective of this technique is to enable users to identify the relationship between the current web page and other web pages in the same collection (e.g., on the same website). … the information is provided by including the relevant information in the title of the web page."

(Verbatim from `wcag-techniques/general/G127.html`. "Lámina 12" includes no relationship to the
"Flora Mexicana, Tomo II" portfolio or the wider collection — that information is only in the body.)

> **WCAG Technique G88 (Providing descriptive titles for web pages), Description — the title should:**
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"

(Verbatim from `wcag-techniques/general/G88.html`.)
