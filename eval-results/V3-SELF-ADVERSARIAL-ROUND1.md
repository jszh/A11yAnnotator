# Harness 3.0 — Self-Adversarial Round 1

After the first-pass-audit remediation (commit `680d5b9`), I ran a second, independent adversarial
pass: an isolated red-team agent attacked the v3 publication gate looking for **new** holes beyond
the original audit, proving each with an executable probe. I then re-verified the severe findings
myself (`/tmp/verify.js`). Seven findings; all reproduced.

| ID | Sev | Title | Status |
|----|-----|-------|--------|
| R1-F1 | **Critical** | Missing `observationScope` on evidence fail-opens scope binding → fictional state/action/environment published authoritative | reproduced |
| R1-F2 | **High** | Legacy token launders into published output via a nested non-verdict key (`observationScope.*`); shallow schema + verdict-only final scan miss it | reproduced |
| R1-F3 | **High** | `catalogVersion` drift control is opt-in: omitting it publishes stale evidence | reproduced |
| R1-F4 | Medium | `manifest` identity never validated; a manifest for a different page/run/digest passes | reproduced |
| R1-F5 | Medium | An evaluable role-only element (img/heading/region) yields zero obligations; the fail-closed is page-global, so its obligation silently vanishes when other elements mask it | reproduced |
| R1-F6 | Low | Plan↔result reconciliation matches by `claimId` only, not target/SC (build-v3 scope binding is the real backstop) | reproduced |
| R1-F7 | Low | `elementSkillSummaries` array order is non-deterministic w.r.t. ledger order | reproduced |

## Detail + my re-verification

- **R1-F1 (Critical).** [build-v3.js](../scripts/v3/lib/build-v3.js) binds scope only `if (linked.observationScope && …)`. If evidence omits `observationScope` (schema did not require it), the comparison is skipped and the proposal's `observationScope` — the very thing that says *what state/action the claim is about* — is published unbound. `/tmp/verify.js` → `authoritative:1`, published scope `{state:FICTION-STATE, action:FICTION-ACTION, environment:FICTION-ENV}`.
- **R1-F2 (High).** `noUnknownKeys` only validated top-level keys, never nested `observationScope`; the published claim copied `observationScope` verbatim; the output legacy scan only checked values of verdict-named fields. So `observationScope.priorNote = "NOT REPRODUCED"` rode into authoritative output. `/tmp/verify.js` → `ok:true`, output contains `NOT REPRODUCED`.
- **R1-F3 (High).** [schemas.js](../scripts/v3/lib/schemas.js) checked `catalogVersion` only `!= null`. Absence (default-open) publishes stale evidence. `/tmp/verify.js` → no-catalogVersion `ok:true authoritative:1`.
- **R1-F4 (Medium).** [cross-artifact.js](../scripts/v3/lib/cross-artifact.js) exempts `manifest` from the identity loop and there is no manifest schema; a mismatched manifest passes.
- **R1-F5 (Medium).** [applicability-oracle.js](../scripts/v3/lib/applicability-oracle.js) `isEvaluable` is true for any role, but `familiesFor` only emits obligations for focusable/text/widget. A role-only element is evaluable yet yields zero obligations; the fail-closed only fires when the *whole page* is empty, so the element's obligation disappears when any sibling masks the global guard.
- **R1-F6 (Low).** `reconcileErrors` matches `result.claimId === request.candidateId` and never compares target/SC. The authoritative claim is still protected by build-v3 scope binding, so blast radius is bounded.
- **R1-F7 (Low).** `aggregateElementSkill` output order follows insertion order; reordering the ledger reorders the array, breaking byte-determinism (content is correct).

## Negative results (attacked, sound)
Duplicate-disposition for one obligation (caught), shadow `cleared` leakage (false, correct), authority canary/unknown-state/unmet-readiness (all fail-closed), cross-SC via evidence `sc` omission (sc is schema-required), INAPPLICABLE direction discipline (default-closed), missing `applicabilityEvidence` (fails closed).

→ Fixes applied in commit following this document; see [V3-SELF-ADVERSARIAL-ROUND2.md](V3-SELF-ADVERSARIAL-ROUND2.md) for the re-attack.
