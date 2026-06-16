# Evaluation notes — Our_Plans_Pricing_Cloudflare

## Collector / driver issues

- **Tab walk capped at 50 stops inside the nav mega-menu.** The global tabWalk exhausted its 50-stop budget entirely within the navigation area (header + nav lists), never reaching main page body. The `localTabWalk` driver compensated — it positioned near each sampled element and walked forward to reach it directly, so all 21 elements were still exercised.

- **el4 (search button) not reached by local tab walk** (`stopsToReach=-1`). The element is visible and `tabIndex=0` in the DOM at x=872, y=16, but the local walk did not encounter it. This is consistent with it potentially appearing before the walk start position in DOM order, or being in a separate focus group the walker skipped. Keyboard operability recorded as REPRODUCED (not found in either walk within cap).

- **Blank appearance shots for footer links (el14, el18).** Elements at y≈5971 and y≈6035 are far below the 900px initial viewport. Both unfocused and focused crops are blank white rectangles. DOM values were confirmed via `verify-finding.js --eval` to recover text and colours. Focus-visibility for these two is PARTIAL for the same reason (blank crop; computed outline suggests browser default ring).

- **el15 and el17 focusShot=null** (method=computed-only). These pricing table expand buttons were reached by `localTabWalk.reachedByTab=true` but the driver could not capture a focus diff (no focusShot). Likely the elements scroll out of the cropped viewport during the local walk. Focus-visibility recorded PARTIAL for both.

- **el20 axRole=image for a <div> container.** The collector reported axRole=image for what appears to be a pricing-table section container (`<div>` with heading 'Cloudflare Rules' and sub-buttons inside). This may be an AX tree inference artefact from a parent `role=img` wrapper. Recorded as-is (1.1.1 reproduced — unnamed image-roled element without aria-hidden).

- **drive.json axRole all null** — drive.json `axRole` fields are all null (the driver does not populate this field; it comes from collect.json). All role/name data cross-referenced from collect.json.

- **No forms on this page.** `drive.forms=[]`. Forms skill recorded N/A for all 21 elements.

- **Color-contrast plan-tier labels** — the axe `color-contrast` violation targets `.lh-4.f6.mb2` elements in plan cards. These are 32px orange text. Pixel-contrast sampling confirmed ratio 2.87:1 (below the 3:1 large-text threshold). These elements were not among the 21 sampled elements in collect.json, so the finding is recorded as a page-level issue in summary.issues only.

- **`list` / `listitem` axe violations** are extensive (15 + 61 nodes) and appear to originate from the nav mega-menu component inserting `<div>` children directly into `<ul>` elements. This is a structural markup error in the navigation component.
