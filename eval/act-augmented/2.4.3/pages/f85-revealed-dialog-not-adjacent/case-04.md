# case-04 — "Filters" panel positioned beside its button but rendered last in the DOM

## Scenario
A real-estate listings results page (Cedar & Vine Realty). A "Filters" button sits in the toolbar
above an 8-card results grid. Activating it reveals a filter panel (price, bedrooms, property type)
`position:fixed` to the left so it appears **visually right under the button**. But the panel's
markup is the **last element in the document — after every listing and the footer** — and the toggle
only adds `.open`. The visual adjacency directly contradicts the tab order.

## Attribute tuple
- **content-domain:** real-estate listings / property search
- **UI-component/pattern:** filter facets panel (`<form>` of fieldsets) revealed from a toolbar button
- **host-language construct:** `position:fixed` panel pinned beside the trigger, but DOM-appended after the footer; vanilla JS toggle
- **locale/i18n:** en
- **failure-mechanism:** F85 open branch — visual position ≠ DOM/tab position; revealed panel not next in navigation order, no focus move

## Developer persona
A UI designer-turned-developer using a component-library copy/paste pattern. The library's filter
flyout used `position:fixed` with hard-coded `top/left` coordinates and instructed authors to "drop
the panel markup at the bottom of the page to escape `overflow:hidden` on the results container."
The designer pixel-matched the panel to sit under the button and shipped it after confirming, with a
mouse, that "the filters appear in the right place." The DOM order never crossed their mind.

## Element / selector carrying the issue
`#filterToggle` (toolbar trigger) and `#filterPanel` (the filter `<form>` appended after `<footer>`).
The defect is the divergence between the panel's *visual* location (beside the button) and its
*navigation* location (end of the tab order), with no focus move on open.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard or screen-magnifier user Tabs to "Filters" and activates it. The panel pops in to the
left of the button, clearly the intended next interaction. But focus stays on the button (no `.focus()`),
and the panel is the last node in the DOM. Per F85 step 1: focus is not set into the panel, **and**
the next Tab does not enter it — it moves to "Sort: Newest" (next source-order control), then through
all eight "View …" listing links and the footer nav. A screen-magnifier user is hit hardest: they
see the filter controls magnified beside the button, Tab expecting to land there, and their focus
ring vanishes off into the results grid far from their viewport. Both step-1 checks are false; the
failure applies.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The filter form is exemplary static markup: `<fieldset>`/`<legend>` grouping, labelled radios and
checkboxes, an accessible `aria-label` on the form, working `aria-expanded`. axe/WAVE/Lighthouse find
nothing wrong. The failure is the **geometry-vs-source mismatch plus the missing focus move** —
purely runtime and visual. A static tool cannot compute that `position:fixed; left:26px` renders the
panel beside the button while its DOM index places it dead last; nor can it know that, once opened,
the panel should be the user's next Tab stop. Confirming the failure requires opening the panel,
seeing where it renders, and tabbing to discover focus goes elsewhere.

## Citation
> **WCAG Technique F85, Examples — "Adding a dialog to the page at the end of the sequential navigation order":**
> "The dialog is visually positioned above the content of the page and the user's focus isn't moved to the dialog. Since the dialog is found at the end of the DOM, it is at the end of the keyboard navigation order. … the user will need to tab through the rest of the web page before they can interact with the dialog."

(Verbatim from `wcag-techniques/failures/F85.html`. The filter panel is visually positioned beside
the button yet sits at the end of the DOM/keyboard navigation order — the identical failure.)

> **WCAG 2.2 Understanding Focus Order, Intent:**
> "Care should be taken so that the focus order makes sense to both of these sets of users and does not appear to either of them to jump around randomly."

(Verbatim from `wcag-understanding/focus-order.html`. Opening the filter makes focus jump away from
the visually-adjacent panel into the results list — exactly the disorientation this guards against.)
