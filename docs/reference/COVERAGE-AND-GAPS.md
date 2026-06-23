# Capability Coverage & Gaps — WCAG, Trusted Tester, EN 301 549, ACT Rules, Techniques

_What the v3 harness supports and misses, judged against the five standards in scope._
_Scope: automated/semi-automated evaluation of **web content** against **WCAG 2.1/2.2 Level A + AA**._

> **▶ Interactive view:** [`coverage-explorer.html`](coverage-explorer.html) — per-SC pathway rows with
> clickable ACT-rule / EN-clause / Trusted-Tester chips that open the verbatim source, plus highlighted gap
> rows. Regenerate with `node scripts/build-coverage-explorer.js`.

> Sources: `categories.json` (declared scope), `wcag.json` (SC universe), `scripts/v3/lib/catalog.js`
> (deterministic experiments), `applicability-oracle.js` (families), `scripts/v3/llm-rubrics/` (rubrics),
> `axe-surface.js` (axe), `checker-ibm.js` (IBM); `refs/trusted-tester/`, `refs/en_301549*.pdf` +
> `docs/reference/standards/en301549/`, `act-rules/`, `wcag-techniques/`.

---

## 1. Scope: 22 declared SCs inside a 55-SC universe

`categories.json` declares **22 in-scope SCs** (9 annotation categories), a deliberate subset of the
**55 WCAG 2.1/2.2 A+AA criteria** in `wcag.json`:

```
1.1.1  1.3.1  1.3.2  1.4.1  1.4.3  1.4.5  1.4.10  1.4.11  1.4.13
2.1.1  2.1.2  2.4.2  2.4.3  2.4.4  2.4.6  2.4.7
3.3.1  3.3.2  3.3.3  4.1.2  4.1.3      (+ 2.4.10 AAA, non-authoritative)
```

Everything else in A/AA is **deliberately excluded** (see §6) — those are intentional non-goals, not gaps.

---

## 2. Coverage of the 22 in-scope SCs, by mechanism

Mechanisms: **DET** = deterministic experiment (catalog.js) · **AXE** = axe surfaced · **IBM** = IBM checker ·
**LLM** = rubric only (non-authoritative; *inert when the LLM lane is off, which is the default*).

| SC | Name | DET | AXE | LLM rubric | Strength | Note |
|----|------|-----|-----|-----------|----------|------|
| 1.1.1 | Non-text Content | ✅ glyph, long-desc | ✅ img-alt rules | alt-adequacy, long-desc, captcha | **Strong** | DET catches PUA-glyph + complex-image-no-longdesc; axe owns alt presence; LLM judges adequacy |
| 1.3.1 | Info & Relationships | — | ✅ wholesale + td-headers/aria-req | info-relationships | **Strong** | axe owns structural; collect-tables/lists feed the residual layout judgment |
| 1.3.2 | Meaningful Sequence | — | — | sequence-meaning (VSR-gated) | **Weak** | LLM-only, gated on a reading-order divergence signal |
| 1.4.1 | Use of Color | — | advisory link-in-text | use-of-color | **Weak** | perceptual; no sound deterministic decider; IBM triage prior |
| 1.4.3 | Contrast (Min) | ✅ text-contrast-pixel | — | contrast-over-complex | **Strong** | DET clears/fails on a flat opaque backdrop; LLM for non-flat |
| 1.4.5 | Images of Text | — | — | images-of-text | **Weak** | LLM-only |
| 1.4.10 | Reflow | ✅ reflow-overflow (barrier) | — | reflow-no-hscroll | **Medium** | DET barrier-only @320px; G225 stranded-scroller now caught |
| 1.4.11 | Non-text Contrast | ✅ non-text-contrast | — | non-text-contrast | **Strong** | DET on a flat-reducible cue; LLM for graphical/gradient |
| 1.4.13 | Content on Hover/Focus | ✅ hover-content-tri (barrier) | — | hover-content | **Medium** | DET barrier-only |
| 2.1.1 | Keyboard | ✅ keyboard-activation | ✅ scrollable/frame focusable | keyboard-operable | **Medium** | DET clears only finite-contract single-mode controls |
| 2.1.2 | No Keyboard Trap | ✅ trap-escape + arrow-trap | — | — | **Strong** | DET-only; Tab/Shift/Esc/advised + arrow-key composite (C2) |
| 2.4.2 | Page Titled | — | ✅ wholesale | page-title | **Weak→fixable** | title *presence* is nearly deterministic but currently rubric-only |
| 2.4.3 | Focus Order | ✅ positive-tabindex (F44) | advisory tabindex | focus-order-meaning | **Medium** | DET catches reordering F44; sequence-meaning is LLM |
| 2.4.4 | Link Purpose | — | ✅ wholesale + link-name | link-purpose | **Medium** | axe owns name presence; LLM judges purpose-in-context |
| 2.4.6 | Headings & Labels | — | — | heading-descriptive | **Weak** | LLM-only (descriptiveness ≠ presence) |
| 2.4.7 | Focus Visible | ✅ focus-visual-retry | — | focus-visible-clear | **Strong** | DET clears with real keyboard focus |
| 3.3.1 | Error Identification | ✅ form-error-probe (barrier) | — | error-identification | **Medium** | DET barrier-only (submits invalid input) |
| 3.3.2 | Labels or Instructions | ✅ field-label-probe | — | field-label | **Strong** | DET clears with programmatic name + visible label |
| 3.3.3 | Error Suggestion | — | — | error-suggestion | **Weak** | LLM-only |
| 4.1.2 | Name, Role, Value | ✅ ax-state-diff + multipart | ✅ name + aria-validity | accessible-name | **Strong** | DET diffs CDP AX state; axe owns name presence + ARIA validity |
| 4.1.3 | Status Messages | — | — | status-message (+CDP tools) | **Weak** | LLM-only; needs dynamic observation |
| 2.4.10 | Section Headings (AAA) | — | — | section-headings | non-auth | AAA; fill stays non-authoritative |

### Strength distribution (22 in scope)
- **Strong (8):** 1.1.1, 1.3.1, 1.4.3, 1.4.11, 2.1.2, 2.4.7, 3.3.2, 4.1.2 — deterministic/axe substrate + LLM residual.
- **Medium (6):** 1.4.10, 1.4.13, 2.1.1, 2.4.3, 2.4.4, 3.3.1 — narrow or barrier-only deterministic / axe-presence + LLM.
- **Weak / LLM-only (7):** 1.3.2, 1.4.1, 1.4.5, 2.4.2, 2.4.6, 3.3.3, 4.1.3 — **no deterministic decider**.
- **AAA non-authoritative (1):** 2.4.10.

### The load-bearing caveat — *the LLM lane is non-authoritative and off by default*
With the LLM lane off (the shipped default), the **7 Weak SCs have no authoritative coverage** — their
obligations resolve to auto-PARTIAL (abstain). So the *authoritative* deterministic+axe footprint is
**~14 of 22**; the remaining 7 are covered only when the (shadow/canary) LLM lane is enabled.

---

## 3. The standards lens — what each adds, and where we stand

| Standard | In repo | What it contributes | Our standing |
|----------|---------|---------------------|--------------|
| **WCAG 2.1/2.2** | `wcag.json` | Normative SC text + **conformance requirements** (full-page, complete-process, non-interference, accessibility-supported) | Per-SC: §2. Conformance-scope: **partial** (see EN) |
| **Trusted Tester v5.1.3** | `refs/trusted-tester/` (18 SC procedures) | Manual baseline **test procedures** + applicability ("DNA") for **17/22** SCs (WCAG 2.0 A/AA only) | We **operationalize** TT's manual steps as DET/LLM lanes, and **exceed TT** on the 5 WCAG-2.1+ SCs it omits (1.4.10, 1.4.11, 1.4.13, 4.1.3, 2.4.10) |
| **EN 301 549 v4.1.0** | `refs/en_301549*.pdf` + `docs/reference/standards/en301549/` | Clause C.9 = WCAG 2.2 **pass-through** per SC, **plus** conformance-scope: full-page, complete-process, **non-interference** (1.4.2/2.1.2/2.2.2/2.3.1), **user-preferences** (C.9.7) | Per-SC covered; **conformance-scope is the gap** (§4) |
| **ACT Rules** | `act-rules/` (40 rules, `testcases.json` 1190 cases) | Atomic, repeatable **test logic** per SC; the regression corpus | We run the 40-rule subset deterministically; **6 rules are semi-auto/manual** (need the LLM) |
| **WCAG Techniques** | `wcag-techniques/` (174 techniques) | **Implementation patterns** (sufficient) + **documented failures** (F-techniques) | Inform the deterministic detectors + rubric prompts; not separately enforced |

**TT coverage of the 22:** 17 have TT procedures; 5 do not (the WCAG-2.1+ additions) — and for **all five of
those we have deterministic or rubric coverage**, so the harness is ahead of the TT baseline there.

---

## 4. Misses & gaps

### 4a. In-scope deterministic gaps (the 7 Weak SCs)
No deterministic decider exists; authoritative coverage depends on the (currently inert) LLM lane.
- **2.4.2 Page Titled** — *most fixable*: title presence/non-emptiness is deterministic; only descriptiveness needs the LLM. A deterministic presence check could move this Weak→Medium.
- **4.1.3 Status Messages** — needs dynamic observation; the detector + CDP tools exist but the lane is LLM-gated.
- **1.4.1 / 1.4.5 / 2.4.6 / 3.3.3 / 1.3.2** — genuinely semantic/perceptual (color adequacy, image-vs-text, descriptiveness, suggestion adequacy, reading-order meaning); LLM is the right lane, but it is non-authoritative today.

### 4b. EN 301 549 conformance-scope (structural, not per-SC) — the biggest standards gap
- **Full pages (C.9.6.2):** the collector caps at `elementCap` (~80) — elements past the cap are invisible. *Truncation is disclosed* but coverage is not full-page.
- **Non-interference (C.9.6.5):** no lane for **1.4.2** (audio autoplay), **2.2.2** (pause/stop/hide is rubric-only), **2.3.1** (flashing — deliberately not vision-judged). 2.1.2 trap is covered.
- **User preferences (C.9.7):** no lane for `prefers-reduced-motion` override, `forced-colors`, zoom/`user-scalable` blocking.
- **Complete processes (C.9.6.3):** single-page evaluation; multi-step process conformance is out.

### 4c. WCAG 2.2 additions not addressed (outside the 22 — intentional, listed for completeness)
- **2.5.7** Dragging Movements, **3.2.6** Consistent Help, **3.3.7** Redundant Entry, **3.3.8** Accessible Authentication — no lane.
- (Covered 2.2 additions: 1.4.11 ✅DET, 4.1.3 LLM, 2.4.11 ✅DET, 2.5.8 LLM, 1.4.12 IBM.)

### 4d. ACT rules needing semi-auto/manual (the LLM-dependent residue)
6 of 40 rules are not fully automatable (`qt1vmo`, `1a02b0`, `ee13b5`, `fd3a94`, `36b590`, `4b1c6c`) — they
require the judgment lane to score; deterministically they abstain.

---

## 5. Coverage *beyond* the 22 (incidental, mostly non-authoritative)
The harness also touches ~12 SCs outside its declared scope, via axe/IBM/rubric:
- **Deterministic:** 2.4.11 Focus Not Obscured (barrier-only).
- **Rubric:** 2.5.8 / 2.5.5 Target Size, 2.5.3 Label-in-Name, 2.2.2 Motion, 1.2.2 Captions.
- **IBM (non-authoritative PROVISIONAL):** 1.4.12 Text Spacing, 2.5.3 Label-in-Name; **triage-only:** 1.3.3 Sensory, 1.4.1.
- **axe-only:** 1.3.5 Identify Input Purpose, 1.4.4 Resize Text, 3.1.x Language.

---

## 6. Deliberate exclusions (NOT gaps)
Documented non-goals — excluded by `categories.json` and project memory:
- **1.2.x** time-based media (only a thin 1.2.2 captions rubric exists), **2.4.5** Multiple Ways,
  **3.1.x** Language (axe-only), **3.2.x** On Focus/Input + Consistent Help/Redundant Entry,
  **2.5.x** pointer gestures (except target-size), **2.2.x** Timing, **2.3.1** Flashing,
  **2.1.4** Character Key Shortcuts, **3.3.4/3.3.8** Error Prevention/Auth,
  **1.4.6** Enhanced Contrast (explicitly out of scope).

---

## 7. Scorecard

| Bucket | Count | SCs |
|--------|-------|-----|
| In-scope, Strong (DET/axe substrate) | 8 | 1.1.1, 1.3.1, 1.4.3, 1.4.11, 2.1.2, 2.4.7, 3.3.2, 4.1.2 |
| In-scope, Medium (narrow DET / axe-presence) | 6 | 1.4.10, 1.4.13, 2.1.1, 2.4.3, 2.4.4, 3.3.1 |
| In-scope, Weak (LLM-only, inert by default) | 7 | 1.3.2, 1.4.1, 1.4.5, 2.4.2, 2.4.6, 3.3.3, 4.1.3 |
| In-scope, AAA non-authoritative | 1 | 2.4.10 |
| Structural gaps (EN conformance-scope) | — | full-page cap, non-interference, user-prefs |

**Headline:** every declared SC is *touched*, but authoritative-when-LLM-off coverage is ~14/22;
the clearest near-term wins are a deterministic **2.4.2** presence check and the **EN conformance-scope**
lanes (full-page completeness, non-interference, user-preference preservation).
