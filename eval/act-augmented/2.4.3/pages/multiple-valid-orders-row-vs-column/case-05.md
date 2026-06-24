# case-05 — RTL Arabic prayer-times grid, column-major by day right-to-left (valid alternative, i18n long-tail)

## Scenario
A mosque administrator's weekly iqamah-time editor, authored in Arabic with `dir="rtl"`.
The grid's rows are the five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha); its columns
are the seven days. Because the document is RTL, the **first visual column is on the right**
(Saturday / السبت) and the week runs leftward. Each cell is an `<input type="time">`. The
admin's workflow is "set one full day's five iqamah times, then the next day," so focus is
driven **column-major by day**, starting from the right-most (Saturday) column and moving
leftward. A small script assigns a contiguous, strictly per-day `tabindex` run to produce
this order while the markup stays a clean row-major RTL table. This is a valid column
alternative in an RTL locale — the page **passes**.

## Attribute tuple
- **Content domain:** community / religious organization site (mosque admin)
- **UI component / pattern:** weekly schedule grid of `time` inputs
- **Host-language construct:** `dir="rtl"` + script-assigned per-day `tabindex` producing right-to-left column-major focus
- **Locale / i18n:** ar (RTL) — the visual "default" is right-to-left, so LTR order assumptions are inapplicable
- **Failure mechanism:** NONE — false-positive trap compounded by RTL: order is both column-major AND right-to-left, two ways a naive LTR-anchored check could misfire.

## Developer persona
A volunteer who maintains the mosque's site built the editor in Arabic with `dir="rtl"`. The
committee told him admins always "lock in the whole day" before publishing, so he wrote a
short init script that numbers the tab order down each day's column, ordering days
Saturday→Friday (which renders right-to-left). He grouped the tabindex strictly per day,
unaware that someone reviewing with LTR habits might misread the right-to-left, top-of-column
focus path as "jumping around."

## Element / selector carrying the issue
The 35 `td input[type="time"]` controls. After the inline script runs, `tabIndex` is assigned
1–35 walking column-major by day (Saturday block 1–5, Sunday 6–10, …). Visual/DOM order is
row-major by prayer; the RTL direction places Saturday's column at the right. Inspect the
runtime `tabIndex` values per day-column.

## Exact accessibility mechanism
A keyboard / screen-reader user tabbing the grid gets focus on Saturday-Fajr, Saturday-Dhuhr,
Saturday-Asr, Saturday-Maghrib, Saturday-Isha, then Sunday-Fajr … Each `time` input has a
bilingual `aria-label` (e.g. "إقامة الفجر السبت / Fajr Saturday"), so every stop is
unambiguous, and the per-day run is coherent and predictable. Meaning (a per-day prayer
schedule column, read right-to-left as the locale dictates) and operability (every cell
reachable once) are preserved. The SC accepts column-at-a-time and requires only one valid
order; the evaluator must not flag it merely because it is column-major OR because, in RTL,
it does not match an LTR top-to-bottom-left-to-right expectation.

## Expected ACT-style outcome
**passed** (SC 2.4.3). A valid RTL column-major alternative; over-flagging it would betray an
LTR bias the SC explicitly does not impose ("does not necessarily need to be top to bottom,
left to right").

## Why automated tools miss it
The page has no detectable defect — every input is labeled, `<table>` scope is correct,
`dir`/`lang` are set, contrast passes — so axe-core, WAVE, and Lighthouse stay silent. They
cannot evaluate whether a right-to-left, column-major-by-day focus path "reflects a logical
relationship" in an RTL prayer schedule; nor can they correct an LTR-anchored intuition.
Recognizing this as a valid alternative (not a scramble) is a human, locale-aware reasoning
judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "Focus order does not necessarily need to follow the visual layout of the web page, as long as the order in which elements receive focus is logical, and the hierarchy and relationship of content implied by the visual presentation is preserved."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "Focus order does not necessarily need to be top to bottom, left to right."
