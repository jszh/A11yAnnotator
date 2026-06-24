# SC 1.4.5 Images of Text — augmented test corpus

The ACT rules for WCAG SC 1.4.5 (Images of Text, Level AA) exercise only the mechanically detectable surface of the criterion — they can confirm that an `<img>`, SVG, or CSS background renders glyphs, but they cannot reason about the criterion's exception structure or its content-equivalence conditions. As a result the ACT suite leaves the human-judgment core of 1.4.5 untested: whether an "it's our logo/branding" claim is a bad-faith dressing-up of ordinary informational text (false-logotype-branding-exemption); whether on-page controls genuinely satisfy the customizable-presentation exception or only fake it (customizability-exception-onpage-controls, technique C30); where the definition's "significant other visual content" exclusion correctly removes graphs/diagrams/screenshots from scope versus where it is misapplied to text-only images (significant-other-visual-content-exclusion); when an image of text is rescued by genuinely equivalent live text presented "in addition to" it versus when the live text drops or drifts from the imaged content (in-addition-to-equivalent-live-text); the non-logo essential-presentation branches such as font/type specimens, historical-original formats, and symbolic non-language glyphs (essential-presentation-beyond-logos); and the core image-of-text-vs-live-text detection across delivery mechanisms (img, SVG-via-img, CSS `background-image`, generated `::before` content) with decoy programmatic text (image-of-text-vs-live-text-core-detection).

This corpus adds six aspects, each backed by six validated pages (a mix of `failed`, `passed`, and `inapplicable` boundary cases) that all require human judgment and have been confirmed against the rendered DOM, the accessibility tree (CDP `Accessibility.getFullAXTree`), and the cited WCAG Understanding / Trusted Tester sources. Every aspect meets the bar of at least five valid human-judgment pages — in fact all six aspects carry six valid pages each — so no aspect is short of the threshold.

| aspect | valid pages | page statuses |
|---|---|---|
| false-logotype-branding-exemption | 6 | valid, valid, valid, valid, valid, valid |
| customizability-exception-onpage-controls | 6 | valid, valid, valid, valid, valid, valid |
| significant-other-visual-content-exclusion | 6 | valid, valid, valid, valid, valid, valid |
| in-addition-to-equivalent-live-text | 6 | valid, valid, valid, valid, valid, valid |
| essential-presentation-beyond-logos | 6 | valid, valid, valid, valid, valid, valid |
| image-of-text-vs-live-text-core-detection | 6 | valid, valid, valid, valid, valid, valid |
