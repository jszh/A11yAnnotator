# Staff portraits named by external headings

- Expected: `passed`
- Category: Context extraction
- Source pair: case-03.html in this aspect
- Exact repair: Added a unique id to each existing staff-name heading and referenced that heading from its portrait with aria-labelledby; the generic alt token remains, while the computed accessible name is the correct person name.
- Primary selector: `.team img[aria-labelledby]`

## Why this passes

Each portrait remains informative and has an accurate accessible name from its associated visible heading. The reference is valid and the full staff-directory context is preserved.

## Accessibility-tree / visual evidence

The first portrait resolves to “Dr. Aaron Whitfield”; the other three resolve to “Dr. Lena Park”, “Maya Okonjo”, and “Sofia Reyes”.

## Citation

- Document: `eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-03.md`
- Verbatim quote: “placeholder text such as " " or "spacer" or "image" or "picture" etc that are put into the 'text alternative' location on images or pictures.”


## GenA11y payload contract

The exact `extract_visual_elements` payload omits the normalized text of every non-self IDREF used by `.team img[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.

**Validated batch:** `initial-79-context-v3`
