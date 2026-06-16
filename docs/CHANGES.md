# A11y Annotator — Change Log

Summary of work done on the annotation pipeline (June 2026).

## 1. Page catalog (`assets/pages.json`)

- Removed all **Mock** (`assets/mock/`) entries; hid **Lovable** entries (`"hidden": true` — kept but never shown in the dropdown).
- Generated entries for the new asset sets with prefixed display names:
  - `D1_<L>_<model>_<domain>_<page>` — `assets/Description_1/Level_{0,1,2}/<model>/<domain>/` (252 pages)
  - `D2_…` — `assets/Description_2/…` (249 pages)
  - `C_<domain>_<page>` — `assets/original_baseline/` (10 pages)
  - `S_<name>` — `assets/saved/` (56 pages)
  - Abbreviations: models `Cl`/`Cx`/`GA`, domains `EC`/`EDU`/`GOV`/`MM`/`SM`.
- Per-page `"noscript": true` flag (see §4).

## 2. Element sampling (`scripts/sample-elements.js`)

Automated, reproducible sampling of UI elements to annotate per page.

- **Candidates**: not hidden (display/visibility/opacity/aria-hidden/inert/zero-rect), not whole-page containers, and either AT-focusable (tab-order focusable or interactive ARIA role, even with `tabindex=-1`) or meaningful non-interactive content (own text, images).
- **Mix**: 70 % AT-focusable / 30 % non-AT-focusable (`--at-ratio`), 20 elements per page (`--per-page`), stratified across landmarks (banner/nav/main/footer/…), seeded RNG → re-runs reproduce identical samples.
- **Critical design point**: the sampler drives the *actual annotator UI* in headless Chrome and collects from inside its iframe. Sampling any other way (plain tab) produces xpaths for a DOM the annotator never shows — sandboxing, CSP and injected scripts all change how pages hydrate.
- Parallel workers (`--concurrency`), browser-crash recovery, per-page render wait (`--render-wait`), filters (`--group/--name/--file`), retry mode (`--retry-from` re-runs only errored/zero entries and merges).
- Outputs: `assets/samples.json` (D1/D2 index pages, 90 × 20) and `assets/samples-saved.json` (saved pages, 56 × 20). All pages sample cleanly (0 errors, 0 zero-candidate).

## 3. Annotator UI (`index.html`)

- **Sample highlights** in the page iframe (original element colors untouched — outline only):
  - current sample → bold 4 px pink outline + glow
  - pending samples → 2 px pink outline
  - annotated samples → dim 1 px dashed purple
  - Axe results no longer paint the iframe (sidebar only); highlights come from the sample files.
- **Progress panel** (top of sidebar): `n/20 annotated` counter, **Prev / Next** buttons that cycle through *un-annotated* samples only, expandable element list (click row to jump). Jumps scroll the element to viewport center.
- Highlight application retries for ~25 s (SPAs render late; re-renders wipe classes) and falls back from xpath → element id → tag+text matching. A `⚠ n/20 located` badge appears if sampled elements can't be found in the live DOM.
- **New annotation options**: "No obvious issues" and "Not listed above" (with WCAG guideline ID(s) + issue description fields).
- **Confirm button**: sets `confirmed: true` on the element's annotation and dims its highlight — nothing else. Locked until the annotator has used the KB/SR prev/next navigation pills at least twice for the element (forces inspection); label shows `✓ Confirm (n/2 nav)` progress.
- Export JSON includes `confirmed` per element.

## 4. Page rendering fixes (`server.js`)

Saved/mock pages failed to render in the iframe for several distinct reasons, all fixed server-side when serving with `?offline=1`:

| Problem | Fix |
|---|---|
| Mock pages load React/Babel/Tailwind from CDNs; offline CSP blocked them → blank page | CDN URLs rewritten to locally vendored copies in `vendor/` (tailwind, react×4, babel×2, htm, lucide, phosphor, font-awesome+webfonts) |
| Saved SPA snapshots run their app JS, crash (origin checks, missing chunks), and erase their own server-rendered DOM | `&noscript=1` mode neutralizes page `<script>` tags (`type="text/plain"`); the snapshot's SSR DOM + saved CSS render perfectly; annotator's injected scripts unaffected. 13 pages flagged in pages.json (probed by `scripts/probe-noscript.js`; H&M and Quizlet added during repairs) |
| Snapshots with `<meta http-equiv="refresh">` redirected the iframe to dead paths | Meta refresh + meta CSP stripped from offline HTML |
| Hard 404s on absolute-path subresources (`/_next/static/…`) abort SPA hydration | Soft-404: empty `200` with correct MIME for missing files requested by asset pages |
| `.htm` served as `application/octet-stream` | Added to MIME map |

CSP in offline mode: blocks off-origin **scripts and XHR/fetch** (the things that hang or rewrite pages); allows passive **images/fonts/styles** for visual fidelity.

- **Offline mode is the default** (toolbar checkbox, persisted in localStorage).
- `/vendor/*` static route serves the vendored libraries.

## 5. Verification

Headless-Chrome screenshot testing of the real UI (`scripts/ui-test.js`, `scripts/probe-noscript.js`):

- D1 mock page: full render, 20/20 highlights located, bold "current" ring clearly distinguishable from pending/selected outlines.
- Gymshark / Wayfair (worst offenders, previously white): full render via noscript, 20/20 highlights located.
- 43 saved pages run with scripts; 13 with noscript.

### Full visual audit of all 56 saved pages

Every saved page was screenshotted in the annotator (`scripts/screenshot-all.js` →
`/tmp/page-verify/`) and judged by a fleet of 56 vision agents (good / minor / broken).
Result after fixes: **28 good · 18 minor · 10 broken**.

- **Minor** (cosmetic; usable for annotation): mostly broken image icons / missing
  webfonts on otherwise faithful pages — Yahoo Finance ×2, Domino's, Wall Street Oasis,
  Kahoot, Macy's, H&M, ESPN, Newegg, Notion, Quizlet, Reebok, Snowflake, VitalChek, o11,
  r/teenagers, sweetgreen, Zillow (fixed from broken via noscript — its script navigated
  the iframe away; header partially unstyled, body fine). All 18 subsequently
  **repaired or re-verified** (see §6).
- **Broken** (10 pages): LinkedIn feed, BBC Home, BuzzFeed, Calendly, Spirit Airlines
  hotels, Artera, Google Drive, MORSE Corp, Microsoft Store Support, Quora — all
  **repaired** (see §6).

After both repair passes — plus mock-data SVG charts for the two runtime-drawn
ChartIQ canvases (§6 "Mock charts") — the 56 saved pages stand at
**51 good · 5 minor · 0 broken**; the remaining "minor" defects are all ad slots or
assets that no longer exist anywhere (expired CDN images absent from the Wayback Machine).

## 6. Snapshot repairs (agent fleet)

All 28 defective snapshots (10 broken + 18 minor) were repaired by per-page agents that
diagnosed each failure, fetched missing resources from the live sites (or the Wayback
Machine), and surgically patched the snapshots. Every edited snapshot's original is
preserved as `assets/saved/<name>.htm.orig`; downloaded files are named `restored-*`.

Recurring root-cause classes:

| Cause | Pages | Fix |
|---|---|---|
| Save-As stored CSS under extensionless hashed names → server sent `application/octet-stream` → browser refused the stylesheets | LinkedIn, Google Drive, Microsoft Store, Quora, VitalChek | Copied to `.css`-suffixed names, rewrote the `<link>` hrefs |
| CSS lived in runtime-injected `<style>` tags (styled-components), never captured by Save-As | BBC, Spirit hotels, Calendly, Zillow | Recovered build-matched CSS (Wayback capture, live-site CSSOM dump, replaying the saved JS chunks, or the page's own embedded SSR JSON), added one `<link>` |
| `srcset`/`poster`/`<source>` kept original site-absolute or protocol-relative URLs which the browser prefers over the working local `src` | WSO, Reebok, o11, sweetgreen, Newegg, H&M | Rewrote to local copies (downloading where needed) or removed the bad `srcset` |
| Lazy-load markup (`data-src`, placeholder gifs) whose activating JS is CSP-blocked | Macy's, H&M | Activated from `noscript`/`data-src` fallbacks, downloaded the images |
| Cookie/consent dialogs stuck open (dismiss JS can't run offline) | Domino's, Kahoot, Reebok, H&M, Microsoft Store, Quizlet | Hidden via injected `<style>` with `!important` (no DOM nodes removed — fully reversible) |
| Content present but hidden by JS-gated reveal animations / carousel or custom-element init | Artera, MORSE Corp, r/teenagers | Override CSS forcing visibility; neutralized offline-hostile loaders |
| Page JS re-breaks images after hydration | Notion, H&M | Notion: early script intercepting `img.src` setters to remap to local files; H&M: switched to noscript mode |
| Non-Error page exceptions crashed the *test harness* (page itself was fine) | BuzzFeed, ESPN, Quizlet (stale audits) | Hosted BuzzFeed's header script locally; hardened `scripts/ui-test.js`; no page edits needed for ESPN/Quizlet |

### Per-page repair log — the 10 broken pages (final: 9 good · 1 minor)

| Page | Defect | Root cause | Repair | Verdict |
|---|---|---|---|---|
| LinkedIn feed | Raw unstyled HTML | 34 extensionless hashed CSS files served as `octet-stream` | Copied all 34 to `.css` siblings, rewrote the `<link>` hrefs | good |
| BBC Home | Raw unstyled HTML | styled-components CSS lives only in CSSOM; never saved; class hashes are build-specific | Recovered 120 KB CSS from a Wayback capture of the *identical build*, added one `<link>`; added closed-state rules for the nav drawer; page stays noscript (its hydration blanks the DOM) | good |
| BuzzFeed | Reported blank | Page was actually fine — its scripts throw non-Error values that crashed the screenshot harness; one header script CSP-blocked | Hosted `bf-header-ui` app.js locally; patched a tracking chunk to reject with a real `Error`; hardened `ui-test.js` | good |
| Calendly | Raw unstyled HTML | styled-components v6 CSSOM CSS never saved; exact-build CSS chunk now 404s on the CDN | Regenerated the exact-build CSS by replaying the snapshot's own saved JS chunks in an emulated CDN (160 KB, 1,130 rules, exact class match); restored fonts/reset CSS + `brand-shapes.svg` | good |
| Spirit Airlines hotels | Raw unstyled HTML | styled-components v5 CSSOM CSS never saved; page JS blanks the DOM | Harvested 1,049 rules from the live site's CSSOM (399/451 hash classes matched) → `restored-1.css`; stays noscript | good |
| Artera | Blank page | Reveal-on-scroll classes stuck at `opacity:0` (jQuery never runs); hero video off-origin | Override CSS forcing entrance-animation classes visible; downloaded the hero video (6.3 MB) locally | good |
| Google Drive | Raw unstyled HTML | Two extensionless `rs=…` CSS files (4.3 MB) served as `octet-stream` | Copied to `restored-1/2.css`, rewrote links; fixed 98 protocol-relative `//gstatic` URLs to `https:` | good |
| MORSE Corp | Blank dark page | `common.js` erased the saved header to re-fetch `header.html` (404 offline); hero `<video>` and webfonts 404 | Downloaded both hero videos + bebasneue/fontawesome webfonts; neutralized the header/footer re-loaders | good |
| Microsoft Store Support | Unstyled nav + stuck "Sign me up" modal | Extensionless UHF header/footer CSS (`ae-f1ac0c`); first-visit modal JS can't dismiss offline | Copied to `restored-1.css`, rewrote the link; disabled the modal's page-load trigger | minor |
| Quora | Raw unstyled HTML | Only stylesheet had a `.webpack` extension → `octet-stream` | Copied to `restored-1.css`, rewrote the single link (must keep scripts ON — its JS repopulates styled-components styles) | good |

### Per-page repair log — the 18 minor pages (final: 13 good · 5 minor)

| Page | Defect | Root cause | Repair | Verdict |
|---|---|---|---|---|
| Yahoo Finance — AAPL quote | Empty price chart; white sidebar box | Chart is a runtime-drawn `<canvas>` (never serialized by Save-As); white box is a Google ad iframe | Chart populated with a **mock-data SVG** (see "Mock charts" below) aligned with the page's own quote (251.49, +1.41%, prev close 247.99); line ends on the page's saved price beacon. Ad iframe left as-is | minor (empty ad slot only) |
| Domino's | Cookie consent modal stuck open | Tealium GDPR modal saved open; saved `utag.js` re-injects it at runtime | Head-level `!important` CSS rule hiding `#__tealiumGDPRecModal` (survives re-injection) | minor (a few deal-card promo images 404 on the CDN) |
| Wall Street Oasis | Broken header/footer logo | Logos' `srcset` kept site-absolute paths the browser preferred over the working local `src` | Downloaded the 2× logo variants from the live origin, pointed both `srcset`s at local files | good |
| Kahoot! | Cookie banner stuck open | OneTrust SDK can't initialize offline, so nothing dismisses it | Injected CSS hiding `#onetrust-*` + the dark overlay | good |
| Macy's | Hero/category images missing; bottom ⅔ blank | Lazy-load markup with CSP-blocked Nuxt JS; saved flickity bundle re-initialized the carousel, displacing all slides; 2 CDN assets expired | Downloaded 106 lazy-load images + 2 videos, rewrote srcs, added `loaded` classes + flickity base CSS, neutralized the duplicate carousel init | good |
| NFL on ESPN | Blank bottom third (audit) | Stale audit — lower modules are client-rendered from inline state and hydrate a few seconds after load | None needed (scripts must stay ON) | good |
| Newegg | Broken banners, blank below fold | Page JS rebuilds sections from `window.__initialState__` whose image URLs were protocol-relative → `http:` → CSP-blocked | Rewrote 66 URLs to explicit `https:` inside the inline state (CDN still live); broken imgs 37 → 1 | good |
| Notion Pricing | Brand logos intermittently broken | Next.js hydration rewrites `img` srcs to `/_next/image` optimizer URLs (empty-200 locally) — a race with an earlier fixer | Early `<script>` intercepting `src`/`srcset` setters, deterministically remapping known assets to local copies | good |
| Quizlet | Sign-up modal covering page | React modal portal saved open; an earlier CSS fix hid it visually, but the saved `aria-hidden="true"` on the `.site` wrapper (set by react-modal at save time) still hid the *entire homepage from AT*, so the sampler found 0 candidates | Removed the stale `aria-hidden` from the wrapper; flagged the page noscript (its saved JS re-opens the invisible modal at runtime). Now renders cleanly and samples 489 candidates | good |
| Reebok | Broken logo + hero; gray ENGINE A section; cookie banner | `srcset`/`poster`/`<source>` kept protocol-relative `//www.reebok.com` URLs, preferred over valid local `src` | Removed broken srcsets (logo + heroes), downloaded ENGINE A posters/videos (10.7 MB) locally, hid the banner | good |
| Snowflake job page | Broken header logo | SVG content saved under a `.png` name → served as `image/png` → rejected | Copied to `snowflake-logo.svg`, rewrote the 2 references | good |
| VitalChek | Inline error dialogs, fanned animation frames, serif text | 4 extensionless CSS bundles (MainCss, JQueryCss, Select2Css, Google Fonts) served as `octet-stream` | Copied to `.css`-suffixed names, rewrote the 4 `<link>` hrefs | good |
| Yahoo Finance — chart page | Empty chart canvas; sneaker ad grid | ChartIQ `<canvas>` drawn at runtime from live data; the sneaker grid is the genuine saved ad creative | Chart populated with a **mock-data SVG** mountain chart matching ChartIQ's own saved accessible description (SHOP + AAPL/META comparisons + volume underlay) and the legend's exact O/H/L/C (121.19/121.22/121.10/121.12) and prior close 121.70 | good |
| o11 | Broken hero video, partner logos | 96 `<source srcset>` tags kept site-absolute `/_app/immutable/` URLs (empty-200) overriding local imgs; hero video was an off-origin mux HLS stream | Removed the 96 bad `<source>` tags; remuxed the hero video via ffmpeg to a local 12.5 MB mp4 | good |
| r/teenagers | Community-highlight cards empty | Cards carry `nd:invisible`, hidden while the custom element is `:not(:defined)` — its defining module scripts are CSP-blocked | Injected CSS unhiding the cards + light-DOM layout/typography rules replicating the carousel row | good |
| sweetgreen Menu | Featured food photos broken | `<source srcset>` used protocol-relative `//images.ctfassets.net` URLs → `http:` → blocked; local copies existed all along | Rewrote 90 srcset references to the local saved files | good |
| Zillow | Header unstyled (bulleted nav, giant icons) | Topnav microfrontend's styled-components CSS saved empty | Extracted the 33 KB topnav CSS verbatim from the page's own embedded SSR JSON payload → `restored-topnav-styled.css`; hand-restored search-icon base rules; stays noscript | minor (one JS-populated "Loading…" ad slot; headline webfont falls back) |
| H&M product page | Product gallery missing; cookie dialog stuck open | All gallery/swatch images referenced `image.hm.com` via `srcset`; Next.js hydration restores the remote URLs even after rewriting; consent JS can't complete | Downloaded 8 product/swatch images, rewrote 229 references, hid the dialog — then **switched the page to noscript** (renders perfectly without JS; hydration re-breaks it otherwise) | minor ("styled with" thumbnails were never captured: live CDN 403s, no Wayback copy) |

### Mock charts for runtime-drawn canvases

The two Yahoo Finance pages' price charts are drawn at runtime onto `<canvas>` by
ChartIQ from live market data — a snapshot can never contain them. They were populated
with **static inline SVG charts built from mock data aligned with each page's own saved
values**:

- *AAPL quote page*: 1-day line chart consistent with the saved quote header — opens
  near the previous close (247.99), low 247.65 / high 251.80, ends at 251.49 (+1.41 %)
  exactly on the page's saved pulsing price beacon; dashed previous-close line, time axis.
- *Advanced chart page (SHOP)*: mountain chart matching ChartIQ's own saved accessible
  canvas description ("1 minute mountain chart … SHOP, AAPL, META … Volume Underlay") —
  SHOP session ending at the saved close 121.70, gapping to the saved legend's open bar
  121.12; AAPL/META comparison lines; volume underlay; dark-theme axes.

Each SVG carries `role="img"`, a descriptive `aria-label` narrating the data, a stable
id (`mock-chart-aapl` / `mock-chart-shop`), and `data-mock="true"` for provenance. Both
were **appended to `assets/samples-saved.json`** (those pages now have 21 samples) with
verified xpaths + id fallback; the annotator locates 21/21 on both pages.

*Alternative explored — letting the pages' own JS draw the charts from mocked data
(opt-in via `&yjs=1`, off by default):* the server gained `/yfin` + `/yfin2`
caching-vendor routes (Yahoo's webcore and SvelteKit chunk graphs, fetched once from
the still-live hash-versioned CDN URLs, then local — 253 chunks, ~8 MB), a `/yapi` +
`/xhr` mock data layer in Yahoo's real response formats (v8 chart / v7 quote aligned
with the saved values; plain-text crumb; shaped `/xhr/config`; proxy-cached `/xhr/i18n`),
and a fetch/XHR shim rerouting the API hosts. Six successive boot blockers were
diagnosed and fixed, each verified by instrumenting the locally-served SvelteKit
runtime: (1) the kit entry module 404'd — kit computes its base from `location`, wrong
under `/assets/saved/`; fixed with a route alias + `<base>` tag; (2) the client router
matched no route for the asset URL, crashing every `load()` — fixed by spoofing
`location` to the page's canonical path via `history.replaceState`; (3) the mount
target — Save-As serialized the boot script inside a bogus nested `div#svelte` in the
ybar notifications panel; re-pointed to the real `body > div#svelte`; (4) the route
loads fetch Yahoo's same-origin `/xhr` BFF — mocked/proxied (the `pages` config needs
`{i13n:{event_params:{}}}` or init crashes); (5) the notifications loader never
resolves offline — raced against a 3 s timeout; (6) a late ad-script `document.write`
wiped the document — blocked post-parse. **Final state: all four route loads complete
and the SvelteKit root mounts successfully** — but Yahoo's generated root component
renders an empty tree (no error thrown; some internal gate in 161 KB of minified
Svelte), and even on success the mount *replaces* the saved DOM with a client-rendered
app, which conflicts with xpath-stable sampling and discards the saved editorial
content. Concluded there; the static SVG charts remain the production path.

Pages flagged `noscript` gained two entries from this pass: **H&M** and **Quizlet**
(joining BBC, Spirit, Zillow, Snowflake, Gymshark, Wayfair, …) — 13 of 56 saved pages total.

All 56 saved pages were then re-sampled in-app so annotation xpaths match the repaired
DOMs: **0 errors, 0 zero-candidate pages**, 1,109 sampled elements at 68.8 % AT-focusable
(+2 manually-added mock charts = 1,111 total). Repaired pages yield healthy candidate
pools (Zillow 752, Macy's 682, Quizlet 489, H&M 429, Calendly 419, sweetgreen 596, …).

## Known caveats

- 5 D2/Level_2 mock pages still have 0 candidates (empty/broken source HTML): `D2/L2/Codex/{ecommerce,education,mass_media,social_media}`, `D2/L2/Google_Antigravity/government`.
- Pages flagged `noscript` are static snapshots — dynamic behaviors (menus, modals) won't function there; keyboard/SR *markup* is still inspectable.
- Sample xpaths are tied to the sampling environment; if a page's `noscript` flag is changed, re-run the sampler for that page.
