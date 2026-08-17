# Hunks to apply: keyboard one-way confinement gate (`run-instruments.js` / `orchestrator.js` / `llm-adjudicator.js` / `build-v3.js`)

The four carrier files are held by the lead; these are supplied to apply, not applied here. Everything else in
the lane is landed:

| file | change |
|---|---|
| `scripts/v3/lib/kbd-graph.js` | FIX 1 composite-input tab-ring wrap guard (`SEGMENTED_PRESS_CAP`, `probeActive.segmented`); FIX 2 backward-gate mirrored in `detectFixedSetConfinementTraps` (confinement required only from the first in-S backward stop onward, transient-reach guard sliced to match); FIX 3 `onewayTraps` (kind `keyboard-trap-oneway`, `review:true`, direction + members + unreached focusables capped at 5) emitted when confinement holds forward only; FIX 4 `tryAdvised` widened to verb-first phrasing + multi-modifier combos |
| `scripts/v3/llm-rubrics/keyboard-trap-v0.md` | new "One-way confinement (REVIEW branch)" — reads `signals.keyboardTrap.oneway`, applies TT 4.C's required-interaction exception, keyboard-verifiable only |
| `scripts/v3/tests/runners/kbd-composite-tab-ring.test.js` | 2 tests — full ring on a segmented-input page; non-segmented wrap unchanged |
| `scripts/v3/tests/runners/kbd-confinement-oneway.test.js` | 5 tests — backward-gate mirror confirm; Escape guard under the mirror; one-way REVIEW emission incl. unreached list; verb-first+multi-mod advisory `clear`; press-first+multi-mod `lying` |

**What is live already, with NO hunk:** FIX 1 (the `collectTabOrder` ring is consumed everywhere as-is — this is
the 2.4.3 one-stop-ring FP fix), FIX 2 and FIX 4 (both flow through the existing `keyboard-trap-confinement`
lane in `run-instruments.js`: more genuine both-direction traps now confirm, and a verb-first / multi-modifier
advisory can now produce `clear` (suppression) or `lyingAdvisory` (deterministic barrier promotion in
`build-v3.js`)). **The two ACT 80af7b keyboard-trap rows are therefore a watch item for the next ACT gate run.**

**What is inert until the hunks land:** FIX 3. `detectFixedSetConfinementTraps` returns `onewayTraps`, but
`run-instruments.js` reads only `.traps` (as does `broad-scope-probes.js`), so the finding reaches no artifact,
no ledger, and no prompt. Each hunk below preserves that inertness argument for the pieces after it: A carries
the finding, B routes it, C surfaces it, D gives it an obligation to land on where the oracle enumerated none.

Target RCA rows (`RCA-residual-s10-full.md` §2.1.2 / §2.4.3): `multi-element-region-loop-tab-must-exit/case-01`
and `case-04` (one-way lane), `esc-standard-exit-method-no-advice-owed/case-03` (backward gate + advisory
grammar), `input-gate-required-interaction-exception/case-05` (partial — gate relaxation via the one-way
observation), `multiple-valid-orders-row-vs-column/case-05` (composite-input ring FP).

---

## HUNK A — REQUIRED. `run-instruments.js`: carry `onewayTraps` into the findings channel.

### Anchor (currently ~line 259–276, the `if (confine) { … }` block)

```js
    add('keyboard-trap', confineRows);
  }
```

### Replace with

```js
    add('keyboard-trap', confineRows);
    // ONE-WAY confinement (REVIEW, never a barrier): a forward loop that walls off later content while the
    // other direction still escapes. TT 4.C counts "restricted to a small section … no way to navigate out of
    // the loop" as a failure and lists backward navigation only as a tester workaround — but 4.C's
    // required-interaction exception (a section that genuinely requires input before releasing focus) is
    // semantic, so this routes to keyboard-trap-v0 and never mints on its own. Fan out over the members like
    // the full confinement above so the rubric gate can key on any member xpath.
    const onewayRows = [];
    for (const t of (confine.onewayTraps || [])) {
      const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
      const seenOw = new Set();
      for (const xpath of members) {
        if (!xpath || seenOw.has(xpath)) continue; seenOw.add(xpath);
        onewayRows.push({ sc: t.sc, kind: 'keyboard-trap-oneway', detector: 'confinement', review: true, xpath,
          memberXpaths: t.memberXpaths, setSize: t.setSize, direction: t.direction || 'forward',
          unreached: Array.isArray(t.unreached) ? t.unreached : [], unreachedCount: t.unreachedCount,
          detail: `focus is confined to a fixed set of ${t.setSize} element(s) in the ${t.direction || 'forward'} Tab direction only: ${t.unreachedCount} rendered focusable(s) outside the set are never reached in that direction, though focus escapes the other way. A 2.1.2 barrier UNLESS the section genuinely requires input or interaction — completable by keyboard — before allowing focus to progress, or a documented exit key works; the keyboard-trap rubric decides which.` });
      }
    }
    add('keyboard-trap', onewayRows);
  }
```

The `detail` string is prompt-bound (`run-instruments.js` is in the leak gate's `PROMPT_SOURCES`); the text
above is generic and passes `prompt-corpus-leak.test.js` phrasing rules (no corpus family, no GT statement).

---

## HUNK B — REQUIRED. `orchestrator.js` (~line 309–321): let the one-way finding (and the C5 experiment's
one-way observation) satisfy the keyboard-trap routing map.

The map built here is the single input to BOTH adjudicator gates — the rows carve-out
(`llm-adjudicator.js:1641`) and the `keyboard-trap-v0` subject gate (`:1758` — `const conf =
confinementFor(row.xpath); if (!conf) { seen.delete(key); continue; }`). Once the map carries one-way entries,
**neither adjudicator gate needs any edit**: `confinementFor` simply returns the entry.

### Anchor

```js
    const confinement = (() => {
      const findings = (bundle.instruments && Array.isArray(bundle.instruments.findings)) ? bundle.instruments.findings : [];
      const map = {};
      for (const f of findings) {
        if (!f || f.kind !== 'keyboard-trap-confinement' || !f.review || !f.xpath) continue;
        const members = (Array.isArray(f.memberXpaths) && f.memberXpaths.length) ? f.memberXpaths : [f.xpath];
        if (!map[f.xpath]) map[f.xpath] = { members: members.map((x) => ({ xpath: x })), setSize: f.setSize || members.length };
      }
      return Object.keys(map).length ? map : null;
    })();
```

### Replace with

```js
    const confinement = (() => {
      const findings = (bundle.instruments && Array.isArray(bundle.instruments.findings)) ? bundle.instruments.findings : [];
      const map = {};
      for (const f of findings) {
        if (!f || !f.review || !f.xpath) continue;
        const oneway = f.kind === 'keyboard-trap-oneway';
        if (f.kind !== 'keyboard-trap-confinement' && !oneway) continue;
        const members = (Array.isArray(f.memberXpaths) && f.memberXpaths.length) ? f.memberXpaths : [f.xpath];
        if (!map[f.xpath]) {
          map[f.xpath] = { members: members.map((x) => ({ xpath: x })), setSize: f.setSize || members.length };
          // ONE-WAY facts ride into the subject's signals (HUNK C): direction + the walled-off focusables are
          // exactly what the rubric's REVIEW branch reasons over.
          if (oneway) map[f.xpath].oneway = { direction: f.direction || 'forward',
            unreached: Array.isArray(f.unreached) ? f.unreached : [],
            unreachedCount: Number.isFinite(f.unreachedCount) ? f.unreachedCount : (Array.isArray(f.unreached) ? f.unreached.length : 0) };
        }
      }
      // …and the keyboard-trap-escape EXPERIMENT's blocked-Tab / one-way observation (C5 `oneWayConflict`:
      // Tab and Shift+Tab disagree, no Esc / advised escape — exp-runners.js:1205). Same genuinely-uncertain
      // shape, so it satisfies the same gate; the experiment has no member set, so the row is its own anchor.
      for (const e of (experiments && Array.isArray(experiments.results) ? experiments.results : [])) {
        if (!e || e.experimentId !== 'keyboard-trap-escape' || e.sc !== '2.1.2' || !e.targetXpath) continue;
        const m = e.measurement || {};
        if (m.oneWayConflict !== true || map[e.targetXpath]) continue;
        map[e.targetXpath] = { members: [{ xpath: e.targetXpath }], setSize: 1,
          oneway: { direction: m.tabEscapes === false ? 'forward' : 'backward', unreached: [], unreachedCount: 0 } };
      }
      return Object.keys(map).length ? map : null;
    })();
```

`experiments` is already in scope (it is read ~15 lines below in the `contrastExempt` builder). Routing-volume
caveat: `oneWayConflict` also fires on an editor-ish control that swallows Tab in one direction; that adds LLM
subjects (REVIEW only, never barriers). If the first measured run shows flooding, drop the experiment loop —
the findings half of the hunk is the one the RCA cases need.

---

## HUNK C — REQUIRED. `llm-adjudicator.js` (~line 418–426): surface the one-way facts in
`signals.keyboardTrap`.

`__confinement.oneway` does not exist until HUNK B lands, so every existing prompt stays byte-identical under
this hunk alone; the both-direction `uncertainReason` string below is unchanged from the anchor.

### Anchor

```js
    if (element.__confinement && Array.isArray(element.__confinement.members)) {
      s.keyboardTrap = {
        members: element.__confinement.members,
        setSize: element.__confinement.setSize,
        uncertainReason: 'a deterministic probe confirmed focus is CONFINED to these elements (cannot leave by Tab, Shift+Tab, or Escape, and an element outside the set is never reached). This is a 2.1.2 barrier UNLESS the user is told how to escape (a non-standard key, possibly behind a help control) AND that key works. Activate each member with observe_state_after_activation to reveal any escape instructions, then drive a focus-then-press sequence with interact_and_observe (actions:[{op:focus,xpath:member},{op:press,key:"Ctrl+M"}]) and read the press step.activeAfter — if it is OUTSIDE this set the key freed focus, otherwise it did nothing. Undocumented or non-working ⇒ REPRODUCED.',
      };
    }
```

### Replace with

```js
    if (element.__confinement && Array.isArray(element.__confinement.members)) {
      const ow = (element.__confinement.oneway && typeof element.__confinement.oneway === 'object') ? element.__confinement.oneway : null;
      s.keyboardTrap = {
        members: element.__confinement.members,
        setSize: element.__confinement.setSize,
        ...(ow ? { oneway: ow } : {}),
        uncertainReason: ow
          ? ('a deterministic sweep observed ONE-WAY confinement: sequential navigation in the ' + (ow.direction || 'forward') + ' direction loops focus inside these elements, and ' + (Number.isFinite(ow.unreachedCount) ? ow.unreachedCount : (ow.unreached || []).length) + ' rendered focusable(s) outside the set were never reached in that direction (focus DOES escape the other way — a tester workaround, not a pass, per TT 4.C). Apply the rubric\'s one-way REVIEW branch: a section that genuinely requires input or interaction — completable by keyboard — before allowing focus to progress is NOT a failure; a loop that merely walls off later content with no advertised working exit IS. Verify behaviorally with observe_state_after_activation and interact_and_observe exactly as for a full confinement.')
          : 'a deterministic probe confirmed focus is CONFINED to these elements (cannot leave by Tab, Shift+Tab, or Escape, and an element outside the set is never reached). This is a 2.1.2 barrier UNLESS the user is told how to escape (a non-standard key, possibly behind a help control) AND that key works. Activate each member with observe_state_after_activation to reveal any escape instructions, then drive a focus-then-press sequence with interact_and_observe (actions:[{op:focus,xpath:member},{op:press,key:"Ctrl+M"}]) and read the press step.activeAfter — if it is OUTSIDE this set the key freed focus, otherwise it did nothing. Undocumented or non-working ⇒ REPRODUCED.',
      };
    }
```

No other `llm-adjudicator.js` edit is needed: the rows carve-out (`:1641`) and the subject gate (`:1758`) both
call `confinementFor`, which is fed by HUNK B.

---

## HUNK D — REQUIRED for 3 of the 5 RCA FNs. `build-v3.js` (~line 497–509 + the `obligations` spread at ~612):
mint the OBLIGATION (never a barrier) for a review confinement/one-way finding the oracle did not enumerate.

Why: `no-keyboard-trap` is enumerated only for `focusable && (inModal || focusRisk)`
(`applicability-oracle.js:319`), and the RCA's one-way pages (`role="group"` clusters of plain buttons) mint
nothing — `esc-standard…/case-03` and both `multi-element-region…` cases scored **0 obligations**, so even with
HUNKS A–C the gate would have no ledger row to keep. The existing keystone mint (`trapMintedObligations`) is
built from `!f.review` rows only and PROMOTES a barrier, so it must not be widened. This mints the obligation
alone: no observation, no barrier — disposition proceeds normally and the `:1641` carve-out keeps the row in
the LLM lane regardless of its autoPartial state. Do **NOT** add `keyboard-trap-oneway` to
`INSTRUMENT_BARRIER['2.1.2'].kinds` — that would promote a REVIEW finding to a deterministic barrier, the exact
unsoundness the a1b64e guard comment above that table warns about.

**Scope is deliberately `keyboard-trap-oneway` ONLY.** `scripts/v3/tests/coverage/rootcause-round2-2026-08-16.test.js`
carries two S1 GUARD tests asserting that a `keyboard-trap-directional` review row and a review
`keyboard-trap-confinement` row mint NOTHING — both are user-approved design decisions and both stay green under
this hunk exactly as written, because neither kind is minted here. (A review confinement on a non-enumerated
element remains un-routed, as today; that gap, if it matters, is a separate decision.) The lead should add a
companion S1-style test when applying: a `keyboard-trap-oneway` review finding mints exactly one 2.1.2
obligation that carries NO barrier/cleared disposition.

Note `esc-standard…/case-03` does not need this mint: with FIX 2 + FIX 4 (live in the detector now) its
both-direction trap with a parsed advisory resolves deterministically — a working advertised combo clears it, a
non-working one is `lyingAdvisory`, which is `review:false` and takes the EXISTING keystone mint + promotion.

### Anchor (immediately after the `trapMintedObligations` loop closes, ~line 509)

```js
    trapMintedObligations.push({ obligationId: id, xpath, sc: o.sc, claimFamily: o.claimFamily });
  }
```

### Replace with

```js
    trapMintedObligations.push({ obligationId: id, xpath, sc: o.sc, claimFamily: o.claimFamily });
  }
  // ONE-WAY obligation mint (keyboard-trap-oneway ONLY — see the scope note in the hunk doc): the finding is
  // REVIEW — it must never promote a barrier, and the trapObs guard above keeps it out of that loop — but on a
  // page the oracle did not enumerate (no inModal/focusRisk member) there is also NO ledger row, so
  // keyboard-trap-v0 has nothing to run on and the finding evaporates. Mint the OBLIGATION ONLY: no
  // observation is attached, nothing is decided here; the adjudicator's confinement carve-out routes the row
  // to the rubric, which owns the TT 4.C required-interaction question. `keyboard-trap-directional` and a
  // review `keyboard-trap-confinement` still mint NOTHING (S1 GUARD tests, user-approved).
  const reviewTrapMintedObligations = [];
  if (bundle.instruments && Array.isArray(bundle.instruments.findings)) {
    for (const f of bundle.instruments.findings) {
      if (!f || f.review !== true || f.sc !== '2.1.2' || !f.xpath) continue;
      if (f.kind !== 'keyboard-trap-oneway') continue;
      const id = oracle.oblId(f.xpath, '2.1.2', 'no-keyboard-trap');
      if (existingOblIds.has(id) || seenChk.has(id) || seenAxe.has(id) || seenDet.has(id) || seenTrap.has(id)) continue;
      seenTrap.add(id);
      reviewTrapMintedObligations.push({ obligationId: id, xpath: f.xpath, sc: '2.1.2', claimFamily: 'no-keyboard-trap' });
    }
  }
```

### …and add the new array to the obligations spread (~line 612)

```js
  const obligations = [...staticObligations, ...dynamicObligations, ...checkerObligations, ...axeDecidedObligations, ...detBarrierObligations, ...trapMintedObligations, ...reviewTrapMintedObligations, ...confusableObligations, ...sequenceObligations, ...statusObligations, ...colourGroupObligations];
```

(If `bundle` / `oracle` / the `seen*` sets are named differently at the final anchor position, keep the local
names — the loop body is the contract, not the identifiers.)

---

## Order and blast radius

Apply A → B → C → D (each is inert without its predecessor; D is independent of C but pointless without A+B).
After all four: a one-way loop produces a REVIEW finding → an obligation (minted if needed) → a
keyboard-trap-v0 subject whose `signals.keyboardTrap.oneway` carries direction + unreached elements → the
rubric's one-way branch decides under TT 4.C. Nothing in the chain can mint a deterministic barrier; the only
authoritative 2.1.2 promotions remain the pre-existing confirmed-trap kinds and `lyingAdvisory`.

Validation to schedule with the lead's gate: the ACT 80af7b keyboard-trap rows (FIX 2 + FIX 4 are live in the
detector NOW, hunks or no hunks) and, once A–D land, a targeted 2.1.2 slice per the LLM holdout-gate policy
(the rubric changed).
