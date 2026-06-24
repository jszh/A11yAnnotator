# SC 2.4.7 Focus Visible — augmented test corpus

The ACT rule for SC 2.4.7 (oj04fd, "Element with keyboard focus has visible focus indicator") only checks whether *some* pixel changes between the unfocused and focused states. That is a deliberately low bar that misses most of the ways a real page can fail 2.4.7: an indicator can render yet be perceptually indistinguishable from the resting style or swallowed by a same-color border (F78 modes 2 & 3); it can be present but below the human perception threshold (too thin, too low-contrast, too small — the loophole G195 articulates); a script can remove or steal focus the instant it lands (F55), violating the "when focus is shown it must remain" temporal limb; visual feedback can exist only for pointer interaction (:hover/:active or a :focus-visible mismatch) so keyboard focus is left bare (C45); a custom-drawn indicator can vanish in forced-colors mode or be untrackable by assistive technology (G165/C40); and an indicator can be drawn but clipped by overflow or pushed outside the visible viewport so the user never sees it. Every one of these passes oj04fd while still failing the SC, which is why they require human judgment.

This corpus adds six hand-built aspects, each with five failing cases plus one PASS/boundary anchor (six pages per aspect). All 36 pages were scored deterministically and every page is **valid** — all six aspects clear the 5-valid-human-judgment-page bar, so none is short. Each failing page is a genuine 2.4.7 defect that automated tooling does not catch; each PASS anchor documents a real passing mechanism (and, where relevant, the contrastive sibling needed to make the boundary meaningful).

| aspect | valid pages | page statuses |
|---|---|---|
| indicator-camouflaged-by-resting-style-or-same-color-border | 6 | valid, valid, valid, valid, valid, valid |
| indicator-below-perception-threshold | 6 | valid, valid, valid, valid, valid, valid |
| script-removes-focus-on-receipt | 6 | valid, valid, valid, valid, valid, valid |
| pointer-only-feedback-masquerading-as-focus | 6 | valid, valid, valid, valid, valid, valid |
| drawn-indicator-fails-forced-colors-or-at-tracking | 6 | valid, valid, valid, valid, valid, valid |
| indicator-clipped-or-scrolled-out-of-visible-viewport | 6 | valid, valid, valid, valid, valid, valid |
