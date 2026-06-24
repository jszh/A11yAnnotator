# case-06 — Live-commentary sidebar loops Tab BUT documents a working Ctrl+M exit (PASS, mechanism #2)

## Scenario
A football live-match centre (Riverside FC). A live-commentary sidebar widget holds five controls
(Auto-refresh, Show key events only, Pin player, Mute goal alerts, Text size). The panel deliberately
keeps keyboard focus while updates stream — plain Tab cycles within the five controls and will not
leave the panel — which by itself would be a within-region loop. However, a visible instruction inside
the panel reads "Press Ctrl+M at any time to skip past the panel and continue down the page," and the
Ctrl+M handler genuinely moves focus to the footer. Because the documented custom keystroke works,
this PASSES SC 2.1.2 via G21 mechanism #2. It is the deliberate advice-clause contrast to the
no-advice failing loops (cases 01 and 04).

## Attribute tuple
- **content-domain:** sports / live football coverage
- **UI-component/pattern:** live-updating sidebar widget (region that intentionally holds focus) — multi-element region
- **host-language construct:** `<button>` controls with looping Tab + a documented `Ctrl+M` escape handler
- **locale/i18n:** en-GB (football, "fixtures", "league table")
- **failure-mechanism:** none — the loop is present but G21 mechanism #2 (documented custom keystroke) is satisfied; PASS

## Developer persona
A sports-site developer modelled the live panel on the WCAG "puzzle applet" example: the widget keeps
focus while live data streams, and they added a documented Ctrl+M shortcut — shown right in the panel —
to let keyboard users escape. They tested that Ctrl+M moves focus to the footer and that the
instruction text matches the actual key.

## Element / selector carrying the issue
The panel `#livePanel`. Tab loops via `#lvLast` (forward → `#lvFirst`) and `#lvFirst` (Shift+Tab →
`#lvLast`). The escape is the panel-level Ctrl+M handler that calls `footer.focus()` on `#footerFirst`,
and the visible advice is `#skipHint` ("Press Ctrl+M ... to skip past the panel").

## Exact accessibility mechanism
SC 2.1.2 allows focus to be moved away using a custom keystroke "provided that the user is advised how
they can untrap focus." Here plain Tab does NOT exit (the loop is real), so mechanism #1 is not met —
but the panel provides a documented, working alternate method: the visible Ctrl+M instruction
(`#skipHint`) names the exact key, and the Ctrl+M handler moves focus out of the panel to the footer.
A keyboard user reads the advice, presses Ctrl+M, and lands on the footer "Full match report" link,
continuing down the page. Focus can therefore be moved away from the section using a documented,
available custom keystroke, so the page passes. This validates that the judge applies the advice clause
correctly rather than failing every internal loop on sight.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap (via G21 mechanism #2). The judge must (a) observe the loop,
(b) read the visible advice, and (c) verify the Ctrl+M handler actually moves focus out — and then
recognise that an advised, working escape satisfies 2.1.2 even though plain Tab does not exit. This
contrasts directly with cases 01/04 where an identical loop has NO advice and therefore fails.

## Why automated tools miss it
This page is hard for tools in both directions: a tool that did simulate Tab would observe the loop
and might flag a trap — wrongly, because the documented Ctrl+M escape makes it conformant. Conversely,
a static scanner sees only well-formed buttons and instruction text. Deciding the verdict requires
reading the human-language advice, confirming it names a real, working key, and exercising that key —
none of which axe/WAVE/Lighthouse perform. Whether advice "matches" and "works" is a semantic +
interaction judgment.

## Citation
> **Reference:** WCAG Understanding — No Keyboard Trap, Intent
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "If untrapping focus requires a different method (rather than unmodified arrow
> keys, the Tab key, or other \"standard exit methods\"), content can still pass this criterion
> provided that the user is advised how they can untrap focus using their keyboard interface."
>
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "Providing a keyboard function to move the focus out of the subset of the
> content. Be sure to document the feature in an accessible manner within the subset."
