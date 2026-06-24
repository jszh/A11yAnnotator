# case-03 — Single-select segmented control whose options are `role="button"`

## Scenario
The display settings of **Cirro Weather** include a temperature-unit selector rendered as
a segmented control: one bordered pill split into two joined segments, "°C" and "°F".
Exactly one is selected at a time (filled blue); choosing one deselects the other and
re-renders the forecast. Visually and behaviourally this is a single-select group — a
radio group drawn as a segmented control. Each segment is coded
`<div role="button" aria-pressed="true|false">`.

## Attribute tuple
- **content-domain:** consumer weather dashboard / display settings
- **UI-component / pattern:** segmented single-select (temperature unit °C / °F)
- **host-language construct:** `<div role="button" aria-pressed>` segments inside a plain `<div>` wrapper (no group role)
- **locale / i18n:** en-US (with non-ASCII degree glyphs)
- **failure-mechanism:** valid ARIA role token that is the WRONG role — independent toggle `button`s for what is a mutually-exclusive `radiogroup`/`radio` set

## Developer persona
A developer using an in-house design system whose only available "selectable" primitive
is a `ToggleButton` (`role="button"` + `aria-pressed`). To build the segmented unit
picker they placed two `ToggleButton`s side by side and wrote JS so selecting one clears
the other. They never reached for a radiogroup because the design system had no radio
primitive, and the toggle buttons "looked right." Each button has a valid role, an allowed
`aria-pressed`, and a name, so the build's accessibility gate passed.

## Element / selector carrying the issue
- `.seg .opt[role="button"]` (both segments) — mutually-exclusive options coded as
  independent toggle buttons. The wrapper `.seg` carries no `role="radiogroup"`, and the
  segments carry no `role="radio"` / `aria-checked`.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user encounters two separate **"toggle button, pressed / not pressed"**
controls. Nothing communicates that they are linked alternatives or that exactly one is
always chosen — the mutual exclusivity, obvious from the joined segmented pill, is absent
from the accessibility tree. There is no group boundary, no "1 of 2 / 2 of 2" position,
and no radio arrow-key navigation. The correct semantics — `role="radiogroup"` containing
two `role="radio"` options with `aria-checked` — would announce "Temperature unit, °C,
selected, radio button, 1 of 2," conveying both the choice set and the single-select
behaviour. The chosen role (`button`) is valid but misrepresents the control's actual
single-select role.

## Expected ACT-style outcome
**failed** — SC 4.1.2 Role limb: valid role tokens (`button`) that do not convey the
component's actual role/function (a single-select radio group rendered as a segmented
control).

## Why automated tools miss it
axe-core / WAVE / Lighthouse confirm `role="button"` is valid (674b10 passes),
`aria-pressed` is an allowed state for button (4e8ab6 has nothing to fail), and each
segment has an accessible name. A group of toggle buttons is a legitimate, common pattern,
so no rule fires. No tool can look at a joined segmented pill where exactly one option is
always selected and decide these should be radios in a radiogroup. Recognising
"single-select rendered as a segmented control" requires reading the visual joinery and
the one-of-N selection behaviour — human judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "What roles and states are appropriate to convey to assistive technology will depend
> on what the control represents. Specifics about such information are defined by other
> specifications, such as WAI-ARIA, or the relevant platform standards."

**Supporting reference:** WCAG Technique F15 — *Failure of Success Criterion 4.1.2 due to
implementing custom controls that do not use an accessibility API for the technology, or
do so incompletely* (`wcag-techniques/failures/F15.html`).

> "However, when custom controls are created, it is up to the control's author to ensure
> that the control is correctly exposed to users via the platform's accessibility API. If
> this is not done, then assistive technologies will not be able to understand what the
> control is or how to operate it..."
