# case-04 — Banking dashboard: gear glyph labelling a Log-out control, accessible name "gear"

## Scenario
An online-banking dashboard ("Tidewater Bank") shows a top bar with an account menu at the right.
The only session-end control is an icon button rendering a **gear/cog** glyph (universally
"Settings"). It carries `aria-label="gear"` — the name describes the *glyph* the developer drew,
not the *function* — and clicking it ends the secure session (log out). Both the glyph (gear =
settings) and the literal name ("gear") point away from the control's actual purpose, and in a
banking context the consequences (accidental sign-out, or hunting for a settings panel that never
opens) are real.

## Attribute tuple
- **content-domain:** online banking / fintech dashboard
- **UI-component/pattern:** top-bar account/utility icon button (session control)
- **host-language construct:** `<button aria-label="gear"><svg aria-hidden="true">…cog…</svg></button>`
- **locale/i18n:** en-CA ("Chequing")
- **failure-mechanism:** accessible name names the GLYPH ("gear") not the FUNCTION ("Log out"), AND the gear glyph conventionally means Settings — double mismatch

## Developer persona
A developer assembling the header dropped in a cog icon as a placeholder for the future "account
settings" menu and wired a temporary `aria-label="gear"` straight from the icon's name in the
sprite sheet. Scope changed: the only thing that shipped behind that button was log-out, but the
glyph and the placeholder label were never revisited. The a11y lint passed because "gear" is a
non-empty name, so it shipped.

## Element / selector carrying the issue
- `header .acct button.iconbtn[aria-label="gear"]` — renders a cog SVG; `onclick` logs the user out.

## Exact accessibility mechanism
The button is exposed with role `button` and accessible name "gear" (from `aria-label`; the cog
SVG is `aria-hidden="true"`). A screen-reader user hears "gear, button" — a description of the
picture, giving no clue the control logs them out. A sighted user sees a cog, the commonly-understood
cue for *settings*, and likewise will not expect session termination. The label fails on both
channels: programmatically it describes the glyph not the purpose, and visually the glyph is the
wrong commonly-understood cue for "log out." This is the 2.4.6 label limb for a graphical label;
the Understanding doc explicitly notes a name can be programmatically present (4.1.2 satisfied)
yet still fail to be descriptive.

## Expected ACT-style outcome
**failed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). The button has a non-empty
accessible name (4.1.2 passes); the name and glyph are simply not descriptive of "log out."

## Why automated tools miss it
axe-core (`button-name`), WAVE, and Lighthouse pass any button with a non-empty accessible name;
"gear" qualifies. No tool reasons that "gear" describes the glyph rather than the action, no tool
rasterises the SVG to recognise a cog, and no tool encodes "cog conventionally means settings, not
log out." Catching that the name names the picture and the glyph is the wrong cue for the function
requires a human who both reads the announced string and sees/knows the icon convention.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "It is possible for controls and inputs to have an appropriate accessible name (e.g. using `aria-label="…"`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the label is inaccurate or insufficiently clear or descriptive)."
>
> **Reference:** WCAG Technique G131 — "Providing descriptive labels" (`wcag-techniques/general/G131.html`)
>
> **Quote (verbatim):** "The objective of this technique is to ensure that the label for any interactive component within web content makes the component's purpose clear."
