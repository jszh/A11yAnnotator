# case-05 — Tag cloud: forward Tab exits, but Shift+Tab from the first tag loops (one-directional FAIL)

## Scenario
A coffee-blog article ("The Daily Grind") with a tag cloud of five tag links ("pour-over", "french
press", "grind size", "brew ratios", "beginner") between the article body and a "Keep reading"
related-links section. The FORWARD direction is correct: Tab from the last tag ("beginner") exits to
the related links. The defect is reverse-only: pressing Shift+Tab on the FIRST tag ("pour-over") is
intercepted and focus jumps to the last tag, so a keyboard user who entered the tag region can never
step backward to the article or header. The loop is one-directional, so a judge MUST test both
directions to find it. No advice is given.

## Attribute tuple
- **content-domain:** food & drink editorial / blog
- **UI-component/pattern:** tag cloud (region of links) — multi-element region; one-directional loop
- **host-language construct:** real `<a href>` tag links in a named `<nav>` + JS Shift+Tab interception
- **locale/i18n:** en-GB editorial voice
- **failure-mechanism:** G21 mechanism #1 satisfied forward but VIOLATED backward — Shift+Tab from the first link wraps internally; reverse exit walled off, no advice

## Developer persona
A blog author found a "make the tag row feel circular" snippet and wired up only the backward wrap
(first → last), assuming they would add the forward wrap later — then shipped. Because forward Tab
already exited naturally and they only ever tested forward, the half-finished backward loop went
unnoticed.

## Element / selector carrying the issue
`#firstTag` (the "pour-over" link). Its `keydown` listener intercepts backward Tab
(`e.key === 'Tab' && e.shiftKey`), calls `e.preventDefault()`, then `lastTag.focus()`. There is
deliberately NO handler on `#lastTag`, so forward Tab exits correctly.

## Exact accessibility mechanism
SC 2.1.2 requires that focus can be moved away from a component using the keyboard; G21 mechanism #1
must hold for the navigation key in use, which includes Shift+Tab as a standard exit method. Here the
forward exit is fine, but a keyboard user inside the tag region who presses Shift+Tab on the first tag
is bounced to the last tag, so backward focus cycles among the five tags indefinitely — the article
and header above the region are unreachable from within it. Keyboard access is restricted to a small
section "with no way to navigate out of the loop." Plain Shift+Tab is a standard exit method so no
advice is owed; the page fails purely because one direction of the region boundary does not let Tab
cross. SC 2.1.2 fails.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. This case specifically tests that the judge exercises BOTH
directions: forward Tab from the last tag passes, so a forward-only check would mis-pass; only
Shift+Tab on the first tag reveals the trap.

## Why automated tools miss it
The tags are valid anchors with visible text and hrefs in a named nav — no empty-name or structural
defect. The loop exists solely as a runtime Shift+Tab `keydown` behaviour on one element. Automated
scanners never press Tab or Shift+Tab and never traverse focus in either direction, so they cannot
detect a direction-specific trap. A human auditor who only tabs forward would also miss it, which is
precisely why this aspect requires driving the keyboard both ways.

## Citation
> **Reference:** WCAG Understanding — No Keyboard Trap, Intent
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "Keyboard focus is not considered trapped when the user can navigate away
> from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab
> keys or other \"standard exit methods\"."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, "How to Test" (step 1)
> (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Use standard navigation keys (e.g., TAB, SHIFT+TAB, arrow keys, CTRL+TAB,
> etc.) to navigate through all keyboard focusable elements on the page."
