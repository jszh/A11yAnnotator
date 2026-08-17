// TEXT-LESS COLOUR-TOKEN LANE (residual RCA s10 Tier 3) — pure-node conjunct coverage. A status-dot matrix
// (empty spans coloured by class) can never form a main-lane colour-peer group: members must carry >= 2 chars
// of text and share ONE parent. The token lane buckets text-less painted elements by (tag, class token)
// ACROSS parents, gated on ALL of: >= 3 instances, >= 2 distinct backgrounds, >= 2 distinct parents, and the
// same class signature appearing inside a legend-like element that DOES carry text. It ships DISABLED: the
// lane runs only when the caller passes { tokenLane: true } (production wiring is the V3_COLOUR_TOKEN_LANE
// env flag threaded by act-page-collect.js — see HUNKS-colour-token-lane.md), and per the RCA it may not
// affect any run before the held-out aperture measurement is reviewed.
//
// collectColourPeers runs under page.evaluate, but its whole DOM surface is small enough to stub without a
// browser: document.body/querySelectorAll, getComputedStyle (incl. pseudo), and per-element tagName/
// getAttribute/parentElement/previousElementSibling/childNodes/textContent/closest/querySelector/
// getBoundingClientRect. The stub below implements exactly that surface, so every conjunct is testable
// pure-node; the in-browser mirror lives in colour-token-lane.browser.test.js (pending the lead gate).
//
// Fixtures are invented and generic — none is derived from any corpus page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { collectColourPeers } = require('../../lib/collect-colour-peers.js');

// ── minimal DOM stub ────────────────────────────────────────────────────────────────────────────────
class El {
  constructor(tag, { cls = '', role = null, ariaLabel = null, text = '', style = {}, rect = { width: 10, height: 10 } } = {}) {
    this.tagName = tag.toUpperCase();
    this._cls = cls; this._role = role; this._ariaLabel = ariaLabel;
    this._directText = text;
    this._style = Object.assign({
      display: 'block', visibility: 'visible', opacity: '1',
      color: 'rgb(17, 17, 17)', backgroundColor: 'rgba(0, 0, 0, 0)', borderTopColor: 'rgb(17, 17, 17)',
      fontWeight: '400', fontStyle: 'normal', textDecorationLine: 'none', fontSize: '16px',
      borderTopStyle: 'none', borderTopWidth: '0px',
    }, style);
    this._rect = rect;
    this.parentElement = null; this.children = [];
  }
  add(child) { child.parentElement = this; this.children.push(child); return child; }
  get previousElementSibling() {
    if (!this.parentElement) return null;
    const s = this.parentElement.children; const i = s.indexOf(this);
    return i > 0 ? s[i - 1] : null;
  }
  get childNodes() {
    const nodes = [];
    if (this._directText) nodes.push({ nodeType: 3, textContent: this._directText });
    return nodes.concat(this.children);
  }
  get textContent() { return (this._directText || '') + this.children.map((c) => c.textContent).join(''); }
  getAttribute(name) {
    if (name === 'class') return this._cls || null;
    if (name === 'role') return this._role;
    if (name === 'aria-label') return this._ariaLabel;
    return null;
  }
  closest(sel) { // the collector only ever asks for 'pre, code'
    const tags = sel.split(',').map((t) => t.trim().toUpperCase());
    for (let e = this; e; e = e.parentElement) if (tags.includes(e.tagName)) return e;
    return null;
  }
  querySelector() { return null; } // no icon/marker children in these fixtures
  getBoundingClientRect() { return { width: this._rect.width, height: this._rect.height, top: 0, left: 0 }; }
}

function withDom(body, fn) {
  const all = [];
  (function walk(e) { for (const c of e.children) { all.push(c); walk(c); } })(body);
  const doc = { body, querySelectorAll: (sel) => (sel === 'body *' ? all : []) };
  const prevDoc = global.document, prevGcs = global.getComputedStyle;
  global.document = doc;
  global.getComputedStyle = (el, pseudo) => (pseudo ? { content: 'none' } : el._style);
  try { return fn(); } finally { global.document = prevDoc; global.getComputedStyle = prevGcs; }
}

// ── fixture builders ────────────────────────────────────────────────────────────────────────────────
const GREEN = 'rgb(22, 163, 74)', AMBER = 'rgb(217, 119, 6)', RED = 'rgb(220, 38, 38)';
const dot = (bg, cls = 'dot') => new El('span', { cls, style: { display: 'inline-block', backgroundColor: bg }, rect: { width: 12, height: 12 } });

// The signature shape: a per-row matrix of text-less dots (cells carry no text) + a legend whose SAME dot
// class sits next to real words. `opts` lets each conjunct be broken one at a time.
function matrixFixture({ rows = 2, legend = true, colours = [GREEN, AMBER, RED], dotCls = 'dot' } = {}) {
  const body = new El('body');
  const grid = body.add(new El('div', { cls: 'grid' }));
  for (let r = 0; r < rows; r++) {
    const row = grid.add(new El('div', { cls: 'row' }));
    for (const c of colours) row.add(new El('div', { cls: 'cell' })).add(dot(c, dotCls));
  }
  if (legend) {
    const leg = body.add(new El('div', { cls: 'legend', text: 'Operational Degraded Down' }));
    for (const c of colours) leg.add(dot(c, dotCls));
  }
  return body;
}

const tokenGroups = (groups) => groups.filter((g) => g.tokenLane === true);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the flag: hard OFF by default
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 FLAG OFF (no argument — every current call site): the matrix produces NO group of any kind', () => {
  const groups = withDom(matrixFixture(), () => collectColourPeers());
  assert.deepEqual(groups, [], 'output is byte-identical to the pre-lane collector');
});

test('§1 FLAG OFF explicitly ({ tokenLane: false }): still nothing', () => {
  const groups = withDom(matrixFixture(), () => collectColourPeers({ tokenLane: false }));
  assert.deepEqual(groups, []);
});

test('§1 page state (window.__V3_COLOUR_TOKEN_LANE) can NEVER enable the lane — evaluate argument only', () => {
  // Batch-2 soundness review: the former window-global escape hatch let the PAGE UNDER MEASUREMENT
  // activate a quarantined lane by setting a global. The only activation path is the evaluate argument.
  global.window = { __V3_COLOUR_TOKEN_LANE: '1' };
  try {
    const groups = withDom(matrixFixture(), () => collectColourPeers());
    assert.deepEqual(tokenGroups(groups), [], 'a page-controlled global must not activate the lane');
    const withArg = withDom(matrixFixture(), () => collectColourPeers({ tokenLane: true }));
    assert.equal(tokenGroups(withArg).length, 1, 'the evaluate-argument path still works with the global set');
  } finally { delete global.window; }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — the lane, enabled: the status-dot matrix forms ONE token group in the existing payload shape
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 the matrix + legend forms exactly one token group, additive fields only', () => {
  const groups = withDom(matrixFixture(), () => collectColourPeers({ tokenLane: true }));
  const tks = tokenGroups(groups);
  assert.equal(tks.length, 1, `exactly one token group (got ${JSON.stringify(groups.map((g) => g.key))})`);
  const g = tks[0];
  assert.deepEqual(Object.keys(g).sort(), ['anchorCarriesColour', 'distinctColours', 'key', 'legendText', 'members', 'tokenLane'],
    'the existing payload shape plus tokenLane + legendText — nothing else');
  assert.match(g.key, /^token\|span\|\.dot$/, 'keyed by (tag, class token), marked as the token lane');
  assert.equal(g.distinctColours, 3);
  assert.equal(g.tokenLane, true);
  assert.match(g.legendText, /Operational Degraded Down/, 'the legend text rides on the group');
  for (const m of g.members) {
    assert.deepEqual(Object.keys(m).sort(), ['background', 'color', 'label', 'xpath'], 'member shape unchanged');
  }
  assert.ok(g.members.length >= 3, 'the matrix dots are listed');
  const parents = new Set(g.members.map((m) => m.xpath.replace(/\/span\[\d+\]$/, '')));
  assert.ok(parents.size >= 2, 'members really do span multiple parents — the shape the main lane cannot form');
});

test('§2 colour-variant modifier classes (base class + per-colour class) still form ONE group, not one per colour and not duplicates', () => {
  const body = new El('body');
  const grid = body.add(new El('div'));
  const mods = [[GREEN, 'dot ok'], [AMBER, 'dot warn'], [RED, 'dot bad']];
  for (let r = 0; r < 2; r++) {
    const row = grid.add(new El('div'));
    for (const [bg, cls] of mods) row.add(dot(bg, cls));
  }
  const leg = body.add(new El('div', { text: 'Fine Slow Failing' }));
  for (const [bg, cls] of mods) leg.add(dot(bg, cls));
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  const tks = tokenGroups(groups);
  assert.equal(tks.length, 1, `the shared base token unifies the set; per-colour buckets are colour-uniform and drop (got ${JSON.stringify(tks.map((g) => g.key))})`);
  assert.match(tks[0].key, /\.dot$/, 'the group is the shared base class');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — each conjunct failing INDIVIDUALLY kills the group
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§3 conjunct 1 (>= 3 instances): two dots total → no group', () => {
  const body = new El('body');
  body.add(new El('div', { cls: 'cell' })).add(dot(GREEN));
  body.add(new El('div', { text: 'Up' })).add(dot(RED)); // legend-adjacent, so ONLY the count conjunct fails
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), []);
});

test('§3 conjunct 2 (>= 2 distinct backgrounds): a colour-uniform token set → no group', () => {
  const groups = withDom(matrixFixture({ colours: [GREEN, GREEN, GREEN] }), () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), [], 'uniform dots encode nothing in colour');
});

test('§3 conjunct 3 (>= 2 distinct parents): all dots in ONE parent → no group', () => {
  const body = new El('body');
  const leg = body.add(new El('div', { text: 'Operational Degraded Down' }));
  for (const c of [GREEN, AMBER, RED]) leg.add(dot(c));
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), [], 'a single-parent set is a legend/swatch row on its own — the cross-parent matrix shape is the lane\'s whole point');
});

test('§3 conjunct 4 (legend): the matrix WITHOUT any text-bearing parent for the class → no group', () => {
  const groups = withDom(matrixFixture({ legend: false }), () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), [], 'no legend anywhere naming the class ⇒ avatars/spacers/bullets stay out');
});

test('§3 spacers do not count: transparent-background instances are not tokens', () => {
  const body = new El('body');
  const grid = body.add(new El('div'));
  for (let i = 0; i < 3; i++) grid.add(new El('div')).add(dot('rgba(0, 0, 0, 0)'));
  body.add(new El('div', { text: 'Legend words' })).add(dot(GREEN));
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), [], 'three transparent spacers + one painted dot = one real instance, below the floor');
});

test('§3 a NON-colour cue across instances (differing border style) → no group: the distinction survives colour loss', () => {
  const body = new El('body');
  const grid = body.add(new El('div'));
  const rows = [grid.add(new El('div')), grid.add(new El('div'))];
  rows[0].add(dot(GREEN)); rows[1].add(dot(RED));
  const ringed = dot(AMBER); ringed._style.borderTopStyle = 'solid'; ringed._style.borderTopWidth = '2px';
  rows[0].add(ringed);
  body.add(new El('div', { text: 'Key words' })).add(dot(GREEN));
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), []);
});

test('§3 text-BEARING elements never enter the token lane (they are the main lane\'s members)', () => {
  const body = new El('body');
  const grid = body.add(new El('div'));
  for (const [c, t] of [[GREEN, 'OK'], [AMBER, 'Slow'], [RED, 'Down']]) grid.add(new El('div'))
    .add(new El('span', { cls: 'pill', text: t, style: { backgroundColor: c } }));
  body.add(new El('div', { text: 'Legend words' })).add(new El('span', { cls: 'pill', text: 'OK', style: { backgroundColor: GREEN } }));
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  assert.deepEqual(tokenGroups(groups), [], 'labelled pills carry their own text — nothing for the token lane');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §4 — contracts: self-containment and main-lane byte-discipline
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§4 collectColourPeers stays self-contained for page.evaluate (the S8 rule, with the lane added)', () => {
  const src = collectColourPeers.toString();
  assert.ok(!/\brequire\s*\(/.test(src), 'no require()');
  assert.ok(!/\bprocess\./.test(src), 'no process.* — the env flag is read by the CALLER, never in-page');
  assert.ok(!/\bmodule\b/.test(src), 'no module reference');
});

test('§4 main-lane groups keep their exact key set even when the flag is ON (tokenLane is additive, not global)', () => {
  // a classic MAIN-lane group: text-bearing same-parent peers coded by text colour only
  const body = new El('body');
  const board = body.add(new El('div'));
  for (const [c, t] of [['rgb(10, 125, 51)', 'Delivered on time'], ['rgb(185, 28, 28)', 'Payment overdue'], ['rgb(10, 125, 51)', 'Delivered early']]) {
    board.add(new El('span', { text: t, style: { color: c } }));
  }
  const groups = withDom(body, () => collectColourPeers({ tokenLane: true }));
  const main = groups.filter((g) => !g.tokenLane);
  assert.equal(main.length, 1, 'the main-lane group still forms');
  assert.deepEqual(Object.keys(main[0]).sort(), ['anchorCarriesColour', 'distinctColours', 'key', 'members'],
    'main-lane payload untouched — no tokenLane/legendText leak onto ordinary groups');
});
