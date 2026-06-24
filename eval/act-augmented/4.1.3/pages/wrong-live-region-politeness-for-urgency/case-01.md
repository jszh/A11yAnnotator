# case-01 — Save-confirmation written into a region wired `aria-live="off"` (silenced status)

## Scenario
A team-workspace SaaS ("Helmsley") notification-preferences page. The user toggles which
events email them, then presses **Save preferences**. On submit the app reveals a small
green "Preferences saved." banner beside the button. The banner element carries an
`aria-live` attribute and `aria-atomic="true"`, so at a glance — and to every static
linter — the live-region wiring *looks* present. But the value is `aria-live="off"`,
which instructs assistive technology **not** to announce updates to the region, and the
element has no `role="status"` / `role="alert"` / `role="log"` and is not an `<output>`
element to supply an implicit live politeness. Sighted users see the confirmation;
screen-reader users hear nothing and cannot tell whether the save succeeded.

This is the same aspect — **the live-region politeness value is wrong** — but here the
wrong value is `off`, which is not a "less interrupting" setting, it is **silence**.
That tips the case from a usability nuance into a genuine, normative 4.1.3 failure: the
status message is not programmatically surfaced at all.

## Attribute tuple
- **content-domain:** team-collaboration SaaS / workspace account settings
- **UI-component / pattern:** preferences form with an inline "saved" confirmation status beside the submit button
- **host-language construct:** `<span aria-live="off" aria-atomic="true">` (no status role, no `<output>`), populated on `submit`
- **locale / i18n:** en-US
- **failure-mechanism:** politeness value is `off` — a status message routed into a region that AT is told to ignore, so it is never announced

## Developer persona
A frontend dev added the confirmation banner and, remembering that live regions "can get
chatty", reached for `aria-live` and chose `off` — believing `off` was simply the
quietest/least-interrupting politeness level (a softer `polite`). They never realised
`off` means the region is not a live region at all and its updates are suppressed
entirely. The banner animates in for sighted users, so in their own (sighted) testing it
looked finished.

## Element / selector carrying the issue
`span#savedMsg[aria-live="off"]` (the confirmation banner), populated on the form's
`submit` handler with the text "Preferences saved."

## Exact accessibility mechanism
The post-submit text "Preferences saved." satisfies the WCAG definition of a **status
message**: (1) it does **not** take focus — focus stays on the Save button, so there is
no change of context that would exempt it; and (2) it reports the **success of the
user's action**. To be conformant the message must be programmatically determinable so
AT announces it without the user moving focus to it — via `role="status"`,
`role="alert"`, `role="log"`, an `<output>` element, or `aria-live="polite"|"assertive"`.
This region has **none** of those: the only live wiring is `aria-live="off"`, and `off`
explicitly tells AT to ignore updates. So the region behaves exactly as if no live
region existed — the change is added to the DOM and surfaced visually only. A
screen-reader user who presses Save receives no announcement and is left unsure whether
their preferences were saved. The defect is **a politeness value that suppresses the
announcement**, i.e. a status message that cannot be programmatically determined — the
failure described by F103.

## Expected ACT-style outcome
**failed** — a status message (the save-success confirmation) is added to the page
without taking focus, but it is placed in a region wired `aria-live="off"` with no
status role and no `<output>`, so it is not programmatically determinable and is never
announced by assistive technology. This is a direct instance of failure technique F103.

## Why automated tools miss it
The confirmation element carries an `aria-live` attribute and `aria-atomic="true"`, so a
static scan sees a live-region-shaped element and nothing malformed: `off` is a
syntactically valid `aria-live` token, so axe-core / WAVE / Lighthouse do not flag it
(they have no rule that says "this dynamically-updated element is a status message that
needed an *announcing* politeness"). The banner is also empty in the load-time DOM, so
there is no text for any content rule to inspect. Catching the defect requires
submitting the form, recognising that "Preferences saved." is a status message per the
WCAG definition, and observing (with a screen reader, or by reasoning about `off`) that
the update is never announced — a behavioural, human-in-the-loop judgment that
point-in-time DOM scanners cannot make.

## Citation
**Reference (normative failure):** WCAG Techniques — F103 "Failure of Success Criterion
4.1.3 due to providing status messages that cannot be programmatically determined through
role or properties" (`wcag-techniques/failures/F103.html`)

> "The absence of all of these techniques predicts a failure for the status message be
> announced to the user."

(The "techniques" enumerated immediately above this line are: "the HTML `output`
element", `role="status"`, `role="alert"`, `role="log"`, and "the use of an `aria-live`
attribute on an element, set to either \"`polite`\" or \"`assertive`\"". A region whose
only live property is `aria-live="off"` has none of these, since `off` is neither
`polite` nor `assertive`.)

F103's test procedure confirms the failing conditions, all of which this page meets:

> "Check that the element containing the updated content does not take focus"
>
> "Check that the new content provides information to the user on one of the following: the success or result of an action [&hellip;]"
>
> "Check that the element containing the new content does not have a pre-existing aria role of `status`, `alert`, or `log`, or an `aria-live` attribute"
>
> "Check that the status message is not surfaced (i.e., announced) by assistive technology"

**Supporting reference (Intent):** WCAG 2.2 Understanding SC 4.1.3 — Intent
(`wcag-understanding/status-messages.html`)

> "The intent of this success criterion is to make users aware of important changes in content that are not given focus, and to do so in a way that doesn't unnecessarily interrupt their work."

## Notes on the dispute this case resolves
This case replaces a prior scenario (a per-keystroke result count wired `role="alert"`)
that an adversarial reviewer correctly **rejected**: choosing *assertive vs. polite* for
a message that genuinely **is** announced is an advisory / best-practice matter (the
"too chatty" passage and SCR14 are explicitly advisory — "User testing should be carried
out"), not a normative 4.1.3 failure. The fix keeps the aspect's lens — **the live-region
politeness value is semantically wrong** — but moves to the one politeness value that is
normatively a failure: `aria-live="off"`, which suppresses the announcement entirely and
therefore fails F103. The outcome label `failed` is now grounded in a **normative
failure technique**, not in advisory text.

(Metadata note on the cited Understanding file: its `<h1>` reads "Understanding SC
3.2.6". That is not an error in this case — `3.2.6` is the WCAG 2.1 *draft* numbering for
the criterion that shipped as **4.1.3 Status Messages**; the file body throughout is the
4.1.3 Understanding text. The primary citation here is the normative failure technique
F103, not the advisory Understanding passage.)
