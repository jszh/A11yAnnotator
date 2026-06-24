# case-05 — Correct "Did you mean Cambridge, MA 02139?" buried inside a collapsed "Address options" disclosure the user is never told to open

## Scenario
A checkout shipping step (Loomcraft Home). The shopper typed city `Cambrige` (misspelled) with
ZIP `02139`, so address verification fails. The system actually computed the **correct, adequate
did-you-mean suggestion** — "Did you mean **Cambridge, MA 02139**?" with a one-click "Use
Cambridge, MA 02139" button — but it is rendered **only inside a collapsed `<details>` disclosure**
whose summary reads "Address options." The collapsed content is not rendered (real disclosure,
`aria-expanded` driven by `<details>`), so while closed it is not in the accessibility tree. The
city and ZIP fields show only "Check your city and ZIP." Nothing tells the user that the
correction is behind the disclosure or that they should open "Address options."

## Attribute tuple + developer persona
- **content-domain:** e-commerce / checkout (home goods)
- **UI-component/pattern:** APG disclosure (`<details>/<summary>`) used as a collapsed container; two-column city/ZIP row
- **host-language construct:** native `<details class="addr-opts"><summary>Address options</summary>…</details>` holding the did-you-mean + an apply button; fields use `aria-describedby` to bare messages
- **locale/i18n:** en-US; address normalization / city-ZIP match
- **failure-mechanism:** hidden in a collapsed region — the correct fix exists but is behind a non-descriptive, closed disclosure the user is never prompted to expand
- **persona:** A Shopify/headless dev wired the address-verification API's `suggestion` payload into
  a reusable "Address options" disclosure (the same component also holds "Add a delivery note" and
  "Save to address book"). The did-you-mean was slotted into that collapsible to keep the checkout
  visually tidy. In QA the dev expanded the disclosure to confirm the suggestion rendered and saw
  it working — never noticing that, collapsed by default with a generic label, a real shopper has
  no signal the correction is inside.

## Element / selector carrying the issue
- The suggestion: `details.addr-opts .didyoumean` ("Did you mean **Cambridge, MA 02139**?" + apply
  button), inside a `<details>` that is closed on load.
- The disclosure trigger: `details.addr-opts > summary` whose text is only "Address options" — no
  hint that the city/ZIP correction is within.
- The erroring fields: `input#city` and `input#zip`, described only by bare "Check your city and
  ZIP." messages that never point to the disclosure.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user sees the red city/ZIP error and a neutral "Address options" expander. With no
  cue that the fix is inside, most users will not open a generic "options" twisty to look for a
  correction; they will retype manually or abandon. The precise did-you-mean is invisible until
  opened.
- A **screen-reader** user encounters "Address options, collapsed, button." Because closed
  `<details>` content is not exposed, the did-you-mean text is not in the accessibility tree and is
  never announced while collapsed. The field messages ("Check your city and ZIP") give no
  suggestion and never mention the disclosure, so the user has no reason or instruction to expand
  it. The correct fix is effectively absent unless the user happens to open an unrelated-sounding
  control.
- The suggestion is present in the DOM but **not provided to the user**: it is gated behind a
  collapsed region with no discoverability cue.

## Expected ACT-style outcome
**failed** — A correct, knowable suggestion exists but is hidden in a collapsed disclosure the user
is neither told to open nor given a cue points to; it is not effectively provided to the user at
the point of error (3.3.3 "the suggestions are provided to the user").

## Why automated tools miss it
The disclosure is a valid, keyboard-operable, properly named widget with correct expanded/collapsed
semantics; the suggestion text is correct and present in the DOM; the fields are labelled with
associated messages. No empty attribute, broken reference, or hidden-focusable issue exists.
Whether a user would ever discover the fix — whether "Address options" signals "your correction is
in here" — is a content-discoverability judgment about meaning and likely behavior that
axe/WAVE/Lighthouse cannot evaluate; they will see the suggestion string and pass.

## Citation
- **Reference:** WCAG 2.2 Understanding Error Suggestion, In brief —
  `wcag-understanding/error-suggestion.html`
  > "Where errors are detected, suggest known ways to correct them."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, Examples (Suggestions from a Limited Set
  of Values) — `wcag-understanding/error-suggestion.html`
  > "The conversion of the input data interpreted as a different month format, e.g., \"Do you mean
  > 'December'?\""
- **Reference:** WCAG 2.2 Technique G177 — Providing suggested correction text —
  `wcag-techniques/general/G177.html`
  > "Where possible, suggestions for correction should be incorporated in a way that is easy for the
  > user."
