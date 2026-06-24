# case-04 — Modal close button shipped with aria-label="TODO label"

## Scenario
A patient-portal dashboard (Cedar Vale Health) shows an open modal dialog asking the patient
to confirm an upcoming cardiology appointment. The dialog's overlay close control is the
conventional "×" button in the top-right corner. Its accessible name was shipped as a leftover
developer placeholder: `aria-label="TODO label"`. Sighted users dismiss the dialog by the "×"
convention; a screen-reader user reaches the control and hears "TODO label, button," which
identifies neither the action (close/dismiss) nor anything else useful.

## Attribute tuple
- **Content domain:** healthcare / patient portal
- **UI component / pattern:** modal dialog (APG `role="dialog"` + `aria-modal`) with a close button
- **Host-language construct:** native `<button>` containing the `&times;` glyph, named via `aria-label`
- **Locale / i18n:** en
- **Failure mechanism:** un-replaced developer placeholder ("TODO label") shipped as the accessible name (non-empty, meaningless)

## Developer persona
A contractor scaffolded the dialog component and typed `aria-label="TODO label"` on the close
button as a reminder to come back and wire it to the i18n catalog. The ticket was closed when
the visual modal worked; the placeholder shipped because it rendered nothing on screen (the
visible glyph is the `&times;`) and passed the "every control has a non-empty name" lint gate.
The rest of the dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) is wired
correctly, so the close button's name is the only defect.

## Element / selector carrying the issue
`.dialog button.close[aria-label="TODO label"]`. Its purpose (close / dismiss the dialog) is
conveyed only by the `&times;` glyph and its top-right position, neither of which feeds the
accessible name.

## Exact accessibility mechanism
AccName = "TODO label" (from `aria-label`; the `&times;` text node is overridden by the
explicit label). A screen reader announces "TODO label, button"; a voice-control user cannot
say "click close." The role is correct (button) and the dialog is otherwise well-formed, so
AT users can perceive the dialog and its title but cannot determine how to dismiss it from the
control's name — the name is present but communicates no purpose.

## Expected ACT-style outcome
**failed** (SC 4.1.2). The close button has a non-empty accessible name, so ACT "Button has
non-empty accessible name" PASSES. The page fails 4.1.2 because the name does not provide
"important and appropriate information" identifying the control and does not communicate its
purpose (it should be "Close").

## Why automated tools miss it
"TODO label" is a syntactically valid, non-empty string, so axe/WAVE/Lighthouse pass the
button's name check; no automated rule flags placeholder or to-do text. Recognizing "TODO
label" as an un-replaced developer note — and that the control is actually the dialog's close
button — requires human reading of the string and the "×"/top-right convention. This is
exactly the close-button case ARIA14 calls out by name.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "An example is the “×” often used in the top-right corner of dialogs to indicate the control for closing the dialog. While it might be visually clear that the button with the “×” symbol closes the dialog, users with assistive technologies rely on accessible names that clearly communicate the purpose of components, in this case “Close”."

**Reference:** WCAG 2.2 Understanding Name, Role, Value (`wcag-understanding/name-role-value.html`)
> "Give components correct names, roles, states, and values."
