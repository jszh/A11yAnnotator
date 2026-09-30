'use strict';
// CONTENT probe — the rendered page read as content: links and their context (2.4.4), text and its contrast
// (1.4.3), images and their text alternatives (1.1.1).
//
// The page is scrolled through in viewport-high steps on a fresh page; every element is measured and cropped in
// the step where it is in view, so each fact about pixels comes from the rendered page, not from CSS alone.
//
//   links   — computed name; programmatic context as WCAG defines it (enclosing sentence/paragraph, list item,
//             table cell and its headers, aria-describedby); nearby text that is NOT programmatically related (a
//             preceding heading or block, F63); destination; other links with the same name and their
//             destinations.
//   text    — per text-bearing element: colour, the background composited up the ancestor chain, the font size and
//             weight and so the threshold (4.5:1, or 3:1 for large text), the ratio; then the rendered pixels: the
//             dominant colour behind the text and whether it agrees with the computed background. Anything the
//             chain cannot reduce (background image, gradient, filter, opacity, blend, text over positioned content)
//             is flagged as complex. Crops of complex and failing text.
//   images  — <img>, <input type=image>, <svg>, role=img, <object>, <area>, <canvas>, and boxes painted by a CSS
//             background image with no text: alt/computed name/name source, how it is hidden or marked decorative,
//             file name, the text around it, and a crop.
const png = require('../lib/png.js');
const { contrastRatio } = require('../lib/v3.js');
const { loadLazyContent } = require('../core/session.js');

// viewport-high screenshot steps: the whole page (≈ 360 000 px); the probe's time limit bounds the work, and a page
// longer than this is marked truncated
const STEP_LIMIT = 400;

function inventory() {
  // runs in the page: its caps are defined here; hitting one marks the probe truncated (never a silent drop)
  const CAP = { links: 5000, texts: 20000, images: 3000 };
  let capped = false;
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const txt = (el) => (el ? (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  // every match in the document and in every open shadow root (web components keep their links, text and images
  // there); and the composed parent, which crosses from a shadow root to its host
  const deepAll = (sel) => {
    const out = [];
    const walk = (root) => { for (const el of root.querySelectorAll(sel)) out.push(el); for (const el of root.querySelectorAll('*')) if (el.shadowRoot) walk(el.shadowRoot); };
    walk(document);
    return out;
  };
  const up = (el) => el.parentElement || (el.parentNode && el.parentNode.host) || null;
  // a link that is the only link inside a custom element's shadow root is that component, as the user meets it
  const linkXpath = (a) => {
    const host = a.getRootNode() && a.getRootNode().host;
    if (host && host.tagName.includes('-') && host.shadowRoot.querySelectorAll('a[href],[role="link"]').length === 1) return X(host);
    return X(a);
  };
  // ---- links
  const links = [];
  for (const a of deepAll('a[href],[role="link"]')) {
    if (!vis(a) && !a.getClientRects().length) continue;
    const p = a.closest('p,li,td,th,dd,dt,blockquote,figcaption');
    let context = p ? txt(p) : '';
    // no paragraph, list item or cell: the link's sentence is still programmatically determined context (WCAG's
    // definition: the same sentence, paragraph, list item or cell) — "<div><a>Read more</a> about the W3C WAI</div>".
    // It counts only when the sentence has words beyond link texts (a row of links is not each other's context).
    let sentence = null;
    if (!p) {
      const blk = a.closest('div,section,article,header,footer,main,aside,nav,form,figure,span,label,body');
      if (blk) {
        const norm = (t) => t.replace(/\s+/g, ' ');
        const before = document.createRange(); before.setStart(blk, 0); before.setEndBefore(a);
        const pre = norm(before.toString()), self = norm(a.textContent || ''), post = norm(blk.textContent || '').slice(pre.length + self.length);
        const start = Math.max(pre.search(/[.!?](?=\s)[^.!?]*$/) + 1, 0);
        const endM = post.search(/[.!?](\s|$)/);
        const s0 = (pre.slice(start) + self + (endM >= 0 ? post.slice(0, endM + 1) : post)).trim();
        let rest = s0;
        for (const l of blk.querySelectorAll('a[href],[role="link"]')) { const lt = norm(l.textContent || '').trim(); if (lt) rest = rest.split(lt).join(' '); }
        if (rest.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length >= 2) sentence = s0.slice(0, 300);
      }
      if (sentence) context = sentence;
    }
    let headers = [];
    const cell = a.closest('td,th');
    if (cell) {
      const row = cell.parentElement, table = cell.closest('table');
      const idx = [...row.children].indexOf(cell);
      const th = table && table.querySelector('thead tr, tr');
      if (th && th.children[idx] && th !== row) headers.push(txt(th.children[idx]));
      const rh = row.querySelector('th'); if (rh && rh !== cell) headers.push(txt(rh));
      for (const id of (cell.getAttribute('headers') || '').split(/\s+/).filter(Boolean)) { const h = document.getElementById(id); if (h) headers.push(txt(h)); }
    }
    const described = (a.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).map((id) => txt(document.getElementById(id))).filter(Boolean);
    // nearby but not programmatically related: the nearest preceding heading and the preceding block
    let heading = null;
    const all = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')];
    for (const h of all) if (h.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) heading = h;
    const block = a.closest('p,li,td,dd,div,section,article') || a.parentElement;
    const prevBlock = block && block.previousElementSibling;
    links.push({
      // xpath: the link as the user meets it (a component host, see linkXpath); linkXpath: the link element itself,
      // whose computed name and role are the link's
      xpath: linkXpath(a), linkXpath: X(a), href: a.href || a.getAttribute('href') || null, text: txt(a).slice(0, 120),
      context: context && context !== txt(a) ? context.slice(0, 300) : null,
      contextKind: p ? p.tagName.toLowerCase() : sentence ? 'sentence' : null,
      tableHeaders: headers.filter(Boolean).slice(0, 3), describedBy: described,
      precedingHeading: heading ? txt(heading).slice(0, 120) : null,
      precedingBlock: prevBlock ? txt(prevBlock).slice(0, 160) : null,
      title: a.getAttribute('title'),
      box: box(a),
    });
    if (links.length >= CAP.links) { capped = true; break; }
  }
  // ---- text
  const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const texts = [];
  for (const el of deepAll('*')) {
    let own = '';
    for (const c of el.childNodes) if (c.nodeType === 3) own += c.textContent;
    own = own.replace(/\s+/g, ' ').trim();
    if (!own || !/[\p{L}\p{N}]/u.test(own) || !vis(el)) continue;
    const cs = getComputedStyle(el);
    if (el.closest('[disabled],[aria-disabled="true"]')) continue;          // inactive components are exempt
    let complex = [];
    const layers = [];
    for (let a = el; a; a = up(a)) {
      const s = getComputedStyle(a);
      if (s.backgroundImage && s.backgroundImage !== 'none') complex.push(`background-image on ${a.tagName.toLowerCase()}`);
      if (parseFloat(s.opacity) < 1) complex.push('opacity');
      if (s.filter !== 'none' || s.mixBlendMode !== 'normal') complex.push('filter/blend');
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    const fg0 = parse(cs.color);
    if (!fg0) continue;
    const fg = over(fg0, bg);
    if (cs.textShadow && cs.textShadow !== 'none') complex.push('text-shadow');
    const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || (cs.fontWeight === 'bold' ? 700 : 400);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    texts.push({ xpath: X(el), text: own.slice(0, 80), fg: [fg.r, fg.g, fg.b].map(Math.round), bg: [bg.r, bg.g, bg.b].map(Math.round), size, weight, large, complex: [...new Set(complex)], box: box(el) });
    if (texts.length >= CAP.texts) { capped = true; break; }
  }
  // ---- images
  const images = [];
  // an <object> that references a resource but drew no box has not rendered it here; its size is not the author's
  // (1.1.1's applicability: presented unless deliberately sized as a tracking pixel)
  const unrenderedEmbed = (el) => el.tagName === 'OBJECT' && !!el.getAttribute('data') && el.checkVisibility({ visibilityProperty: true }) && !el.getBoundingClientRect().width && !el.getBoundingClientRect().height;
  // a 2D canvas with no painted pixel presents nothing (null: not readable — WebGL, tainted by cross-origin images, or
  // outside the viewport's width)
  const canvasBlank = (el) => {
    try {
      if (!el.width || !el.height || el.width * el.height > 4e6) return null;
      // a canvas outside the viewport's width (a carousel slide) may not be drawn until shown: not readable here
      const cr = el.getBoundingClientRect();
      if (cr.left >= innerWidth || cr.right <= 0) return null;
      const ctx = el.getContext('2d');
      if (!ctx) return null;
      const d = ctx.getImageData(0, 0, el.width, el.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) return false;
      return true;
    } catch (e) { return null; }
  };
  const addImg = (el, kind) => {
    const r = el.getBoundingClientRect();
    if ((!vis(el) || r.width < 3 || r.height < 3) && !unrenderedEmbed(el)) return;
    const alt = el.hasAttribute('alt') ? el.getAttribute('alt') : null;
    const fig = el.closest('figure');
    const link = el.closest('a[href],button');
    images.push({
      xpath: X(el), kind, tag: el.tagName.toLowerCase(), alt, role: el.getAttribute('role'),
      ariaHidden: !!el.closest('[aria-hidden="true"]'), presentational: /^(presentation|none)$/.test(el.getAttribute('role') || ''),
      src: (el.currentSrc || el.getAttribute('src') || el.getAttribute('data') || (kind === 'css-background' ? getComputedStyle(el).backgroundImage : '') || '').slice(0, 200),
      title: el.getAttribute('title'), svgTitle: el.tagName.toLowerCase() === 'svg' && el.querySelector('title') ? txt(el.querySelector('title')) : null,
      caption: fig && fig.querySelector('figcaption') ? txt(fig.querySelector('figcaption')).slice(0, 200) : null,
      inControl: link ? { tag: link.tagName.toLowerCase(), text: txt(link).slice(0, 120) } : null,
      nearbyText: txt(el.parentElement).slice(0, 200),
      box: box(el),
      blankCanvas: el.tagName === 'CANVAS' ? canvasBlank(el) : undefined,
    });
  };
  for (const el of deepAll('img,input[type="image"],[role="img"],object,area,canvas')) addImg(el, el.tagName.toLowerCase() === 'input' ? 'image-button' : 'image');
  for (const el of deepAll('svg')) { if (el.parentElement && el.parentElement.closest('svg')) continue; if (el.getAttribute('role') === 'img' || el.getBoundingClientRect().width >= 16) addImg(el, 'svg'); }
  // time-based media: 1.1.1 asks at least for descriptive identification
  for (const el of deepAll('video,audio')) addImg(el, 'media');
  // a box painted by a CSS background image and holding no text of its own: it may carry information that has
  // no text alternative (a price rendered as an image, a required marker drawn as a background)
  for (const el of deepAll('*')) {
    const s = getComputedStyle(el);
    if (!/url\(/.test(s.backgroundImage) || txt(el) || el.querySelector('img,svg')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    addImg(el, 'css-background');
    if (images.length >= CAP.images) { capped = true; break; }
  }
  // image-map areas have no box of their own; their alt is the hotspot's link text
  for (const ar of document.querySelectorAll('map area[href]')) {
    const mapName = ar.parentElement && ar.parentElement.getAttribute('name');
    const img = mapName ? document.querySelector(`img[usemap="#${CSS.escape(mapName)}"]`) : null;
    if (!img || !vis(img)) continue;
    const b = box(img);
    images.push({ xpath: X(ar), kind: 'image-map-area', tag: 'area', alt: ar.getAttribute('alt'), role: null, ariaHidden: false, presentational: false, src: ar.getAttribute('href'), title: ar.getAttribute('title'), svgTitle: null, caption: null, inControl: null, nearbyText: `shape=${ar.getAttribute('shape') || 'rect'} coords=${ar.getAttribute('coords') || ''}`, box: b });
  }
  // text drawn with look-alike glyphs from another script inside one word (renders as a word, reads as garbage)
  const lookalikes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t && lookalikes.length < 20; t = walker.nextNode()) {
    for (const w of t.textContent.split(/\s+/)) {
      if (w.length < 2 || !/\p{Script=Latin}/u.test(w)) continue;
      if (/[\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Armenian}\p{Script=Cherokee}]/u.test(w) && t.parentElement && vis(t.parentElement)) {
        lookalikes.push({ xpath: X(t.parentElement), word: w, codepoints: [...w].map((ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ') });
        break;
      }
    }
  }
  return { links, texts, images: images.slice(0, CAP.images), lookalikes, docHeight: document.documentElement.scrollHeight, capped };
}

// the most frequent colour in a box (the background the text sits on) and the colour farthest from it (the glyphs)
function colours(img, r) {
  const c = png.crop(img, r);
  const counts = new Map();
  for (let i = 0; i < c.data.length; i += 4) { const k = ((c.data[i] >> 3) << 10) | ((c.data[i + 1] >> 3) << 5) | (c.data[i + 2] >> 3); counts.set(k, (counts.get(k) || 0) + 1); }
  let top = 0, n = 0;
  for (const [k, v] of counts) if (v > n) { n = v; top = k; }
  const mode = [((top >> 10) & 31) * 8 + 4, ((top >> 5) & 31) * 8 + 4, (top & 31) * 8 + 4];
  return { mode, dominance: +(n / (c.data.length / 4)).toFixed(2), distinct: counts.size };
}

const empty = () => ({ links: [], texts: [], images: [], lookalikes: [], stepsTaken: 0 });

async function run({ session, deadline, partial }) {
  return session.withFreshPage(async (page) => {
    await loadLazyContent(page);
    const inv = await page.evaluate(inventory);
    Object.assign(partial, { links: inv.links, texts: inv.texts, images: inv.images, lookalikes: inv.lookalikes });
    const vp = page.viewport();
    const steps = Math.min(STEP_LIMIT, Math.ceil(inv.docHeight / vp.height));
    const inStep = (b, y) => b.y >= y && b.y + Math.min(b.h, vp.height) <= y + vp.height;
    // a page longer than the steps, or an inventory that hit a cap, is not wholly measured
    let truncated = inv.docHeight > STEP_LIMIT * vp.height || !!inv.capped;
    // photograph the viewport scrolled to y and measure everything wholly inside it not yet measured
    const measureAt = async (y) => {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await new Promise((r) => setTimeout(r, 150));
      const sy = await page.evaluate(() => scrollY);
      const img = png.decode(await page.screenshot({ type: 'png', encoding: 'base64', captureBeyondViewport: false }));
      const local = (b) => ({ x: b.x, y: b.y - sy, w: Math.min(b.w, vp.width - b.x), h: b.h });
      for (const t of inv.texts) {
        if (t.pixels || !inStep(t.box, sy)) continue;
        const c = colours(img, local(t.box));
        t.pixels = c;
        const d = Math.hypot(c.mode[0] - t.bg[0], c.mode[1] - t.bg[1], c.mode[2] - t.bg[2]);
        t.renderedBackgroundAgrees = d <= 40;
        t.ratio = +contrastRatio(t.fg, t.bg).toFixed(2);
        t.threshold = t.large ? 3 : 4.5;
        // keep pixels only for text the rules cannot settle or that fails: the judge needs to see it
        if (t.complex.length || !t.renderedBackgroundAgrees || t.ratio < t.threshold + 0.5) {
          const b = local(t.box);
          t.image = png.cropBase64(img, { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), w: Math.min(700, b.w + 12), h: Math.min(240, b.h + 12) });
        }
      }
      for (const im of inv.images) {
        if (im.image || !inStep(im.box, sy)) continue;
        const b = local(im.box);
        const crop = { x: Math.max(0, b.x - 4), y: Math.max(0, b.y - 4), w: Math.min(600, b.w + 8), h: Math.min(420, b.h + 8) };
        im.image = png.cropBase64(img, crop);
      }
    };
    for (let i = 0; i < steps; i++) {
      if (deadline.remaining() < 30000) { truncated = true; break; }
      await measureAt(i * vp.height);
    }
    // an element straddling two steps is wholly inside neither: scroll to each one still unmeasured (with its
    // neighbours in the same view) — without this it would silently go unmeasured
    const gaveUp = new Set();
    const pending = () => [...inv.texts.filter((t) => !t.pixels), ...inv.images.filter((im) => !im.image)].filter((x) => !gaveUp.has(x) && x.box && x.box.h > 0 && x.box.x < vp.width && x.box.y + x.box.h > 0).sort((a, b) => a.box.y - b.box.y);
    for (let left = pending(), guard = 0; left.length && guard < 400; left = pending(), guard++) {
      if (truncated || deadline.remaining() < 30000) { truncated = true; break; }
      const before = left.length;
      await measureAt(Math.max(0, left[0].box.y - 100));
      // still not measurable there (it scrolls with the page differently than its box says): recorded, not retried
      if (pending().length === before) { left[0].unmeasured = 'not wholly inside the viewport at its own scroll position'; gaveUp.add(left[0]); }
    }
    return { completeness: truncated ? 'truncated' : 'complete', links: inv.links, texts: inv.texts, images: inv.images, lookalikes: inv.lookalikes, stepsTaken: steps };
  });
}

module.exports = { run, empty };
