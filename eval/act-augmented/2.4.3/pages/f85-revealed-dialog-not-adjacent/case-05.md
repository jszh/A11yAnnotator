# case-05 — "Explore" disclosure trigger in the header partial, panel emitted by the footer partial

## Scenario
A university admissions landing page (Northgate State). The "Explore Northgate ▾" button is in the
header. The "Explore" *panel* (Academics / Campus Life columns of links) is rendered by the **footer
theme partial**, so its markup is emitted near the end of the DOM — yet CSS (`position:absolute;
top:96px; right:26px`) floats it up under the header so it *looks* attached to the trigger. Opening it
only toggles `.open` + `aria-expanded`; no focus move. This is the **long-tail** variant: the
DOM/trigger split is an artifact of how a CMS theme splits its header and footer include files.

## Attribute tuple
- **content-domain:** higher-ed / university admissions
- **UI-component/pattern:** multi-column disclosure panel (a `<nav>` of links) opened from a masthead button
- **host-language construct:** trigger in `header.html` partial, panel emitted by `footer.html` partial → wide DOM separation; `position:absolute` floats it up
- **locale/i18n:** en
- **failure-mechanism:** F85 open branch — include-file split places the revealed panel at the end of the DOM, not adjacent to its header trigger; no focus management

## Developer persona
An agency theming a CMS (think a Drupal/WordPress-style template) for the university. To keep the
"Explore" panel out of the masthead's `overflow` and z-index stacking context, the agency's senior
templater moved the panel markup into the shared `footer.html` include and positioned it with absolute
CSS. This is a real and "clever" pattern — it solves stacking-context bugs — but it silently dumps the
panel near the bottom of the rendered DOM. They verified the visual position with a mouse; the keyboard
path crossing two partials was never traced.

## Element / selector carrying the issue
`#exploreBtn` (the disclosure trigger in the header partial) and `#exploreMega` (the panel emitted by
the footer partial, as the last element in `<body>`). The defect is the DOM distance between trigger
and revealed panel, plus the absent focus move on open.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard user Tabs to "Explore Northgate ▾" (an early stop, in the header) and presses Enter. The
panel floats in just below, visually adjacent. But focus stays on the button, and the panel is the last
node in the DOM. Per F85 step 1: focus is **not** set into the panel, **and** moving forward once does
not enter it — the next Tab goes to the main-content "Go to the application" link (next in source
order after the masthead). The eight program links the user summoned are only reachable after tabbing
through the entire page and the footer nav. The Escape handler closes the panel but does not fix the
open traversal. Both step-1 checks are false; the failure applies.

The panel is built as a plain disclosure: a labelled `<nav>` landmark with `<h3>` column headings and
ordinary links — no `role="menu"`/`role="menuitem"` — so there is no ARIA-required-children problem and
no implied (unimplemented) APG arrow-key contract. The 2.4.3 failure stands purely on the focus-order
issue.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Static analysis sees a syntactically clean disclosure: a button with `aria-expanded`/`aria-controls`,
a labelled `<nav>` panel of links with real section headings, working Escape, and AA-passing contrast
(the panel links compute to `#1c1c1c` on white, ~17:1 — the panel's own scoped color rule wins because
the panel sits *outside* the footer landmark, so no footer link color cascades onto it). Nothing is
missing, empty, or mis-roled — axe-core (v4.10), WAVE, and Lighthouse all report no violations. The
tool also cannot know the page was assembled from two include files; it sees one flattened DOM where
the panel happens to be near the bottom. The failure is the runtime relationship between a header
trigger and a footer-rendered panel that is visually floated to look adjacent — only opening it and
observing that the next Tab leaves the panel reveals it. No static checker reconstructs intended visual
adjacency or simulates the open-then-Tab sequence.

## Citation
> **WCAG Technique F85 (Failure of Success Criterion 2.4.3 due to using dialogs or menus that are not adjacent to their trigger control in the sequential navigation order), Description:**
> "This describes the failure condition that results when a web page opens a dialog or menu interface component embedded on the page in a way that makes it difficult for a keyboard user to operate because of its position in the sequential navigation order. When the user opens the dialog or menu embedded on the page by activating a button or link, their next action will be to interact with the dialog or menu. If focus is not set to the dialog or menu, or a logical focusable descendent of these widgets, and the widget or a focusable descendent is not next in the sequential navigation order, it will be difficult for the keyboard user to operate the dialog or menu."

(Verbatim from `wcag-techniques/failures/F85.html`. The footer-partial placement is precisely a menu
whose *position in the sequential navigation order* makes it difficult to operate: focus is not set
into it and it is not next in the navigation order.)

> **WCAG 2.2 Understanding Focus Order, Intent of Focus Order:**
> "If no scripting or `tabindex` attributes are used, the navigation order is the order that components appear in the content stream."

(Verbatim from `wcag-understanding/focus-order.html`. With no focus script, the panel's content-stream
position — end of the DOM, in the footer partial — IS its navigation position, far from the trigger.)
