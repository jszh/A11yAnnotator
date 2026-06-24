# case-04 — "Customize reading" theme buttons that only recolour the page background while the recipe image-of-text stays fixed

## Scenario
A family-trattoria recipe page presents Nonna's entire ragù recipe — title, "Serves 6",
the full ingredient list and the numbered method — as a single inline-SVG **image of
text**. Above it is a "Customize reading appearance" panel with three theme buttons (Cream
/ Parchment / Mint). Pressing them genuinely changes something, so the controls feel alive
— but all they change is `document.documentElement`'s background colour. The recipe SVG is
never re-rendered, recoloured, resized, or swapped for text. A user gets a customizable
*page background* and a stubbornly fixed *image of the actual content*: superficially
customizable, substantively not.

## Attribute tuple
- **content-domain:** restaurant / recipe
- **UI-component/pattern:** "reading theme" picker (background-colour switcher)
- **host-language construct:** inline `<svg><text>` recipe card + JS that sets `documentElement.style.background`
- **locale/i18n:** en with Italian culinary terms
- **failure-mechanism:** customization control changes only unrelated surrounding styling (page background); the image of text is untouched

## Developer persona
A restaurant owner used a "make your site more accessible" tutorial that showed adding a
background-theme switcher ("let readers pick a comfortable background"). They added it
verbatim. The actual recipe had been pasted in as a pretty exported card image to keep the
handwritten-style layout, so the one thing a reader most needs to enlarge/recolour — the
recipe text — is exactly the thing the theme buttons cannot touch. It "felt accessible"
because clicking the buttons visibly did something.

## Element / selector carrying the issue
The image of text: `.recipe-card svg[role="img"]` (whole recipe as `<text>`). The misleading
control: `.reading-panel button[data-bg]`, whose handler sets
`document.documentElement.style.background` and nothing else.

## Exact accessibility mechanism
A low-vision user needs the ingredient quantities and method enlarged or in higher contrast.
They see "Customize reading appearance", try the themes, and the page background dutifully
shifts cream→mint — proving the controls "work" — yet "500 g beef chuck" and "Barely
simmer, partly covered, 2½ hours" remain the same small fixed pixels at the same contrast.
For 1.4.5, customization must let the user adjust the **image of text's** font, size, colour
and background (TT 7.E condition 2); recolouring the page *behind* a fixed bitmap does not.
The recipe is essential, replaceable text that has been frozen into an image with no genuine
customization route and no text equivalent — a fail. (A screen-reader user gets only the
SVG's summary `aria-label`, not the quantities/method, compounding the loss.)

## Expected ACT-style outcome
**failed** — SC 1.4.5 (Images of Text, Level AA). The recipe is an image of text that could
have been live text; the on-page "customize" controls adjust only the surrounding page
background, not the image, so the customizability exception is not met.

## Why automated tools miss it
Nothing trips a linter: the SVG has a descriptive `aria-label` and `role="img"`, the theme
buttons are real `<button>`s with text labels and focus styles, the page is titled, and the
buttons demonstrably *do* fire JS. axe-core/WAVE/Lighthouse cannot OCR the SVG to learn it
contains an entire recipe of text, and they cannot reason that the customization the buttons
provide (page background) is the *wrong target* — that it does not reach the image of text.
Telling "customizes the image of text" apart from "customizes only the chrome around it"
requires a human to operate the control and notice that the content itself never changed.

## Citation
> **Reference:** WCAG 2.2 Understanding 1.4.5 Images of Text — Intent
> (`wcag-understanding/images-of-text.html`)
>
> **Quote (verbatim):** "Images of text can also be used where it is possible for users to
> customize the image of text to match their requirements."
>
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Determine if the image of text can be **visually customized**:
> adjust the font, size, color, and background with controls provided by the web page."
