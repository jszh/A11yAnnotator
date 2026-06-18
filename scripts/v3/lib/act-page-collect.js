'use strict';
// Decoupled ACT-page collector: navigate `page` to `url` and extract the v3 element inventory orchestrate()
// needs. This is the SAME proven collection logic run-v3-act-suite.js uses inline (the page.evaluate body is
// copied verbatim), lifted into a parameterized function (url/elementCap/ids as args, no module-level argv
// coupling) so a parallel runner can reuse it offline (file://) without inheriting the suite's flag parsing.
const crypto = require('crypto');
const { collectTables } = require('./collect-tables.js'); // Tier-0 #4: per-<table> relationship facts for 1.3.1

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

// Navigate + extract. `opts`: { url, elementCap=80, file, runId, sourceUrl, pageDigest, settleMs=250, now }.
// Returns the collect artifact (file/sourceUrl/runId/pageDigest/collectedAt/elements/...).
async function collectActPage(page, opts = {}) {
  const url = opts.url;
  const elementCap = Number.isFinite(opts.elementCap) ? opts.elementCap : 80;
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await new Promise((r) => setTimeout(r, Number.isFinite(opts.settleMs) ? opts.settleMs : 250));
  const collectedAt = Number.isFinite(opts.now) ? opts.now : Date.now();
  const pageDigest = opts.pageDigest || digestForUrl(opts.sourceUrl || url);
  const data = await page.evaluate((cap) => {
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
    function labelledText(el) {
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
      return bits.join(' ').replace(/\s+/g, ' ').trim();
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
    const els = [];
    for (const el of document.querySelectorAll('body *')) {
      if (els.length >= cap) break;
      if (!visible(el)) continue;
      const tag = el.tagName.toLowerCase();
      const roleAttr = el.getAttribute('role') || '';
      const type = el.getAttribute('type') || '';
      const href = el.getAttribute('href') || '';
      const text = textOf(el).slice(0, 240);
      const sampledRole = roleAttr || nativeRoleInPage(tag, type, href);
      const box = el.getBoundingClientRect();
      const focusable = focusableByMarkup(el);
      const isFormField = fieldLike(el);
      const isInteractive = focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole);
      // GRAPHIC surface (parity with eval-page.js:449 `isImage`): an <img>/<svg>/<canvas>/role=img or
      // input[type=image] owes the non-text-content (1.1.1) / images-of-text (1.4.5) / non-text-contrast
      // (1.4.11) families EVEN when role-stripped (role="none"/"presentation") — that's exactly the mis-marked
      // decorative case. Kept by the inclusion filter so a role=none graphic still enumerates.
      const isImage = tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img' || (tag === 'input' && type === 'image');
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
      const renderedMeaningful = isImage && box.width >= 8 && box.height >= 8;
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
      if (!focusable && !isFormField && !sampledRole && !text && !isImage && !liveRegion && !isMedia && !autoMotion) continue;
      els.push({
        xpath: xpathOf(el),
        text,
        hasText: text.length > 0,
        focusable,
        isInteractive,
        isFormField,
        isImage,
        ariaAttrs,
        roleAttr,
        sampledRole,
        axRole: sampledRole,
        axName: labelledText(el),
        tag,
        type,
        href: href || null, // Item 14a: destination for the 2.4.4 same-name-link in-context index
        // heading level for the page-structure precompute branch (Tier-0 #3): aria-level wins, else h1-h6 tag.
        ariaLevel: el.getAttribute('aria-level') ? Number(el.getAttribute('aria-level')) : (/^h[1-6]$/.test(tag) ? Number(tag[1]) : null),
        box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
        inModal: !!el.closest('[role="dialog"],dialog,[aria-modal="true"]'),
        focusRisk,
        removedFromA11yTree,
        hiddenMechanism,
        renderedMeaningful,
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
    for (const frame of document.querySelectorAll('iframe, frame')) {
      if (els.length >= cap) break;
      let fdoc = null;
      try { fdoc = frame.contentDocument; } catch (e) { fdoc = null; } // cross-origin SecurityError → skip
      if (!fdoc || !fdoc.body) continue;
      const prefix = xpathOf(frame) + '>>';
      for (const el of fdoc.querySelectorAll('body *')) {
        if (els.length >= cap) break;
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
        if (!focusable && !isFormField && !sampledRole && !text && !isImage) continue;
        const box = el.getBoundingClientRect();
        els.push({
          xpath: prefix + xpathOfInDoc(el, fdoc), inFrame: true,
          text, hasText: text.length > 0, focusable,
          isInteractive: focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole),
          isFormField, isImage, ariaAttrs: el.getAttributeNames().filter((n) => n.indexOf('aria-') === 0),
          roleAttr, sampledRole, axRole: sampledRole, axName: labelledText(el), tag, type,
          box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
          inModal: false, focusRisk: false, underOverlay: false, hasHoverContent: false,
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
    };
  }, elementCap);

  // Tier-0 #4: per-<table> relationship facts (separate evaluate so the self-contained extractor is shared with
  // eval-page.js). Read-only; any failure degrades to [] (never throws).
  const tables = await page.evaluate(collectTables).catch(() => []);

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
    page: { reflowApplicable: !!data.reflowApplicable },
    structure: { title: data.title || '', lang: data.lang || '', headings: data.headings || [], landmarks: data.landmarks || [], tables: tables || [] },
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
