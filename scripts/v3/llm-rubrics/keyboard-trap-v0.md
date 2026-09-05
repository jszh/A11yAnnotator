---
id: keyboard-trap-v0
sc: 2.1.2
skill: keyboard-operability
toolMode: required
visionEvidence: [viewport]
---

# 2.1.2 — keyboard trap (v0 rubric)

**Division of labor (v3.2).** A deterministic instrument already PROVED, behaviorally, that keyboard focus is
CONFINED to a fixed set of controls — it cannot leave by Tab, Shift+Tab, or Escape, and a focusable OUTSIDE the set
is never reached. `signals.keyboardTrap.members` lists the trapped controls (xpaths). The unambiguous cases are
already decided deterministically and never reach you: a control that re-grabs its own focus (self-refocus), and a
page that advertises a STATIC exit key in visible text which does NOT work (a lying advisory) — both are confirmed
barriers without you. You own the ONE question the keyboard driver cannot settle on its own: **is the user TOLD how
to escape — via a non-standard key, possibly documented behind a help control the user must activate — AND does that
key actually work?**

**WCAG 2.1.2 (G21).** A keyboard trap is a barrier UNLESS focus can be moved away by a standard key OR by a
non-standard method the user is ADVISED of. Per G21 the advice must be available WITHIN the trapped subset and
accessible via keyboard — documentation a keyboard user inside the trap can never perceive or reach is not advice
to THAT user. So this PASSES (NOT REPRODUCED) only when BOTH hold: (i) the exit advice is perceivable/operable by
a KEYBOARD user already inside the trap — visible before/at trap entry, or revealed by a help control that is
itself keyboard-reachable from inside the trapped set — AND (ii) the advised key press moves focus OUT of the
trapped set. It FAILS (REPRODUCED) when no exit is documented anywhere (an undocumented key the user cannot know
about is still a trap), when the only documentation is unreachable from inside the trap, OR when a documented key
does not work.

**Investigate with the tools — VERIFY behaviorally, do NOT guess from the markup:**
- The advisory may be hidden behind a help control INSIDE the trap. Call `observe_state_after_activation(targetXpath)`
  on the trapped members (`signals.keyboardTrap.members`) to reveal any instructions an activation surfaces (e.g. a
  "How to go to the next element" link that injects "Press Alt+F6 to exit"). Read the newly-visible text it returns.
- CONFIRM the advice CARRIER is keyboard-reachable from inside the trap — mere presence of the advice somewhere in
  the page text is NOT enough. Reachable means: visible before/at trap entry, or revealed by activating an element
  that is IN the trapped set (`signals.keyboardTrap.members` — Enter/Space from inside the loop reaches it). NOT
  reachable: text downstream of the loop that Tab never reaches, a collapsed disclosure whose opener is outside the
  trapped set, a hover-only `title=` tooltip (no keyboard equivalent), or a mouse-only opener. Locate WHERE the
  advice lives and HOW a trapped keyboard user would surface it before crediting it.
- Once you have a candidate exit key, call `interact_and_observe` with a focus-then-press sequence pressing THE
  COMBO THE PAGE ADVISES, never one of your own invention —
  `actions:[{op:'focus', xpath:<trapped member>}, {op:'press', key:'<the advised combo>'}]` (the `press` op takes
  modifier combos like `"Alt+F6"`, `"Shift+Tab"`, or a bare `"Escape"`). Read the press step's `activeAfter`: if it is an
  element OUTSIDE the trapped set (`signals.keyboardTrap.members`), the key freed focus (a working exit); if it is
  still a trapped member (or unchanged), the key did nothing. Do NOT infer "the key works" from the handler source —
  PRESS it. (You can also Tab/Shift+Tab in the same sequence to confirm focus cannot leave by the standard keys.)

**Decide:**
- **NOT REPRODUCED** only when BOTH hold: (i) the exit advice is perceivable/operable by a KEYBOARD user already
  inside the trap — visible before/at trap entry, or revealed by a help control that is itself keyboard-reachable
  from inside the trapped set — AND (ii) the advised key press moves focus OUT of the trapped set. This INCLUDES
  a visible in-panel hint naming a working exit key, and a help link that is ITSELF a trapped member revealing the
  key (both are advice within the subset, per G21).
- No exit documented ANYWHERE — nothing in the visible text and nothing revealed by activating any trapped member ⇒
  **REPRODUCED** (the user is trapped, even if a secret key happens to work — they are never told).
- A working exit key whose ONLY documentation is unreachable from inside the trap (a collapsed disclosure downstream
  of the loop, a hover-only `title=`, a mouse-only opener) ⇒ **REPRODUCED** (G21: the advice must be within the
  subset and accessible via keyboard — advice the trapped keyboard user can never surface is no advice).
- A documented key that does NOT free focus ⇒ **REPRODUCED** (a lie).
- A tool failed, or you cannot determine documentation/escapability ⇒ **PARTIAL**. A confirmed confinement is
  presumed a trap until an escape is PROVEN — never clear an unverified confinement.

**One-way confinement (REVIEW branch).** When `signals.keyboardTrap.oneway` is present, the instrument observed a
WEAKER shape than the full confinement above: sequential navigation in ONE direction (`oneway.direction`) loops
focus inside the member set, while `oneway.unreached` lists rendered focusables (tag + accessible name;
`oneway.unreachedCount` in total) that the sweep never reached — page content walled off in that direction. Focus
DOES escape in the other direction, but per the DHS Trusted Tester procedure for SC 2.1.2 (Test 4.C) that is a
tester workaround, not a pass condition: keyboard access restricted to a small section of the page with no way to
navigate out of the loop to the rest of the page fails, and focus must be movable away from EACH section without a
loop that prevents access to other elements. Test 4.C also carves out the one legitimate form of this shape — a
section that genuinely requires input or interaction before allowing focus to progress to the rest of the page is
NOT a failure — and telling the two apart is YOUR question:
- The loop demonstrably requires COMPLETING something, and completing it is possible by keyboard ⇒ **NOT
  REPRODUCED** (the 4.C exception). Examples of the shape: a set of fields that releases focus once each holds a
  valid entry; a step that advances only after a choice is made. VERIFY it, never infer it from wording: perform
  the required entry/choice with `interact_and_observe` (focus, type/press the needed input, then Tab) and confirm
  the final step's `activeAfter` lands OUTSIDE the member set. A gate whose only release requires a pointer (an
  element that cannot be operated by keyboard) is NOT the exception — that user still cannot progress.
- The loop merely returns focus to its own first member with nothing to complete — e.g. a cluster of controls
  whose last member hands focus back to the first, leaving everything after the cluster unreachable in the normal
  navigation direction — and no working exit is advertised (same advisory rules as above) ⇒ **REPRODUCED**.
- An advertised non-standard exit that works, verified by pressing it, ⇒ **NOT REPRODUCED**; advertised but not
  working ⇒ **REPRODUCED**.
- Cannot verify either way ⇒ **PARTIAL** — like a full confinement, a one-way loop is presumed a barrier until a
  working escape or a genuine keyboard-completable input requirement is PROVEN.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (a 2.1.2 keyboard trap), NOT REPRODUCED (escapable — a documented exit that works), PARTIAL (could not
verify), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
