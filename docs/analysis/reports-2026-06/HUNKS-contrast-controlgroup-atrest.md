# Hunks to apply: contrast facts / control groups / at-rest error state (`llm-adjudicator.js`)

`llm-adjudicator.js` is held by the lead; these are supplied to apply, not applied here. Everything else in
all three lanes is landed:

| file | change |
|---|---|
| `scripts/v3/lib/collect-colour-peers.js` | new `collectTextContrastFacts()` + export |
| `scripts/v3/lib/collect-error-summary.js` | new `collectAtRestErrorState()` + export |
| `scripts/v3/lib/act-page-collect.js` | new `collectControlGroups()`; runs all three under `liveEval`; joins by xpath |
| `scripts/v3/tests/llm/text-contrast-facts.test.js` | 10 tests — collector, runner AGREEMENT, join, prompt |
| `scripts/v3/tests/llm/control-group-and-at-rest-signals.test.js` | 12 tests — both collectors, gates, joins |
| `scripts/v3/tests/coverage/collector-liveness.test.js` | the three new collectors added to `GUARDED_COLLECTORS` |
| `scripts/v3/tests/llm/prompt-corpus-leak.test.js` | `act-page-collect.js` added to `PROMPT_SOURCES` (still 5/5) |

**Lane 1 (contrast) needs NO hunk to work** — it emits the six keys `precomputeSignals` already reads, and is
live the moment it is merged. Hunk A is about a ROUTING side effect it causes; hunk B is optional. Lanes 2 and
3 are collected and persisted but reach no prompt until hunks C and D land, so the harness is unchanged until
then.

---

## HUNK A — recommended. The 1.4.3 rubric gate loses subjects it should keep.

`RUBRIC_GATE['contrast-over-complex-backdrop-v0']` is `(el) => !!el && el.contrastReliable !== true`. Because
`contrastReliable` was never emitted, that predicate has been unconditionally TRUE in production. Once the
collector emits it, the gate starts firing as its author intended — and drops **every** subject with a sound
ratio, including ones whose ratio FAILS.

Measured over 40 corpus pages / 1046 colour-skill subjects: 640 now carry `contrastReliable === true`; **593
of those pass their threshold and 47 fail**. Dropping the 593 is the intended FP reduction. Dropping the 47 is
an FN risk: they only reach this rubric because the deterministic runner abstained, so the LLM is the last
lane that could see them. (640/47 is an upper bound — only the subset that are 1.4.3 auto-PARTIAL obligations
actually passes this gate.)

### Anchor (currently ~line 180)

```js
  // 7a: the complex-backdrop 1.4.3 rubric is for a NON-flat backdrop ONLY — a reliably COMPUTABLE ratio is owned
  // by the deterministic text-contrast-pixel runner (Tier-0 #2). Route only when the runner abstained.
  'contrast-over-complex-backdrop-v0': (el) => !!el && el.contrastReliable !== true,
```

### Replace with

```js
  // 7a: the complex-backdrop 1.4.3 rubric is for a NON-flat backdrop ONLY — a reliably COMPUTABLE ratio is owned
  // by the deterministic text-contrast-pixel runner (Tier-0 #2). Route only when the runner abstained.
  // `contrastReliable` was dead until the collector began emitting it, so this gate was unconditionally true in
  // production; switching it on drops every subject with a sound ratio. Passing ones SHOULD be dropped — that is
  // the facet the runner owns. A sound ratio that FAILS must not be: the subject is only here because the
  // deterministic runner abstained, so this rubric is the last lane that can see it.
  'contrast-over-complex-backdrop-v0': (el) => !!el && !(el.contrastReliable === true
    && Number.isFinite(el.contrastSolid) && Number.isFinite(el.contrastThreshold)
    && el.contrastSolid >= el.contrastThreshold),
```

If you would rather take **zero** routing change this round, the fully-neutral form is
`'contrast-over-complex-backdrop-v0': () => true`, with the intent recorded in the comment. Note that
`llm-lane.test.js`'s "7a: complex-backdrop 1.4.3 rubric is SKIPPED when contrast is reliably computable" test
passes under the anchor and under HUNK A, but would fail under the fully-neutral form.

---

## HUNK B — optional. Surface the resolved BACKDROP, not only the foreground.

`s.contrast` publishes `fg` but never `bg`, so a judge is told the text colour and left to read the backdrop
off a crop — the same asymmetry that let a neighbouring control's edge be attributed to the subject. Costs
~22 bytes on subjects that have it.

### Anchor (currently ~line 394)

```js
      fg: typeof element.color === 'string' ? element.color : (typeof element.fg === 'string' ? element.fg : undefined),
```

### Replace with

```js
      fg: typeof element.color === 'string' ? element.color : (typeof element.fg === 'string' ? element.fg : undefined),
      // ...and the BACKDROP the ratio was computed against. Publishing the foreground alone still leaves the
      // backdrop to be read off a crop, which is the half that gets mis-attributed to a neighbouring control.
      bg: typeof element.effBg === 'string' ? element.effBg : (typeof element.bg === 'string' ? element.bg : undefined),
```

---

## HUNK C — 1.3.1 control-group correspondence

`element.controlGroup` does not exist anywhere before this change, so the branch cannot fire on any current
record and every existing prompt stays byte-identical.

### Anchor (currently ~line 746, immediately after the `fieldColourState` block and before the `// 3.3.1 ERROR-SUMMARY COHERENCE` comment)

```js
        + 'exists where one is needed, is yours to judge.',
    };
  }
  // 3.3.1 ERROR-SUMMARY COHERENCE — see selectRubricSubjects. Gated on threaded evidence, so a 3.3.1
```

### Insert between `}` and the `// 3.3.1 ERROR-SUMMARY COHERENCE` comment

```js
  // 1.3.1 CONTROL-GROUP CORRESPONDENCE — collected per element by act-page-collect.js, present only on a
  // member of a set that genuinely forms ONE question (radios/checkboxes sharing a control name, or sibling
  // controls none of which carries a label element / aria-label / aria-labelledby). Not a detector: it MINTS
  // nothing and changes no routing.
  //
  // WHY. Whether a visible group label has a programmatic counterpart is a fieldset/legend or
  // role=group|radiogroup + accessible-name lookup, and it reached no prompt. Its absence produced errors in
  // BOTH directions from the same judge on one page shape: on a set that WAS grouped (a radiogroup naming its
  // heading through aria-labelledby) it asserted the visible text was "NOT programmatically associated" with
  // the controls; on sets that were NOT grouped it declined to decide — "could not confirm programmatic
  // grouping", "could not complete an accessibility-tree query" — with zero tool calls made. The collector's
  // own note closes both directions; nothing further is added here.
  if ((skill === 'grouping-and-reading-order' || skill === 'forms-instructions-errors')
      && element.controlGroup && typeof element.controlGroup === 'object') {
    s.controlGroup = element.controlGroup;
  }
```

---

## HUNK D — 3.3.1 at-rest error state

`element.atRestErrorState` does not exist anywhere before this change; same byte-identity argument.

### Anchor — insert immediately after the HUNK C block (or, if C is not taken, at the same anchor as C)

```js
  // 3.3.1 THE ERROR STATE ALREADY PRESENT AT REST — collected per field by act-page-collect.js, present only
  // on a form that is not pristine as loaded (a field flagged at rest, or values already in the boxes).
  //
  // WHY. The 3.3.1 lane routes through a before/after driver. On a server-rendered redisplay that driver is
  // guaranteed to abstain — no script, novalidate, nothing to trigger — AND it destroys the evidence: the
  // retained value clears, so a transcript showing the field emptying is the probe erasing the barrier, not
  // the page passing. The barrier only ever existed in the state the page loaded in. The collector's note
  // carries that reading rule; nothing further is added here.
  if (skill === 'forms-instructions-errors' && element.atRestErrorState && typeof element.atRestErrorState === 'object') {
    s.atRestErrorState = element.atRestErrorState;
  }
```

### Byte cost

`controlGroup` ≈ 1.3 KB per subject, on ~1% of corpus pages overall / 11% of 1.3.1 pages.
`atRestErrorState` ≈ 2.0 KB per subject, on ~9% of corpus pages overall / 70% of 3.3.1 pages / 100% of the
3.3.1 form families. Both are per-SUBJECT: a subject sees its own record only.

Against that, lane 1 makes the average `color-and-visual-text` prompt **smaller**: the `contrast` signal falls
from 267 to 177 bytes per subject (−89.6), because a true two-colour statement costs less than the
178-character stub it replaces.
