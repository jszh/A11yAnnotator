'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./page-support.js');
const F = require('./page-support-finalize.js');
const D = require('./build-page-support-semantic-discovery.js');

const page = (candidates) => ({ file: 'page.html', candidates });

test('restrictive viewport becomes a catalog-backed deterministic claim', () => {
  const row = P.candidate({
    page: 'page.html', sc: '1.4.4', kind: 'viewport-zoom-policy', xpath: '/page-level::viewport',
    status: 'barrier', detected: true, evidence: { contents: ['width=device-width, user-scalable=no'] },
  });
  const result = F.finalizePage(page([row]));
  assert.equal(result.errors.length, 0);
  assert.equal(result.obligationLedger[0].disposition, 'CLAIM');
  assert.equal(result.obligationLedger[0].cleared, false);
  assert.equal(result.deterministicFindings.length, 1);
});

test('reflow no-overflow signal remains partial because the catalog is barrier-only', () => {
  const row = P.candidate({
    page: 'page.html', sc: '1.4.10', kind: 'reflow-320', xpath: '/page-level::reflow', status: 'clear',
    evidence: { outcome: { pageRenders: true, viewportSet320: true, hydrationReady: true, reflowSettled: true, horizontalScrollPresent: false, overflowSourceLocated: false, allOverflowExemptOr2D: false, clipHidingDetected: false, overflowBarrierObserved: false, noHorizontalScrollClear: true } },
  });
  const result = F.finalizePage(page([row]));
  assert.equal(result.obligationLedger[0].disposition, 'PARTIAL');
  assert.equal(result.obligationLedger[0].autoPartial, true);
  assert.equal(result.deterministicFindings.length, 0);
});

test('meta refresh finalizes only 2.2.1 and queues 2.2.4/3.2.5 for review', () => {
  const candidates = P.metaEvidence('page.html', { refreshContents: ['5; url=/next'] });
  const result = F.finalizePage(page(candidates));
  assert.equal(result.deterministicFindings.length, 1);
  assert.equal(result.deterministicFindings[0].sc, '2.2.1');
  assert.deepEqual(result.reviewQueue.map((row) => row.sc), ['2.2.4', '3.2.5']);
});

test('duplicate atomic decisions collapse before ledger reconciliation', () => {
  const make = () => P.candidate({
    page: 'page.html', sc: '1.4.12', kind: 'important-spacing-lock', xpath: '/html/body/p[1]', status: 'barrier', detected: true,
    evidence: { outcome: { spacingApplicable: true, passConfirmed: false, barrierConfirmed: true } },
  });
  const result = F.finalizePage(page([make(), make()]));
  assert.equal(result.errors.length, 0);
  assert.equal(result.obligationLedger.length, 1);
  assert.equal(result.obligationLedger[0].duplicateCandidateCount, 2);
  assert.equal(result.exactDuplicateCandidatesCollapsed, 1);
});

test('pattern clustering groups repeated template instances without changing obligation count', () => {
  const findings = [1, 2].map((n) => ({ page: 'page.html', sc: '1.4.4', claimFamily: 'text-not-clipped-zoom', xpath: `/html/body/ul[1]/li[${n}]/div[1]`, obligationId: `o${n}` }));
  const clusters = F.issueClusters(findings);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].members, 2);
});

test('semantic discovery canonicalizes the unique body like act-page-collect', () => {
  assert.equal(D.canonicalCollectorXpath('/html/body[1]/main[1]/p[2]'), '/html/body/main[1]/p[2]');
  assert.equal(D.canonicalCollectorXpath('/html/frameset[1]/frame[1]'), '/html/frameset[1]/frame[1]');
});
