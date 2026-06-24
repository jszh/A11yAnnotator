# case-06 — News portal: three navigation regions, each demarcated by a heading (PASS boundary)

## Scenario
A news portal ("The Meridian Courier", a local-government story) has the **same three-region
navigation structure** as the failing cases — (1) a top **section nav**, (2) a **"Related
coverage"** sidebar nav, and (3) a **footer site-map nav** — but here **every navigation
region is demarcated by a real, visible `<h2>` heading**, exactly as H69 prescribes:
- Region 1: `<h2 id="secnav-h">Sections</h2>`, with `nav.sections[aria-labelledby="secnav-h"]`
- Region 2: `<h2 id="related-h">Related coverage</h2>`, with `nav[aria-labelledby="related-h"]`
- Region 3: `<h2 id="footnav-h">Browse the Courier</h2>`, with `nav[aria-labelledby="footnav-h"]`

The visible `<h2>`s appear in the headings list **and** name each landmark via
`aria-labelledby`. A screen-reader user navigating by heading encounters "Sections",
"Related coverage", and "Browse the Courier" and can jump to and distinguish every navigation
region. The article keeps a single `<h1>` plus its own content `<h2>`s, so the outline is
sensible. This is the contrast case that sharpens what "demarcated by a heading" means — it
is precisely what cases 01–05 lack.

## Attribute tuple
- **content-domain:** news / local editorial
- **UI-component / pattern:** section nav + related-coverage rail + footer site-map nav (same structure as the failing cases, correctly demarcated)
- **host-language construct:** three `<nav aria-labelledby>` regions, each introduced by a real visible `<h2>`; article `<h1>` + content `<h2 class="sub">`s
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the conformant boundary variant; the H69 nav-demarcation requirement is met for all three navigation sections

## Developer persona
A newsroom's accessibility lead reviewed the site after a prior audit flagged
"navigation regions are not demarcated by headings." They added a real `<h2>` at the start of
each navigation region (visible, styled to match the typographic system) and wired each `<nav>`
to its heading with `aria-labelledby`, so the heading both demarcates the section *and* names
the landmark. They verified with a screen reader that the headings list now contains
"Sections / Related coverage / Browse the Courier" alongside the article headings.

## Element / selector carrying the issue
No issue. The relevant (correct) selectors are:
- `nav.sections > h2#secnav-h` ("Sections") — demarcates region 1.
- `aside.related nav > h2#related-h` ("Related coverage") — demarcates region 2.
- `footer.foot nav > h2#footnav-h` ("Browse the Courier") — demarcates region 3.

Each heading is a real `<h2>` that appears in the headings list and is referenced by its
`<nav>`'s `aria-labelledby`.

## Exact accessibility mechanism (what AT experiences, why it passes)
- A screen-reader user navigating by **heading** hears, in document order: "City Hall
  approves $42M transit budget…" (h1, the article) → "Sections" (h2, top nav) → "What
  changed in the final vote" / "What riders can expect" (article content h2s) → "Related
  coverage" (h2, sidebar nav) → "Browse the Courier" (h2, footer nav). Every navigation region
  is now findable and distinguishable by heading.
- A screen-reader user navigating by **landmark** hears three navigation landmarks named by
  their headings ("Sections navigation", "Related coverage navigation", "Browse the Courier
  navigation"), because each `<nav>` is `aria-labelledby` its visible `<h2>`.
- Per H69, "each section on the page starts with a heading" is true for all three navigation
  sections, satisfying SC 2.4.10's nav-demarcation requirement.

## Expected ACT-style outcome
**passed** (SC 2.4.10 — H69 nav-demarcation sub-limb satisfied: each of the three distinct
navigation sections is demarcated by a real section heading, which also names the landmark).

## Why automated tools "miss" it (i.e., why this is still a human-judgment boundary)
Automated tools pass this page — but they would *also* have passed cases 01–05, which fail.
That is the point: tools cannot tell the conformant version (06) from the non-conformant ones
(01–05), because in both the markup is valid, there is one `<h1>`, and the landmarks are
present. Only a human reading the page can confirm that here a *real heading* introduces each
navigation section (so heading navigation works) whereas in 01–05 no heading does. This
boundary case demonstrates the exact judgment the failing cases require — and confirms the
aspect is about *heading demarcation*, not merely the presence of navigation landmarks.

## Citation
> "to demarcate different navigational sections like top or main navigation, left or secondary navigation and footer navigation;"
— wcag-techniques/html/H69.html (Description — objective bullet list)

> "&lt;nav aria-labelledby=\"nav-heading\"&gt; &lt;h2 id=\"nav-heading\"&gt;More About Monday Monkey, Ltd.&lt;/h2&gt; … In this example, heading markup is used to make the navigation and main content sections perceivable."
— wcag-techniques/html/H69.html (Examples — "Headings show the overall organization of the content")

> "Check that the content is divided into separate sections. … Check that each section on the page starts with a heading."
— wcag-techniques/html/H69.html (Tests — Procedure)
