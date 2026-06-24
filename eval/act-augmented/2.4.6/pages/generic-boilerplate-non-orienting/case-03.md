# case-03 — FAQ page with a single heading "Details" over a block mixing billing, pausing, and damaged-delivery content

## Scenario
A coffee roastery's FAQ page has exactly one section heading — **"Details"** — above a
block that actually answers three unrelated questions: when subscription billing happens,
how to skip or pause a plan, and what to do about a damaged or stale delivery. "Details" is
true (the block does give details) but it gives no predictive cue, and because there is
only one heading the user cannot jump to the billing answer vs. the pause answer vs. the
damaged-delivery answer.

## Attribute tuple
- **content-domain**: e-commerce / direct-to-consumer subscription (coffee roastery)
- **UI-component/pattern**: FAQ page — a single section with multiple bolded `<p>` questions but only one real heading
- **host-language construct**: one `<h2>` inside a `<section aria-labelledby>`; the questions are styled `<p>`, not headings
- **locale/i18n**: en-GB
- **failure-mechanism**: one vague-but-true heading ("Details") over a multi-topic block — under-descriptive because it neither names a topic nor distinguishes the three Q&As beneath it

## Developer persona
A small-business owner built the FAQ in a Squarespace text block. They typed all three
questions and answers into one rich-text area, made the questions bold by hand, and dropped
a single section title above them. The CMS offered a heading style, so they applied it to
the word that came to mind — "Details" — never realising that a screen-reader user would
get one heading for the whole page and the bolded questions would not be headings at all.

## Element / selector carrying the issue
- FAIL: `h2#faq-h` (text "Details") — the page's only heading, sitting over a block that
  spans billing dates, pause/skip rules, and the damaged-delivery policy.

## Exact accessibility mechanism
The heading list a screen-reader user pulls up contains a single entry: "Details, heading
level 2." From that the user cannot tell the page covers billing, pausing, and replacements
— let alone navigate to the one they need. The three questions are visually bold but are
plain `<p class="q">`, so they are **not** in the heading list and offer no navigational
landmarks. A sighted user skimming the page sees one word, "Details," and must read the
whole block linearly. The heading is on-topic (it really is details) but does not describe
the topic or purpose of the content it labels, and one generic heading cannot orient a
reader through three distinct sub-topics. This fails Test 10.A.

## Expected ACT-style outcome
**failed** — the single heading is present and loosely related but not descriptive of the
multi-topic content beneath it.

## Why automated tools miss it
There is one non-empty `<h2>` in valid order, so axe-core (`empty-heading`,
`heading-order`), WAVE, and Lighthouse all pass — they cannot judge that one heading is too
few for three topics, nor that "Details" under-describes the block. "Details" is a real,
on-topic word, so no keyword heuristic flags it. Recognising that the heading fails to
orient requires a human to read the entire block, notice it contains three distinct
answers, and judge that a single word "Details" neither names nor separates them — a
semantic/structural judgment outside any automated checker's model.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — Intent**
> "The intent of this success criterion is to help users understand what information is
> contained in web pages and how that information is organized. When headings are clear and
> descriptive, users can find the information they seek more easily."

> **WCAG Techniques — G130: Providing descriptive headings**
> "Descriptive headings identify sections of the content in relation both to the web page
> as a whole and to other sections of the same web page. Descriptive headings help users
> find specific content and orient themselves within the web page."

> **Trusted Tester 5.1.3 — Test 10.A (`2.4.6-heading-purpose`)**
> "For each visually identified heading, compare the heading text to the content beneath
> the heading. … PASS if: The heading describes the topic or purpose of its content."
