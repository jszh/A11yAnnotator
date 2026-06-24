# case-01 — Event-poster image of text with the FULL poster contents reproduced verbatim as visible live text (the "in addition to" PASS the corpus lacks)

## Scenario
A community arts council ("Riverside Arts Council") posts a folk-festival listing on its events
calendar. The designed poster — title, date, doors/music times, venue + street address, three-act
line-up, ticket price, and booking URL — is a flattened graphic (an inline-SVG `data:` URI rendered
through `<img>`, so the words are pixels, not DOM text). Because the CMS cannot rebuild the poster's
typography in HTML, the events team uploads the poster image **and** retypes every fact from it as
live, visible, selectable HTML directly beneath the image: a `<dl>` for date/times/venue/tickets/booking
and a `<ul>` for the line-up. The live text is equivalent (same information, verbatim) and is genuinely
presented on screen.

## Attribute tuple
- **Content domain:** events / community arts ticketing
- **UI component / pattern:** CMS calendar entry — poster image followed by a definition list + line-up list
- **Host-language construct:** `<img>` with an inline-SVG `data:` URI (raster-equivalent image of text) + adjacent `<dl>`/`<ul>` live text
- **Locale / i18n:** en-GB (£, DD Month YYYY)
- **Failure mechanism:** NONE — this is the positive "in addition to" met-condition (equivalence + visibility both satisfied)

## Developer persona
A part-time community events coordinator who is not a developer. Their CMS (a small council-run
calendar) only offers an image upload field plus a plain rich-text body. They received the poster
as a finished PNG/SVG from a volunteer designer and cannot recreate its layout in HTML, so — having
read a council accessibility tip sheet — they deliberately retype the entire poster into the text
body so the information is available as real text "in addition to" the picture.

## Element / selector carrying the issue
`article.calendar-entry .poster-wrap img` (the image of text) paired with
`article.calendar-entry .entry-body .poster-text` (the equivalent live text). The PASS hinges on the
pairing: the image alone would fail, but the adjacent live text reproduces the same information and
is visibly rendered.

## Exact accessibility mechanism
The poster's words exist twice: once as immutable image pixels, and once as live HTML. A low-vision
user who needs 200% text, a different font, or higher contrast cannot alter the poster pixels — but
the same date, venue, line-up, price, and booking URL are right below as real text they CAN restyle,
zoom, and select. A screen-reader user hears the full programme from the `<dl>`/`<ul>` (the image's
short alt is merely a label, not the content carrier). Because the same information is presented BOTH
as the image and as adjustable live text, the "in addition to" condition in the Understanding note is
satisfied and 1.4.5 is met.

## Expected ACT-style outcome
**passed** (SC 1.4.5). The image of text would fail on its own, but the met-condition applies because
equivalent live text is presented in addition to it. This is the positive case the ACT corpus omits
(its decorative-image-plus-text pairs still FAIL because the adjacent text is not the same information).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse have no OCR step, so they never discover that the poster's pixels
contain the same date/venue/line-up/price strings that appear in the live `<dl>`/`<ul>`. They cannot
compare image content to nearby text content, and they cannot confirm both are rendered. With a
non-empty alt the `image-alt` rule simply passes and the tools fall silent — they can neither flag a
violation nor certify the met-condition. Confirming this PASS is pure human read-the-pixels /
read-the-text / compare-meaning judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "The success criterion is intended to address situations where images of text are used rather than text. Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** Understanding SC 1.4.5 Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "However, in addition to the image, they can add regular text to the calendar entry, so they post both the poster and the text contained in the image. This text is shown next to the poster image on the site's calendar page."
