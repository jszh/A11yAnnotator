'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./page-support.js');

test('sensory discovery deduplicates text subjects and records matched terms', () => {
  const rows = P.sensoryCandidates('page.html', [
    { xpath: '/html/body/p[1]', text: 'Choose the round button on the right.' },
    { xpath: '/html/body/p[1]', text: 'Choose the round button on the right.' },
    { xpath: '/html/body/p[2]', text: 'Continue normally.' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sc, '1.3.3');
  assert.deepEqual(rows[0].evidence.terms.sort(), ['right', 'round']);
});

test('one delayed meta refresh creates shared barriers for three SCs', () => {
  const rows = P.metaEvidence('page.html', { refreshContents: ['5; url=/next'] });
  assert.deepEqual(rows.map((row) => row.sc), ['2.2.1', '2.2.4', '3.2.5']);
  assert.equal(rows.every((row) => row.detected && row.status === 'barrier'), true);
  assert.equal(rows.every((row) => row.evidence.actRule === 'bc659a'), true);
});

test('instant meta refresh is a shared clear under bc659a', () => {
  const rows = P.metaEvidence('page.html', { refreshContents: ['0; url=/next'] });
  assert.equal(rows.length, 3);
  assert.equal(rows.every((row) => !row.detected && row.status === 'clear'), true);
});

test('viewport restriction is a deterministic 1.4.4 barrier', () => {
  const rows = P.metaEvidence('page.html', { viewportContents: ['width=device-width, user-scalable=no'] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sc, '1.4.4');
  assert.equal(rows[0].detected, true);
});

test('summary separates coverage records from raw probe barrier signals', () => {
  const pages = [{ candidates: [
    P.candidate({ page: 'a', sc: '1.3.3', kind: 'sensory-text' }),
    P.candidate({ page: 'a', sc: '1.4.10', kind: 'reflow', status: 'barrier', detected: true }),
    P.candidate({ page: 'b', sc: '1.4.10', kind: 'reflow', status: 'clear' }),
  ] }];
  const summary = P.summarize(pages);
  assert.equal(summary.coverageRecords, 3);
  assert.equal(summary.probeBarrierSignals, 1);
  assert.equal(summary.detectedIssues, undefined);
  assert.equal(summary.bySc['1.4.10'].candidates, 2);
  assert.equal(summary.bySc['1.4.10'].pages, 2);
  assert.equal(summary.bySc['1.4.10'].detected, 1);
  assert.equal(summary.bySc['1.3.3'].review, 1);
});
