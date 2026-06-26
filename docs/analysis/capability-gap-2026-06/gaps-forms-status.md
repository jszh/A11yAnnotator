# Capability gaps — Forms & Status SCs (3.3.1, 3.3.2, 3.3.3, 4.1.3)

Capability-gap analysis for 26 aspects across the four form/error/status SCs. Each aspect is judged
against the harness's CURRENT capability (deterministic runners + declared-evidence rubrics + the
LLM-callable CDP tools, where actually ROUTED). Reasoned only from aspect slug + WCAG 2.2
Understanding/Techniques + Trusted Tester v5.1.3 form/error procedures + EN 301 549 + our code.

**Pervasive structural facts that drive the verdicts below:**

- **3.3.1 / 3.3.3 driving** — `form-error-probe` (exp-runners.js C6b) DOES drive submit-invalid and diff
  visible error surfaces before/after; the rubrics (`error-identification-v0`, `error-suggestion-v0`)
  declare `[state-before, state-after]` and judge the rendered message text. So the *demonstrate-an-error*
  capability EXISTS. The gaps are in **which error condition** is provoked (one canonical invalid submit,
  not per-rule), and in **proximity/association/cross-field-coherence** judgment.
- **3.3.2 has NO routed CDP tools** — `field-label-v0` declares `[element-crop]` only; `cdp-tool-catalog.js`
  routes NOTHING to `3.3.2` (no `query_ax_node`, no `observe_state`). Focus-revealed instructions and
  visible-but-unassociated text are partly handled by `field-label-probe`'s `nearbyVisibleText` /
  `programmaticNamePresent` but spatial proximity and dynamic reveal are not captured.
- **4.1.3 is the worst-served** — `status-message-v0` declares `[viewport]` ONLY. The CDP tools that DO
  carry the dynamic facts (`observe_state_after_activation`, `probe_screen_reader_after_action`) are
  LLM-triggered and only present in a **tools-enabled** run; the default lane is a still viewport that
  cannot see announcement timing, the politeness LEVEL, atomic/relevant truncation, or silent REMOVAL.
- **Politeness LEVEL is never surfaced as a judgable signal** — every instrument collapses
  polite/assertive/status/alert into one boolean `inLiveRegion`. The polite-vs-assertive *urgency match*
  (4.1.3 ARIA22 vs ARIA19) is unrecoverable from current outputs.
- **Removal is invisible** — `status-detector` and `observe_state_after_activation` watch `addedNodes` /
  `characterData` / newly-VISIBLE text only; no `removedNodes` / disappearance channel exists anywhere.

---

## Aspect table

| sc | aspect | wcagFacet | requiredCapability | coverage | gap | capabilityTag |
|----|--------|-----------|--------------------|----------|-----|---------------|
| 3.3.1 | error-message-mismatches-actual-error | The error text names a problem that is not the actual error in the field (e.g. "invalid email" on a too-short password), so the user is misdirected (G83/G84). | Drive the specific invalid condition, read the surfaced message, and JUDGE whether the message's claim matches the actual constraint violated. | PARTIAL | `form-error-probe` provokes ONE canonical invalid value and only checks that *some* error-associated text surfaced (barrier-only `errorNotIdentified`); the rubric sees `state-after` text but is NOT given the actual constraint that was violated to compare against, so a mismatched-but-present message reads as identified. Need: pass the provoked constraint + value to the rubric and judge message-vs-actual-error correspondence. | error-vs-actual-constraint-match |
| 3.3.1 | silent-redisplay-after-real-error | Form is re-rendered with no error text after a real rejection (F82-adjacent silent failure); the user cannot tell what went wrong. | Submit invalid, detect that the form re-displayed/rejected, and confirm whether ANY error text surfaced; a silent redisplay is a barrier. | COVERED | `form-error-probe` diffs error surfaces before/after submit and reports `errorNotIdentified` when nothing error-associated surfaces (the silent-rejection case it was built for). Residual risk: a redisplay via real navigation isn't observed (probe preventDefaults), but the slug's silent-redisplay-in-place is caught. | silent-rejection-no-text |
| 3.3.1 | inline-error-adjacent-to-wrong-field | The error message is visually/programmatically placed next to a DIFFERENT field than the one in error, so identification points the user wrong. | Determine the erroring field, locate the surfaced message, and judge whether its position/association binds to the CORRECT field. | GAP | `form-error-probe` accepts ANY error-associated surface inside the form (`form.contains(n)`) or referenced anywhere — it never checks the message sits at/binds to THE field that failed. The rubric crop is the field+error region and cannot see a message attached to a sibling. Need: field-to-message spatial+programmatic binding evidence (which field does this message reference / sit beside) and a wrong-binding judgment. | error-field-binding |
| 3.3.1 | error-summary-incoherent-with-flagged-state | A top-of-form error SUMMARY lists/omits fields inconsistently with the inline per-field flags (summary says 2 errors, 1 field flagged). | Capture the summary list AND each field's flagged state, then judge cross-consistency. | GAP | The probe is per-FIELD (one target) and barrier-only; it credits a summary that links to the field but never collects the WHOLE flagged-field set to cross-check against the summary's claims. Rubric evidence is a single field crop. Need: page-level error-summary vs flagged-field-set collection + coherence judgment. | error-summary-coherence |
| 3.3.1 | non-text-only-error-indicator | The only error cue is a red border / icon / colour with no text (G83 fail; overlaps 1.4.1). | Confirm an error was provoked, then judge that NO textual identification accompanies the non-text cue. | COVERED | `form-error-probe` explicitly drops colour/`reddish` from the decision (audit B4) and requires error-associated TEXT to surface; a colour/border-only cue yields `errorNotIdentified=true`. Rubric also told a bare red border does not identify. Sound. | text-required-for-identification |
| 3.3.1 | error-icon-text-alternative-misstates-error | An error icon has a text alternative (alt/aria-label) that describes the wrong error or is generic. | Read the icon's text alternative and judge whether it correctly states the actual error. | GAP | The probe counts any error-styled/described surface as identification but never extracts an error ICON's accessible name as the text, nor compares it to the actual error. No icon-alt extraction in the form lane; rubric gets a crop, not the icon's computed name. Need: surface the error indicator's accessible name + compare to provoked constraint. | error-indicator-name-correctness |
| 3.3.2 | focus-revealed-instruction-not-honored | A required-format instruction shown only on focus is not present in the resting label / accessible name, so non-focus AT users miss it (3.3.2 instruction obligation). | Drive the field into focus, capture the revealed instruction, and judge whether it is also programmatically available without focus. | GAP | `field-label-probe` inspects the RESTING field only (no focus drive); `field-label-v0` declares `[element-crop]` and NO CDP tool is routed to 3.3.2 — `set_state_and_capture(focus)` exists but is wired only to 1.4.x/2.4.7. A focus-revealed instruction is never captured. Need: route a focus-state capture (or observe_state on focus) to the 3.3.2 lane and check the instruction is in the accessible name too. | focus-revealed-instruction-capture |
| 3.3.2 | instruction-present-but-contradicts-field-rule | The visible instruction states a rule the field does not enforce / the opposite of the real constraint (e.g. "max 8 chars" on a minlength-12 field). | Read the instruction text AND the field's actual constraints, then judge whether they agree. | GAP | No capability reads the instruction text against the field's real constraint set. `field-label-probe` only checks PRESENCE of a label/instruction; the rubric crop shows the instruction but is given no constraint facts to contradict it with. Need: collect the field's constraint attributes (pattern/min/max/minlength/type) and route them with the instruction for a contradiction judgment. | instruction-vs-constraint-consistency |
| 3.3.2 | icon-only-label-not-widely-understood | A field is labeled only by an icon/symbol whose meaning is not universally understood (3.3.2 label adequacy, overlaps 4.1.2/2.4.6). | Capture the icon label and judge whether it conveys the field's purpose to a typical user. | PARTIAL | `field-label-v0` declares `[element-crop]` and the rubric can see the icon and judge understandability — that judgment capability exists. But `field-label-probe` may report a barrier only when NO name/nearby text exists; an icon WITH an accessible name passes the probe and the rubric must carry the whole burden with a single crop and no `surrounding-region`. Adequate-but-thin: add `surrounding-region` evidence. | icon-label-understandability |
| 3.3.2 | group-label-needed-but-absent-generalized-f82 | A set of fields (radio group, address block, multi-part input) needs a GROUP label/legend that is absent, so individual labels are ambiguous (F82). | Detect the field group, check for a group label (fieldset/legend, role=group + name, aria-labelledby), and judge whether one is needed but missing. | GAP | `field-label-probe` is per-FIELD and only looks at the single field's own label + immediate parent text; it has no group/fieldset/legend collection and no notion of "these N fields form a set needing a shared label." Rubric evidence is one element crop. Need: field-group detection + group-label presence/adequacy evidence. | field-group-label-detection |
| 3.3.2 | instruction-visually-orphaned-from-its-field | An instruction exists on the page but sits far from / is not associated with the field it governs, so users don't connect them (3.3.2 proximity). | Capture the instruction's position relative to the field and its programmatic association, then judge proximity/association adequacy. | PARTIAL | `field-label-probe.nearbyVisibleText` only checks the IMMEDIATE parent's child text nodes — a true binary "is there adjacent text," not a distance/orphaning measure; it can FALSE-CLEAR a non-orphaned-looking field and cannot see an instruction two containers away. Rubric crop is the field only (no wider region). Need: measure instruction-to-field distance/association + route a `surrounding-region`. | instruction-field-proximity |
| 3.3.2 | scope-guard-non-data-entry-controls-need-no-instructions | A control that takes no user data entry (a plain button/link) is out of 3.3.2 scope and needs no label-instruction (applicability guard). | Classify whether the target is a data-entry field; if not, abstain/clear. | COVERED | `field-label-probe.isUserInputField` gates on input/select/textarea + textbox/combobox/etc roles and returns `applicable:false` / no barrier for non-entry controls; the oracle owns scope and the rubric is told N/A is the oracle's job. Sound applicability guard. | data-entry-applicability-guard |
| 3.3.3 | error-named-but-no-correction-when-knowable | The message identifies the error but offers no fix suggestion although a correction is knowable (G85/G177/ARIA2). | Confirm an error surfaced, determine that a correction IS knowable (closed value set / format), and judge whether a suggestion is provided. | PARTIAL | `error-suggestion-v0` sees `state-after` text and judges suggestion presence — the judgment exists. But "is a correction KNOWABLE?" is not computed; the rubric must infer knowability from the crop alone, and `form-error-probe` (tagged 3.3.1) does not hand the constraint type that would establish knowability. Need: pass the field's constraint type (so the rubric knows a format/enum suggestion is owed) to the 3.3.3 lane. | correction-knowability-signal |
| 3.3.3 | suggestion-present-but-wrong-or-misleading | A correction suggestion is offered but is incorrect / would not fix the error (e.g. suggests a format the field rejects). | Read the suggestion AND the actual constraint, then judge whether following it would satisfy the field. | GAP | Same root as instruction-vs-constraint: no capability validates the suggestion text against the field's real rule; the rubric is given the message but not the constraint to test the suggestion against. Need: constraint facts + suggestion-correctness judgment (ideally re-drive with the suggested value). | suggestion-correctness-vs-constraint |
| 3.3.3 | suggestion-correctly-withheld-security-purpose-exception | A suggestion is legitimately withheld for security/essential reasons (login, payment) — withholding is NOT a failure (3.3.3 exception). | Recognize the field's security/essential purpose and treat the absent suggestion as conformant. | PARTIAL | `error-suggestion-v0` is told security/essential may exempt and to return NOT REPRODUCED/N/A — judgment capability exists. But the security/purpose CLASSIFICATION (is this a password/MFA/payment field?) is not handed as a signal; the rubric infers purpose from a crop, which is fragile for a generic-looking field. Need: field-purpose / autocomplete-token signal to anchor the exception. | security-exception-classification |
| 3.3.3 | correction-not-knowable-dna-pass | When no correction can be suggested (free-text essay, opaque rule), 3.3.3 does not apply — a DNA/pass, not a barrier. | Determine the correction is genuinely not knowable and clear/abstain. | PARTIAL | The rubric is told an unknowable correction is not a failure and to clear/abstain — capability present. But knowability is judged from the crop with no constraint facts; a closed-format field with no suggestion could be mis-cleared as "not knowable." Same `correction-knowability-signal` gap, inverse direction. | correction-knowability-signal |
| 3.3.3 | suggestion-present-but-too-vague-to-be-actionable | A suggestion exists but is too vague to act on ("invalid input — try again"), failing the actionability bar of G85. | Read the suggestion and judge whether it is specific enough to enable correction. | COVERED | `error-suggestion-v0` reads the actual `state-after` text and explicitly contrasts a weak "Invalid email" against an actionable "Enter an email like name@example.com"; vagueness is exactly what it judges over the rendered text. The judgment lane fits. | suggestion-actionability-judgment |
| 3.3.3 | suggestion-stranded-far-from-field-or-unreachable | The suggestion is rendered far from the field, off-screen, or programmatically unreachable, so the user can't find it (3.3.3 reachability/proximity). | Capture the suggestion's position/association relative to the erroring field and judge reachability/proximity. | GAP | `form-error-probe` credits a suggestion-bearing surface anywhere in the form or referenced by id; it never measures distance or confirms the user can reach it from the field. Rubric crop is the field+error region and cannot see a stranded message elsewhere. Need: suggestion-to-field proximity/reachability evidence (distance, in-viewport, focus-order/association path). | suggestion-reachability-proximity |
| 3.3.3 | color-asterisk-icon-only-no-text-suggestion | The "suggestion" is conveyed only by colour/asterisk/icon with no text telling how to fix it. | Confirm an error surfaced and judge that NO textual suggestion (only a non-text cue) is present. | COVERED | The 3.3.3 lane judges over `state-after` TEXT; colour/asterisk/icon with no text yields no suggestion text to credit, and `form-error-probe` already excludes colour from the decision. A non-text-only "suggestion" reads as absent ⇒ barrier. Sound. | text-required-for-suggestion |
| 4.1.3 | wrong-live-region-politeness-for-urgency | An urgent status uses `polite` (or a non-urgent one uses `assertive`), so the announcement timing mismatches the urgency (ARIA22 vs ARIA19). | Capture the live region's politeness LEVEL and judge whether it matches the message's urgency. | GAP | Every instrument collapses politeness to a boolean `inLiveRegion`; neither `observe_state_after_activation` nor `probe_screen_reader_after_action` returns the LEVEL (polite/assertive/status/alert) of the region the text landed in, and `status-message-v0` (viewport-only) cannot read it. The polite-vs-assertive urgency MATCH is unrecoverable. Need: surface the matched region's politeness level + urgency-vs-level judgment. | live-region-politeness-level |
| 4.1.3 | partial-update-no-atomic-truncated-announcement | A partial DOM update in a non-atomic region announces only the changed fragment, truncating meaning (aria-atomic/aria-relevant handling). | Observe what the live region announces on a partial update and judge whether atomic/relevant settings produce a complete, non-truncated message. | GAP | No instrument reads `aria-atomic`/`aria-relevant` or models a PARTIAL (sub-node) update; `observe_state_after_activation` reports newly-visible text but not the atomic-vs-fragment announcement; `probe_screen_reader` voices the queue but the rubric is given no atomic/relevant facts and a still viewport sees none of it. Need: aria-atomic/relevant collection + partial-update announcement-completeness evidence. | atomic-relevant-truncation |
| 4.1.3 | after-the-fact-live-region-timing | A live region is populated BEFORE the user-perceivable change / created-with-content, so the announcement fires at the wrong time or not at all (region-must-pre-exist timing). | Observe the announcement timing across the settle window: did the region pre-exist, was it populated as a reaction, did the AT actually voice it. | PARTIAL | `observe_state_after_activation` DOES return `liveRegionPreExisted` / `anyNewTextInNewLiveRegion` and `probe_screen_reader_after_action` returns the post-action voiced queue — the timing facts EXIST. But they live ONLY in the tools-enabled lane; `status-message-v0`'s declared `[viewport]` is blind to all of it, and the rubric never REQUIRES the tool result. PARTIAL wiring gap: route + require the timing tool result, don't leave it LLM-optional. | announce-timing-settle-window |
| 4.1.3 | announced-text-lacks-visual-context | The announced status text alone (stripped of its visual surroundings) is meaningless ("3" with no "3 results"), so AT users lose context. | Compare the announced/queued text against the visual context and judge whether the announcement is self-sufficient. | PARTIAL | This is the ONE aspect the declared `[viewport]` partly serves — the rubric can see the visual context. But it has no announcement-text channel by default (`probe_screen_reader` is tools-only), so it cannot compare the ANNOUNCED string to the visual; it only sees the screen. Need: route the voiced/queued announcement text alongside the viewport for the comparison. | announced-vs-visual-context |
| 4.1.3 | removal-of-status-conveys-meaning-silently | Meaning is conveyed by REMOVING an element (a "saving…" spinner disappears = "saved"), but a silent removal announces nothing. | Detect element/text REMOVAL after an action and judge whether the removal-conveyed meaning is announced. | GAP | No capability anywhere observes removal — `status-detector` and `observe_state_after_activation` watch `addedNodes`/`characterData`/newly-VISIBLE text only; there is no `removedNodes`/disappearance channel, and the viewport-only rubric cannot see a before/after disappearance. Need: a removal/disappearance observer (removedNodes + became-hidden) feeding a "was the removal announced?" judgment. | status-removal-detection |
| 4.1.3 | non-textual-status-icon-sound-without-text-alt | A status is conveyed by a non-text icon or a sound with no text-equivalent for AT (status must be in text). | Detect the non-text status cue and confirm whether an equivalent text status is also presented/announced. | GAP | The status lane keys on TEXT insertions into live regions; an icon-only or audio-only status (no text node) produces no `addedNodes` text to catch, and there is no audio/icon-status channel. The viewport rubric might SEE an icon but cannot confirm an absent text equivalent or any sound at all. Need: non-text status-cue detection (icon swap / audio play) + missing-text-equivalent judgment. | nontext-status-text-equivalent |
| 4.1.3 | is-it-a-status-message-scope-boundary | Distinguishing a true status message from primary content / a focus-moving change / a disclosure reveal (4.1.3 applicability boundary). | Classify the change as a status message vs content/focus-change/reveal before judging. | COVERED | This boundary is exactly where the harness is strongest: `status-detector` excludes disclosure/tab reveals (`isDisclosureReveal`) and focus-moved-to-content; `observe_state_after_activation` returns `activationKind` + `focusMovedToChange` + `visibilityCause`; the rubric is told off/hidden/never-populated regions are out of scope and that focus-moving changes are excluded. Scope classification is well covered. | status-scope-classification |

---

## Capability tags (clustered)

### Cluster A — Error/suggestion content vs the ACTUAL field rule (judgment exists, the CONSTRAINT facts don't reach it)
The rubrics can read `state-after` text but are never handed the constraint that was actually violated,
so they cannot tell a *correct* message/suggestion from a *mismatched/wrong/vague-but-knowable* one. The
fix is one shared signal: surface the provoked constraint (type/pattern/min/max/enum/value) into the
3.3.1/3.3.3 lanes.
- `error-vs-actual-constraint-match` (3.3.1 ×1)
- `error-indicator-name-correctness` (3.3.1 ×1)
- `instruction-vs-constraint-consistency` (3.3.2 ×1)
- `correction-knowability-signal` (3.3.3 ×2)
- `suggestion-correctness-vs-constraint` (3.3.3 ×1)
- `security-exception-classification` (3.3.3 ×1)

### Cluster B — Spatial/programmatic BINDING & PROXIMITY of message↔field
The probes credit an error/suggestion/instruction surface ANYWHERE in the form (or referenced by id) and
never check it sits at, binds to, or is reachable from THE field it concerns. Needs field↔message
distance + association evidence (and a wider crop than a single element).
- `error-field-binding` (3.3.1 ×1)
- `instruction-field-proximity` (3.3.2 ×1)
- `suggestion-reachability-proximity` (3.3.3 ×1)
- `icon-label-understandability` (3.3.2 ×1, thin-evidence variant)

### Cluster C — Page-level coherence across MULTIPLE error surfaces / a field GROUP
The per-field, barrier-only probe cannot reason about a whole error SUMMARY vs the flagged-field set, or
about a set of fields needing one GROUP label (F82). Needs page-level collection of the error-summary and
field-group structure.
- `error-summary-coherence` (3.3.1 ×1)
- `field-group-label-detection` (3.3.2 ×1)

### Cluster D — 4.1.3 dynamic announcement facts a still viewport can't capture (the core 4.1.3 gap)
The defining 4.1.3 hard cases — politeness LEVEL, atomic/relevant truncation, announce timing, the voiced
string, silent REMOVAL, non-text/audio status. Two facts (timing, voiced text) EXIST in the tools-enabled
lane but are not ROUTED/REQUIRED by `status-message-v0` (PARTIAL wiring gap); three (politeness level,
atomic/relevant, removal, non-text/audio) have NO producer at all (GAP).
- `live-region-politeness-level` (4.1.3 ×1) — GAP, no producer
- `atomic-relevant-truncation` (4.1.3 ×1) — GAP, no producer
- `announce-timing-settle-window` (4.1.3 ×1) — PARTIAL, exists but not required by the rubric
- `announced-vs-visual-context` (4.1.3 ×1) — PARTIAL, voiced-text channel not routed to the rubric
- `status-removal-detection` (4.1.3 ×1) — GAP, no removedNodes observer
- `nontext-status-text-equivalent` (4.1.3 ×1) — GAP, no icon/audio status channel

### Cluster E — Dynamic/focus-revealed INSTRUCTION capture (3.3.2)
A required-format instruction shown only on focus is never captured by the resting-field probe, and no
focus-state capture is routed to 3.3.2.
- `focus-revealed-instruction-capture` (3.3.2 ×1)

### Cluster F — Already COVERED (sound deterministic + rubric)
- `silent-rejection-no-text` (3.3.1) — `form-error-probe` before/after diff.
- `text-required-for-identification` (3.3.1) — colour dropped from the decision; text required.
- `data-entry-applicability-guard` (3.3.2) — `isUserInputField` scope gate.
- `suggestion-actionability-judgment` (3.3.3) — rubric judges vagueness over rendered text.
- `text-required-for-suggestion` (3.3.3) — non-text-only suggestion reads as absent.
- `status-scope-classification` (4.1.3) — disclosure/focus/reveal exclusions + activationKind.

---

## Coverage summary

| coverage | count |
|----------|-------|
| COVERED  | 6 |
| PARTIAL  | 8 |
| GAP      | 12 |
| **total** | **26** |
</content>
</invoke>
