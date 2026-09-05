/**
 * control.e2e.test.js - the operator console in a real browser, driving a real
 * participant client in a second tab.
 *
 * The server API is covered by server.test.js; what this adds is that the
 * console's own DOM does what its buttons say - the password gate, adding a
 * participant, splitting, applying a selection dict, prev/next/reload, the
 * focus monitor, and notes surviving a navigation.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../../..');
const SERVER = path.join(ROOT, 'eval/human-study/server.js');
const PASSWORD = 'control-e2e-password';
const SHOT_DIR = process.env.STUDY_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-study-control-'));

// Two browsers, not two tabs. The console and the pages under evaluation are
// served from the same origin (that is what makes the highlight possible), so
// Chrome puts them in one renderer process - and a snapshot that busies its
// main thread then starves the console's CDP calls until the 180s protocol
// timeout. A real study has the operator on a different machine entirely; the
// test has to reproduce that separation rather than the accident of one tab.
let child = null, ctlBrowser = null, clientBrowser = null, ctl = null, client = null, PORT = 0;

const SAMPLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/human-study/sample/study-sample-200.json'), 'utf8'));
const pageBytes = (c) => { try { return fs.statSync(path.join(ROOT, 'assets', c.page.assetDir, c.page.file)).size; } catch (e) { return Infinity; } };
// The navigation tests move between tasks repeatedly; pin them to the lightest
// pages in the sample so the run measures the console, not page weight.
const LIGHT_CASES = [...SAMPLE.cases]
  .filter((c) => c.scope === 'element')
  .sort((a, b) => pageBytes(a) - pageBytes(b))
  .slice(0, 4)
  .map((c) => c.caseId);

function freePort() {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, what, ms = 15000) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}
/**
 * The console has two pages now: an overview list, and one participant's own
 * page behind it. Almost everything these tests drive lives on the second, so
 * open it first and read from there.
 */
async function openParticipant(name) {
  // Check WHO is open, not just that something is. Returning early on any open
  // detail page meant a test that failed while looking at somebody else left
  // every test after it driving the wrong participant - one broken feature
  // reported as five.
  const who = name || 'Robin';
  const onDetail = await ctl.evaluate((want) => {
    const page = document.getElementById('page-detail');
    return !page.hidden && document.getElementById('detail-name').textContent.trim() === want;
  }, who).catch(() => false);
  if (onDetail) return;
  await backToOverview();
  await until(async () => ctl.$$eval('.ptable .linky', (ns) => ns.length > 0).catch(() => false), 'the participant list');
  await ctl.evaluate((want) => {
    const b = [...document.querySelectorAll('.ptable .linky')].find((x) => x.textContent.trim() === want);
    if (b) b.click();
  }, who);
  await until(async () => ctl.evaluate((want) => {
    const page = document.getElementById('page-detail');
    return !page.hidden && document.getElementById('detail-name').textContent.trim() === want;
  }, who), `${who}'s page to open`);
}

/** Everything the console shows about the open participant. */
const cardText = async (name) => {
  // Takes a name. It used to always reopen Robin, so calling it while looking
  // at anybody else silently navigated away and then read the wrong page.
  await openParticipant(name);
  return ctl.$eval('#page-detail', (n) => n.textContent);
};

/** The overview list, without opening anybody. */
const listText = () => ctl.$eval('#participant-list', (n) => n.textContent);

/** Back to the overview - the assignment panel lives there, not on a person. */
async function backToOverview() {
  const onDetail = await ctl.$eval('#page-detail', (n) => !n.hidden).catch(() => false);
  if (onDetail) await ctl.click('#detail-back');
  await until(async () => ctl.$eval('#page-overview', (n) => !n.hidden), 'the overview');
}
// Matched by label, not by position. These used to be indices into the nav row,
// which meant inserting one button silently repointed every test after it at
// the wrong control - the failure looks like a broken feature, not a broken
// helper.
const NAV = {
  prev: 'Prev', next: 'Next \u2192', nextUnfinished: 'Next unfinished',
  reload: 'Reload page', showHighlight: 'Show highlight', focusTarget: 'Focus target',
};
/**
 * Find and click in one atomic step inside the page.
 *
 * The console rebuilds its participant cards on every state push, and those
 * arrive continuously while a participant is working. A CDP click is two steps
 * - resolve the handle, then click its coordinates - and a rebuild landing in
 * between leaves the handle pointing at a detached node, which fails with
 * "not clickable" or hangs in scrollIntoViewIfNeeded. Doing the lookup and the
 * click in the same task closes that window. Visibility is asserted separately
 * so this does not quietly click a button nobody could reach.
 */
const clickNav = async (which) => {
  const ok = await ctl.evaluate((label) => {
    const b = [...document.querySelectorAll('#page-detail .nav button')]
      // `includes`, not `startsWith`: the labels carry arrows ("\u2190 Prev").
      // The arrow on "Next \u2192" is what keeps it from also matching
      // "Next unfinished".
      .find((x) => x.textContent.includes(label));
    if (!b) return 'missing';
    if (b.disabled) return 'disabled';
    const r = b.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(b).visibility === 'hidden') return 'not visible';
    b.click();
    return 'ok';
  }, NAV[which]);
  assert.equal(ok, 'ok', `nav button ${which} was ${ok}`);
};

test.before(async () => {
  PORT = await freePort();
  const stateFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-study-ctl-')), 'state.json');
  child = spawn(process.execPath, [SERVER, `--port=${PORT}`, `--password=${PASSWORD}`, `--state=${stateFile}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 30000);
    child.stdout.on('data', (d) => { if (String(d).includes('human study server')) { clearTimeout(t); resolve(); } });
    child.on('exit', (c) => { clearTimeout(t); reject(new Error(`server exited ${c}`)); });
  });
  ctlBrowser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  clientBrowser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  ctl = await ctlBrowser.newPage();
  await ctl.setViewport({ width: 1500, height: 950 });
});

test.after(async () => {
  if (ctlBrowser) await ctlBrowser.close();
  if (clientBrowser) await clientBrowser.close();
  if (child) child.kill('SIGTERM');
  console.log(`\n  screenshots: ${SHOT_DIR}`);
});

test('the console is behind a password', async () => {
  await ctl.goto(`http://127.0.0.1:${PORT}/control`, { waitUntil: 'domcontentloaded' });
  await until(async () => (await ctl.$eval('#login', (n) => !n.hidden)), 'the login screen');
  // Computed display, not the attribute: `hidden` alone loses to any class rule
  // that sets a display, which would leave the whole console painted and
  // clickable behind a login card that only looks like a gate.
  assert.equal(await ctl.$eval('#console', (n) => getComputedStyle(n).display), 'none',
    'the console is still painted behind the login screen');
  assert.equal(await ctl.$eval('#console', (n) => n.getBoundingClientRect().height), 0);
  assert.equal(await ctl.$eval('#password', (n) => n.type), 'password');
  await ctl.screenshot({ path: path.join(SHOT_DIR, '10-login.png') });

  await ctl.type('#password', 'wrong');
  await ctl.click('#login-form button[type=submit]');
  await until(async () => (await ctl.$eval('#login-error', (n) => n.textContent.trim().length > 0)), 'an error message');
  assert.match(await ctl.$eval('#login-error', (n) => n.textContent), /wrong password/i);
  assert.equal(await ctl.$eval('#console', (n) => n.hidden), true, 'a failed sign-in must not open the console');
  // The message is announced, not just drawn.
  assert.equal(await ctl.$eval('#login-error', (n) => n.getAttribute('role')), 'alert');
});

test('the correct password opens the console', async () => {
  await ctl.$eval('#password', (n) => { n.value = ''; });
  await ctl.type('#password', PASSWORD);
  await ctl.click('#login-form button[type=submit]');
  await until(async () => (await ctl.$eval('#console', (n) => !n.hidden)), 'the console');
  assert.equal(await ctl.$eval('#login', (n) => getComputedStyle(n).display), 'none',
    'the login card is still painted over the console');
  assert.match(await ctl.$eval('#bar-sample', (n) => n.textContent), /200 cases/);
  assert.match(await ctl.$eval('#participant-list', (n) => n.textContent), /No participants yet/);
});

let clientUrl = '';
test('adding a participant produces a working study link', async () => {
  await backToOverview();
  await ctl.type('#add-name', 'Robin');
  await ctl.click('#add-form button[type=submit]');
  await until(async () => (await listText()).includes('Robin'), 'the participant row in the overview');
  // The link is on the participant's own page, not in the overview list.
  await openParticipant('Robin');
  clientUrl = await ctl.$eval('.plink', (n) => n.textContent);
  assert.match(clientUrl, new RegExp(`^http://127\\.0\\.0\\.1:${PORT}/s/[A-Za-z0-9_-]{20,}$`));
  assert.match(await cardText(), /offline/);
  assert.match(await cardText(), /no tasks assigned/);

  client = await clientBrowser.newPage();
  await client.setViewport({ width: 1100, height: 800 });
  client.on('dialog', (d) => d.dismiss().catch(() => {}));
  await client.goto(clientUrl, { waitUntil: 'domcontentloaded' });
  await until(async () => (await client.$eval('#waiting-text', (n) => /Waiting for study to begin/.test(n.textContent))), 'the waiting screen');
  await until(async () => (await cardText()).includes('connected'), 'the console to show the participant online');
});

test('splitting assigns every case exactly once', async () => {
  await backToOverview();
  await ctl.click('#toggle-open');
  await until(async () => (await ctl.$eval('#live-label', (n) => /open/.test(n.textContent))), 'the study to open');
  await ctl.select('#split-mode', 'interleave');
  await ctl.click('#split-form button[type=submit]');
  await until(async () => (await ctl.$eval('#split-msg', (n) => n.textContent.trim().length > 0)), 'the split result');
  assert.match(await ctl.$eval('#split-msg', (n) => n.textContent), /Robin 200/);
  await until(async () => (await cardText()).includes('0/200 answered'), 'the task count on the card');
  await ctl.screenshot({ path: path.join(SHOT_DIR, '11-console-split.png') });
});

test('a JSON selection dict narrows a participant to a chosen slice', async () => {
  await ctl.$$eval('details summary', (nodes) => { nodes.forEach((s) => { s.parentElement.open = true; }); });
  await backToOverview();
  await ctl.$eval('#dict-json', (n) => { n.value = ''; });
  await ctl.type('#dict-json', JSON.stringify({ Robin: { scs: ['1.1.1'], strata: ['ALL_ISSUE'] } }));
  await ctl.click('#dict-form button[type=submit]');
  await until(async () => (await ctl.$eval('#dict-msg', (n) => /Assigned: Robin/.test(n.textContent))), 'the dict result');
  const n = Number(/Robin (\d+)/.exec(await ctl.$eval('#dict-msg', (x) => x.textContent))[1]);
  assert.ok(n > 0 && n < 200, `expected a narrowed slice, got ${n}`);
  await until(async () => (await cardText()).includes('WCAG 1.1.1'), 'the current task to be a 1.1.1 case');
});

test('a bad selection dict is refused with a readable message', async () => {
  await backToOverview();
  await ctl.$eval('#dict-json', (n) => { n.value = ''; });
  await ctl.type('#dict-json', '{not json');
  await ctl.click('#dict-form button[type=submit]');
  await until(async () => (await ctl.$eval('#dict-msg', (n) => /Not valid JSON/.test(n.textContent))), 'a JSON error');
  assert.equal(await ctl.$eval('#dict-msg', (n) => n.className), 'msg bad');
  assert.equal(await ctl.$eval('#dict-msg', (n) => n.getAttribute('role')), 'status');
});

test('the console shows the current case, its strata and what each tool said', async () => {
  const text = await cardText();
  assert.match(text, /ALL_ISSUE/);
  assert.match(text, /harness flagged/);
  assert.match(text, /GenA11y flagged/);
  assert.match(text, /axe flagged/);
  // ...and the participant sees the same verdicts with no tool named.
  const shown = await client.evaluate(() => document.body.innerText);
  assert.ok(!/ALL_ISSUE|harness|GenA11y|axe/i.test(shown), 'the participant screen names a tool or a stratum');
});

test('the console spells out which number is which tool', async () => {
  // The numbers are per-participant, so an answer of "2" is meaningless to the
  // operator unless the mapping is on screen beside it.
  await openParticipant();
  const mapping = await ctl.$$eval('.blind-col', (nodes) => nodes.map((n) => ({
    letter: n.querySelector('.blind-letter').textContent,
    tool: n.querySelector('.blind-tool').textContent,
    verdict: n.querySelector('.blind-verdict').textContent,
  })));
  assert.equal(mapping.length, 3);
  assert.deepEqual(mapping.map((m) => m.letter), ['1', '2', '3']);
  assert.deepEqual(mapping.map((m) => m.tool).sort(), ['axe', 'gena11y', 'harness']);
  assert.match(await cardText(), /not answered yet/);
});

test('the console can see and drive the participant\'s evaluation view', async () => {
  await openParticipant();
  // Read the pill itself rather than the page's whole text: the nav button says
  // "Hide evaluation" too, so a substring match over the page can pass on the
  // wrong element and fail on the right one.
  const pill = async () => { await openParticipant(); return ctl.$eval('[data-popup-for]', (n) => n.textContent).catch(() => ''); };
  await until(async () => (await pill()).includes('evaluation'), 'the popup status pill');
  const popupBtn = async () => (await ctl.$$eval('#page-detail .nav button', (nodes) => nodes.map((n) => n.textContent)))
    .findIndex((t) => /evaluation/i.test(t));
  const idx = await popupBtn();
  assert.ok(idx >= 0, 'no evaluation-view button on the participant card');

  await ctl.evaluate((i) => document.querySelectorAll('#page-detail .nav button')[i].click(), idx);
  await until(async () => (await client.$eval('#tool-dialog', (n) => n.open)), 'the popup to open on the client', 30000);
  await until(async () => (await pill()) === 'evaluation open', 'the console to report it open');

  const idx2 = await popupBtn();
  await ctl.evaluate((i) => document.querySelectorAll('#page-detail .nav button')[i].click(), idx2);
  await until(async () => !(await client.$eval('#tool-dialog', (n) => n.open)), 'the popup to close on the client');
  await until(async () => (await pill()) === 'evaluation closed', 'the console to report it closed');
});

test('Next and Prev drive the participant client', async () => {
  // Pin this participant to the lightest pages first, through the same dict
  // form an operator would use - the point of these tests is the console's
  // buttons, not how long a two-megabyte snapshot takes to paint.
  await backToOverview();
  await ctl.$eval('#dict-json', (n) => { n.value = ''; });
  await ctl.type('#dict-json', JSON.stringify({ Robin: LIGHT_CASES }));
  await ctl.click('#dict-form button[type=submit]');
  // The callback runs in the browser, so anything it needs has to be passed in.
  await until(async () => ctl.$eval('#dict-msg', (n, want) => n.textContent.includes(want), `Robin ${LIGHT_CASES.length}`), 'the light assignment');

  // The nav buttons are on the participant's page, and the assignment form is
  // not - go back to them before driving anybody.
  await openParticipant();
  await until(async () => (await client.$eval('#taskline', (n) => /Task 1 of/.test(n.textContent))), 'the client on task 1', 40000);
  await clickNav('next');
  await until(async () => (await client.$eval('#taskline', (n) => /Task 2 of/.test(n.textContent))), 'the client on task 2', 40000);
  await until(async () => (await cardText()).includes('(2/'), 'the console index to follow');

  await clickNav('prev');
  await until(async () => (await client.$eval('#taskline', (n) => /Task 1 of/.test(n.textContent))), 'the client back on task 1', 40000);
});

test('the console shows which tasks are outstanding and jumps to the next one', async () => {
  // Its own participant with a known assignment. Reusing Robin made this
  // depend on how many answers the tests before it happened to leave behind,
  // which is how it first failed: the button was correctly disabled because
  // nothing was outstanding, and the test read that as a broken feature.
  const id = await ctl.evaluate(async (cases) => {
    const post = (path, body) => fetch('/api/control/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).then((r) => r.json());
    const made = await post('participants', { names: ['Gaps'] });
    const pid = made.participants[0].id;
    await post('assign', { selection: { Gaps: { cases } } });
    // Answer the first and the third, leaving gaps at 2 and 4.
    await post('answer', { participant: pid, caseId: cases[0], choices: ['disagree'], comment: 'x' });
    await post('answer', { participant: pid, caseId: cases[2], choices: ['disagree'], comment: 'x' });
    return pid;
  }, LIGHT_CASES);
  assert.ok(id, 'the test participant should have been created');

  await backToOverview();
  await until(async () => (await listText()).includes('Gaps'), 'the new participant in the list');
  // The overview has to show what is outstanding without opening anybody.
  assert.match(await listText(), /Gaps/);
  await openParticipant('Gaps');

  const grid = await until(async () => {
    const g = await ctl.$$eval('#page-detail .tcell', (ns) => ns.map((n) => ({
      n: n.textContent.trim(), done: n.classList.contains('is-done'), current: n.classList.contains('is-current'),
    })));
    return g.length === LIGHT_CASES.length ? g : null;
  }, 'a cell per task');
  assert.deepEqual(grid.map((c) => c.done), [true, false, true, false], 'the grid must mark exactly the answered tasks');
  assert.equal(grid.filter((c) => c.current).length, 1, 'exactly one cell is the current task');
  assert.match(await cardText('Gaps'), /2 of 4 answered · 2 still outstanding/);

  // Sitting on task 1, which is answered: the jump must skip to task 2.
  await clickNav('nextUnfinished');
  await until(async () => {
    const cur = await ctl.$$eval('#page-detail .tcell', (ns) =>
      ns.map((n, i) => (n.classList.contains('is-current') ? i : -1)).filter((i) => i >= 0)[0]);
    return cur === 1;
  }, 'the jump to land on the first unanswered task');

  // From there the next gap is 4 - and getting to it proves the search runs
  // forward rather than always returning the first hole.
  await clickNav('nextUnfinished');
  await until(async () => {
    const cur = await ctl.$$eval('#page-detail .tcell', (ns) =>
      ns.map((n, i) => (n.classList.contains('is-current') ? i : -1)).filter((i) => i >= 0)[0]);
    return cur === 3;
  }, 'the jump to move on to the second gap');

  // Clicking a cell goes straight there, which is the other half of "see what
  // is not finished": the operator can pick any of them, not just the next.
  await ctl.evaluate(() => document.querySelectorAll('#page-detail .tcell')[0].click());
  await until(async () => {
    const cur = await ctl.$$eval('#page-detail .tcell', (ns) =>
      ns.map((n, i) => (n.classList.contains('is-current') ? i : -1)).filter((i) => i >= 0)[0]);
    return cur === 0;
  }, 'a cell click to navigate');

  await ctl.evaluate((pid) => fetch('/api/control/participant-remove', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participant: pid }),
  }), id);
  await backToOverview();
});

test('Reload re-renders the page in the client', async () => {
  await openParticipant();
  await until(async () => client.mainFrame().childFrames().length > 0 && client.mainFrame().childFrames()[0].url().includes('/assets/'), 'the page frame', 40000);
  await client.mainFrame().childFrames()[0].evaluate(() => { window.__mark = 1; }).catch(() => {});
  await clickNav('reload');
  await until(async () => {
    const f = client.mainFrame().childFrames()[0];
    if (!f) return false;
    return f.evaluate(() => window.__mark === undefined).catch(() => false);
  }, 'the frame to reload', 40000);
});

test('the focus monitor follows the participant', async () => {
  await openParticipant();
  const field = (key) => ctl.$eval(`[data-focus-for] [data-field="${key}"]`, (n) => n.textContent).catch(() => null);
  await clickNav('focusTarget');
  await until(async () => (await field('onTarget')) === 'yes', 'the monitor to show the participant on the target', 30000);
  assert.equal(await field('highlight'), 'visible');
  assert.equal(await field('where'), 'page');
  assert.ok((await field('path')).startsWith('/html'), 'the monitor should show the focused element\'s path');
  await ctl.screenshot({ path: path.join(SHOT_DIR, '12-focus-monitor.png') });
});

test('notes are saved per task and come back when you return to it', async () => {
  await openParticipant();
  const note = 'the alt text repeats the caption';
  await ctl.type('.note-row textarea', note);
  await until(async () => {
    const r = await ctl.evaluate(() => fetch('/api/control/state').then((x) => x.json()));
    const p = r.participants[0];
    return Object.values(p.notes).includes(note);
  }, 'the note to reach the server');

  await clickNav('next');
  await until(async () => (await ctl.$eval('.note-row textarea', (n) => n.value === '')), 'an empty note on the next task');
  await clickNav('prev');
  await until(async () => ctl.$eval('.note-row textarea', (n, want) => n.value === want, note), 'the note to come back');
});

test('a live update while typing keeps the caret and the unsaved keystrokes', async () => {
  await openParticipant();
  // The console rebuilds its cards on every state push, and pushes arrive
  // constantly while a participant works. A rebuild must not take the caret
  // away or overwrite what the operator has typed but not yet saved - either
  // one makes it impossible to write anything down while watching someone.
  // focus() alone does not move the caret, so put it at the end explicitly.
  await ctl.$eval('.note-row textarea', (n) => { n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  await ctl.keyboard.type(' and');
  const typed = await ctl.$eval('.note-row textarea', (n) => n.value);

  // Force a state push from somewhere else, inside the debounce window, so the
  // rebuild happens while those four characters exist only in the DOM.
  await ctl.evaluate(async () => {
    const s = await fetch('/api/control/state').then((r) => r.json());
    const p = s.participants[0];
    await fetch('/api/control/note', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant: p.id, caseId: p.taskIds[p.taskIds.length - 1], note: '' }),
    });
  });
  await sleep(300);
  assert.equal(await ctl.$eval('.note-row textarea', (n) => n.value), typed,
    'a rebuild overwrote keystrokes that had not been saved yet');
  assert.equal(await ctl.evaluate(() => document.activeElement.tagName), 'TEXTAREA', 'a rebuild stole the caret');

  await ctl.keyboard.type(' the icon');
  await until(async () => (await ctl.$eval('.note-row textarea', (n) => /and the icon$/.test(n.value))), 'the full typed note');
  await until(async () => ctl.evaluate((want) => fetch('/api/control/state').then((r) => r.json())
    .then((s) => Object.values(s.participants[0].notes).some((v) => v.endsWith(want))), 'and the icon'),
  'the completed note to reach the server');
});

test('closing the study puts the participant back to waiting', async () => {
  await ctl.click('#toggle-open');
  await until(async () => (await client.$eval('#waiting-text', (n) => /Waiting for study to begin/.test(n.textContent))), 'the waiting screen');
  assert.equal(await client.$eval('#waiting', (n) => getComputedStyle(n).display !== 'none'), true);
});

test('signing out closes the console and the participant stops', async () => {
  await ctl.click('#logout');
  await until(async () => (await ctl.$eval('#login', (n) => !n.hidden)), 'the login screen');
  assert.equal(await ctl.$eval('#console', (n) => getComputedStyle(n).display), 'none');
  const r = await ctl.evaluate(() => fetch('/api/control/state').then((x) => x.status));
  assert.equal(r, 401, 'the session cookie should be gone after signing out');
});
