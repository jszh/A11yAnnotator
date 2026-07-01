---
id: field-programmatic-association-v0
sc: 1.3.1
skill: grouping-and-reading-order
visionEvidence: [element-crop, surrounding-region]
---

# 1.3.1 — form field programmatic association (v0 atomic rubric)

**Why this is 1.3.1, not 3.3.2.** Per this project's own Trusted-Tester reference
(`refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`), 3.3.2 is satisfied by a purely VISUAL label or
instruction — no programmatic requirement at all. Whether that visible relationship is ALSO
PROGRAMMATICALLY determinable — the accessible name/description a screen-reader user hears — is 1.3.1
(`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`, Test 5.C: "the combination of the accessible
name, accessible description, and other programmatic associations (e.g., table column and/or row
associations) describes each input field and includes all relevant instructions and cues (textual and
graphical)"). Judge the PROGRAMMATIC side here; do not re-litigate whether a visible label exists at all —
that is 3.3.2's question, not yours.

**Division of labor (v3.2).** You do NOT investigate the page. The builder already located the form field,
extracted its programmatic accessible name/description, captured its visible label, and screenshotted the
element plus its surrounding region. Your job is to JUDGE whether that programmatic name/description fully
captures what a sighted user reads — visually AND via table position — not to crawl the form.

**Judge — three ways a field can fail 1.3.1 even when SOMETHING is visually labeled (3.3.2 may still pass):**
1. **Broken/absent association:** a visible label exists next to the field but is NOT programmatically tied
   to it — e.g. a `<span for="...">` (the `for` attribute has no effect outside `<label>`), a label element
   with a `for` value that doesn't match any field `id`, or a bare adjacent text node with no `for`/
   `aria-labelledby`/wrapping relationship at all. The accessible name in that case is empty, generic, or
   silently falls back to something else (a placeholder, a `title`) that a sighted user does NOT see as the
   field's label — REPRODUCED.
2. **Missing table-context association:** the field sits inside a `<table>` where its row/column position
   supplies part of its meaning to a sighted user (e.g. an unlabeled input in a row headed by `<th
   scope="row">Zip</th>`) — check `surrounding-region` for a table grid around the field. If the accessible
   name/description does NOT include what the row/column header conveys, and the field's own name is
   otherwise generic or absent, that context is lost to AT — REPRODUCED. If the field's own accessible name
   already fully identifies it (e.g. `aria-label="Zip"` matching the row header), the table position is
   redundant, not required — NOT REPRODUCED.
3. **Graphical-cue-only requirement/format marker:** a required-field indicator or format hint conveyed ONLY
   graphically (an asterisk icon, a color swatch, a small glyph with no adjacent text) that is not reflected
   anywhere in the accessible name or description — REPRODUCED. A textual cue (a `*` character, "(required)")
   already inside the visible label text is normally ALSO in the accessible name once that label IS
   programmatically associated — check `element-crop`/`surrounding-region` to confirm whether the cue is
   genuinely graphics-only (an icon) or just plain text you'd expect a correctly-associated label to carry.

**Evidence handed to you:** `element-crop` (the field), `surrounding-region` (wider context — including any
enclosing `<table>` grid), the field's role/type, its accessible name/description, and (when the field is a
`grouping-and-reading-order` subject) `signals.structure.tables` if a table is present on the page.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- A programmatic name that matches or supersets the visible label is correct — capitalization/punctuation/
  trailing-colon differences are NOT a barrier.
- Per TT 5.C: form fields are NOT required to be programmatically associated with form SECTION HEADINGS
  unless there's a significant risk of confusion without it — do not invent a barrier for a field simply
  because it isn't tied to a `<h2>`/`<fieldset><legend>` section title elsewhere on the page.
- At minimum, radio buttons and checkboxes should be programmatically associated with both their own
  response text AND (via a shared `<fieldset><legend>` or equivalent) the overall question — a checkbox/radio
  named only by its own value with no group context, where the group question is visually apparent but not
  associated, IS a barrier.
- If the crop is inconclusive about what's actually visible (label text unreadable, table context cropped
  out), return PARTIAL rather than inventing a mismatch.
- Do not judge whether a visible label exists AT ALL (3.3.2), error-message wording, or required-field
  VALIDATION behavior here; other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
