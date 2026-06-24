# case-05 — RTL/Arabic pharmacy page: co-equal "disposal" demoted to h3 under "storage"

## Scenario
An Arabic (RTL) pharmacy information page ("إرشادات السلامة الدوائية في المنزل" / Home
Medication Safety Guidelines, `h1`) covers two explicitly independent, equally important
topics: **تخزين الأدوية بشكل صحيح** (Storing medicines correctly) and **التخلّص الآمن من
الأدوية** (Safe disposal of expired medicines). The intro states they are "موضوعين مستقلين
ومتساويين" (two independent, equal topics) and that "الموضوعان ليسا أحدهما جزءًا من الآخر"
(neither is part of the other). "Storage" is `h2`; "Disposal" is `h3`, so the AT outline
reads disposal as a subsection of storage. A later peer section, "متى تتصل بالصيدلي" (When to
contact the pharmacist), is correctly `h2`. The sequence is h1 → h2 → h3 → h2 — no numeric
skip; `lang="ar"` and `dir="rtl"` are correct.

## Attribute tuple
- **content-domain**: healthcare / community pharmacy patient information
- **UI-component/pattern**: consumer health article with bulleted advice and a reminder note
- **host-language construct**: native headings under correct `lang`/`dir` (RTL)
- **locale/i18n**: Arabic (ar), right-to-left; this is the long-tail i18n variant
- **failure-mechanism**: (b) two co-equal peer sections given different levels so one falsely
  nests under the other — exercised under RTL/Arabic to confirm the judgment is about
  meaning, not text direction

## Developer persona
A localization vendor translated an English source page into Arabic and rebuilt the markup by
hand. In the English original the two sections were (incorrectly) `h2`/`h3` already; the
translator faithfully reproduced the *levels* while translating the *text*, treating heading
level as fixed formatting rather than semantic structure. Because the RTL layout looked
correct and both headings render the same size/colour, the level error carried straight
through localization.

## Element / selector carrying the issue
- FAIL: the `h3` whose text is **"التخلّص الآمن من الأدوية منتهية الصلاحية"** (Safe disposal
  of expired medicines) — `body > h3`. It should be `h2`, a sibling of the storage `h2`.

## Exact accessibility mechanism
An Arabic screen-reader user (e.g. NVDA + an Arabic voice, or VoiceOver) navigating the
heading list hears storage announced at level 2 and disposal at level 3 — i.e. that safe
disposal is a sub-part of storage. But disposal is a separate public-health topic with its
own bulleted procedure (pharmacy take-back, mixing with coffee grounds, removing personal
data) and no dependence on how the medicine was stored. The reader is told there is one major
topic with a nested detail, when there are two equal major topics. RTL direction does not
change the semantics: level still encodes containment, and the level here asserts a
containment the prose explicitly denies. The levels say "child of storage"; the content says
"independent, equal topic."

## Expected ACT-style outcome
**failed** — co-equal topics are given parent/child levels, so the nesting contradicts the
true (peer) hierarchy (H69/G141 "properly nested").

## Why automated tools miss it
The sequence h1 → h2 → h3 → h2 is non-skipping, so axe-core `heading-order`, Lighthouse, and
WAVE pass; `lang`/`dir` are correct so no i18n rule fires; all headings are non-empty and
descriptive. Deciding that disposal is a *peer* of storage requires reading the Arabic prose
— specifically the sentence declaring the two topics independent and equal — which no
automated checker parses or understands. Direction (RTL) is irrelevant to the defect, which
is purely semantic.

## Citation
> **WCAG Techniques — H69 (Description)**
> "When headings are nested hierarchically, the most important information is given the
> highest logical level, and subsections are given subsequent logical levels.(i.e.,
> `h2` is a subsection of `h1`)."

> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental 'handles' that aid in comprehension of the content."
