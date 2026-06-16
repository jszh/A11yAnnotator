---
name: name-role-state
description: Compute an element's accessible name, role, and state from the AX tree + virtual SR, then judge whether the name is adequate (not just present). The base skill behind every "is this exposed correctly to assistive tech" question.
covers: cat_1 (primary); cat_4, cat_7, cat_9 (support)
wcag: 1.1.1 Non-text Content (A); 2.4.4 Link Purpose (In Context) (A); 4.1.2 Name, Role, Value (A)
instruments: AX tree (/ax-node), guidepup speech, axe, vision
behavioral: no (static — safe in noscript mode)
---

> **v3.2 division of labor (LLM lane).** In Harness v3.2 you do NOT investigate or drive tools — the
> collector and the deterministic runners already measured the page and HAND you their signals + the
> (realism-corrected) VSR transcript + vision crops. Your job is to JUDGE MEANING over that evidence,
> not to re-run `--eval`/`/ax-node` or drive a submit. Where a deterministic runner already disposed an
> obligation (a CLAIM exists) you are NOT asked about it — the builder only hands you the auto-PARTIAL
> residue, so DEFER to the runner and never re-litigate (e.g. do not re-judge 1.4.3 contrast the runner
> owns). KEEP every WCAG soundness caveat below: they are what STOP a false clear or false barrier.


# name-role-state

## When to run
Any finding about a missing/ambiguous accessible name, a wrong/absent role, or a
control that "looks interactive but isn't exposed": alt text, "Learn more"/"Read
now" links, icon-only links, auto-generated alt, custom `<div>` controls.

## Procedure
1. **Locate** the element; record its xpath in the page's served mode.
2. **Compute name + role + state** — authoritative source is the AX tree:
   `curl -G /ax-node --data-urlencode file=saved/<f> --data-urlencode xpath=<xp>`
   → `{role, name, speech, inTree, ignoredReasons}`. `name` is Chrome's computed
   accessible name; `speech` is the SR rendering ("role, name, …states").
2b. **Validate STATE exposure (M3 — the "state" in name-role-state).** collect.json now
   carries `axStates` (authoritative, from the AX node) + DOM `states`
   (expanded/pressed/selected/checked/disabled/current/required/invalid/…). Check that a
   control's VISIBLE state matches what AT sees: an expanded menu/accordion must expose
   `expanded:true`; a pressed toggle `pressed:true`; a selected tab `selected:true`; a
   checked box `checked:true`; a disabled control `disabled:true`. A visible state with no
   corresponding AX state → **4.1.2 REPRODUCED** (state not programmatically exposed). A
   *dynamic* state change that isn't announced is also 4.1.2 here (NOT 4.1.3 — see C1).
3. **Corroborate the source** with `--eval`/`--xpath`: `aria-label`,
   `aria-labelledby` (does the target id exist?), `alt`, associated `<label>`,
   `title`, `placeholder`. axe rules: `image-alt, link-name, button-name,
   aria-input-field-name, image-redundant-alt, aria-roledescription` (the last two
   are best-practice / disabled-by-default — run by name via `--axe <rule>`).
4. **Judge adequacy with vision** — the part axe cannot do. `--shot el.png --xpath <xp>`
   then read it: does the computed name describe what's on screen?
   - Empty/placeholder name → fails 1.1.1 / 4.1.2.
   - Name present but ambiguous vs context ("Learn more" beside a specific promo;
     auto-alt = "r/teenagers - <title>") → fails 2.4.4.
   - Decorative image given a real name, or meaningful image given empty alt →
     1.1.1.

## Naming subtleties (commonly mis-judged — check these)
- **Missing alt ≠ empty alt.** No `alt` attribute → AT may fall back to the
  filename/`src` (1.1.1 fail); `alt=""` → intentionally decorative (fine *iff*
  truly decorative). axe `image-alt` flags only *missing*, not empty — so an empty
  alt on a *meaningful* image (the inverse error) needs vision, not axe.
- **CSS-generated content feeds the name.** `::before`/`::after` `content:` is part
  of the accessible name per accname. Chrome's AX `name` includes it (Harvey label
  resolved to `"Legal First and Last Name*"`, the `*` from CSS) — but guidepup's
  `itemText` may not. When AX-name and SR-speech disagree, trust the AX `name` and
  note the divergence.
- **SVG names are fragile.** A bare `<svg>` usually exposes no name; it needs
  `role="img"` + `<title>`/`aria-label`. Icon-only links/buttons wrapping an SVG
  with no title are unnamed (Artera, MORSE) — and SVG naming varies across real AT.
- **`aria-label` on generic/non-interactive elements is widely ignored** by AT —
  don't credit a name that only an `aria-label` on a `<div>`/`<span>` provides.

## Classify
- **REPRODUCED** — computed name is empty, or is a placeholder/aria-labelledby-to-nothing, or is present-but-ambiguous against the visible context.
- **NOT REPRODUCED** — a proper descriptive name exists (e.g. Microsoft "Learn about Microsoft Complete"; Wayfair search labelled "Search"). Record it — these refute the finding.
- **NOT FOUND** — element absent from snapshot.

## Limits
Adequacy ("is this name meaningful?") is a vision/judgment call, not deterministic
— state the visible context you compared against. `inTree:false` means the node
is pruned from the AX tree (e.g. `tabindex=-1`, `aria-hidden`) → there is no name
to read; report that rather than a null.
