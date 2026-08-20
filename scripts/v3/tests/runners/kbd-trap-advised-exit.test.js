// 2.1.2 — the ADVISED-EXIT exception: grammar, and the accuracy half of it (2026-08-19).
//
// WCAG 2.1.2 permits a non-standard keyboard exit when the user is ADVISED of it. Two lanes ask that
// question and had drifted into two private grammars, both too narrow. The runner's copy recognised exactly
// one phrasing — `press <single-char> to leave|exit|close|escape|dismiss` — so it matched NO real advisory
// prose: not the verb-first order authors actually write, not a modifier chord, not a function key. With
// `advised` false on every documented-exit page, the trap assertion `!anyEscapes && !advice.advised` scored
// a page that correctly documents its exit as a trap (measured cross-model false positive).
//
// Widening the grammar alone would have been worse than the bug: the old code let the mere PRESENCE of
// advice clear a confinement, so every page advertising a keystroke that does nothing would have flipped to
// a silent pass. 2.1.2's exception is conjunctive — advised AND working — so a parsed key is now PRESSED and
// must actually free focus. Only an UNTESTABLE advisory suppresses (audit V3R2-H4).
//
// Fixtures INVENTED (a seed-catalogue stock panel). The three region variants differ in ONE thing: what the
// advertised keystroke does.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');
const kg = require('../../lib/kbd-graph.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — 2.1.2 advised-exit browser suite SKIPPED');

// ---------------------------------------------------------------------------------------------------
// Grammar (pure, no browser)
// ---------------------------------------------------------------------------------------------------

test('2.1.2 advisory grammar reads verb-first prose, chords and function keys', () => {
  const p = kg.parseAdvisory.bind(kg);
  // verb-first, chord, long gap naming both the region left and the destination — the shape that failed
  assert.deepEqual(
    p('The stock panel keeps your cursor inside it while you adjust counts. To move focus back out to the rest of the page using only the keyboard, press Ctrl+B.'),
    { advised: true, key: 'b', mods: ['ctrl'], reserved: false });
  // press-first still works, and a bare single key is still a key
  assert.equal(p('press Z to leave this panel').key, 'z', 'single keys are lowercased; an explicit Shift rides in mods');
  // function keys: the previous one-character class could never match these
  assert.deepEqual(p('press Alt+F6 to exit the drawer').mods, ['alt']);
  assert.equal(p('press Alt+F6 to exit the drawer').key, 'F6');
  // multi-modifier
  assert.deepEqual(p('To leave the editor and return to the catalogue, press Ctrl+Alt+D').mods, ['ctrl', 'alt']);
  assert.equal(p('To leave the editor and return to the catalogue, press Ctrl+Alt+D').key, 'd');
  // named editing key
  assert.equal(p('When you are done, press Esc to close this drawer.').key, 'Escape');
  // a user-agent-reserved chord is parsed but flagged: it cannot move focus, so it must never clear
  assert.equal(p('To move focus back out to the page, press Ctrl+W.').reserved, true);
  // THE KEY AND ITS PURPOSE CLAUSE NEED NOT BE ADJACENT (2026-08-20). "press Ctrl+M AT ANY TIME to skip
  // past the panel" is ordinary advisory prose and did not parse, because the pattern allowed only an
  // optional literal "key" between the two. An unparsed advisory ASSERTS a trap, so this scored a page
  // whose Ctrl+M exit is bound and demonstrably works as a keyboard trap. Found on a real corpus page
  // (2.1.2 multi-element-region-loop case-06) only after region identification was repaired — until then
  // the collapsed region cleared every such page trivially and the grammar gap could not be reached.
  assert.deepEqual(p('Press Ctrl+M at any time to skip past the panel and continue down the page.'),
    { advised: true, key: 'm', mods: ['ctrl'], reserved: false });
  assert.equal(p('Press Escape whenever you are finished to close this dialog.').key, 'Escape',
    'the gap is a general allowance, not a special case for one sentence');
  // …but it stays inside ONE sentence, or it would stitch an unrelated keystroke onto a later purpose
  // clause. Here an unbounded gap would read "press F2 … to leave" straight across the full stop and
  // advertise a key the page never bound to leaving — which SUPPRESSES a trap assertion, so the failure
  // would be a missed trap rather than a noisy one.
  assert.equal(p('Press F2 at the top of the list. Use the menu to leave the panel.').key, null,
    'F2 is not stitched onto the next sentence — advice with no readable key, not a false key');
});

test('2.1.2 advisory grammar separates ABSENT advice from UNTESTABLE advice', () => {
  const p = kg.parseAdvisory.bind(kg);
  // no advisory at all ⇒ null ⇒ caller is free to assert a trap on the confinement evidence
  assert.equal(p('Tab moves between the fields in this panel and totals update automatically.'), null);
  // an INTERACTION instruction is not an exit advisory — this must not silence a real confinement
  assert.equal(p('To move the slider, press the arrow keys.'), null);
  // advice we can read but cannot test ⇒ advised, no key ⇒ INCONCLUSIVE
  assert.deepEqual(p('To leave this panel, use the shortcut shown in your account settings.'),
    { advised: true, key: null, mods: [], reserved: false });
  // the bounded gap must not stitch two sentences into one advisory
  assert.equal(p('To leave the drawer you need help. Our office is open. Please press K for coffee.').key, null);
  // the ARTICLE is not a keystroke — vague advice must land on the untestable (suppressing) side, because a
  // tested-and-failed advisory ASSERTS a trap and this shape would manufacture one out of ordinary prose
  for (const vague of ['To leave this panel, press a key.', 'press a key to leave this panel', 'To leave, press a button']) {
    assert.deepEqual(p(vague), { advised: true, key: null, mods: [], reserved: false }, vague);
  }
  assert.equal(p('press Alt+A to exit').key, 'a', 'but a real chord on the same letter still parses');
});

// ---------------------------------------------------------------------------------------------------
// Behaviour (browser)
// ---------------------------------------------------------------------------------------------------

// `exit`: 'works' — the advertised chord moves focus out. 'lies' — it is bound to nothing.
//         'untestable' — the panel advises an exit without naming a keystroke.
// `plain` drops the modal-ish class so `TRAP_REGION_SEL` cannot match and region identification COLLAPSES
// onto the control — the shape that made the grammar repair alone insufficient (see the last test).
const PANEL = (exit, plain) => `<!doctype html><html><body style="font:14px system-ui">
  <main>
    <button id="before">Seed catalogue</button>
    <section id="stock"${plain ? '' : ' class="modal"'} aria-label="Stock counts" aria-describedby="stock-help">
      <p id="stock-help">${exit === 'untestable'
        ? 'To leave the stock panel, use the shortcut shown in your account settings.'
        : 'The stock panel keeps your cursor inside it while you adjust counts. To move focus back out to the rest of the page using only the keyboard, press Ctrl+B.'}</p>
      <label for="variety">Variety</label>
      <input id="variety" value="Cosmos">
      <label for="trays">Trays</label>
      <input id="trays" value="12">
      <button id="recount">Recount</button>
    </section>
    <a href="#done" id="after">Back to catalogue</a>
  </main>
  <script>
    // A DETERMINISTIC confinement: Tab cycles inside the section and never leaves. Deliberately not the
    // blur→setTimeout→refocus shape — that races the runner's own keyboard-reach probe, so the fixture
    // would decide its own reachability by timing rather than testing what it claims to test.
    const reg = document.getElementById('stock');
    const items = () => [...reg.querySelectorAll('input,button')];
    let escaped = false;
    reg.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || escaped) return;
      const f = items(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    ${exit === 'works'
      ? "document.addEventListener('keydown', (e) => { if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { escaped = true; e.preventDefault(); document.getElementById('after').focus(); } });"
      : ''}
  </script>
</body></html>`;

async function runTrap(html, targetXpath) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await RUNNERS['keyboard-trap-escape'](page, { candidateId: 'c-adv', targetXpath });
  } finally { await browser.close(); }
}

const FIRST_INPUT = '/html/body/main[1]/section[1]/input[1]';

test('2.1.2 a confinement whose ADVERTISED chord actually works is NOT a trap', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL('works'), FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.advised, true, 'the verb-first Ctrl+B advisory is read — the whole bug was that it was not');
  assert.equal(m.advisedKey, 'b', 'and the chord is extracted, not just the presence of advice');
  assert.equal(m.advisedKeyEscapes, true, 'pressing it genuinely frees focus');
  assert.equal(r.outcome.trapProven, false, 'so the documented exit clears the confinement');
});

test('2.1.2 the SAME advisory bound to NOTHING is still a trap', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL('lies'), FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.advised, true, 'identical prose — only the key binding differs');
  assert.equal(m.advisedKey, 'b', 'and it parses identically');
  assert.equal(m.advisedKeyEscapes, false, 'but pressing it does nothing');
  assert.equal(m.adviceUnverifiable, false, 'this advisory WAS testable — it simply failed');
  assert.equal(r.outcome.trapProven, true, 'a page may not clear 2.1.2 by advertising a keystroke it never bound');
});

test('2.1.2 an advisory naming NO keystroke is inconclusive, never a confirmed trap', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL('untestable'), FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.advised, true, 'the page does advise an exit');
  assert.equal(m.advisedKey, null, 'but names no keystroke we can press');
  assert.equal(m.adviceUnverifiable, true, 'so the claim is untestable');
  assert.equal(r.outcome.trapProven, false, 'audit V3R2-H4: never assert a trap against an exit we could not confirm');
});

test('2.1.2 the advisory is found when no trap-region selector matches', { skip: !chromeOK, concurrency: false }, async () => {
  // Same page, same working chord — only the container's class is gone, so it matches no trap-region
  // selector. Before the scope repair the advisory could not be read on ANY such page: `closest()` returned
  // the input, and the `textContent` of an `<input>` is empty, so a correctly documented exit was invisible
  // however good the grammar was. That was the half of the measured false positive that actually bit.
  //
  // Region identification itself was repaired afterwards (kbd-trap-region-anchor.test.js), so on THIS page
  // the region now resolves to the section by the focusable-group rule and the advisory sits inside it. The
  // page is kept because it is the shape the bug was measured on, and because the two repairs must agree:
  // whichever one supplies the scope, a documented exit has to be read.
  const r = await runTrap(PANEL('works', true), FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'focusable-group-ancestor', 'no selector matched — the anchor was inferred');
  assert.equal(m.advised, true, 'the advisory is read');
  assert.equal(m.advisedKey, 'b', 'and the chord still parses');
  assert.equal(m.advisedKeyEscapes, true, 'and pressing it still frees focus — the escape is measured, not assumed');
});

test('2.1.2 the advisory is read from a naming ancestor when the region falls back to the control', { skip: !chromeOK, concurrency: false }, async () => {
  // The case that keeps the widened advisory scope alive. Strip the two page links and every focusable in
  // the document sits inside the panel, so no bounded group exists and region resolution falls back to the
  // control — `textContent` empty, exactly as before. The advisory must still be found by climbing to the
  // naming ancestor, or a documented exit is invisible on this shape and the page reads as a trap.
  const html = PANEL('works', true)
    .replace('<button id="before">Seed catalogue</button>', '')
    .replace('<a href="#done" id="after">Back to catalogue</a>', '');
  const r = await runTrap(html, FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'control-fallback', 'nothing bounded to anchor on');
  assert.equal(m.regionFocusableCount, 0, 'so the region really is the input itself');
  assert.equal(m.advised, true, 'and the advisory is STILL read, from the ancestor that names the panel');
  assert.equal(m.advisedKey, 'b');
});

test('2.1.2 a real confinement with a GAPPED advisory clears end-to-end', { skip: !chromeOK, concurrency: false }, async () => {
  // The conjunction, as it actually appeared on a corpus page (2.1.2 multi-element-region-loop case-06):
  // a role-less container that genuinely cycles Tab in both directions, advertising its exit as
  // "press <chord> at any time to skip past…", with the chord really bound.
  //
  // Each repair alone gets this WRONG, in opposite directions. Region identification alone reads the
  // confinement and cannot parse the advisory, so it asserts a trap on a conformant page. Grammar alone
  // never sees the confinement, because the collapsed region cleared it before any advisory mattered —
  // which is exactly why this gap survived the previous batch undetected. Only together do they land on
  // the right answer, and for the right reason: the chord is PRESSED and observed to free focus.
  const html = PANEL('works', true).replace(
    /<p id="stock-help">[\s\S]*?<\/p>/,
    '<p id="stock-help">This panel keeps keyboard focus while you adjust counts. Press Ctrl+B at any time to skip past the panel and continue down the page.</p>');
  const r = await runTrap(html, FIRST_INPUT);
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'focusable-group-ancestor', 'the confinement is visible at all');
  assert.equal(m.tabEscapes, false, 'and it is real — Tab does not leave');
  assert.equal(m.shiftEscapes, false, 'nor does Shift+Tab');
  assert.equal(m.advised, true, 'the gapped advisory is read');
  assert.equal(m.advisedKey, 'b', 'and its chord extracted');
  assert.equal(m.advisedKeyEscapes, true, 'pressing it genuinely frees focus');
  assert.equal(r.outcome.trapProven, false, 'so a documented, working exit is not a trap');
  assert.equal(r.outcome.escapeProvenForWidget, true);
});

test('2.1.2 the widened advisory scope does not INVENT advice that is not there', { skip: !chromeOK, concurrency: false }, async () => {
  // The guard on the repair above: reading from an ancestor must not turn ordinary prose into an exit
  // advisory. `advised` is what suppresses a trap assertion, so a false positive HERE is a missed trap.
  const html = PANEL('lies', true).replace(/<p id="stock-help">[\s\S]*?<\/p>/, '<p id="stock-help">Counts are saved automatically as you type.</p>');
  const r = await runTrap(html, FIRST_INPUT);
  assert.equal(r.measurement.advised, false, 'no advisory anywhere in the widened scope');
  assert.equal(r.measurement.advisedKey, null, 'and no keystroke conjured from the surrounding copy');
  assert.equal(r.measurement.adviceUnverifiable, false, 'so nothing untestable to suppress on');
});
