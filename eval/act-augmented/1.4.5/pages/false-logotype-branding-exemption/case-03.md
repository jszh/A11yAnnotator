# case-03 — Navigation bar where every label is a CSS background-image of hand-lettered text, justified as "branding"

## Scenario
A restaurant site. The wordmark "Saffron & Sage" is live text. The primary navigation bar,
however, paints each item's visible label ("Menu", "Reservations", "Private Events", "Find
Us") as a CSS `background-image` of hand-lettered text in the brand signage face. Each `<a>`
carries a visually-hidden live-text span so it has an accessible name, but the on-screen
labels that sighted users read are pixels, not live text. The designer argues "the whole nav
is set in our custom signage font; it's branding, so 1.4.5 exempts it." WCAG explicitly lists
"Navigation items" as text that should be live CSS text. Navigation labels are functional,
informational text — not a logo or brand name — so the logotype/branding exemption does not
cover them.

## Attribute tuple
- **Content domain:** restaurant menu & ordering
- **UI component / pattern:** primary navigation bar (menu of links)
- **Host-language construct:** `<a>` with a CSS `background-image` (inline-SVG `data:` URI) label + a visually-hidden text span
- **Locale / i18n:** en
- **Failure mechanism:** navigation labels rendered as images of text and defended as part of the "brand look" / branding exemption

## Developer persona
An agency themed a restaurant template and the chef-owner insisted the menu match the
hand-lettered signage outside the restaurant. Rather than license a web font, the agency
exported each nav word as artwork and set it as a `background-image`, then added
visually-hidden text "for screen readers." They told the client the nav was "on-brand and
still accessible," conflating the brand signage style with the logotype exemption.

## Element / selector carrying the issue
`nav.brandnav a` (all four: `.n-menu`, `.n-resv`, `.n-events`, `.n-find`) — each link's
visible label is a `background-image` of text; the accessible name comes from the
`span.vh`, not from the visible glyphs.

## Exact accessibility mechanism
The visible labels are background images, so they cannot be resized by the user (background
images do not reflow with text-zoom and pixelate at page zoom) and cannot be recoloured by OS
high-contrast / forced-colors mode — forced-colors does not repaint background-image text, so
in Windows High Contrast the labels may vanish against the forced background. A screen-reader
user still hears the link names (from `.vh`), but 1.4.5 is about the *visual* customisation a
low-vision sighted user needs, which is denied. Navigation labels are not a logotype; their
information ("Menu", "Reservations", …) is fully expressible as live CSS-styled text, so text
must be used.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The visible navigation labels are images of text that are not
logotypes and not user-customisable; text could achieve the same effect.

## Why automated tools miss it
Every `<a>` has a discernible accessible name (the visually-hidden span), so axe-core's
`link-name` rule passes and there are no empty links or missing alts. Automated tools do not
inspect `background-image` URLs to detect that they are images of text, and cannot reason that
navigation labels are informational rather than branding. The judgment "these are nav labels,
not a logo" requires human reading of the rendered page plus WCAG context.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, "Examples", Navigation items
(`wcag-understanding/images-of-text.html`)
> "A web page contains a menu of navigation links that have both an icon and text to describe their target. CSS is used to display the text's font family, size and foreground and background colors; as well as the spacing between the navigation links."

**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1a
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Logotypes (text that is part of a logo or brand name) cannot be replaced by text."
