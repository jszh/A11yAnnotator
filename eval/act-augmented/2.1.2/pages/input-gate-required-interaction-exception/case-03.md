# case-03 — Wizard Step 1 held by a mouse-only plan tile (div onclick, no keyboard path) (FAIL)

## Scenario
A SaaS workspace-onboarding wizard. Step 1 requires the user to select a plan before
advancing to Step 2. The plan selector is a pair of "plan tiles" implemented as
`<div class="tile" onclick="pick(...)">` — they are not focusable, carry no role, and have
no key handler. While no plan is selected, the "Continue to Step 2" button stays disabled
and focus is held inside Step 1 (blurring the workspace field bounces back to it). The
required gating interaction (choosing a plan) therefore has no keyboard path at all, so a
keyboard-only user can never complete Step 1 and can never reach the rest of the wizard.

## Attribute tuple
- **content-domain:** SaaS productivity / workspace onboarding
- **UI-component/pattern:** stepper / wizard with a card/tile selection (APG-style grouped choice)
- **host-language construct:** `<div onclick>` plan tiles with no `tabindex`/`role`/`onkeydown`, plus a focus-hold `blur` handler
- **locale/i18n:** en-US
- **failure-mechanism:** required gating interaction cannot be performed by keyboard at all (pointer-only gate)

## Developer persona
A front-end developer built the plan picker as clickable `<div>` cards to get full control of
the hover/selected styling, planning to "add keyboard support later." They wired the gate
(disabled Continue + focus-hold) around the pointer `onclick` and shipped, having only ever
tested by clicking a tile.

## Element / selector carrying the issue
`.tiles .tile` — the two `<div class="tile" onclick="pick(...)">` plan cards. They are the
required gating control yet are not keyboard-operable, so the gate is unsatisfiable by
keyboard. The focus-hold lives on `#ws` (`blur` → re-focus while `!chosen`).

## Exact accessibility mechanism
The plan tiles are exposed to assistive technology only as static text inside a group; they
are not interactive nodes and are not in the tab order, so a keyboard or switch user cannot
select a plan. Because plan selection is the required interaction that gates Step 1, and the
step holds focus while no plan is chosen, the keyboard user is held inside Step 1 with no way
to satisfy the gate — focus can never progress to Step 2, the "Skip for now" link, or beyond.
The input-gate exception explicitly only covers gates the user can complete; a gate whose
required interaction cannot be performed by keyboard is a trap (TT Test 2.b: "Keyboard access
is restricted to a small section of the page with no way to navigate out").

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. Keyboard access is restricted to Step 1 with no
keyboard-operable way to satisfy the gate and progress, and no documented alternate
keystroke, so both TT "Evaluate Results" conditions fail. (It also implicates 2.1.1 for the
pointer-only tiles, but the trapping of the keyboard user inside the section is the 2.1.2
failure.)

## Why automated tools miss it
The tiles are `<div>`s with non-empty text and an `onclick`; nothing in the static markup
declares them interactive controls (no `role`, no `href`, no form control), so axe-core /
WAVE / Lighthouse fire no name/role/keyboard rule on them. The "Continue" button is
legitimately `disabled`, which scanners accept. The trap is the *combination* of a
pointer-only gating control with a focus-hold — observable only by attempting the keyboard
flow. A human must discover by mouse that the tiles ARE the required control, then confirm no
keyboard route exists to satisfy the gate.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, How to Test
> step 2.b (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard access is restricted to a small section of the page with
> no way to navigate out of the "loop" to the rest of the page."
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction
> before allowing focus to progress to the rest of the page, this is **not** a failure."
> (The carve-out presupposes the interaction is keyboard-completable; here it is not, so the
> page fails.)
