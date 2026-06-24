# case-03 — Login re-displayed after a rejected credential check: username retained, password cleared, no "attempt failed" message

## Scenario
A Northvale Health patient-portal sign-in page. The user entered a username and password and pressed
"Sign in"; authentication failed (wrong password). The server returned the **same** sign-in page
with the **username retained** and the **password field cleared** — and with **no message** that the
previous attempt was rejected. The page title is simply "Sign in." Nothing distinguishes this
post-failure state from a first, fresh visit to the login page. The user is left to guess whether
they fat-fingered the password, whether the account is locked, or whether anything happened at all.

## Attribute tuple
- **content-domain:** healthcare / patient portal
- **UI-component/pattern:** authentication form re-displayed after a failed credential check
- **host-language construct:** native `<form method="post">` with `<input type="password">` cleared on bounce, username `value` retained
- **locale/i18n:** en
- **failure-mechanism:** silent re-display — the post-failure page is indistinguishable from the initial page; error in no text

## Developer persona
A developer following a security checklist that says "never echo the password back and never reveal
whether it was the username or the password that was wrong." They implemented the security half
correctly (cleared password, generic page) but conflated "don't reveal WHICH field was wrong" with
"don't say anything at all." A generic "Incorrect username or password" message would have satisfied
both security and 3.3.1, but they shipped total silence — the auth handler just re-renders the login
template on failure with no error flag passed into it.

## Element / selector carrying the issue
The page-state combination: retained `input#user[value="d.whitfield@example.com"]`, cleared
`input#pass[value=""]`, page `<title>Sign in</title>`, and the **complete absence** of any
error/status text. There is no error element to point to — the failure is the missing indicator on
a page that is the result of a rejected login.

## Exact accessibility mechanism (what AT experiences, why it fails)
An input error was automatically detected — the credentials were rejected. 3.3.1 requires that be
described to the user in text. A sighted user can read a weak signal from the cleared password box
(some experience tells them "I must have got it wrong"), and SC 3.3.1 expects errors in **text**, not
inferred from an empty field. A screen-reader user re-lands on a page announced as "Sign in" with a
filled username and an empty password and has *no* cue that anything was rejected — there is no
`role="alert"`, no error in the title, no status text. They may conclude the button didn't register
and press it again, or believe they are being phished. The error exists but is conveyed in zero
text.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The login form is exemplary: labelled inputs, masked password, valid markup, a real submit button —
and **no error markup to evaluate**. axe/WAVE/Lighthouse cannot tell that this particular render is
the aftermath of a failed authentication rather than a first visit; with no error indicator present,
the 3.3.1 branch is a vacuous pass. The only machine-visible tell is "username retained + password
blank," which is also a perfectly normal initial-state pattern. Inferring that a real error occurred
and was left undescribed requires reasoning about the page state — human judgment.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form
> without providing any hint that the submission failed. The error must be indicated in text."

> **Trusted Tester v5.1.3, SC 3.3.1, `refs/trusted-tester/sc-3.3.1-error-identification.md`:**
> "This is a trigger-and-observe test — the tester must actively cause an error (submit invalid
> input) and then check whether the resulting error is conveyed in text. It is not a static
> inspection."

(A failed credential check is exactly the triggered error TT describes; the re-displayed sign-in
page conveys it in no text, and a static inspection — what automated tools do — cannot detect it.)
