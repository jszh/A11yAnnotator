'use strict';
// Trusted-Tester gap G1 (TT 10.D, SC 1.3.1): list SEMANTICS. The collector extracted headings + tables but NOT
// lists — the only list signal was a `listStyleNone` count (eval-page.js), never a per-list analysis, so the
// info-relationships rubric received no `lists[]`. TT 10.D requires that VISUALLY-APPARENT lists be coded as lists
// (ul/ol/dl), of the RIGHT type, correctly nested. Per memory [[harness-3-3-checker-decision]], axe's
// `list`/`listitem`/`definition-list` rules own MALFORMED real-list STRUCTURE (a <ul> with a stray non-<li> child);
// these facts feed the RESIDUAL judgment axe ABSTAINS on — the canonical 10.D failure: a list built from
// <div>/<br>/<p> with bullet/number glyphs and NO list markup (a sighted reader sees a list; AT users get a text
// blob), plus role-overridden / wrong-type lists. Never a competing checker — the rubric (info-relationships-v0)
// judges; axe still owns structural list validity.
//
// Self-contained so it serializes cleanly through page.evaluate (no closures over Node scope). Both collectors
// (act-page-collect.js, eval-page.js) run it and fold the result into `structure.lists`.
function collectLists() {
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  // a LEADING list MARKER a sighted reader perceives: a bullet glyph (•·▪‣◦⁃, the hyphen family, or *), a leading
  // EMOJI, or an ORDERED marker — arabic (1..9999), fullwidth digits, a single letter "a)"/"b)", a roman
  // numeral, or a decimal/hierarchical outline ("2.1", "2.a", "2.a.i" — TT 10.D's cited marker shapes).
  // EN/EM dashes (–—) are DELIBERATELY EXCLUDED: at line start they are prose punctuation (attribution
  // "— Author", dialogue "– line"), not list bullets (adversarial review). The trailing `\s+\S` (marker +
  // whitespace + content) rejects "*Required" / "-5 degrees". Case-insensitive + unicode.
  //
  // ROMAN lane (audit #13): was a hand-enumerated ii..xv alternation — fitted to the build fixtures; 'xvi)' and
  // beyond never matched. Now a CANONICAL roman-numeral grammar (values 1..3999), guarded by a cheap
  // `[ivxlcdm]{1,7}[.)]` shape lookahead (bounds length AND forces ≥1 roman char, since every grammar part is
  // optional). PRECISION NOTE: the lane deliberately RELIES on the callers' ≥3-item floor — prose words that
  // parse as canonical numerals ('mix)' = m+ix, 'div)' = d+iv) match here and are held back only by the floor
  // (three sibling lines each opening with such a word is no accident); non-canonical roman-charset words
  // ('civil)', 'mild)') pass the shape guard but fail the grammar and never match.
  //
  // DECIMAL-OUTLINE lane (audit #13): `\d+(?:[.][a-z\d]+)+[.)]?` — a digit head plus ≥1 dotted segment covers
  // TT 10.D's hierarchical markers ('2.1', '2.a', '2.a.i'); the plain `\d{1,4}[.)]` arabic lane keeps '2.'/'2)'.
  // Like the roman lane it leans on the ≥3 floor for stray prose ('3.14 is pi' matches; three such siblings don't happen).
  const BULLET = /^\s*(?:[•·▪‣◦⁃‐‑‒*-]|\p{Extended_Pictographic}|\d+(?:[.][a-z\d]+)+[.)]?|\d{1,4}[.)]|[０-９]{1,4}[．。.)]|(?=[ivxlcdm]{1,7}[.)])m{0,3}(?:cm|cd|d?c{0,3})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})[.)]|[a-z][.)])\s+\S/iu;
  const vis = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    // a clipped/sr-only box (clip:rect(0 0 0 0) leaves a ~1px rect) is NOT "visually apparent" (adversarial review).
    return r.width > 2 && r.height > 2;
  };
  const inRealList = (el) => !!(el.closest && el.closest('ul,ol,dl,[role=list]'));
  const out = [];

  // ---- 1. REAL lists (ul/ol/dl): type, item shape, nesting depth, role override, malformed direct children ----
  for (const l of [...document.querySelectorAll('ul,ol,dl')].slice(0, 30)) {
    const tag = l.tagName.toLowerCase();
    const role = (l.getAttribute('role') || '').toLowerCase() || null;
    const items = tag === 'dl'
      ? [...l.children].filter((c) => /^(DT|DD)$/.test(c.tagName))
      : [...l.children].filter((c) => c.tagName === 'LI');
    // a stray NON-item direct child is a structural break (a <ul> whose direct child is a <div>); for <dl>,
    // dt/dd (and a grouping <div>) are legal, anything else is stray. script/template are inert.
    const stray = [...l.children].filter((c) => tag === 'dl'
      ? !/^(DT|DD|DIV|SCRIPT|TEMPLATE)$/.test(c.tagName)
      : !/^(LI|SCRIPT|TEMPLATE)$/.test(c.tagName));
    let nestedDepth = 0; for (let p = l.parentElement; p; p = p.parentElement) if (/^(UL|OL|DL)$/.test(p.tagName)) nestedDepth++;
    out.push({
      kind: 'real', tag, role,
      itemCount: items.length,
      listStyleNone: tag !== 'dl' ? getComputedStyle(l).listStyleType === 'none' : null,
      hasNonItemChildren: stray.length > 0,
      // role=tablist/menu/etc. RE-PURPOSES the element away from "list" semantics (a different question than 10.D).
      roleOverridesList: !!(role && !/^(list|directory)$/.test(role)),
      nestedDepth,
      itemSamples: items.slice(0, 6).map((c) => clip(c.textContent, 50)),
    });
  }

  // ---- 2. VISUALLY-APPARENT (faux) lists built WITHOUT list markup — the canonical TT 10.D failure ----
  let fauxCount = 0;
  // (a) <br>-separated lines inside ONE block, ≥3 of which start with a bullet/number glyph.
  for (const b of [...document.querySelectorAll('p,div,span,td,section,article')].slice(0, 4000)) {
    if (fauxCount >= 12) break;
    if (inRealList(b) || !vis(b)) continue;
    if (b.querySelector('ul,ol,dl,li')) continue;                       // wraps a real list ⇒ not a faux one
    if (b.querySelectorAll(':scope > br').length < 2) continue;
    const segs = []; let cur = '';
    for (const n of b.childNodes) {
      if (n.nodeType === 1 && n.tagName === 'BR') { segs.push(cur); cur = ''; } else cur += (n.textContent || '');
    }
    segs.push(cur);
    const bulletLines = segs.map((s) => s.trim()).filter((s) => BULLET.test(s));
    if (bulletLines.length >= 3) {
      out.push({ kind: 'faux', via: 'br-bulleted', tag: b.tagName.toLowerCase(), itemCount: bulletLines.length, itemSamples: bulletLines.slice(0, 6).map((s) => clip(s, 50)) });
      fauxCount++;
    }
  }
  // (b) ≥3 SIBLING block elements (same tag, not <li>) each whose visible text starts with a bullet/number glyph.
  // Items must be LEAF text blocks (no block-level descendants): a parent whose children are themselves list
  // CONTAINERS — e.g. <body> holding three faux-list divs — must NOT be nominated as a list of those containers
  // (adversarial review: the container-of-lists false-nesting). The marker is a CANDIDATE hint; the rubric judges.
  const isLeafItem = (c) => vis(c) && !c.querySelector('ul,ol,dl,li,p,div,section,article,table');
  const parents = new Set();
  for (const el of [...document.querySelectorAll('p,div,span')].slice(0, 4000)) if (el.parentElement) parents.add(el.parentElement);
  for (const p of parents) {
    if (fauxCount >= 12) break;
    if (/^(UL|OL|DL)$/.test(p.tagName) || inRealList(p)) continue;
    const kids = [...p.children].filter((c) => /^(P|DIV|SPAN)$/.test(c.tagName));
    if (kids.length < 3) continue;
    const tally = {}; for (const c of kids) tally[c.tagName] = (tally[c.tagName] || 0) + 1;
    const dominant = Object.keys(tally).sort((a, b) => (tally[b] - tally[a]) || (a < b ? -1 : 1))[0];
    const bulletKids = kids.filter((c) => c.tagName === dominant && isLeafItem(c) && BULLET.test(c.textContent || ''));
    if (bulletKids.length >= 3) {
      out.push({ kind: 'faux', via: 'sibling-bulleted', tag: dominant.toLowerCase(), itemCount: bulletKids.length, itemSamples: bulletKids.slice(0, 6).map((c) => clip(c.textContent, 50)) });
      fauxCount++;
    }
  }
  return out.slice(0, 40);
}

module.exports = { collectLists };
