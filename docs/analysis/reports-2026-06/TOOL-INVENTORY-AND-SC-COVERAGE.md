# Tool Inventory + Per-SC Coverage

**Scope:** the v3 harness evidence layer (`scripts/v3/lib/`, `scripts/eval-page.js`, `scripts/v3/llm-rubrics/`).
**Basis commit:** `44af6af7` (branch `round3-llm-evidence-lane`).
**Method:** `total` = raw `wc -l`; `code` ≈ blank + `//`-comment lines excluded (heuristic — trailing/block
comments not perfectly stripped, so `code` is ±a few). Per-tool LOC in `cdp-tools.js` = the span between top-level
declarations, with each tool's dedicated helpers folded in. Every file was first committed 2026-06-15 → 2026-06-30
(this project's build), so the whole suite is net-new to this contribution.

---

## Vocabulary (three concepts)

To keep the conceptual surface small, the paper uses **three** kinds of evidence source. Rather than sub-typing by
artifact (runner vs detector vs CDP tool vs probe…), a **tool** is *anything the harness invokes to gather evidence
about a subject*, and tools are distinguished only by **where and when they apply**.

| Concept | What it is | Authority |
|---|---|---|
| **Checker** | A borrowed third-party deterministic engine (axe-core, IBM Equal Access), surfaced through an adapter. | Owns settled facets; **subtracted from auto-PARTIAL**. |
| **Tool** | Anything *we* built and the harness invokes to gather evidence — deterministic or LLM-callable. Unified; differentiated by *when/where it applies* (below). | A tool either **decides** (emits a CLEAR/BARRIER disposition) or **provides evidence** (feeds a rubric). |
| **Rubric** | An LLM judgment prompt that reads the gathered evidence and renders the residual *meaning/adequacy* verdict. | Non-authoritative (shadow / provisional). |

A tool is placed by two orthogonal axes — the **where/when it applies**:

**WHEN — the pipeline stage the tool binds to:**

| Stage | Fires… | Typically emits |
|---|---|---|
| **scan** | once per page, unconditionally (whole-page static scan) | evidence / findings |
| **triage** | on a *raised candidate* — settle it deterministically, or escalate | a disposition (CLEAR / BARRIER) |
| **review** | on demand, while the LLM reviews the residual | evidence (raw facts / pixels) |

**WHERE — the subject the tool applies to:**
- **scope:** `pg` page-level · `el` element-level · `set` a same-named group (links, iframes)
- **mode:** `static` reads the DOM/CSSOM/pixels as-collected · `live` drives an interaction state or navigation on a fresh clone

Notation in the tables below: **`stage·scope/mode`** (e.g. `review·set/live`); **`req`** = deterministically
required-provisioned even in the review lane (`required-tool-routing.js`); checker **`owns`** = decided
deterministically and subtracted from auto-PARTIAL. Output-authority falls out of the axes: `scan`/`triage` tools
mostly **decide**; `review` tools mostly **provide evidence** — the exception being the `req` review tools, which
are review-stage but harness-invoked.

---

## Part A — Inventory + LOC

### Checkers (borrowed engines + our adapters)

| Adapter | total | code | note |
|---|--:|--:|---|
| `axe-surface.js` | 161 | 73 | surfacing/allowlist gate over axe-core; owns 1.1.1, 1.3.1, 2.1.1, 2.4.2, 2.4.4, 4.1.2 facets |
| `checker-ibm.js` | 103 | 65 | IBM Equal Access adapter; in-scope contribution = 1.4.1 triage prior |

### Tools — `scan` stage (run once per page, harness-invoked)

| Tool | SC(s) | where | total | code |
|---|---|---|--:|--:|
| `kbd-graph.js` (tab order, traps, focus-retention) | 2.1.1 · 2.1.2 · 2.4.3 | pg/live | 560 | 387 |
| `vsr-collect.js` (VSR transcript) | 1.3.2 · 2.4.3 | pg/live | 224 | 145 |
| `status-detector.js` | 4.1.3 | pg/static | 137 | 98 |
| `collect-lists.js` | 1.3.1 | pg/static | 101 | 69 |
| `collect-tables.js` | 1.3.1 | pg/static | 101 | 60 |
| `vsr-analysis.js` (reading-order divergence) | 1.3.2 | pg | 97 | 53 |
| `vsr-graph.js` | 1.3.2 · 2.4.3 | pg | 90 | 66 |
| `order-check.js` (visual-order divergence) | 1.3.2 · 2.4.3 | pg/static | 84 | 49 |
| `confusable-text.js` (homoglyphs) | 1.1.1 | el/static | 81 | 60 |
| `xpath-ns.js` (SVG-ns resolver — cross-cutting infra) | — | — | 24 | 11 |
| **subtotal** | | | **1,499** | **998** |

### Tools — `triage` stage (fire on a raised candidate; deterministic dispose-or-escalate)

| Component | contents | total | code |
|---|---|--:|--:|
| `exp-runners.js` (probe registry) | 15 probes: `text-contrast-pixel`(1.4.3), `field-label-probe`(3.3.2), `form-error-probe`(3.3.1), `reflow-overflow-probe`(1.4.10), `keyboard-trap-escape`+`composite-arrow-trap`(2.1.2), `keyboard-activation`(2.1.1), `ax-state-diff`+`multipart-grouping`(4.1.2), `hover-content-tri`(1.4.13), `non-text-contrast`(1.4.11), `glyph-text-alt`+`long-desc-presence`(1.1.1), `positive-tabindex`(2.4.3), `focus-obscured-barrier`(2.4.11†) | 1,521 | 1,039 |
| standalone engines | `nontext-contrast-runner`(217/141), `reflow-runner`(184/132), `form-binding-runner`(159/124), `small-signals`(132/100), `reveal-state-runner`(92/70) | 784 | 567 |
| checklists (evidence assemblers) | `form-binding`(58/41), `nontext-contrast`(52/30), `small-signals`(49/39), `interaction`(38/26), `reflow`(30/21), `reveal`(20/15) | 247 | 172 |
| support | `micro-checks.js`(246/174), `interaction-capture.js`(145/110) | 391 | 284 |

(† `focus-obscured-barrier` → 2.4.11, outside the 22-SC scope.) **Note:** the registry and the standalone engines
**overlap** — several probes delegate into the engines, so don't sum them as disjoint.

### Tools — `review` stage (LLM-invoked on demand; `req` = required-provisioned)

`cdp-tools.js` — 16 tools, per-tool LOC:

| Tool | SC(s) | where | LOC | | Tool | SC(s) | where | LOC |
|---|---|---|--:|---|---|---|---|--:|
| `interact_and_observe` | 2.1.1/2.1.2/3.3.1/3.3.3/1.4.13 | el/live | 222 | | `resolve_part_color` | 1.4.11/1.4.1/1.4.3 | el/static | 75 |
| `resolve_destination` `req` | 2.4.4 | set/live | 174 | | `measure_geometry_live` | 1.4.10/1.4.13 | el/static | 70 |
| `query_ax_node` | 4.1.2/4.1.3/1.3.1/2.4.4/2.4.6/2.1.1 | el/static | 162 | | `measure_text_contrast_over_image` | 1.4.3 | el/static | 70 |
| `observe_state_after_activation` | 4.1.3/3.3.1/2.1.2 | el/live | 132 | | `capture_full_page` | 2.4.10/2.4.6/1.3.1/2.4.2/2.4.3/1.3.2 | pg/static | 43 |
| `set_state_and_capture` | 1.4.11/1.4.1/1.4.3/2.4.7/1.4.13 | el/live | 94 | | `ocr_image_text` `req` | 1.4.5/1.1.1 | el/static | 38 |
| `compute_contrast_ratio` `req` | 1.4.3/1.4.1/1.4.11 | el/static | 92 | | `render_with_overrides` `req` | 1.4.1 | el/static | 33 |
| `compare_named_regions` | 1.1.1 | el/static | 83 | | `compare_iframe_content` | 4.1.2 | set/static | 31 |
| `probe_screen_reader_after_action` | 4.1.3/3.3.1 | el/live | 77 | | `request_hi_res_crop` | 1.1.1/1.4.5 | el/static | 24 |

**16 tools = 1,420 LOC** (file 1,612 incl. ~192 MCP server/dispatch infra). Routing: `cdp-tool-catalog.js`
82/63, `required-tool-routing.js` 29/22. Separate broad-review lane: `broad-scope-probes.js` 3,222/3,155.

### Rubrics
34 rubric prompts, **1,980 lines** total (mean 58). 28 map to the 22 in-scope SCs; 6 are for the broad-review lane
(`focus-not-obscured` 2.4.11, `label-in-name` 2.5.3, `media-alternatives` 1.2.2, `motion-control` 2.2.2,
`target-size-minimum`/`-enhanced` 2.5.8/2.5.5).

### Rollup (code LOC)

| | scan | triage | review | checkers | rubrics |
|---|--:|--:|--:|--:|--:|
| tools | 998 | 1,039 + 567 engines + 172 checklists (overlapping) | 1,420 (+3,155 broad lane) | 138 (adapters) | 1,980 (raw) |

Discrete per-facet tool code (scan + triage registry + engines + checklists + review) ≈ **4,196**; add structural
support (`micro-checks`, `interaction-capture` 284) and the broad-review lane (3,155) for the full instrument layer.

---

## Part B — Per-SC coverage matrix

The 22 in-scope SCs (`categories.json`). Each cell lists **Checker · Tools (`stage·scope/mode`) · Rubric**. Cross-cutting
infra (`xpath-ns`, `vision-capture`) feeds every vision/`live` tool and is not repeated.

| SC | Lvl | Title | Checker | Tools (`stage·scope/mode`) | Rubric |
|---|---|---|---|---|---|
| **1.1.1** | A | Non-text Content | axe (`image-alt`, `presentation-role-conflict`, `image-redundant-alt`) | `confusable-text`(scan·el/static); `glyph-text-alt`,`long-desc-presence`(triage·el/static); `request_hi_res_crop`,`ocr_image_text`(req),`compare_named_regions`(review·el/static) | alt-text-adequacy, decorative-image-verification, long-description-completeness, captcha-alternative |
| **1.3.1** | A | Info & Relationships | axe **owns** (`empty-heading`,`heading-order`,`landmark-*`,`region`,`page-has-heading-one`,`empty-table-header`,`scope-attr-valid`) | `collect-tables`,`collect-lists`(scan·pg/static); `query_ax_node`(cellHeaders),`capture_full_page`(review·—) | info-relationships, field-programmatic-association |
| **1.3.2** | A | Meaningful Sequence | — | `vsr-analysis`,`order-check`,`vsr-graph`(scan·pg); `capture_full_page`(review·pg/static) | sequence-meaning |
| **1.4.1** | AA | Use of Color | IBM (triage prior) | `interaction-checklist`(triage·el/live); `render_with_overrides`(req),`compute_contrast_ratio`,`resolve_part_color`(review·el/static),`set_state_and_capture`(review·el/live) | use-of-color |
| **1.4.3** | AA | Contrast (Minimum) | — | `text-contrast-pixel`,`interaction-checklist`(triage·el/live); `compute_contrast_ratio`(req),`measure_text_contrast_over_image`,`resolve_part_color`(review·el/static),`set_state_and_capture`(review·el/live) | contrast-over-complex-backdrop |
| **1.4.5** | AA | Images of Text | — | `ocr_image_text`(req),`request_hi_res_crop`(review·el/static) | images-of-text |
| **1.4.10** | AA | Reflow | — | `reflow-overflow-probe`→`reflow-runner`+`reflow-checklist`(triage·pg/live); `measure_geometry_live`(review·pg/live) | reflow-no-hscroll |
| **1.4.11** | AA | Non-text Contrast | — | `non-text-contrast`→`nontext-contrast-runner`+`checklist`,`interaction-checklist`(triage·el/live); `resolve_part_color`(req),`compute_contrast_ratio`(review·el/static),`set_state_and_capture`(review·el/live) | non-text-contrast |
| **1.4.13** | AA | Content on Hover/Focus | — | `hover-content-tri`→`reveal-state-runner`+`checklist`(triage·el/live); `interact_and_observe`,`set_state_and_capture`(review·el/live),`measure_geometry_live`(review·el/static) | hover-content |
| **2.1.1** | A | Keyboard | axe (`scrollable-region-focusable`,`frame-focusable-content`,`server-side-image-map`) | `kbd-graph`(scan·pg/live); `keyboard-activation`(triage·el/live); `interact_and_observe`(review·el/live),`query_ax_node`(review·el/static) | — |
| **2.1.2** | A | No Keyboard Trap | — | `kbd-graph`(`detectKeyboardTraps`)(scan·pg/live); `keyboard-trap-escape`,`composite-arrow-trap`(triage·el/live); `observe_state_after_activation`,`interact_and_observe`(review·el/live) | keyboard-trap |
| **2.4.2** | A | Page Titled | axe (`document-title`) | `capture_full_page`(review·pg/static) | page-title |
| **2.4.3** | A | Focus Order | axe (`tabindex`) | `kbd-graph`(`collectTabOrder`),`order-check`,VSR(scan·pg); `positive-tabindex`(triage·el/static); `capture_full_page`(review·pg/static) | focus-order-meaning |
| **2.4.4** | A | Link Purpose (In Context) | axe (`link-name`) | `resolve_destination`(req·set/live),`query_ax_node`(enclosing context)(review·el/static) | link-purpose, link-name-equivalence |
| **2.4.6** | AA | Headings & Labels | — | `query_ax_node`,`capture_full_page`(review·—) | heading-descriptive |
| **2.4.7** | AA | Focus Visible | — | `interaction-checklist`(triage·el/live); `set_state_and_capture`(review·el/live) | focus-visible-clear |
| **2.4.10** | AAA | Section Headings | — | `capture_full_page`(review·pg/static) | section-headings |
| **3.3.1** | A | Error Identification | — | `form-error-probe`→`form-binding-runner`+`checklist`(triage·el/live); `observe_state_after_activation`,`probe_screen_reader_after_action`,`interact_and_observe`(review·el/live) | error-identification |
| **3.3.2** | A | Labels or Instructions | — | `field-label-probe`→`form-binding-runner`+`checklist`(triage·el/live) | field-label |
| **3.3.3** | AA | Error Suggestion | — | `interact_and_observe`(review·el/live) — reuses form-binding evidence | error-suggestion |
| **4.1.2** | A | Name, Role, Value | axe **owns** name-presence + aria-validity (`aria-required-attr`,`nested-interactive`,`aria-hidden-focus`,`aria-prohibited-attr`,`aria-braille-equivalent`,`aria-roledescription`,`aria-allowed-role`,`aria-dialog-name`,`aria-treeitem-name`) | `ax-state-diff`,`multipart-grouping`(triage·el); `query_ax_node`(review·el/static),`compare_iframe_content`(review·set/static) | accessible-name-adequacy, duplicate-name-equivalence, auto-update-notification |
| **4.1.3** | AA | Status Messages | — | `status-detector`(scan·pg/static); `query_ax_node`(review·el/static),`observe_state_after_activation`,`probe_screen_reader_after_action`(review·el/live) | status-message |

### Notes
- **axe-owned facets** (1.3.1 structural; 4.1.2 name/aria-legality; plus `link-name`/`document-title`/`tabindex`/keyboard priors) are subtracted from auto-PARTIAL — the tools/rubric handle only the residual *meaning/adequacy* facet. This is "route by facet, not by SC."
- **`req` (required) review tools** are provisioned as mandatory evidence regardless of LLM discretion: `render_with_overrides`@1.4.1, `ocr_image_text`@1.4.5, `compute_contrast_ratio`@1.4.3, `resolve_part_color`@1.4.11, `resolve_destination`@2.4.4. They are review-stage but harness-invoked — the orthogonality of the two axes.
- **2.1.1** has no dedicated rubric; keyboard operability is settled by the `keyboard-activation` triage tool + `kbd-graph`, with the review tools only for ambiguous activation.
- **3.3.2 / 3.3.3** share the `form-binding` evidence stack; only the rubric differs.
- **`set`-scope tools** are the ACT set-tests: `resolve_destination` (same-named links, 2.4.4) and `compare_iframe_content` (same-named iframes, 4.1.2).
