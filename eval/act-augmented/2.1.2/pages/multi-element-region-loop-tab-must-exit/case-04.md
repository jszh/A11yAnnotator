# case-04 — Clinic-finder filters panel loops Tab, walling off the second results section (FAIL)

## Scenario
A healthcare clinic-finder (Northshore Health). The page stacks three sections: a top results list
(2 clinic links), a "Refine results" filters panel (5 focusable controls — Specialty, Distance,
Insurance, Available, Apply filters), and a bottom results list ("More clinics in your area", 3 clinic
links). A keyboard user Tabs through the top results, into the filters, and on the last filter control
("Apply filters") presses Tab expecting the bottom results — but a `keydown` handler returns focus to
the first filter (Specialty). The bottom results section, and any page content after the panel, can
never receive keyboard focus. No advice is given.

## Attribute tuple
- **content-domain:** healthcare provider directory
- **UI-component/pattern:** faceted-search filters panel between two content sections — multi-element region
- **host-language construct:** native `<select>`/`<input>`/`<button>` with `<label>`s + JS Tab interception
- **locale/i18n:** en-US (miles, US insurers)
- **failure-mechanism:** G21 mechanism #1 violated — Tab from the panel's final control loops to its first; downstream content unreachable, no advice

## Developer persona
A developer followed a "search UX" blog tip to "keep users on the filter form until they apply" and
implemented it by trapping Tab on the Apply button back to the first field. They reasoned it would
"reduce abandoned searches." They verified by mouse-clicking Apply and never tabbed past it to notice
the bottom results had become keyboard-unreachable.

## Element / selector carrying the issue
`#applyBtn` (the "Apply filters" button — the panel's last control). Its `keydown` listener intercepts
forward Tab, calls `e.preventDefault()`, then `first.focus()` on `#firstFilter` (Specialty select).

## Exact accessibility mechanism
A keyboard or switch user moving forward with Tab reaches "Apply filters." The natural next stop is
`#afterLink` (Harbourview Women's Health) in the bottom results section. The handler cancels that and
sends focus to the Specialty select, so focus cycles within the five filter controls forever. The
entire "More clinics in your area" section — three clinic links — is unreachable by keyboard. This is
the Trusted Tester loop failure: access restricted to a small section with no way out. Plain Tab is
the key in play, so no advice is owed; G21 mechanism #1 requires the final Tab to exit the subset and
it does not. SC 2.1.2 fails. (Note: this is NOT the "requires input before progressing" exception —
the panel never blocks; it actively reroutes focus backward.)

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. The judge must Tab to the panel's LAST control and observe
the next Tab loops to the first filter rather than crossing into the second results section, and must
confirm the bottom clinic links are unreachable by keyboard.

## Why automated tools miss it
Every filter control is properly labelled, the group is named, the markup validates — axe/WAVE/
Lighthouse find no labelling or structural fault. The trap is purely a runtime `keydown` (Tab)
behaviour on the Apply button; scanners never press Tab nor track focus traversal, so the
walled-off bottom results are invisible to them. Distinguishing this from a legitimate
"complete this step first" gate also requires human judgment that focus is being rerouted, not
held pending required input.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, "How to Test"
> (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard access is restricted to a small section of the page with no way to
> navigate out of the \"loop\" to the rest of the page."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, "How to Test" (Note on the
> input-required exception) (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "If a section of a page requires input or interaction before allowing focus
> to progress to the rest of the page, this is not a failure."
