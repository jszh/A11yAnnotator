---
id: keyboard-trap-v0
sc: 2.1.2
skill: keyboard-operability
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

**WCAG 2.1.2.** A keyboard trap is a barrier UNLESS focus can be moved away by a standard key OR by a non-standard
method the user is ADVISED of. So this PASSES (NOT REPRODUCED) only when BOTH hold: (a) the page DOCUMENTS an exit
to the user — visible advisory text, or text revealed by activating a help affordance the user can find — AND (b)
pressing that key ACTUALLY frees focus. It FAILS (REPRODUCED) when no exit is documented anywhere (an undocumented
key the user cannot know about is still a trap), OR a documented key does not work.

**Investigate with the tools — VERIFY behaviorally, do NOT guess from the markup:**
- The advisory may be hidden behind a help control INSIDE the trap. Call `observe_state_after_activation(targetXpath)`
  on the trapped members (`signals.keyboardTrap.members`) to reveal any instructions an activation surfaces (e.g. a
  "How to go to the next element" link that injects "Press Ctrl+M to Exit"). Read the newly-visible text it returns.
- Once you have a candidate exit key, call `press_keys_and_observe_focus(targetXpath, keys)` — focus a trapped member
  and press the combo (e.g. `"Ctrl+M"`, `"Escape"`) — and read `focusMoved`: true ⇒ the key freed focus (a working
  exit); false ⇒ it did nothing. Do NOT infer "the key works" from reading the handler source — PRESS it.

**Decide:**
- A documented exit key whose press moves focus OUT of the trapped set ⇒ **NOT REPRODUCED** (escapable, documented).
- No exit documented ANYWHERE — nothing in the visible text and nothing revealed by activating any trapped member ⇒
  **REPRODUCED** (the user is trapped, even if a secret key happens to work — they are never told).
- A documented key that does NOT free focus ⇒ **REPRODUCED** (a lie).
- A tool failed, or you cannot determine documentation/escapability ⇒ **PARTIAL**. A confirmed confinement is
  presumed a trap until an escape is PROVEN — never clear an unverified confinement.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (a 2.1.2 keyboard trap), NOT REPRODUCED (escapable — a documented exit that works), PARTIAL (could not
verify), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
