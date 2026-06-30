# How the three components contribute — deterministic stack, LLM rubrics, agentic tools

*Example-grounded analysis of the last full Claude run (`results/full-claude-default`, commit `49b4c23b`,
458-case reaches-LLM set, per-SC scoring). Companion to [PAPER-TABLES-CONTRIBUTIONS.md](./PAPER-TABLES-CONTRIBUTIONS.md).*

## The question

The deployed harness has three layers on top of a raw multimodal LLM: a **deterministic stack** (axe + the
applicability oracle + per-SC runners/instruments), a set of **atomic LLM rubrics** (one per SC, fed structured
signals), and **agentic CDP tools** the rubric can call. This doc traces, from the run's own verdicts and traces,
**how each layer moves recall and precision** above the baseline of an LLM handed only *raw HTML + a screenshot*.

| System | Recall | Precision | FP rate | F1 |
|---|---|---|---|---|
| Baseline — LLM + vision, **no** facet-routed grounding | 54.5% (36/66) | 44.4% | 11.5% (45/392) | 0.49 |
| **Full harness** (deterministic + rubrics + tools) | **90.9% (60/66)** | **84.5%** | **2.8% (11/392)** | **0.876** |

The baseline *sees* the page and **guesses**: high-ish recall, but it over-flags (44% precision). The three
layers convert that guesser into a calibrated judge — **+36 recall and +40 precision** — and the mechanism is the
same throughout: **route by facet** — let a deterministic producer own every facet it can settle, and hand the LLM
only the residual *meaning* question, pre-loaded with the deterministic facts.

## Quantitative contribution map (this run)

**Recall — 60 true positives (49 LLM-rubric + 11 deterministic-lane):**
- **49 LLM-rubric barriers on deterministically-*routed* obligations** — the oracle enumerated a per-SC
  obligation, routed it to the matching atomic rubric with the matching signals, and the rubric's `LIKELY_BARRIER`
  filled it (PROVISIONAL disposition). Spread across **12 SCs** through 11 atomic rubrics (2.4.4, 2.4.6, 4.1.2,
  1.1.1, 2.4.10, 1.4.5, 1.3.1, 2.4.2, …); 39 were single-obligation subjects — one crisp question, not a page sweep.
- **11 deterministic-lane catches with no LLM barrier verdict** — 4 dynamic **instruments** (`v3Barrier`: contrast
  ×3, keyboard-trap ×1) + 7 **checker/detector fills** promoted to a PROVISIONAL barrier (axe `aria-prohibited-attr`
  ×3, focusable-in-`aria-hidden` ×1, iframe-in-tab-order ×1, keyboard-trap ×2). In **2** of these
  (`6cfa84·9812d828` focusable-in-aria-hidden, `akn7bn·62673162` iframe-interactive) the LLM had *cleared* the
  case — the deterministic detector was the only thing that caught it.
- **0 raw one-shot LLM catches** — every LLM catch went through a *routed* obligation, not a "find all barriers"
  sweep. Routing *is* the recall mechanism.

**Precision — 392 GT-pass/inapplicable cases, only 11 FP (baseline: 45):**
- **147 never enter the LLM lane** — the oracle's applicability gate didn't enumerate an obligation
  (`noObligation`): decorative `alt=""`/`aria-hidden` images, `role=presentation`, non-applicable elements. The
  baseline, with no applicability model, is free to flag all of them.
- **220 correctly cleared** by a grounded rubric (`missedAgree`, verdict `LIKELY_OK`/`N/A`) — spread across every
  SC (4.1.2 ×55, 1.3.1 ×49, 1.1.1 ×32, 2.4.4 ×29, 2.4.6 ×15, …). This is the grounding lever: given the
  deterministic facts, the model stops hallucinating barriers.
- **11 residual FP** — mostly the debatable-GT 2.4.4 same-name-different-destination set (`fd3a94`, `5effbb`),
  plus SVG-no-name / placeholder-name / cross-rule edges (`23a2a8`, `7d6734`, `4e8ab6`, `2779a5`).

**Agentic tools — 70 of 466 rubric-judgments called ≥1 live probe:** `query_ax_node` 41, `capture_full_page` 22,
`resolve_destination` 20, `resolve_part_color` 9, `ocr_image_text` 5, `request_hi_res_crop` 3,
`measure_geometry_live` 3, `compute_contrast_ratio` 2, `observe_state_after_activation` 2, `set_state_and_capture` 1.

## Master contribution matrix

Each row is a mechanism, with how it moves recall and/or precision vs the raw-HTML+vision baseline, and a real
case from this run. *(Examples filled from the per-component analysis below.)*

| Layer | Mechanism | → Recall (vs baseline) | → Precision (vs baseline) | Example (case · SC · effect) |
|---|---|---|---|---|
| **Deterministic** | Oracle enumeration + per-SC **routing** | Routes 49/60 TPs to the right rubric+signals as ~one bounded question; the baseline's one-shot sweep misses the long tail | — | `047fe0·81d501` 2.4.10 off-document h1 caught; `d0f69e·664972` 1.3.1 unscoped headers caught |
| Deterministic | **Applicability** gate (don't enumerate non-applicable) | — | 83 of 165 inapplicable cases → **0 obligations** — never enter the worklist | `e88epe·9f5f37` 1.1.1 decorative removed-from-tree image → `noObligation` |
| Deterministic | **Facet subtraction** (`RUBRIC_GATE` / disposition / `stripStyle`) | — | A runner-owned facet is withheld: **21 of 26** 1.4.3 cases settled by the pixel runner, never routed | `afw4f7` 1.4.3 only 5 non-computable backdrops reach the LLM |
| Deterministic | **Signal grounding** (`precomputeSignals` + `uncertainReason`) | — | 44→77% precision: judge from facts (`structure.tables`, contrast colour, role-gated name) not pixels-as-guess | `f99c8b` 1.3.1 valid `headers=` ⇒ cleared; `78c41b` 4.1.2 `role=menu` name-optional ⇒ cleared |
| Deterministic | **Direct runner/instrument catch** | 11 TPs caught with no LLM barrier — incl. **2 the LLM had cleared** | — | `afw4f7` contrast ×3 (`v3Barrier`); `6cfa84·9812d828`, `akn7bn·62673162` det caught what LLM cleared |
| **Rubric** | **Facet-scoped** atomic judgment (1 SC) | Forces the meaning comparison the baseline skims → 49 TPs over 12 SCs | — | `qt1vmo·485f10` 1.1.1 alt says "ERCIM logo", pixels are W3C; `c4a8a4·2c1397` 2.4.2 title contradicts content |
| Rubric | **Calibrated don't-flag defaults** | — | 220 GT-pass cleared (decorative-default, role-gated name, "don't manufacture a brand mismatch") | `m6b1q3·78c41b` 4.1.2 nameless `role=menu` cleared; `c487ae·d13a75` brand-wrapping link cleared |
| Rubric | **Relational / page-level** rubrics | Catch set/page barriers a single-element view can't see | Clear false set-barriers (same settled dest, shared category) | `fd3a94·ef75d4` "Contact Us"→chat-vs-phone **caught**; `fd3a94·91abed` "About us"→identical **cleared** |
| Rubric | **"absence ≠ pass" + PARTIAL** on ambiguity | — | Honest abstention (12-trace abstain band) over a confident wrong flag | `8dc58c48` 2.4.4 cross-origin links unfollowable ⇒ PARTIAL, not a guess |
| **Tools** | `query_ax_node` — **verify-before-flag** | Confirms a real name-role break too (`aria-prohibited`) | Resolves live role/name → clears would-be name/role FPs (41 calls) | `78c41b` 4.1.2 `role=menu` cleared; `1e3939d9` 2.1.1 in-iframe link cleared (signal said `keyboard:null`) |
| Tools | `capture_full_page` — **off-viewport probe** | Reveals below-fold geometry the static frame can't — **the static signal lied** (`offscreen:false`) | — | `81d501e5` 2.4.10 `box.y:-978, offDocument:true` ⇒ missing-heading caught (22 calls) |
| Tools | `resolve_destination` — **relational probe** | Follows same-named links → catches different-*purpose* barriers (20 calls) | Clears same-purpose (redirect→same settled page); judges purpose, not URL string | `ef75d424` chat vs phone **caught**; `e0d32d95` `redirect.html`→`index.html` **cleared** |
| Tools | pixel/OCR probes (`resolve_part_color`, `compute_contrast_ratio`, `ocr_image_text`, `request_hi_res_crop`) | OCR reads baked-in text → 1.4.5 | Measures actual rendered pixels over gradients/halos → no contrast guess | `ab4691ef` 1.4.3 8× pixel-sample across gradient ⇒ cleared; `48f02a3a` 1.4.5 OCR ⇒ icon not text |
| Tools | `observe_state_after_activation` / `set_state_and_capture` | Drives a fresh clone into focus / post-submit state → observes, not guesses | — | `eb4f387b` 2.4.7 focus-ring observed ⇒ cleared; `baa48e5f` 3.3.1 post-submit state observed |

---

# 1 · Deterministic layer — oracle, runners, instruments

The harness enumerated **446 in-scope obligations**, marked **22 auto-PARTIAL**, and filled **92** with a barrier
disposition. Of the 60 recall TPs, **49 are LLM-rubric barriers on routed obligations** and **11 are deterministic
catches with no LLM barrier**. Mechanism source: `applicability-oracle.js`, `llm-adjudicator.js`, `build-v3.js`.

### 1.1 Routing / enumeration → recall
`deriveObligations`/`familiesFor` enumerate a **per-SC, per-element atomic obligation** from raw collector facts,
*independent* of candidate generation (a forgotten branch still surfaces as an honest auto-PARTIAL), then
`selectRubricSubjects` routes each to exactly one atomic rubric with a focused question — instead of the baseline's
single "find all barriers" prompt. The 60 TPs span 12 SCs through 11 rubrics; 39 were single-obligation subjects.

| ruleId·SC | case | rubric | summary quote |
|---|---|---|---|
| 5effbb 2.4.4 | b2a671 | link-purpose | "link 'More' … the descriptive text in the sibling `<p id='desc'>` is **not an enclosing ancestor** of the link" |
| fd3a94 2.4.4 | ef75d4 | link-name-equivalence | "Both 'Contact Us' links share an identical name but resolve to genuinely different pages — live chat … phone support" |
| qt1vmo 1.1.1 | 485f10 | alt-text-adequacy | "renders the W3C logo but its alt text incorrectly identifies it as 'ERCIM logo'" |
| cc0f0a 2.4.6 | 9b9675 | heading-descriptive | "input field labelled 'Menu' … does not describe what the user should enter" |
| 047fe0 2.4.10 | 81d501 | section-headings | "the only heading (h1) is positioned off-document (y:-978, offDocument:true)" |

*A single SC, routed by facet:* the oracle mints one 2.4.4 obligation; the adjudicator fans it to **two rubrics** —
`link-purpose-v0` (generic-name-in-isolation) and `link-name-equivalence-v0` (the relational same-name set, fed the
peers + resolved destinations). The off-screen heading and the sibling-paragraph-isn't-context link are cases a
viewport-only "look at the page" prompt structurally cannot see; the enumerated obligation + threaded structure
makes them judgeable. This routing is the dominant source of the +36-point recall gain.

### 1.2 Subtraction → precision
`RUBRIC_GATE` + the disposition lane **remove any facet a deterministic runner owns** so the model can't re-derive
and mis-flag it. Canonical: `contrast-over-complex-backdrop-v0` fires **only when `contrastReliable !== true`** — a
computable flat-colour ratio is settled by the pixel runner and never reaches the model (**21 of 26** 1.4.3 cases).
The RCA: HTML's #1 FP source was the model reading `style="color:#888"` and re-judging contrast, so `stripStyle`
removes inline `style=` and `HTML_RUNNER_OWNED_SC = {1.4.3, 4.1.2, 2.1.2}` gates raw markup OFF for runner-owned SCs.
ARIA-attribute *validity* (4.1.2 `aria-prohibited-attr`) is filled as a PROVISIONAL barrier with **no rubric** — the
model is never asked to judge name-adequacy on a syntax violation (`kb1m8s·1345bf`/`7cddc9`/`c4a2fe`).

### 1.3 Applicability → precision
`familiesFor` only mints an obligation when the facts say the SC applies, so decorative / removed-from-tree /
wrong-role elements **never generate a subject to flag**. Image families gate on `removedFromA11yTree !== true`:
**165 inapplicable cases → 83 produced zero obligations** (oracle correctly silent), 77 enumerated-and-cleared, only
5 leaked as FP. It is *not* a blanket skip: `decorativeSuspect` keeps **substantial** unnamed removed-from-tree
images, and a `decorativeConflict` (author-named-but-hidden) still mints a 1.1.1 obligation — the e88epe TPs
`5d0c52f3`/`9ff50232`/`6d108d00`/`0d0061ff` were caught this way. So applicability suppresses spurious flags
*without* the recall loss a naive "skip all decorative" would cause — the single largest contributor to FP 45→11.

### 1.4 Grounding via signals → precision
`precomputeSignals` threads deterministic facts **+ an explicit "why uncertain" steer** into each rubric, so
verdicts are fact-anchored and the model is told when *absence ≠ pass*: the `accessibleName.uncertainReason` for a
name-requiring role says "an EMPTY name on a control whose role REQUIRES a name — that absence IS the barrier";
`enclosingContext.linkAloneInBlock` forbids reading a sibling paragraph the link doesn't own. Cleared correctly via
the threaded fact: `319a46` 1.4.3 (white text-shadow ⇒ 21:1 effective ratio), `380a79` 4.1.2 (different `src` but
identical content ⇒ equivalent), `f99c8b` 1.3.1 (valid `headers=` IDREF wiring), `78c41b` 4.1.2 (`role=menu` ⇒ name
optional). Same routed obligation as §1.1, but the model decides *on facts* — the precision counterpart of routing.

### 1.5 Direct deterministic catches → recall
**11 of 60 TPs** caught by a deterministic lane with no LLM barrier — 4 dynamic instruments (`v3Barrier`) + 7
checker/detector PROVISIONAL fills; in **2** the LLM had actively *cleared* the case: `6cfa84·9812d828`
(focusable-in-`aria-hidden`, rubric returned LIKELY_OK) and `akn7bn·62673162` (iframe-interactive, agent returned
NOT REPRODUCED). These are barriers a vision-LLM is worst at — a sub-threshold contrast it eyeballs as "fine", a
focus trap requiring keyboard-driving, an ARIA-prohibited syntax fact, a focusable node hidden in `aria-hidden`. The
instruments are near-zero-FP by design (the trap instrument is "settle-aware, adversarially hardened"); the one cost
this run is a single deterministic contrast FP (`dc170fd0`, a settle-moment `#ccc`-on-white read).

---

# 2 · LLM rubric layer — atomic, signal-fed per-SC judges

Every recall TP is `llmFlag=true` (the LLM lane, not the deterministic checkers, is what catches them); 49 are
driven by an atomic rubric `LIKELY_BARRIER`. The per-SC rubrics + signals are what convert the baseline's guess
(44.4% precision) into a calibrated judge (84.5%). Rubric files: `scripts/v3/llm-rubrics/*.md`.

### 2.1 Facet-scoped judgment → recall
Each rubric asks ONE SC's meaning question against the one signal that matters, so the model commits to a specific
failure mode the baseline's diffuse pass skims past — a *present-and-plausible* alt that names the wrong logo, a
label that is a real word but the wrong concept, a title that reads fine in isolation but contradicts the content.

| SC | case | rubric | guardrail exercised |
|---|---|---|---|
| 1.1.1 | qt1vmo·485f10 | alt-text-adequacy | "Incorrect/MISMATCHED — compare the name to the **PIXELS**" (alt "ERCIM logo" vs rendered W3C) |
| 2.4.6 | cc0f0a·9b9675 | heading-descriptive | "a label that names an unrelated UI object fails ON ITS FACE → REPRODUCED" ('Menu' on a text input) |
| 2.4.4 | 5effbb·437304 | link-purpose | "OPERATIONAL TEST" — 'EPUB' is a format-only name; sibling prose isn't enclosing |
| 2.4.2 | c4a8a4·2c1397 | page-title | "Topic CONTRADICTION" — title 'Apple harvesting season', page is about clementines |

### 2.2 Calibrated abstention / don't-flag defaults → precision
The rubrics encode the WCAG soundness rules that make "looks-off" cases *correct*. In this run the cleared GT-pass
cases produced **0 false `LIKELY_BARRIER`** — exactly where the one-shot baseline over-flags.

| SC | case | verdict | guardrail (the don't-flag default) |
|---|---|---|---|
| 4.1.2 | m6b1q3·78c41b | LIKELY_OK | role-gated name: "a CONTAINER role (`menu`) whose name is OPTIONAL per ARIA" |
| 1.1.1 | 23a2a8·32bfac | LIKELY_OK | "accurate and sufficient text alternative ('W3C logo')" — name-matches-pixels, not pixel-richness |
| 2.4.4·4.1.2 | c487ae·d13a75 | LIKELY_OK | "Do NOT manufacture a name-vs-DEPICTED-BRAND mismatch" (link named by destination, wraps a logo) |
| 2.4.2 | 2779a5·0ad882 | LIKELY_OK | "non-empty title that names something PASSES; don't escalate on descriptiveness" |

### 2.3 Relational / set rubrics → both
Three rubrics judge SETS or the PAGE, not single elements — a view a per-element baseline is structurally blind to.
They both **catch** relational barriers and **clear** the false ones a single-element look gets wrong:
- **catch:** `fd3a94·ef75d4` 2.4.4 (two 'Contact Us' → chat vs phone); `4b1c6c·c1cc2a` 4.1.2 (two iframes 'List of
  Contributors' → different pages); `047fe0·81d501` 2.4.10 (only h1 is off-document).
- **clear:** `fd3a94·91abed` 2.4.4 (two 'About us' → identical title/h1/content); `4b1c6c·0b43de` 4.1.2
  ('advertising' is a *category*, different ads ≠ misdirection); `047fe0·33fcbd` 2.4.10 (both sections have an h1).

They receive the whole set (`sameNameLinks`/`sameNameIframes`) and call a tool to compare *settled* destinations —
so they reproduce the genuine same-name-different-purpose barrier and clear the equivalent-destination cases.

### 2.4 Signal-grounded judgment → precision
The verdict prose visibly cites the threaded fact: `d0f69e·664972` 1.3.1 "lacks any **scope** … no **headers=**";
`047fe0·81d501` "off-document **(y:-978, offDocument:true)**"; `afw4f7·319a46` "**21:1** effective ratio … above
**4.5:1**"; `5effbb·b2a671` "sibling `<p id='desc'>` **is not an enclosing ancestor**"; `kb1m8s·17a785` "prohibited
ARIA attribute (aria-label) on `<div>` with **role=generic**". The model reasons *from* the fact instead of
hallucinating — the 44%→77%→84.5% precision lever is signals, not vision alone.

---

# 3 · Agentic tool layer — live CDP probes

70 of 466 rubric-judgments called ≥1 live probe. Over those 70 traces the contribution is **precision-led**:
**TP 9, TN 42, FP 6, FN 1, ABSTAIN 12** — tools mostly *clear would-be false positives* by overturning a misleading
static signal, with a focused recall layer on relational/off-viewport barriers and an honest abstain band. Tools:
`scripts/v3/lib/cdp-tools.js`.

### 3.1 Verify-before-flag → precision (`query_ax_node`, 41 calls)
The judge resolves the element's **live AX role + name provenance** before deciding, instead of reading a bare flag
off a static screenshot. `78c41b` (role `menu` ⇒ name optional, cleared), `655b73c1` (`div[role=button]` name 'OK',
cleared), `1e3939d9` (signal said `keyboard:null, confident:false`; tool descended `iframe>>a`, confirmed a native
focusable link, cleared). It still **confirms** real breaks: `17a785ed`/`358fa0b8` (`aria-label` on `role=generic` /
`aria-labelledby` to a non-existent id ⇒ REPRODUCED). The baseline, holding only the screenshot + the bare flag,
over-flags the absent name / prohibited-attr warning / indeterminate keyboard result this lane removes.

### 3.2 Off-viewport / dynamic probe → recall (`capture_full_page`, `observe_state_after_activation`, `set_state_and_capture`)
On `81d501e5` the **static signal lied** (`offscreen:false`); `capture_full_page` returned `box.y:-978,
offDocument:true, verticalPositionPct:-109`, proving the lone h1 is CSS-hoisted off the document — the model
overrode the signal and caught the missing-heading barrier the baseline would clear. `set_state_and_capture` drives
a fresh clone into focus (`eb4f387b` 2.4.7 — a visible blue outline *observed*, not guessed) and
`observe_state_after_activation` into post-submit state (`baa48e5f` 3.3.1 — no validation error produced).

### 3.3 Destination / relational probe → precise recall (`resolve_destination`, 20 calls, all 2.4.4)
Same-named links are followed to their **settled rendered destination** (finalUrl + title + h1 + visibleText), so
the judge decides *same purpose vs different purpose*, not *same URL string*. **Caught:** `ef75d424` ('Contact Us' →
`h1:"Chat With Us"` vs `h1:"Call Us"`, distinguishing `?page=1` vs `?page=2`). **Cleared:** `e0d32d95`
(`index.html` vs `redirect.html` that **settles to** `index.html`, all fields byte-equal). A no-tool baseline
comparing hrefs/text would do the **exact opposite on both** — false-clear chat/phone, false-flag the redirect. The
one tool-limit FP (`228c0a3d`) is a cross-origin *refusal* where the model fell back to origin strings; the
well-behaved sibling (`8dc58c48`) returned PARTIAL instead — the abstain band is the precision-safe default.

### 3.4 Pixel / content probes → precise judgment (`resolve_part_color`, `compute_contrast_ratio`, `ocr_image_text`, `request_hi_res_crop`)
Measures **actual rendered pixels** over gradients/halos and reads **text baked into images**, not a downscaled crop.
`ab4691ef` (8× glyph-vs-background pixel samples across a gradient ⇒ text readable end-to-end, cleared — a
measurement a static baseline cannot make), `319a4651` (flat pair 1:1 black-on-black **but** a white text-shadow halo
⇒ `effectiveTextRatio:21`, cleared), `48f02a3a` (OCR's spurious low-conf "C" disambiguated by a 4× crop ⇒ a plain
file icon, not images-of-text). *Honesty:* `fc92e273`'s pixel probe is perceptually *correct* (genuine white-on-white)
but counts as a case-level FP because ACT scopes that "hidden text" testcase `inapplicable` — the tool out-measured
the GT's applicability boundary rather than erring.

---

# Synthesis — one principle, three layers

Every contribution above is the same move, **route by facet**: let a deterministic producer own each facet it can
settle, and hand the LLM only the residual *meaning* question, pre-loaded with the deterministic facts and a tool to
probe what the static frame can't show. The split of labour is consistent across the run:

- **Recall** comes from *routing + reach*: the oracle turns an open-ended page sweep into ~one bounded question per
  real obligation (49/60 TPs), the rubrics force the meaning comparison the baseline skims, tools reach off-viewport
  / relational / dynamic state the static frame hides, and the deterministic instruments catch the 11 behavioural /
  syntactic barriers a vision-LLM is worst at (2 of which the LLM had cleared). **54.5% → 90.9%.**
- **Precision** comes from *subtraction + grounding + verification*: applicability keeps 83 inapplicable cases off
  the worklist, subtraction withholds runner-owned facets (21/26 contrast), signals anchor the verdict in measured
  facts, and tools overturn misleading static signals (42 TN clears). The model is never *handed the question* on a
  facet it would guess wrong. **44.4% → 84.5% precision, 11.5% → 2.8% FP.**

**Residual FPs (11)** are not hallucinations: ~6 are the debatable-GT 2.4.4 same-name-different-destination set
(`fd3a94`, `5effbb`), 3 are nameless `role=image` SVGs ACT scopes `inapplicable` (`cd3b3a4`/`1f2223`/`ec2a7a4`), and
1 is a deterministic settle-moment contrast read (`dc170fd0`) — each a borderline call on a hard facet, which is the
expected failure shape once diffuse guessing is removed.

> **Cross-family note.** The same three-layer harness with **Gemini 3.5-flash** as the judge (all fixes + override
> live, `results/fn-llm-gemini-v2`, 2026-06-29) reaches **91.2% recall / 79.5% precision / 0.849 F1** (un-modified
> 90.9 / 76.9 / 0.834) — recall *generalises across model families*, precision is the model-dependent cost. So the
> recall contribution of routing/grounding/tools is **not** Claude-specific; a second model family, given the same
> routed evidence and probes, recovers the same barriers.
