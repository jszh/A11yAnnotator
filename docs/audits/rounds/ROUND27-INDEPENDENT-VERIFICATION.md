# Round 2.7 Current-State Independent Verification

Date: 2026-06-15

## Pinned scope

This audit is pinned to `c0f3f34f008c005916c6529c11810104cd304e14`
(`R2.7-E`) on `round2-remediation`. Later builder changes, if any, are outside scope.

The current state adds R2.5-R2.7 outcome binding, skip/axe controls, artifact identity and
freshness checks, denser target hit-testing, and further keyboard-trap handling. The diff
from the previously audited R2.4 implementation (`880a255..c0f3f34`) is 24 files,
**+779 / -113** tracked lines.

Methods: source/contract review, direct validator and mandatory-CLI adversarial inputs,
custom browser fixtures with real keyboard input and hit-testing, pure tests, and the
complete browser/integration suite.

## Executive conclusion

R2.5-R2.7 close many of the earlier audit's exact counterexamples and substantially
improve the harness. The current implementation is still **not ready to make a regenerated
corpus ground truth**.

The main blocker is that outcome binding remains contradiction-based rather than
support-based. The mandatory gate can certify definite normative failures even when the
driver observed no event or outcome capable of demonstrating that failure. The operational
regression sweep can also approve incomplete corpus pages.

I found one new definite browser false positive in keyboard-trap detection. The current
target-size implementation was conservative on the new adversarial fractional-strip probe;
that hypothesis was not reproduced.

## Findings

### R27-C1 Critical: absence of contradiction still authorizes unsupported failures

`behavioralSupport()` verifies probe trust and rejects a limited set of contradictory
outcomes, but generally does not require an outcome that positively demonstrates the
claimed SC failure.

Current executable probes all returned `ok:true`:

| Result claim | Driver observation that still validated |
|---|---|
| `REPRODUCED 4.1.3` | trusted isolated activation; `viewChanged:false`, no announcement, no live-region change |
| `REPRODUCED 2.4.3` | trusted isolated activation; no dialog opened and no focus outcome |
| `REPRODUCED 2.1.2` | trusted keyboard probe; `tabWalk.trapDetected:false` |

The 2.1.2 case is especially direct: `driverEvidenceFrom()` does not carry `tabWalk`, and
there is no 2.1.2 outcome check. For 4.1.3, silence without a demonstrated status message
is not evidence of failure. W3C scopes 4.1.3 to actual status messages that do not take
focus, not every silent activation.

Relevant implementation:

- `scripts/lib/result-builder.js:225-269`
- `scripts/lib/result-builder.js:272-327`
- `scripts/lib/result-builder.js:371-377`

Required correction: define positive support predicates per definite behavioral SC and
verdict. At minimum, bind 2.1.2 to the global tab-walk outcome; require an observed status
message plus failed programmatic exposure for a definite 4.1.3 failure; and bind each
2.4.3 failure type to a corresponding focus-order/transition outcome. Otherwise require
`PARTIAL`.

Normative sources:

- [Understanding SC 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html)
- [Understanding SC 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [Understanding SC 2.4.3: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)

### R27-H1 High: the corpus regression sweep approves incomplete pages

`regression-sweep.js` discovers pages solely by the presence of `drive.json`. Missing or
unparseable `collect.json` and `results.json` are loaded as `null`, after which their checks
are skipped.

An independent corpus containing one slug with only `{}` in `drive.json` exited 0:

```text
regression sweep OK — 1 pages, all invariants hold
```

This undermines the operational W7/sweep gate even though the per-page builder requires
all artifacts.

Relevant implementation: `scripts/tools/regression-sweep.js:21-29`, `64-85`.

Required correction: discover the expected page set independently and require parseable
`collect.json`, `drive.json`, and `results.json` for every page. Re-run the mandatory CLI's
cross-artifact identity/freshness checks during the sweep.

### R27-H2 High: mandatory freshness checks are optional and do not prove sequencing

The CLI comment says both timestamps are required, but it checks freshness only when both
are numbers. A matching-run CLI probe with neither `collect.collectedAt` nor
`drive.drivenAt` exited 0 and wrote validated output.

Even when present, both timestamps are stamped near the start of their respective tools.
`drive.drivenAt >= collect.collectedAt` therefore proves only that the driver started after
the collector started, not that it used a completed current collection or ran afterward.

Relevant implementation:

- `scripts/tools/build-results.js:53-68`
- `scripts/eval-page.js` (`collectedAt`)
- `scripts/drive-page.js` (`drivenAt`)

Required correction: require finite timestamps and record a collector completion
timestamp or artifact digest. Bind the driver to that completed collector artifact rather
than comparing start times.

### R27-H3 High: axe fail-closed and reconciliation claims remain incomplete

The mandatory CLI derives `ran` as `collect.axeRan !== false`, so a missing sentinel is
treated as a successful axe run. An independent probe omitted `axeRan`, omitted both
timestamps, skipped one collected element, and still validated.

Separately, the axe floor only constrains skips. A fully evaluated result reporting zero
failures validated while the supplied collector evidence declared five WCAG-tagged axe
violations. Nothing requires those violations to be represented or explicitly adjudicated.

Relevant implementation:

- `scripts/tools/build-results.js:82-88`
- `scripts/lib/result-builder.js:345-358`
- `scripts/tools/regression-sweep.js:68-73`

Required correction: require `axeRan === true`; treat missing/other values as not run.
Carry rule/node evidence into the gate and require every WCAG-tagged axe finding to map to
a result finding or an explicit, reasoned adjudication.

### R27-H4 High: duplicate driver evidence silently overwrites by xpath

Collector xpath duplicates are rejected, but driver element xpaths are not. In
`driverEvidenceFrom()`, later duplicate entries overwrite earlier entries.

A driver containing `/a` twice, first with `focusIndicator.present:false` and then
`present:true`, authorized `NOT REPRODUCED 2.4.7` and validated. Reversing the order changes
the authoritative evidence.

Relevant implementation: `scripts/lib/result-builder.js:225-250`.

Required correction: reject duplicate, missing, and extra driver xpaths before evidence
distillation; compare the driver inventory with the collector inventory and preserve
artifact identity in provenance.

### R27-H5 High: unrelated DOM mutations create a definite keyboard-trap false positive

The trap observer counts every mutation anywhere in the document that sets
`tabindex="-1"`, `disabled`, `inert`, or `aria-hidden="true"`. Two such mutations are
treated as evidence that escape routes were disabled, without checking whether the
mutated nodes were focusable, reachable, outside the cycle, or related to the component.

An adversarial browser fixture contained only three ordinary buttons with normal browser
wraparound. On the first real Tab press it added `tabindex="-1"` to two unrelated,
never-focusable empty `<div>` elements. The current driver emitted:

```json
{
  "trapDetected": true,
  "trapCycle": [
    "/html/body/button[2]",
    "/html/body/button[3]",
    "/html/body/button[1]"
  ],
  "trapInterference": "background-defocus"
}
```

No keyboard trap existed.

Relevant implementation: `scripts/drive-page.js:316-323`, `378-387`, `429-435`.

Required correction: snapshot actual focusable escape routes and count only a transition
that removes a previously reachable route outside the suspected component. Treat unrelated
mutations as noise, not proof of a trap.

Normative source: [Understanding SC 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html).

### R27-M1 Medium: the small-inventory skip cap permits most elements to be skipped

The documented cap is “skips ≤25%,” but the implementation uses a minimum cap of two.
Independent probes confirmed all of these validate:

- 2 of 3 elements skipped: 67%
- 2 of 4 elements skipped: 50%
- 2 of 5 elements skipped: 40%

Relevant implementation: `scripts/lib/result-builder.js:203-206`.

Required correction: enforce the stated percentage without a minimum-two exception, or
define a stricter explicit small-sample rule.

### R27-M2 Medium: canonical documentation still overstates current enforcement

`RESULT-CONTRACT.md` says skips are capped at 25% and describes an older axe floor based on
critical/serious violations and zero failures. Current code permits the small-sample
exceptions and blocks any skip for any WCAG-tagged axe violation. The contract also does
not document the run-id/freshness invariants added in R2.6/R2.7.

`CHANGES.md` says `axeRan` makes the floor fail closed and that both freshness timestamps
are required, but missing values validate at the mandatory CLI.

Relevant documentation:

- `eval-results/RESULT-CONTRACT.md:59-91`
- `eval-results/CHANGES.md:352-372`

Required correction: update the contract after fixing the implementation, then add docs
tests for the exact sentinel, freshness, skip-cap, and sweep requirements.

## Confirmed improvements

The audit independently confirmed the following current-state improvements:

- Explicitly encoded outcome contradictions are rejected for focus visibility, 2.1.1,
  4.1.3 silent status changes, field-bound 3.3.1, and focus return.
- Collector page identity, matching run-id, numeric stale-drive ordering, and normalized
  collector-xpath duplicates are checked by the mandatory CLI.
- Result aggregation, issue canonicalization, page-skill completeness, recursive schema
  checks, and collector inventory completeness remain materially stronger than R2.4.
- Existing trap fixtures cover more bounded-cycle, suppressed-listener, frozen-focus,
  Escape, and long-navigation cases.
- The new fractional pointer-dead-strip target probe was conservatively classified
  `needs-judgment`; no new 2.5.8 false pass was reproduced.
- The pure suite passed independently: **122 passed, 0 failed, 0 skipped**.

## Verification

- Pure suite: **122 passed, 0 failed, 0 skipped**.
- Complete browser/integration suite: **171 passed, 0 failed, 0 skipped** in 587 seconds.
- Direct gate probes reproduced all validator/CLI/sweep findings listed above.
- Independent browser probes reproduced the unrelated-mutation keyboard-trap false
  positive; the fractional target-strip probe was conservatively downgraded.

## Disposition

Do not treat a regenerated corpus from `c0f3f34` as ground truth yet.

Fix R27-C1 first: definite behavioral verdicts need positive outcome support, not merely
the absence of a known contradiction. Then make the sweep/artifact gates fail closed and
remove the reproduced trap false positive. The skip-cap and documentation discrepancies
should be closed before presenting completeness metrics.
