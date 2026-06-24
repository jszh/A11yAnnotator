# case-04 — Sponsor wordmarks: "N. A. S. A." (initialism, PASS) vs "A M A Z O N" (word, FAIL)

## Scenario
An online magazine's "partners & sponsors" section presents two sponsors as text wordmarks
styled to look like logos. One reads `N. A. S. A.` and the other `A M A Z O N`. Visually both
are big, bold, letter-separated capitals — they look like the same design treatment. But
"N. A. S. A." is an initialism (each letter stands for a word; the spacing is the F32 carve-out
and is fine), whereas "A M A Z O N" is the single brand word "Amazon" shattered into letters
(an F32 failure). The annotator must classify each independently on the same page.

## Attribute tuple
- **Content domain:** news / long-form editorial (magazine sponsor page)
- **UI component / pattern:** sponsor "logo" cards rendered as styled text wordmarks
- **Host-language construct:** `<span class="wordmark">` text nodes; one with periods+spaces (acronym), one with plain spaces (word)
- **Locale / i18n:** en
- **Failure mechanism:** intra-word white space breaking a brand WORD (FAIL) placed beside a punctuated initialism (PASS) to force per-token classification

## Developer persona
A magazine's part-time web editor didn't have vector logos for either sponsor, so they faked
both as text wordmarks. They wrote "N. A. S. A." with periods because that's how they'd seen the
acronym written, and spaced "A M A Z O N" with the space bar to make it feel logo-like and wide.
They treated the two as the same stylistic choice, unaware one is an acronym and one is a word.

## Element / selector carrying the issue
`.logo-card .wordmark` containing `A M A Z O N` (and the inline `<strong>A M A Z O N</strong>`
in the body) — the FAIL. The PASS control is the sibling `.wordmark` / `<strong>` containing
`N. A. S. A.`, an initialism.

## Exact accessibility mechanism
"Amazon" is one lexeme; inserting a space between every letter yields the text node "A M A Z O N",
which a screen reader reads as six isolated capital letters, not the word "Amazon" — the meaning
("a brand named Amazon") is lost or garbled. "N. A. S. A." is an initialism: there is no single
word to break; the letters are *meant* to be read individually, and F32 explicitly says spacing
an initialism is not a failure and may aid comprehension. So identical-looking treatments land on
opposite sides of the SC purely on the word-vs-acronym distinction.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The page fails because of `A M A Z O N` (F32 white space within the word
"Amazon"). `N. A. S. A.` is the carve-out and passes — its presence is what makes the case hard.

## Why automated tools miss it
The wordmarks are live text (not images), the markup is valid, and there are no missing
attributes — axe/WAVE/Lighthouse report nothing. No automated rule distinguishes an initialism
from a spaced word; a "capitals-with-spaces" heuristic would flag both, contradicting F32's
initialism carve-out. Only a human who knows "Amazon" is a word and "NASA" is an acronym can mark
one fail and one pass.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "&nbsp; can also be used to add white space, producing similar failures:"

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "Inserting white space characters into an initialism is not an example of this failure, since the white space does not change the interpretation of the initialism and may make it easier to understand."
