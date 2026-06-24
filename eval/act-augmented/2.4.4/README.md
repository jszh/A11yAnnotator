# SC 2.4.4 Link Purpose (In Context) — augmented test corpus

The published ACT rules for SC 2.4.4 (Level A) stop at thin, automatable floors: c487ae checks only that a link has *some* non-empty accessible name, F89 covers image-only links with an empty name, and fd3a94 fires only in the narrow, mechanically-detectable case of identical names sharing one literal programmatic context. None of these touches the substantive limb of 2.4.4 — whether the link text, together with its *programmatically determined* link context, actually conveys the link's **purpose** so a user can decide whether to follow it. The ACT corpus therefore says nothing about generic boilerplate text that no nearby context rescues (G91/H30), purpose that exists on the page but lives *outside* the programmatic link context (F63), icon/SVG links whose non-empty name misdescribes the rendered glyph (an F89 semantic-mismatch variant), duplicate names with identical context but genuinely different destinations (the human equivalence judgment fd3a94 declines to automate), the sufficiency of a preceding heading or list grouping as the purpose carrier (H80), or a well-formed name that contradicts its actual on-page destination.

This corpus fills those six gaps with hand-authored, human-judgment pages (5 failing/boundary cases plus a PASS control per aspect). Every page is marked `requiresHumanJudgment: true`: each turns on a determination no scanner can make — whether conveyed purpose is *adequate*, whether context is *associated with the link*, whether two destinations are *genuinely distinct*, or whether a name *contradicts* its target. Five of the six aspects reach 6 valid pages. The exception is **duplicate-name-same-context-different-purpose**, which currently has 5 valid pages: `case-06` is flagged `needs-fix` (its documented `passed` outcome is incorrect), leaving that aspect with 5 valid human-judgment pages — at the floor but with no spare control. All other aspects are comfortably above the 5-valid-page bar.

| aspect | valid pages | page statuses |
|---|---|---|
| generic-link-text-no-rescuing-context | 6 | valid, valid, valid, valid, valid, valid |
| context-outside-programmatic-link-context-f63 | 6 | valid, valid, valid, valid, valid, valid |
| icon-link-name-present-but-wrong-or-meaningless | 6 | valid, valid, valid, valid, valid, valid |
| duplicate-name-same-context-different-purpose | 5 | valid, valid, valid, valid, valid, needs-fix |
| preceding-heading-or-list-grouping-context-sufficiency | 6 | valid, valid, valid, valid, valid, valid |
| descriptive-name-contradicts-on-page-destination | 6 | valid, valid, valid, valid, valid, valid |
