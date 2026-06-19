# SC 1.3.1 Info and Relationships (Level A) — TT Tests 5.C, 10.B, 10.C, 10.D, 14.A, 14.B, 14.C

**TT sections:** 5. Forms, 10. Content Structure, 14. Tables · **Baselines:** 10/13/12/18
**WCAG SC 1.3.1:** Information, structure, and relationships conveyed through presentation can be programmatically
determined or are available in text.

1.3.1 is TT's most-distributed SC: programmatic form labels (5.C), heading determinability + level (10.B/10.C),
list type (10.D), and data/layout table structure (14.A/14.B/14.C).

---

## Test 5.C — `1.3.1-programmatic-label` (Forms)
**Test Condition:** *The combination of the accessible name, accessible description, and other programmatic
associations (e.g., table column and/or row associations) describes each input field and includes all relevant
instructions and cues (textual and graphical).*
**DNA** if the page does not have form elements. *(Also covers 4.1.2 — see `sc-4.1.2-name-role-value.md`.)*

### How to Test
1. Launch **ANDI: focusable elements** (default selection).
2. Use ANDI's next/previous element buttons to highlight each focusable form element and review the ANDI output.
3. Review the ANDI Output for each focusable form field.
4. If the ANDI Output does not adequately define the form element, review **other programmatic associations**
   (table headings, location in a hierarchical list structure) to determine whether they provide/contribute to
   the form component's description, cues, or instructions.
   - a. Where the purpose is intentionally vague/ambiguous (e.g., "Door 1/2/3" surprise), the combination may
     refer to its purpose vaguely.

### Evaluate Results (PASS if ANY true)
1. ANDI Output includes all relevant instructions and cues for the form element, including when fields are
   required, OR
2. Descriptive labels and cues are provided by other programmatic associations (e.g., table column/row), OR
3. A combination of ANDI Output AND other programmatic association includes all relevant instructions and cues, OR
4. The combination of the programmatically determined form element context and the ANDI Output provide adequate
   description of its purpose.

### Notes
- Also covers **WCAG SC 4.1.2 Name, Role, Value**.
- At minimum, **radio buttons and checkboxes** should be programmatically associated with their question and
  response.
- Form fields are **not required** to have programmatic associations with form section headings unless there is
  significant risk of confusion.

---

## Test 10.A → see `sc-2.4.6-headings-and-labels.md` (heading purpose is 2.4.6, not 1.3.1)

## Test 10.B — `1.3.1-heading-determinable` (Content Structure → Headings)
**Test Condition:** *Each programmatically determinable heading is a visual heading and each visual heading is
programmatically determinable.*
**DNA** if the page has no programmatic headings identified by ANDI **and** has no visual headings.

### Identify Content
1. Identify all **visually apparent** headings (often larger/bolded font, extra spacing — though not always).
   Note the hierarchy/structure of each heading relative to others.
2. Use **ANDI: structures** → "headings" button to identify all programmatically defined headings
   (`<h1>`–`<h6>` or `role="heading"`). ANDI adds dotted outlines around each identified, visible heading.

### How to Test
1. Select ANDI: structures, review ANDI Output for each visually apparent heading. ANDI outlines all headings
   with a dotted purple line. If ANDI does not identify a visually apparent heading → not defined programmatically.
2. Review each heading identified by ANDI to determine if it is also a visually apparent heading.
3. Review the ANDI Output for each heading to determine if it matches the visual heading. If they do not match →
   the heading is not properly defined programmatically.

### Evaluate Results (PASS if ALL true)
1. Each programmatically determinable heading is serving as a visual heading on the page, AND
2. Each visual heading is programmatically defined.

> *Note:* content that is not a visual heading should not have a role of heading (e.g., don't use heading markup
> for emphasis). Conversely, content styled and functioning like a heading should be programmatically a heading.

---

## Test 10.C — `1.3.1-heading-level` (Content Structure → Headings)
**Test Condition:** *Programmatic heading levels logically match the visual heading presentation within the
heading structure.*
**DNA** if programmatic headings are not identified by ANDI.

### How to Test
1. Launch **ANDI: structures** → "view headings list" to display the Structure Outline.
2. Mouse over or tab through each heading in ANDI's Structure Outline to review the ANDI Output for each heading.
   - a. If ANDI identifies **heading level conflicts between aria and HTML markup, the aria heading levels take
     precedence**. Continue using the aria heading levels.
3. Compare the heading levels in the Structure Outline to the page content. Determine whether the heading levels
   logically match the visual heading presentation within the heading structure.
   - a. On pages with only one heading, that heading can have any level.
   - b. The most important heading(s) should have the highest priority level (h1 > h2 > h3).
   - c. Headings with an equal or higher level start a new section; lower-level headings start subsections.
   - d. A heading level 1: is not required, can be used more than once, is not required to match the page title.
   - e. Heading levels may not always be in sequence but may be valid as related to the visual
     structure/importance (e.g., an `<h2>` for a nav structure preceding an `<h1>` title; `<h3>` then `<h5>`
     without `<h4>` can be acceptable).

### Evaluate Results (PASS if)
1. Every programmatically identified heading level logically matches the visual heading structure on the page.

---

## Test 10.D — `1.3.1-list-type` (Content Structure → Lists)
**Test Condition:** *All visually apparent lists are programmatically identified according to their type.*
**DNA** if there are no visually apparent lists. **Exclude navigational framework elements** unless they appear
as numbered or bulleted lists.

### Identify Content
Identify all **visually apparent** lists, especially in the main content area.
- This test applies to **visually apparent lists, NOT** programmatic lists identified by ANDI. **ANDI should NOT
  be used to identify lists to be tested** — only to evaluate whether visually apparent lists are properly coded.
- Menus/navigation framework elements should normally be **excluded** (even if coded as lists with bullets
  removed), unless they appear as numbered or bulleted lists.

### How to Test
1. Launch **ANDI: structures** → "lists" button.
2. For each visually apparent list, review "List Elements" to confirm it is coded correctly as ordered,
   unordered, or description list.
   - **Ordered** (`ol`) — numbered sequentially / hierarchically (1, 2, 2.a, 2.a.i) where sequence or
     reference-by-number matters.
   - **Unordered** (`ul`) — not numbered; sequence/reference not important.
   - **Description list** (`dl`) — groups terms with their descriptions.
3. Review the visual representation of list relationships (order, hierarchy, nesting) vs the programmatic list
   definitions in ANDI. ANDI identifies each nested list separately ("Inspect Next Element").

### Evaluate Results (PASS if ALL true)
1. All content with the visual appearance of a list is defined programmatically as a list, by type:
   a. Unordered list (with/without bullets) → `ul`; b. Ordered list → `ol`; c. Terms+descriptions → `dl`.
   AND
2. All programmatic list relationships (nesting, hierarchies) are consistent with the list relationships
   presented visually.

> *Note:* Not all lists require markup — a list of items in a sentence separated by commas need not be a
> bulleted/numbered list.

---

## Test 14.A — `1.3.1-table-identification` (Tables → Data Tables)
**Test Condition:** *Each data table has programmatic markup to identify it as a table.*
**DNA** if there are no data tables on the page.

### Identify Content
Identify all **data tables** (including images of data tables) where data cell(s) require header(s) for
understanding. Use ANDI: structures → "reading order" to assist. **EXCLUDE** content that does not require a
row/column header for understanding (layout tables; CSS-presented content sensible in reading order).

### How to Test
1. Launch **ANDI: tables**. Determine whether ANDI detects and identifies the data table(s). ANDI identifies any
   non-hidden tables coded using `<table>`, `role="table"`, or `role="grid"`.
   - i. If the tables module is not in the selection list, ANDI detected no programmatic table.
   - ii. Use "Analyze Next Table" to sequentially highlight detected tables. If the table is not outlined / not
     navigable in ANDI → not detected programmatically.
2. Review any data tables that use `role="presentation"` (ANDI shows it in Element info / Accessibility Alerts).
   A data table with `role="presentation"` will not convey table semantics and **fails** this test.
3. ANDI displays an alert whenever `role="table"` is not coded correctly.
4. Use Analyze Previous/Next Table to navigate to each identified table.

### Evaluate Results (PASS if ALL true)
1. It is possible to navigate in ANDI: tables to each data table, AND
2. The data table does NOT have an ARIA `role="presentation"` assigned, AND
3. The data table does NOT have any ANDI Table alerts for incorrect use of ARIA table attributes.

---

## Test 14.B — `1.3.1-cell-header-association` (Tables → Data Tables)
**Test Condition:** *All data cells are programmatically associated with relevant headers.*
**DNA** if there are no data tables on the page.

### How to Test
1. Continue from Test 14.A.
2. Navigate to each data cell with **ANDI: tables**.
3. Inspect the ANDI Output for each data cell and/or the visual highlighting to determine whether the table
   identifies **all relevant headers** for each data cell.

### Evaluate Results (PASS if)
1. The data table appropriately identifies header relationships for each data cell.

---

## Test 14.C — `1.3.1-layout-table-structure` (Tables → Layout Tables)
**Test Condition:** *The layout table DOES NOT designate the layout table using ARIA `role="table"` AND DOES NOT
include table header structure and relationship elements and/or associated attributes.*
**DNA** if there are no layout tables on the page.

### Identify Content
Identify any programmatic tables where the table structure is used purely for **layout** purposes.
**EXCLUDE** data tables. Content within a layout table does not require row/column headers and should be sensible
when read in the ANDI reading order.

### How to Test
1. Continue from Test 14.A.
2. Inspect the "Element" output in ANDI to determine whether the layout uses `role="table"`.
3. Inspect the ANDI output and any associated alerts to determine whether a `<table>` includes header structure
   elements/attributes (e.g., `<th>`, `scope="row"`).
   - a. If a table has `role="presentation"` and also denotes header relationships (e.g., `<th scope="row">`),
     ANDI provides an alert; **ignore this alert on a layout table** (presentation role suppresses semantics).

### Evaluate Results (PASS if ANY true)
1. ANDI does NOT detect the layout as a table, OR
2. The `<table>` element includes `role="presentation"`, OR
3. BOTH: the layout does NOT use `role="table"`/associated ARIA table attributes AND does NOT include table
   structure/relationship elements or attributes (e.g., `<th>`, `scope="row"`).
