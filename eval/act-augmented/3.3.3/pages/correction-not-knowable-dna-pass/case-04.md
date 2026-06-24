# case-04 — Corrupted PDF upload rejected with "we couldn't read this file…" (correct replacement not knowable -> PASS)

## Scenario
A county e-filing portal's attachments step rendered in its **post-submit error state**. The applicant attached a PDF (`site-plan-final.pdf`) that the server tried to open and could not parse — the bytes are damaged or the upload was truncated. A visible, correctly associated error appears on the file field: *"We couldn't read this file. It may be damaged or wasn't fully uploaded. Re-save or re-export it as a PDF and attach it again."* No "suggested correct value" is offered — and none is possible. The correct value is the applicant's **own valid document file**, an artifact the server does not hold, cannot infer, and cannot enumerate; there is no "nearest valid value" to propose the way a misspelled city or a month name has one. This is a genuine **DNA / knowability-gate PASS**: the system knows *this* upload is unreadable but cannot know what a good replacement would contain, so the suggestion obligation is not triggered and the present message is the conformant maximum.

## Attribute tuple
- **content-domain:** government / civic e-filing (permit application, document upload)
- **UI-component / pattern:** styled `<input type="file" accept="application/pdf">` dropzone with a visible "Replace file" label-button, inline error via `aria-describedby`, `aria-invalid="true"`
- **host-language construct:** native file input re-rendered in server error state after a backend readability/integrity check failed; retained filename shown
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is a conformant page; the test is whether the judge applies the *knowability gate* to a corrupted-file rejection and does NOT penalize the absent "suggested value"

## Developer persona
A government-digital-service developer built the upload step against an accessible design system (visible label-button, programmatic error association, plain-language hints). When the backend's PDF parser rejects a file as unreadable, the validator emits a message that states the nature of the problem and the concrete fix: "we couldn't read this file… re-save or re-export it as a PDF and attach it again," plus a fallback tip ("print to PDF again from the source program"). The dev added no "suggested correct value" because there is literally nothing to suggest — the system cannot manufacture the user's document. The page is correct; the risk is a reviewer (or a rubric that learned "every error needs a suggested value") mechanically flagging the absence of a suggestion.

## Element / selector carrying the issue
`#doc` (the PDF file input) and its associated error `#error-doc`. The judgment hangs on recognizing that for a corrupted-upload rejection a *correct value is not knowable to the system*, so the absence of a suggested value is conformant.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the file field hears "Site plan (PDF), file upload, invalid entry, One PDF, up to 20 MB. We open it to confirm the pages are readable before filing. We couldn't read this file. It may be damaged or wasn't fully uploaded. Re-save or re-export it as a PDF and attach it again." This is complete and actionable: the user learns the file is unreadable, the likely cause (damaged / truncated), and the concrete next step (re-export and re-attach, with a "Replace file" control adjacent). There is no further suggestion to give — the system cannot supply the user's correct document.
- **Cognitively-loaded user:** the message points to a concrete action (re-save/re-export the PDF) rather than leaving them to guess a value.
- **Why it PASSES:** SC 3.3.3 obliges a suggestion only when one is *known*. A corrupted-file rejection has no inferable or enumerable correct value the system could provide — unlike a misspelled city (nearest match from a database) or a month name (a list of twelve). The most specific possible guidance is "this file is unreadable; provide a clean one," which is present and associated.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, but suggestions for correction are not knowable for a corrupted/unreadable file upload; the present message describes the nature of the error and how to fix it, which is adequate information, so the success criterion is satisfied).

## Why automated tools miss it
A checker that flagged "error present but no suggested correct value" would WRONGLY fail this conformant page. axe/WAVE/Lighthouse verify the label, the resolved `aria-describedby`, `aria-invalid`, the `accept` type, and contrast — every structural facet passes — but none can decide whether a *valid replacement file is knowable to the backend*. They cannot distinguish a corrupted-file rejection (no knowable correct value -> absence of a suggestion is fine, PASS) from an enumerable field like "Month" (knowable list -> absence is a fail). That distinction is entirely about field/error meaning and human-inferred knowability — exactly the precondition gate ACT does not model.

## Citation
> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — a corrupted/unreadable file upload is a type of input where a specific corrected value is not knowable to the system, so absence of a suggestion is conformant.

> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "if it is possible"; supplying a correct replacement document is not possible for the system, only for the user.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS condition 2) — "we couldn't read this file… re-save or re-export it as a PDF and attach it again" is adequate information to fix the error.
