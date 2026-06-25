'use strict';
// Perceptual crop-hash for the STABILITY PROBES (not production). Raw-byte SHA over a PNG is all-or-nothing: a 1/255
// flip on one anti-aliased edge pixel (the diagnosed GPU rasterization LSB noise, R2.2e/Q2) yields a totally different
// hash, so the drift metric OVER-COUNTS sub-perceptual flicker as "drift." This hashes a perceptually downsampled +
// quantized thumbnail instead: box-average to GRID×GRID (averaging dilutes a ±1 on a few pixels to ≈0 in its cell) and
// quantize each cell to LEVELS steps (a cell must move ≥ ~256/LEVELS to flip). A real change (moved element, different
// glyph, colour shift) survives both; sub-perceptual AA noise does not. PROBE-ONLY — the LLM still gets the raw crop.
const zlib = require('zlib');
const crypto = require('crypto');

// minimal PNG decoder (8-bit, colour type 0/2/4/6, single IDAT chain) — same as png-diff.js.
function decodePng(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(String(buf || ''), 'base64');
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, ihdr = null; const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8); const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] };
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error('no IHDR');
  if (ihdr.bitDepth !== 8) throw new Error('only 8-bit supported');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  const { width: w, height: h } = ihdr; const stride = w * ch; const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[pos++]; const row = out.slice(y * stride, (y + 1) * stride); const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const rv = raw[pos++]; const a = x >= ch ? row[x - ch] : 0; const b = prev ? prev[x] : 0; const c = (prev && x >= ch) ? prev[x - ch] : 0;
      let v; switch (f) { case 0: v = rv; break; case 1: v = rv + a; break; case 2: v = rv + b; break; case 3: v = rv + ((a + b) >> 1); break; case 4: v = rv + paeth(a, b, c); break; default: throw new Error('bad filter ' + f); }
      row[x] = v & 0xff;
    }
  }
  return { w, h, ch, data: out };
}

// Quantized thumbnail (the comparable representation). Returns a Uint8Array of GRID*GRID luminance levels.
function thumbnail(base64OrBuffer, { grid = 32, levels = 16 } = {}) {
  const { w, h, ch, data } = decodePng(base64OrBuffer);
  const cells = new Uint8Array(grid * grid);
  for (let gy = 0; gy < grid; gy++) for (let gx = 0; gx < grid; gx++) {
    const x0 = Math.floor(gx * w / grid), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * w / grid));
    const y0 = Math.floor(gy * h / grid), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * h / grid));
    let sum = 0, n = 0;
    for (let y = Math.min(y0, h - 1); y < Math.min(y1, h); y++) for (let x = Math.min(x0, w - 1); x < Math.min(x1, w); x++) {
      const i = (y * w + x) * ch; const r = data[i], g = ch > 1 ? data[i + 1] : r, b = ch > 2 ? data[i + 2] : r;
      sum += r * 0.299 + g * 0.587 + b * 0.114; n++;
    }
    const avg = n ? sum / n : 0;
    cells[gy * grid + gx] = Math.min(levels - 1, Math.round(avg / 256 * (levels - 1))); // quantize to `levels` steps
  }
  return cells;
}

// Perceptual hash: SHA over the quantized thumbnail. Two crops differing only by sub-perceptual AA → same hash.
function perceptualHash(base64OrBuffer, opts = {}) {
  let cells; try { cells = thumbnail(base64OrBuffer, opts); } catch (e) { return 'PHASH_ERR'; }
  return crypto.createHash('sha256').update(Buffer.from(cells)).digest('hex').slice(0, 16);
}

module.exports = { decodePng, thumbnail, perceptualHash };
