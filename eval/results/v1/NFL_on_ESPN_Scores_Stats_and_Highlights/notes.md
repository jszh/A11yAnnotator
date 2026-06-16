# Evaluation Notes — NFL on ESPN - Scores, Stats and Highlights

## Driver / Collector Issues

- **Navigation timeout**: drive.json `problems` includes `"goto: Navigation timeout of 45000 ms exceeded"`. The page loaded (all 22 elements processed, tabWalk completed) but the initial goto timed out — this is common on this large multi-resource page. Data appears complete; no elements dropped.

- **div[6] alternate tree**: Elements [16] and [17] are in `/html/body/div[6]/...` — an alternate/duplicate page tree that the collector could not populate (role=null, box=null, all static fields null). The driver also could not reach them (srWalk=null, no localTabWalk). These are likely a second render of the page (ESPN sometimes renders two versions). All skills marked PARTIAL for those elements.

- **Blank/light appearance shots**: Several shots (el1.png, el7.png, el8.png, el12.png) appear nearly blank. The saved page has many image resources with external URLs that did not load (lazy-loaded images not captured). Scores carousel area (el1) is especially affected. This does not affect the accessibility verdict because axe/AX-tree data is still available.

- **Shot crop misalignment**: el14.png (Daniel Jones article link) shows the Barnwell article image and headline instead — the crop captured the visually adjacent element above. The link name and AX data are still reliable.

- **el20.png crop**: Shows article text ('2013', 'megadeals meet', 'Bucs s') rather than the footer 'Hockey' link — crop is from an overlapping element at the same y-coordinate. Does not affect verdict.

- **tabWalk capped at 50**: `maxTab=50`. The page has far more than 50 focusable elements. Only the top 50 Tab stops were exercised globally. Many deep-page elements (articles, footer links) relied on localTabWalk instead — which uses up to 20 local steps and was successful for elements sampled.

- **42/50 tabWalk stops have no outline/shadow**: This is a systemic finding — `noOutlineStops=42`. The entire primary nav bar (stops 10–21), secondary nav (22–33), and content links (34–49 mostly) have no visible focus indicator. Only skip-link buttons (stops 0–1) and a few CTA buttons show outline/shadow.

- **Super Bowl button indicatorPresent=true but diffPct=0**: Driver contradiction — the button has a computed `outline: none 3px rgb(72,73,74)` which is technically a `3px` outline, but the outline color (dark gray) on the gray scoreboard background renders invisibly. The driver flagged `indicatorPresent=true` based on the outline property presence, but pixel diff confirms no change. Overridden to REPRODUCED in results.

- **forms[]: empty**: No `<form>` elements were found on the page (drive.json `forms=[]`). The search input in div[6] is inaccessible to the driver. The page has no login/submit forms in the main (div[5]) tree.

- **meta-viewport user-scalable=no**: `initial-scale=1.0, maximum-scale=1.0, user-scalable=no` — prevents user zoom. This is a critical axe finding (meta-viewport). Noted in page-level issues but maps to 1.4.4 (Resize Text) / 1.4.10 interaction rather than 1.4.12 — recorded under reflow-and-pointer-affordances at page level.

- **49 color-contrast axe violations**: All from `contentMeta__timestamp` (article timestamps) and `contentMeta__author` (author bylines) at rgb(165,166,167) on white = 2.44:1. Also scoreboard elements. These are systemic — not just a few instances. Recorded as page-level finding rather than duplicating across all 22 elements.

- **aria-allowed-role on #global-scoreboard**: `<section role="region">` without an accessible name — `role=region` on `<section>` requires an accessible name (aria-label/aria-labelledby) to be a landmark; without it, the role is not valid per ARIA spec, hence the axe `aria-allowed-role` violation.

- **nested-interactive**: `.miniCardCarousel__slideWrapper` has `role="option"` and `tabindex=0` but contains 4 focusable `<a>` links inside — interactive controls nested inside an interactive container. This prevents proper keyboard operation of the listbox pattern.
