# Findings Reproducibility Audit

Can each issue in `findings.js` be reproduced in the saved snapshot dataset
(`assets/saved/`)? Verified with the annotation tool's own harness — Puppeteer +
axe-core, the `/ax-node` (AX tree + screen-reader speech) and `/sr-order`
endpoints, WCAG contrast math, narrow-viewport reflow tests, and screenshot +
vision — fanned out across 9 parallel agents, one per category. Method:
`scripts/verify-finding.js` (read-only, loads the same snapshot the server serves).

## Verdict scale
- **REPRODUCED** — snapshot DOM / AX tree / computed style / visual evidence directly confirms the issue.
- **PARTIAL** — the static precondition is present, but the *dynamic* behavior claimed (focus trap, hover tooltip, Escape-dismiss, click-to-change state, live announcement) can't be exercised on a static snapshot. What is confirmable is confirmed.
- **NOT REPRODUCED** — evidence contradicts the finding as written.
- **NOT FOUND** — element/page not present in the snapshot (CSR shell never hydrated, captured error page, or lazy content never loaded).

## Tally (36 findings)

| | REPRODUCED | PARTIAL | NOT REPRODUCED | NOT FOUND |
|---|---|---|---|---|
| **Total** | **18** | **13** | **2** | **3** |

> **Correction (noscript serving):** cat_2[1] Spirit hotel filter chips was
> first marked NOT FOUND because the verification harness loaded the page **with
> its own scripts running**, which blanks the SSR DOM at this origin. The
> annotator serves SPA snapshots in **noscript mode** (`?offline=1&noscript=1`),
> where the page renders fully (67 hotel cards, 137 filter chips). Re-verified in
> noscript → **REPRODUCED**. See "Snapshot serving mode" below.

Every finding whose claim is a *static DOM/style fact* that the snapshot actually
contains was reproduced. The 13 PARTIALs are all genuinely dynamic behaviors
(traps, hover, reflow-dismiss, state-on-click) where the static structure was
confirmed but the runtime behavior is out of scope for a frozen snapshot. The 2
NOT REPRODUCED are findings that are **factually wrong as written**. The 4 NOT
FOUND are snapshot-capture gaps, not finding errors.

---

## cat_1 — Missing or Incorrect Accessible Names (6 REPRODUCED, 1 NOT REPRODUCED, 1 NOT FOUND)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Header search input `aria-labelledby=":r1h:"` | — | **NOT FOUND** | No saved page has a search input whose `aria-labelledby` targets `:r1h:`. The id exists in H&M (color-swatch `<ul>`) and Zillow (a button) but never as a search-input label target. |
| 2 | ESPN news-card image | `NFL on ESPN…htm` | **REPRODUCED** | All 16 `img.media-wrapper_image` have no `alt`; axe `image-alt` = 35 critical nodes. (Headline differs by capture date; structural failure identical.) |
| 3 | Klaviyo "Learn more" link | `Klaviyo…htm` | **REPRODUCED** | 3 identical `<a aria-label="Learn more" role="link">Learn more</a>` in the AI carousel; accessible name = "Learn more", zero context. |
| 4 | Blue Apron+ "Learn more" button | `Blue Apron…htm` | **REPRODUCED** | `<button>Learn more</button>`, no aria-label/labelledby, in "Introducing Blue Apron+" section. |
| 5 | "Read now" customer-story buttons | `Calendly.htm` | **REPRODUCED** | 5× `<button data-testid="animated-stat-card-link"><span>Read now</span></button>` nested in `<a tabindex="-1" aria-label="160% increase…">` — focusable button exposes only "Read now". Invalid `<button>`-in-`<a>` confirmed. |
| 6 | Microsoft Complete "Learn more" | `Microsoft Store…htm` | **NOT REPRODUCED** | The link's `aria-label` is **"Learn about Microsoft Complete"** — descriptive. Every "Learn more" link carries a distinct descriptive label. The ambiguous `aria-label="Learn more"` the finding describes does not exist here. |
| 7 | LinkedIn feed image placeholder alt | `(11) Feed _ LinkedIn.htm` | **REPRODUCED** | 3 images with `alt="No alternative text description for this image"`. |
| 8 | Reddit r/teenagers auto-alt | `r_teenagers.htm` | **REPRODUCED** | 57 images with `alt="r/teenagers - <title>"`; passes axe but is non-descriptive (F30). |

## cat_2 — Structural & Semantic Grouping (2 REPRODUCED, 1 PARTIAL, 1 NOT FOUND)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Hotel filter chips | `Chicago Hotels…Spirit Airlines.htm` | **REPRODUCED** (noscript) | With scripts the SSR DOM blanks (`#root` 0 children) — a harness artifact. In the annotator's **noscript mode** the page renders 67 hotel cards + 137 filter chips; the filter container is a `<div>` (role=null) of flat `<div>` children, **0** `ul/ol/[role=list]/[role=group]/fieldset` (1.3.1). |
| 2 | Best-prices destination grid | `Vueling…htm` | **REPRODUCED** | 4 cards as flat `div.col-xs-12 > vy-card-offer` inside `.vy-best-prices` (role=none); zero `ul/ol/[role=list]/[role=group]`. |
| 3 | Login/Sign-Up modal reading order | `Quizlet…htm` | **PARTIAL** | `ReactModalPortal` present but empty (modal opens on click). No `role=dialog`/`aria-modal`; background `.site` not `aria-hidden`. Precondition present; live reading order needs a click. |
| 4 | Reacher global nav (F1) | `Reacher.htm` | **REPRODUCED** | (a) nav container is DOM child #2, after main content, yet visually pinned top. (b) "Log In" at DOM index 19 (before Logo/Blog/Contact) but visually rightmost (x=842 vs Logo 616) — DOM order ≠ visual order, confirmed via `getBoundingClientRect()`. |

## cat_3 — Heading & Page Structure (2 REPRODUCED)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Generic page title | `Amazon.com_ Keep shopping for.html` | **REPRODUCED** | `document.title` = "Amazon.com: Keep shopping for" — ends mid-phrase, category absent. axe can't catch (title exists; it's a 2.4.2 quality issue). |
| 2 | Empty/missing headings | `Home - Google Drive.htm` | **REPRODUCED** | h2 set = `["", "Create an audio overview", "Transcript"]` (1 empty); 0 `<h1>`; a `<span role="heading" aria-level="1">` with empty text; "My Drive" is not a heading. axe `empty-heading` missed it. |

## cat_4 — Keyboard-Inaccessible Interaction (1 REPRODUCED, 1 PARTIAL, 1 NOT FOUND)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Stock-price trend chart | `Apple Inc. (AAPL)…Yahoo Finance.html` | **PARTIAL** | 435 SVG `<path>`, 0 with non-negative tabindex, 0 interactive roles — no focusable data points. Range buttons are proper `role=tab`. Hover-tooltip absence can't be exercised statically. |
| 2 | Map "Draw" region tool | `Real Estate…Zillow.htm` | **NOT FOUND** | Snapshot captured a Zillow **500 error page** ("Uh oh, something broke."). No map, no Draw control. |
| 3 | "Login" div/p (Framer) | `Your AI Agent…Openroll.htm` | **REPRODUCED** | `<div class="framer-1j0lzlq"><p>Login</p></div>`, role/tabindex/href all null, `id="undefined-1j0lzlq"`. Absent from the focusable set (returns false). Adjacent "Request a Demo" IS a real `<a>`. Looks like a link, isn't one. |

## cat_5 — Focus Traps, Visibility & Management (1 REPRODUCED, 3 PARTIAL)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Cookie-banner focus trap | `Kahoot!.htm` | **PARTIAL** | OneTrust banner present (`position:fixed`, `role=region`, no `aria-modal`), 4 focusable controls, sits before `<main>`. A true trap needs live Tab exercise. |
| 2 | Global search focus trap | `NFL on ESPN…htm` | **PARTIAL** | Both `.global-search` inputs have `tabindex="-1"` (JS-only focus) — the structural precondition; the trap itself needs live keys. |
| 3 | Focus indicators disabled | `Southern Airways Express.htm` | **REPRODUCED** | CSSOM contains global `a:active, a:focus, a:hover { outline: none; }` plus `button:focus:not(:focus-visible){outline:0}` etc. The `/routes/` nav link is governed by it. Direct CSS reproduction. |
| 4 | "Join Now" rewards button focus | `Domino's.htm` | **PARTIAL** | Button has `outline-none` (transparent outline); `scale` is on `:active` not `:focus`; a dpz-modern `:focus` box-shadow exists (white inner ring on cream bg → low contrast). Outline suppression confirmed; full perceptibility needs a focus screenshot. |

## cat_6 — Visual Presentation, Color & Contrast (2 PARTIAL, 1 NOT REPRODUCED, 1 NOT FOUND)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Comparison-chart color-only lines | `Apple Inc. (AAPL)…Yahoo Finance.html` | **PARTIAL** | Chart + "Compare" control present, but snapshot is single-series (AAPL only); the 2nd ticker / color-only legend needs live interaction. |
| 2 | 3rd-party ad banner 300×250 .gif | — | **NOT FOUND** | `ad.adsrvr.org/dp0m90r/…_300x250.gif` appears only in `page_findings.json` metadata; no saved HTML contains it (third-party injected at runtime, not captured). |
| 3 | "Online Only" badge contrast | `sweetgreen_Menu.htm` | **NOT REPRODUCED** | Badge exists (5×), but computed colors are **black `rgb(0,0,0)` on neon-green `rgb(230,255,85)` = 18.8:1 (PASSES)**. The finding's "`#e6ff55` fg on `#e2e3e5` bg → 1.14:1" is **inverted/incorrect** — those hex values aren't in the CSS. Independently re-verified. |
| 4 | UGC meme/text image | `justgalsbeingchicks.htm` | **PARTIAL** | Correct subreddit page, but the specific "For the working people" `preview.redd.it` post isn't in the snapshot (lazy/below fold). The platform pattern (text baked into raster, auto-alt) is structurally confirmed; the specific element is absent. |

## cat_7 — State/Status Not Programmatically Exposed (1 REPRODUCED, 2 PARTIAL)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | "Add to Bag" success state | `Gymshark.htm` | **PARTIAL** | Success-tick span is `role="presentation"` (hidden from AX tree); no `aria-live`/`role=status` wired to cart-add (the 6 live regions are unrelated). Precondition confirmed; the click-to-change announcement needs live interaction. |
| 2 | Cloudflare plan tabs | `Our Plans _ Pricing _ Cloudflare.htm` | **REPRODUCED** | The 4 controls are plain `<button>`: role/aria-selected/aria-pressed/aria-controls all null; container not `role=tablist` (count 0). No live region scoped to the panel. ARIA deficiency fully static. |
| 3 | Name input ↔ error banner | `Corporate…@ Harvey.htm` | **PARTIAL** | `<input name="_systemfield_name" required>` has no `aria-describedby`/`aria-errormessage`/`aria-invalid`. (Snippet matches Harvey/Ashby, **not** VitalChek.) Missing linkage is static; the banner appears only post-submit. |

## cat_8 — Reflow & Dismissible/Hoverable (3 REPRODUCED, 2 PARTIAL)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | No reflow at 320px (UA-sniffing) | `Newegg.htm` | **REPRODUCED** | At 320px: scrollWidth 768 vs clientWidth 320 → horizontal overflow. `enableResponsiveMobileSSL:false`, separate `m.newegg` domain, no device-width viewport. |
| 2 | No reflow, header/grid | `Temu.htm` | **REPRODUCED** | 320px: scrollWidth 641 vs 320; header + 2-col grid overflow; only 8 `@media` refs, none on header. |
| 3 | No reflow, news grid/nav | `Yahoo Finance - Stock Market…htm` | **REPRODUCED** | 320px: scrollWidth 1037 vs 320; nav row clipped. (BBC & NY Mag both reflowed fine — Yahoo is the overflowing match.) |
| 4 | "Categories" mega-menu Escape | `Temu.htm` | **PARTIAL** | Trigger `<div role=button aria-haspopup aria-expanded=false>` present; no static keydown/Escape handler near it; menu closed in snapshot. Hover-open + Escape needs live session. |
| 5 | Fund Flows tooltip hoverable | `Vanguard S&P 500 ETF.htm` | **PARTIAL** | Highcharts SVG rendered (36 bars); `.highcharts-tooltip` only exists on mouseover. Config has no `outside:true`/`followPointer`/pointer-events — the structural cause of the non-hoverable tooltip — but the hover bridge can't be exercised statically. |

## cat_9 — Labels, Instructions & Error Identification (1 REPRODUCED, 2 PARTIAL)

| # | Element | File | Verdict | Evidence |
|---|---------|------|---------|----------|
| 1 | Asterisk-only required fields | `Corporate…@ Harvey.htm` | **REPRODUCED** | 12 labels use `._required…:after{content:"*"}` (CSS-generated `*`, no a11y text); 12 `required` inputs; no legend text matching `/marked|required/` anywhere. |
| 2 | BuzzFeed placeholder-only email | `BuzzFeed.htm` | **PARTIAL** | No `input[type=email]` and no "Enter your email" string in static DOM — the sign-up modal opens only after interaction. Pattern credible but element absent from snapshot. |
| 3 | Sign-in + disabled "Continue" | `Amazon Sign-In.htm` | **PARTIAL** | Continue button present (not disabled at load); `#ap_email_login` has no `aria-describedby`. Five `role=alert` error divs exist but start `display:none` and aren't linked to the input. Disable-on-invalid is dynamic. (Note: Amazon *does* have error regions, partially contradicting "no error text".) |

---

## Cross-cutting observations

1. **Two findings are factually wrong** and would fail a careful review regardless of the snapshot:
   - cat_6 sweetgreen contrast — colors are inverted; real ratio 18.8:1 passes.
   - cat_1 Microsoft "Learn more" — the link has a proper descriptive `aria-label`.
2. **4 NOT FOUND are snapshot-capture limitations, not finding errors** — CSR shells that never hydrated (Spirit hotels), a captured error page (Zillow 500), runtime-injected third-party content (the ad GIF), and lazy content never scrolled into the DOM (justgals post). To verify these, the snapshots would need to be re-captured in a hydrated/scrolled state.
3. **13 PARTIALs are inherent to static snapshots.** Focus traps, hover tooltips, Escape-dismiss, click-to-change state, and live-region announcements need a live browser exercising keyboard/pointer. The annotation tool *could* reach several of these via the `/ax-node` speech + a scripted interaction layer, but the frozen snapshot alone cannot.
4. **axe-core alone would miss most of these.** Generic title (2.4.2), empty `role=heading` span, ungrouped card grids, "Learn more"/auto-alt context failures, and DOM-vs-visual order all passed axe yet are real failures — confirming the value of the AX-tree/screen-reader/manual layer over pure automated scanning.

---

## Snapshot serving mode & capture health (Q3)

The annotator serves a saved page two ways:
- **`?offline=1`** — the page's own scripts run (used for the AX-tree/SR engine and the verification harness).
- **`?offline=1&noscript=1`** — the page's `<script>` tags are neutralized. Used by the **iframe the human annotator actually sees**, and assigned per-page via `"noscript": true` in `assets/pages.json` (13 pages flagged).

For SPA snapshots that crash/hydrate-blank offline, noscript is what makes them usable — the Save-As SSR DOM survives. The "snapshot capture issues" in the first pass were mostly **harness artifacts** (the harness ran scripts); under the annotator's real noscript serving they render fine.

| Page | Flagged `noscript`? | Scripts on (`offline=1`) | Noscript (annotator view) | Needs fixing? |
|---|---|---|---|---|
| Spirit hotels | ✅ yes | blank (`#root` empty, 0 text) | **67 hotel cards, 137 filter chips, 2905 chars** | **No** — already correct |
| Zillow | ✅ yes | 500 / context destroyed | **63 listing cards, map present, 9034 chars, no 500** | **No** — page usable |
| Harvey | ✅ yes | JS times out | **form renders, 12 required labels, name input** | **No** — already correct |
| Quizlet | ✅ yes | landing renders | renders (different DOM → xpaths recomputed in noscript) | **No** |

**Conclusion:** none of the four "problem" pages need re-capturing. They are already
flagged `noscript` and render their content correctly in the annotation tool. The
earlier blank/500 observations were caused by verifying them with scripts on.

**Genuinely missing content (not a noscript fix — these are true capture gaps):**

| Finding | Page | Why missing | Recommendation |
|---|---|---|---|
| cat_4 Map "Draw" tool | Zillow | The Draw control is a JS-rendered map overlay — absent even in noscript (`drawBtn:false`). | Not reproducible on a static snapshot; drop or re-capture live with the Draw layer engaged. |
| cat_6 UGC meme/text image | justgalsbeingchicks | The specific `preview.redd.it` post was lazy-loaded below the fold and never serialized. | Re-capture after scrolling the post into view, or annotate a different captured post (the pattern is generic). |
| cat_6 3rd-party ad GIF | Yahoo Finance | `ad.adsrvr.org/...300x250.gif` was runtime-injected by an ad tag; not in saved HTML. | Not reliably re-capturable; reasonable to drop this finding from the dataset. |

**Caveat for future verification runs:** `scripts/verify-finding.js` loads with
scripts on. For the 13 `noscript`-flagged pages, verify against
`?offline=1&noscript=1` (as `scripts/probe-noscript-pages.js` does) so the DOM
matches what the annotator serves — otherwise SPA pages read as empty.

---

## Selection list update (Q1)

The REPRODUCED + PARTIAL findings were added to the manual-annotation selection
list, `assets/samples-saved.json` (the per-page `sampled[]` arrays the UI outlines
as "Selected"). **29 elements** added across **25 pages** (18 REPRODUCED, 11
PARTIAL), each tagged with provenance: `source:"finding-verification"`,
`finding:"cat_X[n]"`, `verdict`, and a `note`. xpaths for the noscript-flagged
pages were computed against the noscript DOM so they resolve in the annotator
iframe. Scripts: `scripts/add-findings-to-samples.js` + `scripts/fix-noscript-xpaths.js`
(backup at `assets/samples-saved.json.bak`).

Two PARTIAL findings were **not** added because their target element isn't present
in the snapshot at all: cat_6 justgals post image and cat_9 BuzzFeed email field
(both appear only after interaction / lazy-load). See the capture-gap table above.

## Tools used (Q2)

Everything ran on the **existing toolkit** — no new dependencies installed
(`package.json` unchanged; the two deps are `puppeteer` and
`@guidepup/virtual-screen-reader`):
- Puppeteer + the bundled `axe.min.js` (axe-core) for scans, computed styles, screenshots.
- The server's own endpoints: `/ax-node` (AX tree + screen-reader speech), `/sr-order`, `/assets/saved/…?offline=1[&noscript=1]`.
- Standard CLI already on the machine (node, grep, python3 for JSON formatting) and my own vision to read screenshots.
- New **scripts** were written, but they only orchestrate the above toolkit — no external library was imported: `verify-finding.js`, `probe-noscript-pages.js`, `add-findings-to-samples.js`, `fix-noscript-xpaths.js`.

_Harness: `scripts/verify-finding.js`. Server on :3001 (Puppeteer engine + guidepup virtual screen reader). Read-only throughout (except the deliberate `samples-saved.json` selection-list update)._

---

## Full pass against page_findings.json (the authoritative 56-issue source)

`findings.js` (36 issues, no page mapping) turned out to be a trimmed subset of
**`page_findings.json` — 56 issues across 55 URLs, one per saved page, each with
an authoritative `url` field.** A second multi-agent pass covered the 20 issues
missing from findings.js plus 6 that the first pass had mis-mapped (findings.js
lacks `url`, so pages were guessed). All verification used the authoritative
`url`→file mapping and the noscript-aware harness.

**Mapping corrections (first pass guessed wrong; page_findings.json is authoritative):**

| Issue | First-pass guess | Authoritative page |
|---|---|---|
| cat_5 global search trap | ESPN | **Newegg** |
| cat_9 sign-in + Continue | Amazon Sign-In | **Panera Bread** |
| cat_8 desktop reflow | Newegg | **Amazon.com** |
| cat_8 header/grid reflow | Temu | **Nordstrom** |
| cat_8 news-grid reflow | Yahoo | **BBC** |
| cat_1 header search (":r1h:") | (unmapped → NOT FOUND) | **Wayfair** → NOT REPRODUCED |

**Newly verified issues (26 = 20 net-new + 6 re-mapped):**

| Issue | Page | Verdict | Evidence |
|---|---|---|---|
| cat_1 header search aria-labelledby | Wayfair | **NOT REPRODUCED** | `aria-labelledby` resolves to `<span>Search</span>`; SR name "Search". Finding wrong on its own page too. |
| cat_2 Quora signup modal | Quora | **PARTIAL** | Modal is an empty container (no `role=dialog`/`aria-modal`); trigger present; open is dynamic. |
| cat_3 Rubric eyebrow badge | Rubric | **REPRODUCED** | "Our Research Pillars" is a styled `<div>`, `role=generic`, absent from heading outline. |
| cat_3 ix.dev document outline | ix.dev | **REPRODUCED** | No `<h1>`; outline starts at `<h2>` (axe `page-has-heading-one`). |
| cat_4 Macy's mega-menu | Macy's | **PARTIAL** | Trigger missing `aria-haspopup`; Shift+Tab wrap trap is in JS (dynamic). |
| cat_4 Artera social icons | Artera | **REPRODUCED** | Icon links have empty accessible name (axe `link-name` ×10). |
| cat_4 MORSE footer LinkedIn | MORSE | **REPRODUCED** | Link name is whitespace-only (`alt=" "`); SR reads "link, image". |
| cat_4 WSO search input | Wall Street Oasis | **REPRODUCED** | Named by placeholder only; no combobox ARIA (F68). |
| cat_4 boohooman filter sidebar | boohooman | **REPRODUCED** | Accordion `<div tabindex="-1">`, not keyboard-operable; stateless filter buttons. |
| cat_4 Reddit search (web component) | Reddit | **REPRODUCED** | Input inside shadow DOM, label not associated; placeholder-only name. |
| cat_4 o11 Excel toggle | o11 | **REPRODUCED** | Button empty name; nested `<a>` in `<button>` (F111). |
| cat_4 Opendoor mega-menu | Opendoor | **REPRODUCED** | Trigger missing `aria-haspopup`; dropdown pointer-only. |
| cat_5 Newegg search (trap) | Newegg | **PARTIAL** | Input present; trap is dynamic. |
| cat_5 Reebok side-cart | Reebok | **REPRODUCED** | Hidden cart leaks focus: focusable descendants, off-screen Close button `tabindex=0`, no `inert`/`aria-modal`. |
| cat_5 Rotten Tomatoes carousel | Rotten Tomatoes | **REPRODUCED** | 85 off-screen carousel tiles keyboard-focusable, no `aria-hidden`/`inert`. |
| cat_5 Fed10 mock dashboard | Fed10 | **PARTIAL** | 56 SVG `<path tabindex="0">` with no accessible name (focus tarpit). |
| cat_5 Notion billing toggle | Notion | **PARTIAL** | Radios visually hidden, no `:focus` indicator; change not announced (dynamic). |
| cat_6 GrazeMate interactive elements | GrazeMate | **REPRODUCED** | Global `:focus{outline:none!important}`; +15 unnamed image links. |
| cat_7 H&M mini-cart toast | H&M | **PARTIAL** | No dedicated live region for add-confirmation; toast injected dynamically. |
| cat_7 Doomersion autoplay video | Doomersion | **REPRODUCED** | `<video autoplay loop>` no controls, no captions, no reduced-motion. |
| cat_8 Amazon desktop reflow | Amazon.com | **REPRODUCED** | 320px: scrollW 1000 vs 320. |
| cat_8 Nordstrom reflow | Nordstrom | **REPRODUCED** | 320px: scrollW 733 vs 320. |
| cat_8 BBC reflow | BBC | **REPRODUCED** | 320px: scrollW 1425 vs 320. |
| cat_9 VitalChek split date field | VitalChek | **NOT FOUND** | Field loads on a later AJAX step; absent from snapshot. |
| cat_9 Amazon password field | Amazon Sign-In | **NOT FOUND** | Snapshot is the email step; password step not captured. |
| cat_9 Panera sign-in + Continue | Panera | **NOT FOUND** | Sign-in form is a Vue overlay; not in static DOM. |

### Final reconciliation — all 56 page_findings.json issues

| Outcome | Count | Notes |
|---|---|---|
| **REPRODUCED / PARTIAL → in selection list** | **46** | 51 element entries (some pages contribute >1) |
| **NOT REPRODUCED** (finding factually wrong) | **3** | Microsoft "Learn more" · sweetgreen contrast · Wayfair header search |
| **NOT FOUND** (element not in snapshot) | **7** | Zillow Draw · Yahoo ad GIF · justgals meme · VitalChek date · Amazon password · Panera Continue · BuzzFeed email |

**Selection list now holds 51 finding-verification elements (34 REPRODUCED + 17
PARTIAL) across 46 pages** — full per-page coverage of every issue that has a
real, locatable element in the saved dataset. Scripts: `add-fullpass-to-samples.js`
(+ the noscript autodetect added to `verify-finding.js`).
