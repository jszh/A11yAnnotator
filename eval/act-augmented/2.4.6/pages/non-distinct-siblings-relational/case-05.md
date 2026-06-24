# case-05 — Arabic (RTL) LMS course page: five weekly modules each headed "الوحدة" ("the module")

## Scenario
An Arabic-language university LMS ("منصة جامعة النيل") shows a data-science course page split into five weekly modules. Each module is a `<section>` opened by an `<h2>` that reads the single word **"الوحدة"** ("the module"). The distinct weekly topic — "مقدمة في لغة بايثون" (Introduction to Python), "الاحتمالات والإحصاء" (Probability and statistics), "تنظيف البيانات" (Data cleaning), "تصوّر البيانات" (Data visualization), "مقدمة في تعلّم الآلة" (Introduction to machine learning) — is rendered in a non-heading `<p class="topic">` below each heading. A screen reader running in Arabic that navigates by heading hears "الوحدة" five times in a row.

## Attribute tuple
- **content-domain:** higher-ed LMS / online course page
- **UI-component / pattern:** weekly module accordion-style content sections (labelled `<section>`s)
- **host-language construct:** five `<section aria-labelledby>` each with an `<h2>` + body `<p>`/`<ul>`; `lang="ar" dir="rtl"`
- **locale / i18n:** Arabic, right-to-left — the repeated, non-distinguishing heading is in a non-Latin script
- **failure-mechanism:** relational/uniqueness failure of G130 expressed in Arabic — each `الوحدة` ("the module") heading is individually plausible, but the five sibling headings are identical and do not distinguish the five weekly topics in a heading list or heading-to-heading jump

## Developer persona
A localization-minded developer adapted an English course template for the university's Arabic program. The English template's module accordions had headings like "Week 1: Intro to Python" — but the translation/CMS workflow only translated the *static chrome* (the generic word "Module" → "الوحدة") and pushed the per-week topic into a separate "topic" content field that the design rendered as a sub-line. The result: the visible heading is a hard-coded, translated generic ("الوحدة"), and the real, translated weekly topic sits outside the heading. It looked correct in review because each topic line is clearly visible on screen.

## Element / selector carrying the issue
`main section.mod > h2` — the five `<h2>` elements (`#m1`–`#m5`), each containing the text "الوحدة". The differentiator is in the sibling `p.topic`, which is not a heading. Each `<section>` is `aria-labelledby` its own "الوحدة" h2, so all five region names are identical too.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted Arabic-reading user sees the week number and topic line under each heading and tells the five modules apart instantly.
- An Arabic screen-reader user (e.g. NVDA/JAWS/VoiceOver with an Arabic voice) who opens the headings list to jump to "the machine-learning week" hears five identical "الوحدة" entries; jumping H2-to-H2 announces "العنوان من المستوى الثاني، الوحدة" ("heading level 2, the module") five times. Because each `<section>` is `aria-labelledby` its own h2, region navigation is equally undifferentiated. The user must drill into each module's body to find the topic — defeating heading-based orientation.
- Per G130, headings must distinguish their section "in relation … to other sections," and the most important information should lead the heading. The distinguishing topic (Python / Probability / Cleaning / Visualization / ML) appears nowhere in any heading, so the relational requirement fails — exactly as in the English cases, but in Arabic.

The defect is real in the DOM: five `<h2>` nodes all contain "الوحدة"; an Arabic screen reader will announce them identically.

## Expected ACT-style outcome
**failed** (SC 2.4.6 — heading limb / TT 10.A: headings do not distinguish their sections relative to siblings; G130 relational requirement not met).

## Why automated tools miss it
The headings are present, non-empty, sequential (single h1 → five h2), and validly marked up; `lang="ar"`/`dir="rtl"` are correct. axe-core (`empty-heading`, `heading-order`, `page-has-heading-one`), WAVE, and Lighthouse all PASS. Two extra layers defeat heuristics: (1) "الوحدة" is a legitimate, accurate Arabic word for a module — no rule can flag it as "bad"; (2) any tool that leans on an English bad-string list ("Untitled", "Heading", "Section") sees nothing because the text is non-Latin script. Detecting the failure requires reading and understanding Arabic content, recognizing the five modules cover five distinct topics, and judging that the repeated heading collapses that distinction — human, language-aware semantic judgment.

## Citation
> "Descriptive headings identify sections of the content in relation both to the web page as a whole and to other sections of the same web page."
— wcag-techniques/general/G130.html (Description)

> "Authors may also want to consider putting the most important information at the beginning of each heading. This helps users \"skim\" the headings to locate the specific content they need, and is especially helpful when browsers or assistive technology allow navigation from heading to heading."
— wcag-techniques/general/G130.html (Description)

> "The intent of this success criterion is to help users understand what information is contained in web pages and how that information is organized. When headings are clear and descriptive, users can find the information they seek more easily, and they can understand the relationships between different parts of the content more easily."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)
