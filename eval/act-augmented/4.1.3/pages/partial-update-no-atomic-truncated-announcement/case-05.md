# case-05 — Post composer: character meter announces an ambiguous bare "267"

## Scenario
A social-post composer shows a character-budget meter: "**280** characters remaining",
wrapped in `<p role="status">`. As the user types, JavaScript rewrites ONLY the inner
`<b id="left">` number node (280 → 267 → 120…). The trailing words "characters remaining"
never re-render. In a non-atomic environment the screen reader announces just the changed
number ("two hundred sixty-seven") on each keystroke — losing not only the unit but the
*polarity* (is this characters used, remaining, or the limit?). That direction is carried
entirely by the un-announced words.

## Attribute tuple
- **content-domain**: social media / micro-blogging post composer
- **UI-component/pattern**: live character-budget meter
- **host-language construct**: `<p role="status">` with an inner `<b>` count node, `maxlength` textarea
- **locale/i18n**: en
- **failure-mechanism**: count-only mutation of a non-atomic region → bare number whose polarity is also lost

## Developer persona
A product engineer cloned a familiar "characters remaining" counter. The natural
implementation updates the single number on every `input` event for performance
(`leftEl.textContent = remaining`) and they wrapped the meter in `role="status"` after a
code-review comment said "screen-reader users should know they're near the limit." They
believed the live region solved it. They never considered that a per-keystroke region must
be atomic to re-read the unit, nor that a lone decrementing number reverses meaning from a
counting-up counter — both invisible without listening.

## Element / selector carrying the issue
- Region: `p#meter[role="status"]` — `aria-atomic` is absent.
- Mutated node: `b#left` — the only node rewritten per keystroke.

## Exact accessibility mechanism
`role="status"` is polite; its atomic default is unreliable across AT (ARIA22 advises an
explicit `aria-atomic="true"`). Without it, AT in a non-atomic environment speaks only the
mutated `#left` text. So the user hears "267" with no "characters remaining." Two layers of
meaning are destroyed: (1) the *unit* ("characters"), and (2) the *polarity* — a bare "267"
gives no hint whether the budget is counting down (remaining) or up (used), because that is
encoded solely in the trailing words. A sighted user reads the full phrase and the colour
warning; a blind user hears an ambiguous number stream. Marking the whole phrase atomic (or
rewriting "267 characters remaining" as one chunk) restores both unit and direction.

## Expected ACT-style outcome
**failed** — the meter is announced, but the announced number is not equivalent to the
visible status; it loses both the "characters remaining" unit and the count's polarity.

## Why automated tools miss it
The meter is a valid `role="status"` region with good contrast and a properly (off-screen)
labelled textarea — every static check passes. Tools do not simulate typing, do not track
which node mutates, and have no model of how `aria-atomic` shapes the spoken output. There
is certainly no rule for "the announced number is ambiguous in polarity." Distinguishing
this FAIL from an acceptable counter requires typing, listening, and reasoning that "267"
alone conveys neither the unit nor the direction of the budget — a multi-step human semantic
judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "However, where only the number in this string was coded as an updated chunk of content,
> the resulting experience for screen reader users could be to only hear "three", which may
> not be sufficient information to provide context for the user. In such situations, marking
> the entire "3 items" string as the status text would normally be a better solution. See
> Sufficient Techniques for more discussion, including the use of `aria-atomic`."

> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "Such additional context can be critical where the status message text alone will not
> provide an equivalent to the visual experience."
