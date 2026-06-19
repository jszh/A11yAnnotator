# Run4 FN×LLM Eval — Root-Cause Analysis of All False Positives & False Negatives

_Generated 2026-06-19. Source run: `results/fn-llm-run4-pages16_2026-06-19` (current harness, 16 pages, sonnet-4-6 medium, vision+tools on). Recall 35/66=53%, FP 43/392=11%._

## Method & caveats

- **Scope:** every FALSE NEGATIVE (GT=failed, LLM did not flag) and FALSE POSITIVE (GT=passed/inapplicable, LLM flagged) on the case GT-scored SC: **31 FN + 43 FP = 74 cases**.
- **Procedure:** one analysis agent per case (74), each reading a self-contained slice — the case GT, the LLM in-scope verdicts + summaries, the full model reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT), and the inlined fixture HTML — and judging the fixture itself against the ACT rule before attributing a root cause. Then FN/FP cluster synthesis → a prioritized merge.
- **Coverage verified:** 74/74 unique, 0 kind-mismatch, 0 missing (an earlier pass under-covered at 45/74 due to a shared-array index-selection bug; rebuilt with one file per agent).
- **IMPORTANT confound (do not read run3→run4 as a page-count effect):** run3 ran on an OLDER harness (commit f260ac9; maxAuto=16; no CDP-authoritative axName pass). run4 ran on the current tree, 6 commits / 950 line-changes later. The metric deltas between them are harness evolution, not `pages=8→16`. This RCA analyzes run4 on its own terms.

## Tally

**By rootCause:** FP/rubric_too_strict=15, FN/rubric_too_lenient=11, FP/wrong_subject_targeted=7, FN/obligation_not_enumerated=6, FP/deterministic_facet_unowned=5, FN/deterministic_facet_unowned=5, FP/applicability_over_enumerated=4, FP/evidence_gap_missing_signal=4, FN/evidence_gap_missing_signal=4, FP/off_target_real_issue=3, FN/wrong_subject_targeted=2, FP/model_misread_evidence=2, FN/no_usable_verdict=2, FP/gt_scope_or_granularity_mismatch=1, FP/model_hallucinated_barrier=1, FP/tool_failed_cross_origin=1, FN/tool_failed_cross_origin=1

**By fixLane:** rubric=31, applicability-oracle=20, collector=9, deterministic-runner=7, cdp-tool=6, scoring-or-gt=1

---

# Executive synthesis

# Run4 LLM Eval — Executive Synthesis of 74 FP+FN Root Causes

Scope: run4 (current harness, 16 pages, sonnet-4-6, vision+tools on). Recall 53%, FP 11%. 31 false negatives + 43 false positives = 74 cases. Counts below are de-duplicated against the cluster overlaps noted in the source analyses; where a case is dual-tagged it is credited once to its primary lane.

## Headline — systemic root causes ranked by recoverable cases

| # | Systemic root cause | fixLane | FN recovered | FP recovered | Total |
|---|---|---|---|---|---|
| 1 | **Name/descriptiveness rubrics over- and under-firing on present-but-"generic" names.** One family of rubrics (`accessible-name-adequacy-v0`, `page-title-v0`, `link-purpose-v0`, `heading-descriptive-v0` misapplied to labels) conflates *presence/legality* (what the SC actually tests) with *subjective descriptiveness*. Over-strict on the FP side (clears 4.1.2/1.1.1/2.4.2 presence then fails on genericness), too lenient on the FN side (link-purpose and form-label leniency let real defects through). | rubric | 11 (Clusters A,B,C + 1 one-off) | 23 (Clusters A,B,F,G + page-title) | **34** |
| 2 | **Applicability oracle mis-routes or over-enumerates obligations** — relational/deterministic ARIA rules (4b1c6c iframe-equivalence, 5c01ea ARIA-permitted, m6b1q3 menu, kb1m8s prohibited-attr) routed to name-adequacy or enumerated per-element instead of set-level; 1.1.1 enumerated on bare decorative SVG/canvas. | applicability-oracle | 6 (Clusters D,H) | 12 (Clusters C,D,E-oracle,F) | **18** |
| 3 | **Deterministic facets exist but are never promoted to the scored verdict** — live keyboard-trap (`v3Barrier:true` not promoted; mutual-bounce undetected), contrast (`computable:false` on hard splits), aria-prohibited-attr, focusable-in-aria-hidden subtree. | deterministic-runner | 7 (Clusters E,G + 2 one-offs) | 1 | **8** |
| 4 | **Collector strips the distinguishing signal** — query strings normalized away, `background-image` text carriers dropped, `headers=`/`colspan` not captured, SVG/JS-nav nodes unreachable. | collector | 5 (Cluster F) | 5 (table-collector + link-context) | **10** |
| 5 | **Wrong subject / off-target anchoring** — the lone obligation aimed at the wrong element (inner link vs IFRAME, outer roleless `<svg>` vs role-bearing child). | applicability-oracle / collector | 2 (Cluster H) | partially folded into #2/#4 | **2** |

Causes #1 and #2 together account for ~52 of 74 cases (70%). The single highest-leverage lane is the **rubric** family (#1): one coordinated rewrite of the name/title/link/label rubrics moves the most cases in both directions.

## Fixable now

1. **Hard-gate `accessible-name-adequacy-v0` to presence/empty/placeholder/label-mismatch only.** Remove the "restates control type / generic name = failure" path; route purpose-quality to 2.4.6/2.4.9.
   - fixLane: rubric — `accessible-name-adequacy-v0.md`
   - Recovers: **FP ~9** (096bf1e8, 3004e7b1, 37cce377, c43c9679, 424027651170, b67ab98, f91d77e9, ede992d9, d5503ef9).
   - Risk: **Low.** Aligns rubric to what 4.1.2/1.1.1 actually require (non-empty resolved name). Slight FN risk if a future case needs descriptiveness — but that belongs to 2.4.x, which this fix explicitly re-routes.

2. **Constrain `page-title-v0` under rule 2779a5 to non-emptiness; route descriptiveness to c4a8a4.**
   - fixLane: rubric — `page-title-v0.md`
   - Recovers: **FP 4** (6b3d2e21, efa1e043, 7f9f3150, 0ad882df).
   - Risk: **Low.** 2779a5 is a presence-only ACT rule; this is a scope correction.

3. **Tighten `link-purpose-v0` (both directions).** (a) Identical-names mode requires an explicit equivalent-purpose judgment (same topic/resource = pass; drop the "different site ⇒ fail" exemplar and the `distinctRawHrefs=1` short-circuit); (b) format/action-only names ("HTML/EPUB", "Download", "Chat" vs "Phone") must carry their SUBJECT in the link's OWN programmatic context, not sibling headings; (c) exclude out-of-tree/different-context peers from `sameNameLinks`.
   - fixLane: rubric — `link-purpose-v0.md` + `llm-adjudicator.js` (precomputeSignals ~339, linksByName ~631-645)
   - Recovers: **FN ~5** (98f0638a, 43730455, 45d884e1, 9ceacbea, f92350be) + **FP ~4** (228c0a3d, 9abd9bcf, 58087cbe, 771c36b9).
   - Risk: **Medium.** This rubric is bidirectionally wrong, so the rewrite must be regression-tested against both FP and FN fixtures; over-correction in one direction re-breaks the other.

4. **Add a form-field-label calibration (or dedicated rubric) for 2.4.6; stop routing labels to `heading-descriptive-v0`.** A label naming only a topic/object ("Menu"/"Info") that doesn't describe expected input fails; duplicate labels disambiguated only by offscreen/non-programmatic context fail.
   - fixLane: rubric + applicability-oracle
   - Recovers: **FN 3** (9b967559, 649946098, 1e520607) + **FN 1** wrong-route (2f1d964151ff, Cluster H).
   - Risk: **Low–Medium.** Need to avoid flagging legitimately terse unique labels.

5. **Amend `section-headings-v0` (2.4.10)** to require an a11y-tree-exposed real heading; aria-hidden h1 / visual-only `<strong>` titles FAIL rather than defer to 1.3.1.
   - fixLane: rubric — `section-headings-v0.md`
   - Recovers: **FN 2** (929079705b17, 7505d097). Note: the related FP **4f112d2** (model overrode the existing carve-out) is only *partially* fixable — see Irreducible.
   - Risk: **Medium.** The carve-out interacts with 1.3.1; tightening risks new FPs on legitimately single-block content (the 4f112d2 direction).

6. **Gate the 4b1c6c iframe obligation on ≥2 in-tree iframes sharing an identical case-normalized name; emit a SET-level equivalent-purpose rubric (identical src ⇒ auto-pass) instead of per-iframe name-adequacy.**
   - fixLane: applicability-oracle — `accessibility-oracle.js:137-143`
   - Recovers: **FP ~8** (08c5575, 40e3400d, 96600720, 3482a8bf, 380a7998, f8d3c1af, 5aae37dd, bca9ffac).
   - Risk: **Low.** Pure applicability scoping; matches the relational nature of rule 4b1c6c.

7. **Let the deterministic ARIA checkers own legality rules; emit no LLM obligation when permitted.** 5c01ea (ARIA-property-permitted) and m6b1q3 (scope to `role=menuitem`); suppress name obligations on container/structural roles and aria-hidden/`tabindex=-1` subtrees; hard-gate container-name flags on same-role-sibling count >1.
   - fixLane: applicability-oracle (+ small rubric guard)
   - Recovers: **FP ~5 net** (5c01ea: 556a7ba5, d5503ef9, f91d77e9 net-new ~3; menu/container F: 895a5b0d, 78c41b84, 8c835039, 85a2d2ea — overlaps Cluster A on 424/b67).
   - Risk: **Low.** Deterministic checker already produces the legal/illegal fact.

8. **Surface axe's `aria-prohibited-attr` as a deterministic owned 4.1.2 barrier; route its `incomplete`/broken-reference residue to the rubric instead of auto-PARTIAL.**
   - fixLane: deterministic-runner / applicability-oracle — `axe-surface.js:125`, `applicability-oracle.js:139-142`
   - Recovers: **FN 4** (1345bf06, 7cddc927, c4a2fe12, 358fa0b8).
   - Risk: **Low.** axe already computes this fact; it is currently dropped.

9. **Gate bare `<svg>`/`<canvas>` → 1.1.1 on explicit img role or accessible name; anchor 7d6734 on the role-bearing descendant; fix SVG AccName/xpath resolution (child `<title>`, `nsXPath()`, no coordinate fallback).**
   - fixLane: applicability-oracle + collector + cdp-tool — `act-page-collect.js:245`, `applicability-oracle.js:180`
   - Recovers: **FP ~7** (25e5364c, e15b9aca, cd3b3a40 — oracle; 8ad324, cc172d, f2af67, 9f5f37 — anchoring/CDP).
   - Risk: **Medium.** SVG accessible-name resolution is fiddly; split the oracle-gate (safe) from the CDP xpath fix (needs vision cross-check per CLAUDE.md).

10. **Promote existing `v3Barrier:true` keyboard-trap findings to the authoritative scored verdict; extend `kbd-graph.js` with a live-JS Tab/Shift+Tab/Esc probe emitting BARRIER_OBSERVED for mutual-bounce / fixed-set confinement.**
    - fixLane: deterministic-runner — `kbd-graph.js:211-213`
    - Recovers: **FN 4–5** (0ec0e93e, f5ea9fd3 from promotion now; 62fd24e7, 8fba3918, 7dcc4ae0 from the live probe).
    - Risk: **Medium.** The promotion half is safe and immediate (2 cases); the live mutual-bounce probe is rated `partial` by the analyses (risk of re-flagging legitimate bounce navigation) and needs the deterministic-probe + vision protocol before shipping.

11. **Make the contrast runner own hard-split/abutting-band backgrounds (sample text-overlapped pixels per flat region, worst region) and promote any `v3Barrier:true` contrast finding to the scored 1.4.3 verdict; anchor sampling to the rightmost actual glyph pixel.**
    - fixLane: deterministic-runner / rubric — `contrast-over-complex-backdrop-v0`
    - Recovers: **FN 2** (41afaa93 promotion, bf47c685 hard-split) + **FP 1** (ab4691ef — stop sampling inter-glyph backdrop past glyph end).
    - Risk: **Medium.** Glyph-pixel anchoring is the exact knob that caused both the FN (under-sampling) and FP (over-sampling) — must be cross-checked with screenshots.

12. **Preserve the discriminating signal in capture/collector.** Keep href query strings (`?page=1` vs `?page=2`), `background-image` text carriers, and per-cell `headers=`/`colspan`/`rowspan`; fingerprint `onclick=location` JS-nav targets.
    - fixLane: collector — `act-page-collect.js`, capture/mirroring
    - Recovers: **FN ~4** (ef75d424, bf023941, dddcd76a, 7ebe961d) + **FP 2** (ba50190 + the second table case via `headers=` capture).
    - Risk: **Low** for table/query-string capture; **n/a-by-recapture** for the one byte-identical artifact (see Irreducible).

13. **Wrong-subject anchoring fixes:** build the akn7bn (2.1.1 iframe `tabindex=-1`) obligation against the IFRAME, surfacing its tabindex.
    - fixLane: applicability-oracle / collector
    - Recovers: **FN 1** (62673162) + the SVG-anchoring portion already counted in #9.
    - Risk: **Low.**

14. **One-offs.** Focusable anchor inside `aria-hidden="true"` subtree → 4.1.2 barrier (FN 9812d828); `error-identification-v0` scores REPRODUCED when a static error names only a field TYPE shared by multiple fields (FN d7863608); suppress contrast obligations on `aria-disabled="true"` controls (FP 6b811d06).
    - fixLane: deterministic-runner + rubric + applicability-oracle
    - Recovers: **FN 2 + FP 1**.
    - Risk: **Low.**

**Recoverable subtotal: FN ~29 of 31, FP ~40 of 43.**

## Irreducible / not-harness-fixable

| Case | Kind | Why irreducible | Truly unfixable? |
|---|---|---|---|
| `0b01e772dff4` | FN, no-gt-artifact | Saved fixture is **byte-identical** — the sole distinguishing signal (`?page=1`/`?page=2` query string) was stripped at capture time. No harness-logic change recovers it; only re-capturing the fixture does. | **Yes** — hard artifact under the frozen corpus. |
| `8e6c190e0d2b` | FP, tool_failed_cross_origin | `resolve_destination` refused cross-origin and returned only `finalUrlEqual:false`; the equivalent-purpose pages (shared h1 "Contact us", same phone) are unreachable for byte comparison. | **No, but instrument-level** — needs a CDP upgrade to fetch/byte-compare `file://` bodies, not a prompt/rubric fix. |
| `4f112d270766` | FP, scoring-or-gt | The 2.4.10 section-headings carve-out already exists; the model **overrode its own rubric** ("a chapter should arguably have a page-level heading"). | **Partial** — only a hard deterministic gate removes it, and residual model-override risk remains. |
| `1379913f0770` | FN, tool_failed_cross_origin | `resolve_destination` refused relative local `../_assets/` paths as cross-origin. The model reasoned correctly; the limit was the same-origin resolver. | **No, fixable** — relax the resolver to follow same-origin local paths (counted as recoverable above is optional; honest abstention today). |

**Achievable ceiling under the frozen corpus + current instruments:**
- **Recall:** 29 of 31 FNs recoverable → recall rises from 53% toward the high-90s on this set; the **1 hard floor is `0b01e772dff4`** (byte-identical fixture). `1379913f0770` is recoverable only with a resolver relaxation.
- **FP:** 40 of 43 recoverable → ~1 durable tool-instrument limit (`8e6c190e0d2b`) + 1 partial scoring gate (`4f112d2`). **No GT-error cases**: every "GT=passed/inapplicable" judgment in the FP set is correct ACT scoping — the misses are all harness-side, which means the FP ceiling is genuinely bounded by harness fixes, not by ground-truth noise.

So the honest floor is **~1 irreducible FN** (artifact) and **~1–2 irreducible FP** (cross-origin instrument + partial scoring gate). Everything else is a named lane fix.

## Cross-origin tool note

`resolve_destination` cross-origin refusal touches **exactly 3 cases**, all on the offline ACT corpus:

| Case | SC | Direction | Nature | Fixable offline? |
|---|---|---|---|---|
| `1379913f0770` | 2.4.4 (fd3a94) | FN | Resolver refused a **relative same-origin** local path (`../_assets/`) as cross-origin. | **Yes** — this is a resolver bug: `file://` same-origin local paths should resolve. Pure tool fix, no network. |
| `8e6c190e0d2b` | 2.4.4 (fd3a94 / 5effbb) | FP | Resolver refused to byte-compare two `file://` page bodies; returned only `finalUrlEqual:false` for equivalent-purpose pages. | **Yes but instrument-level** — teach the CDP tool to fetch and byte/DOM-compare local `file://` bodies. No network needed (corpus is mirrored locally), so it is achievable offline, just a larger tool upgrade than a prompt change. |
| `0b01e772dff4` | 2.4.4 (fd3a94) | FN | Not a resolver refusal per se — the **query string was stripped at capture**, so both hrefs resolve identically. | **No** — re-capture only. |

Quantified: **2 of the 31 FNs** are 2.4.4 cross-origin/resolver-adjacent (`1379913f0770` resolver refusal, `0b01e772dff4` capture artifact), and **1 of the 43 FPs** (`8e6c190e0d2b`). Of these, **2 are fixable entirely within the offline corpus** by relaxing/upgrading `resolve_destination` to handle same-origin `file://` paths and local body comparison; **1 (`0b01e772dff4`) is not** — it requires re-capturing the fixture because the discriminating signal no longer exists in the saved bytes. None require live network access, so the offline ACT corpus is not itself the blocker — the same-origin resolver policy is.

---

# False-negative synthesis (recall misses)

# Run4 LLM False-Negative Root-Cause Analysis (31 cases)

## 1. Distribution

### By rootCause
| rootCause | Count |
|---|---|
| rubric_too_lenient | 11 |
| obligation_not_enumerated | 7 |
| deterministic_facet_unowned | 5 |
| evidence_gap_missing_signal | 4 |
| wrong_subject_targeted | 2 |
| no_usable_verdict | 2 |
| tool_failed_cross_origin | 1 |
| **Total** | **31** |

### By fixLane
| fixLane | Count |
|---|---|
| rubric | 11 |
| applicability-oracle | 6 |
| deterministic-runner | 6 |
| collector | 4 |
| cdp-tool | 4 |
| **Total** | **31** |

## 2. Major clusters

### Cluster A — Lenient link-purpose rubric clears generic/in-context links (rubric)
**Mechanism:** `link-purpose-v0` accepts any non-generic name and lets adjacent/sibling context "rescue" the link, instead of requiring purpose from name + the link's OWN programmatic context. Models repeatedly saw the gap ("of something", format-only "HTML/EPUB", "Download"+broad colspan header, "via chat" vs "by phone") yet cleared it; the `distinctRawHrefs=1` carve-out short-circuits the context cues GT scores on.
**Spans:** SC 2.4.4, rules 5effbb + fd3a94 — cases `98f0638a038a`, `43730455b694`, `45d884e81c4e`, `9ceacbea5df4`, `f92350be3a29` (5 cases).
**One fix:** Tighten `link-purpose-v0` so (a) format/action-only names need their SUBJECT in programmatic context (not sibling headings/paragraphs), and (b) `distinctRawHrefs=1` is conditional — flag when surrounding-region labels/icons (Chat vs Phone) imply distinct purposes. **Recovers ~5.**

### Cluster B — Lenient form-field-label rubric (heading rubric misapplied to labels) (rubric)
**Mechanism:** The oracle routes form labels to the heading-tuned `heading-descriptive-v0`, whose calibration blesses "terse-but-unique" topic words and flags only "clearly generic" (Field/Input). Models flagged the real defect ("'Menu' is too vague", duplicate "Name:" across fieldsets) then deferred to rubric leniency. Spans the canonical cc0f0a "Menu" failures and duplicate-label disambiguation.
**Spans:** SC 2.4.6, rule cc0f0a — cases `9b967559ff26`, `649946098faf`, `1e52060759a5` (3 cases).
**One fix:** Add a form-field-label calibration (or dedicated rubric): a label naming only a topic/object ("Menu"/"Info") that doesn't describe expected input is non-descriptive, and duplicate labels disambiguated only by non-programmatic/offscreen context fail. **Recovers ~3.**

### Cluster C — 2.4.10 heading rubric treats aria-hidden / visual-only headings as adequate (rubric)
**Mechanism:** `section-headings-v0` frames 2.4.10 as visual organization "for sighted users," so an aria-hidden h1 (removed from a11y tree) or a styled `<strong>` title counts as "introducing" content; the model saw `ariaHidden:true` / empty `structure.headings[]` and was told to defer to 1.3.1.
**Spans:** SC 2.4.10, rule 047fe0 — cases `929079705b17`, `7505d097f7d5` (2 cases).
**One fix:** Amend `section-headings-v0` to require an a11y-tree-exposed real heading element over non-repeated content; aria-hidden or visual-only `<strong>` titles are a FAIL, not a 1.3.1 defer. **Recovers ~2.**

### Cluster D — ARIA-prohibited-attribute (kb1m8s) never owned (applicability-oracle + cdp-tool)
**Mechanism:** A deterministic ARIA-validity fact (global property on a role that prohibits it). In four cases the oracle never enumerated any obligation (`aria-braillelabel` on `<p>`, `aria-roledescription` on generic div, `aria-brailleroledescription` on role=none, `aria-labelledby` on `<p>`); in the fifth the oracle deliberately withholds the LLM obligation by design (applicability-oracle.js:139-142) and the axe lane returned only a non-authoritative `incomplete` residue (axe-surface.js:125, broken-reference ambiguity), yielding a silent auto-PARTIAL.
**Spans:** SC 4.1.2, rule kb1m8s — cases `1345bf067f66`, `7cddc927da51`, `c4a2fe12d5a4`, `358fa0b821c3` (4) — plus `358fa0b821c3` is the axe-residue variant.
**One fix:** Surface axe's `aria-prohibited-attr` as a deterministic owned 4.1.2 barrier, and route its `incomplete`/broken-reference residue to the rubric rather than auto-PARTIAL. **Recovers ~4** (1345bf067f66, 7cddc927da51, c4a2fe12d5a4, 358fa0b821c3).

### Cluster E — Live keyboard-trap (onblur self-refocus / mutual-bounce) not owned by scored lane (deterministic-runner)
**Mechanism:** Two failure modes. (i) The trap WAS detected (`v3Barrier:true`) but never promoted to a scored verdict — empty LLM trace → noVerdict reads as a miss (`0ec0e93e7f8f`, `f5ea9fd3b681`). (ii) The detectors structurally decline the btn1↔btn2 mutual-bounce class (kbd-graph.js:211-213 calls it "indistinguishable from PASSED bounce examples"; detectFocusRetentionTraps needs return-to-SAME-element; detectKeyboardTraps only probes dialog/menu regions), so `v3Barrier:false` and the static LLM (0 tool calls) can't observe the runtime handler (`62fd24e73ea5`, `8fba3918b361`). Plus enumeration gaps (`7dcc4ae00712`).
**Spans:** SC 2.1.2, rule 80af7b — cases `0ec0e93e7f8f`, `f5ea9fd3b681`, `62fd24e73ea5`, `8fba3918b361`, `7dcc4ae00712` (5 cases).
**One fix:** (a) Promote existing `v3Barrier:true` trap findings to the authoritative scored verdict; (b) extend kbd-graph.js with a live-JS Tab/Shift+Tab/Esc probe that emits BARRIER_OBSERVED when focus stays confined to a fixed focusable set with no documented standard escape. **Recovers ~4–5** (2 immediately from promotion; 2–3 from the live mutual-bounce probe, which the analyses rate as `partial`).

### Cluster F — Collector strips the distinguishing signal (query strings / background-image / JS-nav) (collector + cdp-tool)
**Mechanism:** The discriminating signal never reaches the model. Capture normalizes `?page=1/?page=2` query strings to bare `contact-us.html`, corrupting `distinctRawHrefs` to 1 (`ef75d4242414`, `0b01e772dff4`); the CSS `background-image` text carrier has no `<img>` so no 1.4.5 obligation (`bf023941401d`); onclick=location JS-nav and SVG-namespaced `<a>` nodes aren't reachable, so identical ERR_FILE_NOT_FOUND / raw-href equality mislead (`dddcd76a61f6`, `7ebe961dbb4f`).
**Spans:** SC 2.4.4 (fd3a94) + SC 1.4.5 (0va7u6) — cases `ef75d4242414`, `0b01e772dff4`, `bf023941401d`, `dddcd76a61f6`, `7ebe961dbb4f` (5 cases).
**One fix (capture side):** Preserve href query strings and `background-image` carriers during fixture capture/mirroring; **one fix (tool side):** fingerprint onclick=location targets and route all xpaths through `nsXPath()` for SVG `<a>`. **Recovers ~4** of 5 (`0b01e772dff4` is flagged `no-gt-artifact` — see §3).

### Cluster G — Contrast runner returns computable:false on owned facets (deterministic-runner)
**Mechanism:** Genuine measured-contrast failures the runner could compute but didn't promote. One had `v3Barrier:true` but no 1.4.3 obligation was enumerated (`41afaa9b3328`); the other is a hard two-color split (coincident stops, "world" at 2.3:1 on black) where the runner declared `computable:false` and the readability rubric cleared it (`bf47c65f2854`).
**Spans:** SC 1.4.3, rule afw4f7 — cases `41afaa9b3328`, `bf47c65f2854` (2 cases).
**One fix:** Make the contrast runner own hard-split/abutting-band backgrounds (sample text-overlapped pixels per flat region, take worst region) and promote any `v3Barrier:true` contrast finding to the scored 1.4.3 verdict. **Recovers ~2.**

### Cluster H — Wrong subject targeted (single in-scope obligation aimed off-barrier) (collector / applicability-oracle)
**Mechanism:** The lone enumerated obligation pointed the LLM at the wrong element/rubric. Iframe `tabindex="-1"` exclusion was aimed at the inner link instead of the IFRAME (`62673162e22e`); a 2.4.6 form-field was routed to `heading-descriptive-v0` and returned N/A "no headings on this page" (`2f1d964151ff`).
**Spans:** SC 2.1.1 (akn7bn) + SC 2.4.6 (cc0f0a) — cases `62673162e22e`, `2f1d964151ff` (2 cases).
**One fix:** Make subject/route selection barrier-correct — build the akn7bn obligation against the IFRAME (surface its tabindex), and route 2.4.6 form-field subjects to a label-descriptive rubric. **Recovers ~2.**

## 3. Fixable vs irreducible

**Harness-fixable: 29 of 31.** Clusters A–H above account for 26; plus 3 one-offs (§4) that are tractable (`9812d828fef2`, `d7863608ff2a`, `1379913f0770`).

**Not harness-fixable / artifact: 2 of 31.**
- `0b01e772dff4` — explicitly `fixable: no-gt-artifact`. The saved fixture is byte-identical (query strings stripped); the SOLE distinguishing signal is gone. Recoverable only by re-capturing the fixture, not by changing harness logic. (Its sibling `ef75d4242414` shares the same root but is rated `fixable: yes` because re-capture is the prescribed collector fix; counting conservatively, the irreducible artifact is `0b01e772dff4`.)
- `1379913f0770` — `tool_failed_cross_origin`. Honest abstention: `resolve_destination` refused relative local `../_assets/` paths as cross-origin. Rated `fixable: yes` (make the resolver follow same-origin local paths), so it is a tool fix, not truly irreducible — but it is the one case where the model reasoned correctly and the limitation was a real tool/cross-origin boundary.

Net: exactly **1 hard artifact** (`0b01e772dff4`) that no harness-logic change recovers; **1 cross-origin tool-limit** (`1379913f0770`) that is fixable only by relaxing the same-origin resolver. The remaining **29 are harness-fixable** via the named lanes.

## 4. Notable one-offs

- **`9812d828fef2` (4.1.2 / 6cfa84) — deterministic_facet_unowned, deterministic-runner.** A focusable `<a id="sentinelAfter">` inside `<div aria-hidden="true">`; the only obligation aimed at the modal Close button's accessible name. Fix: add a runner check flagging any focusable (href anchor / control without `tabindex="-1"`) inside an `aria-hidden="true"` subtree as a 4.1.2 barrier. Recovers 1.
- **`d7863608ff2a` (3.3.1 / 36b590) — rubric_too_lenient.** Static error span naming only ambiguous field TYPES ("Please fill Name" with two Name fields) scored LIKELY_OK/UNCERTAIN despite the model spotting the ambiguity. Fix: `error-identification-v0` should score REPRODUCED when an error names only a field type shared by multiple fields and/or is an unconditionally-present static span. Recovers 1.
- **`1379913f0770` (2.4.4 / fd3a94) — tool_failed_cross_origin.** See §3; the lone genuine cross-origin tool boundary.

---

# False-positive synthesis (specificity misses)

## Run4 LLM Specificity-Miss (FP) Root-Cause Analysis — 43 Cases

### 1. Distribution

**By rootCause:**

| rootCause | count |
|---|---|
| rubric_too_strict | 17 |
| wrong_subject_targeted | 7 |
| applicability_over_enumerated | 5 |
| deterministic_facet_unowned | 4 |
| evidence_gap_missing_signal | 4 |
| off_target_real_issue | 3 |
| model_misread_evidence | 2 |
| gt_scope_or_granularity_mismatch | 1 |
| model_hallucinated_barrier | 1 |
| tool_failed_cross_origin | 1 |
| model_misread (8c835039) | (1, counted under model_misread_evidence) |
| **total** | **43** |

(Note: `8c835039e68f` is labeled `model_misread_evidence` in JSON → grouped with that bucket; `model_misread_evidence` count above = 2 includes `4f112d270766` and `8c835039`. `model_misread_evidence`-tagged-as-`model_misread_evidence` reconciled below.)

**By fixLane:**

| fixLane | count |
|---|---|
| rubric | 20 |
| applicability-oracle | 12 |
| collector | 5 |
| cdp-tool | 2 |
| deterministic-runner | 1 |
| scoring-or-gt | 1 |
| (cdp-tool/tool subtotal incl. tool_failed) | 2 |
| **total** | **43** |

---

### 2. Major Clusters

#### Cluster A — Name-adequacy/descriptiveness rubric over-firing on present, valid names (the dominant defect)
**Mechanism (cited):** `accessible-name-adequacy-v0` converts a *present, resolved* accessible name into a barrier on subjective "genericness." The model repeatedly reads correct evidence — e.g. `accessibleName.value='My button' (present:true, resolved:true)` (3004e7b1, 37cce377), "the accessible name matches the label correctly" (424027651170) — then fails it because "the rubric says a generic name... is a failure." 4.1.2/1.1.1 require only a non-empty resolved name, not descriptiveness.
**Spans:** SC 4.1.2 & 1.1.1; rules 97a4e1, 5c01ea, 4e8ab6, 59796f, 307n5z, 096bf1e8's link.
**Cases (9):** 096bf1e8eeb0, 3004e7b1a47b, 37cce377c874, c43c9679072e, 424027651170, b67ab9861299, f91d77e96c06 (also dual-tagged), ede992d9573d, d5503ef9eb5b.
**Fix (rubric):** Hard-gate `accessible-name-adequacy-v0` to LIKELY_BARRIER only on absent/empty/placeholder/visible-label-mismatch names; remove the "restates control type / generic" failure path; route purpose-quality to 2.4.6/2.4.9. **Recovers ~9.**

#### Cluster B — Page-title descriptiveness flagged under presence-only rule 2779a5
**Mechanism (cited):** `page-title-v0` judges *descriptiveness* though rule 2779a5 tests only non-emptiness; model has correct evidence (`pageTitle.value='Title of the page.'`, non-empty) but flags "boilerplate placeholder."
**Spans:** SC 2.4.2; rule 2779a5.
**Cases (5):** 6b3d2e2147cf, efa1e0438bb5, 7f9f315b5041, 0ad882dffaf6, 0ad882… ; plus efa1e0 tagged gt_scope. (5 total: 6b3d2e2147cf, efa1e0438bb5, 7f9f315b5041, 0ad882dffaf6 + the 5th is efa1e0/0ad — distinct IDs: 6b3d2e, efa1e0, 7f9f31, 0ad882 = **4 distinct** title cases.)
**Fix (rubric):** Constrain `page-title-v0` under 2779a5 to presence/non-emptiness; route descriptiveness to c4a8a4. **Recovers 4.**

#### Cluster C — Iframe name-adequacy routed at the wrong question (4b1c6c)
**Mechanism (cited):** `accessibility-oracle.js:137-143/143` emits a per-iframe `name-role-value` obligation for *every named iframe* and routes it to `accessible-name-adequacy-v0`, which asks "does the name describe the content." Rule 4b1c6c is *relational* (same-named iframes → equivalent purpose) and often inapplicable (single iframe / distinct names). Identical-src pairs are trivially passing yet flagged.
**Spans:** SC 4.1.2; rule 4b1c6c.
**Cases (8):** 08c5575023e8, 40e3400d782b, 96600720258c, 3482a8bfa501, 380a79983342, f8d3c1afa946, 5aae37ddb5b9, bca9ffacff48.
**Fix (applicability-oracle):** Gate the 4b1c6c obligation on ≥2 in-tree iframes sharing an identical case-normalized name; emit a SET-level equivalent-purpose rubric (identical src ⇒ auto-pass) instead of per-iframe name-adequacy. **Recovers ~8.**

#### Cluster D — 5c01ea (ARIA-property-permitted) mis-routed to name-adequacy
**Mechanism (cited):** Rule 5c01ea is a deterministic ARIA-legality check; `query_ax_node` shows `requiredStatesMissing:[]` (legal), but the obligation is routed to name-adequacy and the model pivots ("Now I'm checking whether the accessible name is actually adequate").
**Spans:** SC 4.1.2; rule 5c01ea.
**Cases (4):** 424027651170, 556a7ba560d3, d5503ef9eb5b, f91d77e96c06, b67ab9861299 — of which the *routing* root-cause set = 556a7ba560d3, d5503ef9eb5b, f91d77e96c06 (and 424/b67 overlap Cluster A). Distinct 5c01ea cases: **5** (424027651170, 556a7ba560d3, d5503ef9eb5b, f91d77e96c06, b67ab9861299).
**Fix (applicability-oracle):** Let the deterministic axe/ARIA-permitted checker own 5c01ea; when permitted, mark SC satisfied and emit no LLM obligation. **Recovers ~5** (overlaps Cluster A on 2 cases — net new ≈3).

#### Cluster E — SVG/image applicability over-enumeration & wrong-subject anchoring (1.1.1)
**Mechanism (cited):** `act-page-collect.js:245` classifies *any* `<svg>` as `isImage`; `applicability-oracle.js:180` then enumerates a 1.1.1 obligation for nameless/roleless decorative SVGs (cd3b3a40), and obligations anchor on the outer roleless `<svg>` rather than the child carrying the explicit role/`aria-label` (8ad324, cc172d). CDP `query_ax_node` returns "node not found" and the coordinate fallback resolves a foreign `role=none` node (cc172d, f2af67).
**Spans:** SC 1.1.1; rules 23a2a8, 7d6734, e88epe.
**Cases (7):** 25e5364c0a13, e15b9aca4aaa, cd3b3a404645, 8ad324fd8d3f, cc172d9a654d, f2af67452464, 9f5f37188301.
**Fix (split):** (i) **applicability-oracle/collector** — gate bare `<svg>/<canvas>`→1.1.1 on explicit img role or accessible name, and anchor 7d6734 on the descendant carrying the explicit role; (ii) **cdp-tool/deterministic-runner** — fix SVG AccName/xpath resolution (child `<title>`, no coordinate fallback). **Recovers ~7** (≈4 oracle-anchoring, ≈3 AccName/CDP).

#### Cluster F — Menu/container-role name flags overriding ARIA "name optional"
**Mechanism (cited):** A 4.1.2 obligation points the LLM at the `role=menu` container; the `present:false→REPRODUCED` blanket rule (and the model's generic prior) overrides correct ARIA judgment ("container roles don't require a name"). Includes the same-role-sibling gate the model ignores (8c835039).
**Spans:** SC 4.1.2; rules m6b1q3, 307n5z, 6cfa84.
**Cases (5):** 895a5b0d06d8, 78c41b846199, 8c835039e68f, 85a2d2ea8aeb (+ 6cfa84 aria-hidden subtree).
**Fix (applicability-oracle + rubric):** Scope m6b1q3 to `role=menuitem`; suppress name obligations on container/structural roles and on aria-hidden/`tabindex=-1` subtrees; hard-gate container name flags on a deterministic same-role-sibling count >1. **Recovers ~5.**

#### Cluster G — Link identical-name "different destination = barrier" (fd3a94 / 5effbb)
**Mechanism (cited):** `link-purpose-v0.md:26` and `precomputeSignals` (llm-adjudicator.js:339) instruct "different destination ⇒ fail," conflating byte-inequality with non-equivalent *purpose*; plus the peer index (`linksByName` ~631-645) never excludes aria-hidden/out-of-tree links or different-context links.
**Spans:** SC 2.4.4; rules fd3a94, 5effbb.
**Cases (5):** 228c0a3d…(fd3a94), 9abd9bcfa7c5 (aria-hidden peer), 58087cbeb108 (different-context peer), 771c36b9967f (garbled context crop, collector), 8e6c190e0d2b (cross-origin — see irreducible).
**Fix (rubric + collector):** Rewrite `link-purpose-v0` identical-names mode to require an explicit equivalent-purpose judgment (same topic/resource = pass; remove the "ACT rules → different sites" FAIL exemplar); and exclude out-of-tree/different-context peers from `sameNameLinks`. **Recovers ~4** (228, 9abd9, 58087, 771c).

---

### 3. Fixable vs. Irreducible

**Harness-fixable: ~40 of 43.** All `rubric`, `applicability-oracle`, `collector`, `deterministic-runner`, and the SVG-AccName `cdp-tool` cases are mechanically recoverable by the lane fixes above.

**NOT cleanly harness-fixable / honest limits (3):**
- **8e6c190e0d2b** (`tool_failed_cross_origin`, cdp-tool): `resolve_destination` *refused* cross-origin and returned only `finalUrlEqual:false`; the equivalent-purpose pages (shared h1 "Contact us", same phone) are unreachable. Fixable *only* if the CDP tool is taught to fetch/byte-compare `file://` bodies — an instrument upgrade, not a prompt fix. **Borderline; count as irreducible-until-tool-work.**
- **4f112d270766** (`scoring-or-gt`, fixable:**partial**): the section-headings carve-out already exists; the model *overrode its own rubric* ("a chapter should arguably have at least a page-level heading"). Only a hard-gate makes it deterministic — residual model-override risk remains.
- **228c0a3d…** is fixable (rubric), so the genuinely irreducible/model-judgment residue is small: **1 hard tool limit (8e6c190e) + 1 partial scoring gate (4f112d2)**, i.e. **~2 of 43 are not a clean lane fix**, with 8e6c190 the only true tool-instrument limit.

No GT-error cases: every "GT=passed/inapplicable" judgment in the set is correct ACT scoping; the misses are all harness-side.

---

### 4. Notable One-Offs

- **ba5019010a6e** (1.3.1 / a25f45, collector): the table-structure collector dropped `headers=` IDREFs and `colspan` (`headers:[{id:"name"},{id:null},{id:null}]`, `scope:null`), so the model "correctly" reasoned "no headers attributes are present" — a pure **bad-evidence** FP. Fix: capture per-cell `headers`/`colspan`/`rowspan`. **Recovers 1.**
- **6b811d065fc2** — duplicate of ba5019? No: distinct 1.3.1 case, same collector defect (`headers=` not captured). Both fold into the table-collector fix (**2 cases**).
- **6b811d065fc2 + ab4691ef474d**: **ab4691ef474d** (1.4.3 / afw4f7, model_hallucinated_barrier): model sampled **inter-glyph backdrop at x=320/380/450** past the ~x=218 text end and applied "worst-region governs" to pixels with no glyph — a contrast hallucination. Fix `contrast-over-complex-backdrop-v0` to anchor sampling to rightmost actual glyph pixel. **Recovers 1.**
- **6b811d065fc2** (1.4.3 / afw4f7 disabled-exemption, applicability-oracle): obligation enumerated on an `aria-disabled="true"` control that WCAG 1.4.3 exempts; suppress contrast obligations on disabled targets. **Recovers 1.** (Note: this is the disabled-control case, ID `6b811d065fc2` corrected — the table case is `ba5019010a6e`.)
- **4f112d270766** (2.4.10 single-block heading): see §3.

**Net expected recovery:** the seven clusters + collector/contrast one-offs address **~40 of 43**; the single durable irreducible is **8e6c190e0d2b** (cross-origin destination-body comparison), with **4f112d270766** reducible only to a partial hard-gate.

---

# Appendix — per-case classification (all 74)

| # | kind | SC | rule | testcase | rootCause | fixLane | fixable | recommendation |
|---|---|---|---|---|---|---|---|---|
| 1 | FN | 1.4.3 | afw4f7   | bf47c65f2854 | deterministic_facet_unowned | deterministic-runner | yes | Make the contrast runner detect hard-split backgrounds (coincident gradient stops / abutting flat bands), sample text-overlapped pixels per flat region, and own the worst-region ratio (2.3:1 here) as a deterministic 1.4.3 barrier instead of returning computable:false and deferring to the vision rubric. |
| 2 | FN | 1.4.3 | afw4f7 T | 41afaa9b3328 | obligation_not_enumerated | applicability-oracle | yes | Have the applicability oracle / obligation builder enumerate an in-scope 1.4.3 obligation for text whose background includes an image (color:#555 + background url) so it routes to the 1.4.3 vision rubric, or promote the existing deterministic v3Barrier:true to the scored 1.4.3 verdict instead of leaving outcome=noObligation. |
| 3 | FN | 1.4.5 | 0va7u6 | bf023941401d | obligation_not_enumerated | collector | yes | Extend the image/subject collector to enumerate elements carrying a CSS `background-image` (with non-trivial box geometry) as candidate images-of-text subjects so the applicability oracle creates a 1.4.5 obligation for background-image carriers, not only `<img>`/DOM image elements. |
| 4 | FN | 2.1.1 | akn7bn | 62673162e22e | wrong_subject_targeted | collector | yes | Have the collector/oracle build the akn7bn obligation against the IFRAME element itself (and surface its tabindex), or have a deterministic runner OWN the "iframe with focusable content has negative/excluding tabindex" fact, so the iframe's `tabindex="-1"` exclusion is the subject the LLM (or checker) evaluates rather than the inner link. |
| 5 | FN | 2.1.2 | 80af7b   | 0ec0e93e7f8f | no_usable_verdict | deterministic-runner | yes | Surface the deterministic v3Barrier=true keyboard-trap finding (onblur self-refocus) into the scored lane as an authoritative 2.1.2 fail so a noVerdict from the LLM no longer reads as a recall miss for this deterministically-owned trap facet. |
| 6 | FN | 2.1.2 | 80af7b   | f5ea9fd3b681 | no_usable_verdict | deterministic-runner | yes | Surface the deterministic keyboard-trap finding (v3Barrier=true from the tab/focus probe for 2.1.2) as the authoritative verdict and subtract this dynamic-focus facet from the LLM, since a static-HTML LLM cannot observe the onblur self-refocus and the runner already owns it. |
| 7 | FN | 2.1.2 | 80af7b   | 7dcc4ae00712 | obligation_not_enumerated | applicability-oracle | partial | Have the applicability oracle enumerate a 2.1.2 keyboard-trap obligation whenever the page has multiple focusable elements (and especially when focus handlers like onblur/onfocus/onkeydown are present), pairing it with a deterministic VSR/tab-order trap probe so the LLM is actually invoked on this SC. |
| 8 | FN | 2.1.2 | 80af7b   | 62fd24e73ea5 | deterministic_facet_unowned | deterministic-runner | partial | Add a live-JS keyboard-trap probe to the deterministic runner that drives Tab/Shift+Tab/Esc with onfocus/onblur handlers active and, on detecting a focusable cycle (btn1<->btn2) with no documented standard escape, emits a 2.1.2 BARRIER_OBSERVED so deterministicTrapConfirmed becomes true (with an abstain->auto-PARTIAL-to-rubric fallback if the probe still declines the mutual-bounce class). |
| 9 | FN | 2.1.2 | 80af7b   | 8fba3918b361 | deterministic_facet_unowned | deterministic-runner | yes | Extend kbd-graph.js to OWN the mutual-bounce/confined-set trap: drive Tab/Shift+Tab from each focusable and emit a 2.1.2 BARRIER_OBSERVED when focus stays confined to a fixed set of focusables and never reaches an element outside it (and Esc does not escape), rather than abstaining — which would set deterministicTrapConfirmed:true and flip the precompute to a flag instruction. |
| 10 | FN | 2.4.10 | 047fe0   | 929079705b17 | rubric_too_lenient | rubric | yes | Amend the section-headings-v0 rubric so that a heading with aria-hidden="true" (or otherwise removed from the accessibility tree) does NOT count as introducing the non-repeated content for ACT 047fe0/2.4.10 — i.e., require an a11y-tree-exposed heading, treating aria-hidden as a barrier rather than an other-SC concern. |
| 11 | FN | 2.4.10 | 047fe0   | 7505d097f7d5 | rubric_too_lenient | rubric | yes | Amend rubric section-headings-v0 so that for SC 2.4.10/047fe0 the absence of a real heading element over non-repeated content (a visual-only/styled `<strong>` title) is a FAIL, not a defer-to-1.3.1 PARTIAL — reserve the 1.3.1-defer branch only for cases where a real heading already exists. |
| 12 | FN | 2.4.4 | 5effbb   | 98f0638a038a | rubric_too_lenient | rubric | yes | Tighten the link-purpose-v0 rubric so "name is not a generic phrase" is NOT sufficient: require that the destination be conveyed by the accessible name plus the link's OWN programmatic context (enclosing paragraph/sentence), surface the href so the model can detect name-vs-destination mismatch (e.g. "Workshop" vs workshop-report), and forbid borrowing context from sibling paragraphs. |
| 13 | FN | 2.4.4 | 5effbb   | 45d884e81c4e | rubric_too_lenient | rubric | yes | Tighten the link-purpose-v0 rubric so a generic action verb ("Download"/"click here"/"read more") whose only disambiguating context is an adjacent data value or a broad colspan table header is NOT cleared as descriptive, aligning the bar with ACT 5effbb Failed Example 6. |
| 14 | FN | 2.4.4 | 5effbb L | 43730455b694 | rubric_too_lenient | rubric | yes | Amend the link-purpose-v0 rubric so a label naming only a FORMAT/type (HTML/EPUB/PDF/"Plain text"/"Download") is treated as ambiguous unless its SUBJECT is recoverable from programmatically-determined context (same sentence/paragraph/list-item/cell — explicitly NOT a sibling heading or preceding paragraph), driving a LIKELY_BARRIER verdict on this fixture. |
| 15 | FN | 2.4.4 | fd3a94 | 9ceacbea5df4 | rubric_too_lenient | rubric | yes | Revise rubric link-purpose-v0 so that distinctRawHrefs=1 is NOT treated as a pass shortcut: when same-named, same-destination links sit in a context that promises distinct purposes (e.g. "via chat" vs "by phone"), require the model to flag a 2.4.4 barrier for misleading link purpose-in-context. |
| 16 | FN | 2.4.4 | fd3a94 | ef75d4242414 | evidence_gap_missing_signal | collector | yes | Fix the fixture-capture/mirroring step so it preserves href query strings (e.g. ?page=1/?page=2) instead of normalizing them away, so distinctRawHrefs reflects the true 2 distinct destinations for fd3a94 Failed Example 3. |
| 17 | FN | 2.4.4 | fd3a94 | f92350be3a29 | rubric_too_lenient | rubric | yes | Revise link-purpose-v0.md so the "same destination ⇒ not a failure" carve-out is conditional: when surrounding-region shows distinct adjacent labels/icons (e.g. Chat vs Phone) that imply the identically-named links should serve DIFFERENT purposes, flag a 2.4.4 barrier even when distinctRawHrefs=1 / destinations are identical. |
| 18 | FN | 2.4.4 | fd3a94 | 1379913f0770 | tool_failed_cross_origin | cdp-tool | yes | Fix resolve_destination so it follows same-origin/relative local test-asset paths (../_assets/...) instead of refusing them as cross-origin, so it can actually fetch and compare the two destinations' final URL/redirect targets and surface that index.html vs redirect1.html resolve to different content. |
| 19 | FN | 2.4.4 | fd3a94 | dddcd76a61f6 | evidence_gap_missing_signal | cdp-tool | yes | Make resolve_destination extract and fingerprint onclick="location='...'" (and similar JS-navigation) targets — or have observe_state_after_activation return the post-navigation location.href — so the model can compare the differing ?page=1 vs ?page=2 URLs instead of being misled by identical ERR_FILE_NOT_FOUND error-page content. |
| 20 | FN | 2.4.4 | fd3a94 | 7ebe961dbb4f | evidence_gap_missing_signal | cdp-tool | partial | Route every xpath in cdp-tools.js (especially resolveDestination and queryAxNode) through nsXPath() from xpath-ns.js so SVG/MathML-embedded <a> subjects resolve instead of returning null, restoring the destination/role signal the link-purpose rubric needs (the rubric's destination-only framing should also be widened to flag identical names over visually-distinct icon purposes). |
| 21 | FN | 2.4.4 | fd3a94   | 0b01e772dff4 | evidence_gap_missing_signal | collector | no-gt-artifact | Re-capture the fd3a94 fixture so the collector preserves link query strings (do not strip `?page=...`), restoring the two "Contact Us" links' distinct destinations — the only signal that lets the harness reproduce the failed verdict. |
| 22 | FN | 2.4.6 | cc0f0a | 2f1d964151ff | wrong_subject_targeted | applicability-oracle | yes | In the applicability oracle, route 2.4.6 on form-field subjects (rule cc0f0a) to a label-descriptive rubric instead of heading-descriptive-v0, enumerating a form-field-label obligation that evaluates the computed accessible name ("Go Search") for descriptiveness. |
| 23 | FN | 2.4.6 | cc0f0a | 649946098faf | rubric_too_lenient | rubric | yes | Add a cc0f0a-specific failure clause to the 2.4.6 rubric (or split off a form-field-label rubric) instructing the model to cross-compare all form fields and flag a barrier when two or more fields share the same programmatic label for different purposes AND the disambiguating context (e.g. a section heading) is not part of the field's accessible name (offscreen/aria-unassociated). |
| 24 | FN | 2.4.6 | cc0f0a   | 1e52060759a5 | rubric_too_lenient | rubric | yes | Add a form-field-label failure mode to heading-descriptive-v0 (or a dedicated 2.4.6 label rubric) stating that a topical noun naming an object/area ("Menu", "Info") is a barrier when it does not describe what to ENTER into the field, with the explicit "Menu" vs "First name:" contrast, so the anti-over-flagging caveat applies only to headings. |
| 25 | FN | 2.4.6 | cc0f0a F | 9b967559ff26 | rubric_too_lenient | rubric | yes | Amend heading-descriptive-v0.md to add a FORM-FIELD-specific calibration: a label that merely names a topic ("Menu") without describing the expected input value is non-descriptive for a free-text/date field (cite ACT cc0f0a's "Menu"/"Info:" failures), so do not treat "terse-but-unique" topic words as automatically passing for field labels. |
| 26 | FN | 3.3.1 | 36b590   | d7863608ff2a | rubric_too_lenient | rubric | yes | Amend the error-identification-v0 rubric so that an error message naming only a field TYPE shared by multiple fields (cannot disambiguate which instance is invalid) and/or an unconditionally-present static error span is scored REPRODUCED (barrier) rather than LIKELY_OK/UNCERTAIN. |
| 27 | FN | 4.1.2 | 6cfa84 | 9812d828fef2 | deterministic_facet_unowned | deterministic-runner | yes | Add a deterministic runner check that flags any focusable element (e.g. an href anchor / control without tabindex="-1") inside an aria-hidden="true" subtree as a 4.1.2/6cfa84 barrier, and surface it as a v3Barrier so it is owned rather than mis-routed to the accessible-name-adequacy rubric on the Close button. |
| 28 | FN | 4.1.2 | kb1m8s | 1345bf067f66 | obligation_not_enumerated | applicability-oracle | yes | Have the applicability oracle (backed by axe's aria-prohibited-attr) enumerate a 4.1.2 obligation whenever a global ARIA property/state (e.g. aria-braillelabel) appears on an element whose role prohibits it, so this deterministic ARIA-validity barrier is owned and surfaced rather than dropped. |
| 29 | FN | 4.1.2 | kb1m8s | 7cddc927da51 | obligation_not_enumerated | applicability-oracle | yes | Have the applicability oracle enumerate a 4.1.2/kb1m8s obligation whenever an element carries a global ARIA property prohibited by its (implicit or explicit) role — ideally seeded by surfacing axe's deterministic `aria-prohibited-attr` result so this `aria-roledescription`-on-generic-div case becomes an in-scope obligation (or a deterministic v3 barrier) instead of `noObligation`. |
| 30 | FN | 4.1.2 | kb1m8s | c4a2fe12d5a4 | obligation_not_enumerated | applicability-oracle | yes | Have the applicability oracle enumerate a 4.1.2 obligation (or, better, surface this as a deterministic ARIA-validity finding) whenever an ARIA global property such as aria-brailleroledescription appears on an element whose role (e.g. none/presentation) prohibits it, so the kb1m8s barrier reaches a verdict path. |
| 31 | FN | 4.1.2 | kb1m8s — | 358fa0b821c3 | deterministic_facet_unowned | cdp-tool | yes | In the axe-checker disposition lane (axe-surface.js / build-v3 consumption), treat a `aria-prohibited-attr` violation as a deterministic owned 4.1.2 barrier, and when axe returns it only as `incomplete`/review (the broken-reference ambiguity), route that residue to the LLM rubric instead of letting it fall to a silent auto-PARTIAL (honoring "absence ≠ pass"). |
| 32 | FP | 1.1.1,4.1.2 | 59796f I | 37cce377c874 | rubric_too_strict | rubric | yes | Tighten accessible-name-adequacy-v0 so a present, non-empty, resolved accessible name (e.g. "My button") is NOT a 4.1.2/1.1.1 barrier absent an objective mismatch (visible-label disagreement or empty/placeholder-only name), removing the subjective "generic name" failure path. |
| 33 | FP | 1.1.1 | 23a2a8 | cd3b3a404645 | applicability_over_enumerated | applicability-oracle | yes | Gate the isImage→non-text-content (1.1.1) obligation for bare <svg>/<canvas> so it fires only when the graphic actually carries the img role or an accessible name (explicit role=img, <title>/<desc>, aria-label/labelledby), excluding the nameless, role-less decorative SVG that ACT 23a2a8 scores as inapplicable. |
| 34 | FP | 1.1.1 | 23a2a8   | 25e5364c0a13 | rubric_too_strict | rubric | yes | Amend the alt-text-adequacy-v0 rubric so the e88epe "aria-hidden brand logo → REPRODUCED" example is gated/removed when the SC under test is rule 23a2a8 (whose applicability excludes aria-hidden/AT-removed images), routing such hidden-image subjects to NOT_REPRODUCED/inapplicable. |
| 35 | FP | 1.1.1 | 23a2a8   | e15b9aca4aaa | rubric_too_strict | rubric | yes | Amend alt-text-adequacy-v0 so that when removedFromA11yTree=true (e.g. aria-hidden), it returns NO_BARRIER/inapplicable for SC 1.1.1 and remove or heavily qualify the "aria-hidden W3C brand logo = REPRODUCED" exemplar, since an image removed from the accessibility tree makes rule 23a2a8 inapplicable rather than a barrier. |
| 36 | FP | 1.1.1 | 7d6734   | 8ad324fd8d3f | wrong_subject_targeted | applicability-oracle | yes | Have the applicability oracle anchor the 1.1.1/7d6734 obligation on the descendant element carrying the explicit role (the `<circle role="graphics-symbol">`) and compute accessibleName against that element so its `aria-label="1 circle"` is surfaced, instead of pointing the LLM at the unnamed, roleless outer `<svg>`. |
| 37 | FP | 1.1.1 | 7d6734   | cc172d9a654d | evidence_gap_missing_signal | cdp-tool | yes | Fix the accessible-name/AX-node resolution for SVG so the <title>-derived name "1 circle" and role="img" are correctly computed and surfaced (accessibleName.present=true) — including making query_ax_node resolve the SVG by xpath instead of forcing a mis-resolving coordinate fallback that picks up a foreign role="none" node. |
| 38 | FP | 1.1.1 | 7d6734 S | f2af67452464 | deterministic_facet_unowned | deterministic-runner | yes | Fix the deterministic AccName computation (and the xpath resolution that returned "node not found") so an SVG with a direct-child `<title>` reports accessibleName.present=true value="1 circle", subtracting this satisfied 1.1.1 obligation from the LLM lane. |
| 39 | FP | 1.1.1 | e88epe — | 9f5f37188301 | evidence_gap_missing_signal | collector | yes | Have the collector surface the nearest interactive ancestor's accessible name (e.g. ancestorLink.accessibleName="SVG star") in the decorativeMarking/evidence payload so the rubric can recognize a named link whose decorative image is correctly removed from the a11y tree. |
| 40 | FP | 1.3.1 | a25f45 H | ba5019010a6e | evidence_gap_missing_signal | collector | yes | Fix the table-structure collector to capture each cell's `headers` attribute IDREFs and `colspan`/`rowspan` per <th>/<td> (and resolve them) so the signal reflects the actual header-association wiring instead of reporting scope:null/no-headers when `headers=` is present. |
| 41 | FP | 1.4.3 | afw4f7 | ab4691ef474d | model_hallucinated_barrier | rubric | yes | Amend contrast-over-complex-backdrop-v0.md to anchor "worst region governs" to the rightmost ACTUAL glyph pixel — require measuring where the text glyphs end (via geometry/glyph-pixel detection) and sampling backdrop only directly under glyphs, explicitly forbidding extrapolating text extent into empty gradient/inter-glyph space. |
| 42 | FP | 1.4.3 | afw4f7 T | 6b811d065fc2 | deterministic_facet_unowned | applicability-oracle | yes | In the applicability oracle, suppress (do not enumerate) the 1.4.3/afw4f7 contrast obligation for any target whose computed disabled state is true (aria-disabled="true" or :disabled), matching the ACT rule's inactive-UI-component inapplicability condition. |
| 43 | FP | 2.4.10 | 047fe0   | 4f112d270766 | model_misread_evidence | scoring-or-gt | partial | Strengthen section-headings-v0.md to make the single-block carve-out a hard gate (e.g., "if structure.headings=[] AND the rendered content is a single continuous block with no perceivable distinct sections, you MUST return N/A — the absence of ANY heading is not by itself a 2.4.10 barrier; 2.4.10 requires multiple distinct sections to organize"), so the model cannot override N/A for a lone content block. |
| 44 | FP | 2.4.2 | 2779a5   | 6b3d2e2147cf | rubric_too_strict | rubric | yes | Constrain the page-title-v0 rubric to the 2779a5 facet (title presence/non-emptiness) and instruct it to NOT flag a barrier for non-empty-but-non-descriptive titles, since descriptiveness is out of scope for this ACT rule. |
| 45 | FP | 2.4.2 | 2779a5   | efa1e0438bb5 | gt_scope_or_granularity_mismatch | rubric | yes | Scope page-title-v0 so that under rule 2779a5 (non-empty title) a present, non-empty `<title>` cannot yield a barrier on descriptiveness alone — only flag emptiness/missing title, and route the descriptiveness judgment to the separate descriptive-title rule (c4a8a4). |
| 46 | FP | 2.4.2 | 2779a5   | 7f9f315b5041 | rubric_too_strict | rubric | yes | Constrain the page-title-v0 rubric so that under rule 2779a5 a present, non-empty/non-whitespace `<title>` clears the obligation, and do NOT raise a 2.4.2 barrier on title descriptiveness/quality alone. |
| 47 | FP | 2.4.2 | 2779a5   | 0ad882dffaf6 | rubric_too_strict | rubric | yes | Scope the page-title-v0 rubric to rule 2779a5's actual test (title present and non-empty after trimming) and stop it from flagging non-empty-but-generic titles as 2.4.2 barriers. |
| 48 | FP | 2.4.4 | 5effbb   | 771c36b9967f | evidence_gap_missing_signal | collector | yes | Have the evidence collector extract the link's enclosing-sentence text content (here "See the description of this product.") as clean structured context instead of a truncated/garbled visual crop that surfaced the wrong paragraph and lost the word "description." |
| 49 | FP | 2.4.4 | fd3a94 | 228c0a3d78557fb48a855d6733d50848a86f0d62 | rubric_too_strict | rubric | yes | Rewrite link-purpose-v0.md's identical-names mode so different-destination is necessary-but-not-sufficient: require an explicit equivalent-purpose judgment (same topic/equivalent resource across different URLs = NOT a barrier), and remove/invert the "two 'ACT rules' links to different sites" example since that exact fd3a94 fixture is GT-passed. |
| 50 | FP | 2.4.4 | fd3a94   | 8e6c190e0d2b | tool_failed_cross_origin | cdp-tool | yes | Fix mcp__cdp__resolve_destination to actually fetch and byte-compare the resolved destination page bodies (h1/title/main) for these local file:// fixtures instead of refusing cross-origin and returning only finalUrlEqual, so equivalent-purpose pages with distinct URLs resolve to PASS. |
| 51 | FP | 2.4.4 | fd3a94 — | 58087cbeb108 | deterministic_facet_unowned | collector | yes | In sameNameLinksFor/precomputeSignals, compute the programmatically-determined link context (nearest block ancestor's DOM-node set / containing text) and EXCLUDE peers whose context is not the SAME (per ACT "same context = exactly the same set of DOM nodes"), so links in separate <div> blocks like this fixture never form a same-name obligation (or surface differentContext:true to force PARTIAL). |
| 52 | FP | 2.4.4 | fd3a94 L | 9abd9bcfa7c5 | deterministic_facet_unowned | collector | yes | In llm-adjudicator.js sameNameLinks index (linksByName loop, ~lines 631-639), exclude links removed from the accessibility tree (el.removedFromA11yTree / inTree===false / aria-hidden / role=none) so an aria-hidden link is never counted as a same-named peer, making fd3a94 deterministically inapplicable when fewer than two in-tree same-named links remain. |
| 53 | FP | 4.1.2 | 307n5z   | ede992d9573d | applicability_over_enumerated | applicability-oracle | yes | Stop the applicability oracle from attaching the accessible-name-adequacy-v0 obligation to 307n5z subjects (the rule tests focusable-content-in-presentational-children, not name quality); only enumerate a 4.1.2 obligation matched to the rule's actual facet, or require a non-empty-but-present name to clear adequacy rather than judging descriptiveness. |
| 54 | FP | 4.1.2 | 307n5z E | 8c835039e68f | model_misread_evidence | rubric | yes | Harden accessible-name-adequacy-v0 to hard-gate container-role name flags on a deterministic same-role-sibling count (require >1 coexisting same-role container) so a single nameless role="menu" cannot be flagged regardless of the model's generic ARIA prior. |
| 55 | FP | 4.1.2 | 4b1c6c   | 08c5575023e8 | rubric_too_strict | rubric | yes | For rule 4b1c6c / SC 4.1.2 iframe-name obligations, route to (or add) a rubric that tests "do identically-named iframes embed equivalent content/purpose" (treating identical src as auto-equivalent) instead of the accessible-name-adequacy-v0 name-vs-content rubric, which over-flags correctly-named iframes. |
| 56 | FP | 4.1.2 | 4b1c6c   | 40e3400d782b | off_target_real_issue | applicability-oracle | yes | For rule 4b1c6c, the applicability oracle/runner should deterministically pass identically-named iframes when their src resources are equivalent (here identical src) and NOT enumerate the off-target accessible-name-adequacy-v0 obligation, subtracting this SC from the LLM. |
| 57 | FP | 4.1.2 | 4b1c6c   | 96600720258c | wrong_subject_targeted | applicability-oracle | yes | In applicability-oracle.js (the named-iframe 4.1.2 facet, lines ~137-143), stop emitting a single-iframe accessible-name-adequacy obligation for rule 4b1c6c; instead either suppress it when no two same-named iframes are present or emit a SET-level "same-name iframes equivalent-purpose" obligation that hands the rubric all identically-named iframes for relational comparison rather than a lone name-vs-content adequacy check. |
| 58 | FP | 4.1.2 | 4b1c6c   | 3482a8bfa501 | applicability_over_enumerated | applicability-oracle | yes | Gate the 4.1.2 iframe name-adequacy obligation (for rule 4b1c6c) on there being two or more iframes sharing an identical non-empty accessible name, so a lone named iframe yields noObligation instead of running the generic name-adequacy rubric. |
| 59 | FP | 4.1.2 | 4b1c6c   | 380a79983342 | rubric_too_strict | rubric | yes | Replace per-iframe name-adequacy judging for rule 4b1c6c with a set/pairwise rubric that, given iframes sharing an identical accessible name, only flags when their embedded content serves DIFFERENT purposes — and never flags a single iframe in isolation for name descriptiveness under 4.1.2. |
| 60 | FP | 4.1.2 | 4b1c6c   | f8d3c1afa946 | wrong_subject_targeted | rubric | yes | Route the named-iframe 4.1.2 obligation to a 4b1c6c-specific rubric that compares same-named iframes' src/purpose for equivalence (passing identical-src siblings) instead of the generic accessible-name-adequacy-v0 rubric, which wrongly judges name-vs-rendered-content adequacy. |
| 61 | FP | 4.1.2 | 4b1c6c   | 5aae37ddb5b9 | wrong_subject_targeted | applicability-oracle | yes | Gate the 4b1c6c/4.1.2 iframe obligation on a deterministic precondition that two+ iframes share an identical accessible name (case-normalized), so distinct-name fixtures like this enumerate no failure obligation instead of being routed to the generic accessible-name-adequacy rubric. |
| 62 | FP | 4.1.2 | 4b1c6c   | bca9ffacff48 | applicability_over_enumerated | applicability-oracle | yes | Gate the iframe name-role-value (4b1c6c) obligation in applicability-oracle.js so it is enumerated only when two-or-more iframes on the page share an identical accessible name, not for every singly-named iframe. |
| 63 | FP | 4.1.2 | 4e8ab6   | c43c9679072e | rubric_too_strict | rubric | yes | Tighten accessible-name-adequacy-v0 so it does not emit LIKELY_BARRIER when the name is present and resolved and plausibly describes the control (and is not enumerated for rule 4e8ab6, which tests required-state/property presence, not name quality). |
| 64 | FP | 4.1.2 | 5c01ea | d5503ef9eb5b | off_target_real_issue | rubric | yes | Route rule 5c01ea (4.1.2 ARIA-property permission) to an ARIA-attribute-legality rubric (which the AX node already shows passing) instead of accessible-name-adequacy-v0, so the LLM judges permission/legality rather than subjective name quality. |
| 65 | FP | 4.1.2 | 5c01ea   | f91d77e96c06 | deterministic_facet_unowned | applicability-oracle | yes | Have a deterministic ARIA-property-permitted checker own 5c01ea (resolve aria-* against the element's role per the ARIA-in-HTML allowed list) and, when the property is permitted, mark the SC satisfied so the applicability oracle does not emit a 4.1.2 obligation routed to the off-target accessible-name-adequacy-v0 rubric. |
| 66 | FP | 4.1.2 | 5c01ea   | b67ab9861299 | rubric_too_strict | rubric | yes | Recalibrate accessible-name-adequacy-v0 so that a present, resolved name reusing the control-type word ("My checkbox") is NOT a barrier — restrict it to genuinely empty/placeholder/wrong names, since 4.1.2 only requires a correct name to exist, not a purpose-descriptive one. |
| 67 | FP | 4.1.2 | 5c01ea A | 424027651170 | rubric_too_strict | rubric | yes | Tighten accessible-name-adequacy-v0 so a name that matches the visible label is treated as a pass (do not flag a control merely because the human-authored visible label is judged "generic"), reserving LIKELY_BARRIER for names that are absent, mismatched, or placeholder/empty. |
| 68 | FP | 4.1.2 | 5c01ea A | 556a7ba560d3 | off_target_real_issue | applicability-oracle | yes | For rule 5c01ea route an ARIA-attribute-permittedness rubric (or no LLM obligation, ceding permitted-attr to the deterministic axe checker) instead of the accessible-name-adequacy-v0 rubric, so the LLM is never asked a name-quality question on an ARIA-legality rule. |
| 69 | FP | 4.1.2 | 6cfa84 — | 85a2d2ea8aeb | wrong_subject_targeted | applicability-oracle | yes | Have the applicability oracle suppress accessible-name-adequacy obligations on controls inside an aria-hidden="true" subtree (and/or with tabindex="-1") since they are not exposed to AT, so no off-target 4.1.2 name-quality obligation is created for rule 6cfa84. |
| 70 | FP | 4.1.2 | 97a4e1 | 096bf1e8eeb0 | rubric_too_strict | rubric | yes | Constrain `accessible-name-adequacy-v0` so 4.1.2 only flags absent/empty/placeholder names (and route name vagueness/descriptiveness to 2.4.4), preventing a present, non-empty accessible name from being scored a 4.1.2 barrier on "vagueness" grounds. |
| 71 | FP | 4.1.2 | 97a4e1   | 3004e7b1a47b | rubric_too_strict | rubric | yes | Scope the accessible-name rubric for 4.1.2/97a4e1 to pass when a non-empty resolved accessible name is present and remove the name-descriptiveness/purpose-adequacy failure pattern (route any purpose-quality judgment to 2.4.6/2.4.9, not 4.1.2). |
| 72 | FP | 4.1.2 | cae760   | ee525eaa03d4 | wrong_subject_targeted | applicability-oracle | yes | Gate the cae760/4.1.2 obligation on the presence of at least one `<iframe>` element so the applicability oracle does not target a `<button>` (or any non-iframe) and produces noObligation on iframe-free pages. |
| 73 | FP | 4.1.2 | m6b1q3 | 78c41b846199 | rubric_too_strict | rubric | yes | Amend accessible-name-adequacy-v0 so its present:false→REPRODUCED rule excludes container/structural roles (e.g. menu, list, group, navigation) where ARIA makes the name optional, deferring to the model's role-aware judgment instead of forcing a barrier. |
| 74 | FP | 4.1.2 | m6b1q3   | 895a5b0d06d8 | wrong_subject_targeted | applicability-oracle | yes | Scope the m6b1q3 obligation to elements with role="menuitem" (the rule's actual subject) and stop enumerating the parent role="menu" container as an in-scope 4.1.2 subject, so the LLM is never asked to name-check a composite container the rule does not test. |

