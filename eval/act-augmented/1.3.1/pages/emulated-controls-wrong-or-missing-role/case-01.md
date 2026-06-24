# case-01 — Pagination strip built from underlined-blue `<span>`s with `onclick`

## Scenario
At the foot of the article index on **The Ledger Review** (a long-form markets/editorial
site) is a pagination strip: `Prev  1  2  3 … 9  Next`. Every control is underlined blue
text with a pointer cursor and a hover state; "2" (the current page) is bold black,
un-underlined, inert. Clicking any other control swaps the article list to that page via
`history.pushState`. The strip reads, unmistakably, as a set of pagination **links** — but
each control is a bare `<span class="pglink" onclick="goToPage(n)">` with no `<a>`, no
`href`, no `role`, and no `tabindex`.

## Attribute tuple
- **content-domain:** news / long-form editorial (markets desk)
- **UI-component / pattern:** numbered pagination control strip
- **host-language construct:** `<span onclick>` (no `<a>`, no `href`, no `role`, no `tabindex`)
- **locale / i18n:** en-US
- **failure-mechanism:** scripted element presented as a link whose exposed role is **generic** (F42 — emulated link)

## Developer persona
A staff editor's "quick fix." The CMS shipped server-rendered `<a>` pagination, but the
desk wanted client-side page swaps so the reading position wouldn't jump. A junior
front-end dev wired `onclick` handlers onto the existing styled `<span>`s (the blue/underline
classes were already in the stylesheet for "linky" text) rather than reaching for anchors,
copying the pattern from a Stack Overflow answer that did `<span onclick="location...">`.
It looked and clicked exactly like the old links in QA, so it shipped.

## Element / selector carrying the issue
- `nav.pager .pglink` — six `<span>` controls (Prev / 1 / 3 / 9 / Next) styled and
  behaving as pagination links but exposing a generic role. (The current-page `2` is
  correctly inert text and is not at issue.)

## Exact accessibility mechanism (what AT experiences)
A sighted user sees blue underlined text that changes the cursor to a pointer and navigates
when clicked — every visual and behavioural cue says "these are links." A screen-reader
user gets none of that: each `<span>` exposes the **generic** role, so the controls are not
announced as links, do not appear in the screen reader's links list, and offer no
navigational affordance. Worse, with no `tabindex` they are entirely absent from the
keyboard tab order, so a keyboard-only user cannot reach them at all. The link relationship
that visual formatting conveys is therefore not programmatically determinable — the exact
condition SC 1.3.1 requires.

## Expected ACT-style outcome
**failed** — SC 1.3.1 Info and Relationships, F42 emulated-link path: elements presented as
links via styling and scripted navigation expose a generic role, so the link relationship is
not programmatically determinable.

## Why automated tools miss it
The `<span>`s carry **no `role` attribute at all**, so ACT's 1.3.1 role rules
(4e8ab6 required-properties, 674b10 valid-role-value) are never applicable — they fire only
when a role is present. axe / WAVE / Lighthouse see plain `<span>`s with text content and a
JavaScript handler; a bare element with a click listener matches no "wrong role" rule and is
simply outside their applicability. Concluding that this strip *is presented as pagination
links* (from blue underline + pointer cursor + page-changing behaviour) and that its exposed
generic role contradicts that presentation requires human visual and behavioural reasoning
no attribute-anchored checker performs.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "This failure occurs when JavaScript event handlers are attached to elements to emulate
> links. A link created in this manner cannot be tabbed to from the keyboard and does not
> gain keyboard focus like other controls and/or links. If scripting events are used to
> emulate links, user agents including assistive technology may not be able to identify the
> links in the content as links."

**Supporting reference:** WCAG 2.2 Understanding — *Info and Relationships* (Intent)
(`wcag-understanding/info-and-relationships.html`).

> "The intent of this success criterion is to ensure that information and relationships that
> are implied by visual or auditory formatting are preserved when the presentation format
> changes."
