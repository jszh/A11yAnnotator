# Deferred TODO — user-approved, not-yet-implemented

The single backlog for work the user **explicitly approved deferring** (distinct from speculative
recommendations, which live in the analysis docs). Each entry carries enough design to action later.
Add new items here when the user approves deferring a concrete piece of work.

Cross-reference: `docs/analysis/reports-2026-06/LLM-ROUTING-AND-FAILURE-ANALYSIS.md` holds the broader (not-yet-approved)
recommendation backlog (SVG-namespaced-xpath resolver, page-level `precomputeSignals` threading, a media
1.2.x lane, composite ARIA roles, the dead-ended `roleOverridesNative`/`states`/`needsPixelContrast` facts,
a deterministic pixel-contrast runner).

---

## A. Checker-uncertainty → LLM obligation (generalize `incomplete` for ALL checkers) — ✅ DONE 2026-06-18
**Implemented** (axe lane; IBM follows the same path when wired). build-v3.js enumerates a checker obligation
from each axe `incomplete` whose SC is in `CHECKER_UNCERTAINTY_FAMILY` (deduped vs static, real-v3-xpath only,
auto-PARTIAL → LLM-reachable); `aria-prohibited-attr` added to axe-surface's allowlist; the adjudicator threads
a `checkerHint` into the prompt (orchestrator builds `checkerHintsByXpath`); run-fn-llm enables axe. Verified:
over-enum 0 new obligations on Amazon/LinkedIn (common SC 1.4.3 already enumerated → deduped); kb1m8s
`aria-prohibited-attr` → a 4.1.2 auto-PARTIAL obligation; adversarial review cleared (1 latent cross-frame-xpath
bug found + fixed). Open follow-on: IBM review tier through the same path.

**Original design (for reference):** Today a checker "needs-review" finding (axe `incomplete`, IBM `potentialviolation`/
review, etc.) is surfaced as a NON-authoritative shadow `checkerFinding` and goes no further (`axe-surface.js`
emits `kind:'incomplete', review:true`; nothing consumes it). **Decision: treat every checker `incomplete`
as a first-class reason to ENUMERATE an obligation and route it to the LLM**, carrying the checker's own
signal forward.

Design:
- A new obligation **source** ("checker-uncertainty"): for each checker incomplete finding on an in-universe
  (element|page, SC), enumerate/own a corresponding auto-PARTIAL obligation (mapping the checker rule → SC →
  claim-family the way the axe-promotion family map does), so the LLM lane (`selectRubricSubjects`/
  `selectSubjects`) picks it up. It must NOT collide with an already-enumerated static obligation (dedup by
  obligation id) — it ADDS obligations only where the static facts didn't already create one.
- Thread the checker's signal into the **prompt** (via `precomputeSignals` or a new `checkerHint` field on the
  subject): the rule id, the checker's *reason* for abstaining (e.g. axe rule `help`/`description`, IBM's
  message), and the evidence we already collected for that element (deterministic signals + vision crops). The
  rubric must honor "**absence ≠ pass**" ([[checker-uncertainty-to-llm]]) — a checker that *couldn't decide*
  is a prompt to look harder, never a clear.
- Verdict stays non-authoritative (PROVISIONAL/shadow). Bound the fan-out (a huge page can have many
  incompletes — cap or prioritize by impact) to control LLM cost.
- This subsumes the deferred "incomplete→rubric-hint": the hint now always has a subject because the
  incomplete itself mints the obligation. Picks up e.g. kb1m8s (axe `aria-prohibited-attr` incomplete → a
  4.1.2 aria-validity obligation + hint), without broadly enumerating aria-on-`<div>` from static facts.
- Sequencing note: pairs naturally with IBM wiring (`[[harness-3-3-checker-decision]]`) so IBM's review tier
  flows the same way.

## B. Screenshot+LLM page pre-analysis (a DISCOVERY/triage lane)
**Approved 2026-06-18.** The static-fact collector is blind to pixel-rendered content (a `background-image`
rendering text — the 1.4.5 `0va7u6` case; a `<canvas>` chart; a visual-but-unmarked heading; info conveyed by
colour). A naive static gate (e.g. "any element with a background-image") floods. **Decision: add a first-pass
(screenshot + LLM) analysis of the whole page that IDENTIFIES regions plausibly needing deeper analysis, then
mints an obligation for each** — routing by what the page SHOWS, not only what the DOM declares.

Design:
- One bounded triage call per page: a viewport (and key crops) + a compact DOM summary → the model returns
  candidate regions (coordinate box and/or a resolvable element) + a *why* ("this looks like text baked into
  an image → check 1.4.5/1.1.1"; "chart with no text alternative"; "red/green-only status"). It IDENTIFIES,
  it does not DECIDE (keep the two-stage separation: triage → per-region rubric decides).
- Each candidate region → a DISCOVERED obligation. Reuse the dynamic-subject expansion path (Rule 13,
  `expandDiscovered`) so the discovered subject is reconciled like any other, fails closed on a forged
  provenance, and is bounded by the per-run cap. Needs a target the rubric can resolve (a coordinate-keyed
  crop, since a bg-image/canvas region may not map to a single obligation-bearing element).
- Soundness rails: the triage is non-authoritative discovery; the per-region rubric still abstains on
  insufficient evidence; verdicts stay PROVISIONAL/shadow.
- This is the collector-side complement to (A): (A) catches what a *checker* flagged-but-couldn't-decide;
  (B) catches what *no* deterministic producer even saw. Connects to the analysis doc's "whole classes of
  elements are invisible to the collector".

**Partial sidecar prototype 2026-06-22.** A fixture-assisted `visual-content-discovery` sidecar now exists in
`scripts/v3/lib/broad-scope-probes.js` and `scripts/v3/lib/broad-scope-llm-review.js`. It nominates rendered
non-DOM or partly non-DOM visual surfaces for downstream `1.1.1` / `1.4.1` / `1.4.5` review: pseudo/background
image text, canvas charts, SVG charts, and color-only status cues. Verified evidence: 300/300 generated
non-interference/interaction rows pass, including 10/10 visual-content positives and 10/10 negatives; all 20
visual-content fixtures have screenshot/state captures; prompt-pack audit covers 520 entries and reports
visual-content directions `{UNCERTAIN_DISCOVERY:10, NO_PACKET_SCOPED_OK:10}` with 0 bridgeable barriers/clears;
prompt pressure reports visual-content verdicts `{UNCERTAIN:10, NO_REVIEW:10}` and 0 converted judgments.

This does **not** close item B. The prototype is marker/fixture assisted and does not perform general screenshot
pre-analysis, OCR, canvas/SVG semantic extraction, or arbitrary-region discovery on saved websites. Adequate
alternative suppression is fixture-proven only; in the wild, alternative adequacy must be judged by a downstream
rubric/LLM/human. Absence of a visual-content packet must never read as a pass for `1.1.1`, `1.4.1`, or `1.4.5`.

## C. eval-page axe-parity via DOM-identity tagging (answer to "support both CSS selector + xpath") — ✅ DONE 2026-06-18
**Implemented.** eval-page.js tags each obligation node with `data-v3-xp` before the axe run; the axe evaluate
resolves each finding's CSS target to its node and reads `data-v3-xp`, so axe findings carry the dataset xpath
by identity (scheme-agnostic). Verified: a foreign-scheme (`/html[1]/body[1]/…`) tagged node round-trips to the
correct xpath. Adversarial review found + fixed a latent cross-frame mis-resolution (a depth>1 axe target now
returns null → degrades to a shadow `cssTarget`, never mis-attributes to a wrong top-level node). Open follow-on:
inject axe into same-origin CHILD frames so the axe lane actually tests in-frame content the v3 collector now
collects (see the iframe note below) + verify a promoted disposition on a real corpus artifact.

**Original context (for reference):** The axe-promotion fires only where the
collector resolves axe's CSS-selector targets to the v3 xpath. `act-page-collect.js` does this (byte-identical
xpathOf); `eval-page.js` does NOT, because its element xpaths are EXTERNAL (`loadXpaths()` from the saved
dataset) so the scheme can't be guessed. Worst case today = a safe no-op (axe stays shadow on the corpus, no
regression), but the corpus gets no axe lift.

Robust fix (scheme-agnostic — answers "can we support both CSS + xpath?"): **yes.** Match by DOM-node
IDENTITY, not by xpath string:
- `eval-page.js` already resolves each obligation element's external xpath to a live node
  (`document.evaluate(el.xpath, …)`, ~line 497). At that point, tag the node: `node.setAttribute('data-v3-xp',
  el.xpath)`.
- In the axe evaluate, resolve each axe finding's CSS `target` to its node and read `node.getAttribute(
  'data-v3-xp')` → the axe finding now carries the EXACT obligation xpath, whatever the dataset's scheme, by
  identity. (Store BOTH on the node — `cssTarget` is already emitted by `axe-surface.js` for debugging.)
- Clean up the attribute after the axe run (or accept it's ephemeral in the headless page).
- Verify on a real corpus `collect` artifact (confirm a promoted disposition appears) before relying on it.

## D. Dynamic-subject DISCOVERY experiment for disclosure / tab / carousel reveal (Item 14b of the LLM-routing analysis)
**Deferred 2026-06-18** while executing the LLM Routing & Failure Analysis. The other Tier-2 lanes shipped; this
one is a LARGE new mutating runner whose entire payoff is gated on the on-hold LLM + CDP tools, so a partial
version would add inert/dead code (the exact "already-computed facts dead-end" anti-pattern the report flags).

**Partial sidecar prototype 2026-06-22.** A broad-scope `reveal-state-discovery` sidecar now exists in
`scripts/v3/lib/broad-scope-probes.js` and `scripts/v3/lib/broad-scope-llm-review.js`. It activates generated
disclosures/tabs/details/menu/dialog-like controls with trusted input, records newly visible nodes, routes review
packets to `1.3.1/2.4.3/2.4.10/4.1.2`, and defaults to `UNCERTAIN` rather than a barrier. Verified evidence:
300/300 generated non-interference/interaction rows pass, including 10/10 reveal positives and 10/10 reveal
negatives; all 20 reveal fixtures have screenshot/state captures; prompt pressure reports reveal verdicts
`{UNCERTAIN:10, NO_REVIEW:10}` and 0 converted judgments.

This does **not** close item D. Remaining work is the actual v3 dynamic-subject implementation: emit revealed
nodes with content-addressed fingerprints into `dynamicSubjects`, reconcile them through `expandDiscovered`, and
rerun the relevant obligations inside the revealed state. Also still missing: keyboard-only reveals, hover/focus
reveals, long transitions, shadow DOM, iframe reveals, and bounded state-combination exploration. Absence of a
sidecar reveal packet must never read as a pass.

**Problem.** A subject that exists ONLY after activation — 2.4.10 sections injected by a disclosure, a 1.1.1
carousel-panel image, 1.4.3 text revealed by an "expand" — is invisible to `deriveObligations`, which enumerates
only from the RESTING `collect.elements`. Post-activation subjects can enter only via `dynamicSubjects`
(`dynamic-subjects.js` `expandDiscovered`, Rule 13, content-addressed-fingerprint gated, capped by
`MAX_SUBJECTS_PER_RESULT`/`MAX_TOTAL_SUBJECTS`) — but NO producer emits disclosure/tab/carousel reveals. The
consumption machinery exists; the EMISSION does not.

**Why it's a runner, not a wiring task.** `STATE_TRANSITIONS` (vision-capture.js) is **SC-keyed** (`2.4.7→focus`,
`1.4.13→hover`, `3.3.1→submit`), but a reveal is **element-behavior-keyed** (a control with `aria-expanded` /
`aria-controls`, a `<details><summary>`, a `[role=tab]`, a carousel "next") and affects MANY SCs at once — so the
reveal cannot be expressed as an SC→transition entry. It needs a dedicated discovery experiment.

**Design.**
- A new mutating experiment (fresh-clone isolation, mirroring `vision-capture.js`'s reload isolation + the
  keyboard-trap runner's mutation discipline): find reveal controls (`[aria-expanded]`+`[aria-controls]`,
  `details>summary`, `[role=tab]`, carousel controls), activate ONE per subject, diff the DOM, and emit each
  newly-rendered obligation-bearing node as a `dynamicSubject` with `viaAction` provenance + a content-addressed
  fingerprint (so `expandDiscovered` reconciles it like any other and fails closed on a forged fingerprint).
- Bound hard: per-control activation budget, the existing `MAX_SUBJECTS_PER_RESULT`/`MAX_TOTAL_SUBJECTS` caps, and
  combinatorial-blowup guard (don't activate every control on a large app page — cap + prioritize).
- Evidence path: allow `set_state_and_capture` (cdp-tools.js, already built) for states OUTSIDE the frozen
  STATE_TRANSITIONS table when tools are enabled, so a discovered subject gets a before/after crop.
- **Fail-closed:** an unreached state must NOT read as "no barrier" — `stateReached`/`textVisible` gate the
  verdict; a not-reproduced reveal stays auto-PARTIAL, never a clear. Shadow/canary; never auto-trigger the corpus.
- Verify with a disclosure/tab/carousel fixture: confirm the revealed node appears as a `dynamicSubject` and
  reconciles, before relying on it.

## E. Reduce page-level 1.3.1 / 2.4.10 over-enumeration noise WITHOUT suppressing the "absence-is-the-barrier" cases (RCA R6 / proposed-fix S6)
**Deferred 2026-06-18** after the reaches-LLM RCA. The reaches-LLM run showed the page-level info-relationships
(1.3.1) / section-headings (2.4.10) / focus-order (2.4.3) obligation is enumerated whenever a `structure` slot
exists (`applicability-oracle.js` `deriveObligations`, the `collect.structure` gate), so on a near-empty / minimal
page the LLM is handed an obligation it can only abstain on (`spec-abstain`, ~8 cases — e.g. bc4a75). The obvious
fix — **gate enumeration on structure CONTENT presence** (`structure.headings?.length || structure.tables?.length
|| landmarks`) — was **adversarially shown to be UNSAFE and is NOT to be implemented as such.**

**Why the obvious gate is wrong (the adversarial result).** For 1.3.1 (programmatic-vs-visual divergence) and
2.4.10 (heading absence), the **ABSENCE of structure IS the barrier**. Gating on structure-presence suppresses the
obligation exactly when it is needed:
- **`d0f69e` is a real TP that the gate would turn into an FN** — a data grid built entirely from ARIA roles
  (`<div role="grid">…<div role="row">…`) with **no `<table>` and no heading**. `collectTables()` only matches
  `<table>`, so `structure.tables` is `[]`; there are no headings → all three gate signals empty → the obligation
  would never be enumerated, and the genuine 1.3.1 barrier (header cells not programmatically associated) is lost.
  Repro: `eval/checker-comparison/act-subset/pages/d0f69e/7ab8f027dde4ee91a2b45b52a61cff442ec676d8.html` (GT=failed).
- The canonical 2.4.10 failure (substantive multi-section content shipping ZERO headings) and the 1.3.1
  fake-heading-`<div>` failure are *all* empty-structure pages — the gate would silence every one.
- The over-enumeration it targets is **harmless**: the LLM returns a non-authoritative PARTIAL/N-A on a near-empty
  page; nothing is mis-scored. Repro of the (benign) noise:
  `eval/checker-comparison/act-subset/pages/bc4a75/874032cb82216878366f02dd2d98e6c8047a1612.html`.

**Acceptable direction (if pursued).** Do NOT gate on the presence of the structures whose *absence* is the
barrier. Instead gate on **page SUBSTANCE** — enumerate when the page has any substantive non-repeated CONTENT
(e.g. total visible body text above a small threshold, or ≥1 content landmark with text), so a genuinely trivial
page (a single control, a blank harness page) is skipped while every content-bearing page — headed or not — still
owes 1.3.1/2.4.10. Also broaden `collectTables`/landmark detection to ARIA `role=grid|table|treegrid|list` so
ARIA-only structure is seen at all. Verify against BOTH repros above (d0f69e must still enumerate+flag; bc4a75 may
drop) before relying on it. Low priority — the benefit (less abstain noise) is small and the downside (lost true
barriers) is severe.

---

## F. Trusted-Tester v5.1.3 gap analysis — deferred / structural items (G4, G6, G7, G8)

**Recorded 2026-06-18** alongside the implemented TT gaps (G1 list semantics, G2 background-image meaning, G3
CAPTCHA modalities, G5 form-error soft-constraint widening — all shipped). Source:
`docs/reference/standards/TRUSTED-TESTER-GAP-ANALYSIS.md`. These four are the gaps the analysis itself rated
defer/structural/minor; each is recorded here with its reasoning and (where it exists) a pointer.

- **G4 — reveal-then-check focus order & focus WITHIN revealed content (2.4.3 / TT 4.F.2.b).** TT requires
  ACTIVATING triggers that reveal hidden focusables (menus, dialogs, expandable trees) and checking focus order
  to/from/within them. This is the SAME work as **backlog item D** (dynamic-subject reveal discovery) — see §D
  above; do not duplicate. When picked up, reuse `observe_state_after_activation` to open each reveal, then re-run
  the `tab-order` instrument within the revealed subtree. The 2026-06-22 broad-scope sidecar helps discover some
  reveal states, but it does not yet perform the TT focus-order/focus-within check or emit v3 obligations. Fail-closed:
  an unopened reveal must NOT read as "no barrier". Still deferred.

- **G6 — cross-page / set-of-pages determinations (2.4.2 / 2.4.4).** Structural scope boundary of a SINGLE-page
  harness. TT 12.B asks whether a page title DISTINGUISHES the page within its set; the same-named-link and
  consistent-navigation tests are inherently multi-page. **No code change — the rubrics already avoid a false
  PASS here:** `page-title-v0` judges DESCRIPTIVENESS only and explicitly states cross-site uniqueness "is not the
  test"; `link-purpose-v0` returns PARTIAL when it cannot see a sibling/destination to compare. If a multi-page
  corpus is ever introduced, a thin "title-uniqueness / nav-consistency" pass over the page SET would close it
  (compare each page's title against its siblings; flag duplicates that serve different purposes). Document the
  boundary so single-page determinations never read as cross-page PASSes (done — this entry).

- **G7 — keystroke-timing (2.1.1 / TT 4.B).** No harness equivalent for "no functionality depends on the TIMING
  of keystrokes" (key-repeat / down-vs-up timing). Niche — applies to a vanishing set of pages (custom key-timing
  games / Morse-style inputs). Track, do not prioritize. If pursued: a runner that dispatches keydown/keyup with
  varied dwell and asserts behavior is timing-independent — high effort, near-zero corpus yield.

- **G8 — obsolete `<frame>` title (4.1.2 / TT 12.C).** TT 12.C checks a `<frame>` (frameset) carries a title;
  `<frame>`/`<frameset>` are HTML5-obsolete. The `<iframe>` name facet IS covered (named-iframe →
  `name-role-value`, `applicability-oracle.js`). A cheap add — extend the named-iframe oracle branch to
  `el.tag === 'frame'` — but the surface is effectively extinct on the modern corpus. Track, do not prioritize.

## G. Full-page (or scrolled) vision for the page-STRUCTURE rubrics — retires the G1 faux-list glyph heuristic

**Deferred 2026-06-18** after the heuristic-vs-LLM adversarial audit. The page-level structure rubrics
(`info-relationships-v0` 1.3.1, `heading-descriptive-v0` 2.4.6, `section-headings-v0` 2.4.10) declare
`visionEvidence: [viewport]` — so they are **blind to anything below the fold / off-screen**. This is a
SINGLE general limitation that currently has several piecemeal patches:
- the off-screen-heading evidence blackout (`LLM-ROUTING-AND-FAILURE-ANALYSIS.md` b49b2e: a `top:-9999px`
  heading omitted from the viewport frame; partly mitigated by surfacing `{role, level, offscreen}` into
  precompute, but the model still can't SEE it);
- the **G1 faux-list glyph heuristic** — a DOM-text proxy that exists largely to compensate for the rubric
  not seeing below-fold lists, and which fundamentally cannot see CSS `::before`/`list-style-image` bullets.

**Principled fix (one change, several patches retired).** Give the page-structure rubrics a **full-page or
scrolled-tile capture** (the `capture_full_page` CDP tool already exists, `scripts/v3/lib/cdp-tools.js`), so
vision judges ALL rendered structure — headings, lists (CSS-bulleted or not), tables — uniformly from pixels.
Then: (a) the off-screen-heading blackout closes for free; (b) the G1 faux-list glyph detection can be
**retired** (or demoted to a pure below-fold-recall hint), since vision now sees every rendered list. Sequence:
add a `full-page`/`viewport-tiled` entry to `VISION_EVIDENCE` + the capture pipeline; switch the three
page-structure rubrics' `visionEvidence`; re-verify the b49b2e off-screen case + a CSS-bulleted faux list now
resolve from pixels; then thin `collect-lists.js` to real-list facts + (optionally) a below-fold-only hint.
Cross-ref: `TRUSTED-TESTER-GAP-ANALYSIS.md` "Architectural note (G1)". Medium priority — the glyph heuristic
is correct-but-marginal today (LLM-judged candidate), so this is an elegance/coverage win, not a barrier fix.

**Partial sidecar prototype 2026-06-22.** A first `visual-structure-discovery` lane now exists in
`scripts/v3/lib/broad-scope-probes.js` and `scripts/v3/lib/broad-scope-llm-review.js`. It finds generated
heading-like text, bullet-like groups, and CSS grid/table-like layouts that are not programmatic headings, lists,
or tables/grids. It routes review packets to `1.3.1` / `2.4.6` plus optional AAA `2.4.10` follow-up, attaches
visual refs, and is code-clamped to `UNCERTAIN` as a discovery-only sidecar. Verified evidence: 300/300 generated
non-interference/interaction rows pass, including 10/10 visual-structure positives and 10/10 negatives; prompt
pressure reports visual-structure verdicts `{UNCERTAIN:10, NO_REVIEW:10}` and 0 converted judgments; all 20
visual-structure fixtures have screenshot/state captures.

This does **not** close item G. Remaining work is full-page/tiled capture for the real page-structure rubrics,
OCR/vision support for canvas/SVG/background/pseudo-rendered structure, below-fold saved-site pressure, responsive
breakpoints, and retirement/demotion of the older faux-list glyph heuristic after equivalence is proven. Absence of
a visual-structure packet must never read as a pass.

**R2 residual lows (deferred 2026-06-19, from `TRUSTED-TESTER-GAP-ANALYSIS-R2.md`).** The R2 independent review's
medium findings were all fixed (G2-1 interactivity parity, G3-1 token detection + alt-adequacy retention, G3-2
in-frame captcha, G5-F2 active-validator gate, G5-F1 type=button trigger, G5-F4 aria-invalid restore). The remaining
**low** items are deferred as recall/elegance, none a barrier or false-PASS:
- **G2-2 (`::before`/`::after` background icons).** `getComputedStyle(el).backgroundImage` does not read pseudo-element
  backgrounds, so a non-interactive `::before` status icon with no text/name is invisible to the bg gate. (An
  *interactive* one is rescued by 4.1.2 `button-name`.) The detection primitive exists (`exp-runners.js` `pseudoPaints()`);
  when picked up, read `getComputedStyle(el, '::before'/'::after').backgroundImage` in `_bgMeaningful` (both collectors).
  Low — rare, and an unmarked status icon is usually also a `::before` *content* glyph axe/AT can see.
- **G2-3 (meaningful bg co-located with text on ONE element).** The `text.length===0` gate is a deliberate
  decorative-flood guard, but text-*presence* ≠ text-*equivalent*: `<div class=bg>Premium</div>` whose background
  conveys separate meaning is owned by nobody. The common idiom (separate badge/icon span) IS caught. Removing the
  guard floods (every labelled button/card has a bg); a sound fix needs a "bg conveys info BEYOND the text" judgment —
  push to the rubric with the element-crop rather than gate it in the collector. Low.
- **G1 `::before`/`list-style-image` recall hint.** The faux-list nominator is DOM-text only; a list rendered with
  CSS bullets is invisible to it (the `info-relationships-v0` rubric already judges it from the viewport screenshot —
  see DEFERRED-TODO §G full-page vision). Optional: read `::before`/`::marker` content to hand the rubric a textual
  hint. Low — overlaps §G.
- **CC-3 / 7.A.1.c** is now **resolved** (a captcha `<img>` keeps `alt-text-adequacy`, which asks the alt-purpose
  question, alongside `captcha-alternative`).

**G2 follow-on (corpus-path inventory completeness, NOT a fact-parity gap).** The background-image-meaning FACT is
computed identically in BOTH collectors (`act-page-collect.js` self-includes bg-image/captcha elements via its
inclusion gate; `eval-page.js` computes the same fact in its per-element evaluate). But `eval-page.js` only
evaluates the elements its external xpath INVENTORY lists, so a PURE non-interactive decorative-looking `<div>`
with an informational background-image is caught on the corpus path only if the inventory builder includes it
(interactive bg-image controls, which ARE inventoried, are already caught). When the corpus path is next
exercised, extend the inventory builder to nominate `getComputedStyle(el).backgroundImage` `url()` elements that
have no text and no accessible name. Low priority — the active ACT eval path (act-page-collect) is complete.

---

## H. EN 301 549 V4.1.0 Annex C — conformance-scope items (deferred / boundary)

**Recorded 2026-06-19** from `docs/reference/standards/en301549/EN301549-ANNEX-C-ANALYSIS.md`. Annex C for Web is **WCAG 2.2
pass-through** per-criterion (no EN-specific per-SC test to build), so the only EN-distinct work is at *page/process*
scope (C.9.6 conformance requirements, C.9.7 user preferences). **Implemented now:** the C.9.6.2 "full pages"
TRUNCATION DISCLOSURE (`collect.coverage` + build `coverage`/`summary.coverageTruncated`) — a page-clear on a
cap-truncated page is no longer mistaken for a full-page claim. The rest:

- **C.9.7 user preferences — deterministic check (DEFER, feasible).** No lane checks that the page doesn't block UA
  presentation modes / override platform a11y settings. The cheap, sound part is detectable: `user-scalable=no` /
  `maximum-scale=1` in the viewport meta (blocked zoom). The harder part (animation that ignores
  `prefers-reduced-motion`, blocked `forced-colors`) can reuse the existing `render_with_overrides` CDP tool
  (emulate the media feature, diff the render). New conformance-scope lane outside the 22 selected SCs — defer; do
  the `user-scalable=no` detector first when picked up (overlaps WCAG 1.4.4 resize-text).
- **C.9.6.5 non-interference — production promotion remains DEFERRED.** 2.2.2 is **already covered** by the
  `motion-control` family + `motion-control-v0` rubric. Experimental broad-scope sidecar lanes now exist for
  1.4.2 audio control, 2.2.2 pause/stop/hide evidence, 2.3.1 flash-risk, and 2.1.2 trap review, with generated
  fixtures and no-authoritative-publication gates. These are **not production conformance lanes yet**:
  - 1.4.2 generated positives prove known non-silent media playback for >3s with no native or working
    independent control, and generated custom pause/mute/volume controls are now exercised for observed effect.
    Arbitrary saved-site audibility remains unresolved without a future audio-output side signal or equivalent
    proof.
  - 2.3.1 generated positives cover only a narrow JS opacity-toggle fixture; production needs rendered-frame
    sampling, actual timestamps, relative-luminance / saturated-red threshold math, viewport/occlusion checks, and
    adversarial flash classes.
  - 2.1.2 generated keyboard-trap coverage now includes self-refocus, region/escape, and fixed-set confinement
    positives plus Escape/advised-exit, single-focusable, one-way, and focus-redirection controls. Production
    promotion still needs saved-page pressure, state isolation/replay traces, and bridge policy for any non-generated
    detector expansion.
  Keep these sidecar-only until each family has a finite applicability predicate, adversarial fixture classes, saved
  page pressure evidence, and explicit bridge authorization.
- **C.9.6.3 Complete processes — STRUCTURAL BOUNDARY (document, don't build).** `orchestrate()` consumes a single
  `collect` (one page/state); there is no flow/journey input. A multi-step process where step 3 has a barrier
  passes every per-page run. This is the same single-page boundary as TT G6 (§F) — accept and document; a
  page-clear must never be read as process-conformant. Not runner-fixable without a flow orchestrator.
- **C.9.6.4 Only accessibility-supported ways — STRUCTURAL BOUNDARY.** The harness reads a sampled/CDP accessibility
  tree as a *proxy* for AT exposure; it cannot verify a technique is accessibility-supported across a real
  AT/browser matrix (the EN/WCAG sense). Fine for mainstream HTML/ARIA, an unverified assumption for novel widgets.
  An automated harness fundamentally cannot run a real-AT matrix — document as a known limitation.
- **Corpus-path (eval-page) truncation parity.** The full-pages disclosure landed on the active ACT path
  (`act-page-collect`, body-scan cap). `eval-page` collects from an external xpath INVENTORY, so its "truncation"
  is the inventory builder's concern (it would carry no `collect.coverage` → disclosed as untruncated). When the
  corpus path is next exercised, have the inventory builder record whether it capped, mirroring `coverage`.

**NOT relevant / no action (recorded so they aren't re-raised):** (1) per-criterion "EN tests" — Web Annex C *is*
WCAG 2.2; nothing to build. (2) 2.4.10 over-coverage — EN treats it AAA-informative; the harness covers it
non-authoritatively (shadow), so the extra coverage is harmless. (3) Adding 2.5.7 / 3.2.6 / 3.3.7 — the analysis
itself annotates "(builder: disregard this)"; the 22-SC selection is the deliberate scope. (4) The EN
Inspection/Pass/Fail/Not-applicable → applicability-oracle + PARTIAL/PROVISIONAL mapping is a positioning point,
not a code change.

---

## I. Network-egress guard: refine to per-resource-type policy IF the corpus gains legit external resources

**Recorded 2026-06-20.** `tab-allocator.js` now installs a **hard network-egress guard** at the single tab
chokepoint (commit 853149c): request interception aborts **every** non-local `http(s)` request (localhost
exempted; `file:`/`data:`/`blob:`/`about:` continue). This stopped the gutenberg `.epub` fetch/stall (ACT 5effbb
links to `gutenberg.org/ebooks/4300.epub.images`; the download-deny guard cancelled the SAVE but not the network
FETCH — the 30-75s stall the exp-runners comment documents).

**Why the BROAD block is correct TODAY (verified, not assumed).** Across all **602** fixture files, exactly **one**
references an external embedded resource — a GitHub **`/blob/`** logo URL (`github.com/act-rules/…/act-logo.png`),
which is the HTML viewer page, **not** a raw PNG, so it was **already broken before the guard**. Every other
fixture is self-contained; all `file://` local resources still load (probe-verified). The gutenberg links are
**href-only** (not embedded), so blocking their activation-fetch leaves both the rendered page and the href the
LLM reads for 2.4.4 unchanged. And nothing about the block reaches the LLM: the collector has no console/network
capture (its only handler is a no-op `page.on('pageerror', () => {})`), no precompute-signal/prompt field carries
a network/error string, and the keyboard probe records the link as *operable* (`navigated=true` from intent), not
as an error. So the broad block introduces **zero** LLM-visible info and zero rendering artifact on this corpus.

**When to refine (the deferred work).** If the corpus is ever expanded to fixtures that LEGITIMATELY embed
external rendering resources (external `<img>`/CSS/fonts that must appear in a vision crop — e.g. a real-site
capture, or 1.1.1/1.4.5 cases whose image is hosted off-page), the broad block would corrupt those crops (broken
images) and could mislead the LLM. Then refine the guard from "abort all external" to a **per-resource-type
policy**:
- **ALLOW** external `image` / `stylesheet` / `font` (`req.resourceType()`) — rendering fidelity for vision crops.
- **BLOCK** external `document` (navigations / downloads — the `.epub` leak is a document/navigation request),
  `xhr` / `fetch` / `websocket` / `media` / `script` (egress leaks + heavy fetches).
- **Caveat (do not skip):** allowing external rendering resources **reintroduces a page-load stall risk** for slow
  external hosts (the `goto({waitUntil:'load'})` waits on them). Pair the allow-list with a short per-request
  timeout / abort-after-N-ms and/or a size cap so a slow external image cannot re-create the stall this guard was
  added to remove. (This is exactly why the broad block is preferred while no legit external resource exists.)
- Verify: a fixture with a real external image renders it in the crop; a fixture linking an external `.epub` still
  gets `ERR_BLOCKED_BY_CLIENT` on activation; the local 5effbb probe still shows 0 leaked gutenberg requests.

Low priority — purely contingent on a corpus change that has not happened; the current corpus makes the broad
block strictly correct (no fidelity loss, no stalls, no leaks).

---

## J. Broad WCAG / Trusted Tester / EN support program beyond ACT

**Recorded 2026-06-21** from the broad-scope integration work in
`docs/analysis/improvement-research-2026-06/BROAD-SCOPE-INTEGRATION-EXPERIMENT-REPORT.md`. The user explicitly
asked not to limit future work to ACT examples or the current observed errors. ACT remains useful for atomic
checker calibration, but it is not the shape of the whole problem: Trusted Tester and EN requirements include
hidden/revealed states, page sets, complete processes, user preferences, real accessibility-support assumptions,
and semantic adequacy judgments that an ACT-only fixture set will miss.

Decision: support these broader surfaces through the v3 sidecar/discovery architecture first, not by widening
authoritative pass/fail publication. New lanes should initially create evidence packets, dynamic subjects,
process/site manifests, or human/LLM review queues. They may bridge into v3 judgments only after they have a
finite applicability predicate, positive evidence requirements, adversarial fixtures, and explicit bridge approval.
Clean detector output must never mean "page passes."

Priority implementation themes:

- **Reveal-state discovery.** Implement §D / TT G4: activate disclosures, tabs, menus, dialogs, carousels, and
  expandable trees in isolated page states; diff DOM/AX/focus order; emit dynamic subjects with action provenance.
  This supports WCAG focus order/visible content checks and Trusted Tester reveal-then-check procedures.
- **Full-page / tiled structure vision.** Implement §G so structure rubrics can see below-fold headings, lists,
  tables, visual text, canvas/SVG regions, and pseudo-rendered structure. A 2026-06-22 generated sidecar prototype
  now covers visible non-semantic heading/list/table-like HTML/CSS patterns, but not full-page/tiled OCR or saved
  websites. Keep it discovery/review-first; do not clear page-level 1.3.1 / 2.4.x obligations from absence.
- **Visual-content discovery.** Implement §B for real pages: full-page/tiled screenshots plus OCR/vision/region
  discovery for image text, canvas/SVG charts, icon-only meaning, and color-only information. A 2026-06-22 generated
  sidecar prototype now covers fixture-assisted pseudo/background text, canvas/SVG charts, and color-only cues, but
  remains `UNCERTAIN`-only and cannot prove alternative adequacy on arbitrary pages.
- **Media and temporal thresholds.** Promote only narrow, measured sub-lanes first: live-page audibility proof for
  1.4.2 beyond generated non-silent fixtures; rendered-frame flash frequency/area/red-threshold math for 2.3.1;
  persistent non-essential motion with exercised controls for 2.2.2.
- **Time-based media alternatives.** A 2026-06-22 generated media-alternatives packet slice now covers 10 positive
  and 10 negative scoped `1.2.x` fixtures with inline transcript/description extraction, SC-specific LLM prompt
  rules, and explicit barrier-or-uncertain sidecar packets. The live sidecar path now preserves scoped `1.2.x`
  warnings, structural evidence claims, and extracted media details when a content model exists; pages without a
  content model still fail closed to `UNCERTAIN`. This is still not a real-media solution: saved websites need
  caption/transcript/description file extraction, ASR or media-content modelling, and separate enumeration for each
  applicable `1.2.x` SC. A clean/scoped-control media packet is not a media pass.
- **Accessible authentication.** A 2026-06-22 generated `3.3.8` packet slice now covers 10 positive and 10 negative
  controls, including password recall, CAPTCHA-like tests, transcription/calculation/puzzle/personal-content recall
  barriers, and scoped exceptions such as password managers, passkeys, one-time-code autocomplete/paste support,
  non-cognitive alternatives, object-recognition exception, personal-content exception, and explicit
  not-authentication-step controls. Prompt-pack pressure now emits 20 auth packets with `{LIKELY_BARRIER:10,
  UNCERTAIN:10}` and 0 converted judgments. This is still not a real authentication solution: saved websites need
  flow manifests, test credentials, process-state driving, CAPTCHA alternative discovery, and exception adequacy
  review. A clean/no-packet auth result is not a `3.3.8` pass.
- **Redundant entry.** A 2026-06-22 generated `3.3.7` packet slice now covers 10 positive and 10 negative controls.
  Positives require same-process, same-information-previously-provided, required-reentry, and no
  auto-populate/selection/exception evidence. Controls cover auto-populated reuse, selection, different process,
  not previously provided, optional re-entry, security/invalid-data/essential exceptions, not-redundant-entry, and
  user-confirmed reuse. Prompt-pack pressure now emits 20 redundant-entry packets with `{LIKELY_BARRIER:10,
  UNCERTAIN:10}` and 0 converted judgments; visual capture includes all 20 cases. Independent review found and the
  implementation fixed two integration issues: real `runBroadScopeForUrl()` now preserves evidence claims, and
  broad-scope review clamps disallowed `LIKELY_OK` outputs for barrier-or-uncertain lanes. This is still not a real
  process solution: saved websites need process/session traces or manifests proving previous entry and same-process
  scope. Treat EN references here as applicable-WCAG-version pass-through context, not as a current EN 301 549
  V3.2.1 clause. A clean/no-packet redundant-entry result is not a `3.3.7` pass.
- **Language/readability cognitive sidecar.** A 2026-06-22 generated `3.1.5` packet slice now covers 10 positive
  and 10 negative controls. Positives require user-facing required text, above-lower-secondary reading level after
  proper-name/title removal, no supplemental content observed, no lower-secondary version observed, supplement
  adequacy evaluated, and language/method support. Controls cover supplemental summaries, lower-level versions,
  non-required text, below-threshold text, glossary/examples/audio/illustration support, proper-name/title issues,
  unsupported-language methods, and review-disabled samples. Prompt-pack pressure emits 20 packets with
  `{LIKELY_BARRIER:10, UNCERTAIN:10}` and 0 converted judgments; visual capture includes all 20 cases. This is still
  not a real reading-level solution: saved websites need selected passage sampling, language detection,
  proper-name/title removal records, language-specific readability formulas or qualified review, threshold mapping to
  lower secondary education, and supplemental-content adequacy review. SC 3.1.5 is AAA and not generally an EN 301
  549 V3.2.1 web requirement. A clean/no-packet readability result is not a `3.1.5` pass.
- **Character key shortcuts.** A 2026-06-24 generated `2.1.4` packet slice now covers 10 positive and 10 negative
  controls. Positives require a trusted single printable keypress, observed page-state change outside a focused
  component, and no observed turn-off/remap/focus-only exception. Controls cover no shortcut surface, focus-only
  shortcuts, working turn-off controls, working remap-to-modifier controls, and Control/Alt modified-key shortcuts.
  Prompt-pack pressure emits 20 packets with `{LIKELY_BARRIER:10, UNCERTAIN:10}`; the 10 positives bridge to
  barrier-only v3 judgments and the 10 controls produce 0 clears. This is still not a complete real-page solution:
  saved websites need better discovery for JavaScript-only document/window listeners, canvas/offscreen/storage state
  effects, persisted preference flows, and multi-step settings/remap workflows. A clean/no-packet shortcut result is
  not a `2.1.4` pass.
- **Status announcements.** A 2026-06-24 generated `4.1.3` packet slice now covers 10 positive and 10 negative
  controls. Positives require trusted activation, observed status information about success/results/waiting/progress/
  errors, focus not moved to the message, and no observed live/status/alert/log/direct announcement channel. Controls
  cover `role=status`, `role=alert`, `role=log`, `aria-live`, focus movement, direct programmatic announcement, HTML
  dialog context, native alert context, and disclosure/expanded-content context. Prompt-pack pressure emits 20 packets
  with `{LIKELY_BARRIER:10, UNCERTAIN:10}` and 0 converted judgments; the lane remains sidecar-only with no registered
  v3 publication claim family. Visual inspection confirmed that visually similar status messages can be barrier
  candidates or scoped controls depending on programmatic/focus/context evidence. Remaining work: real accessibility
  API/AT support evidence, delayed/debounced status settle windows, explicit handling for status-removal and icon-only
  status semantics, and a publication derivation if this ever graduates beyond review evidence. A clean/no-packet
  status result is not a `4.1.3` pass.
- **Target size minimum sidecar controls.** A 2026-06-24 generated `2.5.8` packet slice now covers 10 positive and
  10 negative controls. Positives require a rendered pointer target, below-24-by-24 CSS-pixel geometry, and 24px circle
  spacing intersection. Controls now emit scoped `UNCERTAIN` packets for sufficient spacing, inline/in-sentence
  targets, essential presentation, equivalent same-page target, unmodified user-agent control, and at-least-24px
  targets. Prompt-pack pressure emits 20 packets with `{LIKELY_BARRIER:10, UNCERTAIN:10}` and 0 converted judgments;
  integration audit reports 0 clear-bridgeable and 0 barrier-bridgeable rows. This broad-scope LLM lane is not the
  publication authority for 2.5.8; the deterministic geometry path remains the intended publication mechanism.
  Remaining work: real same-function equivalent proof, stronger essential/legal and UA-control attribution, tangent/
  fractional-circle boundary fixtures, transformed/clipped/rounded/complex-shape targets, and obscured target states.
  A clean/no-packet target-size result is not a `2.5.8` pass.
- **Pointer and alternative-operation discovery.** Extend fixture-scoped 2.5.1 / 2.5.7 probes to discover author
  path gestures, multipoint-like gestures where possible, drag widgets, keyboard/text-field/menu alternatives, and
  independent essential/UA exception evidence. Current generated lanes are deliberately not exhaustive.
- **Process and page-set manifests.** Structured sidecar analyzers now exist for optional complete-process and
  site-set manifests, with generated 10/10 positive and 10/10 negative controls for measured process-step failures,
  scoped process controls, redundant-entry exception facts, duplicate/different-purpose titles, repeated navigation, help mechanisms,
  component identification, and same-name link purpose. Complete-process and site-set controls now emit scoped prompt
  packets in generated tests (`SCOPED_PROCESS_CONTROL` / `SCOPED_SITE_SET_CONTROL` → `UNCERTAIN`) instead of
  disappearing as no-packet rows, while the default clean-manifest production paths remain fail-closed and
  non-authoritative. Remaining deferred work is to feed
  them from real flow/page-set inputs: crawler/session traces for complete processes, redundant entry, consistent
  navigation/help/title, and EN full-page/process conformance scope. Missing, incomplete, or clean manifests should
  produce scope warnings or scoped review controls, not passes or barriers by themselves.
- **Platform/user-preference sidecars.** Keep forced-colors, reduced-motion, resize/reflow, zoom restrictions, and
  EN C.9.7-style user-preference checks as sidecar or registered narrow WCAG mappings. Browser emulation is useful
  evidence, not a full accessibility-support matrix.
- **Document/rich embedded content adapters.** If PDFs, office docs, EPUBs, canvas-heavy apps, SVG, or embedded
  viewers enter scope, add artifact-specific extraction/vision adapters with explicit artifact type and extraction
  provenance. Do not roll source-document findings into web-page conformance without an explicit scope decision.

Testing focus for every lane:

- 10 positive + 10 negative generated fixtures before any saved-site pressure run.
- At least one adversarial round targeting false negatives, stale state, wrong target attribution, exception abuse,
  and non-exhaustive alternative search.
- Prompt-pack and schema tests proving broad-scope clears remain sidecar-only unless a registered bridge says
  otherwise.
- Representative visual/state inspection, plus a written caveat for what the lane still cannot prove.

## Micro-check ABSTAIN-ESCALATION (deferred 2026-06-22)
The focused LLM micro-checks are wired into the runners ONLY as FALSE-BARRIER REDUCERS (review a deterministic FAIL,
clear it on a skeptic-confirmed exemption). The complementary idea — ESCALATING a deterministic ABSTAIN to a fail to
catch a barrier the runner can't decide — is built (`resolveEscalation` in `micro-checks.js`, gated behind
`escalateAbstains` in the C5/C8/C2 wrappers, default OFF) but NOT integrated, because escalation ADDS false-barriers
(measured: C5 +15, C8 +11) — the opposite of the current goal of keeping the false-barrier count low. Revisit when
recall (catching missed barriers) is wanted over precision; turn on `escalateAbstains` per-runner and re-tune the
escalation confidence bar / skeptic to hold the false-barrier rate down.

## Force-invoke resolve_destination for 2.4.4 same-named links (IMPLEMENTED 2026-07-02)
DONE (orchestrator.js pre-resolution + llm-adjudicator.js `sameNameLinks.settledDestinations` signal +
link-name-equivalence-v0.md). The orchestrator now resolves each same-named SET once and attaches the settled-
destination byte-equality grid as a DETERMINISTIC signal, so passive models judge purpose from settled content, not
raw paths. Validated on ACT 2.4.4 (Sonnet 5, tools): clears the distinct-path equivalent FP (`8e6c190e`,
about/contact vs careers/contact both titled "Contact"), recall-safe (0/grid-attributable recall loss).
RESIDUAL LIMITATION (kept, by two recall-safe guards that WITHHOLD the grid → fall back to the raw-href signal that
already catches these): `resolve_destination` cannot faithfully fingerprint a CLIENT-SIDE QUERY BRANCH (same page,
`?page=N` revealed by JS over shared nav/chrome — the branches read equal) nor a root-absolute `/…` onclick target
under `file://`. So query/hash-only-differing sets (and null resolves) are NOT given a grid; they stay on the raw-
href divergence heuristic. Remaining future work (only if the query-branch FN becomes material on a real HTTP corpus):
a query-branch-aware fingerprint (diff the display-toggled section, not whole-page visibleText) so those sets can
also be resolved deterministically. Original design note follows for context:


The residual ACT `fd3a94` 2.4.4 false positives (4/4 on Sonnet 5; recurring across models — `8e6c190e`,
`b55973d2`, `228c0a3d`, `58087cbeb1`) were hand-audited at the criterion level: the ACT `passed`/`inapplicable`
labels are CORRECT (resolving the local test-asset destinations, `about/contact.html` and `careers/contact.html`
both render "About - Contact"; the "Read more" pair has DIFFERENT enclosing context → fd3a94 inapplicable). So NO
`GT_OVERRIDE` is warranted — overriding an authoritative W3C label to excuse our own error is the exact anti-pattern
the cross-rule-indeterminate guardrails forbid. The FPs are a model tool-USE gap: `link-name-equivalence-v0`'s prose
is already correct (resolve settled destinations, never a confident barrier on raw hrefs, PARTIAL if unresolved) and
`resolve_destination` already handles these `file://` cross-dir links (`ROOT_DEPTH=3`), but the model judges on the
raw PATH ("about" vs "careers" department) instead of calling the tool, and returns a confident REPRODUCED.

`required-tool-routing.js` ALREADY declares the intended fix — 2.4.4 → `resolve_destination`, "the orchestrator
should invoke the tool and attach its result as required evidence" — but the orchestrator does NOT force-invoke it;
it only threads `linkPeerGroups` so a model-initiated call self-coalesces. Deferred work: in the orchestrator tool
session, for each same-named link SET (computeLinkPeerGroups), run `resolve_destination` once and attach the settled-
destination byte-equality grid as a DETERMINISTIC signal on those subjects (the cellColHeaders/#12b pattern — give
passive models the answer so they don't need to call the tool). Removes the compliance dependency entirely and clears
the fd3a94 cluster the right way. Non-trivial (browser fetches at setup, signal threading, live-browser tests against
the b20e66 mirror) — its own scoped task + a 2.4.4 re-run watching recall, not folded into a rubric edit.

## J. Port the act-rest R2 detection passes to the PRODUCTION collectors (act-page-collect.js / eval-page.js)
**Approved deferred 2026-07-07** (act-rest expansion Round 2; adversarial verifier recommended defer, lead concurred).
The three R2 instrument detections — 59br37 zoom-clip (640×512 relayout pass), efbfc7 auto-update (timed innerText
snapshot pass), 2.4.1 bypass-blocks (repeated-block/limb enumeration) — live ONLY in the eval harness collector
(`eval/checker-comparison/run-v3-act-rest-suite.js` collectForV3). Production runs do not enumerate R2 obligations,
so the 3 runners (shadow authority) are invisible outside the act-rest eval.

**Why deferred, not shipped:** the passes are expensive and mutating for production — efbfc7 adds a ~1.6 s blocking
snapshot window; zoom-clip thrashes the viewport to 640×512 mid-collection (corrupts geometry-derived in-scope facts
unless save/restored); the runners reload and drive the page (high mutationRisk). Porting naively risks regressing the
22-SC in-scope metrics for zero gating benefit while the R2 lanes are shadow-only.

**Design when actioned:** (1) viewport save/restore bracketing (or a dedicated post-pass browser context) for the
640 pass; (2) the efbfc7 snapshot behind a time-budget flag (skip when the page shows no timer/mutation activity);
(3) bypass-blocks enumeration is cheap/static — portable first; (4) gate the port with the standard deterministic
581 pre/post diff PLUS an in-scope geometry-fact diff (the specific corruption vector); (5) only after the R2
must-fixes (multi-block skip-past; used-line-height measurement) are in.

**Round 3 addition (1.3.3 sensory-characteristics, approved deferred 2026-07-07):** the `sensoryWordHint` collector
fact (the requirement-sourced `sensory-lexicon.js` pre-filter over each element's OWN direct text) also lives ONLY
in the eval collectForV3, so production runs do not enumerate the 1.3.3 obligation and the LLM rubric never fires
outside the act-rest eval. Porting is CHEAP + non-mutating (a pure Node string scan over already-collected `ownText`
— no browser pass), so it is the low-risk first candidate; the only requirement is collecting each element's direct
text-node content (`ownText`) in act-page-collect.js / eval-page.js, then running `sensoryWordsIn` in the builder or
collector. Also DEFERRED and FLAGGED: threading the sensory-term WHY + the instruction text explicitly into the
rubric prompt needs a `precomputeSignals` branch (shared LLM prompt-assembly) — the Round-3 rubric relies on the
`viewport` vision + `__pageStructure` instead, which the hard "don't touch shared LLM plumbing" constraint required.

## K. 1.3.3 LLM-lane FP elimination — the three requirement-keyed paths (do NOT rubric-tune against the slice)
**Approved deferred 2026-07-07** (act-rest Round 3 close-out). Measured honest floor on the 9bd38c 21-case slice
(claude-sonnet-4-6, 2 independent post-fix runs): recall 4/4 both runs; fp 3/17 stable (e871d671, 09eef7b7,
5c97d7f0) + 1 flip-flopping borderline (432e113b, the known ±1 sampling noise). Evidence:
`upstream-evidence/v3-act-rest-r3llm-postfix-run{1,2}/`. The composition is genuinely earned — evidence-starvation
(ba678638) was fixed by threading headings/landmarks into the eval collector, and the fixture-anchored rubric
examples were genericized (which un-suppressed 5c97d7f0, previously masked by a spoon-fed worked example).

Elimination paths, each keyed to the requirement, none tunable against the slice alone:
1. **5c97d7f0-class (stable judge error, evidence present):** strengthen the rubric's accessible-words/name-match
   principle GENERICALLY, validated exclusively on NOVEL non-fixture probes (build 5+ fresh sensory-instruction
   pages first; accept only if the novel probes AND the slice both improve; a slice-only improvement = overfit, reject).
2. **e871d671-class ("below/above" as reading-order):** a deterministic DOM-adjacency signal — does a matching
   target immediately adjoin the instruction in content order? (Understanding 1.3.3 explicitly blesses reading-order
   usage.) Requires a `precomputeSignals` branch (shared LLM prompt assembly) → targeted LLM validation of affected
   slices per the gate policy when actioned.
3. **09eef7b7-class (cross-page alternative):** route `resolve_destination` for 1.3.3 instructions that reference
   linked content — eliminates the FP AND preserves the Failed-3-style recall properly (abstaining trades FP for FN;
   resolution decides both directions). Shared-tool routing → same targeted-validation requirement.

**Controlled fixed-evidence root-cause (2026-07-07).** Froze the 21-case 9bd38c evidence with the EVAL collector
(`fp-experiments/freeze-actrest-133.js`, packs at `results/fp-experiments/packs-133`; the production `collectActPage`
can't be used — no 1.3.3 pre-filter) and replayed the judge on byte-fixed evidence (`replay-judge.js --scs=1.3.3`),
so any FP/recall delta is the judge design, NOT collect/vision noise. Results (`results/fp-experiments/runs/fp133-rep-*`):
- **baseline rep=8: FP=3 sd=0, recall=4/4 sd=0.** The three FPs {5c97d7f0, e871d671, 09eef7b7} are FULLY STABLE
  (zero judge sampling noise) — they are rubric/judge-design gaps, not the ±1 the slice showed.
- **CORRECTION to the "432e113b = ±1 sampling noise" note above:** on frozen evidence the judge clears 432e113b in
  EVERY rep (stable-correct). Its live flip was EVIDENCE variance (the `transform:rotate` vision crop differs
  run-to-run), NOT judge sampling. So the honest floor is a rock-solid 3/17, and 432e113b is a stable CLEAR.
- **09eef7b7 is PROVEN irreducible tools-off:** its failed twin **1527ef77** (same "the triangle menu / information
  page" instruction; the ONLY difference — a heading on the LINKED page — is invisible to the judge) is judge-identical.
  Every tools-off lever that clears 09eef7b7 (grounded rep=4: FP→1) simultaneously wobbles 1527ef77 recall (3/4). This
  is the FP↔FN trade; path 3 (`resolve_destination`) is the SOLE fix. Empirically confirmed, not asserted.
- **Generic spec-derived levers (non-fixture, from `methods.js`), FP-vs-recall on frozen evidence:** `grounded` FP 3→1
  but recall 4→3.75 (leaks into the cross-page pair); `refute` FP→1 recall→3.25 (worse); `abstain-high` no help (all
  3 FPs go noisy, recall intact); **`boundary` (WCAG "when-NOT-to-flag" guardrails) CLEANLY eliminates 5c97d7f0 with
  ZERO recall loss** (n=10 across rep4+rep6: 5c97d7f0 cleared every rep, recall 4/4 sd=0; e871d671+09eef7b7 remain).
  So path-1 (5c97d7f0) has a validated NON-rubric-tuning elimination — but `V3_FP_BOUNDARY` is a GLOBAL adjudicator
  flag (affects all 22 paper SCs), so shipping it needs the full 581 re-validation, OR fold the specific guardrail
  into the 1.3.3 rubric (rubric-local) and validate on NOVEL probes per path 1. NOT shipped — team-lead decision.
