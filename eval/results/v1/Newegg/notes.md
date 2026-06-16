# Newegg evaluation notes

## Driver / capture issues

- **el5 (search input) — notFound in driver.** The xpath in collect is `/div[3]/form/…` but the tabWalk stop for the same search input uses `/div[4]/form/…`. The element was clearly reached by the global tab walk (it caused the trap), but the driver couldn't match the collect xpath to produce a localTabWalk or focusShot. Skills assessed from tabWalk evidence and computed styles.

- **el11 (SEO text link 'electronics') — notFound in driver.** Element at y=6312 in the SEO footer paragraph. xpath mismatch between collect and drive. Likely due to dynamic div numbering. Keyboard/focus skills marked PARTIAL.

- **Focus shot crop misfire for elements below fold.** el6 (y=6683), el7 (y=6614), el18 (y=7379), el20 (y=7379): all focus shots show the viewport top (header/nav area) rather than the element. The driver scrolls to the element but screenshots are captured at viewport coordinates without scrolling compensation. Assessed using computed outline/shadow values as fallback. This affects 4 elements; verdicts are based on computedOutline + computedBoxShadow (authoritative for 2.4.7 determination).

- **el7 focusIndicator says indicatorPresent=true but visibleDiffPct=0.** The box-shadow `rgb(25,70,184) 0px 0px 0px 1px` is present in computed styles, so the driver sets indicatorPresent=true. The diffPct=0 is because the focus shot crop shows the wrong area (top of viewport). Verdict: NOT REPRODUCED for 2.4.7 (the 1px blue ring is a real indicator even if the shot can't show it).

- **el9 (NVIDIA brand link) srWalk and activate show `gone:true`.** Element appears to be inside a Swiper carousel that unmounts or hides the element after tab positioning. The driver lost the element mid-walk. Keyboard-operability marked REPRODUCED based on reachedByTab=false.

- **el13 shot (15×14px) shows only a tiny solid colour block.** The element is a sub-pixel badge text span. Shot confirms the element is real but the crop is too small to visually verify contrast. Used pixel-contrast tool output as primary evidence.

- **Keyboard trap causes global tab walk to stop at 5 stops** (count=5), preventing the global walk from reaching any elements after the search input. All per-element local walks use localTabWalk (which starts near each target independently) — those results are unaffected by the trap.

- **Multiple screenshot crops misaligned throughout.** Approximately 6 of 21 elements have shots showing an incorrect viewport area. This is a known limitation when elements are far below the initial viewport fold. Noted for each affected element in results.json.

## Axe findings noted

- `aria-prohibited-attr` fires on multiple `<i>` elements with `aria-label`. These decorative icon elements use `aria-label` which is prohibited on non-interactive, non-landmark elements. The most impactful case is el6's link name gaining the word "more" from `<i aria-label="more">`.
- `aria-hidden-focus`: `.compare-items-toolbar` has `aria-hidden="true"` but contains 4 focusable children. Not sampled as a dedicated element but confirmed with verify-finding.js.
- `image-redundant-alt` (best-practice): 26 product images have alt text identical to adjacent visible text in combo widgets. Only el12 sampled.
- `label-title-only`: search input (el5).
- `link-name`: 9 social icon links including el19 (LinkedIn). All use the same pattern: icon-font `<a>` with `display:none` span child.
- `page-has-heading-one` (best-practice): no H1 on page (the two `<p role=heading aria-level=1>` are both empty).
- `landmark-one-main`: no `<main>` element.
- `target-size`: flagged for rating links on product cards (not sampled).
