# case-02 — Two "download the form" links in one table cell: consent form vs medical-history form (different purpose → FAIL)

## Scenario
A children's swim school's "before your first lesson" page. A two-column data table
lists the paperwork; in the **"What to do"** cell for *Before lesson 1*, one sentence
offers two **`download the form`** links. The first downloads a **parental consent**
form (permission to teach the child and give first aid); the second downloads a
**medical history** form (allergies, GP, conditions). Both links have the identical
accessible name "download the form" and sit in the **same table cell**, so their
programmatically determined link context is identical (the same DOM node) — but the two
files are **genuinely different documents serving genuinely different purposes**. A
screen-reader user listing the links hears "download the form / download the form" with
no way to tell the consent form from the medical form.

## Attribute tuple
- **content-domain:** children's sport / swim-school onboarding paperwork
- **UI-component / pattern:** two inline `<a download>` links sharing one *table data cell* as context (table-cell context variant of the duplicate-name trap)
- **host-language construct:** two `<a download href="data:text/plain;…">` inside a single `<td>` within a `<table>` (self-contained `data:` files, no external assets)
- **locale / i18n:** en-GB
- **failure-mechanism:** identical accessible name + identical (same `<td>` DOM node) context, but the two `data:` files resolve to **non-equivalent** documents (a consent form vs a medical-history form); the disambiguating clauses sit *after* each link and are not part of, or programmatically associated with, it

## Developer persona
A swim-school administrator built the joining page in a basic site editor. She put the
two new-joiner PDFs into a tidy "to do before lesson 1" table cell and, liking the
parallel phrasing, made each "download the form" phrase a link with the trailing words
explaining which is which. The two files are clearly different on screen because the
sentence reads top-to-bottom — but out of context, in a links list, the two links are
word-for-word identical, which she never checked because she does not use a screen reader.

## Element / selector carrying the issue
`td a[download="parental-consent.txt"]` and `td a[download="medical-history.txt"]` — two
`<a>` with accessible name "download the form" in the *same* `<td>`, resolving to two
different, fully-valid `data:text/plain` documents (a consent form and a medical-history
form).

## Resource validity (addresses the false-equivalence rejection of the prior version)
Both `data:` URIs decode to **complete, readable, genuinely different** documents — not
header stubs or truncated files:
- consent URI decodes to a parental-consent form ("WELLSPRING SWIM SCHOOL — PARENTAL
  CONSENT FORM … I give permission for my child to take part in swimming lessons and to
  receive emergency first aid …");
- medical URI decodes to a medical-history form ("WELLSPRING SWIM SCHOOL — MEDICAL
  HISTORY FORM … List any allergies, medication or conditions our instructors must know
  about …").
The fail therefore does **not** rest on prose assertion: following each link really does
yield different content with a different purpose, satisfying fd3a94's "resolve to
[non-]equivalent resources" by actual content, not by claim.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted reader:** reads the cell linearly — "download the form that gives us
  permission…" then "download the form that lists any allergies…" — so the trailing
  clauses disambiguate the consent form from the medical form.
- **Screen-reader user using a links list / rotor:** hears "download the form, link /
  download the form, link". Both links share the **same `<td>`** as programmatically
  determined link context, so the context is identical and cannot distinguish them; the
  filename in the `download` attribute and the `data:` payload are not exposed as link
  context.
- **Purpose judgment:** a parental-consent form and a medical-history form are
  **non-equivalent resources** (different content, different legal/medical function). Per
  fd3a94's expectation, at least one of two same-name same-context links that resolve to
  non-equivalent resources fails to let the user determine its purpose. Sighted users
  *can* tell them apart from the surrounding sentence, so AT users are specifically
  disadvantaged — the "ambiguous to users in general" exception does not apply.

## Expected ACT-style outcome
**failed** (SC 2.4.4). Two links with identical accessible name and identical
programmatically determined link context (the same table cell) resolve to non-equivalent
resources, and the page conveys the difference to sighted readers but not via link text
or programmatic context, so AT users cannot determine each link's purpose.

## Why automated tools miss it
- Both links have non-empty, identical accessible names and valid `download` hrefs, so
  `link-name` / "links must have discernible text" rules **pass**.
- The two links share the *same DOM node* (one `<td>`) as context, so any tool comparing
  "programmatically determined context" sees them as identical and infers nothing wrong —
  it cannot tell the identity is the *problem* rather than evidence of equivalence.
- Deciding whether the two downloaded files are "equivalent" or "genuinely different"
  requires opening both, reading them, and judging their *purpose* (a consent form vs a
  medical-history form). That is an irreducible meaning judgment; no static check models
  it. (This is also what makes it distinct from a tool-defeating *false-equivalence*
  trap: here the files are real and really differ.)

## Distinctness from sibling cases
Same aspect, different failure surface: case-01 uses in-page `#anchor` jump links in a
`<p>`; case-03 uses `mailto:` links; case-04 uses visual grid alignment; case-05 uses
`tel:` links (es i18n); case-06 is the same-resource PASS control. case-02 is the
**table-cell context** variant with two `<a download>` to genuinely different documents,
exercising the WCAG definition of programmatically determined link context as the *same
table cell*.

## Citation
> "This rule checks that links with identical accessible names in the same context resolve to the same or equivalent resources."
— act-rules/extracted/fd3a94.md (Description)

> "This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link, or in the table header cell for a link in a data table, because these are directly associated with the link itself."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))
