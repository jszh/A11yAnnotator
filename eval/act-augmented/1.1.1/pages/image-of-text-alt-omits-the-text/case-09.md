# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Long-form news article drops in a stylised pull-quote baked into an image (inline-SVG data: URI): 'The future is already here — it's just not very evenly distributed.' — William Gibson, 1993. alt='Decorative pull-quote graphic in the article' labels the image; surrounding prose never restates the quote, so AT users lose both the quotation and its attribution.

## Exact repair

Replaced only the generic pull-quote alt with the complete quotation and attribution visible in the unchanged image. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`img.pullquote[alt^="The future is already here"]`

## Accessibility mechanism

The alt now contains the full William Gibson quotation and the 1993 attribution, while the rendered image and article remain unchanged.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced only the generic pull-quote alt with the complete quotation and attribution visible in the unchanged image.

## Citation retained from the source case

**Reference:** wcag-techniques/general/G94.html

> When non-text content contains words that are important to understanding the content, the alt text should include those words.

