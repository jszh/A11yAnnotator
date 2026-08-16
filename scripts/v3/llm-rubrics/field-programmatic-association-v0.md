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
3. **Requirement/format cue that never reaches the accessible name — by ANY means, not only a graphic.**
   A required-field indicator, a format hint, or a constraint that a sighted user can see but that is
   reflected nowhere in the accessible name or description is REPRODUCED. The cue can be:
   - **graphical** — an asterisk icon, a colour swatch, a small glyph with no adjacent text;
   - **positional or grouped** — a legend above the group ("All fields below are required"), a column
     header, or a footnote elsewhere on the page that the field itself never references;
   - **stylistic** — a bold or coloured label where the styling IS the signal (this overlaps 1.4.1; both
     can hold, and here the question is only whether the accessible name carries it);
   - **placeholder-only** — a format shown solely in `placeholder`, which is not a reliable accessible
     description and disappears once the user types.
   The test is not what KIND of cue it is; it is whether an AT user receives it at all.
   *Do not* flag a cue that is plain text inside a correctly-associated label: a `*` character or
   "(required)" sitting in the visible label text is normally ALSO in the accessible name once that label is
   programmatically associated. Check `element-crop`/`surrounding-region` to confirm whether the cue is
   genuinely unreachable (an icon, a separate legend, styling alone) or just plain text you would expect a
   correctly-associated label to carry.

**Evidence handed to you:** `element-crop` (the field), `surrounding-region` (wider context — including any
enclosing `<table>` grid), the field's role/type, its accessible name/description, and (when the field is a
`grouping-and-reading-order` subject) `signals.structure.tables` if a table is present on the page.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- A programmatic name that matches or supersets the visible label is correct — capitalization/punctuation/
  trailing-colon differences are NOT a barrier.
- Per TT 5.C: form fields are NOT required to be programmatically associated with form SECTION HEADINGS
  unless there's a significant risk of confusion without it — do not invent a barrier for a field simply
  because it isn't tied to a `<h2>`/`<fieldset><legend>` section title elsewhere on the page. This applies to
  radio buttons and checkboxes too: a `<fieldset><legend>` (or equivalent) tying the group to its overall
  question is GOOD PRACTICE, not an absolute 1.3.1 requirement — the DHS Trusted Tester procedure's own
  worked example for 5.C conforms with exactly this shape: a heading posing the question, followed by
  `<label for>`-associated radio options and NO fieldset/legend, because each option's own accessible name
  already tells a screen-reader user what it does. Do NOT flag a missing group association as a barrier merely because a
  section heading/question exists nearby and isn't programmatically tied to the group.
- The one exception: flag it ONLY when the option's own accessible name is GENUINELY AMBIGUOUS without the
  group question — e.g. options literally named "Yes"/"No"/"Option A" with no visible common question nearby,
  where a screen-reader user hearing just the option name in isolation could not tell what they're choosing
  between. A self-explanatory option name ("Credit Card", "Online Banking", "Email me", "Call me") is NOT
  ambiguous even without the group context — do not flag it.
- If the crop is inconclusive about what's actually visible (label text unreadable, table context cropped
  out), return PARTIAL rather than inventing a mismatch.
- Do not judge whether a visible label exists AT ALL (3.3.2), error-message wording, or required-field
  VALIDATION behavior here; other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
