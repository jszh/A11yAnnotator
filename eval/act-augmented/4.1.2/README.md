# SC 4.1.2 Name, Role, Value — augmented test corpus

The published ACT rules for SC 4.1.2 are overwhelmingly *presence* checks: they confirm that a control has a non-empty, programmatically determined accessible name (button-name, link-name, image-button name, iframe accessible name), that ARIA roles are valid tokens, and that required states/properties are present. What they cannot decide — because each requires human or vision judgment — is *quality* and *correctness*: whether a present name actually contains the visible label text (F111 / label-in-name overlap), whether a present name is descriptive of the control's purpose (ARIA14 name-quality), whether a syntactically valid role is the *right* role for the control's appearance and behaviour (F15/F59), whether a present and valid state/value actually matches the rendered state, whether a name or value stays correct *over time* after dynamic content changes (F20 temporal correctness), whether a user-settable value is actually settable via AT and its changes notified (F15), whether an iframe's non-empty name describes its real content (TT 12.D), and whether each part of a multi-part field has a name that *distinguishes* it from its siblings (F86 semantic variant). All of these pass the automated presence rules while still failing the SC in spirit and in the user's experience.

This corpus adds eight aspect folders covering exactly those gaps, each built around the limb of 4.1.2 (Name / Role / Value/State, with the temporal and settability sub-limbs) that the ACT rules leave to human judgment. Every aspect now has at least 5 valid human-judgment pages, so the corpus clears its coverage bar. `name-omits-visible-label-text` is the only aspect that does not reach 6 clean valid pages: it has 5 valid pages plus one `needs-fix` (case-03), where the orchestration prompt/manifest describes a different page than the one on disk (the on-disk page is itself a genuine, internally-consistent 4.1.2 failure, but the row's prompt-level scenario, selector, and F111 citation must be regenerated to match the real ARIA16 billing-table case before that page is counted). Several other pages carry recorded-but-non-blocking notes about prompt/file metadata drift and citations that map to the *spirit* rather than the literal procedure of F86/F111/F20; these are documented per-page in `summary.json` and do not change any verdict.

| aspect | valid pages | page statuses |
|---|---|---|
| name-omits-visible-label-text | 5 | valid, valid, needs-fix, valid, valid, valid |
| name-present-but-not-descriptive-of-purpose | 6 | valid, valid, valid, valid, valid, valid |
| wrong-role-valid-but-inappropriate | 6 | valid, valid, valid, valid, valid, valid |
| stale-or-contradicting-state-value | 6 | valid, valid, valid, valid, valid, valid |
| stale-text-alternative-on-dynamic-named-component | 6 | valid, valid, valid, valid, valid, valid |
| value-not-settable-or-change-not-notified | 6 | valid, valid, valid, valid, valid, valid |
| iframe-name-does-not-describe-content | 6 | valid, valid, valid, valid, valid, valid |
| multipart-field-subnames-ambiguous | 6 | valid, valid, valid, valid, valid, valid |
