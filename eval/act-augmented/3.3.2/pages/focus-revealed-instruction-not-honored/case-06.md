# case-06 — Policy-reference format instruction is correctly revealed on keyboard focus, fully visible, persistent, and meaningful (PASSING boundary variant that sharpens the aspect)

## Scenario
A policy-verification page (Harbour Mutual insurance). The policy-reference field requires a specific
format ("two letters, a hyphen, eight digits" — `GB-49120753`), which is the field's only instruction;
the visible `<label>` reads just "Policy reference number" and does not state the format. This page
implements the focus-revealed-instruction pattern **correctly**: the format hint un-hides on keyboard
focus (not only hover), is fully on-screen in normal flow (not clipped/occluded/off-screen), persists
for the entire focus session (no auto-dismiss timer), and contains real, meaningful text. It is the
passing boundary of this aspect — included to make explicit that the discriminator is behavioral
("does the promised instruction actually become perceivable on focus?"), not structural ("is there a
`:focus` rule and a hidden instruction node?", which every failing case in this set also has).

## Attribute tuple
- **content-domain:** insurance (policy lookup / verification)
- **UI-component/pattern:** focus-revealed format instruction done correctly (focus-within + :focus + value-persisted)
- **host-language construct:** `<input type="text">`, real `<label for>`, hint revealed by `.policy-field:focus-within .policy-hint`, `#policy:focus ~ .policy-hint`, `.policy-field:hover .policy-hint`, and `#policy:not(:placeholder-shown) ~ .policy-hint`; `aria-describedby` on the input
- **locale/i18n:** en-GB
- **failure-mechanism:** none — this is the correct implementation (passing variant)

## Developer persona
An accessibility-aware developer implemented the disclosure deliberately: they reveal on
`:focus-within` (so it works for keyboard users), keep the hint in normal document flow (so nothing
can paint over it), avoid any dismissal timer (so a slow reader keeps it), and also reveal it whenever
the field holds a value (so a returning/editing user keeps the guidance). They verified the focused
state by tabbing, not just hovering.

## Element / selector carrying the issue
`#policy` (the policy-reference input) and its hint `#policy-hint.policy-hint`. The reveal is honored:
on keyboard focus the hint becomes `display:block`, renders fully on-screen, and persists. There is no
defect.

## Exact accessibility mechanism (what AT experiences, why it passes)
The format is the only instruction telling the user how to type their policy reference. A keyboard or
screen-reader user tabs to "Policy reference number" and the hint un-hides immediately via
`:focus-within`/`:focus`; it is fully visible in normal flow with adequate contrast, nothing paints
over it, and it stays for the whole time the field is focused. The `aria-describedby="policy-hint"`
target is now a visible, populated node, so a screen reader announces the real format guidance
("two letters, a hyphen, then eight digits — for example GB-49120753…"). Sighted, keyboard, low-vision
(magnifier), and screen-reader users all receive the same meaningful instruction in the focus state
they reach. The instruction is genuinely available — and stays available — when the control has focus,
which is what 3.3.2 requires of a focus-deferred instruction.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
A static scan cannot confirm this PASS any more than it can catch the failing cases: it sees the same
shape — a real `<label>`, a hidden instruction node, a `:focus` reveal rule, `aria-describedby` — and
cannot tell that **this** page actually renders the instruction perceptibly on keyboard focus while
the others do not. axe/WAVE/Lighthouse pass the label check on all of them and have no signal that
distinguishes an honored focus-reveal from a broken one. Confirming this page genuinely passes requires
driving keyboard focus and visually judging that the promised instruction truly appears, is fully on
screen, persists, and reads meaningfully — the same human/behavioral judgment the failing cases need,
applied to a correct implementation.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Content authors may also choose to make such instructions available to users only when the
> individual control has focus especially when instructions are long and verbose."

> **Trusted Tester v5.1.3 5.A (Notes), `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`:**
> "The label or instruction must be visible when the form field has focus."

(This page exercises exactly the WCAG-blessed "available … only when the individual control has focus"
pattern, and the instruction **is** visible — fully and persistently — when the field has focus, so it
satisfies the TT note's normative requirement. It is the passing reference against which the failing
limbs (never appears / hover-only / occluded / auto-dismissed / empty placeholder) are judged.)
