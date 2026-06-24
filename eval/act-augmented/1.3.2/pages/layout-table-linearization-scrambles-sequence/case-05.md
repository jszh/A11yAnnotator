# case-05 — HTML email newsletter: dish caption separated from its photo by the whole recipe blurb

## Scenario
A food newsletter ("The Saturday Kitchen") built as a bulletproof nested-table HTML email. A feature block shows a photo of braised short ribs in the left column with a heading, intro paragraph, and CTA in the right column. The photo's caption ("Pictured: short ribs after three hours, glaze reduced by half.") was placed in a *second outer-table row*, left column, to baseline-align with the body text. Because layout tables linearize row-by-row (and nested tables are read in full before moving on, per F49), the source order becomes photo → entire heading/intro/CTA block → caption. The caption arrives after the whole recipe blurb, detached from the image it describes.

## Attribute tuple
- **content-domain:** news / editorial — recipe email newsletter
- **UI-component / pattern:** image + caption feature block inside an HTML-email layout
- **host-language construct:** nested `<table role="presentation">` (Outlook/Mailchimp "bulletproof" wrapper) with the caption in a later outer-table row
- **locale / i18n:** en-US
- **failure-mechanism:** F49 — image/caption separation via layout-table rows + nested-table linearization; the caption is divorced from its image in the content stream

## Developer persona
An email marketer assembled the issue in a drag-and-drop email builder, then hand-tweaked the exported HTML so the caption's top edge lined up with the body copy across the gutter. The fastest way to get that alignment was to drop the caption into the next table row rather than directly under the image. The preview looked perfect in Gmail and Outlook, so it went out to the list.

## Element / selector carrying the issue
`p.cap` ("Pictured: short ribs…") sitting in a later outer-table row, separated in source order from the `span.photo[role="img"]` it captions by the entire `td.body-cell` heading/intro/CTA block.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted reader sees the photo with its caption tucked beneath it in the left column; the association is immediate and spatial.
- A screen reader linearizes the layout: it reads the photo's `aria-label`, then (per F49, the entire contents of each cell, including nested tables, before the next cell) the whole right-hand text block — "Red-wine short ribs", the intro, "Get the full recipe" — and only then "Pictured: short ribs after three hours, glaze reduced by half."
- The caption is announced long after the image, with no programmatic relationship (`figure`/`figcaption`/`aria-describedby`) tying them together. The user cannot tell which image — if any — the caption refers to. The image-then-caption meaningful sequence is broken exactly as G57 warns ("if the caption of an illustration is placed in the row following the illustration, it may be impossible to associate the caption with the image").

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F49 / G57: a layout table places a caption out of sequence with its image so the association is lost when linearized).

## Why automated tools miss it
The image has an `aria-label`, every cell has content, the tables are correctly `role="presentation"`, and the nested-table structure is the industry-standard bulletproof email pattern no linter faults. axe/WAVE/Lighthouse do not reconstruct that the later caption describes an earlier image, nor that the linearized order interposes the entire blurb between them. Associating caption with image across linearized cells — and noticing the sequence is broken — is a human reading judgment.

## Citation
> "Since layout tables are read row by row, if the caption of an illustration is placed in the row following the illustration, it may be impossible to associate the caption with the image."
— wcag-techniques/general/G57.html (Description)

> "if any cell contains a nested table, the screen reader will read the entire nested table before it reads the next cell in the original (outer) table."
— wcag-techniques/failures/F49.html (Description)

> "the meaningful sequence conveyed through visual presentation may not be perceivable when the content is spoken by a screen reader."
— wcag-techniques/failures/F49.html (Description)
