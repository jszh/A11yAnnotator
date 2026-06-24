# case-06 — Tab-spaced "S⇥U⇥M⇥M⇥E⇥R" (FAIL) with inter-word spacing (PASS) and a promo code (carve-out)

## Scenario
A coffee roaster's "summer drop" landing page has a big monospace wordmark that reads `SUMMER`,
built inside a `<pre>` with a literal TAB character between every letter so the tabs survive HTML
whitespace collapsing. That breaks the word "Summer." The same page contains ordinary
multi-word prose ("Welcome to our shop", "taste the season") — normal inter-word spacing, which
F32 explicitly allows (PASS) — and a promo code `SAVE20` rendered wide with CSS letter-spacing,
which is an intact code token (a subtler carve-out: code/identifier, not a prose word).

## Attribute tuple
- **Content domain:** e-commerce — specialty coffee / DTC retail
- **UI component / pattern:** hero wordmark in `<pre>` + promotional code callout + body copy
- **Host-language construct:** `<pre>` with TAB (U+0009) characters between letters; sibling prose with normal spaces; `.code` token styled with CSS `letter-spacing`
- **Locale / i18n:** en
- **Failure mechanism:** TAB white-space characters inserted within a word (F32's tab case), contrasted with inter-word spacing (carve-out) and a CSS-spaced code identifier (carve-out)

## Developer persona
A marketing-savvy shop owner hand-edited the theme's hero. To get the wide retro look they typed
the letters of "SUMMER" with the Tab key in a `<pre>` block (they'd learned `<pre>` "keeps your
spacing"). The promo code they styled with the theme's letter-spacing class. They assumed all the
wide text was equivalent.

## Element / selector carrying the issue
`.hero pre.wordmark` — text node `S⇥U⇥M⇥M⇥E⇥R` (real U+0009 tabs between letters), the FAIL. The
PASS controls are the `<h2>` / body prose with normal inter-word spaces, and the `p.code` token
`SAVE20`, whose characters are unbroken (wide look from CSS only).

## Exact accessibility mechanism
A `<pre>` preserves the tab characters in the text node, so the wordmark's programmatic text is
"S\tU\tM\tM\tE\tR." A screen reader announces six isolated letters (or tab-separated fragments),
not "Summer" — F32 names tab as one of its white-space mechanisms. The prose "Welcome to our
shop" has spaces *between* words only, which F32 says is not a failure. `SAVE20` is a code read as
a unit; its width comes from CSS `letter-spacing`, leaving the token intact, so it is not a broken
word. The single page therefore mixes one FAIL with two distinct carve-outs.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The page fails because of the tab-spaced `SUMMER` wordmark (F32). The
inter-word prose and the CSS-spaced `SAVE20` code are carve-outs and pass.

## Why automated tools miss it
The `<pre>` holds live text (not an image), the page is valid, and tabs are legal characters —
axe/WAVE/Lighthouse have no rule that detects TAB characters between a word's letters, so the
failure is invisible. They also can't certify the carve-outs: that "Welcome to our shop" is
legitimate inter-word spacing, or that `SAVE20` is a code rendered with CSS rather than a word
broken by spaces. Word vs. inter-word-spacing vs. code-identifier is a human semantic judgement.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "The objective of this technique is to describe how using white space characters, such as space, tab, line break, or carriage return, to format individual words visually can be a failure to present meaningful sequences properly."

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "The use of white space between words for visual formatting is not a failure, since it does not change the interpretation of the words."
