# case-05 — RTL Arabic transit site: services nav + quick-links cluster + footer legal nav, none headed

## Scenario
A right-to-left Arabic municipal transit website ("هيئة النقل بمدينة الواحة" — Oasis City
Transit Authority, *Bus schedules* page) has three functionally distinct navigation regions:
1. a **top/primary services nav** (المواعيد / الخطوط / الأجور / الأخبار / المساعدة —
   Schedules / Lines / Fares / News / Help),
2. a **sidebar quick-links utility cluster** (تطبيق الهاتف / الأسئلة الشائعة / المفقودات /
   تواصل معنا — Mobile app / FAQ / Lost & found / Contact us), and
3. a **footer legal nav** (سياسة الخصوصية / شروط الاستخدام / إمكانية الوصول — Privacy /
   Terms / Accessibility / Sitemap / About).

Each is a `<ul>` of links inside a `<nav>`. **None carries a heading.** The only heading is
the main content `<h1>` "مواعيد الحافلات" (Bus schedules). A screen-reader user (e.g.
VoiceOver in Arabic) navigating by heading hears only the content heading and cannot tell the
services nav from the quick-links cluster from the footer legal nav.

## Attribute tuple
- **content-domain:** municipal transit / public-transport schedule (civic, non-English)
- **UI-component / pattern:** primary nav + sidebar quick-links + footer legal nav
- **host-language construct:** three `<nav>`>`<ul>` regions; single content `<h1>`; a data `<table>` with `<caption>` (the only labelled section — but it's a table caption, not a navigation heading)
- **locale / i18n:** Arabic, `lang="ar"`, `dir="rtl"` (correctly set — so this is NOT a lang/dir bug; the defect is purely the missing nav headings)
- **failure-mechanism:** H69 nav-demarcation in an RTL/non-Latin context — three distinct navigation sections, none demarcated by a heading; the functional distinctness is only legible by READING the Arabic link text

## Developer persona
A municipal contractor localized an existing English transit template into Arabic. They
carefully set `lang="ar"` and `dir="rtl"` and translated all the link text and the `<h1>`, and
added a `<caption>` to the schedule table. But the source template never had headings on its
navigation regions, so the Arabic build inherited the same heading-less navs. The team's
accessibility review focused on the (genuinely correct) RTL/lang handling and the translated
strings; nobody checked whether the three navigation regions were demarcated by headings,
because the original English page had "passed" the same automated scan.

## Element / selector carrying the issue
- `header.top nav` (region 1, primary services navigation) — no heading.
- `aside.rail nav` (region 2, quick-links cluster) — no heading.
- `footer.foot nav` (region 3, footer legal navigation) — no heading.

The document's only heading is `main h1` "مواعيد الحافلات". The table `<caption>` labels the
schedule table, not any navigation region (and is not a heading element).

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted Arabic reader perceives three visually separate regions (green top bar, sand
  sidebar card, dark footer) and reads the Arabic link text to know each region's purpose.
- A screen-reader user navigating by heading finds exactly one heading: "مواعيد الحافلات"
  (h1). The three navigation regions are reachable as landmarks but invisible to heading
  navigation, so the user cannot, by heading, find or distinguish the services nav, the
  quick-links cluster, and the footer legal nav.
- Per H69, heading markup should demarcate "top or main navigation, left or secondary
  navigation and footer navigation." This page contains exactly that spread of navigation
  sections — primary, secondary/utility, and footer — and demarcates none of them.
- The correct `lang`/`dir` and the table `<caption>` are deliberate red herrings: they make
  the page pass language and table checks while the section-heading defect remains.

The defect is genuinely in the DOM: three heading-less `<nav>` regions in a valid RTL document.

## Expected ACT-style outcome
**failed** (SC 2.4.10 — H69 nav-demarcation sub-limb: primary, secondary/quick-links, and
footer navigation sections, none introduced by a section heading).

## Why automated tools miss it
The page has correct `lang="ar"`/`dir="rtl"`, one `<h1>`, valid `<nav>` landmarks, a properly
captioned table, no empty headings, and no missing attributes — axe-core, WAVE, and
Lighthouse all pass it (ACT 047fe0 passes on the `<h1>`). To detect this failure a checker
would have to *read the Arabic link text*, recognize that "المواعيد/الخطوط/الأجور" (services),
"تطبيق الهاتف/الأسئلة الشائعة" (quick links), and "سياسة الخصوصية/شروط الاستخدام" (legal) are
three different navigational purposes, and judge that each warrants a demarcating section
heading. That is a multilingual semantic reading task far outside any static rule.

## Citation
> "to demarcate different navigational sections like top or main navigation, left or secondary navigation and footer navigation;"
— wcag-techniques/html/H69.html (Description — objective bullet list)

> "People with some learning disabilities will be able to use the headings to understand the overall organization of the page content more easily."
— wcag-understanding/section-headings.html (Benefits of Section Headings)

> "The intent of this success criterion is to provide headings for sections of a web page, when the page is organized into sections. … When such sections exist, they need to have headings that introduce them."
— wcag-understanding/section-headings.html (Intent of Section Headings)
