# case-03 — Verbatim reproduction of a public-domain historical speech (no section headings)

## Scenario
A "Public Domain Speech Library" reproduces Chief Joseph's 1877 surrender speech verbatim.
A speech is a continuous spoken performance: it was never "organized into sections," and the
speaker obviously included no headings. Per the Understanding text, "when posting a
pre-existing document to the web, headings that an author did not include in the original
document cannot be inserted." The speech body is a `<blockquote class="speech">` of three
flowing paragraphs with no headings — correctly so. The page DOES contain headings, but only
as the **library's own editorial apparatus**: the page `<h1>` (the catalogue title) and a
clearly-separated `<h2>` "About this text" curator's note. Neither is a heading *inside* the
speech. The speech itself — the pre-existing document — has none, and must not be retro-fitted.

## Attribute tuple
- **content-domain**: digital humanities / cultural archive (public-domain oratory)
- **UI-component/pattern**: document reproduction with a separate curatorial "About this text" region
- **host-language construct**: `<blockquote class="speech">` of `<p>` for the speech; an editorial `<section aria-label>` with its own `<h2>` for the curator's note
- **locale/i18n**: en, 19th-century transcribed oratory
- **failure-mechanism**: NONE — false-positive guard; the pre-existing speech legitimately has no internal headings, and the only headings present correctly belong to the library's apparatus, not the speech

## Developer persona
A digital-humanities developer maintaining a small public-domain corpus. House style: each
primary source is wrapped in a `<blockquote>` and reproduced exactly as transmitted; the only
editorial additions allowed are a bibliographic byline and a single "About this text" note,
which gets its own heading because it genuinely *is* a distinct editorial section the curator
authored. The developer would never insert "Part I / Part II" into a 200-word speech — there
were no such divisions in the spoken original, and the corpus's whole credibility rests on
not altering the source.

## Element / selector carrying the issue
- No issue in the speech. Relevant: `blockquote.speech > p` (the oration — correctly
  heading-less). The `h1` (catalogue title) and `section.curator > h2` ("About this text")
  are the library's apparatus, deliberately outside the reproduced document.

## Exact accessibility mechanism
A screen-reader user requesting the heading list hears two headings: the catalogue title and
"About this text." Arrowing into the `blockquote`, the reader hears the speech as a single
continuous utterance — exactly as it was delivered aloud. There is nothing inside a
three-paragraph oration for headings to label; the speech moves as one breath from "I am
tired of fighting" to "I will fight no more forever." Forcing headings ("Casualties",
"The cold", "The children") would both falsify the historical record (the speaker authored
no such structure) and shatter a continuous rhetorical arc. Because the speech is not
"organized into sections," 2.4.10's precondition is not met for the speech; it is satisfied.
The curator's note, by contrast, *is* a distinct authored section and correctly carries its
own heading — demonstrating the judge must scope "sections" to the genuine content, not the
whole DOM.

## Expected ACT-style outcome
**passed** (the speech is inapplicable to 2.4.10; the curatorial section that *is* organized
is correctly headed). Flagging the heading-less speech body as a 2.4.10 violation would be a
**false positive** against a pre-existing document.

## Why automated tools miss it
The speech body is `<blockquote>`/`<p>` with no `<h2>`..`<h6>`. The page has a valid `<h1>`
and one well-formed, in-order `<h2>` — so axe-core, WAVE, and Lighthouse see a structurally
clean, heading-light page and report nothing. A naive "long text + few headings" heuristic
would *wrongly* flag the speech, because no tool can recognise that a `<blockquote>` of
flowing first-person sentences is a transcribed oration — a pre-existing document into which
headings cannot lawfully (per WCAG's own reasoning) be inserted. Distinguishing "verbatim
historical speech" from "article that forgot its headings" requires reading the prose and
knowing the genre: pure human judgment.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "This provision is included at Level AAA because it cannot be applied to all types of
> content and it may not always be possible to insert headings. For example, when posting a
> pre-existing document to the web, headings that an author did not include in the original
> document cannot be inserted."

> **WCAG 2.2 Understanding 2.4.10 — Intent (applicability gate)**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections."

> **WCAG Techniques — G141: Organizing a page using headings (When to Use)**
> "Pages with content organized into sections."
