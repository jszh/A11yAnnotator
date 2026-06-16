---
name: focus-visibility
description: Judge whether a focused control shows a perceivable focus indicator, over the before/after focus crops the collector hands you — the meaning check axe structurally cannot do.
covers: cat_5 (primary, 2.4.7)
wcag: 2.4.7 Focus Visible (AA, WCAG 2.0); 2.4.13 Focus Appearance (AAA, WCAG 2.2) for the strength judgment
instruments: precomputed a11y-eval focus signals, realism-corrected VSR transcript, before/after focus crops + vision
behavioral: no for you (the collector already applied keyboard focus and captured the crops; rendering is static once focused)
---

## v3.2 division of labor

In Harness v3.2 you do NOT investigate or drive tools — the collector and the deterministic runners
already measured the page and HAND you their signals + the (realism-corrected) VSR transcript + vision
crops. Your job is to JUDGE MEANING over that handed evidence: is the focus indicator actually adequate?
You do not re-run `--eval`/`/ax-node`, do not "drive a submit", do not re-focus the control, and do not
"Reproduce" or "Investigate" anything — those steps already ran.

Where a deterministic runner already disposed an obligation (a CLAIM exists) you are NOT asked about it.
The builder only hands you the auto-PARTIAL residue — the cases the runner could not mechanically settle
and explicitly deferred to a meaning judgment. So DEFER to the runner and never re-litigate what it owns.
Concretely: the focus runner already applied a real keyboard Tab (NOT `el.focus()` — see the soundness
caveat below) and confirmed modality before snapping the crops; you trust that and judge the pixels. Do
not re-judge 1.4.3 contrast the contrast runner owns. KEEP every WCAG soundness caveat below: they are
what STOP a false clear or a false barrier.

## What you JUDGE

You judge MEANING over the before/after focus crops the collector handed you. Two — and only two —
questions, on two different bars:

- **The CLEAR direction for 2.4.7 (AA): is the focus indicator actually adequate?** SC 2.4.7 is
  *binary* — it fails only if there is **no** perceivable visual change at all when the control gains
  keyboard focus. Compare the *before* (unfocused) crop to the *after* (focused) crop. If literally
  nothing changes — no outline, ring, border, or background shift — then 2.4.7 is **REPRODUCED** (a real
  barrier). If a clear, perceivable indicator appears, 2.4.7 is **NOT REPRODUCED**. This is the call the
  pixels make and the runner could not: do not clear it just because a `box-shadow` rule exists in the
  signals — confirm the change is *visible* in the after crop, on the element's real background.

- **2.4.13 Focus Appearance (AAA, WCAG 2.2): is a present-but-weak indicator strong enough?** When
  *something* changes on focus but it is faint — a small scale bump, a transparent/near-transparent
  outline, or a light ring on a light background — that is a **2.4.13 (AAA)** strength concern, NOT a
  2.4.7 failure. The 2.4.13 bar (≥2 CSS-px-equivalent area of change and ≥3:1 contrast between the
  focused and unfocused states) is what you weigh here, over the same before/after crops. Watch the
  *actual* background the indicator sits on, not a neutral one.

## Evidence you are handed

You do not gather any of this — it is precomputed and handed to you:

- **Precomputed a11y-eval signals** — the focus runner's output for the control: whether a
  `:focus`/`:focus-visible` rule sets `outline:none`/`outline:0`, whether a replacement (e.g. a
  `box-shadow` ring) is declared, the computed before/after styles, and the modality flag confirming the
  indicator was captured under **keyboard** focus. Treat these as the runner's measurement, not something
  to re-derive.
- **The (realism-corrected) VSR transcript** — what the virtual screen reader announced as focus landed
  on the control. Use it only to confirm focus actually reached this control; the focus *indicator* is a
  visual question the transcript cannot answer.
- **The declared vision crops** — the **before/after focus crops**: the control unfocused, then the same
  control after a real keyboard Tab, captured at the element's real background. These are your primary
  evidence — read both PNGs and judge the change between them.

## WCAG soundness caveats (these STOP a false clear or false barrier)

- **2.4.7 (AA) vs 2.4.13 (AAA) — don't conflate the bar.** SC 2.4.7 (AA) is *binary*: it fails only if
  there is **no** visible focus indicator at all. It sets **no** size or contrast threshold — a
  faint-but-present ring still passes 2.4.7. The "is the indicator strong enough" judgment (≥2
  CSS-px-equivalent area and ≥3:1 contrast between focused/unfocused states) is **2.4.13 Focus
  Appearance, which is Level AAA (WCAG 2.2)**. So report a weak-but-present indicator as a **2.4.13
  (AAA)** concern, not a 2.4.7 failure. Over-claiming a faint ring as an AA failure is a false barrier.
- **Keyboard modality is load-bearing — and already handled.** Most modern sites show the ring via
  `:focus-visible`, which only matches on *keyboard* modality. The runner applied a real keyboard Tab
  (NOT `el.focus()`, which after any mouse interaction yields `:focus-visible` **false, no ring** — a
  false "no indicator"). The handed crops are keyboard-modality crops; do not discount a missing ring on
  a suspicion that the wrong modality was used — the modality flag in the signals already confirms it.
- **`outline:none` in the styles is NOT proof of failure.** A global `outline:none`/`outline:0` is only a
  hint; a replacement `box-shadow`/border may render a real, contrasting indicator. The *after* crop
  decides — clear 2.4.7 only if the pixels show no change, not because a removal rule appears in the CSS
  signals.
- **Judge on the element's real background.** A white ring on a near-white background, or a transparent
  outline, can read as "present" in the CSS yet be invisible in the crop. Weigh contrast against the
  *actual* composited background the indicator sits on.
- **Out of scope:** Forced-colors / Windows High Contrast Mode render their own focus indicators — do not
  treat their crops under this rubric.

## Output

Verdict: **REPRODUCED** (2.4.7 AA — no perceivable change on focus; or 2.4.13 AAA — indicator present but
sub-threshold, flag the level) / **NOT REPRODUCED** (a clear, sufficiently-contrasting indicator appears)
/ **PARTIAL** (the auto-PARTIAL residue you were handed cannot be settled from the crops alone — say what
is missing) / **N/A** (forced-colors or not a focus-indicator question).
