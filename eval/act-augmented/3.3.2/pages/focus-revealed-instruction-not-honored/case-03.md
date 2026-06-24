# case-03 — Travel-date format hint un-hides on focus but is absolutely positioned in the band covered by a fixed booking-summary footer with a higher z-index, so the revealed instruction is fully occluded

## Scenario
A flight-booking date step (Aerolink). The travel-date field requires day-first format "DD/MM/YYYY",
which is the field's only instruction; the visible `<label>` reads just "Travel date" and does not
state the format. Per the focus-revealed pattern, the format hint is `display:none` until the input is
focused, then becomes `display:block` — the reveal genuinely fires. But the hint is built as a
"floating help bar": `position:fixed; bottom:0`, pinned to the bottom of the viewport. The page also
has a `position:fixed; bottom:0`, opaque booking-summary footer with a **higher** `z-index`. Both bars
occupy the very bottom of the viewport, so the revealed help bar always paints directly behind the
opaque footer — in every viewport size, not by coincidence — and is fully occluded. This is the
aspect's failure limb (c): the instruction appears on focus but is rendered off-screen / behind
another element. (Verified: the hint is `display:block` and `visibility:visible` on focus, yet
`document.elementFromPoint` at the hint's center returns the `.summary-bar` footer at viewports
800×600, 1024×768, 1280×900, and 1440×1024 — the occlusion is deterministic across viewport heights.)

## Attribute tuple
- **content-domain:** travel / flight booking (date-selection step)
- **UI-component/pattern:** focus-revealed "floating help bar" (fixed bottom) colliding with a fixed sticky booking-summary footer (two competing fixed bottom bars)
- **host-language construct:** `<input type="text">`, `#travel:focus ~ .date-hint { display:block }`, hint `position:fixed; bottom:0; z-index:10`, footer `position:fixed; bottom:0; z-index:50` opaque; `aria-describedby` on the input
- **locale/i18n:** en-GB (day-first date format is the reason the instruction is needed)
- **failure-mechanism:** stacking-context / overlap — the revealed help bar and the footer both pin to `bottom:0`, so the footer (higher z-index, opaque) always paints over the hint in every viewport, occluding it despite `display:block`

## Developer persona
A developer implemented the date hint as a global "floating help bar" component (the design system's
pattern for contextual help: `position:fixed; bottom:0`, slides up when a field needs it). The booking
flow team independently added a sticky "booking summary" footer — also `position:fixed; bottom:0`,
with a high `z-index` so it always floats above page content. Each component was verified on its own;
no one focused the travel-date field on a page that had both bars mounted, so nobody saw the help bar
render underneath the opaque summary footer. The two-fixed-bottom-bars collision is invisible in any
view that doesn't drive focus to the date field.

## Element / selector carrying the issue
`#travel` (the travel-date input) and its hint `#travel-hint.date-hint` (`position:fixed; bottom:0;
z-index:10`), occluded by `.summary-bar` (`position:fixed; bottom:0; z-index:50`, opaque background).
On focus the hint is `display:block` and `visibility:visible`, but the higher-z-index fixed footer
paints over the region it occupies.

## Exact accessibility mechanism (what AT experiences, why it fails)
The day-first format is the only instruction telling the user how to type the date (critical, since
09/03 means very different dates day-first vs month-first). A sighted keyboard or low-vision user tabs
to "Travel date"; the hint un-hides but is painted entirely behind the opaque fixed footer, so they
see the footer, not the instruction — visually the field has no perceivable format guidance in its
focused state. The instruction is therefore not "visible when the form field has focus": it is present
and even technically `display:block`, but rendered where it cannot be seen. (A magnifier user zoomed
into the field region is especially affected — the revealed hint is exactly where the footer overlaps,
so it never enters the perceivable area.) The field's only instruction is effectively withheld in the
one state the user reaches it.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The input has a correct, associated `<label>` ("Travel date"), so axe / WAVE / Lighthouse pass it on
the form-label check. The hint node exists, transitions `display:none` -> `display:block` on focus,
and is wired via `aria-describedby`, so a static scan sees an instruction that "appears on focus."
Automated checkers do not compute the painted stacking order of an absolutely-positioned hint against
a `position:fixed` higher-`z-index` footer, do not drive focus to render the focused state, and do not
visually judge that the revealed instruction is hidden behind another element. Detecting the occlusion
requires rendering the focused state and looking at the result — a visual/contextual judgment a static
linter cannot make.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Instructions or labels may also specify data formats for data entry fields, especially if they are
> out of the customary formats or if there are specific rules for correct input."

> **Trusted Tester v5.1.3 5.A (Notes), `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`:**
> "The label or instruction must be visible when the form field has focus."

(The day-first format is exactly the "data format … out of the customary format" instruction the
Understanding describes, and it is deferred to focus. The TT note requires it to be **visible** when
the field has focus. Here it un-hides on focus but is rendered fully behind the fixed footer, so it is
not visible — the focus limb is not honored.)
