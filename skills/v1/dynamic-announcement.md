---
name: dynamic-announcement
description: Determine whether a state/status change is announced to assistive tech, by activating the control with the virtual SR's act() and reading the captured transcript (lastSpokenPhrase / spokenPhraseLog) for a live-region announcement.
covers: cat_7 (primary); cat_9 (error announce), cat_2 (modal open)
wcag: 4.1.3 Status Messages (AA, WCAG 2.1)
instruments: VSR act() + transcript — the live "SR Log" panel is BUILT (index.html); a headless /sr-act endpoint is still to wire — plus AX tree, vision
behavioral: yes (requires a scripted serve; the announce engine needs the state change to fire)
---


# dynamic-announcement

## When to run
Findings where a visible change isn't conveyed to AT: add-to-cart confirmation,
tab/plan selection swapping content, billing toggle, validation error appearing,
filter result counts updating.

## How the instrument works
guidepup's virtual SR implements the ARIA live-region spec (`aria-live`,
`aria-atomic`, `aria-relevant`) via a MutationObserver. When a live region
mutates, it voices the update — verified: firing `aria-live="polite"` →
`lastSpokenPhrase()` returns `"polite: Added to bag"`. It also **follows focus**:
if activation moves DOM focus, the cursor moves to the newly-focused node and
announces it (verified: cursor `button → input` on click). This is the capability
the static harness never used.

## Procedure
1. **Baseline** — locate the control; `/ax-node` for its current role/name/state.
2. **Clear the transcript** — `clearSpokenPhraseLog()`.
3. **Activate** — `act()` / `press('Enter')` (or click) on the control.
4. **Read the transcript** — `lastSpokenPhrase()` / `spokenPhraseLog()`. **Both are
   async — `await` them** (a sync read returns a Promise). Read in-page: the log
   array doesn't survive Puppeteer's `evaluate` marshalling, so consume it inside
   the iframe — the built "SR Log" panel already does this (await + slice the
   delta + post plain strings).
5. **Confirm the visual change happened** — screenshot before/after (vision), so a
   silent transcript means "changed but unannounced", not "nothing happened".
6. **Scope-gate FIRST (C1 — do not skip).** 4.1.3 Status Messages applies ONLY to
   *status* information — success/result, progress/busy, or error/validation messages
   — that appears **without receiving focus**
   (https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). Before deciding:
   - A change to the control's own **state** (`aria-expanded`, `aria-pressed`,
     `aria-selected`, `aria-checked`) is **4.1.2 Name/Role/Value**, NOT 4.1.3. Route it
     to name-role-state; do not record a 4.1.3 failure for an un-voiced expand/toggle/select.
   - A **dialog/menu opening** is change-of-context + **focus management**, NOT 4.1.3.
     Judge whether focus moved into it (focus-management); a missing live-region
     announcement of a dialog is not a 4.1.3 failure.
   - 4.1.3 is in scope only when the action produces a *status message* (e.g. "Added to
     bag", "3 results", "Loading…", "Invalid email") that does not take focus.
7. **Decide (only when 4.1.3 is in scope per step 6):**
   - A genuine **status message** appeared visually but the transcript is **empty** (no
     live region, no focus-move to it) → **REPRODUCED** (4.1.3 failure).
   - The status message was voiced (a `role=status`/`aria-live` fired) → **NOT REPRODUCED**.
   - The visible change is only a state/dialog change (step 6) → 4.1.3 is **N/A**;
     evaluate it under 4.1.2 / focus-management instead.
7. **Static corroboration** — `--eval` count `[aria-live],[role=status],[role=alert]`
   and whether they're wired to *this* action; plain `<button>`s with no
   `role=tab`/`aria-selected` (Cloudflare plan "tabs") predict a silent change.
   - ⚠️ **Counting regions isn't enough — a live region must already exist in the
     DOM *before* its text changes** to be reliably announced. A region injected
     together with its message (common in React/Vue) often is **not** announced by
     real AT, even though it shows up in the count. The act()+transcript test
     (steps 2–4) is the real arbiter; the count is only a hint.
   - **Scope of 4.1.3:** it applies to status conveyed *without* moving focus. If
     activation instead moves focus to the new content (and the transcript shows
     that focus announcement), that's a *different* mechanism — judge it under
     focus management, not as a 4.1.3 failure.

## Classify (4.1.3 = STATUS MESSAGES only — see step 6)
- **REPRODUCED** — a genuine **status message** (success/result/progress/error that does
  not take focus) appears visually but is not announced. A bare state change
  (`aria-expanded`/`pressed`/`selected`) or a dialog opening is **N/A here** — route to
  4.1.2 / focus-management, do NOT record it as a 4.1.3 failure.
- **PARTIAL** — the change can't be triggered on this snapshot (needs backend/hydration); report the missing live-region wiring as the static signal.
- **NOT REPRODUCED** — the status message is announced (a live region / role=status fired).
- **NOT FOUND** — the control/state isn't in the snapshot.

## Limits
Requires the page's JS to actually perform the change. Post-submit/backend
changes (real validation, cart) often can't fire on a frozen snapshot → PARTIAL
on the static wiring. guidepup ≈ a real SR but not identical; treat as strongly
indicative.
