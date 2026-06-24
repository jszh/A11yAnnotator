# case-06 — Portfolio name in "fancy font" Mathematical Alphanumeric glyphs (long-tail F71)

## Scenario
A designer's one-page portfolio shows a display name and role at the top:
**"Sumi Tanaka" / "Designer & Illustrator."** Both were run through a social-media
"fancy text" generator that maps each Latin letter to a glyph from the Unicode
**Mathematical Alphanumeric Symbols** block: the name uses Mathematical Sans-Serif Bold
(e.g. S → `U+1D5E6`, u → `U+1D602`), the role uses Mathematical Sans-Serif Italic
(e.g. D → `U+1D60E`). These code points are math-notation symbols, not alphabet letters;
their glyphs only resemble bold/italic Latin. No `aria-label` and no visually-hidden
plain-Latin name is provided.

## Attribute tuple
- **content-domain:** personal / creative portfolio
- **UI-component / pattern:** hero name + role line on a profile page
- **host-language construct:** `<h1>` and `<p class="role">` text nodes
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Mathematical Alphanumeric Symbols (U+1D400–U+1D7FF)
- **failure-mechanism:** F71 look-alike substitution via styled-Unicode "fancy fonts" (long-tail variant), no text alternative

## Developer persona
A self-taught designer built the site by hand and wanted a distinctive "font" for their
name without loading a webfont. They pasted their name into an Instagram-bio "𝕗𝕒𝕟𝕔𝕪 𝕥𝕖𝕩𝕥"
generator, copied the bold result, and dropped it straight into the heading — a workflow
they'd used for years on social profiles. It looks like a custom typeface and renders
everywhere, so they assumed it was just styling.

## Element / selector carrying the issue
- `section.hero > h1` — text decodes to `U+1D5E6 U+1D602 U+1D5FA U+1D5F6` (space)
  `U+1D5E7 U+1D5EE U+1D5FB U+1D5EE U+1D5F8 U+1D5EE` (visible: "Sumi Tanaka").
- `section.hero > p.role` — Mathematical Sans-Serif Italic glyphs (visible: "Designer & Illustrator").
- Neither has an `aria-label` or a visually-hidden plain-Latin equivalent.

## Exact accessibility mechanism (what AT experiences)
Most TTS engines do not map Mathematical Alphanumeric Symbols to their base letters. A
screen reader either announces each glyph by its Unicode name ("mathematical sans-serif
bold capital S, mathematical sans-serif bold small u, …" — unusable verbosity) or, in many
engines, skips them as unknown, so the name reads as silence. Either way the user never
hears "Sumi Tanaka, Designer and Illustrator" — the whole point of the profile. This is the
same SC limb as classic F71: the meaning rides on the glyph shape, not the encoded
characters, and no text alternative exists.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via **F71** (look-alike glyph substitution; here the look-alikes are
styled-Unicode rather than cross-script letters). No graphical name-bearing element exists,
so ACT 1.1.1 rules are *Inapplicable*; the defect is the un-alternatived look-alike text.

## Why automated tools miss it
No img/svg/role=img, so axe-core, WAVE, and Lighthouse report nothing for 1.1.1. The `<h1>`
is a valid, non-empty, high-contrast heading. Worse for automation: these code points are
*letters* by Unicode general category (Lu/Ll), so even a hypothetical "heading contains
non-letter characters" heuristic would not flag them. Recognizing that 𝗦𝘂𝗺𝗶 is "Sumi" in
math-bold — text whose meaning is carried by glyph shape with no alternative — requires
reading the glyphs against the page language, a human judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "The objective of this failure condition is to avoid substituting characters whose glyphs
> look similar to the intended character, for that intended character. The Unicode
> character set defines thousands of characters, covering dozens of writing systems."

**Supporting reference:** same technique, on TTS not processing such glyphs as the intended
letters.

> "While the glyphs for some of these characters may look like the glyphs for other
> characters in visual presentation, they are not processed the same by text-to-speech
> tools."
