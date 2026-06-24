# case-01 — Grocery list reorderable ONLY by HTML5 drag-and-drop, no keyboard route to the reorder function (FAIL)

## Scenario
Fresh&Co's grocery app lets a shopper put their weekly list into the order they want to walk the
aisles; the tote is packed in that order. The list is reordered by native HTML5 drag-and-drop
(`draggable="true"` + `dragstart`/`dragover`/`drop`). Every *other* control on the page is keyboard
operable — the "Add an item" form submits with Enter, and each "picked" checkbox is a real focusable
`<input type="checkbox">` with a label — but the **reorder function itself** has no keyboard route:
there are no Move-up/Move-down buttons, no "move to position" field, and the draggable `<li>` elements
are not focusable and have no key handlers.

## Attribute tuple
- **Content domain:** e-commerce / grocery shopping list
- **UI component / pattern:** drag-to-reorder list (sortable list)
- **Host-language construct:** native HTML5 DnD on `li[draggable=true]`; JS `dragstart`/`dragover`/`drop` calling `insertBefore`
- **Locale / i18n:** en-US, imperial+metric mixed quantities
- **Failure mechanism:** endpoint-dependent reorder offered through pointer drag only — no keyboard equivalent for the function anywhere on the page

## Developer persona
A junior front-end dev was told "make the list reorderable" and grabbed the canonical MDN/Stack Overflow
HTML5 drag-and-drop snippet (`draggable=true`, `dragstart`/`drop`, `insertBefore`). It worked perfectly
with a mouse in their own testing, so they shipped it. They never considered that "reorder" is a
*function* a keyboard user must also be able to perform; the snippet they copied had no keyboard branch
and they didn't add one.

## Element / selector carrying the issue
`ul#grocery > li.item[draggable="true"]` — the draggable list items. The reorder function is bound
exclusively to the drag events on these elements; nothing else on the page can change item order.

## Exact accessibility mechanism
A keyboard-only or screen-reader user can Tab to the "Add" field, the Add button, and each "picked"
checkbox, but **cannot reach or operate the reorder function at all**. The `<li>` items have no
`tabindex`, so they never receive focus; there is no `keydown` handler, no Move-up/Move-down `<button>`,
and no position field. Reordering a list is endpoint-dependent — only the destination index matters, not
the path the pointer travels — so it is squarely inside 2.1.1 and is *not* covered by the
path-of-movement exception. The function is therefore operable by pointer only, which fails SC 2.1.1
(matches Failure technique F54: a pointing-device-specific mechanism is the only way to invoke the
function, and the function is not path-dependent).

## Expected ACT-style outcome
**failed** (SC 2.1.1 Keyboard — the reorder function has no keyboard interface; F54).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse find nothing wrong: there is no missing/empty attribute, every named
control has a role and an accessible name, and there is no broken ARIA. No scanner models "this draggable
`<li>` represents a *reorder function* that needs a keyboard equivalent," and none can decide that this
particular drag is endpoint- (not path-) dependent and therefore in scope. Detecting the failure requires
a human to (1) recognize reorder as a function, (2) judge it endpoint-dependent (exception does not
apply), and (3) confirm no keyboard alternative for that function exists anywhere on the page.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Most actions carried out by a pointing device can also be done from the keyboard (for example, clicking, selecting, moving, sizing). However, there is a small class of input that is done with a pointing device that cannot be done from the keyboard in any known fashion without requiring an inordinate number of keystrokes. Free hand drawing, or watercolor painting require path dependent input. Drawing straight lines, regular geometric shapes, re-sizing windows and dragging objects to a location (when the path to that location is not relevant) do not require path dependent input."

**Reference:** WCAG Technique F54 — Failure of SC 2.1.1 due to using only pointing-device-specific event handlers (`wcag-techniques/failures/F54.html`)
> "When pointing device-specific event handlers are the only mechanism available to invoke a function of the content, users with no vision (who cannot use devices such as mice that require eye-hand coordination) as well as users who must use alternate keyboards or input devices that act as keyboard emulators will be unable to access the function of the content."
