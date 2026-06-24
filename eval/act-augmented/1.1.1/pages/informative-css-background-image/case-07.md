# case-07 — PASS control: order-status badge background image whose meaning is also text

## Scenario
An order-tracking timeline. Each step has a status **badge** drawn as a CSS
`background-image` glyph (tick, truck, clock) — the *same carrier mechanism* as the failing
pages — but the meaning of every glyph is also written as a real, adjacent text node
("Order confirmed", "Dispatched from warehouse", "Out for delivery", "Delivered"), and each
badge `<span>` is marked `aria-hidden="true"` so AT does not stumble on an empty element. This
is the intended PASS boundary: an informative-looking background image that is actually
redundant with text, satisfying F3 test step 2 and Trusted Tester 7.C.

## Attribute tuple
- **content-domain:** e-commerce / order fulfilment
- **UI-component / pattern:** vertical status timeline with state badges
- **host-language construct:** stylesheet `background-image` on `<span class="badge">` (`aria-hidden`), text in sibling `<div class="status">`
- **locale / i18n:** en-GB
- **failure-mechanism:** none — background-image meaning is duplicated in adjacent DOM text (redundant / decorative reinforcement)

## Developer persona
A developer who had previously been pulled up in an audit for image-only status icons. This
time they kept the visual badges (users like them) but added a plain-text status label beside
each one and set the decorative glyphs `aria-hidden` so screen readers announce the text once,
cleanly. This is the "do it right" counterpart to the failing pages, included so the set
exercises both sides of the 7.C judgment.

## Element / selector carrying the issue (here: the thing that makes it PASS)
- `.badge.done / .truck / .wait` — `aria-hidden` background-image glyphs.
- `.step .status` — the text node that states the same meaning ("Out for delivery", etc.),
  immediately adjacent and in the same logical reading order.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears each step in order: "Order confirmed, Mon 16 Jun 9:04 AM …
Out for delivery, Today 8:12 AM … Delivered, Awaiting — expected by 6 PM." Every status the
badges convey visually is also announced as text, so no information is lost. The badges are
`aria-hidden`, so they are not announced as empty/ambiguous nodes. In forced-colors /
"hide backgrounds", the text remains and the status is still fully available. The background
images are effectively decorative reinforcements of text.

## Expected ACT-style outcome
**passed** — the background images are not the only means of conveying the status; the
equivalent information is available as text in the same logical order. (As with the other
pages, ACT 1.1.1 accessible-name rules are **Inapplicable** to the background-image carrier;
the PASS is established by the human/AT-level 7.C judgment, not by an ACT rule firing.)

## Why automated tools miss it
For the same structural reason as the failures: automated tools cannot evaluate a
`background-image` for 1.1.1 at all, so they neither flag nor clear it. Crucially, an automated
tool *cannot tell this PASS apart from the case-02/case-06 failures* — all use a background-image
status glyph; only a human performing the two-step 7.C judgment (is the image informative? is
the meaning redundant in adjacent text?) can determine that here the answer to step 2 is "yes",
making it a pass. That is exactly the judgment this aspect targets.

## Citation
**Reference:** Trusted Tester v5.1.3 — Test 7.C, Evaluate Results (PASS if ANY true)
(`refs/trusted-tester/sc-1.1.1-non-text-content.md`).

> "The meaning of the background image is also available without the background image."

**Supporting reference:** WCAG Technique F3 — Tests
(`wcag-techniques/failures/F3.html`).

> "Check if the images convey information that is not already conveyed elsewhere on the page."
