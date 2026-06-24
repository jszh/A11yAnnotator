# case-05 — Arabic (RTL) transit page: "Northbound line timetable" link points to the southbound section

## Scenario
A municipal transit authority's Arabic (RTL) page for bus route 12 lists two in-page jump
links: **"الجدول الزمني للخط الشمالي"** (Northbound line timetable, toward the Old City) and
"الجدول الزمني للخط الجنوبي" (Southbound line timetable, toward the Harbour). The page holds
two real schedule sections, `#northbound-schedule` and `#southbound-schedule`, each with a
distinct departures table. The Northbound link's `href` is **`#southbound-schedule`** — the
section whose heading and table are the *southbound* schedule. The genuine northbound table
is `#northbound-schedule`. A rider who selects the northbound link is delivered to the
southbound timetable, a real but contradictory destination.

## Attribute tuple
- **content-domain:** municipal transit schedule
- **UI-component / pattern:** "quick links" list jumping to in-page schedule sections
- **host-language construct:** `<a href="#southbound-schedule">` whose Arabic text says "northbound"
- **locale / i18n:** Arabic (`lang="ar"`, `dir="rtl"`) — correct language metadata
- **failure-mechanism:** descriptive name vs. actual destination mismatch — direction named in the link is the opposite of the section it targets

## Developer persona
A transit-agency developer built the quick-links list by copying the southbound `<li>`
(href `#southbound-schedule`) to create the northbound one, translated/edited the visible
Arabic label to say "northbound", but left the `href` on `#southbound-schedule`. In an RTL
codebase with two near-identical schedule blocks, the duplicated anchor was easy to miss,
and because both links scroll to a real timetable, manual mouse testing looked fine.

## Element / selector carrying the issue
`nav.quick ul li:first-child a` — accessible name "الجدول الزمني للخط الشمالي (باتجاه المدينة
القديمة)" (Northbound timetable), `href="#southbound-schedule"`. The contradicting target is
`<section id="southbound-schedule">` headed "الجدول الزمني للخط الجنوبي" (Southbound). The
honest target is `#northbound-schedule`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Screen-reader user (Arabic TTS):** hears "الجدول الزمني للخط الشمالي" (northbound
  timetable) in the links list and selects it to plan a trip toward the Old City. Focus
  lands on the southbound section toward the Harbour — the opposite direction. They could
  read the wrong departure times and miss or misboard a bus. The link's name did not let
  them reach the purpose it stated.
- **Cognitive user:** direction is the single most safety-relevant fact on a transit page;
  a link that names one direction but goes to the other is exactly the misdirection 2.4.4
  guards against.
- The fault is real in the DOM: `href="#southbound-schedule"`, and that section is genuinely
  the southbound table, so any agent following the link experiences the contradiction.

## Expected ACT-style outcome
**failed** (SC 2.4.4). The link's descriptive accessible name ("Northbound timetable") does
not match its actual destination (the southbound schedule section) — the name misrepresents
the link's purpose.

## Why automated tools miss it
- Both link names are non-empty, specific, and unique, and the page sets `lang="ar"`/
  `dir="rtl"` correctly — language and name-quality heuristics all pass.
- `#southbound-schedule` resolves to a real element; no broken-anchor flag.
- Both schedule sections exist with valid `<table>` markup and captions — structure is
  sound.
- Catching it requires (a) reading Arabic, (b) following the "northbound" link, and (c)
  recognising the destination heading says "southbound" — a cross-language, meaning-level
  comparison of link text to target content that no automated checker performs.

## Citation
> "Whenever possible, provide link text that identifies the purpose of the link without needing additional context."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "Determine whether the ANDI Output, in combination with the programmatically determined link context ... adequately describes the link's purpose or function."
— refs/trusted-tester/sc-2.4.4-link-purpose.md (How to Test)
