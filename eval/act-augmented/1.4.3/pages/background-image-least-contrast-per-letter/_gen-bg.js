#!/usr/bin/env node
// Deterministic high-variance background-image generator for SC 1.4.3 F83 cases.
// Pure-Node PNG encoder (zlib + manual CRC) — no `canvas` dependency.
// Each generated image is a real photographic-ish / textured RGBA raster where MOST of the
// image gives PASSING contrast against the page's text colour, but a localized region drops
// below threshold so that ONLY some letters fail (least-contrast / per-letter, F83).
//
// The point: ACT's best-case pixel algorithm samples the highest-contrast pixel pairing and
// reports PASS; a human eyedropping the LEAST-contrast pixel behind the failing glyphs finds
// the violation. We emit the images as data: URIs (kept local, no network egress) and also
// print the measured worst-case / best-case contrast per case so the .md citations are exact.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- PNG encode ----------
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(width, height, rgba) {
  // rgba: Uint8Array length w*h*4
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy ? rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
              : Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- colour / contrast math (WCAG 2.x) ----------
function relLum(r, g, b) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(rgb1, rgb2) {
  const L1 = relLum(...rgb1), L2 = relLum(...rgb2);
  const a = Math.max(L1, L2), b = Math.min(L1, L2);
  return (a + 0.05) / (b + 0.05);
}
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

// small deterministic value-noise so backgrounds look photographic, not flat
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, y, scale, s) {
  const xs = x / scale, ys = y / scale;
  const x0 = Math.floor(xs), y0 = Math.floor(ys);
  const tx = smooth(xs - x0), ty = smooth(ys - y0);
  const v00 = hash(x0, y0, s), v10 = hash(x0 + 1, y0, s);
  const v01 = hash(x0, y0 + 1, s), v11 = hash(x0 + 1, y0 + 1, s);
  return lerp(lerp(v00, v10, tx), lerp(v01, v11, tx), ty);
}

const OUT = __dirname;
const results = {};

function save(name, W, H, fn) {
  const px = Buffer.alloc(W * H * 4);
  let minBehindText = null, maxBehindText = null; // sampled only in text band if provided
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * W + x) * 4;
      px[i] = clamp(r); px[i + 1] = clamp(g); px[i + 2] = clamp(b); px[i + 3] = 255;
    }
  }
  const buf = encodePNG(W, H, px);
  const file = path.join(OUT, name);
  fs.writeFileSync(file, buf);
  const dataUri = 'data:image/png;base64,' + buf.toString('base64');
  return { px, W, H, file, dataUri, sizeKB: (buf.length / 1024).toFixed(1) };
}

// helper: scan worst/best contrast of a given text colour over a rectangular band of an image
function bandContrast(img, textRGB, x0, x1, y0, y1) {
  let worst = Infinity, best = -Infinity;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.W + x) * 4;
      const c = contrast(textRGB, [img.px[i], img.px[i + 1], img.px[i + 2]]);
      if (c < worst) worst = c;
      if (c > best) best = c;
    }
  }
  return { worst: +worst.toFixed(2), best: +best.toFixed(2) };
}

// =====================================================================
// case-01: sunset hero. Dark on the LEFT (white text passes), bright sky
// on the RIGHT where the trailing word washes out below 4.5:1.
// White text #ffffff. Worst-case behind last word must be < 4.5:1; best-case (and left
// region) >> 4.5:1 so ACT best-case passes.
// =====================================================================
(() => {
  const W = 1200, H = 360;
  const img = save('bg-01-sunset.png', W, H, (x, y) => {
    const tx = x / W;
    // horizontal gradient: deep indigo/maroon stays DARK across the left ~65%, then
    // ramps to a hot bright sky only on the right ~25-35%. This keeps white text comfortably
    // passing across the leading words and washing out only behind the trailing word.
    // The headline "Book Your Sunset Escape" ends near x-fraction 0.53, so the bright sunset
    // zone is tuned to begin at ~0.40 and reach full bright by ~0.54 — covering only the
    // trailing word "Escape" (which spans ~0.39-0.53) while "Sunset" before it stays dark.
    const ramp = Math.max(0, (tx - 0.40) / 0.16); // dark until 40%, full bright by ~56%
    const base = [
      lerp(14, 250, Math.pow(Math.min(1, ramp), 0.7)),  // R
      lerp(10, 236, Math.pow(Math.min(1, ramp), 0.85)), // G
      lerp(34, 214, Math.pow(Math.min(1, ramp), 1.0)),  // B  (sunset warm)
    ];
    // bright sky spanning the FULL height (a vertical column, not a blob) so the trailing
    // word washes out at any vertical text position. Driven by x only.
    const glow = Math.max(0, (tx - 0.40) / 0.16);
    // cloud streaks via noise — amplitude scaled DOWN in the dark left so the passing
    // region's worst pixel stays well above 4.5:1, larger toward the bright right.
    const n = (valueNoise(x, y, 70, 7) - 0.5) * (12 + 22 * Math.min(1, tx * 1.4));
    return [
      base[0] + glow * 80 + n,
      base[1] + glow * 78 + n,
      base[2] + glow * 60 + n * 0.6,
    ];
  });
  // text band ~ vertical center; last word occupies the right ~22%
  results['01'] = {
    full: bandContrast(img, [255, 255, 255], 0, W, 120, 240),
    lastWord: bandContrast(img, [255, 255, 255], Math.round(W * 0.40), Math.round(W * 0.54), 120, 240),
    leadingWords: bandContrast(img, [255, 255, 255], 0, Math.round(W * 0.38), 120, 240),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// =====================================================================
// case-02: marble. Dark slate text #1b1b1b over a pale-grey marble with
// thin BRIGHT-WHITE veins. Most marble is mid/dark enough that dark text passes;
// a thin pale vein runs behind specific letters -> the vein pixels give the LEAST
// contrast against dark text? No: dark text vs WHITE vein = HIGH contrast.
// F83 ex.1 is the inverse: the confusion is dark LINES behind dark text.
// So: DARK marble base (dark text would fail everywhere) is wrong.
// Correct F83-"lines cross behind letters": dark text over LIGHT marble, but a
// DARK vein streak crosses some letters -> dark vein vs dark text = LOW contrast.
// =====================================================================
(() => {
  const W = 1100, H = 360;
  const img = save('bg-02-marble.png', W, H, (x, y) => {
    // light marble base ~ #ece7df with subtle warm mottle
    const mottle = (valueNoise(x, y, 90, 3) - 0.5) * 18;
    let r = 236 + mottle, g = 231 + mottle, b = 223 + mottle * 0.8;
    // A bold dark vein that MEANDERS DOWN THE LEFT HALF, where the multi-line caption sits,
    // so it crosses some glyphs on every line — exactly F83's "lines cross behind letters"
    // (an F can read as an E) — while the rest of the pale marble keeps dark text legible.
    // The vein x stays within ~0.20-0.52 of the width as it descends, weaving across the
    // caption column. Vein darkens toward ~#43403a (dark glyph vs dark vein ~1.7:1).
    const yf = y / H;
    const cx = (0.34 + 0.12 * Math.sin(yf * 7.5) + 0.06 * Math.sin(yf * 19)) * W;
    const dist = Math.abs(x - cx);
    const veinW = 15 + 5 * Math.sin(y / 40);
    if (dist < veinW) {
      const k = Math.pow(1 - dist / veinW, 0.6);
      r = lerp(r, 64, k); g = lerp(g, 61, k); b = lerp(b, 55, k);
    }
    // a faint secondary vein sweeping the empty right half (cosmetic only)
    const v2 = lerp(0.62 * W, 0.95 * W, yf) + 24 * Math.sin(y / 55);
    if (Math.abs(x - v2) < 4) { r -= 22; g -= 22; b -= 20; }
    return [r, g, b];
  });
  // sample a diagonal strip following the vein vs the clean marble away from it
  results['02'] = {
    full: bandContrast(img, [27, 27, 27], 0, W, 100, 260),
    onVein: bandContrast(img, [27, 27, 27], Math.round(W * 0.40), Math.round(W * 0.60), 150, 210),
    cleanMarble: bandContrast(img, [27, 27, 27], Math.round(W * 0.0), Math.round(W * 0.12), 100, 160),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// =====================================================================
// case-03: zellige geometric tile (Arabic RTL invitation). White text.
// Most tiles deep teal/cobalt (white passes); a band of PALE-SAND tiles on the
// reading-start (right) side sits behind the first Arabic letters -> white washes out.
// =====================================================================
(() => {
  const W = 1000, H = 340;
  const img = save('bg-03-zellige.png', W, H, (x, y) => {
    // 8-fold star tessellation approximated by overlapping sine lattices
    const a = Math.sin(x / 26) * Math.sin(y / 26);
    const bb = Math.sin((x + y) / 30) * Math.sin((x - y) / 30);
    const star = (a + bb) / 2; // -1..1
    // colour by region: right third (RTL start) = pale sand; rest deep teal/cobalt
    const xf = x / W;
    let col;
    if (xf > 0.66) {
      // pale sand/cream tiles
      const t = (star + 1) / 2;
      col = [lerp(232, 214, t), lerp(220, 198, t), lerp(190, 168, t)];
    } else {
      // deep teal & cobalt alternating
      const t = (star + 1) / 2;
      col = [lerp(12, 26, t), lerp(70, 52, t), lerp(96, 130, t)];
    }
    // grout lines darken
    const grout = (Math.abs(((x % 52) - 26)) < 2 || Math.abs(((y % 52) - 26)) < 2) ? 0.55 : 0;
    return [lerp(col[0], 30, grout), lerp(col[1], 30, grout), lerp(col[2], 28, grout)];
  });
  results['03'] = {
    full: bandContrast(img, [255, 255, 255], 0, W, 120, 230),
    rtlStart: bandContrast(img, [255, 255, 255], Math.round(W * 0.66), W, 120, 230),
    tealBody: bandContrast(img, [255, 255, 255], 0, Math.round(W * 0.6), 120, 230),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// =====================================================================
// case-04: alternating ceramic tiles (restaurant menu). Dark text #222.
// Tiles alternate light-cream / mid-terracotta horizontally so EVERY OTHER
// character sits over a tile too light? No — dark text over light = fine.
// Need alternating where odd tiles are DARK enough to fail dark text. Use
// alternating CREAM (#ece2cf, dark text passes) and CHARCOAL-GLAZE (#3a3530,
// dark text fails). Each tile width ~ one character advance.
// =====================================================================
(() => {
  const W = 1120, H = 300;
  const tileW = 56; // ~ one menu-letter advance at the chosen font size
  const img = save('bg-04-tiles.png', W, H, (x, y) => {
    const col = Math.floor(x / tileW);
    const dark = col % 2 === 1;
    const mottle = (valueNoise(x, y, 40, 9) - 0.5) * (dark ? 16 : 22);
    let base = dark ? [58, 53, 48] : [236, 226, 207];
    // subtle glaze sheen toward tile center
    const inTile = (x % tileW) / tileW;
    const sheen = (1 - Math.abs(inTile - 0.5) * 2) * (dark ? 10 : -6);
    // grout
    const grout = (x % tileW < 2 || (y % tileW) < 2) ? 0.5 : 0;
    let r = base[0] + mottle + sheen, g = base[1] + mottle + sheen, b = base[2] + mottle + sheen;
    return [lerp(r, 92, grout), lerp(g, 86, grout), lerp(b, 78, grout)];
  });
  results['04'] = {
    full: bandContrast(img, [34, 34, 34], 0, W, 110, 200),
    darkTiles: bandContrast(img, [34, 34, 34], tileW, tileW * 2, 110, 200),
    lightTiles: bandContrast(img, [34, 34, 34], 0, tileW, 110, 200),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// =====================================================================
// case-05: cityscape news hero, dark LEFT third / bright RIGHT two-thirds.
// White headline with text-shadow. Shadow rescues over dark third; over bright
// third the white-on-near-white fails even WITH shadow (shadow only helps at glyph
// edges, the least-contrast pixel is the flat bright sky just inside thin strokes).
// We bake a sky gradient: dark buildings left, blown-out overcast sky right.
// =====================================================================
(() => {
  const W = 1280, H = 380;
  const img = save('bg-05-cityscape.png', W, H, (x, y) => {
    const xf = x / W, yf = y / H;
    // sky: dark stormy left third stays DARK (white+shadow passes), then ramps fast to a
    // blown-out overcast right two-thirds (white fails even with the text-shadow). Pushed
    // brighter (250-ish) so the least-contrast interior pixel under the right words is ~1:1.
    const ramp = Math.max(0, (xf - 0.30) / 0.40); // fully bright by ~70% width
    let r = lerp(24, 252, Math.pow(Math.min(1, ramp), 0.8)) + lerp(12, 0, yf);
    let g = lerp(30, 252, Math.pow(Math.min(1, ramp), 0.8)) + lerp(12, 0, yf);
    let b = lerp(44, 252, Math.pow(Math.min(1, ramp), 0.78)) + lerp(10, 0, yf);
    // building silhouettes along the bottom (dark) — pseudo skyline
    const bh = 0.45 * H * (0.6 + 0.4 * valueNoise(x, 0, 120, 11));
    if (y > H - bh) {
      const dk = 22 + 18 * valueNoise(x, y, 30, 12);
      // windows
      const win = (Math.floor(x / 14) % 3 === 0 && Math.floor(y / 18) % 2 === 0) ? 60 : 0;
      r = dk + win; g = dk + win; b = dk + 6 + win;
    }
    const n = (valueNoise(x, y, 60, 13) - 0.5) * 14;
    return [r + n, g + n, b + n];
  });
  results['05'] = {
    full: bandContrast(img, [255, 255, 255], 0, W, 90, 200),
    brightRight: bandContrast(img, [255, 255, 255], Math.round(W * 0.6), W, 90, 200),
    darkLeft: bandContrast(img, [255, 255, 255], 0, Math.round(W * 0.3), 90, 200),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// =====================================================================
// case-06 (BOUNDARY PASS): same family — white text over a high-variance
// forest/aurora image — BUT a solid semi-opaque dark scrim is composited so the
// EFFECTIVE worst-case pixel behind every letter stays >= 4.5:1. We bake the scrim
// directly into the raster so worst-case is genuinely safe everywhere in the band.
// This sharpens the aspect: high variance + image bg does NOT automatically fail.
// =====================================================================
(() => {
  const W = 1100, H = 340;
  const SCRIM = 0.74; // composite toward black by this fraction inside the text band
  const bandY0 = 40, bandY1 = 300; // wide band so the full headline box is protected
  const img = save('bg-06-forest-scrim.png', W, H, (x, y) => {
    // vivid aurora-over-forest: greens/purples, high variance
    const aur = valueNoise(x, y, 80, 21);
    let r = lerp(20, 120, aur) + 30 * Math.sin(x / 90);
    let g = lerp(60, 220, aur);
    let b = lerp(40, 160, aur) + 40 * valueNoise(x, y, 30, 22);
    // bright moon patch (would normally threaten white text)
    const d = Math.hypot(x - 0.5 * W, y - 0.35 * H) / (0.3 * H);
    const moon = Math.max(0, 1 - d);
    r += moon * 150; g += moon * 150; b += moon * 150;
    // composite the scrim ONLY within (and feathered around) the text band
    let s = 0;
    if (y >= bandY0 && y <= bandY1) s = SCRIM;
    else {
      const dd = Math.min(Math.abs(y - bandY0), Math.abs(y - bandY1));
      s = Math.max(0, SCRIM - dd / 60 * SCRIM);
    }
    r = lerp(r, 0, s); g = lerp(g, 0, s); b = lerp(b, 0, s);
    // Hard ceiling inside the band: clamp the brightest scrimmed pixel so white text
    // keeps >= ~5:1 everywhere behind the letters (the deliberate PASS guarantee).
    if (y >= bandY0 && y <= bandY1) {
      const CAP = 88; // white(#fff) vs grey 88 ~ 5.0:1
      r = Math.min(r, CAP); g = Math.min(g, CAP); b = Math.min(b, CAP);
    }
    return [r, g, b];
  });
  results['06'] = {
    full: bandContrast(img, [255, 255, 255], 0, W, bandY0, bandY1),
    dataUri: img.dataUri, sizeKB: img.sizeKB,
  };
})();

// ---------- report + emit data URIs to a json for the page builder ----------
const summary = {};
for (const k of Object.keys(results)) {
  const r = results[k];
  const { dataUri, sizeKB, ...metrics } = r;
  summary[k] = { sizeKB, ...metrics };
}
console.log(JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(OUT, '_datauris.json'),
  JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.dataUri])), null, 0));
console.log('\nwrote _datauris.json and bg-*.png');
