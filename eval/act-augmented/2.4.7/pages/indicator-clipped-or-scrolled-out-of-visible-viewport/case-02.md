# case-02 — "Go to first error" focuses a field below the fold with `focus({ preventScroll: true })`, so the ring is painted off-screen and the page never scrolls to it (FAIL)

## Scenario
The City of Brookhaven's online "Residential Building Permit" form re-renders
after a failed submit with a validation summary at the top. The summary's
**"Go to first error"** button — a genuine control in the tab order — is meant to
send keyboard focus to the first invalid field so the user lands where they must
type. The first invalid field (`#email`, a native `<input type="email">`) sits
near the bottom of a long, multi-section form, ~1800px down. The handler calls
`firstInvalid.focus({ preventScroll: true })`. Because of `preventScroll: true`,
the browser moves focus to `#email` but **keeps the current scroll position at the
top of the form** instead of scrolling the field into view. `#email` has a
correct, high-contrast 3px focus ring — but that ring is painted entirely below
the fold, outside the visible viewport, and the page does not move. The keyboard
user pressed the button, focus moved, yet no focus indicator appears anywhere on
screen.

## Attribute tuple
- **Content domain:** government / civic services (municipal building-permit application)
- **UI component / pattern:** server-rendered form validation summary with a "go to first error" affordance
- **Host-language construct:** native `<input type="email">` (sequential-focus-order control) + JS `HTMLElement.focus({ preventScroll: true })`
- **Locale / i18n:** en-US
- **Failure mechanism:** focus moved to a genuine sequential-focus-order element that lies below the fold, with the browser's scroll-into-view deliberately suppressed (`preventScroll: true`); the indicator is painted outside the visible viewport and the page never scrolls to reveal it

## Developer persona
A civic-tech developer wired the validation summary to focus the first invalid
field. An earlier build let `focus()` scroll the field into view, and a reviewer
(mis)reported the resulting scroll jump as "disorienting", so the dev added
`{ preventScroll: true }` to suppress the jump. They tested with a mouse — clicking
"Go to first error" and seeing the page sit still felt calm — and never verified
with the keyboard that, on a long form, the focused field (and its ring) was now
parked far below the fold with nothing scrolling to bring it into view.

## Element / selector carrying the issue
The `#email` field's `:focus-visible` ring after the `#gotoError` button is
activated. The defect is the handler's `firstInvalid.focus({ preventScroll: true })`.
Verified in Chromium (1000×760 viewport): at rest `#email` sits at viewport
`top ≈ 1826` (document height ≈ 2293, `belowFoldAtRest: true`). After activating
"Go to first error", `document.activeElement` is `#email` (`INPUT`, `tabIndex 0`,
genuinely in the tab order), `window.scrollY` stays `0`, and the field's rect is
still at `top ≈ 1826` — entirely below the 760px fold (`ringVisibleInViewport:
false`, `belowFold: true`). A control run focusing the same field WITHOUT
`preventScroll` scrolls the page (`scrollY ≈ 1471`) and lands the field at
`top ≈ 355` with the 3px ring fully visible — proving the ring is real and the
only defect is the suppressed scroll.

## Exact accessibility mechanism
Activating "Go to first error" moves keyboard focus to `#email`, a native input
that is part of sequential focus navigation. The browser paints the author's 3px
high-contrast ring on it. But `focus({ preventScroll: true })` instructs the
browser not to scroll the newly focused element into view, and the element is far
below the fold, so the ring is rendered entirely outside the visible viewport
while the page stays put. A sighted keyboard user who pressed the button sees the
page not move and no focus cue anywhere; they have no way to tell that focus has
silently jumped to an off-screen field. The fix is to drop `preventScroll: true`
(let the browser scroll the field into view) or to scroll the field into the
viewport explicitly after focusing it.

## Expected ACT-style outcome
**failed** (SC 2.4.7 — a focus indicator is drawn on an element in the sequential
focus order, but the element is scrolled out of the visible viewport with its
scroll-into-view suppressed, so the indicator is not actually visible to the user).

## Why automated tools miss it
Every control has a valid, high-contrast 3px `:focus-visible` ring, so axe, WAVE,
and Lighthouse see conformant focus CSS and flag nothing. ACT rule oj04fd is also
satisfied: focusing `#email` changes pixels (the ring is painted) within the
document's scrolling area. The failure is runtime and positional — it exists only
because `focus({ preventScroll: true })` leaves the focused field below the fold
with no scroll to reveal it. `preventScroll` is invisible to a focus-style linter
(it is a focus-options flag in JS, not a CSS focus property), and judging that the
ring is painted outside the *visible* viewport requires running the keyboard
journey and comparing the focused element's rectangle to the visual viewport —
a viewport-aware human (or visual) check, not a static markup scan.

## Citation
**Reference:** ACT Rule oj04fd — Background (`act-rules/extracted/oj04fd.md`)
> "Thus it is possible to pass this rule and Success Criterion 2.4.7 Focus Visible with barely perceptible changes at the other end of the page. That would however still be an accessibility issue."

**Reference:** Trusted Tester v5.1.3 — SC 2.4.7 Focus Visible, Test 4.D Test Condition (`refs/trusted-tester/sc-2.4.7-focus-visible.md`)
> "A visible indication of focus is provided when focus is on the interface component."
