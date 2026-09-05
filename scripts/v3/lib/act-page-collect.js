'use strict';
// Decoupled ACT-page collector: navigate `page` to `url` and extract the v3 element inventory orchestrate()
// needs. This is the SAME proven collection logic run-v3-act-suite.js uses inline (the page.evaluate body is
// copied verbatim), lifted into a parameterized function (url/elementCap/ids as args, no module-level argv
// coupling) so a parallel runner can reuse it offline (file://) without inheriting the suite's flag parsing.
const crypto = require('crypto');
const { collectTables } = require('./collect-tables.js'); // Tier-0 #4: per-<table> relationship facts for 1.3.1
const { collectLists } = require('./collect-lists.js');   // TT gap G1: per-list semantics (1.3.1 / TT 10.D)
const { collectColourPeers, collectFieldColourState, collectTextContrastFacts } = require('./collect-colour-peers.js'); // residual RCA S6/S10: 1.4.1 colour-coded peer groups + per-field resolved colour/state; + the resolved fg/backdrop the `contrast` signal is built from
const { collectFauxColumns } = require('./collect-faux-columns.js');  // residual RCA S7: 1.3.1 F34 whitespace-formatted columns
const { collectErrorSummary, collectAtRestErrorState } = require('./collect-error-summary.js'); // residual RCA S8: 3.3.1 error-summary vs flagged-state coherence
const { collectStylingOutliers } = require('./collect-styling-outliers.js'); // residual RCA S8: 1.3.1 F2 presentation-as-meaning (strike-through / small-caps)
const { collectLinkTargetFacts } = require('./collect-link-facts.js'); // residual RCA S10: 2.4.4 DOM-resolved fragment targets + per-link href facts
const { probeVisualStructureDiscovery } = require('./broad-scope-probes.js'); // residual RCA S10: per-case visual-structure discovery (1.3.1 styled non-semantic headings)

function digestForUrl(url) {
  return 'sha256:url:' + crypto.createHash('sha256').update(String(url)).digest('hex');
}

// #11 fix — a caller (e.g. a corpus eval harness whose GT record names a specific `target.selector`) may pass a
// single CSS selector string OR an array of them (the shape `testcases.json`'s `target.selector` field actually
// takes). `element.matches()` accepts a single comma-combined selector list natively, so join an array with ','.
// Returns null (⇒ matchesTarget stays undefined for every element, byte-identical to before this fix) for
// anything falsy/empty.
function normalizeTargetSelectors(sel) {
  if (!sel) return null;
  if (Array.isArray(sel)) { const joined = sel.filter((s) => typeof s === 'string' && s.trim()).join(', '); return joined || null; }
  return typeof sel === 'string' && sel.trim() ? sel : null;
}

function nativeRole(tag, type, href) {
  tag = String(tag || '').toLowerCase();
  type = String(type || '').toLowerCase();
  if (tag === 'a' && href) return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'img') return 'img';
  if (/^h[1-6]$/.test(tag)) return 'heading';
  if (tag === 'input') {
    if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button'; // input[type=image] is a button (+ graphic), not a textbox
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'range') return 'slider';
    return 'textbox';
  }
  return '';
}

// Navigate + extract. `opts`: { url, elementCap=80, file, runId, sourceUrl, pageDigest, settleMs=250, now,
//   xpaths }. `xpaths` (optional): a PRE-SELECTED element subset (saved pages) — when given, collect EXACTLY those
//   top-document elements (no body scan, no inclusion filter, no element cap, no visibility filter); the 80-cap
//   then does not apply and `collect.coverage.subset` is true.
// Returns the collect artifact (file/sourceUrl/runId/pageDigest/collectedAt/elements/...).
async function collectActPage(page, opts = {}) {
  const url = opts.url;
  const elementCap = Number.isFinite(opts.elementCap) ? opts.elementCap : 80;
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await new Promise((r) => setTimeout(r, Number.isFinite(opts.settleMs) ? opts.settleMs : 250));
  // #9 (round-3 overfit audit) — AUTO-UPDATING TEXT observation window (SC 2.2.2, second clause). A JS
  // setInterval ticker that rewrites an element's TEXT forever trips NEITHER autoMotion (keyframes/marquee/
  // autoplay only) NOR autoUpdatingContent (carousel-library data-ride markers only) — a real 2.2.2 barrier
  // class with no signal. Install a MutationObserver NOW (before the main inventory evaluate) and HARVEST it
  // after the CDP/tables/lists passes below, so most of the window OVERLAPS work we already do and collection
  // barely slows. Counted per element: mutation events whose textContent actually CHANGED (characterData or
  // childList text swaps); >=2 changes within the window = RECURRING (a one-shot update never qualifies).
  // WINDOW SIZE: with the >=2-swap floor, a period-p ticker needs a window >= ~2p to qualify deterministically.
  // 6500ms covers periods up to ~3.2s — which includes the audit finding's own motivating case, a 3s stock
  // ticker. (The adversarial review caught the original 2400ms default: it could only ever see sub-1.2s
  // tickers, and the recall test had been fitted to that window with a 600ms fixture — the exact overfit class
  // this audit hunts.) Slower tickers stay out of this deterministic signal's scope — a bounded observation
  // cannot prove "forever" — and remain the vision/rubric lane's to judge. Unit tests that don't exercise the
  // window pass opts.autoUpdateWindowMs=0 to skip the wait; production callers accept the tail (most of it
  // overlaps the CDP/tables/lists passes on real pages).
  const autoUpdateWindowMs = Number.isFinite(opts.autoUpdateWindowMs) ? opts.autoUpdateWindowMs : 6500;
  if (autoUpdateWindowMs > 0) {
    await page.evaluate(() => {
      try {
        const state = { t0: Date.now(), hits: new Map() };
        const bump = (node) => {
          const el = node && (node.nodeType === 1 ? node : node.parentElement);
          if (!el) return;
          if (state.hits.size > 400 && !state.hits.has(el)) return; // bound memory on mutation-storm pages
          const rec = state.hits.get(el) || { n: 0, lastText: null };
          const now = el.textContent || '';
          // the FIRST mutation counts (the observer only fires on a real DOM change and we have no pre-state);
          // after that, count only mutations whose resulting text actually DIFFERS (a same-text rewrite — e.g.
          // setInterval re-assigning identical text — is not a visible update and must not accumulate).
          if (rec.lastText === null || now !== rec.lastText) { rec.n++; rec.lastText = now; }
          state.hits.set(el, rec);
        };
        state.mo = new MutationObserver((muts) => { for (const m of muts) bump(m.target); });
        state.mo.observe(document.body || document.documentElement, { subtree: true, childList: true, characterData: true });
        window.__v3AutoUpdObs = state;
      } catch (e) { /* observer unavailable ⇒ autoUpdatingText degrades to absent (never throws) */ }
    }).catch(() => {});
  }
  const collectedAt = Number.isFinite(opts.now) ? opts.now : Date.now();
  const pageDigest = opts.pageDigest || digestForUrl(opts.sourceUrl || url);
  const data = await page.evaluate((cap, subsetXpaths, targetSelectors) => {
    // ── SHADOW-PROOF element-children read. `HTMLFormElement` has a NAMED GETTER: every control's name/id
    //    becomes an OWN property of the form, and an own property shadows ANY inherited accessor. So
    //    `<form><input name="children"></form>` makes `form.children` the INPUT — spreading it throws
    //    "p.children is not iterable" (this crashed the real suite on
    //    eval/act-augmented/1.4.1/pages/error-validation-color-only/case-05.html) and `.length === 0` reads
    //    `undefined === 0` ⇒ false, silently disabling the check. MEASURED in Chromium: `childNodes` is
    //    shadowable too (`<input name="childNodes">` ⇒ `form.childNodes` is the INPUT, and a plain
    //    `filter.call(form.childNodes, …)` then returns [] — wrong, and silent). Calling Node.prototype's
    //    getter DIRECTLY bypasses own-property lookup entirely, so no control name can corrupt it, and
    //    `Array.prototype.filter.call` never consults Symbol.iterator. INLINED per file on purpose: every
    //    function here serializes through page.evaluate and cannot close over module scope (a require()
    //    would throw at runtime in the page). ──────────────────────────────────────────────────────────────
    const _CHILD_NODES_GET = (Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes') || {}).get;
    const childNodesOf = (e) => (!e ? [] : (_CHILD_NODES_GET ? _CHILD_NODES_GET.call(e) : (e.childNodes || [])));
    const elemChildren = (e) => Array.prototype.filter.call(childNodesOf(e), (n) => n.nodeType === 1);
    // #11 fix (scorer precision): when the caller supplies the TT test record's OWN target selector(s) (a CSS
    // selector, comma-combined `element.matches()` handles a list natively), tag each collected element with
    // whether it's actually the element this specific test is about. `run-trusted-tester.js`'s scorer used to
    // match a test record to obligations/verdicts by SC alone (WCAG success criterion), which pulled in ANY
    // finding anywhere on the page under that SC — e.g. an unrelated missing-label textbox on the SAME page
    // silently counted as a false positive against a test record that was actually about list markup. Computed
    // here (collection time, live page) rather than at scoring time, since matching requires a real DOM query.
    const matchesTarget = (el) => {
      if (!targetSelectors) return undefined; // no selector supplied ⇒ scorer falls back to its old SC-only behavior
      try { return el.matches(targetSelectors); } catch (e) { return undefined; } // an invalid/unsupported selector degrades to "unknown", never a false negative
    };
    function nativeRoleInPage(tag, type, href) {
      tag = String(tag || '').toLowerCase();
      type = String(type || '').toLowerCase();
      if (tag === 'a' && href) return 'link';
      if (tag === 'button') return 'button';
      if (tag === 'select') return 'combobox';
      if (tag === 'textarea') return 'textbox';
      if (tag === 'img') return 'img';
      if (/^h[1-6]$/.test(tag)) return 'heading';
      if (tag === 'input') {
        if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button'; // input[type=image] is a button (+graphic)
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        return 'textbox';
      }
      return '';
    }
    function xpathOf(e) {
      if (!e || !e.tagName) return '';
      if (e === document.documentElement) return '/html';
      // #10c fix: `document.body` is SPEC-DEFINED to return the <frameset> element when the document has no
      // real <body> (a legacy HTML4 frameset page, e.g. every DHS Trusted-Tester exam page). Blindly emitting
      // the literal string '/html/body' here for a <frameset> element produces an xpath that does not exist in
      // the actual DOM — document.evaluate('/html/body/...') then finds NOTHING, silently killing vision/CDP
      // resolution for every frame/element on the page. Only take the fast-path literal when `e` truly IS a
      // <body> tag; a <frameset> falls through to the generic tag-based computation below (→ '/html/frameset').
      if (e === document.body && e.tagName === 'BODY') return '/html/body';
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
    }
    function visible(el) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') !== 0
        && r.width > 0 && r.height > 0;
    }
    // 4.1.3 LIVE-REGION SHAPE — a status container is EXPECTED to be empty (and is often hidden) at rest;
    // it is populated later, which is the whole announcement mechanism. `visible()` requires width>0 &&
    // height>0, so an at-rest-empty region was dropped by the element-loop visibility skip ~170 lines before
    // the `liveRegion` fact is computed — the fact's own comment ("Kept even when empty") described an
    // intent the code never reached. That silently removed the ONLY element that can carry the
    // status-message obligation, so 4.1.3 scored `noObligation` purely on resting CSS geometry.
    // aria-hidden regions are still excluded: they are outside the a11y tree and can never announce.
    function liveRegionShape(el) {
      const al = (el.getAttribute('aria-live') || '').toLowerCase();
      const ra = el.getAttribute('role') || '';
      if (!(al === 'polite' || al === 'assertive' || /^(status|alert|log|progressbar|marquee|timer)$/.test(ra))) return false;
      return el.getAttribute('aria-hidden') !== 'true';
    }
    // 4.1.3 MUTED live-region wiring (batch-3 item 12, wrong-live-region-politeness case-01). The carve-out
    // above admits only a GENUINELY live region; an element wired like one but silenced to AT — aria-live
    // with any other value ("off"/invalid), or aria-atomic/aria-relevant with no live semantics — is the
    // exact anti-pattern the oracle's mutedLiveRegionShape mints status-message for, and it shares the live
    // region's resting geometry (empty, often opacity:0), so the visibility skip dropped it before the
    // oracle could ever see its ariaAttrs. Admit the muted shape too; aria-hidden stays excluded (outside
    // the a11y tree, it can never announce and its muteness is not the 4.1.3 question).
    function mutedLiveRegionWiring(el) {
      if (liveRegionShape(el)) return false;             // a real live region rides the carve-out above
      if (el.getAttribute('aria-hidden') === 'true') return false;
      return el.hasAttribute('aria-live') || el.hasAttribute('aria-atomic') || el.hasAttribute('aria-relevant');
    }
    // 1.1.1/2.4.4 <area href> — an image-map area has a 0×0 client rect in Chrome, so the element-loop
    // visibility skip dropped every one before the oracle's area branch could enumerate it (RCA s10: an
    // image map's five region links scored no obligation at all). An area is RENDERED exactly when its
    // owning <map name> is wired to a VISIBLE <img usemap> — admit that, and only that; an area in an
    // unreferenced map stays inert content, and an area with no href owns nothing either way.
    function renderedAreaShape(el) {
      if (el.tagName.toLowerCase() !== 'area' || !el.hasAttribute('href')) return false;
      const map = el.closest('map');
      const name = map && map.getAttribute('name');
      if (!name) return false;
      const img = document.querySelector('img[usemap="#' + (window.CSS && CSS.escape ? CSS.escape(name) : name.replace(/["\\]/g, '\\$&')) + '"]');
      return !!img && visible(img);
    }
    function textOf(el) { return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function focusableByMarkup(el) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-hidden') === 'true') return false;
      const tag = el.tagName.toLowerCase();
      if (el.tabIndex >= 0) return true;
      if (tag === 'a' && el.hasAttribute('href')) return true;
      return ['button', 'input', 'select', 'textarea', 'summary'].includes(tag);
    }
    function fieldLike(el) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      return ['input', 'select', 'textarea'].includes(tag) || /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/.test(role);
    }
    // ── TT gaps G2/G3: shared, self-contained signal helpers (R2 G2-1 parity + G3-2 in-frame). Used by BOTH the
    //    top-level loop and the same-origin in-frame loop so they compute IDENTICAL bg-meaning / captcha facts, and
    //    kept operand-for-operand aligned with eval-page.js's gate. Each reads only `el` (+ its own document/view),
    //    so it is correct whether `el` lives in the top document or a same-origin frame. ──────────────────────────
    function _view(el) { return (el.ownerDocument && el.ownerDocument.defaultView) || window; }
    // UNIFIED interactivity predicate (identical set to eval-page.js `_interactiveLocal`): native interactive tags,
    // interactive ARIA roles INCLUDING option/spinbutton/textbox/combobox/searchbox, a non-negative tabindex, or
    // onclick. The old top-level `isInteractive` omitted onclick/tabindex/option/spinbutton/textbox/searchbox, so a
    // bg control of those shapes was dropped on the ACT path but kept on eval-page (R2 G2-1).
    function _bgInteractive(el) {
      const tg = el.tagName.toLowerCase();
      const role = (el.getAttribute('role') || '').toLowerCase();
      const ti = el.getAttribute('tabindex');
      return ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(tg)
        || ['link', 'button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'checkbox', 'radio', 'switch', 'slider', 'textbox', 'combobox', 'searchbox', 'option', 'spinbutton'].includes(role)
        || (ti !== null && +ti >= 0) || el.hasAttribute('onclick');
    }
    // ── BG-MEANING GEOMETRY / COHORT helpers (F3 aperture). Shared by the top-level gate and the in-frame
    //    `_bgMeaningful` so the two paths cannot drift apart again. Each reads only `el` + its own view. ──────
    const _bgUrlOf = (el) => { const b = _view(el).getComputedStyle(el).backgroundImage || ''; return /url\(/i.test(b) ? ((b.match(/url\(["']?([^"')]+)["']?\)/i) || [])[1] || 'other') : 'none'; };
    // TRACKING-PIXEL FLOOR. Was `>= 16` in both dimensions, which is not a tracking-pixel floor at all — it is
    // above the size of a real informational glyph. A required-field asterisk painted as a background on an
    // empty 12x12 <span> (informative-css-background-image/case-03) is exactly the F3 shape and was silently
    // dropped by it. 8px is the smallest dimension at which a glyph is legible at all, and still 4x a 1x1
    // tracking pixel / 2x a 4px spacer. MEASURED held-out over 3562 corpus pages: 8 / 6 / 4 / area>=64 are
    // indistinguishable in aperture, so the value is not fitted to the 12px fixture; 8 is chosen because,
    // unlike an area floor, it also rejects hairline 4xN divider images (the classic decorative background).
    const _BG_MIN_PX = 8;
    // A DISCRETE MARK vs the element's own surface: a non-repeating background given an EXPLICIT pixel size
    // that paints a small fraction of the box and does not reach its edges — i.e. an icon/badge the author
    // placed ON the control, not a texture/photo/hero filling it. This is the second way F3's "the image
    // carries information the text does not" shape appears: the canonical book-distributor markup sets the
    // image BESIDE the text in reserved padding, but a seat-map exit-row badge
    // (informative-css-background-image/case-06) sits OVER a 46x46 control that declares no padding at all.
    // Only explicit `<len>px <len>px` sizes qualify. MEASURED computed forms in Chromium: `background-size:14px`
    // stays `14px` (one token — the height is `auto`, i.e. the intrinsic aspect ratio), `14px 14px` and the
    // shorthand `.../14px 14px` both give `14px 14px`, `contain` stays `contain`. The one-token, `auto`, `cover`
    // and `contain` forms all need the image's INTRINSIC size, which is not synchronously readable here — so
    // they stay OUT rather than being guessed. That is a known recall gap in this branch, not an oversight: an
    // author who writes `background-size:14px` for a badge is not nominated. Widening to a width-only fraction
    // was not shipped because it was not measured.
    function _bgDiscreteMark(el, box) {
      const cs = _view(el).getComputedStyle(el);
      if (!/no-repeat/i.test(cs.backgroundRepeat || '')) return false;
      const m = (cs.backgroundSize || '').trim().match(/^([\d.]+)px\s+([\d.]+)px$/);
      if (!m) return false;
      const iw = parseFloat(m[1]), ih = parseFloat(m[2]);
      if (!(iw > 0 && ih > 0 && box.width > 0 && box.height > 0)) return false;
      return (iw * ih) <= box.width * box.height * 0.35 && iw <= box.width - 6 && ih <= box.height - 6;
    }
    // The image sits in space RESERVED for it beside the text (F3's own markup): no-repeat + real padding.
    function _bgReservedArea(el) {
      const cs = _view(el).getComputedStyle(el);
      if (!/no-repeat/i.test(cs.backgroundRepeat || '')) return false;
      const pads = [cs.paddingLeft, cs.paddingRight, cs.paddingTop, cs.paddingBottom].map((v) => parseFloat(v) || 0);
      return Math.max.apply(null, pads) >= 12;
    }
    // DIRECT-SIBLING cohort (unchanged): among 3+ same-tag siblings the backgrounds are not all identical.
    function _bgPeersDirect(el) {
      const p = el.parentElement; if (!p) return false;
      const sibs = elemChildren(p).filter((c) => c.tagName === el.tagName);
      if (sibs.length < 3) return false;
      return new Set(sibs.map(_bgUrlOf)).size >= 2;
    }
    // NEARBY cohort — the direct-sibling scope is too narrow for a GRID. In case-06 every seat in an exit ROW
    // carries the same badge, so at sibling scope the row looks uniform and the distinction (this row vs the
    // other rows) is invisible; one level up, the cabin's 16 seats carry two distinct backgrounds. Walk at
    // most 3 ancestors and compare only same-tag elements at the SAME DOM DEPTH, so the cohort stays a
    // structural peer set (the seats of a cabin) and never degrades into "every <button> on the page".
    function _bgPeersNearby(el) {
      const depthOf = (n) => { let d = 0; for (let q = n.parentElement; q; q = q.parentElement) d++; return d; };
      const mine = depthOf(el);
      let lvl = 0;
      for (let p = el.parentElement; p && lvl < 3; p = p.parentElement, lvl++) {
        let cohort;
        try { cohort = [...p.querySelectorAll(el.tagName)].slice(0, 300).filter((c) => depthOf(c) === mine); } catch (e) { return false; }
        if (cohort.length < 3) continue;
        if (new Set(cohort.map(_bgUrlOf)).size >= 2) return true;
      }
      return false;
    }
    // TEXT-BEARING CARVE-OUT (residual RCA S6, widened). `text.length === 0` excluded ALL THREE of F3's own
    // examples: the technique's book-distributor case puts new.png / limited.png / instock.png as BACKGROUNDS
    // on list entries that carry the book titles as text, and the image is the only thing saying which books
    // are new. Two bounded shapes re-admit a text-bearing element without flooding on icon-bulleted lists —
    // in BOTH the image must also DISTINGUISH this element from its peers, so a decorative bullet repeated
    // identically on every row is still excluded:
    //   · BESIDE the text in reserved padding, distinguishing among DIRECT siblings (F3's own markup); or
    //   · BADGED OVER the element as a small discrete mark, distinguishing within the NEARBY cohort.
    // The two branches are deliberately additive rather than merged into one `(reserved||mark) && nearby`:
    // that variant measures identically on the corpus but would also loosen the already-shipped reserved-area
    // branch from siblings to the ancestor walk, changing a lane that is working. Dropping the peer gate from
    // the badge branch was measured too: same page count but 58 elements instead of 56, the two extra being on
    // an unrelated 2.4.4 page — the cohort gate is what keeps this honest.
    // HELD-OUT APERTURE, 3562 pages (eval/act-augmented 926 + its 967-page _archive + the 602-case ACT subset
    // + eval/capability-tests 958 + act-rules 90 + wai 19), whole predicate, any element:
    //   before  14 pages (0.39%) / 40 elements      after  18 pages (0.51%) / 56 elements
    // The ACT subset is UNMOVED (3 pages / 3 elements before and after), which is why the deterministic
    // 581-case gate can stay byte-identical through this change.
    function _bgTextCarveOk(el, box, text) {
      if (!(text && text.length)) return true;
      return (_bgReservedArea(el) && _bgPeersDirect(el)) || (_bgDiscreteMark(el, box) && _bgPeersNearby(el));
    }
    // TIGHTENED captcha detection (R2 G3-1): provider-specific (data-sitekey / provider src / g-recaptcha|h-captcha|
    // cf-turnstile) OR captcha/turnstile as a LEADING token segment (captcha-box, recaptcha-container) — NOT a buried
    // substring (no-captcha-needed-badge), and a `title` counts ONLY on an iframe (a provider widget frame), never
    // prose on a <p title="What is a CAPTCHA?">.
    function _isCaptchaEl(el) {
      if (el.hasAttribute('data-sitekey')) return true;
      if (/recaptcha|hcaptcha|captcha|turnstile/.test((el.getAttribute('src') || '').toLowerCase())) return true;
      const tok = (s) => (s || '').toLowerCase().split(/\s+/).some((t) => /^(g-recaptcha|h-captcha|cf-turnstile|(re|h)?captcha|turnstile)(-|$)/.test(t));
      if (tok(el.getAttribute('class')) || tok(el.getAttribute('id'))) return true;
      if (el.tagName.toLowerCase() === 'iframe' && /captcha|turnstile/.test((el.getAttribute('title') || '').toLowerCase())) return true;
      return false;
    }
    // bg-meaning nomination computed from `el` + its rendered box. Mirrors the top-level inline gate; used by the
    // in-frame loop (R2 G3-2). Returns { meaningful, url }.
    function _bgMeaningful(el, box) {
      const win = _view(el);
      const bgi = win.getComputedStyle(el).backgroundImage || '';
      if (!/url\(/i.test(bgi)) return { meaningful: false, url: null };
      const tg = el.tagName.toLowerCase();
      const roleA = (el.getAttribute('role') || '').toLowerCase();
      const hidden = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');
      const pres = roleA === 'presentation' || roleA === 'none';
      const isImg = tg === 'img' || tg === 'svg' || tg === 'canvas' || roleA === 'img' || (tg === 'input' && (el.getAttribute('type') || '').toLowerCase() === 'image');
      if (hidden || pres || isImg || !(box.width > 0 && box.height > 0)) return { meaningful: false, url: null };
      const lbl = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((id) => { const t = el.ownerDocument.getElementById(id); return t ? (t.textContent || '') : ''; }).join(' ');
      const accName = ((tg === 'img' ? (el.getAttribute('alt') || '') : '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + lbl + ' ' + (el.getAttribute('title') || '')).trim();
      // PARITY (was a silent divergence): the top-level gate got the S6 text carve-out and this in-frame twin
      // did not, so `any text at all ⇒ not meaningful` still held inside same-origin frames. Both now call the
      // one `_bgTextCarveOk`, and both use `_BG_MIN_PX`, so the two paths cannot drift again.
      if (accName.length) return { meaningful: false, url: null };
      if (!_bgTextCarveOk(el, box, (el.textContent || '').trim())) return { meaningful: false, url: null };
      const vw = win.innerWidth || 1280, vh = win.innerHeight || 800;
      const fullBleed = box.width >= vw * 0.8 && box.height >= vh * 0.5;
      const candidate = box.width >= _BG_MIN_PX && box.height >= _BG_MIN_PX && !fullBleed;
      const meaningful = _bgInteractive(el) || candidate;
      return { meaningful, url: meaningful ? ((bgi.match(/url\(["']?([^"')]+)["']?\)/i) || [])[1] || null) : null };
    }
    // ROLES whose accessible NAME may come from the element's own CONTENTS (ARIA "name from author/contents").
    // Gated so a region/group/textbox/combobox is NOT spuriously named by descendant text.
    const NFC_ROLES = /^(button|link|menuitem|menuitemcheckbox|menuitemradio|option|tab|treeitem|checkbox|radio|switch|heading|cell|gridcell|columnheader|rowheader|row|tooltip)$/;
    function labelledText(el, role) {
      const bits = [];
      // #10f fix: this function is ALSO called on in-frame elements (the frame-traversal loop below passes an
      // `el`/`h` living in a CHILD frame's document, e.g. `name: labelledText(el, sampledRole)`). The bare
      // `document` global here is ALWAYS the TOP document, never the frame's — so `document.getElementById`
      // and `document.querySelectorAll` silently found NOTHING for an in-frame field's own `aria-labelledby`
      // target or `<label for>` (both live in the frame's OWN document, not the top one), losing a REAL,
      // correctly-authored accessible name. Confirmed live on a real DHS Trusted-Tester page (401807-3,
      // frame-main.html): every form field has a proper `<label class="form__label" for="...">` matching its
      // input id, yet the collected axName came back empty for them — `el.closest('label')` below still
      // worked (closest() searches the element's OWN document tree regardless of which global `document` is
      // in scope), masking the bug for wrapped-label markup while explicit `for`-association silently broke.
      // `el.ownerDocument` is ALWAYS the document that actually owns `el` — correct for a top-doc element too.
      const doc = el.ownerDocument || document;
      const aria = el.getAttribute('aria-label');
      if (aria) bits.push(aria);
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      for (const id of ids) {
        const n = doc.getElementById(id);
        if (n) bits.push(textOf(n));
      }
      if (el.id) {
        for (const l of doc.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`)) bits.push(textOf(l));
      }
      const p = el.closest('label');
      if (p) bits.push(textOf(p));
      const alt = el.getAttribute('alt');
      if (alt) bits.push(alt);
      const title = el.getAttribute('title');
      if (title) bits.push(title);
      // S1 (RCA R1): an AUTHOR name (aria-label/labelledby/label/alt/title) WINS and is returned as-is — never
      // append contents (no "Save Delete permanently" frankenname). ONLY when there is no author name do we fall
      // back to NAME-FROM-CONTENTS (or, for push-button inputs, the `value`), and ONLY for roles that take it.
      // This mirrors Chrome's computed accname (verified: <a>Workshop</a>→"Workshop", <button>New file</button>→
      // "New file", <svg><a><text>Go→"Go", but role=menu/region/textbox stay ""), fixing the empty-name FP storm
      // without the textOf-everywhere pitfalls. The previous attribute-only name is what made text-named controls
      // read as present:false and trip the "absence IS the barrier" steer.
      const authored = bits.join(' ').replace(/\s+/g, ' ').trim();
      if (authored) return authored;
      // push-button inputs take their name from `value`. The UA-DEFAULT name for a VALUELESS submit/reset
      // ("Submit"/"Reset", which is LOCALE-specific) is supplied by the authoritative CDP name on the common
      // path — this degraded fallback deliberately does NOT hard-code English default strings.
      if (el.tagName === 'INPUT' && /^(submit|reset|button)$/i.test(el.getAttribute('type') || '')) {
        return (el.getAttribute('value') || '').replace(/\s+/g, ' ').trim();
      }
      if (NFC_ROLES.test(role || '')) return textOf(el);
      return '';
    }
    // ITEM 9 — un-dead the 1.4.13 (content-on-hover) + 2.4.11 (focus-not-obscured) families (rubrics + state-pair
    // captures already exist; only these two collector fields were hardcoded false). Computed ONCE per page:
    //   underOverlay: a TOP-ANCHORED sticky/fixed overlay (header/consent layer) wide+tall enough to obscure —
    //     a focusable in the content area BELOW it (and horizontally overlapping) can scroll UNDER it (gate on a
    //     DETECTED overlay, not every page with a header). hasHoverContent: the element plausibly reveals NEW
    //     content on hover/focus. Native `title` is EXEMPT per the rubric, so a bare title is NOT flagged.
    const _overlays = [];
    for (const o of document.querySelectorAll('body *')) {
      const ocs = getComputedStyle(o);
      if (ocs.position !== 'fixed' && ocs.position !== 'sticky') continue;
      if (ocs.display === 'none' || ocs.visibility === 'hidden' || parseFloat(ocs.opacity) === 0) continue;
      const orc = o.getBoundingClientRect();
      if (orc.width < window.innerWidth * 0.5 || orc.height < 16 || orc.top > 8) continue; // wide + tall + top-anchored
      _overlays.push({ top: orc.top, bottom: orc.bottom, left: orc.left, right: orc.right });
    }
    const _underOverlay = (b) => _overlays.some((ov) => b.x < ov.right && b.x + b.width > ov.left && b.y >= ov.bottom - 2);
    const _tooltipIds = new Set();
    for (const t of document.querySelectorAll('[role=tooltip],[popover]')) if (t.id) _tooltipIds.add(t.id);
    // #2 (round-3 overfit audit) — GENERALIZED hover/focus-reveal candidacy. The old gate required an
    // ARIA/popover ASSOCIATION (popovertarget, or aria-describedby/aria-controls → [role=tooltip]/[popover]),
    // which is a tooltip-LIBRARY convention, not the 1.4.13 rule: a class="popover"/"card-flyout"/class-less
    // JS-toggled reveal or a pure CSS :hover/:focus reveal never became a candidate, so the hover-content-tri
    // runner never even ran (silent FN). Candidacy is now detected STATICALLY (never hover every element —
    // performance constraint): (a) the existing association markers (kept — cheap and precise), (b) an INLINE
    // hover/focus handler attribute (onmouseover/onmouseenter/onpointerover/onpointerenter/onfocus/onfocusin —
    // the JS-toggled reveal with no ARIA association; addEventListener-wired handlers are not visible to this
    // static scan, an accepted limit), (c) a stylesheet :hover/:focus REVEAL rule whose TRIGGER selector matches
    // the element. Native `title` alone still does NOT qualify (UA-controlled, rubric-exempt). Same read-only
    // one-pass-per-page scan idiom as the _overlays/_tooltipIds scans above; cross-origin sheets are skipped.
    // A false candidate only costs a deterministic probe (the runner still requires MEASURED appearing content
    // before any barrier — the lane is BARRIER-ONLY), so over-approximation here is recall, not FPs.
    const _hoverRevealTriggers = [];
    try {
      const PSEUDO = /:(?:hover|focus(?:-within|-visible)?)(?![\w-])/;
      const _collectRevealRules = (rules) => {
        for (const r of rules || []) {
          if (_hoverRevealTriggers.length >= 200) return; // bound the per-element matches() cost on rule-heavy pages
          if (r.selectorText && r.style && PSEUDO.test(r.selectorText)) {
            // a REVEAL declaration flips the target shown: display set (≠none), visibility:visible, or opacity>0.
            const _d = r.style.display, _v = r.style.visibility, _o = r.style.opacity;
            if ((_d && _d !== 'none') || _v === 'visible' || (_o !== '' && parseFloat(_o) > 0)) {
              for (const part of r.selectorText.split(',')) {
                // TRIGGER = the selector before the pseudo; require a NON-EMPTY TAIL after it (a revealed
                // DESCENDANT/SIBLING distinct from the trigger). A tail-less `a:hover{opacity:.8}` is a style
                // tweak on the trigger itself, not a reveal — counting it would flood every link on the page.
                const m = part.match(/^(.*?):(?:hover|focus(?:-within|-visible)?)(?![\w-])(.+)$/);
                if (!m) continue;
                const trigger = m[1].trim(), tail = m[2].trim();
                if (trigger && tail && _hoverRevealTriggers.length < 200) _hoverRevealTriggers.push(trigger);
              }
            }
          }
          // descend grouping rules (@media/@supports) AND CSS-nesting children. NOTE: in nesting-era Chrome
          // EVERY CSSStyleRule carries a (usually empty) .cssRules list, so descent must NOT short-circuit the
          // style-rule handling above (the original `if (r.cssRules) continue`-style branch silently skipped
          // every plain rule — caught by the generalization suite, not by inspection).
          if (r.cssRules && r.cssRules.length) _collectRevealRules(r.cssRules);
        }
      };
      for (const ss of document.styleSheets) { let rr = null; try { rr = ss.cssRules; } catch (e) {} if (rr) _collectRevealRules(rr); }
    } catch (e) { /* stylesheet access failure degrades to the association/handler signals only */ }
    const _HOVER_FOCUS_HANDLER_ATTRS = ['onmouseover', 'onmouseenter', 'onpointerover', 'onpointerenter', 'onfocus', 'onfocusin'];
    const _hasHoverContent = (el) => {
      if (el.hasAttribute('popovertarget')) return true;
      for (const a of ['aria-describedby', 'aria-controls']) { const v = el.getAttribute(a); if (v) for (const id of v.split(/\s+/)) if (_tooltipIds.has(id)) return true; }
      for (const h of _HOVER_FOCUS_HANDLER_ATTRS) if (el.hasAttribute(h)) return true; // #2(b) inline reveal handler
      for (const sel of _hoverRevealTriggers) { try { if (el.matches(sel)) return true; } catch (e) {} } // #2(c) CSS reveal trigger
      return false;
    };
    // FIX #4 (akn7bn 2.1.1): is ANY modal dialog open? A showModal()'d <dialog> inerts everything outside its top
    // layer, so an iframe BEHIND the modal is not in tab order regardless of its own tabIndex (Inapplicable Ex6).
    const _anyModalOpen = (function () { try { return [...document.querySelectorAll('dialog')].some((d) => { try { return d.matches(':modal'); } catch (e) { return d.open; } }); } catch (e) { return false; } })();
    // FIX #4: a GENUINELY-focusable INNER descendant — focusable by markup AND not itself tabindex<0. The page-level
    // `focusableByMarkup` returns true for any <a href> even with its OWN tabindex<0, which would false-positive ACT
    // Inapplicable Ex4 (an iframe excluded from tab order whose only inner link is ALSO tabindex=-1 ⇒ nothing was
    // wrongly excluded). So exclude an own-negative-tabindex descendant explicitly.
    const _innerGenuinelyFocusable = (el) => {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-hidden') === 'true') return false;
      const ti = el.getAttribute('tabindex');
      if (ti !== null && +ti < 0) return false; // its OWN negative tabindex keeps it out of tab order
      const tg = el.tagName.toLowerCase();
      if (ti !== null && +ti >= 0) return true;
      if (tg === 'a' && el.hasAttribute('href')) return true;
      return ['button', 'input', 'select', 'textarea', 'summary'].includes(tg);
    };
    // FIX #4: an iframe/frame EXCLUDED from tab order that nonetheless holds operable content (ACT akn7bn 2.1.1).
    // Gate: tag is iframe/frame, tabIndex<0, the frame is RENDERED (not display:none/visibility:hidden/[hidden]/
    // [inert]/closest([inert]), not collapsed to ≤1px CONTENT box — a 1×1 frame renders ~5px with the default
    // 2px border, so the CONTENT box is the collapse signal — and not behind an open modal), and it has ≥1
    // genuinely-focusable inner descendant (not itself tabindex<0). Same-origin frames only (cross-origin throws).
    const _iframeTabExcluded = (el) => {
      const tg = el.tagName.toLowerCase();
      if (tg !== 'iframe' && tg !== 'frame') return false;
      if (el.tabIndex >= 0) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const collapsed = r.width <= 1 || r.height <= 1 || el.clientWidth <= 1 || el.clientHeight <= 1;
      const rendered = cs.display !== 'none' && cs.visibility !== 'hidden' && !el.hasAttribute('hidden') && !el.hasAttribute('inert')
        && !el.closest('[inert]') && !collapsed
        && !(_anyModalOpen && !(el.matches(':modal') || el.closest('dialog:modal')));
      if (!rendered) return false;
      let fdoc = null;
      try { fdoc = el.contentDocument; } catch (e) { fdoc = null; } // cross-origin ⇒ no judgment, fail closed
      if (!fdoc || !fdoc.body) return false;
      for (const d of fdoc.querySelectorAll('*')) if (_innerGenuinelyFocusable(d)) return true;
      return false;
    };
    // FIX #8 (kb1m8s 4.1.2): role=none/presentation prohibits ALL global ARIA props, so an authored role of EXACTLY
    // `none`/`presentation` carrying ANY global aria-* state/property is a barrier. Computed from the AUTHORED
    // attributes (not the browser-resolved role). aria-hidden is special: aria-hidden=true REMOVES the element (not
    // a prohibited-global failure), so only a non-true aria-hidden counts. WAI-ARIA global state/property set:
    const _GLOBAL_ARIA = new Set(['aria-atomic', 'aria-busy', 'aria-controls', 'aria-current', 'aria-describedby', 'aria-description', 'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage', 'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-live', 'aria-owns', 'aria-relevant', 'aria-roledescription', 'aria-braillelabel', 'aria-brailleroledescription']);
    // kb1m8s (4.1.2): a PROHIBITED ARIA attribute that axe does NOT flag. Targeted supplement (broad role-specific
    // ARIA validity stays axe's aria-prohibited-attr / aria-allowed-attr to avoid a flood) for three axe-gap conditions:
    //  (1) role=none/presentation carrying ANY global ARIA state/property (none/presentation expose no role to AT);
    //  (2) aria-roledescription on a GENERIC element (bare div/span, no explicit role) — generic cannot be re-described;
    //  (3) a BRAILLE property with no backing regular property — aria-braillelabel without aria-label/aria-labelledby,
    //      or aria-brailleroledescription without aria-roledescription (a braille equivalent is meaningless alone).
    // aria-roledescription (and aria-label) are PROHIBITED on the generic + structural roles below (ARIA 1.2). Match
    // the RULE, not one fixture: an EXPLICIT role in this set, OR — when no explicit role — a tag whose IMPLICIT role
    // is one of them. (Generalized from a div/span-only gate, which would have missed <p>/<em>/<strong>/<code>/… etc.)
    const _PROHIB_RD_ROLE = new Set(['generic', 'none', 'presentation', 'paragraph', 'emphasis', 'strong', 'code', 'deletion', 'insertion', 'subscript', 'superscript', 'caption', 'term']);
    const _PROHIB_RD_TAG = new Set(['div', 'span', 'p', 'em', 'strong', 'b', 'i', 's', 'u', 'small', 'mark', 'q', 'cite', 'dfn', 'abbr', 'code', 'samp', 'kbd', 'var', 'sub', 'sup', 'del', 'ins', 'time', 'data', 'caption']);
    // does the element get an accessible name FROM ITS CONTENT? (name-from-content role + non-empty text). A braille
    // property is backed by aria-label/labelledby OR such a content name — so this exempts the validly-backed case.
    const _NFC_ROLE = new Set(['heading', 'button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'checkbox', 'switch', 'tab', 'treeitem', 'gridcell', 'cell', 'columnheader', 'rowheader', 'tooltip', 'row']);
    const _hasContentName = (el, roleAttr) => {
      const r = (roleAttr || '').toLowerCase();
      const t = el.tagName.toLowerCase();
      const implicitNFC = /^(h[1-6]|button|summary|td|th|caption|option|legend|dt)$/.test(t) || (t === 'a' && el.hasAttribute('href'));
      return (r ? _NFC_ROLE.has(r) : implicitNFC) && (el.textContent || '').trim().length > 0;
    };
    const _prohibitedAriaAttr = (el, roleAttr) => {
      const names = el.getAttributeNames(); const has = (a) => names.includes(a);
      if ((roleAttr === 'none' || roleAttr === 'presentation') &&
          names.some((n) => _GLOBAL_ARIA.has(n) && (n !== 'aria-hidden' || el.getAttribute('aria-hidden') !== 'true'))) return true;
      if (has('aria-roledescription')) { const r = (roleAttr || '').toLowerCase(); if (r ? _PROHIB_RD_ROLE.has(r) : _PROHIB_RD_TAG.has(el.tagName.toLowerCase())) return true; }
      // a braille property is UNBACKED only if the element has NO accessible name from ANY source. aria-braillelabel
      // backs aria-label/labelledby OR a NAME-FROM-CONTENT name (heading/button/link/… with text) — generalization
      // check caught the FP: <div role=heading aria-braillelabel> "I ❤ Bananas" is validly backed by its content.
      if (has('aria-braillelabel') && !has('aria-label') && !has('aria-labelledby') && !_hasContentName(el, roleAttr)) return true;
      if (has('aria-brailleroledescription') && !has('aria-roledescription')) return true;
      return false;
    };
    // FIX #5 (6cfa84 4.1.2): a genuinely-focusable element STILL in tab order (not tabindex=-1 — the focus-sentinel
    // exception) sitting inside an `[aria-hidden="true"]` subtree with no intervening aria-hidden=false reset. The
    // element is reachable by keyboard but absent from the a11y tree ⇒ no name/role/state — a 4.1.2 barrier. axe
    // abstains-as-incomplete on off-screen sentinels, so this must NOT ride on axe.
    const _focusableInAriaHidden = (el) => {
      const ti = el.getAttribute('tabindex');
      if (ti !== null && +ti < 0) return false; // tabindex=-1 ⇒ the sentinel exception (not in tab order)
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      const tg = el.tagName.toLowerCase();
      const focusableShape = (ti !== null && +ti >= 0) || (tg === 'a' && el.hasAttribute('href'))
        || (tg === 'input' && (el.getAttribute('type') || '').toLowerCase() !== 'hidden')
        || ['button', 'select', 'textarea', 'summary'].includes(tg) || el.hasAttribute('contenteditable');
      if (!focusableShape) return false;
      // inside an aria-hidden=true subtree with NO closer aria-hidden=false reset between el and that ancestor.
      for (let n = el; n; n = n.parentElement) {
        const ah = n.getAttribute && n.getAttribute('aria-hidden');
        if (ah === 'true') return true;
        if (ah === 'false') return false; // a reset breaks the suppression before we hit a true ancestor
      }
      return false;
    };
    const els = [];
    // PRE-SELECTED SUBSET (saved pages): when the caller passes an explicit xpath list, collect EXACTLY those
    // elements — no `body *` scan, no inclusion filter, no element cap, no visibility filter (the inventory already
    // chose them deliberately, mirroring eval-page.js's loadXpaths model). This makes the 80-cap moot for saved-page
    // runs: the subset IS the selection. (Cross-frame `>>` xpaths don't resolve via document.evaluate ⇒ dropped here;
    // top-document xpaths are the saved-page case.)
    const _subset = (Array.isArray(subsetXpaths) && subsetXpaths.length)
      ? subsetXpaths.map((xp) => { try { return document.evaluate(xp, document, null, 9, null).singleNodeValue; } catch (e) { return null; } }).filter(Boolean)
      : null;
    // EN C.9.6.2 "full pages" disclosure: a hard element cap means anything past it is invisible to EVERY v3 lane
    // (deterministic + LLM), so a page-clear is really "clear within the first `cap` elements", NOT a full-page
    // claim. Record whether the cap actually TRUNCATED the scan + the total DOM size, so the builder can disclose it
    // (a barrier planted past the cap would otherwise read as a false clear — the harness's cardinal sin). A subset
    // run is by definition NOT truncated — the subset is the complete selection.
    const _domTotal = document.querySelectorAll('body *').length;
    let _cappedOut = false;
    // 2.4.6 visible section-heading context (improvement A — VISIBILITY-AWARE per the held-out gate). A field/label's
    // nearest preceding PERCEIVABLY-VISIBLE heading is the section context that can disambiguate a duplicate label
    // (cc0f0a: a VISIBLE "Shipping" heading clears "Name"; an OFF-SCREEN `top:-9999px` "Shipping address" does NOT —
    // it leaves the visible labels ambiguous, so the barrier stands). visible = not display:none/visibility:hidden/
    // aria-hidden AND not off-screen/clipped. Document-ordered ⇒ the LAST preceding visible heading is the nearest.
    const _HEADINGS = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].map((h) => {
      const r = h.getBoundingClientRect();
      const off = r.left <= -1000 || r.top <= -1000 || (r.width <= 1 && r.height <= 1);
      return { node: h, text: textOf(h).slice(0, 80), vis: visible(h) && !off && h.getAttribute('aria-hidden') !== 'true' && !h.closest('[aria-hidden="true"]') };
    });
    const _sectionHeading = (el) => { let t = null; for (const h of _HEADINGS) { if (h.vis && h.text && (el.compareDocumentPosition(h.node) & Node.DOCUMENT_POSITION_PRECEDING)) t = h.text; } return t; };
    for (const el of (_subset || document.querySelectorAll('body *'))) {
      if (!_subset) {
        if (els.length >= cap) { _cappedOut = true; break; }
        // a live-region container is admitted even when empty/zero-sized at rest (see liveRegionShape) — and
        // so is the MUTED live-region shape (item 12: same resting geometry, and its muteness IS the 4.1.3
        // defect); plus a wired image-map area even though its client rect is 0×0 (see renderedAreaShape)
        if (!visible(el) && !liveRegionShape(el) && !mutedLiveRegionWiring(el) && !renderedAreaShape(el)) continue;
      }
      const tag = el.tagName.toLowerCase();
      const roleAttr = el.getAttribute('role') || '';
      const type = el.getAttribute('type') || '';
      const href = el.getAttribute('href') || '';
      const text = textOf(el).slice(0, 240);
      const sampledRole = roleAttr || nativeRoleInPage(tag, type, href);
      // #11 (2.4.4 JS-nav links): a span/div role=link can navigate via onclick="location='…'" with NO href. Extract
      // the static nav TARGET from ANY common literal-string nav idiom (location / location.href / .assign / .replace /
      // window.open) so a same-named JS-link SET can be destination-compared. A computed onclick (no string literal)
      // yields null — never a false signal. General over the nav idioms, not tied to one fixture's exact string.
      const jsHref = (function () { const oc = el.getAttribute('onclick') || ''; const m = oc.match(/(?:location\.href|location\.assign|location\.replace|location|window\.open)\s*(?:=|\()\s*['"]([^'"]+)['"]/i); return m ? m[1] : null; })();
      // #12 (2.4.4 enclosing context): the WCAG "programmatically-determined link context" — NOT just the link's
      // nearest block. It includes the OWN text of each ANCESTOR list-item (a nested `<li>HTML</li>` under
      // `<li>Ulysses</li>` IS disambiguated by "Ulysses"). `ownText` strips nested links so a parent <li>'s text is
      // its OWN subject, not its child links. A preceding-SIBLING paragraph is still excluded (not an ancestor), and
      // walking only ANCESTORS keeps the alone-in-its-own-block case (`<p><a>Workshop</a></p>`) correctly context-free.
      // NOTE: table-cell HEADER cells are ALSO 2.4.4 context, but they are deliberately NOT merged into blockText — the
      // LLM cannot tell a SPECIFIC header (a row's subject) from a GENERIC category title (a `<th>Books</th>` spanning a
      // download table) from one flattened string, so merging the generic title falsely cleared a real barrier. Instead
      // they ride a SEPARATE `cellHeaderContext` field (below) that keeps ROW and COLUMN headers DISTINCT, so the rubric
      // can credit a specific row-subject header while treating a generic column category as insufficient — which is the
      // condition the original deferral required. (Relying on a model to call query_ax_node for this is unreliable: the
      // passive models — GPT-5.4 / Gemini — judge the link without investigating, so the deterministic signal is needed.)
      const enclosingBlockText = (sampledRole === 'link' || tag === 'a') ? (function () {
        const ownText = (node) => { if (!node) return ''; const c = node.cloneNode(true); c.querySelectorAll('a,[role=link]').forEach((n) => n.remove()); return (c.textContent || '').replace(/\s+/g, ' ').trim(); };
        const parts = []; let inBlock = false;
        let n = el.parentElement, hops = 0;
        while (n && hops < 8) { const t = n.tagName.toLowerCase();
          if (/^(li|td|th|dd|dt|figcaption|blockquote|caption)$/.test(t)) { parts.push(ownText(n)); inBlock = true; }
          else if (/^(p|h[1-6])$/.test(t)) { parts.push(ownText(n)); inBlock = true; break; }  // a paragraph/heading is a terminal enclosing block
          n = n.parentElement; hops++; }
        // NOT inside any enclosing block ⇒ null (no signal — defer to the LLM). Inside a block but no other text ⇒
        // "" (linkAloneInBlock=true). Inside a block WITH disambiguating own-text ⇒ that text.
        if (!inBlock) return null;
        return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 300);
      })() : undefined;
      // #12b (2.4.4 table-cell context): a link in a `<td>`/`role=cell` is contextualised by its cell's associated
      // row/column HEADER (the same header→data association 1.3.1 governs) — the EPUB-in-a-table case where the row
      // header names the book. Keep ROW and COLUMN headers DISTINCT (a row-subject header disambiguates; a generic
      // column category does not — see the deferral note above). Mirrors query_ax_node's cellHeaders resolver, run
      // deterministically here so the PASSIVE models (which won't call the tool) still get it. Precedence: explicit
      // `headers=` IDREFs, else positional (top-row=column headers, first-column=row headers); spans ignored (a hint).
      const cellHeaderContext = (sampledRole === 'link' || tag === 'a') ? (function () {
        if (!el.closest) return undefined;
        const cell = el.closest('td,th,[role=cell],[role=gridcell],[role=columnheader],[role=rowheader]');
        if (!cell) return undefined;
        const table = cell.closest('table,[role=table],[role=grid],[role=treegrid]');
        if (!table) return undefined;
        const txt = (n) => (n && (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)) || '';
        const isHdr = (c) => c.tagName === 'TH' || /\b(columnheader|rowheader)\b/.test(c.getAttribute('role') || '');
        const out = { rowHeaders: [], colHeaders: [], headerSource: 'none' };
        // explicit headers= IDREFs win.
        const hids = (cell.getAttribute('headers') || '').trim().split(/\s+/).filter(Boolean);
        if (hids.length) {
          out.headerSource = 'headers-attr';
          for (const id of hids) { const h = document.getElementById(id); if (h && h !== cell) { const sc = (h.getAttribute('scope') || '').toLowerCase(); (sc === 'row' ? out.rowHeaders : out.colHeaders).push(txt(h)); } }
          return (out.rowHeaders.length || out.colHeaders.length) ? out : undefined;
        }
        // SPAN-AWARE grid: build a column-position map so a `<th colspan=3>` header covers all 3 data columns (the
        // EPUB-in-a-table case). occupied[] tracks rowspans; cellPos maps each cell → {r,c,rs,cs} grid rectangle.
        const rows = table.rows ? [].slice.call(table.rows) : [].slice.call(table.querySelectorAll('[role=row]'));
        const rowCells = (r) => (r.cells ? [].slice.call(r.cells) : [].slice.call(r.querySelectorAll('td,th,[role=cell],[role=gridcell],[role=columnheader],[role=rowheader]')));
        const span = (c, a, b) => Math.max(1, c[a] || parseInt(c.getAttribute(b), 10) || 1);
        const occ = {}, cellPos = new Map();
        for (let r = 0; r < rows.length; r++) {
          let c = 0;
          for (const cc of rowCells(rows[r])) {
            while (occ[r + ',' + c]) c++;
            const cs = span(cc, 'colSpan', 'aria-colspan'), rs = span(cc, 'rowSpan', 'aria-rowspan');
            cellPos.set(cc, { r, c, rs, cs });
            for (let dr = 0; dr < rs; dr++) for (let dc = 0; dc < cs; dc++) occ[(r + dr) + ',' + (c + dc)] = cc;
            c += cs;
          }
        }
        const pos = cellPos.get(cell);
        if (!pos) return undefined;
        const seenC = {}, seenR = {};
        for (const [hc, p] of cellPos) {
          if (hc === cell || !isHdr(hc)) continue;
          const coversCol = p.c <= pos.c && pos.c < p.c + p.cs;
          const coversRow = p.r <= pos.r && pos.r < p.r + p.rs;
          if (p.r < pos.r && coversCol) { const t = txt(hc); if (t && !seenC[t]) { seenC[t] = 1; out.colHeaders.push(t); out.headerSource = 'positional'; } }
          else if (p.c < pos.c && coversRow) { const t = txt(hc); if (t && !seenR[t]) { seenR[t] = 1; out.rowHeaders.push(t); out.headerSource = 'positional'; } }
        }
        if (out.headerSource === 'positional' && table.querySelector('th[scope=col],th[scope=row]')) out.headerSource = 'scope';
        out.rowHeaders = out.rowHeaders.slice(0, 4); out.colHeaders = out.colHeaders.slice(0, 4);
        return (out.rowHeaders.length || out.colHeaders.length) ? out : undefined;
      })() : undefined;
      // HTML-evidence ablation (V3_HTML_EVIDENCE): the element's RAW markup + its parent's markup, so an ablation
      // can feed the LLM the HTML in place of v3 structured signals (does raw markup beat the route-by-facet bundle?).
      const htmlSnippet = (el.outerHTML || '').slice(0, 2000);
      const enclosingHtml = el.parentElement ? (el.parentElement.outerHTML || '').slice(0, 2800) : null;
      const box = el.getBoundingClientRect();
      const focusable = focusableByMarkup(el);
      const isFormField = fieldLike(el);
      const isInteractive = focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole);
      // #4: facts for the "passive focusable CONTAINER vs operable control" judgment (2.1.1). A focusable element
      // with a container role that holds its OWN controls (or is just a focusable scroll region) owes no 2.1.1
      // operation barrier; the LLM decides applicability from these + the role (no hard-coded role denylist).
      const ownsInteractiveDescendants = focusable ? !!el.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=menuitem],[role=checkbox],[role=switch],[role=tab],[role=radio]') : undefined;
      const hasKeyHandler = focusable ? (el.hasAttribute('onkeydown') || el.hasAttribute('onkeyup') || el.hasAttribute('onkeypress')) : undefined;
      // GRAPHIC surface (parity with eval-page.js:449 `isImage`): an <img>/<svg>/<canvas>/role=img or
      // input[type=image] owes the non-text-content (1.1.1) / images-of-text (1.4.5) / non-text-contrast
      // (1.4.11) families EVEN when role-stripped (role="none"/"presentation") — that's exactly the mis-marked
      // decorative case. Kept by the inclusion filter so a role=none graphic still enumerates.
      const isImage = tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img' || (tag === 'input' && type === 'image');
      // EMULATED CONTROL (F42, residual RCA S6 — the 1.3.1 "control semantics" gap). A script activation
      // handler bolted onto a plain element that is NOT focusable and declares NO interactive role: a
      // keyboard user cannot reach it, and AT never announces it as a control, so the relationship between
      // what it looks like and what it does exists only for a sighted mouse user. F42's own description:
      // "JavaScript event handlers are attached to elements to emulate links… cannot be tabbed to from the
      // keyboard and does not gain keyboard focus".
      // Two guards keep this off ordinary event DELEGATION, which looks identical at the attribute level:
      //  · an element that CONTAINS a natively-interactive descendant is enhancing real controls, not
      //    replacing them (a clickable card wrapping a real <a> is fine — the link is still there);
      //  · a handler on a near-full-viewport container is a delegation root, not a control.
      const _NATIVE_INTERACTIVE = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=menuitem],[role=tab],[role=option]';
      const _INTERACTIVE_ROLE_RE = /^(button|link|checkbox|radio|switch|menuitem|menuitemcheckbox|menuitemradio|tab|option|slider|spinbutton|textbox|searchbox|combobox|treeitem)$/;
      const _inlineActivation = el.hasAttribute('onclick') || el.hasAttribute('onkeydown') || el.hasAttribute('onkeypress') || el.hasAttribute('onkeyup');
      const _nativeInteractiveTag = /^(a|button|input|select|textarea|summary|details|option|label)$/.test(tag);
      const _tiAttr = el.getAttribute('tabindex');
      const _emulatedShape = !focusable && !_nativeInteractiveTag && !_INTERACTIVE_ROLE_RE.test(roleAttr)
        && !(_tiAttr !== null && +_tiAttr >= 0)
        && !el.querySelector(_NATIVE_INTERACTIVE)
        && !(box.width >= (window.innerWidth || 1280) * 0.8 && box.height >= (window.innerHeight || 800) * 0.5)
        && box.width > 0 && box.height > 0;
      // the LISTENER half is filled in the CDP pass (listenerTypes), which runs after this evaluate.
      const emulatedControlShape = _emulatedShape;
      const emulatedControlInline = _emulatedShape && _inlineActivation;
      // F42's FOCUSABLE role-less sub-case (batch-3 item 18, emulated-controls case-05). `_emulatedShape`
      // requires !focusable by construction, so a `<div tabindex="0" onclick>` tab — reachable by keyboard
      // but announced as NOTHING (no role, so AT never says it is a control, and its selected state exists
      // only visually) — matched no gate at all. Sibling shape: the SAME structural guards (no native
      // interactive tag, no interactive role, no native-interactive descendant, not a delegation-root-sized
      // container, rendered box) with the focusability inverted — an explicit tabindex >= 0. Like its
      // sibling, the shape is only half the fact: activation is proven by an inline handler here or by the
      // CDP listener pass (click/key*) after this evaluate. Same claim family (control-semantics, 1.3.1).
      const _emulatedFocusableShape = !_nativeInteractiveTag && !_INTERACTIVE_ROLE_RE.test(roleAttr)
        && (_tiAttr !== null && +_tiAttr >= 0)
        && !el.querySelector(_NATIVE_INTERACTIVE)
        && !(box.width >= (window.innerWidth || 1280) * 0.8 && box.height >= (window.innerHeight || 800) * 0.5)
        && box.width > 0 && box.height > 0;
      const emulatedControlFocusableShape = _emulatedFocusableShape;
      const emulatedControlFocusableInline = _emulatedFocusableShape && _inlineActivation;
      // S7 (RCA R7, 0va7u6): an <svg> that renders LIVE <text>/<tspan> is NOT an image-of-text — that text is real
      // and accessible, so it owes NO 1.4.5 (images-of-text) obligation. Surfaced so the rubric clears it.
      // ...but ONLY when that text actually reaches the accessibility tree. An `aria-hidden="true"` svg (or
      // one whose <text> sits inside an aria-hidden subtree) renders glyphs a sighted user reads and exposes
      // NOTHING to an AT user, so calling its text "real and machine-readable" inverted the finding: the
      // rubric was told the text was available at the exact moment it was not.
      // `closest` matches the element itself, so this covers both `aria-hidden` ON the svg and on an ancestor.
      const svgTextExposed = tag === 'svg' && !el.closest('[aria-hidden="true"]')
        && ![...el.querySelectorAll('text, tspan')].every((t) => t.closest('[aria-hidden="true"]'));
      const svgLiveText = tag === 'svg' && !!el.querySelector('text, tspan') && (el.textContent || '').trim().length > 0
        && svgTextExposed;
      // 7d6734 (1.1.1 FP): the rule's subject is the SVG element WITH an explicit role + name. When the root <svg>
      // is itself UNNAMED (no aria-label/labelledby, no DIRECT child <title>) but wraps a named graphics DESCENDANT
      // (e.g. <svg><circle role="graphics-symbol" aria-label="1 circle">), the named descendant carries the meaning
      // — a child <title> propagates to the root's name, but a named descendant ELEMENT does not. So the root owes
      // no 1.1.1 alt of its own; flag it so the oracle does NOT enumerate non-text-content/images-of-text on the root.
      const svgNamedDescendant = tag === 'svg'
        && !(el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || !!el.querySelector(':scope > title'))
        && !!el.querySelector('[aria-label]:not([aria-label=""]), [aria-labelledby], [role] > title');
      // FOCUS-TRAP RISK (coverage audit, 2.1.2): a focusable element carries a keyboard-trap obligation when it
      // is inside a focus-trapping REGION (the kbd-graph TRAP_REGION_SEL) OR carries an inline focus handler
      // (onblur/onfocus/onfocusout — the self-refocus-trap signal). Widens the old inModal-only gate WITHOUT
      // enumerating on bare focusable (which would flood every button). The trap experiment/detector then decides.
      const focusRisk = focusable && (
        el.hasAttribute('onblur') || el.hasAttribute('onfocus') || el.hasAttribute('onfocusout')
        || !!el.closest('[role=dialog],dialog,[aria-modal=true],[role=menu],[role=listbox],[role=grid],[role=tablist],[class*=modal i],[class*=overlay i],[class*=dialog i],[class*=popup i],[class*=lightbox i]')
      );
      // ARIA semantics carried by a NON-widget (e.g. aria-label on a <div>) — the 4.1.2 aria-validity facet
      // (ACT kb1m8s). Just the attribute NAMES (cheap, role-agnostic); the oracle gates on presence.
      const ariaAttrs = el.getAttributeNames().filter((n) => n.indexOf('aria-') === 0);
      // DECORATIVE-MARKING conflict (Tier-0 #5, e88epe): an image REMOVED from the a11y tree (aria-hidden on
      // self/ancestor, role=presentation|none, or empty alt) that still RENDERS meaningful pixels is a barrier the
      // adequacy rubric must SEE — today axName is still set from alt, hiding the conflict. Capture the mechanism +
      // the explicit aria-hidden-WITH-an-author-name smell so the rubric judges the pixels, not the (hidden) name.
      const ariaHidden = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');
      const presentational = roleAttr === 'presentation' || roleAttr === 'none';
      const altAttr = tag === 'img' ? el.getAttribute('alt') : null;
      const emptyAlt = tag === 'img' && altAttr === '';
      const removedFromA11yTree = ariaHidden || presentational || emptyAlt;
      const hiddenMechanism = ariaHidden ? 'aria-hidden' : presentational ? ('role-' + roleAttr) : emptyAlt ? 'empty-alt' : null;
      const authorName = ((altAttr || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).trim();
      const ariaHiddenWithName = ariaHidden && authorName.length > 0;
      const renderedVisible = isImage && box.width >= 8 && box.height >= 8; // S3 (R3): SIZE/visibility only — NOT "meaningful" (a decorative photo and a meaningful logo both pass this)
      // DECORATIVE-CONFLICT (Tier-0 #5, e88epe fixtures 2 & 3): an image EXPLICITLY hidden (aria-hidden OR
      // role=presentation/none) that the author nonetheless NAMED (alt/aria-label/title) and that RENDERS at a
      // non-trivial size — the author signalled meaning, then removed it from AT. This deterministic smell mints a
      // (gated) 1.1.1 alt-adequacy obligation in the oracle so the rubric judges the rendered pixels vs the hidden
      // name. NOT fired for a bare alt="" decorative image (no author name) — that is genuinely decorative.
      const decorativeConflict = (ariaHidden || presentational) && authorName.length > 0 && renderedVisible === true;
      // S3 (RCA R3): NEARBY TEXT for the REDUNDANCY judgment. Pixel content cannot separate a decorative photo
      // from a meaningful logo (the photo often has MORE pixels). The real discriminator is whether the image's
      // information is REDUNDANT with adjacent text (→ correctly decorative) or UNIQUE (→ a barrier if removed
      // from the tree). Hand the rubric the surrounding text so it can judge redundancy, not just the pixels.
      // The redundancy test is only sound if `nearbyText` excludes the SUBJECT'S OWN text. Taking
      // `textOf(el.parentElement)` wholesale did not: for an inline <svg> the parent's text INCLUDES the
      // svg's own <text>/<tspan> nodes, so the image supplied the very "nearby text" it was being compared
      // against and the test self-satisfied. Every rubric that asks "is this information ALSO available as
      // text" was judging against an inflated baseline — and worse, an aria-hidden <svg>'s text counted,
      // though no AT user ever receives it. Subtract the subject's own text before reporting.
      // ANCESTOR CLIMB (batch-3 item 14, the keystone): a single-child wrapper — div>canvas, div>svg,
      // span>svg — has a text-less parent and no siblings, so the old parent+direct-siblings read yielded
      // nearbyText:null for exactly the badge/chart/QR shapes whose redundancy question the rubric most
      // needs answered, starving both the redundancy baseline and the abstain valves' "can I verify"
      // question. Climb: when one level holds no non-subject text, step to the parent and read ITS
      // parent + siblings, until text is found or the walk reaches <body> (bounded). Level 0 is read
      // exactly as before, so any element that already had nearbyText keeps it byte-identically.
      const nearbyText = !isImage ? undefined : (function () {
        const ownText = (el.textContent || '').replace(/\s+/g, ' ').trim();
        const strip = (s) => {
          let out = (s || '').replace(/\s+/g, ' ').trim();
          if (ownText && out.includes(ownText)) out = out.split(ownText).join(' ').replace(/\s+/g, ' ').trim();
          return out;
        };
        const bits = [];
        const fig = el.closest('figure'); if (fig) { const cap = fig.querySelector('figcaption'); if (cap) bits.push(strip(textOf(cap))); }
        let node = el;
        for (let hops = 0; node && node !== document.body && hops < 6; node = node.parentElement, hops++) {
          if (node.parentElement) bits.push(strip(textOf(node.parentElement)));
          for (const sib of [node.previousElementSibling, node.nextElementSibling]) if (sib) bits.push(strip(textOf(sib)));
          if (bits.some(Boolean)) break;   // non-subject text found at this level — stop climbing
        }
        return [...new Set(bits.filter(Boolean))].join(' | ').replace(/\s+/g, ' ').trim().slice(0, 300) || undefined;
      })();
      // COMPLEX-IMAGE hint (Item 7b): a genuinely data-bearing image (in a <figure>, role=figure, or carrying an
      // aria-describedby long-description pointer) owes the long-description-completeness rubric; a bare logo/icon
      // gets alt-adequacy only (long-desc on a simple logo is UNCERTAIN noise).
      const complexImageHint = isImage && (!!el.closest('figure') || roleAttr === 'figure' || el.hasAttribute('aria-describedby'));
      // DEDICATED CAPTION/LONG-DESCRIPTION TEXT (batch-3 item 16b): the long-description rubric was reading
      // the caption out of the 2800-cap `enclosingHtml`, which an inline SVG's own markup eats before the
      // <figcaption> ever appears — truncating the caption mid-sentence (reproduced byte-identically at
      // 7b379689). State the caption/described-by text DIRECTLY, with its own ~1200 budget, exactly for the
      // complexImageHint images the long-description obligation gates on. Absent (undefined ⇒ dropped by
      // JSON) on every other element, so untouched pages serialize byte-identically.
      const captionText = !complexImageHint ? undefined : (function () {
        const parts = [];
        const fig = el.closest('figure'); if (fig) { const cap = fig.querySelector('figcaption'); if (cap) parts.push(textOf(cap)); }
        const doc = el.ownerDocument || document;
        for (const id of (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).slice(0, 4)) {
          const t = doc.getElementById(id); if (t) parts.push(textOf(t));
        }
        return [...new Set(parts.filter(Boolean))].join(' | ').replace(/\s+/g, ' ').trim().slice(0, 1200) || undefined;
      })();
      // C8 small-signal predicates (parity with eval-page.js / the ACT inline collector).
      const tabindexEffective = (() => { const ti = el.getAttribute('tabindex'); return ti !== null ? +ti : (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag) && !el.disabled ? 0 : null); })();
      let _ownTxt = ''; for (const _n of childNodesOf(el)) if (_n.nodeType === 3) _ownTxt += _n.textContent;
      // Direct text only: this is the shared 1.3.3 applicability input. Descendant text is deliberately
      // excluded so one sensory instruction does not create duplicate obligations on every wrapper.
      const ownText = _ownTxt.replace(/\s+/g, ' ').trim().slice(0, 400);
      // CONFUSABLE / NON-TEXT GLYPH TEXT. Two defects fixed here (residual RCA S6):
      //  · the census covered the Private Use Areas but omitted U+1D400–U+1D7FF, Mathematical Alphanumeric
      //    Symbols — the "𝗳𝗮𝗻𝗰𝘆 𝘁𝗲𝘅𝘁" block, which is how styled-text substitution is actually written and
      //    which a screen reader reads out character-by-character as maths symbols, or skips entirely;
      //  · the Cyrillic/Greek homoglyph test required MIXED script IN ONE NODE (`…&& /[a-zA-Z]/`), so a
      //    FULLY substituted run — "$ЗОО", every character swapped — was invisible, and full substitution is
      //    both the more deceptive case and the easier one to write.
      const _cp = [..._ownTxt].map((ch) => ch.codePointAt(0));
      const _inPUA = (c) => (c >= 0xE000 && c <= 0xF8FF) || (c >= 0xF0000 && c <= 0xFFFFD) || (c >= 0x100000 && c <= 0x10FFFD);
      const _inMathAlnum = (c) => c >= 0x1D400 && c <= 0x1D7FF;
      const _homoglyphScript = /[Ѐ-ӿͰ-Ͽ]/.test(_ownTxt);
      const _hasLatin = /[a-zA-Z]/.test(_ownTxt);
      const _hasDigitOrPunct = /[0-9$£€%.,:;!?()\[\]{}\/\\@#&*+=_-]/.test(_ownTxt);
      const hasGlyphText = _cp.some(_inPUA) || _cp.some(_inMathAlnum)
        // mixed script in one node (the original test), OR a fully-substituted run sitting in Latin-script
        // page furniture — a currency symbol, digits or punctuation alongside non-Latin letters is the
        // signature of "$ЗОО" and cannot be an ordinary Cyrillic/Greek word.
        || (_homoglyphScript && (_hasLatin || _hasDigitOrPunct));
      const splitFieldGroup = (() => { if (tag !== 'input' && tag !== 'select') return false; const ml = parseInt(el.getAttribute('maxlength'), 10); if (!(Number.isFinite(ml) && ml <= 6)) return false; const grp = el.closest('fieldset, [role=group], form, div'); if (!grp) return false; return [...grp.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')].filter((i) => { const m = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(m) && m <= 6; }).length >= 2; })();
      // LIVE REGION (Item 11, 4.1.3): a status container (aria-live polite/assertive, or an implicitly-live role)
      // owes a status-message obligation — are dynamic status changes announced to AT. Kept even when empty (a live
      // region is typically populated dynamically, so it has no text at collect time).
      const _alive = (el.getAttribute('aria-live') || '').toLowerCase();
      const liveRegion = _alive === 'polite' || _alive === 'assertive' || /^(status|alert|log|progressbar|marquee|timer)$/.test(roleAttr);
      // Recorded so a judge never reads "this region is empty/invisible right now" as a defect: that is the
      // NORMAL resting state of a status container, and it is the state the announcement mechanism starts from.
      const liveRegionHiddenAtRest = liveRegion && !visible(el);
      // TIME-BASED MEDIA (Item 10, 1.2.x): a <video>/<audio> + its <track> children. Kept even if not focusable.
      // AUTO-MOTION (Item 14d, 2.2.2): looping / >5s CSS animation, <marquee>, or autoplay media without controls —
      // the auto-moving content that owes a pause/stop/hide. Brief (<5s, finite) animation is excluded (not a failure).
      const _mcs = getComputedStyle(el);
      const autoMotion = tag === 'marquee'
        || (_mcs.animationName && _mcs.animationName !== 'none' && (_mcs.animationIterationCount === 'infinite' || parseFloat(_mcs.animationDuration) > 5))
        || ((tag === 'video' || tag === 'audio') && el.hasAttribute('autoplay') && !el.hasAttribute('controls'));
      // AUTO-UPDATING CONTENT (#9 fix, TT 4.1.2 Test 2.D): a carousel/slideshow/ticker whose VISIBLE content changes
      // on a timer without user action — distinct from autoMotion (which is about the ANIMATION itself needing a
      // pause/stop, 2.2.2) and from liveRegion (an aria-live container, 4.1.3). Bootstrap's carousel (data-ride=
      // "carousel" / Bootstrap 5's data-bs-ride) swaps slides via setInterval + a CSS *transition*, not @keyframes,
      // so autoMotion's animationName check never fires on it — this was a real gap (a real DHS Trusted-Tester page,
      // a Bootstrap carousel with zero aria-live anywhere, minted NO obligation for "does this announce its own
      // automatic changes", only an unrelated name-adequacy check on its prev/next buttons). Narrowly scoped to the
      // known carousel-library marker (not a broad "any timer-driven DOM write" heuristic) to avoid flooding.
      const autoUpdatingContent = el.hasAttribute('data-ride') && /carousel|slider|slideshow/i.test(el.getAttribute('data-ride') || '')
        || el.hasAttribute('data-bs-ride') && /carousel|slider|slideshow/i.test(el.getAttribute('data-bs-ride') || '');
      const isMedia = tag === 'video' || tag === 'audio';
      let mediaInfo = null;
      if (isMedia) {
        const tracks = [...el.querySelectorAll('track')];
        const kinds = tracks.map((t) => (t.getAttribute('kind') || 'subtitles').toLowerCase());
        const cap = tracks.find((t) => /^(captions|subtitles)$/.test((t.getAttribute('kind') || 'subtitles').toLowerCase()));
        mediaInfo = {
          mediaTag: tag, hasControls: el.hasAttribute('controls'), trackKinds: kinds,
          hasCaptionsTrack: !!cap, captionsTrackEmpty: !!cap && !(cap.getAttribute('src') || '').trim(),
          hasDescriptionsTrack: kinds.includes('descriptions'),
        };
      }
      // TT gap G2 (TT 7.C, 1.1.1): a CSS background-image that CONVEYS INFORMATION owes a text alternative (TT
      // hides backgrounds and checks the info survives). Gate HARD against the decorative flood — a url() background
      // (not a gradient), a rendered box, NO text, NO accessible name, not aria-hidden/role=presentation, not an
      // actual <img>/svg (those already own non-text-content), and either INTERACTIVE (a control labelled ONLY by
      // the image — also a 4.1.2 failure) OR icon/badge-SIZED (a meaningful glyph, not a full-bleed decorative hero).
      // The rubric judges informational-vs-decorative; the collector only nominates candidates.
      const _bgi = (getComputedStyle(el).backgroundImage || '');
      // RESOLVE aria-labelledby to its referenced TEXT (not the raw id-ref string) — a dangling/empty labelledby
      // must NOT count as a name (else a bg-image control with a broken labelledby is silently un-flagged; adversarial review).
      const _lblText = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((id) => { const t = document.getElementById(id); return t ? (t.textContent || '') : ''; }).join(' ');
      const _accName = ((tag === 'img' ? (el.getAttribute('alt') || '') : '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + _lblText + ' ' + (el.getAttribute('title') || '')).trim();
      // SIZE is a MEANING proxy (small≈icon, big≈hero) — letting the collector cap at icon-size made it decide
      // informational-vs-decorative, which is the RUBRIC's job (it created a silent FN on a large informational bg).
      // Defer that call to the LLM: nominate any rendered NON-tracking-pixel bg that is NOT a full-bleed backdrop (a
      // near-full-screen background is the one case almost ALWAYS decorative), and let the rubric judge the rest from
      // the crop. Interactive elements are nominated at ANY size (a control labelled only by a bg-image is a barrier).
      const _vw = window.innerWidth || 1280, _vh = window.innerHeight || 800;
      const _fullBleed = box.width >= _vw * 0.8 && box.height >= _vh * 0.5; // a near-full-screen backdrop ⇒ decorative
      const _bgCandidate = box.width >= _BG_MIN_PX && box.height >= _BG_MIN_PX && !_fullBleed; // not a tracking pixel, not a full-bleed hero
      // INTERACTIVITY via the shared `_bgInteractive` (R2 G2-1) — the old `isInteractive` omitted onclick / tabindex /
      // role=option,spinbutton,textbox,searchbox, dropping those bg controls on the ACT path while eval-page kept them.
      // TEXT-BEARING CARVE-OUT (residual RCA S6, widened for the badged-over-control shape) — see
      // `_bgTextCarveOk` above, now shared with the in-frame `_bgMeaningful` twin.
      const _bgTextOk = _bgTextCarveOk(el, box, text);
      const backgroundImageMeaningful = /url\(/i.test(_bgi) && !ariaHidden && !presentational && !isImage
        && _bgTextOk && _accName.length === 0 && box.width > 0 && box.height > 0 && (_bgInteractive(el) || _bgCandidate);
      const backgroundImageUrl = backgroundImageMeaningful ? ((_bgi.match(/url\(["']?([^"')]+)["']?\)/i) || [])[1] || null) : null;
      // TT gap G3 (TT 7.D, 1.1.1): a CAPTCHA owes a non-visual AND non-auditory alternative — tightened, token-based
      // detection via the shared `_isCaptchaEl` (R2 G3-1: no longer a bare substring; title only on an iframe).
      const isCaptcha = _isCaptchaEl(el);
      // DETERMINISTIC BARRIER FLAGS (probe RUN5 fixes): an iframe excluded from tab order with operable inner
      // content (2.1.1), a focusable element inside an aria-hidden subtree (4.1.2), and a role=none/presentation
      // carrying a prohibited global ARIA prop (4.1.2). build-v3 mints a barrier obligation for each (axe-mint pattern).
      const iframeTabExcluded = _iframeTabExcluded(el);
      const focusableInAriaHidden = _focusableInAriaHidden(el);
      const prohibitedAriaAttr = _prohibitedAriaAttr(el, roleAttr);
      // 1.4.3 contrast APPLICABILITY (improvement B): text that is part of / labels an INACTIVE component has NO
      // contrast requirement (WCAG 1.4.3 exception for inactive UI components). The afw4f7 GT-inapplicable FPs are
      // exactly these — a <fieldset disabled>, a <div role=button aria-disabled>, a <label> named by an
      // aria-disabled control. Mark them so the oracle does NOT enumerate a text-contrast obligation (else they
      // fall through to the LLM, which reads the gray off the crop and over-flags — the residual vision contrast FP).
      const inactiveText = (() => {
        if (el.closest('[disabled],[aria-disabled="true"]')) return true; // self or ANCESTOR disabled (fieldset/control)
        // a <label> whose associated control is inactive — the control is a DESCENDANT (wrapping label) or via for=,
        // so closest() (which only goes up) cannot see it; only treat LABELS this way (not arbitrary containers).
        if (el.tagName.toLowerCase() === 'label') {
          if (el.querySelector('[disabled],[aria-disabled="true"]')) return true; // label WRAPS its disabled control
          const f = el.getAttribute('for'); if (f) { const c = el.ownerDocument.getElementById(f); if (c && (c.disabled || c.getAttribute('aria-disabled') === 'true')) return true; }
        }
        // text NAMED BY an inactive control via aria-labelledby (the control points at this element's id)
        if (el.id) { try { const r = el.ownerDocument.querySelector('[aria-labelledby~="' + CSS.escape(el.id) + '"]'); if (r && (r.disabled || r.getAttribute('aria-disabled') === 'true' || r.closest('[disabled],[aria-disabled="true"]'))) return true; } catch (e) {} }
        return false;
      })();
      const sectionHeading = (text.length > 0 || /^(input|select|textarea)$/i.test(el.tagName || '')) ? _sectionHeading(el) : null; // 2.4.6 visible section context (A) — labels AND fields
      // Audit #7 (1.1.1 confusable-text): the NEAREST declared language (lang= or xml:lang=, self-or-ancestor)
      // decides whether an all-Cyrillic/Greek fully-foldable word is legitimate text or a Latin-lookalike
      // substitution. Collected here (the adjudicator has no DOM) and threaded into detectConfusableText.
      const nearestLang = (() => {
        try { const le = el.closest && el.closest('[lang],[xml\\:lang]'); return le ? (le.getAttribute('lang') || le.getAttribute('xml:lang') || null) : null; } catch (e) { return null; }
      })();
      // item 12: mutedLiveRegionWiring keeps the MUTED live-region shape (admitted by the visibility
      // carve-out above) through this filter too — its ariaAttrs census is what the oracle's
      // mutedLiveRegionShape gate reads to mint the status-message obligation.
      if (!_subset && !focusable && !isFormField && !sampledRole && !text && !isImage && !liveRegion && !mutedLiveRegionWiring(el) && !isMedia && !autoMotion && !backgroundImageMeaningful && !isCaptcha && !iframeTabExcluded && !focusableInAriaHidden && !prohibitedAriaAttr) continue; // a pre-selected subset element is always included
      els.push({
        xpath: xpathOf(el),
        matchesTarget: matchesTarget(el), // #11 fix — see scorer precision comment above
        // (axName below is computed by labelledText(el, sampledRole) — name-from-contents gated by role)
        text,
        ownText,
        hasText: text.length > 0,
        inactiveText, // 1.4.3 contrast exemption (B): part of/labels an inactive component → no contrast obligation
        sectionHeading, // 2.4.6 (A): nearest preceding VISIBLE section heading (null if off-screen/none) — disambiguation context
        nearestLang, // audit #7 (1.1.1): nearest declared lang/xml:lang — the confusable-text lang steer
        focusable,
        isInteractive, ownsInteractiveDescendants, hasKeyHandler,
        isFormField,
        isImage,
        ariaAttrs,
        roleAttr,
        sampledRole,
        axRole: sampledRole,
        axName: labelledText(el, sampledRole),
        tag,
        type,
        href: href || null, // Item 14a: destination for the 2.4.4 same-name-link in-context index
        jsHref, enclosingBlockText, cellHeaderContext, // #11 onclick-nav target + #12 enclosing-block context + #12b table-cell row/col headers (2.4.4)
        htmlSnippet, enclosingHtml, // raw markup for the HTML-evidence ablation
        // heading level for the page-structure precompute branch (Tier-0 #3): aria-level wins, else h1-h6 tag.
        ariaLevel: el.getAttribute('aria-level') ? Number(el.getAttribute('aria-level')) : (/^h[1-6]$/.test(tag) ? Number(tag[1]) : null),
        box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
        inModal: !!el.closest('[role="dialog"],dialog,[aria-modal="true"]'),
        focusRisk,
        removedFromA11yTree,
        hiddenMechanism,
        renderedVisible, nearbyText, svgLiveText, svgNamedDescendant,
        ariaHiddenWithName, decorativeConflict,
        complexImageHint,
        captionText, // item 16b: dedicated figcaption/aria-describedby text for the long-description rubric (not eaten by the enclosingHtml cap)
        tabindexEffective, hasGlyphText, splitFieldGroup, // C8 small-signal predicates (parity)
        emulatedControlShape, emulatedControl: emulatedControlInline, // F42 (residual RCA S6) — shape + the inline half; the listener half is added in the CDP pass
        emulatedControlFocusableShape, emulatedControlFocusable: emulatedControlFocusableInline, // item 18 — the FOCUSABLE role-less F42 sub-case (same halves)
        // Item 13 (cheap scrutiny signals, parity with eval-page): a native control that overrides its role
        // (<button role=link>) → name-role scrutiny; a field's placeholder → field-label scrutiny (placeholder-as-label).
        roleOverridesNative: ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(tag) && !!roleAttr,
        placeholder: el.getAttribute('placeholder') || null,
        liveRegion,
        liveRegionHiddenAtRest,
        isMedia,
        mediaInfo,
        autoMotion,
        autoUpdatingContent, // #9 fix (TT 4.1.2 2.D): carousel/slideshow auto-rotation notification obligation
        underOverlay: focusable && _underOverlay(box),
        hasHoverContent: _hasHoverContent(el),
        backgroundImageMeaningful, backgroundImageUrl, isCaptcha, // TT gaps G2/G3 (1.1.1)
        iframeTabExcluded, focusableInAriaHidden, prohibitedAriaAttr, // deterministic barrier flags (2.1.1 / 4.1.2)
        iframeSrc: (tag === 'iframe' || tag === 'frame') ? (el.getAttribute('src') || '') : undefined, // 4.1.2 (4b1c6c): same-name iframe purpose-equivalence
        // ACT-REST Round 1 applicability facts (element-level; the runner re-measures the verdict).
        autocompleteApplicable: (() => {
          const EX = new Set(['hidden', 'button', 'submit', 'reset', 'image', 'checkbox', 'radio', 'file']);
          if (!(['input', 'select', 'textarea'].includes(tag) || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test((roleAttr || '').toLowerCase()))) return false;
          const ac = el.getAttribute('autocomplete'); if (ac == null || ac.trim() === '') return false;
          const first = ac.trim().toLowerCase().split(/\s+/)[0]; if (first === 'on' || first === 'off') return false;
          if (el.disabled === true || el.getAttribute('aria-disabled') === 'true') return false;
          if (tag === 'input' && EX.has((el.getAttribute('type') || '').toLowerCase())) return false;
          const c = getComputedStyle(el); return c.display !== 'none' && c.visibility !== 'hidden' && parseFloat(c.opacity || '1') > 0 && box.width > 0 && box.height > 0;
        })(),
        spacingImportant: (() => {
          const CK = new Set(['inherit', 'unset', 'revert', 'revert-layer']);
          const locks = ['letter-spacing', 'word-spacing', 'line-height'].some((p) => el.style.getPropertyPriority(p) === 'important' && !CK.has((el.style.getPropertyValue(p) || '').trim().toLowerCase()));
          if (!locks) return false;
          const c = getComputedStyle(el); const r = el.getBoundingClientRect();
          const vis = c.display !== 'none' && c.visibility !== 'hidden' && parseFloat(c.opacity || '1') > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0;
          return vis && (el.textContent || '').trim().length > 0;
        })(),
      });
    }
    // ACT-REST Round 1: head <meta> element records — viewport (1.4.4) + FIRST valid refresh (2.2.1). Full-page
    // collection only (a re-collected subset targets specific body elements). Metas live in <head>, so the
    // body-scan loop never included them (no double-count). Minimal records ⇒ only their own family enumerates.
    if (!_subset) {
      const validRefresh = (c) => { if (c == null) return false; const m = c.match(/^[ \t\n\f\r]*(\d+(?:\.\d+)?)/); if (!m) return false; const after = c.slice(m[0].length); return !(after.length && !/^[;,\s]/.test(after)); };
      const fr = [...document.querySelectorAll('meta[http-equiv="refresh" i]')].find((m) => validRefresh(m.getAttribute('content')));
      if (fr) els.push({ xpath: xpathOf(fr), tag: 'meta', hasText: false, focusable: false, isFormField: false, metaRefreshValid: true, metaContent: fr.getAttribute('content') });
      // the FIRST KEYED viewport meta is the obligation target; the runner reads ALL of them (b4f0c3 applies to each).
      const vp = [...document.querySelectorAll('meta[name="viewport" i]')].find((m) => /(^|[,;\s])(user-scalable|maximum-scale)\s*=/i.test(m.getAttribute('content') || ''));
      if (vp) els.push({ xpath: xpathOf(vp), tag: 'meta', hasText: false, focusable: false, isFormField: false, metaViewportKeyed: true, metaContent: vp.getAttribute('content') });
    }
    // IFRAME TRAVERSAL (coverage audit, akn7bn 2.1.1): descend ONE level into SAME-ORIGIN iframes and collect
    // their interactive content with a NAMESPACED xpath (`<iframeXpath>>>/<in-frame xpath>`) + inFrame:true.
    // Cross-origin frames throw on contentDocument → skipped. The namespaced xpath is opaque-but-stable for the
    // obligation id; downstream resolution degrades safely (vision page.evaluate is .catch-guarded; the candidate
    // generator skips experiment candidates for inFrame elements), so an in-frame subject reaches the agent lane
    // (2.1.1 keyboard-operable) without a top-doc experiment ever trying to drive an unresolvable xpath.
    function xpathOfInDoc(e, doc) {
      if (!e || !e.tagName) return '';
      if (e === doc.documentElement) return '/html';
      if (e === doc.body && e.tagName === 'BODY') return '/html/body'; // #10c fix: same frameset-doc.body-alias guard as xpathOf
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOfInDoc(e.parentElement, doc) + '/' + tag + '[' + idx + ']';
    }
    // frame-sourced headings (#2 FP/FN fix): a frameset page's real content — and its headings — live in a child
    // <frame>/<iframe>, never the bare top-level document. Collected in the SAME loop as the interactive-element
    // frame traversal below (reusing its `prefix`/`fdoc`/`xpathOfInDoc`) so each heading gets a fully CDP-resolvable
    // `<frameXpath>>>/<in-frame xpath>` — the resolveAx pass below already splits on '>>' and descends
    // contentDocument between segments, so these get the SAME authoritative accessible-name resolution as a
    // top-document heading, not a degraded fallback.
    const frameHeadings = [];
    // #3 fix (2.4.2 frameset title): document.title (below, "title") is the OUTER document's title — genuinely
    // authoritative for what AT/the browser tab reports for a frameset page, so it stays the primary signal.
    // But the page-title-v0 rubric judges whether that title matches what's ACTUALLY rendered, and a frameset's
    // real content lives in a child frame that may carry its OWN, DIFFERENT <title> (e.g. an outer "XYZ News
    // Company" wrapping a child document titled "XYZ Grocery Store" — a real DHS Trusted-Tester topic-mismatch
    // case). Surface each distinct non-empty child title as an explicit signal so the rubric can cross-reference
    // it against the outer title instead of relying solely on visually reconciling a screenshot against text.
    const frameTitles = [];
    for (const frame of (_subset ? [] : document.querySelectorAll('iframe, frame'))) { // subset = explicit selection; skip auto-traversal
      if (els.length >= cap) { _cappedOut = true; break; }
      let fdoc = null;
      try { fdoc = frame.contentDocument; } catch (e) { fdoc = null; } // cross-origin SecurityError → skip
      if (!fdoc || !fdoc.body) continue;
      const ft = (fdoc.title || '').trim();
      if (ft && ft !== document.title && frameTitles.indexOf(ft) === -1 && frameTitles.length < 8) frameTitles.push(ft);
      const prefix = xpathOf(frame) + '>>';
      for (const h of fdoc.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')) {
        if (frameHeadings.length >= 60) break;
        const tg = h.tagName.toLowerCase();
        const b = h.getBoundingClientRect();
        frameHeadings.push({
          tag: tg, role: h.getAttribute('role') || (/^h[1-6]$/.test(tg) ? 'heading' : null),
          level: h.getAttribute('aria-level') ? Number(h.getAttribute('aria-level')) : (/^h([1-6])$/.test(tg) ? Number(tg[1]) : null),
          text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          xpath: prefix + xpathOfInDoc(h, fdoc),
          name: labelledText(h, 'heading'),
          ariaHidden: h.getAttribute('aria-hidden') === 'true' || !!h.closest('[aria-hidden="true"]'),
          offscreen: b.x <= -1000 || b.y <= -1000 || (b.width <= 1 && b.height <= 1),
          inFrame: true,
        });
      }
      for (const el of fdoc.querySelectorAll('body *')) {
        if (els.length >= cap) { _cappedOut = true; break; }
        if (!visible(el)) continue;
        const tag = el.tagName.toLowerCase();
        const roleAttr = el.getAttribute('role') || '';
        const type = el.getAttribute('type') || '';
        const href = el.getAttribute('href') || '';
        const text = textOf(el).slice(0, 240);
        let ownText = ''; for (const n of el.childNodes) if (n.nodeType === 3) ownText += n.textContent;
        ownText = ownText.replace(/\s+/g, ' ').trim().slice(0, 400);
        const sampledRole = roleAttr || nativeRoleInPage(tag, type, href);
        const focusable = focusableByMarkup(el);
        const isFormField = fieldLike(el);
        const isImage = tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img' || (tag === 'input' && type === 'image');
        const box = el.getBoundingClientRect();
        // R2 G3-2: compute the SAME bg-meaning / captcha facts in-frame as the top level (the old in-frame branch
        // omitted them, so an in-frame captcha / bg control never enumerated its 7.D / 7.C obligation).
        const _frameCaptcha = _isCaptchaEl(el);
        const { meaningful: _frameBgM, url: _frameBgU } = _bgMeaningful(el, box);
        if (!focusable && !isFormField && !sampledRole && !text && !isImage && !_frameCaptcha && !_frameBgM) continue;
        els.push({
          xpath: prefix + xpathOfInDoc(el, fdoc), inFrame: true,
          matchesTarget: matchesTarget(el), // #11 fix — el.matches() works identically for an in-frame element
          text, ownText, hasText: text.length > 0, focusable,
          isInteractive: focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole),
          isFormField, isImage, ariaAttrs: el.getAttributeNames().filter((n) => n.indexOf('aria-') === 0),
          roleAttr, sampledRole, axRole: sampledRole, axName: labelledText(el, sampledRole), tag, type,
          box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
          inModal: false, focusRisk: false, underOverlay: false, hasHoverContent: false,
          backgroundImageMeaningful: _frameBgM, backgroundImageUrl: _frameBgU, isCaptcha: _frameCaptcha, // R2 G3-2 parity
          iframeSrc: (tag === 'iframe' || tag === 'frame') ? (el.getAttribute('src') || '') : undefined, // 4.1.2 (4b1c6c): a NESTED same-named iframe (srcdoc) needs its src for purpose-equivalence
          // #10g fix: the old in-frame branch never set these (unlike the top-document loop, which has computed
          // them since always) — every markup-driven rubric judged an in-frame subject with EMPTY raw HTML, no
          // matter what the HTML-evidence gate said. Confirmed live: a 1.3.1 field-association rubric, shown
          // axName:"First Name*" (correctly resolved after #10f) but no markup, still claimed "not programmatically
          // associated" for a genuinely well-labeled in-frame form — the rubric is DELIBERATELY built to verify
          // label association from raw markup rather than trust axName alone (the whole point of the sibling
          // 5_C-3 case: a `<span for>` computes an empty axName legitimately, so trusting axName masks THAT
          // barrier — the rubric can't have it both ways without seeing the markup). outerHTML/parentElement are
          // plain DOM properties, unaffected by which document owns `el` — no frame-awareness issue here at all.
          htmlSnippet: (el.outerHTML || '').slice(0, 2000),
          enclosingHtml: el.parentElement ? (el.parentElement.outerHTML || '').slice(0, 2800) : null,
        });
      }
    }
    // SHADOW-DOM iframe collection (4.1.2 4b1c6c Passed Ex9 + shadow barriers): the main walk and the iframe query
    // above use querySelectorAll, which does NOT cross shadow boundaries, so a same-named <iframe> inside an OPEN
    // shadow root is invisible to the duplicate-name-equivalence check. Recursively descend open shadow roots and
    // collect each RENDERED iframe as a top-level iframe RECORD (tag / axName / iframeSrc) so it joins the same-name
    // index. The box-size gate excludes the UNRENDERED light-DOM children a shadow host hides (Passed Ex9's page-two
    // frame), so a frame the user never sees does not invent a barrier. Cross-origin frame CONTENTS are still not read.
    if (!_subset) {
      const walkShadow = (host, hostXpath, depth) => {
        const sr = host.shadowRoot;
        if (!sr || depth > 4) return;
        const sprefix = hostXpath + '>>shadow';
        for (const ifr of sr.querySelectorAll('iframe, frame')) {
          if (els.length >= cap) { _cappedOut = true; return; }
          const box = ifr.getBoundingClientRect();
          if (box.width < 8 || box.height < 8) continue; // unrendered (or shadow-hidden light child) ⇒ skip
          const tag = ifr.tagName.toLowerCase();
          els.push({
            xpath: sprefix + '/' + tag + (ifr.id ? `[@id="${ifr.id}"]` : '[1]'), inFrame: true, inShadow: true,
            text: '', hasText: false, focusable: false, isInteractive: false, isFormField: false, isImage: false,
            ariaAttrs: ifr.getAttributeNames().filter((n) => n.indexOf('aria-') === 0),
            roleAttr: ifr.getAttribute('role') || '', sampledRole: '', axRole: '', axName: labelledText(ifr, ''), tag, type: '',
            box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
            inModal: false, focusRisk: false, underOverlay: false, hasHoverContent: false,
            iframeSrc: ifr.getAttribute('src') || '',
          });
          walkShadow(ifr, sprefix + '/' + tag, depth + 1); // an iframe can itself host a shadow root (rare)
        }
        for (const node of sr.querySelectorAll('*')) if (node.shadowRoot) walkShadow(node, sprefix + '/' + node.tagName.toLowerCase() + (node.id ? `[@id="${node.id}"]` : ''), depth + 1);
      };
      for (const host of document.querySelectorAll('*')) if (host.shadowRoot) walkShadow(host, xpathOf(host), 0);
    }
    // PAGE STRUCTURE (Tier-0 #3, parity with eval-page.js): the heading tree + landmarks the page-structure /
    // grouping rubrics (2.4.2/2.4.6/2.4.10/1.3.1) promise. Headings include OFF-SCREEN ones (an off-viewport
    // heading the viewport crop omits, e.g. b49b2e `top:-9999px`, must still be enumerated) with an offscreen flag.
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].slice(0, 60).map((h) => {
      const tg = h.tagName.toLowerCase();
      const b = h.getBoundingClientRect();
      return {
        tag: tg, role: h.getAttribute('role') || (/^h[1-6]$/.test(tg) ? 'heading' : null),
        level: h.getAttribute('aria-level') ? Number(h.getAttribute('aria-level')) : (/^h([1-6])$/.test(tg) ? Number(tg[1]) : null),
        text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        // S7 (RCA R7): a heading's accessible NAME (may differ from textContent — an <img alt> heading, an
        // aria-label) and whether it is aria-hidden (announced to AT? if hidden it does NOT organize content).
        xpath: xpathOf(h),                 // S7/#2: so the CDP pass can source the heading's authoritative accessible name
        name: labelledText(h, 'heading'),  // heuristic fallback; overwritten by the CDP name below
        ariaHidden: h.getAttribute('aria-hidden') === 'true' || !!h.closest('[aria-hidden="true"]'),
        offscreen: b.x <= -1000 || b.y <= -1000 || (b.width <= 1 && b.height <= 1),
      };
    });
    // #2 fix: fold in frame-sourced headings (frameHeadings, collected above alongside the interactive-element
    // frame traversal), respecting the SAME combined 60-heading cap as the top-document-only path before it.
    if (headings.length < 60) headings.push(...frameHeadings.slice(0, 60 - headings.length));
    const landmarks = [...document.querySelectorAll('main,nav,header,footer,aside,[role=main],[role=navigation],[role=banner],[role=contentinfo],[role=complementary],[role=search],[role=region]')].slice(0, 40)
      .map((l) => ({ tag: l.tagName.toLowerCase(), role: l.getAttribute('role') || null }));
    return {
      title: document.title || '',
      frameTitles, // #3 fix: distinct non-empty child-frame <title> values that differ from the outer title
      lang: document.documentElement.getAttribute('lang') || '',
      headings,
      landmarks,
      elements: els,
      reflowApplicable: false,
      truncated: _subset ? false : _cappedOut,   // EN C.9.6.2: the cap stopped the scan before the DOM was exhausted (a subset is never truncated)
      domElementCount: _subset ? _subset.length : _domTotal, // subset ⇒ the subset IS the complete element population
      subset: !!_subset,            // collected from a pre-selected xpath list (the 80-cap did not apply)
    };
  }, elementCap, Array.isArray(opts.xpaths) ? opts.xpaths : null, normalizeTargetSelectors(opts.targetSelectors));

  // ── CDP ACCESSIBLE-NAME / ROLE / TREE-MEMBERSHIP pass ────────────────────────────────────────────────────
  // The in-page labelledText is a HEURISTIC re-implementation of Chrome's accessible-name algorithm; it has
  // needed patch after patch (name-from-contents, SVG anchors, submit/reset UA-defaults) and would keep leaking
  // (cell names, aria-labelledby chains over hidden subtrees, locale-specific defaults). Source the
  // AUTHORITATIVE name + role + a11y-tree membership from Chrome's COMPUTED AX node — exactly as eval-page.js
  // (:586-600) — so the common path has ZERO hand-coded accname rules. The heuristic axName survives only as a
  // degraded FALLBACK when a node cannot be resolved (e.g. a cross-origin frame's contentDocument is null). Uses
  // the same `>>`-frame descent as query_ax_node (S4). Never throws — CDP failure leaves every heuristic value.
  let pageDelegatedListenerTypes = [];
  try {
    const cdp = await page.target().createCDPSession();
    await cdp.send('Accessibility.enable').catch(() => {});
    await cdp.send('DOM.getDocument', { depth: -1 }).catch(() => {});
    const resolveAx = async (xpath) => {
      if (typeof xpath !== 'string' || !xpath) return null;
      // SVG/MathML NAMESPACE FALLBACK (7d6734 1.1.1 FP): a namespaced node (svg/circle/math) returns null from a
      // plain `document.evaluate('/html/body/svg[1]')` because the engine matches names case-sensitively in the
      // null namespace. When a segment fails, RETRY it with each lowercase `tag[idx]` step rewritten to
      // `*[local-name()="tag"][idx]` (leaving @attr / * / () / :: / predicates intact) — applied PER `>>` frame
      // segment so cross-frame descent is preserved. Fallback-only: `local-name()="div"` matches HTML identically,
      // so a successfully-resolving HTML xpath is never perturbed (near-zero regression).
      const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var nsf=function(s){return s.split('/').map(function(p){var m=p.match(/^([a-zA-Z][\\w-]*)(\\[[0-9]+\\])?$/);return m?'*[local-name()="'+m[1]+'"]'+(m[2]||''):p;}).join('/');};var parts=${JSON.stringify(xpath)}.split('>>');var doc=document,n=null;for(var i=0;i<parts.length;i++){if(!doc)return null;var r=doc.evaluate(parts[i],doc,null,9,null);n=r.singleNodeValue;if(!n){try{n=doc.evaluate(nsf(parts[i]),doc,null,9,null).singleNodeValue;}catch(e){n=null;}}if(!n)return null;if(i<parts.length-1){try{doc=n.contentDocument;}catch(e){return null;}}}return n;})()`, returnByValue: false }).catch(() => null);
      if (!ev || !ev.result || !ev.result.objectId) return null;
      const objectId = ev.result.objectId;
      const dn = await cdp.send('DOM.describeNode', { objectId }).catch(() => null);
      const backendNodeId = dn && dn.node && dn.node.backendNodeId;
      if (!backendNodeId) return null;
      const r = await cdp.send('Accessibility.getAXNodeAndAncestors', { backendNodeId }).catch(() => null);
      // CROSS-FRAME LISTENER RESOLUTION (residual RCA S7). `objectId` above is minted by a
      // `Runtime.evaluate` in the TOP frame's execution context; for a node that actually lives in a child
      // frame, `DOMDebugger.getEventListeners` on it returns `[]` — silently, indistinguishable from "this
      // element has no listeners". Re-resolve from the backendNodeId, which CDP binds in the NODE'S OWN
      // context, and hand that to the listener query instead. `backendNodeId` also rides along so callers
      // can resolve ancestors the same way.
      const own = await cdp.send('DOM.resolveNode', { backendNodeId }).catch(() => null);
      const listenerObjectId = (own && own.object && own.object.objectId) || objectId;
      return { ax: (r && r.nodes && r.nodes[0]) || null, objectId, listenerObjectId, backendNodeId };
    };
    // Bounded budget for listener queries on NON-focusable elements (focusable ones are always queried —
    // that set is already small and 2.1.2 depends on it). Keeps the 1.4.13 widening from turning a
    // thousand-element page into a thousand extra CDP round-trips.
    const LISTENER_QUERY_CAP = 120;
    let nonFocusableListenerQueries = 0;
    // DELEGATION ROOTS (residual RCA S7). `getEventListeners`' `depth` is DESCENDANT depth, so no value of
    // it ever reaches an ANCESTOR — a handler bound to `document`, `body`, or a container that dispatches
    // for its rows is invisible on every element it actually serves. Query the two page-level roots ONCE
    // and record which event types are delegated there, so a downstream reader can tell "this element has
    // no handler" from "this element's handler lives further up". Two round-trips per page, not per element.
    pageDelegatedListenerTypes = await (async () => {
      const types = new Set();
      for (const expr of ['document', 'document.body']) {
        const ev = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: false }).catch(() => null);
        const oid = ev && ev.result && ev.result.objectId;
        if (!oid) continue;
        const lr = await cdp.send('DOMDebugger.getEventListeners', { objectId: oid, depth: 0 }).catch(() => null);
        for (const l of ((lr && lr.listeners) || [])) types.add(String(l.type));
      }
      return [...types];
    })().catch(() => []);
    for (const el of data.elements || []) {
      const res = await resolveAx(el.xpath);
      const ax = res && res.ax;
      // 2.1.2 FOCUS-RISK, listener-derived (focusable elements ONLY, so the extra CDP round-trip is bounded
      // to the elements where a trap is even possible). The static `focusRisk` fact can see INLINE
      // onblur/onfocus/onfocusout attributes and a modal-ish ancestor — but across all 20 2.1.2 pages in the
      // synthetic corpus there were ZERO inline focus handlers: every trap was wired with addEventListener,
      // which no DOM snapshot can see. Without this the obligation was never enumerated and the trap
      // detector never ran, so a real trap scored `noObligation`.
      // The sweep is no longer focusable-only. A 1.4.13 hover trigger is very often a NON-focusable
      // `<span>`/`<abbr>` with an addEventListener('mouseenter') — invisible to `_hasHoverContent`, which
      // can only see inline handlers, popovertarget, ARIA refs and CSS `:hover` rules. So the obligation
      // was never enumerated for the listener-wired reveal, which is the modern way to write one. Widened
      // to any RENDERED element, with a hard cap on the extra non-focusable queries so a large page cannot
      // multiply CDP round-trips without bound.
      const wantsListeners = el.focusable === true
        || (nonFocusableListenerQueries < LISTENER_QUERY_CAP && el.box && el.box.width > 0 && el.box.height > 0);
      if (res && (res.listenerObjectId || res.objectId) && wantsListeners) {
        if (el.focusable !== true) nonFocusableListenerQueries++;
        const elr = await cdp.send('DOMDebugger.getEventListeners', { objectId: res.listenerObjectId || res.objectId, depth: 0 }).catch(() => null);
        if (elr && Array.isArray(elr.listeners)) {
          const types = [...new Set(elr.listeners.map((l) => String(l.type)))];
          el.listenerTypes = types;
          if (el.focusable === true && types.some((t) => t === 'blur' || t === 'focus' || t === 'focusout' || t === 'focusin' || t === 'keydown')) {
            el.focusRisk = true;   // widens the static gate; the trap EXPERIMENT still decides whether it traps
          }
          // 1.4.13 (residual RCA S6): a pointer/focus-enter listener IS a hover-content trigger candidate.
          // Like focusRisk this only widens the GATE — the reveal experiment still decides whether anything
          // is actually revealed, so a hover handler that merely restyles never becomes a 1.4.13 finding.
          // `mousemove`/`pointermove` included (residual RCA S10): a tracked tooltip is wired on MOVE, not
          // enter — same applicability-only widening, the reveal experiment still decides what is revealed.
          if (types.some((t) => t === 'mouseenter' || t === 'mouseover' || t === 'pointerenter' || t === 'pointerover' || t === 'mousemove' || t === 'pointermove')) {
            el.hoverListener = true;
            if (el.hasHoverContent !== true) el.hasHoverContent = true;
          }
          // F42's other half. The in-page pass could only see INLINE on* attributes; a modern emulated
          // control is wired with addEventListener and is invisible there. `emulatedControlShape` already
          // carries every structural guard (not focusable, no interactive role, no interactive descendant,
          // not a page-sized delegation root), so this only supplies the activation-handler half.
          if (el.emulatedControlShape === true && el.emulatedControl !== true
              && types.some((t) => t === 'click' || t === 'keydown' || t === 'keypress' || t === 'keyup')) {
            el.emulatedControl = true;
          }
          // item 18: the FOCUSABLE role-less twin's listener half — same activation-type set. A focusable
          // element is always listener-queried (wantsListeners above), so this half is never budget-capped.
          if (el.emulatedControlFocusableShape === true && el.emulatedControlFocusable !== true
              && types.some((t) => t === 'click' || t === 'keydown' || t === 'keypress' || t === 'keyup')) {
            el.emulatedControlFocusable = true;
          }
        }
        // ANCESTOR DELEGATION, one level up. The commonest real delegation is a container handling clicks
        // for its own rows/items (a <ul>, a <tbody>, a card grid), and that ancestor is exactly one hop
        // away. Resolving it costs one extra round-trip and only for elements that reported NO listeners of
        // their own, so the common case is unaffected.
        if (!Array.isArray(el.listenerTypes) || !el.listenerTypes.length) {
          const parentXpath = typeof el.xpath === 'string' ? el.xpath.replace(/\/[^/]+$/, '') : '';
          if (parentXpath && parentXpath !== '/html' && nonFocusableListenerQueries < LISTENER_QUERY_CAP) {
            const pres = await resolveAx(parentXpath);
            const poid = pres && (pres.listenerObjectId || pres.objectId);
            if (poid) {
              const plr = await cdp.send('DOMDebugger.getEventListeners', { objectId: poid, depth: 0 }).catch(() => null);
              const ptypes = [...new Set(((plr && plr.listeners) || []).map((l) => String(l.type)))];
              if (ptypes.length) el.ancestorListenerTypes = ptypes;
            }
          }
        }
      }
      if (!ax) continue;                                 // unresolved ⇒ keep the heuristic axName (degraded fallback)
      const nm = ax.name && ax.name.value;
      if (typeof nm === 'string') el.axName = nm;         // AUTHORITATIVE; '' is a real resolved-empty name
      if (ax.role && ax.role.value) el.cdpRole = ax.role.value; // authoritative computed role (S2 role gate prefers this)
      el.inTree = !ax.ignored;
      el.ignoredByModal = (ax.ignoredReasons || []).some((r) => r && (r.name === 'activeModalDialog' || r.name === 'inertSubtree')); // #3 guard
    }
    // #2: a heading's accessible NAME (used by 2.4.6/2.4.10) — source it authoritatively too (the heuristic
    // returns '' for an <h2><img alt="Foo"></h2> heading; CDP gives "Foo").
    for (const h of data.headings || []) {
      if (!h || !h.xpath) continue;
      const hres = await resolveAx(h.xpath);
      const ax = hres && hres.ax;
      const nm = ax && ax.name && ax.name.value;
      if (typeof nm === 'string') h.name = nm;
    }
    await cdp.detach().catch(() => {});
  } catch (e) { /* CDP unavailable ⇒ the page keeps its heuristic axNames (never throws) */ }

  // ── COLLECTOR LIVENESS ────────────────────────────────────────────────────────────────────────────────────
  // Every optional collector below is `.catch()`-guarded so a genuinely broken page never crashes a run. The
  // cost is that an in-page THROW is indistinguishable from "this page has no findings" — a whole lane can be
  // DEAD for an entire corpus run and every artifact still reads as a clean, empty result. That has now shipped
  // TWICE in this campaign from two independent causes: collect-colour-peers.js lost its `module.exports` and
  // the entire 1.4.1 peer lane was dead (196c4f19, fixed at f4fcce9b), and captureInventory referenced a helper
  // declared in a DIFFERENT serialized function, killing F102/G224 detection.
  //
  // `liveEval` keeps the fallback VALUE identical — the empty result still flows, nothing new can crash — and
  // only makes the throw OBSERVABLE, by recording (collector, message) on the collect artifact. build-v3 folds
  // that into `results.summary.collectorFailures`, which the run harnesses already persist per case, so a dead
  // lane is visible in the run artifacts afterwards rather than only in a live console. The message matters more
  // than the stack, so only the message is kept (clipped).
  //
  // DELIBERATELY NOT applied to the per-FRAME evaluates below: a cross-origin frame throws on evaluate by
  // design, so counting those would bury a real defect under expected noise.
  const collectorLiveness = [];
  // `arg` (optional) is forwarded as the evaluate argument — used by collectColourPeers to receive the
  // Node-side V3_COLOUR_TOKEN_LANE flag (the collector is self-contained and must not read env in-page).
  const liveEval = async (name, fn, empty, arg) => {
    try { return await (arg === undefined ? page.evaluate(fn) : page.evaluate(fn, arg)); } catch (e) {
      collectorLiveness.push({ collector: name, error: String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 300) });
      return empty;
    }
  };
  // Tier-0 #4: per-<table> relationship facts (separate evaluate so the self-contained extractor is shared with
  // eval-page.js). Read-only; any failure degrades to [] (never throws).
  const tables = await liveEval('collectTables', collectTables, []);
  // TT gap G1: per-list semantics (real ul/ol/dl + visually-apparent faux lists) for the 1.3.1 JUDGMENT.
  const lists = await liveEval('collectLists', collectLists, []);
  // 1.4.1 COLOUR PEER GROUPS (residual RCA S6): sets of structural peers distinguished ONLY by colour.
  // The element-level 1.4.1 aperture (link / form field / graphic surface) cannot see this shape at all,
  // because no individual element looks wrong — the failure is the contrast BETWEEN peers. Held-out over
  // the 926-page corpus: 84% of pages produce zero groups, mean 0.23/page, p90 = 1.
  // V3_COLOUR_TOKEN_LANE=1 (default off) additionally nominates text-less colour-token groups (status-dot
  // matrices) — see collect-colour-peers.js's token-lane header and HUNKS-colour-token-lane.md. The flag may
  // not be set on any scored run until the held-out aperture measurement has been reviewed.
  const colourPeerGroups = await liveEval('collectColourPeers', collectColourPeers, [],
    { tokenLane: process.env.V3_COLOUR_TOKEN_LANE === '1' });
  // 1.4.1 PER-FIELD RESOLVED COLOUR + STATE (residual RCA S10). Attached per ELEMENT below, not to `structure`:
  // it answers "what colour is THIS field, and is it in the coded state or the default one" for the subject the
  // judge is actually looking at. See collect-colour-peers.js for why the crops alone cannot answer that.
  // batch-3 item 29: the requirement-sourced colour-reference constructions ride along (as serializable regex
  // sources — the lexicon module cannot cross page.evaluate) so the collector can attach `colourKeyText`: the
  // page's own stated colour key (a legend stating which shade/lightness marks which state), which the member
  // fields of the coded set never received — the F81 critical-guard default then fired on fields whose key text
  // sat one element away. Fail-closed: no patterns ⇒ no key ⇒ byte-identical records.
  const fieldColourStates = await liveEval('collectFieldColourState', collectFieldColourState, [], {
    colourKeyPatterns: require('./color-reference-lexicon.js').PATTERNS.map((p) => ({ id: p.id, source: p.re.source })),
    properNounGuard: require('./color-reference-lexicon.js').PROPER_NOUN_PAIR.source,
  });
  // 1.4.3/1.4.1 RESOLVED FOREGROUND + EFFECTIVE BACKDROP. `precomputeSignals` builds the `contrast` signal —
  // the colour fact EVERY color-and-visual-text subject receives — from six element keys this collector never
  // emitted, so the signal degraded to a fixed stub asserting the backdrop was irreducible and telling the
  // judge to read the pixels, on every colour subject including the great majority whose text sits on a flat
  // opaque colour. See collect-colour-peers.js for the soundness rules (the contrast runner's CSS-side rules,
  // amortized, and strictly more conservative wherever the runner leans on rendered pixels).
  const textContrastFacts = await liveEval('collectTextContrastFacts', collectTextContrastFacts, []);
  // 1.3.1 F34 — whitespace-formatted columns / ASCII tables, where the row-column relationship is carried
  // only by runs of spaces that a screen reader collapses or reads straight through.
  const fauxColumns = await liveEval('collectFauxColumns', collectFauxColumns, []);
  // 3.3.1 — does the page's ERROR SUMMARY agree with which fields are actually flagged? The per-field
  // probe cannot see this: every field it examines is individually correct, and the misdirection lives in
  // the disagreement between the summary and reality.
  const errorSummaries = await liveEval('collectErrorSummary', collectErrorSummary, []);
  // 3.3.1 — the error state a server-rendered redisplay carries AS LOADED. The before/after driver the lane
  // routes through cannot see it (there is nothing to trigger) and ERASES it (the retained value clears), so
  // the only place this barrier ever exists is the state the page loaded in. See collect-error-summary.js.
  const atRestErrorStates = await liveEval('collectAtRestErrorState', collectAtRestErrorState, []);
  // 1.3.1 — does a visible group label have a programmatic counterpart? Trivially computable, previously in no
  // prompt, and its absence produced errors in BOTH directions on one page shape. See collectControlGroups.
  const controlGroups = await liveEval('collectControlGroups', collectControlGroups, []);
  // 1.3.1 EXACT DECLARED-STRUCTURE / GROUPING-STATE FACTS (residual RCA S10/S11) — four cheap deterministic
  // page-level facts (blockquote-without-source, dl order anomalies, ungrouped shared-name radio sets,
  // per-form required-state inventory), each converting a previously coin-flip page-level 1.3.1 UNCERTAIN
  // into a stated, checked result. See collectStructuralMarkupFacts for the reading rules.
  const structuralMarkupFacts = await liveEval('collectStructuralMarkupFacts', collectStructuralMarkupFacts,
    { blockquotesWithoutSource: [], dlOrderAnomalies: [], radioGroupsWithoutGrouping: [], requiredStateInventory: [], fieldsetsWithoutControls: [] });
  // 1.3.1 F2 — presentation used to convey meaning. Trigger set narrowed BY MEASUREMENT to strike-through
  // and small-caps (0.9% of pages); weight/size are how the web expresses hierarchy and were unusable.
  const stylingOutliers = await liveEval('collectStylingOutliers', collectStylingOutliers, { outlierGroups: [], inlineConventions: [] });
  // 2.4.2 TITLE-INSTANCE CONFLICT (batch-3 item 22, stale-in-family case-02). When the <title> VOLUNTEERS a
  // year token, check it against the page's identity surfaces (headings, named graphics, definition lists,
  // footer). null on every page whose title carries no year — the anti-richness firewall: an ABSENT token
  // can never fire this (foil case-06 is safe by construction), and body prose is deliberately NOT a
  // surface (a "last year (March 2025)" retrospective must not corroborate a stale title).
  const titleInstanceFacts = await liveEval('collectTitleInstanceFacts', collectTitleInstanceFacts, null);
  const titleInstanceConflict = (titleInstanceFacts && titleInstanceFacts.conflict === true) ? titleInstanceFacts : undefined;
  // 1.3.1 LABEL GEOMETRY vs PROGRAMMATIC ASSOCIATION (batch-3 item 20) — per-field records, attached below
  // by xpath like every other per-subject fact; a form with no cross-pairing yields [] and adds nothing.
  const labelGeometryMismatches = await liveEval('collectLabelGeometry', collectLabelGeometry, []);
  // 2.4.4 LINK-TARGET FACTS (residual RCA S10) — a same-document fragment href resolved to its target
  // element IN THE DOM (does it exist, what does its own heading/name say), plus per-link terminal path
  // segment / extension and the same-name-different-target flag. Replaces a stochastic resolve_destination
  // tool call on the name-vs-destination question with a fact: no network, no OCR, no variance.
  const linkTargetFacts = await liveEval('collectLinkTargetFacts', collectLinkTargetFacts, []);
  // BROAD-SCOPE VISUAL-STRUCTURE PROBE, run per-case (residual RCA S10 — the styled-non-semantic-heading
  // variance class). broad-scope-probes.js' visual-structure discovery — rendered heading/list/grid shapes
  // with no programmatic counterpart — previously ran ONLY under the opt-in broad-scope sidecar
  // (opts.runBroadScope), which no per-case harness enables, so the page-level 1.3.1 judge re-derived "is
  // that big bold line a heading?" from the crop on every run — a live-AX-check-shaped question and a
  // measured coin flip. The probe is ONE read-only evaluate on the already-loaded page (no new page, no
  // navigation, no mutation, early-exit at `limit` candidates), and every collected page owes the
  // page-level 1.3.1 obligation (the structure slot mints it), so the 1.3.1 gate holds by construction.
  // Only the HEADING discoveries are surfaced — the deterministic anchor the judge lacked; the probe's
  // list/grid shapes stay with the richer faux-list (collect-lists) and faux-column collectors above.
  // Not `liveEval` (the probe drives its own evaluate), but the same liveness disclosure applies.
  // `opts.visualStructureProbe === false` lets a unit test or caller skip the pass entirely.
  let visualHeadings = [];
  if (opts.visualStructureProbe !== false) {
    try {
      const vs = await probeVisualStructureDiscovery(page, { limit: 12 });
      visualHeadings = ((vs && vs.candidates) || [])
        .filter((c) => c && c.kind === 'visual-heading')
        .slice(0, 8)
        .map((c) => ({ path: c.path, tag: c.tag, role: c.role || null, text: c.text, fontSize: c.fontSize, fontWeight: c.fontWeight, box: c.box }));
    } catch (e) {
      collectorLiveness.push({ collector: 'probeVisualStructureDiscovery', error: String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 300) });
    }
  }
  // #2 fix: collectTables/collectLists are top-document-only (document.querySelectorAll) — a frameset page's
  // real headings/lists/tables live in a child <frame>/<iframe> (e.g. the DHS Trusted-Tester corpus), which
  // NEVER reached structure.tables/lists before this fix, regardless of --allow-file-access-from-files. Puppeteer's
  // page.frames() already gives direct Frame handles for the full (flattened) frame tree — reuse the SAME
  // self-contained extractors per same-origin child frame; a cross-origin frame throws on evaluate ⇒ .catch(() => []).
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const fTables = await frame.evaluate(collectTables).catch(() => []);
    for (const t of fTables) t.inFrame = true;
    tables.push(...fTables);
    const fLists = await frame.evaluate(collectLists).catch(() => []);
    for (const l of fLists) l.inFrame = true;
    lists.push(...fLists);
  }
  // NATIVE-<table> RECORDS FIRST across the frame merge (residual RCA S10 / Tier-3 ARIA grid). collectTables
  // now also emits `ariaTable: true` records for role=table/grid built from generic elements. The adjudicator
  // computes its tableAssociation projection over NATIVE records only (aria records carry no th/headers=
  // wiring), so every native record must sit at the SAME index in `structure.tables` as in that native-only
  // projection or the rubric's tables[i] ↔ perTable[i] cross-reference breaks. Within one document the
  // collector already returns natives first; a frame merge interleaves, so re-partition (stable) here.
  if (tables.some((t) => t && t.ariaTable === true)) {
    const _natT = tables.filter((t) => !(t && t.ariaTable === true));
    const _ariaT = tables.filter((t) => t && t.ariaTable === true);
    tables.length = 0; tables.push(..._natT, ..._ariaT);
  }
  if (tables.length > 20) tables.length = 20; // preserve collectTables' own per-page cap after merging frame content
  if (lists.length > 40) lists.length = 40;   // preserve collectLists' own per-page cap

  // #9 — HARVEST the auto-updating-text observation window installed above. The main evaluate + CDP name pass +
  // tables/lists have been running meanwhile, so usually little (often none) of the window remains to wait out.
  // An element qualifies as autoUpdatingText when, within the window, it saw RECURRING (>=2) text swaps AND is
  // VISIBLE AND is presented IN PARALLEL with other content (2.2.2's auto-updating clause: auto-start + parallel
  // — there is NO 5-second grace for auto-updating content, unlike moving/blinking/scrolling). Exclusions keep
  // it narrow and un-double-minted: an update inside a LIVE REGION follows the existing 4.1.3 status-message
  // lane (same aria-live guard the carousel lane uses), and an update inside a data-ride/data-bs-ride carousel
  // already carries autoUpdatingContent (the 4.1.2 auto-update-notification lane).
  if (autoUpdateWindowMs > 0) {
    const autoUpdXpaths = await page.evaluate(async (winMs) => {
      const st = window.__v3AutoUpdObs;
      if (!st) return [];
      const remain = st.t0 + winMs - Date.now();
      if (remain > 0) await new Promise((r) => setTimeout(r, remain));
      try { st.mo.disconnect(); } catch (e) {}
      try { delete window.__v3AutoUpdObs; } catch (e) {}
      function xpathOf(e) {
        if (!e || !e.tagName) return '';
        if (e === document.documentElement) return '/html';
        if (e === document.body && e.tagName === 'BODY') return '/html/body'; // #10c fix: same frameset-doc.body-alias guard as the inventory xpathOf
        const tag = e.tagName.toLowerCase();
        let idx = 1;
        for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
        return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
      }
      const out = [];
      for (const [el, rec] of st.hits) {
        if (rec.n < 2) continue;                       // recurring, not a one-shot update
        if (!el.isConnected) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0 || r.width <= 0 || r.height <= 0) continue;
        // live-region-owned updates route via the existing 4.1.3 lane (self OR ancestor — consistent with the
        // oracle's liveRegion guard on the carousel family); never double-mint here.
        if (el.closest('[aria-live="polite"],[aria-live="assertive"],[role="status"],[role="alert"],[role="log"],[role="marquee"],[role="timer"],[role="progressbar"]')) continue;
        // carousel-library containers already carry autoUpdatingContent (4.1.2) — no double-mint.
        const ride = el.closest('[data-ride],[data-bs-ride]');
        if (ride && /carousel|slider|slideshow/i.test((ride.getAttribute('data-ride') || '') + ' ' + (ride.getAttribute('data-bs-ride') || ''))) continue;
        // IN PARALLEL with other content: the updating element must carry text of its own AND the page must have
        // substantial other visible text (an updating element that IS the page — a clock page — is not "parallel").
        const ownLen = (el.innerText || '').replace(/\s+/g, ' ').trim().length;
        const bodyLen = ((document.body && document.body.innerText) || '').replace(/\s+/g, ' ').trim().length;
        if (!(ownLen > 0) || bodyLen - ownLen < 40) continue;
        out.push(xpathOf(el));
        if (out.length >= 12) break;                   // cap: nominate, don't flood (the rubric judges each)
      }
      return out;
    }, autoUpdateWindowMs).catch(() => []);
    const _updSet = new Set(autoUpdXpaths || []);
    for (const el of data.elements || []) el.autoUpdatingText = _updSet.has(el.xpath);
  }

  // OPT-IN axe run (axe-promotion): inject axe + resolve each finding node's CSS target to the SAME v3 xpath
  // scheme this collector uses (the xpathOf below is byte-identical to the inventory's), so build-v3 can match an
  // axe violation to its obligation exactly. read-only; any failure degrades to axeRan:false (never throws).
  let axeData = null;
  if (opts.runAxe && opts.axePath) {
    try {
      await page.addScriptTag({ path: opts.axePath });
      axeData = await page.evaluate(async () => {
        function xpathOf(e) {
          if (!e || !e.tagName) return '';
          if (e === document.documentElement) return '/html';
          if (e === document.body && e.tagName === 'BODY') return '/html/body'; // #10c fix: same frameset-doc.body-alias guard as the outer xpathOf
          const tag = e.tagName.toLowerCase();
          let idx = 1;
          for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
          return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
        }
        // GUARD (adversarial review): axe `target` is a per-frame array; a depth>1 target is a CHILD-frame node whose
        // last selector, querySelected against the TOP document, would miss or mis-resolve to a different top-level
        // node → wrong xpath. Return null for cross-frame targets (degrade to a shadow signal, never mis-attribute).
        const resolveXpath = (target) => { try { if (Array.isArray(target) && target.length > 1) return null; const sel = Array.isArray(target) ? target[0] : target; const el = sel ? document.querySelector(sel) : null; return el ? xpathOf(el) : null; } catch (e) { return null; } };
        // PASSES ALLOWLIST: a rubric may be told to DEFER to a checker that measured exactly its question —
        // use-of-color-v0 says "when the handed axe `link-in-text-block` signal reports PASS, DEFER to it".
        // That clause was UNREACHABLE: `resultTypes` did not include 'passes', so axe returned at most one
        // truncated node per passing rule and none were ever mapped. The rubric then judged unaided and
        // flagged links styled identically to their prose (1:1 contrast) — 3 of the run's 14 false positives.
        // Only allowlisted rules are carried so the artifact does not balloon with every passing check.
        const PASS_ALLOW = new Set(['link-in-text-block']);
        const cfg = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete', 'passes'] };
        const r = await axe.run(document, cfg);
        const map = (arr) => (arr || []).map((v) => ({ id: v.id, impact: v.impact, wcag: (v.tags || []).filter((t) => /^wcag\d/.test(t)), nodes: (v.nodes || []).map((n) => ({ target: n.target, xpath: resolveXpath(n.target) })) }));
        return { violations: map(r.violations), incomplete: map(r.incomplete), passes: map((r.passes || []).filter((v) => PASS_ALLOW.has(v.id))) };
      }).catch(() => null);
    } catch (e) { axeData = null; }
  }

  // 1.3.3 SENSORY-CHARACTERISTICS applicability. The specialized ACT-rest evaluator used to be the only
  // caller that attached this fact, which meant production and saved-page runs could never enumerate the
  // existing sensory-characteristics obligation/rubric. Apply the same requirement-sourced lexicon here,
  // once in Node, over each collected element's OWN direct text. Applicability only; the LLM rubric decides
  // whether the reference identifies content and whether a non-sensory alternative is present.
  require('./sensory-lexicon.js').applySensoryHints(data.elements || []);

  // 1.4.1 COLOUR-REFERENCE pre-filter (residual RCA S6). Runs in NODE over each element's OWN text, exactly
  // like the 1.3.3 sensory pre-filter it is modelled on. The 1.3.3 lexicon deliberately EXCLUDES colour words
  // ("colour alone is SC 1.4.1's domain") and 1.4.1's own aperture is role-based — link / form field / graphic
  // surface — so a paragraph of INSTRUCTIONS identifying content by colour ("Green buttons advance the
  // application; red buttons cancel it") owed nothing to either SC and reached no judge. That is the
  // Understanding's own example of a 1.4.1 failure. Applicability only: the rubric decides whether the colour
  // reference actually identifies content and whether a non-colour alternative is given.
  {
    const { colorReferencesIn } = require('./color-reference-lexicon.js');
    const hits = [];
    for (const el of (data.elements || [])) {
      if (!el || !el.text || typeof el.text !== 'string') continue;
      // Bounded to elements that hold real prose: an instruction is a sentence, not a control's label. This
      // keeps the hint off every button named "Green" and off single-word cells.
      if (el.text.length < 12 || el.focusable === true || el.isFormField === true) continue;
      const refs = colorReferencesIn(el.text);
      if (refs.length) hits.push({ el, refs });
    }
    // DEEPEST HIT ONLY. `el.text` is the element's full subtree text, so one instruction sentence matched on
    // the <strong> that holds it AND on its <p>, <main> and wrapper <div> — four obligations for one sentence,
    // all pointing at the same words. Keep only the innermost element in each ancestor chain, which is the one
    // that actually owns the text and the one a reviewer would be shown.
    const hitPaths = hits.map((h) => h.el.xpath).filter((x) => typeof x === 'string');
    for (const { el, refs } of hits) {
      if (typeof el.xpath === 'string' && hitPaths.some((p) => p !== el.xpath && p.startsWith(el.xpath + '/'))) continue;
      el.colorWordHint = true;
      el.colorReferences = refs.slice(0, 4);
    }
  }

  // 1.4.1 PER-FIELD COLOUR/STATE ATTACHMENT (residual RCA S10). Joined in NODE by xpath, exactly like the
  // colour-reference pre-filter above: the page-side collector produced one record per form field whose field
  // set is NOT colour-uniform, and each record belongs to the element the judge will be handed. A field whose
  // form encodes nothing in colour gets no key at all, so the signal's mere PRESENCE already says "there is a
  // colour difference across this form's fields" — and its absence costs those prompts nothing.
  if (Array.isArray(fieldColourStates) && fieldColourStates.length) {
    const byXpath = new Map();
    for (const el of (data.elements || [])) if (el && typeof el.xpath === 'string') byXpath.set(el.xpath, el);
    for (const rec of fieldColourStates) {
      if (!rec || typeof rec.xpath !== 'string') continue;
      const el = byXpath.get(rec.xpath);
      if (!el) continue;                    // collected under a cap / different frame — never synthesize an element
      const { xpath, ...facts } = rec;      // the element already carries its xpath
      el.fieldColourState = facts;
    }
  }

  // TEXT CONTRAST FACTS ATTACHMENT. Same xpath join. These are the six keys `precomputeSignals` already reads
  // (`color`, `effBg`, `contrastReliable`, `contrastSolid`, `contrastUnreliableReason`, `needsPixelContrast`),
  // so no adjudicator wiring is added — the existing branch stops reading a stub and starts reading facts.
  // Assigned key-by-key and only when absent, so a key another lane already set on this element is never
  // overwritten, and an element the collector could not resolve keeps exactly what it had.
  if (Array.isArray(textContrastFacts) && textContrastFacts.length) {
    const byXpath = new Map();
    for (const el of (data.elements || [])) if (el && typeof el.xpath === 'string') byXpath.set(el.xpath, el);
    for (const rec of textContrastFacts) {
      if (!rec || typeof rec.xpath !== 'string') continue;
      const el = byXpath.get(rec.xpath);
      if (!el) continue;                    // collected under a cap / different frame — never synthesize an element
      for (const k of ['color', 'effBg', 'contrastReliable', 'contrastSolid', 'contrastThreshold', 'needsPixelContrast', 'contrastUnreliableReason']) {
        if (rec[k] !== undefined && el[k] === undefined) el[k] = rec[k];
      }
    }
  }

  // 3.3.1 AT-REST ERROR STATE + 1.3.1 CONTROL-GROUP CORRESPONDENCE — same xpath join. Both are per-SUBJECT
  // facts (the 3.3.1 and 1.3.1 rubrics judge ONE field at a time), so each record is attached to the element
  // the judge will be handed; the control-group record additionally goes onto `structure` for the page-level
  // 1.3.1 pseudo-element. Neither key existed before, so nothing that reads an element record changes.
  if ((Array.isArray(atRestErrorStates) && atRestErrorStates.length) || (Array.isArray(controlGroups) && controlGroups.length)) {
    const byXpath = new Map();
    for (const el of (data.elements || [])) if (el && typeof el.xpath === 'string') byXpath.set(el.xpath, el);
    for (const rec of (atRestErrorStates || [])) {
      if (!rec || typeof rec.xpath !== 'string') continue;
      const el = byXpath.get(rec.xpath);
      if (!el) continue;
      const { xpath, ...facts } = rec;
      el.atRestErrorState = facts;
    }
    for (const g of (controlGroups || [])) {
      if (!g || !Array.isArray(g.members)) continue;
      // one record per SET, attached to each of its members — the set IS the subject's context, and a member
      // handed only its own markup cannot see that it is one of several answers to a single question.
      const { members, ...rest } = g;
      for (const m of members) {
        if (!m || typeof m.xpath !== 'string') continue;
        const el = byXpath.get(m.xpath);
        if (!el) continue;
        el.controlGroup = { ...rest, members, thisMember: m.xpath };
      }
    }
  }

  // 1.3.1 PAGE-LEVEL CONTROL-GROUP SUMMARY (residual RCA S11). The per-member `controlGroup` records above
  // reach only ELEMENT-level subjects, but the group question — "is the visible question these controls
  // answer tied to them programmatically?" — is judged on the PAGE-LEVEL info-relationships pseudo-element,
  // which until now received none of this: the fact was collected per element and never threaded to the
  // subject where the question is actually asked. One compact page-wide summary — per group: the members,
  // the visible label-like text preceding the set, and whether a programmatic group NAME exists — plus the
  // xpaths of split-field parts (the `splitFieldGroup` fact minted for 4.1.2, routed to 1.3.1 here: a
  // multipart field is the same set-of-parts-answering-one-question shape, and its group question belongs
  // to this subject too). The adjudicator threads it to the page-level subject; absent — and cost-free —
  // on any page with no qualifying set.
  const _splitFieldXpaths = (data.elements || [])
    .filter((el) => el && el.splitFieldGroup === true && typeof el.xpath === 'string')
    .map((el) => el.xpath).slice(0, 12);
  const _splitFieldSet = new Set(_splitFieldXpaths);
  const controlGroupsSummary = ((controlGroups || []).length || _splitFieldXpaths.length) ? {
    groups: (controlGroups || []).slice(0, 8).map((g) => ({
      kind: g.kind,
      memberCount: g.memberCount,
      memberXpaths: (g.members || []).map((m) => m && m.xpath).filter((x) => typeof x === 'string').slice(0, 12),
      memberOwnNames: (g.members || []).slice(0, 12).map((m) => (m && m.ownName) || null),
      containerXpath: g.containerXpath,
      correspondence: g.correspondence,
      hasProgrammaticGroupName: !!(g.programmaticGroup && String(g.programmaticGroup.accessibleName || '').trim()),
      programmaticGroup: g.programmaticGroup ? {
        mechanism: g.programmaticGroup.mechanism,
        accessibleName: g.programmaticGroup.accessibleName,
        nameRenderedOnScreen: g.programmaticGroup.nameRenderedOnScreen === true,
      } : null,
      visibleLabelCandidates: Array.isArray(g.precedingVisibleText) ? g.precedingVisibleText : [],
      membersAreSplitFieldParts: (g.members || []).some((m) => m && _splitFieldSet.has(m.xpath)),
    })),
    splitFieldGroupXpaths: _splitFieldXpaths,
  } : undefined;

  // 2.4.4 LINK-TARGET FACTS ATTACHMENT (residual RCA S10) — same xpath join. Each record is per LINK and
  // belongs to the element the judge will be handed; `linkTargetFacts` did not exist on any element before,
  // so nothing that reads an element record changes until an adjudicator branch surfaces it.
  if (Array.isArray(linkTargetFacts) && linkTargetFacts.length) {
    const byXpath = new Map();
    for (const el of (data.elements || [])) if (el && typeof el.xpath === 'string') byXpath.set(el.xpath, el);
    for (const rec of linkTargetFacts) {
      if (!rec || typeof rec.xpath !== 'string') continue;
      const el = byXpath.get(rec.xpath);
      if (!el) continue;                    // collected under a cap / not in the inventory — never synthesize an element
      // item 27: `cueParity` is SPLIT OUT of linkTargetFacts before attachment. The adjudicator spreads the
      // whole linkTargetFacts object into the 2.4.4 prompt, and the cue-parity facts belong to a 1.4.1
      // rubric clause that is USER-PENDING — carried as a separate, currently-unread element key so the
      // 2.4.4 payload stays byte-identical until that doctrine decision lands.
      const { xpath, cueParity, ...facts } = rec; // the element already carries its xpath
      el.linkTargetFacts = facts;
      if (cueParity) el.linkCueParity = cueParity;
    }
  }

  // 1.3.1 LABEL-GEOMETRY MISMATCH ATTACHMENT (batch-3 item 20) — same xpath join; the key did not exist on
  // any element before, so nothing that reads an element record changes until an adjudicator branch surfaces it.
  if (Array.isArray(labelGeometryMismatches) && labelGeometryMismatches.length) {
    const byXpath = new Map();
    for (const el of (data.elements || [])) if (el && typeof el.xpath === 'string') byXpath.set(el.xpath, el);
    for (const rec of labelGeometryMismatches) {
      if (!rec || typeof rec.xpath !== 'string') continue;
      const el = byXpath.get(rec.xpath);
      if (!el) continue;                    // collected under a cap — never synthesize an element
      const { xpath, ...facts } = rec;
      el.labelGeometryMismatch = facts;
    }
  }

  return {
    file: opts.file || `act:${url}`,
    sourceUrl: opts.sourceUrl || url,
    runId: opts.runId || 'act-run',
    pageDigest,
    collectedAt,
    elements: data.elements || [],
    elementCount: (data.elements || []).length,
    // EN C.9.6.2 "full pages" coverage disclosure: when the element cap truncated the scan, a page-clear covers
    // ONLY the collected prefix — a barrier past the cap is unseen by every v3 lane. Surfaced so the builder can
    // flag the page-clear as PARTIAL-COVERAGE rather than a full-page conformance claim. `cap` is the configured cap.
    coverage: { truncated: !!data.truncated, collected: (data.elements || []).length, domElementCount: data.domElementCount || null, cap: elementCap, subset: !!data.subset },
    page: { reflowApplicable: !!data.reflowApplicable, delegatedListenerTypes: pageDelegatedListenerTypes },
    structure: { title: data.title || '', frameTitles: data.frameTitles || [], lang: data.lang || '', headings: data.headings || [], landmarks: data.landmarks || [], tables: tables || [], lists: lists || [], colourPeerGroups: colourPeerGroups || [], fauxColumns, errorSummaries, controlGroups: controlGroups || [],
      // residual RCA S10/S11 — page-level 1.3.1 facts. `controlGroupsSummary` is undefined (⇒ dropped by
      // JSON) on pages with no qualifying control set and no split-field part, so untouched pages serialize
      // byte-identically but for the four (possibly empty) fact arrays below.
      controlGroupsSummary,
      blockquotesWithoutSource: (structuralMarkupFacts && structuralMarkupFacts.blockquotesWithoutSource) || [],
      dlOrderAnomalies: (structuralMarkupFacts && structuralMarkupFacts.dlOrderAnomalies) || [],
      radioGroupsWithoutGrouping: (structuralMarkupFacts && structuralMarkupFacts.radioGroupsWithoutGrouping) || [],
      requiredStateInventory: (structuralMarkupFacts && structuralMarkupFacts.requiredStateInventory) || [],
      fieldsetsWithoutControls: (structuralMarkupFacts && structuralMarkupFacts.fieldsetsWithoutControls) || [], // item 19c
      titleInstanceConflict, // item 22 — undefined (⇒ dropped by JSON) unless the title's own year token is contradicted by the page's identity surfaces
      visualHeadings,
      presentationOutliers: (stylingOutliers && stylingOutliers.outlierGroups) || [],
      presentationConventions: (stylingOutliers && stylingOutliers.inlineConventions) || [] },
    axe: axeData ? axeData.violations : [],
    axeIncomplete: axeData ? axeData.incomplete : [],
    // allowlisted PASSES only (see PASS_ALLOW): a rubric that is told to DEFER to a checker's pass needs the
    // pass to actually exist. Never a clearance on its own — it resolves one named DEFER clause.
    axePasses: axeData ? (axeData.passes || []) : [],
    axeRan: !!axeData,
    // COLLECTOR LIVENESS (see liveEval above): which `.catch()`-guarded collectors THREW on this page.
    // Empty on a healthy page. Surfaced beside `coverage` because it is the same kind of disclosure: the
    // artifact stating what it does NOT cover, rather than letting an empty result read as a clean one.
    collectorLiveness,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 1.3.1 — CONTROL-GROUP / VISIBLE-LABEL CORRESPONDENCE.
//
// WHY THIS EXISTS. Whether a set of controls governed by a visible group label is ALSO grouped programmatically
// is trivially computable — `fieldset` + `legend`, or `role="group"`/`role="radiogroup"` carrying an accessible
// name — and it was in no prompt at all. Measured on one page shape, that absence produced errors in BOTH
// directions from the same judge: on a set that WAS grouped (a `role="radiogroup"` naming its heading through
// `aria-labelledby`) it reported the visible text as "NOT programmatically associated" with the controls, an
// assertion the DOM directly contradicts; and on sets that were NOT grouped it declined to decide, reporting
// that it "could not confirm programmatic grouping" and "could not complete an accessibility-tree query" —
// having made no tool call at all. One fact answers all three: an invented absence is refuted by stating the
// association, and a fabricated excuse is removed by stating the absence.
//
// THE ASYMMETRY, which is the whole design problem. Stating the association POSITIVELY is free — it can only
// ever contradict a claim that the association is missing. Stating the ABSENCE positively is not free: absence
// of a programmatic group is only a barrier when a group relationship is actually OWED, and a fact that
// announces "a visible label governs these controls and nothing groups them" over every heading that happens
// to sit above a run of fields would manufacture barriers across ordinary, correct forms. So the absence is
// only ever stated for a set whose members genuinely form ONE question:
//   (A) two or more radios/checkboxes SHARING A CONTROL NAME — sharing a name is what makes them one question,
//       and their own labels ("Yes", "No", an amount) are by construction not self-sufficient; or
//   (B) two or more sibling controls of which NONE carries a label element, `aria-label` or `aria-labelledby` —
//       a set named, if at all, only by `title`/`placeholder`, which is the split-one-question-into-parts shape.
// A run of separately labelled fields under a section heading matches NEITHER, and is never reported.
//
// DECIDES NOTHING. It states which controls form a set, what visible text governs them, whether a programmatic
// group exists, what its accessible name is, and whether the two correspond. Whether the visible text is
// genuinely the question the controls answer — and so whether the relationship is required — stays with the
// rubric, and the note says so explicitly in both directions.
//
// Self-contained so it serializes through page.evaluate.
function collectControlGroups() {
  const MAX_GROUPS = 8, MAX_MEMBERS = 12, MAX_TEXT = 120;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const clip = (s, n) => norm(s).slice(0, n);
  const visible = (e) => {
    if (!e || !e.tagName) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const idsText = (e, attr) => {
    const v = e.getAttribute(attr);
    if (!v) return '';
    let t = '';
    for (const id of v.trim().split(/\s+/).slice(0, 4)) {
      let n = null;
      try { n = document.getElementById(id); } catch (err) { n = null; }
      if (n) t += ' ' + (n.textContent || '');
    }
    return clip(t, MAX_TEXT);
  };
  // A control's OWN label mechanism. `title` and `placeholder` are deliberately excluded: they are what the
  // split-question shape uses INSTEAD of a label, and treating them as labelling would hide exactly the set
  // this is meant to describe. Reported as data either way, never as a verdict.
  const ownLabel = (e) => {
    const lb = idsText(e, 'aria-labelledby');
    if (lb) return { via: 'aria-labelledby', text: lb };
    const al = clip(e.getAttribute('aria-label') || '', MAX_TEXT);
    if (al) return { via: 'aria-label', text: al };
    let lab = null;
    try { if (e.labels && e.labels.length) lab = e.labels[0]; } catch (err) { lab = null; }
    if (!lab) { try { lab = e.closest('label'); } catch (err) { lab = null; } }
    if (lab) return { via: 'label', text: clip(lab.textContent, MAX_TEXT), el: lab };
    return null;
  };
  const nearestForm = (e) => { try { return e.closest('form'); } catch (err) { return null; } };
  const commonAncestor = (els) => {
    let a = els[0];
    for (const e of els.slice(1)) { while (a && !a.contains(e)) a = a.parentElement; }
    return a || document.body;
  };
  const firstVisibleIdTarget = (e, attr) => {
    const v = e.getAttribute(attr);
    if (!v) return null;
    for (const id of v.trim().split(/\s+/).slice(0, 4)) {
      let n = null;
      try { n = document.getElementById(id); } catch (err) { n = null; }
      if (n && visible(n)) return n;
    }
    return null;
  };
  // The programmatic group, if any: the nearest ancestor of the whole set that groups it by one of the
  // mechanisms that actually create the relationship in the accessibility tree. The walk stops at the form
  // (and at 6 levels) so a wrapper far above the set is never credited with naming it.
  const programmaticGroup = (anc) => {
    let levels = 0;
    for (let p = anc; p && p !== document.documentElement && levels < 6; p = p.parentElement, levels++) {
      const tag = p.tagName.toLowerCase();
      const role = String(p.getAttribute('role') || '').toLowerCase();
      const lbEl = firstVisibleIdTarget(p, 'aria-labelledby');
      const lb = idsText(p, 'aria-labelledby');
      const al = clip(p.getAttribute('aria-label') || '', MAX_TEXT);
      if (tag === 'fieldset') {
        let leg = null;
        for (const c of p.children) if (c.tagName && c.tagName.toLowerCase() === 'legend') { leg = c; break; }
        if (leg) return { el: p, xpath: xpathOf(p), mechanism: 'fieldset+legend', accessibleName: clip(leg.textContent, MAX_TEXT), nameSource: visible(leg) ? { xpath: xpathOf(leg), rendered: true } : { xpath: xpathOf(leg), rendered: false } };
        if (lb) return { el: p, xpath: xpathOf(p), mechanism: 'fieldset+aria-labelledby', accessibleName: lb, nameSource: lbEl ? { xpath: xpathOf(lbEl), rendered: true } : { xpath: null, rendered: false } };
        if (al) return { el: p, xpath: xpathOf(p), mechanism: 'fieldset+aria-label', accessibleName: al, nameSource: { xpath: null, rendered: false } };
        return { el: p, xpath: xpathOf(p), mechanism: 'fieldset (no legend, no aria name)', accessibleName: '', nameSource: null };
      }
      if (role === 'group' || role === 'radiogroup') {
        if (lb) return { el: p, xpath: xpathOf(p), mechanism: 'role=' + role + '+aria-labelledby', accessibleName: lb, nameSource: lbEl ? { xpath: xpathOf(lbEl), rendered: true } : { xpath: null, rendered: false } };
        if (al) return { el: p, xpath: xpathOf(p), mechanism: 'role=' + role + '+aria-label', accessibleName: al, nameSource: { xpath: null, rendered: false } };
        return { el: p, xpath: xpathOf(p), mechanism: 'role=' + role + ' (no accessible name)', accessibleName: '', nameSource: null };
      }
      if (tag === 'form') break;                        // never credit a wrapper above the form with naming this set
    }
    return null;
  };
  // The visible text blocks immediately BEFORE the set, as CANDIDATES — deliberately a short list in document
  // order, not a single pick. Choosing one and calling it "the group label" is a judgment, and a first
  // implementation that made that pick chose a trailing help sentence over the question above it, and chose an
  // unrelated paragraph over a legend, producing a "the names differ" claim about correctly grouped controls.
  // Anchored at the set's own position inside its container, not at the container's own position.
  const precedingVisibleText = (anc, memberSet, labelEls) => {
    const ok = (n) => {
      if (!n || !n.tagName || memberSet.has(n) || labelEls.has(n)) return false;
      if (/^(script|style|noscript|legend)$/.test(n.tagName.toLowerCase())) return false;
      if (n.querySelector && n.querySelector('input, select, textarea, [role="radio"], [role="checkbox"]')) return false; // a block holding controls is not a label FOR them
      if (!visible(n)) return false;
      return norm(n.textContent).length >= 2;
    };
    // where the set STARTS inside `anc` — the top-most ancestor of the first member that is a child of `anc`.
    let start = null;
    for (const m of memberSet) { start = m; break; }
    if (start) { while (start && start.parentElement && start.parentElement !== anc) start = start.parentElement; }
    const found = [];
    const scanBack = (from) => {
      let seen = 0;
      for (let s = from; s && found.length < 3 && seen < 10; s = s.previousElementSibling, seen++) {
        if (ok(s)) found.push({ xpath: xpathOf(s), text: clip(s.textContent, MAX_TEXT), tag: s.tagName.toLowerCase() });
      }
    };
    if (start && start.parentElement === anc) scanBack(start.previousElementSibling);
    let node = anc, levels = 0;
    while (found.length < 3 && node && levels < 4) {
      scanBack(node.previousElementSibling);
      if (node === document.body) break;
      node = node.parentElement; levels++;
    }
    return found.reverse();                              // document order — the question reads before its help text
  };

  const sets = [];
  // (A) radios / checkboxes sharing a control name — one question by construction.
  const byName = new Map();
  for (const el of document.querySelectorAll('input[type="radio" i], input[type="checkbox" i]')) {
    if (!visible(el)) continue;
    const nm = el.getAttribute('name');
    if (!nm) continue;
    const f = nearestForm(el);
    const key = (f ? xpathOf(f) : 'document') + '|' + String(el.getAttribute('type') || '').toLowerCase() + '|' + nm;
    if (!byName.has(key)) byName.set(key, []);
    const g = byName.get(key);
    if (g.length < MAX_MEMBERS) g.push(el);
  }
  for (const [, members] of byName) if (members.length >= 2) sets.push({ kind: 'shared-control-name', members });
  // (B) sibling controls of which NONE carries a label / aria-label / aria-labelledby.
  const bySibling = new Map();
  for (const el of document.querySelectorAll('input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]), select, textarea')) {
    if (!visible(el)) continue;
    const p = el.parentElement; if (!p) continue;
    const key = xpathOf(p);
    if (!bySibling.has(key)) bySibling.set(key, []);
    const g = bySibling.get(key);
    if (g.length < MAX_MEMBERS) g.push(el);
  }
  for (const [, members] of bySibling) {
    if (members.length < 2) continue;
    if (members.some((m) => (m.getAttribute('type') || '').toLowerCase() === 'radio' || (m.getAttribute('type') || '').toLowerCase() === 'checkbox')) continue; // covered by (A)
    if (members.some((m) => !!ownLabel(m))) continue;                                 // separately labelled ⇒ not one question
    sets.push({ kind: 'unlabelled-sibling-controls', members });
  }

  const out = [];
  const seen = new Set();
  for (const set of sets) {
    if (out.length >= MAX_GROUPS) break;
    const key = set.members.map((m) => xpathOf(m)).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const anc = commonAncestor(set.members);
    const memberSet = new Set(set.members);
    const labelEls = new Set();
    let named = 0, titleOnly = 0;
    const members = [];
    for (const m of set.members) {
      const ol = ownLabel(m);
      if (ol) { named++; if (ol.el) labelEls.add(ol.el); }
      else if (m.getAttribute('title') || m.getAttribute('placeholder')) titleOnly++;
      members.push({ xpath: xpathOf(m), ownName: ol ? ol.text : null, ownNameVia: ol ? ol.via : null });
    }
    const group = programmaticGroup(anc);
    const named2 = group && norm(group.accessibleName);
    // does the grouping container also hold controls that are NOT in this set? Then it is a wrapper around
    // several questions, and its name is not this set's label.
    let otherControls = 0;
    if (group && group.el) {
      for (const c of group.el.querySelectorAll('input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]), select, textarea')) {
        if (!memberSet.has(c) && visible(c)) otherControls++;
      }
    }
    let correspondence;
    if (!group) correspondence = 'no-programmatic-group';
    else if (!named2) correspondence = 'group-without-accessible-name';
    else if (group.nameSource && group.nameSource.rendered) correspondence = 'group-named-by-visible-text';
    else correspondence = 'group-named-but-name-not-rendered-on-screen';
    // Only offered where there is no programmatic group to compare against — where there IS one, the visible
    // label is the group's own rendered name source, and guessing a second one invents a disagreement.
    const preceding = group ? null : precedingVisibleText(anc, memberSet, labelEls);

    const rec = {
      kind: set.kind,
      memberCount: set.members.length,
      members: members.slice(0, MAX_MEMBERS),
      containerXpath: xpathOf(anc),
      membersWithOwnName: named,
      membersNamedOnlyByTitleOrPlaceholder: titleOnly,
      programmaticGroup: group ? { xpath: group.xpath, mechanism: group.mechanism, accessibleName: group.accessibleName, nameRenderedOnScreen: !!(group.nameSource && group.nameSource.rendered), nameSourceXpath: group.nameSource ? group.nameSource.xpath : null, alsoContainsOtherControls: otherControls } : null,
      correspondence,
      // FACET-SYMMETRIC on purpose: one missing fact produced an invented absence on a correctly grouped set
      // AND a fabricated excuse on ungrouped ones, so the note has to close both.
      uncertainReason: (correspondence === 'group-named-by-visible-text'
        ? 'these controls ARE programmatically grouped and the group carries the accessible name shown above — `nameSourceXpath` is the on-screen element the name comes from. The association is in the DOM: do NOT report this text as "not programmatically associated" with these controls.'
        : correspondence === 'group-named-but-name-not-rendered-on-screen'
          ? 'these controls ARE programmatically grouped and the group HAS an accessible name, but that name is not rendered anywhere on screen — judge whether it conveys the same thing the visible text does.'
          : correspondence === 'group-without-accessible-name'
            ? 'a grouping container exists for these controls but carries NO accessible name (no legend, no aria-label, no aria-labelledby), so the group is announced without saying what it is for.'
            : 'NO programmatic grouping mechanism (fieldset+legend, role=group / role=radiogroup with an accessible name, or aria-labelledby on a container) exists for this control set. That has been CHECKED in the DOM — it is a determined result, not an unavailable one, so do not report it as unconfirmable and do not ask for an accessibility-tree query to settle it. `precedingVisibleText` lists the visible text blocks immediately before the set, in reading order, as CANDIDATES for the question they answer — which one (if any) is the group label is yours to read. Whether the absence is a barrier is also yours: it is one when that text is the question these controls answer and their own names do not carry that meaning alone; it is NOT one when each control\'s own accessible name already suffices.')
        + ' `members[].ownName` is each control\'s own accessible name and how it is derived; `title` and `placeholder` are reported as ABSENT names, because neither is a label.',
    };
    if (preceding && preceding.length) rec.precedingVisibleText = preceding;
    out.push(rec);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 1.3.1 — EXACT DECLARED-STRUCTURE / GROUPING-STATE FACTS (residual RCA S10/S11).
//
// Four deterministic page-level facts, each cheap, each converting a page-level 1.3.1 question that judges
// were answering with UNCERTAIN-plus-an-excuse ("could not confirm", "unconfirmed from available signals")
// into a stated, checked result. DATA ONLY — every judgement stays with the rubric:
//
//  · blockquotesWithoutSource — a visible <blockquote> with no cite= attribute, no <cite> descendant, and
//    no adjacent attribution (no <figcaption> in an enclosing <figure>, no dash-led attribution line as the
//    next sibling or last child). The element DECLARES a quotation relationship; this fact states that the
//    declaration names no source anywhere the DOM can see. Whether the text is genuinely quoted — and so
//    whether the declared relationship is true — is the judge's call, in the declared-structure-must-be-true
//    direction (F-technique family: markup asserting a relationship the content does not have).
//  · dlOrderAnomalies — a <dl> whose dt/dd sequence carries an unambiguous ordering defect: a description
//    before any term (leadingDd), a trailing term with no description (trailingDt), a <div>-wrapped
//    name-value group whose description precedes its term (invertedDivGroups — the spec requires dt+ then
//    dd+ inside a wrapper), or asymmetric dt/dd counts (countMismatch — REPORTED, not judged: several
//    descriptions per term and several terms per description are both legal, so the counts are facts for
//    the judge, not a verdict). A <dl> announces a term→description pairing; these are the orderings under
//    which that announcement can bind the wrong items.
//  · radioGroupsWithoutGrouping — 2+ visible radios sharing a control name (one question by construction)
//    with NO enclosing accessibly-named fieldset (legend, or aria-label/aria-labelledby resolving to
//    text), role=radiogroup, or accessibly-named role=group anywhere from
//    their nearest common ancestor up to the form. A CHECKED absence — the deliberately narrow twin of
//    collectControlGroups' richer record (belt-and-braces: two independently-authored predicates for the
//    shape that kept reaching judges as "unconfirmable") — plus the visible text block immediately
//    preceding the set, with its computed weight/size so label-like styling is a stated fact.
//  · requiredStateInventory — per form (and once for out-of-form fields): counts of required= /
//    aria-required=true attributes, of visible required-word tokens, and of asterisk markers on
//    label/legend text (CSS-generated ::before/::after asterisks included). ZERO IS A MEASURED ABSENCE:
//    "no element carries required or aria-required" becomes a fact the judge can cite instead of an
//    unconfirmable, in both directions (a page whose legend says fields are required while nothing is
//    programmatically required, and a page whose fields are all correctly marked).
//
// Self-contained so it serializes through page.evaluate.
function collectStructuralMarkupFacts() {
  const MAX = 6, MAX_TEXT = 120;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const clip = (s, n) => norm(s).slice(0, n);
  const visible = (e) => {
    if (!e || !e.tagName) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = { blockquotesWithoutSource: [], dlOrderAnomalies: [], radioGroupsWithoutGrouping: [], requiredStateInventory: [], fieldsetsWithoutControls: [] };

  // (1) <blockquote> with no source anywhere the DOM can see.
  const attributionish = (e) => {
    if (!e || !e.tagName) return false;
    if (e.querySelector && e.querySelector('cite')) return true;
    // an attribution line as typically rendered: a leading dash-family character before the source's name
    return /^[—–―~-]/.test(norm(e.textContent));
  };
  for (const bq of document.querySelectorAll('blockquote')) {
    if (out.blockquotesWithoutSource.length >= MAX) break;
    if (!visible(bq)) continue;
    if ((bq.getAttribute('cite') || '').trim()) continue;
    if (bq.querySelector('cite')) continue;
    const fig = bq.closest('figure');
    if (fig && fig.querySelector('figcaption')) continue;           // <figure><blockquote/><figcaption> attribution pattern
    if (attributionish(bq.nextElementSibling)) continue;            // adjacent attribution line after the quote
    const kids = [];
    for (const k of bq.children) kids.push(k);
    if (kids.length && attributionish(kids[kids.length - 1])) continue; // trailing attribution line inside the quote
    out.blockquotesWithoutSource.push({ xpath: xpathOf(bq), textSample: clip(bq.textContent, MAX_TEXT) });
  }

  // (2) <dl> ordering anomalies. Walk dt/dd in document order, descending through spec-legal <div> wrappers.
  for (const dl of document.querySelectorAll('dl')) {
    if (out.dlOrderAnomalies.length >= MAX) break;
    const seq = [];
    let invertedDivGroups = 0;
    const groupSeq = (node, into) => {
      for (const k of node.children) {
        const t = k.tagName.toLowerCase();
        if (t === 'dt' || t === 'dd') into.push(t);
        else if (t === 'div') {
          const inner = [];
          groupSeq(k, inner);
          // a wrapper holding BOTH kinds whose first item is a description = the inverted-pair shape
          // (the spec requires each wrapper to hold dt+ followed by dd+).
          if (inner.length && inner[0] === 'dd' && inner.indexOf('dt') !== -1) invertedDivGroups++;
          into.push(...inner);
        }
      }
    };
    groupSeq(dl, seq);
    if (!seq.length) continue;
    const dtCount = seq.filter((t) => t === 'dt').length;
    const ddCount = seq.length - dtCount;
    const leadingDd = seq[0] === 'dd';
    const trailingDt = seq[seq.length - 1] === 'dt';
    const countMismatch = dtCount !== ddCount;
    if (leadingDd || trailingDt || countMismatch || invertedDivGroups > 0) {
      out.dlOrderAnomalies.push({ xpath: xpathOf(dl), dtCount, ddCount, leadingDd, trailingDt, invertedDivGroups, countMismatch });
    }
  }

  // (3) radios sharing a control name with NO programmatic grouping.
  const byName = new Map();
  for (const r of document.querySelectorAll('input[type="radio" i]')) {
    if (!visible(r)) continue;
    const nm = r.getAttribute('name');
    if (!nm) continue;
    const f = (() => { try { return r.closest('form'); } catch (e) { return null; } })();
    const key = (f ? xpathOf(f) : 'document') + '|' + nm;
    if (!byName.has(key)) byName.set(key, []);
    const g = byName.get(key);
    if (g.length < 12) g.push(r);
  }
  for (const [, members] of byName) {
    if (out.radioGroupsWithoutGrouping.length >= MAX) break;
    if (members.length < 2) continue;
    let anc = members[0];
    for (const m of members.slice(1)) { while (anc && !anc.contains(m)) anc = anc.parentElement; }
    if (!anc) anc = document.body;
    // grouped when the common ancestor — or an ancestor of it, up to the form — is an accessibly-NAMED
    // fieldset (a legend child, OR aria-label / aria-labelledby resolving to text: a fieldset carries an
    // implicit group role, so an ARIA name groups exactly as a legend does — the mechanism set
    // collectControlGroups recognizes; batch-2 soundness review), a role=radiogroup, or a role=group
    // carrying an accessible name. Checked, not guessed.
    const ariaNamed = (el) => {
      if ((el.getAttribute('aria-label') || '').trim()) return true;
      const refs = (el.getAttribute('aria-labelledby') || '').trim();
      if (!refs) return false;
      for (const id of refs.split(/\s+/).slice(0, 4)) {
        let n = null;
        try { n = document.getElementById(id); } catch (e) { n = null; }
        if (n && norm(n.textContent)) return true;      // a dangling or empty reference names nothing
      }
      return false;
    };
    let grouped = false;
    for (let p = anc, i = 0; p && p !== document.documentElement && i < 8; p = p.parentElement, i++) {
      const tag = p.tagName.toLowerCase();
      const role = String(p.getAttribute('role') || '').toLowerCase();
      let hasLegend = false;
      if (tag === 'fieldset') for (const c of p.children) if (c.tagName && c.tagName.toLowerCase() === 'legend') { hasLegend = true; break; }
      if (tag === 'fieldset' && (hasLegend || ariaNamed(p))) { grouped = true; break; }
      if (role === 'radiogroup') { grouped = true; break; }
      if (role === 'group' && ((p.getAttribute('aria-label') || '').trim() || (p.getAttribute('aria-labelledby') || '').trim())) { grouped = true; break; }
      if (tag === 'form') break;
    }
    if (grouped) continue;
    // the visible text block immediately preceding the set, with its computed style (label-like styling is
    // a fact the judge reads, never a verdict this collector makes). Scanned first at the set's own start
    // position inside the common ancestor, then — because the question a set answers typically sits BEFORE
    // its wrapper, not inside it — at the ancestor's own position, walking up a few levels (the same
    // anchoring collectControlGroups uses).
    const precedingOf = (from) => {
      for (let sib = from, seen = 0; sib && seen < 6; sib = sib.previousElementSibling, seen++) {
        if (!visible(sib)) continue;
        if (sib.querySelector && sib.querySelector('input, select, textarea')) continue; // a block holding controls is not a label for these
        const t = norm(sib.textContent);
        if (t.length < 2) continue;
        const cs = getComputedStyle(sib);
        return { xpath: xpathOf(sib), tag: sib.tagName.toLowerCase(), text: clip(t, MAX_TEXT), fontWeight: cs.fontWeight, fontSizePx: parseFloat(cs.fontSize) || null };
      }
      return null;
    };
    let start = members[0];
    while (start && start.parentElement && start.parentElement !== anc) start = start.parentElement;
    let preceding = (start && start.parentElement === anc) ? precedingOf(start.previousElementSibling) : null;
    for (let node = anc, lvl = 0; !preceding && node && node !== document.body && lvl < 4; node = node.parentElement, lvl++) {
      preceding = precedingOf(node.previousElementSibling);
    }
    out.radioGroupsWithoutGrouping.push({
      controlName: clip(members[0].getAttribute('name'), 40),
      memberCount: members.length,
      memberXpaths: members.slice(0, 12).map(xpathOf),
      commonAncestorXpath: xpathOf(anc),
      precedingText: preceding,
    });
  }

  // (3b, batch-3 item 19c) <fieldset> holding NO form control anywhere in its subtree. A fieldset+legend
  // DECLARES a control-group relationship (the legend is announced as a group name); using the pair as a
  // decorative call-out box around prose declares a grouping that does not exist — the structural-markup-
  // misused-for-presentation shape, which previously had no fact at all (the labeled defect on case-04).
  // DATA ONLY: the legend text and a content sample are reported; whether the misuse is a 1.3.1 barrier
  // stays with the judge. A fieldset that merely has its controls elsewhere via form= association is out
  // of reach of this DOM scan and simply not reported (fail-closed: absence of the fact claims nothing).
  const CONTROL_SEL = 'input, select, textarea, button, output, [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"], [role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"], [role="searchbox"], [role="button"]';
  for (const fs of document.querySelectorAll('fieldset')) {
    if (out.fieldsetsWithoutControls.length >= MAX) break;
    if (!visible(fs)) continue;
    if (fs.querySelector(CONTROL_SEL)) continue;
    let legendText = null;
    for (const c of fs.children) if (c.tagName && c.tagName.toLowerCase() === 'legend') { legendText = clip(c.textContent, MAX_TEXT); break; }
    out.fieldsetsWithoutControls.push({ xpath: xpathOf(fs), legendText, textSample: clip(fs.textContent, MAX_TEXT) });
  }

  // (4) per-form required-state inventory. Counts, never a verdict; zero counts are measured absences.
  const fieldSel = 'input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]), select, textarea';
  const pseudoStar = (e) => {
    try { return /\*/.test(String(getComputedStyle(e, '::before').content || '') + String(getComputedStyle(e, '::after').content || '')); }
    catch (err) { return false; }
  };
  const inventory = (scopeEl, formXpath, outsideFormsOnly) => {
    const keep = (n) => !outsideFormsOnly || !n.closest('form');
    const fields = [];
    for (const f of scopeEl.querySelectorAll(fieldSel)) if (keep(f)) fields.push(f);
    const labels = [];
    for (const l of scopeEl.querySelectorAll('label, legend')) if (keep(l)) labels.push(l);
    const text = norm(scopeEl === document ? ((document.body && document.body.textContent) || '') : scopeEl.textContent);
    return {
      formXpath,
      fieldCount: fields.length,
      requiredAttrCount: fields.filter((f) => f.hasAttribute('required')).length,
      ariaRequiredCount: fields.filter((f) => (f.getAttribute('aria-required') || '').toLowerCase() === 'true').length,
      requiredTextTokens: (text.match(/\brequired\b/gi) || []).length,
      asteriskMarkers: labels.filter((l) => /\*/.test(norm(l.textContent)) || pseudoStar(l)).length,
    };
  };
  const forms = [];
  for (const f of document.querySelectorAll('form')) { forms.push(f); if (forms.length >= MAX) break; }
  for (const f of forms) out.requiredStateInventory.push(inventory(f, xpathOf(f), false));
  let loose = false;
  for (const f of document.querySelectorAll(fieldSel)) if (!f.closest('form') && visible(f)) { loose = true; break; }
  if (loose) out.requiredStateInventory.push(inventory(document, 'document', true));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 1.3.1 — LABEL GEOMETRY vs PROGRAMMATIC ASSOCIATION (batch-3 item 20, form-label case-01).
//
// WHY THIS EXISTS. A CSS-grid form can render every input under the WRONG label while the for=/id wiring is
// textually perfect — the sighted user reads a cross-paired form, AT hears a correct one, and NO lane can see
// it: the markup checks pass, and the per-field crop shows one label above one input with nothing to compare
// against. The RCA probe's 15-line geometry predicate (scratchpad/rca3-rel/probe-form-label-01.js) separated
// all four cross-paired fields deterministically; this is that predicate, ported with fail-closed guards.
//
// THE PREDICATE, per labelled field: the visually adjacent label is the nearest <label> rendered ABOVE the
// field with column overlap (label centre horizontally WITHIN the field's span — flood-tightened, see below).
// A record is emitted ONLY when ALL hold:
//   · the field has its own programmatic label[for] (wrapping labels are skipped — geometry is trivially theirs);
//   · the own label is SUBSTANTIALLY RENDERED (>=12x8px) — a clip-pattern/sr-only label (1x1) means the field
//     has NO visual label at all; that is a visible-label-absence question (3.3.2's), not a cross-pairing,
//     and reporting the nearest other label as "the visual label" would manufacture one (corpus flood:
//     exactly the hidden-label boundary-cue pages fired this way);
//   · the own label does NOT vertically overlap the field — a SIDE-LABELLED row pairs label→field by ROW, and
//     the label of the row above is not that field's visual label (the corpus flood found exactly this false
//     fire on every left-labelled form: own label beside the input, previous row's label "above" it);
//   · a visually-adjacent label exists, is a DIFFERENT element with DIFFERENT text, and is itself for= a
//     DIFFERENT control (a free-floating caption above a field is not a cross-pairing).
// The column-overlap test is HORIZONTAL-INTERVAL overlap (>=12px) between label and field — the probe's
// |Δcx|<width alone let ANY label left of a wide full-row input qualify (flood: 28 fires on 12 pages, 24 of
// them side-label layouts whose label/field intervals are disjoint), while a centre-in-span test broke the
// legitimate full-width block label above a narrower field (its centre sits past the field's right edge).
// With interval overlap + the side-label guard, exactly the cross-paired grid remains on the corpus flood.
// Absence of a record claims nothing (a left-labelled or unlabelled form simply yields no fact). DECIDES
// NOTHING: whether the visual/programmatic disagreement is a 1.3.1 barrier stays with the rubric.
//
// Self-contained so it serializes through page.evaluate.
function collectLabelGeometry() {
  const MAX = 8;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const clip = (s, n) => norm(s).slice(0, n);
  const visible = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const labels = [];
  for (const l of document.querySelectorAll('label[for]')) {
    if (!visible(l)) continue;
    const text = norm(l.textContent);
    if (!text) continue;
    const r = l.getBoundingClientRect();
    labels.push({ el: l, for: l.getAttribute('for'), text, top: r.top, bottom: r.bottom, x: r.x, right: r.x + r.width, rendered: r.width >= 12 && r.height >= 8 });
  }
  if (labels.length < 2) return [];                        // a cross-pairing needs at least two labelled columns
  const out = [];
  for (const inp of document.querySelectorAll('input, select, textarea')) {
    if (out.length >= MAX) break;
    if ((inp.getAttribute('type') || '').toLowerCase() === 'hidden') continue;
    if (!visible(inp)) continue;
    if (inp.closest('label')) continue;                    // wrapped label: geometry is trivially its own
    if (!inp.id) continue;
    const own = labels.find((l) => l.for === inp.id);
    if (!own || !own.rendered) continue;                   // clipped/sr-only own label ⇒ a 3.3.2 question, not a cross-pairing
    const r = inp.getBoundingClientRect();
    // SIDE-LABEL GUARD (flood-tightening): the own label vertically overlaps the field ⇒ the layout pairs
    // by ROW; the label rendered above belongs to the previous row, not to this field. No fact.
    if (own.bottom > r.y + 4 && own.top < r.bottom - 4) continue;
    // nearest label visually ABOVE whose horizontal interval overlaps the field's by >=12px (flood-tightened:
    // side-label layouts have disjoint intervals; a full-width block label above a narrow field still counts).
    const above = labels
      .filter((l) => l.bottom <= r.y + 4 && (Math.min(l.right, r.x + r.width) - Math.max(l.x, r.x)) >= Math.min(12, r.width / 2))
      .sort((a, b) => (r.y - a.bottom) - (r.y - b.bottom))[0] || null;
    if (!above || above.el === own.el) continue;           // no adjacent label, or visual == programmatic: nothing to report
    if (above.text === own.text) continue;                 // same text either way: the rendered pairing reads correctly
    if (!above.for || above.for === inp.id) continue;      // the adjacent label must belong to a DIFFERENT control
    out.push({
      xpath: xpathOf(inp),
      ownLabelText: clip(own.text, 80),
      visuallyAdjacentLabelText: clip(above.text, 80),
      visuallyAdjacentLabelFor: clip(above.for, 60),
      gapPx: Math.round(r.y - above.bottom),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 2.4.2 — TITLE-INSTANCE YEAR CONFLICT (batch-3 item 22, stale-in-family-wrong-instance-title case-02).
//
// WHY THIS EXISTS. Deciding whether a title identifies the RIGHT page instance usually needs richness the
// page-title rubric is firewalled against demanding (the anti-richness firewall: a title is not failed for
// omitting detail). But one sub-case is recoverable soundly: the title VOLUNTEERS an instance token — a year —
// while every identity surface the page itself asserts (hero graphic label, headings, definition-list facts,
// footer) carries a DIFFERENT year and never the title's. That is not an omission; it is a stated
// contradiction, checkable deterministically.
//
// SURFACES, deliberately narrow: headings (h1-h6 / role=heading), named graphics (img[alt], aria-label on
// svg/[role=img] — the hero banner case), <dl> name-value facts, and footer/contentinfo (with © years
// stripped — a copyright year states when the site was published, not which instance this page is). Body
// PROSE is NOT a surface: a retrospective sentence ("last year's gala (March 2025)…") legitimately carries
// the stale year and must not corroborate a stale title.
//
// SOUNDNESS FIX (batch-3 adversarial review F3, 2026-08-17). The first cut fired whenever ANY surface year
// differed from the title's, which made two everyday pages "contradictions":
//   · an ordinary shop page titled "Spring Collection 2026" whose footer reads "established 1998" — a
//     FOUNDING year, no more a page-instance assertion than the © year already stripped beside it; and
//   · a correctly titled "Budget 2026" article with one sub-heading "How it compares with 2025" — a
//     comparison reference, not a claim about which instance this page is.
// Three narrowings, all structural:
//   (a) CORROBORATION + MAJORITY. The conflicting year must be carried by ≥2 admitted surfaces, or by a
//       PRIMARY identity surface (h1 / aria-level=1 heading / a hero-sized named graphic), AND it must be
//       the year of a strict majority of the admitted surfaces. One lone surface never contradicts a title.
//   (b) FOUNDING-YEAR STRIP, applied to every surface exactly like the © strip: established/est./founded/
//       since constructions state when the ORGANISATION began, not which instance this page is.
//   (c) NON-PRIMARY HEADINGS AND <dl> ARE CORROBORATING-ONLY. A sub-heading or a fact list is admitted as a
//       surface only when it shares non-year wording with the title (so it is talking about THIS page's
//       subject) or when one of its years is already asserted by an anchor surface (a primary surface or
//       the footer). A lone "How it compares with 2025" is then not a surface at all.
//
// FIRES ONLY when: the title carries >=1 year token AND none of the title's years appears in any ADMITTED
// surface AND a different year clears (a). Null whenever the title has no year (the ABSENT-token firewall)
// — so the fact can never punish a title for not volunteering a year. DECIDES NOTHING: the record states
// the years and where each was seen; whether the mismatch makes the title fail 2.4.2 stays with the rubric.
//
// Self-contained so it serializes through page.evaluate.
function collectTitleInstanceFacts() {
  const YEAR_RE = /\b(?:19|20)\d{2}\b/g;
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const clip = (s, n) => norm(s).slice(0, n);
  const titleText = norm(document.title);
  const titleYears = [...new Set((titleText.match(YEAR_RE) || []))];
  if (!titleYears.length) return null;                      // absent token ⇒ never fires (anti-richness firewall)
  const visible = (e) => {
    if (!e || !e.tagName || !e.getBoundingClientRect) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // (b) + the original © strip. Both say "this year is not a claim about WHICH instance this page is".
  const strip = (t) => norm(t)
    .replace(/(?:©|\(c\)|copyright)[\s:]*(?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?/gi, ' ')
    .replace(/\b(?:established|est\.|founded|since)\b[^.;:|]{0,20}?\b(?:19|20)\d{2}\b/gi, ' ');
  // non-year wording, for the (c) overlap test. Short/generic words identify nothing.
  const STOP = new Set(['this', 'that', 'with', 'from', 'your', 'their', 'about', 'here', 'more', 'than', 'when', 'what', 'which', 'page', 'home', 'news', 'also', 'into', 'over', 'have', 'been', 'will', 'they', 'them', 'other', 'these', 'those']);
  const words = (t) => new Set(norm(t).toLowerCase().replace(YEAR_RE, ' ').split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4 && !STOP.has(w)));
  const titleWords = words(titleText);
  const mk = (kind, text, primary) => {
    const t = strip(text);
    const ys = t ? t.match(YEAR_RE) : null;
    return ys ? { kind, primary, text: clip(t, 120), years: [...new Set(ys)] } : null;
  };
  // ── anchors: PRIMARY identity surfaces + the footer (always admitted) ──────────────────────────────
  const anchors = [];
  const gated = [];
  const HERO_AREA = 5000;                                   // a hero banner, not a 24px icon
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')) {
    if (!visible(h)) continue;
    const lvl = h.tagName === 'H1' ? 1 : (h.getAttribute('aria-level') ? parseInt(h.getAttribute('aria-level'), 10) : (/^H[1-6]$/.test(h.tagName) ? +h.tagName[1] : 0));
    const rec = mk('heading', h.textContent, lvl === 1);
    if (rec) (lvl === 1 ? anchors : gated).push(rec);
  }
  for (const g of document.querySelectorAll('img[alt],svg[aria-label],[role="img"][aria-label]')) {
    if (!visible(g)) continue;
    const r = g.getBoundingClientRect();
    const rec = mk('graphic-label', g.getAttribute('aria-label') || g.getAttribute('alt'), r.width * r.height >= HERO_AREA);
    if (rec) (rec.primary ? anchors : gated).push(rec);
  }
  for (const dl of document.querySelectorAll('dl')) { if (visible(dl)) { const rec = mk('definition-list', dl.textContent, false); if (rec) gated.push(rec); } }
  for (const f of document.querySelectorAll('footer,[role="contentinfo"]')) { if (visible(f)) { const rec = mk('footer', f.textContent, false); if (rec) anchors.push(rec); } }
  // ── (c) admission: a gated surface must share wording with the title, or repeat an anchor's year ───
  const anchorYears = new Set(anchors.reduce((a, s) => a.concat(s.years), []));
  const overlapsTitle = (s) => { for (const w of words(s.text)) if (titleWords.has(w)) return true; return false; };
  const surfaces = [...anchors, ...gated.filter((s) => overlapsTitle(s) || s.years.some((y) => anchorYears.has(y)))].slice(0, 12);
  const surfaceYears = [...new Set(surfaces.reduce((a, s) => a.concat(s.years), []))];
  // ── (a) corroboration + majority over the admitted surfaces ───────────────────────────────────────
  const primaryYears = new Set(surfaces.filter((s) => s.primary).reduce((a, s) => a.concat(s.years), []));
  const carriers = (y) => surfaces.filter((s) => s.years.indexOf(y) !== -1).length;
  const conflictYear = surfaceYears
    .filter((y) => titleYears.indexOf(y) === -1)
    .filter((y) => (carriers(y) >= 2 || primaryYears.has(y)) && carriers(y) * 2 > surfaces.length)
    .sort((a, b) => carriers(b) - carriers(a))[0] || null;
  const conflict = surfaces.length > 0
    && titleYears.every((y) => surfaceYears.indexOf(y) === -1)
    && conflictYear !== null;
  return { title: clip(titleText, 160), titleYears, surfaceYears, conflict, conflictYear, surfaces: surfaces.slice(0, 8) };
}

// Backfill any missing role fields (orchestrate's candidate generator reads sampledRole/axRole).
function normalizeCollectRoles(collect) {
  for (const el of collect.elements || []) {
    if (!el.sampledRole) el.sampledRole = nativeRole(el.tag, el.type, el.href);
    if (!el.axRole) el.axRole = el.sampledRole || el.roleAttr || '';
  }
  return collect;
}

module.exports = { collectActPage, normalizeCollectRoles, nativeRole, digestForUrl, collectControlGroups, collectStructuralMarkupFacts, collectTitleInstanceFacts, collectLabelGeometry };
