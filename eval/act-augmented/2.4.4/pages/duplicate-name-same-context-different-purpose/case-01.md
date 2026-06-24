# case-01 — Two inline "order form" links in one sentence go to a cake form vs a bread form

## Scenario
A small bakery's ordering page. One lead sentence offers two ways to order: an
`order form` for celebration cakes and an `order form` for the weekly bread box.
Both phrases are links, both sit in the **same sentence and the same `<p>` element**,
and both have the identical accessible name **"order form"**. One targets the
on-page `#cake-form` section (a bespoke, priced, 72-hour celebration-cake quote);
the other targets `#bread-form` (a recurring Saturday bread subscription). The two
destinations serve **genuinely different purposes**, and a screen-reader user
listing the links hears "order form / order form" with no way to choose.

## Attribute tuple
- **content-domain:** food / small-business bakery ordering
- **UI-component / pattern:** two inline prose links to same-page anchor sections (jump links)
- **host-language construct:** `<a href="#cake-form">` and `<a href="#bread-form">` in one `<p>`; target `<section id>`s
- **locale / i18n:** en-GB
- **failure-mechanism:** identical accessible name + identical (same-DOM-node) context, but the `#fragment` targets resolve to sections with different purposes; the disambiguating words ("for celebration cakes" / "for sourdough and bread boxes") sit outside the link and are not programmatically associated

## Developer persona
The bakery owner's nephew built the page by hand in an evening. He wrote the
sentence naturally — "fill in the order form for cakes, or the order form for bread"
— and turned each "order form" phrase into a jump link to the matching section
because that read well visually. He never used a screen reader, so he didn't notice
that out of context the two links are word-for-word identical and the distinguishing
phrase trails *after* each link rather than being part of it.

## Element / selector carrying the issue
`p.lead > a[href="#cake-form"]` and `p.lead > a[href="#bread-form"]` — two `<a>` in
the same paragraph with accessible name "order form", resolving to `#cake-form`
(celebration-cake quote) and `#bread-form` (weekly bread subscription).

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted reader:** reads the full sentence linearly, so the trailing words "for
  celebration cakes" / "for sourdough and bread boxes" disambiguate the two links.
- **Screen-reader user using a links list / rotor:** hears "order form, link" twice
  with nothing to tell them apart. The programmatically determined link context
  (same sentence, same `<p>`) is **identical** for both, so context cannot
  disambiguate either; both contexts describe two different destinations at once.
- **Purpose judgment:** the cake link leads to a one-off, priced, decorated-cake
  quote workflow; the bread link leads to a recurring subscription. These are
  **not equivalent resources** (different content, different commitment, different
  pricing), so per fd3a94's expectation at least one link fails to let the user
  determine its purpose. There is no "ambiguous to users in general" cover here —
  sighted users *can* tell them apart from the surrounding words, so AT users are
  specifically disadvantaged.

## Expected ACT-style outcome
**failed** (SC 2.4.4). Two links with the same accessible name and the same
programmatically determined link context resolve to non-equivalent resources, and
the page does convey (to sighted users) that they differ — so the purpose is not
determinable from link text + programmatic context for AT users.

## Why automated tools miss it
- Both links have non-empty, identical accessible names and valid `href`s, so
  `link-name` / "links must have discernible text" rules **pass**.
- The two links share the *same DOM node* as context, so any tool comparing
  "programmatically determined context" sees them as identical — it cannot tell the
  identity is the *problem* rather than evidence of equivalence.
- Deciding whether `#cake-form` and `#bread-form` are "equivalent" or "genuinely
  different" requires reading the two sections and judging their *purpose* (a bespoke
  quote vs a subscription). That is an irreducible meaning judgment; no static check
  models it.

## Citation
> "It is a best practice for links with the same destination to have consistent text (and this is a requirement per Success Criterion 3.2.4 Consistent Identification for pages in a set). It is also a best practice for links with different purposes and destinations to have different link text."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "This rule assumes that, within the context of the test subject, the description provided by the accessible name of a link can only accurately describe one resource (notably, homonyms alone are not used as link names). Thus, if two or more links have the same accessible name but resolve to different resources, at least one of them does not accurately describe its purpose."
— act-rules/extracted/fd3a94.md (Assumptions)
