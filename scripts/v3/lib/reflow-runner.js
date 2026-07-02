'use strict';
// C6 — enhanced WCAG 1.4.10 (Reflow) runner. Fixes/extends the existing reflow-overflow-probe:
//  (1) G225 bug: the old isExempt treated ANY overflow-x:auto|scroll ancestor as a valid 2-D affordance, wrongly
//      clearing a carousel that strands flowable panels. The 2-D exception applies ONLY to content that genuinely
//      requires 2-D layout (data table / toolbar / map / media / code), not arbitrary flowable content.
//  (2) inner-scroller blindness: a stranded carousel reads documentElement.scrollWidth===320 (overflow is INSIDE
//      the scroller). Detect per-container scrollWidth>clientWidth on overflow-x:auto|scroll regions.
//  (3) reachability (G225): a stranded scroller is OK only if keyboard-scrollable (focusable) or has enabled nav.
//  (4) sticky/fixed consuming the 320x256 viewport; (5) unbreakable-string culprit (C33).
//  F102 (content disappears wide→320) is a separate wide-vs-320 diff (added in iteration 2).
//
// Disposition: FAIL (barrier) is non-authoritative-friendly but sound; CLEAR only when no non-exempt overflow,
// no stranded flowable scroller, no viewport-consuming sticky. ABSTAIN on genuinely-ambiguous 2-D-meaning.

const SLOP = 2;

function measureReflow320() {
  const SLOP = 2; // inlined — page.evaluate does not capture module-level consts
  const se = document.scrollingElement || document.documentElement;
  const vw = window.innerWidth, vh = window.innerHeight;
  const docOverflow = se.scrollWidth > se.clientWidth + SLOP;

  // The 2-D exception attaches to content that ITSELF requires two-dimensional layout (Note 2: maps/
  // diagrams/video/games/presentations/data tables/toolbar interfaces), and Understanding 1.4.10 scopes
  // it "only to that section". So 2-D-ness must come from the element's OWN tag/role — NEVER from its
  // subtree: one inline <code>x=1</code> or a lone <th> under a shared container must not blanket-exempt
  // overflowing SIBLINGS (over-clear confirmed on capability two-d cases 05/08; the old descendant-
  // querySelector branch did exactly that).
  const is2D = (el) => {
    if (!el || !el.tagName) return false;
    const role = el.getAttribute && el.getAttribute('role');
    if (/^(map|svg|canvas|video|iframe|img)$/i.test(el.tagName)) return true; // case-insensitive: an inline <svg> reports a lowercase tagName
    if (role && /^(table|grid|treegrid|toolbar|img|application|figure)$/.test(role)) return true;
    if (el.tagName === 'TABLE' && el.querySelector && el.querySelector('th, caption')) return true; // the element ITSELF is a data table (th/caption are ITS OWN structure, not a descendant blanket)
    if (/^(PRE|CODE)$/.test(el.tagName)) {
      // preformatted text is 2-D only when it actually PRESERVES a 2-D layout: computed white-space
      // still pre* AND multi-line content (indented code / ASCII art, capability two-d case-14). An
      // inline <code>x=1</code> carries no layout meaning and must not exempt anything.
      if (!/^pre/.test((getComputedStyle(el).whiteSpace || ''))) return false;
      return (el.textContent || '').split('\n').filter((l) => l.trim()).length >= 2;
    }
    return false;
  };
  const visible = (el) => { const c = getComputedStyle(el); if (c.display === 'none' || c.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };

  // classify the unbreakable-string culprit on an element whose OWN box overflows
  const unbreakableString = (el) => {
    const c = getComputedStyle(el); const t = (el.textContent || '');
    const longTok = /\S{30,}/.test(t.replace(/\s+/g, ' '));
    const allowsBreak = /(anywhere|break-word|break-all)/.test((c.overflowWrap || '') + ' ' + (c.wordBreak || ''));
    const nowrap = (c.whiteSpace || '').indexOf('nowrap') >= 0;
    return longTok && !allowsBreak && (nowrap || el.children.length === 0);
  };

  // GRANULARITY of an INHERITED exemption (Understanding 1.4.10: the exception "applies only to that
  // section"; "each cell within a table would still need to meet this success criterion"). Reflowable
  // text pinned wide INSIDE a 2-D region is the region's over-claim, not its 2-D-ness — the overflow is
  // PIN-INTRINSIC to the node when: prose is forced onto one line (white-space:nowrap), an unbreakable
  // long token has no overflow-wrap escape, wrappable prose still renders wider than the WHOLE viewport
  // (only a pinned width does that), or `withMinWidth` and an explicit min-width pins it past the viewport.
  const pinIntrinsic = (el, r, withMinWidth) => {
    const c = getComputedStyle(el); const t = (el.textContent || '').trim();
    const prose = /\s/.test(t); const nowrap = (c.whiteSpace || '').indexOf('nowrap') >= 0;
    if (prose && nowrap) return true;
    if (unbreakableString(el)) return true;
    if (prose && !nowrap && r.width > vw + SLOP) return true;
    if (withMinWidth && (parseFloat(c.minWidth) || 0) > vw + SLOP) return true;
    return false;
  };

  // 1) DOCUMENT-LEVEL overflow sources crossing the right edge
  const all = document.body ? [...document.body.querySelectorAll('*')] : [];
  let docOverflowSource = false, docNonExempt = false, culprit = null, dataTableExemption = false;
  for (const el of all) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + SLOP && r.left < vw) {
      docOverflowSource = true;
      let exempt = false;
      for (let p = el; p; p = p.parentElement) {
        if (!is2D(p)) continue;
        const roleAttr = (p.getAttribute && p.getAttribute('role')) || '';
        const tableLike = p.tagName === 'TABLE' || /grid|table/.test(roleAttr);
        if (p !== el) {
          // INHERITED exemption — enforce section granularity before accepting it:
          //  · a TABLE/grid exempts its GRID, "not individual cells" (Note 2) — an overflowing node
          //    inside a td/th whose overflow is pin-intrinsic is the CELL's own defect and must still
          //    reflow (confirmed on capability two-d case-08: one cell's prose pinned to 800px);
          //  · an application/figure/toolbar-ROLE wrapper exempts a 2-D interface, not reflowable prose
          //    pinned inside it (confirmed on capability two-d case-05: a toolbar exemption mis-scoped
          //    over the whole prose document body). min-width is only a pin SIGNAL for cell content —
          //    a min-width'd graphical canvas inside an application wrapper is normal 2-D authoring.
          const cell = el.closest && el.closest('td, th');
          if (tableLike && cell && p.contains(cell) && pinIntrinsic(el, r, true)) continue;
          if (/^(application|figure|toolbar)$/.test(roleAttr) && pinIntrinsic(el, r, false)) continue;
        }
        exempt = true; if (tableLike) dataTableExemption = true;
        break;
      }
      if (!exempt) { docNonExempt = true; if (!culprit) culprit = unbreakableString(el) ? 'unbreakable-string' : (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : '')); }
    }
  }

  // 2) INNER SCROLLERS (overflow-x auto/scroll) with stranded content — the G225 case the doc-level check misses
  const scrollers = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const c = getComputedStyle(el);
    if (!/(auto|scroll)/.test(c.overflowX)) continue;
    if (el.scrollWidth <= el.clientWidth + SLOP) continue; // nothing stranded
    // a scroller whose stranded content is an UNBREAKABLE STRING (a long URL/token) is the C33 author affordance for an
    // unavoidable string (scroll the box, not the page) — NOT a stranded-flowable-content barrier.
    // 2-D justification is scoped to the SECTION that overflows: the scroller is a valid bounded 2-D
    // affordance when it ITSELF is 2-D (a scrolling <pre>/data table) OR the wide content it scrolls IS a
    // 2-D artifact (a data table/svg/canvas/… wider than the scroller's box). A 2-D descendant that is NOT
    // the wide thing (an inline <code> token inside a carousel) justifies nothing — the exception "applies
    // only to that section" (Understanding 1.4.10; same over-clear family as capability two-d cases 05/08).
    const wide2DContent = is2D(el) || [...el.querySelectorAll('table, pre, code, svg, canvas, map, video, iframe, [role=grid], [role=treegrid], [role=toolbar]')].some((d) => is2D(d) && d.getBoundingClientRect().width > el.clientWidth + SLOP);
    const flowable = !wide2DContent && !unbreakableString(el);
    // reachability: the scroller is keyboard-operable (focusable), OR there are ENABLED nav controls near it
    const focusable = el.tabIndex >= 0;
    const scope = el.parentElement || el;
    const navBtns = [...scope.querySelectorAll('button, [role=button], a[href]')].filter((b) => { const bc = getComputedStyle(b); return bc.display !== 'none' && bc.visibility !== 'hidden' && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.getAttribute('aria-hidden') !== 'true' && (b.tabIndex == null || b.tabIndex >= 0); });
    // tabs that expose panels also count
    const hasTabs = scope.querySelector('[role=tablist] [role=tab]') != null;
    const reachable = focusable || navBtns.length > 0 || hasTabs;
    scrollers.push({ flowable, reachable, strandedPx: el.scrollWidth - el.clientWidth, tag: el.tagName.toLowerCase(), cls: typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '' });
  }
  const strandedFlowableScroller = scrollers.find((s) => s.flowable && !s.reachable) || null;

  // 3) STICKY/FIXED consuming the small viewport
  let stickyArea = 0;
  for (const el of all) {
    if (!visible(el)) continue;
    const c = getComputedStyle(el);
    if (c.position !== 'sticky' && c.position !== 'fixed') continue;
    const r = el.getBoundingClientRect();
    const w = Math.min(r.right, vw) - Math.max(r.left, 0), h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (w > 0 && h > 0) stickyArea += w * h;
  }
  const stickyFraction = stickyArea / (vw * vh);

  return {
    vw, vh, docOverflow, docOverflowSource, docNonExempt, culprit, dataTableExemption,
    scrollers, strandedFlowableScroller, stickyFraction: +stickyFraction.toFixed(3),
  };
}

function disposeReflow(m) {
  if (!m) return { decided: false, reason: 'measure-failed' };
  // BARRIER paths
  if (m.docOverflow && m.docNonExempt) return { decided: true, verdict: 'fail', kind: 'document-overflow', culprit: m.culprit, reason: 'non-exempt content overflows horizontally at 320px (culprit: ' + m.culprit + ')' };
  if (m.strandedFlowableScroller) return { decided: true, verdict: 'fail', kind: 'g225-stranded-scroller', culprit: m.strandedFlowableScroller.tag + '.' + m.strandedFlowableScroller.cls, reason: 'a horizontal scroller strands flowable panels (' + m.strandedFlowableScroller.strandedPx + 'px) with no keyboard/nav reachability (G225)' };
  if (m.stickyFraction >= 0.4) return { decided: true, verdict: 'fail', kind: 'sticky-consumes-viewport', reason: 'sticky/fixed content consumes ' + Math.round(m.stickyFraction * 100) + '% of the 320x256 viewport' };
  if (m.f102Disappeared) return { decided: true, verdict: 'fail', kind: 'f102-disappearance', culprit: m.f102Disappeared, reason: 'content visible at 1280px DISAPPEARS at 320px with no reveal/equivalent (F102): "' + m.f102Disappeared + '"' };
  // G224: meaningful indentation may have collapsed — meaning is a JUDGMENT (decorative vs structural), defer.
  if (m.g224IndentCollapsed) return { decided: false, abstain: true, uncertainReason: 'indentation that conveyed structure at wide width collapsed at 320px — whether that meaning is lost (G224) is a content judgment; defer to the rubric' };
  // CLEAR: overflow exists but is all 2-D-exempt, OR no overflow at all
  if (m.docOverflowSource && !m.docNonExempt) return { decided: true, verdict: 'pass', kind: '2d-exempt', reason: 'horizontal overflow is confined to genuine 2-D content (data table/map/media/code) — the 1.4.10 exception applies' + (m.dataTableExemption ? ' (data-table)' : '') };
  if (!m.docOverflow && !m.strandedFlowableScroller && m.stickyFraction < 0.4) return { decided: true, verdict: 'pass', kind: 'reflows', reason: 'content reflows to 320px with no horizontal scroll, no stranded scroller, no viewport-consuming sticky' };
  return { decided: false, abstain: true, uncertainReason: 'reflow state ambiguous — judge from the 320px rendering' };
}

// Content inventory at the CURRENT viewport: text-bearing elements with a signature + visibility + indentation.
// Used for the WIDE(1280)-vs-320 diff: F102 (content present at wide DISAPPEARS at 320) + G224 (meaningful
// indentation collapses). A `sig` keys the same content across widths.
function captureInventory() {
  const out = {};
  // :target reveal rules (hoisted, once per capture) — a same-document #fragment link is only a REAL reveal
  // path when a stylesheet actually un-hides the target on navigation (`#x:target{display:…}`): fragment
  // navigation alone cannot un-hide display:none content, so crediting a bare #fragment link was an
  // unsanctioned deterministic CLEAR (round-3 overfit-audit review, #12 defect 2). Grouping rules (@media/
  // @supports) are recursed via the no-selectorText guard (nesting-era Chrome gives EVERY style rule a truthy
  // .cssRules — same quirk documented in act-page-collect's hover scan). Cross-origin sheets are skipped.
  const targetRevealBases = (() => {
    const bases = [];
    const reveals = (st) => !!st && ((st.display && st.display !== 'none') || st.visibility === 'visible' || (st.opacity && parseFloat(st.opacity) > 0));
    const walk = (rules) => {
      for (const rule of rules || []) {
        if (rule.selectorText) {
          if (/:target/.test(rule.selectorText) && reveals(rule.style)) {
            for (const part of rule.selectorText.split(',')) {
              if (!/:target/.test(part)) continue;
              bases.push(part.replace(/:target/g, '').trim() || '*');
              if (bases.length >= 100) return;
            }
          }
        } else if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch (e) { /* cross-origin */ } }
    return bases;
  })();
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    if (!own || own.length < 4) continue;
    const r = el.getBoundingClientRect();
    const sig = own.slice(0, 60);
    // CLIPPED by an ancestor overflow:hidden/clip (content cut off, not display:none) — also a disappearance.
    let clipped = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const pc = getComputedStyle(p); if (!/(hidden|clip)/.test(pc.overflowX + ' ' + pc.overflowY)) continue;
      const pr = p.getBoundingClientRect();
      if (r.right > pr.right + 8 || r.left >= pr.right - 2 || r.bottom > pr.bottom + 8 || r.top >= pr.bottom - 2) { clipped = true; break; }
    }
    const hidden = cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1 || clipped;
    // INDENT = the element's rendered left offset (captures cumulative ANCESTOR indentation — nested replies,
    // quote chains, tree depth — not just its own padding/margin).
    const indent = Math.round(r.left);
    // a plausible reveal control for this content (so a disappearance isn't penalised if there's an equivalent):
    // the element OR ANY ANCESTOR is revealed by aria-controls (e.g. nav links inside a hamburger-controlled <nav>),
    // OR a same-paragraph/item link whose SAME-DOCUMENT fragment provably targets this content. STRUCTURAL
    // signals only: a control counts when its binding can be CONFIRMED to target THIS node/an ancestor.
    // (The old ENGLISH-phrase match — "read more/show more/view full …" — decided a deterministic
    // FAIL/CLEAR flip by language: it over-cleared on an offsite "read our full story" link that proves
    // nothing about equivalence, and gave a non-English reveal like "Weiterlesen" no credit. A bare
    // same-scope link whose href/binding can't be confirmed leaves revealable=false, so the disappearance
    // FAILS as F102 and routes to the reflow-checklist skeptic — equivalent-content-on-reflow — which
    // judges equivalence from the 320px rendering; capability f102 case-14 labels that path 'abstain'.)
    const ancestorControlled = (() => { for (let p = el; p; p = p.parentElement) { if (p.id && document.querySelector('[aria-controls~="' + p.id + '"]')) return true; } return false; })();
    const fragmentCtrl = (() => {
      const scope = el.closest('p, li'); if (!scope) return false;
      return [...scope.querySelectorAll('a[href]')].some((a) => {
        let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return false; }
        if (!u.hash || u.origin !== location.origin || u.pathname !== location.pathname) return false; // only a SAME-DOCUMENT fragment is confirmable
        const t = document.getElementById(decodeURIComponent(u.hash.slice(1)));
        if (!t || (t !== el && !t.contains(el))) return false;
        // the fragment must ACTUALLY reveal: some :target reveal rule applies to the target itself. Without
        // one, navigating the fragment leaves display:none content hidden — no credit; the disappearance
        // fails as F102 and routes to the equivalent-content-on-reflow skeptic (the safe direction).
        return targetRevealBases.some((b) => { try { return t.matches(b); } catch (e) { return false; } });
      });
    })();
    const revealable = !!(el.closest('details, [aria-expanded], [role=menu], [role=dialog]') || (el.id && document.querySelector('[aria-controls~="' + el.id + '"]')) || ancestorControlled || fragmentCtrl);
    if (!out[sig]) out[sig] = { visible: !hidden, indent, revealable };
    else { if (!hidden) out[sig].visible = true; }
  }
  return out;
}

async function runReflow(page, { url } = {}) {
  // WIDE pass (1280) — inventory for the F102/G224 diff
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 }).catch(() => {});
  if (url) await page.goto(url, { waitUntil: 'load' }).catch(() => {});
  await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — fonts+layout settle before the reflow diff
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  const wide = await page.evaluate(captureInventory).catch(() => ({}));
  // NARROW pass (320) — overflow measure + inventory
  await page.setViewport({ width: 320, height: 256, deviceScaleFactor: 1 }).catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  const m = await page.evaluate(measureReflow320).catch(() => null);
  const narrow = await page.evaluate(captureInventory).catch(() => ({}));
  // DIFF: F102 disappearance (visible-at-wide, gone-at-320, no reveal equivalent) + G224 indent collapse
  let f102 = null, g224 = false;
  if (m && wide && narrow) {
    for (const sig of Object.keys(wide)) {
      const w = wide[sig], n = narrow[sig];
      if (w.visible && (!n || !n.visible)) { if (!(w.revealable || (n && n.revealable))) { f102 = sig.slice(0, 40); break; } }
    }
    // G224 candidate: an element's rendered indentation collapses meaningfully wide→320 (relative, since it may
    // collapse to a small-but-nonzero value). Any real collapse ⇒ abstain so the rubric judges whether the
    // indentation conveyed structure (vs decorative). Distinct indents across siblings at wide that flatten to a
    // single indent at 320 is the structural-depth-lost signal.
    const wideIndents = new Set(); const narrowIndents = new Set();
    for (const sig of Object.keys(wide)) {
      const w = wide[sig], n = narrow[sig];
      if (w.visible && n && n.visible) {
        if (w.indent >= 12 && n.indent < w.indent * 0.5 && (w.indent - n.indent) >= 10) { g224 = true; break; }
        wideIndents.add(w.indent); narrowIndents.add(n.indent);
      }
    }
    // distinct depths at wide collapsing to fewer at 320 (nesting flattened)
    if (!g224 && wideIndents.size >= 3 && narrowIndents.size <= Math.ceil(wideIndents.size / 2) && Math.max(...wideIndents) >= 24) g224 = true;
    m.f102Disappeared = f102; m.g224IndentCollapsed = g224;
  }
  const d = disposeReflow(m);
  return { sc: '1.4.10', measure: m, ...d };
}

module.exports = { runReflow, disposeReflow, measureReflow320 };
