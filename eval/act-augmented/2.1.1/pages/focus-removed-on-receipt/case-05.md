# case-05 — APG listbox where each option fires a DEFERRED self-blur back to the trigger (`setTimeout(()=>{this.blur();trigger.focus();},0)`)

## Scenario
A SaaS analytics dashboard ("Cadence Analytics") has a custom "Date range" listbox built to the WAI-ARIA APG pattern: a `role="button"` trigger with `aria-haspopup="listbox"`/`aria-expanded`, and a `role="listbox"` of `role="option"` items with roving focus and full Arrow/Enter/Escape handling. It opens correctly by keyboard. But to "fix a flicker," a developer added a deferred self-blur to **each option**: on the option's `focus` event, a `setTimeout(…,0)` later calls `opt.blur(); trigger.focus();`. So the moment any option receives DOM focus (via Arrow keys or Tab), focus is stripped off it a microtask later and thrown back to the trigger. The user can open the list and watch options highlight, but focus will not rest on any option, so none can be selected by keyboard.

## Attribute tuple
- **content-domain:** B2B SaaS / product-analytics dashboard
- **UI-component / pattern:** custom APG **listbox** (`role="button"` trigger + `role="listbox"` / `role="option"`)
- **host-language construct:** per-option `addEventListener('focus', …)` with a **deferred** `setTimeout(() => { opt.blur(); trigger.focus(); }, 0)`
- **locale / i18n:** en-US
- **failure-mechanism:** F55 variant — deferred (asynchronous) blur + relocation on every option focus; less visible than inline `onfocus="this.blur()"`

## Developer persona
A senior developer hand-rolled an accessible listbox (correct roles, `aria-expanded`, roving tabindex, Arrow/Enter/Escape) — the kind of ARIA-complete widget that passes axe and "looks accessible." During polish they noticed a brief double focus-ring flicker when arrowing fast and "fixed" it by deferring a blur+refocus to the trigger on each option's focus event, not realizing this makes options impossible to land on.

## Element / selector carrying the issue
`#drMenu [role="option"]` (each option); the per-option `focus` handler runs `setTimeout(() => { opt.blur(); trigger.focus(); }, 0)`. The trigger `#drTrigger` is where focus is dumped.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Roles, names, and states are correct: `role="button"` trigger with `aria-haspopup="listbox"` and `aria-expanded`, `role="listbox"` with `role="option"` children, `aria-selected` on the current option. The keyboard OPEN path works (ArrowDown/Enter/Space opens and focuses the selected option).
- The user opens the list and presses ArrowDown to move to "Last 7 days". The option receives focus (the focus ring flashes on it); the option's `focus` handler schedules a `setTimeout`; on the next macrotask `opt.blur()` runs and `trigger.focus()` is called. Focus snaps back to the trigger button.
- Every option behaves the same way, so no option can hold focus. The user can SEE options highlight momentarily but can never press Enter/Space while focus is on an option to select it. The control is reachable yet inoperable by keyboard.
- A screen-reader user arrowing through options is repeatedly bounced to the trigger, so option values cannot be reviewed or chosen via the keyboard option path.

Verified with Puppeteer (after opening the menu): focusing an option ends with `document.activeElement.id === 'drTrigger'` (immediate focus succeeds, deferred blur fires; `rests=false`, `landedOn=drTrigger`).

## Expected ACT-style outcome
**failed** (SC 2.1.1 — options are reachable via keyboard but focus is removed on receipt and relocated to the trigger, so no option can be operated/selected by keyboard).

## Why automated tools miss it
This is exactly the "ARIA-complete, passes structural checks, fails at runtime" trap. Static analysis confirms a valid listbox: correct `role`/`aria-haspopup`/`aria-expanded`/`aria-selected`, options present, accessible names intact — axe/WAVE/Lighthouse raise nothing. The failure is a **deferred** focus theft inside a runtime `focus` handler: there is no inline `onfocus="this.blur()"` for a source grep to catch, and the `setTimeout` means even a runtime snapshot taken synchronously after `focus()` would still see the option focused — you must wait a turn of the event loop and re-check `document.activeElement`. No static tool arrows through the options and re-reads focus after a macrotask. Only behavioural tracing (open, arrow, watch the ring flash then jump back to the trigger) reveals it.

## Citation
> "Content that normally receives focus when the content is accessed by keyboard may have this focus removed by scripting."
— wcag-techniques/failures/F55.html (Description)

> "Check that when focus is placed on each element, focus remains there until user moves it. ... If #2 is false then this failure condition applies and content fails the Success Criterion."
— wcag-techniques/failures/F55.html (Tests / Expected Results; focus does not remain on the option — the script moves it, not the user)

> "The intent of this success criterion is to ensure that, wherever possible, content can be operated through a keyboard or keyboard interface."
— wcag-understanding/keyboard.html (Intent of Keyboard; selecting a date range via the listbox cannot be operated by keyboard)
