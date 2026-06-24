# case-05 — Tutorial screenshot with alt="Screenshot 2024-03-11 at 14.22.png"

## Scenario
A help-center tutorial, "Enable two-factor authentication," has three numbered steps. Step 2
includes an informative screenshot showing a specific UI state: a Security settings panel with
the "Two-factor authentication" row highlighted and a blue "Turn on" button on the right — the
exact control the reader must click. The screenshot is the only place that button/label is
shown visually. Its alt is the raw macOS screen-capture filename
`alt="Screenshot 2024-03-11 at 14.22.png"`. The alt is non-empty (presence rules pass) but it
conveys nothing about the panel, the row, or the button.

## Attribute tuple
- **Content domain:** software product documentation / help center
- **UI component / pattern:** numbered procedure (`<ol class="steps">`) with an inline step screenshot
- **Host-language construct:** `<figure><img alt="Screenshot …png"></figure>` inside a step
- **Locale / i18n:** en
- **Failure mechanism:** macOS screen-capture upload-artifact filename used as the alt

## Developer persona
A support author wrote the article in the help-center editor and dragged a macOS screenshot
straight from the desktop into step 2. macOS names captures "Screenshot YYYY-MM-DD at HH.MM.png";
the editor used the dropped file's name as the default alt. The author wrote the visible
step text and a short figcaption but never edited the alt field. The docs pipeline's a11y
linter passed because the image has non-empty alt.

## Element / selector carrying the issue
`ol.steps figure img[alt="Screenshot 2024-03-11 at 14.22.png"]` — the step-2 screenshot. The
button's location is shown only in the image; the step text mentions "Turn on" but the
screenshot is what visually anchors where it sits in the panel.

## Exact accessibility mechanism
The screenshot's accessible name is `alt` = "Screenshot 2024-03-11 at 14.22.png". A
screen-reader user hears "Screenshot 2024 dash 03 dash 11 at 14 dot 22 dot p n g, image" and
gets no description of the panel layout, the highlighted 2FA row, or the blue "Turn on" button.
The filename cannot substitute for the screenshot — the procedural/spatial information (G94:
"if I could not use the non-text content, what words would I use to convey the same function")
is lost. A sighted user sees exactly which button to click; the AT user gets a capture filename.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 PASSES (alt non-empty). The page fails under F30: a
screen-capture filename is not a text alternative that serves the equivalent purpose.

## Why automated tools miss it
The image has a non-empty `alt`, so axe/WAVE/Lighthouse "image-alt" passes. A timestamped
capture filename names no identifiable asset, so qt1vmo cannot find an identity mismatch. A
keyword blocklist is brittle (the string contains real words and digits, not a banned token
like "image"). Recognising "Screenshot 2024-03-11 at 14.22.png" as a capture filename — and
that the depicted button is the load-bearing content of the step — is a human visual/semantic
judgment.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "If I could not use the non-text content, what words would I use to convey the same function and/or information?"
