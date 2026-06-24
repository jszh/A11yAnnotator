# case-03 — The NPI fix (Section 1) is printed inside Section 3 under the license field, where it reads as license guidance

## Scenario
A provider-credentialing portal (MeridianCare Network). In **Section 1 — Provider identifiers**
the provider's NPI `13499283` (8 digits) is invalid. The field's own message is bare — "Please
review this entry." — with no suggestion. The **correct, adequate suggestion** for the NPI ("Your
NPI must be exactly 10 digits with no spaces or dashes (for example, 1346548275). Re-enter it
without the leading zeros stripped.") is rendered far below, inside **Section 3 — Licensure**,
directly under the **State license number** field. Spatially and semantically it reads as a tip
about the license number, not the NPI. The suggestion is right; it is attached to the wrong field
in the wrong section.

## Attribute tuple + developer persona
- **content-domain:** healthcare / provider credentialing portal
- **UI-component/pattern:** multi-section (3-panel) attestation form with a step rail and per-panel help boxes
- **host-language construct:** `input#npi[aria-invalid="true"][aria-describedby="npi-err"]` (bare message) in Section 1; the real suggestion is a `.help` `<p>` inside Section 3's `.field` for `#license`
- **locale/i18n:** en-US; domain-specific format (10-digit NPI)
- **failure-mechanism:** mis-association — the suggestion is placed under a different field in a different section, so it is read as belonging to that other field
- **persona:** An agency dev migrating an old credentialing form into a templated 3-section layout
  copied each help/tip block into the section it "looked right" in. The NPI tip was authored late,
  appended to the help-content array after the licensure items, and the templating loop dropped it
  under the last-rendered field (the license number). Because the tip *mentions* "NPI" in its
  text, the dev skimming the page assumed the wording made the association clear and never checked
  that it sat beside the wrong control two sections away.

## Element / selector carrying the issue
- The field that erred: `input#npi` (Section 1), described only by `#npi-err` ("Please review this
  entry." — no fix).
- The misplaced suggestion: `section[aria-labelledby="s3"] .field p.help` — the correct 10-digit
  NPI guidance, rendered under `input#license` in Section 3.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user sees the red NPI field flag "Please review this entry," gets no format hint
  there, and — if they ever reach Section 3 — sees an NPI tip sitting under the license field,
  where its visual proximity says "this is about the license number." They may apply the 10-digit
  rule to the wrong field or dismiss it as irrelevant to the NPI.
- A **screen-reader** user on the NPI field hears "National Provider Identifier (NPI), edit,
  invalid data, Please review this entry." (via `aria-describedby`). The actual suggestion is NOT
  referenced by the NPI field; navigating later into Section 3 they encounter it announced right
  after "State license number, edit," so its programmatic and reading-order context ties it to the
  license control. The fix is announced as though it belongs to the wrong field.
- The correct suggestion is therefore present but associated with the wrong field, so it is not
  provided to the user *for the field that erred*.

## Expected ACT-style outcome
**failed** — A correct suggestion exists but it is mis-located under a different field in a
different section; it is neither near nor associated with the NPI field that erred, so the user
cannot reliably connect the fix to the right field (G177 proximity/association).

## Why automated tools miss it
The suggestion is non-empty, correct, high-contrast, and inside a labelled panel adjacent to a
labelled field; the NPI field has a name, an invalid state, and an associated (if unhelpful)
message. No empty attribute or broken reference exists to flag. Whether the suggestion is sitting
under the RIGHT field — whether a human would read the 10-digit NPI rule as guidance for the NPI
or for the license number two sections down — is a semantic relevance + spatial-association
judgment that axe/WAVE/Lighthouse cannot perform.

## Citation
- **Reference:** WCAG 2.2 Technique G177 — Providing suggested correction text —
  `wcag-techniques/general/G177.html`
  > "Suggestions or links to the suggestions should be placed close to the form fields they are
  > associated with, such as at the top of the form, preceding the form fields, or next to the
  > form fields requiring correction."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, Intent —
  `wcag-understanding/error-suggestion.html`
  > "People with visual disabilities may not be able to figure out exactly how to correct the
  > error."
- **Reference:** WCAG 2.2 Technique G84 — Providing a text description … —
  `wcag-techniques/general/G84.html`
  > "clearly indicates which field had the problem so the user can easily navigate to it to fix the
  > problem."
