# Hunks to apply: revealed-state embedded-format + confinement traps (`run-instruments.js`)

The carrier file is held by the lead; this hunk is supplied to apply, not applied here. Everything else in
the lane is landed in `scripts/v3/lib/kbd-graph.js` (sole-owner file):

| file | change |
|---|---|
| `scripts/v3/lib/kbd-graph.js` | `detectTrapsAfterReveal` now runs `detectEmbeddedFormatTraps` and `detectFixedSetConfinementTraps` in the revealed state, after the two original detectors. Return shape is ADDITIVE: `{ opener, embedTraps }` / `{ opener, confinement }` alongside the existing `{ opener, traps }` / `{ opener, selfTraps }`. Confirmed-authority results (region trap, self-refocus, SAME-ORIGIN embed trap, LYING-advisory confinement) return immediately; review-grade results (cross-origin/directional embed, advisory-possible confinement, one-way loops) are held in `firstReview` and returned only when no opener yields anything confirmed. |
| `scripts/v3/tests/runners/kbd-reveal-embedded-trap.test.js` | browser tests (WRITTEN, NOT RUN — measurement run in flight): srcdoc-in-hidden-modal trap confirmed after reveal; non-confining srcdoc control yields null; escapable APG modal yields null |
| `scripts/v3/tests/coverage/reveal-embedded-trap-lane.test.js` | pure-node source pins (RUN green): detector order, confirmed-wins gates (`sameOrigin === true` / `lyingAdvisory === true`), held-review return, at-rest emission untouched |

**Mechanism this fixes** (`RCA-residual-s10-full.md` §2.1.2, `modal-popover-legitimate-containment-vs-trap/case-06`,
0/3): a hard F10 trap inside a same-origin `srcdoc` iframe inside a `display:none` modal. At rest every
detector correctly declines (2 rendered focusables; the iframe's rect is 0×0 inside the hidden scrim). After
the reveal pass opens the modal, `detectKeyboardTraps` DOES nominate the dialog and DOES observe both-direction
confinement through the iframe — and then clears it, because its Esc probe calls `focusFirstIn` (reset to the
region's first focusable in the PARENT document) before pressing Escape, where the parent's Escape handler
works. The trapped user is INSIDE the frame, where the keydown never reaches the parent document. Only
`detectEmbeddedFormatTraps` presses Escape from inside the boundary, and it never ran in the revealed state.
`detectFocusRetentionTraps` also cannot see it (the confined element is the untagged `<iframe>`, so
`activeFocId` reads `''` for the whole confined tail).

**What is live already, with NO hunk:** nothing new-facing. `detectTrapsAfterReveal`'s existing consumers read
only `revealed.traps.traps` and `revealed.selfTraps.traps` (`run-instruments.js:421,425`), so the new
`embedTraps` / `confinement` keys reach no artifact, no ledger, and no prompt until the hunk lands. The only
behavioral delta without the hunk is the held-review return: a `firstReview` result carries neither `traps` nor
`selfTraps`, so the current emission block simply appends no findings for it — inert, not wrong.

**Provenance contract (deliberate):** the emission below reuses the EXISTING kinds and review flags of the
at-rest lane (`keyboard-trap` with `review: sameOrigin !== true`, `keyboard-trap-directional` review,
`keyboard-trap-confinement` `review: !lyingAdvisory`, `keyboard-trap-oneway` review) plus the existing
`(revealed by activating …)` detail suffix. No new provenance scheme, no build-v3 change: the S1 mint loop
(`build-v3.js:500-508`) promotes the same-origin revealed embed trap exactly as it promotes the at-rest one
(`!f.review` + kind `keyboard-trap`), the oneway OBLIGATION-ONLY mint (`build-v3.js:516-526`) keys on kind
alone, and the S1 guards (directional / review-confinement mint NOTHING) inherit unchanged.

---

## HUNK A — REQUIRED. `run-instruments.js`: emit the revealed-state embed + confinement results.

### Anchor (currently lines ~419-429, inside `if (revealed) { … }` in `runInstrumentsForUrl`)

```js
        for (const t of ((revealed.selfTraps && revealed.selfTraps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-self-refocus', xpath: t.xpath, review: false,
            detail: 'confirmed keyboard trap: this focusable re-grabs its own focus on blur' + via });
        }
        if (opts.partialSink) opts.partialSink.findings = res.findings.slice();
```

### Replace with

```js
        for (const t of ((revealed.selfTraps && revealed.selfTraps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-self-refocus', xpath: t.xpath, review: false,
            detail: 'confirmed keyboard trap: this focusable re-grabs its own focus on blur' + via });
        }
        // EMBEDDED-FORMAT traps found in the REVEALED state (F10 — e.g. a KYC widget iframe inside a modal
        // that is display:none at rest). Same kinds and review semantics as the at-rest embed emission above:
        // a cross-origin embed cannot be counted, so its budget was a guess and the row stays review.
        for (const t of ((revealed.embedTraps && revealed.embedTraps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap', xpath: t.xpath,
            review: t.sameOrigin !== true,
            detail: `confirmed keyboard trap (WCAG F10): focus enters this ${t.kind} and cannot leave by Tab, Shift+Tab, or Escape`
              + (Number.isFinite(t.innerFocusables) ? ` (${t.innerFocusables} focusable element(s) inside; the walk allowed for all of them)` : ' (cross-origin — inner focusables could not be counted, so this is a REVIEW signal)')
              + via });
        }
        for (const t of ((revealed.embedTraps && revealed.embedTraps.directional) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.xpath, review: true,
            detail: `one-way keyboard trap: focus enters this ${t.kind} and escapes in only one Tab direction` + via });
        }
        // FIXED-SET CONFINEMENT found in the REVEALED state. Mirrors the at-rest fan-out exactly (kinds
        // keyboard-trap-confinement / keyboard-trap-oneway, member fan-out, review: !lyingAdvisory) so the
        // adjudicator's confinement gate and build-v3's mint loops treat these rows identically.
        if (revealed.confinement) {
          for (const t of (revealed.confinement.traps || [])) {
            const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
            const seenRc = new Set();
            for (const xpath of members) {
              if (!xpath || seenRc.has(xpath)) continue; seenRc.add(xpath);
              res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-confinement', review: !t.lyingAdvisory, xpath,
                memberXpaths: t.memberXpaths, setSize: t.setSize, detail: (t.lyingAdvisory
                  ? `confirmed keyboard trap: focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape, AND the page's documented escape key does NOT free focus (a lying advisory) — a 2.1.2 barrier.`
                  : `focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape. A 2.1.2 barrier UNLESS the user is told how to exit (a non-standard key, possibly behind a help control) AND that key works — verify by revealing instructions and pressing the key.`) + via });
            }
          }
          for (const t of (revealed.confinement.onewayTraps || [])) {
            const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
            const seenRo = new Set();
            for (const xpath of members) {
              if (!xpath || seenRo.has(xpath)) continue; seenRo.add(xpath);
              res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-oneway', review: true, xpath,
                memberXpaths: t.memberXpaths, setSize: t.setSize, direction: t.direction || 'forward',
                unreached: Array.isArray(t.unreached) ? t.unreached : [], unreachedCount: t.unreachedCount,
                detail: `focus is confined to a fixed set of ${t.setSize} element(s) in the ${t.direction || 'forward'} Tab direction only: ${t.unreachedCount} rendered focusable(s) outside the set are never reached in that direction, though focus escapes the other way. A 2.1.2 barrier UNLESS the section genuinely requires input or interaction — completable by keyboard — before allowing focus to progress, or a documented exit key works; the keyboard-trap rubric decides which.` + via });
            }
          }
        }
        if (opts.partialSink) opts.partialSink.findings = res.findings.slice();
```

### Inertness / blast-radius notes for the applier

- `detector: 'keyboard-trap'` is used on every row (matching the existing revealed emission), so the
  `alreadyConfirmed` gate upstream (`res.findings.some(f => f.sc === '2.1.2' && !f.review)`) is unaffected —
  it runs BEFORE `detectTrapsAfterReveal` is invoked.
- The revealed confinement/oneway rows deliberately carry the SAME kinds as the at-rest lane so
  `llm-adjudicator.js`'s `confinementFor(row.xpath)` gate and the keyboard-trap-v0 rubric receive them with
  zero routing changes; the `via` suffix is the judge's provenance signal, as it already is for revealed
  region traps.
- Nothing in `build-v3.js` needs to change: same-origin revealed embed traps (review:false, kind
  `keyboard-trap`) ride the existing INSTRUMENT_BARRIER promotion + trap mint loop; review rows mint nothing
  except `keyboard-trap-oneway`, which mints its obligation-only row exactly as at rest.
