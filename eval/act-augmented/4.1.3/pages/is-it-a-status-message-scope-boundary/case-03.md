# case-03 — Tablist panel swap governed by 4.1.2, no live region needed (excepted → N/A)

## Scenario
A Tallgrass State University LMS course-materials page for BIOL 204. A standard APG **tablist** has three
tabs (Overview / Syllabus & policies / Readings). Selecting a tab hides the current `role="tabpanel"` and
shows another — new content appears on screen. The author added **no** `role="status"` / `aria-live`
anywhere, and that is **correct**: the content change is exposing/hiding content by interacting with a UI
component, which the Understanding lists among the changes that are **not** status messages. The selection
change is announced through **4.1.2 Name, Role, Value** semantics (`role="tab"`, `aria-selected`,
`aria-controls`, roving tabindex, arrow keys), not through 4.1.3.

## Attribute tuple
- **content-domain:** higher-ed LMS / course page
- **UI-component/pattern:** tablist + tabpanels (APG Tabs pattern, automatic activation, roving tabindex)
- **host-language construct:** `role="tablist"`/`role="tab"`/`role="tabpanel"` with `aria-selected`,
  `aria-controls`, `aria-labelledby`, `hidden`
- **locale/i18n:** en
- **failure-mechanism:** NONE — definitional-boundary N/A; the trap is mistaking a 4.1.2-governed
  show/hide for a missing 4.1.3 live region

## Developer persona
An instructional-technologist who built the tabs from the WAI-ARIA Authoring Practices Tabs example.
They correctly understood that tab activation is a widget-state change owned by 4.1.2 and deliberately
did **not** bolt on an `aria-live` region, because the APG example doesn't and because doing so would
double-announce ("Syllabus selected" + a live-region echo). A checklist auditor who sees "a panel of new
content appeared with no live region" might wrongly raise a 4.1.3 ticket.

## Element / selector carrying the issue
`[role="tablist"][aria-label="Course materials"]` and its `[role="tab"]` children. The classification
turns on `aria-selected` toggling and the `aria-controls`/`aria-labelledby` wiring: the content change is
surfaced as a tab-selection state change (4.1.2), so 4.1.3 is inapplicable.

## Exact accessibility mechanism (what AT experiences, why it is N/A)
When the user arrows to "Syllabus & policies," the tab widget sets `aria-selected="true"` on it (and
`false` on the others) and moves focus to it. NVDA/JAWS/VoiceOver announce "Syllabus & policies, tab,
selected, 2 of 3," and entering the panel reads its heading and contents on demand. The change is fully
exposed by the widget's role/state semantics. Adding a status live region would be redundant and chatty.
Per the Understanding, "Content is exposed or hidden when a user interacts with a user interface
component… None of the resulting changes to content meet the definition of status messages," and such
state changes are already required to be exposed under 4.1.2. Therefore 4.1.3 does not apply.

## Expected ACT-style outcome
**inapplicable** — the only dynamic content change is a tab-panel show/hide, which does not meet the
status-message definition and is governed by 4.1.2. Per EN 301 549 C.9.4.1.3, "Not applicable: …the web
page does not contain content relevant to … 4.1.3."

## Why automated tools miss it
Automated tools can verify the tab roles/attributes exist, but they cannot make the *positive* N/A call
this aspect needs. The risk is the opposite: a heuristic that flags "new content rendered without an
`aria-live` region" would FALSELY fail this page. Distinguishing a 4.1.2-governed widget state change
(excepted) from a genuine in-scope status that lacks a live region requires knowing which SC owns the
change and recognizing that tab selection is announced through role/state — a semantic boundary
judgment, not a structural check.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Examples of changes that are not status messages), `wcag-understanding/status-messages.html`:**
> "Content is exposed or hidden when a user interacts with a user interface component, for example
> expanding components such as a menu, select, accordion or tree, or selecting a different tab item in a
> tablist. None of the resulting changes to content meet the definition of status messages."

> **WCAG 2.2 Understanding 4.1.3 (Examples of changes that are not status messages), `wcag-understanding/status-messages.html`:**
> "Further, all components that meet the definition of a user interface component already have
> requirements specified under 4.1.2 Name, Role, Value… As a result, changes in state, such as
> \"expanded\" or \"collapsed,\" would be announced by the screen reader… As such, such content does not
> need to be addressed by this success criterion."
