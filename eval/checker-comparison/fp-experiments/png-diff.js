#!/usr/bin/env node
'use strict';
// Minimal dependency-free PNG decoder + differ. Decodes two PNGs (8-bit, color type 0/2/4/6, single IDAT chain),
// unfilters scanlines, and reports WHERE they differ: bounding box of changed pixels, count, max per-channel delta,
// and a coarse ASCII map. Purpose: localize the residual vision drift (font-AA edges vs border vs whole crop).
const fs = require('fs'); const zlib = require('zlib');
function decode(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8; let ihdr = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8); const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] };
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  if (ihdr.bitDepth !== 8) throw new Error('only 8-bit supported, got ' + ihdr.bitDepth);
  const { width: w, height: h } = ihdr; const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++]; const row = out.slice(y * stride, (y + 1) * stride); const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const rawv = raw[pos++]; const a = x >= ch ? row[x - ch] : 0; const b = prev ? prev[x] : 0; const c = (prev && x >= ch) ? prev[x - ch] : 0;
      let v; switch (filter) { case 0: v = rawv; break; case 1: v = rawv + a; break; case 2: v = rawv + b; break; case 3: v = rawv + ((a + b) >> 1); break; case 4: v = rawv + paeth(a, b, c); break; default: throw new Error('bad filter ' + filter); }
      row[x] = v & 0xff;
    }
  }
  return { w, h, ch, data: out };
}
const [, , fa, fb] = process.argv;
const A = decode(fa), B = decode(fb);
if (A.w !== B.w || A.h !== B.h) { console.log(`DIMENSION MISMATCH: ${A.w}x${A.h} vs ${B.w}x${B.h} — layout shift, not AA`); process.exit(0); }
const { w, h, ch } = A;
let minX = w, minY = h, maxX = -1, maxY = -1, nDiff = 0, maxDelta = 0; let sumDelta = 0;
const map = Array.from({ length: Math.min(h, 24) }, () => '');
for (let y = 0; y < h; y++) {
  let rowHas = 0;
  for (let x = 0; x < w; x++) {
    let d = 0; for (let c = 0; c < ch; c++) d = Math.max(d, Math.abs(A.data[(y * w + x) * ch + c] - B.data[(y * w + x) * ch + c]));
    if (d > 0) { nDiff++; sumDelta += d; maxDelta = Math.max(maxDelta, d); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); rowHas = Math.max(rowHas, d); }
  }
}
console.log(`image ${w}x${h} ch${ch} | diff pixels: ${nDiff}/${w * h} (${(100 * nDiff / (w * h)).toFixed(2)}%) | maxChannelDelta: ${maxDelta} | meanDelta(of-changed): ${nDiff ? (sumDelta / nDiff).toFixed(1) : 0}`);
if (nDiff) {
  console.log(`changed bbox: x[${minX}..${maxX}] y[${minY}..${maxY}]  (w=${maxX - minX + 1} h=${maxY - minY + 1})`);
  // coarse ASCII map (downsample to <=64 cols)
  const cols = Math.min(w, 64), rows = Math.min(h, 24); const cw = w / cols, rh = h / rows;
  for (let ry = 0; ry < rows; ry++) { let line = ''; for (let cx = 0; cx < cols; cx++) { let d = 0; for (let yy = Math.floor(ry * rh); yy < Math.ceil((ry + 1) * rh); yy++) for (let xx = Math.floor(cx * cw); xx < Math.ceil((cx + 1) * cw); xx++) { for (let c = 0; c < ch; c++) d = Math.max(d, Math.abs(A.data[(yy * w + xx) * ch + c] - B.data[(yy * w + xx) * ch + c])); } line += d === 0 ? '.' : d < 16 ? ':' : d < 64 ? '+' : '#'; } console.log('  ' + line); }
}
