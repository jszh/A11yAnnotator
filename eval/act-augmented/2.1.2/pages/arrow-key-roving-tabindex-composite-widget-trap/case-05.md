# case-05 — RTL `role="toolbar"` roving tabindex with a within-widget arrow LOOP that also swallows Tab

## Scenario
An Arabic (RTL) article-publishing editor ("منصّة نشر"). The formatting toolbar is an APG `role="toolbar"` with roving tabindex (Bold / Italic / Underline / List / Link), `aria-pressed` toggle buttons, and arrow-key navigation. Because the document is `dir="rtl"`, `ArrowLeft` advances and `ArrowRight` goes back. The defect has two parts that compound into a loop trap: (1) the keydown handler also captures `Tab`/`Shift+Tab` and remaps them to button movement, and (2) the movement WRAPS — at the last button, advancing wraps to the first instead of exiting. So there is no index at which Tab ever leaves the toolbar; it is a closed within-widget loop, distinct from a single self-refocus. The title field and "نشر المقال" (Publish) button are unreachable. No `Esc`, no instruction.

## Attribute tuple
- **content-domain:** content authoring / rich-text editor (Arabic publishing CMS)
- **UI-component / pattern:** APG `toolbar` with roving tabindex and `aria-pressed` toggle buttons
- **host-language construct:** `keydown` handler with a WRAPPING index (`(n + len) % len`) applied to both arrows and a `preventDefault()`ed `Tab`
- **locale / i18n:** Arabic, `lang="ar" dir="rtl"` — arrow direction is mirrored (Left = next), a context that makes the loop easy to mis-reason about
- **failure-mechanism:** within-widget arrow loop extended to Tab — last item wraps to first, so Tab cycles forever and never exits (a loop trap, not a single refocus)

## Developer persona
An agency developer localized a Western LTR rich-text editor for an Arabic client. They kept the toolbar's "feels self-contained" behavior — arrows wrap around the buttons — and, to make it feel consistent, made `Tab` behave "just like the arrows" by routing it through the same wrapping `rove()` function. In RTL testing they were focused on getting the mirrored arrow directions right and never noticed that Tab now loops inside the toolbar with no exit.

## Element / selector carrying the issue
`div#fmtbar[role="toolbar"]` — its `keydown` listener: `case 'Tab': e.preventDefault(); rove(e.shiftKey ? idx-1 : idx+1)`, where `rove()` wraps with `(n + len) % len`. Buttons are the toolbar's `<button aria-pressed>` children.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The toolbar is valid: `role="toolbar"`, accessible name "تنسيق النص", roving tabindex, `aria-pressed` toggles. In RTL, `ArrowLeft` moves to the next button and `ArrowRight` to the previous — correct mirrored behavior.
- A keyboard user lands on "B". Arrows cycle the buttons (and wrap). Pressing `Tab` is intercepted and also routed through the wrapping mover: after the last button it returns to the first. There is no button at which `Tab` falls through to the title field or Publish button.
- Because the movement wraps, this is a true loop — unlike a single self-refocus, every position has a "next" that stays inside the toolbar. `Shift+Tab` loops the other way, equally trapped. No `Esc`, no advised exit.
- A screen-reader user is confined to the five toolbar buttons and can never reach the editable title or body or the Publish action.
- Verified with Puppeteer: after focusing the first toolbar button, 8 consecutive `Tab` presses stay on toolbar `<button>` elements and never reach `#title`, `#bodyarea`, or `#publishBtn` (`tabExitsToAfter: false`).

## Expected ACT-style outcome
**failed** — SC 2.1.2. The toolbar forms a closed keyboard loop: arrows and Tab both wrap within it, focus can never exit, and no alternate exit method is advised.

## Why automated tools miss it
axe-core reports zero violations (verified). The toolbar is valid APG markup with a correct name, roles, roving tabindex, and `aria-pressed` states — nothing static is wrong, and the RTL `dir`/`lang` are correctly set. The loop trap lives entirely in the wrapping `rove()` math applied to a `preventDefault()`ed Tab. A static analyzer cannot evaluate that the modulo wrap means "no exit index exists"; it would have to drive Tab repeatedly and observe that `document.activeElement` cycles through the buttons forever without escaping. Recognizing a within-widget loop (vs. a normal arrow-wrapping toolbar that still releases Tab) requires understanding the toolbar's intended interaction model and testing the Tab key specifically — human reasoning automated tools cannot perform.

## Citation
> "Keyboard access is restricted to a small section of the page with no way to navigate out of the "loop" to the rest of the page."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (How to Test, 2b — the loop trap condition met here, verbatim "loop")

> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or `Tab` keys or other "standard exit methods"."
— wcag-understanding/no-keyboard-trap.html (Intent)

> "Ensuring that the keyboard function for advancing focus within content (commonly the tab key) exits the subset of the content after it reaches the final navigation location."
— wcag-techniques/general/G21.html (Description — Tab must exit "after it reaches the final navigation location"; here the wrap prevents ever reaching a final location)
