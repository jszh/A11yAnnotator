# InterA11y — design

InterA11y is a WCAG 2.2 checker for the success criteria that cannot be decided from markup alone: the ones
that need the page to be *driven* (keyboard, pointer, activation, form submission, viewport change) and/or an
*agent* that can go and get more evidence. It merges two existing systems:

- **GenA11y** (the adapter in `eval/gena11y/`): per-SC extraction of every relevant element on the page,
  one batched LLM judgment per SC with `[path: …]`-labelled markup, a short list of test rules per SC.
- **The v3 harness** (`scripts/v3/`): behaviour probes (keyboard walk, trap and focus detectors, activation
  and status observers), computed accessibility facts from CDP, exposure facts, rubrics built from ACT rules
  and the Understanding documents, and live inspection tools the judge can call.

It is a new harness, not a mode of either: it has one pipeline, one data model and one output schema.
`COMPARISON-WITH-GENA11Y.md` lists, design by design, what is adopted, modified or added relative to GenA11y.

## 1. Scope — the 12 success criteria

Chosen by two conditions: the criterion needs interaction and/or an agent that gathers evidence, **and** it has
validated labels (official ACT test cases, or the human-annotated supplementary-585 cases) so results can be
measured. Criteria without validated labels (3.3.3, 1.4.10, 1.4.11) are out.

| SC | Why it needs interaction and/or an agent | Validated cases (failed/total): ACT · 585-human | GenA11y adapter |
|---|---|---|---|
| 2.1.1 Keyboard | operability is only observable by operating: reach by Tab, activate by key, compare with pointer; arrow keys in widgets | 3/25 · — | not covered |
| 2.1.2 No Keyboard Trap | a trap exists only while focus moves | 5/16 · 27/36 | not covered |
| 2.4.3 Focus Order | the sequence, and where focus goes when UI opens | — · 30/46 | not covered |
| 2.4.7 Focus Visible | the indicator exists only in the focused state | 1/9 · — | not covered |
| 1.4.13 Content on Hover or Focus | content exists only while hovered/focused; dismiss/hover/persist are behaviours | — · 25/31 | not covered |
| 4.1.3 Status Messages | the message exists only after an action (or a timer) | — · 32/37 | not covered |
| 3.3.1 Error Identification | the error exists only after invalid input is submitted | 5/9 · 29/35 | screenshot of the resting page |
| 4.1.2 Name, Role, Value | focus reaching AT-hidden controls; state and name after operation | 66/211 · — | markup |
| 1.4.1 Use of Color | state cues per state, link cues on hover/focus, peer comparison | — · 28/42 | one screenshot |
| 2.4.4 Link Purpose | agentic: follow same-named links to their real destinations; programmatic context | 25/70 · 27/31 | markup |
| 1.4.3 Contrast (Minimum) | colours must be measured on the rendered page (text over images, overlays) | 11/34 · — | inline-style strings |
| 1.1.1 Non-text Content | agentic: look at the image (crops, zoom) and compare with its alternative | 26/94 · 42/49 | markup |

All 12 are in `categories.json`.

## 2. Principles

1. **Coverage is page-wide, from two sources.** A criterion's candidates are the union of its rule-based
   inventory (the elements its `identify()` finds from the PageModel and probes) and the elements a page-wide LLM
   *screening sweep* selects as worth testing under that criterion (§3.3a, adapted from GenA11y's per-criterion
   prompts). No sampling; a criterion that could not examine part of the page says so (`coverage` in the report),
   never reads it as a pass. The sweep only widens what is tested: it never decides a verdict.
2. **Behaviour is observed, not inferred.** Where a criterion is about behaviour, the evidence is produced by
   driving the page, and recorded as objective *observations* (harness).
3. **One criterion = one test specification** with the same four parts for every SC, modelled on the DHS
   Trusted Tester procedure: *identify* (applicability → candidates), *observe* (which probes),
   *assess* (sound deterministic rules), *judge* (rubric + tools for what the rules cannot settle).
4. **Deterministic rules decide only when sound — in both directions.** A rule may say FAIL or PASS; anything
   else is *open* and goes to the judge *with the rule's facts as evidence*. An inconclusive probe never blocks
   judgment and never counts as a pass.
5. **The judge is neutral.** No instruction to prefer either outcome. It has four answers — FAIL, PASS,
   NOT_APPLICABLE, UNDETERMINED — and the same evidence standard for FAIL and PASS: each must cite what was observed.
   UNDETERMINED is for evidence that supports neither after the tools have been used; it is reported, not
   counted as a finding.
6. **One judgment unit = one criterion on one page**, with candidates batched (GenA11y), so the judge sees
   siblings and page context; the judge can call tools to gather evidence for any candidate (harness).
7. **One time limit.** Every probe, every judge batch and every sweep call gets the same limit (default 10
   minutes), counted from when it starts its work — time spent waiting for a slot in the shared LLM pool is not
   counted against it. A step that runs out is recorded as truncated (or NO_VERDICT) and makes the criteria that
   depend on it INCOMPLETE — never PASS. Every single await on the page or a tool is bounded as well (a tool call
   at 3 minutes, closing a page at 15 s), and a whole page has a safety net (120 minutes, which must also cover its
   batches' queueing) past which it is recorded as an error. Nothing else is capped except the judge's per-batch
   tool calls.

## 3. Pipeline

```
open page (pinned 1280×900, settled)
  └─ PageModel: DOM + computed AX tree + exposure + geometry, one pass       (model/)
       └─ for each criterion in scope:
            observe: probes it needs   → observations  (memoised per page)   (probes/)
            screen: LLM sweep          → elements worth testing  } in parallel (screen/)
            identify(model, obs) ∪ screened elements → candidates           (criteria/<sc>.js, core/run-page.js)
            assess(candidate, obs)     → FAIL | PASS | NOT_APPLICABLE | OPEN (+ facts)
            judge(OPEN candidates)     → FAIL | PASS | UNDETERMINED           (judge/)
            resolve                    → CriterionResult                     (core/resolve.js)
  └─ PageReport  → corpus adapters (ACT, supplementary, saved pages)         (eval/)
```

### 3.1 PageModel (`model/page-model.js`)

Built once per page, before any probe mutates it:

- Every element in document order (light DOM, open shadow roots, same-origin frames), with a stable id, its
  XPath (shadow content is addressed as `hostXpath>>innerPath`), tag, attributes of interest, text, bounding
  box, and the opening tag (the `outerHTML` head GenA11y shows the model).
- The browser's **computed** accessibility facts per element (CDP full AX tree joined by backend node id):
  role, name, name source, description, states/properties, ignored, focusable.
- **Exposure** facts: rendered, visually hidden (sr-only), clipped out of a scroller, off-page, inert,
  aria-hidden (self or ancestor), tabindex, in the Tab sequence per the browser.
- Page facts: URL, title, viewport, document size, a viewport screenshot, and the page's visible text (shown to
  the judge with every batch, so it can look for equivalents elsewhere on the page).
- axe-core findings for the 12 criteria, attached to elements as evidence (never as verdicts).

### 3.2 Probes (`probes/`)

A probe drives the page and returns observations. Probes are shared: each runs at most once per page, and a
criterion lists which it needs. Mutating probes run on a fresh page (reloaded clone) so they cannot disturb
each other or the model; on every page navigation away is held (answered 204, so the page stays), `window.open`
is disabled, native dialogs are dismissed and recorded, and focus is emulated (many pages are open at once, and a
background page behaves differently for focus and animation frames). Every observation set carries
`completeness: complete | truncated | failed`. Every probe declares the shape of its empty result and records
what it has observed into a partial result as it goes, so a probe that runs out of time or throws still hands
the criteria everything it saw, in the same shape (and the criteria go INCOMPLETE rather than crash).

The keyboard probe photographs each stop's neighbourhood (its box plus 48 px) focused and unfocused, with CSS
transitions switched off on that walk so each image shows a final state; the whole viewport is compared only when
nothing changed in the neighbourhood (an indicator drawn elsewhere). The reverse walk and the v3 detectors run on
their own fresh pages alongside the forward walk. A stop inside a same-origin frame is addressed
`frameXpath>>frame/innerXpath`; after its unfocused photograph the walk focuses the frame, then the stop, so the next
Tab continues from there (a stop that cannot be refocused sends the next Tab to the document start, which reads as
a ring that closes without reaching the end of the page).

| Probe | Drives | Observes | Used by |
|---|---|---|---|
| `keyboard` | Tab / Shift+Tab walk of the whole ring; per stop, the focused and unfocused rendering; arrow keys inside composite widgets | stop sequence with boxes; per-stop indicator (pixel delta, style delta, camouflage, crops); traps and escapes; focus rejections; focus resting on AT-hidden elements; arrow-key movement in widgets | 2.1.1, 2.1.2, 2.4.3, 2.4.7, 4.1.2 |
| `pointer` | hover / focus of reveal triggers; Escape; pointer travel onto revealed content; dwell | revealed content per trigger; dismissible / hoverable / persistent facts; occlusion | 1.4.13, 2.1.1 |
| `activation` | keyboard (tap, then held) and pointer activation of controls on fresh pages; the page left idle for 45 s | before/after delta: AX states, revealed or inserted text, live-region membership (pre-existing or born), focus movement, dialogs opened; keyboard inside opened content | 4.1.2, 4.1.3, 2.4.3, 2.1.1, 2.1.2 |
| `forms` | at rest; empty submit and per-field invalid input on fresh pages | fields flagged invalid (native / aria / style, or drawn unlike their peers at rest), error text shown and its association, focus, native validation | 3.3.1, 4.1.3, 1.4.1 |
| `styles` | hover and focus of links; state peers; form labels | per-state link cues, property diffs between an item in a state and its peers, label colour groups, graphics crops | 1.4.1 |
| `content` | scrolls the page viewport by viewport; reads the document and every open shadow root | links with programmatic and non-programmatic context and same-name groups; text colour vs composited background, confirmed against rendered pixels; images with their alternatives and crops | 2.4.4, 1.4.3, 1.1.1 |

### 3.3 Criterion specifications (`criteria/<sc>.js` + `rubrics/<sc>.js`)

```js
module.exports = {
  sc: '2.4.7', title: 'Focus Visible',
  probes: ['keyboard'],
  identify(model, obs)    // → [{ id, xpath, kind, facts }]   applicability, page-wide, exposure-aware
  assess(candidate, obs)  // → { status: 'FAIL'|'PASS'|'NOT_APPLICABLE'|'UNDETERMINED'|'OPEN', rule, reason }
  evidence(candidate, obs)// → { facts, images }            what the judge sees for an OPEN candidate
  tools: toolsOf('2.4.7'),                      // every tool the criterion's test rules name
  screen: { select(element), scope?: 'page' },   // the sweep's element kinds (§3.3a)
};
```

**Test rules** (`rubrics/<sc>.js`, rendered by `judge/rubric.js`) are one source per criterion in GenA11y's prompt
format — *"Analyze compliance with WCAG SC … Test rules: 1. … 2. …"*:

- For the six SCs GenA11y covers, the rules are GenA11y's own `Test rules:` text, verbatim, and so is any text GenA11y
  puts between the heading and the rules (`preamble`; among these SCs only 2.4.4 has one, its pass condition: purpose
  clear from the name or from the same sentence, paragraph, list item or table cell) — except for what is not
  that criterion: removed rules and removed parts of rules are listed in each file's header (e.g. 4.1.2's "Links
  must have valid href values" and its "descriptive" names, which are 2.4.6; 1.4.3's "check text readability").
  Rules for the element kinds InterA11y also tests, and all rules for the six SCs GenA11y does not cover, are
  written in the same style and marked `from: 'added'`.
- Each rule names the **tools** that settle it or help, and carries InterA11y's **rubric** paragraph for it: when
  it fails and when it does not, each clause citing its normative source (the SC text or definitions, WCAG
  Understanding, a WCAG failure or sufficient technique, an ACT rule, a Trusted Tester step), with both sides of a
  boundary stated, and what the evidence for that rule means. A clause without such a source is not included.
- Three renderings: `rules` (the rule text alone — the screening sweep's input), `v1` (each rule plus its tools)
  and `v2` (v1 plus the rubric paragraph under each rule that names a tool). The judge gets v1 or v2
  (`INTERA11Y_RUBRIC`, default v2) — the two are an ablation of the rubric on top of GenA11y's rules and the tools.
- A criterion's candidate kinds must each fall under one of its rules; kinds without a normative basis for the
  criterion were removed (2.1.1's page keyboard shortcuts — that is 2.1.4 — and information only in a `title`
  tooltip; 4.1.2's judging of name quality — that is 2.4.6 / 2.5.3).

None of the three contains an instruction about how often to report.

### 3.3a Screening sweep (`screen/`)

A page-wide LLM pass per criterion, run alongside the probes. It is GenA11y's per-criterion detector turned into a
candidate selector:

- **Input** (as in GenA11y): the page's elements of the kinds the criterion concerns (`screen.select`: e.g. images
  for 1.1.1, text for 1.4.3, links for 2.4.4, interactive elements for the keyboard criteria), each one line
  `[path: xpath] <opening tag> text=… | role/name | box | focusability, listeners, pointer cursor, aria-hidden`,
  in chunks of about 18k tokens, one call per chunk, with the first-viewport screenshot and the criterion's test
  rules (`screen.rules`: GenA11y's rules for the six SCs it covers, written in the same style for the other six).
- **Question** (changed from GenA11y): not "which elements violate the criterion" but *which should be tested* —
  elements the criterion applies to whose conformance the information given does not already settle, whether they
  look like failures or cannot be decided. The prompt says selecting is not a verdict and that every selected
  element is tested on the running page, where it can pass or fail. It contains no instruction to avoid reporting,
  and none to over-report: clear passes and inapplicable elements are left out, likely failures and undecidable
  elements are selected.
- **Output**: `{elements:[{path, aspect}]}`; every path is joined to the PageModel (same XPath normalisation as the
  scorers). A path that matches no element is dropped and counted (`screen.unknownPaths`).
- **Page-scoped criteria** (`screen.scope: 'page'`, 2.4.3): the criterion's unit is a sequence, so the sweep's
  picks are not separate candidates — they are added as evidence to the page-level candidate (an element's place in
  a focus order is not judged apart from the order).
- **Union** (`core/run-page.js`): an element both the inventory and the sweep produce keeps its native
  candidate(s), native rules and native evidence (`origin: rules+screen`). An element only the sweep produced
  becomes a `screened` candidate (`origin: screen`). The criterion's element-level applicability (`applies`, the
  same test its inventory uses) and its sound rules for any element (`assessScreened`, e.g. 2.1.2: the Tab walk
  reached the element and moved on, in a ring that closed at the document boundary) apply to it first — the sweep
  widens what is tested, never what the criterion covers. Applicability follows the WCAG/ACT definitions, not
  proxies that only hold on typical pages: 1.1.1's "presented" is a box over 3×3 px *or* an `<object>` that
  references a resource and drew no box (it did not render here, so its size is not the author's — ACT 8fc3b6),
  and a 2D canvas with no painted pixel presents nothing; 1.4.3 excludes text inside a disabled or aria-disabled
  element or ancestor (an inactive user interface component — the SC's own exception, ACT afw4f7). Otherwise it goes to the judge (`screen/screened.js`) with the element's record, every observation any of the
  criterion's probes made about that element (found by XPath across the observations, images included), a crop of
  it from the page-load screenshot when it is in the first viewport, and the sweep's aspect, labelled as the reason
  it was selected, not a finding. The judge's tools let it observe the element live.
- **Failure**: a sweep call with no parseable answer marks `coverage.screen` truncated, which makes a criterion
  with no FAIL INCOMPLETE, as for a probe.

### 3.4 Judge (`judge/`)

- Input per call: the neutral system prompt, the criterion rubric, a batch of OPEN candidates. Each candidate
  is a card — `[path: xpath]`, opening tag, computed AX facts, the probe facts from `evidence()`, crops.
- Tools: the criterion's subset of the live inspection tools (the harness's CDP tools), executed on fresh
  pages. The judge may call them for any candidate in the batch, within a budget that scales with the batch (2
  calls per candidate, at least 4, at most 24). A rule names only tools that add evidence the candidate card does
  not already carry — the card has the computed role, name and states, so `query_ax_node` is named only where its
  extra fields matter (focus on aria-hidden content, required states). `INTERA11Y_TOOLS=0` runs the judge without
  tools (the ablation), with the rules shown without tool names. Tool observations are what a keyboard user
  would get: `set_state_and_capture` focuses by Tab (Shift+Tab, Tab), so the page is in keyboard modality and
  `:focus-visible` indicators render; `interact_and_observe` reports the focused element inside same-origin frames,
  and says when focus is inside a cross-origin frame, so focus moving among a frame's controls is not read as focus
  stuck on the frame; the tools that photograph an element (`set_state_and_capture`, `request_hi_res_crop`,
  `render_with_overrides`, `measure_text_contrast_over_image`) clip in document coordinates, which is how the
  browser reads a screenshot clip — a viewport rectangle taken after scrolling photographs another part of the page
  (before and after then compare equal, and a visible indicator reads as "no change").
- Output: one verdict per candidate `{path, verdict: FAIL|PASS|UNDETERMINED, reason, evidence}`, plus optional
  page-level findings for criteria that are page-scoped (2.4.3 sequences, 2.1.2 regions, page-wide shortcuts).
- Batches are chunked by token estimate and capped at 12 candidates, so the answer fits the output limit; an
  answer that is still cut off keeps every per-candidate verdict that completed. A transport or parse failure
  yields `NO_VERDICT` for the candidates without a verdict (recorded, never read as PASS).
- When the tool budget is spent, the final turn is sent without tool declarations (with tools declared but
  disabled the model can still attempt a call and end the turn without answering).

### 3.5 Resolution (`core/resolve.js`)

Per candidate: a rule's decision stands; otherwise the judge's verdict. A criterion FAILs on a page if any
candidate (or page-level finding) FAILs; is NOT_APPLICABLE if every candidate is; is INCOMPLETE if any candidate
is UNDETERMINED or has no verdict, or a probe (or the sweep) it depends on did not complete; otherwise PASSes. The
result lists every candidate with its status, source (`rule:<id>` or `judge`) and origin (`rules`, `screen`,
`rules+screen`), the coverage facts, the sweep's counts and the cost (judge + sweep). It also gives
`verdictWithoutScreen`, the same resolution over the rule-based candidates only — the sweep's contribution measured
within one run (the judge's batches still contained the screened candidates, so this is close to, not identical
with, a run without the sweep).

## 4. Output

`PageReport = { url, criteria: { [sc]: { verdict: FAIL|PASS|NOT_APPLICABLE|INCOMPLETE, verdictWithoutScreen,
findings:[{xpath, reason, source, origin}], candidates:[…], coverage, screen, timing, cost } } }`.

`findings` has GenA11y's violation shape (`xpath`, `reason`) so the existing element-level joins work.
Corpus adapters (`eval/`) turn page reports into the row shapes the existing scorers read:
ACT (`analyze.py`), supplementary 585 (`score-supplementary-585.js`), and the expert study (element-level
join on normalised XPath, same truth rule as `rescore-run.js`).

## 5. Evaluation

- **Validated labels only.** ACT subset cases for the 12 SCs, the human-annotated supplementary-585 cases for the
  12 SCs, and the P2–P5 expert study. The generated act-augmented pages (labels unvalidated) are used only to find
  crashes and probe defects, each confirmed by inspection, never for reported numbers.
- **Development / test split fixed before tuning** (`eval/split.js`): within each ACT rule and each 585 aspect,
  a hash-ordered quarter is development; everything else is test. Cases examined before the split existed are
  forced into development (`eval/touched-before-split.txt`). Tuning looks only at development results.
- **Comparators on the same cases:** GenA11y and the v3 harness, Gemini 3.7 Flash. The v3 harness was tuned on ACT
  and the 585; InterA11y's rules were tuned on the development split only.
