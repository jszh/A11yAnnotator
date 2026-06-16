# Round 2.4 Independent Verification

Date: 2026-06-14

## Pinned scope

This audit is pinned to `880a255d4c2c5a37a0e22705fb07c9140c6bc1d9`
(`R2.4-F`) on `round2-remediation`.

The branch moved to `2bb2133` while the audit was running. Per request, that commit and
all later builder changes are disregarded. Remaining tests and browser probes were run
from an isolated archive of `880a255`.

## R2-R2.4 line-count tally

Counts use `git diff --numstat <round-start>..<round-end>`. They are snapshot changes
across each round, so a line edited repeatedly within one round counts once at that
round's boundary.

“Code/test” includes `*.js`, `*.json`, `*.html`, `*.css`, `*.sh`, `*.mjs`, and `*.cjs`.
“All tracked text” also includes Markdown and other tracked text.

| Round | Range | Code/test | All tracked text |
|---|---|---:|---:|
| R2 | `f15cfac..5c1544b` | +908 / -243 | +1,154 / -280 |
| R2.1 | `5c1544b..d5833cc` | +598 / -125 | +963 / -147 |
| R2.2 | `d5833cc..367d1fe` | +301 / -88 | +859 / -101 |
| R2.3 | `367d1fe..d842c5d` | +572 / -137 | +717 / -172 |
| R2.4 | `d842c5d..880a255` | +406 / -98 | +417 / -104 |
| **Sum of round deltas** | | **+2,785 / -691** | **+4,110 / -804** |

The final `880a255` snapshot compared directly with the pre-R2 baseline `f15cfac` is
**+2,371 / -277 code/test lines** and **+3,654 / -348 total lines**. This is smaller than
the sum of round deltas because later rounds rewrote or removed earlier-round lines.

## Executive conclusion

Round 2.4 closes important mechanics from the Round 2.3 audit, especially default-closed
inventory completeness and canonical issue attribution. It is still **not ready for W7
ground-truth regeneration**.

The central blocker is that behavioral verdicts are bound only to the existence/trust of
a probe, not to the probe's observed outcome. The mandatory builder therefore validates
definite verdicts that directly contradict `drive.json`.

Three additional browser/result-integrity gaps produce false definite outcomes or permit
evidence substitution.

## Findings

### R24-C1 Critical: driver binding does not bind the verdict to the observed outcome

`behavioralSupport()` generally establishes only that some probe ran:

- `focus-visibility` checks that `focusIndicator.present` is boolean, but does not require
  `REPRODUCED` to correspond to `present:false` or `NOT REPRODUCED` to `present:true`.
- `keyboard-operability` checks trusted/exercised input, but ignores
  `keyboardSignal.operable` and the actual response.
- `forms-instructions-errors` accepts every definite element verdict when all page forms
  used trusted submit, without checking the relevant form's validation result.
- `dynamic-announcement` and `focus-management` check trusted activation, but do not
  check the announcement/focus-management observation supporting the claimed verdict.

Pinned executable probes all validated successfully:

- Driver: `focusIndicator.present:true`; result: `REPRODUCED 2.4.7`, “no ring”.
- Driver: trusted keyboard probe with `keyboardSignal.operable:true`; result:
  `REPRODUCED 2.1.1`, “does not operate”.
- Driver: trusted form with `nativeTextIdentification:true`; result:
  `REPRODUCED 3.3.1`, “error not identified”.
- Driver: trusted activation with `vsrAnnouncement:"Saved"`; result:
  `REPRODUCED 4.1.3`, “not announced”.

Relevant pinned implementation:

- `scripts/lib/result-builder.js:205-252`
- `scripts/lib/result-builder.js:283-289`

Required correction: bind each definite verdict to a typed, outcome-aware driver signal
for the same element/form and SC. Where the signal cannot prove the claimed outcome,
require PARTIAL/manual adjudication.

### R24-H1 High: collect/drive artifacts are mandatory but not identity-bound

The builder does not verify that records, collector output, and driver output belong to
the same page/run. A pinned CLI probe used:

- records declaring `file:"victim.html"`;
- collector declaring `file:"other-collector.html"`;
- driver declaring `file:"other-driver.html"`;
- duplicate raw collector xpath entries.

The mandatory CLI exited 0 and wrote a validated `victim.html` result. It silently
deduplicated the collector entries before the validator could detect them.

This also means a drive from another page with a coincidentally matching xpath can
authorize behavioral verdicts.

Relevant pinned implementation:

- `scripts/tools/build-results.js:34-48`
- `scripts/lib/result-builder.js:168-202`

Required correction: emit and compare a shared run/page identity across records,
collect, and drive; preserve and reject raw collector duplicates before normalization;
record collector/driver identities or hashes in output provenance.

### R24-H2 High: passive trap observers can both be blocked

Round 2.4 removes the DOM-mutating sentinel and correctly detects the supplied delegated
and focus-redirect fixtures. However, page listeners registered before the harness can
call `stopImmediatePropagation()` on both observed channels.

An adversarial fixture trapped real Tab focus between two buttons, prevented the Tab
event, and blocked both the harness's `window keydown` and `document focusin` listeners.
The pinned driver emitted:

```json
{
  "trapDetected": false,
  "escapableComponent": { "via": "wraparound" }
}
```

No standard keyboard exit existed. The absence of observed interference is therefore not
proof of ordinary wraparound.

Relevant pinned implementation: `scripts/drive-page.js:301-382`.

Required correction: treat a bounded cycle with unverifiable browser-chrome escape as
indeterminate unless escape is positively demonstrated, or observe input/focus below the
page event-listener layer.

Normative source: [Understanding SC 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html).

### R24-H3 High: sparse hit-test grid is not positive proof of a solid square

The new target-size probe labels a 5x5 sample grid as proof that a solid 24x24 square is
fully on-target.

An adversarial 24x24 link had a real 2px-wide pointer-dead strip between sampled columns.
The pinned collector emitted:

```json
{
  "squareFits": true,
  "targetSize": {
    "verdict": "pass",
    "reason": "meets 24×24 — a page-aligned 24×24 square is fully on-target (hit-tested)"
  }
}
```

The grid proves only that 25 points hit the target. It cannot prove the continuous solid
area required by the criterion. It also treats any descendant hit as on-target without
proving that pointer activation performs the target function.

Relevant pinned implementation:

- `scripts/eval-page.js:336-354`
- `scripts/lib/a11y-eval.js:85-96`

Required correction: do not convert sparse samples into a definite pass. Use the samples
to disprove fit, but require reliable target geometry/continuous hit-area proof for a
definite size pass; otherwise use `needs-judgment`.

W3C states that a solid, page-aligned 24x24 square must fit completely within the target:
[Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### R24-M1 Medium: recursive strictness remains incomplete and can throw

Pinned validator probes found:

- Removing or corrupting a `summary.countBasis` value still validates.
- Extra keys inside a valid `provenance.collect.skipped[]` entry validate.
- `NOT REPRODUCED` with `sc:"bogus"` and `level:"AAA"` validates.
- A level with no SC on a non-issue verdict validates.
- `summary.issues:[null]` throws a `TypeError` instead of returning validation errors.

Relevant pinned implementation:

- `scripts/lib/result-builder.js:151-166`
- `scripts/lib/result-builder.js:186-192`
- `scripts/lib/result-builder.js:307-322`

Required correction: recursively validate required keys, value equality/types, and
unknown SC metadata; make malformed nested structures fail closed without throwing.

### R24-M2 Medium: the canonical result contract was not updated for R2.4

`RESULT-CONTRACT.md` still describes provenance completeness as conditional on a
“fully-evaluated inventory” and describes dynamic trust primarily through agent-stamped
`trust`/`isolation`. It does not encode the mandatory collector/driver identity,
default-closed completeness, forms behavioral binding, or outcome-aware evidence needed
to make the R2.4 gate authoritative.

The plan also says the builder binds to driver evidence, while the implementation binds
only probe trust/existence for most skills.

Relevant pinned documentation:

- `eval-results/RESULT-CONTRACT.md:59-77`
- `eval-results/AGENT-PLAN.md:215-234`

## Confirmed closures

The pinned audit confirmed:

- `collect.json` and `drive.json` are mandatory CLI arguments.
- Completeness no longer self-disables; dropped collector elements require structured
  skips with reasons.
- Existing collector-derived provenance cannot be replaced by records provenance.
- Round 2.4's supplied trap fixtures are detected without DOM mutation.
- Existing overflow-clipped and SVG target fixtures become `needs-judgment`.
- Issue merge representative xpath carries the winning verdict and tested reorderings
  are stable.
- Nested extra keys tested by the builder in issues/countBasis/bySkill are rejected.

## Verification

- Pinned pure suite: **103 passed, 0 failed, 0 skipped**.
- Pinned complete browser/integration suite: **142 passed, 0 failed, 0 skipped** in
  599 seconds.
- Independent adversarial browser probes: target sparse-grid false pass and
  stopImmediatePropagation trap false negative reproduced.
- Independent result probes: contradictory driver outcomes, cross-page artifact
  substitution, duplicate collector normalization, and nested-schema gaps reproduced.

## Disposition

Do not begin W7 regeneration from `880a255`. R24-C1 must be fixed first because the
current “driver-bound” gate still certifies conclusions contradicted by the driver.
R24-H1, R24-H2, and R24-H3 should also be closed or conservatively downgraded before the
corpus is treated as ground truth.
