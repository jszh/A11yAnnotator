# case-05 — Flag-icon language switcher whose alt names the flag/country, not the language

## Scenario
The footer of a SaaS marketing site (Lumen Analytics) has a language switcher built from
clickable country flags. Each flag `<img>` is the sole content of an `<a>` whose `href`
switches the interface language (`/?lang=ja`, `/?lang=de`, `/?lang=pt-BR`). The defect: each
flag's `alt` literally and correctly names the depicted flag — `"Flag of Japan"`, `"Flag of
Germany"`, `"Flag of Brazil"`. Those are accurate descriptions of the images, but the link's
purpose is to switch to a **language**, and the alt should serve that purpose (e.g. "日本語 /
Switch to Japanese"), not name a country. The English link is correctly labelled (`alt="English"`)
for contrast.

## Attribute tuple
- **Content domain:** B2B SaaS marketing / pricing page
- **UI component / pattern:** footer language switcher made of flag-image links
- **Host-language construct:** `<a href="/?lang=...">` wrapping a single flag `<img>` (inline SVG)
- **Locale / i18n:** multilingual switcher (en, ja, de, pt-BR) — country-as-proxy-for-language anti-pattern
- **Failure mechanism:** alt names the depicted flag/country instead of serving the link's purpose (selecting a language)

## Developer persona
A growth engineer added i18n late in the project and grabbed a flag-icon set to build a quick
language picker. They wrote each alt as the obvious description of the picture ("Flag of
Japan"), which passed the team's "all images need alt" gate. Nobody flagged that a flag is not
a language (Brazil's flag for Portuguese, one flag for many-language countries) or that the
link's job — switching the UI language — never makes it into the accessible name.

## Element / selector carrying the issue
`.langswitch a[hreflang="ja"] > img[alt="Flag of Japan"]` (and the `de` / `pt-BR` links). The
link's accessible name comes entirely from the flag image's alt, so the language-switch control
announces "Flag of Japan" instead of "日本語 / Japanese".

## Exact accessibility mechanism
Because each flag `<img>` is the only content of its `<a>`, the image's `alt` becomes the
link's accessible name. A screen-reader user looking for how to read the site in their language
hears "Flag of Japan, link" — a country, not a language — and a Portuguese speaker must know
that "Flag of Brazil" is the route to Portuguese. The `hreflang` attribute carries the true
purpose programmatically, but it is not the accessible name. The flag pixels are correct, so
the alt is *right about the depiction and wrong for the function*. The English link
(`alt="English"`) shows the correct purpose-named pattern.

## Expected ACT-style outcome
**failed** (SC 1.1.1, link-purpose / G94 equivalence-in-context). The text alternative does
not serve the same purpose as the non-text content: the purpose is to select a language, and
the alternative names a flag/country instead. Presence and "is the flag described?" checks
pass.

## Why automated tools miss it
Every flag `<img>` has a non-empty, accurate `alt`, so `image-alt` passes; every `<a>` has a
non-empty accessible name, so `link-name` passes. axe-core/WAVE/Lighthouse do not interpret
`href="/?lang=ja"` or `hreflang` to learn the link selects a language, and they cannot judge
that "Flag of Japan" is the wrong alternative for a language-selection control. Knowing the
purpose is language selection — and that a flag is a poor proxy for it — requires human
contextual judgment.

## Citation
**Reference:** WCAG Technique H30 (`wcag-techniques/html/H30.html`)
> "When an image is the only content of a link, the text alternative for the image describes the unique function of the link."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "Different alternatives for an image of the world: An image of the world that is used on a travel site as a link to the International Travel section has the text alternative \"International Travel\". The same image is used as a link on a university website with the text alternative \"International Campuses\"."
