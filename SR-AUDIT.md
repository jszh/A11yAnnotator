# Screen-Reader Tool Audit — 120 elements, seed 42

Harness: `node scripts/sr-audit.js --count 120 --seed 42` (read-only; never modifies
pages). For each element sampled from `assets/samples-saved.json` it (1) establishes
ground truth in the **annotator iframe** (the offline/noscript environment users see),
(2) calls `/ax-node` and `/sr-order` exactly as the front end does, and (3) cross-checks
the SR tool's answers — including whether the prev/next nav-pill targets exist and are
visible in the iframe. Raw data: `/tmp/sr-audit.json`.

## Verdict summary (120 elements, 52 pages)

| Verdict | n | Meaning |
|---|---|---|
| Clean | 58 | speech + tree-presence + prev/next all correct and verified in-iframe |
| Nav-pill target hidden in iframe | 6 | tool data plausible, but a pill points at an element invisible to the user |
| Engine timeout | 23 | `/ax-node` & `/sr-order` hang ≥60 s → UI shows "…" → "(none)" / "error" |
| Engine can't resolve xpath | 19 | element visible in annotator; engine's copy of the page has a different DOM |
| Sample xpath never resolves (SVG) | 9 | sampler emits `/svg[1]`-style steps XPath can't match |
| **Speech describes a different element** | 4 | most dangerous: plausible but wrong info, silently |
| Engine says hidden, user sees it | 1 | |

**End-to-end the tool itself is sound**: on pages whose DOM matches between the two
environments, speech, role/name, reading order, pill clicks (selection moves to the
right element), the `end of …` semantics, and the 2-press confirm gate all behaved
correctly (58/120 fully clean, verified element-by-element).

## Root causes (tool bugs — no webpage is at fault)

### 1. The AX engine renders a different page than the annotator shows (≈46/120 affected)
`getOrLoadPage()` in server.js navigates its headless Chrome to
`/assets/<file>` **raw** — no `?offline=1`, no `&noscript=1`, no meta-refresh
stripping, and a 1280×800 viewport (annotator: offline CSP + noscript flags + 1920×1080).
Consequences observed:

- **13 noscript pages**: the engine runs the page JS the annotator deliberately
  disables. Zillow's script navigates the engine page away; Ashby/Snowflake and H&M
  hydration rewrite the DOM (xpaths shift); Quizlet re-opens its modal and re-applies
  `aria-hidden` to the whole page. Sampled xpaths then resolve to nothing — or worse,
  to a *different element at the same path*: the audit caught the H&M "Reviews [7]"
  button being announced as **"button, Description, 1 control, not expanded"**, with
  nav targets from the wrong accordion. Plausible, wrong, and silent.
- **Script pages aren't safe either**: with live network and no CSP, hydration
  succeeds in the engine where it's blocked in the annotator (Doomersion, Google
  Drive, Reebok, o11 …) — DOM indices shift the same way.
- **Hangs and wedging**: pages whose JS hangs without the offline CSP (Harvey/Ashby,
  Microsoft Store, r/teenagers, Gymshark, o11) block their tab for ≥60 s; worse, the
  hung loads wedge the **shared** engine browser — server log shows
  `Target.createTarget timed out` / `Target closed` — poisoning queries for *other*
  pages until restart. 23/120 queries timed out. (This is the exact failure family the
  annotator's offline mode was built to solve.)

**Fix direction** (tool-side): load engine pages through the same serving the iframe
uses — `?offline=1` + the page's `noscript` flag from pages.json — and add the crash
recovery the sampler already has.

### 2. Sampler emits XPath that cannot match SVG elements (59/1,109 samples; 9/120 here)
`scripts/sample-elements.js` `getXPath()` writes `/svg[1]`, `/path[9]`, … XPath 1.0
unprefixed steps never match namespaced (SVG) elements, so `document.evaluate` returns
null **everywhere** — the annotator's highlighter quietly compensates with its
elId/tag+name fallback (which is why highlights still "locate"), but `/ax-node` and
`/sr-order` resolve by xpath only → SPEECH "(none)" and SR "unavailable" for every
sampled SVG element, always. The annotator's own injected `getXPath` already handles
this (`/*[local-name()='svg'][1]` — the 2 hand-added mock-chart samples use it and
work). Fix: port that branch into the sampler and re-sample; optionally give the SR
endpoints the same elId fallback the highlighter has.

### 3. The virtual SR reads `<noscript>` raw markup as page content (37/56 pages exposed)
Reported in the field (Amazon home: from the footer copyright, the "next" pill is the
`<img …fls-na.amazon.com…noscript…>` tracking pixel with the *entire element's markup*
as its speech) and fully reproduced. Mechanism:

- With scripting enabled, the parser stores a `<noscript>`'s children as **one raw
  text node** — its `textContent` is literally `<img height="1" … />`.
- Chrome computes such `<noscript>` elements as `display:inline / visibility:visible`,
  but never paints them (element and text rects are 0×0), and its **real accessibility
  tree excludes them** (`ignored: true, reason: notRendered`) — a real screen reader
  never announces them.
- guidepup's virtual screen reader builds its own tree from the DOM and prunes by
  *computed style only* — inline/visible passes, so the raw-markup text node becomes a
  navigable reading-order stop. `/sr-order` then returns it as prev/next (xpath of the
  `<noscript>`), and its spoken phrase is the raw markup. Clicking the pill selects an
  element that is invisible in the iframe.

Verified walk (engine environment, Amazon home): `vsr.next()` from the document start
lands on the nav-styles `<noscript>` and speaks `<style type="text/css"><!-- #navbar …`.
37 of the 56 saved pages contain `<noscript>` blocks (GTM/tracking pixels — typically
at page top and footer, which is why the copyright→pixel case surfaces). This bug is
**independent of the environment mismatch** (#1): it reproduces even where the engine
and annotator DOMs agree. Tool-side fix direction: in `querySROrder`/`querySpeechOnly`,
skip any VSR step whose node has a `noscript` ancestor (precise and safe — unlike a
generic zero-rect filter, it can't swallow legitimate sr-only content). The earlier
audit's "Amazon Sign-In: prev pill → hidden `<noscript>`" case is this same bug.

### 4. Nav pills can target elements the user can't see (6/120)
`/sr-order` returns whatever neighbors the engine's VSR finds — including elements
that are hidden in the annotator iframe (carousel clones, `<noscript>` fallback
content, map iframes, off-screen inputs). Clicking such a pill "selects" an invisible
element: no visible highlight moves, the panel shows properties for something the user
cannot find. With cause #1 fixed most of these disappear; a residual guard would be
for the front end to verify the pill xpath resolves & is visible in the iframe before
rendering it as clickable.

### 5. Small server-side gaps
- `BARE_ROLES` (speech fallback) is missing `emphasis` (and `strong`): an `<em>`
  speaks as the bare word "emphasis" instead of falling back to its text.
- `REASON_LABELS` doesn't map the CDP reason names actually emitted (`uninteresting`,
  `emptyAlt`) — raw internals leak into the tree-pill tooltip.
- Speech shows only the **first** spoken phrase for elements whose text spans multiple
  nodes (e.g. "Stream millions" for "Stream millions / of songs").

## Post-fix verification (re-audit, seed 42, 107 elements captured)

All identified issues were fixed **tool-side** (no webpage was modified) and the audit
re-run on freshly re-sampled data:

| Verdict | before (120) | after (107) |
|---|---|---|
| Clean | 58 (48%) | **103 (96%)** |
| Sample xpath unresolvable (SVG) | 9 | **0** |
| Engine timeout | 23 | **0** |
| Engine can't resolve xpath | 19 | **0** |
| Engine says hidden / user sees it | 1 | **0** |
| Speech describes different element | 4 | **1** † |
| Nav-pill target hidden in iframe | 6 | **3** ‡ |

† The single remaining "mismatch" is the tool being *right*: Blue Apron's
"Add to cart" button has `name: None` in Chrome's AX tree (its label isn't exposed to
AT), so "button" is exactly what a real SR announces — a genuine page a11y defect the
study should capture.
‡ All three are visually-hidden-but-SR-relevant patterns (an sr-only checkbox input,
an image-map `<area>`, a collapsed nav) — real screen readers do reach focusable
sr-only controls, so these are audit-heuristic false positives more than tool bugs.

Fixes applied: engine loads pages via the annotator's offline/noscript serving;
sampler emits `local-name()` xpaths for SVG (+ full re-sample, identical stats);
VSR skips `<noscript>` subtrees; nearest-preceding-focusable positioning strategy
(footer elements on huge pages now resolve); traversal caps raised with time budgets;
`BARE_ROLES`/`REASON_LABELS` completed; multi-phrase speech; front-end pill guard
dims unresolvable nav targets.

### Robustness re-validation (seed 7, 120 fresh elements)
A second run on 120 elements **disjoint from the first sample** (`--exclude` the prior
run's elements, seed 7; 46 pages): **113/120 clean (94%)** — zero timeouts, zero
unresolvable xpaths, zero SVG failures, zero wrong-element speech. The only flagged
class (7× "nav-pill target hidden") is the same boundary pattern as before: sr-only
headings (WSO "Footer menu"), offscreen flyout menus, and animation/carousel states
that are hidden by the audit's *CSS visibility* heuristic but legitimately exposed to
AT under AX rules (opacity-0/offscreen/clip content is still announced by real screen
readers). Memory: peak 6.6 GB (under the 8 GB ceiling; evict-before-load eliminated
the previous 8.6 GB handoff spikes), mean 2.9 GB, node processes flat — no leak
signature across either run.

### Memory hardening (found during verification)
The audit exposed three resource leaks, all fixed: (1) the engine's page cache never
closed tabs — now LRU-capped at 1 with **evict-before-load** ordering (heavy snapshots
hold 500+ MB renderers; overlapping old+new caused multi-GB spikes); (2) the audit
harness now recycles its browser every 6 pages (puppeteer accumulates detached-frame
state across many iframe navigations); (3) Notion's snapshot runs a Splunk telemetry
logger in an infinite instant-retry loop under offline CSP (~25k blocked requests/s,
≈40k console entries/s — heap +5 MB/s and a CDP event firehose into every attached
client). Two serving-level guards now protect **all** offline pages and subframes: a
console cap (2,000 messages) and an off-origin retry-loop damper (after 25 attempts to
one URL, further requests return a forever-pending promise; the first 25 keep normal
failure semantics). Measured on Notion: 4.0 M console events → 246; heap 470 MB and
climbing → flat 18 MB; page renders identically (20/20 highlights).

## Non-bugs worth knowing
- AX names reflect CSS `text-transform` ("HELP" for `Help`) — spec-correct.
- "end of link/listitem …" pills pointing back at the enclosing element are correct VSR
  semantics; the front end's `endOf` hint handles them.
- The confirm gate credits the element you navigate **from** and persists on its
  annotation — two presses then jump back unlocks Confirm, as designed.
- An empty-`alt` image being unreachable by SR navigation ("unavailable") is correct
  screen-reader behavior, though the label could explain *why*.
