# case-06 — Three contentEditable textboxes all named "editor"

## Scenario
The "edit contact" panel of a real-estate CRM (Beacon Realty). Three rich-text fields are
built as contentEditable `<div role="textbox">`: a mailing **address**, the contact's
**internal notes** (explicitly not shared with the client), and a **pinned follow-up
reminder**. Each has a visible `<h3>` heading above it, but the heading is not programmatically
associated with the field — instead every editor carries the identical `aria-label="editor"`.
A screen-reader user tabbing the form hears "editor, edit text … editor, edit text … editor,
edit text" — three indistinguishable fields — and cannot tell which holds the address, the
private notes, or the reminder. Typing notes into the address field is a silent, real error.

## Attribute tuple
- **Content domain:** real-estate CRM / contact management
- **UI component / pattern:** custom rich-text fields (contentEditable `role="textbox"`)
- **Host-language construct:** `<div contenteditable role="textbox" aria-multiline aria-label>` (ARIA14's contentEditable case)
- **Locale / i18n:** en
- **Failure mechanism:** one identical generic token ("editor") reused as the name across three semantically-distinct text fields

## Developer persona
The team adopted a reusable `<RichEditor>` component whose default prop is `ariaLabel="editor"`.
Each instance was supposed to override it (address / notes / reminder), but the three were
dropped onto the form by copy-pasting the component with its default, and because every field
visibly showed its `<h3>` heading, sighted QA never noticed the editors all share one name. The
`<h3>`s look like labels but, on a contentEditable div, they do not auto-associate the way a
`<label for>` would on a native input.

## Element / selector carrying the issue
`.editor[role="textbox"][aria-label="editor"]` — all three (`.field.address`, `.field.notes`,
`.field.followup`). The distinguishing identity lives only in the unassociated `<h3>` headings
(`#h-address`, `#h-notes`, `#h-followup`) and the field contents, none of which feed the name.
The fix would be `aria-labelledby="h-address"` etc., or distinct `aria-label`s.

## Exact accessibility mechanism
AccName of each editor = "editor" (from `aria-label`). Because these are contentEditable divs,
not labelable form controls, the adjacent `<h3>` text does NOT become the accessible name; the
explicit `aria-label` is authoritative and identical across all three. A screen reader
announces "editor, edit text" three times; the role (textbox) and `aria-multiline` state are
correct, so the user knows they are in an editable multiline field — but not WHICH field. The
name is present and valid yet conveys no purpose and does not distinguish the fields.

## Expected ACT-style outcome
**failed** (SC 4.1.2). Each textbox has a non-empty accessible name, so ACT "Form field has
non-empty accessible name" PASSES on all three. The page fails 4.1.2 because the names do not
communicate each field's purpose and are not distinguishable — AT users cannot tell address
from notes from reminder.

## Why automated tools miss it
Each editor has a non-empty accessible name ("editor"), so axe/WAVE/Lighthouse pass the name
check — nothing is empty or missing. The identical-name uniqueness rule in ACT is scoped to
`<iframe>`, not to textboxes, so it never fires. A scanner cannot read the three visible `<h3>`
headings and the field contents to conclude that "editor" is generic and that the fields hold
different content — that requires human semantic judgment of what each field is for.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "For instance, aria-label or aria-labelledby are the most suitable way to provide an accessible name when a <div> element is made editable using the contentEditable attribute, instead of native form elements such as <input type=\"text\"> or <textarea> in order to provide a richer text editing experience."

**Reference:** WCAG Technique ARIA14 — Tests/Procedure (`wcag-techniques/aria/ARIA14.html`)
> "Check that the value of the aria-label attribute properly describes the purpose of an element where user input is required"
