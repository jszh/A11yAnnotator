# case-05 — SDK changelog where the "Packaging & distribution" section heading is the lone emoji `<h2>📦</h2>`

## Scenario
A developer-docs release-notes page ("Quanta SDK — v4.7") is organised into four changelog
sections: Performance, API changes, **Packaging & distribution**, and Documentation. Three of
the headings pair an emoji accent with words (e.g. `⚡ Performance`, `🔧 API changes`,
`📖 Documentation`). The third heading, however, is *only* an emoji: `<h2>📦</h2>` — a
package-box pictograph with no accompanying text. The section beneath it covers ESM/CommonJS
builds, source maps, and a dropped UMD bundle, but the heading itself carries no words.

## Attribute tuple
- **content-domain**: developer docs / API reference (SDK release notes)
- **UI-component/pattern**: changelog with tagged entries (add / fix / breaking) under emoji-prefixed section headings
- **host-language construct**: `<h2>` whose only content is a single emoji character (U+1F4E6), referenced by `aria-labelledby`
- **locale/i18n**: en (emoji name resolved via CLDR)
- **failure-mechanism**: emoji-only heading — a valid pictograph stands in for the section name; AT announces the emoji's CLDR label, not the section's name

## Developer persona
The changelog is maintained in a Notion-style block editor and exported to HTML. For the
packaging section the author used the slash-menu to drop in a box emoji intending to type
"Packaging & distribution" after it, hit Enter, and moved on to the bullet list — so the
heading line ended up as just the emoji. Because every other heading legitimately starts with
an emoji, the missing words on this one blend in visually and the export shipped.

## Element / selector carrying the issue
- FAIL: `h2#s-pkg` — accessible name is the emoji `"📦"` (which AT speaks as its CLDR label,
  e.g. "package" / "shipping box"), role `heading`, level 2, visible, not ignored. The
  packaging/distribution section is introduced by an emoji, not its name.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree: `#s-pkg` computes to `role="heading"`,
`name="📦"`, `ignored=false`. Screen readers do not stay silent on emoji — they announce the
character's CLDR short-name. So VoiceOver/NVDA read the heading list as:

> "lightning bolt Performance, heading level 2 · wrench API changes, heading level 2 ·
> **package, heading level 2** · open book Documentation, heading level 2."

The blind developer hears "package, heading level 2" and cannot tell whether that section is
about packaging the SDK, npm distribution, bundle formats, or something else — "package" is
the emoji's name, not the section's name "Packaging & distribution". Contrast this with the
sibling headings, where the emoji is an *accent* beside real words: emoji-as-decoration is
fine; emoji-as-the-entire-name leaves the section effectively unnamed.

## Expected ACT-style outcome
**failed** — a section heading is present and exposed but its only content is a pictograph,
so it conveys no real section name (only the emoji's label).

## Why automated tools miss it
The `<h2>` has a non-empty text node (the emoji), so `empty-heading` does not fire, and the
accessible-name computation yields a non-empty string, so WAVE/Lighthouse see a named
heading. Tools cannot judge that a single emoji's CLDR label ("package") is not an adequate
section name when the section is "Packaging & distribution" — nor that emoji-only differs from
the perfectly acceptable emoji-plus-text siblings. That is a human reading of meaning, not a
machine-detectable defect.

## Citation
> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental 'handles' that aid in comprehension of the content."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section**
> "Check that each section on the page starts with a heading."
