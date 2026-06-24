# case-06 — Hand-typed full legal name on a government identity form, generic "enter your full legal name…" (human-verified value not knowable -> PASS, boundary)

## Scenario
A county records-office identity-verification step rendered in its **post-submit error state**. The required "Full legal name (exactly as printed on your photo ID)" field was left blank, so a visible, correctly associated error reads *"Enter your full legal name exactly as it appears on your photo ID."* No specific suggested value is offered, and none is possible: a person's legal name is a hand-verified fact known only to the applicant and their document — the system has no database to infer it from and cannot enumerate it. The only knowable rule is non-empty, plus a human-checkable instruction (match the ID). This is the **boundary PASS** that sharpens the gate: it sits right next to the failing enumerable cases (case-02 month, case-04 slug), yet the same generic-message shape PASSES here because no correction is knowable to the system.

## Attribute tuple
- **content-domain:** government / civic records request (identity verification)
- **UI-component / pattern:** `<fieldset>`-grouped identity form; only the free-text legal-name `<input>` errors; inline error via `aria-describedby`, `aria-invalid="true"`
- **host-language construct:** text input with `autocomplete="name"`, retained empty value, programmatic error association; sibling DOB and ID-number fields are valid (no errors)
- **locale / i18n:** en-US (gov.uk-style design system aesthetic)
- **failure-mechanism:** NONE — conformant; the test is whether the judge applies the knowability gate to a human-verified legal name and does NOT penalize the absent suggested value despite nearby fields where suggestions WOULD be required

## Developer persona
A government-digital-service developer built the identity step against an accessibility-conscious design system (visible focus ring, fieldset grouping, plain-language hints). For the legal-name field they wrote an instructive required-message — "enter your full legal name exactly as it appears on your photo ID" — that names the field and tells the user how to satisfy it (match the document). They added no suggested *value* because the system literally cannot know the applicant's legal name; a clerk verifies it against the uploaded ID later. The page is correct; the risk is a reviewer applying a blanket "every error needs a suggested value" rule and failing a field where none can exist.

## Element / selector carrying the issue
`#legalname` (the free-text legal-name input) and its error `#error-legalname`. The judgment is to recognize that a human-verified legal name is un-inferable to the system, so a generic-but-instructive required-message is the conformant maximum.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "Full legal name (exactly as printed on your photo ID), edit, invalid entry, … Enter your full legal name exactly as it appears on your photo ID." Combined with the visible hint ("include middle names, suffixes and accents if they appear on the document"), the user knows exactly what is required and how to comply. There is no further suggestion to give — the system cannot supply the user's own name.
- **Cognitively-loaded user:** the message points to a concrete, checkable source (their photo ID) rather than leaving them guessing.
- **Why it PASSES (and is the boundary):** unlike the month field (twelve known values) or the slug (computable availability), a legal name has no knowable correct value the system could provide. The suggestion obligation is not triggered, so the generic instructive message satisfies the criterion.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, but suggestions for correction are not knowable for a human-verified legal name; the description contains adequate information for the user to know what is required to fix the error).

## Why automated tools miss it
A checker that mechanically required a suggested value for every error would WRONGLY fail this conformant field — especially confusing because the SAME generic-message shape would correctly fail an enumerable field. axe/WAVE/Lighthouse confirm the label, the `aria-describedby` association, `aria-invalid`, the visible focus style, and contrast, but cannot decide that a legal name is *un-inferable to the system* while a month name is enumerable. That per-field knowability decision — distinguishing this boundary PASS from the neighbouring FAILs — is a semantic judgment about field meaning that automated tooling does not model.

## Citation
> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — a hand-verified legal name is the type of input where a specific correction is not knowable.

> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "if it is possible"; supplying the applicant's own legal name is not possible for the system.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS condition 2) — "enter your full legal name exactly as it appears on your photo ID" is adequate information to fix the error.
