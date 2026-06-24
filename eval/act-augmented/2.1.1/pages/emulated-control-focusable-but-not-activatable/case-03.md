# case-03 — Webmail message-action toolbar built from href-less `<a onclick>` (drops out of tab order)

## Scenario
A webmail client ("Postela") shows a reading pane with a message-action toolbar:
*Reply, Reply all, Forward, Archive, Delete*. Each action is an `<a class="action"
onclick="act(...)">` — an anchor styled as a button **with no `href`**. Visually and in the
source these read as ordinary links/buttons, but an `<a>` without `href` (and without
`tabindex`) is **not focusable** and never enters the Tab sequence. The toolbar is fully
mouse-operable and completely keyboard-unreachable.

## Attribute tuple + developer persona
- **content-domain:** productivity / email client
- **UI-component/pattern:** message-action toolbar (`role="toolbar"`) of icon+text controls
- **host-language construct:** `<a onclick=...>` **without** `href` (and without `tabindex`)
- **locale/i18n:** en
- **failure-mechanism:** href-less anchor → not focusable → drops out of the tab order entirely
- **persona:** A web agency was hired to re-skin a white-label webmail template. The lead used
  `<a>` for the toolbar "because the design system's link styles applied cleanly", and dropped
  `href` on purpose — "the JavaScript handles everything, an empty `href="#"` just adds a junk
  history entry." Nobody on the team keyboard-tested the toolbar; QA only clicked with a mouse.

## Element / selector carrying the issue
`.msg-toolbar a.action` — all five toolbar controls (Reply / Reply all / Forward / Archive / Delete).

## Exact accessibility mechanism (what AT experiences and why it fails)
- A keyboard user tabs through the page: brand, the five sidebar folder links (real `<a href>`),
  and then… nothing in the reading pane. The toolbar actions are skipped entirely because a
  href-less, tabindex-less `<a>` is not in the tab order.
- A screen-reader user navigating by Tab never lands on Reply/Forward/etc.; navigating the
  links list also won't surface them as links in some AT because there is no `href` (they are
  not "real" links). The actions are effectively invisible to keyboard operation.
- These message actions (reply, forward, archive, delete) are core functionality with **no
  alternative keyboard path** on the page → keyboard-reachable? No. Operable? No. Fails 2.1.1.

Verified behaviourally (headless Chromium): calling `.focus()` on a toolbar anchor does **not**
make it `document.activeElement`; pressing Tab repeatedly from the body never lands on any
`.msg-toolbar a.action`.

## Expected ACT-style outcome
**failed** (SC 2.1.1; also F42-relevant for the link-emulation aspect).

## Why automated tools miss it
The markup is well-formed: valid `<a>` elements inside a `role="toolbar"`, each with visible
text content (so any accessible-name check passes). Many scanners only flag an anchor when it
has a problematic `href` (e.g. `href="#"` or `javascript:`) or when a `<div>`/`<span>` carries
an onclick with no role — neither applies here. The *absence* of `href` makes the element a
non-link in the accessibility tree, but a static rule generally does not assert "this anchor
SHOULD be focusable"; it just sees a perfectly legal href-less `<a>`. Discovering that **Tab
never reaches the toolbar** requires running the focus sequence — a behavioural test.

## Citation
> **WCAG Failure Technique F42 — Description** (`wcag-techniques/failures/F42.html`)
>
> "This failure occurs when JavaScript event handlers are attached to elements to emulate links. A link created in this manner cannot be tabbed to from the keyboard and does not gain keyboard focus like other controls and/or links."

> **WCAG Failure Technique F42 — Description** (`wcag-techniques/failures/F42.html`)
>
> "The `a` and `area` elements are intended to mark up links."

The hrefless anchors emulate links via `onclick` but cannot be tabbed to or gain focus,
matching the F42 failure condition for 2.1.1.
