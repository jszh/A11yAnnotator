# case-02 — "HTML / PDF / RTF" format links under a real document heading, correctly associated (PASS — boundary variant)

## Scenario
A borough council's publications page lists three documents. Each document is offered in three formats,
so to avoid making a screen-reader user hear the full document title three times, the author uses H80
Example 2: a real `<h2>` names the document, and the three format links ("HTML", "PDF", "RTF") sit in the
SAME paragraph directly beneath that heading. This is the deliberate PASS boundary for the aspect: the
preceding heading clearly supplies the purpose, it is genuinely the link's grouping heading, and the format
word combined with the heading conveys the purpose ("the Annual Report, as PDF"). It sharpens the aspect by
showing what *correct* preceding-heading-as-carrier looks like, against which the FAIL pages can be judged.

## Attribute tuple
- **Content domain:** government / civic services portal (council publications)
- **UI component / pattern:** one document offered in multiple formats under a single heading (H80 example 2)
- **Host-language construct:** real `<h2>` heading immediately followed by a `<p class="formats">` containing the three `<a>` format links in the same paragraph
- **Locale / i18n:** en-GB
- **Failure mechanism:** none — this is the correct application; the carrier is present and genuinely the link's context

## Developer persona
A government digital-services developer who has read the GOV.UK / WCAG guidance and knows that repeating a
long document title on every format link is itself a screen-reader annoyance. They deliberately put the
title once in the heading and let the short format word ("PDF") inherit purpose from that preceding heading,
keeping the links in the same paragraph so the association is in-context. They added file sizes as a usability
nicety. This is a developer doing the right thing on purpose.

## Element / selector carrying the issue
No defect. The relevant elements are `article.pub > h2` (the carrier) and the `p.formats > a` links
("HTML", "PDF", "RTF") that immediately follow it within the same article block.

## Exact accessibility mechanism
For each format link, the heading element that precedes it is the document title (e.g. "Annual Report
2023–2024"). The link text combined with that heading describes the purpose: "Annual Report 2023–2024, PDF
format". The links and their disambiguating context are within one tightly-scoped `<article>` with the
heading as the immediately preceding grouping heading, satisfying H80's test ("the text of the link combined
with the text of that heading describes the purpose of the link"). A screen-reader user landing on a "PDF"
link can read the current heading/region and know exactly which document and format it leads to. Because the
identical short format words ("PDF") appear under *different* headings, each instance resolves to a different,
unambiguous purpose.

## Expected ACT-style outcome
**passed** (SC 2.4.4 — the purpose of each format link is determinable from the link text together with its
programmatically determined preceding-heading context).

## Why automated tools miss it
This is a true pass, but note an automated tool could just as easily get it *wrong* in the other direction:
a same-text/different-URL heuristic would see three "PDF" links going to three different URLs and might flag
"ambiguous link text" — a false positive — because it cannot read the headings and recognise that the context
disambiguates them. Conversely a tool cannot *confirm* the pass either: verifying that "PDF" under "Annual
Report 2023–2024" genuinely conveys purpose requires reading the heading and judging the meaning. So the
correct verdict (pass) is unreachable by automation in either direction; only human semantic judgment of the
heading-plus-link combination settles it.

## Citation
**Reference:** WCAG Technique H80 — Identifying the purpose of a link using link text combined with the preceding heading element (`wcag-techniques/html/H80.html`)
> "&lt;h2&gt;Annual Report 2006-2007&lt;/h2&gt; &lt;p&gt; &lt;a href=\"annual-report-0607.html\"&gt;HTML&lt;/a&gt; &lt;a href=\"annual-report-0607.pdf\"&gt;PDF&lt;/a&gt; &lt;a href=\"annual-report-0607.rtf\"&gt;RTF&lt;/a&gt; &lt;/p&gt;"

**Reference:** WCAG 2.2 Understanding — Link Purpose (In Context) (`wcag-understanding/link-purpose-in-context.html`)
> "A list of books is available in three formats: HTML, PDF, and mp3 ... To avoid hearing the title of each book three times (once for each format), the first link for each book is the title of the book, the second link says 'PDF' and the third says, 'mp3.'"
