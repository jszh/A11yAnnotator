# case-06 — PASS boundary (hardest): focusable sidebar category labels add tedium but NOT confusion ("tedious" vs "impedes operation")

## Scenario
A developer API reference (Cortex). The left nav groups links under category headers
("Getting started", "Core", "Advanced"). Each category label is a focusable static element
(`tabindex="0"`) — added so a keyboard hint could appear on focus. This produces *more* Tab
stops than strictly necessary (one per category), so navigating the sidebar is slightly tedious.
But the extra stops do NOT impede meaning or operation: each label sits at the head of its OWN
group, no link is reached twice, and no dead stop is wedged between two coupled controls. The
order is label → its links → next label → its links, which preserves the nav's meaning and
operability. This page sits squarely on the line the Understanding note draws — *tedious*
(best-practice, allowed) versus *meaning-impeding* (a failure) — and must NOT be flagged.

## Attribute tuple
- **content-domain:** developer docs / API reference
- **UI-component/pattern:** grouped sidebar navigation with category section headers
- **host-language construct:** focusable static section headers — `span.cat[tabindex=0]` preceding each link group
- **locale/i18n:** en
- **failure-mechanism:** NONE — extra-but-orderly focus stops that are merely tedious, not confusing/illogical (boundary PASS, the hard distinction)

## Developer persona
A pragmatic docs-platform engineer who made the collapsible category headers focusable so a
"press Enter to collapse" hint could show on focus. The sections here happen to be fully expanded,
so on focus the labels do little — adding tab stops. They did not remove the focusability, so the
nav is a touch tedious to tab through, but the grouping is clean and orderly. This is the realistic
"extra stops, but harmless" case that must be distinguished from the genuine failures.

## Element / selector carrying the issue
`span.cat[tabindex="0"]` (three of them) — focusable static category headers. They add tab stops
but never duplicate a link and never interrupt a coupled control sequence.

## Exact accessibility mechanism (what AT experiences, why it passes)
Tabbing the sidebar: "Getting started" (static header) → "Install the SDK" link → "Authentication"
link → "Core" (header) → "Sending requests" link (current) → "Handling responses" → "Error codes" →
"Advanced" (header) → its three links. A screen reader announces each header as static text, then the
links of that group in order. The user encounters extra stops on the headers, which is *tedious* —
the note's own words for non-actionable focusable elements — but the order still preserves meaning
(each header clearly introduces the group beneath it) and operability (every link is reached exactly
once, in logical order). Nothing receives focus twice; nothing dead lands between two related controls.
Per the note this is best-practice territory, not a failure, so the page conforms to 2.4.3.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
A naive heuristic that flags "many `tabindex="0"` on non-interactive elements = extra focus stops"
would WRONGLY fail this page, and a tool cannot make the distinction the note requires. The labels are
valid focusable `<span>`s. Deciding that these stops are merely *tedious* (allowed) rather than
*confusing/illogical* (a failure) — by confirming none duplicate a control and none interrupt a coupled
sequence — is the precise human judgment that separates this PASS from the FAIL cases. No static scanner
weighs "tedious vs impedes operation."

## Citation
> **WCAG 2.2 Understanding Focus Order, Intent (note, best-practice paragraph):**
> "As a best practice, avoid having focusable elements which cannot be operated or actioned, as these are likely to make operation tedious for keyboard users."

(Verbatim from `wcag-understanding/focus-order.html`. The focusable category labels are exactly these
non-actionable focusable elements — making navigation *tedious*, which the note frames as best-practice
advice, NOT a failure of the success criterion.)

> **WCAG 2.2 Understanding Focus Order, "For clarity" list:**
> "Static/non-interactive elements can receive focus, as long as they don't impede operation of the content, or result in confusing or illogical focus order."

(Verbatim from `wcag-understanding/focus-order.html`. Here the static labels do not impede operation and
do not create a confusing or illogical order, so the permission applies and the page passes.)
