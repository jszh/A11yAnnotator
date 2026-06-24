# case-05 — In-subset, reachable advice names a key the page handles, but the combo is a browser-reserved shortcut (Ctrl+W) the page never receives (FAIL)

## Scenario
A live-interpretation web app ("Live Translation Booth") has a booth panel — a source-channel select, a
glossary lookup, an "Insert timestamp" button, and the live-transcript textarea — that loops focus
internally so an interpreter can stay heads-down without their cursor drifting mid-sentence. A custom exit
**is documented**, and the instruction is **reachable from inside the loop**: it is plain in-flow text the
screen reader reads, naming a single keystroke. The page's own `keydown` handler even genuinely branches on
that keystroke. The defect is environmental accuracy: the documented combo is **Ctrl+W**, which the browser
reserves for "close current tab." The user agent intercepts Ctrl+W before the page handler can run, so the
documented key never moves focus out of the booth (and may close the tab). The advice matches the code on
paper but is **inaccurate in the real runtime environment** — pressing the documented key does not untrap
the user.

## Attribute tuple
- **Content domain:** live interpretation / civic-meeting language access (public-hearing relay)
- **UI component / pattern:** focus-looping multi-field "booth" panel (select + text input + textarea + button)
- **Host-language construct:** `focus`/`blur` re-focus loop; in-flow `<p>` instruction with `<kbd>`; `Ctrl+W` keydown branch that the user agent preempts
- **Locale / i18n:** en-US (EN→ES relay context)
- **Failure mechanism:** advice inaccurate by ENVIRONMENT — documented combo (Ctrl+W) is a reserved user-agent shortcut, so it is never delivered to the page; the exit is undeliverable despite matching the handler

## Developer persona
A developer picked Ctrl+W for "Window/booth — leave the window" as a mnemonic, wired the handler, and added
the reachable in-subset note. They tested in an editor preview / iframe sandbox where Ctrl+W was *not*
captured by the browser chrome, saw focus leave the booth, and called it done. In a normal browser tab,
Ctrl+W closes the tab before the page ever sees the keydown — a clash with a reserved shortcut they never
checked against a real top-level window.

## Element / selector carrying the issue
`#exitNote` (the reachable in-subset instruction "press Ctrl+W") paired with the `#booth` `keydown` handler
that branches on `e.ctrlKey && key === 'w'`. The advice and the handler agree on the *string* Ctrl+W, but
the combo is a reserved user-agent shortcut, so the keystroke is consumed by the browser and the documented
exit is never deliverable to the trapped user.

## Exact accessibility mechanism
Focusing any control in `#booth` sets `trapOn`; each control's `blur` re-focuses the first control on the
next tick, so Tab/Shift+Tab cannot leave the booth. The page registers a `keydown` exit on Ctrl+W. AT /
keyboard experience: the user reads (or hears, since the note is in-flow text) "to move focus back out,
press Ctrl+W," presses Ctrl+W, and the browser closes the tab or does nothing — focus never reaches the
"Leave booth & review" button, because the user agent handles Ctrl+W before the page's listener runs.
There is no other documented or standard exit. The documented exit is therefore **inaccurate in the actual
environment**: it names a keystroke the page cannot receive. G21 is met only when the documented feature is
one that actually moves focus out for the user — here it cannot, because deliverability depends on the
user's user agent, which reserves the combo.

## Expected ACT-style outcome
**failed** (SC 2.1.2 — focus is trapped; the only documented exit is a browser-reserved combo (Ctrl+W) that
the user agent intercepts, so the advised keystroke does not move focus away in practice).

## Why automated tools miss it
Every signal a scanner can read is "clean": the instruction text is present, in-flow, and keyboard-reachable
inside the subset; controls have labels; and the page's handler even branches on the *same* key string the
advice names, so a "does the documented key match the code" check passes. axe-core, WAVE, and Lighthouse do
not press keys, do not run inside a real top-level browsing context to discover that Ctrl+W is swallowed by
the user agent, and cannot reason that a combo matching the page handler is nonetheless undeliverable on this
UA/OS. Per the Understanding doc, whether a keystroke is a usable exit "is dependent on the user's hardware,
user agent, and operating system" — a human auditor must drive the keyboard in a real browser tab to find
that the documented exit never reaches the page.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "this is dependent on the user's hardware, user agent, and operating system,"

**Reference:** WCAG Technique G21 — Ensuring that users are not trapped in content (`wcag-techniques/general/G21.html`)
> "Providing a keyboard function to move the focus out of the subset of the content. Be sure to document the feature in an accessible manner within the subset."

**Reference:** WCAG Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Determine whether the alternate command(s) work."
