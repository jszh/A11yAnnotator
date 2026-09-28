'use strict';
// STYLES probe — how the page distinguishes things visually, per state (1.4.1 Use of Color).
//
//   links in text   — each link inside running text: its colour vs the surrounding text colour (contrast ratio),
//                     and every non-colour cue at rest, on hover (real pointer) and on focus;
//   state peers     — sets of sibling items where one is in a different state (aria-selected / aria-current /
//                     aria-pressed / aria-checked, or an active/selected/current class): which computed
//                     properties differ between the "on" item and an "off" peer, split into colour and
//                     non-colour properties, and the contrast between the differing colours; crops of both;
//   graphics        — charts, diagrams and other large images/SVG/canvas (crops, for the judge).
const png = require('../lib/png.js');
const v3 = require('../lib/v3.js');

function findLinksInText() {
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const out = [];
  for (const a of document.querySelectorAll('a[href],[role="link"]')) {
    if (!vis(a)) continue;
    // a link set inline in running text: the link itself is inline, and its nearest block-level ancestor holds
    // text outside the link on the same lines
    if (!/^inline/.test(getComputedStyle(a).display) || getComputedStyle(a).display === 'inline-flex') continue;
    let block = a.parentElement;
    while (block && /^(inline|contents)/.test(getComputedStyle(block).display)) block = block.parentElement;
    if (!block || block === document.body) continue;
    let other = '';
    const walk = (n) => { for (const c of n.childNodes) { if (c === a) continue; if (c.nodeType === 3) other += c.textContent; else if (c.nodeType === 1 && /^inline/.test(getComputedStyle(c).display) && !c.matches('a,[role="link"],button,script,style')) walk(c); } };
    walk(block);
    if (other.replace(/\s+/g, '').length < 12) continue;
    // the colour of the text around the link: an inline ancestor carrying the text, else the block
    let textEl = a.parentElement;
    while (textEl !== block && ![...textEl.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) textEl = textEl.parentElement;
    out.push({ xpath: window.__ia.xpathOf(a), textXpath: window.__ia.xpathOf(textEl), text: (a.innerText || '').trim().slice(0, 60) });
    if (out.length >= 200) break;
  }
  return out;
}

function linkCues(xp, textXp) {
  const a = window.__ia.resolve(xp), t = window.__ia.resolve(textXp);
  if (!a || !t) return null;
  const s = getComputedStyle(a), ts = getComputedStyle(t);
  const before = getComputedStyle(a, '::before'), after = getComputedStyle(a, '::after');
  const deco = s.textDecorationLine;
  return {
    color: s.color, textColor: ts.color,
    underline: /underline/.test(deco) && s.textDecorationColor !== 'rgba(0, 0, 0, 0)' ? `${s.textDecorationStyle} ${s.textDecorationThickness}` : null,
    borderBottom: parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none' && s.borderBottomColor !== 'rgba(0, 0, 0, 0)' ? `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor}` : null,
    fontWeight: s.fontWeight !== ts.fontWeight ? `${s.fontWeight} vs text ${ts.fontWeight}` : null,
    fontStyle: s.fontStyle !== ts.fontStyle ? `${s.fontStyle} vs text ${ts.fontStyle}` : null,
    fontFamily: s.fontFamily !== ts.fontFamily ? 'differs' : null,
    background: s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== ts.backgroundColor ? s.backgroundColor : null,
    outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}` : null,
    boxShadow: s.boxShadow !== 'none' ? s.boxShadow : null,
    pseudoContent: [before.content, after.content].filter((c) => c && c !== 'none' && c !== 'normal' && c !== '""').join(' ') || null,
    icon: a.querySelector('svg,img,i[class*="icon"]') ? 'contains an icon/image' : null,
  };
}

// state peers: groups of siblings where one item is "on"
function findStatePeers() {
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const ON_ATTR = '[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-pressed="true"],[aria-checked="true"]';
  const ON_CLASS = /(^|[\s_-])(active|selected|current|is-active|is-selected|is-current|on|checked)($|[\s_-])/i;
  const stripOn = (c) => String(c || '').split(/\s+/).filter((t) => !ON_CLASS.test(t)).sort().join(' ');
  const groups = [];
  const seen = new Set();
  const consider = (on, how) => {
    if (seen.has(on) || !vis(on)) return;
    const parent = on.parentElement;
    if (!parent) return;
    // peers: siblings with the same tag (or the same tag one level down, for li>a lists)
    let peers = [...parent.children].filter((c) => c !== on && c.tagName === on.tagName && vis(c));
    let unit = on;
    if (!peers.length && parent.parentElement) {
      const up = [...parent.parentElement.children].filter((c) => c !== parent && c.tagName === parent.tagName);
      peers = up.map((u) => u.querySelector(on.tagName.toLowerCase())).filter((c) => c && vis(c));
      unit = on;
    }
    const off = peers.find((p) => !p.matches(ON_ATTR) && !ON_CLASS.test(p.className && p.className.baseVal !== undefined ? p.className.baseVal : p.className) && stripOn(p.className && p.className.baseVal !== undefined ? p.className.baseVal : p.className) === stripOn(on.className && on.className.baseVal !== undefined ? on.className.baseVal : on.className)) || peers.find((p) => !p.matches(ON_ATTR));
    if (!off) return;
    seen.add(on);
    groups.push({ on: X(unit), off: X(off), how, peers: peers.length + 1, parent: X(parent), text: (on.innerText || on.getAttribute('aria-label') || '').trim().slice(0, 40) });
  };
  for (const el of document.querySelectorAll(ON_ATTR)) consider(el, 'aria');
  for (const el of document.body.querySelectorAll('[class]')) {
    const cn = el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
    if (typeof cn === 'string' && ON_CLASS.test(cn)) consider(el, 'class');
    if (groups.length >= 40) break;
  }
  return groups;
}

function styleDiff(onXp, offXp) {
  const on = window.__ia.resolve(onXp), off = window.__ia.resolve(offXp);
  if (!on || !off) return null;
  const COLOR = ['color', 'background-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'outline-color', 'fill', 'stroke', 'text-decoration-color'];
  const SHAPE = ['font-weight', 'font-style', 'text-decoration-line', 'text-decoration-style', 'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width', 'border-top-style', 'border-bottom-style', 'outline-style', 'outline-width', 'box-shadow', 'width', 'height', 'transform', 'font-size', 'opacity', 'background-image', 'list-style-type'];
  const diff = (a, b, pre) => {
    const c = {}, n = {};
    const sa = getComputedStyle(a, pre), sb = getComputedStyle(b, pre);
    for (const p of COLOR) if (sa.getPropertyValue(p) !== sb.getPropertyValue(p)) c[p] = { on: sa.getPropertyValue(p), off: sb.getPropertyValue(p) };
    for (const p of SHAPE) if (sa.getPropertyValue(p) !== sb.getPropertyValue(p)) n[p] = { on: sa.getPropertyValue(p), off: sb.getPropertyValue(p) };
    if (pre && sa.content !== sb.content) n.content = { on: sa.content, off: sb.content };
    return { colour: c, other: n };
  };
  const main = diff(on, off, null);
  const b = diff(on, off, '::before'), a = diff(on, off, '::after');
  // a text or icon difference is a non-colour cue
  const textOn = (on.innerText || '').trim(), textOff = (off.innerText || '').trim();
  const r1 = on.getBoundingClientRect(), r2 = off.getBoundingClientRect();
  return {
    colour: main.colour, other: main.other,
    before: (Object.keys(b.colour).length || Object.keys(b.other).length) ? b : null,
    after: (Object.keys(a.colour).length || Object.keys(a.other).length) ? a : null,
    iconDiffers: (on.querySelectorAll('svg,img').length !== off.querySelectorAll('svg,img').length),
    sizeOn: { w: Math.round(r1.width), h: Math.round(r1.height) }, sizeOff: { w: Math.round(r2.width), h: Math.round(r2.height) },
    textOn: textOn.slice(0, 40), textOff: textOff.slice(0, 40),
  };
}

// form labels that differ from the other labels in the same form only by colour (text or ::before/::after
// colour) — a required/error/optional state shown by colour alone. Each distinct look is compared with the
// most common one.
function findLabelColourGroups() {
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const text = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim();
  const sig = (el) => {
    const s = getComputedStyle(el), b = getComputedStyle(el, '::before'), a = getComputedStyle(el, '::after');
    const shape = [s.fontWeight, s.fontStyle, s.textDecorationLine, s.fontSize, b.content, a.content, b.fontWeight, a.fontWeight].join('|');
    const colour = [s.color, b.content !== 'none' ? b.color : '', a.content !== 'none' ? a.color : ''].join('|');
    return { shape, colour };
  };
  const out = [];
  const scopes = [...document.querySelectorAll('form,fieldset')];
  if (!scopes.length) scopes.push(document.body);
  for (const scope of scopes) {
    const labels = [...scope.querySelectorAll('label,legend')].filter(vis).filter((l) => text(l));
    if (labels.length < 2) continue;
    const groups = new Map();
    for (const l of labels) { const g = sig(l); const k = g.shape + '#' + g.colour; if (!groups.has(k)) groups.set(k, { ...g, members: [] }); groups.get(k).members.push(l); }
    const list = [...groups.values()].sort((x, y) => y.members.length - x.members.length);
    const base = list[0];
    for (const g of list.slice(1)) {
      if (g.shape !== base.shape || g.colour === base.colour) continue;
      const on = g.members[0], off = base.members[0];
      const field = (l) => (l.control || (l.htmlFor && document.getElementById(l.htmlFor)) || l.querySelector('input,select,textarea'));
      const f = field(on);
      out.push({ on: X(on), off: X(off), how: 'label-colour-group', peers: labels.length, parent: X(scope), text: text(on).slice(0, 40), optionalLabel: text(off).slice(0, 40),
        groupSize: g.members.length, baseSize: base.members.length,
        requiredMarkedInText: g.members.every((l) => /\*|required|mandatory|\(req/i.test(text(l)) || !!l.querySelector('abbr')),
        fieldRequired: !!(f && (f.required || f.getAttribute('aria-required') === 'true')), fieldInvalid: !!(f && f.getAttribute('aria-invalid') === 'true') });
    }
  }
  return out.slice(0, 20);
}

// siblings drawn identically except for colour, with no text telling them apart (status dots, category chips):
// information carried by hue alone
function findColourCodedSiblings() {
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const COLOR = ['color', 'background-color', 'border-top-color', 'fill'];
  const SHAPE = ['width', 'height', 'border-top-width', 'border-top-style', 'font-weight', 'text-decoration-line', 'border-radius', 'background-image'];
  const out = [];
  const byParent = new Map();
  for (const el of document.body.querySelectorAll('span,i,div,li,td,svg,circle,rect')) {
    if (!vis(el) || el.children.length > 1) continue;
    const r = el.getBoundingClientRect(); if (r.width > 120 || r.height > 60) continue;
    // group items that play the same part in repeated rows: same tag and class under the same grandparent
    const gp = el.parentElement && el.parentElement.parentElement;
    const cls = String((el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '').split(/\s+/)[0];
    const k = gp ? X(gp) + '|' + el.tagName + '|' + cls : null;
    if (!k) continue;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(el);
  }
  for (const els of byParent.values()) {
    if (els.length < 2) continue;
    const sig = (e, props, pre) => props.map((p) => getComputedStyle(e, pre).getPropertyValue(p)).join('|');
    const shapes = new Set(els.map((e) => sig(e, SHAPE) + '#' + sig(e, SHAPE, '::before')));
    const colours = new Set(els.map((e) => sig(e, COLOR) + '#' + sig(e, COLOR, '::before')));
    const texts = new Set(els.map((e) => (e.textContent || '').trim()));
    if (shapes.size === 1 && colours.size > 1 && (texts.size === 1)) {
      const a = els[0], b = els.find((e) => sig(e, COLOR) + '#' + sig(e, COLOR, '::before') !== sig(a, COLOR) + '#' + sig(a, COLOR, '::before'));
      out.push({ on: X(a), off: X(b), how: 'colour-coded-siblings', peers: els.length, parent: X(a.parentElement), text: (a.textContent || '').trim().slice(0, 40) });
    }
    if (out.length >= 15) break;
  }
  return out;
}

function findGraphics() {
  const out = [];
  for (const el of document.querySelectorAll('svg,canvas,img,[role="img"],object')) {
    let v = false; try { v = el.checkVisibility({ visibilityProperty: true, opacityProperty: true }); } catch (e) { v = false; }
    const r = el.getBoundingClientRect();
    if (!v || r.width < 150 || r.height < 100) continue;
    if (el.parentElement && el.parentElement.closest('svg')) continue;
    const label = (el.getAttribute('alt') || el.getAttribute('aria-label') || (el.querySelector && el.querySelector('title') ? el.querySelector('title').textContent : '') || '').trim();
    const chartish = el.tagName === 'CANVAS' || el.tagName.toLowerCase() === 'svg' || /chart|graph|map|diagram|legend|plot|figure|infographic/i.test(label + ' ' + (el.getAttribute('src') || '') + ' ' + (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || ''));
    if (!chartish) continue;
    out.push({ xpath: window.__ia.xpathOf(el), tag: el.tagName.toLowerCase(), label: label.slice(0, 120), box: { w: Math.round(r.width), h: Math.round(r.height) } });
    if (out.length >= 20) break;
  }
  return out;
}

async function viewportShot(page) { return png.decode(await page.screenshot({ type: 'png', encoding: 'base64', captureBeyondViewport: false })); }

async function cropOf(page, xps, pad = 8) {
  const box = await page.evaluate((xs) => {
    const els = xs.map((x) => window.__ia.resolve(x)).filter(Boolean);
    if (!els.length) return null;
    els[0].scrollIntoView({ block: 'center' });
    const rs = els.map((e) => e.getBoundingClientRect());
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top));
    return { x, y, w: Math.max(...rs.map((r) => r.right)) - x, h: Math.max(...rs.map((r) => r.bottom)) - y };
  }, xps);
  if (!box) return null;
  const vp = page.viewport();
  const c = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad) };
  c.w = Math.min(vp.width, box.x + box.w + pad) - c.x; c.h = Math.min(vp.height, box.y + box.h + pad) - c.y;
  if (c.w < 2 || c.h < 2) return null;
  if (c.w > 900) c.w = 900;
  if (c.h > 600) c.h = 600;
  return png.cropBase64(await viewportShot(page), c);
}

function ratio(a, b) {
  const p = v3.parseRGB(a), q = v3.parseRGB(b);
  if (!p || !q || p.a < 1 || q.a < 1) return null;
  return +v3.contrastRatio([p.r, p.g, p.b], [q.r, q.g, q.b]).toFixed(2);
}

const empty = () => ({ links: [], peers: [], graphics: [] });

async function run({ session, deadline, partial }) {
  return session.withFreshPage(async (page) => {
    const res = partial;
    // links in running text: rest, hover, focus
    for (const l of await page.evaluate(findLinksInText)) {
      if (deadline.remaining() < 60000) { res.truncated = true; break; }
      const rest = await page.evaluate(linkCues, l.xpath, l.textXpath);
      if (!rest) continue;
      const pt = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); el.scrollIntoView({ block: 'center' }); const r = el.getClientRects()[0] || el.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 20), y: r.top + r.height / 2 }; }, l.xpath);
      await page.mouse.move(pt.x, pt.y);
      await new Promise((r) => setTimeout(r, 60));
      const hover = await page.evaluate(linkCues, l.xpath, l.textXpath);
      await page.mouse.move(1, 1);
      await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (el && el.focus) el.focus(); }, l.xpath);
      await new Promise((r) => setTimeout(r, 60));
      const focus = await page.evaluate(linkCues, l.xpath, l.textXpath);
      await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
      const cuesAt = (c) => c && Object.entries(c).filter(([k, v]) => v && !['color', 'textColor'].includes(k)).map(([k, v]) => `${k}: ${v}`);
      res.links.push({ ...l, linkColour: rest.color, textColour: rest.textColor, contrastWithText: ratio(rest.color, rest.textColor), cuesAtRest: cuesAt(rest), cuesOnHover: cuesAt(hover), cuesOnFocus: cuesAt(focus) });
    }
    // state peers
    for (const g of [...await page.evaluate(findStatePeers), ...await page.evaluate(findLabelColourGroups), ...await page.evaluate(findColourCodedSiblings)]) {
      if (deadline.remaining() < 45000) { res.truncated = true; break; }
      const d = await page.evaluate(styleDiff, g.on, g.off);
      if (!d) continue;
      const colourRatios = {};
      for (const [p, v] of Object.entries(d.colour)) { const r = ratio(v.on, v.off); if (r !== null) colourRatios[p] = r; }
      const image = await cropOf(page, [g.on, g.off]).catch(() => null);
      res.peers.push({ ...g, diff: d, colourRatios, image });
    }
    // graphics
    for (const gr of await page.evaluate(findGraphics)) {
      if (deadline.remaining() < 40000) { res.truncated = true; break; }
      res.graphics.push({ ...gr, image: await cropOf(page, [gr.xpath], 4).catch(() => null) });
    }
    return { completeness: res.truncated ? 'truncated' : 'complete', ...res };
  });
}

module.exports = { run, empty };
