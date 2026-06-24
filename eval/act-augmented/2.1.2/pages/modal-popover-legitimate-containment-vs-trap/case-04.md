# case-04 — Alert-rule modal: real focusable Close/Cancel, but the trap excludes them from the cycle (FAIL)

## Scenario
"Cadence Analytics" SaaS dashboard. "Create alert rule" opens a `role="dialog"
aria-modal="true"` modal with a header "Close" button, a metric/threshold/window form, a
"Create rule" button, and a footer "Cancel" button. The header Close and footer Cancel are
**genuine, focusable `<button>` elements with accessible names** — they exist and would be
reachable in a normal tab order. But the hand-rolled focus trap was scoped to a hard-coded
selector (`.dialog-form input, .dialog-form select, .dialog-form button`) that matches
**only the form-body controls**, so the wrap cycle is metric → threshold → window → Create
rule → (wraps) → metric. The Close and Cancel live *outside* `.dialog-form`, so Tab can
never land on them. There is also no Esc handler. The user can plainly *see* Close and
Cancel, but the keyboard can never reach either: a trap hiding behind a visibly-present
dismiss.

## Attribute tuple
- **content-domain:** SaaS analytics / observability dashboard
- **UI-component/pattern:** APG "dialog (modal)" — create-resource form modal with header Close + footer Cancel
- **host-language construct:** `role="dialog"` + JS focus trap scoped to `.dialog-form` (excludes header/footer buttons)
- **locale/i18n:** en-US
- **failure-mechanism:** focusable dismiss controls exist but are EXCLUDED from the Tab cycle by an over-narrow trap selector; no Esc handler

## Developer persona
A mid-level engineer maintaining the dashboard copied a "trap focus in modal" gist and,
to make it "self-contained," hard-coded the container as `.dialog-form` so it would only
grab the inputs. They later moved the Close into the header and the Cancel into a separate
footer `<div>` for visual polish — both now sit outside `.dialog-form`. The trap kept
working (Tab stayed inside the modal), so nobody noticed the cycle had quietly stopped
including the two dismiss controls. They mouse-tested Close/Cancel (both fire `close()`
fine) and shipped. The exclusion is invisible unless you Tab the whole cycle.

## Element / selector carrying the issue
`#dialog` keydown handler — its `querySelectorAll('.dialog-form input, .dialog-form
select, .dialog-form button')` builds the wrap cycle and **omits** `#close` (header) and
`#cancel` (footer) because both are outside `.dialog-form`. The visible-but-unreachable
controls are `#close` and `#cancel`.

## Exact accessibility mechanism
A keyboard user activates "Create alert rule"; focus moves to the metric `<select>`.
Tabbing: metric → threshold → window → Create rule → (the trap wraps) → metric, endlessly.
Shift+Tab wraps the same closed loop. Because `#close` and `#cancel` are excluded from the
computed `items[]`, focus never reaches them no matter how the user tabs — they are visible
on screen but outside the keyboard cycle. Pressing **Esc does nothing** (no Escape branch).
A screen-reader user can, in browse/virtual mode, navigate to "Close, button" and activate
it — but switch users and keyboard-only users who rely on the *focus order* (the trap
controls it) can never tab to Close or Cancel, so they have no way to dismiss. The presence
of a dismiss control does not satisfy the SC if the keyboard cannot reach it. Verdict:
**FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment-vs-trap limb.
Keyboard-operable dismiss controls exist but the focus cycle excludes them, so focus
cannot be moved away from the modal using the keyboard.

## Why automated tools miss it
This is the hardest variant for tooling: the Close and Cancel are real, focusable,
accessibly-named `<button>` elements present in the DOM, so any "is there a reachable close
control?" heuristic finds one and passes. axe/WAVE/Lighthouse inspect static structure;
they do not execute the page's focus-trap script, compute the resulting Tab cycle, and
notice that the script's selector excludes the header/footer buttons. Catching this needs
a human (or interaction harness) to Tab through the *open* modal and observe that focus
never lands on the visible Close/Cancel — then reason that a dismiss the keyboard cannot
reach is no dismiss at all under the modal carve-out.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 4.C, "How to Test"
> (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard access is restricted to a small section of the page with
> no way to navigate out of the "loop" to the rest of the page."
>
> **Quote (verbatim, Test 4.C Note):** "Keyboard focus **should remain within a modal
> dialog box** until it is closed (per Test 4.F Step 3); however, check for keyboard traps
> **within** the dialog."
