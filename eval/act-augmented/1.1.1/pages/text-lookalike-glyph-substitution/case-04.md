# case-04 — "Login" via numeric character entities (F71 entity variant)

## Scenario
A credit-union sign-in page shows a form whose heading and whose submit button both read
**"Login."** Both are authored entirely as numeric character entities that decode to
look-alike code points: `&#x004C;&#x03BF;&#x0067;&#x0456;&#x006E;` = `L` + Greek small `o`
(`U+03BF`) + `g` + Cyrillic small `i` (`U+0456`) + `n`. After the browser parses the
entities, the DOM text nodes contain the Greek o and Cyrillic i. No `aria-label` and no
visually-hidden Latin "Login" is provided.

## Attribute tuple
- **content-domain:** banking / financial services authentication
- **UI-component / pattern:** login form (`<h1>` heading + `<button type="submit">`)
- **host-language construct:** numeric character entities (`&#xNNNN;`) in heading and button label
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Greek + Cyrillic
- **failure-mechanism:** F71 CHARACTER-ENTITY variant — meaning carried by decoded look-alike glyphs

## Developer persona
A back-end engineer hand-maintains a legacy server-rendered template and habitually
HTML-escapes any "special-looking" character into a numeric entity to be safe. The original
designer's mockup used a fancy Greek-o / Cyrillic-i in "Login" for a subtle look; the
engineer dutifully converted each glyph to its `&#xNNNN;` entity, assuming entities are
"just encoding" and therefore harmless. They never decoded them back to check which letters
they actually are.

## Element / selector carrying the issue
- `main.card > h1` — entities decode to `U+004C U+03BF U+0067 U+0456 U+006E` (visible: "Login").
- `form button[type=submit]` — same entity string; the button's accessible name decodes to
  the same confusable word. Neither has an `aria-label` or hidden Latin alternative.

## Exact accessibility mechanism (what AT experiences)
Entities are decoded before the accessibility tree is built, so AT sees the *characters*,
not the markup. A screen reader announces the heading and the submit button as the
mixed-script string (Greek o, Cyrillic i), e.g. "L <greek-o> g <cyrillic-i> n" — not
"Login." A blind user cannot identify the form or confidently activate the correct submit
control on a security-sensitive banking page. Per F71 — which explicitly covers entities —
the look-alike text has no text alternative.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via **F71** (character-entity branch). The button name is non-empty
(so axe `button-name` passes), and no graphical element exists (so ACT 1.1.1 rules are
*Inapplicable*); the defect is the un-alternatived look-alike text.

## Why automated tools miss it
Two layers defeat scanners here. First, after parsing, entities *are* characters, so
"source uses entities" tells a tool nothing. Second, the resulting heading and button are
valid, non-empty, high-contrast — axe-core, WAVE, and Lighthouse pass them. No img/svg/role
=img exists, so all ACT 1.1.1 rules are Inapplicable. Catching this requires decoding the
entities and comparing the resulting glyphs to the page language — a human reading judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "This failure also applies to the use of character entities. It is the incorrect
> character used because of its glyph representation that comprises a failure, not the
> mechanism by which that character is implemented."

**Supporting reference:** same technique, on the entity example rendering as real text.

> "In this case, the characters are implemented with character entities, but the word will
> still not be processed meaningfully, and a text alternative is not provided."
