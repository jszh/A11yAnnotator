'use strict';
// Decoupled ACT-page collector: navigate `page` to `url` and extract the v3 element inventory orchestrate()
// needs. This is the SAME proven collection logic run-v3-act-suite.js uses inline (the page.evaluate body is
// copied verbatim), lifted into a parameterized function (url/elementCap/ids as args, no module-level argv
// coupling) so a parallel runner can reuse it offline (file://) without inheriting the suite's flag parsing.
const crypto = require('crypto');
const { collectTables } = require('./collect-tables.js'); // Tier-0 #4: per-<table> relationship facts for 1.3.1
const { collectLists } = require('./collect-lists.js');   // TT gap G1: per-list semantics (1.3.1 / TT 10.D)

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
      if ((el.textContent || '').trim().length || accName.length) return { meaningful: false, url: null };
      const vw = win.innerWidth || 1280, vh = win.innerHeight || 800;
      const fullBleed = box.width >= vw * 0.8 && box.height >= vh * 0.5;
      const candidate = box.width >= 16 && box.height >= 16 && !fullBleed;
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
        if (!visible(el)) continue;
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
      // S7 (RCA R7, 0va7u6): an <svg> that renders LIVE <text>/<tspan> is NOT an image-of-text — that text is real
      // and accessible, so it owes NO 1.4.5 (images-of-text) obligation. Surfaced so the rubric clears it.
      const svgLiveText = tag === 'svg' && !!el.querySelector('text, tspan') && (el.textContent || '').trim().length > 0;
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
      const nearbyText = !isImage ? undefined : (function () {
        const bits = [];
        const fig = el.closest('figure'); if (fig) { const cap = fig.querySelector('figcaption'); if (cap) bits.push(textOf(cap)); }
        if (el.parentElement) bits.push(textOf(el.parentElement));
        for (const sib of [el.previousElementSibling, el.nextElementSibling]) if (sib) bits.push(textOf(sib));
        return [...new Set(bits.filter(Boolean))].join(' | ').replace(/\s+/g, ' ').trim().slice(0, 300) || undefined;
      })();
      // COMPLEX-IMAGE hint (Item 7b): a genuinely data-bearing image (in a <figure>, role=figure, or carrying an
      // aria-describedby long-description pointer) owes the long-description-completeness rubric; a bare logo/icon
      // gets alt-adequacy only (long-desc on a simple logo is UNCERTAIN noise).
      const complexImageHint = isImage && (!!el.closest('figure') || roleAttr === 'figure' || el.hasAttribute('aria-describedby'));
      // C8 small-signal predicates (parity with eval-page.js / the ACT inline collector).
      const tabindexEffective = (() => { const ti = el.getAttribute('tabindex'); return ti !== null ? +ti : (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag) && !el.disabled ? 0 : null); })();
      let _ownTxt = ''; for (const _n of el.childNodes) if (_n.nodeType === 3) _ownTxt += _n.textContent;
      const hasGlyphText = [..._ownTxt].some((ch) => { const c = ch.codePointAt(0); return (c >= 0xE000 && c <= 0xF8FF) || (c >= 0xF0000 && c <= 0xFFFFD) || (c >= 0x100000 && c <= 0x10FFFD); }) || (/[Ѐ-ӿͰ-Ͽ]/.test(_ownTxt) && /[a-zA-Z]/.test(_ownTxt));
      const splitFieldGroup = (() => { if (tag !== 'input' && tag !== 'select') return false; const ml = parseInt(el.getAttribute('maxlength'), 10); if (!(Number.isFinite(ml) && ml <= 6)) return false; const grp = el.closest('fieldset, [role=group], form, div'); if (!grp) return false; return [...grp.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')].filter((i) => { const m = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(m) && m <= 6; }).length >= 2; })();
      // LIVE REGION (Item 11, 4.1.3): a status container (aria-live polite/assertive, or an implicitly-live role)
      // owes a status-message obligation — are dynamic status changes announced to AT. Kept even when empty (a live
      // region is typically populated dynamically, so it has no text at collect time).
      const _alive = (el.getAttribute('aria-live') || '').toLowerCase();
      const liveRegion = _alive === 'polite' || _alive === 'assertive' || /^(status|alert|log|progressbar|marquee|timer)$/.test(roleAttr);
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
      const _bgCandidate = box.width >= 16 && box.height >= 16 && !_fullBleed; // not a tracking pixel, not a full-bleed hero
      // INTERACTIVITY via the shared `_bgInteractive` (R2 G2-1) — the old `isInteractive` omitted onclick / tabindex /
      // role=option,spinbutton,textbox,searchbox, dropping those bg controls on the ACT path while eval-page kept them.
      const backgroundImageMeaningful = /url\(/i.test(_bgi) && !ariaHidden && !presentational && !isImage
        && text.length === 0 && _accName.length === 0 && box.width > 0 && box.height > 0 && (_bgInteractive(el) || _bgCandidate);
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
      if (!_subset && !focusable && !isFormField && !sampledRole && !text && !isImage && !liveRegion && !isMedia && !autoMotion && !backgroundImageMeaningful && !isCaptcha && !iframeTabExcluded && !focusableInAriaHidden && !prohibitedAriaAttr) continue; // a pre-selected subset element is always included
      els.push({
        xpath: xpathOf(el),
        matchesTarget: matchesTarget(el), // #11 fix — see scorer precision comment above
        // (axName below is computed by labelledText(el, sampledRole) — name-from-contents gated by role)
        text,
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
        tabindexEffective, hasGlyphText, splitFieldGroup, // C8 small-signal predicates (parity)
        // Item 13 (cheap scrutiny signals, parity with eval-page): a native control that overrides its role
        // (<button role=link>) → name-role scrutiny; a field's placeholder → field-label scrutiny (placeholder-as-label).
        roleOverridesNative: ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(tag) && !!roleAttr,
        placeholder: el.getAttribute('placeholder') || null,
        liveRegion,
        isMedia,
        mediaInfo,
        autoMotion,
        autoUpdatingContent, // #9 fix (TT 4.1.2 2.D): carousel/slideshow auto-rotation notification obligation
        underOverlay: focusable && _underOverlay(box),
        hasHoverContent: _hasHoverContent(el),
        backgroundImageMeaningful, backgroundImageUrl, isCaptcha, // TT gaps G2/G3 (1.1.1)
        iframeTabExcluded, focusableInAriaHidden, prohibitedAriaAttr, // deterministic barrier flags (2.1.1 / 4.1.2)
        iframeSrc: (tag === 'iframe' || tag === 'frame') ? (el.getAttribute('src') || '') : undefined, // 4.1.2 (4b1c6c): same-name iframe purpose-equivalence
      });
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
          text, hasText: text.length > 0, focusable,
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
      const dn = await cdp.send('DOM.describeNode', { objectId: ev.result.objectId }).catch(() => null);
      const backendNodeId = dn && dn.node && dn.node.backendNodeId;
      if (!backendNodeId) return null;
      const r = await cdp.send('Accessibility.getAXNodeAndAncestors', { backendNodeId }).catch(() => null);
      return (r && r.nodes && r.nodes[0]) || null;
    };
    for (const el of data.elements || []) {
      const ax = await resolveAx(el.xpath);
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
      const ax = await resolveAx(h.xpath);
      const nm = ax && ax.name && ax.name.value;
      if (typeof nm === 'string') h.name = nm;
    }
    await cdp.detach().catch(() => {});
  } catch (e) { /* CDP unavailable ⇒ the page keeps its heuristic axNames (never throws) */ }

  // Tier-0 #4: per-<table> relationship facts (separate evaluate so the self-contained extractor is shared with
  // eval-page.js). Read-only; any failure degrades to [] (never throws).
  const tables = await page.evaluate(collectTables).catch(() => []);
  // TT gap G1: per-list semantics (real ul/ol/dl + visually-apparent faux lists) for the 1.3.1 JUDGMENT.
  const lists = await page.evaluate(collectLists).catch(() => []);
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
        const cfg = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] };
        const r = await axe.run(document, cfg);
        const map = (arr) => (arr || []).map((v) => ({ id: v.id, impact: v.impact, wcag: (v.tags || []).filter((t) => /^wcag\d/.test(t)), nodes: (v.nodes || []).map((n) => ({ target: n.target, xpath: resolveXpath(n.target) })) }));
        return { violations: map(r.violations), incomplete: map(r.incomplete) };
      }).catch(() => null);
    } catch (e) { axeData = null; }
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
    page: { reflowApplicable: !!data.reflowApplicable },
    structure: { title: data.title || '', frameTitles: data.frameTitles || [], lang: data.lang || '', headings: data.headings || [], landmarks: data.landmarks || [], tables: tables || [], lists: lists || [] },
    axe: axeData ? axeData.violations : [],
    axeIncomplete: axeData ? axeData.incomplete : [],
    axeRan: !!axeData,
  };
}

// Backfill any missing role fields (orchestrate's candidate generator reads sampledRole/axRole).
function normalizeCollectRoles(collect) {
  for (const el of collect.elements || []) {
    if (!el.sampledRole) el.sampledRole = nativeRole(el.tag, el.type, el.href);
    if (!el.axRole) el.axRole = el.sampledRole || el.roleAttr || '';
  }
  return collect;
}

module.exports = { collectActPage, normalizeCollectRoles, nativeRole, digestForUrl };
