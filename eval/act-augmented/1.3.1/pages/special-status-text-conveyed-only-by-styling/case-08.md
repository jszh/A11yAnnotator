# case-08 — paired counterfactual for case-02

## Pair and scenario
The municipal by-law keeps every original insertion, deletion, clause, underline, strikethrough, and legal-document layout from case-02.

This page is paired with **case-02** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Replace only the change-bearing spans/content wrappers with native `ins`/`del` semantics and add concise screen-reader text “Added:”/“Removed:” inside each change. Expand the existing note into a visible text legend; the original underline and strike cues remain.

## Element / selector
`ins, del`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Insertion and deletion status is available in text and structure as well as visually.

## Why this is a hard negative
The decisive cue is redundant rather than removed. The page intentionally continues to look like a conventional redline, so presentation alone cannot distinguish it from the failed source.

## Citation
**Reference:** wcag-techniques/general/G117.html
> An online document has gone through multiple drafts. Insertions are underlined and deletions are struck through. At the end of the draft a "change history" lists all changes made to each draft.
