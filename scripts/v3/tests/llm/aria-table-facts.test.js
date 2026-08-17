// ARIA TABLE/GRID SEMANTICS IN collectTables (residual RCA S10 — Tier-3 ARIA grid).
//
// The native pass reads <table> markup only, so a role=table/grid built from generic elements carried NO
// entry in structure.tables at all — and the one failure shape that lane owns (a set of independent page
// regions declared as one data grid, F46's fabrication in ARIA clothing) reached no deterministic signal.
// collectTables now ALSO emits `ariaTable: true` records: the OWNED-ELEMENT CONTRACT verified (rows present
// — DOM-nested or aria-owns-referenced — every cell owned by a row, per-row cell counts consistent) and the
// CELL-CONTENT SHAPE measured, with `fabricatedTableSemantics` true ONLY when the contract HOLDS while the
// majority (≥2) of data cells carry block/region content. Facts only — the adjudicator maps the flag onto
// the tableSemantics verdict channel the info-relationships rubric already reads.
//
// Every fixture here is a generic page invented for this test. None is derived from any evaluated page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectTables } = require('../../lib/collect-tables.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — aria-table-facts browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ariatable-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return 'file://' + p; };

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}
const tablesOn = async (url) => withBrowser(async (b) => {
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'load' });
    return await page.evaluate(collectTables);
  } finally { await page.close(); }
});

// The fabrication shape: independent stat panels declared as one data grid — a header row of columnheaders
// over cells that each hold a heading, prose and a control. The contract HOLDS (that is what makes the
// false declaration convincing), and the cells are regions, not values.
const PANELS = writeFx('panels.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Panels</title></head><body>
  <div role="table" aria-label="Studio overview">
    <div role="row">
      <span role="columnheader">Output</span><span role="columnheader">Bookings</span><span role="columnheader">Supplies</span>
    </div>
    <div role="row">
      <div role="cell"><h3>Kiln output</h3><p>Firings completed this week.</p><button>Open log</button></div>
      <div role="cell"><h3>Wheel bookings</h3><p>Sessions reserved for the weekend.</p><button>Manage</button></div>
      <div role="cell"><h3>Clay stock</h3><p>Bags remaining in the store room.</p><button>Reorder</button></div>
    </div>
    <div role="row">
      <div role="cell"><h3>Glaze tests</h3><p>Tiles waiting for review.</p><button>Review</button></div>
      <div role="cell"><h3>Class list</h3><p>Members enrolled this term.</p><button>Export</button></div>
      <div role="cell"><h3>Maintenance</h3><p>Open tickets on the equipment.</p><button>View</button></div>
    </div>
  </div>
</body></html>`);

test('the declared-structure-holds / cells-are-regions shape sets fabricatedTableSemantics', { skip: !chromeOK }, async () => {
  const out = await tablesOn(PANELS);
  assert.equal(out.length, 1);
  const t = out[0];
  assert.equal(t.ariaTable, true);
  assert.equal(t.role, 'table');
  assert.equal(t.rowCount, 3);
  assert.equal(t.colCount, 3);
  assert.equal(t.columnheaderCount, 3);
  assert.equal(t.dataCellCount, 6);
  assert.equal(t.rowCellCountsConsistent, true);
  assert.equal(t.cellsOutsideRows, 0);
  assert.equal(t.ownedContractHolds, true, 'the owned-element contract HOLDS — which is what makes the declaration convincing');
  assert.equal(t.cellsWithBlockContent, 6, 'every data cell holds a region, not a value');
  assert.equal(t.fabricatedTableSemantics, true);
  assert.match(t.xpath, /div\[1\]$/);
});

// A WELL-FORMED ARIA data grid: columnheaders over plain text gridcells. The contract holds and nothing is
// fabricated — this is the shape the rubric explicitly protects (positional ARIA association is valid).
const GRID = writeFx('grid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Grid</title></head><body>
  <div role="grid" aria-label="Firing schedule">
    <div role="row"><span role="columnheader">Day</span><span role="columnheader">Kiln</span><span role="columnheader">Programme</span></div>
    <div role="row"><span role="gridcell">Tuesday</span><span role="gridcell">A</span><span role="gridcell">Bisque</span></div>
    <div role="row"><span role="gridcell">Friday</span><span role="gridcell">B</span><span role="gridcell">Glaze</span></div>
  </div>
</body></html>`);

test('a well-formed ARIA data grid reports a held contract and NO fabrication', { skip: !chromeOK }, async () => {
  const out = await tablesOn(GRID);
  assert.equal(out.length, 1);
  const t = out[0];
  assert.equal(t.ariaTable, true);
  assert.equal(t.role, 'grid');
  assert.equal(t.ownedContractHolds, true);
  assert.equal(t.firstRowAllColumnheader, true);
  assert.equal(t.cellsWithBlockContent, 0);
  assert.equal(t.fabricatedTableSemantics, false);
  assert.equal(t.truncated, undefined, 'no cap hit ⇒ no truncation marker (presence is the signal)');
});

// TRUNCATION SOUNDNESS (probe 2026-08-17): a CONFORMANT grid bigger than the 40-row sampling cap. The
// uncapped cellsOutsideRows scan used to count every overflow row's cells as "outside any row", so this
// well-formed grid read ownedContractHolds:false with no marker that a cap was ever hit.
const BIGROWS = Array.from({ length: 46 }, (_, i) =>
  `<div role="row"><span role="gridcell">Lot ${i + 1}</span><span role="gridcell">${i % 2 ? 'Fired' : 'Drying'}</span></div>`).join('\n    ');
const BIGGRID = writeFx('biggrid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Big grid</title></head><body>
  <div role="grid" aria-label="Lot tracker">
    <div role="row"><span role="columnheader">Lot</span><span role="columnheader">Stage</span></div>
    ${BIGROWS}
  </div>
</body></html>`);

test('a conformant grid past the 40-row cap reads truncated:true and its contract is NOT read as broken', { skip: !chromeOK }, async () => {
  const out = await tablesOn(BIGGRID);
  assert.equal(out.length, 1);
  const t = out[0];
  assert.equal(t.ariaTable, true);
  assert.equal(t.rowCount, 40, 'the sample stops at the cap');
  assert.equal(t.truncated, true, 'the cap hit is stamped on the record');
  assert.equal(t.cellsOutsideRows, 0, 'overflow cells are row-held, never "outside rows"');
  assert.equal(t.rowCellCountsConsistent, true);
  assert.notEqual(t.ownedContractHolds, false, 'a capped well-formed grid never reads defective');
  assert.equal(t.ownedContractHolds, true);
  assert.equal(t.fabricatedTableSemantics, false);
});

// …and the BROKEN shape stays broken under truncation: a genuine stray cell inside the sample is a real
// defect, not a cap artifact — the structural outside-rows test must keep reporting it.
const BIGBROKEN = writeFx('bigbroken.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Big broken</title></head><body>
  <div role="table" aria-label="Notice board">
    <div role="cell"><h3>Loose panel</h3><p>Held by no row at all.</p></div>
    <div role="row"><span role="columnheader">Note</span><span role="columnheader">Day</span></div>
    ${BIGROWS}
  </div>
</body></html>`);

test('a truncated grid with a genuine stray cell still reports the broken contract', { skip: !chromeOK }, async () => {
  const out = await tablesOn(BIGBROKEN);
  const t = out[0];
  assert.equal(t.truncated, true);
  assert.equal(t.cellsOutsideRows, 1, 'exactly the stray cell — never the overflow cells');
  assert.equal(t.ownedContractHolds, false);
  assert.equal(t.fabricatedTableSemantics, false);
});

// An EDITABLE grid: gridcells holding form controls. Interactive content is reported but is deliberately
// NOT a fabrication trigger — a legitimate editable grid is full of controls.
const EDIT = writeFx('edit.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Edit</title></head><body>
  <div role="grid" aria-label="Stock counts">
    <div role="row"><span role="columnheader">Item</span><span role="columnheader">Count</span></div>
    <div role="row"><span role="rowheader">Stoneware</span><span role="gridcell"><input value="12"></span></div>
    <div role="row"><span role="rowheader">Porcelain</span><span role="gridcell"><input value="7"></span></div>
  </div>
</body></html>`);

test('an editable grid (controls in cells) is NEVER read as fabrication', { skip: !chromeOK }, async () => {
  const out = await tablesOn(EDIT);
  const t = out[0];
  assert.equal(t.ownedContractHolds, true);
  assert.equal(t.cellsWithInteractiveContent, 2, 'interactive content is a reported fact');
  assert.equal(t.cellsWithBlockContent, 0);
  assert.equal(t.fabricatedTableSemantics, false, '...but never a trigger');
});

// A BROKEN contract: a cell-role element outside any row. The defect is reported through the contract
// fields; the fabrication flag stays down even though the stray cell holds block content.
const BROKEN = writeFx('broken.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Broken</title></head><body>
  <div role="table" aria-label="Notices">
    <div role="row"><span role="cell">First notice</span><span role="cell">Second notice</span></div>
    <div role="cell"><h3>Stray panel</h3><p>Not owned by any row.</p></div>
  </div>
</body></html>`);

test('a broken owned-element contract is reported as such and never as fabrication', { skip: !chromeOK }, async () => {
  const out = await tablesOn(BROKEN);
  const t = out[0];
  assert.equal(t.cellsOutsideRows, 1);
  assert.equal(t.ownedContractHolds, false);
  assert.equal(t.fabricatedTableSemantics, false);
});

// aria-owns: rows referenced rather than nested still satisfy the contract (ff89c9's protected shape).
const OWNS = writeFx('owns.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Owns</title></head><body>
  <div role="table" aria-label="Kiln queue" aria-owns="r1 r2"></div>
  <div id="r1" role="row"><span role="cell">Bisque batch</span><span role="cell">Tuesday</span></div>
  <div id="r2" role="row"><span role="cell">Glaze batch</span><span role="cell">Friday</span></div>
</body></html>`);

test('aria-owns-referenced rows count toward the contract (rowsViaAriaOwns)', { skip: !chromeOK }, async () => {
  const out = await tablesOn(OWNS);
  const t = out[0];
  assert.equal(t.rowCount, 2);
  assert.equal(t.rowsViaAriaOwns, true);
  assert.equal(t.ownedContractHolds, true);
  assert.equal(t.fabricatedTableSemantics, false);
});

// Native records are untouched and always sort FIRST — the adjudicator's association projection is
// native-only and index-aligned against structure.tables.
const MIXED = writeFx('mixed.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Mixed</title></head><body>
  <div role="grid" aria-label="Placed before the native table in the DOM">
    <div role="row"><span role="columnheader">Slot</span><span role="columnheader">State</span></div>
    <div role="row"><span role="gridcell">One</span><span role="gridcell">Open</span></div>
  </div>
  <table><caption>Shipments</caption><tr><th>Region</th><th>Units</th></tr><tr><td>North</td><td>120</td></tr></table>
</body></html>`);

test('native records keep their shape and precede ARIA records regardless of DOM order', { skip: !chromeOK }, async () => {
  const out = await tablesOn(MIXED);
  assert.equal(out.length, 2);
  assert.ok(!out[0].ariaTable, 'the native table sorts first');
  assert.equal(out[0].hasCaption, true);
  assert.equal(out[0].thCount, 2);
  assert.equal(typeof out[0].looksLikeDataTable, 'boolean', 'native facts are untouched');
  assert.equal(out[1].ariaTable, true);
  assert.equal(out[1].role, 'grid');
});

// role=row/cell with no table-role container, and a native <table role="grid">, must NOT produce aria records
// (the native path already owns the latter via roleOverride).
const NONE = writeFx('none.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>None</title></head><body>
  <div role="row"><span role="cell">Orphan</span><span role="cell">Cells</span></div>
  <table role="grid"><tr><th>Day</th><th>Kiln</th></tr><tr><td>Tue</td><td>A</td></tr></table>
</body></html>`);

test('no aria record without a non-native table-role container', { skip: !chromeOK }, async () => {
  const out = await tablesOn(NONE);
  assert.equal(out.length, 1, 'only the native table (role=grid on <table> stays native)');
  assert.ok(!out[0].ariaTable);
  assert.equal(out[0].roleOverride, 'grid');
});
