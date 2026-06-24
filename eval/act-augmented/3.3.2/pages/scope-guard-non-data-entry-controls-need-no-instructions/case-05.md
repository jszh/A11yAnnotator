# case-05 — Recipe site: action menu/disclosures out of scope; ingredient CHECKBOXES are in scope and fail per-option labelling (DISCRIMINATOR, other direction)

## Scenario
A recipe page ("Weeknight miso-glazed salmon"). It is full of non-data-entry controls that must NOT be flagged: a "Recipe actions" menu-button (Print/Save/Share), four expand/collapse method-step disclosures, a "jump to recipe" link, "scale 1×/2×/3×" action toggle buttons, and tag links. The page also has a genuine **data-entry selection control**: an ingredient shopping checklist built from real `<input type="checkbox">`. These checkboxes are exactly what the SC's Intent names as in scope ("checkboxes... that provide users with options"). The defect is at the per-option level: each checkbox's `<label>` is the **quantity only** ("2 fillets", "3 tbsp", "2 cloves", "to taste"); the ingredient **noun** lives in a separate visual column marked `aria-hidden`, so it is not part of any checkbox's accessible name. A user checking the list cannot tell *what* they are selecting. There is also no group label tying the checkboxes to "Add to shopping list." So the checkbox group **fails** 3.3.2 — and only the checkboxes; the menu/disclosures/scale buttons/links are out of scope. This is the boundary in the opposite direction from cases 01–03: a real in-scope selection control that fails, surrounded by out-of-scope controls.

## Attribute tuple
- **content-domain:** restaurant / recipe / food
- **UI-component / pattern:** checkbox group (selection control) + menu-button + disclosure steps + toggle (aria-pressed) scale buttons + links
- **host-language construct:** real `<input type="checkbox">` each with a `<label for>`, but the label is a quantity fragment; ingredient noun in an `aria-hidden` sibling `<span>`
- **locale / i18n:** en
- **failure-mechanism:** per-option labels do not identify what is being selected (the meaningful noun is excluded from the accessible name); no group-level label/instruction

## Developer persona
A food-blog dev built the ingredient list as a 3-column CSS grid (checkbox · quantity · name) for a tidy aligned look, and wired each `<label for>` to only the quantity cell because "the label has to be one element." To stop the screen reader "double-reading," they slapped `aria-hidden="true"` on the name column — accidentally removing the only meaningful word from each option's name. The automated scan stayed green: every checkbox *has* a label. The action menu and step toggles are template parts they (correctly) never treated as fields.

## Element / selector carrying the issue
**Failing (in scope):** `.ing input[type=checkbox]` (#i1–#i6) — each accessible name is a bare quantity ("2 fillets", "1 tbsp", "to taste"); ingredient noun in `.name[aria-hidden="true"]` is excluded; no `fieldset`/`legend` or `role=group` name ties them to the "Add to shopping list" purpose.
**Out of scope (must NOT be flagged):** `#actBtn` + action menu items, `.steps .acc button` (×4), `.scale button` (×3), `#recipe`/`#share`/tag links, "jump to recipe" link.

## Exact accessibility mechanism (what AT experiences / why the checkboxes fail)
- **Screen-reader user, checklist:** arrowing the form controls hears "2 fillets, checkbox, not checked", "3 tbsp, checkbox", "1 tbsp, checkbox", "to taste, checkbox". The labels identify amounts but not *what* the amounts are of. The SC's Intent requires that for options "each option must have an appropriate label so that users know what they are actually selecting" — here they do not. The meaningful noun ("skin-on salmon", "white miso paste") is `aria-hidden` and never announced.
- **Cognitively-loaded user:** sees the noun visually but, on a small screen where the columns wrap, "to taste" or "2 cloves" alone is ambiguous; nothing instructs that the checkbox selects that ingredient for a shopping list.
- **Screen-reader user, out-of-scope controls:** "Recipe actions, button, has popup menu"; "Step 1 — Make the glaze, button, collapsed"; "1×, button, pressed". These are actions/disclosures/toggles — not data entry — and owe no 3.3.2 instruction.
- Net: the in-scope selection control's per-option labels fail to convey what is selected. **Fail — on the checkbox group only.**

## Expected ACT-style outcome
**failed** (SC 3.3.2 — the ingredient checkboxes are data-entry selection controls whose per-option labels do not let the user know what they are selecting, and the group has no label/instruction; the action menu, step disclosures, scale toggles, and links are not data-entry controls and are out of scope).

## Why automated tools miss it
Every checkbox **has** an associated `<label>` element, so axe's "form elements must have labels" check PASSES — no automated tool flags this. The failure is semantic: the label "2 fillets" is present but does not tell the user *what* is being selected because the ingredient noun is excluded from the accessible name (it is in an `aria-hidden` adjacent column). Judging that a present, well-associated label nonetheless fails "so that users know what they are actually selecting" requires understanding the meaning of the option — a contextual judgment. Tools also cannot tell that the surrounding menu-button, disclosures, and scale toggles are correctly out of scope. This fixture exercises both edges of the scope boundary at once.

## Citation
> "In the case of radio buttons, checkboxes, comboboxes, or similar controls that provide users with options, each option must have an appropriate label so that users know what they are actually selecting."
— wcag-understanding/labels-or-instructions.html (Intent)

> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent) — the action menu and step disclosures are out of scope.

> "Use ANDI: focusable elements to identify any form elements on the page (buttons, text fields, radio buttons, checkboxes, read-only fields, multi-select lists)."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Identify Content) — the checkboxes are part of the form-element population; the menu/disclosure buttons, while focusable, are not data-entry controls subject to 3.3.2.
