# case-03 — Email-signature generator: 3-column contact card faked with TAB chars in a read-only `<textarea>`

## Scenario
A self-service "Team Email Signature" tool outputs a ready-to-paste signature in a read-only
`<textarea>`. The signature is a directory card: each clinician's row aligns three columns — Name |
Title | Phone — using literal TAB characters (with `tab-size:12` and a monospace font). Rendered, it
is a tidy 3-column staff grid. The columnar relationship is carried entirely by the tab stops; there
is no `<table>`, no list, no `role`.

## Attribute tuple
- **Content domain:** workplace / healthcare-practice internal tooling (email signature generator)
- **UI-component / pattern:** read-only output `<textarea>` containing a multi-column contact card
- **Host-language construct:** `<textarea readonly>` with literal `\t` tab characters + `tab-size` + `white-space:pre`
- **Locale / i18n:** en-US
- **Failure-mechanism:** F33/F34 family — TAB white-space characters fake aligned columns; AT collapses tabs and reads each row's three fields as one run-on string

## Developer persona
An office IT admin built a tiny "copy your signature" page for the pediatrics practice. They wrote
the card in a code editor, pressing Tab between Name, Title, and Phone so it "lined up," set
`tab-size` so the columns looked even, and dropped it into a read-only textarea. It looked like a
clean roster, so it shipped — they never heard a screen reader read tabbed text.

## Element / selector carrying the issue
`textarea#sig` — the read-only field whose tab characters fake the Name / Title / Phone columns.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user scans the Title column to find the Medical Director, or the Phone column to grab an
  extension; the tab-aligned grid makes the per-person mapping obvious.
- Screen readers do not announce tab stops as column boundaries. Reading the textarea value, AT
  speaks each row as a single run: *"Dr. Amara Osei Medical Director x4120 / 555-0142"* with no pause
  or relationship marking — and because every row repeats the pattern, the listener cannot reliably
  tell where a name ends and a title begins, or which extension pairs with which person, especially
  once names contain spaces themselves. The visual columns that disambiguate the data are gone; the
  tab character carries meaning the AT discards. The sequence as linearized no longer conveys the
  Name→Title→Phone relationship the layout promises.

Verified intent: the value contains literal U+0009 tab characters between fields; there is no
`<table>`/`role`, so the field is a single linear text node to AT.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — tab white-space characters create aligned columns whose linearization removes
the column relationship and produces an ambiguous reading sequence; F33/F34 family applied to tabs).

## Why automated tools miss it
A read-only `<textarea>` with an associated `<label>` and `aria-describedby` passes form-label,
name, and ARIA checks cleanly. Tab characters are valid content and trip no linter. Automated tools
read the textarea value as a string and have no model of the rendered monospace tab-stop geometry,
so they cannot see the three columns or judge that collapsing the tabs fuses each row's fields into
an ambiguous run-on. Recognizing the faked columns and the scrambled relationship is human visual +
semantic work.

## Citation
> "The objective of this technique is to describe how using white space characters, such as space,
> tab, line break, or carriage return, to format columns of data in text content is a failure to use
> structure properly."
— wcag-techniques/failures/F33.html (Description)

> "When the sequence in which content is presented affects its meaning, a correct reading sequence
> can be programmatically determined."
— refs/trusted-tester/sc-1.3.2-meaningful-sequence.md (WCAG SC 1.3.2 statement)

> "The intent of this success criterion is to enable a user agent to provide an alternative
> presentation of content while preserving the reading order needed to understand the meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
