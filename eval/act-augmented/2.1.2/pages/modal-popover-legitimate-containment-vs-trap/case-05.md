# case-05 — Newsletter popover: refocus-on-blur trap + "Press Esc to dismiss" with no Esc listener (FAIL)

## Scenario
"The Ardent Review" long-form magazine shows a subscribe gate built with the HTML
`popover` attribute. After load it pops open and moves focus to the email field. A
`focusin` guard snaps focus back to the first field whenever it tries to leave the popover
(a hand-built trap layered on top of the popover). The popover displays the human-readable
instruction "Not now? Press **Esc** to dismiss." — but **no Esc listener is wired
anywhere**, and because the author used `popover="manual"` (which disables the browser's
light-dismiss *and* its native Esc-to-close), the documented exit is false. Esc does
nothing; Tab/Shift+Tab is yanked back. The instruction makes the page *appear* to satisfy
the "advise the user how to untrap" clause while the advised method does not exist.

## Attribute tuple
- **content-domain:** news / long-form editorial (magazine subscribe gate)
- **UI-component/pattern:** HTML `popover` attribute element acting as a modal newsletter capture
- **host-language construct:** `popover="manual"` + `showPopover()` + `focusin` refocus-on-blur guard; serif/Helvetica typography
- **locale/i18n:** en-US
- **failure-mechanism:** documented exit is FALSE — "Press Esc to dismiss" text present but no Esc handler, and native light-dismiss/Esc disabled by `popover="manual"`; refocus-on-blur re-traps

## Developer persona
A designer prototyped this in a Webflow-style interaction and a developer reimplemented it
with the modern `popover` API. To stop the popover from closing when a reader clicked the
backdrop "before they'd really decided," they switched it from `popover="auto"` to
`popover="manual"` — not realising that also turns off the built-in Esc dismissal. They
copied a `focusin`-refocus snippet from an old "trap focus in a modal" answer to keep
attention on the field, and pasted in the friendly "Press Esc to dismiss" line from a
content template. They never wired the matching `keydown` handler, and tested only by
clicking Subscribe.

## Element / selector carrying the issue
`#subpop` (`popover="manual"`). The trap is the document `focusin` guard that calls
`document.getElementById('subemail').focus()` whenever focus leaves the popover. The false
advice is the `.dismiss-hint` text ("Press Esc to dismiss") with no corresponding
`keydown`/`Escape` listener; `popover="manual"` also disables the UA's own Esc-close.

## Exact accessibility mechanism
On load the popover opens and focus lands in the email field. A keyboard user reads "Press
Esc to dismiss" and presses **Esc** — nothing happens (no listener, and manual popovers do
not auto-close on Esc). They Tab: email → Subscribe → (focus tries to leave) → the
`focusin` guard fires and snaps focus back to email. Shift+Tab is caught the same way.
There is no Close control. So the only documented exit is a lie and every keyboard route
out is re-trapped — the user is stranded on the subscribe gate, unable to reach the article
behind it. The Intent allows a non-standard exit *provided the user is advised how to
untrap*; here the user IS advised, but the advised method (Esc) is non-functional, so the
advice does not rescue the page. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment-vs-trap limb.
Focus is restricted to a popover with no working keyboard exit; the on-screen exit
instruction names a method (Esc) that is not actually wired, so the user is not genuinely
advised of a *working* method.

## Why automated tools miss it
The page presents a real `popover` element with `role="dialog"`, a labelled email input,
an accessibly-named Subscribe button, and a clear, human-readable "Press Esc to dismiss"
instruction — to a static scanner this looks not just valid but *exemplary*, since it even
appears to satisfy the "advise the user of the exit method" clause. axe/WAVE/Lighthouse
cannot tell that the named exit method has no handler, that `popover="manual"` disabled the
native one, or that a `focusin` guard re-traps focus, because all of that is runtime
behaviour they never exercise. Catching it requires a human to *read the instruction, press
the named key, observe nothing happens, then Tab and watch focus snap back* — and to
reason that present-but-false exit advice is worse than none.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.2 No Keyboard Trap — "Intent"
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "If untrapping focus requires a different method (rather than
> unmodified arrow keys, the Tab key, or other "standard exit methods"), content can still
> pass this criterion provided that the user is advised how they can untrap focus using
> their keyboard interface."
>
> **Quote (verbatim, In brief — What to do):** "Ensure users always know how to navigate
> away from components."
