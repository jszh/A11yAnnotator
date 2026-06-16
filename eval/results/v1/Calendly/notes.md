# Calendly — evaluation notes

## Collector / driver issues
- el1 (Talk to sales link): `appearanceOffScreen=true` in driver but `box.x=1161` is within 1280px viewport width; header may have been scrolled out by the time the driver ran. No appearance shot taken.
- el4 (Resources nav link): `appearanceShot` exists (`el4.png`) but the crop is blank/near-white — the nav bar position in the snapshot may have put the element outside the captured region. `focusIndicator.method=computed-only` despite `reachedByTab=true` — the diffing step could not produce a focused screenshot (element off-screen at diff time).
- el12 (PayPal integration): `appearanceShot` (`el12.png`) shows a partial edge crop — only the right margin of the card is visible, not the icon itself.
- el18 (Product overview footer link) / el19 (Meeting routing): Appearance shots show page body text instead of the footer element — the viewport did not scroll to the element before cropping.
- el20 (YouTube icon SVG): Appearance shot is nearly blank — 24×24px SVG crops to near-white in default background.
- `contrastSolid=1.05` for el21 (Read now button) is a known false alarm: the static `effBg` walks up to the page background (`rgb(248,249,251)`) but the button actually renders over a dark navy card overlay. Pixel-contrast probe confirmed 11.98:1.
- `tabWalk` is capped at 50 stops — the page has far more than 50 focusable elements. Elements deeper in the page (pricing plan buttons, CTA links, cookie consent) not captured in global walk but reached via local tab walks.
- el7 (Goto Previous Page button): `localTabWalk.reachedByTab=false` with `targetIndexInFocusables=62` — beyond local walk window. The button is marked disabled in SR so keyboard reachability is less critical.
- `srWalk.targetSpeech` for el1 returns "main" (the document landmark) rather than the link — the SR cursor landed on the containing div, not the link target. Minor driver positioning issue.

## Snapshot fidelity notes
- Page has a cookie consent overlay (`div[role=region][label="Privacy Preference Center"]`) visible in headings tree. Driver navigated past it. Consent dialog may have been active during collection — its headings appear in `structure.headings`.
- The Resources nav link (`aria-expanded="true"`) was in an expanded state at collection time — a dropdown may have been open, affecting heading tree and landmark structure.
- Integration icon links (section 4) have `outlineOrShadow=true` in global tabWalk (stops #25-42) confirming box-shadow focus indicator present — but element is off-screen so no visual diff shot available.
- No `forms[]` in drive.json (count=0) — no form elements captured. The page's signup buttons navigate to external flows rather than presenting inline forms.

## Ambiguities
- The language selector `div[tabindex=0]` has `axRole=generic`. It is the first stop in the global tabWalk and appears to function as a button (opens a language picker). The lack of role and name makes this a clear 4.1.2 violation but the exact downstream behavior (dropdown vs. modal vs. navigation) could not be confirmed from the snapshot.
- Nav menu links (`aria-label="Show"`) pattern: all four main nav items share the same `aria-label="Show"` and `aria-labelledby` pointing to themselves, overriding their visible text. This appears to be a React navigation pattern where the visible text is rendered as a separate text node, not as the link's accessible name. All four affected: Product, Solutions, Resources, Pricing.
- The stat-card links (`tabindex="-1"`) in the testimonials carousel are correctly hidden from the tab sequence as non-active slides. The driver reached them via local tab walk because it explicitly positions near the target — not a real-world keyboard navigation gap.
