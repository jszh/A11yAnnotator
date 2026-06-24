# case-06 — Boundary PASS: heading/blockquote/fieldset used correctly (relationships are true)

## Scenario
A law-firm contact page (Alderman & Boyle) that deliberately uses the three exact elements F43
warns about — a heading over an address, a `<blockquote>`, and a `<fieldset>`/`<legend>` — but
uses each one **correctly**, so the asserted relationships are true:
1. The `<h2>` "Visit Our Downtown Office" genuinely *begins a section* whose body is the
   office's address, hours, and parking. The address itself is in a plain `<address>` element
   inside the section, **not** marked as a heading (the opposite of F43's `<h2>3333 Third
   Avenue</h2>`).
2. The `<blockquote>` wraps a **genuine, attributed client testimonial** quoted from a named
   source, with `<cite>` and a visible attribution — a real quotation.
3. The `<fieldset>`/`<legend>` actually **groups real form controls** (name, email, and a
   contact-method radio group).

This is the contrasting boundary case for the aspect: it forces the judgment to turn on
*whether the relationship is true*, not on *which element appears*.

## Attribute tuple
- **content-domain:** legal / law-firm contact page
- **UI-component/pattern:** contact section (address block, testimonial, contact form)
- **host-language construct:** `<h2>`+`<address>`, `<blockquote>`+`<cite>`, `<fieldset>`+`<legend>`
  — all used correctly
- **locale/i18n:** en (US)
- **failure-mechanism:** none — correct use of structural markup (the foil that distinguishes
  true relationships from F43 fabrications)

## Developer persona
An accessibility-aware developer at a small legal-marketing agency built this page. They knew
F43's pitfalls: they put the *address* in an `<address>` element under a real section heading
rather than turning the address into a heading; they used `<blockquote>` only because the
testimonial is an actual quotation and added `<cite>`; and they used `<fieldset>` because the
contact controls really do form a group. Every structural relationship encoded is one that
exists in the content.

## Element / selector carrying the issue
None carries a defect. The elements to inspect (and confirm correct) are:
`main > h2` ("Visit Our Downtown Office") + the following `address`; `main blockquote` (with
`cite`); `form fieldset > legend` (grouping `input`s).

## Exact accessibility mechanism (what AT experiences, why it passes)
- A screen-reader user navigating by heading hears "Visit Our Downtown Office (h2)" and finds
  exactly what a section heading promises — the office location, hours, and parking. The
  address is announced as ordinary text inside that section, not as a heading, so the outline
  is honest.
- Entering the `<blockquote>`, AT announces a quotation; the content *is* a quotation from
  "Eleanor M., probate client," with the source exposed via `<cite>` — the quotation
  relationship is true.
- In the form, AT announces a group named "How should we reach you?" and the user finds the
  name, email, and radio controls the group legitimately labels — the control-grouping
  relationship is true.
In every case the programmatic relationship reflects the actual content, satisfying SC 1.3.1.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This is the crux of the aspect: automated tools see valid heading, blockquote, and fieldset
markup and return PASS here — the **same** verdict they would (wrongly) return for the failing
cases 01–05, because syntactic validity is identical. The tool cannot tell this page apart from
the failing ones; only a human reading the content can confirm that here the relationships are
genuine. Including this PASS case makes the discriminating question explicit — "is the asserted
relationship true of the content?" — rather than "is the element well-formed?".

## Citation
> **WCAG Techniques, F43 — "A heading used only for visual effect":**
> "In this example, a heading element is used to display an address in a large, bold font. The
> address does not identify a new section of the document, however, so it should not be marked
> as a heading."

(Verbatim from `wcag-techniques/failures/F43.html`. This page is the deliberate inverse: the
`<h2>` "Visit Our Downtown Office" *does* identify a new section, and the address is kept in an
`<address>` element, so the heading is used correctly — no F43 failure.)

> **Trusted Tester v5.1.3, Test 10.B — Evaluate Results (PASS if ALL true):**
> "Each programmatically determinable heading is serving as a visual heading on the page, AND …
> Each visual heading is programmatically defined."

(Verbatim from `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`. Here the only heading
in the contact region, "Visit Our Downtown Office," is a true visual section heading and is
programmatically a heading, satisfying 10.B; the address is not a visual heading and is not
coded as one.)
