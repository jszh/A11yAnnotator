# EN 301 549 V4.1.0 Annex C — coverage analysis vs the v3 harness

**Standardization work (ETSI).** Source: `refs/en_301549v040100ev.pdf` — *Draft EN 301 549 V4.1.0 (2025-11)*,
Annex C (normative): *Determination of conformance*. The `refs/` folder is **not published**; this document
paraphrases the standard's test structure and quotes only minimal procedure text for the purpose of internal
gap analysis. Date: 2026-06-19.

Companion to the W3C-ACT analysis in [../act-benchmark/V3-ACT-SUBSET-PIPELINE.md](../act-benchmark/V3-ACT-SUBSET-PIPELINE.md).
Where that work asked *"what do the ACT rules / scanners catch on our SCs"*, this asks *"what does the European
conformance standard require for our categories, and where is our harness structurally unable to satisfy it."*

The **verbatim relevant Annex C clauses** (the extracted source tests this analysis grades against) are in
[EN301549-ANNEX-C-RELEVANT-CLAUSES.md](./EN301549-ANNEX-C-RELEVANT-CLAUSES.md) — internal ETSI material, not
for publication (treat like `refs/`).

---

## 0. Method

1. Extracted Annex C in full (`pdftotext -layout`, 278 pp). Located clause **C.9 (Web)** — the part of the
   standard our web harness operates in — and its sub-tests C.9.1–C.9.7.
2. Mapped each of our **22 selected SCs** (`categories.json`) to its EN clause (9.x.y.z) and read the Annex C
   test verbatim. Relevance was confirmed against the WCAG 2.2 Understanding text embedded per-SC in
   `categories.json` (each EN web clause names exactly one WCAG SC, so the mapping is 1:1).
3. Mapped each SC to the harness lane(s) that attempt it (deterministic `CATALOG.experiments`, the 28 LLM
   rubrics, axe-C0, IBM-C1) and graded coverage.
4. Adversarially tested the EN-specific requirements that have **no per-SC analogue** — the conformance-scope
   clauses (C.9.6) and user-preferences (C.9.7) — by code proof + a runnable fixture.

EN 301 549 V4.1.0 incorporates **WCAG 2.2** (visible in the clause set: 1.4.11, 2.4.11, 2.5.7, 2.5.8, 3.2.6,
3.3.7, 3.3.8 are all present; 4.1.1 Parsing is `Void`). This matters: our SC list is WCAG-2.2-aligned, so the
mapping is clean.

---

## 1. Headline finding — for Web, EN Annex C is **WCAG 2.2 pass-through**

Every per-criterion Web test in Annex C has the identical shape (57 of them, verbatim modulo the SC name):

> **C.9.x.y.z** — Type of assessment: *Inspection* · Requirement: *"The ICT is, or includes, a web page."*
> Procedure: *"Check that the web page does not fail WCAG 2.2 Success Criterion X.X.X … according to WCAG
> Conformance Requirements stated in clause 9.6."* · Result: Pass / Fail / **Not applicable** (precondition
> false, or the page has no content relevant to the SC).

**EN 301 549 adds no test methodology beyond WCAG for individual web criteria.** This is the central result:
on a per-SC basis, our EN coverage *is* our WCAG coverage — i.e. exactly what the ACT/scanner analysis already
measured. There is nothing new to build at the criterion level.

What EN *does* add, and what this analysis is really about, lives in three places a per-element automated
harness does not naturally reach:
- **C.9.6** — the five WCAG **conformance requirements** (level, full pages, complete processes,
  accessibility-supported, non-interference) applied at *page / process* scope.
- **C.9.7** — **user preferences** (must not block UA presentation modes or override platform a11y settings).
- The **Inspection / Not-applicable** disposition model (maps to our PARTIAL + applicability oracle).

---

## 2. Relevance mapping — our 22 SCs → EN clause → harness lane

| # | SC | EN clause | EN status | harness lane(s) that attempt it | grade |
|---|---|---|---|---|---|
| 1 | 1.1.1 Non-text content | 9.1.1.1 | AA req | axe-C0 (alt *presence*) · LLM `alt-text-adequacy`, `long-description-completeness` | covered (presence det, adequacy LLM) |
| 2 | 1.3.1 Info & relationships | 9.1.3.1 | req | **axe-C0 (primary)** · LLM `info-relationships` | covered |
| 3 | 1.3.2 Meaningful sequence | 9.1.3.2 | req | LLM `sequence-meaning` (triage) | LLM-only |
| 4 | 1.4.1 Use of colour | 9.1.4.1 | req | LLM `use-of-color` + CDP `render_with_overrides`; IBM-C1 triage (inert) | LLM-only |
| 5 | 1.4.3 Contrast (min) | 9.1.4.3 | req | **det `text-contrast-pixel`** + LLM `contrast-over-complex-backdrop` | covered |
| 6 | 1.4.5 Images of text | 9.1.4.5 | req | LLM `images-of-text` | LLM-only |
| 7 | 1.4.10 Reflow | 9.1.4.10 | req | **det `reflow-overflow-probe`** + LLM `reflow-no-hscroll` | covered |
| 8 | 1.4.11 Non-text contrast | 9.1.4.11 | req | LLM `non-text-contrast` | LLM-only |
| 9 | 1.4.13 Content on hover/focus | 9.1.4.13 | req | **det `hover-content-tri`** + LLM `hover-content` | covered |
| 10 | 2.1.1 Keyboard | 9.2.1.1 | req | **det `keyboard-activation`** | covered |
| 11 | 2.1.2 No keyboard trap | 9.2.1.2 | req **+ non-interference** | **det `keyboard-trap-escape`** (abstains 5/5 on ACT) | weak |
| 12 | 2.4.2 Page titled | 9.2.4.2 | req | LLM `page-title` | LLM-only |
| 13 | 2.4.3 Focus order | 9.2.4.3 | req | LLM `focus-order-meaning` (triage) | LLM-only |
| 14 | 2.4.4 Link purpose (in ctx) | 9.2.4.4 | req | LLM `link-purpose` | LLM-only |
| 15 | 2.4.6 Headings & labels | 9.2.4.6 | req | LLM `heading-descriptive` | LLM-only |
| 16 | 2.4.7 Focus visible | 9.2.4.7 | req | **det `focus-visual-retry`** + LLM `focus-visible-clear` | covered |
| 17 | **2.4.10 Section headings** | **9.5** | **AAA — informative, NOT required** | LLM `section-headings` | over-coverage |
| 18 | 3.3.1 Error identification | 9.3.3.1 | req | **det `form-error-probe`** + LLM `error-identification` | covered |
| 19 | 3.3.2 Labels or instructions | 9.3.3.2 | req | **det `field-label-probe`** + LLM `field-label` | covered |
| 20 | 3.3.3 Error suggestion | 9.3.3.3 | req | LLM `error-suggestion` | LLM-only |
| 21 | 4.1.2 Name, role, value | 9.4.1.2 | req | **det `ax-state-diff`** + axe-C0 + LLM `accessible-name-adequacy` | covered |
| 22 | 4.1.3 Status messages | 9.4.1.3 | req | LLM `status-message` | LLM-only |

**21/22 map to a normative EN web requirement; all 21 have at least one harness lane.** Per-criterion, the
harness is as complete as the WCAG/ACT analysis showed — no EN-driven per-SC gap.

---

## 3. Scope deltas EN surfaces

### 3a. We over-scope one SC: **2.4.10 Section Headings is AAA** → EN treats it as *informative* (C.9.5,
"contains no testable requirements"). Our category 3 lists it as if required. Harmless (extra coverage), but
worth recording: a strict EN-conformance framing would not fail a page for 2.4.10.

### 3b. EN requires WCAG-2.2 AA/A criteria adjacent to our categories that our 22-SC list omits
EN 301 549 V4.1.0 mandates the new WCAG 2.2 criteria at A/AA. Several sit inside our category *themes*:

| EN clause | SC | level | our category theme | harness today |
|---|---|---|---|---|
| 9.2.4.11 | 2.4.11 Focus not obscured (min) | AA | cat 5 Focus visibility | **det `focus-obscured-barrier`** ✓ |
| 9.2.5.8 | 2.5.8 Target size (min) | AA | cat 4 Keyboard/pointer | det target-size signal + LLM `target-size-minimum` ✓ |
| 9.1.4.12 | 1.4.12 Text spacing | AA | cat 6 Visual presentation | IBM-C1 (inert) — partial |
| 9.2.5.7 | 2.5.7 Dragging movements | AA | cat 4 pointer | **no lane** — gap |
| 9.3.2.6 | 3.2.6 Consistent help | A | cat 9 Input assistance | **no lane** — gap |
| 9.3.3.7 | 3.3.7 Redundant entry | A | cat 9 Input assistance | **no lane** — gap |
| 9.3.3.8 | 3.3.8 Accessible authentication (min) | AA | cat 9 Input assistance | LLM `captcha-alternative` — partial |

These are **EN-required criteria our category selection doesn't list**; three (2.5.7, 3.2.6, 3.3.7) have no
harness lane at all. If the harness is to claim EN-web conformance support, these belong on the roadmap.

---

## 4. The real gaps — EN conformance-scope requirements a per-element harness can't satisfy

These are the findings that *don't* appear in a per-SC / ACT view, because they are about **scope**, not about
any one criterion. Each is graded against the harness architecture, with an adversarial demonstration.

### 4a. C.9.6.2 **Full pages** — the *whole* page must conform · **STRUCTURAL GAP (proven + empirical)**
WCAG conformance requirement 2 forbids "partial" page conformance: a single non-conforming element fails the
page. The harness collects elements with a hard cap:

> `for (const el of document.querySelectorAll('body *')) { if (els.length >= cap) break; … }`
> — `run-v3-act-suite.js:254`, `elementCap = 80` (`limits.js`); the automatic deterministic probe runs on at
> most `maxAuto = 16`.

Every v3 lane (deterministic *and* LLM) operates on this truncated element list, so **anything past the 80th
collected element is invisible to the entire v3 harness.** axe (independent full-DOM scan) backstops *static*
SCs, but offers nothing for the **behavioral** SCs (2.1.x, 2.4.7, 1.4.13, 4.1.3) — which are exactly v3's
exclusive territory. So the full-page gap is concentrated where v3 is the only decider.

**Adversarial test** (`en-adversarial/fixtures/fullpage-cap.html`): 100 interactive elements, a barrier (an
unnamed `role="button"`, 4.1.2) planted at element #95. Running the harness collect at `cap=80`:
```
collected elements (cap 80): 80
planted barrier (#95) in collected set?: false   ← the v3 harness cannot see it
```
A conformant EN evaluation fails the page (full-pages); v3 clears it. **Confirmed**, matching the code proof.

### 4b. C.9.6.3 **Complete processes** — every page in a multi-step process must conform · **STRUCTURAL GAP**
`orchestrate()` consumes a **single `collect`** (one page, one captured state). There is no flow/journey input:
a checkout where step 1 is clean and step 3 has a barrier passes every per-page run yet fails C.9.6.3. The
harness has no mechanism to assert process-level conformance. (Not runner-fixable without a flow orchestrator.)

### 4c. C.9.6.4 **Only accessibility-supported ways** — technologies must work with real AT · **PARTIAL/GAP**
The harness reads a sampled accessibility tree (`axName`/`axRole` from DOM heuristics, `ax-state-diff` via
CDP) as a *proxy* for AT exposure. It never verifies that a used technique is actually accessibility-supported
across a real AT/browser matrix (the EN/WCAG sense). For mainstream HTML/ARIA this is usually fine; for novel
widgets it is an unverified assumption.

### 4d. C.9.6.5 **Non-interference** — four SCs must hold even for non-conforming content · **GAP**
WCAG conformance requirement 5 elevates 1.4.2, 2.1.2, 2.2.2, 2.3.1 to "must not interfere even if you don't
otherwise claim them." Harness status:

| non-interference SC | det runner | rubric | status |
|---|---|---|---|
| 1.4.2 Audio control | no | none | **no lane** |
| 2.1.2 No keyboard trap | `keyboard-trap-escape` | none | present but **abstains 5/5** (ACT) |
| 2.2.2 Pause, stop, hide | no | none | **no lane** |
| 2.3.1 Three flashes | no | none | **no lane** |

Three of the four non-interference criteria have **no harness lane at all**, and the fourth currently
abstains. Non-interference is the WCAG requirement most directly about "page actively harms the user," and the
harness is weakest exactly here.

### 4e. C.9.7 **User preferences** — must not block UA modes or override platform a11y settings · **GAP**
No deterministic runner or rubric evaluates C.9.7 (verified: no `prefers-reduced-motion` / `forced-colors` /
`user-scalable` conformance check in `lib/` or `llm-rubrics/`). The harness *does* have a CDP
`render_with_overrides` emulation tool (grayscale/CVD/forced-colors/no-author-css) — but it serves the LLM's
use-of-color (1.4.1) reasoning, not a 9.7 conformance check. The infrastructure to test 9.7 exists; the check
does not. A page with `user-scalable=no` or one that ignores `prefers-reduced-motion` would clear today.

### 4f. Disposition alignment (not a gap — a match worth noting)
EN's **Inspection** + **Not applicable** ("page has no content relevant to the SC") maps cleanly onto the
harness's applicability oracle + auto-PARTIAL. EN's Pass/Fail/NA is the same trichotomy as the v3
clear/barrier/abstain disposition. The harness's PROVISIONAL/PARTIAL model is already shaped for EN-style
determination — a point in its favour for standardization framing.

---

## 5. Adversarial test summary

| EN requirement | test | harness result | verdict |
|---|---|---|---|
| C.9.6.2 Full pages | barrier planted at element #95 (`fullpage-cap.html`) | collect truncates at 80 → barrier unseen | **gap confirmed (code + run)** |
| C.9.6.5 Non-interference | CATALOG/rubric inventory for 1.4.2 / 2.2.2 / 2.3.1 | no lane exists | **gap confirmed (architecture)** |
| C.9.7 User preferences | inventory for reduced-motion/forced-colors/zoom *check* | emulation tool only; no conformance check | **gap confirmed (architecture)** |
| C.9.6.3 Complete processes | `orchestrate()` input shape | single collect, no flow input | **gap confirmed (architecture)** |
| Per-SC (21 criteria) | EN Annex C procedure text | identical to WCAG 2.2 | **no EN-specific gap beyond WCAG** |

---

## 5b. Builder disposition (2026-06-19) — integrate / defer / not-relevant

Each recommendation triaged + actioned. One correction to this analysis: **§4d "2.2.2 no lane" is stale** — the
`motion-control` family + `motion-control-v0` rubric already cover 2.2.2 (auto-motion pause/stop/hide). Verified in
`applicability-oracle.js`.

| Recommendation | Disposition | Action |
|---|---|---|
| **§4a C.9.6.2 Full-pages truncation** | ✅ **INTEGRATED** | The element-cap hole is real + proven, and a silent clear past the cap is the harness's cardinal sin. Added a TRUNCATION DISCLOSURE: `collect.coverage{truncated,collected,domElementCount,cap}` (act-page-collect) → build `coverage` + `summary.coverageTruncated`. A clear on a truncated page is now flagged, not read as full-page. Tests in `en-coverage-disclosure.test.js` (incl. the §4a adversarial 100-element/#95-barrier fixture). |
| §4e C.9.7 user preferences | ⏸ **DEFER** | Feasible (reuse `render_with_overrides`); `user-scalable=no` detector is the cheap first step. New conformance-scope lane outside the 22 SCs → DEFERRED-TODO §H. |
| §4d non-interference: 1.4.2 audio, 2.1.2 strengthen | ⏸ **DEFER** | New 1.4.2 lane / trap-detector tuning; not in the 22 SCs → §H. (2.2.2 already covered; 2.3.1 explicitly NOT built — unsound by two-frame vision.) |
| §4b C.9.6.3 Complete processes | 📄 **BOUNDARY** | Single-page architecture; document, don't build (same as TT G6) → §H. |
| §4c C.9.6.4 Accessibility-supported | 📄 **BOUNDARY** | AX-tree proxy; an automated harness can't run a real-AT matrix → §H. |
| §3a 2.4.10 over-coverage | ➖ **NOT RELEVANT** | AAA-informative under EN; the harness covers it non-authoritatively (shadow) — harmless. |
| §3b / §6.3 add 2.5.7 / 3.2.6 / 3.3.7 | ➖ **NOT RELEVANT** | The doc itself annotates "(builder: disregard this)"; the 22-SC selection is the deliberate scope. |
| §6.1 per-criterion EN tests · §6.4 framing | ➖ **NO ACTION** | Web Annex C *is* WCAG 2.2 (nothing per-SC to build); the disposition→oracle mapping is a positioning note. |

---

## 6. Conclusions / recommendations

1. **Do not build per-criterion "EN tests."** For Web, EN Annex C *is* WCAG 2.2; the criterion-level work is
   the WCAG/ACT work already done. The EN lens adds nothing per-SC.
2. **The EN-distinct value is conformance-scope, and that is where the harness is weakest:**
   - *Full-pages*: the `elementCap`/`maxAuto` truncation is a real completeness hole for behavioral SCs.
     Either raise/justify the caps, page through large DOMs, or **emit an explicit "coverage truncated at N
     elements" disclosure** so a cleared page is never mistaken for a full-page conformance claim.
   - *Non-interference*: add lanes for 1.4.2 / 2.2.2 / 2.3.1 (audio autoplay, auto-updating/animated content,
     flash) and strengthen 2.1.2 beyond abstain — these are "actively harmful page" checks and are absent.
   - *User preferences (9.7)*: a deterministic check is feasible (reuse `render_with_overrides`) — flag
     `user-scalable=no`, blocked zoom, and animation that ignores `prefers-reduced-motion`.
   - *Complete processes*: out of single-page scope; document it as a known boundary rather than implying
     page-clear == process-conformant.
3. **Scope hygiene:** 2.4.10 is AAA-informative under EN (we over-cover — fine); conversely EN *requires*
   2.5.7, 3.2.6, 3.3.7 (A/AA) which the harness has **no lane** for — add them if EN-web conformance is a goal. (builder: disregard this)
4. **Framing win:** the EN Inspection / Pass / Fail / Not-applicable model maps directly onto the harness's
   applicability-oracle + PARTIAL/PROVISIONAL disposition — useful for positioning the harness output in
   EN-conformance terms.

---

## Appendix — reproduce

```bash
pdftotext -layout refs/en_301549v040100ev.pdf /tmp/en301549/full.txt   # Annex C body ~lines 8881–14321
# C.9 Web tests:    grep -nE "^C\.9\.[0-9]" /tmp/en301549/full.txt
# full-page adversarial fixture + collect probe:
node … en-adversarial/fixtures/fullpage-cap.html   # see §4a
```
Harness coverage facts are read from `scripts/v3/lib/catalog.js`, `scripts/v3/lib/limits.js`,
`scripts/v3/llm-rubrics/`, and `eval/checker-comparison/run-v3-act-suite.js:254`.
