# case-05 — Tax-ID format hint reveals on focus but its content is a missing-i18n-key fallback of a single non-breaking space, so a styled callout flickers in on focus that conveys no instruction

## Scenario
A business-onboarding (billing setup) page for a multi-country invoicing SaaS (Faktura). The Tax-ID
field requires a country-specific format, so the format hint is the field's only instruction; the
visible `<label>` reads just "VAT / Tax identification number" and states no format. Per the
focus-revealed pattern, a styled hint callout reveals on focus, meant to be populated from the active
locale's string table via `data-i18n="hint.taxid.format"`. That string is missing from the `en` table,
and the templating layer's fallback for a missing key is a single non-breaking space (`&nbsp;`, so the
box keeps its height and doesn't collapse). On focus the callout genuinely appears — a bordered box
with padding flicks into view — but its entire content is U+00A0, conveying nothing. This is the
aspect's failure limb (f): the focused instruction appears but contains only a non-breaking-space
placeholder.

## Attribute tuple
- **content-domain:** SaaS billing / invoicing (cross-border business onboarding)
- **UI-component/pattern:** focus-revealed format callout populated from an i18n string table
- **host-language construct:** `<input type="text">`, `#taxid:focus ~ .taxid-hint { display:block }`, hint element `data-i18n="hint.taxid.format"` whose text content is the literal `&nbsp;` fallback; `aria-describedby` on the input
- **locale/i18n:** en active locale, but a Swedish business (`Nordström Verkstad AB`) — the cross-border setup is exactly why a country-specific format hint is needed, and exactly where a missing translation key slips through
- **failure-mechanism:** missing i18n key — the format string was never added for `en`, and the missing-key fallback emits a non-breaking space, so the revealed hint is a non-empty but meaningless text node

## Developer persona
A developer wired the hint to the i18n system so the Tax-ID format could vary by jurisdiction, but the
`hint.taxid.format` key was only ever added to the design-mock locale, not to the shipped `en`
catalog. The i18n helper's policy for a missing key (chosen long ago to stop layout boxes collapsing
during translation rollout) is to return a single `&nbsp;` rather than an empty string or the raw key
name. So the missing translation degrades silently into a visible-but-empty callout instead of an
obvious "[hint.taxid.format]" — which would have been caught — and QA, testing only the locale that
had the string, never saw the gap.

## Element / selector carrying the issue
`#taxid` (the Tax-ID input) and its hint `#taxid-hint.taxid-hint` (`data-i18n="hint.taxid.format"`),
whose rendered content is a single non-breaking space. On focus `#taxid:focus ~ .taxid-hint` makes the
box `display:block`, but it has no instruction text.

## Exact accessibility mechanism (what AT experiences, why it fails)
The country-specific format is the only instruction telling the user how to type their VAT/Tax number.
On focus, a sighted user sees a styled callout box appear under the field — implying an instruction is
present — but it contains only a non-breaking space, so it tells them nothing about the required
format. A screen-reader user whose AT follows `aria-describedby="taxid-hint"` is pointed at a node
whose only content is U+00A0; depending on the screen reader this is announced as "blank" or as a
space, i.e. no instruction. Either way, the field's only instruction is effectively absent: focus
reveals a box that flickers in and conveys nothing, so the user has no format guidance for a
non-obvious, jurisdiction-dependent identifier. The promise of a focus-revealed instruction is made
(a box appears) but not honored (it is empty of meaning).

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The input has a correct, associated `<label>` ("VAT / Tax identification number"), so axe / WAVE /
Lighthouse pass it on the form-label check — this is not a missing-accessible-name case. The hint is
also not an empty element a linter would flag: its text content is a non-breaking space (U+00A0), a
non-empty text node, so emptiness heuristics that treat whitespace-only / zero-length content as a
problem do not fire on `&nbsp;`. (Many tools and AT explicitly count `&nbsp;` as content, which is why
authors use it as a layout-preserving fallback.) No automated checker reads the focus-revealed callout,
recognizes that a non-breaking space carries no instruction, or judges that the field's only
instruction is meaningless. Recognizing that the box says nothing requires reading the rendered focused
state and a human judgment that U+00A0 is not an instruction.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Instructions or labels may also specify data formats for data entry fields, especially if they are
> out of the customary formats or if there are specific rules for correct input."

> **WCAG 2.2 Understanding 3.3.2 (Examples), `wcag-understanding/labels-or-instructions.html`:**
> "On this website additional instructions would need to accompany the field to prevent users from
> encountering unnecessary errors."

(A jurisdiction-specific VAT/Tax-ID format is exactly the "specific rules for correct input" the
Understanding describes, and additional instructions are needed to prevent errors. Here the
focus-revealed instruction box appears but contains only a non-breaking space, so no instruction
actually accompanies the field — the focus limb is not honored.)
