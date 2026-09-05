'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt } = require('../../lib/llm-adjudicator.js');

const MARKER = '--- case-specific evidence (not part of the reusable prefix) ---';

test('Gemini cache prefix is byte-identical across cases that share a rubric and run configuration', () => {
  const opts = { rubric: 'Shared SC-specific rubric text.', toolsEnabled: true };
  const a = buildPrompt({ skill: 'link-purpose', sc: '2.4.4', xpath: '/html/body/a[1]', claimFamily: 'link-purpose' },
    { axName: 'Read more', ordinal: 1 }, { text: 'Read more' }, opts);
  const b = buildPrompt({ skill: 'link-purpose', sc: '2.4.4', xpath: '/html/body/main/a[9]', claimFamily: 'context-purpose' },
    { axName: 'Details', ordinal: 9 }, { text: 'Details' }, opts);
  const [prefixA, caseA] = a.split(MARKER);
  const [prefixB, caseB] = b.split(MARKER);

  assert.equal(prefixA, prefixB, 'rubric/principles/output/tool guidance form one stable leading prefix');
  assert.match(prefixA, /cross-cutting judgment principles/);
  assert.match(prefixA, /Shared SC-specific rubric text/);
  assert.match(prefixA, /--- output ---/);
  assert.doesNotMatch(prefixA, /\/html\/body\/a\[1\]/, 'dynamic XPath is not ahead of the cache boundary');
  assert.match(caseA, /\/html\/body\/a\[1\]/);
  assert.match(caseB, /\/html\/body\/main\/a\[9\]/);
  assert.notEqual(caseA, caseB, 'case evidence remains case-specific');
});

test('original prompt-order ablation restores the pre-cache-prefix sequence', () => {
  const saved = process.env.V3_PROMPT_ORDER;
  process.env.V3_PROMPT_ORDER = 'original';
  try {
    const prompt = buildPrompt(
      { skill: 'link-purpose', sc: '2.4.4', xpath: '/html/body/a[1]', claimFamily: 'link-purpose' },
      { axName: 'Read more' },
      { text: 'Read more' },
      { rubric: 'Shared SC-specific rubric text.', toolsEnabled: true },
    );
    const at = (text) => prompt.indexOf(text);

    assert.equal(at(MARKER), -1, 'the original prompt has no cache-prefix boundary marker');
    assert.ok(at('You are the link-purpose skill') < at('--- cross-cutting judgment principles'));
    assert.ok(at('Element xpath: /html/body/a[1]') < at('--- rubric ---'));
    assert.ok(at('--- pre-computed deterministic signals') < at('--- VSR announcement'));
    assert.ok(at('--- VSR announcement') < at('--- LIVE INSPECTION TOOLS'));
    assert.ok(at('--- LIVE INSPECTION TOOLS') < at('--- output ---'));
    assert.ok(prompt.endsWith('"summary" = ONE sentence stating the verdict in plain language (for a human annotator). "reasoning" = ONE sentence citing the specific evidence that drove it.'));
  } finally {
    if (saved === undefined) delete process.env.V3_PROMPT_ORDER;
    else process.env.V3_PROMPT_ORDER = saved;
  }
});
