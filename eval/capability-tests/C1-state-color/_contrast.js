'use strict';
// WCAG contrast helper for the C1-state-color corpus generation.
// Used only at authoring time to pin exact measuredRatioApproxInState values.
// Usage: node _contrast.js "#1a73e8" "#ffffff"   ->  ratio
//        node _contrast.js --composite "rgba(255,255,255,0.5)" "#1a73e8"  -> composited fg hex
function hexToRgb(h) {
  h = h.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function chan(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum([r, g, b]) { return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b); }
function ratio(a, b) {
  const la = lum(hexToRgb(a)); const lb = lum(hexToRgb(b));
  const hi = Math.max(la, lb); const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgba(s) {
  const m = s.match(/rgba?\(([^)]+)\)/i);
  const p = m[1].split(',').map((x) => parseFloat(x.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
// composite fg(rgba) over bg(hex) -> hex
function composite(fgRgba, bgHex) {
  const fg = parseRgba(fgRgba); const bg = hexToRgb(bgHex);
  const out = [0, 1, 2].map((i) => {
    const f = [fg.r, fg.g, fg.b][i];
    return Math.round(f * fg.a + bg[i] * (1 - fg.a));
  });
  return '#' + out.map((c) => c.toString(16).padStart(2, '0')).join('');
}
module.exports = { ratio, composite, hexToRgb };
if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--composite') { console.log(composite(a[1], a[2])); }
  else { console.log(ratio(a[0], a[1]).toFixed(3)); }
}
