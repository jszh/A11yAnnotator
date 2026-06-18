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
