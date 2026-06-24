# case-01 — Developer docs: many disclosures + nav links, plus ONE correctly-instructed search field (overall PASS)

## Scenario
A Stripe/Paystack-style "Webhooks" reference page in a developer-docs site. The page is dense with interactive controls that are **not** data-entry controls: a primary top nav, a 9-item sidebar navigation, three in-page jump (anchor) links, five expand/collapse FAQ disclosure buttons (real `aria-expanded` show/hide), a "Copy" code button, and a "Theme" toggle button. The single genuine data-entry control is the docs **search field**, which is correctly in scope and is given both a visible `<label>` ("Search the developer docs") **and** a visible instruction ("Type a topic such as 'webhook signature', then press Enter. Use quotes for an exact phrase."), associated via `aria-describedby`. The page therefore **passes** 3.3.2. The discriminating judgment is to *not* demand a field-style instruction for any of the links/disclosures/action buttons.

## Attribute tuple
- **content-domain:** developer docs / API reference
- **UI-component / pattern:** disclosure (show/hide) accordion + sidebar nav links + in-page anchor jumps + action buttons (Copy, Theme)
- **host-language construct:** native `<button aria-expanded>` disclosures, `<a href="#...">` anchors, one `<input type="search">` with `<label>` + `aria-describedby` hint
- **locale / i18n:** en
- **failure-mechanism:** none — this is the INAPPLICABLE-for-non-inputs + SATISFIED-for-the-one-input boundary; the case exists to catch false positives

## Developer persona
A docs engineer building on a Docusaurus-like theme. They were careful: the one true input (search) got a real label and a real usage hint because they know search fields "need a cue." Everything else on the page is navigation or disclosure that they (correctly) never treated as a form field. The risk is entirely on the *evaluator* side: an over-eager auditor or model that has internalised "every interactive control needs an instruction" will wrongly flag the five FAQ toggles, the Copy button, or the nav links under 3.3.2.

## Element / selector carrying the issue
No failing element. The in-scope control is `#q` (`input[type=search]`), satisfied by `label[for="q"]` + `#q-hint`. The OUT-OF-SCOPE controls an over-eager evaluator must NOT flag: `.faq button.q` (×5), `aside nav a` (×9), `.jump a` (×3), `.copy`, `#theme`.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user, search field:** "Search the developer docs, search, Type a topic such as webhook signature, then press Enter. Use quotes for an exact phrase." — label + instruction both reach the user. In scope, satisfied.
- **Screen-reader user, FAQ toggles:** each announces as "How do I verify a webhook came from Vaultpay?, button, collapsed" and toggles to "expanded" with the answer revealed. These are disclosure widgets: they take no data, so 3.3.2 owes them nothing. Demanding an "instruction" for them is the over-flag this page guards against.
- **Keyboard user:** Tab reaches every link/button; Enter/Space toggles the disclosures; nothing is a form field needing a fill-in cue.
- Net: the only data-entry control is labelled and instructed; the rest are correctly out of scope. **Pass.**

## Expected ACT-style outcome
**passed** (SC 3.3.2 — the page contains one data-entry control, which has a visible label and instruction; the abundant links/disclosures/action buttons are not data-entry controls and 3.3.2 does not apply to them).

## Why automated tools miss it
axe/WAVE/Lighthouse will report no 3.3.2 problem here — but for the wrong reason and without doing the real work: they confirm each control merely *has an accessible name*, not that the non-input controls are *correctly exempt* while the one input is *correctly instructed*. They cannot distinguish "this `<button>` is a disclosure (out of scope)" from "this control accepts data (in scope)"; that role/purpose judgment is semantic. The value of this fixture is as a precision check: it would expose an evaluator (human or model) that over-applies 3.3.2 to links and disclosure widgets, the exact failure mode the SC's scope clause exists to prevent.

## Citation
> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent)

> "A website provides a global search field in the header of the site. Any term can be entered, so there are no instructions needed, but the field needs a cue to communicate its purpose."
— wcag-understanding/labels-or-instructions.html (Examples) — the search field is the in-scope control; it is given both a cue (label) and instructions here.

> "DNA if the page does not have form elements or all form elements are disabled."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A) — TT only counts form elements; the disclosures/links are not form elements and are excluded from the test population.
