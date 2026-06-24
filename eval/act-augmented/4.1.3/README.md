# SC 4.1.3 Status Messages — augmented test corpus

The published ACT rules for SC 4.1.3 effectively test only the mechanical, statically-determinable end of the criterion: that a live region exists and carries a valid `role`/`aria-live` so a status message *can* be programmatically surfaced without taking focus. They say nothing about whether the live region is the *right* one for the message's urgency and update frequency, whether a partial update without `aria-atomic` produces a truncated and meaning-losing announcement, whether the region was wired up *before* its content was added (the F103 timing limb), whether the announced text actually carries the visual context that makes it meaningful, whether the *removal* of status text (which itself conveys status) is announced at all, whether a non-textual status (icon or sound) is given a usable text alternative, and — at the definitional edge — whether a given change is even *in scope* as a status message versus a change-of-context exception. These are exactly the limbs that require human judgment against the Understanding document, the failure technique F103, and the sufficient techniques SCR14 / ARIA19 / ARIA22, and they are where automated checkers are silent or actively misleading.

This corpus adds seven aspects covering those gaps. Each aspect is finalized with 6 valid pages (a mix of `failed`, `passed`, and `inapplicable` boundary controls), every page hand-reviewed and confirmed to require human judgment; all seven aspects meet and exceed the 5-valid-page bar, so none is short. Several pages carry disclosed task-prompt/metadata mismatches (stale prompt headers describing a different scenario than the on-disk artifact) and AT-environment caveats (live-region behavior is version-dependent across NVDA/JAWS/VoiceOver); in every case the on-disk artifact was judged on its own merits, found internally coherent, and the documented expected outcome confirmed correct, so all pages are kept.

| aspect | valid pages | page statuses |
|---|---|---|
| wrong-live-region-politeness-for-urgency | 6 | valid, valid, valid, valid, valid, valid |
| partial-update-no-atomic-truncated-announcement | 6 | valid, valid, valid, valid, valid, valid |
| after-the-fact-live-region-timing | 6 | valid, valid, valid, valid, valid, valid |
| announced-text-lacks-visual-context | 6 | valid, valid, valid, valid, valid, valid |
| removal-of-status-conveys-meaning-silently | 6 | valid, valid, valid, valid, valid, valid |
| non-textual-status-icon-sound-without-text-alt | 6 | valid, valid, valid, valid, valid, valid |
| is-it-a-status-message-scope-boundary | 6 | valid, valid, valid, valid, valid, valid |
