# C4 as a checklist orchestrator — focused LLM micro-check integration

Demonstrates the pattern: a runner decides what it can deterministically, and for each residual checklist item it can't
resolve, fires ONE focused single-question LLM micro-check (via the SAME Claude Code SDK transport the harness uses),
then recomposes the verdict — instead of dumping the whole case on a big rubric.

## Modules
- `scripts/v3/lib/micro-checks.js` — focused checks over the Claude Code SDK (`makeClaudeSdkTransport`, `effort:'low'`).
  First check: `essential-presentation` (is a low-contrast graphic 1.4.11-EXEMPT: logo/screenshot/inactive/decorative?).
- `scripts/v3/lib/nontext-contrast-checklist.js` — wraps C4: on a deterministic FAIL, captures a tight evidence package
  (ratio + role + nearby label + an 18px-padded CROP) and hands the ONE exemption item to the micro-check.

## Result (C4 boundary aspect, real Claude SDK + vision crops)
- **True-fails kept as fail: 9/9 — 0 real barriers wrongly exempted.** The soundness property holds: the micro-check
  said "not-exempt" on every real failure (it defaults conservative).
- **essential-exemption case → correctly flipped to pass(exempt).** The micro-check saw the crop and recognized it.
- Two false-barriers NOT fixed — and both confirm the discipline rather than break it:
  - `case-18 (semi-transparent-border-pass)`: NOT an exemption case — the deterministic runner *mis-measured* a
    `rgba(0,0,0,.45)` border (it abstains on translucent cues; composited it is #8c8c8c = 3.36:1, a PASS). The right fix
    is a deterministic **alpha-compositing** item, not "essential?". The micro-check correctly stayed out ("not-exempt").
  - `case-19 (decorative-non-component)`: a faint #ededed paragraph RULE — not a component at all. Subject discovery
    tagged nothing useful (role=null, empty label/crop), so the micro-check got an empty evidence package and answered
    low-confidence "not-exempt". This is an APPLICABILITY gap (is it a subject?), needing its own item, not the
    exemption check.

## Takeaway
The checklist decomposition works end-to-end and is sound: each abstain / false-barrier maps to a SPECIFIC focused item
(essential? · alpha-composite-recheck? · is-it-a-component?), and a focused single-question prompt + a crop resolves the
semantic ones conservatively. Cost: one low-effort SDK call per residual item, only when the deterministic runner can't
decide — not a per-case rubric. Next items to add: `decorative-or-component` (applicability), and deterministic
alpha-compositing in the runner (a measurement fix, not an LLM item).
