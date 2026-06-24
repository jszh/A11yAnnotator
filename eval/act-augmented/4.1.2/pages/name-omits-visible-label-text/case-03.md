# case-03 — Per-row "Pay" buttons whose concatenated name names the WRONG invoice (referent off-by-one)

## Scenario
A utility-company billing dashboard ("Meridian Utilities") listing three open invoices, each row with
a visible **Pay** button. To give screen-reader users context (so they don't hear "Pay" three times
in a row), the developer used `aria-labelledby` to concatenate each button's own text with a
visually-hidden node carrying that row's invoice number — an ARIA16-style "name from multiple
sources". The intent is good and the visible word "Pay" is preserved inside the computed name. But a
templating off-by-one wired **row 1's button to the hidden context node of row 3** (and row 3's to
row 1's). The result: the button on the row a sighted user reads as **INV-2025-0042** is announced as
**"Pay invoice INV-2025-0051"** — it names a *different* invoice than the one it visibly belongs to.

## Attribute tuple
- **Content domain:** utility / billing self-service portal (fintech-adjacent)
- **UI component / pattern:** data table of invoices with a per-row action button
- **Host-language construct:** native `<button>` + `aria-labelledby` concatenating the button's own text with a `.vh` context `<span>` (ARIA16 multi-source name)
- **Locale / i18n:** en-US
- **Failure mechanism:** `aria-labelledby` builds a name that **contains** the visible label "Pay" but appends a **wrong-referent** invoice id; divergence type = **CONTAINS-BUT-MISIDENTIFIES** (right word, wrong thing)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element" (here: the *wrong* hidden element) + multi-source name assembled incorrectly

## Developer persona
A full-stack dev rendered the rows in a loop and, to add context, set
`aria-labelledby="{{btnId}} {{ctxId}}"`. The context id was computed from a sibling index that was
off by one position (or pulled from a memoized array reused across rows), so each button references a
neighbour's hidden context span instead of its own. The page passed the team's automated a11y scan
(every button has a non-empty name, valid IDREFs, correct role, and the visible "Pay" is inside the
name) so the swap shipped.

## Element / selector carrying the issue
`#pay-0042` — `<button id="pay-0042" aria-labelledby="pay-0042 ctx-0051">Pay</button>` sitting in the
row whose visible id is **INV-2025-0042**, while `#ctx-0051` is the hidden span reading
"invoice INV-2025-0051". (Row 3's `#pay-0051` symmetrically references `ctx-0042`.)

## Exact accessibility mechanism
`aria-labelledby` overrides element content and concatenates the referenced nodes' text in IDREF
order, so the name is `"Pay" + " " + "invoice INV-2025-0051"`. **Verified empirically in headless
Chromium** (a11y tree): button on the 0042 row → `role=button`, `accName="Pay invoice INV-2025-0051"`;
button on the 0051 row → `accName="Pay invoice INV-2025-0042"`; the middle row (`ctx-0049` correctly
self-referenced) is right. The visible label "Pay" is a leading substring of every name, so the name
is non-empty (the link/button-name rules PASS) and **SC 2.5.3 label-content-name-mismatch is
satisfied and does not fire** — confirmed empirically: `axe-core` reports **0 violations** on this
page. Yet the name is not programmatically determinable *as this control's true identity*: a
screen-reader user settling "invoice 0042" by its announced name activates the control that visibly
pays a *different* invoice. The component cannot be reliably identified and operated by the context
its rendered row presents.

## Expected ACT-style outcome
**failed** (F111 check #1 true — the control has a visible label; #2 true — it has an accessible name;
#3 *technically* true for the bare word "Pay", but the SC 4.1.2 obligation that the name correctly
identify the control is violated because the name binds the button to the wrong invoice). The middle
row (`pay-0049`, self-referenced) **passes** — its name matches its row — which isolates the defect to
the wrong-referent rows and shows the failure is the misidentification, not a missing name.

## Why automated tools miss it
Every fully-automated 4.1.2/2.5.3 check passes here, empirically: names are non-empty; all
`aria-labelledby` IDREFs resolve to **present** elements (no dangling-reference lint); roles are
correct; and because the visible "Pay" **is contained** in each computed name, axe-core's
`label-content-name-mismatch` (SC 2.5.3) — the very rule that catches REPLACES/OMITS string
mismatches — stays silent. No static or rendered-DOM checker knows which invoice each *row* visibly
represents, nor that the hidden context node bound to a button belongs to a different row. Detecting
the defect requires reading the visible invoice number off the rendered row, hearing/inspecting the
button's announced name, and judging that they identify different invoices — a human
semantic+contextual comparison no automated checker performs.

## Citation
> "Check that the text of the referenced element or elements accurately labels the user interface
> control."
— WCAG Techniques, **ARIA16** (`wcag-techniques/aria/ARIA16.html`), Tests › Procedure (check #2)
> (ARIA16 check #1 passes — every `aria-labelledby` IDREF resolves to a present element — but check #2
> **fails**: the referenced hidden node names a *different* invoice than the one this button visibly
> settles, so the text does not accurately label the control.)
