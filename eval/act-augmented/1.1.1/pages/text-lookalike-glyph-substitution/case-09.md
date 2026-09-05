# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> E-commerce checkout trust copy 'You'll be redirected to PayPal to approve $2,040.00.' where the brand name 'PayPal' is the confusable string U+0420 U+0430 U+0443 U+0420 U+0430 U+006C (five Cyrillic look-alikes plus a Latin l), with no real-text brand label.

## Exact repair

Replaced only the two Cyrillic look-alike brand strings with genuine Latin “PayPal” text. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`p.note > span.brand`

## Accessibility mechanism

The payment badge and trust sentence keep the same visible brand and checkout context, but both now use genuine Latin PayPal text, so TTS and text processing receive the intended processor name.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced only the two Cyrillic look-alike brand strings with genuine Latin “PayPal” text.

## Citation retained from the source case

**Reference:** WCAG Technique F71 (wcag-techniques/failures/F71.html)

> While the glyphs for some of these characters may look like the glyphs for other characters in visual presentation, they are not processed the same by text-to-speech tools.

