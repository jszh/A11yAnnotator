# case-02 — Civic citation-payment buttons with a permanent 4px solid black border that swallows the browser's default black focus outline (FAIL)

## Scenario
A city's "Pay a Parking Citation" review step has two action buttons styled in a heavy "brutalist
government" look: a permanent `4px solid #000` border on every `.btn`. The author did NOT use
`outline:none`; they supplied a focus indicator — but made it a thin BLACK outline
(`:focus { outline: 2px solid #000; outline-offset: 1px; }`) drawn just *outside* the border. Because
the resting border is 4px solid black and the focus ring is a thinner black line immediately outside it,
the focus ring is occluded — it reads as one continuous black edge. The page is rendered with the
*Continue to payment* button focused. Tabbing between the two buttons changes only a sliver of thickness
on an already-thick black edge, which a sighted keyboard user cannot perceive as "focus is here now."

(The focus outline is declared explicitly in black rather than relying on the UA default, because modern
browsers paint the default focus ring in the OS accent color, which would not be occluded by a black
border. F78's failure is specifically the same-color case, so the page matches the focus indicator to
the black border exactly as the F78 example markup intends.)

## Attribute tuple
- **Content domain:** government / civic services portal (parking-citation payment)
- **UI component / pattern:** primary/secondary action button pair on a checkout-style review step
- **Host-language construct:** `border: 4px solid #000` on the button with an author `:focus { outline: 2px solid #000; outline-offset: 1px }` (same color as the border, drawn just outside it); `autofocus` to render the focused state
- **Locale / i18n:** en-US, USD currency, US date format
- **Failure mechanism:** F78 (b) — a thick element border the same color as the focus indicator drawn just outside it, swallowing the focus ring

## Developer persona
A web agency themed a generic government starter kit into a high-contrast "accessible brutalist" look,
deliberately using thick 4px black borders on every control because "thick black borders are great for
low vision." For the focus indicator they added a black outline "to match the brand's all-black control
edges," reasoning that black is maximally high-contrast. They never tabbed through on the final
black-bordered theme, so they did not notice the black focus outline now sits flush against the 4px
black border and disappears into it.

## Element / selector carrying the issue
`.btn` — `border: 4px solid #000` — versus `.btn:focus { outline: 2px solid #000; outline-offset: 1px }`
(focus outline the same color as the border, drawn just outside it). The focused element at load is the
*Continue to payment* button.

## Exact accessibility mechanism
When a button receives focus, the author focus outline (a 2px black ring just outside the border box) is
painted. Here that ring is black-on-black against a 4px solid-black border, so it merges into the border
and adds no perceivable change. A sighted keyboard user moving between *Back* and *Continue* sees both
buttons with the same heavy black edge in both the focused and unfocused states; the focus indicator is
technically present and even technically high-contrast against the white page, but it is occluded by the
same-color thicker border, so it fails to communicate which control is focused. This is precisely the
F78 occlusion mode — focus is drawn but "no longer meets the definition of 'visible'."

## Expected ACT-style outcome
**failed** (SC 1.4.11, also implicates 2.4.7 / F78). The focus indicator is rendered but occluded by a
same-color thick border, so the focused control's state is not perceivable.

## Why automated tools miss it
No `outline:none` is present and a real author `:focus` outline is declared, so outline-removal and
"focus-style-exists" linters pass. The focus outline, measured in isolation against the white page, has
high contrast (black on white ~21:1), so a contrast checker passes. axe-core / WAVE / Lighthouse encode
no rule for "the focus ring is occluded by a same-color border of greater thickness." Detecting it
requires rendering the focused state, observing that the black focus line abuts a 4px black border, and
making the human judgment that the focus change is not discernible. Thick black borders are a
deliberate, legitimate (often pro-accessibility) design choice, so no tool flags them.

## Citation
**Reference:** WCAG Technique F78 — Examples (`wcag-techniques/failures/F78.html`)
> "The following CSS example creates a border around links that does not have enough contrast for the focus indicator to be seen when drawn on top of it. In this case the focus indicator is drawn just outside the border, but as both are black and the border is thicker than the focus indicator, it no longer meets the definition of \"visible\"."

**Reference:** WCAG 2.2 Understanding 1.4.11 — Relationship with Focus Visible (`wcag-understanding/non-text-contrast.html`)
> "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
