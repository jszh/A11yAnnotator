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
  const collectedAt = Number.isFinite(opts.now) ? opts.now : Date.now();
  const pageDigest = opts.pageDigest || digestForUrl(opts.sourceUrl || url);
  const data = await page.evaluate((cap, subsetXpaths) => {
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
      if (e === document.body) return '/html/body';
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
      const aria = el.getAttribute('aria-label');
      if (aria) bits.push(aria);
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      for (const id of ids) {
        const n = document.getElementById(id);
        if (n) bits.push(textOf(n));
      }
      if (el.id) {
        for (const l of document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`)) bits.push(textOf(l));
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
    //     DETECTED overlay, not every page with a header). hasHoverContent: the element CONTROLS/DESCRIBES a
    //     tooltip/popover (popovertarget, or aria-describedby/aria-controls → a [role=tooltip]/[popover]) — reveals
    //     NEW content on hover/focus. Native `title` is EXEMPT per the rubric, so a bare title is NOT flagged.
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
    const _hasHoverContent = (el) => {
      if (el.hasAttribute('popovertarget')) return true;
      for (const a of ['aria-describedby', 'aria-controls']) { const v = el.getAttribute(a); if (v) for (const id of v.split(/\s+/)) if (_tooltipIds.has(id)) return true; }
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
      // #12 (2.4.4 enclosing context): text of the link's NEAREST block ancestor — WCAG "programmatically determined
      // link context". A link ALONE in its block (blockText == its own name) has NO enclosing context beyond its name;
      // a preceding-SIBLING block is not enclosing. General block-ancestor set, not one fixture's structure.
      const enclosingBlockText = (sampledRole === 'link' || tag === 'a') ? (function () { const bl = el.closest('p,li,td,th,dd,dt,figcaption,blockquote,caption,section,article,aside,header,footer,main,nav,details,form,fieldset'); return bl ? (bl.innerText || bl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300) : null; })() : undefined;
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
      if (!_subset && !focusable && !isFormField && !sampledRole && !text && !isImage && !liveRegion && !isMedia && !autoMotion && !backgroundImageMeaningful && !isCaptcha && !iframeTabExcluded && !focusableInAriaHidden && !prohibitedAriaAttr) continue; // a pre-selected subset element is always included
      els.push({
        xpath: xpathOf(el),
        // (axName below is computed by labelledText(el, sampledRole) — name-from-contents gated by role)
        text,
        hasText: text.length > 0,
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
        jsHref, enclosingBlockText, // #11 onclick-nav target + #12 enclosing-block context (2.4.4)
        // heading level for the page-structure precompute branch (Tier-0 #3): aria-level wins, else h1-h6 tag.
        ariaLevel: el.getAttribute('aria-level') ? Number(el.getAttribute('aria-level')) : (/^h[1-6]$/.test(tag) ? Number(tag[1]) : null),
        box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
        inModal: !!el.closest('[role="dialog"],dialog,[aria-modal="true"]'),
        focusRisk,
        removedFromA11yTree,
        hiddenMechanism,
        renderedVisible, nearbyText, svgLiveText, svgNamedDescendant,
        ariaHiddenWithName,
        complexImageHint,
        // Item 13 (cheap scrutiny signals, parity with eval-page): a native control that overrides its role
        // (<button role=link>) → name-role scrutiny; a field's placeholder → field-label scrutiny (placeholder-as-label).
        roleOverridesNative: ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(tag) && !!roleAttr,
        placeholder: el.getAttribute('placeholder') || null,
        liveRegion,
        isMedia,
        mediaInfo,
        autoMotion,
        underOverlay: focusable && _underOverlay(box),
        hasHoverContent: _hasHoverContent(el),
        backgroundImageMeaningful, backgroundImageUrl, isCaptcha, // TT gaps G2/G3 (1.1.1)
        iframeTabExcluded, focusableInAriaHidden, prohibitedAriaAttr, // deterministic barrier flags (2.1.1 / 4.1.2)
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
      if (e === doc.body) return '/html/body';
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOfInDoc(e.parentElement, doc) + '/' + tag + '[' + idx + ']';
    }
    for (const frame of (_subset ? [] : document.querySelectorAll('iframe, frame'))) { // subset = explicit selection; skip auto-traversal
      if (els.length >= cap) { _cappedOut = true; break; }
      let fdoc = null;
      try { fdoc = frame.contentDocument; } catch (e) { fdoc = null; } // cross-origin SecurityError → skip
      if (!fdoc || !fdoc.body) continue;
      const prefix = xpathOf(frame) + '>>';
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
          text, hasText: text.length > 0, focusable,
          isInteractive: focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole),
          isFormField, isImage, ariaAttrs: el.getAttributeNames().filter((n) => n.indexOf('aria-') === 0),
          roleAttr, sampledRole, axRole: sampledRole, axName: labelledText(el, sampledRole), tag, type,
          box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
          inModal: false, focusRisk: false, underOverlay: false, hasHoverContent: false,
          backgroundImageMeaningful: _frameBgM, backgroundImageUrl: _frameBgU, isCaptcha: _frameCaptcha, // R2 G3-2 parity
        });
      }
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
    const landmarks = [...document.querySelectorAll('main,nav,header,footer,aside,[role=main],[role=navigation],[role=banner],[role=contentinfo],[role=complementary],[role=search],[role=region]')].slice(0, 40)
      .map((l) => ({ tag: l.tagName.toLowerCase(), role: l.getAttribute('role') || null }));
    return {
      title: document.title || '',
      lang: document.documentElement.getAttribute('lang') || '',
      headings,
      landmarks,
      elements: els,
      reflowApplicable: false,
      truncated: _subset ? false : _cappedOut,   // EN C.9.6.2: the cap stopped the scan before the DOM was exhausted (a subset is never truncated)
      domElementCount: _subset ? _subset.length : _domTotal, // subset ⇒ the subset IS the complete element population
      subset: !!_subset,            // collected from a pre-selected xpath list (the 80-cap did not apply)
    };
  }, elementCap, Array.isArray(opts.xpaths) ? opts.xpaths : null);

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
          if (e === document.body) return '/html/body';
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
    structure: { title: data.title || '', lang: data.lang || '', headings: data.headings || [], landmarks: data.landmarks || [], tables: tables || [], lists: lists || [] },
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
