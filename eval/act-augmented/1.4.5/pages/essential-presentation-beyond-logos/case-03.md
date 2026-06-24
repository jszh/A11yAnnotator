# case-03 — Modern museum "visitor note" styled as antique parchment (original-format exception abused, FAIL)

## Scenario
A museum's "Plan your visit" page presents its opening hours and a donation appeal as a
"parchment" graphic — torn-edge border, sepia background, faux-quill cursive font. It looks
like a historical artefact, but it is a brand-new 2024 visitor note the content editor typed
themselves and ran through a Photoshop "antique" action "to give the page a historic feel."
There is no original document: the text was authored today, its original format is HTML, and
nothing about a time period is conveyed by its appearance. So the page misuses the WCAG
"representation of a letter / original format essential" exception to justify avoidable images
of text. The opening hours and suggested donation cannot be resized, recoloured, or reflowed,
they pixelate on zoom, and the costume font actively hurts legibility.

## Attribute tuple
- **Content domain:** cultural heritage / museum (civic-adjacent)
- **UI component / pattern:** "Plan your visit" article hero `<figure>` styled to mimic a historical document
- **Host-language construct:** `<img>` (inline-SVG `data:` URI) of cursive prose on a parchment background
- **Locale / i18n:** en-GB (currency £, British date phrasing)
- **Failure mechanism:** modern informational text imaged with an "antique look," wrongly justified under the original-format-essential exception

## Developer persona
A part-time heritage-site content editor with no historical artefact to show but a desire for
period atmosphere. They had seen real scanned letters elsewhere on the site qualify as
exceptions, and assumed that making *any* text "look old" earned the same pass. They typed the
visitor note, applied a parchment template in their image editor, exported a PNG, and wrote a
faithful alt — believing the historic styling was both charming and compliant.

## Element / selector carrying the issue
`main figure img[width="720"]` — the "welcome note" graphic. Its pixels are modern, newly
authored opening-hours and donation text set in a cursive font on a faux-parchment
background. No live DOM text duplicates it.

## Exact accessibility mechanism
The visitor information (days, hours, season, suggested donation amounts) exists only as SVG
`<text>` glyphs inside the image. A user who needs a larger font, a higher-contrast or
non-decorative typeface, wider spacing, or reflow at 200–400% zoom cannot adjust this content —
it is a fixed raster that blurs when enlarged, and the cursive "antique" font is among the
hardest to read for low-vision and cognitive-disability users. Because the text was authored
today and conveys nothing about a historical time period through its format, the visual
presentation is **not** essential: live HTML would convey the same effect and information while
remaining adjustable. (The alt fully transcribes the note, so this is a 1.4.5 issue, not 1.1.1.)

## Expected ACT-style outcome
**failed** (SC 1.4.5). The image of text can be replaced by live text with the same effect and
information; there is no original artefact, no logotype, and no customization control, so no
essential-presentation exception applies.

## Why automated tools miss it
The image has a non-empty, accurate `alt`, so `image-alt` passes axe-core / WAVE / Lighthouse.
The page has a `<title>`, heading hierarchy, landmarks, and good surrounding contrast — no rule
fires. No tool OCRs the parchment to learn it contains today's opening hours, and none can know
the "antique" text was written this year and has no original-format rationale. Distinguishing a
genuine scanned historical original (exempt) from a modern costume on ordinary informational
text (a violation) is a human contextual judgment about whether the original format is essential
to information about a time period.

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "A representation of a letter ... A web page contains a representation of an original letter. The depiction of the letter in its original format is essential to information being conveyed about the time period in which it was written."

**Reference:** WCAG 2.2 Understanding Images of Text — Intent (`wcag-understanding/images-of-text.html`)
> "The intent of this success criterion is to encourage authors ... to enable people who require a particular visual presentation of text to be able to adjust the text presentation as needed. This includes people who require the text in a particular font size, foreground and background color, font family, line spacing or alignment."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."
