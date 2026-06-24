# case-02 — Outer focus outline: yellow (fails the page) vs green (beats the page) on white

## Scenario
A Cascade County "Renew vehicle registration" wizard, step 3 of 4. Two flat text-only
"ghost" buttons sit directly on the white page — **Back to vehicle details** and **Continue
to payment**. Because the controls have no fill and no resting border, the focus outline is
their *only* focus signal, and it is drawn *outside* the box. `#btn-continue` uses a yellow
(`#FFFF00`) outer outline; `#btn-back` uses a green (`#008000`) one. The geometry is
identical — an outer outline on a white page — so the verdict depends solely on whether the
outer indicator contrasts with the **page** it sits on.

## Attribute tuple
- **content-domain:** government / civic services (DMV registration renewal)
- **UI-component/pattern:** flat text-only "ghost" buttons in a multi-step wizard
- **host-language construct:** `:focus { outline: 3px solid <colour>; outline-offset: 4px }`
- **locale/i18n:** en-US
- **failure-mechanism:** outer focus indicator that does not contrast with the page surface
  (yellow `#FFFF00` on white `#fff` = 1.07:1)

## Developer persona
A county web team adopted a bright "high-visibility" yellow for focus outlines after a
stakeholder asked for "a strong, attention-grabbing colour." On the team's dark-themed code
editor and on a projector the yellow looked vivid, so it passed informal review. Nobody
checked it against the actual white production page, where yellow-on-white is effectively
invisible. The green outline on the sibling button came from an older stylesheet that was
never unified.

## Element / selector carrying the issue
`#btn-continue:focus` — `outline: 3px solid #FFFF00` against the white page (FAIL, 1.07:1).
Contrast against the passing twin `#btn-back:focus` (`outline: 3px solid #008000`, 5.14:1).

## Exact accessibility mechanism (what AT experiences, why it fails/passes)
A keyboard or low-vision user tabs to **Continue to payment**. Because the button has no
fill or border, the *only* indication it is focused is the outer yellow outline — and
yellow against the white page is **1.07:1**, so for a user with moderately low vision there
is effectively no visible focus. They cannot tell where keyboard focus is on the most
important control of the step. Tabbing to **Back to vehicle details** shows a green outer
outline at **5.14:1** against the same white page, which is clearly perceivable — that
control passes. Per the Understanding text, an indicator that "appear[s] outside the
component … needs to contrast with the background that the component is on," i.e. the page.
Both `:focus` rules are real and fire in the browser.

## Expected ACT-style outcome
**failed** (the failing `#btn-continue` is on the page; `#btn-back` is the passing boundary
twin)

## Why automated tools miss it
A focus indicator *is* present and *does* change on focus, so axe-core, WAVE and Lighthouse
focus-visible heuristics are satisfied — they detect "something happens on focus" and stop.
None of them computes the contrast of an author-supplied focus **outline** against the
surface the component sits on; they have no rule that selects "the page background" as the
adjacency for an *outer* indicator and evaluates 1.07:1. The yellow also looks bright on a
dark preview, so casual visual checks miss it too. Selecting the page as the correct
adjacency for an outer indicator, and judging the result, is a structural/visual
determination automation does not make.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — "Relationship with Focus Visible":**
> "Most focus indicators appear outside the component - in that case it needs to contrast
> with the background that the component is on."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The yellow outer outline is
outside the component, so it must contrast with the white page it sits on — 1.07:1 fails.)

> **WCAG 2.2 Understanding, Non-text Contrast (figure `figure-focus-outer-yellow`):**
> "Fail: The external yellow indicator (#FFFF00) does not contrast with the white
> background (#FFF) which the component is on."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page reproduces that exact
failing figure as a live `:focus` state, paired with the passing green twin from
`figure-focus-outer-green`: "The external green indicator (#008000) does contrast with the
white background (#FFF) which the component is on.")
