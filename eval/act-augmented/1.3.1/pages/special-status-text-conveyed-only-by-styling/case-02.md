# case-02 — Policy redline: insertions underlined, deletions struck through via CSS spans (no `<ins>`/`<del>`, no change list)

## Scenario
A municipal by-law amendment published on a city-clerk web page, shown as "tracked changes":
deleted wording is **struck through** and new wording is **underlined**. The markup uses plain
`<span class="removed">` / `<span class="added">` styled only with CSS `text-decoration`
(`line-through` / `underline`). There is no `<ins>`/`<del>` markup, no "summary of changes" or
change-history list, no inline "(added)"/"(removed)" text, and no colour difference. The meaning
"this text was added" lives only in the underline; "this text was deleted/repealed" lives only
in the strike-through.

## Attribute tuple
- **content-domain:** government / civic by-law (legal-policy)
- **UI-component/pattern:** ordered-list legal clauses with inline tracked-changes spans
- **host-language construct:** `<span>` + CSS `text-decoration: line-through | underline`
- **locale/i18n:** en (municipal English)
- **failure-mechanism:** insertion/deletion status conveyed by strike-through & underline with
  no semantic markup and no change-history text equivalent (F2; G117's own "change history"
  example not applied)

## Developer persona
A city-clerk staffer maintains the site in a plain HTML editor. Their internal Word document
already used tracked changes, so when converting to HTML they recreated the *look* — they wrote
two utility classes (`.added`, `.removed`) that underline and strike text, and wrapped each
edit in a `<span>`. They didn't know `<ins>`/`<del>` exist, and because the Word file's change
log lived in a separate review pane, no equivalent "summary of changes" made it onto the web
page. The page looks exactly like the printed redline, so it was approved.

## Element / selector carrying the issue
`span.removed` (e.g. clause 4.1 "10:00 p.m.", the whole of clause 6.3) and `span.added` (e.g.
clause 4.1 "9:00 p.m.", clause 4.3, the "$300" fine). The decoration is the only carrier of the
inserted/deleted relationship.

## Exact accessibility mechanism (what AT experiences, why it fails)
Screen readers do not, by default, announce CSS `text-decoration: line-through` or `underline`
applied to a `<span>` (unlike a real `<del>`/`<ins>`, which some configurations announce as
"deletion"/"insertion"). So a screen-reader or braille user hears clause 4.1 as:
"No tenant shall create noise … between the hours of 10:00 p.m. 9:00 p.m. and 7:00 a.m." — both
the repealed *and* the new time read as a single run, with nothing marking which is in force.
Worse, deleted clause 6.3 ("No fine shall be issued unless a noise-measurement reading has been
taken…") is read as a live requirement, when in fact the amendment repeals it. The user is
actively misled about the legal text. The insertion/deletion relationships are conveyed purely
by presentation and are available neither programmatically nor in a change-history text, so the
content fails 1.3.1.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`text-decoration: line-through` and `underline` on a `<span>` are valid CSS with no
accessibility lint error — checkers do not require that struck text be `<del>` or underlined
text be `<ins>`. axe-core, WAVE and Lighthouse see well-formed lists, paragraphs and headings
and report no issue. No automated rule can read the clauses, recognise that the strike-through
means "repealed from the by-law" and the underline means "newly enacted," and verify that this
inserted/deleted relationship is restated nowhere in text. That is a legal-content reading — the
human judgment F2/G117 require.

## Citation
> **WCAG Techniques, G117 — "Using text to convey information that is conveyed by variations in
> presentation of text," example "Font variations and explicit statements":**
> "An online document has gone through multiple drafts. Insertions are underlined and deletions
> are struck through. At the end of the draft a "change history" lists all changes made to each
> draft."

(Verbatim from `wcag-techniques/general/G117.html`. This page is exactly that pattern —
underlined insertions, struck deletions — but WITHOUT the "change history" that G117 requires to
make the information available in text, so it fails.)

> **WCAG Techniques, F2:**
> "This document describes a failure that occurs when a change in the appearance of text conveys
> meaning without using appropriate semantic markup."

(Verbatim from `wcag-techniques/failures/F2.html`. The struck/underlined appearance conveys
deletion/insertion meaning with neither `<del>`/`<ins>` markup nor a text equivalent.)
