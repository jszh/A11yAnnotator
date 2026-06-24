# case-06 — Support chat transcript reversed by CSS grid so replies precede questions (FAIL)

## Scenario
A saved customer-support chat transcript (a duplicate-charge dispute with a bank). A dialogue is
intrinsically order-dependent: a reply only makes sense after the message it answers. Each chat
bubble is a CSS-grid item, and `grid-row` lays them out in the correct visual top-to-bottom
conversation order (customer opens &rarr; agent asks &rarr; customer answers &rarr; agent resolves
&rarr; customer thanks &rarr; agent closes). But the DOM stores the messages newest-first (a
"prepend the new message" anti-pattern), so the linearized reading order is REVERSED: a screen
reader hears the agent&rsquo;s closing "Glad I could help! The refund will land in 3&ndash;5
working days" before the customer&rsquo;s opening "Hi, I was charged twice...". The conversation
plays back-to-front. Order is meaningful here, so the applicability gate is tripped &mdash; the
deliberate contrast to the order-irrelevant PASS cases.

## Attribute tuple
- **Content domain:** online banking / fintech customer support
- **UI component / pattern:** chat/message thread (`role="log"`) of dialogue bubbles
- **Host-language construct:** CSS `display:grid` with per-message `grid-row` overriding a
  newest-first DOM order
- **Locale / i18n:** en-GB
- **Failure mechanism:** F1-style visual-vs-DOM order &mdash; CSS grid renders the conversation in
  order while the DOM is reversed, so the reading order inverts a meaningful dialogue

## Developer persona
A developer wired the transcript renderer to the same component used for the live chat, which
prepends each new message to the top of the list (newest-first) and relies on `grid-row` /
`flex-direction:column-reverse` to flip it visually right-way-up. For the live widget the user
scrolls and never notices; in the exported transcript the reversed DOM order is now the
programmatic reading order, and no one linearized it.

## Element / selector carrying the issue
The `div.thread` grid and its message children `#m6 ... #m1` (DOM order is `#m6` first, `#m1` last;
`grid-row` makes the visual order `#m1` first, `#m6` last). The reversal is the defect.

## Exact accessibility mechanism
A screen reader and the linearized DOM ignore `grid-row` and read source order: agent "Glad I could
help! The refund of &pound;42.00 will land in 3&ndash;5 working days" &rarr; customer "Perfect,
thank you" &rarr; agent "I&rsquo;ve voided it and raised a refund" &rarr; customer "It&rsquo;s the
&pound;42.00 to Northside Groceries, listed twice" &rarr; agent "Can you tell me the merchant name?"
&rarr; customer "Hi, I was charged twice...". The resolution is announced before the problem and
every answer before its question; a non-sighted user cannot follow the dispute. A conversation is
meaningful sequence, and the programmatically determined order contradicts it, so the content fails.

## Expected ACT-style outcome
**failed** (SC 1.3.2, F1). The visual order is a coherent conversation, but the reading order
exposed to AT is the reverse, which changes (destroys) the meaning of the exchange.

## Why automated tools miss it
The grid, the `grid-row` rules, the `role="log"`, and the bubble markup are all valid &mdash;
nothing missing, no malformed attribute &mdash; and there is no 1.3.2 rule in axe/WAVE/Lighthouse.
There are no timestamps or sequence numbers a tool could sort against. Realising the transcript is
reversed requires reading the dialogue and recognising that replies precede their prompts &mdash;
a reading-comprehension judgement automated tools cannot make.

## Citation
**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, Intent (`wcag-understanding/meaningful-sequence.html`)
> "It is important that it be possible to programmatically determine at least one sequence of the content that makes sense. Content that does not meet this Success Criterion may confuse or disorient users when assistive technology reads the content in the wrong order."

**Reference:** WCAG Technique F1 &mdash; *Failure ... due to changing the meaning of content by positioning information with CSS* (`wcag-techniques/failures/F1.html`)
> "it is important not to rely on CSS to visually position content in a specific sequence if this sequence results in a meaning that is different from the programmatically determined reading order."
