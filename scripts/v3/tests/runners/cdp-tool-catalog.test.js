'use strict';
// The prompt-facing tool catalog (cdp-tool-catalog.js) must stay in sync with the tools actually registered
// in cdp-tools.js buildCdpToolServer — otherwise the judge is told about a tool it cannot call (or a real
// tool is never surfaced for any SC). This cross-checks NAMES by source, and the SC→tool selection logic.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { TOOL_CATALOG, toolsForSubject, renderToolGuidance } = require('../../lib/cdp-tool-catalog.js');

// the tool names actually registered in the live server (string-literal first arg of each tool(...) call).
const registered = (() => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'cdp-tools.js'), 'utf8');
  const out = new Set();
  for (const m of src.matchAll(/\btool\(\s*'([a-z_]+)'/g)) out.add(m[1]);
  return out;
})();

test('every catalog tool name is a REGISTERED cdp tool (no uncallable tool in the prompt)', () => {
  assert.ok(registered.size >= 12, `expected the cdp tool server to register many tools, found ${registered.size}`);
  for (const t of TOOL_CATALOG) {
    assert.ok(registered.has(t.name), `catalog tool "${t.name}" is NOT registered in cdp-tools.js buildCdpToolServer (drift — the judge would be told about a tool it cannot call)`);
  }
});

test('the new capture_full_page tool is both registered and in the catalog', () => {
  assert.ok(registered.has('capture_full_page'), 'capture_full_page must be registered');
  assert.ok(TOOL_CATALOG.some((t) => t.name === 'capture_full_page'), 'capture_full_page must be in the catalog');
});

test('SC-primary selection: the right tools surface per guideline', () => {
  const names = (sc, skill) => toolsForSubject(sc, skill).map((t) => t.name);
  assert.deepEqual(names('2.4.4', 'name-role-state').sort(), ['query_ax_node', 'resolve_destination'], '2.4.4 → link-destination + AX');
  assert.ok(names('2.4.10', 'page-structure').includes('capture_full_page'), '2.4.10 → full-page');
  assert.ok(names('1.4.3', 'color-and-visual-text').includes('resolve_part_color'), '1.4.3 → backdrop pixel');
  // resolve_destination must NOT leak onto every name-role-state SC (it is SC-2.4.4-only, no skill key)
  assert.ok(!names('4.1.2', 'name-role-state').includes('resolve_destination'), 'resolve_destination must stay 2.4.4-only');
  // an SC no tool maps to → nothing
  assert.deepEqual(names('2.2.2', 'timing-and-motion'), [], '2.2.2 has no mapped tool');
});

test('renderToolGuidance: null when empty, directive + tool lines when not', () => {
  assert.equal(renderToolGuidance([]), null);
  assert.equal(renderToolGuidance(toolsForSubject('2.2.2', null)), null);
  const g = renderToolGuidance(toolsForSubject('2.4.4', 'name-role-state'));
  assert.match(g, /LIVE INSPECTION TOOLS/);
  assert.match(g, /resolve_destination\(/);
  assert.match(g, /absence ≠ pass/);
});
