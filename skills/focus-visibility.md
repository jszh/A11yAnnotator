---
name: focus-visibility
description: Determine whether a focused control shows a perceivable focus indicator, by focusing it and comparing focused vs unfocused screenshots with vision — the check axe structurally cannot do.
covers: cat_5 (primary, 2.4.7)
wcag: 2.4.7 Focus Visible (AA, WCAG 2.0); 2.4.13 Focus Appearance (AAA, WCAG 2.2) for the strength judgment
instruments: focus driver, screenshots + vision, CSS inspection
behavioral: yes (needs focus applied; rendering is static once focused)
---

> **v3.2 division of labor (LLM lane).** In Harness v3.2 you do NOT investigate or drive tools — the
> collector and the deterministic runners already measured the page and HAND you their signals + the
> (realism-corrected) VSR transcript + vision crops. Your job is to JUDGE MEANING over that evidence,
> not to re-run `--eval`/`/ax-node` or drive a submit. Where a deterministic runner already disposed an
> obligation (a CLAIM exists) you are NOT asked about it — the builder only hands you the auto-PARTIAL
> residue, so DEFER to the runner and never re-litigate (e.g. do not re-judge 1.4.3 contrast the runner
> owns). KEEP every WCAG soundness caveat below: they are what STOP a false clear or false barrier.


> **2.4.7 vs 2.4.13 — don't conflate the bar.** SC 2.4.7 (AA) is *binary*: it
> fails only if there is **no** visible focus indicator at all. It sets **no**
> size or contrast threshold — a faint-but-present ring still passes 2.4.7.
> The "is the indicator strong enough" judgment (≥2 CSS-px-equivalent area and
> ≥3:1 contrast between focused/unfocused states) is **2.4.13 Focus Appearance,
> which is Level AAA (WCAG 2.2)**. So report a weak-but-present indicator as a
> **2.4.13 (AAA)** concern, not a 2.4.7 failure.

# focus-visibility

## When to run
Findings about removed/invisible focus rings, focus shown only by a subtle scale
animation, or `outline:none` without a visible replacement.

## Procedure
1. **CSS pre-check** — enumerate stylesheets for `:focus`/`:focus-visible` rules
   that set `outline:none`/`outline:0` (Southern Airways global `a:focus{outline:none}`;
   GrazeMate `:focus{outline:none!important}`). A global removal with no
   replacement is strong evidence — but confirm the *rendered* result, because a
   replacement `box-shadow` may exist.
2. **Two-shot comparison (the determiner)** — screenshot the control unfocused;
   **focus it with a real keyboard Tab** (CDP key events / the Tab driver), then
   screenshot again. Read both PNGs.
   - ⚠️ **Do NOT use `el.focus()`.** Most modern sites show the ring via
     `:focus-visible`, which only matches on *keyboard* modality. Verified in this
     engine: keyboard Tab → `:focus-visible` true, ring shows; but `el.focus()`
     after any mouse interaction → `:focus-visible` **false, no ring** — a false
     "no indicator". Confirm modality with `el.matches(':focus-visible')`.
3. **Judge** — two separate questions:
   - **2.4.7 (AA):** is there *any* perceivable change on focus (outline, ring,
     border, background shift)? If literally nothing changes → **2.4.7 fail**.
   - **2.4.13 (AAA):** if something changes but it's weak — a 5% scale bump, a
     transparent outline, or a white ring on a near-white background (Domino's
     "Join Now" on cream) — that's a **2.4.13 (AAA)** strength concern, *not* a
     2.4.7 failure. Watch the *actual background* the indicator sits on.

## Classify
- **REPRODUCED (2.4.7, AA)** — no perceivable visual change at all on focus.
- **REPRODUCED (2.4.13, AAA)** — an indicator appears but is sub-threshold (faint/low-contrast/scale-only). Flag the level so it isn't over-claimed as an AA failure.
- **NOT REPRODUCED** — a clear, sufficiently-contrasting focus indicator appears.

## Why vision, not axe
axe cannot tell that `outline:none` was replaced by a real, contrasting
box-shadow — only the rendered pixels can. This skill is the canonical case where
the sighted view (vision) is the *primary* instrument, not corroboration.

## Limits
Focus must be applied by **keyboard** (see ⚠️ above) — `el.focus()` defeats
`:focus-visible` and yields false negatives. Judgement of "perceivable enough" is
vision-based; capture at the element's real background, not a neutral one. Forced-
colors / Windows High Contrast Mode render their own focus indicators — out of
scope here.
