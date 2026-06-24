# case-04 — RTL API-docs glossary tooltip whose Esc handler is gated on an input being focused

## Scenario
An Arabic (RTL) API-reference page has a dotted-underline glossary term "cursor" inside a
paragraph. On **hover** a dark tooltip explains the parameter and **covers the `curl`
example request block** below the paragraph. The term is a non-focusable `<span
tabindex="-1">`, so the tooltip only ever appears via pointer hover. The author added a
document-level Escape handler — but **gated it on `document.activeElement` being a text
input** (a guard copied from the filter box's "Esc clears the field" behaviour). While the
user is hovering the glossary term, nothing is focused (`activeElement` is `<body>`), so the
guard is false and **Escape never dismisses the tooltip**. The only way to clear the
obscuring tip is to move the pointer off the term.

## Attribute tuple
- **content-domain**: developer docs / API reference
- **UI-component/pattern**: inline glossary tooltip on a non-focusable term
- **host-language construct**: document `keydown` handler guarded by `activeElement` type
- **locale/i18n**: Arabic, `dir="rtl"` (`inset-inline-start` positioning)
- **failure-mechanism**: Esc captured only when an input is focused; on hover nothing is focused → Esc inert

## Developer persona
A docs-platform engineer first built an Esc-to-clear shortcut for the customer-ID filter box
(`if activeElement is the input → clear it`). When asked to "let Esc also close the glossary
tooltips," they pasted the dismiss line *inside the existing input guard* rather than at the
top of the handler. Because the glossary tooltip is hover-only on a `tabindex="-1"` span,
the guard is never satisfied at the moment the tooltip is visible, so the dismiss code is
dead. Their manual test (focus the input, press Esc) passed; they never tested "hover the
term, press Esc."

## Element / selector carrying the issue
- FAIL: `.glossary` term + its `.tip` tooltip — appears on hover, obscures `pre.req`, and
  the document Escape handler's `activeElement === INPUT` guard means Escape does nothing
  while the tooltip shows.

## Exact accessibility mechanism
A low-vision user magnifies the docs and hovers "cursor" to read what the parameter does.
The tooltip appears and hides the `curl` example they were about to copy. Per SCR39 (for
hover content) they should be able to press Escape and clear the tip **without moving the
pointer away from the trigger**, so they can pan the magnified viewport to read the request
underneath. But the Escape handler only fires its dismiss branch when a text input is
focused; on hover, focus is on `<body>`, so the branch is skipped and the tip stays. Their
only option is to physically move the pointer off the term — which re-pans the viewport and
defeats the workaround. (Note: the term is also not keyboard-focusable, but that is a
separate 2.1.1 concern; the 1.4.13 Dismissible failure here is the inert Esc on the
hover-shown content.)

## Expected ACT-style outcome
**failed** — obscuring content on hover with an Escape mechanism that is conditionally
guarded such that it is never effective for this content; no other no-move dismiss exists.

## Why automated tools miss it
A scanner sees a `document.addEventListener('keydown', …)` that checks for `Escape` and even
hides `.tip` elements — superficially a present, document-scoped dismiss mechanism. It
cannot evaluate the `activeElement` guard at runtime and reason that, for a hover-only
tooltip on a non-focusable span, that guard is *always false when the tooltip is visible*,
making the dismiss code unreachable. The markup is valid (`role="tooltip"`, correct `lang`
and `dir` for RTL). Catching this requires a human to hover the term, press Escape, see
nothing happen, then read the handler and realise the guard excludes the only state in which
the tooltip exists. That is runtime control-flow reasoning, not a static rule.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (content that appears on hover)**
> "The content can be closed without moving the pointer way from the trigger. Either by
> pressing Esc, by pressing another documented keyboard shortcut, or by activating the
> trigger."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "almost the entire portion of the page visible in this restricted viewport may trigger the
> additional content, making it difficult for a user to pan without re-triggering the
> content. A keyboard means of dismissing the additional content provides a workaround."
