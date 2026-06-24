# case-01 — Research article: 480-word Methods section wedged between Introduction and Results with no heading

## Scenario
A journal article is laid out as five topical sections: **Abstract**, **Introduction**,
**Methods**, **Results**, **Discussion**. Four carry programmatic `<h2>` headings. The
**Methods** section — 480 words of entirely new subject matter (study site, paired-plot
design, coring/compositing, dry-combustion assays, mixed-effects statistics) — was pasted
in between Introduction and Results with **only a bold lead sentence** and no `<h2>`/`<h3>`
heading. A reader skimming the prose plainly perceives the topic shift ("here is how we did
the study"), but the document outline jumps straight from *Introduction* to *Results*.

## Attribute tuple
- **content-domain**: academic / scholarly publishing — ecology research article
- **UI-component/pattern**: long-form document with `<section aria-labelledby>` regions
- **host-language construct**: native `<h2>` per section; the offending section is bare
  `<p>` blocks led by a `<p class="lead-strong">` (bold via CSS, not a heading)
- **locale/i18n**: en (academic English, SI units)
- **failure-mechanism**: a substantive, topically-distinct mid-document section carries a
  visual bold lead instead of a programmatic heading — present-but-only-visual section break

## Developer persona
A grad student assembled the manuscript HTML by pasting each section's Word copy under the
matching `<h2>`. When she pasted the Methods text she had already styled its first sentence
bold in Word, so in the editor preview it *looked* like it had a header and she moved on to
the Results table. She never read the page back as a headings-only outline, so the missing
Methods `<h2>` went unnoticed. (Authoring source: pasted-from-Word fake-bold lead.)

## Element / selector carrying the issue
- FAIL: the `p.lead-strong` ("The study was carried out on the Cold Creek Research
  Range…") plus the four following `<p>` siblings constitute a distinct Methods section
  with **no preceding heading element**. The gap sits in the DOM between
  `section[aria-labelledby="h-intro"]` and `section[aria-labelledby="h-results"]`.

## Exact accessibility mechanism
A screen-reader user navigating by heading (NVDA Elements List, JAWS heading list,
VoiceOver rotor) — the canonical way to skim a long article — hears the outline:

> "Abstract, h2 · Introduction, h2 · Results, h2 · Discussion, h2."

There is **no entry for the Methods section**, so a blind reader who wants the methodology
(the single most-jumped-to section in a paper for anyone evaluating the work) cannot reach
it by heading navigation. They must arrow linearly through the entire Introduction, never
land on a heading boundary, and only realise they have entered "Methods" several paragraphs
in by inferring it from the prose — exactly the orientation cost headings exist to remove.
The bold lead sentence is `font-weight:700` text in a `<p>`; it carries **no heading role
and no level**, so AT exposes it as ordinary body text. Sighted keyboard users who jump
heading-to-heading skip silently from the end of Introduction to Results.

## Expected ACT-style outcome
**failed** — the page is organised into sections and one substantive section (Methods) has
no heading that introduces it, violating the per-section obligation of 2.4.10. The page
still satisfies ACT rule 047fe0 (it has an `<h1>` and `<h2>` headings for non-repeated
content), so this failure is *purely* the missing per-section heading.

## Why automated tools miss it
The document has exactly one `<h1>` and four non-empty, correctly nested `<h2>` elements.
axe-core's `page-has-heading-one`, `empty-heading`, and `heading-order` all pass; WAVE
reports valid headings and structure; Lighthouse's heading audit is green. Nothing in the
markup is malformed — there is simply *no element at all* where the Methods heading should
be. To flag this a tool would have to read 480 words of prose, recognise that they form a
self-contained methodological section topically distinct from the Introduction before it
and the Results after it, and conclude that this distinct section "introduces new subject
matter and therefore needs its own heading." That is semantic content-segmentation, which
no automated checker performs — the ACT corpus only encodes the binary "document has a
heading at all," never the per-section case.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections. For instance, long documents are often divided
> into a variety of chapters, chapters have subtopics, etc. When such sections exist, they
> need to have headings that introduce them. … Other page elements may complement headings
> to improve presentation (e.g., horizontal rules and boxes), but visual presentation is not
> sufficient to identify document sections."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Tests)**
> "Check that the content is divided into separate sections. Check that each section on the
> page starts with a heading."

> **EN 301 549 Annex C — C.9.5 (SC 2.4.10)**
> "Clause 9.5 is informative only and contains no testable requirements." (2.4.10 is AAA;
> EN does not require it, but WCAG conformance at AAA still demands a heading per section.)
