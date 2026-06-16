# Round 2.3 Independent Verification

Date: 2026-06-14

## Scope and pinned states

The requested Round 2.3 baseline was independently audited at commit
`a2f1265e52e66588a2a01acf6df71a9de4542863` on `round2-remediation`.

The branch moved during the audit. Commits `e492cf7` (documentation), `2794e7b`
(ancestor `clip-path` and nested-consent fixtures/fixes), and `d842c5d` (advised-exit
PARTIAL mitigation) landed afterward. Findings below say explicitly when a later change
affects the result.

Methods included source/contract review, pure and browser suites, direct result-builder
adversarial inputs, and custom browser fixtures using real keyboard input and pointer
hit-testing.

## Executive conclusion

Round 2.3 is a substantial improvement and closes most of the specifically claimed
Round 2.2 findings. It is **not ready to regenerate or treat the corpus as ground truth**.

Two result-integrity blockers remain:

1. The mandatory result path can validate an incomplete evaluation and can run without
   the independent collector input.
2. Definite behavioral verdicts can omit trust/isolation or self-assert trusted evidence;
   the validator does not bind them to driver evidence.

The browser probes also reproduced definite false outcomes for keyboard traps and target
size. These should be fixed or conservatively downgraded before W7 regeneration.

## Findings

### R23-C1 Critical: provenance completeness self-disables

`scripts/tools/build-results.js` documents `collect.json` as mandatory, but only requires
the input and output arguments. If `collect.json` is omitted, agent-supplied provenance
is accepted. When a collector is supplied, `complete` is derived as “all collector xpaths
are already present in records”; omitting an element therefore changes `complete` to
`false`, disabling the validator's dropped-element check.

Executable probes:

- Collector inventory `/a`, `/dropped`; records contain only `/a`: CLI exits 0 and writes
  a validated result with `complete:false`.
- No collector argument plus input-supplied provenance: CLI exits 0 and writes a result.
- Corrupt `provenance.collect.count` and unreasoned string entries in `skipped` validate.

Relevant implementation:

- `scripts/tools/build-results.js:17-35`
- `scripts/lib/result-builder.js:159-178`

Required correction: require the collector argument; derive provenance only from that
file; always enforce inventory equality except for structured skips with non-empty
reasons; derive or validate inventory count and identity/hash.

### R23-C2 Critical: behavioral trust remains optional and self-attested

The validator rejects only verdicts explicitly stamped `synthetic` or `shared`.
Trust/isolation are optional, are copied from agent records, and are not verified against
`drive.json`. Thus all of these validated:

- Definite `focus-visibility: REPRODUCED` with no trust/isolation.
- The same verdict with agent-written `trust:"trusted"` and
  `isolation:"isolated"`.
- Definite `forms-instructions-errors: REPRODUCED` with
  `trust:"synthetic"` and `isolation:"shared"`.

Forms are behavioral but are absent from `DYNAMIC_SKILLS`. The driver emits some
`behavioralTrust`, but the builder does not consume driver evidence or require a
machine-verifiable evidence reference.

Relevant implementation:

- `scripts/lib/result-builder.js:137-145`
- `scripts/lib/result-schema.js:14-15`
- `scripts/drive-page.js:660-669`
- `eval-results/AGENT-PLAN.md:226-229`

Required correction: have the builder derive behavioral confidence from driver evidence,
require an evidence/probe identifier for definite behavioral verdicts, and include
behavioral form findings in enforcement. Native-presumption outcomes need a distinct,
explicitly validated basis.

### R23-H1 High: boundary sentinel can change the page and hide a trap

The trap detector inserts a focusable button into the document and uses reaching it as
proof of escape. An adversarial fixture with delegated Tab handling dynamically queried
all buttons. Before instrumentation, focus was trapped between A/B. After sentinel
insertion, the page's own handler included the sentinel and the detector emitted
`trapDetected:false`, `escapableComponent.via:"Tab"`.

Relevant implementation: `scripts/drive-page.js:318-368`.

Required correction: use a non-DOM-mutating boundary observation, or return an
indeterminate result when page focus logic reacts to the injected node.

### R23-H2 High: non-standard advised exits are not exercised

WCAG 2.1.2 permits a non-standard exit when the user is advised of the method. A fixture
that visibly instructed “Press Control+M to leave” and successfully exited on that key
was reported as a trap because the driver tried only Escape, Tab, and Shift+Tab.

Commit `d842c5d` adds `advisedExitHint` and tells the agent to downgrade such cases to
PARTIAL. That prevents a definite false failure but still does not exercise or validate
the advised key. It is a useful conservative mitigation, not full verification.

Relevant implementation: `scripts/drive-page.js:333-365`.

Normative source: [Understanding SC 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html).

### R23-H3 High: target-size geometry still produces definite false passes

Round 2.3 correctly makes several shape cases `needs-judgment`, and commit `2794e7b`
fixes the reproduced ancestor-`clip-path` false pass. Two classes remain:

- A 40x40 link inside a 20px-wide `overflow:hidden` ancestor received a definite
  “meets 24x24” pass. Pointer hit-testing showed only 20px of target width was available.
- An SVG circle with a 30x30 bounding box received a definite pass. A 30px-diameter
  circle cannot contain a page-aligned 24x24 square; corner hit-tests did not hit the
  circle.

The current logic handles transforms and `clip-path`, but not overflow clipping or
non-HTML/SVG target area. Bounding-box dimensions are not enough to prove the criterion.

Relevant implementation: `scripts/eval-page.js:250-303`.

Required correction: measure usable pointer hit area, or return `needs-judgment` for SVG,
non-rectangular targets, and targets affected by clipping/overflow ancestors.

Normative source: [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### R23-M1 Medium: deterministic merge is not fully canonical

The normative tally is stable, but output is not always byte-stable:

- Equal-identity/equal-precedence findings with raw SC or evidence casing/whitespace
  variants emit whichever raw verdict object arrived first.
- A PARTIAL contributor at lexically smaller xpath `/a` plus a REPRODUCED contributor
  at `/z` emits a REPRODUCED summary issue attributed to `/a`, whose own verdict is
  only PARTIAL.

Relevant implementation: `scripts/lib/result-builder.js:75-98`.

Required correction: canonicalize raw SC/evidence or retain contributor records, and
attribute the representative xpath to a contributor carrying the winning verdict.

### R23-M2 Medium: “strict/exact” schema permits nested corruption

The top level and verdict records are guarded, but these inputs still validate:

- Extra keys inside `summary.issues[]`, `summary.countBasis`, and
  `summary.bySkill[skill]`.
- Corrupt provenance count and a skipped xpath without a reason.
- A `NOT REPRODUCED` verdict carrying a disallowed SC or wrong level.

Relevant implementation: `scripts/lib/result-builder.js:146`, `159-178`, and `219-238`.

Required correction: validate nested object shapes and provenance fields. If SC/level are
present on non-issue verdicts, validate them consistently.

## Confirmed closures

The audit confirmed the intended Round 2.3 behavior for the tested cases:

- Result validation rejects the builder's empty-record, corrupted-issue,
  missing-field, duplicate, and ordering counterexamples.
- Existing target-size rotated/rounded/author-restyled fixtures are conservatively
  classified; inline prose is no longer an automatic pass.
- Fixed-size and trap-only fixtures are detected; ordinary wraparound and Escape-released
  modal fixtures are not classified as traps.
- Activation is reloaded and marked trusted/isolated.
- Consent inventory is visible-only and PARTIAL. Commit `2794e7b` also fixes reproduced
  nested-container double counting.
- The claimed schema/documentation corrections and AX-state collection are present.

## Verification status

- Pure suite: **90 passed, 0 failed, 0 skipped**.
- Evidence/browser fixture suite at the pinned Round 2.3 baseline: **21 passed, 0 failed,
  0 skipped**.
- Full suite after the concurrent follow-up commits: **123 passed, 0 failed, 0 skipped**
  in 612 seconds, including the saved-page integration drives.

## Disposition

Do not start W7 corpus regeneration yet. At minimum, close R23-C1 and R23-C2 and prevent
the definite false outcomes in R23-H1 and R23-H3. R23-H2 may remain a documented PARTIAL
case if the hint mitigation is committed and constrained, though exercising recognizable
advised key combinations would provide stronger evidence.
