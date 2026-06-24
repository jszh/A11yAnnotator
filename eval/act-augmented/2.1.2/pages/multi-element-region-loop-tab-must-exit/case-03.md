# case-03 — Editor toolbar: first button's Shift+Tab wraps to last, walling off the header (FAIL)

## Scenario
A knowledge-base note composer (Lattice KB). The page has a header nav (Spaces, Search, Templates,
Profile), a six-button formatting toolbar (Bold, Italic, Bulleted list, Insert link, Code block,
Insert table), a contenteditable body, and a footer with "Save draft" / "Publish". The forward
direction is fine — Tab from the last toolbar button reaches the editor and onward. The defect is in
the REVERSE direction: pressing Shift+Tab on the FIRST toolbar button (Bold) is intercepted and focus
is sent to the LAST toolbar button (Insert table). A keyboard user inside the toolbar can therefore
never navigate backward to the header navigation — the content BEFORE the region is walled off. No
advice is given.

## Attribute tuple
- **content-domain:** SaaS knowledge base / document editor
- **UI-component/pattern:** rich-text editor toolbar (APG toolbar) — multi-element region
- **host-language construct:** `role="toolbar"` + aria-labelled `<button>`s + JS Shift+Tab interception
- **locale/i18n:** en-US
- **failure-mechanism:** G21 mechanism #1 violated in REVERSE — Shift+Tab does not exit the subset toward content before it; reverse internal loop, no advice

## Developer persona
A frontend dev read about the ARIA Authoring Practices "roving tabindex" toolbar pattern but
misremembered which keys it governs. Intending to "keep arrow/tab navigation inside the toolbar like
the APG demo," they bound Tab/Shift+Tab (instead of arrow keys) to wrap within the toolbar. Forward
testing looked fine, so the reverse wall went unnoticed.

## Element / selector carrying the issue
`#tbFirst` (the Bold button). Its `keydown` listener intercepts backward Tab
(`e.key === 'Tab' && e.shiftKey`), calls `e.preventDefault()`, then `last.focus()` (Insert table).

## Exact accessibility mechanism
G21 mechanism #1 must hold in BOTH directions: the keyboard function for moving focus must exit the
subset after the final navigation location, and equally the user must be able to leave the region the
way they came. A keyboard user who has tabbed into the toolbar and wants to step back to the header
presses Shift+Tab on the first button; the handler cancels it and moves focus to the last button,
so backward focus cycles within the six toolbar buttons indefinitely. The header nav (Spaces, Search,
Templates, Profile) is unreachable once focus is in the toolbar. Keyboard access is "restricted to a
small section of the page with no way to navigate out of the loop." Plain Shift+Tab is the standard
exit method, so no advice is owed; the region simply must let the backward Tab cross its boundary, and
it does not. SC 2.1.2 fails.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. Detecting it requires Tabbing/Shift-Tabbing to the region's
FIRST control and observing that the backward Tab wraps to the last control instead of crossing into
the header. A judge who only checks forward Tab would wrongly pass this; the reverse direction must be
tested.

## Why automated tools miss it
axe-core, WAVE and Lighthouse see a valid `role="toolbar"` with six aria-labelled buttons and a
labelled textbox — no empty names, no role errors. The reverse loop is a runtime `keydown`
(Shift+Tab) behaviour that only manifests when a real Shift+Tab lands on the first button. Scanners
never press Shift+Tab nor simulate backward traversal, so the walled-off header is invisible to them.

## Citation
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "The objective of this technique is to ensure that keyboard users do not
> become trapped in a subset of the content that can only be exited using a mouse or pointing
> device."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, "Evaluate Results"
> (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard focus can be moved away from each section of the page containing
> elements (not trapped in a \"loop\" preventing access to other elements) using either standard
> navigation keys OR documented custom keystrokes."
