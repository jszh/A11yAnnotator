# case-01 — Two fields defer their only instruction to focus; the password handler was copy-pasted from the email handler with the wrong target id, so focusing the password field reveals the EMAIL field's hint and the password's own complexity rules (aria-hidden, no describedby) never reach anyone

## Scenario
The "Create your account" step of a fintech (Tellard) business-wallet signup. Two fields each defer
their only instruction to focus (the WCAG-blessed pattern for a long/verbose instruction): the **email**
field's hint ("use your company domain, not a personal address") and the **password** field's
complexity rules ("at least 12 characters, one number, one symbol"). Each visible `<label>` ("Work
email", "Create password") states no rules, so the focus-revealed callout is each field's only
instruction. The password field's focus handler was copy-pasted from the email field's handler and the
target id was never changed from `email-hint` to `pw-hint`. So focusing the **password** field reveals
the **email** field's hint, while the password's own complexity rules (`#pw-hint`) never reveal in any
state. This is the aspect's failure limb (a): the field's promised focus-revealed instruction never
becomes perceivable — here because the WRONG field's instruction is what surfaces.

## Attribute tuple
- **content-domain:** online banking / fintech (business-wallet account creation)
- **UI-component/pattern:** focus-revealed inline helper tied to a single field, duplicated across two adjacent fields where one handler points at the other field's hint
- **host-language construct:** two `<input>`s each with a real `<label for>`; per-field `.hint` callouts toggled by `classList.add('show')` in a focus handler; password handler targets the email field's hint id; the password's own `.hint` is `aria-hidden="true"` with no `aria-describedby`
- **locale/i18n:** en
- **failure-mechanism:** copy-paste target-id mix-up — the password field's focus handler reveals `#email-hint` (the email field's instruction) instead of `#pw-hint`, so the password's only instruction is shown to no one and an unrelated instruction surfaces in its place

## Developer persona
A developer built the email field's focus-revealed hint, confirmed it worked, then duplicated the
handler block for the password field by copy-paste — changing the input id to `pw` but forgetting to
change the hint id from `email-hint` to `pw-hint`. Because `#email-hint` is a real, existing element,
the code throws no error and a hint visibly appears on focus, so the happy-path demo "looked like the
reveal works." QA tabbed into the password field, saw a green callout pop up, and ticked the box —
nobody read the callout closely enough to notice it was the *email* hint, or checked that the password
rules ever appear. The `aria-hidden="true"` on the rules node was added earlier to keep the
unrevealed-by-default callout out of the AX tree, and was never reconciled with the broken reveal.

## Element / selector carrying the issue
`#pw` (the password input) and its instruction node `#pw-hint.hint` (`aria-hidden="true"`). The focus
handler bound to `#pw` calls `document.getElementById('email-hint').classList.add('show')` — revealing
the **email** field's hint — so `#pw-hint` keeps `class="hint"` (`display:none`) in every state and is
also `aria-hidden`, with no `aria-describedby` anywhere pointing at it.

## Exact accessibility mechanism (what AT experiences, why it fails)
The complexity rules are the password field's only instruction and are deferred to focus. **Sighted
users:** a user who tabs to "Create password" sees a callout pop up, but it is the email field's hint
("use your company domain…"), which says nothing about password rules; the password's actual rules
never appear, so the user has no guidance on what a valid password is. **Screen-reader / AT users:** the
password textbox exposes `name="Create password"` and **no description at all** — the rules node is
`aria-hidden="true"` (which Chromium honors, pruning it from the accessibility tree) and, critically,
there is **no `aria-describedby`** pointing at it, so nothing surfaces the rules to AT. (This is the
distinction the previous version of this case got wrong: a `display:none` node referenced by
`aria-describedby` is STILL announced — `aria-describedby` is the canonical exception to `display:none`
subtree pruning, so Chromium resolves and announces it. That is NOT the situation here: there is no
`aria-describedby`, and `aria-hidden` is honored, so the rules reach no one.) Verified in Chromium: after
focusing `#pw`, the textbox AX node is `{name:"Create password", description:null}`, the password-rules
text appears in no AX node, `#pw-hint` computes `display:none`, and `#email-hint` computes
`display:block`. Neither sighted nor AT users ever receive the password field's only instruction — a
field with strict, non-obvious input rules, exactly the case the Understanding says additional
instructions must accompany.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Both inputs have correct, programmatically associated `<label>`s ("Work email", "Create password"), so
axe / WAVE / Lighthouse report "form element has a label" and pass. Focusing the password field DOES
reveal a real, visible, AX-exposed instruction node, so any heuristic that asks "does focus surface an
instruction node?" is satisfied — there is no missing-name, empty-node, or no-`:focus`-rule signal to
trip on. No automated checker reads the revealed callout, recognizes that the text that appeared ("use
your company domain…") is the *email* field's instruction and bears no relation to the password rules,
or notices that the password's own rules node is `aria-hidden` and never shown to anyone. Catching it
requires a human to tab to the field, read the revealed hint, and judge that it is the wrong field's
instruction while this field's actual instruction never appears — a semantic/behavioral judgment a
static linter cannot make.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Content authors may also choose to make such instructions available to users only when the
> individual control has focus especially when instructions are long and verbose."

> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Instructions or labels may also specify data formats for data entry fields, especially if they are
> out of the customary formats or if there are specific rules for correct input."

> **Trusted Tester v5.1.3 5.A (Notes), `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`:**
> "The label or instruction must be visible when the form field has focus."

(The password complexity rules are "specific rules for correct input" and are deferred to focus exactly
as the Understanding permits; the TT note makes "visible when the form field has focus" a normative
requirement. Here focusing the password field reveals the *email* field's hint instead, and the
password's own rules — `aria-hidden` and unreferenced — never become visible to sighted users or
exposed to AT in any state, so the focus limb is not honored and the field has no instruction.)
