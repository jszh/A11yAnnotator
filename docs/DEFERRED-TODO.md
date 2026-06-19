# Deferred TODO — user-approved, not-yet-implemented

The single backlog for work the user **explicitly approved deferring** (distinct from speculative
recommendations, which live in the analysis docs). Each entry carries enough design to action later.
Add new items here when the user approves deferring a concrete piece of work.

Cross-reference: `docs/analysis/LLM-ROUTING-AND-FAILURE-ANALYSIS.md` holds the broader (not-yet-approved)
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
`docs/analysis/TRUSTED-TESTER-GAP-ANALYSIS.md`. These four are the gaps the analysis itself rated
defer/structural/minor; each is recorded here with its reasoning and (where it exists) a pointer.

- **G4 — reveal-then-check focus order & focus WITHIN revealed content (2.4.3 / TT 4.F.2.b).** TT requires
  ACTIVATING triggers that reveal hidden focusables (menus, dialogs, expandable trees) and checking focus order
  to/from/within them. This is the SAME work as **backlog item D** (dynamic-subject reveal discovery) — see §D
  above; do not duplicate. When picked up, reuse `observe_state_after_activation` to open each reveal, then re-run
  the `tab-order` instrument within the revealed subtree. Fail-closed: an unopened reveal must NOT read as
  "no barrier". Still deferred.

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
