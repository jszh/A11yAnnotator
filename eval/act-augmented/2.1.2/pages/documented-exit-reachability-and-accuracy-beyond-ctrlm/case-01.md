# case-01 — Working Ctrl+M exit whose only instruction is in a collapsed `<details>` placed AFTER the trap (FAIL)

## Scenario
A county "Resident Property Tax Estimator" has a *Millage Worksheet* — a small calculator panel whose
fields loop focus internally (a deliberate "keep your cursor here while you adjust figures" behaviour).
The worksheet genuinely supports a custom keyboard exit: **Ctrl+M** releases the loop and moves focus to
the "File an assessment appeal" link. But the only place that keystroke is documented is a collapsed
`<details>` titled "Keyboard & accessibility tips", positioned at the very bottom of the page — in DOM and
visual order **after** the trapping worksheet. A keyboard user who tabs into the worksheet is looped back
to the first field before they can ever reach, focus, or open that disclosure. The exit exists; its
documentation is unreachable from inside the trap.

## Attribute tuple
- **Content domain:** government / civic services portal (property-tax estimator)
- **UI component / pattern:** disclosure (`<details>`/`<summary>`) holding help, + a focus-looping form panel
- **Host-language construct:** native `<details>`; `focus`/`blur` re-focus loop; `document`-level Ctrl+M keydown
- **Locale / i18n:** en-US, USD currency, US assessment terminology (millage, homestead exemption)
- **Failure mechanism:** advice present but REACHABLE only after the trap — collapsed disclosure downstream of the loop

## Developer persona
A county IT contractor was told to "add the keyboard exit instructions somewhere on the page" after an
audit comment. They dropped the note into the existing "Keyboard & accessibility tips" `<details>` that
already sat in the page footer, satisfied the literal request ("the instruction is on the page"), and
moved on. They never tabbed through the worksheet themselves, so they never noticed the loop strands a
keyboard user upstream of the disclosure they just edited.

## Element / selector carrying the issue
`details#kbd-help` (the collapsed disclosure containing "press Ctrl+M"), in combination with
`section#worksheet` (the trapping region that precedes it). The advice node is reachable in source order
only *after* the trap engages.

## Exact accessibility mechanism
Once any field in `#worksheet` receives focus, its `blur` handler re-focuses the first field on the next
tick, so Tab/Shift+Tab cannot leave the worksheet. The working escape is a `document` keydown for Ctrl+M.
A sighted mouse user can scroll down, expand `#kbd-help`, and read the instruction; a keyboard user who
has entered the worksheet is looped and can never advance focus to the `<summary>` to open it. Verified by
driving the keyboard: Tab from `#assessed` returns focus to `#assessed` (trapped), and Ctrl+M moves focus
to the appeals link (exit works). The exit is therefore real but **undocumented in any place the trapped
user can reach** — failing G21's requirement that the feature be documented "in an accessible manner within
the subset."

## Expected ACT-style outcome
**failed** (SC 2.1.2 — focus is trapped and the only advice on the custom exit is not reachable by the
trapped keyboard user).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse see a clean page: the escape keystroke is present as plain text, the
`<details>` has a proper `<summary>`, every field has a `<label>`, and the Ctrl+M handler works. They do
not exercise Tab to discover the focus loop, and they cannot reason about *when* the advice becomes
reachable relative to the trap — i.e., that a collapsed disclosure placed after the loop is unreachable
from inside it. Detecting this requires a human to drive the keyboard and judge advice reachability.

## Citation
**Reference:** WCAG Technique G21 — Ensuring that users are not trapped in content (`wcag-techniques/general/G21.html`)
> "Providing a keyboard function to move the focus out of the subset of the content. Be sure to document the feature in an accessible manner within the subset."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "If untrapping focus requires a different method (rather than unmodified arrow keys, the <kbd>Tab</kbd> key, or other \"standard exit methods\"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."
