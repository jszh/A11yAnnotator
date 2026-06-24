# case-02 — Government search field bounces focus to `<body>` on every Tab-in (`onfocus` → `document.body.focus()`)

## Scenario
A German municipal services portal ("Bürgerservice Rheinstadt"). The service-search box is a valid `type="search"` input with a remembered last query ("Personalausweis") and a working "Suchen" button. A mis-wired "select text on focus" helper instead calls `document.body.focus()` whenever the box receives focus while holding the remembered value. Every Tab into the search field instantly bounces focus to `<body>` (which was made focusable via `tabindex="-1"`). The field is in source and is labelled, but a keyboard user can never land in it to type.

## Attribute tuple
- **content-domain:** government / e-government citizen-services portal
- **UI-component / pattern:** site search (`<input type="search">` + submit button)
- **host-language construct:** inline `onfocus` calling a JS helper that does `document.body.focus()` (focus moved to another element, not `this.blur()`)
- **locale / i18n:** de-DE (German UI text; `<html lang="de">`)
- **failure-mechanism:** F55 variant — focus relocated to a different (non-operable) element, `<body>`, on receipt

## Developer persona
An agency developer added a "select all on focus so users can overtype the saved query" convenience. They copied a guard clause from an unrelated "dismiss this field" helper that called `document.body.focus()`, and wired it into the early-return branch by mistake. Because the box ships with a remembered query, the buggy branch fires on the very first focus, throwing focus to the body every time.

## Element / selector carrying the issue
`#q` (the `<input type="search" onfocus="selectOnFocus(this)">`); the helper calls `document.body.focus()`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The input is a valid, labelled `type="search"` control (associated `<label for="q">`). Role and name are correct.
- A keyboard user Tabs into the search field. The `focus` event fires; `selectOnFocus` sees a non-empty, untouched value and calls `document.body.focus()`. Because `document.body.tabIndex = -1`, the body is programmatically focusable, so focus genuinely moves there and is silently lost (no visible ring, no control).
- The user cannot type a query: focus will not rest in the box. The only keyboard path to search is the "Häufig gesucht" quick links, which is not the same function as free-text search.
- A screen-reader user trying to enter the search field is bounced to the page body with no announcement.

Verified with Puppeteer: `el.focus()` on `#q` ends with `document.activeElement === document.body` (`rests=false`, `landedOn=body`).

## Expected ACT-style outcome
**failed** (SC 2.1.1 — the search field is in the tab order but focus is removed/relocated on receipt, so the free-text search function cannot be operated by keyboard).

## Why automated tools miss it
Static scanners see a correctly labelled `type="search"` input and a valid submit button — zero markup errors. The focus theft only occurs at runtime when the `focus` event fires AND the field still holds its remembered value (a stateful, conditional behaviour). A linter cannot know the helper calls `document.body.focus()`, nor that `document.body` was made focusable via a script-set `tabindex="-1"`. There is no static signature for "focus moves to body on receipt"; reproducing it needs actually tabbing into the field and watching focus leave. The i18n shell (German labels) is irrelevant to the defect, which further hides it from text-pattern heuristics.

## Citation
> "Content that normally receives focus when the content is accessed by keyboard may have this focus removed by scripting."
— wcag-techniques/failures/F55.html (Description)

> "Use the keyboard to operate identified functionality and/or access the essential information: tab to the element and execute (e.g., press Enter with focus on the element)."
— refs/trusted-tester/sc-2.1.1-keyboard.md (Test 4.A — How to Test; here you cannot keep focus on the field to type, so the function is not keyboard-executable)

> "Check that the web page does not fail WCAG 2.2 Success Criterion 2.1.1 Keyboard according to WCAG Conformance Requirements stated in clause 9.6."
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.2.1.1 — SC 2.1.1, Procedure)
