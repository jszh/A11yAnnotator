# case-04 — Wizard primary button: "Continue" is apt while it advances steps, but under-describes its function once it becomes "send the money irreversibly"

## Scenario
A retail-banking "Send money" flow is a three-step wizard driven by a single primary
`<button id="primary">`. On **step 1** (enter amount) and **step 2** (review) the button
reads **"Continue"** and its function is to advance to the next step — a perfectly apt
label. On the **final step 3** ("Confirm and send") the *function* of the very same button
changes: activating it now **executes the irreversible transfer** (the panel warns "Instant
transfers are final. Once sent, the money cannot be recalled or refunded by the bank."). But
the visible label stays the generic **"Continue"** — the same word that meant "go to the
next screen" two steps earlier. In the state the user has navigated into, the button label
no longer describes the control's function: nothing in "Continue" tells the user that
pressing it sends $1,250 with no undo.

This is the **labels limb** of 2.4.6 — TT Test 5.B / Technique G131 — applied to a
`<button>` whose descriptiveness holds in the initial state but breaks under a later
interacted-into state. (`#primary` is a native button: AX `role=button`, `name="Continue"`
in every step — verified at runtime, so the headings limb / b49b2e does not apply to it.)

## Attribute tuple
- **content-domain**: retail banking / fintech (money-transfer wizard)
- **UI-component/pattern**: multi-step wizard with one persistent primary action button
- **host-language construct**: `<button>` whose `textContent`/function change per step in JS
- **locale/i18n**: en
- **failure-mechanism**: labels limb — a button label that is descriptive of its function early in a flow stays unchanged when interaction changes the function to a consequential, non-reversible action it no longer describes

## Developer persona
The team built the wizard around a generic "next-step" controller: one primary button whose
handler just increments the step. For steps 1 and 2 "Continue" was the obviously right word,
so the dev wired the same label for all advancing steps and moved on. The final "send"
action was bolted onto the last step of the same controller; the dev added a finality warning
in the panel body but never changed the button label from "Continue" to something that names
the action (e.g. "Send $1,250 now"). Because the button reads fine on the first screen the
team lands on, the placeholder-grade final label was never caught.

## Element / selector carrying the issue
- FAIL: `#primary` — on step 3 ("Confirm and send") its function is to irreversibly send the
  money, but its visible label/accessible name is the generic "Continue". Verified at runtime:
  AX `role=button`, `name="Continue"` at steps 1, 2, and 3; on step 3 the visible heading is
  "Confirm and send" and the panel warns the transfer is final.
- PASS boundary: `#secondary` relabels across steps too ("Cancel" → "Back" → "Back"), but its
  label stays descriptive of its function in every state — showing that a label changing on
  interaction is not itself the defect.

## Exact accessibility mechanism
TT Test 5.B requires that "Each visual button label is sufficiently clear and descriptive, so
users know its function," and its Notes require that label changes "as a result of
interaction" be included in that judgment. On step 3 the function is "send money, no undo,"
but every user — sighted, screen-reader, voice-control — sees/hears only "Continue," a word
that implies merely proceeding to a further screen. A user who pressed "Continue" twice to
move forward presses it a third time expecting another step and instead irrevocably transfers
the money; a screen-reader user navigating to the button is told only "Continue button,"
which does not convey the consequential function. The button always has a valid, non-empty
accessible name equal to its visible text (name/role and label-in-name are green in every
state), so the defect is purely the *adequacy* of the label relative to the control's
function — and only in the post-navigation final state.

## Expected ACT-style outcome
**failed** (in the final interacted-into state a visible button label does not sufficiently
describe the control's function; the page contains a button whose label under-describes a
consequential, non-reversible action).

## Why automated tools miss it
A static scan of the initial DOM sees `#primary` reading "Continue" — an ordinary, never-
flagged button word that is genuinely apt on step 1. The accessible name equals the visible
text in every step, so label-in-name (2.5.3) and name-presence (4.1.2) stay green; axe-core /
WAVE / Lighthouse report no error. No automated rule clicks "Continue" twice, reaches the
"Confirm and send" step, reads the finality warning, recognizes that the button's *function*
is now "irreversibly send money," and judges that "Continue" fails to describe that function.
TT 5.B's Note that interaction-driven label changes "should be included" means the adequacy
call must be made in the state the user navigates into — which only a human reaches and
reasons about. The pass-boundary secondary button ("Cancel" → "Back") shows that "the label
changed on interaction" is not itself a violation, so even a hypothetical mutation-watcher
would over-flag without semantic judgment.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B (Evaluate Results)**
> "Each visual button label is sufficiently clear and descriptive, so users know its function."

> **Trusted Tester v5.1.3 — Test 5.B (Notes)**
> "Any changes to form labels that occur automatically or as a result of interaction should be
> included."

> **WCAG Techniques G131 — Providing descriptive labels (Tests / Procedure)**
> "Identify the purpose of the interface component. Check that each label makes the
> component's purpose clear."
