# case-05 — Insurance quote wizard: CSS grid renders steps 1-2-3, DOM order is 3-1-2 so focus enters step 3 first

## Scenario
A single-screen "Quick Quote" wizard for SafeHarbor auto insurance. All three numbered
steps are shown stacked vertically: **(1) About you** at the top, **(2) Your vehicle** in
the middle, **(3) Coverage & quote** (with the "Get my quote" submit) at the bottom — a
visually unmistakable 1 → 2 → 3 sequence reinforced by numbered circle badges. The three
step panels are positioned with CSS Grid `grid-row`, but the DOM emits the panels in the
order **3, 1, 2**. With **no positive tabindex and no script**, keyboard Tab follows the
DOM: focus enters **Step 3's coverage radios and the "Get my quote" button first**, then
jumps up to Step 1 (name/age/ZIP), then to Step 2 (vehicle). A keyboard user is led to
choose a coverage level and request the quote *before* entering who they are or what they
drive — the numbered operational sequence is inverted.

## Attribute tuple
- **content-domain:** insurance quote wizard
- **UI-component / pattern:** stepper / multi-step wizard rendered on one screen
- **host-language construct:** CSS Grid `grid-row:1/2/3` ordering step panels visually; DOM emits panels 3,1,2; no `tabindex`, no JS
- **locale / i18n:** en-US
- **failure-mechanism:** interdependent steps out of order — a later step (coverage + submit) receives focus before earlier prerequisite steps

## Developer persona
A developer refactored a previously-paginated three-screen wizard into one scrolling
screen. They had a sticky "quote summary / coverage" panel that was historically rendered
first in the template (it used to sit in a right rail). When collapsing everything to one
column they kept that panel first in the source and used CSS Grid `grid-row` to drop each
step into the right visual slot, assigning the coverage panel `grid-row:3` so it would
*appear* last. The numbered badges and visual order looked correct in the browser, so it
shipped — the source order (3,1,2) was never reconciled with the visual order.

## Element / selector carrying the issue
The three `<section class="step">` panels. DOM order is `.step3, .step1, .step2`, while
`grid-row:3/1/2` paints them as 1→2→3. The Step 3 controls (`input[name="cov"]` radios and
`button.quote-btn`) are therefore the **first** focusable elements, ahead of Step 1's
`#name`/`#age`/`#zip` and Step 2's `#make`/`#year`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** reads top-to-bottom, fills Step 1, 2, 3, clicks Get my quote.
  Fine.
- **Sighted keyboard / switch user:** the first Tab lands inside Step 3 — on a coverage
  radio. Continuing, they reach "Get my quote" while Steps 1 and 2 are still empty, then
  Tab carries them *up the page* into Step 1, then down into Step 2. The steps are
  **interdependent and explicitly ordered** (a quote depends on driver and vehicle
  details), and the visual presentation numbers them 1-2-3. The focus order does not
  preserve that sequence or operability: a user can trigger the submit before completing
  the prerequisites, and the up-and-down focus jumps are disorienting.
- The Understanding's standard for failing: a focus order that "impedes the meaning or
  operation of content, or creates confusing or illogical focus orders." A numbered wizard
  whose focus enters step 3 first is the textbook case.

## Expected ACT-style outcome
**failed** (SC 2.4.3). Focusable controls receive focus in an order that does not preserve
the meaning/operability of the explicitly-numbered, interdependent step sequence.

## Why automated tools miss it
- No positive `tabindex` and no JS → F44 / tab-order linters find nothing.
- Every control has a label/name; the radio group, fieldset, and headings are valid →
  axe/WAVE/Lighthouse pass.
- CSS Grid `grid-row` placement and the chosen DOM order are both legal. Detecting the
  defect requires (1) rendering the page, (2) reading the visual numbering (1, 2, 3) to
  infer the intended operational sequence, and (3) comparing it to the actual Tab order to
  see that a *later* interdependent step receives focus first. That is the human
  visual/semantic judgment the Understanding reserves; no DOM-only scan reconstructs "step
  3 should come after steps 1 and 2."

## Citation
> "The intent of this success criterion is to ensure that when users navigate sequentially through content, they encounter information in an order that is consistent with the meaning of the content and can be operated from the keyboard."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "Determine if the focus order impacts the page meaning (e.g., form fields for a mailing address are presented in the expected sequence). Most noticeable when focus order does not follow the logical order of operation (normally top to bottom, left to right)."
— refs/trusted-tester/sc-2.4.3-focus-order.md (How to Test)
