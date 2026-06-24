# case-03 — Identical "Edit / Void / Resend" per invoice; the disambiguating record label is a styled `<p>`, not a heading (FAIL)

## Scenario
A billing dashboard lists three overdue invoices. Each invoice card shows what *looks* like a per-record
heading ("Invoice #1042 — Northwind Traders") followed by three identical action links: **Edit**, **Void**,
**Resend**. The suggested scenario is "a nav of 'Edit' links where each is preceded by an `<h3>` naming a
different record" — here the hardness is escalated: the per-record label that *should* be the preceding
heading is not a heading at all. It is a `<p class="invoice-title">` styled to look big and bold. So the
H80 carrier is visually present but absent from both the heading tree and the link's list-item context. The
three action triads are byte-for-byte identical, and there is no real per-invoice heading to navigate to.

## Attribute tuple
- **Content domain:** SaaS / fintech billing dashboard (accounts receivable)
- **UI component / pattern:** row-action link set (Edit/Void/Resend) repeated per record
- **Host-language construct:** fake heading — `<p class="invoice-title">` styled as a heading; action links in a separate `<ul class="actions">` sibling
- **Locale / i18n:** en-US, USD currency
- **Failure mechanism:** the preceding-heading carrier is not a real heading and not in the link's list item, so the record identity is not programmatically determined link context

## Developer persona
A product engineer building from a design mockup that showed the invoice number in a large bold style. They
reached for `<p>` with a font-size rule rather than `<h3>` because "the designer didn't want it to look like
a section header, just bold." They focused on the destructive-action styling (red "Void") and never tabbed
through with a screen reader. Visually the page is perfectly legible; the per-record identity is obvious to a
sighted user because the bold title sits right above each row of buttons.

## Element / selector carrying the issue
`section.invoice > .toolbar > p.invoice-title` is the intended-but-failed carrier. The affected links are
`ul.actions > li > a` in each card — particularly the three identical `Void` links
(`a[href="/billing/1042/void"]`, `/1043/void`, `/1051/void`).

## Exact accessibility mechanism
H80's test is to "find the heading element that precedes the link" — but there is no heading element. The
invoice number lives in a `<p>` (role `paragraph`), so a screen-reader user navigating by heading finds only
the page `<h1>` and lands on no per-invoice context. Programmatically determined link context is limited to
the link's own sentence/paragraph/list-item; the "Void" link sits in its own `<li>` inside `ul.actions`,
which is a *different* element from the `<p class="invoice-title">`. So the invoice number is neither a
preceding heading nor in-context. When the user pulls up the links list they hear "Edit, Void, Resend, Edit,
Void, Resend, Edit, Void, Resend" — nine indistinguishable links — with nothing tying any "Void" to a
specific invoice. A mistaken activation voids the wrong customer's invoice. The link text combined with its
(non-existent) preceding heading does not describe the purpose.

## Expected ACT-style outcome
**failed** (SC 2.4.4 — the purpose of each Edit/Void/Resend link is not determinable from the link text plus
its programmatically determined context; the disambiguating invoice identity is in a styled `<p>`, not a
heading or the link's list item).

## Why automated tools miss it
Each link has clear, non-empty text ("Edit", "Void", "Resend"), so c487ae / axe `link-name` passes. There is
no empty heading or skipped-level error to flag — the page simply has *no* per-invoice headings, which is not
a violation any heading-structure rule reports (a page is allowed to have one `<h1>` and no subheadings).
Identical link names going to different URLs is legitimate row-action behaviour, so a same-name heuristic
cannot fire confidently. Recognising that the bold `<p>` was *meant* to be the link's heading carrier, that
it fails because it is not a heading and not in-context, and that the three action triads are therefore
mutually indistinguishable, requires reading the visual design intent against the DOM — a human judgment.

## Citation
**Reference:** WCAG Technique H80 — Identifying the purpose of a link using link text combined with the preceding heading element (`wcag-techniques/html/H80.html`)
> "Find the heading element that precedes the link"
> "Check that the text of the link combined with the text of that heading describes the purpose of the link."

**Reference:** Trusted Tester v5.1.3 — SC 2.4.4 Link Purpose (`refs/trusted-tester/sc-2.4.4-link-purpose.md`)
> "'Programmatically determined link context' is **limited** to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text."
