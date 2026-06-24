# case-06 — Heading: visible "Roman Britain" but accessible name "Anglo-Saxon Treasures" (labelledby → wrong section)

## Scenario
A museum's "Galleries of Early Britain" microsite, built from a copy-pasted gallery template. The
first gallery's section heading visibly reads **"Roman Britain"** and sits above unmistakably Roman
content (samian ware, a legionary's pay chit, a Mithraic altar, c. AD 43–410). To make each gallery
heading announce together with its kicker, the author used `aria-labelledby` — but on the FIRST
gallery they fat-fingered the IDREF: instead of pointing at this gallery's own heading text node
(`id="h-roman"`), it points at the NEXT gallery's heading, `id="h-saxon"` ("Anglo-Saxon Treasures").
`aria-labelledby` takes absolute precedence, so the `<h2>`'s computed accessible name is **"Anglo-Saxon
Treasures"** — a fully fluent, grammatical, descriptive-*sounding* heading that simply belongs to the
WRONG section. A screen-reader user navigating by heading (the H key / headings list) hears "Anglo-Saxon
Treasures, heading level 2" and jumps here expecting brooches and seaxes — but the prose beneath is
Roman. The visible surface and the announced surface **diverge**: each name is descriptive in
isolation, so neither looks wrong on its own; the defect is only visible by comparing the announced
heading against the content it actually labels.

## Attribute tuple
- **Content domain:** museum / cultural-heritage long-form (gallery microsite)
- **UI component / pattern:** section heading (`<h2>`) inside a multi-section page with an in-page TOC
- **Host-language construct:** `<h2 id="h-roman" aria-labelledby="h-saxon">` — IDREF points at a
  *different, sibling* heading's id
- **Locale / i18n:** en-GB
- **Failure mechanism:** `aria-labelledby` points at the WRONG sibling element, so the announced
  heading is fluent and descriptive but describes a DIFFERENT section's topic; divergence type =
  **VISIBLE-DESCRIPTIVE / ANNOUNCED-DESCRIPTIVE-BUT-WRONG-TOPIC** (mis-attribution, not vagueness)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element"
  (here: the wrong, *visible* element — a neighbouring heading)

## Developer persona
A front-end developer duplicated the gallery `<section>` block three times and wired each heading's
`aria-labelledby` to "the heading id". On the first copy they left the IDREF pointing at the second
gallery's `h-saxon` (a classic copy-paste-then-rename slip), assuming `aria-labelledby` would *augment*
the heading rather than *replace* its entire accessible name. The two later galleries were corrected to
self-reference, so only the first is defective.

## Element / selector carrying the issue
`h2#h-roman[aria-labelledby="h-saxon"]` — visible text "Roman Britain"; the IDREF resolves to
`h2#h-saxon` whose text is "Anglo-Saxon Treasures". Verified in Chromium (full AX tree via
`inspect.js`): `role=heading`, **`accName="Anglo-Saxon Treasures"`** for the first gallery while its
`visibleText="Roman Britain"`; the second gallery heading also computes "Anglo-Saxon Treasures"
(correct, self-referential), and the third computes "The Viking Incursions" (correct). The page `h1`
is "Galleries of Early Britain".

## Exact accessibility mechanism
`aria-labelledby` overrides the element's own text content, taking the referenced element's text as the
accessible name. The first heading therefore announces as "Anglo-Saxon Treasures" even though it labels
a gallery of Roman objects. On a screen reader's heading navigation, the document outline now lists
"Anglo-Saxon Treasures" twice and "Roman Britain" never — so a blind user looking for the Roman gallery
cannot find it by heading, and a user who jumps to the first "Anglo-Saxon Treasures" entry lands on the
wrong content. The heading IS a real `<h2>` (1.3.1 passes), it HAS a non-empty accessible name whose
IDREF resolves to a present, rendered element (4.1.2 passes, no dangling-reference), and the name is a
fluent real phrase — so only 2.4.6's "does the heading describe the topic/purpose of *its* content"
fails, and only on the AT surface.

## Expected ACT-style outcome
**failed** — TT 10.A (`2.4.6-heading-purpose`): the announced first heading "Anglo-Saxon Treasures"
does NOT describe the topic of the content beneath it (Roman-era objects, AD 43–410). ACT rule b49b2e
("Heading is descriptive") fails on the same mis-attribution. The "Anglo-Saxon Treasures" and "The
Viking Incursions" galleries have correct self-referential `aria-labelledby` and pass; the `h1` passes.

## Why automated tools miss it
The `<h2>` has a non-empty accessible name ("Anglo-Saxon Treasures") and its `aria-labelledby` IDREF
resolves to a present element, so no empty-heading, missing-name, or dangling-reference rule fires —
verified: a full `axe.run` (axe-core 4.12.1, default ruleset + experimental `label-content-name-mismatch`
explicitly enabled) reports **0 violations and 0 incomplete** on this page. Crucially, this defect is
even harder than a slug or single-character name: the announced heading is itself a perfectly
descriptive, grammatical phrase, so no empty/short/slug heuristic can flag it, and pointing
`aria-labelledby` at another heading is structurally valid. `label-content-name-mismatch` (ACT 2ee8b8)
does not apply — it targets labelled *controls* whose visible text must be contained in the name, not
headings. Detecting the defect requires reading the section's prose, recognising it as Roman, and
judging that the announced heading "Anglo-Saxon Treasures" labels the wrong topic — the exact
topic-vs-heading comparison TT 10.A calls for, which no string-comparison or structural rule performs.

## Citation
> "Each heading describes the topic or purpose of its content."
— Trusted Tester v5.1.3, Test **10.A** `2.4.6-heading-purpose`, *Test Condition* / *Evaluate Results*
> (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`). The announced first heading "Anglo-Saxon
> Treasures" describes a different gallery's topic, not the Roman content it labels, so this check is false.
