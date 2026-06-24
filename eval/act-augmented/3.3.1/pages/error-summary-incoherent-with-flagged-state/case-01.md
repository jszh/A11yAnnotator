# case-01 — Summary names two valid fields and claims "2 errors"; the only flagged field (Telephone) is never listed

## Scenario
A GOV.UK-pattern "Apply for a Council Tax Reduction" form on a borough-council site. A red
error-summary box at the top of the form announces **"There is a problem … We found 2 errors,"** and
lists two fluent, field-specific messages: *"Enter your full name…"* and *"Enter an email address in
the correct format…"*. But on the actual form, **Full name and Email are both filled in correctly and
carry no error state**, while the **Telephone** field is the only one truly in error — it holds the
value "ring me weekdays", has a red 4px border, an inline message, and `aria-invalid="true"`. The
summary's count (2) and its membership (Name, Email) both disagree with the page's real flagged state
(1 error, Telephone).

## Attribute tuple + developer persona
- **content-domain:** government / civic services portal (council tax reduction)
- **UI-component/pattern:** GOV.UK error-summary box at top of form + inline per-field errors (G83/G139 method)
- **host-language construct:** `role="alert"` summary with `<a href>` jump links; `aria-invalid` + `aria-describedby` on the genuinely-flagged input
- **locale/i18n:** en-GB
- **failure-mechanism:** wrong count AND wrong fields named — summary enumerates valid/unflagged fields and omits the one flagged field
- **developer persona:** A back-end developer wired the summary from a **stale validation snapshot**. The summary template is populated from a `priorErrors` object that was serialized on a *previous* submit (when Name and Email were indeed blank). The user has since fixed those two and introduced a phone-format error, but the server re-rendered the page using the cached `priorErrors` for the summary while the *inline* flags were regenerated from the *current* validation pass. Manual QA only ever tested the first submit, where summary and inline agreed, so the drift never surfaced.

## Element / selector carrying the issue
`.error-summary` (the `role="alert"` box). Its `<li>` links target `#full-name` and `#email`; the
page's only `aria-invalid="true"` element is `#phone`. The incoherence is the relationship between
`.error-summary ul li a` (targets: full-name, email) and the set of flagged inputs (`#phone`).

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user lands on the `role="alert"` summary and hears: "There is a problem. We found 2
errors. Enter your full name… Enter an email address…". They navigate to Full name — it is filled with
"Priya Chandra" and announces no invalid state; to Email — filled, valid, no invalid state. They follow
the jump links and find nothing wrong at either target. Meanwhile the field that the form actually
rejected (Telephone, "ring me weekdays") is **never named in the summary**, so a user relying on the
top-of-form text to know "what is wrong" is sent to the wrong fields and left unaware of the real one.
SC 3.3.1 requires that *the item that is in error is identified*; here the aggregate identification
points at items that are **not** in error and omits the item that **is**. Each message is individually
fluent (passing 36b590 at the message level), but the summary as a whole misidentifies the items in
error.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every individual indicator is well formed: the summary is visible, in a live region, and each list item
is a specific, fluent error description tied to a real label; the genuinely-flagged Telephone input has
`aria-invalid="true"` and an associated descriptive message. ACT 36b590 evaluates each indicator's
*describing text independently* and has no notion of summary↔field-set agreement. axe/WAVE/Lighthouse
can confirm anchor targets exist (`#full-name`, `#email` are present) but cannot judge whether those are
the fields actually in error. Catching this requires building the set of truly-flagged fields
(`aria-invalid`/red border/inline message) and reconciling it against the set the summary enumerates —
a holistic, human cross-reference no rule performs.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "This SC requires that users be provided with information about the nature of the error, including the
> identity of the item in error."

> **G83 (Procedure), `wcag-techniques/general/G83.html`:**
> "Using server-side validation, the omission is detected and the form is re-displayed with a text
> description at the top informing which mandatory fields were omitted."

(The top-of-form description is present, but it informs the user of the *wrong* fields and an incorrect
count — so the "identity of the item in error" is not actually conveyed.)
