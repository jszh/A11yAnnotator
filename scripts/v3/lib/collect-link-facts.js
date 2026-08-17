'use strict';
// SC 2.4.4 Link Purpose — DETERMINISTIC LINK-TARGET FACTS (residual RCA S10).
//
// WHY THIS EXISTS. The 2.4.4 rubric's name-contradicts-destination mode needs to know what a link's
// destination actually IS. For a same-document fragment (`href="#…"`) that answer previously required a
// stochastic `resolve_destination` tool call: a run whose judge made the call caught the contradiction, a
// run whose judge did not cleared it with high confidence, and the tool's screenshot/OCR path is lossy
// where the DOM is exact (an RTL heading came back truncated). But a fragment target lives in the SAME
// document the collector is already standing in — resolving it is a getElementById, not a navigation.
// No network, no SSRF surface, no tool budget, no variance.
//
// WHAT IT STATES, per `a[href]` / `area[href]`, keyed by the link's xpath:
//   · for a same-document fragment: whether the target element EXISTS, the target's own accessible
//     name-ish text (aria-label / aria-labelledby / title), the target's own heading text when the target
//     IS a heading, and the text of the first heading INSIDE or immediately FOLLOWING the target — i.e.
//     what the destination says it is, in the destination's own words;
//   · for every link: the href's terminal path segment and file extension (a link whose name describes an
//     article but whose href ends in a downloadable file is checkable only if the prompt carries the
//     filename), and `sameNameDifferentTarget` — true when another link on the page shares this link's
//     trimmed accessible name/text while resolving to a DIFFERENT href (the identical-names failure mode's
//     precondition, stated as a fact instead of left to a crop sweep).
//
// DECIDES NOTHING. Whether a name AGREES with its resolved destination, whether a filename contradicts a
// stated purpose, and whether same-named links serve equivalent purposes all stay with the rubric. The
// facts only remove the tool call from the critical path.
//
// Self-contained so it serializes through page.evaluate — every helper is declared INSIDE the function
// body. (A helper shared across two separately-serialized collectors threw a ReferenceError and silently
// killed a whole lane earlier in this campaign; see the collector-liveness note in act-page-collect.js.)
function collectLinkTargetFacts() {
  const MAX_LINKS = 300;   // records per page — a TOC-heavy page stays bounded
  const MAX_TEXT = 200;    // every reported string is clipped to this

  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const clip = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  const isHeading = (e) => !!(e && e.tagName && (/^H[1-6]$/.test(e.tagName)
    || (e.getAttribute && String(e.getAttribute('role') || '').toLowerCase() === 'heading')));
  const HEADING_SEL = 'h1,h2,h3,h4,h5,h6,[role="heading"]';
  const idsText = (e, attr) => {
    const v = e.getAttribute && e.getAttribute(attr);
    if (!v) return '';
    let t = '';
    for (const id of v.trim().split(/\s+/).slice(0, 4)) {
      let n = null;
      try { n = document.getElementById(id); } catch (err) { n = null; }
      if (n) t += ' ' + (n.textContent || '');
    }
    return clip(t);
  };
  // The link's own trimmed accessible name/text, best-effort in accname precedence order. `area` and
  // icon-only links usually name themselves via aria-label / alt, so those come before textContent.
  const linkName = (e) => {
    const al = clip(e.getAttribute('aria-label'));
    if (al) return al;
    const lb = idsText(e, 'aria-labelledby');
    if (lb) return lb;
    const tx = clip(e.textContent);
    if (tx) return tx;
    const img = e.querySelector && e.querySelector('img[alt]');
    const alt = clip((img && img.getAttribute('alt')) || e.getAttribute('alt'));
    if (alt) return alt;
    return clip(e.getAttribute('title'));
  };

  const links = [];
  for (const el of document.querySelectorAll('a[href], area[href]')) {
    if (links.length >= MAX_LINKS) break;
    links.push(el);
  }

  // Same-name grouping over RESOLVED hrefs (`el.href` is the browser-resolved absolute URL, so `#x`,
  // `page#x` and `./page#x` compare equal when they are). Computed over the whole enumeration first so
  // each record's flag sees every peer, not only the ones recorded before it.
  const byName = new Map();
  for (const el of links) {
    const key = linkName(el).toLowerCase();
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, new Set());
    byName.get(key).add(String(el.href || el.getAttribute('href') || ''));
  }

  const out = [];
  for (const el of links) {
    const raw = String(el.getAttribute('href') || '');
    const rec = { xpath: xpathOf(el), href: clip(raw) };

    let u = null;
    try { u = new URL(raw, location.href); } catch (err) { u = null; }

    // ── same-document fragment: resolve the target IN THIS DOM ────────────────────────────────────────
    // A fragment is same-document when the resolved URL differs from the current location only by hash.
    // Compared on protocol/host/path/query rather than `origin`: a file: URL's `origin` serializes to the
    // opaque string "null" while `location.origin` need not, which would break every file:// fixture.
    let fragId = null;
    if (u && u.hash && u.hash.length > 1
        && u.protocol === location.protocol && u.host === location.host
        && u.pathname === location.pathname && u.search === location.search) {
      try { fragId = decodeURIComponent(u.hash.slice(1)); } catch (err) { fragId = u.hash.slice(1); }
    }
    if (fragId !== null) {
      let target = null;
      try { target = document.getElementById(fragId); } catch (err) { target = null; }
      if (!target) { // legacy <a name="…"> anchors are valid fragment targets too
        try { target = document.getElementsByName(fragId)[0] || null; } catch (err) { target = null; }
      }
      const frag = { targetId: clip(fragId), targetExists: !!target };
      if (target) {
        frag.targetTag = target.tagName.toLowerCase();
        const nm = clip(target.getAttribute('aria-label')) || idsText(target, 'aria-labelledby') || clip(target.getAttribute('title'));
        if (nm) frag.targetName = nm;
        if (isHeading(target)) {
          // the target IS a heading — its own text is what the destination announces itself as
          frag.targetHeadingText = clip(target.textContent);
        } else {
          // first heading INSIDE the target (a section/div destination titled by its own heading) …
          let h = null;
          try { h = target.querySelector(HEADING_SEL); } catch (err) { h = null; }
          // … or immediately FOLLOWING it — but ONLY for the `<a id>`/empty-anchor idiom (a text-less
          // target whose heading comes next). A content-bearing headingless target gets NO following-sibling
          // heading: the next heading in document order belongs to the NEXT section, and reporting it as
          // "what the destination says it is" manufactures a 2.4.4 contradiction on a correct link
          // (adversarial soundness finding #4, probe-confirmed). Direct siblings only (no descent — a
          // sibling's inner heading is that sibling's own), two hops.
          if (!h && !(target.textContent || '').trim()) {
            let cur = target;
            for (let hops = 0; hops < 2 && cur && !h; hops++) {
              cur = cur.nextElementSibling;
              if (!cur) break;
              if (isHeading(cur)) { h = cur; break; }
            }
          }
          if (h) frag.firstHeadingText = clip(h.textContent);
        }
      }
      rec.fragment = frag;
    }

    // ── terminal path segment + extension ─────────────────────────────────────────────────────────────
    // Only when the RAW href states a path of its own: a pure `#fragment` href resolves to the current
    // document's path, and reporting THAT filename would attribute a destination the href never named.
    // Non-navigational schemes (mailto:, tel:, javascript:) carry no path segment either.
    if (u && !/^\s*#/.test(raw) && /^(https?:|file:)$/.test(u.protocol)) {
      const segs = u.pathname.split('/').filter(Boolean);
      let last = segs.length ? segs[segs.length - 1] : '';
      try { last = decodeURIComponent(last); } catch (err) { /* keep the encoded form */ }
      if (last) {
        rec.terminalSegment = clip(last);
        const m = /\.([a-z0-9]{1,8})$/i.exec(last);
        if (m) rec.extension = m[1].toLowerCase();
      }
    }

    // ── identical-name precondition, as a fact ────────────────────────────────────────────────────────
    // true ⇔ at least one OTHER link shares this trimmed name and the group's resolved hrefs are not all
    // identical. false is a fact too: this name is unique on the page, or every bearer goes the same place.
    const key = linkName(el).toLowerCase();
    const group = key ? byName.get(key) : null;
    rec.sameNameDifferentTarget = !!(group && group.size > 1);

    out.push(rec);
  }
  return out;
}

module.exports = { collectLinkTargetFacts };
