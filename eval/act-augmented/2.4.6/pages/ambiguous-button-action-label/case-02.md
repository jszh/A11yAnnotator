# case-02 — "Continue" primary button actually binds the policy and charges the card

## Scenario
A pet-insurance quote wizard ("Burrowguard"). A four-step progress indicator shows
"Your pet → Choose cover → **Review** (current, step 3) → Done." On the Review step,
the primary green button reads **"Continue"**, exactly as it likely read on steps 1
and 2. But this is the **bind** action: clicking it activates the policy and takes
the first £28.40 premium from the saved card *immediately*, with no further
confirmation. Step 4 ("Done") is only a receipt. The label's action verb implies
"advance to the next step"; the real function is "purchase and charge now."

## Attribute tuple
- **content-domain:** insurance quote wizard (pet cover)
- **UI-component / pattern:** multi-step stepper / wizard primary advance button
- **host-language construct:** native `<button type="button">` with text "Continue", inside a step-indicator (`<ol>` with `aria-current="step"`)
- **locale / i18n:** en-GB (£ currency)
- **failure-mechanism:** mismatched action verb — a generic progression verb ("Continue") labels a consequential, non-reversible commit-and-charge action; the step indicator actively misleads the user into expecting another step

## Developer persona
A product engineer reused the same `<NextButton label="Continue">` component on
every wizard step to keep the flow visually consistent — the design system says
"primary action is always 'Continue' until the final step." On the Review step the
"next" handler happens to be the payment/bind call, but nobody changed the label,
because changing it would have meant breaking the shared component's single-label
convention. QA clicked through with a test card and saw it "worked."

## Element / selector carrying the issue
`.nav > button.btn-next` — the primary `<button>` with accessible name **"Continue"**
whose click handler binds the policy and charges the card.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** sees "Step 3 of 4" and a "Continue" button and reasonably
  expects a further confirm/payment step; the fine print ("Cover begins
  immediately") is small and below the button.
- **Screen-reader user:** hears "Continue, button" — a label that affirmatively
  signals *navigation*, not *commitment*. Nothing in the accessible name warns that
  activating it spends money and is irreversible. The user, like the sighted user,
  is told the wrong function by the label.
- **Function judgment:** TT 5.B requires the visible button label to be
  "sufficiently clear and descriptive, so users know its function." A button that
  charges a card while labeled with a step-progression verb actively misrepresents
  its function — a stronger failure than a merely vague label.

## Expected ACT-style outcome
**failed** (SC 2.4.6, TT 5.B button-function prong / G131). The label is present and
ordinary but does not (in fact contradicts) the control's actual function.

## Why automated tools miss it
- "Continue" is a non-empty, conventional, well-formed accessible name; every
  name/role checker passes it. There is nothing "wrong" with the string in
  isolation — checkers would rate it a *good* label.
- The failure lives entirely in the gap between the label's implied action and the
  code's real effect (bind + charge), discoverable only by reading the step
  indicator and the behaviour. No automated tool reasons about whether a verb
  matches what the handler does.
- A tool cannot know that "Done" is merely a receipt, that there is no further
  confirm step, or that the charge is irreversible — all required to see the
  mismatch.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "Conversely, it is also possible for content to pass Success Criterion 1.3.1 (with headings or labels correctly marked up or identified), while failing this success criterion (if those headings or labels are inaccurate or insufficiently clear)."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)
