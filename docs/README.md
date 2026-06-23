# Docs Index

Map of the `docs/` tree by **purpose**. Four buckets: **Reference** (the canon — what we should cover),
**Contracts** (living invariants), **Plans** (forward-looking), and **Analysis/Audits** (dated, point-in-time).

> When adding a doc, place it by *lifecycle*: a living invariant → `contracts/`; a standards/coverage fact →
> `reference/`; a forward plan → `plans/`; a dated investigation/audit → `analysis/` or `audits/` (date it).

---

## Reference — the canon (what the harness should cover)
The durable "ground truth" docs. Start here.
- **[reference/COVERAGE-AND-GAPS.md](reference/COVERAGE-AND-GAPS.md)** — what we support/miss vs WCAG, TT, EN 301 549, ACT, Techniques. **Read first.**
- **[reference/coverage-explorer.html](reference/coverage-explorer.html)** — the interactive version: per-SC pathways + clickable ACT/EN/TT source + gap rows (built by `scripts/build-coverage-explorer.js`).
- **reference/standards/** — the standards canon:
  - `TRUSTED-TESTER-GAP-ANALYSIS.md` (+ `-R2`) — TT v5.1.3 procedures → harness lanes.
  - `en301549/EN301549-ANNEX-C-ANALYSIS.md` + `-RELEVANT-CLAUSES.md` — EN clause C.9 mapping + conformance-scope gaps.
- **reference/WAI-COVERAGE-COMPARISON.md**, **WAI-PEOPLE-USE-WEB-ASPECTS.md** — WAI framing.

## Contracts — living invariants (must stay true)
- **contracts/RESULT-CONTRACT.md** — the result/disposition shape every consumer relies on.
- **CONCEPT-MAP.md** — the mental model of the pipeline (collect → oracle → experiments → build → dispositions).
- **DEFERRED-TODO.md** — the single approved backlog (design notes per item).
- **CHANGES.md** — notable behavioral changes.

## Plans — forward-looking
- **plans/** — `HARNESS-3.0/3.1/3.2/3.3` evolution plans, `GAP-FILLING`, `AGENT`, `REMEDIATION`, `BUILDER`.

## Completeness — per-SC checklists
- **completeness/** — SC-by-SC completeness checks (1.4.3, 2.1.1/2, 2.4.7, 3.3.2, 4.1.2).

## Analysis — dated, point-in-time investigations
Snapshots, not living docs. Newer work supersedes older.
- **analysis/capability-gap-2026-06/** — the capability inventory + per-capability gap reports + final report.
- **analysis/reports-2026-06/** — dated RCA/probe/routing snapshots: `LLM-ROUTING-AND-FAILURE-ANALYSIS.md`,
  `CAPABILITY-REVIEW(-RESPONSE).md`, `GENERALIZATION-AND-NOOBLIGATION.md`, `IMPROVEMENT-CANDIDATES-ADVERSARIAL.md`,
  `PROBE-RUN5-STILLWRONG.md`, `RUN4-FP-FN-RCA.md`, `RC1-RUBRIC-ITERATION-LOG.md`, `PAPER-TABLES-CONTRIBUTIONS.md`.
- **analysis/act-benchmark/** — ACT pilot + worklist.
- **analysis/checker-comparison/** — tool coverage / upstream suites / uncertainty.
- **analysis/coverage/** — coverage analyses.
- **analysis/improvement-research-2026-06/** — large evidence/research pack (screenshots, fixtures, prompt/state packs). _Not indexed here._

## Audits — independent + self-adversarial review rounds
- **audits/** (root): `HARNESS-ISSUES`, `SR-AUDIT`, independent/reproducibility/hardcoded-judgment audits, toolkit audit.
- **audits/v3-passes/** — the 5 independent audits + 2 self-adversarial rounds + responses.
- **audits/rounds/** — R2.4–R2.8 self-audits + ROUND2x independent verification.

## Figures
- **figures/** — harness architecture diagram + doc.

---

### Conventions
- **Dated work** lives under `analysis/` or `audits/` with a date in the name or folder; it is a snapshot, never a contract.
- **Standards facts** live under `reference/standards/`; cross-link them from analysis rather than copying.
- **Code**: see `scripts/v3/lib/README.md` for the module map of the runner/pipeline code.
