# case-06 — Wrappable code with a working "Wrap lines" toggle (PASS via mechanism)

## Scenario
A webhooks API reference page shows a long `docker run` command and a long single-line JSON payload,
both wrappable (a soft-wrap loses no meaning for a shell command or a JSON object). By default the
blocks are preformatted (`white-space:pre`, convenient for copying), but each code card provides a
real, keyboard-operable "Wrap lines" toggle (`<button aria-pressed>`) that switches the `<pre>` to
`white-space: pre-wrap`. When wrapped, every command and payload fits within 320 CSS px and reads in a
single column with vertical scrolling only. This is the conforming counterpart to case-05.

## Attribute tuple
- **Content domain:** developer docs / webhooks API reference
- **UI component / pattern:** code card with a keyboard-operable "Wrap lines" toggle (`button[aria-pressed]`)
- **Host-language construct:** `<pre>` toggled `white-space:pre` <-> `pre-wrap` via a real JS button
- **Locale / i18n:** en
- **Failure mechanism:** NONE — wrappable code with a provided wrap mechanism (G224 check 4 / G206)

## Developer persona
An API docs author who understands the distinction case-05's author missed: shell/JSON are wrappable,
so they offer a wrap mechanism rather than assuming "code is exempt." They wire a proper `aria-pressed`
toggle button (focusable, has a focus-visible outline) that flips the block to `pre-wrap`, satisfying
the G224 "a mechanism is provided to allow line wrapping" check and the G206 "option to switch to a
layout that does not require horizontal scrolling."

## Element / selector carrying the issue
`.codecard .wrapbtn` (the toggle) acting on its sibling `.codecard pre`. The mechanism is the point.

## Exact accessibility mechanism
By default the `<pre>` overflows 320px (same starting state as case-05). But the page provides a
keyboard-reachable `Wrap lines` button with correct `aria-pressed` state; activating it adds
`white-space:pre-wrap; overflow-wrap:anywhere` so the long command/JSON wraps and the whole block fits a
320 CSS px column, requiring only vertical scrolling. Because the content is wrappable AND a working
wrap mechanism is provided, the page conforms even though the default view scrolls horizontally. PASS.

## Expected ACT-style outcome
**passed** (SC 1.4.10) via technique G224 (wrappable-code mechanism) / G206 (option to switch layout).
The wrappable code offers a functioning, keyboard-operable wrap toggle that yields a 320px single
column.

## Why automated tools miss it
A tool sees a `<pre>` overflowing 320px by default (identical to case-05's failing default) plus a
generic `<button>`. It cannot determine that the button toggles wrapping, that wrapping is an ADEQUATE
remedy for THIS content (because the content is wrappable code, not Python), or that the toggle is the
G224/G206 mechanism. That chain — content is wrappable, control wraps it, wrapping suffices — is human
reasoning over both meaning and behavior.

## Citation
**Reference:** WCAG Technique G224 (`wcag-techniques/general/G224.html`)
> "Or, for code where non-wrapping lines are not essential, the code wraps or a mechanism is provided to allow line wrapping."

**Reference:** WCAG Technique G206 — title (from the 1.4.10 inventory `eval/act-augmented/_resources/1.4.10.json`)
> "Providing options within the content to switch to a layout that does not require the user to scroll horizontally to read a line of text"
