# SC-pipeline changelog

## v2 — research-driven + pilot-fix iteration (2026-06-20)

Driven by the deep-research report (`docs/analysis/ACT-AUGMENTATION-METHODS.md`) and two bugs
found by running the v1 pilot on SC 2.4.2.

### Pilot-found scoring fixes (correctness)
1. **Deterministic verdict↔page correlation.** Verify agents returned inconsistent self-reported
   page IDs, so the LLM finalize-judge mis-matched verdicts→pages and wrongly marked good pages
   "needs-fix." Now each verdict is stamped with the authoritative page `file` in the workflow,
   and validity is computed in **deterministic JS** — no LLM string-matching.
2. **Boundary-case validity.** "passed"/"inapplicable" control pages legitimately have
   `errorIsReal=false`; validity now only requires `errorIsReal` when `expected==="failed"`.

### Research-backed method additions
- **Verbalized Sampling** (arXiv:2510.01171) — Construct first brainstorms ~12–15 candidate
  scenarios with head/mid/long-tail frequency, then spreads its picks across the distribution
  (anti mode-collapse; +1.6–2.1× diversity reported).
- **Persona + attribute conditioning** (AttrPrompt NeurIPS'23; persona synthesis 2406.20094) —
  every page gets a distinct {domain, component, host-construct, locale, mechanism} tuple AND a
  developer persona explaining how the mistake arose. Varied across pages.
- **Evol-Instruct in-depth hardness escalation** (WizardLM ICLR'24) — drafts that axe/WAVE could
  catch are escalated (add constraints / deepen / concretize / complicate input) to the
  human-judgment boundary.
- **Self-Instruct dedup gate** (ACL'23) — `dupcheck.js` (lexical 5-shingle + DOM tag-bigram
  Jaccard); pages within an aspect must score combined < 0.8 or be rewritten.
- **Self-Refine repair loop** (arXiv:2303.17651; N-CRITICS) — a new pipeline stage regenerates
  ONLY adversary-rejected pages, then re-verifies just those, lifting valid-yield toward 100%.
- **Strengthened citation critic** — verify now checks the quote is VERBATIM (char-for-char) in
  the named reference file (highest hallucination risk per Self-Instruct's 92→54 validity decay).

### Seed palette (one facet, not the backbone)
- `_seeds/builders.json` (80) + `_seeds/crosscutting.json` (62) = 142 grounded real-world patterns,
  indexed per SC in `_seeds/by-sc/<sc>.json`; static `_seeds/facets.json` palette.
- Wired into Construct as a SAMPLED, supplementary inspiration source with explicit
  "don't let every page be a builder default; invent beyond the list" + combinatorial crossing.

## v1 — initial pilot (baseline)
Understand → Reason(5 lenses) → Synthesize → Construct(≥5/aspect) → Verify(CDP) → LLM-finalize.
axe removed from tooling; human-judgment targeting; code-reading-first verification.
