# case-02 — Restaurant menu: course sections (the Understanding's OWN example), titles as styled `<p><strong>`

## Scenario
A dinner menu (Cantina del Faro) divided into the exact course sections the Understanding lists
as the model 2.4.10 example: **Appetizers**, **Salads & Soups**, **Primi & Mains**, **Dolci**.
Each course is visually a distinct section — separated by a decorative horizontal rule with a
center ornament, and titled in a 23px uppercase letter-spaced serif display face. But every
course title is `<p class="course"><strong>…</strong></p>`, not a heading element and not
`role="heading"`. The only heading is `<h1>Cantina del Faro</h1>`.

## Attribute tuple
- **Content domain:** restaurant menu & ordering
- **UI component / pattern:** long-form sectioned list with decorative `<hr>` separators
- **Host-language construct:** `<p>` + `<strong>` styled as a display heading; dishes in a
  semantic `<ul>`
- **Locale / i18n:** en (with Italian dish names)
- **Failure mechanism:** visual-only section boundary (decorative rule + display type) with no
  programmatic heading per course
- **Content domain × spec example:** directly instantiates the Understanding's "menu / courses"
  example, built wrong

## Developer persona
A restaurateur built the site in a drag-and-drop website builder. The builder's "Heading" widget
forced a preset font, so to get the elegant uppercase-letter-spaced look the owner used a
"Paragraph" widget and made the text bold by hand. The `<hr>` ornament came from a "Divider"
widget. The result looks like a beautifully sectioned menu and reads perfectly by eye — but the
course names carry no heading semantics.

## Element / selector carrying the issue
`p.course > strong` (×4: "Appetizers", "Salads & Soups", "Primi & Mains", "Dolci"). Verified in
Chromium: exactly **one** programmatic heading exists — `h1` "Cantina del Faro". The four course
titles are not headings.

## Exact accessibility mechanism
The Understanding names this very pattern as the *positive* example ("A menu contains different
sections for different courses. Each section has a heading: Appetizers, Salad, Soup, Entree,
Dessert"). Here the courses exist as visual sections but the headings do not. A blind diner using
heading navigation hears only "Cantina del Faro" and then must read the entire menu linearly to
discover where Appetizers ends and Mains begins. The `<hr>` separators are decorative
(`aria-hidden` ornament) and convey nothing programmatically — exactly the "visual presentation
is not sufficient" case.

## Expected ACT-style outcome
**failed** — the menu is organized into course sections and none of them has a heading. (Contrast
with ACT 33fcbd, where an `<hr>` is allowed *because it sits alongside a genuine heading*; here the
`<hr>` stands in place of headings.)

## Why automated tools miss it
The page has a valid `<h1>`, valid `<hr>` separators (an `<hr>` is not an error), semantically
correct `<ul>` dish lists, and good contrast — axe/WAVE/Lighthouse report no violation and 047fe0
passes. No tool can read "Appetizers / Salads & Soups / Primi & Mains / Dolci," recognize them as
the menu's course sections, and conclude each should be a heading. That mapping of words + visual
breaks to "these are sections needing headings" is precisely the human judgment the Understanding
example assumes.

## Citation
> "A menu contains different sections for different courses. Each section has a heading:
> Appetizers, Salad, Soup, Entree, Dessert."
— WCAG 2.2 Understanding, *Section Headings*, Examples (`wcag-understanding/section-headings.html`)
