# case-03 — "Buy Now" primary CTA link whose accessible name is confusables

## Scenario
A product page for noise-cancelling headphones has a prominent primary call-to-action — an
`<a>` styled as a green button — whose visible text reads **"Buy Now."** The characters are
`B u у` (space) `N о w`: the "y" is Cyrillic `у` `U+0443` and the "o" is Cyrillic `о`
`U+043E`; the rest are Latin. The link has no `aria-label`, so its accessible name is
computed from this mixed-script text.

## Attribute tuple
- **content-domain:** consumer electronics / e-commerce product detail page
- **UI-component / pattern:** primary CTA link styled as a button (`<a class="buy">`)
- **host-language construct:** link text content (accessible name derived from it)
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Cyrillic
- **failure-mechanism:** F71 confusables on the single most important CONTROL, no text alternative

## Developer persona
A growth/CRO engineer A/B-tests CTA copy. To get a "unique" tracking variant past an
internal dedupe check that keyed on literal button strings, they pasted a "zero-width /
look-alike text" snippet from a Stack Overflow answer about bypassing string filters,
which silently swapped the y and o for Cyrillic. The variant looked identical, clicked
fine, and won the test — so it went to 100% of traffic.

## Element / selector carrying the issue
- `.product .buybar > a.buy` — text content decodes to `B u U+0443 space N U+043E w`
  (visible: "Buy Now"); no `aria-label`. Accessible name = the confusable string.

## Exact accessibility mechanism (what AT experiences)
A screen reader announces the link by its accessible name. Because two of the letters are
Cyrillic, the user hears a mixed-script jumble — e.g. "B u <cyrillic-u> N <cyrillic-o> w,
link" or a foreign-language reading — not "Buy Now, link." The most important action on the
page is unidentifiable; a user navigating by links list or by tabbing to controls cannot
tell this is the purchase button. Per F71 the look-alike control text has no text
alternative.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via **F71**. Note this is the *non-text content that is a control*
situation of 1.1.1: a name is required so the user knows the control's purpose; the name is
present but is confusable glyphs, not the word. (axe's link-name rule PASSES because the
name is non-empty; no img/svg/role=img exists, so ACT 1.1.1 rules are *Inapplicable*.)

## Why automated tools miss it
The link has a non-empty accessible name, so axe-core `link-name`, WAVE, and Lighthouse all
report it as fine. There is no graphical name-bearing element, so every ACT 1.1.1 rule is
Inapplicable. Scanners cannot tell that the accessible name is a confusable spelling of "Buy
Now" rather than a legitimate string. Catching it requires reading the glyphs against
`lang="en"` and recognizing the cross-script substitution — a human judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "The objective of this failure condition is to avoid substituting characters whose glyphs
> look similar to the intended character, for that intended character."

**Supporting reference:** WCAG Understanding 1.1.1, on controls needing a purpose-conveying
name (`wcag-understanding/non-text-content.html`).

> "a name
> is provided to describe the purpose of the non-text content so that the person at
> least knows what the non-text content is and why it is there."
