# case-05 — Cloud-console kebab menu: onkeydown handler gates on event.charCode (always 0 → never activates)

## Scenario
A SaaS cloud console ("Aperture") lists deployments in a table; each row has a "more actions"
kebab (`⋮`) built as `<div class="kebab" role="button" tabindex="0" aria-haspopup="true"
aria-expanded="false" onclick="toggleMenu(this)" onkeydown="kebabKey(event, this)">`. The kebab
is focusable, has a button role, an accessible name, `aria-haspopup`, `aria-expanded`, **and** a
keydown handler — it looks like a textbook keyboard-ready menu button. But `kebabKey` reads
`event.charCode` and checks it against 13/32 (Enter/Space). On a **keydown** event `charCode` is
**always 0** (it is only ever populated for the deprecated `keypress` event, and only for
printing characters), so the Enter/Space branch never matches and `toggleMenu()` is never called
from the keyboard — in **every** browser.

## Attribute tuple + developer persona
- **content-domain:** developer tooling / cloud infrastructure dashboard
- **UI-component/pattern:** data-table row "kebab" overflow menu (`role="menu"` + `menuitem`s)
- **host-language construct:** `<div role="button" tabindex="0" onkeydown=...>` with a key-property bug
- **locale/i18n:** en
- **failure-mechanism:** wrong key-event property — `charCode` on `keydown` is always 0, so activation is dead
- **persona:** A backend-heavy engineer wired the kebab menu and "remembered that key codes are
  on the event". They reached for `charCode` (a half-remembered detail from old keypress code) and
  bound it to `keydown` because "keydown is the modern one". It works for nobody by keyboard, but
  the engineer only ever tested with a mouse, and the rich ARIA (`role`, `aria-haspopup`,
  `aria-expanded`) made the control look complete in review.

## Element / selector carrying the issue
`.kebab[role="button"]` — the per-row overflow menu trigger (two instances in the table).

## Exact accessibility mechanism (what AT experiences and why it fails)
- A keyboard/SR user tabs to the kebab, announced as **"More actions for commit a3f10c9, button,
  has popup, collapsed"**. Expectation: Enter/Space opens the menu.
- Pressing **Enter** or **Space** fires `keydown` → `kebabKey` reads `event.charCode` → it is `0`
  → `0 === 13 || 0 === 32` is false → `toggleMenu()` is never called → the menu does not open and
  `aria-expanded` stays `"false"`.
- The Redeploy / Roll back / View logs actions live **inside** the closed menu, with **no other
  keyboard path** to reach them. So the kebab is keyboard-reachable but its function cannot be
  executed → fails 2.1.1.

Verified behaviourally (headless Chromium): Enter does not open the menu; Space does not open the
menu; mouse click does. (Confirmed with Gemini that `event.charCode` is `0` on `keydown` in all
current browsers, so this fails universally — it is not a single-browser quirk.)

## Expected ACT-style outcome
**failed** (SC 2.1.1; also implicates 4.1.2 because the announced `aria-expanded` state never updates).

## Why automated tools miss it
This control is *over*-decorated with valid ARIA: `role="button"`, `tabindex="0"`,
`aria-haspopup`, `aria-expanded`, an `aria-label`, an `onclick`, **and** an `onkeydown`. Every
static "is it a keyboard-ready button?" signal passes — there is literally a keydown handler
attached. The bug is a semantic error *inside* the handler (reading `charCode`, which is 0 on
keydown). No scanner evaluates whether the handler's key-matching logic can ever be true at
runtime. Only focusing the kebab, pressing Enter/Space, and observing that the menu never opens
(and `aria-expanded` never flips to `"true"`) exposes it.

## Citation
> **WCAG Technique SCR29 — Description** (`wcag-techniques/client-side-script/SCR29.html`)
>
> "it ensures that the action can be triggered from the keyboard by providing an `onkeyup` or `onkeypress` handler in addition to an `onclick` handler."

> **WCAG Technique SCR29 — Tests / Expected Results** (`wcag-techniques/client-side-script/SCR29.html`)
>
> "Set keyboard focus to the control … Check that pressing Enter or Space invokes the scripting action. … All of the checks are true."

A keydown handler is present, but because it gates on `charCode` (always 0 on keydown) pressing
Enter or Space does **not** invoke the action, so the SCR29 activation check fails → 2.1.1 fails.
