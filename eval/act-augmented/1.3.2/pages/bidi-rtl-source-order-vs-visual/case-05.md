# case-05 — Persian news item: registration URL segments reordered in source to render as a clean link

## Scenario
A Persian (RTL) news agency article embeds an LTR registration URL in a body paragraph. The
intended sentence reads, visually,
`برای ثبت‌نام به نشانی conf.ai-iran.org/2024 مراجعه کنید …` ("To register, go to the address
conf.ai-iran.org/2024 …"). In natural source order the bidi algorithm placed the URL's path
segment and the following Persian verb on the wrong side, so the author "fixed the visual" by
physically reordering characters in the source — the path segment `2024/` was moved **before**
the host (`2024/conf.ai-iran.org`). After bidi reordering the screen shows one clean, correct
URL, but the logical/source order is a scrambled address.

## Attribute tuple
- **content-domain:** news / journalism (conference announcement)
- **UI-component / pattern:** article body paragraph with an inline URL
- **host-language construct:** RTL paragraph with an embedded LTR URL whose path/host were transposed in source, NO `<bdi>`
- **locale / i18n:** fa (Persian, `dir="rtl"`) with an embedded LTR URL
- **failure-mechanism:** G57 source-character reordering — URL segments relocated in the content stream so the bidi algorithm yields a clean visual URL, exposing a broken logical order

## Developer persona
A newsroom CMS author pasting a registration link into a Persian article. The URL's `/2024`
path "jumped" to the wrong side in the editor preview, so they manually shuffled the URL pieces
in the rich-text field until the link looked unbroken — unaware the editor had transposed the
host and path in the stored text.

## Element / selector carrying the issue
`p.body` (the registration-instructions paragraph containing the URL).

## Exact accessibility mechanism (what AT experiences, why it fails)
- VERIFIED with a Puppeteer rendering harness (per-character client-rect sort):
  - LOGICAL (DOM/source order, what a screen reader / copy-paste returns): `… به نشانی 2024/conf.ai-iran.org مراجعه کنید …` (path `2024/` before the host)
  - VISUAL (laid out on screen): the URL appears as the contiguous, correct `conf.ai-iran.org/2024`.
- A sighted Persian reader sees a normal, clickable-looking address.
- A screen reader reads the **logical** order and announces the URL pieces out of sequence
  ("…address 2024 slash conf dot ai-iran dot org…"); a user who copies the link from the
  reading order, or whose AT reconstructs the URL from the text, gets a broken/wrong address.
  The meaningful sequence (host then path) cannot be programmatically determined.
- Per G57 the fix is `<bdi>` around the URL with the segments in logical order, not relocating
  them in the byte stream → fail.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — URL characters reordered in the content stream so the programmatic
reading sequence yields a scrambled address rather than the meaningful one).

## Why automated tools miss it
The page is valid `lang="fa" dir="rtl"` HTML, no attribute is missing, and the visual render is
a clean URL. Recognising that the host and path were transposed in the source requires reading
Persian, knowing its directionality, parsing the URL's intended structure, and comparing the
logical order to the visual order. axe, WAVE, and Lighthouse perform no such analysis.

## Citation
> "The visual rendering problem could be corrected by moving the punctuation in the content stream so that the bidirectional algorithm positions it as desired, but this would expose the incorrect content order to assistive technology."
— wcag-techniques/general/G57.html (Description)

> "The intent of this success criterion is to enable a user agent to provide an alternative presentation of content while preserving the reading order needed to understand the meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
