# case-04 — Summary jump-link "Fix your email address" points to the Telephone field (wrong anchor target)

## Scenario
Step 3 of a university undergraduate-application wizard (Westmere University), "Contact details". A red
`role="alert"` summary lists 2 problems as G139-style jump links: *"Fix your email address — enter an
address in the format name@example.com"* and *"Enter a daytime telephone number…"*. Both fields are
genuinely in error (Email holds "amara.k(at)mail"; Telephone is empty) and both are flagged inline with
`aria-invalid="true"`. The defect: **the email line's anchor is `href="#phone"`** — so activating "Fix
your email address" lands the user on the **Telephone** field, not the email field. (Both links in fact
point to `#phone`.) The link text identifies the right field; the link target does not.

## Attribute tuple + developer persona
- **content-domain:** higher-ed admissions / application wizard
- **UI-component/pattern:** G139 "jump to error" links inside a top-of-form summary; multi-step form
- **host-language construct:** `<a href="#fragment">` in-page anchors; `:target`/`:focus` outline on inputs
- **locale/i18n:** en
- **failure-mechanism:** wrong/broken anchor target — link text names email, `href` resolves to phone
- **developer persona:** A developer hand-authored the summary links and **copy-pasted the second `<li>` to make the first**, intending to change the text and the `href`. They updated the visible text to "Fix your email address" but forgot to change the duplicated `href="#phone"` to `href="#email"`. Both anchors resolve to a real element, so the build's link-checker (which only flags fragments with no matching `id`) stayed green. Keyboard QA tabbed the form rather than activating the summary links, so the mis-targeted jump was never exercised.

## Element / selector carrying the issue
`.errsum ol li:first-child a` — text "Fix your email address…", `href="#phone"`. The field that the
text describes is `#email`. The mismatch is between the link's described control (email) and its
navigation target (`#phone`).

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard or screen-reader user reads the summary, understands "I need to fix my email," and activates
that link to jump straight to the field — the entire purpose of the G139 mechanism. Focus instead moves
to the **Telephone** input (the `:target`/focus outline appears on the wrong control). The user is now
positioned on a field whose label and inline message say "telephone," contradicting the link they just
followed. For a screen-reader user navigating by the summary, the error-jump mechanism actively
misdirects them: the summary fails to reliably let them reach and identify the item in error. Each
individual message and each field's inline indicator is well formed (passing 36b590 per field), but the
summary's navigation does not agree with the page's actual error mapping.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A fragment/anchor checker confirms `#phone` resolves to a real element — there is no broken link to flag.
Both flagged fields are correctly wired with `aria-invalid` and associated descriptive messages, so
36b590 passes. The link text is fluent and specific. The failure is that a link *labelled* for the email
error *navigates* to the telephone control — a target-vs-purpose mismatch. As the construction note for
this aspect states, a checker can verify an anchor target exists but cannot judge whether the summary's
links point to the right control. That judgment requires matching each link's described field to the
field its `href` actually reaches.

## Citation
> **G139 (Description), `wcag-techniques/general/G139.html`:**
> "a text description at the top of the page that indicates the fact that there was an input error,
> describes the nature of the problem, and provides a link the field(s) with a problem."

> **G139 (Tests), `wcag-techniques/general/G139.html`:**
> "Check that there is a link to each field that is missing required data from the missing data message."

(The link describing the email error must lead to the email field; pointing it at the telephone field
breaks the "link to the field with a problem" requirement and misidentifies the item in error.)
