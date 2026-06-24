# case-07 — BOUNDARY / PASS: confusable heading WITH a text alternative + legitimate Greek

## Scenario
A kitchen-knife brand ("Cookwell") page is deliberately constructed to look like an F71
candidate but to **conform**, so a judge must separate abuse from correctness:

- **(A) Provided text alternative.** The hero heading visually reads "Cook well, eat well."
  The word "Cook" is rendered with the same confusable glyphs as the failing cases
  (`U+03F2 U+043E U+03BF` + Latin `k`), but those glyphs are marked `aria-hidden="true"`
  and an adjacent `<span class="sr-only">Cook</span>` supplies the real Latin word as a
  text alternative.
- **(B) Legitimate multilingual content.** A recipe quotes real Greek — the dish name
  `τζατζίκι` and the phrase `Καλή όρεξη` ("enjoy your meal") — each wrapped in `lang="el"`.
  This is genuine, language-tagged Greek used as Greek, not confusables.
- **(C) Plain-Latin control.** The brand "Cookwell" and the CTA "Shop knives" are ordinary
  Latin throughout.

## Attribute tuple
- **content-domain:** kitchenware / cooking (with a recipe)
- **UI-component / pattern:** hero heading + recipe card + `blockquote`
- **host-language construct:** `aria-hidden` decorative glyphs + visually-hidden real-text span; `lang="el"` spans
- **locale / i18n:** en page (`lang="en"`) with correctly-tagged Greek (`lang="el"`) inclusions
- **failure-mechanism:** NONE — text alternative present for the look-alike range; foreign script is legitimate

## Developer persona
An accessibility-aware developer wanted the stylized confusable wordmark the marketing team
loved, but did it right: they hid the decorative glyphs from AT and exposed a real-text
"Cook" for screen readers, and they language-tagged the genuine Greek in the recipe. This is
the conformant counterpart to the failing cases.

## Element / selector carrying the issue
- `section.hero > h1 > span[aria-hidden=true]` — confusable glyphs, hidden from AT
  (decorative); `section.hero > h1 > span.sr-only` — real Latin "Cook" (the text alternative).
- `.recipe .greek[lang=el]` ("τζατζίκι") and `blockquote span[lang=el]` ("Καλή όρεξη") —
  legitimate, language-tagged Greek.

## Exact accessibility mechanism (what AT experiences)
A screen reader skips the `aria-hidden` confusable glyphs and reads the `sr-only` text, so
the heading is announced as "Cook well, eat well." — correct and meaningful. The Greek
spans, tagged `lang="el"`, are announced with Greek pronunciation as genuine Greek words.
No range of text relies on look-alike glyphs without an alternative, so F71's failure
condition ("there is not a text alternative for any range of text that uses look-alike
glyphs") is not triggered.

## Expected ACT-style outcome
**passed** — SC 1.1.1. The look-alike range has a text alternative; the foreign script is
legitimate language-tagged content. (As with the failing cases, no img/svg/role=img exists,
so the formal ACT 1.1.1 *rules* are Inapplicable; the human/SC-level judgment is PASS.)

## Why automated tools miss it
The symmetry point: just as scanners cannot *detect* the F71 failures (no graphical element;
valid non-empty text), they equally cannot *confirm* this page is fine. axe-core, WAVE, and
Lighthouse have no model that the hidden `sr-only` "Cook" rescues the decorative confusable
heading, nor that the Greek is legitimate rather than abuse. Both the pass here and the
failures elsewhere require the same human reading judgment — which is exactly why this
boundary control belongs in the set.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "If look-alike glyphs are used, and there is not a text alternative for any range of text
> that uses look-alike glyphs, then the content does not meet the Success Criterion."

**Supporting reference:** WCAG Understanding 1.1.1, on alternatives matching the language of
content (`wcag-understanding/non-text-content.html`).

> "Text alternatives and equivalents should match the human language of the original content
> (normally the default human language of the page)."
