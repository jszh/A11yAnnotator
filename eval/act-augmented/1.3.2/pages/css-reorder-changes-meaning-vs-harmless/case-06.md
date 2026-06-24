# case-06 — Over-flag trap (PASS): flex `order` renders the Visit sidebar left of the essay (DOM-second), meaning preserved (G57 museum case)

## Scenario
A museum exhibition page, "Currents." On wide screens the practical **Visit** box (hours, admission, location) renders in the **left** rail and the exhibition essay renders on the right. In the DOM the **essay comes first** and the **Visit aside comes second**; CSS flexbox `order` swaps them visually (`article.essay { order:2 }`, `aside.visit { order:1 }`). A mechanical "visual order ≠ DOM order" detector fires — the DOM-second aside renders to the left of the DOM-first essay. But this is the SC's G57 / Example-2 non-failure: the essay and the Visit box are independent blocks, and **within** each block the source order is already correct (hours read in day order; essay paragraphs read intro → detail → closing). Linearizing the page preserves meaning either way. Included as a deliberate over-flag trap.

## Attribute tuple
- **content-domain:** arts / museum exhibition page
- **UI-component / pattern:** content-first article + independent "Visit" info sidebar
- **host-language construct:** `display:flex` with `order:2` on `<article>` and `order:1` on `<aside>` (visual swap, content-first DOM)
- **locale / i18n:** en-GB (£, day-name hours)
- **failure-mechanism:** none — harmless flex reorder of *independent, internally-ordered* blocks (PASS)

## Developer persona
The museum's web officer rebuilt the page mobile-first: the HTML is authored content-first (essay, then the Visit box) so the small-screen stack reads essay → details with no source change. On wide screens they used flex `order` to pull the Visit box into the left rail for scannability. Both the source order and the visual order are deliberate and each, on its own, reads correctly.

## Element / selector carrying the issue
There is **no** failing element. The reorder lives on `article.essay { order:2 }` and `aside.visit { order:1 }`. The correct verdict is that the reorder is harmless.

## Exact accessibility mechanism (what AT experiences, and why it PASSES)
- **Linearized / screen-reader order:** essay (heading, three paragraphs in narrative order) → Visit box (opening hours in day order, admission, location). The essay is a complete, self-contained meaningful sequence; the Visit box is a separate self-contained sequence. Neither depends on the other's position, and neither is internally scrambled.
- **Per the SC / G57:** "The links in the navigation bar form a meaningful sequence. The heading, image, and text of the description also form a meaningful sequence. CSS is used to position the elements on the page." Repositioning independent blocks whose internal order is intact does not affect meaning.
- Verified with Puppeteer: the DOM-second `aside.visit` renders at `left=64px` while the DOM-first `article.essay` renders at `left=360px` — so the visual order **is** swapped relative to source (a diff tool would flag it), yet linearizing preserves meaning → **PASS**.

## Expected ACT-style outcome
**passed** (SC 1.3.2 — content is CSS-reordered via flex `order`, but the reordered blocks are independent and internally well-ordered, so the programmatically-determined reading order still conveys the correct meaning).

## Why automated tools miss it
A naive visual-vs-DOM diff tool raises a **false positive** here: it detects that flex `order` swapped the visual position of the aside and essay, but it cannot read the linearized prose to confirm meaning survives. Telling this harmless reorder apart from a genuine F1 failure (case-01, -02, -04, -05) requires reading the content and judging block independence and internal order — a semantic decision no automated tool can make, which is exactly why an "any reorder = fail" rule is wrong.

## Citation
> "Some techniques permit the content to be rendered visually in a meaningful sequence even if this is different from the order in which the content is encoded in the underlying source file."
— wcag-techniques/general/G57.html (Description)

> "The links in the navigation bar form a meaningful sequence. The heading, image, and text of the description also form a meaningful sequence. CSS is used to position the elements on the page."
— wcag-techniques/general/G57.html (Examples)
