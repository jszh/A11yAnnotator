# case-05 — i18n / RTL: visible Arabic "رقم الهوية الوطنية" but accessible name "field2"

## Scenario
An Arabic-language (RTL) government e-services portal for renewing a residence permit. The national-ID
field has a correctly associated Arabic `<label>` reading **"رقم الهوية الوطنية"** ("National ID
number"), with a hint giving the data requirement (ten digits). But the `<input>` carries
`aria-label="field2"` (a leftover English scaffold slug), which **overrides** the associated `<label>`
in the name computation. The computed accessible name is **"field2"**. The two surfaces diverge both
in *descriptiveness* (clear Arabic label vs. meaningless slug) AND in *language* (page-language Arabic
vs. stray Latin English).

## Attribute tuple
- **Content domain:** government / civic services portal
- **UI component / pattern:** native text input with associated `<label for>` + numeric hint
- **Host-language construct:** `<html lang="ar" dir="rtl">`; `<input aria-label="field2">` overriding
  an Arabic `<label for>`
- **Locale / i18n:** ar (RTL); mixed-language defect (Latin slug inside an Arabic UI)
- **Failure mechanism:** `aria-label` overrides a descriptive translated `<label>`; divergence type =
  **VISIBLE-DESCRIPTIVE / ANNOUNCED-VAGUE**, compounded by **untranslated mixed-language** name
- **ARIA anti-pattern (facets.json):** "aria-label overrides/contradicts the visible text label";
  i18n facet: "translated UI where title/label not translated (mixed language)"

## Developer persona
A localization contractor translated all visible `<label>` text into Arabic, but the component's
original English `aria-label="field2"` scaffold attribute was not in the i18n string table (only
visible text nodes were extracted for translation). The slug therefore survived localization and now
*is* the accessible name an Arabic screen reader announces.

## Element / selector carrying the issue
`input#nid` — visible label (via `for="nid"`) is "رقم الهوية الوطنية"; `aria-label="field2"` computes
the accessible name. Verified in Chromium: `role=textbox`, `accName="field2"`,
visible Arabic label rendered RTL.

## Exact accessibility mechanism
`aria-label` precedes the associated `<label>`, so the accessible name is "field2". An Arabic screen
reader (e.g. NVDA/VoiceOver in Arabic) announces the meaningless Latin token "field2" instead of
"رقم الهوية الوطنية", giving the blind user no idea the field expects a national ID (or its 10-digit
format). A voice-control user who speaks the visible Arabic words cannot target the control, since the
accessible name they must speak is the hidden English "field2". The field is correctly labelled for
sighted users and passes 3.3.2 (a label exists) and 4.1.2 (non-empty name), so only 2.4.6's
descriptiveness of the announced label fails — and only on the AT surface, with the language mismatch
making it worse.

## Expected ACT-style outcome
**failed** — TT 5.B (`2.4.6-label-descriptive`): the announced label "field2" does not let users know
what input data is expected. The name and phone fields have no override and pass.

## Why automated tools miss it
The field HAS a non-empty accessible name ("field2") and a correctly associated `<label>`, so 4.1.2
and label-presence checks pass — verified: a full `axe.run` (default + `label-content-name-mismatch`)
reports **0 violations**. Automated tools do not evaluate whether "field2" is descriptive, nor do they
flag that the accessible name is in a *different language* than the page (`lang="ar"`) and the visible
label — judging "field2" as non-descriptive, and recognizing the eye/AT divergence, requires reading
both surfaces and the field's purpose, a human semantic + linguistic call. (A `lang`-mismatch on an
attribute value like `aria-label` is not something axe checks.)

## Citation
> "Form input controls with labels that clearly and accurately describe the content that is expected
> to be entered helps users know how to successfully complete the form."
— WCAG 2.2 Understanding, *Headings and Labels*, Benefits (`wcag-understanding/headings-and-labels.html`).
> The announced label "field2" does not clearly or accurately describe the expected national-ID input.
