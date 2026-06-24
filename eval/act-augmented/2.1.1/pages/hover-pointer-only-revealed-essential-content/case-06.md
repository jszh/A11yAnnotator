# case-06 — Kanban card overflow "…" menu hidden by `opacity:0`, revealed on hover AND focus (PASS, modality-equivalent)

## Scenario
"Tasklane" sprint board. Each card's overflow "…" button is the only way to move, assign, or
archive a card (essential functionality). It is visually hidden by default (`opacity:0`) to
keep the board clean — superficially like case-02's hidden row actions. But it is hidden with
`opacity:0` (which keeps the `<button>` focusable and in the tab order, unlike
`visibility:hidden`), and the CSS reveals it on BOTH `.card:hover .more` AND `.card .more:focus`
/ `.card:focus-within .more`. A keyboard user Tabs to the button (it appears on focus), presses
Enter, gets the identical `role="menu"` the mouse user gets, and Esc closes it and restores
focus. Hover and focus reveal the same control — modality-equivalent — so it PASSES.

## Attribute tuple
- **content-domain:** project management / developer tooling (Kanban)
- **UI-component/pattern:** card overflow menu (APG menu button) revealed on hover/focus
- **host-language construct:** `<button class="more" aria-haspopup="menu">` hidden by `opacity:0`, revealed by `:hover`, `:focus`, and `:focus-within`
- **locale/i18n:** en-US
- **failure-mechanism (averted):** hide-on-default control, BUT focusable (`opacity`, not `visibility:hidden`) and revealed on focus equivalently to hover → keyboard-operable

## Developer persona
A product engineer who had previously shipped the broken `visibility:hidden` row-actions
pattern (case-02 style) learned from an accessibility review and rebuilt the reveal correctly:
switched to `opacity:0` so the control stays in the tab order, added the matching `:focus` /
`:focus-within` selectors, wired Enter/Space activation and Esc-to-close with focus return, and
added `aria-haspopup`/`aria-expanded`/`role="menu"`. This is the "right way" counterpart and the
direct contrast to case-02 — same visual design, opposite keyboard outcome.

## Element / selector carrying the issue (here: why it does NOT fail)
`.card .more` — the overflow button, `opacity:0` by default, revealed by `.card:hover .more`,
`.card .more:focus`, and `.card:focus-within .more`. It opens `.menu[role="menu"]` containing
the only Move/Assign/Archive controls.

## Exact accessibility mechanism
A keyboard user Tabs through cards; focus lands on each "…" button because `opacity:0` (unlike
`visibility:hidden` or `display:none`) does NOT remove an element from the tab order. The
`.card .more:focus` rule sets `opacity:1`, so the control becomes visible exactly when focused.
Pressing Enter/Space opens the menu, focus moves to the first `role="menuitem"`, and the
Move/Assign/Archive actions are operable; Escape closes the menu and returns focus to the
trigger. The content revealed by keyboard focus is identical to the content revealed by mouse
hover. SC 2.1.1 "all functionality can be accessed and executed using only the keyboard" is
met. Verdict: **PASSED**.

## Expected ACT-style outcome
**passed** — SC 2.1.1 Keyboard (Level A). The essential card actions are revealed and operable
by keyboard focus, equivalently to mouse hover; the visual hiding (`opacity:0`) does not affect
focusability.

## Why automated tools miss it
This is the boundary that defeats static analysis from the other direction: an automated tool
sees a focusable, named `<button>` with `aria-haspopup="menu"` and a `role="menu"` here — and
it would see the SAME shapes in case-02 (also real `<button>`s with names). A scanner cannot
distinguish `visibility:hidden` (removes from tab order → fails) from `opacity:0 + :focus
reveal` (stays focusable → passes), and cannot confirm that the keyboard reveal produces the
same control as hover. The pass/fail turns on a CSS-mechanics + interaction judgment a human
must make by operating both modalities — exactly the "does focus reveal the same content as
hover?" question.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.1 Keyboard — Intent (second Note)
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "The normative requirement is only that there must be a way for
> keyboard interface users to perform the same, or comparable, actions and to operate the
> content."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *How to Test*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "Use the keyboard to operate identified functionality and/or access
> the essential information: tab to the element and execute (e.g., press Enter with focus on
> the element)."
