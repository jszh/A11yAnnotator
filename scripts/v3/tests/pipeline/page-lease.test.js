// withLanePage — the uniform per-lane page source. Verifies the preference order (allocator → shared browser →
// own launch) and that the page is always returned/closed, even when the body throws. No Chrome (mocks).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withLanePage } = require('../../lib/page-lease.js');

test('withLanePage: uses the shared ALLOCATOR (acquire/release) when given; releases even on throw', async () => {
  let acquired = 0, released = 0;
  const lease = { page: { id: 'p' }, release: async () => { released++; } };
  const tabAllocator = { acquire: async () => { acquired++; return lease; } };
  const r = await withLanePage({ tabAllocator }, async (page) => { assert.equal(page.id, 'p'); return 'ok'; });
  assert.equal(r, 'ok');
  assert.equal(acquired, 1); assert.equal(released, 1);
  await assert.rejects(() => withLanePage({ tabAllocator }, async () => { throw new Error('boom'); }), /boom/);
  assert.equal(released, 2, 'the allocator lease is released even when the lane body throws');
});

test('withLanePage: falls back to a shared BROWSER (own tab, closed after) when no allocator is given', async () => {
  let newPages = 0, closes = 0;
  const browser = { newPage: async () => { newPages++; return { close: async () => { closes++; } }; } };
  const out = await withLanePage({ browser }, async (page) => { assert.ok(page); return 7; });
  assert.equal(out, 7);
  assert.equal(newPages, 1); assert.equal(closes, 1);
  await assert.rejects(() => withLanePage({ browser }, async () => { throw new Error('x'); }), /x/);
  assert.equal(closes, 2, 'the shared-browser tab is closed even when the lane body throws');
});

test('withLanePage: allocator takes precedence over a browser when both are supplied', async () => {
  let viaAlloc = false, viaBrowser = false;
  const tabAllocator = { acquire: async () => { viaAlloc = true; return { page: {}, release: async () => {} }; } };
  const browser = { newPage: async () => { viaBrowser = true; return { close: async () => {} }; } };
  await withLanePage({ tabAllocator, browser }, async () => {});
  assert.ok(viaAlloc && !viaBrowser, 'the shared allocator (global cap + timer-pause) wins over a bare browser');
});
