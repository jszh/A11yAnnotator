# case-06 — Allergen/dietary legend column is display:none at 320px, orphaning the per-dish markers (V/Ve/GF/N/Sf/D) with no equivalent key (FAIL)

## Scenario
A restaurant dinner menu ("Saffron & Sage") lists each dish with terse dietary/allergen markers —
`V` (vegetarian), `Ve` (vegan), `GF` (gluten-free), `N` (nuts), `Sf` (shellfish), `D` (dairy) — and a
right-hand legend column that decodes them. At desktop width a guest can read "Pan-roasted hake — Sf D
GF" and consult the key. At `max-width:600px` the menu reflows to a clean single column (the dishes
survive perfectly, no horizontal scroll), but the legend aside is removed with `display:none`. The
markers still appear on every dish, yet the key that explains them is gone and reproduced nowhere else —
no tooltip, no inline expansion, no link to an allergen page. On a phone, or zoomed to 400%, a guest
with a nut or shellfish allergy sees "N" and "Sf" with no way to decode them.

## Attribute tuple
- **Content domain:** restaurant menu & ordering
- **UI component / pattern:** menu list + a sidebar "key/legend" that decodes inline abbreviation markers
- **Host-language construct:** real-text dish markers + a `<dl>` legend removed via `@media (max-width:600px){ display:none }`
- **Locale / i18n:** en-GB (£, "crustaceans," discretionary service charge)
- **Failure mechanism:** the decoder/legend for an on-screen code is dropped at narrow width, orphaning still-present markers (visual/semantic loss without any element being malformed)

## Developer persona
A boutique restaurant's site was built by a freelance designer from a "fine-dining menu" template that
placed the allergen key in a decorative side column. The template's mobile stylesheet hid that side
column to keep the phone view elegant and uncluttered — a purely aesthetic decision. The designer never
considered that the per-dish letters are meaningless without the key, because on their own wide screen
the key was always visible right next to the dishes.

## Element / selector carrying the issue
`aside.legend` (selector `aside.legend`) removed by `@media (max-width:600px){ aside.legend {
display:none } }`. The orphaned content is the `.dish .markers` spans on every dish (e.g. `Sf  D  GF`),
which depend entirely on the dropped `<dl>` key for meaning.

## Exact accessibility mechanism
At ≥601px the legend `<dl>` maps each marker to its meaning, so any reader can interpret "Sf" as
"contains shellfish/crustaceans." At 320px the legend is removed from the rendering and the
accessibility tree, but the markers remain on every dish. A screen-reader or sighted user navigating
the reflowed menu encounters bare abbreviations ("N", "Sf", "D") with no key anywhere on the page and
no mechanism (tooltip, disclosure, link) to recover it. The information that made an existing on-screen
code usable — and that a guest needs to order safely around an allergy — was present at desktop width
and is unavailable after reflow to 320px. That is the F102 failure: content (here, the decoding key)
disappears after reflow with no equivalent way to reach it.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The allergen/dietary key present at 1280px is absent at 320px, leaving the
per-dish markers undecodable and with no equivalent mechanism.

## Why automated tools miss it
Every element on the page is well-formed real text: the dish names, the markers, and the legend are all
DOM text with adequate contrast — there is no missing alt, empty label, or contrast failure for a
linter to catch. The legend is simply `display:none` inside a media query, an entirely legitimate
responsive idiom. axe-core, WAVE, and Lighthouse do not render the menu at 320px, notice that every
dish still carries abbreviation markers while the only key to them has been removed, and reason that the
markers are now meaningless. Recognising that the *decoder* for an existing on-screen code disappeared
on reflow — and that nothing else surfaces it — is a human semantic-and-reflow comparison the static,
single-width tools cannot perform.

## Citation
**Reference:** WCAG Technique F102 — Description (`wcag-techniques/failures/F102.html`)
> "This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."

**Reference:** WCAG Technique F102 — Test Procedure (`wcag-techniques/failures/F102.html`)
> "Check visible content elements at a desktop viewport width such as 1280px"
