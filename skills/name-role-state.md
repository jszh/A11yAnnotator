---
name: name-role-state
description: Judge whether an element's accessible name carries the right MEANING — adequate alt, link purpose, and label-in-name — over the collector's precomputed AX/state signals, the realism-corrected VSR announcement, and the declared vision crops. The base skill behind every "is this exposed correctly to assistive tech" question.
covers: cat_1 (primary); cat_4, cat_7, cat_9 (support)
wcag: 1.1.1 Non-text Content (A); 2.4.4 Link Purpose (In Context) (A); 2.5.3 Label in Name (A, WCAG 2.1); 4.1.2 Name, Role, Value (A)
instruments: precomputed AX-tree signals, axStates, realism-corrected VSR announcement, vision crops, axe
behavioral: no (static — safe in noscript mode)
---


# name-role-state

## v3.2 division of labor
In Harness v3.2 you are the LLM lane: you do NOT investigate or drive tools. The collector and the
deterministic runners already measured the page and HAND you their signals + the (realism-corrected)
VSR transcript + the declared vision crops. Your job is to JUDGE MEANING over that handed evidence —
not to re-run `--eval`/`/ax-node`, not to drive a submit, not to reproduce a step. Where a
deterministic runner already disposed an obligation (a CLAIM exists), you are NOT asked about it: the
builder only hands you the auto-PARTIAL residue — the part no runner could settle deterministically.
So DEFER to the runner and never re-litigate what it owns (e.g. do not re-judge 1.4.3 contrast the
runner owns; do not re-decide a `link-name`/`image-alt`/`button-name` PASS the axe runner already
cleared — judge only the *adequacy* it cannot). KEEP every WCAG soundness caveat below: they are what
STOP a false clear or a false barrier.

## What you JUDGE
You judge MEANING over three obligations only — the residue axe and the runners structurally cannot
settle:

- **1.1.1 alt adequacy.** Not "is alt present" (the runner already flagged *missing* alt). You judge
  whether the announced name actually *describes the image's meaning on screen*: a meaningful image
  given empty/placeholder alt, a decorative image given a real name, or auto-generated alt that
  doesn't match the picture all fail 1.1.1 — and only vision over the crop can see it.
- **2.4.4 link purpose (in context).** Does the announced name make the link's destination/purpose
  clear from itself plus its programmatically-associated context? Generic "Learn more"/"Read now"
  beside a specific promo, or icon-only links resolving to filename/empty, fail 2.4.4 even though a
  *name* exists.
- **2.5.3 label-in-name.** Does the announced accessible name MATCH the visible/visual label's
  meaning? SC 2.5.3 (Level A, WCAG 2.1) requires the accessible name to *contain the visible text
  label* — for a control with visible text, the visible string must appear (ideally at the start) in
  the accessible name. A button reading "Search" on screen but exposing `aria-label="Submit query"`
  fails 2.5.3 (voice-control users say "click Search" and nothing matches), even though both a name
  and a visible label exist. You compare the VSR-announced name against the visible text in the crop.

If the obligation is a bare state-exposure question rather than a meaning question, see "Validate
STATE exposure" below.

## Validate STATE exposure (M3 — the "state" in name-role-state)
The collector hands you `axStates` (authoritative, from the AX node) alongside DOM `states`
(expanded/pressed/selected/checked/disabled/current/required/invalid/…). Judge whether a control's
VISIBLE state (read from the crop) matches what AT sees in `axStates`: an expanded menu/accordion must
expose `expanded:true`; a pressed toggle `pressed:true`; a selected tab `selected:true`; a checked box
`checked:true`; a disabled control `disabled:true`. A visible state with NO corresponding entry in
`axStates` → **4.1.2 REPRODUCED** (state not programmatically exposed). A *dynamic* state change that
isn't announced is also 4.1.2 here (NOT 4.1.3 — a change to a control's own
`aria-expanded`/`pressed`/`selected`/`checked` is Name/Role/Value, route it here, not to Status
Messages).

## Evidence you are handed
You judge over precomputed evidence — you do not collect it:

- **Precomputed a11y-eval signals (from the AX tree).** `{role, name, inTree, ignoredReasons}` plus
  the resolved source of the name (`aria-label`, `aria-labelledby` + whether the target id existed,
  `alt`, associated `<label>`, `title`, `placeholder`). `name` is Chrome's computed accessible name.
  `inTree:false` means the node is pruned from the AX tree (e.g. `tabindex=-1`, `aria-hidden`) → there
  is no name to read; judge that as "no exposed name", not a null.
- **`axStates`** — the authoritative AX state set described above, paired with DOM `states` for the
  state-exposure judgment.
- **The realism-corrected VSR announcement.** The virtual-SR rendering of this control
  ("role, name, …states"), already corrected for realism. This is the announced *name* you judge
  against the visible label for 2.5.3 and against the picture for 1.1.1/2.4.4. When the AX `name` and
  the VSR announcement diverge, prefer the AX `name` for what AT computes and NOTE the divergence
  (CSS-generated `::before`/`::after` `content:` is part of the accessible name per accname and shows
  in AX `name` but may be dropped by the SR's `itemText`).
- **The declared vision crops.** The element crop(s) the collector declared for this finding — the
  visible label, the image, the surrounding link context. Read these to judge adequacy; you do not
  take new screenshots.
- **axe disposition (already run).** `image-alt, link-name, button-name, aria-input-field-name,
  image-redundant-alt, aria-roledescription` results are handed to you as a runner CLAIM. DEFER to a
  PASS/violation it owns; judge only the adequacy residue it leaves open.

## WCAG soundness caveats (these STOP a false clear or false barrier)
- **Missing alt ≠ empty alt.** No `alt` attribute → AT may fall back to the filename/`src` (1.1.1
  fail); `alt=""` → intentionally decorative (fine *iff* truly decorative). axe `image-alt` flags only
  *missing*, not empty — so an empty alt on a *meaningful* image (the inverse error) is YOUR call from
  the crop, not something the runner disposed.
- **CSS-generated content feeds the name.** `::before`/`::after` `content:` is part of the accessible
  name per accname (Harvey label resolved to `"Legal First and Last Name*"`, the `*` from CSS). When
  AX-name and VSR announcement disagree, trust the AX `name` and note the divergence — do not score a
  missing name off the SR rendering alone.
- **SVG names are fragile.** A bare `<svg>` usually exposes no name; it needs `role="img"` +
  `<title>`/`aria-label`. Icon-only links/buttons wrapping an untitled SVG are unnamed (Artera,
  MORSE) — and SVG naming varies across real AT, so a name present only via fragile SVG markup is not
  a safe clear.
- **`aria-label` on generic/non-interactive elements is widely ignored** by AT — don't credit a name
  that only an `aria-label` on a `<div>`/`<span>` provides.
- **2.5.3 is binary on containment, not on quality.** The accessible name need not equal the visible
  label, but it MUST contain it. A *fuller* accessible name that still contains the visible string
  passes 2.5.3; a "polished" name that drops or replaces the visible text fails — don't clear on
  "the name is nicer".
- **Don't route bare state/dialog changes to 4.1.3.** An un-voiced expand/toggle/select is 4.1.2
  (handled by "Validate STATE exposure"); a dialog/menu opening is change-of-context/focus-management.
  Only a focus-free *status* message belongs to 4.1.3 — not yours to re-decide here.

## Output
A verdict per obligation: **REPRODUCED** (name empty/placeholder/aria-labelledby-to-nothing, or
present-but-ambiguous vs visible context, or accessible name fails to contain the visible label, or a
visible state absent from `axStates`) / **NOT REPRODUCED** (a proper descriptive name that matches the
visible label and context — record it, it refutes the finding) / **PARTIAL** (only the auto-PARTIAL
residue could be judged; state what handed evidence was missing) / **N/A** (obligation owned by a
deterministic runner, or element absent from the snapshot). Always state the visible context/crop you
compared the announced name against.
