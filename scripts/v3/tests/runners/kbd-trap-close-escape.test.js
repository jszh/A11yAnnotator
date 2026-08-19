// 2.1.2 — a keyboard-operable CLOSE control is an escape (2026-08-19).
//
// runKeyboardTrapEscape tried Tab, Shift+Tab, Esc and an ADVISED key, and asserted a trap when all four
// failed. That flags the APG-required modal pattern, which deliberately CYCLES Tab and exits through a
// reachable dismiss control — and on a NON-modal `<dialog open>` Esc does nothing, so all four legitimately
// fail on a conformant page. The sibling instrument (kbd-graph.detectKeyboardTraps) already exempted this
// exact shape; the runner now calls that same probe instead of carrying a weaker contract.
//
// Fixtures INVENTED (a workshop tool-loan panel). Two polarities that differ in ONE thing: whether the
// cycle contains a control that actually dismisses the region.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — 2.1.2 close-escape suite SKIPPED');

// `escapable`: the cycle contains a dismiss control that closes the dialog on activation.
// Non-modal `<dialog open>` in BOTH, so Esc is inert either way and cannot mask the difference.
const PANEL = (escapable) => `<!doctype html><html><body style="font:14px system-ui">
  <main>
    <button id="before">Workshop roster</button>
    <dialog id="loan" open aria-label="Tool loan">
      <label for="tool">Tool</label>
      <select id="tool"><option>Bandsaw</option><option>Router</option></select>
      <label for="until">Return by</label>
      <input id="until" value="Friday">
      ${escapable ? '<button id="stop">Close loan panel</button>' : '<button id="stop">Extend loan</button>'}
    </dialog>
  </main>
  <script>
    const dlg = document.getElementById('loan');
    const items = () => [...dlg.querySelectorAll('select,input,button')];
    dlg.addEventListener('keydown', (e) => {                 // a real focus cycle: Tab never leaves
      if (e.key !== 'Tab') return;
      const f = items(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    ${escapable
      ? "document.getElementById('stop').addEventListener('click', () => dlg.close());"
      : "document.getElementById('stop').addEventListener('click', () => { document.getElementById('until').value = 'Next Friday'; });"}
  </script>
</body></html>`;

async function runTrap(html, targetXpath) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await RUNNERS['keyboard-trap-escape'](page, { candidateId: 'c-trap', targetXpath });
  } finally { await browser.close(); }
}

const SELECT_XPATH = '/html/body/main[1]/dialog[1]/select[1]';

test('2.1.2 a Tab cycle with a keyboard-operable Close control is NOT a trap', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL(true), SELECT_XPATH);
  const m = r.measurement;
  assert.equal(m.tabEscapes, false, 'the cycle really does hold Tab');
  assert.equal(m.shiftEscapes, false, 'and Shift+Tab');
  assert.equal(m.escClosesOrEscapes, false, 'Esc is inert on a NON-modal dialog — the condition that exposed the bug');
  assert.equal(m.advised, false, 'and there is no advisory text to lean on');
  assert.equal(m.closeEscapes, true, 'the reachable Close control IS the keyboard escape');
  assert.equal(r.outcome.trapProven, false, 'so no trap is asserted');
  assert.equal(r.outcome.escapeProvenForWidget, true, 'and the widget is affirmatively cleared');
});

test('2.1.2 the SAME cycle whose only button does not dismiss IS still a trap', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL(false), SELECT_XPATH);
  const m = r.measurement;
  assert.equal(m.closeEscapes, false, 'a button that changes a value is not an exit');
  assert.equal(m.cycledBackToStart, true, 'Tab returns to the start — the confinement signal');
  assert.equal(r.outcome.trapProven, true, 'the true catch is preserved — this must not become a blanket exemption');
});
