# case-02 — "PayPal" brand wordmark in checkout trust copy, built from Cyrillic confusables

## Scenario
A furniture store's order-confirmation page tells the buyer how they will pay. The trust
sentence reads **"You'll be redirected to PayPal to approve $2,040.00."** The brand name
"PayPal" is the confusable string `Р а у Р а l` = `U+0420 U+0430 U+0443 U+0420 U+0430
U+006C` — five Cyrillic look-alikes plus a single Latin `l`. The same confusable spelling
is used in the payment-method badge. There is no real-text brand label anywhere.

## Attribute tuple
- **content-domain:** e-commerce checkout (home furnishings)
- **UI-component / pattern:** payment-method panel + trust/reassurance microcopy
- **host-language construct:** inline `<span>` brand name inside a `<p>` (body text), plus a styled badge `<span>`
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Cyrillic
- **failure-mechanism:** F71 raw confusables on a load-bearing BRAND NAME, no text alternative

## Developer persona
An agency built this checkout from a marketplace theme. The "PayPal" string in the theme's
demo data had been pasted from a third-party "logo text" snippet (originally from a
phishing-kit template circulating on a forum) where the brand was spelled in Cyrillic to
dodge naive brand filters. The agency dev kept the demo copy verbatim, swapped in the
client's prices, and shipped. The visual brand looks correct, so it passed design review.

## Element / selector carrying the issue
- `p.note > span.brand` (equivalently the bare `span.brand`) — the brand `<span>` lives
  inside the trust paragraph `<p class="note">`, which is a *sibling* of `.pay`, not a
  child of it, so `.pay > .brand` resolves to nothing. Its text decodes to
  `U+0420 U+0430 U+0443 U+0420 U+0430 U+006C` (visible: "PayPal"); no `aria-label`,
  no visually-hidden real-text brand name.
- `.pay > .badge` (the styled wordmark badge, a direct child of `.pay`) repeats the
  confusable wordmark visually; its text decodes to `U+0420 ay U+0420 al`.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears the trust sentence with the brand name read as its Cyrillic
code points — e.g. "Er a u Er a l," or a Russian-language reading of the letters — instead
of "PayPal." The buyer cannot confirm *which* payment processor they are about to be sent
to, which is exactly the fact the sentence exists to convey (and a security-critical one).
Per F71 the look-alike brand text has no text alternative, so the meaning rides entirely on
the glyph shapes.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via **F71**. No name-bearing graphical element exists, so all ACT
1.1.1 rules are *Inapplicable*; the defect is the un-alternatived look-alike brand text.

## Why automated tools miss it
No `img`/`svg`/`role="img"` is involved, so axe-core, WAVE, and Lighthouse find nothing for
1.1.1. The paragraph and badge are valid, non-empty, high-contrast text. A scanner cannot
tell that this "PayPal" is six confusables impersonating a brand rather than a legitimate
(if unusual) string — and note that the visible submit button "Pay with PayPal" *is* in
correct Latin, so the page even contains a genuine spelling, deepening the ambiguity.
Recognizing the substitution requires reading the glyphs against `lang="en"` — human
judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "While the glyphs for some of these characters may look like the glyphs for other
> characters in visual presentation, they are not processed the same by text-to-speech
> tools."

**Supporting reference:** same technique, on the absence of an alternative as the failure
condition.

> "If look-alike glyphs are used, and there is not a text alternative for any range of text
> that uses look-alike glyphs, then the content does not meet the Success Criterion."
