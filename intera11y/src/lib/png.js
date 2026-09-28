'use strict';
// Minimal PNG codec (8-bit, non-interlaced, grey/RGB/RGBA — what Chrome's screenshots are) plus the three image
// operations the probes need: crop, pixel diff, and region statistics.
const zlib = require('zlib');

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function decode(buf) {
  if (typeof buf === 'string') buf = Buffer.from(buf, 'base64');
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace) throw new Error(`unsupported PNG (depth ${bitDepth}, interlace ${interlace})`);
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!ch) throw new Error(`unsupported colour type ${colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride); const cur = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4, s = x * ch;
      if (ch === 1 || ch === 2) { out[o] = out[o + 1] = out[o + 2] = cur[s]; out[o + 3] = ch === 2 ? cur[s + 1] : 255; }
      else { out[o] = cur[s]; out[o + 1] = cur[s + 1]; out[o + 2] = cur[s + 2]; out[o + 3] = ch === 4 ? cur[s + 3] : 255; }
    }
    cur.copy(prev);
  }
  return { width, height, data: out };
}

const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encode(img) {
  const { width, height, data } = img;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

function crop(img, r) {
  const x0 = Math.min(img.width - 1, Math.max(0, Math.floor(r.x))), y0 = Math.min(img.height - 1, Math.max(0, Math.floor(r.y)));
  const x1 = Math.min(img.width, Math.ceil(r.x + r.w)), y1 = Math.min(img.height, Math.ceil(r.y + r.h));
  const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h && y0 + y < img.height; y++) img.data.copy(data, y * w * 4, ((y0 + y) * img.width + x0) * 4, ((y0 + y) * img.width + x0 + w) * 4);
  return { width: w, height: h, data };
}

const cropBase64 = (img, r) => encode(crop(img, r)).toString('base64');

// Pixel difference between two same-size images: count of changed pixels, their bounding box, and the mean and
// max colour distance (Euclidean RGB, 0..441) over changed pixels. `tol` ignores anti-aliasing noise.
function diff(a, b, tol = 24) {
  if (a.width !== b.width || a.height !== b.height) return null;
  let n = 0, sum = 0, max = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      const o = (y * a.width + x) * 4;
      const dr = a.data[o] - b.data[o], dg = a.data[o + 1] - b.data[o + 1], db = a.data[o + 2] - b.data[o + 2];
      const d = Math.sqrt(dr * dr + dg * dg + db * db);
      if (d > tol) { n++; sum += d; if (d > max) max = d; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    }
  }
  return { changed: n, meanDelta: n ? Math.round(sum / n) : 0, maxDelta: Math.round(max), bbox: n ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null };
}

// Changed pixels inside a rectangle (e.g. the element box grown by a margin).
function diffIn(a, b, r, tol = 24) {
  const ca = crop(a, r), cb = crop(b, r);
  return diff(ca, cb, tol);
}

// Of the pixels focus changed inside `r`, the fraction whose new colour already existed unchanged within `radius`
// pixels in the unfocused rendering — an indicator that only extends existing same-coloured structure (a black
// ring drawn against a black border) and so does not stand out from it.
function camouflage(focused, unfocused, r, tol = 24, radius = 3) {
  const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(focused.width, Math.ceil(r.x + r.w)), y1 = Math.min(focused.height, Math.ceil(r.y + r.h));
  const W = focused.width, F = focused.data, U = unfocused.data;
  const dist = (A, i, B, j) => { const a = A[i] - B[j], b = A[i + 1] - B[j + 1], c = A[i + 2] - B[j + 2]; return Math.sqrt(a * a + b * b + c * c); };
  let changed = 0, merged = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * W + x) * 4;
    if (dist(F, o, U, o) <= tol) continue;
    changed++;
    let found = false;
    for (let dy = -radius; dy <= radius && !found; dy++) for (let dx = -radius; dx <= radius && !found; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= focused.height) continue;
      const q = (ny * W + nx) * 4;
      if (dist(F, q, U, q) > tol) continue;          // neighbour itself changed
      if (dist(F, o, U, q) <= tol) found = true;       // the new colour was already there, unchanged
    }
    if (found) merged++;
  }
  return changed ? +(merged / changed).toFixed(3) : 0;
}

module.exports = { decode, encode, crop, cropBase64, diff, diffIn, camouflage };
