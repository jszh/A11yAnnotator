# case-05 — Open "Display name" field, generic "Please enter a display name" (free-choice value not knowable -> PASS)

## Scenario
A multilingual community platform's "set your display name" step rendered in its **post-submit error state**. The user left the field blank, so a visible, correctly associated error reads *"Please enter a display name."* No specific suggestion is offered, and none is possible: a self-chosen display name is open-ended (any language, any script, real name / nickname / handle), so the system cannot know or enumerate what a member wants to be called. The only knowable rule is non-empty, which the message states. This is a **DNA / knowability-gate PASS**. The page deliberately includes i18n decoys (a `lang="ja"` guidance passage, an Arabic `dir="rtl"` example) that do not change the verdict but invite over-scrutiny.

## Attribute tuple
- **content-domain:** community / social platform profile setup
- **UI-component / pattern:** single open `<input type="text" autocomplete="nickname">`, inline error via `aria-describedby`, `aria-invalid="true"`; multilingual helper content
- **host-language construct:** text input with `maxlength`, retained empty value; surrounding mixed-language passages with correct `lang`/`dir`
- **locale / i18n:** mixed (en-US UI, `lang="ja"` note, `lang="ar" dir="rtl"` example) — i18n as a decoy facet, not the failure
- **failure-mechanism:** NONE — conformant; the test is whether the judge applies the knowability gate to a free-choice name and is not distracted by the i18n styling into over-flagging

## Developer persona
A localization-minded dev built the profile step for a global community, emphasizing that any script is welcome (hence the Japanese note and the Arabic/Japanese example chips). They wired a single generic required-validator: empty display name shows "Please enter a display name." They added no per-field suggestion because a member's chosen name is theirs to invent — there is nothing to suggest. The risk is purely that the busy, multilingual layout tempts a reviewer to look for a problem that isn't there, or that a rubric mechanically demands a suggestion.

## Element / selector carrying the issue
`#dname` (the free-choice display-name input) and its error `#error-dname`. The judgment is to recognize that a self-chosen name is un-inferable, so the absence of a specific suggestion is conformant.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "Display name, edit, invalid entry, Please enter a display name." Combined with the field's own hint ("2–40 characters, you can change this anytime"), this is complete: the user knows a name is required and how long it can be. No further suggestion exists — the system cannot guess the member's preferred name.
- **Multilingual / RTL user:** the `lang="ja"` passage and `dir="rtl"` Arabic chip are correctly marked so AT announces them in the right language/direction; these are conformant niceties, not the subject of the gate.
- **Why it PASSES:** SC 3.3.3 obliges a suggestion only when one is known; a free-choice display name has no knowable correct value, so the generic required-message is the conformant maximum.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, but suggestions for correction are not knowable for a self-chosen display name; the generic required-message tells the user what is required to fix the error, satisfying the criterion).

## Why automated tools miss it
A checker that flagged "error present but no suggested value" would WRONGLY fail this conformant page. axe/WAVE/Lighthouse verify the label, the resolved `aria-describedby`, `aria-invalid`, the correct `lang`/`dir` on the multilingual passages, and contrast — every structural facet passes. None can decide that a self-chosen display name is *un-inferable* and therefore exempt from the suggestion obligation. That is a meaning judgment about the nature of the field, which is exactly the uncovered knowability gate.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "if it is possible"; a specific suggestion for a free-choice name is not possible.

> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — a free-choice display name is the type of input where a correction is not knowable.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS condition 2) — "Please enter a display name" plus the visible length hint is adequate information to fix the error.
