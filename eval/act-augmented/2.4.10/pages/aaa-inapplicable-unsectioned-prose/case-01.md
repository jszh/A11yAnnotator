# case-01 — Family-archive reproduction of a personal wartime letter (no section headings)

## Scenario
A genealogy / family-archive site reproduces a single personal letter from a WWII
soldier to his mother. The letter wanders across several topics in one continuous flow
— the Channel crossing, the local weather, a farmer's wife and jam, money for the roof,
his brother Tom's apprenticeship, the food, a closing benediction — and ends with a
salutation, sign-off, and a postscript. There are NO headings inside the letter. The only
`<h1>` is the archive's own catalogue label for the artefact ("A Letter Home — Pvt. Edwin
Marsden to his mother, June 1944"), not a heading inside the prose.

This is the canonical AAA-inapplicability case from the Understanding text: "a long
letter would often cover different topics, but putting headings into a letter would be very
strange." The content is a single continuous personal communication, not a document
"organized into sections," so SC 2.4.10 does not apply.

## Attribute tuple
- **content-domain**: genealogy / family history archive (personal correspondence)
- **UI-component/pattern**: long-form document reproduction (artefact viewer with a catalogue/title bar)
- **host-language construct**: `<main>` containing only `<p>` elements (salutation / body / sign-off / P.S.); a single document-label `<h1>`
- **locale/i18n**: en-GB, 1940s register
- **failure-mechanism**: NONE present — this is a false-positive guard; the page is genuinely unsectioned prose and correctly has no section headings

## Developer persona
An archivist-developer building a small Omeka-style family-history site. The institutional
rule for the collection is **transcribe verbatim, add nothing** — the body of every letter
is reproduced exactly as written, with no editorial headings, summaries, or section breaks
inserted. The developer wrapped the transcription in a `<main>` and gave the *item* a
catalogue `<h1>`, exactly as the archive's metadata standard requires, and stopped there.
There was never any heading to omit: the source document has none and one cannot be added
to a pre-existing document.

## Element / selector carrying the issue
- No issue. The relevant elements are `main > p` (the letter body, salutation `p.salutation`,
  sign-off `div.signoff`). The lone `h1` is the artefact label, deliberately outside the
  letter's prose.

## Exact accessibility mechanism
A screen-reader user opening the heading list (NVDA Elements List / JAWS heading list /
VoiceOver rotor) hears exactly one heading: the artefact's catalogue title. That is correct
and sufficient — there is **nothing inside a personal letter for headings to label**. The
reader experiences the letter the way a sighted reader does: a continuous personal voice
moving naturally from one thought to the next. Imposing "Crossing", "Weather", "Money",
"Tom" headings would be both impossible (the author never wrote them; this is a pre-existing
document) and *wrong* — it would fracture an intimate continuous voice into bureaucratic
chunks. Because the content is not "organized into sections," the precondition for 2.4.10 is
not met, so the criterion is satisfied (not-applicable / passed).

## Expected ACT-style outcome
**passed** (equivalently *inapplicable* — the SC's applicability gate is not met). Flagging
this page as a 2.4.10 violation for "lacking section headings" would be a **false positive**.

## Why automated tools miss it
The DOM is a `<main>` full of `<p>` elements with zero `<h2>`..`<h6>`. To an automated
checker this is *structurally identical* to a sectioned article that forgot its headings:
both are "paragraphs, no heading elements." axe-core has no rule that fires here (a single
`<h1>` satisfies `page-has-heading-one`; there are no empty/disordered headings), and WAVE /
Lighthouse likewise see a valid, heading-light document. The ONLY way to reach the correct
verdict is to *read the prose*, recognise the genre (a personal letter with salutation and
sign-off), and apply the human judgment that a letter is not "organized into sections." No
tool can distinguish authorial-intent genre from missing structure, so no tool can avoid
either a false positive here or a false negative on case-02/case-04.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "This provision is included at Level AAA because it cannot be applied to all types of
> content and it may not always be possible to insert headings. For example, when posting a
> pre-existing document to the web, headings that an author did not include in the original
> document cannot be inserted. Or, a long letter would often cover different topics, but
> putting headings into a letter would be very strange."

> **WCAG 2.2 Understanding 2.4.10 — Intent (applicability gate)**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections."

> **WCAG Techniques — G141: Organizing a page using headings (When to Use)**
> "Pages with content organized into sections."
