# Hunk to apply: `fieldColourState` signal wiring (llm-adjudicator.js)

Owner of this file is `regression-triage`; this hunk is supplied for the lead to apply, not applied here.

Everything else in the lane is already landed:

| file | change |
|---|---|
| `scripts/v3/lib/collect-colour-peers.js` | new `collectFieldColourState()` page-side collector (self-contained) + export |
| `scripts/v3/lib/act-page-collect.js` | runs it under `liveEval`, joins by xpath, attaches `el.fieldColourState` |
| `scripts/v3/llm-rubrics/use-of-color-v0.md` | reads the signal; deletes the two prose blocks it replaces |
| `scripts/v3/tests/llm/field-colour-state-signal.test.js` | pins collector + this hunk + prompt byte-identity |

Until the hunk lands the collector output is collected and persisted but never reaches a prompt, so the
harness is unchanged. `field-colour-state-signal.test.js` has one test that fails until it is applied
(`precomputeSignals surfaces fieldColourState …`); the other seven pass either way.

## Anchor

Insert immediately **after** the closing brace of the `element.__colourPeerGroup` block and **before** the
`// 3.3.1 ERROR-SUMMARY COHERENCE` comment. Match on this (currently ~line 647):

```js
        + '(a label, a legend entry attached to each item, an accessible name).',
    };
  }
  // 3.3.1 ERROR-SUMMARY COHERENCE — see selectRubricSubjects. Gated on threaded evidence, so a 3.3.1
```

## Insert

```js
  // 1.4.1 THE FIELD'S OWN RESOLVED COLOURS AND STATE (residual RCA S10) — collected per element by
  // act-page-collect.js, present ONLY on a form field whose form is not colour-uniform. Not a detector: it
  // MINTS nothing and changes no routing; it supplies the counter-fact a colour judgment needs.
  //
  // WHY. A 1.4.1 form-field subject arrived with no colour facts at all — `s.contrast` is a stub on this
  // collector (it never emits color/effBg), so the only source for "is this field red / is it in the error
  // state" was the crops. The `surrounding-region` crop is a RECTANGLE: on a two-column row it carries the
  // NEIGHBOURING field's border. Measured — a default-state input beside an invalid one was reported as
  // having a "red LEFT border ... sole error indicator" on a page whose markup gives it no error class and
  // no aria-invalid. The judge was not inventing a colour, it was ATTRIBUTING a real pixel to the wrong
  // element, and nothing in the prompt could contradict it. A rubric prohibition cannot fix that; the
  // element's own computed style can.
  if (skill === 'color-and-visual-text' && element.fieldColourState && typeof element.fieldColourState === 'object') {
    s.fieldColourState = {
      ...element.fieldColourState,
      uncertainReason: 'these are THIS element\'s OWN computed values, read off its resolved style — they are '
        + 'AUTHORITATIVE over the crops for what colour it is and what state it is in. The surrounding-region '
        + 'crop is a rectangle and on a multi-column form it contains the EDGES OF NEIGHBOURING FIELDS, so a '
        + 'coloured border seen near this element may belong to the control beside it; if no side of `border` '
        + 'carries that colour, this field does not have it. `errorStated`/`requiredStated`/`state.*` are what '
        + 'the page programmatically says about THIS field. `sameAppearanceAs` are the peers rendering exactly '
        + 'as it does and `differentAppearanceFrom` the rest, each with its own `errorStated` and `nonColourCue` '
        + '— a field matching the peers that carry no cue, and differing from the peers stated to be in a state, '
        + 'is in the DEFAULT state, which is not a colour-alone failure. `labelColourContrasts` is the MEASURED '
        + 'luminance separation from each other label colour in the set; use it instead of estimating a ratio. '
        + 'These are FACTS, not a verdict: whether the colour carries INFORMATION, and whether a non-colour cue '
        + 'exists where one is needed, is yours to judge.',
    };
  }
```

## Why the gate is safe

`element.fieldColourState` does not exist anywhere before this change, so the branch cannot fire on any
current record and every existing prompt stays byte-identical. `skill === 'color-and-visual-text'` keeps it
off the other skills that could ever see a form field. Byte-identity is asserted by
`field-colour-state-signal.test.js` (`prompt is byte-identical …`), which hashes `buildPrompt` for a field
element with the key deleted.
