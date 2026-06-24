# case-03 — PASS: positive tabindex deliberately restores meaning after a CSS-flex reflow

## Scenario
A nonprofit one-time donation form. By design the **Choose an amount** preset block sits visually
at the TOP, with the donor's **Your details** (name, email) below it, and **Donate now** last. But
in the DOM the contact `<fieldset>` was authored FIRST and the amount `<fieldset>` SECOND (the
amount block was bolted on later as a reusable widget). CSS flexbox `order` floats the amount block
above the contact block visually. Left to DOM order, Tab would go Name → Email → amount presets →
custom → Donate — which contradicts what the donor SEES. The developer applied positive `tabindex`
(presets = 1, custom = 2, name = 3, email = 4, Donate = 5) to **restore** the visually-meaningful
entry order: amount first, then who you are, then Donate. After the fix, Tab follows exactly the
top-to-bottom visual sequence. This is the legitimate "tabindex repairs a CSS reorder" case and is
a **PASS** — included so a judge cannot pass by merely flagging "any positive tabindex".

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component / pattern:** donation form with preset radio group + custom amount; CSS flexbox `order` reflow
- **host-language construct:** positive `tabindex` 1–5 aligning focus with the flex-reordered VISUAL order
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the corrective use of tabindex (counter-example), focus order matches meaning

## Developer persona
A mid-level dev integrated a shared "AmountPicker" component that the design system requires to be
placed last in the markup. Marketing's mock showed the amount picker on top. Rather than refactor
the shared component's source position (which other pages depend on), the dev kept DOM order, used
CSS `order` for the visual arrangement, then deliberately added `tabindex` so keyboard focus would
walk the SAME path the eye walks. They tested with the keyboard and confirmed Tab matches the
visible order before shipping.

## Element / selector carrying the issue
- `form.donate` uses CSS `order` (`.block-amount{order:1}`, `.block-contact{order:2}`,
  `.block-actions{order:3}`) so visual order ≠ DOM order.
- `tabindex` values realign focus with the VISUAL order: presets (`input[name="amt"]` = 1),
  `#custom` (2), `#name` (3), `#email` (4), `button[type="submit"]` (5).
- Resulting focus traversal equals the on-screen top-to-bottom sequence.

## Exact accessibility mechanism (what AT experiences)
A sighted keyboard user sees, top to bottom: amount presets, custom amount, name, email, Donate.
Pressing Tab walks them in exactly that order — nothing jumps, nothing is stranded, Donate is last.
A screen-reader-plus-keyboard user is led through "decide your gift, then identify yourself, then
submit", a coherent task sequence. Because the focus order matches the meaning implied by the
visual presentation, 2.4.3 is satisfied. (Note: source/reading order differs, but the SC permits
this as long as meaning and operability are preserved — and the author has aligned focus to the
presentation precisely to preserve them.)

## Expected ACT-style outcome
**passed** — focus order preserves meaning and operability; positive tabindex is used correctly to
align focus with the flex-reordered visual sequence (NOT an F44 failure).

## Why automated tools miss it
This is a hard NEGATIVE: axe-core emits the identical best-practice "avoid positive tabindex" note
here as on the failing pages, because it only sees the *presence* of positive tabindex. A tool — or
a naive judge — that flags positive tabindex as a violation would raise a FALSE POSITIVE on this
legitimate repair. Confirming it is correct requires computing the rendered visual order (driven by
CSS `order`), comparing it to the focus traversal, and verifying they AGREE — a visual-plus-semantic
comparison no static scanner performs. The correctness judgment is human.

## Citation
**Reference:** WCAG Understanding Focus Order (`wcag-understanding/focus-order.html`).

> "Focus order does not necessarily need to follow the visual layout of the web page, as long as the
> order in which elements receive focus is logical, and the hierarchy and relationship of content
> implied by the visual presentation is preserved."

**Supporting reference:** WCAG Technique G59 — *Placing the interactive elements in an order that
follows sequences and relationships within the content* (`wcag-techniques/general/G59.html`).

> "When the source order does not match the visual order, the tab order through the content must
> reflect the logical relationships in the content that are displayed visually."
