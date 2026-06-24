# case-01 — Cart badge announces a bare "3" with no "items in cart" (icon's label never re-read)

## Scenario
An e-commerce hiking-gear store ("Trailhead Outfitters"). The header has a shopping-cart icon glyph
followed by a small count badge. The badge is a correct, valid `role="status"` / `aria-live="polite"` /
`aria-atomic="true"` live region. Clicking any "Add to cart" button increments the badge text from
`0` to `1`, `2`, `3`. The badge announces its *entire* contents atomically — but its entire contents
are just the number. The word that gives the number meaning ("cart") lives on the adjacent icon's
`aria-label="Shopping cart"`, which sits **outside** the live region and is never re-announced when the
count updates.

## Attribute tuple
- **content-domain:** e-commerce product listing / shopping cart
- **UI-component/pattern:** header cart-count badge (APG status / live-region)
- **host-language construct:** `<span role="status" aria-live="polite" aria-atomic="true">` holding only a number, beside a separate `role="img"` glyph
- **locale/i18n:** en
- **failure-mechanism:** announced string is contextually impoverished — the spatial proximity of the cart glyph supplies meaning the atomic text lacks (no offscreen "items in cart" text added)

## Developer persona
A mid-level front-end developer who *did* read the WCAG live-region guidance and correctly wired
`role="status"` + `aria-atomic="true"` on the count, and correctly gave the cart icon an `aria-label`
for SC 1.1.1. They tested with a screen reader, heard the badge update fire, saw the announcement was
the full string, and concluded it was done. They never noticed that the full string is "3" with no
noun — because on screen the cart icon is one inch to the left and the meaning is obvious to them.
They did not read the Understanding's "Modification of status text" note advising offscreen
"in shopping cart" text, nor ARIA22's instruction to place the cart image *inside* the atomic region.

## Element / selector carrying the issue
`#cartCount` (`span.count[role="status"][aria-live="polite"][aria-atomic="true"]`). It contains only
the digit. The contextual noun is on the sibling `.cart .glyph[aria-label="Shopping cart"]`, which is
not inside the live region.

## Exact accessibility mechanism (what AT experiences, why it fails)
On "Add to cart," the polite live region mutates and the screen reader announces exactly what the
atomic region now contains: "3" (VoiceOver/NVDA say "three"). It does **not** re-read the sibling
glyph's "Shopping cart" label, because polite live announcements speak the changed region's atomic
contents, not adjacent unchanged nodes. A sighted user sees the "3" pinned to the cart icon and reads
"cart: 3 items." A screen-reader user hears an orphaned "three" with no referent — they cannot tell
whether three is items, dollars, notifications, or search results. This is the exact gap the
Understanding's "Non-displayed text specific to AT users" section describes: visual proximity supplies
context the text alone lacks, and the remediation is to add non-displayed text (offscreen "items in
cart") or to place the cart image with its alt inside the atomic region (ARIA22). Neither was done.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The live region is structurally perfect: `role="status"` is present *before* the update, `aria-live`
and `aria-atomic` are valid, the region is non-empty, and the adjacent icon has a non-empty
`aria-label` (so 1.1.1 / 4.1.2 name checks pass). axe-core, WAVE, and Lighthouse have no rule that the
announced *text* must be semantically self-sufficient — they cannot judge that "3" is meaningless
without "items in cart," because that requires understanding that the visible cart icon supplied
context the announced string omits. F103-style detectors look for a *missing* role/property; here every
property is present and correct. Only a human (or vision model) comparing the rendered layout
("3 next to a cart") against the announced string ("three") can detect the contextual gap.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Modification of status text":**
> "where only the number in this string was coded as an updated chunk of content, the resulting
> experience for screen reader users could be to only hear "three", which may not be sufficient
> information to provide context for the user. In such situations, marking the entire "3 items" string
> as the status text would normally be a better solution. ... In this case it would also be a courtesy
> to add offscreen text such as "in shopping cart" to the message."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "There may be cases where the addition of visible text does not by itself convey sufficient
> information to the user of assistive technology. For example, the proximity of new content to other
> pieces of information on the screen may provide a visual context that is lacking in the text alone."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html`:**
> "Check that elements or attributes that provide information equivalent to the visual experience for
> the status message (such as a shopping cart image with proper `alt` text) also reside in the
> container."
