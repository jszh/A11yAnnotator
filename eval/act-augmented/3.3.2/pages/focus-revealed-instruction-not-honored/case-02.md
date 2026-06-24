# case-02 — Promo-code format hint ("Format: ABC-1234") revealed only on :hover, not :focus, so keyboard users who tab to the field never receive the field's only instruction

## Scenario
The payment step of a Brightleaf Coffee Co. e-commerce checkout. The promo-code field accepts only a
specific format ("three letters, a dash, four digits" — `ABC-1234`). That format is the field's only
instruction; the visible `<label>` reads just "Promo code" and does not state the format. Following the
focus-revealed-instruction pattern, the hint is deferred until the user interacts with the field — but
the reveal is wired to `.promo-wrap:hover` only. A mouse user who hovers sees the format; a keyboard
user who tabs to the field (never hovering) gets nothing. This is the aspect's failure limb (e): the
instruction requires hover, not keyboard focus, so keyboard users never get it.

## Attribute tuple
- **content-domain:** e-commerce checkout (coffee retailer, payment step)
- **UI-component/pattern:** CSS-only reveal tooltip / helper tied to a single text field
- **host-language construct:** `<input type="text">` wrapped in `.promo-wrap`, hint toggled purely by a `:hover` descendant selector (no JS), with `aria-describedby` pointing at the hint
- **locale/i18n:** en
- **failure-mechanism:** reveal trigger is `:hover` only; there is no `:focus` / `:focus-within` rule, so keyboard focus never reveals the instruction

## Developer persona
A designer built the promo-hint as a pure-CSS reveal in the theme's stylesheet, copying the studio's
existing "show on hover" tooltip pattern used for decorative product badges. Because every QA pass was
done with a mouse, the hint always appeared during testing. No one tabbed through checkout, so the
absence of a `:focus`/`:focus-within` rule was never noticed; the `aria-describedby` was added later
by a different developer who assumed the visible hint also covered keyboard users.

## Element / selector carrying the issue
`#promo` (the promo-code input) and its hint `#promo-hint`. The reveal is governed solely by
`.promo-wrap:hover .promo-hint { opacity:1; max-height:80px; }`. There is no `.promo-wrap:focus-within
.promo-hint` or `#promo:focus ~ .promo-hint` rule, so on keyboard focus the hint stays `opacity:0;
max-height:0; overflow:hidden`.

## Exact accessibility mechanism (what AT experiences, why it fails)
The format is the only instruction telling the user what a valid promo code looks like. A keyboard
user tabs to "Promo code" and the hint never reveals — the field gives no format guidance, so the
user is likely to type a wrongly-formatted code and hit an error they were never warned about. The
hint is also `opacity:0; max-height:0; overflow:hidden`, which collapses it to zero size; combined
with the never-fired hover, the `aria-describedby="promo-hint"` association points at content that is
present in the DOM but never surfaced to the user in the focus state a keyboard or screen-reader user
actually reaches. Sighted mouse users get the instruction; keyboard-only and many screen-reader users
(who navigate by focus) do not — the instruction is not provided to all users in the state they can
reach, failing 3.3.2's requirement that the instruction be available when the control has focus.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The input has a correct, associated `<label>` ("Promo code"), so axe / WAVE / Lighthouse pass it on
the form-label check. The hint text exists in the static DOM and a `:hover` rule that reveals it is
present in the stylesheet, so a static scan sees both an instruction node and a reveal rule and
concludes an instruction exists. No automated checker distinguishes a `:hover` trigger from a
`:focus` trigger, drives keyboard focus to observe that nothing reveals, or judges that keyboard users
never receive the instruction. Telling `:hover` apart from `:focus` and confirming the format hint is
missing for keyboard users requires interacting with the page (tabbing) and human visual judgment —
not something a static linter can do.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Content authors may also choose to make such instructions available to users only when the
> individual control has focus especially when instructions are long and verbose."

> **Trusted Tester v5.1.3 5.A (Notes), `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`:**
> "The label or instruction must be visible when the form field has focus."

(The Understanding permits deferring an instruction to when the control has **focus**; the TT note
makes "visible when the form field has **focus**" the normative trigger. Here the only trigger is
hover, so a keyboard user who reaches the field by focus never sees the format instruction — the focus
limb is not honored.)
