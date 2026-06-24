# case-01 — Bank APY "i" icon: hover-only definition popup, non-focusable span (FAIL)

## Scenario
"Banco Aurora" high-yield savings landing page. Next to the headline "4.35% APY" rate is a
small circular "i" information icon. On mouseover it reveals a tooltip that discloses a
material caveat: the 4.35% rate applies **only up to $250,000**, above which the balance
earns 0.50% — a fact disclosed *nowhere else* on the page. The icon is a styled `<span>`
with no `tabindex` and only `mouseover`/`mouseout` handlers, so keyboard, switch, and
magnifier users (who navigate by Tab) can never bring the popup up and never learn the cap.

## Attribute tuple
- **content-domain:** online banking / fintech
- **UI-component/pattern:** APG "tooltip" on an info ("i") icon
- **host-language construct:** `<span class="info">` (non-interactive element) + JS `addEventListener('mouseover'|'mouseout')`
- **locale/i18n:** en-US
- **failure-mechanism:** trigger has no focus path (no `tabindex`, no `focus`/`focusin` handler); hover-only reveal of unique information

## Developer persona
A bank's marketing team asked a junior front-end developer to "add a little info bubble to
explain the APY." They grabbed a generic info-icon snippet that toggled the popup on
`mouseover`/`mouseout`, dropped the legally-required tiered-rate disclosure inside it to keep
the hero visually clean, and shipped. They added `role="tooltip"` and `aria-describedby`
because a lint rule suggested it — which is exactly why automated scanners now pass the page —
but never wired keyboard focus, and never Tab-tested it.

## Element / selector carrying the issue
`#apy-info` (the `<span class="info">`) — the hover-only trigger; its revealed content is
`#apy-popup`.

## Exact accessibility mechanism
A sighted keyboard-only user Tabs through the page: focus moves header → "Continue to
application" button, skipping the `<span>` entirely (spans without `tabindex` are not in the
tab order). The popup's `display` never flips from `none`, so the $250k cap is never rendered
for them. A screen-magnifier user, who also drives with the keyboard, sees the same nothing.
The author's `aria-describedby` does associate the text for *some* AT when reading the icon in
browse mode, but the icon is not an interactive node in the tab order, sighted keyboard and
magnifier users are wholly excluded, and the SC's intent — that the content be *perceivable*
via keyboard focus — is not met. Per the Additional Note, hover-triggerable content must also
be focus-triggerable (cross-ref 2.1.1). It is not. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 1.4.13 Content on Hover or Focus (Level AA), focus-modality limb. Meaningful
content is revealed on pointer hover with no equivalent keyboard-focus reveal path.

## Why automated tools miss it
The DOM is pristine to a static scanner: `role="tooltip"` on a non-empty element,
`aria-describedby` resolving to a real id, a descriptive `<title>`, accessible names on all
controls, and no contrast problem — so axe-core, WAVE, and Lighthouse all report no issue.
Detecting the violation requires two human judgments a tool cannot make: (1) reading the
popup and recognizing it carries **unique, material** information (the tiered-rate cap),
not redundant decoration; and (2) Tab-navigating the live page and observing that the popup
never appears for keyboard users. Tools do not exercise hover/focus interaction states, nor
do they reason about whether hidden content "matters."

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Additional Notes"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "Content which can be triggered via pointer hover should also be able
> to be triggered by keyboard focus. Refer to Success Criterion 2.1.1 Keyboard."
>
> **Quote (verbatim, Intent):** "The intent of this success criterion is to ensure that
> authors who cause additional content to appear and disappear in this manner must design the
> interaction in such a way that users can: perceive the additional content AND dismiss it
> without disrupting their page experience."
