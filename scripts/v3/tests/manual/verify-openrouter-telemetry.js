'use strict';
// Real browser handler + deterministic model replies: verifies telemetry without an API charge.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const { assetFileUrl } = require('../../../lib/asset-paths');
const { CHROME } = require('../../lib/run-experiments');
const { BROWSER_ARGS } = require('../../lib/browser-args');
const { setStateAndCapture } = require('../../lib/cdp-tools');
const { makeOpenRouterToolTransport } = require('../../lib/llm-agent-adapter');
const { newToolAccumulator, recordToolTrace } = require('../../lib/tool-telemetry');
const out = path.resolve(process.argv[2] || '/tmp/openrouter-telemetry-probe');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: BROWSER_ARGS });
  try {
    const freshClone = async () => { const p = await browser.newPage(); await p.goto(assetFileUrl('fx-v3-cdp-tools.html')); return p; };
    const page = await freshClone();
    const acc = newToolAccumulator(), events = [];
    let turn = 0, observed;
    const transport = makeOpenRouterToolTransport({ apiKey: 'mock', model: 'deterministic-probe', maxTurns: 3,
      dispatch: { declarations: [{ name: 'set_state_and_capture', description: 'Capture actual focus', parameters: { type: 'object' } }],
        call: async (name, args) => { assert.equal(name, 'set_state_and_capture'); observed = await setStateAndCapture(page, args, { freshClone }); return observed; } },
      onTraceSink: e => { events.push(e); recordToolTrace(acc, e); },
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ usage: { prompt_tokens: 1, completion_tokens: 1 },
        choices: [{ message: turn++ === 0 ? { tool_calls: [{ id: 'focus-probe', type: 'function', function: { name: 'set_state_and_capture', arguments: JSON.stringify({ targetXpath: '/html[1]/body[1]/button[2]', state: 'focus' }) } }] } : { content: 'Focus captured' } }] }) }),
    });
    assert.equal(await transport({ messages: [{ content: [{ type: 'text', text: 'Focus the fixture button' }] }] }), 'Focus captured');
    assert.equal(observed.stateReached, true);
    assert.equal(observed.pixelsChanged, true);
    assert.equal(acc.calls, 1);
    assert.equal(acc.byName.set_state_and_capture, 1);
    assert.equal(events.flatMap(e => e.blocks || []).filter(b => b.kind === 'tool_result').length, 1);
    for (const state of ['before', 'after']) fs.writeFileSync(path.join(out, state + '.png'), Buffer.from(observed.screenshots[state], 'base64'));
    fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({ telemetry: acc, stateReached: observed.stateReached, styleDelta: observed.styleDelta, events }, null, 2));
    console.log(JSON.stringify({ out, telemetry: acc, stateReached: observed.stateReached, styleDelta: observed.styleDelta }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
