# case-05 — A working disclosure IS present after reflow, but it reveals a generic blurb, not the dropped emergency / advance-directive panel (FAIL)

## Scenario
A healthcare patient portal ("Meadowbrook Health — Your care summary") shows three panels at desktop
width: (A) Next appointment, (B) Active medications, and (C) Emergency & advance directive — next-of-kin
name and phone, GP out-of-hours line, and a flagged "DNACPR in place" advance-directive note. Panel (C)
exists only in that panel. At `max-width:560px` the grid stacks to one column and panel (C) is removed
with `display:none`. A "More details about your care summary" disclosure (`<details>/<summary>`) appears
at narrow width and genuinely works — but what it reveals is a generic help blurb ("This summary is
generated from your shared care record… contact the surgery during opening hours…"), NOT the emergency
contacts or the resuscitation note. The dropped life-safety information appears nowhere else on the
page. A user on a phone, or zoomed to 400%, cannot reach the next-of-kin phone, the out-of-hours line,
or the DNACPR flag.

## Attribute tuple
- **Content domain:** healthcare / patient portal (care summary)
- **UI component / pattern:** three-panel grid collapsing to one column, plus a native `<details>` disclosure
- **Host-language construct:** `display:none` on the emergency panel + a *working but mismatched* `<details>/<summary>` disclosure
- **Locale / i18n:** en-GB (NHS number, DNACPR, 999, "surgery", 07700/0300 numbers)
- **Failure mechanism:** disclosure-content mismatch — the replacement mechanism is present and operable but does not contain the dropped section

## Developer persona
A portal vendor's developer knew that hiding content on mobile risks a Reflow failure, so they added a
"More details" disclosure on small screens — a habit picked up from a checklist that said "if you hide
something, give a disclosure." But they wired the disclosure to a pre-existing generic help string the
CMS already had on hand, never connecting it to the emergency-contact panel that the responsive rule
actually removed. The result is the worst kind of false safety: the page now *looks* like it follows
the F102 remedy (there is a working disclosure after reflow) while the dropped content is still
unreachable.

## Element / selector carrying the issue
`section.panel.emergency` (selector `.panel.emergency`) removed by `@media (max-width:560px){
.panel.emergency { display:none } }`. The decoy is `details.more-details` inside `.more` — a fully
functional disclosure whose body text is unrelated to the dropped panel. The mismatch between the
dropped panel's content and the disclosure's content is the defect.

## Exact accessibility mechanism
At ≥561px the emergency panel — next-of-kin phone `07700 900 184`, GP out-of-hours `0300 123 9981`, and
the "DNACPR in place" advance-directive flag — is visible and in the reading order. At 320px that panel
is removed from the rendering and the accessibility tree. The `<details>` disclosure that appears is
operable by keyboard and screen reader and its `summary` even invites the user expecting "more
details," but expanding it yields only a generic overnight-update / opening-hours blurb. The dropped
emergency information is not repositioned into the column, not inside this (or any) disclosure, and not
linked to another view. So content available at desktop width is unavailable after reflow to 320px —
and the presence of a *working* disclosure does not cure it, because the disclosure does not surface the
dropped section. This is F102 with the third test-step explicitly failed: a disclosure exists, but it
does not offer the same or equivalent content.

## Expected ACT-style outcome
**failed** (SC 1.4.10). A section present at 1280px is absent at 320px, and the disclosure offered after
reflow contains different content, so no equivalent mechanism surfaces the dropped emergency / advance-
directive information.

## Why automated tools miss it
`<details>/<summary>` is a valid, fully operable native disclosure — it passes every structural,
name, role, and keyboard check, and a naive "is there a disclosure after reflow?" heuristic would mark
the page safe. axe-core, WAVE, and Lighthouse do not read the emergency panel's text, read the
disclosure's text, and reason that they are different information. They cannot perform the F102 step-3
judgment — "does this disclosure actually contain the same or equivalent content that was dropped?" —
which requires a human to compare the dropped section against what the disclosure reveals. This is why
the case is the hardest variant: the remedy *appears* present and working, yet the content is still
lost.

## Citation
**Reference:** WCAG Technique F102 — Test Procedure (`wcag-techniques/failures/F102.html`)
> "For each content element that is not provided at the viewport width of 320px, check that there is a way to reach the same or equivalent content via disclosure widgets, pop-ups, or links to other views"

**Reference:** WCAG Technique F102 — Examples (`wcag-techniques/failures/F102.html`)
> "Sections of content text disappear after reflow, without being available via some disclosure widget."
