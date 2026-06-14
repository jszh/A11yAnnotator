# Nordstrom evaluation notes

## Driver / capture issues

- `scriptsDisabled: true` confirmed — noscript page. All activation/keyboard-response/announcement checks are PARTIAL due to script hydration not occurring. This is expected per the noscript flag passed to the agent.

- **tabWalk capped at 50 stops** (`maxTab: 50`). Page has many more interactive elements (62 headings, dozens of product links, 12 nav buttons). The 50-stop cap means only the first ~50 focusable elements in DOM order were walked. Elements deep in the page (product shelf items, footer links) were reached via `localTabWalk` (per-element positioning), not the global walk.

- **36 of 50 tabWalk stops show `outlineOrShadow: false`** — a very high proportion (72%) of focusable elements in the first 50 have no visible focus indicator. The 12 nav buttons all show no outline.

- **el1 (Skip navigation)**: `localTabWalk.reachedByTab: false` despite being first in DOM. The local walk positions 5 stops before the target but this is element index 0, so there are no prior stops — driver couldn't walk to it. Global tabWalk stop[0] confirms it IS first and reachable.

- **Shots el8.png through el16.png** (footer links, product card items, carousel buttons): all appear as near-blank cream/white strips. Elements are at y>757px in the page layout but the screenshots crop a small bounding box — for elements off the visible portion of the screen when the screenshot is captured the image shows the background texture. This is not a fidelity error; the element shots correctly reflect the element's bounding box area.

- **el10 (Top button) and el19 (Splendid link)**: `focusIndicator.indicatorPresent: true` with `visibleDiffPct: 0`. This is a driver contradiction — the indicator flag may be set based on `computedOutline: auto` rather than a true pixel diff. Both focus shots look identical to unfocused. Treated as PARTIAL for el10 and el19 focus-visibility.

- **el6 (Clear Search Text) appearance shot**: `el6.png` shows a magnifying glass icon. This is the search submit icon adjacent to the input, not the clear button itself (which is `tabindex="-1"` and positioned differently). The shot captures the `effBg` area.

- **Search input `aria-labelledby` references non-existent ID**: `aria-labelledby="keyword-search-input-label"` but `document.getElementById('keyword-search-input-label')` returns null. The input still has a proper `<label for="keyword-search-input">Search</label>` which provides the name. This is a structural defect but not a name-absence failure.

- **axe label-content-name-mismatch**: 21 nodes flagged. The sampled Splendid link (visible 'Popular' vs aria-label 'Splendid Louisa Short Sleeve T-Shirt') was evaluated. The other 20 nodes are similar product shelf links where aria-label contains the product name but visible text is a badge/status label — same pattern, widespread across shelves. Only one representative node evaluated (el18/Splendid); the full set represents a systematic WCAG 2.5.3 issue.

- **Nordstrom Logo link** (`/html/body/.../a[1]` — Nordstrom logo): appeared in `localTabWalk` stops but was not a sampled element in collect.json. Role/name confirmed as `link, Nordstrom Logo` via srWalk.

- **iframe in tabWalk**: Two stops at `/html/body/div[1]/div[3]/main[1]/div[1]/div[1]/section[1]/div[1]/div[1]/div[1]/iframe[1]` appear duplicated with speech 'button, Services, 1 control'. This appears to be a driver quirk when the tab walk enters an embedded iframe context. Not a content finding.

## Snapshot fidelity

- Page is a static HTML snapshot (noscript). All JS-driven interactivity (search autocomplete, nav dropdowns, carousel sliding, sign-up form submission, add-to-bag) is absent.
- The `<noscript>` element in the body contains a Facebook pixel `<img>` — visible in srWalk stops as raw HTML text. No functional impact.
- Two `[aria-live=polite][role=status]` regions exist in the static DOM — one non-empty, one empty. These would support announcements if JS ran.
