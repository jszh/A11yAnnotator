# Harness 3.0 — Self-Adversarial Round 2

After round-1 fixes (commit `18888e5`), a **fresh** independent red-team agent attacked the hardened
code, told explicitly not to re-report already-fixed issues. It found a deep measurement root cause
the first two passes never exercised, plus three lesser robustness defects. All reproduced on real
Chrome (`Chrome 367696`, puppeteer 24.40) / the real lib modules.

## Root cause (the important one)
Focus-dependence was inferred by comparing two **non-simultaneous** observations — two screenshots and
two `getComputedStyle` reads — and attributing *any* difference to focus. That attribution breaks
whenever (a) the rendering is time-varying independent of focus (CSS animation/transition, lazy
paint), or (b) the focus effect lives outside the element's own box + the fixed `CLIP_PAD=10` clip
(on-focus motion, `::before/::after` rings, large `outline-offset`). `readIndicator` also never
inspected pseudo-elements.

| ID | Sev | Title | Status |
|----|-----|-------|--------|
| R2-F1 | **High** | CSS animation defeats BOTH channels → FALSE CLEAR (a button with no `:focus` rule clears) | reproduced |
| R2-F2 | **High** | Element that MOVES on `:focus` (stale clip) → FALSE CLEAR | reproduced |
| R2-F3 | **High** | `::after` ring with large inset is invisible to both channels → FALSE BARRIER on a visibly-focused button | reproduced |
| R2-F4 | Medium | `CLIP_PAD=10` magic number: a real `outline-offset:12px` ring → systematic FALSE PARTIAL (depresses clear rate / gold denominator) | reproduced |
| R2-F5 | Low | `::after` ring within the clip → PARTIAL (real indicator not credited) | reproduced |
| R2-M1 | Medium | `scoreClears` silently drops gold-key-format-mismatched clears (no "unlabelled" warning) — can hide false clears and let a defective mechanism be promoted | reproduced |
| R2-L1 | Low | `reconcile()` uses a bare `{}` map → prototype-key (`toString`/`__proto__`) confusion (not reachable via buildV3 today) | reproduced |
| R2-L2 | Low | `authorityFor`/`validateAuthority` read readiness flags via the prototype chain (requires a malicious non-frozen registry) | reproduced |

## Why this matters despite shadow mode
`focus-visual-retry` is default-shadow, so none of these publish authoritative **today**, and shadow
gold-scoring *does* catch them when gold covers the case. The danger is promotion: the
`measurementValidated` readiness flag ([authority.js](../scripts/v3/lib/authority.js)) would be set
off an adversarial-fixture suite that contained **none** of these four vectors — i.e. the mechanism
could be promoted while still false-clearing on animation/motion and false-barriering on offset/pseudo
rings. So the fix must harden the measurement AND expand the fixture suite that gates promotion.

## Fix design
1. **Stability gate (R2-F1):** capture two *unfocused* shots a few frames apart; if they differ, the
   element is animating ⇒ INCONCLUSIVE (focus diff is unattributable).
2. **Motion gate (R2-F2):** re-measure the element rect after real keyboard focus; if it moved/resized,
   the before/after clips cover different regions ⇒ INCONCLUSIVE.
3. **Pseudo-element awareness + dynamic clip (R2-F3/F4/F5):** `readIndicator` now inspects
   `::before`/`::after`; the clip pad is computed from the actual ring extent (outline offset+width,
   shadow spread/blur, pseudo inset), capped, so offset/pseudo rings are captured.
4. **Channel-agreement rule:** a CLEAR requires pixel change AND computed focus-dependence to AGREE;
   a BARRIER requires both to agree on absence; any disagreement ⇒ INCONCLUSIVE (never a confident
   false verdict).
5. **R2-M1:** `scoreClears` now reports `unlabelledClears`; promotion requires it to be 0 (every
   emitted clear is gold-labelled) so format drift cannot hide a false clear.
6. **R2-L1/L2:** null-prototype maps / `Object.hasOwn` for obligation and readiness lookups.

## Sound (negative results from the attacker)
Authority `__proto__` JSON pollution (no promote), non-boolean truthy readiness (rejected), legacy
output scan across case/whitespace/tab/unicode variants (robust), byte-deterministic serialization (no
meaning-losing null/NaN), schema boundary (arrays/numbers/`__proto__`-key rejected), catalog/registry
consistency for 2.4.7 (no unmeasured support requirement), stale identity-lenient drive (can only
suppress → auto-PARTIAL, never manufacture a clear), proposer-as-SPOF (builder re-checks; genuine
defense-in-depth), statistical helpers (`requiredZeroEventN(0.02)=149` correct).

→ Fixes + new adversarial fixtures (animation / motion / pseudo-offset / large-offset) and regression
tests in the commit following this document. This is the **second and final** adversarial round.
