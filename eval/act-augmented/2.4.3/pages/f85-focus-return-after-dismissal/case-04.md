# case-04 — Escape-dismissed search overlay strands focus on the now-`aria-hidden` overlay; next Tab restarts at page top (FAIL)

## Scenario
A news site has a *Search* button in the masthead that opens a full-screen search overlay. On open the
overlay is correct: it sets `aria-hidden="false"`, becomes visible, and moves focus into the search
input. The user can dismiss it with **Esc** or the **Close** button. Dismissal hides the overlay and
re-applies `aria-hidden="true"` to the container, but never moves focus back to the *Search* button. The
input that had focus is now inside an `aria-hidden`, `display:none` subtree, so focus is left on a hidden
node; the next Tab restarts from the first focusable element in the document — the masthead at the top of
the page. A keyboard user who opened search from the header and pressed Escape is forced back to the very
top, having lost their reading position in the article.

## Attribute tuple
- **Content domain:** news / long-form editorial
- **UI component / pattern:** full-screen search overlay (off-canvas) toggled from the masthead
- **Host-language construct:** `role="dialog"` + `aria-modal`, `aria-hidden` toggled with class, `Escape` keydown
- **Locale / i18n:** en-US
- **Failure mechanism:** F85 close branch — Escape dismissal does not restore focus to the trigger; focus left on hidden container

## Developer persona
A developer copied an "accessible search overlay" snippet that emphasized two things they implemented
faithfully: toggling `aria-hidden` and autofocusing the input on open. The snippet's close handler simply
re-hid the overlay. They added an Escape listener for polish. Because they only ever closed the overlay
with a mouse (where focus loss is invisible), they never noticed that keyboard dismissal leaves focus
stranded and the next Tab jumps to the masthead.

## Element / selector carrying the issue
`#search-overlay` on dismissal — the `closeSearch()` handler (bound to Escape and `#search-close`). It
toggles `aria-hidden="true"` and the `open` class but omits `openBtn.focus()`. The trigger that should
receive focus back is `#open-search`.

## Exact accessibility mechanism
`closeSearch()` removes the `open` class (applying `display:none`) and sets `aria-hidden="true"` on the
overlay, but does not move focus. The previously-focused `#q` input is now in a hidden subtree; the
browser does not auto-restore focus to the trigger, so focus is effectively lost (it falls back toward
the document/body). A screen reader is left pointed at a now-hidden node with nothing to announce; a
sighted keyboard user sees the focus ring disappear, and pressing Tab moves to the first focusable
control on the page (the masthead *Search* button region), not back to where search was invoked. This is
F85's "focus is set to the document … the user must tab from the beginning of the navigation sequence to
reach the point from which the menu was opened."

## Expected ACT-style outcome
**failed** (SC 2.4.3 — after the overlay is dismissed via Escape/Close, focus is not returned to the
trigger; it is stranded on a hidden container so the next Tab restarts at the top of the page).

## Why automated tools miss it
In the overlay's *resting* (closed) state — the only state a page-load scan observes — `aria-hidden="true"`
sits on a `display:none` container, which is entirely valid. The axe rule "aria-hidden elements must not
contain focusable elements" does not fire, because `display:none` removes the descendants from the focus
order. The defect is purely temporal and interaction-driven: it manifests only after a keyboard user
*opens* search and *dismisses* it, at which point focus is never restored. No static DOM snapshot
captures this open-then-Escape focus transition, so axe/WAVE/Lighthouse report nothing.

## Citation
**Reference:** WCAG Technique F85 — Failure due to dialogs/menus not adjacent to their trigger in the navigation order (`wcag-techniques/failures/F85.html`)
> "When a menu is dismissed, it is removed or hidden from the web page and focus is set to the document. The user must tab from the beginning of the navigation sequence to reach the point from which the menu was opened."

**Reference:** WCAG Technique F85 — Tests, step 2 (`wcag-techniques/failures/F85.html`)
> "Check whether keyboard focus is put back on the trigger control"
