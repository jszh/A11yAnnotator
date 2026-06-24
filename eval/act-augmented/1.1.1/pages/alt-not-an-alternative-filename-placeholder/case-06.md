# case-06 — Recipe blog hero with alt="Img 20231104 Wa0006" (title-cased WhatsApp filename)

## Scenario
A Spanish-language family recipe blog ("Cocina de Lupita") post about pozole rojo leads with a
hero photo that depicts a specific dish: a bowl of red pozole with shredded chicken, radish
slices, a lime wedge, and a sprinkle of oregano. The photo is informative — it shows the
finished dish. Its alt is `alt="Img 20231104 Wa0006"`, which WordPress auto-derived by
stripping the extension and title-casing the uploaded WhatsApp-export filename
`IMG-20231104-WA0006.jpg`. The alt is non-empty (presence rules pass), but it conveys none of
the dish, and its title-cased word-like tokens make it sneakier than a bare `alt="image"`.

## Attribute tuple
- **Content domain:** community / hobby food blog (recipe)
- **UI component / pattern:** blog-post lead `<figure>` hero image
- **Host-language construct:** `<img alt>` whose value was auto-generated from the Media Library title
- **Locale / i18n:** Spanish (`lang="es"`); the failing string is an English-ish title-cased filename
- **Failure mechanism:** CMS-derived alt = title-cased upload filename (WhatsApp `IMG-YYYYMMDD-WAxxxx` artifact)

## Developer persona
A home cook runs a self-hosted WordPress blog with a theme that, when the alt field is blank,
falls back to the attachment "title." She received the dish photo over WhatsApp (filename
`IMG-20231104-WA0006.jpg`), uploaded it, and WordPress set the Media Library title to
"Img 20231104 Wa0006" (extension stripped, hyphens → spaces, title-cased). She typed the
recipe and a visible figcaption but never touched the alt field, so the theme exposed the
auto-title as the image's alternative text. Her SEO/a11y plugin reported "image has alt text."

## Element / selector carrying the issue
`article figure img[alt="Img 20231104 Wa0006"]` — the hero dish photo. The descriptive content
lives in the figcaption and prose, not in the image's accessible name.

## Exact accessibility mechanism
The image's accessible name is `alt` = "Img 20231104 Wa0006". A Spanish-speaking screen-reader
user (NVDA/VoiceOver in es) hears the spelled/spoken tokens "Img 20231104 Wa0006" — a date
(2023-11-04) and a WhatsApp sequence number masquerading as words. It identifies nothing about
pozole, the bowl, or the garnishes, and cannot substitute for the photo. Because the tokens are
capitalised and word-shaped, even a human skimming the DOM might miss it; only reading it
against the depicted dish reveals it is a filename, not a description.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 PASSES (alt non-empty). The page fails under F30: the
alt is a (title-cased) filename, not a text alternative that serves the equivalent purpose.

## Why automated tools miss it
The image has a non-empty `alt`, so axe/WAVE/Lighthouse "image-alt" passes. The string is
title-cased and contains no banned token ("image"/"photo"/"spacer"), so keyword heuristics do
not flag it. It names no identifiable asset, so qt1vmo finds no identity mismatch. Recognising
"Img 20231104 Wa0006" as a WhatsApp-export filename (IMG + date + WA sequence) rather than a
description of a bowl of pozole requires reading the string as a human and comparing it to the
rendered photo — and doing so for an alt that deliberately looks word-like.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg""

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "Text alternatives and equivalents should match the human language of the original content (normally the default human language of the page)."
