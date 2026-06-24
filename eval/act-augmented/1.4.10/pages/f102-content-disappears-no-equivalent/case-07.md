# case-07 — "Download PDF" action button is removed at 320px while View and Dispute remain; the download function is simply gone on small viewports (FAIL)

## Scenario
An online-banking statements page ("Harbourline Bank") lists monthly statements, each row offering
three actions: **View**, **Download PDF**, and **Dispute a charge**. At desktop width all three are
present and operable. At `max-width:520px` each row reflows to a stacked card (no horizontal scroll —
the layout reflows well), but the "Download PDF" button is removed with `display:none` on the
`.act-download` class "to reduce clutter on mobile." View and Dispute remain. There is no overflow /
"more actions" menu, no per-row kebab, no account-level "Download all statements" link, and no link to
a separate statements-download view. So a low-vision customer who banks at 400% zoom, or any phone
user, cannot download a statement PDF at all — a function available at desktop width is unavailable
after reflow.

## Attribute tuple
- **Content domain:** online banking / fintech dashboard
- **UI component / pattern:** data row with a cluster of per-row action buttons (a toolbar of actions)
- **Host-language construct:** one action `<button class="act-download">` removed via `@media (max-width:520px){ .act-download { display:none } }` while sibling actions remain
- **Locale / i18n:** en-GB (£, PRA, "secure inbox")
- **Failure mechanism:** loss of *functionality* (an action) at narrow width, not just informational content — one button conditionally removed by CSS with no equivalent path

## Developer persona
A bank's design-system contributor noticed the three action buttons wrapped awkwardly on small screens
and "cleaned it up" by hiding the least-used one (in their analytics, Download had the lowest mobile
tap rate) behind a CSS rule. They reasoned customers could "just View it" — not realising that viewing
an on-screen statement is not the same function as downloading the official PDF (for an accountant, a
mortgage application, or a benefits claim), and that low-vision users reach the mobile breakpoint by
*zooming a desktop*, not by choosing a small screen.

## Element / selector carrying the issue
`.actions .act-download` (the "Download PDF" `<button>` on every statement row) under the rule
`@media (max-width:520px){ .act-download { display:none } }`. The remaining View and Dispute buttons
are the decoys that make the row still look functional.

## Exact accessibility mechanism
At ≥521px every row exposes three operable buttons; a keyboard or screen-reader user can download any
statement's PDF. At 320px the Download PDF button is removed from the rendering and the accessibility
tree on every row, while View and Dispute stay. Because the row still has working actions, it does not
appear broken — the loss is only detectable by comparing the action set across widths. No overflow
menu, kebab, account-level download link, or alternate view restores the function. So functionality
available at desktop width (downloading the statement PDF) is unavailable after reflow to 320px with no
equivalent mechanism — the F102 failure applied to *functionality* rather than informational content.

## Expected ACT-style outcome
**failed** (SC 1.4.10). An action present at 1280px is removed at 320px with no equivalent way to
perform it; the function is lost on reflow.

## Why automated tools miss it
The Download PDF button is a valid, named `<button>` present in the DOM at every width — it passes
button-name, role, and focus-order checks at desktop, and at 320px it is merely `display:none` (a
legitimate responsive idiom that tools do not flag). axe-core, WAVE, and Lighthouse do not render each
row at 320px, enumerate which actions remain operable, diff that set against the desktop set, and reason
that one specific function disappeared with no replacement. That cross-width *functional* diff — plus
the judgment that no other control or link lets the user download the PDF — is exactly the human
comparison F102 demands and the static, single-width tools cannot make.

## Citation
**Reference:** WCAG Technique F102 — Description (`wcag-techniques/failures/F102.html`)
> "This document describes a failure that occurs when a change of the viewport width to 320px makes content disappear that was available at wider viewport widths."

**Reference:** Understanding SC 1.4.10 Reflow — Reflowing websites and web applications (`wcag-understanding/reflow.html`)
> "Neither adjusting or relocating content is considered a loss of information or functionality, so long as users are still able to access the content."
