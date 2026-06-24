# case-03 — Contract "defined terms" conveyed only by small-caps styling (no markup, no legend)

## Scenario
A Master Services Agreement. By legal-drafting convention, a word in **small capitals** is a
*defined term* — its precise meaning is fixed in the Definitions section, and only the small-caps
occurrences invoke that technical meaning (lowercase "service" is the ordinary word; small-caps
"Service" is the defined term). The small-caps rendering is produced purely by CSS
(`font-variant-caps: small-caps` on `.term`/`.ref` spans). There is no `<dfn>`, no link from a
use to its definition, no `<abbr>`, no statement that "terms in small capitals are defined in
Section 1," and no colour cue. "This word is a load-bearing defined term" is conveyed only by the
small-caps glyph styling.

## Attribute tuple
- **content-domain:** legal / commercial contract (B2B SaaS agreement)
- **UI-component/pattern:** definition list + clause body cross-referencing defined terms
- **host-language construct:** `<span>` styled with `font-variant-caps: small-caps`
- **locale/i18n:** en (common-law contract drafting)
- **failure-mechanism:** "defined term" special status conveyed by small-caps presentation with
  no markup and no in-text legend (F2; G117's "different font … separate section lists" not
  applied)

## Developer persona
A junior associate at a law firm exported the firm's Word precedent to HTML for a client
extranet. In Word, defined terms are styled with the "Small caps" character format (the firm's
house style). The HTML export preserved the *look* with a CSS class but dropped any semantic
meaning, and the firm's precedent never carried an on-page legend (lawyers all know the
convention), so nothing tells a reader — human or machine — that small-caps marks a defined term.

## Element / selector carrying the issue
`span.term` (the three defined terms in the Definitions `<dl>`) and `span.ref` (their invocations
in clauses 2–3, e.g. "Service", "Term", "Confidential Information"). The small-caps styling is
the only thing separating the defined term from the ordinary word used elsewhere
(e.g. lowercase "service" in clause 2.2, "confidential information" in clause 3.2).

## Exact accessibility mechanism (what AT experiences, why it fails)
`font-variant-caps: small-caps` changes only glyph rendering; the accessible text is unchanged
and screen readers announce "service", "term", "confidential information" identically whether
the occurrence is the defined term or the ordinary word. So a screen-reader or braille user
cannot tell that clause 2.1's "Service" is the narrowly-defined platform (excluding third-party
feeds) while clause 2.2's "service" is the ordinary word — a distinction that materially changes
the contract's scope. They also cannot tell which words point back to Section 1's definitions.
The relationship "this term is formally defined and its meaning is fixed elsewhere" is conveyed
by presentation alone, available neither programmatically nor in any text legend, so 1.3.1 fails.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`font-variant-caps: small-caps` and `text-transform` are valid, common CSS that no checker
flags. The DOM is a clean definition list and ordered lists. axe-core, WAVE and Lighthouse have
no concept of "small-caps means defined term." Catching this requires (a) knowing the legal
convention that small-caps denotes a defined term, (b) reading the contract to see that the
distinction between defined and ordinary uses is meaningful, and (c) confirming no legend or
markup restates it — three layers of human/domain judgment automation cannot supply.

## Citation
> **WCAG Techniques, G117 — example "Providing an alternate way to know which words in the text
> have been identified by using a different font":**
> "When a sentence in the original document contains a word or phrase that must be used in the
> summary, the word or phrase is shown in a different font than the rest of the sentence. A
> separate section also lists all the words and phrases that must be used in the summary."

(Verbatim from `wcag-techniques/general/G117.html`. G117 requires an alternate text way to know
which words are special when they are distinguished only by font treatment; this contract gives
the small-caps font treatment but provides no such legend or list, so it fails.)

> **WCAG 2.2 Understanding 1.3.1 (Intent):**
> "words that have special status are indicated by changing the font family and /or bolding,
> italicizing, or underlining them … Having these structures and these relationships
> programmatically determined or available in text ensures that information important for
> comprehension will be perceivable to all."

(Verbatim from `wcag-understanding/info-and-relationships.html`. Defined terms are "words that
have special status" indicated by a font-style change; here that status is neither programmatic
nor available in text.)
