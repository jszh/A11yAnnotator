# case-06 — Transit site utilities: correctly-labelled home / print / call icons (PASS)

## Scenario
A municipal transit page (Metro Transit, Route 12 schedule) has a utility bar of three
icon-only links: a house (home), a printer (print this schedule), and a telephone (call
rider services). Each is an icon-only `<a>` wrapping an inline SVG, and each carries a
non-empty `aria-label` that *correctly* describes both the rendered glyph and the link's
purpose: "Metro Transit home", "Print this schedule", "Call rider services: 311". This is
the boundary control: the icons have names AND the names match the glyphs, so the page
satisfies 2.4.4. It exists so the discriminator for this aspect is glyph-vs-name
agreement, not the mere presence of a name.

## Attribute tuple
- **content-domain:** municipal transit schedule / civic services
- **UI-component/pattern:** site-utility icon bar (home / print / call)
- **host-language construct:** `<a aria-label="…descriptive…"><svg aria-hidden="true">…</svg></a>`
- **locale/i18n:** en-US
- **failure-mechanism:** none — accessible name correctly matches the glyph and purpose (PASS control)

## Developer persona
An accessibility-conscious civic-team developer hand-wrote each utility link, set
`aria-hidden="true"` on the decorative SVG, and authored an `aria-label` that names the
*action* (not the asset): "Print this schedule," and even folded the phone number into
the call link's name ("Call rider services: 311") so a voice-control user can target it.
They tested the link list with a screen reader before shipping.

## Element / selector carrying the issue
None (control). The relevant elements are `nav.util a[href="/"]` (house = "Metro Transit
home"), `nav.util a[href$="/print"]` (printer = "Print this schedule"), and
`nav.util a[href^="tel:"]` (telephone = "Call rider services: 311") — each name matches
its glyph and destination.

## Exact accessibility mechanism
Each `<a>` is in the accessibility tree with role `link` and a non-empty accessible name
from `aria-label`; the inner SVG is `aria-hidden="true"`, so the name is exactly the
label. A screen-reader user hears "Metro Transit home, link / Print this schedule, link /
Call rider services: 311, link." Each announced name conveys what the glyph depicts and
where/what the link does, so the user can determine the purpose of each link from the
link text alone. Both the name-presence floor (c487ae/F89) and the descriptive limb of
2.4.4 are satisfied.

## Expected ACT-style outcome
**passed** (SC 2.4.4 Link Purpose (In Context)). c487ae *passes* (names non-empty);
F89 inapplicable (links are named); the names also correctly describe the link purposes.

## Why automated tools miss it
This page is a true PASS, so there is no failure for a tool to miss — its role is to
prove the aspect's discriminator is glyph-vs-name *agreement*, not name presence. An
automated tool would report exactly what is true here (links have discernible text);
note that the *same* automated signal ("has a non-empty name") is reported identically
for the failing cases 01–05, which is precisely why automated tools cannot separate this
PASS from those FAILs — only a human comparing each rendered glyph to its name can.

## Citation
> **Reference:** WCAG Technique H30 — "Providing link text that describes the purpose of
> a link for anchor elements" (`wcag-techniques/html/H30.html`)
>
> **Quote (verbatim):** "When an image is the only content of a link, the text
> alternative for the image describes the unique function of the link."
>
> **Reference:** WCAG 2.2 Understanding — "Intent of Link Purpose (In Context)"
> (`wcag-understanding/link-purpose-in-context.html`)
>
> **Quote (verbatim):** "The intent of this success criterion is to help users
> understand the purpose of each link so they can decide whether they want to follow the
> link."
