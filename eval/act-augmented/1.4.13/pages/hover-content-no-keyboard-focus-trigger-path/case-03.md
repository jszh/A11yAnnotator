# case-03 — Analytics KPI "?" button: focusable trigger but tooltip wired to mouseover only, not focus (FAIL)

## Scenario
"Loom Analytics" campaign dashboard. The "Conversions" KPI card has a "?" help button whose
tooltip explains a non-obvious attribution model — a conversion counts only checkouts within
**7 days** of click, post-click only, which is *why* the number is lower than the figure in
the ad platform (28-day click + 1-day view). The trigger is a real, focusable `<button>` with
`aria-label` and `aria-describedby`; it is a proper tab stop and even shows a focus ring. But
the JavaScript binds the reveal only to `mouseover`/`mouseout` and never to `focus`/`focusin`,
so a keyboard user lands on the button yet the tooltip never appears.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** metric-help tooltip on a KPI card (APG "tooltip")
- **host-language construct:** real focusable `<button>` + JS bound to `mouseover`/`mouseout` only
- **locale/i18n:** en-US
- **failure-mechanism:** trigger IS focusable (tab stop, focus ring) but the reveal handler is wired to pointer hover only — no `focus`/`focusin` listener, so focus produces nothing

## Developer persona
A product engineer built a reusable `<Tooltip>` helper in a hurry. The first version listened
for `mouseover`/`mouseout` to position and show the bubble; "add focus support" was a TODO
that never got done. Because the trigger is a genuine `<button>` with an `aria-label` and an
`aria-describedby`, every automated check went green and code review assumed it was complete.
The hover-only event wiring is the single overlooked line.

## Element / selector carrying the issue
`#conv-help` (the `<button class="help-btn">`) — focusable, but its reveal listeners
(`mouseover`/`mouseout`) have no `focus`/`focusin` counterpart; revealed content is
`#metric-tip`.

## Exact accessibility mechanism
A keyboard user Tabs to `#conv-help`; the browser gives it focus and paints `:focus-visible`
outline, so the user reasonably expects help. But no `focus`/`focusin` handler exists, so
`#metric-tip` stays `display:none` and the attribution caveat never renders. A magnifier user
(keyboard-driven) sees the focus ring but no tooltip. The information withheld is material —
it explains a real discrepancy a reader would otherwise misinterpret. This is the canonical
"interactive trigger, content carries unique info, no keyboard reveal" failure: hover-triggerable
content with no focus trigger path. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 1.4.13 Content on Hover or Focus (Level AA), focus-modality limb. Additional
content appears on pointer hover of a focusable trigger but is not triggered on keyboard focus.

## Why automated tools miss it
Static analysis sees a textbook-correct button: accessible name via `aria-label`, correct
implicit role, `aria-describedby` resolving to a non-empty `role="tooltip"`, good contrast,
descriptive `<title>`. axe-core, WAVE, and Lighthouse therefore report no error. The defect
lives entirely in runtime event wiring — `addEventListener('mouseover', …)` with no
`'focus'`/`'focusin'` twin — which tools do not execute or model. Catching it requires
Tab-focusing the button, observing the tooltip fail to appear, and judging that the withheld
text is meaningful context (not decoration). All three are human acts.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Additional Notes"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "Content which can be triggered via pointer hover should also be able
> to be triggered by keyboard focus. Refer to Success Criterion 2.1.1 Keyboard."
>
> **Quote (verbatim, SCR39 Description, `wcag-techniques/client-side-script/SCR39.html`):**
> "Additional content that is displayed when a user moves the pointer over a trigger or moves
> the keyboard focus to the trigger (for example, a pop-up) must remain visible to allow users
> time to read and interact with the content and must allow the user to move the pointer over
> the additional content."
