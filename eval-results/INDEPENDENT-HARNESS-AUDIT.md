# Independent accessibility evaluation harness audit

Date: 2026-06-14

## Executive conclusion

The first-round results are useful as exploratory evidence, but they are not reliable
enough to serve as benchmark ground truth or as a defensible WCAG conformance tally.
Claude's fixes resolve several real defects, especially the large-text threshold and some
focus/VSR artifacts, but they do not resolve all identified issues. Several new fields
also encode incorrect WCAG assumptions, so regenerating the corpus with the current
fixed harness would replace some old false positives with new false positives and false
negatives.

The most consequential remaining problems are:

1. The agent plan and skills misapply several WCAG criteria, especially 4.1.3, 3.3.1,
   2.1.1, 2.5.8, and 1.3.1.
2. The dynamic driver describes synthetic actions as real behavior. Only Tab and arrow
   probes use trusted keyboard input; Enter, Space, click, hover, and Escape are still
   synthetic.
3. The result JSON has systematic internal inconsistencies. Every page has incorrect
   `summary.bySkill` counts, and 204 issue-bearing elements have `anyIssue:false`.
4. Focus, target-size, consent removal, forms, and reading-order fixes remain incomplete.
5. The tests pass their selected examples but do not test the most important correctness
   properties. The documented "run all tests" command fails.

Recommendation: freeze the published tallies as "prototype round 1", correct the
normative rules and harness, add output/schema validation, then regenerate and
independently adjudicate a stratified sample before publishing new totals.

## Scope and method

Reviewed:

- All 56 page folders and their `collect.json`, `drive.json`, `results.json`,
  `notes.md`, and screenshots.
- `eval-results/AGENT-PLAN.md`, `HARNESS-ISSUES.md`, `CHANGES.md`, `SUMMARY.md`,
  and `TALLY.md`.
- All ten skill files and `skills/COVERAGE-GAPS.md`.
- `scripts/eval-page.js`, `drive-page.js`, `verify-finding.js`,
  `lib/a11y-eval.js`, and all tests.
- Authoritative WCAG 2.2 Understanding documents.

Validation performed:

- Read-only corpus-wide JSON checks.
- Visual inspection of representative wrong/blank screenshot pairs.
- Fresh browser collector runs on Home Artera and BuzzFeed.
- Fresh browser geometry probe on the Microsoft Store page.
- Full browser integration suite.
- Unit tests and regression sweep.

## Estimated impact on the first-round results

There are several relevant denominators:

- **792** published/deduplicated actionable findings in `summary.issues`.
- **1,925** actionable REPRODUCED/PARTIAL page and element sub-verdicts.
- **11,708** total page and element skill verdicts, including passes and N/A.
- **1,154** sampled elements across 56 pages.

The most useful estimate is against the 792 published findings.

### Practical estimate

| Impact tier | Published findings | Share | Meaning |
|---|---:|---:|---|
| Evidence or SC is clearly unsupported | **32** | **4.0%** | 14 wrongly scoped 4.1.3 state/dialog findings, 17 native-validation 3.3.1 findings not established by the probe, and 1 definite dynamic verdict on a `notFound` element |
| Likely to materially change | **about 108–118** | **13.6–14.9%** | The 32 above, at least 11 clearly exception-prone target-size findings, and the builder's independently estimated 65–75 focus false positives |
| Must be revalidated | **399** | **50.4%** | Matches at least one validated normative, synthetic-input, focus/visual, target-size, structural, or missing-evidence risk signature |

“Materially change” means disappear, change verdict/confidence, or move to a different
WCAG SC. It does not mean every affected page becomes clean. For example, a hamburger
state finding may move from incorrect 4.1.3 reasoning to a valid 4.1.2 question.

The 108–118 range is deliberately conservative and does not include all questionable
structural findings, synthetic dynamic probes, or target-size cases whose geometry has
not yet been recomputed. It also excludes the known Domino's contrast false negative,
which is missing from the published 792 rather than being an incorrect listed finding.
It assumes the builder's 65–75 focus estimate maps approximately to the deduplicated
published focus findings. If that estimate instead counts only raw/duplicated
sub-verdicts, the directly identifiable lower bound is **43 published findings (5.4%)**,
with focus changes added after focused re-adjudication.

### Broad revalidation scope

The 399 findings requiring revalidation break down as follows. Categories overlap.

| Risk family | Findings | Pages |
|---|---:|---:|
| Normative/rubric risks | **157** | **53** |
| Measurement/dynamic/visual risks | **253** | **50** |
| Either family | **399** | **55 of 56** |

Risk concentration by success criterion:

| SC | Published findings | Matching a validated risk | Share |
|---|---:|---:|---:|
| 4.1.3 Status Messages | 41 | 37 | 90% |
| 3.3.1 Error Identification | 18 | 17 | 94% |
| 2.5.8 Target Size | 42 | 42 | 100% |
| 1.3.1 Info and Relationships | 130 | 84 | 65% |
| 2.4.7 Focus Visible | 161 | 151 | 94% |
| 2.1.1 Keyboard | 60 | 30 | 50% |

These percentages mean “revalidate,” not “incorrect.” For focus, for example, the
current evidence is unreliable for most findings, but some controls genuinely have no
visible indicator.

At the raw analysis level, **1,106 of 1,925 actionable sub-verdicts (57%)** match at
least one risk signature. Aggregation metadata is affected separately: all 56 per-page
`summary.bySkill` objects are inconsistent, 47 pages have an incorrect
`elementsWithIssue`, and 204 issue-bearing elements have `anyIssue:false`.

### Planning implication

Do not selectively rerun only the roughly 108–118 likely changes. Before publishing a
new tally, regenerate and reassess at least the 399 risk-matched published findings,
plus a stratified control sample of apparently unaffected findings and passes. Because
the same harness decisions operate across the corpus, the safest final run remains a
full regeneration after the normative and measurement fixes.

## Critical findings

### C1. The plan misclassifies state changes and dialogs as 4.1.3 failures

`AGENT-PLAN.md` says that an `expandedChanged`, `pressedChanged`, or `dialogOpened`
event without a live/VSR announcement is a 4.1.3 candidate.

That is contrary to WCAG's definition. 4.1.3 applies to status messages: information
about success/results, waiting, progress, or errors that does not receive focus.
W3C explicitly says expanded content, accordions, menus, tabs, and dialogs are not
status messages. State exposure belongs under 4.1.2; dialog focus belongs under focus
management.

Corpus impact:

- 41 summary issues cite 4.1.3.
- At least 6 cite expanded state, 2 pressed state, and 6 dialog behavior.
- Examples include BuzzFeed "Dialog open state not announced via live region",
  Home Artera's hamburger `aria-expanded`, and Google Drive tab/pressed states.

Fix:

- Require the agent to first establish that visible or non-textual status information
  meeting the WCAG status-message definition appeared.
- Test expanded/pressed/selected state through AX state changes under 4.1.2.
- Treat dialogs as focus-management/change-of-context checks, not live-region checks.

### C2. Native browser validation is incorrectly treated as a 3.3.1 failure

The plan says `nativeValidationOnly:true` plus no ARIA/live error is a 3.3.1/3.3.3
candidate. The forms skill also requires association and announcement for a pass.

W3C states that native HTML validation generally meets 3.3.1 because the user agent
shows a text error, focuses the invalid field, and common screen-reader combinations
announce it. ARIA association and live announcement are not required by 3.3.1.
Native messages may still be insufficient for 3.3.3, but that requires evaluating the
actual message and whether a suggestion is possible.

Corpus impact:

- The old driver records 59 `nativeValidationOnly` forms.
- Definite 3.3.1 failures were issued for Amazon Sign-In, Google Drive, Newegg, and
  others based primarily on absence of ARIA/live changes.

The driver does not capture `validationMessage`, `validity`, focus movement to the
invalid field, or a screenshot of the native message. It also labels a form
`nativeValidationOnly` even when no error was demonstrated.

Fix:

- Record whether submit was blocked, the invalid fields, `validationMessage`,
  `document.activeElement`, and whether visible text/native UI appeared.
- Do not infer 3.3.1 failure from missing `aria-invalid`, alerts, or live regions.

### C3. The dynamic driver still uses synthetic actions for most behavioral claims

The changelog and plan repeatedly describe "real clicks", keyboard operation, hover,
and Escape. In the implementation:

- Tab and arrow keys use `page.keyboard.press` and are trusted.
- Custom Enter/Space use `dispatchEvent(new KeyboardEvent(...))`.
- Activation uses `el.click()`.
- Hover uses synthetic `MouseEvent`.
- Tooltip Escape and modal Escape use synthetic `KeyboardEvent`.
- Modal close fallback uses `close.click()`.

This means the driver cannot reliably distinguish a real inaccessible control from a
control that ignores untrusted events. It also cannot prove hover CSS, pointer transit
into a tooltip, real Escape dismissal, or native activation behavior.

Additional driver defects:

- Native elements are declared operable "by definition" and are not exercised.
- The local Tab walk focuses `all[startIdx]` and immediately presses Tab. When the
  target itself is `startIdx`, the walk skips it and may report it unreachable.
- `keyboardOperabilitySignal()` never receives `focusable`, so its only definite
  custom-widget failure branch is unreachable from `drive-page.js`.
- The global trap rule treats repeated focus or normal wraparound as a trap without
  proving that the user cannot leave a component.
- Non-navigation mutations persist into later probes unless a URL/dialog change occurs.

Fix:

- Use `page.keyboard.press`, `ElementHandle.click`/real pointer movement, and a clean
  reload or isolated page for every mutating probe.
- Test equivalent keyboard functionality, not merely whether each visible element is
  Tab-reachable. WCAG 2.1.1 applies to functionality and permits equivalent controls.
- Prove traps with forward/backward movement and component boundaries.

### C4. Target-size fix T3 does not implement WCAG 2.5.8

The helper treats any `display:inline` target as exempt. WCAG exempts a target that is
in a sentence or whose size is constrained by the line-height of non-target text.
Standalone inline navigation/footer links are not automatically exempt.

The spacing calculation uses only nearest center-to-center distance and passes when
that distance is at least 24px. WCAG requires the undersized target's 24px circle not
to intersect:

- another undersized target's 24px circle; or
- any part of another target, including a larger target.

Center distance alone is insufficient for the second case. The helper also does not
model equivalent controls, user-agent controls, target shapes, clipping, or overlapping
target area.

Direct helper proof:

```text
evalTargetSize({w:10,h:10}, {nearestTargetCenterDist:30,isInline:false})
=> passes:true
```

That can be wrong when the neighboring target is large enough to intersect the 12px
radius circle despite its center being 30px away.

Fresh Home Artera output also shows standalone footer links passed with the reason
`inline exception (in text flow)`, demonstrating that CSS display is being used as a
proxy for the normative exception.

Fix:

- Compute circle-to-circle and circle-to-rectangle intersection against every adjacent
  target.
- Detect sentence/line-height context semantically; otherwise leave inline status
  indeterminate.
- Apply the result only to actual pointer targets.

### C5. Result files are internally inconsistent

Corpus-wide checks found:

- All 56 pages have at least one incorrect `summary.bySkill` count.
- 884 individual per-skill count cells disagree with the element records.
- 47 pages have an incorrect `summary.elementsWithIssue`.
- 204 elements contain REPRODUCED or PARTIAL sub-verdicts but have `anyIssue:false`;
  37 of those contain at least one REPRODUCED verdict.
- 54 of 56 pages have a different number of element-level actionable sub-verdicts
  than `summary.issues`.
- Four definite dynamic verdicts remain on driver-`notFound` elements, including the
  already documented Newegg and Macy's cases.

The global `SUMMARY.md` per-skill table happens to match the element records, but the
per-page summaries and `anyIssue` fields cannot be trusted. The phrase "792 actionable
findings" is also ambiguous: there are 1,795 REPRODUCED/PARTIAL element sub-verdicts,
while `summary.issues` is a selectively deduplicated list with undocumented rules.

Fix:

- Generate all summaries deterministically from validated element/page records.
- Define whether an "issue" is a sub-verdict, deduplicated defect, element, or page.
- Reject output when `anyIssue`, counts, or issue lists disagree.

## High-severity findings

### H1. Focus T1/T8 is improved but still not authoritative

The forced `:focus-visible` probe fixes important old false positives, and the Apple
integration cases pass. However:

- Any non-`none` box shadow is treated as a focus indicator, even if it is an
  always-present decorative shadow.
- Any non-`none` outline is treated as visible without checking whether it is clipped,
  obscured, or visually distinguishable.
- A forced diff below 1.5% with no outline becomes `present:false`, although a visible
  background/border change can be smaller than 1.5%, especially on large controls.
- A diff above 1.5% can be caused by animation/layout change rather than focus.
- Forced pseudo-state is not equivalent to real keyboard focus for JS-driven styles,
  parent `:focus-within`, or focus handlers.
- The plan calls `present` authoritative and makes visual review merely corroborative,
  despite WCAG 2.4.7 requiring pixels that visibly change.

Direct helper proof: an always-on box shadow with zero screenshot change is classified
as `present:true`.

The old corpus contains 54 focus REPRODUCED verdicts despite a non-`none` computed
outline, and notes document widespread crop contradictions. The new signal should be
treated as strong evidence, not an unquestionable verdict.

### H2. Screenshot/vision evidence invalidates many definite old verdicts

There are 689 problem bullets in notes. Wrong, blank, black, or off-target crops appear
throughout the corpus.

Visual checks confirmed:

- BuzzFeed `el9.png` and `el9_focus.png` are identical and show the emoji/action strip,
  not the sampled article thumbnail.
- Home Artera `el1.png` is effectively black due to overlay contamination.
- Amazon Spend Less `el13.png` shows "Sign in securely", not the off-screen product link.

Agents often recognized the mismatch but still issued definite verdicts. The fixes do
not repair old bundles; all affected old visual/name/contrast/focus verdicts remain
unreliable until regenerated.

### H3. T9/T10 only fixes activation announcements, not stale walk speech

`meaningfulAnnouncement()` filters click-announcement output. Global `tabWalk.speech`
and local `srWalk.stops[].speech` still read `lastSpokenPhrase()` without clearing or
requiring a changed phrase.

The local SR walk claims to "land on target", but it dispatches a synthetic `focusin`
event and then drives the existing VSR cursor. It does not directly set the VSR active
node. Eight old SR-walk runs have four or more phrases with at most one-third unique
values, and notes explicitly identify stale speech.

The plan incorrectly says `srWalk.targetSpeech` has sticky/stale repeats filtered.

### H4. Consent fix T14 is incomplete and changes the evaluated page

Hiding consent UI before axe, structure, Tab, screenshots, and forms suppresses real
accessibility behavior, including consent-dialog focus traps and labels. It should be
an explicit alternate state, not silently removed from the evaluated page.

Implementation problems:

- `display:none` does not stop `querySelectorAll` from including hidden headings and
  landmarks in `structure`.
- Sampled elements inside a hidden consent container can become invalid samples.
- The selector list misses implementations.

Fresh browser evidence: BuzzFeed returned `consentHidden.count=0`, and its collected
heading tree still included "Manage Consent Preferences", cookie categories, and
"Cookie List".

### H5. Structural skills overclaim WCAG failures

The skills and agents routinely convert best practices into conformance failures:

- `page-structure.md` says no `main`/`nav` fails 1.3.1.
- It says heading-level skips fail 1.3.1 and its classification line includes missing
  h1, despite correctly noting elsewhere that missing h1 is best practice only.
- `list-style:none` is treated as a confirmed 1.3.1 failure across Chrome-evaluated
  pages without validating the actual Safari/VoiceOver exposure or whether list
  semantics are necessary for that content.
- Duplicate headings are often called failures merely because text repeats.

Examples include Amazon Sign-In's "no landmarks" 1.3.1 issue and many page-level
heading-order/list-style findings. These should be separated into normative failures,
AT-specific compatibility risks, and best-practice observations.

### H6. Contrast fixes are incomplete

T4 is correctly fixed in `a11y-eval.js` and the Domino's integration test passes.
However, `skills/color-and-visual-text.md` still gives the old incorrect thresholds
(`>=18.66px` normal or `>=14px` bold), conflicting with the plan and helper.

Other gaps:

- Foreground alpha is parsed but ignored by solid contrast math.
- Child-color detection misses pseudo-elements, shadow DOM, and same-color text over a
  different painted backdrop.
- Overlay/background reliability is heuristic and cannot detect overlapping siblings.
- Pixel contrast segmentation is explicitly heuristic but is sometimes treated as
  pass/fail-grade evidence.

### H7. Static collector does not collect the states required by the skills

The collector emits AX role, name, tree inclusion, and focusability, but not checked,
selected, expanded, disabled, pressed, current, value, or other AX states. The
name-role-state and dynamic-state skills therefore cannot establish whether state is
properly exposed, only whether a few DOM attributes changed during a synthetic click.

## Tests and claimed fixes audit

### What is validated

- `node --test scripts/tests/unit.test.js`: 21/21 pass.
- Full browser integration suite: 9/9 pass in about 201 seconds.
- T4 implementation correctly gives Domino's 16px bold text a 4.5 threshold.
- Selected Apple focus cases now produce the expected tri-state.
- The selected Google Drive tab is downgraded to indeterminate.
- Activation `vsrAnnouncement` filters the selected BuzzFeed `"document"` artifact.
- Selected Reebok zero-field forms are skipped.

### Why the suite is not robust enough

- Integration tests auto-skip and pass with zero executed tests when the server is
  unavailable.
- The documented `node --test scripts/tests/` command fails with
  `MODULE_NOT_FOUND` in the current Node runtime.
- T3 integration asserts that all undersized Home Artera links pass; it does not test
  the normative geometry or inline exception.
- T14 integration only asserts that at least one Domino's selector matched.
- T1/T8 tests do not cover always-on shadows, low-diff visible changes, focus-within,
  clipped indicators, or animation false positives.
- No integration test proves real Enter/Space/click/hover/Escape behavior.
- No test validates result schema/count consistency.
- No test covers 4.1.3 scope, native validation, equivalent keyboard functionality,
  or structural best-practice vs conformance distinctions.
- `regression-sweep.js`'s T3 loop is a no-op.
- The sweep checks only that `present` exists, not that it is `true|false|null`.
- The sweep does not test T6, T10 walk speech, T12, T13, T14, result summaries, or
  agent-plan compliance.
- Running the sweep on old data and seeing 885 failures demonstrates old-data
  incompatibility, not that fresh fixed output is correct.

## Fix-by-fix disposition

| Claimed fix | Disposition |
|---|---|
| T1/T8 focus | Partially effective; still overconfident and has new false-positive/negative paths |
| T2 keyboard | Roving-tab downgrade is useful; broader keyboard probe remains synthetic/incomplete |
| T3 target size | Not WCAG-correct; must be redesigned |
| T4 large text | Implementation fixed; skill documentation still wrong |
| T5/T11 contrast | Useful routing heuristics, not sufficient reliability detection |
| T6 notFound | Prompt improved; old corpus still has definite dynamic verdicts; retry is weak |
| T9/T10 VSR | Activation filter improved; walk speech remains stale/unfiltered |
| T12 media | Useful flags; does not address all offline-media effects |
| T13 tab cap | Higher cap helps; trap detection and local-walk logic remain invalid |
| T14 consent | Incomplete and methodologically unsafe |
| T15 forms | Zero-field skip helps; form/error probe remains insufficient |
| T7/T16 | Correctly acknowledged limitations, but old tallies still read too conclusively |

## Recommended remediation order

1. Correct the skills and `AGENT-PLAN.md` against WCAG before generating more data.
   Specifically fix 4.1.3, 3.3.1, 2.1.1, 2.5.8, landmarks/headings, and the contrast
   threshold contradiction.
2. Replace synthetic behavior probes with trusted browser input and isolate every
   mutating probe in a clean state.
3. Redesign target-size geometry, focus evidence, form validation capture, trap
   detection, and VSR walk attribution.
4. Add a deterministic result builder/schema validator. Fail the run on count,
   `anyIssue`, required-field, or verdict/evidence inconsistencies.
5. Evaluate consent-present and consent-dismissed states separately.
6. Expand tests around normative counterexamples and require integration tests to run
   rather than silently skip.
7. Regenerate all `collect.json` and `drive.json`, rerun agents, then independently
   adjudicate a stratified sample of failures, passes, and partials before recomputing
   any headline totals.

## Authoritative references

- WCAG 2.2 Understanding 2.5.8 Target Size (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 Understanding 2.4.7 Focus Visible:
  https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- WCAG 2.2 Understanding 2.1.1 Keyboard:
  https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html
- WCAG 2.2 Understanding 3.3.1 Error Identification:
  https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- WCAG 2.2 Understanding 4.1.3 Status Messages:
  https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- WCAG 2.2 Understanding 1.3.1 Info and Relationships:
  https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html
- WCAG 2.2 Understanding 2.4.6 Headings and Labels:
  https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html
