# case-05 — SVG `<title>` (UA-rendered) plus an author overlay showing DIFFERENT content: separate which content the SC governs; the overlay FAILS

## Scenario
An energy-usage dashboard ("Helios Energy") shows a monthly-kWh bar chart. Each bar is an SVG `<rect>` with an SVG `<title>` child — the browser renders that as a native tooltip (e.g. "February: 612 kWh"), which is **user-agent-controlled** and out of scope for 1.4.13. The author **also** shows a richer floating `.vtip` overlay on hover with a **different** string ("Feb · 612 kWh · $84.10 · 18% below your 12-mo avg"). The overlay is `pointer-events:none`, repositions under the cursor via `mousemove`, and has no Escape handler. So each bar has **two on-hover content sources with two owners and two different texts**: the reviewer must separate which content the SC governs (only the author overlay) and judge that overlay's behavior (it fails hoverable + dismissible).

## Attribute tuple
- **content-domain:** energy / utility usage dashboard
- **UI-component / pattern:** SVG data-viz bar chart with on-hover detail (mixed SVG `<title>` + author overlay)
- **host-language construct:** SVG `<title>` element (UA tooltip) + JS-built absolutely-positioned `.vtip` div
- **locale / i18n:** en-US (currency/number formatting in the overlay)
- **failure-mechanism:** author overlay not hoverable / not dismissible (F95 + no Esc) and repositions under the pointer; coexists with a UA-controlled SVG `<title>` that is out of scope — and the two carry divergent content

## Developer persona
A data-viz developer added SVG `<title>` children to each bar for a "free" accessible name and quick browser tooltip, then layered a prettier custom overlay (with cost + trend) for sighted mouse users. The two strings drifted apart as the overlay gained fields. They followed a charting-library pattern where the floating tooltip is `pointer-events:none` and tracks the cursor — never realizing that makes the rich content impossible to hover into, impossible to dismiss with Escape, and that the SVG `<title>` (out of scope) and the overlay (in scope) are governed differently.

## Element / selector carrying the issue
`.vtip` (the author overlay appended to `#chart`), driven by `mousemove`/`mouseleave` on each `rect.bar`. The SVG `<rect> > <title>` is **not** the issue — it is the out-of-scope, UA-controlled control.

## Exact accessibility mechanism (what AT experiences, why the split verdict)
- **SVG `<title>`** (e.g. "February: 612 kWh"): the browser renders this as a native tooltip. UA-controlled appearance → 1.4.13 does **not** apply to it → out of scope.
- **Author `.vtip` overlay** (e.g. "Feb · 612 kWh · $84.10 · 18% below your 12-mo avg"): shown on `mousemove` over the bar, `pointer-events:none`, repositioned to follow the cursor, hidden on `mouseleave`. Moving the pointer toward the overlay to read it (low-vision/magnification) either chases it or leaves the bar → it disappears (**not hoverable**, F95). No Escape/dismiss path (**not dismissible**). Author-controlled appearance → 1.4.13 **applies** → **FAILS**.
- The contents **differ** (the SVG title is a short summary; the overlay adds cost and trend), so the reviewer must reason that the SC governs only the author overlay's behavior, while the genuinely informative extra content lives in the out-of-scope-styled overlay.

Verified with Puppeteer: each `rect.bar` has an SVG `<title>` ("February: 612 kWh") that differs from its `data-rich` ("Feb · 612 kWh · $84.10 · 18% below your 12-mo avg"); on a real mouse hover the `.vtip` overlay shows the `data-rich` text at `opacity: 1` and computes `pointer-events: none`.

## Expected ACT-style outcome
**failed** (SC 1.4.13 — the author `.vtip` overlay is author-controlled hover content that is not hoverable and not dismissible; the SVG `<title>` tooltip is user-agent-controlled and out of scope, so the SC's failure attaches to the overlay).

## Why automated tools miss it
Each bar has two hover-content sources with two owners. A scanner sees a valid SVG `<title>` (and may even credit it as an accessible name) and a JS-built div, and cannot reason that **only** the author overlay is governed by 1.4.13, that the SVG `<title>` is out of scope (UA-controlled), or that the two carry different text. Nor can it test that the overlay — `pointer-events:none`, cursor-following, no Esc — fails hoverable + dismissible. Separating which content the SC governs and judging the overlay's interaction behavior are human visual + semantic tasks beyond static analysis.

## Citation
> "This criterion does not attempt to solve such issues when the appearance of the additional content is completely controlled by the user agent. A prominent example is the common behavior of browsers to display the `title` attribute in HTML as a small tooltip."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Additional Notes)

> "Hovering over a chart with data points, pop-ups open to show details of the respective data point, somewhat offset from the data point itself. When moving the pointer towards the pop-up so it can be fully read with magnification, the pointer travels over other data points that cause the appearance of other pop-ups that replace the particular pop-up the user wanted to see."
— wcag-techniques/failures/F95.html (Examples)

> "Users with low vision who view content under magnification will be better able to view content on hover or focus without reducing their desired magnification."
— wcag-understanding/content-on-hover-or-focus.html (Benefits)
