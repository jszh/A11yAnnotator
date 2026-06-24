# case-03 — Banking: input-LOOKING controls that are not data entry (read-only display + dialog-opener), plus one instructed search (PASS / trap)

## Scenario
A credit-union "Statement summary" screen. Two controls are *visually* dressed to look like form fields but are **not** data-entry controls:
1. **`#amount-display`** — a `<div contenteditable="false">` styled with a 2px border, padding, and monospace font so it reads as a *filled text input* showing the balance "$2,418.05". It is a read-only **display of output**; it accepts no input (not editable, not a textbox, not a tab stop, `aria-readonly="true"`).
2. **`#period-trigger`** — a `<button>` styled to look like a `<select>`/combobox ("Jun 2026 ▾"). Activating it opens a modal **dialog of links** to prior statements (`aria-haspopup="dialog"`). It is a dialog-opener (navigation), not a field you type into.

The single genuine data-entry control is the "Search transactions" field, correctly given a visible `<label>` and a visible instruction ("Enter a merchant name or amount... Searches this statement only.") via `aria-describedby`. The page **passes** 3.3.2. The discriminating judgment is to classify the input-LOOKING controls by *role/behaviour* (output / dialog-opener) rather than by appearance, and therefore NOT demand a 3.3.2 instruction for them.

## Attribute tuple
- **content-domain:** online banking / credit-union account
- **UI-component / pattern:** read-only display styled as a text field (`contenteditable=false`) + combobox-styled dialog-trigger button + one real search input
- **host-language construct:** `<div contenteditable="false" aria-readonly="true">`, `<button aria-haspopup="dialog">`, `<input type="search">` with label + `aria-describedby`
- **locale / i18n:** en-US (USD)
- **failure-mechanism:** none — the failure being guarded against is an *evaluator* over-flag: treating an input-styled output/opener as a data-entry field

## Developer persona
A bank front-end dev used a shared "field" CSS class for visual consistency, so the balance display and the period selector inherit the exact look of the real input. They did this for design uniformity, fully aware the balance is output and the period control opens a picker dialog. The trap is purely perceptual: anyone (or any model) judging "is this a form field?" by how it looks will mis-classify these as inputs and wrongly demand labels/instructions for them.

## Element / selector carrying the issue
No failing element. In-scope + satisfied: `#txn` (real `input[type=search]`) with `label[for="txn"]` + `#txn-hint`. Input-LOOKING but OUT of scope (must NOT be flagged): `#amount-display` (read-only `contenteditable=false` display) and `#period-trigger` (dialog-opener button). Plus ordinary action controls: `Download PDF`/`Dispute` links, `#printS`.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user, `#amount-display`:** exposed as the labelled static text "Current balance, $2,418.05" — it has no editable/textbox semantics, so the user is never told "edit text"; nothing prompts data entry. 3.3.2 has no field here to require an instruction for.
- **Screen-reader user, `#period-trigger`:** announced "Statement period, Jun 2026, button, has popup dialog, collapsed." Activating it opens "Choose a statement period, dialog" with six statement *links*. This is navigation, not data entry.
- **Screen-reader user, `#txn`:** "Search transactions, search, Enter a merchant name or amount, e.g. Costco or 49.99. Searches this statement only." — label + instruction reach the user. In scope, satisfied.
- **Keyboard user:** Tab reaches the period button (opens dialog), the search input (typeable), and the action links/buttons; the balance display is not in the tab order and cannot be edited.
- Net: the only data-entry control is labelled and instructed; the input-LOOKING controls are output/navigation and correctly out of scope. **Pass.**

## Expected ACT-style outcome
**passed** (SC 3.3.2 — the one data-entry control has a visible label and instruction; the balance display and period selector are not data-entry controls and 3.3.2 does not apply to them, despite their input-like styling).

## Why automated tools miss it
axe/WAVE/Lighthouse will not raise a 3.3.2 issue: a `contenteditable="false"` `<div>` is not an `<input>` (no "missing label" rule fires), and the period control is a named `<button>`. But the inverse risk — a human or model over-flagging these because they *look* like text boxes — is exactly the judgment automated tools cannot adjudicate. Deciding that an element which visually resembles a filled input is in fact read-only output (or a dialog-opener) requires reasoning about role, editability, and behaviour, not reading an attribute. This fixture stresses that scope judgment: only `#txn` is data entry, and it is satisfied.

## Citation
> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent)

> "EXCLUDE disabled input elements (they do not receive keyboard focus, cannot be selected, cannot be modified)."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Identify Content) — by the same logic, a non-editable read-only display that cannot be modified is not part of the data-entry population.

> "A website provides a global search field in the header of the site. Any term can be entered, so there are no instructions needed, but the field needs a cue to communicate its purpose."
— wcag-understanding/labels-or-instructions.html (Examples) — the search field is the in-scope control and is given a label plus an instruction.
