# Hunks to apply: 4.1.3 multi-step timeline / live-region births / 1.4.1 colour deltas / 1.4.13 persistence (`orchestrator.js`, `llm-adjudicator.js`, `build-v3.js` + one rubric NOTE)

`llm-adjudicator.js`, `orchestrator.js` and `build-v3.js` are held by the lead; these hunks are supplied to
apply, not applied here. Everything else in all four lanes is landed:

| file | change |
|---|---|
| `scripts/v3/lib/status-detector.js` | phase-B **multi-step timeline** per trigger (bounded, budget-clamped, default 8 s horizon): every content add/remove, ordered live-region empty/refill/update, attribute/state flips (`disabled`, `aria-disabled`, `aria-busy`, `aria-expanded`, `aria-hidden`, `hidden`), value-property emptying, class/style-driven visibility flips — plus per-element **colour deltas** on row/tile-like elements. Emitted as a per-trigger SIDECAR (`result.timelines`), never as a key on the observation objects, so `statusObservations` (and every current prompt) is byte-identical. New pure export `effectiveTimelineMs`. |
| `scripts/v3/lib/run-instruments.js` | **document-start live-region birth observer** (`evaluateOnNewDocument`, installed in `runInstrumentsForUrl` before the first goto, unregistered on the way out): per region — existed-empty-before-content, mounted-after-load with content pre-filled, wired-live-after-the-fact, self-removal. Read with a bounded top-up wait (gated on an observed post-load birth). Emits `live-region-birth` REVIEW findings + `liveRegionBirths` / `statusTimelines` / `colourStateDeltas` artifacts on the instruments bundle and into `partialSink`. New exports `installLiveRegionBirthObserver`, `readLiveRegionBirths`, `birthFindingsFrom`, `colourDeltasFrom`. |
| `scripts/v3/lib/exp-runners.js` | 1.4.13 **held-state persistence probe** in `runHoverContentTri`: only when a reveal was observed AND the 1600 ms dwell passed, one re-show then samples at +1 s/+3 s/+7 s while the trigger state is held → `measurement.persistenceSamples` + `measurement.vanishedWhileHeld`. Measurement-only (typedOutcomes is a closed schema; `anyPropertyFails` untouched — the runner's det-barrier channel already over-fires on the information-invalidation exception). The pinned `H.settle(page, 1600); o.persistent =` adjacency is intact. |
| `scripts/v3/tests/runners/status-evidence-pure.test.js` | 13 pure-node tests — budget math, birth-finding mapper, colour-delta aggregation, prompt-byte-identity source pins. **RUN: 13/13 green.** |
| `scripts/v3/tests/runners/status-timeline.test.js` | 6 browser tests (invented inline fixtures): progress-pill→plain-div outcome beyond the legacy window, disabled-flip outcome, value-emptied + visibility flip, row colour delta, born-filled self-removing mount, not-installed ⇒ null. **WRITTEN, NOT RUN** (measurement-run freeze). |
| `scripts/v3/tests/runners/hover-persistence.test.js` | 3 browser tests: timed vanish while held, persistent control, dwell-failed/opt-out bounding. **WRITTEN, NOT RUN** (freeze). |
| `scripts/v3/tests/llm/prompt-corpus-leak.test.js` | re-run over the touched PROMPT_SOURCES (`status-detector.js`, `run-instruments.js`): **5/5 green.** |

**Nothing below is live until the hunks land.** The new artifacts are collected and persisted on
`bundle.instruments` the moment this merges, but they reach no prompt: `statusObservations` rows are embedded
verbatim in the status-message prompt (`obs.slice(0, CAP)` in `precomputeSignals`), which is exactly why the
timeline is a sidecar artifact rather than a new observation key — the same two-step the
controlGroup/atRestErrorState lanes used (`HUNKS-contrast-controlgroup-atrest.md`).

RCA targets: 4.1.3 `removal-of-status` case-02/04/06 + `is-it-a-status-message` (already fixed `focusMovedTo`
half) → HUNKS A+D+E + rubric NOTE; 4.1.3 `after-the-fact-live-region-timing` case-04 → HUNKS A+D+E+F;
1.4.1 `ui-status-action-color-only` case-03 → HUNKS A+D+E (colour half); 1.4.13
`persistent-auto-timeout` case-02 → HUNK C (+ the terminal-PARTIAL carve-out, Tier 1 #6, owned elsewhere).

---

## HUNK A — `orchestrator.js`: thread the three new instrument artifacts (recommended)

Follows `statusObservations`' exact path: bundle → local → `selectRubricSubjects` opts.

### Anchor (currently ~line 357)

```js
    const statusObservations = (bundle.instruments && Array.isArray(bundle.instruments.statusObservations)) ? bundle.instruments.statusObservations : null;
```

### Replace with

```js
    const statusObservations = (bundle.instruments && Array.isArray(bundle.instruments.statusObservations)) ? bundle.instruments.statusObservations : null;
    // 4.1.3 MULTI-STEP TIMELINES: the per-trigger phase-B record (every change to the ~8 s horizon, including
    // attribute/state flips the text diff cannot see). Sidecar to statusObservations by design — see
    // run-instruments.js — so the observation rows the prompt already embeds stay byte-identical.
    const statusTimelines = (bundle.instruments && Array.isArray(bundle.instruments.statusTimelines) && bundle.instruments.statusTimelines.length) ? bundle.instruments.statusTimelines : null;
    // 4.1.3 LIVE-REGION BIRTHS: document-start recorder facts (existed-empty-before-content vs born-filled).
    const liveRegionBirths = (bundle.instruments && bundle.instruments.liveRegionBirths && Array.isArray(bundle.instruments.liveRegionBirths.regions) && bundle.instruments.liveRegionBirths.regions.length) ? bundle.instruments.liveRegionBirths : null;
    // 1.4.1 POST-ACTIVATION COLOUR DELTAS: per changed row/tile-like element, before/after computed colours +
    // whether any text changed with it. Routed to the use-of-color lane (HUNK D), not to status-message.
    const colourStateDeltas = (bundle.instruments && Array.isArray(bundle.instruments.colourStateDeltas) && bundle.instruments.colourStateDeltas.length) ? bundle.instruments.colourStateDeltas : null;
```

### …and at the `selectRubricSubjects` call (currently ~line 386)

```js
    let rubricSubjects = llmAdj.selectRubricSubjects(collect, ledger, llmRubrics.rubrics, { onlyAutoPartial, confinement, contrastExempt, focusOrder, statusObservations, hoverFacets }); // llm-rubric:<id> (per SC)
```

becomes

```js
    let rubricSubjects = llmAdj.selectRubricSubjects(collect, ledger, llmRubrics.rubrics, { onlyAutoPartial, confinement, contrastExempt, focusOrder, statusObservations, statusTimelines, liveRegionBirths, colourStateDeltas, hoverFacets }); // llm-rubric:<id> (per SC)
```

---

## HUNK B — `orchestrator.js`: the timeout salvage must carry the new partialSink artifacts (recommended)

`run-instruments` publishes `statusTimelines` / `colourStateDeltas` / `liveRegionBirths` (and, already today,
`statusObservations`) into `partialSink` as they land, but both salvage objects copy only
`findings`/`tabOrder` — so a lane that times out AFTER the status sweep still loses everything else it
measured. (Note: `statusObservations` has this gap **today**; the hunk closes it for all four.)

### Anchor (currently ~lines 174–184, the `.catch` fallback and the `guard` timeout object)

```js
        .catch(() => ({ ...empty, findings: partialSink.findings.slice(), tabOrder: partialSink.tabOrder, partial: partialSink.findings.length > 0 || !!partialSink.tabOrder }));
      const guard = new Promise((resolve) => {
        timer = setTimeout(() => resolve({
          ...empty, timedOut: true,
          findings: partialSink.findings.slice(), tabOrder: partialSink.tabOrder,
          partial: partialSink.findings.length > 0 || !!partialSink.tabOrder,
        }), capMs);
      });
```

### Replace with (one shared helper keeps the two shapes identical)

```js
        .catch(() => ({ ...empty, ...salvage() }));
      const guard = new Promise((resolve) => {
        timer = setTimeout(() => resolve({ ...empty, timedOut: true, ...salvage() }), capMs);
      });
```

adding, immediately after `const partialSink = { findings: [], tabOrder: null };`:

```js
    // Everything the lane has ALREADY measured when it dies or times out. The status-sweep artifacts ride
    // here too: they land in partialSink the moment the sweep finishes, and losing them on a later phase's
    // timeout re-created exactly the S5 shape this sink exists to prevent.
    const salvage = () => ({
      findings: partialSink.findings.slice(), tabOrder: partialSink.tabOrder,
      ...(partialSink.statusObservations ? { statusObservations: partialSink.statusObservations } : {}),
      ...(partialSink.statusTimelines ? { statusTimelines: partialSink.statusTimelines } : {}),
      ...(partialSink.colourStateDeltas ? { colourStateDeltas: partialSink.colourStateDeltas } : {}),
      ...(partialSink.liveRegionBirths ? { liveRegionBirths: partialSink.liveRegionBirths } : {}),
      partial: partialSink.findings.length > 0 || !!partialSink.tabOrder,
    });
```

---

## HUNK C — `orchestrator.js`: `hoverFacets` carries the persistence samples (recommended)

The 1.4.13 facet rubrics receive `dwellMs: 1600` and are invited to reason about "a timer longer than the
window that was tested". The runner now sometimes HAS tested past the window; without this hunk that fact
stops at the experiment artifact.

### Anchor (currently ~line 374–382, inside the `hoverFacets` map builder)

```js
          nativeTitleOnly: m.nativeTitleOnly === true,
          revealMode: typeof m.revealMode === 'string' ? m.revealMode : null,
          dwellMs: HOVER_PERSIST_DWELL_MS,
```

### Replace with

```js
          nativeTitleOnly: m.nativeTitleOnly === true,
          revealMode: typeof m.revealMode === 'string' ? m.revealMode : null,
          dwellMs: HOVER_PERSIST_DWELL_MS,
          // HELD-STATE PERSISTENCE SAMPLES (when the probe ran): the revealed state at fixed offsets after a
          // fresh reveal with the trigger state held. `vanishedWhileHeld: true` = the content went away while
          // the hold demonstrably survived — a timed dismissal the dwell cannot see. NOT a verdict: the SC's
          // own "information is no longer valid" exception is content-dependent and stays the rubric's call.
          ...(Array.isArray(m.persistenceSamples) ? { persistenceSamples: m.persistenceSamples, vanishedWhileHeld: m.vanishedWhileHeld === true } : {}),
```

`persistenceSamples` does not exist on any current experiment record, so every existing hoverFacets prompt is
byte-identical until the probe produces one.

---

## HUNK D — `llm-adjudicator.js`: `selectRubricSubjects` threading

### D1 — signature (currently line ~1623)

```js
function selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial = true, confinement = null, contrastExempt = null, focusOrder = null, statusObservations = null, hoverFacets = null } = {}) {
```

becomes

```js
function selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial = true, confinement = null, contrastExempt = null, focusOrder = null, statusObservations = null, statusTimelines = null, liveRegionBirths = null, colourStateDeltas = null, hoverFacets = null } = {}) {
```

### D2 — status-message threading (anchor: the one-line gate at ~1756)

```js
    if (rub.id === 'status-message-v0' && statusObservations && statusObservations.length) extra.__statusObservations = statusObservations;
```

becomes

```js
    if (rub.id === 'status-message-v0' && statusObservations && statusObservations.length) extra.__statusObservations = statusObservations;
    // …and the phase-B evidence, threaded on the same key so auto-update-notification-v0 (same skill) stays
    // byte-identical. Timelines/births can exist where observations do not (a state-only trigger, a
    // birth with no drivable trigger), so they are gated independently.
    if (rub.id === 'status-message-v0' && statusTimelines && statusTimelines.length) extra.__statusTimelines = statusTimelines;
    if (rub.id === 'status-message-v0' && liveRegionBirths) extra.__liveRegionBirths = liveRegionBirths;
```

### D3 — use-of-color threading (anchor: the `__colourPeerGroup` block at ~1788–1792)

```js
    if (rub.id === 'use-of-color-v0') {
      const groups = (collect && collect.structure && Array.isArray(collect.structure.colourPeerGroups)) ? collect.structure.colourPeerGroups : [];
      const g = groups.find((x) => x && Array.isArray(x.members) && x.members[0] && x.members[0].xpath === baseEl.xpath);
      if (g) extra.__colourPeerGroup = g;
    }
```

append inside the same `if`:

```js
      // POST-ACTIVATION COLOUR DELTAS (instrument fact, page-level): a row/tile whose computed colours flip
      // on activation with no text change is 1.4.1's state-conveyed-by-colour-alone shape, and it is
      // invisible to every at-rest signal this rubric otherwise receives.
      if (colourStateDeltas && colourStateDeltas.length) extra.__colourStateDeltas = colourStateDeltas;
```

---

## HUNK E — `llm-adjudicator.js`: `precomputeSignals` surfacing

`element.__statusTimelines` / `__liveRegionBirths` / `__colourStateDeltas` exist nowhere before HUNK D, so
every existing prompt stays byte-identical until both land (the controlGroup argument).

### Anchor (immediately after the `s.statusObservations` block that closes at ~line 888)

```js
  }
  if (skill === 'page-structure' || skill === 'grouping-and-reading-order') {
```

### Insert between `}` and the `if`

```js
  // 4.1.3 MULTI-STEP TIMELINE — the phase-B sidecar to statusObservations (threaded by rubric id, same
  // gate). One entry per ACTIVE trigger; `timeline` is the complete ordered record of the activation.
  if (element.__statusTimelines) {
    const tls = element.__statusTimelines;
    const CAPT = 8;
    s.statusTimelines = {
      triggers: tls.slice(0, CAPT),
      count: tls.length, truncated: tls.length > CAPT,
      note: 'Per-trigger ORDERED record of everything that happened after activation, to a longer horizon '
        + 'than the single before/after observation (each row: atMs since activation + kind). Kinds: '
        + 'content-added/content-removed (with inLiveRegion/fromLiveRegion), live-region-emptied/-refilled/'
        + '-updated (a pre-existing region\'s text transitions, in order), state-change (an attribute flip '
        + 'such as disabled/aria-busy/aria-expanded — onTrigger marks the activated control itself), '
        + 'visibility-flip (a class/style-driven show/hide of pre-rendered content), value-emptied (a form '
        + 'control\'s value cleared). Read the END of the flow, not an intermediate phase: after a busy or '
        + 'progress message is removed or its region emptied, whatever conveys the OUTCOME must itself be '
        + 'announced — an outcome carried only by a content-added row OUTSIDE any live region, only by a '
        + 'state-change, or only by a visibility-flip reaches no AT. These are FACTS about what happened, '
        + 'never a verdict about what was owed.',
    };
  }
  // 4.1.3 LIVE-REGION BIRTHS — document-start recorder facts (per region, from before the first byte of
  // the document): whether it existed-and-was-empty BEFORE receiving content, or was mounted/wired with
  // its message already in place, and whether it later removed itself.
  if (element.__liveRegionBirths) {
    const b = element.__liveRegionBirths;
    s.liveRegionBirths = {
      regions: (Array.isArray(b.regions) ? b.regions : []).slice(0, 6),
      documentAgeMs: b.documentAgeMs,
      note: 'Recorded from DOCUMENT-START, so unlike every other signal it can see state from before the '
        + 'page finished loading. mountedAfterLoad + emptyAtBirth:false = the region was INSERTED already '
        + 'carrying its message (an AT observes regions that pre-existed the change, so this announces '
        + 'nothing on many AT); via:"attribute-wired" + emptyAtBirth:false = live semantics were added onto '
        + 'content that was already set (same problem); removedAtMs = the region later left the document, '
        + 'so the message may never be readable on demand. emptyAtBirth:true with a later firstContentAtMs '
        + 'is the healthy shape and corroborates correct wiring. Facts, not a verdict.',
    };
  }
  // 1.4.1 POST-ACTIVATION COLOUR DELTAS — see selectRubricSubjects (use-of-color only). Page-level
  // instrument fact: rows/tiles whose computed colours changed when a control was activated.
  if (element.__colourStateDeltas) {
    s.colourStateDeltas = {
      deltas: element.__colourStateDeltas.slice(0, 8),
      note: 'Deterministic post-activation measurement: activating `trigger` changed this element\'s '
        + 'computed background/colour from the before value to the after value. textAlsoChangedNearby says '
        + 'whether any TEXT was also added in or around the element in the same window. A state change '
        + 'conveyed ONLY by such a colour flip (textAlsoChangedNearby:false, and no other persistent visual '
        + 'cue in the crop) is information conveyed by colour alone. The at-rest screenshot CANNOT show any '
        + 'of this — judge the delta, not the crop. Facts, not a verdict.',
    };
  }
```

---

## HUNK F — `build-v3.js`: a birth-only page must mint the page-level 4.1.3 obligation

The after-the-fact family is activation-free (a `setTimeout` mount), so the `status-change-observed` gate
never opens for it; the birth REVIEW row is the gate that should. Two one-line widenings, same predicate both
places.

### F1 — Rule-16 parity carve-out (anchor ~lines 161–164)

```js
    if (xpath === oracle.PAGE_STATUS_MESSAGE_XPATH) {
      return fam === 'status-message' && !!(bundle.instruments && Array.isArray(bundle.instruments.findings)
        && bundle.instruments.findings.some((f) => f && f.sc === '4.1.3' && f.kind === 'status-change-observed'));
    }
```

becomes

```js
    if (xpath === oracle.PAGE_STATUS_MESSAGE_XPATH) {
      // `live-region-birth` joins the gate: a region born with its content is a status change the ACTIVATION
      // sweep can never observe (nothing was activated), recorded by the document-start birth observer.
      return fam === 'status-message' && !!(bundle.instruments && Array.isArray(bundle.instruments.findings)
        && bundle.instruments.findings.some((f) => f && f.sc === '4.1.3' && (f.kind === 'status-change-observed' || f.kind === 'live-region-birth')));
    }
```

### F2 — the mint gate itself (anchor ~lines 614–616)

```js
  const statusObservedRows = (bundle.instruments && Array.isArray(bundle.instruments.findings))
    ? bundle.instruments.findings.filter((f) => f && f.sc === '4.1.3' && f.kind === 'status-change-observed')
    : [];
```

becomes

```js
  const statusObservedRows = (bundle.instruments && Array.isArray(bundle.instruments.findings))
    ? bundle.instruments.findings.filter((f) => f && f.sc === '4.1.3' && (f.kind === 'status-change-observed' || f.kind === 'live-region-birth'))
    : [];
```

Risk note: `live-region-birth` rows only exist on pages where the document-start recorder saw a region
mounted-after-load with content (or wired-after-the-fact) — rare by construction, so the aperture widening is
bounded the same way the `status-change-observed` gate is.

---

## NOTE — `status-message-v0.md` (rubric change; the lead applies — no rubric is owned by this batch)

Insert a new numbered item into the "**WHAT ACTUALLY HAPPENED — `signals.statusObservations`**" reading list
(after item 3, renumbering 4–5), so the timeline is read exactly where the removal/emptied facts already are:

> 4. **`signals.statusTimelines` present ⇒ judge the WHOLE flow, in order, and ask the outcome question:
>    after a busy/progress message is removed (a `content-removed` or `live-region-emptied` row), is the
>    OUTCOME of the operation conveyed to AT at any later `atMs`?** The outcome is conveyed only by a later
>    row INSIDE a live region (`content-added` with `inLiveRegion: true`, or a `live-region-updated`/
>    `live-region-refilled` row), or by focus moving into the new content (the observation's focus facts).
>    An outcome carried ONLY by a `content-added` row OUTSIDE any live region, ONLY by a `state-change` row
>    (for example a control's disabled state clearing when the operation finishes), or ONLY by a
>    `visibility-flip`, reaches no AT — **that is a barrier**, and it is invisible to a single before/after
>    observation, which is exactly why these pages were being cleared. *Guards:* a removal that conveys
>    nothing new (a toast expiring after its message was announced) is NOT a barrier — same test as the
>    `removedText` item above; and judge the state at the END of the recorded flow, not an intermediate
>    phase.

And one sentence appended to the reading list's item 1 (the `regionsBornWithContent` item):

> When `signals.liveRegionBirths` is present it extends this check to regions the ACTIVATION sweep could
> never see: a region with `mountedAfterLoad` and `emptyAtBirth: false` was inserted already carrying its
> message with no user action at all, and `removedAtMs` means it then removed itself — announced by nothing
> and unreadable on demand. `emptyAtBirth: true` with a later `firstContentAtMs` is the healthy shape and
> corroborates a clear.

(Leak check: all wording above is generic — no corpus family names, prose, or ground-truth references; the
`prompt-corpus-leak` suite covers the rubric file once edited.)

---

## Byte cost (per page, on top of the instruments artifact; prompt cost only after HUNKS D+E)

| artifact | size | incidence |
|---|---|---|
| `statusTimelines` | ~70–130 B/entry, 3–8 entries typical per ACTIVE trigger (cap 40/trigger ⇒ ~5 KB worst) ⇒ **~0.5–2 KB typical** | only pages with a trigger that did something (≈ the 4.1.3/3.3.1 families; near-zero elsewhere) |
| `colourStateDeltas` | ~150–200 B/delta, cap 12/trigger ⇒ **~0.2–0.6 KB typical** | only activations that flip a row/tile's computed colours |
| `liveRegionBirths` | ~200 B/region, cap 40 ⇒ **~0.2–0.8 KB typical**; + `live-region-birth` findings ~400 B each (cap 6) | every ForUrl page carries the (tiny) header; regions only where live regions exist |
| `measurement.persistenceSamples` | 3 samples ≈ **~150–200 B** | only reveal-observed 1.4.13 experiments whose dwell passed |
| prompt (post-hunk) `s.statusTimelines` | cap 8 triggers ⇒ **~1–2 KB typical, ~8 KB worst** | status-message-v0 subjects only |
| prompt (post-hunk) `s.liveRegionBirths` / `s.colourStateDeltas` | **~0.5–1.5 KB** each | status-message-v0 / use-of-color-v0 subjects only |

Wall-clock: phase B adds up to ~5.5 s per ACTIVE trigger, clamped by the existing 15 s sweep budget
(`effectiveTimelineMs` — later triggers degrade to the legacy window rather than starve); the birth top-up
adds ≤7 s ONLY on pages that demonstrably mounted a region after load; the persistence probe adds ≤~7.5 s
ONLY on reveal-observed 1.4.13 triggers whose dwell passed (inside the experiment's 30 s wall).

## Pending (browser-gated — the measurement-run freeze forbids launches right now)

1. `node --test scripts/v3/tests/runners/status-timeline.test.js` (6 tests)
2. `node --test scripts/v3/tests/runners/hover-persistence.test.js` (3 tests)
3. the existing instrument suites that exercise the touched paths: `status-detector.test.js`,
   `status-focus-and-reveal-restore.test.js`, `instruments-pipeline.test.js`, `experiments.test.js` (C9),
   `collector-liveness.test.js`
4. after the hunks land: the LLM-lane holdout policy applies (rubric changed ⇒ targeted 4.1.3/1.4.1/1.4.13
   slices only, per the holdout-gate policy), plus one deterministic ACT pre/post to confirm byte-identity
   everywhere the new gates do not fire.
