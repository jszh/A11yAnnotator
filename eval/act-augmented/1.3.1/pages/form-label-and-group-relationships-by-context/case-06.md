# case-06 — Donation form done right: all label/group/required relationships programmatic (PASS boundary)

## Scenario
A river-conservancy donation form is the deliberate PASS counterpart to cases 01–05. It contains the same relationship-bearing structures those pages get wrong — a radio group with a question, a required cue, a second radio group, and a multi-part field — but conveys every one programmatically: `<fieldset>`/`<legend>` for "Gift frequency"; `role="radiogroup"` + `aria-labelledby` for "Designate your gift"; `aria-required="true"` plus an in-label "(required)" token plus `aria-describedby` to the required note; and `role="group"` + `aria-labelledby` tying the three phone sub-inputs to the single "Daytime phone" question.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component / pattern:** mixed form — two radio groups, required text field, multi-part phone field
- **host-language construct:** `<fieldset>`/`<legend>`, `role="radiogroup"` + `aria-labelledby`, `aria-required`, `aria-describedby`, `role="group"` + `aria-labelledby`
- **locale / i18n:** en-US, LTR
- **failure-mechanism:** none — every visual relationship is also programmatic (boundary/control case)

## Developer persona
A senior front-end engineer who has run screen-reader tests built this form. They used a real fieldset for the first radio group, the `role="radiogroup"` + `aria-labelledby` alternative for the second (to show both mechanisms), put the required cue in text AND aria-required (never color alone), and grouped the split phone field. They verified with VoiceOver that each group's question and the required state are announced.

## Element / selector carrying the issue
None — verifying selectors of CORRECT associations: `fieldset > legend` ("Gift frequency"), `[role="radiogroup"][aria-labelledby="desigQ"]`, `#email[aria-required="true"][aria-describedby="reqNote"]`, `[role="group"][aria-labelledby="phoneQ"]`.

## Exact accessibility mechanism (what AT experiences, why it passes)
- Entering the first radio group, AT announces the legend "Gift frequency (required)" as the group's name; each option ("One-time gift" etc.) is announced within it. The radios carry `aria-required="true"`.
- Entering the second group, the `role="radiogroup"` with `aria-labelledby="desigQ"` causes "Designate your gift" to be announced as the group label; options follow.
- The required email field announces "Email for your receipt, required, edit text" (from `aria-required` + the in-label "(required)" text) and its description "Fields marked (required)…" via `aria-describedby` — the required cue is in text, not color-only.
- The phone group announces "Daytime phone (optional), group" and each sub-input ("Area code", "Prefix", "Line number") is tied to that question via `aria-describedby` and the wrapping `role="group"`.
- TT 5.C is satisfied: name + description + group associations fully describe each field, including the required cue and each group's question.

## Expected ACT-style outcome
**passed** (SC 1.3.1 — every form relationship conveyed visually is also programmatically determinable).

## Why automated tools miss it (i.e., why a human verdict is still needed here)
Automated tools also return "pass" on this page — but that agreement is not guaranteed by the markup alone: a scanner cannot confirm that the `aria-labelledby` target text actually IS the visible question, that the legend genuinely matches the group's purpose, or that the required cue is conveyed in text rather than color. A human applying TT 5.C must read the rendered layout and confirm the programmatic associations match the visual relationships. This page is included so the aspect has a true-positive PASS boundary: the same structures that fail in cases 01–05 here demonstrate the correct programmatic conveyance, sharpening where the SC line sits.

## Citation
> "A combination of ANDI Output AND other programmatic association includes all relevant instructions and cues, OR … The combination of the programmatically determined form element context and the ANDI Output provide adequate description of its purpose."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, Evaluate Results #3–#4)

> "However, when an asterisk or other text symbol is associated with the field, using the `aria-required` property in addition to the visual presentation enables user agents to pass on this important information to the user"
— wcag-techniques/aria/ARIA2.html (ARIA2, Description note)
