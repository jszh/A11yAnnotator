# case-02 — DMV focus help bubbles cleared by a global 5s setInterval while field focused

## Scenario
A government "Renew vehicle registration" wizard (Step 2 of 4) shows a contextual help
bubble (`role="tooltip"`) under the Plate and VIN fields when each field receives focus.
A keyboard user tabs into the VIN field, then looks away to find the 17-character VIN on
their dashboard / insurance card. A single page-level `setInterval(…, 5000)` clears any
visible bubble every five seconds — so the help disappears while the field **still has
focus** and the user is still mid-task.

## Attribute tuple
- **content-domain**: government / civic services portal (DMV registration renewal)
- **UI-component/pattern**: focus-triggered field help bubbles (disclosure-on-focus)
- **host-language construct**: `<input>` focus/blur + `role="tooltip"` + `setInterval` sweep
- **locale/i18n**: en
- **failure-mechanism**: interval-based auto-dismiss blind to focus state (focus check #1)

## Developer persona
A government-contractor dev wired per-field help on focus, then added one "tidy-up"
`setInterval` to "make sure stale bubbles never linger" rather than tracking each field's
state. The sweep runs regardless of focus, silently breaking the focus persistence rule.

## Element / selector carrying the issue
- `#plateHelp[role="tooltip"]` and `#vinHelp[role="tooltip"]` — both removed by the global
  `setInterval(…, 5000)`.
- Triggers: `input#plate`, `input#vin`.

## Exact accessibility mechanism
Because the help appears on focus (not just hover), SCR39's focus checklist applies:
#1 "stays visible and does not automatically close after a time," #2 dismissible without
moving focus. Esc dismissal is wired, so #2 passes. But the 5-second interval removes the
bubble while the input is still focused and the instructions (no spaces/dashes; VIN never
contains I/O/Q) are still completely valid. A keyboard-only or low-vision user reading
slowly, or stepping away to read the VIN off the windshield, returns to find the guidance
gone with no way to know why — they did not blur the field, dismiss it, or invalidate any
information. The disappearance is for a disallowed reason (elapsed time).

## Expected ACT-style outcome
**failed** — focus-triggered content auto-closes after a time while focus retained (SCR39
focus-check #1).

## Why automated tools miss it
The bubbles are valid `role="tooltip"` elements, keyboard-triggered via focus/blur, with
an Esc handler, and they never obscure the inputs — axe/WAVE/Lighthouse report nothing.
The violation is a recurring `setInterval` that removes still-valid content while the
field is focused; no scanner holds focus across a 5-second cadence and re-checks tooltip
visibility. Telling this disallowed timer apart from a legitimate info-invalidation needs
a human to keep focus, watch the timeline, and judge that the information is still valid.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (for content that appears on focus, #1):**
> "The additional content stays visible and does not automatically close after a time."
> (wcag-techniques/client-side-script/SCR39.html)

> **WCAG 2.2 Understanding 1.4.13 — Persistent:** "The intent of this condition is to
> ensure users have adequate time to perceive the additional content after it becomes
> visible. Users with disabilities may require more time for many reasons, such as to
> change magnification, move the pointer, or simply to bring the new content into their
> visual field." (wcag-understanding/content-on-hover-or-focus.html)
