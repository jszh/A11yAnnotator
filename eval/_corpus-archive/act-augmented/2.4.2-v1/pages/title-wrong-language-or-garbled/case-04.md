# case-04 — Japanese support page, developer placeholder `<title>` "TODO: title"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness; placeholder + wrong-language)
- **Expected ACT-style outcome:** **failed**

## Scenario
A Japanese SaaS help-center article ("クラウドノート ヘルプセンター", `<html lang="ja">`)
explaining how to enable two-factor authentication. The body — table of contents,
headings, numbered steps, a caution note — is substantive, idiomatic Japanese. The
`<title>` is the developer placeholder **`TODO: title`** that was never replaced before
shipping.

## Element / selector carrying the issue
`head > title` — content `TODO: title`.

## Exact accessibility mechanism
The user agent exposes "TODO: title" as the document title — announced by the screen
reader on load, shown as the tab name, the default bookmark, and the history entry. For
the Japanese-reading audience this title is doubly unusable: it is (a) in English, a
language much of the audience may not read, and (b) developer filler ("TODO") that names
no topic — not "二段階認証" (two-factor authentication). A user cannot identify or return
to this page out of context from "TODO: title". The title is present and non-empty, so
no structural rule is violated; the failure is that the present title is placeholder
text in the wrong language for the audience.

## Why automated tools cannot detect it
- "TODO: title" is a present, non-empty, ten-character title, so axe-core / WAVE /
  Lighthouse missing-/empty-title rules PASS.
- F25 explicitly lists "Filler or placeholder text" and authoring-tool defaults as
  failures, but no automated tool maintains a comprehensive, multilingual lexicon of
  developer placeholders (TODO, FIXME, "title here", "lorem ipsum", "Untitled
  Document", …); and any keyword heuristic would mis-fire on legitimate titles
  containing those words (an article literally about "TODO lists", for example).
  Deciding that "TODO: title" is non-descriptive placeholder text — and that English
  placeholder text is useless to this Japanese audience — is a human semantic judgment.

## Citation

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> Verbatim quote (Examples of text that are not titles):
> "Authoring tool default titles, such as"
> "Filler or placeholder text"

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> Verbatim quote (Evaluate Results — PASS if ALL true):
> "The Page Title accurately identifies the contents or purpose of the web page, AND"
