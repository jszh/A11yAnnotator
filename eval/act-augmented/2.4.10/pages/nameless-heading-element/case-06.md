# case-06 — Restaurant menu where course headings are hand-lettered IMAGES but each carries a visually-hidden text name (BOUNDARY PASS)

## Scenario
A restaurant dinner menu ("Olive & Ember") groups dishes into three courses: **Small Plates**,
**From the Hearth**, and **Sweet**. Each course title is rendered as a hand-lettered
*calligraphy image* of the course name — visually identical in spirit to the failing
decorative-image cases. The difference is that every course `<h2>` also contains a
visually-hidden `<span class="sr-only">` carrying the real course name, with the calligraphy
`<img>` marked decorative (`alt=""`). So the heading is named programmatically even though the
on-screen title is a picture. This page is the boundary variant: image-as-title is acceptable
*when* a text alternative names the section.

## Attribute tuple
- **content-domain**: restaurant menu & ordering (fine-dining dinner menu)
- **UI-component/pattern**: menu with course sections and price-aligned item rows
- **host-language construct**: `<h2>` containing a visually-hidden `<span class="sr-only">` name + a decorative `<img alt="">` of the same text, referenced by `aria-labelledby`
- **locale/i18n**: en-GB (£ pricing)
- **failure-mechanism**: NONE — image title with a correct visually-hidden text alternative; included to mark the line where the aspect stops failing

## Developer persona
A developer who had seen the decorative-image-heading mistake built the menu defensively:
they kept the chef's hand-lettered course titles as images (for the look) but added an
`sr-only` text label inside each heading and set the image `alt=""`. They verified in
VoiceOver that the rotor read the real course names. This is the *correct* pattern that the
failing cases only appear to follow.

## Element / selector carrying the issue
- PASS: `h2#c-small`, `h2#c-hearth`, `h2#c-sweet` — each computes a real accessible name
  ("Small Plates", "From the Hearth", "Sweet") from the visually-hidden `<span>`, while the
  calligraphy image is correctly decorative. Role `heading`, level 2, visible, not ignored.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree: `#c-small` computes to `role="heading"`,
`name="Small Plates"`, `ignored=false` (and the siblings likewise resolve to "From the Hearth"
and "Sweet"). A screen-reader heading list reads:

> "Small Plates, heading level 2 · From the Hearth, heading level 2 · Sweet, heading level 2."

The blind diner can navigate straight to the course they want — the sections are properly
named, so 2.4.10's "mental handles" are present. The visually-hidden span supplies the name
that the picture cannot; the decorative `alt=""` correctly stops the image from polluting the
name. This is exactly H69's allowance for "images of text that are used as headings" done
*with* a text equivalent.

## Expected ACT-style outcome
**passed** — every section heading is present, exposed, and carries a meaningful accessible
name, even though the visible title is an image of text.

## Why automated tools miss it
A tool cannot tell this PASS apart from the failing decorative-image cases (case-02, case-03):
in all of them the *visible* title is an image, axe-core sees a non-empty heading, and no
checker reads the calligraphy pixels. Only by computing the accessible name and judging that
it is a real section name — here "Small Plates", not "" — can one confirm the pass. Tools
neither reward the correct `sr-only` pattern nor reliably penalise its absence; the
distinction is a human/AT judgment, which is why this boundary case is instructive for the
aspect.

## Citation
> **WCAG Techniques — H69: Providing heading elements at the beginning of each section**
> "Heading markup can be used: … to mark up images of text that are used as headings;"

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
