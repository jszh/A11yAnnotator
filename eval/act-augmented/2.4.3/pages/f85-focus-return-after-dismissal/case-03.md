# case-03 — Label-chip delete moves focus to the NEXT chip (logical neighbor) — the F85 exception, a PASS

## Scenario
An issue tracker shows a list of label chips on issue #2184, each chip carrying a remove **×**.
Pressing **×** opens an `alertdialog` confirmation. **Cancel** returns focus to the chip's **×** (the
chip still exists). **Remove label** deletes the chip — so its **×** no longer exists — and then moves
focus to the *next* chip's **×** (falling back to the *previous* chip when the deleted one was last, and
to **+ Add label** when no chips remain). This is exactly the "logical neighbor" path that F85's design
note declares **not** a failure. The page is included as the discriminating PASS counter-example: a
verdict engine that naively expects "focus returns to the trigger" must NOT flag this, because the
trigger was removed by the very action that closed the dialog.

## Attribute tuple
- **Content domain:** developer tooling / issue tracker (label management)
- **UI component / pattern:** chip/tag list with per-chip delete + `alertdialog` confirm
- **Host-language construct:** `<ul>`/`<li>` chips, event delegation, `nextElementSibling`/`previousElementSibling` focus routing
- **Locale / i18n:** en-US, developer jargon
- **Failure mechanism:** none — this is the F85 *trigger-removed → logical-neighbor* PASS exception

## Developer persona
A senior front-end engineer who has implemented APG dialog focus management before. They explicitly
read F85's note about tag deletion and wrote the confirm handler to compute the neighbor: next chip,
else previous chip, else the add-label button. They verified by keyboard that after deleting a middle
label, focus lands on the following label's remove button — exactly where a sighted user's eye would go.

## Element / selector carrying the issue (here: the correctly-handled element)
`#rm-confirm` handler (`confirmRemove()`): after removing `li.chip[data-label]`, it focuses the
`nextElementSibling`'s `.x` (or previous chip's `.x`, or `.addlabel`). The cancel path (`#rm-cancel`)
correctly returns to the originating `.chip .x`.

## Exact accessibility mechanism
When a label is removed, the **×** that had focus is detached from the DOM. Rather than dropping focus
to `document.body` (which is what would happen if nothing were done), the handler resolves a logical
neighbor and focuses it. A screen-reader user who deletes "payments" hears focus land on "needs-repro"'s
remove control — the natural continuation point for pruning labels — and can keep working without ever
leaving the label region. This satisfies F85 step 2: when "the trigger control itself was removed as a
result of the activation," focus is "put on the interactive element immediately preceding or following
the removed trigger control, or wherever is logical." The cancel path independently satisfies the
return-to-trigger requirement because the chip is preserved.

## Expected ACT-style outcome
**passed** (SC 2.4.3 — on dismissal, focus is placed on the trigger when it survives, and on a logical
neighbor when the trigger is removed by the action).

## Why automated tools miss it
This case exists to expose the *false-positive* failure mode of naive automation. A tool can only test
focus management dynamically, and any simple rule it could encode — "after a dialog closes, focus must
return to the element that opened it" — would WRONGLY flag this correct page, because the opening
element no longer exists after a delete. Conversely, axe/WAVE/Lighthouse static scans report nothing at
all (the ARIA and labelling are clean). Correctly judging this as a PASS requires reasoning that a
deletion legitimately removes the trigger and that the chosen neighbor is the meaningful landing point —
human state-transition reasoning, not a pattern match.

## Citation
**Reference:** WCAG Technique F85 — Failure due to dialogs/menus not adjacent to their trigger in the navigation order (`wcag-techniques/failures/F85.html`)
> "a blog post has a list of tags, each tag containing a delete button. Pressing a delete button opens a modal dialog that asks the user to confirm the deletion. On confirming the deletion, the tag is deleted, the modal dialog closes, and focus is placed on the next tag in the list of tags. Placing focus onto a different, but logical, control is not a failure of Success Criterion 2.4.3."

**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "When the dialog is dismissed, focus returns to the button or the element following the button."
