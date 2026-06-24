# case-01 — Support page with three sections all headed "Information" / "More Information" / "Additional Information"

## Scenario
A retailer's "Orders & Returns" help page is split into three substantive, genuinely
distinct sections — the **refund policy**, **delivery times**, and the **two-year
warranty**. But the three `<h2>` headings read **"Information"**, **"More Information"**
and **"Additional Information"**. Each heading is *true* (every section does contain
information) yet none of them lets a reader predict which section holds the refund rules,
which holds the delivery windows, and which holds the warranty terms.

## Attribute tuple
- **content-domain**: e-commerce — customer help centre (orders & returns)
- **UI-component/pattern**: long-form help article with an in-page table of contents + section landmarks
- **host-language construct**: `<section aria-labelledby>` with sequential `<h2 id>` headings
- **locale/i18n**: en-GB
- **failure-mechanism**: present, correctly-nested, topically-true headings that are too generic to orient ("Information" / "More Information" / "Additional Information" over refund / delivery / warranty)

## Developer persona
A help-centre author working in a CMS WYSIWYG started all three blocks from the same
"Information" content snippet the template ships with, then pasted distinct body copy under
each without renaming the headings. Because the prose differs, the page *looks* finished in
the editor preview; the author never read the page back as a heading-only outline, so the
fact that all three headings collapse to "Information" was never noticed.

## Element / selector carrying the issue
- FAIL: `h2#s1` (text "Information") over the refund-policy section.
- FAIL: `h2#s2` (text "More Information") over the delivery-times section.
- FAIL: `h2#s3` (text "Additional Information") over the warranty section.

## Exact accessibility mechanism
A screen-reader user who pulls up the heading list (NVDA's Elements List, JAWS heading
list, VoiceOver rotor) — the canonical way blind users skim a long article — hears the
outline:

> "Information, heading level 2 · More Information, heading level 2 · Additional
> Information, heading level 2."

That outline conveys **nothing** about where the refund rules, the delivery table, or the
warranty live. To find the warranty the user must enter each section and read it linearly,
defeating the entire purpose of headings. The headings are not *wrong* (each section
really is "information"), so this is not a topic mismatch; it is a descriptiveness/adequacy
failure. The in-page table of contents repeats the same three useless words, so sighted
skimmers are equally unable to predict section contents. This fails Test 10.A: a heading
must describe the topic or purpose of its content, and "Information" does not distinguish
refund-vs-delivery-vs-warranty.

## Expected ACT-style outcome
**failed** — the headings are present and topically related but not descriptive of their
sections' topic or purpose.

## Why automated tools miss it
The headings are non-empty `<h2>` elements in valid sequential order, so axe-core
(`empty-heading`, `heading-order`, `page-has-heading-one` are all satisfied), WAVE, and
Lighthouse report no heading problems. "Information" is a real, correctly-spelled English
word that is genuinely related to the content, so even a keyword/topic-overlap heuristic
passes (the section *is* informational). No tool has a semantic model of whether a true
word is *too generic to predict section contents* — that is a graded human judgment, and
two reviewers could even debate exactly where "generic" tips into "inadequate." This is
precisely the borderline tier the ACT corpus omits.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — Benefits**
> "Descriptive headings are especially helpful for users who have disabilities that make
> reading slow and for people with limited short-term memory. These people benefit when
> section titles make it possible to predict what each section contains."

> **WCAG Techniques — G130: Providing descriptive headings**
> "Check that each heading identifies its section of the content."

> **Trusted Tester 5.1.3 — Test 10.A (`2.4.6-heading-purpose`)**
> "For each visually identified heading, compare the heading text to the content beneath
> the heading. … PASS if: The heading describes the topic or purpose of its content."
