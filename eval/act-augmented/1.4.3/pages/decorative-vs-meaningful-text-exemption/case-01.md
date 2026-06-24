# case-01 — Faded tiled "DRAFT" watermark conveys contract status (meaningful, not exempt)

## Scenario
A legal-tech document workspace renders a Master Services Agreement on a white "paper"
sheet. A tiled, rotated, light-gray repeating word "DRAFT" sits behind the prose at
~1.56:1. The themer treats the tiled word as a decorative paper texture, but the word
states the legal STATUS of the document — it is the unexecuted draft, not the signed
final. That status is information a reader must perceive.

## Attribute tuple
- **content-domain:** legal / terms & contract document viewer
- **UI-component/pattern:** document "sheet" with a CSS-tiled background watermark layer (grid of repeated `<span>`)
- **host-language construct:** hand-authored HTML5 + CSS grid + `transform: rotate()` tiling
- **locale/i18n:** en-US
- **failure-mechanism:** meaningful status word styled as a faint decorative texture; ~1.56:1 vs the required 4.5:1; author would (wrongly) claim the pure-decoration exemption

## Developer persona
An agency front-end dev cloned a "legal document viewer" CodePen that produced a stylish
diagonal watermark layer. The demo used the placeholder word "SAMPLE" purely for looks, so
the dev kept the faint `#cfcfcf` styling and just swapped the text to "DRAFT" to match the
product's document-status feature — never reconsidering that, unlike "SAMPLE", the word now
carries real legal meaning that the reader must be able to read.

## Element / selector carrying the issue
`.watermark span` — the nine tiled `DRAFT` spans, `color:#cfcfcf` on the `#ffffff` sheet.

## Exact accessibility mechanism
The watermark word is live DOM text (`aria-hidden="false"`), so a screen-reader user gets
the status word announced, but a sighted low-vision or contrast-impaired reader relies on
the visual presentation — and at 1.56:1 the word is effectively invisible to them. Because
"DRAFT" conveys the document's legal status (a draft is materially different from the
executed final), the text is NOT "decorative and conveys no information": substituting it
("FINAL", "VOID", "EXECUTED") changes the meaning of the page. It therefore must meet
4.5:1, and at 1.56:1 it fails SC 1.4.3.

## Expected ACT-style outcome
**failed** — meaningful text at 1.56:1; the pure-decoration exemption does NOT apply
because the word carries document-status information.

## Why automated tools miss it
A contrast checker can compute 1.56:1, but it cannot rule on the exemption. The markup is
indistinguishable from a genuine decorative repeated-word background (case-04 here), which
the Understanding doc explicitly cites as exempt. Tools have no way to know whether the
repeated word is mood/ornament or load-bearing status. Some scanners also suppress
rotated/tiled background layers as decorative chrome. Deciding that "DRAFT" cannot be
rearranged or substituted without changing meaning — and is therefore in-scope — requires
reading the word and reasoning about the document, which no scanner does.

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "Text that is decorative and conveys no information is excluded. For example, if random
> words are used to create a background and the words could be rearranged or substituted
> without changing meaning, then it would be decorative and would not need to meet this
> criterion."
