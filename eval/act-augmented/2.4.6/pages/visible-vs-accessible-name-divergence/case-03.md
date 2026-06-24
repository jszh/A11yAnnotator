# case-03 — Heading: visible "Quarterly Earnings" but accessible name "Q" (labelledby → stray marker)

## Scenario
An investor-relations results page. A section heading visibly reads **"Quarterly Earnings"** with a
small superscript **"Q"** footnote marker that cross-references the glossary. The author wrapped the
marker in `<span id="fnq">Q</span>` and — by mistake — pointed the heading's `aria-labelledby` at
THAT span rather than at the heading's own text. `aria-labelledby` takes absolute precedence, so the
`<h2>`'s computed accessible name is just **"Q"**. A screen-reader user navigating by heading (the
H key) hears "Q, heading level 2" — a single stray letter — while the sighted reader sees the fully
descriptive "Quarterly Earnings".

## Attribute tuple
- **Content domain:** corporate finance / investor relations (long-form filing)
- **UI component / pattern:** section heading (`<h2>`) with a footnote/superscript marker
- **Host-language construct:** `<h2 aria-labelledby="…">` pointing at a nested marker span
- **Locale / i18n:** en-GB
- **Failure mechanism:** `aria-labelledby` points at a **stray short sub-element** instead of the
  heading text; divergence type = **VISIBLE-DESCRIPTIVE / ANNOUNCED-VAGUE** (single character)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element"
  (here: the wrong, tiny element)

## Developer persona
A finance-portal CMS author wanted the glossary footnote marker keyboard-reachable and asked a
developer to "label the heading with the footnote". The developer added `aria-labelledby="fnq"`
pointing at the marker span, assuming it would *append* the marker — not realizing `aria-labelledby`
*replaces* the entire accessible name, collapsing "Quarterly Earnings" down to "Q".

## Element / selector carrying the issue
`h2[aria-labelledby="fnq"]` — visible text "Quarterly Earnings" (+ superscript "Q"); the IDREF
`fnq` resolves to `<span id="fnq">Q</span>`. Verified in Chromium: `role=heading`, `accName="Q"`,
`visibleText="Quarterly Earnings" (+ marker)`.

## Exact accessibility mechanism
`aria-labelledby` overrides the element's own text content. The heading's accessible name becomes the
referenced span's text, "Q". On a screen reader's heading list / heading-navigation, this section is
announced as "Q" — which does not describe the topic of the section it labels (quarterly earnings
figures). The heading IS correctly a heading (1.3.1 passes) and HAS a non-empty accessible name with a
resolvable IDREF (4.1.2 passes); only the descriptiveness of the announced heading fails 2.4.6, and
only on the AT surface.

## Expected ACT-style outcome
**failed** — TT 10.A (`2.4.6-heading-purpose`): "Each heading describes the topic or purpose of its
content." The announced heading "Q" does not. The "Outlook for FY2026" and "Notes to the figures"
headings have no override and pass; "FY2025 Results Center" (h1) passes.

## Why automated tools miss it
The `<h2>` has a non-empty accessible name ("Q") and its `aria-labelledby` IDREF resolves to a present
element, so no empty-heading, missing-name, or dangling-reference rule fires — verified: a full
`axe.run` (default ruleset + `label-content-name-mismatch`) reports **0 violations** on this page
(after wrapping the body in `<main>` to clear the incidental landmark warning, which is unrelated to
2.4.6). Automated tools cannot read the section's prose and judge that "Q" fails to describe
"quarterly earnings" — that topic-vs-heading comparison is exactly the human judgment TT 10.A calls
for. They also cannot detect that the labelledby points at the *wrong* (tiny) element, since pointing
at a marker span is structurally valid.

## Citation
> "Conversely, it is also possible for content to pass Success Criterion 1.3.1 (with headings or
> labels correctly marked up or identified), while failing this success criterion (if those headings
> or labels are inaccurate or insufficiently clear)."
— WCAG 2.2 Understanding, *Headings and Labels*, Intent (`wcag-understanding/headings-and-labels.html`)
