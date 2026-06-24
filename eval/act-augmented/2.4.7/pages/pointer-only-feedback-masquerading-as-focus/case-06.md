# case-06 — Pricing CTAs: only `:active { transform }`, no persistent focus state

## Scenario
A SaaS pricing page (Solo / Team / Business) with one CTA `<button>` per tier. The
buttons define exactly one styled interactive state: `:active { transform: scale(.97) }`,
a press animation. `:focus` is reset to `outline: none` with no replacement. Tabbing onto
a CTA and pausing — the moment a keyboard user needs to know where they are — shows no
change, because `:active` only fires *while* the button is held and springs back on
release.

## Attribute tuple
- **content-domain:** SaaS / time-tracking product marketing (pricing)
- **UI-component / pattern:** pricing-tier cards with primary CTA buttons
- **host-language construct:** `<button class="cta">`; CSS `:active` transform + `:focus { outline:none }`
- **locale / i18n:** en-US, USD/month pricing
- **failure-mechanism:** the only styled state is `:active` (transient press feedback), conflated with a focus indicator; `:focus` reset with no persistent replacement

## Developer persona
A developer in a utility-class mindset (Tailwind-style) reflexively added
`focus:outline-none` to "remove the ugly blue ring," then added `active:scale-95` for a
satisfying click-press feel. They believed press feedback was their focus styling. No
`focus:` or `focus-visible:` ring utility was ever added, so the resting focused state is
unstyled.

## Element / selector carrying the issue
`.cta` buttons. `.cta:active { transform: scale(.97) }` is the only interactive-state
rule; `.cta:focus { outline: none }` removes the UA ring with no replacement.

## Exact accessibility mechanism
`:active` is the "currently being activated" state — not a focus state. It fires for a
mouse press and for keyboard Space/Enter activation, but lasts only while the control is
held and reverts instantly on release. The entire purpose of a focus indicator is to mark
where focus rests *before and between* activations; `:active` provides nothing then. With
`:focus` reset to `outline:none`, a keyboard user who Tabs to "Choose Team" and stops sees
the button exactly as idle and cannot tell which of the three CTAs holds focus. *(Verified
in Chromium: resting `focusΔ = 0` visual properties on every CTA.)*

## Expected ACT-style outcome
**failed** (oj04fd). At rest under keyboard focus the button is visually unchanged.

## Why automated tools miss it
There *is* interactive-state styling present (`:active`), `outline:none` is legal, and a
programmatic-focus pixel diff captures the *resting* focused state — which is unchanged,
but tools have no SC 2.4.7 oracle to call that a failure rather than an intentional design
choice. Distinguishing transient, modality-agnostic press feedback (`:active`) from
persistent focus feedback (`:focus`/`:focus-visible`) is a semantic judgment about which
state a Tab-and-stop actually produces — something only a human reasoning about state
semantics can make.

## Citation
> **WCAG Failure F78** (`wcag-techniques/failures/F78.html`), Description:
> "This describes a failure condition that occurs when the user agent's default visual
> indication of keyboard focus is turned off or rendered non-visible by other styling on
> the page without providing an author-supplied visual focus indicator."

> **WCAG 2.2 Understanding 2.4.7 — Intent** (`wcag-understanding/focus-visible.html`):
> "The focus indicator must not be time limited, when the keyboard focus is shown it must
> remain."
