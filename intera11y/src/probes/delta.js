'use strict';
// Before/after observation of one interaction, shared by the activation and forms probes. The in-page halves keep
// their state in a WeakMap (no attributes written into the page, so the page's own mutation observers see nothing).

const LIVE_SEL = '[aria-live="polite"],[aria-live="assertive"],[role="status"],[role="alert"],[role="log"],[role="alertdialog"],[role="timer"],[role="marquee"],output';

// in-page: record what is visible and what each element says
function snapBefore(liveSel) {
  const vis = (el) => { try { return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && !el.closest('[aria-hidden="true"]'); } catch (e) { return false; } };
  const own = (el) => { let t = ''; for (const c of el.childNodes) if (c.nodeType === 3) t += c.textContent; return t.replace(/\s+/g, ' ').trim(); };
  const pre = new WeakMap();
  const cls = (el) => (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '';
  for (const el of document.querySelectorAll('body *')) pre.set(el, { v: vis(el), t: own(el).slice(0, 300), c: String(cls(el)).slice(0, 200), s: el.getAttribute('src'), l: el.getAttribute('aria-label') });
  window.__iaPre = pre;
  const regions = new WeakMap();
  const liveRegions = [];
  for (const r of document.querySelectorAll(liveSel)) {
    const text = (r.textContent || '').replace(/\s+/g, ' ').trim();
    regions.set(r, { text, html: r.innerHTML.slice(0, 4000) });
    liveRegions.push({ xpath: window.__ia.xpathOf(r), text: text.slice(0, 160), politeness: r.getAttribute('aria-live') || r.getAttribute('role') || r.tagName.toLowerCase(), atomic: r.getAttribute('aria-atomic'), relevant: r.getAttribute('aria-relevant') });
  }
  window.__iaLive = regions;
  // a timeline of what live regions (and any inserted text) said while the action ran: a message that appears and
  // is then removed, or replaced, leaves no trace in a single after-snapshot
  const t0 = Date.now();
  window.__iaTimeline = [];
  if (window.__iaObserver) window.__iaObserver.disconnect();
  window.__iaObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      const node = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (!node || node.nodeType !== 1) continue;
      const region = node.closest(liveSel);
      const where = region || node;
      const text = (where.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      const last = window.__iaTimeline[window.__iaTimeline.length - 1];
      if (last && last.xpath === window.__ia.xpathOf(where) && last.text === text) continue;
      if (!region && !m.addedNodes.length && m.type !== 'characterData') continue;
      if (window.__iaTimeline.length < 40) window.__iaTimeline.push({ ms: Date.now() - t0, xpath: window.__ia.xpathOf(where), inLiveRegion: !!region, text });
    }
  });
  window.__iaObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
  const a = window.__ia.deepActive();
  return { url: location.href, active: a && a !== document.body ? window.__ia.xpathOf(a) : null, liveRegions, scroll: { x: scrollX, y: scrollY } };
}

// in-page: what changed since snapBefore
function snapAfter(liveSel, triggerXp) {
  const pre = window.__iaPre || new WeakMap();
  const regions = window.__iaLive || new WeakMap();
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && !el.closest('[aria-hidden="true"]'); } catch (e) { return false; } };
  const own = (el) => { let t = ''; for (const c of el.childNodes) if (c.nodeType === 3) t += c.textContent; return t.replace(/\s+/g, ' ').trim(); };
  const FOC = 'a[href],button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex^="-"]),[contenteditable="true"]';
  const revealedEls = [], hiddenEls = [], newText = [];
  for (const el of document.querySelectorAll('body *')) {
    const p = pre.get(el);
    const v = vis(el);
    if (v && (!p || !p.v)) {
      if (!revealedEls.some((r) => r.contains(el))) revealedEls.push(el);
    } else if (!v && p && p.v) {
      if (!hiddenEls.some((r) => r.contains(el))) hiddenEls.push(el);
    }
    if (!v) continue;
    const t = own(el);
    if (!t) continue;
    if (p && p.v && p.t === t.slice(0, 300)) continue;
    if (newText.length >= 30) continue;
    const region = el.closest(liveSel);
    const rp = region ? regions.get(region) : null;
    newText.push({
      xpath: X(el), text: t.slice(0, 200),
      cause: !p ? 'inserted' : !p.v ? 'revealed' : 'changed',
      liveRegion: region ? { xpath: X(region), politeness: region.getAttribute('aria-live') || region.getAttribute('role') || region.tagName.toLowerCase(), preExisted: !!rp, wasEmpty: rp ? !rp.text : null } : null,
    });
  }
  // keep only the outermost revealed/hidden containers
  const top = (arr) => arr.filter((el) => !arr.some((o) => o !== el && o.contains(el)));
  const describe = (el) => ({
    xpath: X(el), tag: el.tagName.toLowerCase(), role: el.getAttribute('role'),
    text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    focusables: [...el.querySelectorAll(FOC)].filter(vis).length + (el.matches(FOC) ? 1 : 0),
    modal: el.matches('dialog[open],[aria-modal="true"]') || !!el.querySelector('dialog[open],[aria-modal="true"]'),
  });
  const revealed = top(revealedEls).slice(0, 12).map(describe);
  const hidden = top(hiddenEls).slice(0, 12).map((el) => ({ xpath: X(el), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) }));
  let modal = null;
  for (const m of document.querySelectorAll('dialog[open],[aria-modal="true"]')) { if (vis(m)) { modal = X(m); break; } }
  const a = window.__ia.deepActive();
  const active = a && a !== document.body ? X(a) : null;
  const inRevealed = !!(a && top(revealedEls).some((r) => r.contains(a)));
  // live regions now: their text, so an update — including a removal — can be read against the text before
  const liveNow = [];
  for (const r of document.querySelectorAll(liveSel)) {
    const text = (r.textContent || '').replace(/\s+/g, ' ').trim();
    const rp = regions.get(r);
    const html = r.innerHTML.slice(0, 4000);
    if (rp && rp.text === text && rp.html === html) continue;
    // what an image/icon inserted into the region offers as text (alt, aria-label, <title>), if anything
    const nonText = [...r.querySelectorAll('img,svg,[role="img"]')].map((g) => ({ tag: g.tagName.toLowerCase(), ariaHidden: !!g.closest('[aria-hidden="true"]'), text: (g.getAttribute('alt') || g.getAttribute('aria-label') || (g.querySelector('title') ? g.querySelector('title').textContent : '') || '').trim().slice(0, 80) }));
    liveNow.push({ xpath: X(r), politeness: r.getAttribute('aria-live') || r.getAttribute('role') || r.tagName.toLowerCase(), atomic: r.getAttribute('aria-atomic'), relevant: r.getAttribute('aria-relevant'), preExisted: !!rp, textBefore: rp ? rp.text.slice(0, 200) : null, textAfter: text.slice(0, 200),
      markupChangedButNotText: !!(rp && rp.text === text && rp.html !== html), nonTextContent: nonText.length ? nonText.slice(0, 4) : undefined, markupAfter: rp && rp.text === text ? html.replace(/\s+/g, ' ').slice(0, 300) : undefined, visible: vis(r) });
    if (liveNow.length >= 10) break;
  }
  // visual changes that are not text: an icon/image whose class, source or label changed (a non-text status cue)
  const cls = (el) => (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '';
  const visualChanges = [];
  for (const el of document.querySelectorAll('img,svg,i,[class*="icon" i],[class*="status" i],[class*="badge" i],[role="img"]')) {
    const p = pre.get(el);
    if (!vis(el) || (el.parentElement && el.parentElement.closest('svg'))) continue;
    const c = String(cls(el)).slice(0, 200), src = el.getAttribute('src'), lab = el.getAttribute('aria-label');
    if (p && p.c === c && (p.s || null) === (src || null) && p.l === lab && p.v) continue;
    const region = el.closest(liveSel);
    visualChanges.push({ xpath: X(el), tag: el.tagName.toLowerCase(), inserted: !p, classBefore: p ? p.c : null, classAfter: c, srcAfter: src, labelBefore: p ? p.l : null, labelAfter: lab, becameVisible: !p || !p.v,
      ariaHidden: !!el.closest('[aria-hidden="true"]'), accessibleText: (lab || (el.querySelector && el.querySelector('title') ? el.querySelector('title').textContent : '') || el.getAttribute('alt') || '').trim().slice(0, 80),
      inLiveRegion: region ? window.__ia.xpathOf(region) : null });
    if (visualChanges.length >= 10) break;
  }
  const trig = triggerXp ? window.__ia.resolve(triggerXp) : null;
  const attrs = {};
  if (trig) for (const n of ['aria-expanded', 'aria-pressed', 'aria-checked', 'aria-selected', 'aria-current', 'aria-hidden', 'class', 'open', 'hidden']) attrs[n] = trig.getAttribute(n);
  const timeline = (window.__iaTimeline || []).slice();
  if (window.__iaObserver) { window.__iaObserver.disconnect(); window.__iaObserver = null; }
  return { url: location.href, active, focusInRevealed: inRevealed, revealed, hidden, newText, modal, liveRegionChanges: liveNow, visualChanges, timeline, triggerAttrs: attrs, triggerText: trig ? (trig.innerText || trig.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null, scroll: { x: scrollX, y: scrollY } };
}

function triggerAttrsNow(triggerXp) {
  const trig = window.__ia.resolve(triggerXp);
  const attrs = {};
  if (trig) for (const n of ['aria-expanded', 'aria-pressed', 'aria-checked', 'aria-selected', 'aria-current', 'aria-hidden', 'class', 'open', 'hidden']) attrs[n] = trig.getAttribute(n);
  return { attrs, text: trig ? (trig.innerText || trig.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null };
}

// Node side: the computed AX facts of one element (role, name, states), via Puppeteer's accessibility snapshot.
async function axOf(page, xpath) {
  try {
    const h = await page.evaluateHandle((xp) => window.__ia.resolve(xp), xpath);
    const el = h.asElement();
    if (!el) return null;
    const s = await page.accessibility.snapshot({ root: el, interestingOnly: false });
    await h.dispose();
    if (!s) return null;
    const pick = {};
    for (const k of ['role', 'name', 'expanded', 'pressed', 'checked', 'selected', 'disabled', 'haspopup', 'invalid', 'value', 'valuetext']) if (s[k] !== undefined) pick[k] = s[k];
    return pick;
  } catch (e) { return null; }
}

// Keep the page under observation in place. A navigation away from it (a form submission that goes through, a
// link, script setting location) is answered with HTTP 204 No Content, which browsers treat as "stay on the
// current page" — aborting it instead would replace the page with the browser's error page. window.open is
// disabled. Returns a getter for the URLs whose navigation was held back.
async function guardNavigation(page) {
  const blocked = [];
  const start = page.url();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    let hold = false;
    try { hold = req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() !== start; } catch (e) { hold = false; }
    if (hold) { blocked.push(req.url()); req.respond({ status: 204, body: '' }).catch(() => {}); } else req.continue().catch(() => {});
  });
  await page.evaluate(() => { window.open = () => null; }).catch(() => {});
  return () => blocked.slice();
}

// Wait until the DOM has been quiet for `quietMs` (bounded by maxMs) — lets delayed status messages land.
async function settleMutations(page, quietMs = 800, maxMs = 6000) {
  await page.evaluate((q, m) => new Promise((resolve) => {
    let last = Date.now();
    const obs = new MutationObserver(() => { last = Date.now(); });
    obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
    const t0 = Date.now();
    const tick = () => { if (Date.now() - last >= q || Date.now() - t0 >= m) { obs.disconnect(); resolve(); } else setTimeout(tick, 50); };
    setTimeout(tick, 50);
  }), quietMs, maxMs).catch(() => {});
}

function hasEffect(before, after, attrsBefore, axBefore, axAfter, blocked) {
  const attrChanged = JSON.stringify(attrsBefore) !== JSON.stringify(after.triggerAttrs);
  const axChanged = JSON.stringify(axBefore) !== JSON.stringify(axAfter);
  const focusMoved = after.active !== before.active && after.active !== null;
  const scrolled = before.scroll && (before.scroll.x !== after.scroll.x || before.scroll.y !== after.scroll.y);
  return !!(after.revealed.length || after.hidden.length || after.newText.length || after.modal || attrChanged || axChanged
    || (after.liveRegionChanges && after.liveRegionChanges.length) || (after.visualChanges && after.visualChanges.length)
    || (blocked && blocked.length) || after.url !== before.url || focusMoved || scrolled);
}

module.exports = { LIVE_SEL, snapBefore, snapAfter, triggerAttrsNow, axOf, guardNavigation, settleMutations, hasEffect };
