---
id: use-of-color-v0
sc: 1.4.1
skill: color-and-visual-text
visionEvidence: [element-crop, surrounding-region]
---

# 1.4.1 — use of color (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The collector extracted the element, its
role/state, and the surrounding context, and screenshotted it. Your job is to JUDGE whether information is
conveyed by COLOR ALONE — whether removing color (or for a color-blind viewer) would lose meaning a
sighted user gets. A deterministic checker cannot reliably tell "color is the ONLY cue" from "color plus a
shape/underline/text label also present", so it leaves these at auto-PARTIAL. Where a deterministic CLAIM
already disposed this obligation, DEFER. This rubric owns the color-ALONE question (F73/F81); it does NOT
judge whether two colors have enough contrast (1.4.11/1.4.3 own that).

**Judge:** is there a SECOND, non-color cue carrying the same information — or is color the only thing
distinguishing the states? Two classic failure modes:
- **Links not distinguished from body text except by color (F73):** in-text links that look identical to
  surrounding prose except for hue — no underline, no weight, no other affordance, and no lightness
  separation — so a color-blind reader cannot find them. Per F73's Procedure, ANY of these satisfies: an
  underline, distinct weight, italic, a shape/icon affordance, OR a sufficient lightness difference between
  link and surrounding text (read as ≥3:1 luminance separation, not merely a different hue at similar
  lightness) — a lightness difference survives color-vision loss, so WCAG counts it as a non-"color-alone"
  cue. The residual F73 barrier is the equal-luminance hue-only link: a hue swap at similar lightness
  (<3:1 luminance separation from the prose) with no other affordance.
- **Status / required / error / selected shown only by color (F81):** a required field marked only by a red
  label, an invalid field flagged only by turning red, a "success/error" state distinguished only by
  green/red, a selected item shown only by a color swap — with no asterisk, icon, text, border, or other
  non-color indicator. (The same state ALSO carrying text/an icon/a shape is NOT a barrier.)

**Evidence handed to you:** the `element-crop` and the `surrounding-region` (so you can compare the
color-cued element against its peers and see whether a second cue is present), the role/state, and any
associated text. Judge from these pixels only.

**Interpreting the deterministic evidence (and why it is uncertain):** this obligation reached you BECAUSE
the deterministic lane could not decide it — for F73/F81 a `contrast.uncertainReason` or a "color-only
cue could not be ruled out" signal means the checker saw a color difference but could not prove a non-color
cue is ALSO present (underline, icon, asterisk, shape, text). Treat that as the exact thing to confirm in
the pixels: hunt for the second cue. CRITICAL invariant: ABSENCE OF A DETERMINISTIC FINDING IS NOT A PASS.
The checker did not certify "a second cue exists" — it punted precisely because it could not tell. So never
infer "no finding ⇒ a non-color cue must be there"; look, and if no non-color cue is visible where one is
needed, that is the barrier. If the crop is ambiguous about whether a faint underline/border exists,
abstain rather than clear.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- The requirement is a non-color cue, not the ABSENCE of color — color PLUS another cue is fine; do not
  flag color used redundantly.
- A cue need not be obtrusive: a visible underline, a shape difference, an icon, an asterisk, or adjacent
  text all satisfy it. Do not insist on any particular form.
- Hover/focus-only differentiation does not count for the default state (the reader must distinguish it at
  rest) — but if you are not handed the rendered states to judge this, return PARTIAL.
- Do not judge ABSOLUTE contrast adequacy here — whether text/UI clears its threshold against the page
  background is 1.4.11/1.4.3's job, and a redundant cue with weak contrast is a 1.4.11/1.4.3 question, not
  a 1.4.1 one. CARVE-OUT (F73): you MAY credit a visible link-vs-surrounding-text LIGHTNESS difference
  (≥3:1 luminance separation between the link color and the prose color) as the required non-color cue —
  that is the RELATIVE comparison F73's Procedure itself sanctions, not a contrast-adequacy judgment. When
  the handed axe `link-in-text-block` signal reports PASS, DEFER to it — axe measured exactly this
  link-vs-surrounding-text separation.
- CRITICAL GUARD — the ≥3:1 escape is F73-ONLY; do NOT extend it to F81 states whose meaning relies on
  perceiving a SPECIFIC color (green=valid / red=invalid, red=required, color-keyed legend states): there
  the user must recognize WHICH color, not merely that the element stands apart, so an additional non-color
  indicator (icon, text, asterisk, shape, border) is required REGARDLESS of contrast ratio.
- When the crop cannot settle whether a second cue is present, return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier —
information conveyed by color alone), NOT REPRODUCED (no barrier — a non-color cue also carries it),
PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
