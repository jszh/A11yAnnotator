# case-07 — BOUNDARY (PASS): an article *about* Lorem ipsum, descriptively titled

## Scenario
The sharpening **boundary** for this aspect. The page is an article whose actual subject
**is** the Lorem ipsum placeholder text — its history (a scrambled passage of Cicero) and
why designers use it. The body even contains the literal string "Lorem ipsum dolor sit
amet" as a *quoted sample*. But the `<title>` is **descriptive** —
`Lorem Ipsum: The History and Use of Placeholder Text in Design` — so the page **passes**.

This contrasts directly with the suggested scenario 7 (a news story whose title was the
bare filler "Lorem ipsum dolor sit amet"). Here the same filler words appear in the body,
yet the title correctly names the topic.

## Element / selector carrying the (non-)issue
- `head > title` — text node `Lorem Ipsum: The History and Use of Placeholder Text in
  Design`. It identifies the topic of the page exactly.
- The `.sample` block holds the literal filler "Lorem ipsum dolor sit amet" as legitimate
  quoted content, not as a stray placeholder.

## Exact accessibility mechanism
- A screen-reader user hears the page announced as "Lorem Ipsum: The History and Use of
  Placeholder Text in Design" — which precisely identifies the subject and distinguishes
  it from other pages. Limb 1 (present) passes; limb 2 (descriptive) **also passes**.
- The presence of the filler string *inside the body* does not change the verdict, because
  the SC is about whether the `<title>` identifies topic/purpose — and it does.

## Expected ACT-style outcome
**passed** — ACT rule c4a8a4 (and presence rule 2779a5).

## Why this sharpens the aspect (and defeats naive automation)
This page is the precise reason a "ban-list of placeholder strings" cannot work. A linter
that flagged any page containing "Lorem ipsum" would **false-positive** here, where the
phrase is the legitimate subject. Conversely, a linter that only checks the `<title>` is
non-empty would pass case-07 for the *wrong* reason — it cannot tell that case-07 passes on
descriptiveness while case-01..06 fail. Both directions require reading the body and judging
the title against it — exactly the human/semantic judgment this aspect isolates.

## Citation
> **Reference: WCAG Techniques — G88** (`wcag-techniques/general/G88.html`)
>
> "The objective of this technique is to give each web page a descriptive title. ... The
> title of each web page should: Identify the subject of the web page[;] Make sense when
> read out of context, for example by a screen reader or in a site map or list of search
> results"

> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Filler or placeholder text" — listed as an example of text that is *not* a title; this
> boundary page demonstrates the inverse, where the title is descriptive and the filler
> appears only as legitimate quoted body content.
