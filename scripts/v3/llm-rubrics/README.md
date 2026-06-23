# LLM rubrics — index

One `*-v0.md` per judgment lane. A rubric is the **non-authoritative** judge the LLM lane runs on an
auto-PARTIAL obligation (the deterministic runner abstained or none exists). The LLM lane is **off by
default**, so these are shadow/canary today — see `docs/reference/COVERAGE-AND-GAPS.md`.

How a rubric is reached: `applicability-oracle` enumerates a family → no deterministic CLAIM binds → the
obligation is auto-PARTIAL → `llm-adjudicator` selects the rubric bound to that family (`rubric-loader`).

**Role legend:** **sole** = the only coverage for its SC (no deterministic decider — the Weak SCs) ·
**residual** = backs up a deterministic/axe substrate on the harder sub-domain · scope **[22]** = declared
in-scope, **[+]** = beyond the 22-SC scope (incidental).

| Rubric | SC | Scope | Role | Judges |
|--------|----|-------|------|--------|
| alt-text-adequacy-v0 | 1.1.1 | 22 | residual | is the alt an adequate equivalent (vs the deterministic glyph/long-desc DET) |
| long-description-completeness-v0 | 1.1.1 | 22 | residual | is the long-description complete (fires on `complexImageHint`) |
| captcha-alternative-v0 | 1.1.1 | 22 | sole | non-visual + non-auditory CAPTCHA alternative (review-tier) |
| info-relationships-v0 | 1.3.1 | 22 | residual | visual vs programmatic structure (axe owns the structural finding) |
| sequence-meaning-v0 | 1.3.2 | 22 | **sole** | reading-order preserves meaning (VSR-gated) |
| use-of-color-v0 | 1.4.1 | 22 | **sole** | colour-only distinction (link/field) |
| contrast-over-complex-backdrop-v0 | 1.4.3 | 22 | residual | text contrast over a non-flat backdrop (DET handles flat) |
| images-of-text-v0 | 1.4.5 | 22 | **sole** | image renders text that should be real text |
| reflow-no-hscroll-v0 | 1.4.10 | 22 | residual | reflow barrier the DET probe abstained on |
| non-text-contrast-v0 | 1.4.11 | 22 | residual | graphical/gradient cue contrast (DET handles flat-reducible) |
| hover-content-v0 | 1.4.13 | 22 | residual | hoverable/dismissible/persistent adequacy |
| keyboard… (see keyboard-operable) | 2.1.1 | 22 | residual | — |
| focus-order-meaning-v0 | 2.4.3 | 22 | residual | recorded focus sequence preserves meaning (DET handles F44) |
| link-purpose-v0 | 2.4.4 | 22 | residual | link purpose in context (axe owns name presence) |
| heading-descriptive-v0 | 2.4.6 | 22 | **sole** | heading/label descriptiveness (≠ presence) |
| focus-visible-clear-v0 | 2.4.7 | 22 | residual | focus indicator the DET runner abstained on |
| section-headings-v0 | 2.4.10 | 22 (AAA) | sole | each visible section has a heading |
| error-identification-v0 | 3.3.1 | 22 | residual | error conveyed (DET probe is barrier-only) |
| field-label-v0 | 3.3.2 | 22 | residual | label/instruction adequacy (DET clears presence) |
| error-suggestion-v0 | 3.3.3 | 22 | **sole** | suggestion adequacy |
| accessible-name-adequacy-v0 | 4.1.2 | 22 | residual | name adequacy (axe owns presence; DET owns state) |
| status-message-v0 | 4.1.3 | 22 | **sole** | dynamic status announced to AT (+CDP tools) |
| page-title-v0 | 2.4.2 | 22 | **sole** | title descriptiveness (presence ~deterministic but not yet a runner) |
| focus-not-obscured-v0 | 2.4.11 | + | residual | obscured-focus the DET barrier abstained on |
| label-in-name-v0 | 2.5.3 | + | residual | visible label ⊆ accessible name (IBM also hard-decides) |
| target-size-minimum-v0 | 2.5.8 | + | sole | 24px target-size judgment |
| target-size-enhanced-v0 | 2.5.5 | + (AAA) | sole | 44px target-size judgment |
| media-alternatives-v0 | 1.2.2 | + | sole | captions presence + plausibility |
| motion-control-v0 | 2.2.2 | + | sole | pause/stop/hide for auto-moving content |

**The 7 "sole" rubrics inside the 22** (`sequence-meaning`, `use-of-color`, `images-of-text`,
`heading-descriptive`, `error-suggestion`, `status-message`, `page-title`) are the SCs with **no
deterministic substrate** — they are uncovered when the LLM lane is off. See COVERAGE-AND-GAPS §2/§4a.

> Adding a rubric: author `<name>-v0.md`, bind it to a family in `rubric-loader`/`llm-adjudicator`, and add
> a row here. Honor "absence ≠ pass" and fail-closed on unreached states.
