# case-06 — PASS twin: same red icon + border, but with associated text correction (MM/DD/YYYY example)

## Scenario
A higher-ed LMS course-registration confirmation page, re-rendered after the student entered the
term-start date as **`Aug 25 2026`** when the system requires **MM/DD/YYYY**. The field shows the
**same visual treatment** as the failing twins (red warning triangle + red border + pink fill),
**but it also renders a text error message** — "Enter the term start date as MM/DD/YYYY — for
example, 08/25/2026." — that is programmatically tied to the input via `aria-describedby`, with
`aria-invalid="true"`. This page **passes** SC 3.3.3 and exists to verify the judge fails only the
text-absent versions (the discriminator is the presence of correction text, not the red styling).

## Attribute tuple
- **content-domain:** higher-ed LMS / course registration
- **UI-component/pattern:** confirmation form with inline status icon + an associated error message
- **host-language construct:** `<input aria-invalid="true" aria-describedby="start-err">` + `<p id="start-err">` correction text
- **locale/i18n:** en-US (MM/DD/YYYY)
- **failure-mechanism:** NONE — this is the boundary PASS; the knowable correction (format + example) is provided in associated text

## Developer persona
An LMS theming developer who, after the same audit that bit the case-04 contractor, wired the
validation layer to always render a real, associated message: every invalid field gets
`aria-invalid="true"`, an `aria-describedby` pointing at a message node, and the message text is
generated from the field's format rule plus a worked example. The red triangle and border remain
as redundant visual reinforcement, not the sole carrier. He treats "the message must say how to
fix it, in text, tied to the field" as the non-negotiable.

## Element / selector carrying the (non-)issue
`.row.invalid` wrapping `input#start` with `aria-invalid="true" aria-describedby="start-err"`, and
`p.errmsg#start-err` stating the required format and a concrete example. The red icon/border are
redundant here, not the sole carrier.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user tabbing to the term-start field hears "Term start date, edit, Aug 25 2026,
invalid entry, Enter the term start date as MM/DD/YYYY — for example, 08/25/2026" — because
`aria-invalid="true"` announces the invalid state and `aria-describedby` pulls in `#start-err` as
the field's description. The user learns both that the field errored AND the exact correction (the
format and a worked example), independent of seeing any colour. This satisfies the "in text"
requirement of SC 3.3.3 (and G84/G85/G177): a text description of the problem and the correct
input is provided and associated with the field. The red triangle and border are redundant
reinforcement.

## Expected ACT-style outcome
**passed** — an input error is detected and a knowable, useful correction suggestion is provided
in text, programmatically associated with the field.

## Why automated tools miss it (the symmetry that makes the failing twins evade detection)
Even on this PASS page, no scanner can *confirm* the success: a tool can see that
`aria-describedby` resolves to non-empty text, but it cannot verify that text is a *correct, useful
correction* rather than, say, "Invalid date." A field could carry `aria-invalid` + an associated
message that says nothing actionable and still satisfy every automated check while failing 3.3.3.
The fact that judging "does the text actually state the fix?" requires human semantic reading is
exactly why the icon/colour-only twins (case-01..05) evade axe/WAVE/Lighthouse. This twin pins the
discriminator: the only meaningful difference between pass and fail here is the presence of
associated correction text — the 3.3.3 limb — not the red treatment.

## Citation
> **WCAG Technique G177 (Providing suggested correction text), Description:** "The objective of
> this technique is to suggest correct text where the information supplied by the user is not
> accepted and possible correct text is known. ... Suggestions or links to the suggestions should
> be placed close to the form fields they are associated with, such as at the top of the form,
> preceding the form fields, or next to the form fields requiring correction."
>
> Source file: `wcag-techniques/general/G177.html`
