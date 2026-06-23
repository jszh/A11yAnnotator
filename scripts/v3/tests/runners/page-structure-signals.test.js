'use strict';
// Tier-0 #3: precomputeSignals must surface page-level structure (title/headings) onto page-level synthetic
// subjects AND the subject heading's own role/level/text/offscreen — closing the "empty stub" that made 2.4.2
// return "no title supplied" and the off-screen 2.4.6 heading read as "a plain span".
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { precomputeSignals, selectRubricSubjects } = require('../../lib/llm-adjudicator.js');

test('page-title (2.4.2) synthetic subject carries pageTitle from the threaded structure', () => {
  const el = { xpath: '/page-level::title', __pageStructure: { title: 'First title is incorrect', lang: 'en', headings: [] } };
  const s = precomputeSignals(el, 'page-structure');
  assert.deepEqual(s.pageTitle, { value: 'First title is incorrect', present: true });
  assert.equal(s.structure.title, 'First title is incorrect');
});

test('empty title ⇒ present:false (the absent-title barrier the rubric must see)', () => {
  const s = precomputeSignals({ xpath: '/page-level::title', __pageStructure: { title: '   ' } }, 'page-structure');
  assert.equal(s.pageTitle.present, false);
});

test('off-screen heading (b49b2e top:-9999px) surfaces role/level/text/isOffscreen so it is not "a plain span"', () => {
  const el = { xpath: '/html/body/span[1]', tag: 'span', roleAttr: 'heading', ariaLevel: 1, text: 'Weather', box: { x: -9999, y: 0, width: 60, height: 20 }, __pageStructure: { title: '', headings: [] } };
  const s = precomputeSignals(el, 'page-structure');
  assert.deepEqual(s.heading, { text: 'Weather', role: 'heading', ariaLevel: 1, isOffscreen: true });
});

test('an on-screen h2 derives its level from the tag and is not flagged off-screen', () => {
  const el = { xpath: '/html/body/h2[1]', tag: 'h2', text: 'Pricing', box: { x: 20, y: 400, width: 200, height: 30 } };
  const s = precomputeSignals(el, 'page-structure');
  assert.equal(s.heading.role, 'heading');
  assert.equal(s.heading.ariaLevel, 2);
  assert.equal(s.heading.isOffscreen, false);
});

test('grouping-and-reading-order (1.3.1) surfaces structure.tables (Tier-0 #4) but not pageTitle', () => {
  const tables = [{ rowCount: 2, thCount: 2, tdCount: 1, danglingIdref: false, looksLikeDataTable: true, headers: [], tdHeaderSamples: [] }];
  const el = { xpath: '/page-level::info-relationships', __pageStructure: { title: 'T', headings: [], tables } };
  const s = precomputeSignals(el, 'grouping-and-reading-order');
  assert.equal(s.pageTitle, undefined, '1.3.1 is not a title judgment');
  assert.equal(s.structure.tables.length, 1);
  assert.equal(s.structure.tables[0].thCount, 2);
});

test('a non-page-structure skill does NOT get pageTitle/heading (no leakage into per-element skills)', () => {
  const el = { xpath: '/html/body/span[1]', tag: 'span', roleAttr: 'heading', text: 'Weather', __pageStructure: { title: 'X' } };
  const s = precomputeSignals(el, 'color-and-visual-text');
  assert.equal(s.pageTitle, undefined);
  assert.equal(s.heading, undefined);
  assert.equal(s.structure, undefined);
});

test('selectRubricSubjects threads collect.structure onto page-structure rubric subjects only', () => {
  const collect = { elements: [], structure: { title: 'T', headings: [] } };
  const ledger = [{ xpath: '/page-level::title', sc: '2.4.2', claimFamily: 'page-title', autoPartial: true }];
  const rubrics = { 'page-title-v0': { id: 'page-title-v0', sc: '2.4.2', skill: 'page-structure', visionEvidence: ['viewport'] } };
  const subs = selectRubricSubjects(collect, ledger, rubrics);
  assert.equal(subs.length, 1);
  assert.equal(subs[0].element.__pageStructure.title, 'T');
});
