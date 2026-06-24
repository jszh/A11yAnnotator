# case-06 — `role="listbox"` where arrows navigate and Tab DOES exit, but instructions wrongly say "Use Tab to move between options" (PASS)

## Scenario
A job-application form ("Northwind Talent — Apply: Backend Engineer"). The "How did you hear about this role?" field is a roving-tabindex `role="listbox"` with `role="option"` items. Arrow keys move between options; Enter selects. Crucially, the keydown handler does NOT touch `Tab` — `Tab` carries focus cleanly OUT of the listbox to the "Submit application" button, and `Shift+Tab` moves back to the Email field. The on-screen help text is *misleading*: it says "Use Tab to move between options, then press Enter to select" — but arrows, not Tab, actually move between options. This page is the boundary variant: a wrong mental model is presented, yet the standard exit (unmodified Tab) still works, so there is NO keyboard trap. It tests whether the judge correctly rules PASS despite the inaccurate advice.

## Attribute tuple
- **content-domain:** job board / applicant tracking system (ATS) application form
- **UI-component / pattern:** APG `listbox` / `option` with roving tabindex (single-select)
- **host-language construct:** `keydown` handler that handles arrows/Home/End/Enter but deliberately omits any `Tab` case (browser default Tab fires)
- **locale / i18n:** en-US
- **failure-mechanism:** none for 2.1.2 — this is a PASS; the only flaw is misleading instruction text ("Use Tab to move between options") that describes the wrong key, which is not a 2.1.2 failure as long as Tab still exits

## Developer persona
A developer built a clean APG listbox (arrows navigate, Tab exits — correct). A separate content author wrote the help microcopy from memory of native `<select>` behavior and assumed "Tab" was how you move through choices, leaving an inaccurate instruction in the UI. The widget itself was never broken; only the prose is wrong.

## Element / selector carrying the issue
`ul#srcList[role="listbox"]` and its help text `p#srcHelp` ("Use Tab to move between options"). The keydown handler's *intentional omission* of a `Tab` case is what makes this a PASS — Tab is left to the browser and exits.

## Exact accessibility mechanism (what AT experiences, why it passes)
- The listbox is valid: `role="listbox"`, `role="option"` items, roving tabindex, accessible name via `aria-labelledby`, `aria-describedby` pointing at the (misleading) help, and `aria-activedescendant`/`aria-selected` updated as options change.
- A keyboard user lands on "Employee referral". `ArrowDown`/`ArrowUp` move between options; `Enter`/`Space` selects. `Home`/`End` jump to ends (no wrap — clamps).
- Pressing `Tab` is NOT intercepted: focus leaves the listbox and lands on the "Submit application" button. `Shift+Tab` from the first option lands back on the Email field. Focus can always leave the widget with an unmodified Tab key.
- The instruction text is wrong (it says Tab moves between options when arrows do), but a misleading mental model is not a keyboard trap. The SC asks whether focus *can* be moved away — and it can, via the standard Tab key, with no advice required because no non-standard exit is involved.
- Verified with Puppeteer: `ArrowDown` moves the active option (`arrowMovesOption: true`); a single `Tab` from an option lands on `#submitBtn` (`tabExitsToAfter: true`); `Shift+Tab` from the first option lands on `#email` (`shiftTabExitsBack: true`).

## Expected ACT-style outcome
**passed** — SC 2.1.2. Focus can be moved away from the listbox using the unmodified `Tab` key (a standard exit method), so there is no keyboard trap. The inaccurate "Use Tab to move between options" advice is a (separate, non-2.1.2) usability/instruction defect, not a trap — Tab still exits, which is all 2.1.2 requires.

## Why automated tools (and naive judges) miss the correct call
axe-core reports zero violations (verified) — as it does for the trapping cases in this aspect, because the listbox markup is identical in shape to them. A tool cannot *conclude PASS* either: it cannot determine that Tab exits without driving the keyboard, and it has no way to weigh the misleading instruction against the actual behavior. The risk here is a judge over-failing: seeing "Use Tab to move between options" plus a composite widget and assuming a trap. The correct ruling requires driving BOTH arrows and Tab, observing that Tab genuinely exits to the Submit button, and reasoning that 2.1.2 is about whether focus *can leave* — not about whether the on-screen advice names the right key. That is precisely the human semantic judgment the aspect targets.

## Citation
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or `Tab` keys or other "standard exit methods"."
— wcag-understanding/no-keyboard-trap.html (Intent — unmodified Tab is a standard exit; it works here, so no trap)

> "Keyboard focus can be moved away from an element using either: a. Standard navigation keys, OR b. Custom keystrokes that are documented and available to users in the application."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (Evaluate Results, 1 — PASS condition 1a is satisfied: Tab, a standard navigation key, moves focus away)

> "If keyboard focus can be moved to a component using a keyboard interface, then focus can be moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow or tab keys or other standard exit methods, the user is advised of the method for moving focus away."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (SC statement — exit here uses unmodified Tab, so the "advised" clause is not even triggered)
