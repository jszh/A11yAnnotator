# case-03 — `role="tablist"` with `onblur` self-refocus, so Tab can never leave the tabs

## Scenario
A SaaS analytics dashboard ("Pulsegrid"). A valid APG `role="tablist"` (MRR / Churn / Cohorts / Forecast) with `aria-selected`, `aria-controls`, roving tabindex, and arrow-key navigation between tabs. The trap is not in the keydown handler — arrows work fine and Tab is not preventDefault'd. Instead, each tab has a `blur` listener: when the active tab is about to lose focus it refocuses itself on the next tick (`setTimeout(() => tab.focus(), 0)`). So when the user presses `Tab` to leave the tablist toward the panel's "Open MRR breakdown" link or the "Export current view" button, focus snaps straight back to the active tab. This is a composite-widget version of the corpus's self-refocus trap (the F55-adjacent "focus bounces back" pattern), distinct from a within-widget arrow loop.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component / pattern:** APG `tablist` / `tab` / `tabpanel` with roving tabindex
- **host-language construct:** `blur` event listener that calls `setTimeout(() => activeTab.focus())`
- **locale / i18n:** en-US
- **failure-mechanism:** self-refocus — the active element grabs focus back whenever it is about to lose it, so no key (Tab, Shift+Tab, or even a click moving focus) can move focus out of the widget

## Developer persona
A dashboard developer wanted the selected tab to "always look active" and noticed the highlight dimmed when focus moved to the panel. They wired `tab.addEventListener('blur', () => setTimeout(() => tab.focus()))` to "keep the current view selected and highlighted." They tested only with the mouse (click a tab, see it stay highlighted) and never tabbed forward off the tablist, so they never saw that keyboard focus can no longer escape.

## Element / selector carrying the issue
`button[role="tab"]` elements (e.g. `#tab-mrr`) — specifically the `blur` listener that refocuses the active tab via `setTimeout`. The arrow-key handler and the absence of any `Tab` preventDefault are correct; the trap is the refocus.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The tablist is valid: arrows move between tabs, `aria-selected`/`aria-controls` update, panels show/hide, roving tabindex is correct.
- A keyboard user on the "MRR" tab presses `Tab` to reach the panel link or the Export button. The tab fires `blur`; the listener schedules `tab.focus()`; on the next tick focus is yanked back to "MRR". The user is pinned to the tablist.
- `Shift+Tab` behaves the same way — focus bounces back to the active tab. There is no `Esc` exit and no documented alternate.
- A screen-reader user navigating control-by-control cannot advance past the tablist; the virtual cursor / DOM focus is repeatedly reset.
- Verified with Puppeteer (with a settle delay to let `setTimeout` fire): after focusing `#tab-mrr`, 6 consecutive `Tab` presses always end back on `#tab-mrr` and never reach the panel link or `#exportBtn` (`tabExitsToAfter: false`).

## Expected ACT-style outcome
**failed** — SC 2.1.2. Focus can enter the tablist but is forcibly returned to it on every blur, so it can never be moved away by keyboard, and no exit method is advised.

## Why automated tools miss it
axe-core reports zero violations (verified). Nothing in the static DOM is wrong — the tablist is exactly the recommended ARIA pattern, and crucially the page does NOT preventDefault Tab (so even a tool that somehow looked for that pattern would find nothing). The trap is an asynchronous focus-management side effect: a `blur` handler that re-grabs focus a tick later. Detecting it requires moving focus off the active tab and then observing, after the event loop turns, that `document.activeElement` has been reset back to the tab. No static analyzer models blur listeners or `setTimeout` focus calls, and the failure is invisible to mouse-only testing. It takes a human tabbing forward and watching focus snap back to recognize the loop and conclude there is no keyboard exit.

## Citation
> "If keyboard focus can be moved to a component using a keyboard interface, then focus can be moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow or tab keys or other standard exit methods, the user is advised of the method for moving focus away."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (WCAG SC 2.1.2 statement)

> "Keyboard users are unable to move away from an element (e.g., using TAB or an arrow key)."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (How to Test, 2a — the trap condition met here)

> "The intent of this success criterion is to ensure that content does not "trap" keyboard focus within subsections of content on a web page. This is a common problem ... when custom components and widgets are not implemented with keyboard users in mind."
— wcag-understanding/no-keyboard-trap.html (Intent)
