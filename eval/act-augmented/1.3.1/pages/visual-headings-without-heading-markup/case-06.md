# case-06 — BOUNDARY PASS: big bold tagline + pull-quote are correctly NOT headings; real headings use `role="heading"`

## Scenario
An "Our Story" page for a coffee roastery. The page has large, prominent text in two places that a
careless reviewer might mistake for headings: (1) the hero **brand tagline** "Slow coffee, made by hand."
(2.9rem, weight 800) and (2) a centered **pull-quote** "'The best cup I've had in this city.'" (1.7rem,
italic). Neither titles a following section — the tagline is a decorative brand statement and the
pull-quote is an emphasized excerpt *of* the surrounding paragraphs — so they are correctly left as a
`<p>` and a `<blockquote>`. The genuine section headings ("Where we started", "How we roast",
"Visit the bar") each title the section beneath them and are exposed as real headings via
`role="heading"` with `aria-level="2"`. Therefore **every visual heading is programmatically
determinable, and no non-heading is falsely a heading** → the page passes.

## Attribute tuple
- **Content domain:** small-business / brand "about" page
- **UI component / pattern:** hero tagline + pull-quote + sectioned article
- **Host-language construct:** `role="heading"`/`aria-level` for real headings; `<p>`/`<blockquote>` for non-headings
- **Locale / i18n:** en
- **Failure mechanism:** none — this is the negative/boundary control that distinguishes "heading function" from "big bold text"

## Developer persona
A developer on a design-system team where, for visual-consistency reasons, native `<h*>` elements are
avoided and headings are expressed with `role="heading"` + `aria-level` so styling is fully controlled
by component CSS. The developer understood the SC correctly: they gave heading semantics to the three
text blocks that actually title sections, and deliberately did *not* give heading semantics to the
decorative tagline or the pull-quote, which would be wrong (over-marking emphasis as a heading).

## Element / selector carrying the (non-)issue
- Real headings (PASS): `p.heading[role="heading"][aria-level="2"]` ×3.
- Correctly-not-headings: `p.tagline` (brand tagline) and `blockquote.pull` (excerpt). These are large
  but are not section titles, so they must NOT be headings.

## Exact accessibility mechanism
The three `role="heading"` paragraphs expose as `heading level 2` and appear in the screen-reader
headings list, each preceding the section it titles — so heading navigation works exactly as the visual
structure implies. The tagline and pull-quote expose as a paragraph and a blockquote respectively;
they are read in flow as content, not announced as headings, which is correct because they do not title
sections. This satisfies TT 10.B in both directions: each visual heading is programmatically determinable,
AND content that is not a visual heading is not given a heading role.

## Expected ACT-style outcome
**passed** (SC 1.3.1, TT 10.B). All visually apparent headings are programmatically determinable, and
no non-heading content is incorrectly exposed as a heading.

## Why automated tools miss it
Just as tools cannot detect the *failures* in cases 01–05, they cannot verify this *pass*: a scanner
cannot confirm that "Slow coffee, made by hand." correctly is NOT a heading while "Where we started"
correctly IS — both are styled prominently, and `role="heading"` with a valid `aria-level` passes ARIA
validity checks regardless of whether the element truly functions as a heading. (ACT rule 4e8ab6 would
only check that any `role="heading"` carries a valid `aria-level`, which it does.) Confirming the
verdict requires reading each block's meaning and visual role — exactly the human judgment the aspect
isolates. This case proves the aspect is about heading *function*, not about "is the text big and bold."

## Citation
**Reference:** Trusted Tester v5.1.3 — Test 10.B `1.3.1-heading-determinable`, Note (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "content that is not a visual heading should not have a role of heading (e.g., don't use heading markup for emphasis). Conversely, content styled and functioning like a heading should be programmatically a heading."

**Reference:** WCAG 2.2 Understanding Info and Relationships (`wcag-understanding/info-and-relationships.html`)
> "The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes."
