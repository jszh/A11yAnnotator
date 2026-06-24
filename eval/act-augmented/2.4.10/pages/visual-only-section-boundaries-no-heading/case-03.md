# case-03 — Tabbed settings (the Understanding's settings example): panel titles as `<div>`, tabs are not headings

## Scenario
A webmail "Preferences" page (Meridian Mail) — a proper APG **tabs** widget with three panels:
**General**, **Signatures**, **Filters & Rules**. This is the Understanding's named example: "a
settings page that is divided into groups of related settings. Each section contains a heading
describing the class of settings." Each tab panel is clearly a distinct settings section, and
within the active panel the content is further grouped (DISPLAY, COMPOSING, etc.). But the panel's
section title is `<div class="panel-title">` and each sub-group title is `<div class="group-title">`
— none is a heading or `role="heading"`. The tab *buttons* are `role="tab"` (tabs are never
headings). The only heading is `<h1>Preferences</h1>`.

## Attribute tuple
- **Content domain:** webmail / SaaS application settings
- **UI component / pattern:** APG tabs (tablist / tab / tabpanel), keyboard-operable
- **Host-language construct:** `role="tab"` buttons + `<div>` panel/group titles
- **Locale / i18n:** en
- **Failure mechanism:** each visually-distinct tab panel is a settings section with no heading;
  tab labels and group labels are non-heading elements
- **Component pattern (facets.json):** "tabs"

## Developer persona
A front-end engineer implemented the tabs straight from the WAI-ARIA Authoring Practices Guide —
roles, `aria-selected`, `aria-controls`, roving `tabindex`, arrow-key navigation all correct. They
assumed "the tab is the section's heading," so they styled the panel title as a plain `<div>` to
avoid a "duplicate-looking heading." APG, however, does not say a tab substitutes for a section
heading; the panel still needs its own heading for 2.4.10.

## Element / selector carrying the issue
`div.panel-title` (×3, one per panel: "General preferences", "Signature settings", "Filters &
rules") and `div.group-title` (DISPLAY / COMPOSING / Default signature / Active rules). Verified in
Chromium: exactly **one** programmatic heading exists — `h1` "Preferences". No panel or group title
is a heading; the tabs have `role="tab"`, not heading.

## Exact accessibility mechanism
A screen-reader user activates the "Signatures" tab and lands in the panel, but heading navigation
finds nothing inside it — "Signature settings" and "Default signature" are silent to the `H`
shortcut. Tabs are deliberately not headings (they are operable controls in a `tablist`), so the
"jump between sections" affordance the SC provides is absent. Each panel is a group of related
settings — exactly the Understanding's settings example — yet carries no section heading. (The
escalation: the widget is otherwise flawless, so only the *missing heading semantics on the
panel/group titles* fails, and only a human reading the panel can see it.)

## Expected ACT-style outcome
**failed** — the settings page is divided into sections (tab panels and sub-groups) and none of
them has a heading. A correctly tagged tab widget can still fail 2.4.10.

## Why automated tools miss it
The tabs widget is ARIA-valid (correct roles, states, keyboard support) and `axe.run` reports no
violations; the page has an `<h1>` and labelled inputs; 047fe0 passes. No checker treats a tab
panel as a section requiring a heading — tabs are *intentionally* not headings, so there is nothing
"missing" for a rule to fire on. Recognizing that each panel is a related-settings section (per the
Understanding) and that "Signature settings" is a `<div>`, not a heading, is human judgment.

## Citation
> "A web application contains a settings page that is divided into groups of related settings.
> Each section contains a heading describing the class of settings."
— WCAG 2.2 Understanding, *Section Headings*, Examples (`wcag-understanding/section-headings.html`)
