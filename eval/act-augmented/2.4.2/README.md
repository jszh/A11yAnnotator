# SC 2.4.2 Page Titled — augmented test corpus

I have the scoring data I need (final tally is authoritative). Let me write the prose summary directly, as instructed not to recompute.

The ACT test suite for SC 2.4.2 (rules like `2779a5`, "HTML page has non-empty title") covers only Limb (a): the mechanical presence of a non-empty `<title>` element. It is silent on Limb (b) — whether that title actually *describes the topic or purpose* of the page — because describing-ness is a human judgment that no deterministic rule can adjudicate. So a page can pass every ACT check while carrying a title that identifies nothing, describes the wrong thing, or fails to orient the user. The five uncovered aspects target exactly this Limb (b) blind spot: non-identifying artifact titles (F25 — authoring-tool defaults, unfilled placeholders, filename/code strings); titles that describe a secondary block instead of the page's primary topic on mixed-content pages; stale copy-paste titles that name the right subject family but the wrong specific instance (date, version, account); titles too generic to distinguish one page from its siblings in a set (site-name-only or template-shared inner pages); and titles that read fine in-page but lose meaning out of context, failing G88/G127 collection-position orientation.

The augmented corpus now covers all five aspects with valid human-judgment pages above the five-page threshold: non-identifying artifact titles at 7 valid, and the remaining four — secondary-not-primary topic, stale wrong-instance, too-generic-to-distinguish, and loses-meaning-out-of-context — each at 6 valid. No aspect is short of the 5-valid-page bar, so none requires regeneration; every Limb (b) facet has sufficient coverage.

## Uncovered aspects + valid pages

| aspect | valid pages |
|---|---|
| non-identifying-artifact-title-strings | 7 |
| title-describes-secondary-not-primary-topic | 6 |
| stale-in-family-wrong-instance-title | 6 |
| title-too-generic-to-distinguish-page-in-set | 6 |
| title-loses-meaning-out-of-context | 6 |

_All aspects meet the >=5 valid human-judgment pages bar: true._
