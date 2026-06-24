# case-06 — PASS boundary: settings switches run script ON FOCUS but focus REMAINS (SCR31, not F55)

## Scenario
A SaaS analytics "Notification settings" panel with three `role="switch"` toggle buttons.
Each switch runs a script handler the instant it receives focus — superficially the same
trigger as an F55 page — but the handler **adds a high-contrast focus ring class** (SCR31)
and removes it on blur. It never calls `blur()` and never moves focus. Focus genuinely
settles on the switch and a strong visible indicator persists the whole time it is focused.
This is the boundary case: "script touches focus on receipt" is *not* automatically a
failure — only script that *removes or relocates* focus is.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard (notification settings)
- **UI-component/pattern**: switch / toggle (`role="switch"` buttons)
- **host-language construct**: `addEventListener('focus'/'blur', …)` that toggles a CSS class (SCR31)
- **locale/i18n**: en
- **failure-mechanism**: NONE — sufficient technique SCR31 (scripted focus indicator), used as the F55 contrast/boundary

## Developer persona
A senior front-end engineer wanted a heavier, brand-colored focus ring than the platform
default for the settings switches, so they implemented SCR31: on `focus` add a `.kbd-focus`
class that paints a two-layer `box-shadow` ring, on `blur` remove it. They were careful to
keep the native `:focus` outline as a fallback and to keep keyboard activation (Space/Enter)
working, and they explicitly never call `.blur()` or move focus. The page therefore *reads*
like the F55 pages (script firing on focus) but is correct — the realistic trap for a
reviewer pattern-matching on "onfocus / focus handler" as if it were always F55.

## Element / selector carrying the issue
- PASS: `button.switch[role="switch"]` (×3) — `focus` handler adds `.kbd-focus`; focus remains on the control and the indicator persists.

## Exact accessibility mechanism
A keyboard user tabs from the sidebar into the settings list and lands on the first switch.
The `focus` event fires and the handler adds `.kbd-focus`, painting a high-contrast ring
*around the still-focused switch*; the native `:focus` outline also applies. Focus stays on
the switch — the user can press Space/Enter to toggle `aria-checked`, and the indicator
remains visible until they Tab away (at which point `blur` removes the class). At no point is
`.blur()` called or focus relocated, so the temporal limb of 2.4.7 is satisfied: "when the
keyboard focus is shown it must remain." This is exactly the sufficient technique SCR31
("Using script to change the background color or border of the element with focus"), the
legitimate sibling of the F55 anti-pattern.

## Expected ACT-style outcome
**passed** — when each switch receives focus, focus remains and a visible focus indicator is
shown (the scripted SCR31 ring plus the native outline); no script removes or moves focus.

## Why automated tools miss it
For the same structural reason the failing pages evade detection: there is no automated
2.4.7 rule, so neither pass nor fail can be confirmed mechanically. Worse, a heuristic that
flagged "scripted focus handlers" would *wrongly* flag this valid SCR31 implementation as
F55 — the static signature (a `focus` listener on each control) is identical to focus theft.
Distinguishing the two requires running the keyboard sequence and observing the temporal
outcome: does focus *remain* with a persistent indicator (SCR31, pass) or get *removed/moved*
(F55, fail)? That is a human/dynamic judgment a scanner cannot make. Including this page
sharpens the aspect: the failure is "focus removed on receipt," not merely "script runs on
focus."

## Citation
> **WCAG Techniques — SCR31: Using script to change the background color or border of the element with focus** (sufficient technique for 2.4.7)
> Title: "Using script to change the background color or border of the element with focus."
> (Listed in the 2.4.7 inventory as relation: "sufficient" — the legitimate use of script on
> focus, in contrast to F55 which removes focus.)

> **WCAG Techniques — F55** (the contrasting failure)
> "Content that normally receives focus when the content is accessed by keyboard may have
> this focus removed by scripting." — F55 is the *removal* of focus; SCR31 is *styling* the
> element that retains focus.

> **WCAG 2.2 Understanding 2.4.7 — Intent of Focus Visible**
> "The focus indicator must not be time limited, when the keyboard focus is shown it must
> remain."
