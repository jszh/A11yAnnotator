# case-02 — Answer-matching rule delivered only as a visually-hidden accessible description

## Scenario
A credit-union account-recovery step (Tidewater Federal Credit Union, "Reset your security
answer"). The **Your answer** field has a non-obvious matching rule: the stored answer is compared
**case-sensitively and with spaces significant**, so "Mr Whiskers" will not match "mr whiskers" or
"MrWhiskers". That rule genuinely exists on the page, is complete and accurate, and is
programmatically associated with the field via `aria-describedby="answer-rule"`. But the element it
points to (`#answer-rule`) is `.sr-only` — a 1px clipped box that stays in the accessibility tree
yet is **invisible on the rendered page**. A screen-reader user hears the rule as the input's
accessible description; a sighted user sees only "Your answer" and an empty box with no cue that
case or spaces matter. The instruction is present and reaches AT, but is not visibly presented to
sighted users at the point of entry.

## Attribute tuple + developer persona
- **content-domain:** finance / online-banking account recovery (credit union)
- **UI-component/pattern:** single text input with a screen-reader-only helper (`.sr-only` clip
  pattern) wired through `aria-describedby`
- **host-language construct:** `<span id="answer-rule" class="sr-only">` (clip:rect(0 0 0 0),
  NOT `display:none`, NOT `aria-hidden`) referenced by `aria-describedby` on `#answer`
- **locale/i18n:** en-US
- **failure-mechanism:** the required input rule lives in a visually-hidden (clipped) element, so
  it is delivered to assistive technology as an accessible description but is never shown on screen
  to sighted users (orphaned by sr-only-visual-suppression)
- **persona:** A developer was told the security-answer field "must not visually shout its matching
  rules — keep the card clean" but also "make sure it's accessible." They reached for the familiar
  `.sr-only` utility and an `aria-describedby` hook, reasoning "screen-reader users get the rule, so
  it's accessible, and the design stays minimal." They conflated "exposed to AT via an accessible
  description" with "presented to all users," not realizing that putting a *required* input rule in
  a screen-reader-only element leaves every sighted keyboard/mouse user with no cue that the answer
  is case- and space-sensitive until they are rejected.

## Element / selector carrying the issue
`#answer-rule` (`.sr-only`) — the case/space matching rule for `#answer` (Your answer). It is in
the DOM and in the accessibility tree (announced as the input's description) but is rendered as a
1px clipped box, so it is not visible to sighted users at the point of entry.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user sees the "Your answer" label and an empty input — and nothing else. There is
  no visible instruction that the answer is matched case-sensitively or that spaces count. Many
  will type the answer in a different case or spacing than they originally stored and be rejected,
  with three wrong attempts locking the account. The rule was present but not presented to them.
- A **screen-reader** user IS served here: `aria-describedby="answer-rule"` points at a `.sr-only`
  span that remains in the accessibility tree (it is clipped, not `display:none`, and not
  `aria-hidden`), so the input's computed accessible **description** resolves to the full rule and
  is announced on focus. (Verified via Chromium CDP: `#answer` description = the rule text;
  `describedby` relation present; `#answer-rule` box = 1px, `visibility:visible`, `aria-hidden`
  unset.)
- This is the exact distinction the SC draws and 4.1.2 does not: the field has a perfectly good
  accessible description (so 4.1.2 is satisfied) yet the instruction is not *presented to all
  users* — specifically the sighted population — which is what 3.3.2 requires. TT's 3.3.2 note is
  even sharper: the instruction must be **visible when the form field has focus**, and on focus
  nothing visible appears.

## Expected ACT-style outcome
**failed** — SC 3.3.2 requires labels/instructions to be presented to all users, not only those
using assistive technology. A required matching rule that exists solely as a visually-hidden
accessible description is delivered to AT but is never visible to sighted users at (or after) the
point of entry, so it is not presented to all users.

## Why automated tools miss it
The instruction is non-empty, present in the DOM, kept in the accessibility tree, and
`aria-describedby` correctly references an existing id whose text resolves as the input's
description — so "instruction exists?", "programmatic association present?", and "describedby
target resolves?" all pass, and an `.sr-only` clip span is a textbook, intentional, lint-clean
pattern (it is the *recommended* way to add AT-only text). axe/WAVE/Lighthouse do not flag a
properly associated, in-the-a11y-tree description as a failure, and have no way to judge that the
content it delivers is a *mandatory input rule that sighted users never see*. Recognizing the
orphaning requires reading the rendered page, seeing that nothing visible tells a sighted user
about case/space sensitivity, and understanding that "served to AT" is not "presented to all
users" — a visual + semantic judgment.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "It is possible for controls and inputs to have an appropriate accessible name or description (e.g. using `aria-label=\"...\"`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the labels or instructions aren't presented to all users, not just those using assistive technologies)."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The goal is to make certain that enough information is provided for the user to accomplish the task without undue confusion or navigation."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 — Notes —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "The label or instruction must be visible when the form field has focus."
