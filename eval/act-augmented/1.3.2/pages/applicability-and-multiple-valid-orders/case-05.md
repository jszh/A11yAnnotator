# case-05 — Assembly guide whose steps are visually correct but DOM-scrambled (FAIL)

## Scenario
A four-step furniture-assembly guide ("Assembling the Lindholm shelf bracket"). Visually the steps
read in the correct sequence &mdash; attach the wall plate, insert the bracket pins, hang the shelf,
tighten and check &mdash; because CSS `order:` forces that on-screen sequence. But the steps are not
in an `<ol>`; they are sibling `<div class="step">` cards in a flex column, and their DOM order is
scrambled (shelf, tighten, plate, pins). So a screen reader, which ignores CSS `order`, reads them
in the wrong sequence: "Hang the shelf" first, "Attach the wall plate" third. The headings are
unnumbered ("Attach the wall plate", not "Step 1"), so the ONLY cue that the order is wrong is the
prose ("First,", "Next,", "Then,", "Finally,"). This is genuinely order-dependent content, so the
applicability gate IS tripped &mdash; the contrast to the PASS cases.

## Attribute tuple
- **Content domain:** developer/consumer how-to &mdash; furniture assembly instructions
- **UI component / pattern:** stepper/wizard rendered as flex cards (not an ordered list)
- **Host-language construct:** `display:flex; flex-direction:column` with per-step `order:` overriding DOM order
- **Locale / i18n:** en
- **Failure mechanism:** F1 / visual-vs-DOM order &mdash; CSS `order` reorders a genuinely
  sequential procedure so the linearized reading order is nonsensical

## Developer persona
A junior front-end dev rebuilt the help-centre article as "cards". The content team handed over the
steps in whatever order they were edited, and the dev got the visual order right by adding `order:`
rules per card rather than physically reordering the markup &mdash; "it looks right, ship it." They
never linearized the page or tabbed through it, so the scrambled DOM order went unnoticed.

## Element / selector carrying the issue
The `div.steps` flex container and its children `#s-shelf`, `#s-tighten`, `#s-plate`, `#s-pins`. The
DOM sequence is shelf &rarr; tighten &rarr; plate &rarr; pins; the `order:` rules make the visual
sequence plate &rarr; pins &rarr; shelf &rarr; tighten.

## Exact accessibility mechanism
A screen reader and the linearized DOM both ignore CSS `order`, so they present: "Hang the shelf...
Then lower the shelf board onto the two bracket arms", then "Tighten and check... Finally tighten
the two grub screws", then "Attach the wall plate... First, hold the steel wall plate", then
"Insert the bracket pins... Next, screw the two bracket arms". A user following the spoken order
would try to hang a shelf onto bracket arms and a wall plate that have not yet been installed. The
procedure is meaningful sequence, and the programmatically determined order does not match it, so
the content fails.

## Expected ACT-style outcome
**failed** (SC 1.3.2, F1; Trusted Tester 15.A). When the page is linearized (CSS positioning/order
stripped), the reading order of the steps is no longer understandable.

## Why automated tools miss it
The flex container, the `order:` declarations, and the `<div>` cards are all valid markup &mdash;
nothing is missing, and there is no numbered list whose numbers a tool could compare against
position. No automated tool runs a 1.3.2 check. Detecting the failure requires understanding that
these are sequential assembly steps and that the spoken order ("hang the shelf" before "attach the
wall plate") is physically impossible &mdash; a semantic reading-comprehension judgement.

## Citation
**Reference:** WCAG Technique F1 &mdash; *Failure ... due to changing the meaning of content by positioning information with CSS* (`wcag-techniques/failures/F1.html`)
> "The order in which items appear on a screen may be different than the order they are found in the source document. Assistive technologies rely on the source code or other programmatically determined order to render the content in the correct sequence."

**Reference:** Trusted Tester v5.1.3 &mdash; Test 15.A `1.3.2-content-order-meaning-css-position` (`refs/trusted-tester/sc-1.3.2-meaningful-sequence.md`)
> "The reading order of the content (in context) is correct and the meaning of the content (in context) is preserved without CSS positioning."
