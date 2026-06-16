---
name: forms-instructions-errors
description: Judge whether form fields have persistent labels/instructions, required state conveyed in text (not color/asterisk alone), and whether validation errors are identified in text and programmatically associated — over the signals, VSR transcript, and before/after submit crops the harness hands you.
covers: cat_9 (primary)
wcag: 3.3.1 Error Identification (A); 3.3.2 Labels or Instructions (A); 3.3.3 Error Suggestion (AA)
instruments: DOM, AX tree, submit driver + dynamic-announcement, vision
behavioral: partial (label/instruction=static; error identification=needs submit)
---

> **v3.2 division of labor (LLM lane).** In Harness v3.2 you do NOT investigate or drive tools — the
> collector and the deterministic runners already measured the page and HAND you their signals + the
> (realism-corrected) VSR transcript + vision crops. Your job is to JUDGE MEANING over that evidence,
> not to re-run `--eval`/`/ax-node` or drive a submit. Where a deterministic runner already disposed an
> obligation (a CLAIM exists) you are NOT asked about it — the builder only hands you the auto-PARTIAL
> residue, so DEFER to the runner and never re-litigate (e.g. do not re-judge 1.4.3 contrast the runner
> owns). KEEP every WCAG soundness caveat below: they are what STOP a false clear or false barrier.


# forms-instructions-errors

## v3.2 division of labor
You do **not** investigate this page and you do **not** drive a submit. The collector +
deterministic runners already measured every field, already ran the submit driver, and
already disposed the obligations they own — handing you their **signals**, the
**(realism-corrected) VSR transcript** of the submit attempt, and the declared **vision
crops** (before/after submit). Your job is to **judge meaning** over that handed evidence:
is the label real, is "required" in text, did a *detected* error get *identified in text*?

- **Judge over the handed evidence** — never re-derive it. If the submit driver reported a
  per-field `validationMessage`, you read that string and decide what it means; you do not
  re-submit to get it.
- **Defer where a runner already disposed it.** If a deterministic runner emitted a CLAIM
  for a field/obligation, that obligation is settled — you are **not** asked about it. You
  only receive the **auto-PARTIAL residue**: the fields/errors the runner could not
  conclusively dispose (the submit couldn't complete, the field loaded on a later step,
  the message wiring is ambiguous). Judge *those*, and leave the rest to the runner.
- Do not manufacture a verdict from evidence you weren't handed. No submit crop and no
  driver `validationMessage` for an error path → that path is un-demonstrated; say so.

## What you JUDGE
Three obligations, scoped to the evidence you hold:

**3.3.1 Error Identification (A) — over the before/after submit crops + driver signals.**
3.3.1 = *if an input error is automatically detected, the item in error is identified and the
error is described in text.* The **native HTML5 constraint-validation** path (the UA shows a
text bubble, focuses the invalid field, and common SR pairings announce it) generally
**meets 3.3.1**
(https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html). So judge from what
the driver demonstrated, not from the absence of ARIA:
- A non-empty per-field **`validationMessage`** in the handed signals **is** text
  identification of the error → 3.3.1 **met** (this is the native-validation path; capture
  the `validationMessage` string in your verdict as the evidence).
- A 3.3.1 failure must be **demonstrated** by the handed before/after submit crops + driver
  signals: an error was detected (submit blocked / field invalid) **and** *no text
  identification appeared by any means* — no native `validationMessage`, no visible error
  text in the after-crop, no programmatic description.

**3.3.2 Labels or Instructions (A) — over the per-field name signals + label crop.**
- **Persistent label.** If the only name source the collector found is a `placeholder`
  (BuzzFeed email "Enter your email"), it disappears on input → **REPRODUCED**. A real
  `<label for>` / `aria-label` / `aria-labelledby` that persists → satisfied. (Name
  computation itself is owned by **name-role-state**; you judge persistence + adequacy here.)
- **Required indication.** Is "required" conveyed in **text**, or only by color / an
  asterisk? The handed signals tell you whether a `*` exists (including CSS
  `::after{content:"*"}`) and whether any explanatory **legend** ("Fields marked * are
  required") appears in the page text. Asterisk(s) with **no** legend, and the VSR reading
  the label *without* the asterisk (Harvey: 12 `_required_…::after{content:"*"}` labels,
  no legend) → **REPRODUCED**.

**3.3.3 Error Suggestion (AA) — over the before/after submit crops.**
- 3.3.3 asks whether, when an error is detected *and a correction is known*, a **suggestion**
  for fixing it is provided in text. Judge this over the after-submit crop + any error text /
  `validationMessage`: does the surfaced text merely flag the field, or does it tell the user
  *how to fix it* (e.g. "Enter a valid email like name@host.com", "Password needs 8+
  characters")? A native message that exists but is bare ("Please fill out this field") may
  satisfy 3.3.1 yet be a **3.3.3** shortfall — say which SC you are scoring.

## Evidence you are handed
You judge over precomputed a11y-eval signals, the VSR announcement transcript, and the
declared vision crops — you do not collect any of it:

- **Per-field labelling signals** — for each input, the resolved name source(s):
  `<label for>`, `aria-label`, `aria-labelledby`, `placeholder` (and whether the name is
  placeholder-only, i.e. vanishes on input).
- **Required-indication signals** — presence of `*` per label (including CSS
  `::after{content:"*"}`), and whether an explanatory legend phrase exists anywhere in the
  page text.
- **Submit-driver signals (`forms[]`)** — the runner already drove the submit; you receive
  per field: `submitBlocked` / `validity.*`, the native **`validationMessage`** string,
  whether `document.activeElement` moved to the invalid field, whether visible error text
  appeared, whether it was **announced** (the VSR transcript from **dynamic-announcement**),
  and whether it was **associated** (`aria-describedby`).
- **VSR announcement transcript** — the (realism-corrected) `lastSpokenPhrase` /
  `spokenPhraseLog` for the submit attempt: what a real SR pairing would actually voice.
- **Declared vision crops** — the **before** and **after** submit screenshots (and the label
  crop), so you can see whether error text became visible without re-running anything.

## WCAG soundness caveats (these STOP a false clear or a false barrier)
- **Do NOT infer a 3.3.1 failure from the mere absence of `aria-invalid`, `role=alert`, or a
  live region.** That absence is not a failure by itself — the native-validation path can
  still meet 3.3.1.
- **A non-empty `validationMessage` is text identification** → 3.3.1 met. Do not score a
  3.3.1 failure when the driver handed you a real native message.
- **A 3.3.1 failure must be demonstrated.** Only a *demonstrated* detected error (submit
  blocked / field invalid in the handed signals) with **no** text identification by any
  means is 3.3.1 **REPRODUCED**. Never infer a definite 3.3.1 from an un-demonstrated error.
- **Separate the SCs.** A native message that exists but isn't programmatically
  associated/announced is a **3.3.3 / robustness** concern, not an automatic 3.3.1 failure —
  name the SC you are scoring. A bare message (no fix suggestion) is 3.3.3, not 3.3.1.
- **Un-demonstrated error path → never a definite 3.3.1.** If the field/step isn't in the
  snapshot (VitalChek date loads on a later AJAX step; Panera form is a Vue overlay; Amazon
  password is a later step), or the submit couldn't complete so no error was demonstrated,
  you were handed only the static label/required wiring → **PARTIAL / N-A**, not a barrier.
- **Required-without-legend needs both halves.** Asterisk-only "required" is a 3.3.2 failure
  *only* when no explanatory legend exists in the page text **and** the SR reads the label
  without the asterisk — confirm both from the handed signals.

## Output
A single verdict per finding: **REPRODUCED** / **NOT REPRODUCED** / **PARTIAL** / **N-A** —
naming the SC (3.3.1 / 3.3.2 / 3.3.3) and quoting the load-bearing evidence (the
`validationMessage` string, the placeholder-only name, the missing legend, or the
before/after crop). Static label/required checks are reliable; an un-demonstrated error path
is **PARTIAL**, never a definite 3.3.1.
