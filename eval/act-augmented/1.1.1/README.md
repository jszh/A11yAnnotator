# SC 1.1.1 Non-text Content — augmented test corpus

The ACT rules that map to SC 1.1.1 are almost entirely *presence/identity* checks on the accessible name (e.g. image has a non-empty accessible name, image accessible name matches a known good value). By design they assess whether *a* text alternative exists and is reachable — they deliberately disclaim the harder half of the SC: whether that alternative actually **serves the same purpose** (G94), presents the **same information** for complex content, describes the **function** of a control or link, and whether content the SC *does* cover but ACT's accessible-name machinery structurally **cannot reach** (CSS background images, canvas, glyph-substituted text) is handled at all. The "conveys information ⇒ must have an equivalent" limb and its "decoration/invisible ⇒ ignored by AT" exception limb — and the boundary between them — are essentially un-exercised by the ACT presence rules.

This corpus adds seven aspects, each as a 7-page family (6 failing/boundary cases plus a calibration PASS control), all hand-labeled as requiring human judgment: information carried only by a CSS `background-image`; genuinely informative images wrongly suppressed as decorative (`alt=""` / `role=presentation`); non-empty alt that is not an alternative (filename / placeholder / auto-label, F30); alt that is literally accurate but wrong for the image's purpose-in-context (link target or control function); complex images (charts/diagrams/maps) whose long description drops information (F67/G95); images of text whose alt omits the displayed text (TT 7.A.1.d); and text-look-alike glyph/homoglyph substitution with no text alternative (F71). Every aspect reached **7 valid human-judgment pages** — all are at or above the 5-valid-page target, so none is short.

| aspect | valid pages | page statuses |
|---|---|---|
| informative-css-background-image | 7 | valid, valid, valid, valid, valid, valid, valid |
| meaningful-image-suppressed-as-decorative | 7 | valid, valid, valid, valid, valid, valid, valid |
| alt-not-an-alternative-filename-placeholder | 7 | valid, valid, valid, valid, valid, valid, valid |
| context-and-function-dependent-equivalence | 7 | valid, valid, valid, valid, valid, valid, valid |
| complex-image-long-description-incomplete | 7 | valid, valid, valid, valid, valid, valid, valid |
| image-of-text-alt-omits-the-text | 7 | valid, valid, valid, valid, valid, valid, valid |
| text-lookalike-glyph-substitution | 7 | valid, valid, valid, valid, valid, valid, valid |
