# BBC_Home evaluation notes

## Collector / driver issues

- **Image load failures (capture artifact):** 53 of 128 images fail to load in the offline saved
  capture (BBC Home_files/ .webp files not served by local server). The BBC React image component
  renders a visible text fallback "image unavailable" when an image fails to load. This causes:
  - el12 (`role=link`) accessible name starts with "image unavailable" — not the page's authored markup
  - el14 (`role=image`) accessible name = "image unavailable" — AX tree reads the fallback text
  - These appear as PARTIAL in results (capture artifact, not authoring defects).

- **contrastSolid=1.16 false alarm (el12 collector):** The collector read the `<a>` container's
  own CSS color (`rgb(0,0,0)`) against effBg (`rgb(20,22,24)`) — this compares the container's
  inherited color to its dark card background. The actual text children inside the link use
  `rgb(230,232,234)` (near-white), yielding 14.77:1. The axe color-contrast violation on 53
  nodes is similarly misleading — these headlines have transparent backgrounds (no ancestor
  with opaque bg) so axe cannot compute the ratio; manual pixel sampling confirms 14.3:1 for
  the main card headlines.

- **visibleDiffPct=0 with indicatorPresent=True (8 elements):** For links/buttons where the
  element bbox is tightly cropped to the text/image interior, the 1px auto browser outline
  ring appears on the OUTSIDE of the bbox. The pixel diff tool crops to the exact element
  bounding box, so the ring is outside the cropped area. This produces 0% diff even though
  the ring is genuinely present. Confirmed by `computedOutline='auto 1px rgb(0,95,204)'`
  and global tabWalk `outlineOrShadow=True` for most of these elements.

- **el1 localTabWalk reachedByTab=False:** Skip link is tabWalk stop 0 (first stop). The
  localTabWalk driver starts 5 stops BEFORE the target element; since this is stop 0, there
  is no pre-position to start from. This is a driver limitation, not a page defect.
  GlobalTabWalk confirms the skip link IS stop 0.

- **noscriptFlagged=true / scriptsDisabled=true:** All `dynamic-announcement` and `hover`
  sub-verdicts are PARTIAL. The menu open/close and social follow buttons cannot be activated.
  Tab walk, focus indicators, and SR walk worked correctly.

- **srWalk targetSpeech='end of document' (el1, el2, el3):** Some SR walk targets landed on
  "end of document" rather than the element itself — appears to be a driver artifact when the
  SR cursor initialises at document end in the noscript page. The elements are still confirmed
  reachable via tabWalk.

## Snapshot fidelity

- The noscript flag correctly suppressed JS. The BBC homepage in noscript mode still shows
  full HTML content (154 headings, 7 landmarks, 128 images). Navigation links, headings, and
  footer are all present and correctly structured in the static HTML.

## Axe flag review

- **color-contrast (53 nodes):** All flagged nodes have transparent backgrounds (`rgba(0,0,0,0)`)
  throughout their ancestor chain — axe marks these as incomplete (cannot compute). The actual
  rendered contrast is fine (14.3:1 for headlines). Not a real failure.
- **heading-order (1 node):** REAL ISSUE — h2 → h4 skip confirmed (1.3.1 REPRODUCED).
- **label-content-name-mismatch (19 nodes):** The podcast links have `aria-label="Show - Episode"`
  where visible text is "Show\nEpisode" (show name + newline + episode name). Same content,
  different separator (dash vs newline). Not a genuine 2.5.3 failure — the accessible name
  contains all visible label text. Axe appears to flag the formatting difference.
- **landmark-unique (1 node):** Two unlabeled `<nav>` landmarks — real structural issue (1.3.1).
- **page-has-heading-one (1 node):** No h1 — axe best-practice only, not a WCAG SC.
- **region (1 node):** The skip-link container div is outside all landmark regions — minor
  structural issue, not recorded as a reproduced finding for individual elements.
