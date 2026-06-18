# Critical review — Coverage-analysis implementation, round 1

**Date:** 2026-06-17
**Reviews:** [`COVERAGE-IMPLEMENTATION.md`](./COVERAGE-IMPLEMENTATION.md) and the two builder commits
`c36b827` (expand axe surfacing + `ax-name-presence` shadow signal) and `36d732c` (keyboard-activation
must not navigate off-page on external links).
**Method:** independent empirical verification against real behavior — *not* a re-read of the builder's
prose. Reproduced the collector's exact CDP derivation on a hand-built fixture; exercised
`surfaceAxeFindings` with a crafted axe payload; traced the routing of every new signal; ran the suite.

## Verdict

The round-1 changes are **correct, sound, and well-scoped**. The headline claim — that the old
`ax.name.value || null` coercion made the new `ax-name-presence` detector *dead on real data* — is **true
and correctly fixed**, and I reproduced both the bug and the fix independently. The "Framing decision"
(since nothing publishes authoritatively, reframe from CAPTURED-vs-PARTIAL to "maximize scored-vs-gold
coverage cheaply", and decline the higher-risk items) is sound judgment. One **must-fix** remains: the
regression guard for the fix is missing, so the exact bug just closed can silently regress.

## Verified claims (with evidence)

| Claim | Verdict | Evidence |
|---|---|---|
| `""`→`null` coercion made `ax-name-presence` dead on real data; fix preserves `""` | ✅ true & fixed | Replicated eval-page.js's exact calls (`Accessibility.getAXNodeAndAncestors` → `ax.name.value` / `ax.ignored`) on a fixture. CDP **emits `name.value:""`** (not a missing property) for a nameless in-tree `<img>`/`<button>`/`<a>`/`<input>`/`<h2>`/`<summary>`/`<select>`. Old `\|\| null` ⇒ `null` ⇒ detector never fires; new `value != null ? String(value) : null` ⇒ `""` ⇒ fires. |
| Decorative `<img alt="">` is skipped | ✅ true | Empirically → CDP role `none`, `ignored:true` ⇒ `inTree:false` ⇒ skipped. |
| `""` change is safe for all `axName` consumers | ✅ true | label-in-name (`build-v3.js:419`), `coverage-registry.js:44`, `applicability-oracle.js:121` all gate on `trim().length>0`; VSR (`vsr-collect`) and `ax-state-diff` (`exp-runners`) use their own name field. `""` and `null` are indistinguishable to every consumer. |
| axe surfacing: per-rule gate, best-practice map, incomplete review-tier | ✅ true | Crafted-payload run of `surfaceAxeFindings`: `image-alt`→1.1.1, `button-name`→4.1.2, **`aria-roledescription` & `color-contrast` dropped**, `presentation-role-conflict`→1.1.1, `empty-heading`→1.3.1, `aria-required-children`→`kind:incomplete, review:true`. |
| Signals can only add shadow, never false-clear/barrier | ✅ true | `AUTHORITY` registry holds only `focus-visual-retry` (both directions pinned `shadow`). All new signals stamped `authoritative:false, shadow:true`; they route to `triageCandidates` + gold metrics, never `reconcile()`/dispositions. |
| Dropped redundant `page-title-presence` signal | ✅ confirmed in diff | |
| Full suite green | ✅ **362/362, 0 fail** | `node --test scripts/v3/tests/*.test.js` (serial; the self-refocus flake did not recur). |
| 2.1.1 navigation guard | ✅ sound | Gated to links (`role==='link' \|\| tag==='A'`); records real click-dispatch as the operability signal (a non-wired `role=link` div still won't be falsely "operable"); `preventDefault` blocks the external load. Correctly fixes the c487ae/5effbb navigation stall. |

## Issues

### 1. Missing regression guard for the fix — **must-fix**
The new `ax-name-presence` test (`checker-findings.test.js`) hand-feeds `{axName:''}` directly to
`buildV3`. That covers the **detector** well (positives: img/button/summary/heading; negatives:
option/named/decorative/null-unresolved/non-name-role), but it does **not** guard the `eval-page.js`
coercion. If `|| null` is reintroduced, collection emits `null` again, the detector dies on real data —
**and this test stays green.** That is the *exact* masking pattern the builder reported fixing ("a green
test masking it via `axName:''` fixtures real collection never produced"). Today my ad-hoc CDP test is the
only thing proving collection emits `''`.
→ **Add an integration assertion** (with `scripts/tests/integration.test.js`/`evidence.test.js`) that runs
the real collector on an empty `<img>`/`<button>` and asserts `axName === ''` and `inTree === true`.

### 2. Per-rule surfacing leaks obsolete `wcag411` (4.1.1) — minor
`surfacedScsFor` surfaces a per-rule-allow-listed rule under **all** its WCAG tags. `button-name` carries
`wcag411` + `wcag412`, so it emits a **4.1.1** finding (verified empirically) in addition to 4.1.2. 4.1.1
was removed in WCAG 2.2 and is out of the 22-SC scope — harmless (shadow, non-gating) but it pollutes the
per-SC finding set.
→ Filter `tagScs` to known/in-scope SCs (or strip `4.1.1`) in `surfacedScsFor`.

### 3. SC-attribution choices are editorial; the heading signal isn't fully "independent" — minor
`ax-name-presence` maps `heading→1.3.1` and `textbox→4.1.2`-only. For an empty heading, the detector *and*
the now-surfaced axe `empty-heading` **both** fire at 1.3.1 on the same xpath. The report frames these as
"independent cross-signals (CDP name path vs axe DOM-name)" — true for *named-by-mechanism* cases, but for
plain-empty headings the two are two views of the same fact and can't disagree, so the independence/
agreement framing overstates for that case (minor double-count risk in gold scoring).

### 4. The value proposition is asserted but not measured — recommendation
The stated goal is "maximize scored-vs-gold coverage", but the report shows **no recall/precision delta**
from the expansion. `V3-ACT-SUBSET-PIPELINE.md` has the methodology (`run-evaluation.js`, the ACT subset)
and notes the score is sensitive (e.g. 84%→63% recall when draft cases were added). The expansion *should*
raise recall, but #2/#3 could dent precision.
→ Re-run the subset eval and report before/after, since "scored vs gold" is the whole justification.

## Things that are fine / good judgment
- Declined relational link/iframe instruments, hand-rolled WAI-ARIA validity tables, promote-axe-to-
  authoritative, and 1.4.6 — all defensible for a shadow-only round 1.
- The `''`-vs-`null` distinction was restored *surgically* (only the empty-vs-unresolved distinction;
  no behavior change for label-in-name).
- Dropping `page-title-presence` as redundant with axe `document-title` is correct.

## Reproduction notes
- Collector CDP behavior: a standalone script issuing `Accessibility.enable` +
  `Accessibility.getAXNodeAndAncestors` per element and applying eval-page.js's exact
  `axName`/`inTree`/`axRole` expressions to a 15-element fixture (img no-alt / empty-alt / named; button
  empty / named / icon-only; a empty / named; input no-label / labelled; h2 empty / named; summary empty;
  select empty; div role=button). All name-requiring + in-tree + empty-name elements fired under the
  expected SC; decorative/named/null/non-name-role did not.
- `surfaceAxeFindings` payload test and the AUTHORITY/routing trace are described in the Verified-claims
  table above.
