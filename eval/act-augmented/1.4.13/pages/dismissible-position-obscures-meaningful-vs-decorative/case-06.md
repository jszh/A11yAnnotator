# case-06 — Disruption tooltip grows back over its own trigger and the departure row (FAIL)

## Scenario
A live rail-departures board ("Northline Rail — Kingsway Interchange") lists trains in a
data table. The delayed **10:42 Coastline Express — Eastport** service has a small **"?"
reason button** in its status cell; hovering/focusing it shows a tooltip explaining the
disruption (a signalling fault). There is **no keyboard dismiss** (no Escape handler, no
close button, not hoverable-to-close), so **Method 1 (non-obscuring positioning)** is the
only available compliance path. The developer wanted the tooltip to sit *above* the button
so it would not cover the rows below, and used `bottom: -4px`. Because the tooltip's
positioned ancestor (`.why-wrap`) is shrink-wrapped to the tiny 20px button, `bottom:-4px`
pins the tooltip's **bottom edge** ~4px under the button and lets the ~150px-tall box grow
**upward** — landing the whole popup back **on top of its own "?" trigger** and across the
**destination and platform** of the 10:42 row (and the platform/status columns of the rows
above). The user can no longer see the control they are pointing at or read which train the
explanation is about. Method 1 fails (it obscures the trigger and meaningful service data);
Method 2 is absent. The page **FAILS**.

## Attribute tuple
- **content-domain**: public transit / real-time travel information
- **UI-component/pattern**: disruption-reason tooltip inside a live departures `<table>`
- **host-language construct**: `<button class="why">` + `<span role="tooltip">` inside a shrink-wrapped `position:relative` `.why-wrap`; CSS `bottom:-4px` (over-tall box grows upward)
- **locale/i18n**: en
- **failure-mechanism**: over-tall popup anchored at the button origin grows back over the trigger + row data (direction-independent geometry; no i18n/RTL involved)

## Developer persona
A transit-agency front-end developer added inline disruption explanations to the departures
board. To keep the tooltip from covering the next train's row, they pinned it "above" the
button with `bottom: -4px` on a wrapper sized to the 20px button — a value that looked right
on a one-line stub tooltip during development. With the real multi-sentence disruption copy,
the box is ~150px tall and grows up over the button and the row it annotates. The developer
tested with a mouse on a desktop with the popup's short placeholder text and never noticed
that the production-length message buries the trigger and the live data; there is no Escape
handler, so a magnifier user has no way to clear it in place.

## Element / selector carrying the issue
- Trigger: `button.why` (the "?" reason control on the 10:42 row)
- Obscuring popup: `#why-coast` (`span[role="tooltip"].tip`)
- Obscured content: the trigger itself, plus the 10:42 row's **destination** and **platform**
  cells and the platform/status cells of the rows above (live, information-bearing data)

## Exact accessibility mechanism
A low-vision user at high magnification focuses/hovers the "?" on the delayed 10:42 service
to find out why it is late. The tooltip opens and grows upward, **covering the "?" button
itself** (verified: `document.elementFromPoint` at the trigger's center returns the tooltip,
overlap 20×20 = full) and the row's **destination** ("Coastline Express — Eastport") and
**platform** ("7") cells, along with the platform/status of the rows above. The user can no
longer read which train the explanation belongs to, and — because the box hides the very
control they invoked — loses track of what they are pointing at. With no Escape (or any)
dismiss mechanism they cannot clear the popup while keeping focus/hover on the trigger; moving
focus away hides the popup (and the disruption details). Method 1 explicitly forbids obscuring
"any other content **including the trigger**," and both the trigger affordance and the live
service data are meaningful content, not exempt white space or decoration. A screen-reader
user gets the button name and the tooltip text from the DOM regardless of the visual stack,
so this is a purely visual/positional failure that depends on the rendered open state.

## Expected ACT-style outcome
**failed** — additional content on hover/focus obscures the trigger and adjacent meaningful
content, and no dismiss mechanism exists; neither Method 1 nor Method 2 is satisfied.

## Why automated tools miss it
Every linter-checkable property is correct: the trigger is a real `<button>` with an
accessible name, the tooltip carries `role="tooltip"` and is wired via `aria-describedby`,
there is a visible focus ring, contrast passes, and the schedule is a proper data `<table>`.
axe-core, WAVE, and Lighthouse never enter the hover/focus state, never compute that the open
tooltip's rectangle lands back on top of its own trigger and the departure row, and cannot
judge that the covered pixels are meaningful service data rather than empty margin. The bug
is invisible in the resting DOM — it only manifests because the production-length text makes
the box tall enough to grow up over the row. Recognizing "the popup covers the control I just
hovered and the data it annotates" is a visual + semantic human judgment.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible (Method 1, "including the trigger")**
> "Position the additional content so that it does not obscure any other content including
> the trigger, with the exception of white space and purely decorative content, such as a
> background graphic which provides no information."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (intent)**
> "The intent of this condition is to ensure that the additional content does not interfere
> with viewing or operating the page's original content."
