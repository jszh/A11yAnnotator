# case-02 — Delete-confirm modal sends focus to the page top instead of the next list item after the row is removed (FAIL)

## Scenario
A patient portal lists active medications, each with a *Remove* button. Pressing *Remove* opens an
`alertdialog` confirmation. **Cancel** ("Keep it") behaves correctly — it returns focus to the *Remove*
button that opened it. But **Confirm** ("Remove") deletes the `<li>`, closes the dialog, calls
`window.scrollTo(0,0)`, and moves focus to the page's first nav link. Because the *Remove* trigger no
longer exists after the deletion, the F85 rule requires focus to move to a *logical neighbor* — the next
or previous medication's controls. Instead it is thrown to the top of the page, stranding the keyboard
user far from the list they were managing.

## Attribute tuple
- **Content domain:** healthcare / patient portal (medication list)
- **UI component / pattern:** `alertdialog` destructive confirmation over a list with per-row actions
- **Host-language construct:** `role="alertdialog"`, event delegation on the list, DOM node removal
- **Locale / i18n:** en-US, mg/mcg dosing
- **Failure mechanism:** F85 close branch, *trigger-removed* sub-case — focus goes to page top, not the logical neighbor

## Developer persona
A mid-level developer correctly handled the *cancel* path (return to trigger) after reading the APG
dialog pattern. For the *delete* path they reasoned "the button I'd return to is gone, so I'll just reset
the view" and reused an existing `scrollTo(0,0)` + focus-first-link helper from the app's router. They
never considered that the correct destination is the neighboring row, and a mouse test looked fine
because the page simply scrolled up.

## Element / selector carrying the issue
`#c-confirm` handler (`confirmRemove()`). After removing `li[data-med]`, it focuses
`.topbar nav a` (the first nav link) instead of the controls of the adjacent `<li>` in `#med-list`.
Contrast with `#c-cancel` (`cancel()`), which correctly restores focus to the originating
`.btn.remove`.

## Exact accessibility mechanism
On confirm, `confirmRemove()` deletes the pending `<li>`, so the *Remove* button that had focus is
detached from the document. The code then scrolls to top and focuses the first header nav link. A
screen-reader user who just deleted "Metformin" is yanked to the top-of-page navigation with no
indication of where the list now stands; a keyboard user must tab all the way back down through the
header, breadcrumb, heading, and remaining rows to continue pruning the list. The F85 tests step 2
requires that, when "the trigger control itself was removed as a result of the activation," focus be put
"on the interactive element immediately preceding or following the removed trigger control, or wherever
is logical." Sending it to the page top satisfies neither.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — after the confirming dialog removes the trigger, focus is not placed on a logical
neighbor but on the top of the page).

## Why automated tools miss it
The decision of *where focus should go* depends entirely on the semantics of the action: a *cancel*
should return to the trigger, but a *delete that removes the trigger* should move to the adjacent item.
A naive automated rule of "focus must equal the trigger after close" would be wrong on any correct
delete implementation (the trigger no longer exists), so tools cannot encode this without modeling the
action's meaning. Structurally the page is clean — `role="alertdialog"`, `aria-modal`, labelled and
described, valid buttons, and even a correct cancel path — so axe/WAVE/Lighthouse report nothing.
Judging the post-delete focus destination requires human state-transition reasoning about what the
action did.

## Citation
**Reference:** WCAG Technique F85 — Failure due to dialogs/menus not adjacent to their trigger in the navigation order (`wcag-techniques/failures/F85.html`)
> "If the trigger control itself was removed as a result of the activation, check if the focus has been put on the interactive element immediately preceding or following the removed trigger control, or wherever is logical."

**Reference:** WCAG Technique F85 — same file, design note
> "On confirming the deletion, the tag is deleted, the modal dialog closes, and focus is placed on the next tag in the list of tags. Placing focus onto a different, but logical, control is not a failure of Success Criterion 2.4.3."
