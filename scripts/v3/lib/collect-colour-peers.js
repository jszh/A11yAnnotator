'use strict';
// SC 1.4.1 Use of Color — COLOUR PEER GROUPS (residual RCA S6).
//
// 1.4.1's aperture is role-based: link, form field, graphic surface. That misses the criterion's other main
// shape entirely — a SET of peer elements where colour is the only thing telling them apart (schedule tiles
// coded by track, menu items coded by spice level, status pills, calendar categories). No individual element
// looks wrong; the failure lives in the CONTRAST BETWEEN PEERS, so no element-level predicate can see it.
//
// The test, per G14 ("information conveyed by color differences is also available in text") and G182
// ("additional visual cues are available when text color differences are used to convey information"):
// among elements that are peers by structure, do the USED colours differ while every NON-colour axis stays
// identical? If two tiles differ in colour AND in weight, or one carries an icon the other lacks, the
// distinction survives without colour and there is nothing to report.
//
// Deliberately does NOT decide anything. It nominates groups; the rubric judges whether the colour is
// carrying information at all (a purely aesthetic palette is not a 1.4.1 failure) and whether a text
// equivalent exists elsewhere.
//
// TEXT-LESS COLOUR-TOKEN LANE (residual RCA s10 Tier 3) — DISABLED BY DEFAULT. A status-dot matrix (empty
// spans coloured by class) can never form a peer group above: members must carry >= 2 chars of text and share
// ONE parent, and a matrix's dots are text-less and live in different cells. The token lane buckets text-less,
// background-painting elements by (tag, class token) ACROSS parents, and emits a group only when ALL of:
//   1. >= 3 instances;  2. >= 2 distinct background colours;  3. >= 2 distinct parents;
//   4. at least one instance of the same class signature sits inside a legend-like element that DOES carry
//      text (its immediate parent has its own non-empty text — the labelled-key shape). This conjunct is what
//      stops avatars / spacers / decorative bullets from flooding: a token class that never appears next to
//      text anywhere has no legend and mints nothing.
// Token groups ride the existing payload shape with an ADDITIVE `tokenLane: true` marker + `legendText`.
//
// GATING / WIRING. The lane runs ONLY when the caller passes `{ tokenLane: true }` as the evaluate
// argument. (A former in-page window-global escape hatch is deliberately GONE: a global the page itself
// can set is page-controlled activation of a quarantined lane — batch-2 soundness review.) Production
// wiring is env-flagged:
// act-page-collect.js must thread `{ tokenLane: process.env.V3_COLOUR_TOKEN_LANE === '1' }` as the evaluate
// argument (see HUNKS-colour-token-lane.md) — the flag defaults OFF, and per the RCA the lane may not affect
// any run until the held-out aperture measurement (scripts/v3/tools/measure-colour-token-aperture.js) has
// been reviewed. With the flag off (or no argument at all — every current call site), the output is
// byte-identical to the pre-lane collector.
//
// Self-contained so it serializes through page.evaluate (`opts` must be a plain serializable object).
function collectColourPeers(opts) {
  const MAX_GROUPS = 8;
  const MAX_MEMBERS = 12;
  // token lane flag — read from the evaluate argument ONLY (Node-side env is the CALLER's business).
  // Default hard OFF. Never read from `window`: page content can set a window global, and a quarantined
  // lane must not be activatable by the page under measurement.
  const tokenLane = !!(opts && opts.tokenLane === true);
  const MAX_TOKEN_INSTANCES = 48;   // per bucket — a matrix column can be long; the listing is capped later
  const MAX_TOKEN_BUCKETS = 128;    // per page — bound the class-token fan-out on pathological pages
  // Never candidates: images (judged by the element-level lane), and anything inside a code/pre block —
  // syntax highlighting is the classic false positive and is not conveying page information.
  const SKIP_TAG = /^(img|svg|canvas|script|style|pre|code|kbd|samp|br|hr|option)$/;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const visible = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Direct text nodes first (the peer's own label), falling back to descendant text. The fallback matters:
  // a schedule tile's title lives in a child `<h3>`, so an own-text-only reading called it empty and dropped
  // the whole colour-coded grid — the exact shape this detector exists for.
  const ownText = (e) => {
    let t = ''; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent;
    t = t.replace(/\s+/g, ' ').trim();
    return t || (e.textContent || '').replace(/\s+/g, ' ').trim();
  };

  // Bucket by (tag, role, parent) — the structural definition of "peer".
  const buckets = new Map();
  const tokenBuckets = tokenLane ? new Map() : null; // (tag, class token) → text-less painted instances, cross-parent
  for (const el of document.querySelectorAll('body *')) {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAG.test(tag)) continue;
    if (el.closest('pre, code')) continue;
    if (!el.parentElement) continue;
    if (!visible(el)) continue;
    // TOKEN LANE COLLECTION (flag-gated; zero cost when off). An instance is a class-carrying element with
    // no visible text of its own (< 2 chars — exactly the members the main lane's label gate drops), which
    // PAINTS its own background (a transparent token is a spacer, not a colour code) and has a real box
    // (>= 4px both dims — hairlines and collapsed layout artifacts are not visual tokens). Bucketed per
    // individual class token, because colour-variant classes (a base class plus a per-colour modifier) would
    // make the FULL class list split every colour into its own bucket and hide the very set being looked for.
    if (tokenLane) {
      const classAttr = (el.getAttribute('class') || '').trim();
      if (classAttr && ownText(el).length < 2) {
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          const r = el.getBoundingClientRect();
          if (r.width >= 4 && r.height >= 4) {
            const inst = {
              xpath: xpathOf(el),
              parentEl: el.parentElement,
              parentXp: xpathOf(el.parentElement),
              ariaLabel: (el.getAttribute('aria-label') || '').slice(0, 40),
              color: cs.color,
              background: bg,
              borderStyle: cs.borderTopStyle + '/' + cs.borderTopWidth,
              marker: (el.querySelector('img, svg, [role="img"]') ? 'child' : '')
                + ((getComputedStyle(el, '::before').content || 'none') !== 'none' ? '+before' : '')
                + ((getComputedStyle(el, '::after').content || 'none') !== 'none' ? '+after' : ''),
            };
            for (const cls of classAttr.split(/\s+/).slice(0, 6)) {
              const tk = tag + '|.' + cls;
              if (!tokenBuckets.has(tk)) { if (tokenBuckets.size >= MAX_TOKEN_BUCKETS) continue; tokenBuckets.set(tk, []); }
              const tb = tokenBuckets.get(tk);
              if (tb.length < MAX_TOKEN_INSTANCES) tb.push(inst);
            }
          }
        }
      }
    }
    const key = tag + '|' + (el.getAttribute('role') || '') + '|' + xpathOf(el.parentElement);
    if (!buckets.has(key)) buckets.set(key, []);
    const b = buckets.get(key);
    if (b.length < MAX_MEMBERS) b.push(el);
  }

  const groups = [];
  for (const [key, members] of buckets) {
    if (members.length < 2 || groups.length >= MAX_GROUPS) continue;
    const facts = members.map((el) => {
      const cs = getComputedStyle(el);
      return {
        el,
        xpath: xpathOf(el),
        label: ownText(el).slice(0, 40) || (el.getAttribute('aria-label') || '').slice(0, 40),
        color: cs.color,
        background: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        // NON-colour axes. If peers differ on ANY of these, the distinction already survives colour loss.
        weight: cs.fontWeight,
        style: cs.fontStyle,
        decoration: (cs.textDecorationLine || '').trim(),
        size: cs.fontSize,
        borderStyle: cs.borderTopStyle + '/' + cs.borderTopWidth,
        // an icon, marker, or generated-content glyph the peer might carry instead of colour
        marker: (el.querySelector('img, svg, [role="img"]') ? 'child' : '')
          + ((getComputedStyle(el, '::before').content || 'none') !== 'none' ? '+before' : '')
          + ((getComputedStyle(el, '::after').content || 'none') !== 'none' ? '+after' : ''),
      };
    });
    const distinct = (f) => new Set(facts.map(f));
    // Every member must carry its own TEXT. A colour difference across empty peers is a swatch row, a chart
    // key, or decorative banding — there is no labelled content for the colour to be the only cue TO. This
    // one condition removed the long tail of 2-member `<span>` groups the first sweep produced.
    if (!facts.every((x) => x.label && x.label.length >= 2)) continue;
    const colourAxes = distinct((x) => x.color + '|' + x.background + '|' + x.borderColor);
    if (colourAxes.size < 2) continue;                                   // colour-uniform group — nothing to report
    // Any non-colour difference ⇒ the distinction is available without colour ⇒ NOT a 1.4.1 candidate.
    const nonColourDiffers = distinct((x) => x.weight).size > 1 || distinct((x) => x.style).size > 1
      || distinct((x) => x.decoration).size > 1 || distinct((x) => x.size).size > 1
      || distinct((x) => x.borderStyle).size > 1 || distinct((x) => x.marker).size > 1;
    if (nonColourDiffers) continue;
    // ZEBRA STRIPING: a background that alternates strictly with row parity across 4+ peers is decorative
    // banding, not a category code. Checked before reporting because it is the commonest benign 2-colour set.
    if (facts.length >= 4) {
      const evenBg = new Set(facts.filter((_, i) => i % 2 === 0).map((x) => x.background));
      const oddBg = new Set(facts.filter((_, i) => i % 2 === 1).map((x) => x.background));
      const sameText = distinct((x) => x.color).size === 1;
      if (sameText && evenBg.size === 1 && oddBg.size === 1 && [...evenBg][0] !== [...oddBg][0]) continue;
    }
    // ANCHOR ELIGIBILITY (residual RCA S10). Downstream, members[0] IS the group's subject: the obligation
    // mints on members[0].xpath (build-v3.js) and the judge's group evidence threads onto the subject with
    // that xpath (llm-adjudicator.js). In a bucketed row the DOM-first member is often the one member that
    // carries NO distinguishing colour — a plain lead cell in an otherwise colour-coded set — which anchored
    // every group verdict on a colourless element while the coded members sat unjudged. So order the members
    // so the FIRST one carries a distinguishing colour. Colour-uniform members STAY in the listing (the judge
    // needs the full set for comparison); only the order changes.
    //   "Carries a distinguishing colour", decided in two stages:
    //   1. background channel — when SOME members paint their own background (neither transparent nor the
    //      shared surface colour behind the group) and some do not, the painters carry the distinction and a
    //      background-uniform member never anchors;
    //   2. otherwise, modal signature — with one STRICTLY most-common colour signature, the members off the
    //      modal carry the distinction; all-distinct or tied signatures mean no member is "the uniform one"
    //      and the original DOM order stands.
    let surface = '';
    for (let p = members[0].parentElement; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') { surface = bg; break; }
    }
    const sigOf = (x) => x.color + '|' + x.background + '|' + x.borderColor;
    const paintsOwn = (x) => x.background !== 'transparent' && x.background !== 'rgba(0, 0, 0, 0)' && x.background !== surface;
    let carries;
    if (facts.some(paintsOwn) && !facts.every(paintsOwn)) {
      carries = facts.map(paintsOwn);
    } else {
      const counts = new Map();
      for (const x of facts) counts.set(sigOf(x), (counts.get(sigOf(x)) || 0) + 1);
      let modal = null, best = 0, tied = false;
      for (const [s, c] of counts) { if (c > best) { modal = s; best = c; tied = false; } else if (c === best) tied = true; }
      carries = tied ? facts.map(() => true) : facts.map((x) => sigOf(x) !== modal);
    }
    const anchorIdx = Math.max(0, carries.indexOf(true));
    const ordered = anchorIdx === 0 ? facts : [facts[anchorIdx]].concat(facts.slice(0, anchorIdx), facts.slice(anchorIdx + 1));
    groups.push({
      key,
      distinctColours: colourAxes.size,
      anchorCarriesColour: carries[anchorIdx] === true,
      members: ordered.map((x) => ({ xpath: x.xpath, label: x.label, color: x.color, background: x.background })),
    });
  }

  // ── TOKEN-LANE EMISSION (flag-gated) ──────────────────────────────────────────────────────────────────
  if (tokenLane && tokenBuckets) {
    const collapse = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const emittedSets = new Set(); // two class tokens shared by the same instances must not emit twice
    for (const [tkey, insts] of tokenBuckets) {
      if (groups.length >= MAX_GROUPS) break;
      if (insts.length < 3) continue;                                        // conjunct 1: >= 3 instances
      const bgSet = new Set(insts.map((x) => x.background));
      if (bgSet.size < 2) continue;                                          // conjunct 2: >= 2 distinct backgrounds
      if (new Set(insts.map((x) => x.parentXp)).size < 2) continue;          // conjunct 3: >= 2 distinct parents
      // A non-colour axis differing across instances means the distinction already survives colour loss —
      // same rule as the main lane, on the axes a text-less token actually has.
      if (new Set(insts.map((x) => x.marker)).size > 1) continue;
      if (new Set(insts.map((x) => x.borderStyle)).size > 1) continue;
      // conjunct 4 (the legend): at least one instance whose IMMEDIATE parent carries its own text — the
      // labelled-key shape ("token, word, token, word"). A matrix cell holding only its dot has no text; a
      // page-wide container is excluded by the length ceiling. The collected text is handed to the judge.
      const legendTexts = [];
      const seenLegendParents = new Set();
      for (const x of insts) {
        const t = x.parentEl ? collapse(x.parentEl.textContent) : '';
        if (t.length >= 2 && t.length <= 200 && !seenLegendParents.has(x.parentXp)) {
          seenLegendParents.add(x.parentXp);
          legendTexts.push(t);
        }
      }
      if (!legendTexts.length) continue;
      const setSig = insts.map((x) => x.xpath).sort().join('§');
      if (emittedSets.has(setSig)) continue;
      emittedSets.add(setSig);
      // ANCHOR: same modal rule as the main lane, on the background channel — with a strictly most-common
      // background, the off-modal instances carry the distinction and one of them anchors; a tie keeps DOM order.
      const counts = new Map();
      for (const x of insts) counts.set(x.background, (counts.get(x.background) || 0) + 1);
      let modal = null, best = 0, tied = false;
      for (const [b, c] of counts) { if (c > best) { modal = b; best = c; tied = false; } else if (c === best) tied = true; }
      const carries = tied ? insts.map(() => true) : insts.map((x) => x.background !== modal);
      const aIdx = Math.max(0, carries.indexOf(true));
      const ordered = aIdx === 0 ? insts : [insts[aIdx]].concat(insts.slice(0, aIdx), insts.slice(aIdx + 1));
      groups.push({
        key: 'token|' + tkey,
        distinctColours: bgSet.size,
        anchorCarriesColour: carries[aIdx] === true,
        tokenLane: true,                                                     // ADDITIVE marker — main-lane groups untouched
        legendText: legendTexts.join(' | ').slice(0, 120),
        members: ordered.slice(0, MAX_MEMBERS).map((x) => ({ xpath: x.xpath, label: x.ariaLabel, color: x.color, background: x.background })),
      });
    }
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 1.4.1 — FORM-FIELD RESOLVED COLOUR + STATE (residual RCA S10).
//
// WHY THIS EXISTS. A 1.4.1 form-field subject reached the judge with NO colour facts of any kind: its whole
// deterministic-signals block was a contrast stub (`computable:false`, plus the generic "the backdrop could not
// be reduced to two flat colors … judge readability from the pixels" abstention), a section heading, and the
// element's markup. Every appearance question — is this field red, is it in the error state, is its label a
// different colour from its neighbours' — therefore had exactly one source: the crops.
//
// That is not safe, because the `surrounding-region` crop is a RECTANGLE, and a rectangle around one field in a
// two-column row contains the NEIGHBOURING field's border. Measured on a passing checkout page: the crop handed
// to a plain, default-state CVC input carried the red right-hand border of the invalid expiry field beside it at
// its left edge, and the judge reported "red LEFT border … sole error indicator" on a field whose markup carries
// no error class and no aria-invalid. It was not inventing a colour; it was ATTRIBUTING a real pixel to the
// wrong element, with nothing in the prompt able to contradict it. A rubric prohibition ("do not assert a
// colour you have not seen") cannot fix that — the judge HAD seen it.
//
// So state the facts instead. Per field: its OWN resolved text/background/border-per-side/outline colours, the
// state attributes that would justify calling it "in the error state" or "required", and — because the
// discriminating fact is relational — how it compares with the other fields of the same form: which peers share
// its exact appearance, which differ, and whether those differing peers ALSO carry a non-colour cue (an
// associated message, block text, an icon). That is the peer rule the rubric already states, delivered as data
// rather than as an instruction to go and infer it.
//
// It also carries the LIGHTNESS separation between distinct label colours. G182/G183's escape — a coded set the
// page distinguishes by shade rather than hue — requires a measured ratio, and the rubric forbids the judge from
// producing one by eye. Handing the number is the only way that escape is reachable from a per-field subject.
//
// GATED so it is not a tax on every form on the web: a field group emits ONLY when the group is not
// colour-uniform — two or more distinct field appearances, or two or more distinct label colours. A form whose
// fields all render identically encodes nothing in colour, has no coded state to mistake a neighbour for, and
// gets nothing added to its prompt.
//
// DECIDES NOTHING. Whether the colour carries information, and whether a non-colour cue is present where one is
// needed, stays with the rubric.
//
// Self-contained so it serializes through page.evaluate — every helper is declared INSIDE the function body.
// (A helper shared across two separately-serialized collectors threw a ReferenceError and silently killed a
// whole lane earlier in this campaign; see the collector-liveness note in act-page-collect.js.)
function collectFieldColourState() {
  const MAX_FIELDS = 12;        // fields considered per form group
  const MAX_PEERS = 4;          // differing peers reported per field
  const MAX_RECORDS = 24;       // records per page
  const MAX_TEXT = 140;

  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    if (e === document.documentElement) return '/html';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const clip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

  // sRGB relative luminance / WCAG contrast. Present so a "one state is lighter than the other" claim is a
  // NUMBER in the prompt: the rubric forbids the judge from computing a ratio by eye, which left the G182
  // shade-key escape unreachable for a field subject that had no ratio and no tool result.
  const parseRgb = (c) => {
    const m = /rgba?\(([^)]+)\)/i.exec(String(c || ''));
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    if (p.length < 3 || p.some((x) => !isFinite(x))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && isFinite(p[3]) ? p[3] : 1 };
  };
  const lumOf = (c) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  // null (never a number) when either colour is unparseable or not fully opaque — a ratio computed through
  // alpha would be a fabricated measurement, which is the exact failure this collector exists to remove.
  const ratioOf = (x, y) => {
    const a = parseRgb(x), b = parseRgb(y);
    if (!a || !b || a.a !== 1 || b.a !== 1) return null;
    const la = lumOf(a), lb = lumOf(b);
    const hi = Math.max(la, lb), lo = Math.min(la, lb);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  };

  const visible = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // PER SIDE, always — a one-sided accent border ("red LEFT border") is a real styling idiom AND was the exact
  // shape mis-attributed from a neighbour's edge, so the four sides must be individually checkable. Collapsed
  // to one string when all four agree, which is the overwhelmingly common case and most of the byte budget.
  const sideBorders = (cs) => {
    const sides = {};
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = cs['border' + s + 'Style'];
      const w = parseFloat(cs['border' + s + 'Width']) || 0;
      sides[s.toLowerCase()] = (style === 'none' || style === 'hidden' || w === 0)
        ? 'none' : (Math.round(w * 10) / 10) + 'px ' + style + ' ' + cs['border' + s + 'Color'];
    }
    const uniform = new Set([sides.top, sides.right, sides.bottom, sides.left]).size === 1;
    return { value: uniform ? sides.top : sides, uniform };
  };
  const outlineOf = (cs) => {
    const w = parseFloat(cs.outlineWidth) || 0;
    if (!w || cs.outlineStyle === 'none') return 'none';
    return (Math.round(w * 10) / 10) + 'px ' + cs.outlineStyle + ' ' + cs.outlineColor;
  };
  const genContent = (e) => {
    const parts = [];
    for (const p of ['::before', '::after']) {
      let c = '';
      try { c = getComputedStyle(e, p).content; } catch (err) { c = ''; }
      if (c && c !== 'none' && c !== 'normal' && c !== '""' && c !== "''") parts.push(p + '=' + clip(c, 24));
    }
    return parts.length ? parts.join(' ') : null;
  };
  const hasIcon = (e) => !!(e && e.querySelector && e.querySelector('img, svg, [role="img"]'));
  const idsText = (e, attr) => {
    const v = e.getAttribute(attr);
    if (!v) return null;
    let t = '';
    for (const id of v.trim().split(/\s+/).slice(0, 4)) {
      let n = null;
      try { n = document.getElementById(id); } catch (err) { n = null; }
      if (n) t += ' ' + (n.textContent || '');
    }
    t = clip(t, MAX_TEXT);
    return t || null;
  };
  const labelOf = (e) => {
    let lab = null;
    try { if (e.labels && e.labels.length) lab = e.labels[0]; } catch (err) { lab = null; }
    if (!lab && e.id) {
      try { lab = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(e.id) : e.id) + '"]'); } catch (err) { lab = null; }
    }
    if (!lab) { try { lab = e.closest('label'); } catch (err) { lab = null; } }
    if (!lab) {
      const lb = e.getAttribute('aria-labelledby');
      if (lb) { try { lab = document.getElementById(lb.trim().split(/\s+/)[0]); } catch (err) { lab = null; } }
    }
    return lab;
  };
  const classesOf = (e) => (e && e.classList ? Array.prototype.slice.call(e.classList, 0, 6).map((c) => clip(c, 24)) : []);

  const WIDGET_ROLE = /^(textbox|combobox|searchbox|spinbutton|checkbox|radio|listbox|slider|switch)$/;
  const fields = [];
  for (const el of document.querySelectorAll('input, select, textarea, [role]')) {
    const tag = el.tagName.toLowerCase();
    const roleAttr = String(el.getAttribute('role') || '').toLowerCase();
    const isNative = (tag === 'input' && String(el.getAttribute('type') || '').toLowerCase() !== 'hidden') || tag === 'select' || tag === 'textarea';
    if (!isNative && !WIDGET_ROLE.test(roleAttr)) continue;
    if (!visible(el)) continue;
    fields.push(el);
    if (fields.length >= MAX_FIELDS * 4) break;
  }

  // Facts first, per field; the relational reading is derived from these below.
  const facts = fields.map((el) => {
    const cs = getComputedStyle(el);
    const lab = labelOf(el);
    const block = el.parentElement;
    const labCs = lab ? getComputedStyle(lab) : null;
    const labText = lab ? clip(lab.textContent, 80) : '';
    let extra = clip(block ? block.textContent : '', 400);
    if (labText) extra = clip(extra.split(labText).join(' '), MAX_TEXT);
    else extra = clip(extra, MAX_TEXT);
    let cssInvalid = false;
    try { cssInvalid = el.matches(':invalid'); } catch (err) { cssInvalid = false; }
    let form = null;
    try { form = el.closest('form'); } catch (err) { form = null; }
    const border = sideBorders(cs);
    return {
      el,
      form,
      xpath: xpathOf(el),
      label: labText || clip(el.getAttribute('aria-label') || '', 80) || null,
      color: cs.color,
      background: cs.backgroundColor,
      border: border.value,
      borderUniform: border.uniform,
      outline: outlineOf(cs),
      labelColor: labCs ? labCs.color : null,
      labelGeneratedContent: lab ? genContent(lab) : null,
      labelHasIcon: lab ? hasIcon(lab) : false,
      state: {
        ariaInvalid: el.getAttribute('aria-invalid'),
        ariaRequired: el.getAttribute('aria-required'),
        required: el.hasAttribute('required'),
        cssInvalid,
        classes: classesOf(el),
        blockClasses: classesOf(block),
      },
      cue: {
        describedByText: idsText(el, 'aria-describedby'),
        errorMessageText: idsText(el, 'aria-errormessage'),
        blockExtraText: extra || null,
        blockHasIcon: !!(block && hasIcon(block)),
      },
    };
  });

  // Appearance = the field's OWN used colours. Deliberately colour-only: two fields that differ in border
  // WIDTH or STYLE are already distinguishable without colour, and that is the rubric's business, not the
  // grouping's — grouping on it would split sets that ARE colour-coded.
  const sigOf = (f) => [f.color, f.background, JSON.stringify(f.border), f.outline].join('|');

  const byForm = new Map();
  for (const f of facts) {
    const k = f.form ? xpathOf(f.form) : 'document';
    if (!byForm.has(k)) byForm.set(k, []);
    const g = byForm.get(k);
    if (g.length < MAX_FIELDS) g.push(f);
  }

  const out = [];
  for (const [scope, group] of byForm) {
    if (group.length < 2) continue;
    const appearances = new Set(group.map(sigOf));
    const labelColours = new Set(group.map((f) => f.labelColor).filter(Boolean));
    // THE GATE. A colour-uniform field set encodes nothing in colour: there is no coded state for a
    // neighbouring pixel to be mistaken for, and no shade key to verify. Add nothing to those prompts.
    if (appearances.size < 2 && labelColours.size < 2) continue;
    for (const f of group) {
      if (out.length >= MAX_RECORDS) break;
      const mySig = sigOf(f);
      const errorStated = f.state.ariaInvalid === 'true' || !!f.cue.errorMessageText;
      const requiredStated = f.state.required === true || f.state.ariaRequired === 'true';
      const same = [], diff = [];
      for (const p of group) {
        if (p === f) continue;
        if (sigOf(p) === mySig) { if (same.length < MAX_PEERS) same.push(p.label || p.xpath); continue; }
        if (diff.length >= MAX_PEERS) continue;
        // Only what discriminates: how the peer LOOKS, whether it is STATED to be in a state, and whether it
        // carries a NON-COLOUR cue. Fields identical to `f` are already covered by `sameAppearanceAs` and are
        // not repeated here — that pair of lists IS the peer reading, and it is most of the byte saving.
        diff.push({
          label: p.label || p.xpath,
          background: p.background !== f.background ? p.background : undefined,
          border: p.border, labelColor: p.labelColor !== f.labelColor ? p.labelColor : undefined,
          errorStated: p.state.ariaInvalid === 'true' || !!p.cue.errorMessageText,
          requiredStated: p.state.required === true || p.state.ariaRequired === 'true',
          classes: p.state.classes.length ? p.state.classes : undefined,
          blockClasses: p.state.blockClasses.length ? p.state.blockClasses : undefined,
          nonColourCue: clip(p.cue.errorMessageText || p.cue.describedByText || p.cue.blockExtraText || '', 90) || null,
          blockHasIcon: p.cue.blockHasIcon,
          labelGeneratedContent: p.labelGeneratedContent || undefined,
          labelHasIcon: p.labelHasIcon || undefined,
        });
      }
      // Distinct OTHER label colours + the measured separation from this field's own label colour. This is
      // the G182/G183 shade question ("is the coded state merely a different hue, or genuinely lighter/
      // darker?") reduced to a number, because a per-field subject can neither eyeball it nor be trusted to.
      const seen = new Set();
      const labelColourContrasts = [];
      for (const p of group) {
        if (p === f || !p.labelColor || p.labelColor === f.labelColor || seen.has(p.labelColor)) continue;
        seen.add(p.labelColor);
        if (labelColourContrasts.length < 4) labelColourContrasts.push({ label: p.label || p.xpath, labelColor: p.labelColor, contrastWithThisLabel: ratioOf(f.labelColor, p.labelColor) });
      }
      out.push({
        xpath: f.xpath,
        label: f.label,
        color: f.color,
        background: f.background,
        border: f.border,
        borderUniform: f.borderUniform,
        outline: f.outline,
        labelColor: f.labelColor,
        labelGeneratedContent: f.labelGeneratedContent,
        labelHasIcon: f.labelHasIcon,
        state: f.state,
        cue: f.cue,
        errorStated,
        requiredStated,
        group: {
          scope: scope === 'document' ? 'document' : 'form',
          fieldCount: group.length,
          distinctFieldAppearances: appearances.size,
          distinctLabelColours: labelColours.size,
          sameAppearanceAs: same,
          differentAppearanceFrom: diff,
          labelColourContrasts,
        },
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// TEXT CONTRAST FACTS — the element's OWN resolved colour and its effective backdrop.
//
// WHY THIS EXISTS. `precomputeSignals` builds the `contrast` signal — the one colour fact EVERY
// `color-and-visual-text` subject receives — out of six element keys: `color`, `effBg`, `contrastReliable`,
// `contrastSolid`, `contrastUnreliableReason`, `needsPixelContrast`. The v3 collector emitted NONE of them
// (they exist only on the older v2.9 per-element path), so the signal degraded, for 100% of colour subjects,
// to a fixed stub asserting that the backdrop "could not be reduced to two flat colors (gradient / image /
// overlay / semi-transparency)" and instructing the judge to read the pixels instead. On the overwhelming
// majority of subjects that assertion is simply FALSE — the text sits on an opaque solid colour with no
// image, gradient, filter, blend or transparency anywhere in its paint stack — and the harness was therefore
// shipping a false statement plus an invitation to trust a crop, to every colour judgment it made. A judge
// that reads a neighbouring control's coloured edge out of a rectangular crop then has no counter-fact.
//
// SOUNDNESS IS THE WHOLE POINT, so the rules here are the CSS-side rules of the deterministic contrast runner
// (`measureContrast` in exp-runners.js), applied in ONE amortized pass instead of once per element, and made
// STRICTLY MORE CONSERVATIVE at every point where the runner leans on a rendered-pixel channel that a
// collector does not have:
//   · the runner proves backdrop uniformity partly from screenshots; here, an element is only ever called
//     reliable when EVERY painter that could intersect the text is enumerated and none of them is foreign;
//   · replaced/painting content (img, svg, canvas, video, iframe, embed, object) counts as a painter even
//     though it carries no CSS background — this is the case the runner catches only in pixels;
//   · an element that is COVERED at any sample point, or that the hit test cannot resolve, abstains;
//   · filter / mix-blend-mode / backdrop-filter / opacity are checked over the WHOLE ancestor chain, not only
//     down to the opaque base.
// So this can abstain where the runner decides; it must not decide where the runner abstains. Where both
// produce a ratio the two agree by construction — same paint-stack composition, same WCAG formula, same
// large-text thresholds.
//
// FAIL-SAFE. When the backdrop genuinely is not reducible, the record says so — with the ACTUAL reason
// (image, gradient, blend, overlay, split runs, …) rather than a generic one — keeps `needsPixelContrast`,
// and keeps the resolved foreground so the judge cannot invent one. The bug being fixed is claiming
// unsound when it is sound, not the abstention itself.
//
// DECIDES NOTHING. It mints no obligation and no finding; it states two colours and, when they are soundly
// two colours, their ratio.
//
// Self-contained so it serializes through page.evaluate — every helper is declared INSIDE the function body.
function collectTextContrastFacts() {
  const MAX_RECORDS = 800;
  const MAX_PAINTERS = 4000;
  const PT_TO_PX = 96 / 72;
  const LARGE_NORMAL_PX = 18 * PT_TO_PX;   // 24px  — WCAG 1.4.3 "large scale" at normal weight
  const LARGE_BOLD_PX = 14 * PT_TO_PX;     // 18.67px — WCAG 1.4.3 "large scale" at >=700

  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const rgba = (s) => {
    const m = /rgba?\(([^)]+)\)/i.exec(String(s || ''));
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
    if (p.length < 3) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const css = (c) => 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
  const colorEq = (x, y) => !!x && !!y && Math.round(x.r) === Math.round(y.r) && Math.round(x.g) === Math.round(y.g) && Math.round(x.b) === Math.round(y.b);
  const boxContains = (R, t, tol) => R.left <= t.left + tol && R.top <= t.top + tol && R.right >= t.right - tol && R.bottom >= t.bottom - tol;
  const boxHits = (R, t) => !(R.right <= t.left || R.left >= t.right || R.bottom <= t.top || R.top >= t.bottom);

  // getComputedStyle is the dominant cost of a whole-document pass; every node is read at most once.
  const _cs = new Map();
  const styleOf = (e) => { let v = _cs.get(e); if (v === undefined) { v = getComputedStyle(e); _cs.set(e, v); } return v; };
  const _ps = new Map();
  const pseudoPaints = (node) => {
    let hit = _ps.get(node);
    if (hit !== undefined) return hit;
    hit = false;
    for (const pe of ['::before', '::after']) {
      let pcs = null;
      try { pcs = getComputedStyle(node, pe); } catch (err) { pcs = null; }
      if (!pcs) continue;
      if (pcs.content === 'none' || pcs.content === 'normal' || pcs.content === '') continue; // not generated
      const pc = rgba(pcs.backgroundColor);
      if ((pc && pc.a > 0) || (pcs.backgroundImage && pcs.backgroundImage !== 'none')) { hit = true; break; }
    }
    _ps.set(node, hit);
    return hit;
  };

  // THE CANVAS FLOOR. The colour painted under everything when no box paints an opaque background: CSS
  // propagates <html>'s background to the viewport canvas, or <body>'s if <html> paints none. A page with
  // `body{background:#000}` therefore has a BLACK floor, not the CSS-standard white.
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  const rootCs = document.documentElement ? styleOf(document.documentElement) : null;
  const bodyCs = document.body ? styleOf(document.body) : null;
  const rootImg = !!(rootCs && rootCs.backgroundImage && rootCs.backgroundImage !== 'none');
  const bodyImg = !!(bodyCs && bodyCs.backgroundImage && bodyCs.backgroundImage !== 'none');
  const rootBg = rootCs ? rgba(rootCs.backgroundColor) : null;
  const bodyBg = bodyCs ? rgba(bodyCs.backgroundColor) : null;
  let canvasFloor = WHITE, canvasHasPaint = rootImg;
  if (rootBg && rootBg.a === 1) canvasFloor = { r: rootBg.r, g: rootBg.g, b: rootBg.b, a: 1 };
  else if (rootBg && rootBg.a > 0) { canvasFloor = over(rootBg, WHITE); canvasHasPaint = true; }
  else if (!rootImg) {
    canvasHasPaint = bodyImg;
    if (bodyBg && bodyBg.a === 1) canvasFloor = { r: bodyBg.r, g: bodyBg.g, b: bodyBg.b, a: 1 };
    else if (bodyBg && bodyBg.a > 0) { canvasFloor = over(bodyBg, WHITE); canvasHasPaint = true; }
  }

  // ── ONE-PASS PAINTER INDEX ────────────────────────────────────────────────────────────────────────────
  // The runner re-enumerates every element in the document for EACH text element it measures; that is
  // O(elements x text-elements) and unaffordable for a whole-page collector. The set of things that can
  // paint behind text does not depend on which text is being measured, so it is built ONCE here and each
  // candidate only intersects rectangles against it. Same rule, amortized — plus replaced content, which
  // paints without any CSS background and is the case the runner sees only in its pixel channel.
  const REPLACED = /^(img|svg|canvas|video|audio|iframe|frame|embed|object|picture|input)$/;
  const all = document.querySelectorAll('*');
  const painters = [];
  let paintersTruncated = false;
  for (const node of all) {
    const ncs = styleOf(node);
    if (ncs.display === 'none' || ncs.visibility === 'hidden' || parseFloat(ncs.opacity) === 0) continue;
    const c = rgba(ncs.backgroundColor);
    const paints = (c && c.a > 0)
      || (ncs.backgroundImage && ncs.backgroundImage !== 'none')
      || REPLACED.test(node.tagName.toLowerCase())
      || pseudoPaints(node);
    if (!paints) continue;
    const r = node.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (painters.length >= MAX_PAINTERS) { paintersTruncated = true; break; }
    painters.push({ node, r });
  }

  // Resolve the composited backdrop at ONE point through the real paint stack. Returns null when the stack
  // cannot be trusted at that point (the element is not hit there, or something foreign is drawn over it).
  const resolveAtPoint = (el, px, py) => {
    let stack = null;
    try { stack = document.elementsFromPoint(px, py); } catch (err) { stack = null; }
    if (!stack || !stack.length) return null;
    const idx = Array.prototype.indexOf.call(stack, el);
    if (idx < 0) return null;                                          // not hit here — cannot resolve soundly
    for (let i = 0; i < idx; i++) if (!el.contains(stack[i])) return null; // something foreign covers the text
    return resolveStack(Array.prototype.slice.call(stack, idx));
  };
  const resolveStack = (below) => {
    const layers = [], layerEls = [];
    let baseEl = null, hasImage = false;
    for (const node of below) {
      const ncs = styleOf(node);
      if (ncs.backgroundImage && ncs.backgroundImage !== 'none') hasImage = true;
      const c = rgba(ncs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); layerEls.push(node); }
      if (c && c.a === 1) { baseEl = node; break; }
    }
    if (!baseEl) {
      let onFloor = canvasFloor;
      for (let i = layers.length - 1; i >= 0; i--) onFloor = over(layers[i], onFloor);
      return { baseEl: null, color: { r: onFloor.r, g: onFloor.g, b: onFloor.b, a: 1 }, hasImage: hasImage || canvasHasPaint, layerEls, onCanvas: true };
    }
    let composed = layers[layers.length - 1];
    for (let i = layers.length - 2; i >= 0; i--) composed = over(layers[i], composed);
    return { baseEl, color: composed, hasImage, layerEls, onCanvas: false };
  };
  const ancestorChain = (el) => { const a = []; for (let p = el; p; p = p.parentElement) a.push(p); return a; };

  // ── CANDIDATES ───────────────────────────────────────────────────────────────────────────────────────
  // An element with a single, well-defined foreground: one that owns a non-whitespace text node of its own,
  // or a native form control (whose value text renders in its own `color` over its own background). A
  // wrapper whose text lives entirely in children has no foreground of its own and is deliberately skipped —
  // asserting one would be the same class of false statement this collector exists to remove.
  const out = [];
  for (const el of all) {
    if (out.length >= MAX_RECORDS) break;
    const tag = el.tagName.toLowerCase();
    if (el.namespaceURI && el.namespaceURI.indexOf('svg') >= 0) continue;   // SVG text is pixel territory
    if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'title' || tag === 'option') continue;
    let ownsText = false;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { ownsText = true; break; }
    const isField = (tag === 'input' && String(el.getAttribute('type') || '').toLowerCase() !== 'hidden') || tag === 'select' || tag === 'textarea';
    if (!ownsText && !isField) continue;
    const cs = styleOf(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) continue;
    const box = el.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;

    // `-webkit-text-fill-color` overrides the painted ink while leaving `color` untouched, so read the fill.
    const fillRaw = cs.webkitTextFillColor && cs.webkitTextFillColor !== 'currentcolor' ? cs.webkitTextFillColor : cs.color;
    const fg = rgba(fillRaw);
    const fontPx = parseFloat(cs.fontSize) || 0;
    let weight = parseInt(cs.fontWeight, 10); if (Number.isNaN(weight)) weight = cs.fontWeight === 'bold' ? 700 : 400;
    const threshold = (fontPx >= LARGE_NORMAL_PX || (fontPx >= LARGE_BOLD_PX && weight >= 700)) ? 3.0 : 4.5;

    // The rendered INK extent — the union of the text's client rects, which (unlike the border box) includes
    // glyphs overflowing the element. Uniformity has to hold over the whole rendered run, not the centre.
    // The individual LINE boxes are kept as well: they are where the glyphs actually are, and sampling along
    // them (rather than at the corners of the union) is both more accurate and immune to border-radius —
    // a 1px-inset corner of a rounded control lies OUTSIDE its own hit region, so a corner sample reports the
    // text as covered by its own ancestor. That artifact alone accounted for the largest abstention bucket
    // in a first measurement over the corpus, on ordinary rounded inputs with a flat opaque fill.
    let ink = { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    let lines = [ink];
    if (ownsText) {
      try {
        const range = document.createRange(); range.selectNodeContents(el);
        const rs = range.getClientRects();
        let l = Infinity, t = Infinity, rr = -Infinity, b = -Infinity, any = false;
        const ls = [];
        for (const q of rs) {
          if (q.width <= 0 || q.height <= 0) continue;
          any = true; l = Math.min(l, q.left); t = Math.min(t, q.top); rr = Math.max(rr, q.right); b = Math.max(b, q.bottom);
          if (ls.length < 12) ls.push({ left: q.left, top: q.top, right: q.right, bottom: q.bottom, width: q.width, height: q.height });
        }
        if (any && rr > l && b > t) { ink = { left: l, top: t, right: rr, bottom: b, width: rr - l, height: b - t }; lines = ls; }
      } catch (err) { /* keep the border box */ }
    }

    // ── the reasons a flat two-colour reduction would be UNSOUND, in the order they are worth reporting ──
    let reason = null;
    // (1) split runs — a descendant owning text in a different colour means there is no single foreground.
    if (!reason && ownsText) {
      for (const child of el.querySelectorAll('*')) {
        let childOwns = false;
        for (const n of child.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { childOwns = true; break; }
        if (childOwns && styleOf(child).color !== cs.color) { reason = 'the visible text is split into runs of DIFFERENT colours, so this element has no single foreground colour to measure'; break; }
      }
    }
    // (2) a glyph effect the flat fg/bg model cannot account for — a shadow halo can supply readability that
    //     the stripped ratio does not show, so the ratio would be measuring the wrong thing.
    if (!reason && typeof cs.textShadow === 'string' && cs.textShadow !== 'none' && cs.textShadow.trim() !== '') {
      reason = 'a text-shadow paints a halo around the glyphs, so the flat foreground/background ratio is not what is rendered';
    }
    // (3) opacity / filter / blend ANYWHERE in the ancestor chain: the rendered colours are not the computed
    //     ones. Checked to the root, not merely down to the opaque base.
    if (!reason) {
      for (const p of ancestorChain(el)) {
        const pcs = styleOf(p);
        const op = parseFloat(pcs.opacity);
        if (!Number.isNaN(op) && op < 1) { reason = 'this text is composited through an ancestor opacity, so the rendered colours are not the computed ones'; break; }
        if ((pcs.filter && pcs.filter !== 'none') || (pcs.backdropFilter && pcs.backdropFilter !== 'none') || (pcs.mixBlendMode && pcs.mixBlendMode !== 'normal')) {
          reason = 'a CSS filter or blend mode applies to this text or one of its ancestors, so the rendered colours are not the computed ones'; break;
        }
      }
    }
    // (4) a generated ::before/::after background on the element or an ancestor paints behind the text and is
    //     invisible to both hit testing and the element scan.
    if (!reason) {
      for (const p of ancestorChain(el)) if (pseudoPaints(p)) { reason = 'a generated ::before/::after background paints behind this text, so what is behind the glyphs is not the element backdrop'; break; }
    }
    // (5) a FOREIGN painter — any element that is neither this one, nor an ancestor, nor a descendant, which
    //     paints (background colour, background image, generated background, or replaced content such as an
    //     image/SVG/canvas) across the text run.
    if (!reason && paintersTruncated) reason = 'this page paints too many overlapping surfaces to enumerate, so what is behind the glyphs cannot be established from the styles alone';
    // Tested per LINE, not against the union rectangle: a float beside a wrapped paragraph sits inside the
    // union but behind no glyph at all, and calling that an obscured backdrop is the same over-claim in the
    // opposite direction.
    if (!reason) {
      for (const p of painters) {
        if (p.node === el || el.contains(p.node) || p.node.contains(el)) continue;
        let hit = false;
        for (const q of lines) if (boxHits(p.r, q)) { hit = true; break; }
        if (hit) { reason = 'another element that is not an ancestor of this text paints a surface across the text run, so the backdrop is whatever that element draws'; break; }
      }
    }
    // (6) resolve the backdrop. In the viewport, through the real paint stack at the centre and the four
    //     inset corners of the ink run — every sample must find the SAME opaque base and the SAME composited
    //     colour. Outside the viewport, hit testing returns nothing at all, so fall back to the ancestor
    //     chain: (5) has already excluded every non-ancestor painter over this run, which is the case the
    //     hit test would otherwise have caught.
    let resolved = null;
    if (!reason) {
      const inView = ink.left >= 0 && ink.top >= 0 && ink.right <= (window.innerWidth || 0) && ink.bottom <= (window.innerHeight || 0);
      if (inView && ink.width > 0 && ink.height > 0) {
        // three points per rendered LINE — vertically centred (never a rounded corner), at both horizontal
        // extremes and the middle — so a backdrop that changes anywhere along the run is caught.
        const pts = [];
        for (const q of lines) {
          if (q.width <= 0 || q.height <= 0) continue;
          const cy = q.top + q.height / 2;
          const dx = Math.min(Math.max(1, q.width * 0.05), q.width / 2);
          pts.push([q.left + dx, cy], [q.left + q.width / 2, cy], [q.right - dx, cy]);
          if (pts.length >= 21) break;
        }
        if (!pts.length) pts.push([ink.left + ink.width / 2, ink.top + ink.height / 2]);
        const samples = [];
        for (const [px, py] of pts) { const s = resolveAtPoint(el, px, py); if (!s) { samples.length = 0; break; } samples.push(s); }
        if (!samples.length) reason = 'part of this text is covered by, or cannot be resolved through, the elements painted over it';
        else {
          const s0 = samples[0];
          for (const s of samples) if (s.baseEl !== s0.baseEl || !colorEq(s.color, s0.color)) { reason = 'the backdrop is not the same colour across the whole text run'; break; }
          if (!reason) resolved = { color: s0.color, hasImage: samples.some((s) => s.hasImage), layerEls: s0.layerEls, baseEl: s0.baseEl, onCanvas: s0.onCanvas };
        }
      } else {
        resolved = resolveStack(ancestorChain(el));
      }
    }
    if (!reason && resolved && resolved.hasImage) reason = 'a background image or gradient is painted behind this text, so the backdrop is not a single flat colour';
    // (7) the opaque base and every translucent layer above it must COVER the whole run — a backdrop box
    //     narrower than the text leaves part of the run over something else entirely.
    if (!reason && resolved && !resolved.onCanvas) {
      const need = [resolved.baseEl].concat(resolved.layerEls || []);
      for (const node of need) {
        if (!node) continue;
        const R = node.getBoundingClientRect();
        let covers = true;
        for (const q of lines) if (!boxContains(R, q, 1)) { covers = false; break; }
        if (!covers) { reason = 'the background box behind this text does not cover the whole text run, so part of the run sits on a different surface'; break; }
      }
    }
    if (!reason && !fg) reason = 'this element\'s foreground colour could not be resolved from its computed style';
    if (!reason && !resolved) reason = 'the backdrop behind this text could not be resolved from the computed styles';

    const bg = resolved ? resolved.color : null;
    const effFg = (fg && bg) ? over(fg, bg) : null;
    const reliable = !reason && !!effFg && !!bg;
    const rec = {
      xpath: xpathOf(el),
      color: css(effFg || (fg ? { r: fg.r, g: fg.g, b: fg.b } : { r: 0, g: 0, b: 0 })),
      contrastThreshold: threshold,
      contrastReliable: reliable,
      needsPixelContrast: !reliable,
    };
    if (!fg) delete rec.color;
    if (bg) rec.effBg = css(bg);
    if (reliable) {
      const l1 = lum(effFg), l2 = lum(bg);
      rec.contrastSolid = +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
    } else {
      // The abstention is honest and SPECIFIC, and it keeps the pixel instruction: an unresolvable backdrop
      // is exactly when a rendered view is the only sound source.
      rec.contrastUnreliableReason = (reason || 'the backdrop could not be reduced to a single flat colour')
        + ' — a sound contrast ratio is not computable from the styles here; judge readability from the rendered pixels';
    }
    out.push(rec);
  }
  return out;
}

module.exports = { collectColourPeers, collectFieldColourState, collectTextContrastFacts };
