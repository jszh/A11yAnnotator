# case-04 — Price-range filter: max box named only by the "–" separator (true F86 failure)

## Scenario
A rental-listings site ("Holloway & Pike Lettings") has a search panel with a **price-range**
filter — one logical "from–to" value split into two boxes, a **minimum** monthly rent and a
**maximum** monthly rent, rendered `$ 1200 – $ 1800`. The author wrote the visible
`<label>Price range</label>` as `<label for="price-min">`, so it names **only the first
(minimum) box**. The maximum box has no label of its own — the only `<label>` pointing at it
is the **en-dash separator**: `<label for="price-max">–</label>`. The maximum box therefore
has a programmatically determined name, but that name is the single character "–". One
subfield of the multi-part field has **no name that identifies it as a field**, only
punctuation. This is the F86 failure condition, not the "present-but-ambiguous name" variant —
here the maximum box genuinely lacks a real name.

## Attribute tuple
- **content-domain:** real-estate / rental-listings search filter
- **UI-component / pattern:** two-input price-range ("min – max") control in `role="group"`
- **host-language construct:** F86 Example 3 — whole-field `<label>` wired to the FIRST part only; the second part's only associated `<label>` is the "–" separator (name = punctuation)
- **locale / i18n:** en-US
- **failure-mechanism:** a subfield with NO identifying name — its accessible name is the separator "–" (true F86 failure: "not a name for each of the … fields")

## Developer persona
A developer building the search panel added a visually-hidden `<label for="price-min">Price
range</label>` so the first box "had a label," then styled the en-dash between the two boxes.
To make that dash sit neatly in the flow they reused a `<label>` element for it and — because
a stray `for` attribute autocompleted — left it as `<label for="price-max">–</label>`,
accidentally making the separator the maximum box's label. The CI accessibility scan stayed
green because, to the tool, every input now resolves to a non-empty `<label>`; nobody noticed
the maximum box's "label" was a dash.

## Element / selector carrying the issue
- First box: `#price-min` (`value="1200"`), named by the visually-hidden
  `label[for="price-min"]` → accessible name **"Price range"** (the whole-field label, on the
  first part only — F86 Example 3).
- Second box: `#price-max` (`value="1800"`), whose ONLY associated label is
  `label.sep[for="price-max"]` containing the en-dash → accessible name **"–"**.
- The `$` currency marks are decorative `<span aria-hidden="true">`.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user tabbing the group hears: "Price range group. Price range, edit, 1200.
Dash, edit, 1800." (or, depending on punctuation handling, "edit, 1800" with no spoken name
at all). The first box claims the whole "Price range" name; the second box is announced only
as the separator "–". A user landing on the second box — via Tab, or via a forms-elements
list — has no way to know it is the **maximum** price: it has no name identifying it as a
field. This is precisely F86's documented experience where assistive technology names a
subfield with stray punctuation rather than a real label. The maximum box is, for naming
purposes, an undefined field.

## Expected ACT-style outcome
**failed** — SC 4.1.2 (F86). The second subfield (`#price-max`) has no programmatically
determined name that identifies it as a field; its name is the "–" separator. Per F86's
procedure, check #1 ("is there a programmatically determined name for the field") is, in
substance, not satisfied for this subfield — its name is punctuation, "which is not very
useful," so the failure condition applies. ACT rule **e086e5** ("Form field has non-empty
accessible name") reports *passed* for both inputs because "–" is technically non-empty, which
is exactly why automation does not surface the failure.

## Why automated tools miss it
Verified with axe-core 4.10.3 over `file://`: axe reports **zero** name-related findings. Its
`label` rule **passes** for both inputs (each is associated with a non-empty `<label>`), it
raises no `aria-input-field-name` violation, and — because the name comes from a real
`<label>` rather than a `title`/`aria-describedby` — it does **not** even fire the
`label-title-only` best-practice rule. The only violation is the unrelated `region`
best-practice. e086e5 / axe / WAVE / Lighthouse all treat "–" as a valid non-empty name.
Recognising that "–" is a visual **separator**, not a name that identifies the maximum-price
field — and that the "Price range" label covers only the minimum box, leaving the maximum box
effectively unnamed — is a human semantic judgment no per-field non-emptiness check expresses.

## Citation
**Reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not providing
names for each part of a multi-part form field, such as a US telephone number*
(`wcag-techniques/failures/F86.html`).

Failure mechanism (Example 3 — label on the first part only):

> "In this case, the label is programmatically associated with the first part."

The punctuation-as-name experience this page reproduces:

> "The failure occurs when there is not a name for each of the three fields in the
> Accessibility API. A user with assistive technology will experience these as three undefined
> text fields. Some assistive technologies will read the punctuation as identification for the
> text fields, which can be even more confusing. In the case of a three-field US phone number,
> some assistive technologies would name the fields "(", ")" and "-", which is not very
> useful."

Test procedure and result:

> "Check that there is a programmatically determined name for the field."

> "If check #1 is false for any subfield, then the failure condition applies and the content
> fails the success criterion."

**Supporting reference:** Understanding SC 4.1.2 — *Name, Role, Value*
(`wcag-understanding/name-role-value.html`):

> "Success Criterion 4.1.2 Name, Role, Value requires a programmatically determinable name for
> all user interface components. Names may be visible or invisible."
