# case-04 — Consent-modal footer button: focus ring clipped by the surface's rounded corners + `overflow:hidden` + `contain:paint` (FAIL)

## Scenario
Trailhead Outfitters' cookie/privacy consent dialog is built from a design-system
"Surface" component whose token bundles three things: `border-radius:18px`,
`overflow:hidden` (to keep a gradient header and content inside the rounded
corners), and `contain:paint` (a blanket perf optimization that makes every
overlay its own paint-containment box — which *also* clips descendants to the
border box). The dialog's primary action buttons ("Reject all" / "Save choices")
are a full-bleed footer flush to the surface's bottom corners. Each button has a
correct, high-contrast focus ring offset outward — but that ring is painted into
the 18px-rounded bottom-corner region that both `overflow:hidden` and
`contain:paint` remove, so the bottom rail and bottom corner of the ring are
clipped.

## Attribute tuple
- **Content domain:** e-commerce (outdoor gear) — cookie/consent interstitial
- **UI component / pattern:** `role="dialog"` `aria-modal` consent panel with full-bleed footer action buttons
- **Host-language construct:** `overflow:hidden` + `contain:paint` + `border-radius` on the dialog surface; full-bleed footer via negative margins
- **Locale / i18n:** en-US
- **Failure mechanism:** focus ring clipped by an ancestor's rounded `overflow:hidden` and `contain:paint` box at the corner

## Developer persona
A platform engineer rolled out `contain:paint` across all overlay surfaces after a
performance audit flagged repaint cost, and the design system already shipped
`overflow:hidden` + `border-radius` on the Surface token. Neither change was made
with focus rings in mind. QA clicked the consent buttons with a mouse and approved
it; nobody tabbed to the footer to notice that the primary buttons' rings are
nibbled away in the rounded corners by the two stacked clip mechanisms.

## Element / selector carrying the issue
`.actions .btn:focus-visible` (the full-bleed footer buttons), clipped by
`.surface { overflow: hidden; contain: paint; border-radius: 18px }`. Verified in
Chromium: with "Reject all" focused, the ring's bottom and left rails fall outside
the surface's clip box (bottom/left rails clipped; the rounded bottom-left corner
cuts the ring).

## Exact accessibility mechanism
`Tab` reaches a footer button; the browser paints the author's 3px ring with a 2px
outward offset. The button is full-bleed to the surface's bottom corner, so the
ring's bottom rail and corner are painted in the region the surface's
`overflow:hidden` + `contain:paint` + 18px `border-radius` exclude, and are clipped
away. A sighted keyboard user sees only the top/inner fragments of the ring at the
rounded corner — a weak, ambiguous cue — rather than a complete, perceivable
focus indicator on the dialog's primary action.

## Expected ACT-style outcome
**failed** (SC 2.4.7 — the focus indicator is drawn but clipped by the surface's
rounded `overflow:hidden`/`contain:paint` box, so it is not fully visible to the
user).

## Why automated tools miss it
Every control has a real, high-contrast `:focus-visible` ring (axe/WAVE/Lighthouse
see conformant CSS), and tabbing changes pixels inside the dialog so oj04fd passes.
But the surface uses `overflow:hidden` AND `contain:paint` on an 18px-rounded box;
the primary footer buttons are flush to the bottom corners, so their outward-offset
ring is painted into the rounded-corner region the clip box removes — and the
rounded corners nibble the ring even on interior edges. The change is real;
whether the indicator is actually perceivable past two stacked clipping containers
and the corner radius is a layout/visual judgment automated tools do not make.
(`contain:paint` in particular is invisible to a focus-style linter — it is a
performance property, not a focus property.)

## Citation
**Reference:** WCAG Technique F78 — Failure due to styling that renders the visual focus indicator non-visible (`wcag-techniques/failures/F78.html`)
> "This describes a failure condition that occurs when the user agent's default visual indication of keyboard focus is turned off or rendered non-visible by other styling on the page without providing an author-supplied visual focus indicator."

**Reference:** WCAG 2.2 Understanding — Focus Visible (`wcag-understanding/focus-visible.html`)
> "The purpose of this success criterion is to help a person know which element has the keyboard focus."
