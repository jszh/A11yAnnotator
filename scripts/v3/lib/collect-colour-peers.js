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
// Self-contained so it serializes through page.evaluate.
function collectColourPeers() {
  const MAX_GROUPS = 8;
  const MAX_MEMBERS = 12;
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
  for (const el of document.querySelectorAll('body *')) {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAG.test(tag)) continue;
    if (el.closest('pre, code')) continue;
    if (!el.parentElement) continue;
    if (!visible(el)) continue;
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
    groups.push({
      key,
      distinctColours: colourAxes.size,
      members: facts.map((x) => ({ xpath: x.xpath, label: x.label, color: x.color, background: x.background })),
    });
  }
  return groups;
}
