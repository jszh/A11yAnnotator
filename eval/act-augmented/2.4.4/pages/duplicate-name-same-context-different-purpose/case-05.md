# case-05 — Two "Llámanos" tel: links in one shared paragraph: appointments line vs the 112 emergency line, disambiguated only by a CSS icon (es)

## Scenario
A Spanish-language primary health-centre contact page. A single call-to-action
paragraph offers two phone links, **both named "Llámanos"** ("Call us"), sitting
directly in the **same `<p>`**: the first dials `tel:+34954112233` (the centre's
**appointments** line — book/change/cancel a GP visit), the second dials `tel:112`
(the **pan-European emergency** number for life-threatening situations). They have an
identical accessible name and the **same** programmatically determined link context
(the same DOM node set), but they resolve to non-equivalent purposes. Sighted users
are told which is which only by a **CSS background-image icon** (a calendar vs an
emergency cross) and by two preceding explanatory paragraphs — neither of which is
exposed to assistive technology. A long-tail i18n variant of the duplicate-name trap.

## Attribute tuple
- **content-domain:** government / public-health civic site
- **UI-component / pattern:** two inline `tel:` call-to-action links inside one shared
  paragraph, each carrying a different CSS background-image purpose icon
- **host-language construct:** two `<a href="tel:…">` elements with plain text
  "Llámanos"; the per-link icon is a CSS `background-image` (presentation only)
- **locale / i18n:** es-ES (Spanish), `<html lang="es">`; the emergency number 112 is
  locale knowledge
- **failure-mechanism:** identical accessible name + **same** programmatically
  determined link context, `tel:` targets resolve to non-equivalent purposes (routine
  appointments vs emergency 112); the only per-link distinction is a CSS icon, which is
  not in the accessibility tree, not in the accessible name, and not in the link context

## Developer persona
A regional health-service web team templated the contact card from an internal pattern
library that uses one "Llámanos" call link everywhere, styling each instance with a
different background icon to "show what it's for". An editor dropped two instances into
the same call-to-action paragraph — one pointing at the appointments switchboard, one
at 112 — and trusted the icons and the surrounding Spanish text to carry the meaning.
Because the distinguishing icon is a CSS background-image (and the explanatory prose
sits in separate paragraphs), the two links are left with identical accessible names
"Llámanos" and an identical, shared context that names neither purpose.

## Element / selector carrying the issue
`.acciones > a.tel-link[href="tel:+34954112233"]` and
`.acciones > a.tel-link[href="tel:112"]` — two `<a>` with accessible name "Llámanos",
both children of the same `<p class="acciones">` (same context), resolving to two
different phone numbers with different purposes.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted reader of Spanish:** reads the two preceding paragraphs ("Para pedir … una
  cita … 954 11 22 33" / "urgencia vital … 112") and sees a calendar icon on the first
  "Llámanos" and a red emergency-cross icon on the second, so the appointments line is
  distinguishable from the emergency line.
- **Screen-reader user using a links list / rotor:** hears "Llámanos, enlace /
  Llámanos, enlace". Both `<a>` are children of the same `<p>`, so they share the
  **same** programmatically determined link context (the same DOM node set), and that
  shared context names neither purpose. The CSS background-image icon is presentation
  only — it is not in the accessibility tree and not part of either link's name or
  context — and the dialled `tel:` target is not counted as context (fd3a94 assumption:
  "reading the URL … is not considered part of the context"). The user cannot tell the
  routine line from 112.
- **Purpose judgment:** an appointments switchboard and the emergency 112 line are
  **non-equivalent** — opposite urgency, opposite consequence. Sighted users get the
  distinction from the icon and prose, so AT users are specifically disadvantaged; the
  "ambiguous to users in general" exception does not apply.

## Expected ACT-style outcome
**failed** (SC 2.4.4). This is ACT rule fd3a94's failing case: two links with an
identical accessible name and the **same** programmatically determined link context
resolve to non-equivalent resources, and the page conveys the difference to sighted
users only (CSS icon + separate prose), not via link text or programmatic context, so
AT users cannot determine each link's purpose.

## Why automated tools miss it
- Each link has a non-empty, identical accessible name "Llámanos" and a valid `tel:`
  href, so `link-name` / discernible-text checks PASS.
- Both `<a>` are children of the same `<p>`, so the links share the same DOM-node
  context; a context comparison sees no difference between them.
- The per-link distinction is a CSS `background-image`, which never enters the
  accessibility tree — a tool reading the AX tree sees two identical "Llámanos" links.
- A tool would need to (a) read Spanish prose to learn one link is for appointments and
  one for emergencies, and (b) know that `tel:112` is the emergency number whose purpose
  differs categorically from a switchboard — locale-specific semantic reasoning beyond
  any static check.

## Citation
> "It is also a best practice for links with different purposes and destinations to have different link text."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "This rule checks that links with identical accessible names in the same context resolve to the same or equivalent resources."
— ACT rule fd3a94, "Links with identical accessible names and same context serve equivalent purpose" (Description)

> "These two HTML a elements have the same accessible name and context. They are visually distinguishable thanks to the relationships conveyed through CSS, but go to different resources."
— ACT rule fd3a94 (Failed Example 3)
