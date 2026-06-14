# Toolkit Audit — surfaces beyond SR navigation

Follow-up to SR-AUDIT.md (which covered `/ax-node` speech + `/sr-order` reading order).
This audit brainstormed every *other* toolkit surface and evaluated each systematically.
No webpage was modified; all findings are tool-side.

Harnesses (all read-only, kept in `scripts/`):
- `toolkit-audit.js` — phase **inframe**: all 56 saved pages in the annotator iframe
  (xpath round-trip, aid hash collisions, tab-order correctness, sample-highlight
  resolver, axe integration); phase **props**: 120 seeded elements (seed 99) comparing
  the front-end property panel (`getRole`/`getA11yName`/`isFocusable` heuristics)
  against Chrome's real AX tree via `/ax-node`.
- `toolkit-audit-analyze.js` — summarizer for `/tmp/toolkit-audit.json`.
- `ui-state-test.js` — end-to-end annotation state machine (16 checks: selection,
  checkbox→localStorage, page-switch round-trip, full-reload restore, confirm gate,
  annotated-list click-back, export shape). Saves/restores localStorage.
- Server robustness probed with curl (traversal, malformed xpath, missing files,
  cross-file cache race).

## Verdict summary

| Surface | Result |
|---|---|
| aid (`mkId`) hash collisions | **0** across ~150k xpaths on 56 pages |
| Sample-highlight resolver | **0** wrong-element resolutions, 0 duplicate xpaths, all samples located |
| Axe integration | completed on **56/56** pages, 0 errors, **1409/1409** violation targets resolved to clickable aids |
| Annotation state machine | **15/16** checks pass |
| Server robustness | traversal blocked, malformed input graceful, survives everything thrown at it |
| xpath round-trip | **3,015 failures on 22 pages** — single root cause (camelCase SVG) |
| KB tab-order tool | **4,843 of 12,593 entries (38%) are not really tabbable** (hidden by ancestor); 67 tabbables missing |
| Front-end ROLE display | 86/99 match Chrome AX; gaps: `svg`, scoped `footer`/`header` |
| Front-end NAME display | 82/99; over-reports text as "name" for non-nameable roles, **misses names from descendant `img[alt]`** |
| Front-end KEYBOARD display | 97/99; `summary` wrongly "not focusable" |
| Iframe instrumentation injection | **dead on NFL/ESPN** — `load` never fires, so nothing is ever injected |

## Bugs found (ordered by impact)

### 1. KB tab-order includes hundreds of elements a real Tab key never reaches
`getTabOrder()` (INJECT_JS) filters by the **element's own** computed style — but
`display` is not inherited, so focusables inside `display:none` ancestors (closed
flyout menus, dialogs, mega-nav panels) pass the filter. Across the corpus: 4,843 of
12,593 tab-order entries (38%) sit inside a hidden ancestor — BuzzFeed 418/690
(hidden reaction dialogs), Macy's 545/785, FinancialCareers 599/801, Apple-Yahoo
264/521, Amazon flyout "Sign in / Start here" etc. Real Chrome skips all of these.
Consequences: the KB prev/next pills routinely point at invisible elements (the
KB-tool twin of the SR noscript bug), and `currentTabInfo.index/total` is inflated.
*(`visibility:hidden` ancestors are caught — visibility inherits; it's only
`display` that leaks.)*

**Also missing from tab order**: the selector omits `summary` (23 visible
occurrences corpus-wide), `audio/video[controls]`, and `iframe` (21) — all genuinely
tabbable in Chrome. And `[contenteditable]` matches `contenteditable="false"`
(not focusable; 0 occurrences in this corpus, latent).

Fix direction: in the tab-order filter walk ancestors for `display:none` (or use
`el.checkVisibility()`), and extend the selector with
`summary, audio[controls], video[controls], iframe`; same fix for `isFocusable`.

### 2. camelCase SVG elements get xpaths that never resolve (3,015 elements / 22 pages)
`getXPath()` (all three copies: INJECT_JS, server `querySROrder`, sampler) lowercases
`tagName` — but XPath `local-name()` comparison is case-sensitive, and SVG preserves
case: `local-name()='lineargradient'` never matches `<linearGradient>`. Every
camelCase SVG element (`linearGradient`, `clipPath`, `radialGradient`,
`foreignObject`, …) and every descendant beneath one gets an unresolvable xpath
(Calendly alone: 2,156). All 3,015 corpus-wide failures trace to this single root
cause — zero other round-trip failure modes. Today's sample lists dodge it (charts
were sampled at the `<svg>` root), but clicking such an element produces an
annotation whose xpath can never be re-resolved (export, reload restore, SR queries).
Fix direction: drop `.toLowerCase()` for non-HTML-namespace elements (HTML tagName
is uppercase and does need lowering; SVG tagName is already canonical).

### 3. Annotator instrumentation never loads on pages whose `load` event never fires
All iframe injection (INJECT_CSS, INJECT_JS, SAMPLE_INJECT_JS, axe) happens in the
iframe's `load` handler. On **NFL/ESPN** the snapshot keeps a subresource pending
forever — `readyState` stays `interactive`, `load` never fires (verified for 40s),
and hover/click/selection/sample-highlights/axe are all dead for that page in the
real UI. Slow-but-eventually-fine pages exist too (Microsoft Store ~10s, Quora ~2s).
Fix direction: inject on `DOMContentLoaded`-equivalent (poll
`contentDocument.readyState !== 'loading'`) with the `load` handler as a no-op
re-entry guard.

### 4. Front-end NAME row diverges from the real accessible name (17/99)
`getA11yName()` is a homegrown accName approximation:
- **Misses real names**: a link whose content is only `<img alt="…">` shows
  NAME "(none)" while Chrome computes the alt text (Newegg product link). The
  heuristic never looks at descendant `img[alt]`/`svg>title`.
- **Over-reports**: for roles that don't take a name from contents (`label`, `p`,
  plain `div`/`span`, `footer`) it falls back to `textContent`, so the panel shows a
  "name" where AT exposes none (12 of the 17 divergences). An annotator judging
  "missing accessible name" issues sees the tool contradict the page's real exposure.
- Cosmetic: text concatenation drops inter-element whitespace ("Woot!Deals…" vs
  "Woot! Deals…").
Fix direction: since `/ax-node` already returns Chrome's real `name`, display that
(with the heuristic only as instant placeholder), or extend the heuristic with
descendant-alt and a nameable-role gate.

### 5. Front-end ROLE/KEYBOARD gaps (13 + 2 of 99)
- `svg` displays as role "svg" — Chrome exposes `image`/graphics roles.
- `footer`/`header` always display `contentinfo`/`banner` — only correct when not
  scoped to `article`/`section`/`main` (Chrome: `sectionfooter`).
- `summary` shows "not focusable" (it is tabbable) — same root as the tab-order gap.
- Cosmetic label differences (fe `p` vs Chrome `paragraph`, `label` vs `LabelText`,
  `button` vs `DisclosureTriangle`) — same meaning, different vocabulary.

### 6. Annotation state machine: 2 defects (15/16 checks pass)
- **Export JSON has no page identifier.** Exports are arrays of
  `{element, confirmed, annotations}` named `a11y-<timestamp>.json` — in a 56-page
  study nothing records which page a file came from. Fix: include the page key (and
  per-element `liveXpath`) in the export envelope.
- **Confirmed-only annotations dead-click after reload.** The `ext-sel` handler tries
  `aid` and gives up without trying the provided xpath; error-tagged annotations
  survive only because the on-load tag re-application stamps the (deterministic) aid
  onto the element as a side effect — and that re-application loop skips annotations
  with `errors == {}`. Verified: confirm-without-category → reload → annotated-list
  click selects nothing. Fix: make `ext-sel` fall back to `d.xpath` when the aid
  doesn't resolve (mirroring the `tag` handler), or re-stamp aids for all
  annotations on load.

### 7. Server: nonexistent file yields a fabricated AX answer
`/ax-node?file=<missing>` navigates the engine to the server's own 404 page and
happily returns `{role:"none", speech:"document, Not found, …"}` instead of an
error/null. Harmless in the UI (it never requests missing files) but misleading for
tooling. Fix: have `getOrLoadPage` check existence (or the response status) first.

## Fixes applied + post-fix verification

All seven findings were fixed tool-side (no webpage modified) and every audit
re-run on the fixed toolkit:

| Metric | before | after |
|---|---|---|
| xpath round-trip failures (56 pages) | 3,015 on 22 pages | **0** |
| Tab-order entries hidden by ancestor | 4,843 / 12,593 (38%) | **0 / 7,998** |
| Tab-order zero-rect entries | 4,953 | 92 (all legit sr-only/clipped focusables) |
| Visible tabbables missing from tab order | 67 | **0** (10 reported are `tabindex="-1"` ad iframes — correctly excluded; audit-heuristic false positives) |
| Pages without instrumentation | 1 (NFL — `load` never fires) | **0** (NFL injects in 2 s via readiness poller) |
| Front-end ROLE vs Chrome AX | 86/99 | **104/104** |
| Front-end KEYBOARD vs Chrome AX | 97/99 | **103/104 → 104** (last case was `href=""` truthiness — fixed after the run) |
| Front-end NAME (heuristic level) | 82/99 | 86/104 † |
| Annotation state machine | 15/16 | **16/16** |
| Confirmed-only annotList click after reload | dead | **selects correctly** |
| `/ax-node` on missing file | fabricated 404-page answer | **null** (logged "asset not found") |

† The remaining heuristic NAME diffs are the placeholder-shows-page-text class;
the **UI now overwrites the NAME row with Chrome's real accessible name** once
`/ax-node` resolves — verified live in both directions (Rotten Tomatoes `<p>`
→ "(none)" with an explanatory tooltip carrying the page text; Wayfair social
link → "Facebook Icon", the real AX name, replacing the heuristic's aria-label
guess). The under-report class (link named only by descendant `img[alt]`) is
fixed at the heuristic level too (Newegg link now shows its product name).

What changed:
- `getXPath` (all 3 copies — INJECT_JS, server `querySROrder`, sampler): keep
  canonical case for non-HTML-namespace tags; `local-name()` is case-sensitive.
- `getTabOrder`: `el.checkVisibility()` (catches `display:none` ancestors);
  selector + filters extended with `summary` (first-of-details only),
  `audio/video[controls]`, `iframe`; `contenteditable="false"` excluded.
- `isFocusable`: same additions; `a[href=""]` now counts as focusable
  (attribute presence, not truthiness).
- `getRole`: `svg`→image, `a` without href→generic, `p`→paragraph,
  `footer`/`header` scoped inside `article/aside/main/nav/section`
  →sectionfooter/sectionheader.
- `getA11yName`: falls back to descendant `img[alt]`/`svg>title` before
  giving up (link-wrapping-image case).
- Iframe injection: refactored into idempotent `injectIntoFrame()` (guarded by
  the `data-a11y` root attribute) driven by BOTH the `load` event and a 500 ms
  readiness poller — pages whose `load` never fires still get instrumented.
- `ext-sel`: falls back to the provided xpath when the `aid` doesn't resolve.
- NAME row: replaced with Chrome's real AX `name` when the element is in the
  AX tree (decorative images keep their label).
- Export: `{page, exportedAt, elements}` envelope (`buildExport()`).
- Server: `getOrLoadPage` rejects nonexistent assets; signal handlers now call
  `process.exit()` after cleanup — previously a bare `process.on(SIGINT/SIGTERM)`
  handler **swallowed Ctrl-C/kill** and the server survived termination
  (found during verification, fixed and verified).

## Robustness results (no action needed)
- **Path security**: `/assets/..%2f..` → 403; encoded escape beyond app root → 403;
  `file=../../../etc/hosts` → null. (`/server.js` is served — any file under the app
  root is; fine for a localhost tool.)
- **Malformed xpath** (`///[`) → null, server stays healthy.
- **Cross-file cache race** (`PAGE_CACHE_MAX=1`): concurrent queries for two files —
  including a heavy page mid-speech-traversal — both completed correctly; worst
  case is a caught null speech, no wedging. Soft-404 referer scoping works
  (no referer → real 404; asset referer → empty 200).
- **Axe**: 56/56 pages scanned without error; all 1,409 violation node targets
  resolved to an aid (hover/click wiring intact).
- **mkId collisions**: none in ~150k xpaths — the 32-bit hash is fine at this scale.
- **Sample resolver**: the tag+name fallback never picked a wrong element on any
  page; no duplicate xpaths in `samples-saved.json`.
- **Memory during audit**: sawtooth 2–4.5 GB, one transient ~9 GB handoff spike when
  the audit's own annotator browser + engine both rendered heavy pages concurrently
  (audit-harness artifact; the production pairing is the user's own browser + engine,
  where the previous evict-before-load fix holds). No leak signature; everything
  returned to baseline.
