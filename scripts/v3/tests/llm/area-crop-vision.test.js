// AREA CROPS (s11 wedged-run RCA) — an `<area>` has a 0×0 client rect (UA display:none), so vision-capture's
// generic probe returned { box: null } for every image-map subject: the `area[href]` obligations minted (6 on
// an image-map page vs 1 before) and produced ZERO judgments, because the adjudicator's required-evidence gate
// silently abstains a crop-less subject. The fix resolves the area's owning `<map name>` → the visible
// `img[usemap]` bound to it and crops the AREA's coords geometry ON that image; the surrounding-region for an
// area is the WHOLE owning img. This file is the PURE-NODE half: the coords parser (module-level, single-
// sourced — safeInstallResolver injects the same function into the page) and the captureVision clip plumbing
// over a mock page. The in-browser half lives in area-crop-vision.browser.test.js (pending the lead gate).
//
// Fixtures are invented and generic — none is derived from any corpus page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.V3_SETTLE_WAIT = '0'; // skip awaitSettle's page.evaluate — isolates the mock to scroll/probe/screenshot

const { areaCoordsToRect, captureVision } = require('../../lib/vision-capture.js');

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — areaCoordsToRect: shape/coords → image-local bounding box
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 rect: x1,y1,x2,y2 → left/top/width/height', () => {
  assert.deepEqual(areaCoordsToRect('rect', '10,20,110,80'), { x: 10, y: 20, w: 100, h: 60 });
});

test('§1 rect: reversed corners normalize (x2<x1, y2<y1)', () => {
  assert.deepEqual(areaCoordsToRect('rect', '110,80,10,20'), { x: 10, y: 20, w: 100, h: 60 });
});

test('§1 rect: whitespace / semicolon separators and a missing shape attribute (defaults to the rect state)', () => {
  assert.deepEqual(areaCoordsToRect(null, '10 20 110 80'), { x: 10, y: 20, w: 100, h: 60 });
  assert.deepEqual(areaCoordsToRect('', ' 10 ; 20 ; 110 ; 80 '), { x: 10, y: 20, w: 100, h: 60 });
  assert.deepEqual(areaCoordsToRect('RECT', '10,  20,110 ,80'), { x: 10, y: 20, w: 100, h: 60 });
});

test('§1 rect: zero-area and insufficient coords are degenerate → null (caller falls back to the whole img)', () => {
  assert.equal(areaCoordsToRect('rect', '10,20,10,80'), null, 'zero width');
  assert.equal(areaCoordsToRect('rect', '10,20,110,20'), null, 'zero height');
  assert.equal(areaCoordsToRect('rect', '10,20,110'), null, 'three coords');
  assert.equal(areaCoordsToRect('rect', ''), null, 'empty coords');
});

test('§1 circle: cx,cy,r → the bounding box of the circle', () => {
  assert.deepEqual(areaCoordsToRect('circle', '50,60,20'), { x: 30, y: 40, w: 40, h: 40 });
});

test('§1 circle: non-positive radius / missing radius → null', () => {
  assert.equal(areaCoordsToRect('circle', '50,60,0'), null);
  assert.equal(areaCoordsToRect('circle', '50,60,-5'), null);
  assert.equal(areaCoordsToRect('circle', '50,60'), null);
});

test('§1 poly: min/max over the coordinate pairs', () => {
  assert.deepEqual(areaCoordsToRect('poly', '0,0, 100,10, 50,90'), { x: 0, y: 0, w: 100, h: 90 });
});

test('§1 poly: an odd trailing token is dropped, not fatal', () => {
  assert.deepEqual(areaCoordsToRect('poly', '0,0, 100,10, 50,90, 7'), { x: 0, y: 0, w: 100, h: 90 });
});

test('§1 poly: fewer than three vertices, or a degenerate (collinear-flat) span → null', () => {
  assert.equal(areaCoordsToRect('poly', '0,0, 100,10'), null, 'two vertices');
  assert.equal(areaCoordsToRect('poly', '0,5, 50,5, 100,5'), null, 'zero-height polygon');
});

test('§1 garbage: non-numeric tokens anywhere → null (never a NaN box)', () => {
  assert.equal(areaCoordsToRect('rect', 'a,b,c,d'), null);
  assert.equal(areaCoordsToRect('rect', '10,20,oops,80'), null);
  assert.equal(areaCoordsToRect('poly', '0,0, x,10, 50,90'), null);
  assert.equal(areaCoordsToRect('circle', '50,60,NaN'), null);
});

test('§1 shape=default and unknown shape keywords → null (the whole-image fallback is the caller\'s)', () => {
  assert.equal(areaCoordsToRect('default', ''), null);
  assert.equal(areaCoordsToRect('default', '10,20,110,80'), null, 'default ignores coords entirely');
  assert.equal(areaCoordsToRect('hexagon', '10,20,110,80'), null);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — captureVision clip plumbing over a mock page: an area-shaped probe result ({ box, surround })
//      pads the AREA box for the element-crop and crops the WHOLE owning img for the surrounding-region
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// box = the area's region on the img; surround = the whole img — both TOP-PAGE viewport-relative with the
// scroll offsets the #10d fix adds only at the final clip.
const AREA_BOX = { x: 100, y: 50, w: 40, h: 30, vw: 1280, vh: 900, scrollX: 7, scrollY: 1000 };
const IMG_BOX = { x: 60, y: 20, w: 300, h: 150, vw: 1280, vh: 900, scrollX: 7, scrollY: 1000 };

function makeMockPage(probeResult) {
  const clips = [];
  return {
    clips,
    viewport: () => ({ width: 1280, height: 900 }),
    setViewport: async () => {},
    evaluate: async () => probeResult, // resolver-install / scroll returns are unused; the probe needs this shape
    screenshot: async (opts) => { clips.push((opts && opts.clip) || null); return 'ZmFrZS1wbmc='; },
  };
}

test('§2 an area probe result routes the element-crop to the AREA box (pad 2, document-relative)', async () => {
  const page = makeMockPage({ box: AREA_BOX, surround: IMG_BOX });
  const out = await captureVision(page, ['/html/body/map[1]/area[1]'], { states: ['element-crop', 'surrounding-region'] });
  assert.ok(out['/html/body/map[1]/area[1]'], 'the area subject produced evidence at all — the 0×0 bail is gone');
  assert.equal(out['/html/body/map[1]/area[1]']['element-crop'], 'ZmFrZS1wbmc=');
  // element-crop = area box padded by 2, shifted by scrollX/scrollY (the #10d document-relative rule)
  assert.deepEqual(page.clips[0], { x: (100 - 2) + 7, y: (50 - 2) + 1000, width: 44, height: 34 });
});

test('§2 ...and the surrounding-region to the WHOLE owning img, not a pad around the area', async () => {
  const page = makeMockPage({ box: AREA_BOX, surround: IMG_BOX });
  await captureVision(page, ['/html/body/map[1]/area[1]'], { states: ['element-crop', 'surrounding-region'] });
  const sr = page.clips[1];
  // img box padded by the standard pad (24), clamped in viewport space, then document-shifted: the whole
  // 300×150 img is inside the clip.
  assert.deepEqual(sr, { x: (60 - 24) + 7, y: 0 + 1000, width: 300 + 48, height: Math.min(150 + 48, 900) });
  assert.ok(sr.x <= IMG_BOX.x + IMG_BOX.scrollX && sr.width >= IMG_BOX.w, 'contains the full img width');
});

test('§2 NO OVER-CORRECTION: a probe result WITHOUT `surround` (every non-area element) keeps the padded element rectangle', async () => {
  const page = makeMockPage({ box: AREA_BOX });
  await captureVision(page, ['/html/body/div[1]'], { states: ['element-crop', 'surrounding-region'] });
  assert.deepEqual(page.clips[1], { x: (100 - 24) + 7, y: (50 - 24) + 1000, width: 40 + 48, height: 30 + 48 },
    'surrounding-region is the element box + pad, exactly as before the area fix');
});

test('§2 an area with no visible owning img stays { box: null } → flagged __nonVisual, no fabricated crop', async () => {
  const page = makeMockPage({ box: null });
  const out = await captureVision(page, ['/html/body/map[1]/area[1]'], { states: ['element-crop', 'surrounding-region'] });
  assert.deepEqual(out['/html/body/map[1]/area[1]'], { __nonVisual: '1' });
  assert.deepEqual(page.clips, [], 'no screenshot was attempted');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — source-level pins: the in-page halves that a mock cannot execute
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'vision-capture.js'), 'utf8');

test('§3 the resolver bundle installs __v3AreaBox + __v3AreaOwnerImg, and safeInstallResolver injects the SAME parser the tests exercise', () => {
  assert.match(SRC, /window\.__v3AreaBox = function/, 'the area geometry resolver is installed in-page');
  assert.match(SRC, /window\.__v3AreaOwnerImg = areaOwnerImg/, 'the owning-img resolver is installed in-page');
  assert.match(SRC, /'window\.__v3AreaCoordsRect = ' \+ areaCoordsToRect\.toString\(\)/,
    'the coords parser is injected from the module-level function — one source of truth, no in-page duplicate');
  assert.match(SRC, /window\.__v3AreaCoordsRect === 'function'/, '__v3AreaBox consumes the injected parser');
});

test('§3 the probe branches on `area` BEFORE the degenerate-box guard, and the scroll step retargets the owning img', () => {
  const probeIdx = SRC.indexOf('return a ? { box: a.box, surround: a.imgBox } : { box: null };');
  const degenerateIdx = SRC.indexOf('a DEGENERATE box (either dim < 6px');
  assert.ok(probeIdx > 0 && degenerateIdx > 0 && probeIdx < degenerateIdx,
    'the area branch precedes the min-dim bail that used to swallow every 0×0 area');
  assert.match(SRC, /surround: a\.imgBox/, 'the whole owning img rides out as the surrounding-region box');
  assert.match(SRC, /__v3AreaOwnerImg\(el\); if \(img\) el = img/, 'scrollIntoView targets the img, not the display:none area');
});

test('§3 DO-NOT-DISTURB: nsXPath stays wired at its two existing call sites', () => {
  const hits = SRC.match(/const xp = nsXPath\(xpRaw\)/g) || [];
  assert.equal(hits.length, 2, 'both nsXPath(xpRaw) sites (captureVision + captureStateVision) are intact');
});
