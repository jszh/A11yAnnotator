# case-02 — Social "hover card" (profile preview) in a portal layer, 12px below the username, with delayed-show / immediate-hide and no card mouseenter (FAIL)

## Scenario
A community forum thread shows a GitHub/Twitter-style profile "hover card" when you hover a username
(`@knotwood`). The card has an avatar, bio, karma, and Follow/Message buttons. It is rendered into a
detached `#hovercard-layer` (the React-portal pattern — a sibling of the content, not a descendant of any
username) and positioned 12px below the hovered username. Show is delayed 180ms ("hover intent"); hide is
*immediate* on the username's `mouseleave`. The card has no `mouseenter` handler of its own. Moving the
pointer down to the card to read it or click "Follow" first crosses the 12px transparent gap (over
neither the username nor the card), which fires `mouseleave` and hides the card instantly. Because the
card is a portal sibling with no hover handler, hovering it cannot re-open it.

## Attribute tuple
- **Content domain:** community forum / comments (Reddit-style thread)
- **UI component / pattern:** social profile "hover card" / non-modal popup dialog
- **Host-language construct:** JS portal layer (detached sibling DOM node), `setTimeout` delayed show vs. immediate `clearTimeout`+hide on `mouseleave`; card positioned by `getBoundingClientRect` with a 12px offset
- **Locale / i18n:** en-US
- **Failure mechanism:** F95 with timing asymmetry — delayed show but instant hide, popup detached from trigger (no DOM proximity), 12px gap on the travel path, and no popup `mouseenter` to cancel the hide

## Developer persona
A React developer copied a popular "hover card" recipe that portals the card to `document.body` to avoid
`overflow:hidden` clipping, and added a 180ms show delay to stop cards flickering as the cursor sweeps a
comment list. They wired hide to the trigger's `mouseleave` for simplicity and "forgot" the symmetric
`onMouseEnter` on the card itself (a very common omission — the popular libraries handle it with a
shared timer the snippet dropped). With a fast mouse the card stays up long enough to click; under
magnification or with a slow/large pointer, crossing the 12px gap kills it.

## Element / selector carrying the issue
`a.user` triggers (e.g. `#author-link`) and the portaled `#hovercard` (`div[role=dialog]`) in
`#hovercard-layer`. The 12px offset in the JS positioning and the missing `card.mouseenter` handler are
the defect.

## Exact accessibility mechanism
A screen-magnifier user hovers `@knotwood`; after 180ms the 280px card appears 12px below, partly outside
the magnified viewport. To read the bio/karma or reach the "Follow" button, the user moves the pointer
downward. The pointer immediately enters the 12px transparent gap, leaving the username's box, which
fires the username's `mouseleave` -> `hideNow()` -> `card.hidden = true`. Since the card lives in
`#hovercard-layer` (no DOM relationship to the username) and has no `mouseenter` handler, nothing keeps it
visible; it vanishes on the path toward it. The Hoverable condition is violated: the additional content
cannot itself be hovered.

## Expected ACT-style outcome
**failed** (SC 1.4.13, Hoverable; Failure technique F95).

## Why automated tools miss it
No automated engine implements 1.4.13. Statically, the card is exemplary: `role="dialog"` with an
`aria-label`, real `<button>`/`<a>` controls, adequate contrast, and it also opens on keyboard `focus`.
A DOM-proximity heuristic would actually be *misled* by the portal — the card is nowhere near the
trigger in the DOM, so "is the popup a child/sibling of the trigger?" gives no useful signal. Catching
the failure requires reasoning about three runtime facts simultaneously: the 180ms-show / instant-hide
timing asymmetry, the 12px transparent gap on the travel path, and the absence of a card `mouseenter`.
That is a behavioral + geometric simulation of pointer travel, which static analyzers do not perform.

## Citation
**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "When the added content is large, magnified views may mean that the user needs to scroll or pan to completely view it, which is impossible unless the user is able to move their pointer off the trigger without the additional content disappearing."

**Reference:** WCAG 2.2 Understanding 1.4.13 — Intent (`wcag-understanding/content-on-hover-or-focus.html`)
> "Examples of such interactions can include custom tooltips, sub-menus and other non-modal popups which display on hover and focus."

**Reference:** WCAG Technique F95 — Tests, Procedure (`wcag-techniques/failures/F95.html`)
> "The pointer can be moved over the new content without the additional content disappearing."
