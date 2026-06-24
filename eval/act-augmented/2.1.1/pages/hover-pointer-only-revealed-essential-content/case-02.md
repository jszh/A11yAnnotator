# case-02 — Admin table: row Edit/Delete buttons `visibility:hidden` until `tr:hover` (FAIL)

## Scenario
"Mailroom" email-marketing admin. The Subscribers table lists contacts; the only controls to
edit or delete a row are per-row `<button>Edit</button>` / `<button>Delete</button>` pairs
wrapped in `span.row-actions`. That span is `visibility:hidden` and becomes visible only under
`tbody tr:hover`. There is no `tr:focus-within` and no keyboard reveal. Because
`visibility:hidden` elements are not focusable, Tab skips the buttons entirely — a keyboard
user can reach search and "Add subscriber" but can never edit or delete any existing
subscriber. The footer's bulk-action checkbox column is "coming soon" (absent), so the
function exists nowhere else.

## Attribute tuple
- **content-domain:** SaaS admin dashboard / CRM
- **UI-component/pattern:** data-table with hover-revealed per-row action affordances
- **host-language construct:** `<table>` with `td.actions span.row-actions` toggled by `tr:hover`
- **locale/i18n:** en-US
- **failure-mechanism:** `visibility:hidden` (un-focusable) controls revealed only on row `:hover`; no `:focus-within`; only access to edit/delete

## Developer persona
A mid-level React developer copied the "show actions on row hover" pattern used by GitHub,
Linear, and Notion to keep the table visually clean. They styled `span.row-actions { visibility:
hidden }` with a `tr:hover` reveal, which looks polished in demos. They never added the
keyboard equivalent (a `:focus-within` reveal or always-visible actions), and the design QA was
all mouse-driven. The buttons have proper labels, so the lint/axe gate in CI passed.

## Element / selector carrying the issue
`td.actions .row-actions` — `visibility:hidden` except under `tbody tr:hover`. The affected
controls are the Edit and Delete `<button>` elements within it (the sole edit/delete path).

## Exact accessibility mechanism
A keyboard-only operator Tabs: search field → "Add subscriber" → (table) → footer links. The
Edit/Delete buttons are inside a `visibility:hidden` container; per CSS, `visibility:hidden`
removes elements from the tab order, so Tab never lands on them. There is no `tr:focus-within`
rule, so focus entering a row would not reveal the actions even if a cell were focusable. A
keyboard user therefore can never edit or delete a contact. The only other affordance hinted
at — a bulk-action checkbox column — is "coming soon" and not in the DOM, so the function is
not available elsewhere on the page. SC 2.1.1 "all functionality can be accessed and executed
using only the keyboard" fails. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (Level A), operable-functionality limb. The only controls to
operate row data are pointer-hover-revealed and not keyboard-reachable.

## Why automated tools miss it
Every Edit/Delete is a real `<button>` with a clear accessible name inside a semantic
`<table>` with `<th scope>`. Nothing is missing, empty, or malformed, so axe-core, WAVE and
Lighthouse report no error. The defect is purely a runtime/visual-state fact: the actions are
`visibility:hidden` (hence un-focusable and out of the tab order) until a pointer hover that a
keyboard user cannot perform. Tools do not simulate hover/focus state transitions to discover
that the buttons never become focusable, and cannot judge that edit/delete are ESSENTIAL
operations with no keyboard-reachable equivalent on the page. Human keyboard operation plus
essential-function reasoning is required.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.1 Keyboard — Intent
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "Most actions carried out by a pointing device can also be done from
> the keyboard (for example, clicking, selecting, moving, sizing)."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *How to Test*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "If an element has no keyboard access, determine whether another
> keyboard-accessible method on the page provides the same functionality (e.g., one of two
> print methods is keyboard accessible)."
