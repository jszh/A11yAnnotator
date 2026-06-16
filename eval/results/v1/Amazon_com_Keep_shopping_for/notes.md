# Evaluation notes — Amazon_com_Keep_shopping_for

## Screenshot fidelity gaps

- **Deep-page elements (el3, el4, el5, el7, el8, el9, el14, el15, el16, el17, el20):** Appearance shots appear blank or show a different region of the page. These elements are located at y=2000–3100px; the driver crops at the viewport position which did not scroll to match. Focus visibility for these was resolved via `localTabWalk.outlineOrShadow` (real keyboard indicator flag) and `computedOutline` rather than pixel diff. All confirmed NOT REPRODUCED for focus-visibility via the tabWalk outlineOrShadow=true signal.

- **el2 (New to Amazon link):** `appearanceZeroSize=true` in drive.json (element inside a collapsed flyout). The element has visible dimensions in DOM (56x13px) but the driver flagged it zero-size likely because the flyout was not open. No appearance shot captured.

- **el6 (Kindle Books nav link):** `focusShot=null`, method=computed-only. The local tab walk reached the element (reachedByTab=true, outlineOrShadow=true) but the driver did not capture a focus shot. Resolved via computed box-shadow.

- **el21 (title element):** Zero-size by nature; no shot possible. Assessed as metadata-only.

## Driver/behavioral notes

- **el1 activate vsrAnnouncement:** All elements show `vsrAnnouncement: "image, Method Men Body Wash, Sea + Surf..."` — this is a persistent live-region announcement from a product recommendation carousel on the page, not from the activated element. It is not element-specific.

- **el13 (Edit div button):** `keyboard.respondedToKeyboard=false` — confirmed custom button with no keyboard event handler. The driver correctly detected this as a non-native button failing keyboard operability.

- **tabWalk cap at 50:** The global tab walk was capped at 50 stops. Many deep-page interactive elements (product carousels, filter buttons, footer links) were not reached by the global walk but were reached by the per-element local walks.

- **noOutlineStops=4:** Four tab stops had no outline/shadow in the global tab walk. These correspond to the search input (#4 in global walk), search submit button (#5), the search text input (#5), and "Go" button (#6) — all in the header search form. The search input uses a border/cursor visual which counts as a focus indicator despite no computed outline.

## Axe findings not covered by sampled elements

- **aria-allowed-attr:** Search input `#twotabsearchtextbox` has `aria-haspopup=grid` on a `role=searchbox` — grid is not a valid popup for searchbox per ARIA spec. Not a sampled element; noted.
- **aria-dialog-name:** `#nav-flyout-ewc` (dialog role, aria-modal=false) has no accessible name. Not a sampled element; WCAG 4.1.2 concern.
- **label-title-only:** `#searchDropdownBox` uses only `title` as its label source (aria-describedby points to a description, not a label). Axe `label-title-only` flagged.
- **target-size:** Multiple small buttons in nav (expand arrows, chevron buttons) are below 24px per axe `target-size` (WCAG 2.2 AA 2.5.8). Not covered by sampled elements.
- **label-content-name-mismatch:** Language link aria-label does not match visible 'EN' text (visible text must be part of accessible name per 2.5.3). Filter button aria-label 'Filter by Customer reviews' doesn't match visible '4 stars & Up' text.
- **heading-order:** H2→H4 skip confirmed by axe. Also H4→H1 occurs multiple times (filter labels use H1 but appear after H4).
- **meta-viewport-large:** `maximum-scale=2` limits user zoom to 200% — does not reach 400% zoom equivalence required for 1.4.4.

## Other observations

- Page has no `<main>` or `role=main` landmark — confirmed by verify-finding (hasMain=false). This means screen reader users cannot skip directly to main content.
- Two empty `role=status` divs exist in the page as live region infrastructure — correctly placed in DOM before content that would populate them, but were not populated during the static snapshot.
- Heading hierarchy is severely broken: multiple `H1` elements used for widget labels (Price, Customer reviews, Related items to consider, Best Sellers, Customers also bought) within a page that already has a primary H1 ("Keep shopping for...").
