# Teal external links retain color and gain destination text

- Expected: `passed`
- Category: Residual-cue tunnel vision
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept every teal external-link color and appended the visible cue “↗ opens in a new tab” to each affected link.
- Primary selector: `a.newwin .destination-cue`

## Why this passes

Users no longer need to perceive teal to know which links open a new tab. The symbol and words repeat the same action while preserving the source palette.

## Accessibility-tree / visual evidence

Each target link's computed name includes “opens in a new tab,” and the cue remains visible without hover or focus.

## Why automated tools may miss the boundary

A detector fixated on the unchanged teal rule can overlook the complete visible and programmatic text repair.

## Citation

- Document: `wcag-techniques/general/G14.html`
- Verbatim quote: “The objective of this technique is to ensure that when color differences are used to convey information, such as required form fields, the information conveyed by the color differences are also conveyed explicitly in text.”
