# case-04 — "Variable" help tooltip covers the difficulty key, which looks decorative but is informational (FAIL)

## Scenario
A trail-conditions page ("Larkspur Ridge Open Space") explains its *Current conditions:*
line with a help button ("What does 'variable' mean?"). On hover/focus it opens a tooltip.
There is **no keyboard dismiss** (no Escape handler, no close button), but the tooltip **is**
hoverable and persistent — it overlaps its trigger row and the show/hide logic tracks both
the trigger and the tooltip with a short close delay, so the pointer can travel onto the
tooltip without it disappearing and it stays open until the pointer leaves both. The
**Hoverable** and **Persistent** conditions are therefore met; the only unmet condition is
**Dismissible**, whose Method 2 (Esc) is absent and whose Method 1 (non-obscuring
positioning) is the sole remaining path. The tooltip opens **downward and lands on the
trail-difficulty SYMBOL KEY** — a row of green-circle / blue-square / black-diamond markers
that *looks* ornamental but is the **only** place the green-circle = Easy, blue-square =
Moderate, black-diamond = Difficult mapping is given (the trail list below reuses those exact
shapes with no words). Covering the key hides information the page depends on, so the
decorative exception does **not** apply, Method 1 is violated, and with no dismiss key the
page **FAILS**.

## Attribute tuple
- **content-domain**: parks / outdoor recreation (trail conditions)
- **UI-component/pattern**: "what does this mean?" help tooltip over a difficulty symbol key
- **host-language construct**: `<button class="help">` + `<span role="tooltip">`; inline `<svg role="img" aria-label>` difficulty markers in a `.key` legend reused in the trail list; JS class-toggle on `mouseenter`/`focus` with trigger+tooltip tracking and a close delay (hoverable + persistent)
- **locale/i18n**: en
- **failure-mechanism**: downward popup obscures an informational graphic (a difficulty legend) that *looks* decorative; Method 1 exception does not apply; Method 2 absent

## Developer persona
A parks-department web volunteer added a one-line glossary tooltip to explain "variable"
trail conditions and was careful to make it *hoverable and persistent* — they had read the
1.4.13 guidance about being able to move the pointer onto the tip. They positioned the tip to
drop straight down and reasoned that the little colored shapes beneath it were "just a
decorative band of icons," invoking the decorative carve-out and skipping an Escape handler.
What they missed is that the icon band is the legend that the trail list keys off — so the
covered graphic is informational, not decoration, and the carve-out does not apply.

## Element / selector carrying the issue
- Trigger: `button.help` (the "What does 'variable' mean?" control)
- Obscuring popup: `#cond` (`span[role="tooltip"].tip`)
- Obscured content: the `.key` difficulty legend (Easy circle / Moderate square / Difficult
  diamond) — an informational graphic, not decoration, since the trail list reuses the shapes
  with no words

## Exact accessibility mechanism
A low-vision user at high magnification reads the *Current conditions:* line, hovers/focuses
the help button, and moves the pointer onto the tooltip to read it (which works — it is
hoverable and stays open). But the open tooltip box {top 159, bottom 388} now sits on top of
the difficulty key row {top 212, bottom 264}, covering all three markers and their Easy /
Moderate / Difficult labels (verified in a browser: `document.elementFromPoint` over the
first key marker returns the tooltip; tooltip↔key overlap measured at 300×52 px). To then
decode the bare shapes shown in the trail list ("Cedar Switchbacks", "Ridgecrest Spur"),
the user needs the legend — but it is hidden behind the tooltip, and there is **no Escape**
(or any) mechanism to clear the tooltip in place. Moving focus/pointer away closes the tip
(and the help). The user is forced to choose between the explanation and the legend the rest
of the page depends on — exactly the interference *Dismissible* exists to prevent. A
screen-reader user is unaffected: each marker carries `role="img"` + `aria-label`, so the
meaning is exposed in the DOM regardless of the visual stack — which is why this is a
**visual/low-vision** failure that depends on the rendered overlap, not on the markup.

## Expected ACT-style outcome
**failed** — additional content shown on hover/focus obscures an *informational* graphic (the
difficulty key) and there is no dismiss mechanism; Method 1 is not satisfied (the overlapped
content is not exempt decoration) and Method 2 (Esc) is absent.

## Why automated tools miss it (and why it matters)
The markup is flawless: a real `<button>` trigger with an accessible name, a `role="tooltip"`
popup wired via `aria-describedby`, visible focus styles, passing contrast, and a key whose
markers expose their meaning to AT via `aria-label`. axe-core, WAVE, and Lighthouse never
enter the hover/focus state, never compute the open tooltip's box against the key row, and —
crucially — cannot decide that the covered shapes "provide information" rather than being "a
background graphic which provides no information." A reviewer who glances at the covered
region sees small flat shapes with no surrounding prose and is tempted to call them
decoration and **wrongly PASS** via the carve-out; the correct call requires reading the page,
seeing that the trail list keys off those exact shapes, and recognizing the legend is
informational. That meaningful-vs-decorative determination — in its hardest "looks decorative
but isn't" direction — is the human visual + semantic judgment the SC's exception requires.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible (two methods)**
> "Two methods may be used to satisfy this condition and prevent such interference:
> 1. Position the additional content so that it does not obscure any other content including the trigger, with the exception of white space and purely decorative content, such as a background graphic which provides no information.
> 2. Provide a mechanism to easily dismiss the additional content, such as by pressing Escape."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (intent)**
> "The intent of this condition is to ensure that the additional content does not interfere with viewing or operating the page's original content."
