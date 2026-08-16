'use strict';
// SC 1.3.1 — WHITESPACE-FORMATTED columns and faux tables (WCAG **F34**, residual RCA S7).
//
// F34 is "failure due to using white space characters to format tables in plain text content". The
// relationship a sighted reader gets — this value belongs under that heading, these two paragraphs are
// side-by-side columns — is carried entirely by runs of spaces, which a screen reader either collapses or
// reads straight through, interleaving the columns into nonsense. Nothing in the DOM records the structure,
// so no role/attribute check can see it; the signal is in the TEXT LAYOUT itself.
//
// The detectable signature is ALIGNMENT: across several lines, runs of whitespace end at the SAME character
// offsets, because that is what makes columns line up on screen. One line with a wide gap is a sentence; four
// lines whose gaps end at the same two offsets is a table someone drew with the space bar.
//
// Only applies where the spaces actually RENDER — `white-space: pre|pre-wrap|pre-line` (which `<pre>` sets by
// default). Everywhere else the browser collapses runs of spaces, so no visual column exists to lose.
//
// Reports SHAPE only, never a verdict: a monospaced ASCII banner and a code sample also align, and whether
// the alignment carries a relationship is the rubric's call.
function collectFauxColumns() {
  const MIN_LINES = 3;          // fewer than this is not a repeating structure
  const MIN_GAP = 3;            // a run of <3 spaces is ordinary inter-word spacing
  const MIN_ALIGNED = 3;        // how many lines must share a column offset before it counts as a column
  const MAX_REPORT = 6;

  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (out.length >= MAX_REPORT) break;
    const cs = getComputedStyle(el);
    if (!/^pre($|-)/.test(cs.whiteSpace)) continue;                    // spaces would be collapsed ⇒ no visual column
    if (el.querySelector('pre, table')) continue;                      // report the innermost holder, not a wrapper
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const text = el.textContent || '';
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < MIN_LINES) continue;

    // Column starts: the offset at which content resumes after a gap of MIN_GAP+ spaces.
    const offsets = new Map();
    let linesWithGap = 0;
    for (const line of lines) {
      const starts = new Set();
      const re = /\S {3,}(?=\S)/g;
      let m;
      while ((m = re.exec(line)) !== null) starts.add(m.index + m[0].length);
      if (starts.size) linesWithGap++;
      for (const s of starts) offsets.set(s, (offsets.get(s) || 0) + 1);
    }
    // Tolerate ±1 character of drift — hand-aligned columns are rarely exact.
    const aligned = [];
    for (const [off, n] of offsets) {
      const near = (offsets.get(off - 1) || 0) + n + (offsets.get(off + 1) || 0);
      if (near >= MIN_ALIGNED) aligned.push({ offset: off, lines: near });
    }
    // Collapse the ±1 duplicates so two adjacent offsets are one column.
    aligned.sort((a, b) => a.offset - b.offset);
    const columns = [];
    for (const a of aligned) if (!columns.length || a.offset - columns[columns.length - 1].offset > 1) columns.push(a);

    if (!columns.length || linesWithGap < MIN_ALIGNED) continue;
    out.push({
      xpath: xpathOf(el),
      tag: el.tagName.toLowerCase(),
      lineCount: lines.length,
      linesWithGap,
      columnCount: columns.length + 1,        // n gaps ⇒ n+1 columns
      columnOffsets: columns.slice(0, 8).map((c) => c.offset),
      sample: lines.slice(0, 4).map((l) => l.slice(0, 90)),
    });
  }
  return out;
}

module.exports = { collectFauxColumns };
