# case-01 — Glossary tooltip drops onto the next paragraph of body text (no Esc)

## Scenario
A long-form policy article ("The 2024 Carbon-Border Levy, Explained") has an inline
glossary term, *Emissions Trading System*, that reveals a definition tooltip on hover and
on focus. There is **no keyboard dismiss** — no Escape handler, no close button, and the
tooltip is not hoverable-to-close. Because Method 2 (dismiss) is unavailable, the only path
to satisfying *Dismissible* is **Method 1: position the content so it does not obscure any
other content, with the exception of white space and purely decorative content.** The
tooltip is absolutely positioned **downward** (`top: 1.7em`) and lands squarely over the
**first three lines of the very next paragraph** ("Critics on both flanks have lined up
against it…"), which is information-bearing body prose. Method 1 is therefore violated.

## Attribute tuple
- **content-domain**: news / long-form editorial (climate policy explainer)
- **UI-component/pattern**: inline glossary-term tooltip
- **host-language construct**: `<button class="term">` + `<span role="tooltip">` inside an inline `.glossary` span; CSS `:hover/:focus + .tip`
- **locale/i18n**: en
- **failure-mechanism**: downward-positioned popup obscures the following paragraph (meaningful content)

## Developer persona
A newsroom front-end developer added a "define this jargon" feature using a snippet from a
CSS-tricks tutorial. The tutorial's tooltip drops *below* the term to avoid covering the
term itself, which looked fine on the demo's short lines. On a real article with a tight
paragraph directly underneath, the same `top: 1.7em` now lands on live body text. The dev
tested only with a mouse, saw the definition appear, and shipped — never pressing Escape
(there is no handler) and never noticing the prose underneath was hidden.

## Element / selector carrying the issue
- Trigger: `button.term` (the "Emissions Trading System" glossary term)
- Obscuring popup: `#tip-ets` (`span[role="tooltip"].tip`)
- Obscured content: the following `article > p` beginning "Critics on both flanks…"

## Exact accessibility mechanism
A low-vision user viewing at high magnification sees only a small slice of the page. They
hover/focus the glossary term to read its definition; the tooltip appears and **covers the
opening lines of the next paragraph**. With no Escape (or any) dismiss mechanism, they
cannot clear the tooltip while keeping focus on the term — so to read the obscured
sentence they must move focus/pointer away, which (per the page's blur/mouseout logic) also
loses the definition. The user is forced to choose between the definition and the body text
the definition sits on top of. This is exactly the interference *Dismissible* exists to
prevent. A screen-reader user reading the DOM linearly is unaffected (the tooltip text is
just announced via `aria-describedby`), which is why this is a **visual/low-vision** failure
that depends on the *rendered* overlap, not on the markup.

## Expected ACT-style outcome
**failed** — additional content shown on focus/hover obscures meaningful content and there
is no dismiss mechanism (neither Method 1 nor Method 2 satisfied).

## Why automated tools miss it
The markup is flawless: the trigger is a real `<button>` with an accessible name, the
tooltip carries `role="tooltip"` and is wired via `aria-describedby`, focus styles exist,
and text/background colours pass 1.4.3. axe-core, WAVE, and Lighthouse never enter the
hover/focus state, never compute the tooltip's bounding box against the next paragraph's
box, and — even if they did — cannot judge that the covered region is *information-bearing
body text* rather than white space or decoration. That meaningful-vs-decorative
determination is the human visual judgment the SC's exception requires.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "Two methods may be used to satisfy this condition and prevent such interference:
> 1. Position the additional content so that it does not obscure any other content
> including the trigger, with the exception of white space and purely decorative content,
> such as a background graphic which provides no information.
> 2. Provide a mechanism to easily dismiss the additional content, such as by pressing
> Escape."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (intent)**
> "The intent of this condition is to ensure that the additional content does not interfere
> with viewing or operating the page's original content."
