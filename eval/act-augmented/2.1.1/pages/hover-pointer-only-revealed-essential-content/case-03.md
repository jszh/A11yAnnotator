# case-03 — Pricing tile: JS `mouseover` tooltip holds essential plan caveat, focus reveals nothing (FAIL)

## Scenario
"Renderly Cloud GPU" pricing page. The Starter plan lists "Spot capacity" with an "i" info
dot; hovering it reveals a JS tooltip stating spot instances can be **reclaimed at any time
with 30 seconds' notice and in-progress renders are lost and not refunded** — a make-or-break
caveat disclosed nowhere else. The Scale plan's dot is the only place the 12-month committed-use
lock-in ($3.10/GPU-hr on-demand) is stated. The reveal fires only on `mouseover`; there is no
focus/keydown handler. The first dot was given `tabindex="0" role="button" aria-label` (so it
tab-stops and looks accessible to a linter) but focusing it still shows nothing, because the
script only listens for `mouseover`. No `aria-describedby` either.

## Attribute tuple
- **content-domain:** developer/cloud infrastructure (GPU pricing)
- **UI-component/pattern:** pricing-tile feature-row info tooltip ("i" dot)
- **host-language construct:** `<span class="infodot">` + JS `addEventListener('mouseover')`; payload in a separate hidden `<div>`
- **locale/i18n:** en-US
- **failure-mechanism:** essential info revealed on `mouseover` only; no focus handler / no `aria-describedby`; a decoy `tabindex/role="button"` makes the trigger focusable but the reveal still never fires on focus

## Developer persona
A startup front-end engineer added "info dots" to explain fine print without cluttering the
tiles. They wrote a quick `mouseover`/`mouseout` tooltip script, then — after an axe warning
about a clickable span — bolted `tabindex="0"`, `role="button"`, and `aria-label` onto the
first dot to silence the linter. They never wired a `focus` listener or `aria-describedby`, so
the visible-on-focus behavior was never tested with a keyboard. The page now passes automated
scans while the essential caveat stays mouse-only.

## Element / selector carrying the issue
`.infodot[data-tip="spot"]` on the Starter tile (and `.infodot[data-tip="commit"]` on Scale).
The reveal is bound only to `mouseover`; the payload lives in `.tips [data-for="spot"]`.

## Exact accessibility mechanism
A keyboard user Tabs to the first info dot (it is focusable due to the decoy
`tabindex="0"`). They wait. Per Trusted Tester Test 4.A: place keyboard focus, and if the
information does not appear within two seconds, keyboard focus will not reveal it — here it
never appears, because the only listener is `mouseover`. There is no `aria-describedby`, so the
caveat is not in the dot's accessible name either; the name is just "What is spot capacity".
The other dots have no `tabindex` and are not even reachable. The essential information — spot
reclamation/loss, and the 12-month lock-in — is therefore not accessible via keyboard, and it
is not available elsewhere on the page. SC 2.1.1 essential-information branch fails.
Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (Level A), access-to-essential-information branch. Essential
content is revealed on pointer hover only, with no keyboard reveal and no equivalent text
elsewhere.

## Why automated tools miss it
The first trigger has `role="button"`, `tabindex="0"`, and an `aria-label`, and the tooltip
payloads are non-empty real elements — so axe-core, WAVE and Lighthouse see a named, focusable
control and well-formed content and report no error. They cannot (a) read the tooltip text and
judge it ESSENTIAL versus decorative, (b) detect that the reveal is bound to `mouseover` only,
so keyboard focus produces nothing within two seconds, or (c) verify the caveat appears nowhere
else on the page. All three are human judgments combining content meaning with two-modality
interaction. Present-but-mouse-only.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *How to Test* (title/tooltip nuance)
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "For interactive elements with `title` attributes, place keyboard
> focus; if the tooltip does not appear within two seconds, keyboard focus will not reveal the
> title information."
>
> **Quote (verbatim, Test 4.A How to Test):** "If an element does not provide access to
> essential information via keyboard, determine whether the information is available elsewhere
> on the page (e.g., as text)."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, *Notes*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "Information is \"essential\" when necessary to execute an action or
> understand information and relationships."
