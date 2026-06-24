# case-05 — Bibliography: corresponding author conveyed only by a bold name (no markup, no legend)

## Scenario
A journal issue's article-listing page. Each paper's author list shows **one name in bold**. In
this scholarly venue, the bold name designates the **corresponding author** — the person to
contact about the work. The bold is a plain `<span class="corr">` styled `font-weight:700`. There
is no "(corresponding author)" text, no asterisk-and-legend, no email/link tied to the bold name,
no ARIA, and no colour cue. The corresponding-author relationship lives only in the font weight.
A subtle hardening: the intro paragraph *also* uses bold (`.em-decoy`) for ordinary emphasis
("2025 Estuary Symposium"), so bold is not even a consistent marker — defeating any attempt to
reverse-engineer the convention from the page alone.

## Attribute tuple
- **content-domain:** developer/academic reference — scholarly journal listing
- **UI-component/pattern:** citation/reference list (`<article class="cite">` per paper)
- **host-language construct:** `<span>` with `font-weight: 700`
- **locale/i18n:** en (international author names; no lang issue)
- **failure-mechanism:** "corresponding author" special status conveyed by bold weight with no
  markup and no text equivalent, compounded by an inconsistent decoy use of the same weight (F2;
  G117 not applied)

## Developer persona
A postdoc maintains the journal's HTML listing by hand from a LaTeX/BibTeX workflow. In the
print PDF, the corresponding author is bolded (the journal's house style). Porting to HTML, they
wrapped the corresponding author's name in a `<span style="font-weight:700">` to match — but
never carried over the print edition's footnote legend ("Corresponding author shown in bold").
They also bolded a phrase in the intro for emphasis, unaware that this made the bold marker
ambiguous.

## Element / selector carrying the issue
`span.corr` — the bold author in each article (e.g. "Thomas Okafor", "Aisha Rahman",
"Marcus Webb", "Eleanor Page"). The bold weight is the sole carrier of the corresponding-author
status. (`span.em-decoy` in the intro shows the same weight used decoratively.)

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user reading an author list hears "Priya Nair, Thomas Okafor, Lena Brandt, Wei
Zhang" — every name in the same voice; `font-weight` is not announced and is not part of any
accessible name or property. So the user cannot tell which author is the corresponding author and
has no way to know whom to contact for data or materials — the page intro even tells them to
"contact the relevant author," yet which one is "relevant" is signalled only by bold. A braille
user gets the same flat list; a low-vision user with a weight-normalising stylesheet loses the
cue. The "corresponding author" relationship is conveyed by presentation alone, available neither
programmatically nor in text, so 1.3.1 fails.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`font-weight:700` on a `<span>` is valid and appears on virtually every web page as decorative
emphasis — no checker flags it, and no checker could, since flagging all bold text would be
absurd. axe-core, WAVE and Lighthouse cannot know that *in this listing* bold encodes
"corresponding author," cannot detect that the meaning is stated nowhere, and certainly cannot
notice that a second bold use is merely decorative (making the marker ambiguous). Recognising the
convention, reading the names, and confirming the absence of any legend is layered human/domain
judgment.

## Citation
> **WCAG Techniques, F2:**
> "This document describes a failure that occurs when a change in the appearance of text conveys
> meaning without using appropriate semantic markup."

(Verbatim from `wcag-techniques/failures/F2.html`. The bold weight changes the appearance of one
name to convey "corresponding author" with no semantic markup or text equivalent.)

> **WCAG 2.2 Understanding 1.3.1 (Intent):**
> "words that have special status are indicated by changing the font family and /or bolding,
> italicizing, or underlining them … Having these structures and these relationships
> programmatically determined or available in text ensures that information important for
> comprehension will be perceivable to all."

(Verbatim from `wcag-understanding/info-and-relationships.html`. The corresponding author is a
"word that has special status" indicated by bolding; here that status is neither programmatically
determined nor available in text.)
