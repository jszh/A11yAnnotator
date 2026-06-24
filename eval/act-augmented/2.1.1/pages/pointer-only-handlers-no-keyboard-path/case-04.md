# case-04 — Daily-budget slider is a drag-only `<div>` thumb (mousedown/mousemove), no keyboard

## Scenario
An ad-platform "Create campaign" form (Northstar Ads Manager). The **daily budget** is set
with a custom slider: a circular thumb `<div>` on a track, dragged with the mouse (or
touch) to choose £10–£100/day. Every other field — campaign name, objective `<select>`,
start/end date inputs, and the Save/Save-as-draft buttons — is fully keyboard operable.
There is no number field anywhere to type the budget; the slider is the only input for it.

## Attribute tuple
- **content-domain:** SaaS analytics / advertising dashboard
- **UI-component/pattern:** slider / range control (budget chooser)
- **host-language construct:** `<div class="thumb">` with `mousedown`/`mousemove`/`touchmove`; no `role="slider"`, no `tabindex`, no `aria-value*`, no key handler
- **locale/i18n:** en-GB (£ budget)
- **failure-mechanism:** drag-only value control; pointer is the only way to set an endpoint value (not path-dependent, so no exception)

## Developer persona
A product engineer wanted a "nicer than the default range input" budget control to match
the dashboard's design system, so they hand-rolled a div-based slider from a CodePen that
implemented only the drag interaction. They meant to come back and add arrow-key support
and `role="slider"` but the ticket was closed once the drag felt smooth. No native
`<input type="range">` (which would have been keyboard-operable for free) was used.

## Element / selector carrying the issue
`#thumb` (and the `#track` it sits on) — the draggable budget thumb. It responds only to
`mousedown`/`mousemove`/`touchmove`; it has no `role`, no `tabindex`, no `aria-valuenow/min/max`,
and no `keydown`. The committed value lives in a hidden `#dailyBudget` input that has no
user-editable control.

## Exact accessibility mechanism
The thumb and track are plain `<div>`s, so AT exposes them as generic/decorative content,
not as a slider, and they are not in the tab order. The value-setting function is bound
exclusively to pointer drag events (`mousedown` + `mousemove`, plus touch equivalents);
there is no `keydown` handler, so arrow keys, Home/End, and PageUp/Down do nothing, and
there is no alternative number field to type the budget. A keyboard-only user therefore
cannot set the daily budget at all — they can fill every other field but cannot complete
the campaign. Crucially, the drag sets only the **endpoint** value (a number from a
position), not a path, so this is NOT the path-dependent function the 2.1.1 exception
covers (per the Understanding text, "dragging objects to a location (when the path to that
location is not relevant) do not require path dependent input"). It is the F54 failure:
a pointing-device handler is the sole mechanism to invoke the value-setting function.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (F54), also relevant to 4.1.2 (no slider role/value) but the
operative failure here is the missing keyboard path. The 2.1.1 ACT rules (0ssw9k, akn7bn)
do not apply. Note the explicit non-exception: the function is endpoint-based, not
path-dependent.

## Why automated tools miss it
With no `role` and no `tabindex`, the thumb and track are invisible to scanners as a
control — axe-core sees only inert `<div>`s and cannot infer they are "meant to be" a
slider, so no keyboard-operability rule fires and nothing is reported as missing or
invalid. (Had the author added `role="slider"`, axe could check for `aria-valuenow`, but it
still could not verify that arrow keys change the value — a runtime behaviour.) Discovering
the failure requires a human to drag the handle (learning it is a value control), then Tab
through the form and press arrow keys to confirm there is no keyboard way to set the budget
— and to reason that this endpoint drag is not the path-dependent exception.

## Citation
> **Reference:** WCAG 2.2 Understanding — Keyboard (Intent, path-dependent exception)
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "Drawing straight lines, regular geometric shapes, re-sizing
> windows and dragging objects to a location (when the path to that location is not
> relevant) do not require path dependent input."
>
> **Reference:** WCAG Techniques — F54 (`wcag-techniques/failures/F54.html`)
>
> **Quote (verbatim):** "When pointing device-specific event handlers are the only
> mechanism available to invoke a function of the content, users with no vision … as well
> as users who must use alternate keyboards or input devices that act as keyboard
> emulators will be unable to access the function of the content."
