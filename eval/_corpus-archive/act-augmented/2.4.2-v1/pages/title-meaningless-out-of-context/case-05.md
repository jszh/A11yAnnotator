# case-05 — Password-creation wizard step titled "Continue"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-05.html`

## Scenario
Step 3 of 5 of the "Helios Mail" account-setup wizard. The body is a
password-creation form with a confirm field, a requirements list, and a live
strength meter (correctly exposed via `role="progressbar"` + `aria-valuetext`). The
`<title>` is the verb-fragment **"Continue"** — the wizard's forward-button label
reused as the title.

## Element / selector carrying the issue
`head > title` (text `Continue`). The submit `button` ("Continue") and the step
caption ("step 3 of 5: Continue") supply the on-page context.

## Exact accessibility mechanism (what AT experiences)
The page announces / shows in the tab as **"Continue"** — a pure action word with no
subject. It could title any step of any flow (checkout, onboarding, a quiz). A user
who steps away and returns to a tab reading "Continue", or finds "Continue" in
history, cannot tell this is the password step of a mail sign-up. The strength meter
and form are programmatically sound, so 4.1.2-style checks are clean — the ONLY
defect is that the title cannot identify the page out of context. On-page the user
has the heading "Create a password" and full context; the failure shows only when the
title is detached.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes.
- **c4a8a4 (descriptive), automated parts:** "Continue" appears verbatim on the
  submit button and in the step caption, so title/body lexical overlap holds. The
  ARIA on the strength meter is valid, so name/role/value checks pass too. No
  automated tool reasons that an imperative verb fails to identify a page when read
  alone — that is a human semantic judgement.

## Citation
> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "The title of each web page should:" … "Identify the subject of the web page" …
> "Make sense when read out of context, for example by a screen reader or in a site
> map or list of search results"

> **Reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "In cases such as Single Page Applications (SPAs), where various distinct
> pages/views are all nominally served from the same URI and the content of the page
> is changed dynamically, the title of the page should also be changed dynamically to
> reflect the content or topic of the current view."

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2…*
> (`wcag-techniques/failures/F25.html`)
>
> "This describes a failure condition when the web page has a title, but the" […]
> "title does not identify the contents or purpose of the web page."
