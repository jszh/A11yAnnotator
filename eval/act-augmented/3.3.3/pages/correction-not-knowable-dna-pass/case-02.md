# case-02 — Contrast page: enumerable "Purchase month" text field (FAIL) next to free-text "Anything else" (PASS), both showing only "Required"

## Scenario
A warranty-registration form rendered in its **post-submit error state**. Two fields are flagged with structurally identical, correctly associated errors of the form *"[field name] — Required."* The judge must apply the **knowability gate per field**:
- **Purchase month** is a free-text input whose correct value is one of exactly twelve known strings (January…December). A suggestion is *knowable* ("Choose one of: January, February, …"), but only "Required" is shown — so this field **FAILS** SC 3.3.3.
- **Anything else we should know?** is an open prose textarea whose correct value is whatever the customer types. No suggestion is knowable, so "Required" is the conformant maximum — this field **PASSES**.

Because the Month field fails, the page as a whole **fails**. The two errors look identical to a tool; only a semantic judgment about each field's nature separates them.

## Attribute tuple
- **content-domain:** consumer hardware / warranty registration
- **UI-component / pattern:** side-by-side `<input type="text">` (enumerable) and `<textarea>` (free-text), each with `aria-describedby` inline error, plus a `role="alert"` error summary
- **host-language construct:** TEXT input for month (NOT a `<select>`, so the twelve allowed values are not exposed by the control) vs. free `<textarea>`
- **locale / i18n:** en-US
- **failure-mechanism:** knowable suggestion withheld on the enumerable field (Month), contrasted against a conformant generic message on the un-inferable field (notes)

## Developer persona
An agency dev themed a generic form template for the manufacturer. The template's validator emits one message for every required field: "[label] — Required." It works fine for the free-text notes field. The dev made "Purchase month" a plain text box (rather than a `<select>` of twelve months) to "keep the row compact," not realizing that turning an enumerable choice into free text — while still only saying "Required" — means the system is withholding a list of allowed values it obviously knows. The mistake arose from treating all required fields as interchangeable.

## Element / selector carrying the issue
- FAIL: `#month` (enumerable text field) with error `#error-month` saying only "Purchase month — Required." A list of the twelve valid months is knowable and not provided.
- PASS contrast: `#notes` (free-text) with `#error-notes` saying only "Anything else we should know? — Required." No suggestion is knowable, so this is conformant.

## Exact accessibility mechanism (what AT experiences / why it fails on Month)
- **Screen-reader user on Month:** hears "Purchase month, edit, invalid entry, Purchase month — Required." They know the field is required but get no hint that the answer must be a month name, no list of the twelve valid values, and no example. Because the field is a text box (not a `<select>`), the allowed set is nowhere in the accessibility tree. A cognitively-loaded user may type "11", "Nov.", "last winter" — all rejected — with no guidance toward the known correct set. The system *could* suggest ("Choose one of: January … December") but does not. -> FAIL.
- **Screen-reader user on notes:** hears "Anything else we should know?, edit, invalid entry, … Required." That is the complete and correct information; there is no knowable suggestion to add. -> PASS.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the page contains at least one field, Purchase month, where suggestions for correction are knowable (an enumerable list of months) but only a generic "Required" is shown. The free-text notes field passes the gate, but a single failing field fails the criterion for the page).

## Why automated tools miss it
The two errors are structurally identical — same markup, same `aria-describedby` wiring, same "[label] — Required" string. axe/WAVE/Lighthouse confirm both are well-formed and cannot rank them. No tool models that "Purchase month" has an *enumerable* correct set (twelve known values, a knowable suggestion) while "Anything else" is open prose (no knowable suggestion). The per-field knowability decision — and therefore which of two identical-looking errors is a failure — is a semantic call about field meaning that automated tooling does not perform.

## Citation
> "An input field requires that a month name be entered. If the user enters \"12,\" suggestions for correction may include: A list of the acceptable values, e.g., \"Choose one of: January, February, March, April, May, June, July, August, September, October, November, December.\""
— wcag-understanding/error-suggestion.html (Examples — "Suggestions from a Limited Set of Values") — the month field is WCAG's own example of a knowable suggestion; withholding it is a fail.

> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — this DNA applies to the free-text notes field (PASS) but NOT to the enumerable month field (FAIL).

> "When input must be one of a set of allowed values, the text description should indicate this fact. It should include the list of values if possible, or suggest the allowed value that is most similar to the entered value."
— wcag-techniques/general/G84.html (Description) — the month field's correct value is one of a set of allowed values, so the list should be provided; only "Required" is shown.
