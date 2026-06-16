# V3 Fifth-Pass Response Independent Audit

Date: 2026-06-15
Audited state: current working tree after the builder's fifth-pass response (uncommitted changes present)

## Scope

I reviewed `eval-results/V3-FIFTH-PASS-INDEPENDENT-AUDIT.md`, the builder response in
`eval-results/V3-FIFTH-PASS-AUDIT-RESPONSE.md`, and the current `scripts/v3/` implementation. I
then ran the regression suites and two adversarial probes against the current code.

## Verification Run

- `node --test scripts/v3/tests/fifth-pass.test.js scripts/v3/tests/lineage.test.js scripts/v3/tests/contracts.test.js scripts/v3/tests/foundation.test.js`
  - PASS: 65/65
- `node --test scripts/tests/unit.test.js scripts/tests/result.test.js scripts/tests/docs.test.js scripts/tests/meta.test.js`
  - PASS: 139/139
- `node --test scripts/v3/tests/*.test.js`
  - PASS: 179/179, including the real Chrome experiment fixtures

The builder's claimed green test state is accurate for the current suite. The fifth-pass response
also materially improves the harness: `applicability.json` now loads and is production-required,
the manifest hashes it, authoritative publication requires an applicability stage, the form-error
AT dependency was corrected, and the focus animation regressions are covered by the real browser
suite.

## Findings

### R5R-C1 High: Applicability Stage Identity Is Not Cross-Artifact Bound

The new applicability artifact is publication-influencing, but it is not included in the
cross-artifact identity gate. `crossArtifactErrors()` checks `manifest`, `collect`, `drive`,
`candidates`, `plan`, `experiments`, and `claimProposals`, but omits `applicability` from the
artifact list. `schemas.validateBundle()` also validates only that `applicability.observations`
is an array of `{ xpath, facts }`; it does not validate or bind `applicability.file`,
`applicability.runId`, or `applicability.pageDigest`.

Code references:
- `scripts/v3/lib/cross-artifact.js:65`
- `scripts/v3/lib/schemas.js:178`
- `scripts/v3/lib/build-v3.js:177`
- `scripts/v3/lib/build-v3.js:218`

Reproduction probe:

1. Start from a fully promoted, signed helper bundle where a focus clear publishes.
2. Mutate only `bundle.applicability.file/runId/pageDigest` to a different page/run.
3. Reseal the manifest so this is not a simple tamper test.
4. Build with promoted authority and `requireManifest: true`.

Observed result:

```json
{
  "ok": true,
  "summary": {
    "authoritative": 1,
    "cleared": 1
  }
}
```

That means a wrong-run applicability artifact can still satisfy the publication boundary if its
facts happen to agree. The manifest hash proves the bundle is internally sealed, but it does not by
itself prove that the applicability stage belongs to the same page/run unless the stage identity is
validated and cross-checked.

Recommended fix:

- Include `['applicability', bundle.applicability]` in `crossArtifactErrors()`'s `arts` list.
- Treat applicability identity as strict, like `experiments` and `claimProposals`, not lenient like
  `drive`/`manifest`.
- Add `validIdentity(bundle.applicability, 'applicability', E)` in `schemas.validateBundle()`.
- Add a regression test that mutates `applicability.file/runId/pageDigest`, reseals the manifest,
  and expects the build to refuse or at least demote away from authoritative publication.

### R5R-H1 High: Real Native Roles Are Still Under-Enumerated

The fifth-pass H1 fix normalizes `text` and `roleAttr`, but it does not normalize all real collector
role channels. Earlier real collector evidence used fields such as `sampledRole` and `axRole`, with
`roleAttr` often null for native elements. In the current code, `factRole()` only reads `role` and
`roleAttr`.

Code reference:
- `scripts/v3/lib/applicability-oracle.js:48`

Adversarial probe:

```json
{"xpath":"/a","role":"","families":["focus-indicator-visible","keyboard-operable","text-contrast"]}
{"xpath":"/button","role":"","families":["focus-indicator-visible","keyboard-operable","text-contrast"]}
{"xpath":"/roleattr","role":"button","families":["focus-indicator-visible","keyboard-operable","text-contrast","name-role-value"]}
```

For real-shaped native link/button records with `sampledRole:"link"` or `axRole:"button"` and
`roleAttr:null`, `name-role-value` is not enumerated. This is exactly the class the fifth-pass H1
finding was trying to close: fixture-shaped tests pass, but real collector-shaped native controls can
still lose 4.1.2 obligations.

Recommended fix:

- Extend `factRole()` to read the full collector role contract, e.g. `role`, then `roleAttr`, then
  `sampledRole`, then `axRole`.
- Update `coverage-registry` if it has a parallel role accessor.
- Add tests using native-shaped real records:
  - `{ focusable:true, text:'Help', roleAttr:null, sampledRole:'link', axRole:'link' }`
  - `{ focusable:true, text:'Submit', roleAttr:null, sampledRole:'button', axRole:'button' }`
- Consider adding a tiny fixture captured from the actual collector schema, not hand-authored
  synthetic shape.

### R5R-M1 Medium: `judgments.json` Loads, But Is Deliberately Outside Manifest Integrity

The fifth-pass M3 loader gap is fixed: `judgments.json` is now a known optional stage. The tradeoff
is that `judgments` is explicitly excluded from `HASHED_STAGES`, so replay integrity does not bind
semantic recommendations to the run manifest.

Code references:
- `scripts/v3/lib/bundle-loader.js:17`
- `scripts/v3/lib/manifest.js:18`

This is acceptable only while judgments remain non-authoritative recommendations and cannot affect
published claims. If later 3.0 work promotes semantic judgments into any publication-influencing
path, this needs to become a hashed, identity-bound artifact or a separately signed post-manifest
artifact. Otherwise review queues can drift silently from the sealed evidence bundle.

### R5R-L1 Low: No-Result Production Manifests May Fail Closed

`deriveObservedPageDigest()` returns `null` when there are no experiment results. That is conservative
and prevents copying collector identity into a manifest without independent observation. The practical
side effect is that a production run with zero completed results may fail manifest validation rather
than emitting a clean all-unrun/all-partial bundle.

Code reference:
- `scripts/v3/lib/manifest.js:36`

This is probably acceptable for now, but should be documented as intentional. If saved-site sweeps can
produce pages with candidates but all experiments deferred/unrun, the desired output shape should be
tested explicitly.

## Closed Fifth-Pass Items

- V3R5-C1 is mostly closed for replay: `applicability.json` is now declared, written/loaded, and
  hashed by the manifest. The remaining problem is identity binding, covered by R5R-C1 above.
- V3R5-C2 is closed for stage presence: authoritative publication now requires an applicability
  stage. It still needs identity binding to be fully sound.
- V3R5-H2 appears closed in the current browser suite: the focus animation/motion cases pass.
- V3R5-H3 appears closed: `form-error-probe` barrier direction no longer requires an AT baseline.
- V3R5-M1 appears closed for result-derived observed digest in normal result-bearing runs.
- V3R5-M2 was reframed as a documented Level-3 seam rather than active production behavior. That is
  acceptable for the current phase.
- V3R5-M3 is closed for loading; integrity implications are tracked above.

## Bottom Line

The fifth-pass response is directionally solid and the current regression suite is green, including
real Chrome probes. I would not yet treat this as ready for a broad saved-site collection pass without
fixing the two High issues:

1. Bind `applicability` identity in the same cross-artifact gate as the other publication-influencing
   stages.
2. Normalize native role facts from the real collector (`sampledRole`/`axRole`) so 4.1.2 obligations
   are not silently under-enumerated.

After those are fixed and regression-tested, the remaining issues are mostly phase-boundary/documented
risks rather than publication blockers.
