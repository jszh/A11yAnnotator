# case-02 — Presence toggle: `aria-label` frozen at "Online" after switching to "Away"

## Scenario
A support-desk app (Lattice Support Desk). The agent's presence is a `<button>` that
flips between Online and Away. On click the status dot recolors green→amber, the visible
word changes "Online"→"Away", and `aria-pressed` flips true/false. But the button's
accessible name comes from a **static `aria-label`** ("Set status: you are Online") that
the handler never rewrites, so the name stays frozen even when the agent is visibly Away.

## Attribute tuple
- **content-domain:** SaaS support-desk / team presence
- **UI-component/pattern:** toggle button with `aria-pressed` + visible text + status dot
- **host-language construct:** `aria-label` as accessible name; `aria-pressed` mutated but name not
- **locale/i18n:** en-US
- **failure-mechanism:** F20 over the 4.1.2 name/value-over-time limb — state value flips, name string goes stale

## Developer persona
An agency built this as a reusable component. The handoff spec said "on toggle, recolour
the dot, swap the word, and flip aria-pressed." Everyone treated `aria-pressed` as "the
accessibility bit" and assumed it sufficed. The `aria-label` was authored once in the
template and never wired into the toggle handler — so the NAME is permanently
"you are Online" while `pressed=true` now means Away.

## Element / selector carrying the issue
`button#presenceBtn[aria-label]` — `aria-label` is the stale name; `aria-pressed` updates
but the name text does not.

## Exact accessibility mechanism
A screen-reader announces the button by its accessible name (the `aria-label`). After the
agent goes Away, the dot is amber and the visible label reads "Away", but AT still hears
**"Set status: you are Online"**. Worse for voice control: a Dragon/Voice-Control user
must speak the accessible name to activate the control, so to set themselves available
again they must say "Online" — the spoken target contradicts the current state. The
presence of a flipping `aria-pressed` is a decoy: the boolean state changes, but the NAME
that carries the human-readable status ("you are Online") is wrong. 4.1.2's intent is
that AT can "keep up to date on the status of user interface controls"; a frozen name
after the status change defeats that.

Verified with Puppeteer: after `click`, the visible-text/dot fingerprint changed while the
computed `aria-label` stayed `"Set status: you are Online"` (changed=false).

## Expected ACT-style outcome
**failed** (4.1.2).

## Why automated tools miss it
The button always has a non-empty `aria-label`, so axe `button-name` passes; `aria-pressed`
is present and valid, so ARIA state/property checks (e.g. 4e8ab6) pass. A tool that asks
"does a state change on interaction?" sees `aria-pressed` flip and is satisfied. What it
cannot do is read the literal word "Online" inside the name and judge that it contradicts
the new amber "Away" pixels. That is a cross-modal semantic comparison requiring a human.

## Citation
> **WCAG 2.2 Understanding, Intent of Name, Role, Value:** "The intent of this success
> criterion is to ensure that Assistive Technologies (AT) can gather appropriate
> information about, activate (or set) and keep up to date on the status of user interface
> controls in the content."
> — `wcag-understanding/name-role-value.html`
