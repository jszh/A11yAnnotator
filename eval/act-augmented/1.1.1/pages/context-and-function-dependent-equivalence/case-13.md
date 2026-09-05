# Flag graphics are redundant inside purpose-named language links

- Expected: `passed`
- Category: Redundant graphic or visual cue
- Source pair: `case-05.html` in this aspect
- Exact repair: Kept the Japanese, German, and Brazilian flag graphics, made them decorative with empty alt, and named their parent links “Switch to Japanese,” “Switch to German,” and “Switch to Brazilian Portuguese.”
- Primary selector: `.langswitch a[hreflang="ja"][aria-label="Switch to Japanese"]`

## Why this passes

The flags remain visible orientation cues, but the links' purposes no longer depend on interpreting a country as a language.

## Accessibility-tree / visual evidence

Each target is exposed as a link with a purpose-specific language name, and each child image is correctly omitted.

## Why automated tools may miss the boundary

A visual model can remain fixated on the flags even though the computed link names carry the complete function.

## Citation

- Document: `wcag-techniques/html/H30.html`
- Verbatim quote: “When an image is the only content of a link, the text alternative for the image describes the unique function of the link.”
