# case-06 — PASS (truncation nuance): API key truncated with ellipsis BUT a working "Reveal full key" mechanism exists

## Scenario
The Nimbus Cloud console "API keys" page lists secrets in compact cards. The displayed key value
is deliberately **truncated** to a 10-char prefix + ellipsis (`nk_live_3pQ8vR2tX7…`) so the card
never overflows at any width — and indeed the page shows no horizontal scrollbar at 320px (probed:
document 320px = viewport, zero overflow). Truncation alone could fail the Reflow truncation
nuance (the full value would be unavailable). But this page provides the alternative the
Understanding doc requires: a working **"Reveal full key"** button (`aria-expanded`, `aria-controls`)
that swaps the element to the full 64-char value (which itself wraps via `overflow-wrap:anywhere`),
plus a Copy button. Probed: after clicking Reveal, the element shows all 71 chars,
`aria-expanded="true"`, and the page is still exactly 320px wide (the revealed key wraps, no
overflow). So the complete value is available on the page → PASS.

## Attribute tuple
- **Content domain:** cloud / developer console (secrets management)
- **UI component / pattern:** disclosure (show/hide) reveal on a truncated secret
- **Host-language construct:** `<code>` truncated to prefix+ellipsis; `<button aria-expanded aria-controls>` reveal; JS swaps to full value
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the "truncation WITH a valid reveal" pass that tests the nuance against case-07

## Developer persona
A console engineer who read the Reflow Understanding "Alternative presentations to truncating
content" example. They knew truncation-to-save-space is only acceptable when the full value
remains reachable, so they paired the ellipsis with a real reveal/disclosure plus copy, and made
the revealed value wrap so revealing never reintroduces overflow. (A second card shows the reveal
correctly **disabled** for a key the current member can't see, with an explanatory note — a
realistic permission detail, not the tested element.)

## Element / selector carrying the issue
`code.keyval#k1` (truncated display) together with `#revealBtn` ("Reveal full key",
`aria-controls="k1"`). The reveal exposes `data-full` (the complete key) into `#k1`, which wraps.

## Exact accessibility mechanism
At 320px the card fits with no horizontal scroll because the value is truncated. A user who needs
the whole secret activates "Reveal full key": the element is replaced by the full value, which
wraps within the column (no horizontal scroll reappears), `aria-expanded` flips to `true`, and the
`role="status"` line announces "Full key is now visible." Keyboard and screen-reader users reach
the same value (the button is a real `<button>` with name/role/state; the status region announces
the change). Thus truncation here does **not** hide information: the full value remains available
via an on-page mechanism, satisfying the Understanding doc's condition that truncation is
acceptable only when the content is still reachable.

## Expected ACT-style outcome
**passed** (SC 1.4.10). No content overflows at 320 CSS px, and the truncated value is fully
available through a working reveal mechanism on the same page — so no information is lost to the
truncation.

## Why automated tools miss it
A naive overflow check sees no horizontal scrollbar and would mark this fine — but for the wrong
reason; it cannot evaluate the truncation nuance at all. To judge this page correctly an evaluator
must (1) notice the value is truncated, (2) find the reveal mechanism, (3) confirm it actually
exposes the full value without reintroducing overflow. axe/WAVE/Lighthouse have no rule that
performs steps 1-3, and cannot tell this PASS apart from case-07 (same tidy, non-overflowing
layout) where the reveal is **absent**. Distinguishing "truncated-but-revealable" from
"truncated-and-lost" is exactly the human judgment the Understanding doc calls for.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Examples → Alternative presentations to truncating content (`wcag-understanding/reflow.html`)
> "The content is presented as truncated, but a link is provided to a web page where the content is fully visible without truncation, or a mechanism is provided on the web page to reveal the truncated content."

**Reference:** WCAG Technique F102 — Description (`wcag-techniques/failures/F102.html`)
> "This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."
