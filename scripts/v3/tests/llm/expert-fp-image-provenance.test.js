// Expert-study FP root cause (docs/analysis/EXPERT-FP-ROOT-CAUSE-2026-09-25.md) C3 — raster provenance signals.
// An <img> that never loaded is not evidence of its content, and live HTML text painted over the image box is
// not in the raster. Both reach the judge as explicit signals; a loaded image with no overlay adds neither.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

test('C3 image provenance: unloaded raster + HTML overlay text are surfaced; a loaded plain image adds nothing', () => {
  const broken = precomputeSignals({ xpath: '/html/body/img[1]', tag: 'img', isImage: true, imgRender: { loaded: false, overlayText: ['SHOP NOW'] } }, 'image-content', '1.4.5');
  assert.equal(broken.imageNotLoaded && broken.imageNotLoaded.value, true);
  assert.deepEqual(broken.htmlTextOverImage && broken.htmlTextOverImage.strings, ['SHOP NOW']);
  const fine = precomputeSignals({ xpath: '/html/body/img[2]', tag: 'img', isImage: true, imgRender: { loaded: true, overlayText: [] } }, 'image-content', '1.4.5');
  assert.equal(fine.imageNotLoaded, undefined);
  assert.equal(fine.htmlTextOverImage, undefined);
});
