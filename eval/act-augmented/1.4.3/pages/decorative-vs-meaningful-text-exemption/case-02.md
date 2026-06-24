# case-02 — Giant pale hero word "WANDER" is a mood flourish (decorative, EXEMPT → passed)

## Scenario
A trail-running e-commerce hero banner floats a giant pale word "WANDER" (white at 30%
alpha, ≈1.4–2.0:1 over the scene) across the upper background, away from the copy. The word
is a purely atmospheric flourish. Every piece of informative content sits on a SOLID opaque
dark panel: the H1 and subhead are white on `#14201c` (≈16.8:1) and the "Shop the
collection" CTA is white on a solid dark-green button `#14532d` (≈9.1:1). This is the
FALSE-POSITIVE side of the exemption boundary: a contrast number flags the faint word, but
it should be ruled exempt, and because no informative text is low-contrast the page PASSES.

## Attribute tuple
- **content-domain:** e-commerce product landing / outdoor retail
- **UI-component/pattern:** full-bleed hero banner with a large decorative typographic flourish floating over a background image
- **host-language construct:** hand-authored HTML5 + inline-SVG `data:` background image (no external resource) + `rgba()` overlay text on a solid copy panel
- **locale/i18n:** en-US
- **failure-mechanism:** genuine decoration at failing contrast that a checker FALSE-POSITIVES; correct ruling is exemption, so the page PASSES 1.4.3

## Developer persona
A designer dragged a "Display Heading" text block onto the hero, set it to a huge weight,
dropped its opacity to 30% "for a watermark vibe," and slid it up and across the scene so it
peeks out beside the headline panel. She chose the word "WANDER" purely for mood — the brand
could just as easily have used "EXPLORE" or "ROAM" — and added `aria-hidden` after a
colleague said screen readers were reading the giant word. To keep the real copy legible she
deliberately seated the H1, subhead, and CTA on a solid dark card and gave the button a solid
dark-green fill, so the only faint text on the page is the ornamental word.

## Element / selector carrying the issue
`.flourish` — the `<p>WANDER</p>`, `color: rgba(255,255,255,.30)` floating over the scene,
`aria-hidden="true"`, not a heading, not a label, never positioned over the informative panel.

## Exact accessibility mechanism
The flourish conveys no information: it is not the page heading (the real `<h1>` is
"Trail running gear built for the long haul"), it labels nothing, and it can be substituted
("EXPLORE", "ROAM") or removed without changing the page's meaning — the Understanding test
for decoration. It is therefore exempt from the contrast requirement, so its ≈1.4–2.0:1 ratio
does NOT cause a 1.4.3 failure. Critically, every informative string IS in scope and meets
the requirement on a CSSOM-computable solid background: H1/subhead are `#ffffff` on solid
`#14201c` (≈16.8:1) and the CTA is `#ffffff` on solid `#14532d` (≈9.1:1; at 16px/700 the
4.5:1 normal-text bar applies and is cleared). A screen-reader user is unaffected (the word
is `aria-hidden`); a low-vision user loses nothing because the word carries nothing and all
real content is high-contrast.

## Expected ACT-style outcome
**passed** — the only failing-contrast text is pure decoration (exempt); every informative
string (H1, subhead, CTA, body) meets the contrast requirement on a solid background. This
boundary case sharpens the aspect by showing the exemption applied correctly with no
confounding real failure.

## Why automated tools miss it
This is the inverse failure mode. axe/Lighthouse measure the ≈1.4–2.0:1 ratio of the pale
word (or report "needs review" when sampling over the photo) and would raise a contrast
violation. But the correct verdict is PASS, because that text is exempt decoration and every
informative element is comfortably above threshold. Tools cannot read the word, judge that it
conveys no information, and confirm it is substitutable/removable — the exact semantic test
the exemption hinges on. They therefore raise a false positive where a human must rule
"exempt."

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "Text that is decorative and conveys no information is excluded. For example, if random
> words are used to create a background and the words could be rearranged or substituted
> without changing meaning, then it would be decorative and would not need to meet this
> criterion."
