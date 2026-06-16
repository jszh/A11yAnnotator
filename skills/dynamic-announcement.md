---
name: dynamic-announcement
description: Determine whether a state/status change is announced to assistive tech, by activating the control with the virtual SR's act() and reading the captured transcript (lastSpokenPhrase / spokenPhraseLog) for a live-region announcement.
covers: cat_7 (primary); cat_9 (error announce), cat_2 (modal open)
wcag: 4.1.3 Status Messages (AA, WCAG 2.1)
instruments: VSR act() + transcript — the live "SR Log" panel is BUILT (index.html); a headless /sr-act endpoint is still to wire — plus AX tree, vision
behavioral: yes (requires a scripted serve; the announce engine needs the state change to fire)
---

# dynamic-announcement

## v3.2 division of labor

In Harness v3.2 you do NOT investigate or drive tools. The collector and the deterministic runners
already activated the control, watched the page change, and captured what assistive tech heard — they
HAND you their signals + the (realism-corrected) VSR transcript + the declared vision crops. Your job is
to **JUDGE MEANING over that handed evidence**: did an action-driven change produce a *status message*,
and was that status message announced? You do not re-run `--eval`/`/ax-node`, you do not clear a
transcript and `act()`, you do not "drive a submit", you do not "reproduce" anything yourself.

**Defer to the runner.** Where a deterministic runner already disposed an obligation (a CLAIM exists),
you are NOT asked about it — the builder only hands you the **auto-PARTIAL residue**, the cases the
runner could not settle on its own. So judge only that residue and never re-litigate what a runner owns
(e.g. do not re-judge 1.4.3 contrast). KEEP every WCAG soundness caveat below: they are what STOP a
false clear or a false barrier.

## What you JUDGE

You judge ONE thing: **4.1.3 status messages — whether an action-driven change is announced.**

**C1 scope-gate (do not skip — it decides whether 4.1.3 even applies).** 4.1.3 Status Messages applies
ONLY to *status* information — success/result, progress/busy, or error/validation — that appears
**without receiving focus**
(https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). Before you decide anything, route
the change by what kind of change it is:

- A change to the control's own **state** (`aria-expanded`, `aria-pressed`, `aria-selected`,
  `aria-checked`) is **4.1.2 Name, Role, Value**, NOT 4.1.3. Route a bare state change to
  name-role-state; do NOT record a 4.1.3 failure for an un-voiced expand/toggle/select.
- A **dialog/menu opening** is change-of-context + **focus management**, NOT 4.1.3. Judge it under
  focus-management (did focus move into it?); a missing live-region announcement of a dialog is not a
  4.1.3 failure.
- 4.1.3 is in scope ONLY when the action produces a genuine **status message** (e.g. "Added to bag",
  "3 results", "Loading…", "Invalid email") that does not take focus.

Once the change is in scope, judge the handed evidence:

- A genuine **status message** appeared visually (vision crop) but the handed transcript is **empty** —
  no live region fired, no focus moved to it → **REPRODUCED** (4.1.3 failure).
- The status message was voiced — the transcript shows a `role=status` / `aria-live` announcement
  matching the visible change → **NOT REPRODUCED**.
- The change is only a state change or a dialog opening (per C1) → 4.1.3 is **N/A**; it belongs to
  4.1.2 / focus-management, not here.

## Evidence you are handed

You do not gather this — it is precomputed and handed to you:

- **a11y-eval signals.** The static live-region inventory the runner already counted:
  `[aria-live]`, `[role=status]`, `[role=alert]` regions and whether each is wired to *this* action,
  plus the control's role/name/state from the AX node (e.g. plain `<button>`s with no
  `role=tab`/`aria-selected`, which predict a silent change). This is a HINT, not the verdict — see the
  caveat below.
- **The (realism-corrected) VSR announcement transcript.** The collector cleared the log, activated the
  control, and captured `lastSpokenPhrase()` / `spokenPhraseLog()` after the change fired — already
  awaited, marshalled, and corrected for what real AT would actually voice. This transcript is the real
  arbiter of whether the status message was announced.
- **The declared vision crops.** Before/after screenshots of the region, so an empty transcript reads as
  "changed but unannounced" rather than "nothing happened". Use them to confirm the visible change
  occurred and to judge whether it is a *status* message at all.

## WCAG soundness caveats (these STOP a false clear or false barrier)

- **A region count is not an announcement.** A live region must already exist in the DOM *before* its
  text changes to be reliably announced. A region injected together with its message (common in
  React/Vue) often is **not** announced by real AT even though it appears in the static count. Trust the
  handed transcript over the count.
- **Focus-move is a different mechanism, not a 4.1.3 pass or fail.** 4.1.3 applies to status conveyed
  *without* moving focus. If the action instead moved focus to the new content (and the transcript shows
  that focus announcement), judge it under focus-management — neither credit nor fault it as 4.1.3.
- **Silent transcript ≠ failure unless a status message was actually present.** Confirm via the vision
  crop that a genuine status message appeared. If nothing status-like appeared, there is no 4.1.3
  obligation to fail.
- **Frozen-snapshot limit.** If the change needs backend/hydration the snapshot cannot run, the
  status message never fires — report the missing live-region wiring as a static signal and return
  PARTIAL; never assert a definite 4.1.3 failure from a change that was never demonstrated.

## Output

Verdict: **REPRODUCED** (status message present but not announced) / **NOT REPRODUCED** (announced) /
**PARTIAL** (change couldn't fire on this snapshot; report the missing live-region wiring) / **N-A**
(the change is a bare state change → 4.1.2, or a dialog → focus-management; not a 4.1.3 status message).
