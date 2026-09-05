/**
 * client.e2e.test.js - the participant interface in a real browser.
 *
 * The behaviours checked here are the ones a unit test cannot reach and that
 * the study's validity depends on:
 *
 *   - the client sits at "waiting for study to begin" until the operator is
 *     actually signed in, and moves on its own when they are;
 *   - the highlight is visible and sits on the target;
 *   - the highlight is invisible to assistive technology, so it cannot change
 *     what the participant is judging;
 *   - Escape hides the highlight AND still reaches the page underneath;
 *   - Shift+Enter puts focus on the target, including when the target is not
 *     natively focusable, and the attribute that makes that possible is taken
 *     away again afterwards;
 *   - the operator's prev / next / reload actually drive the client.
 *
 * Screenshots are written to the run's tmp dir so the states can be eyeballed.
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
const SAMPLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/human-study/sample/study-sample-200.json'), 'utf8'));
const PASSWORD = 'e2e-password';
const SHOT_DIR = process.env.STUDY_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-study-shots-'));

let child = null, browser = null, page = null, PORT = 0, sid = '', controlReq = null, participant = null, stateFile = '';

const pageSize = (c) => { try { return fs.statSync(path.join(ROOT, 'assets', c.page.assetDir, c.page.file)).size; } catch (e) { return Infinity; } };
const pick = (fn) => SAMPLE.cases
  .filter((c) => c.scope === 'element' && c.element && !c.element.hidden && !c.element.zeroSize && c.element.rect.w >= 40 && fn(c))
  .sort((a, b) => pageSize(a) - pageSize(b))[0];

// A target that is NOT natively focusable exercises the temporary tabindex path;
// one that IS focusable proves the study leaves such elements untouched. The
// first also has to have at least one checker reporting a problem, or the tool
// view has no sentence to render and the test that checks the wording would
// pass by having nothing to look at.
const flaggedSomewhere = (c) => ['harness', 'gena11y', 'axe'].some((t) => c.tools[t].flagged);
// ...and must not be a frame: an <iframe> does take focus as an element, so it
// would never exercise the temporary-tabindex path this case is here for.
const CASE_UNFOCUSABLE = pick((c) => !c.element.nativelyFocusable && flaggedSomewhere(c) &&
  c.element.tag !== 'iframe' && c.element.tag !== 'frame');
const CASE_FOCUSABLE = pick((c) => c.element.nativelyFocusable);
const CASE_PAGE_SCOPE = SAMPLE.cases.filter((c) => c.scope === 'page').sort((a, b) => pageSize(a) - pageSize(b))[0];
// An element as wide and tall as the browser frame: the marker cannot be drawn
// three pixels outside it and still be on screen, so this is the case that
// exercises pulling the ring inside the viewport instead.
const CASE_FULL_BLEED = SAMPLE.cases
  .filter((c) => c.scope === 'element' && c.element && !c.element.hidden &&
    c.element.rect.w >= 1280 && c.element.rect.h >= 700)
  .sort((a, b) => pageSize(a) - pageSize(b))[0];

function freePort() {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
function api(method, p, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port: PORT, method, path: `/api/control/${p}`,
      headers: { ...(payload ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    }, (res) => {
      const c = [];
      res.on('data', (x) => c.push(x));
      res.on('end', () => {
        const text = Buffer.concat(c).toString('utf8');
        let json = null; try { json = JSON.parse(text); } catch (e) { /* not json */ }
        resolve({ status: res.statusCode, headers: res.headers, json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}
const ctl = (p, body) => api(body ? 'POST' : 'GET', p, body, sid);

/** GET a path outside /api/control - the participant's own API lives at /api/client. */
function get(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (res) => {
      const c = [];
      res.on('data', (x) => c.push(x));
      res.on('end', () => { let j = null; try { j = JSON.parse(Buffer.concat(c).toString('utf8')); } catch (e) { /* not json */ } resolve(j); });
    }).on('error', reject);
  });
}

/** Which letter is which tool for this participant - operator-only knowledge. */
async function mappingFor(id) {
  const s = await ctl('state');
  return (s.json.participants.find((x) => x.id === id) || {}).toolLabels || {};
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll until fn() is truthy, so tests never depend on a fixed sleep. */
async function until(fn, what, ms = 8000) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(100);
  }
}

// The client has exactly one iframe, so it is the main frame's only child.
// Matching on "some frame whose URL contains /assets/" is wrong: several
// snapshots embed their own sub-frames from the same _files directory, and
// whichever of those happened to be first would be returned instead.
const frameDoc = () => page.mainFrame().childFrames()[0] || null;

/**
 * Make sure the evaluation view is open, whichever way it got there.
 *
 * The view opens by itself on every page load, and Continue now advances - so
 * whether it is already up when a test starts depends on what the test before
 * it did and how fast a snapshot loaded. Clicking the toggle unconditionally
 * would close it exactly when it was already open.
 */
async function openEvaluation(what) {
  if (!(await page.$eval('#tool-dialog', (n) => n.open))) await page.click('#toggle-tools');
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), what || 'the evaluation view');
}

async function shot(name) {
  const f = path.join(SHOT_DIR, `${name}.png`);
  await page.screenshot({ path: f });
  return f;
}

test.before(async () => {
  assert.ok(CASE_UNFOCUSABLE && CASE_FOCUSABLE && CASE_PAGE_SCOPE && CASE_FULL_BLEED, 'sample does not contain the case shapes this test needs');
  PORT = await freePort();
  stateFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-study-e2e-')), 'state.json');
  child = spawn(process.execPath, [SERVER, `--port=${PORT}`, `--password=${PASSWORD}`, `--state=${stateFile}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 30000);
    child.stdout.on('data', (d) => { if (String(d).includes('human study server')) { clearTimeout(t); resolve(); } });
    child.on('exit', (c) => { clearTimeout(t); reject(new Error(`server exited ${c}`)); });
  });

  sid = ((await api('POST', 'login', { password: PASSWORD })).headers['set-cookie'][0] || '').split(';')[0];
  participant = (await ctl('participants', { names: ['E2E'] })).json.participants[0];
  await ctl('assign', { selection: { E2E: { cases: [CASE_UNFOCUSABLE.caseId, CASE_FOCUSABLE.caseId, CASE_PAGE_SCOPE.caseId, CASE_FULL_BLEED.caseId] } } });

  browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
});

test.after(async () => {
  if (controlReq) try { controlReq.destroy(); } catch (e) { /* gone */ }
  if (browser) await browser.close();
  if (child) child.kill('SIGTERM');
  console.log(`\n  screenshots: ${SHOT_DIR}`);
});

test('the client waits while the operator is not signed in', async () => {
  await page.goto(`http://127.0.0.1:${PORT}/s/${participant.token}`, { waitUntil: 'domcontentloaded' });
  await until(async () => (await page.$eval('#waiting', (n) => !n.hidden)), 'waiting panel');
  assert.match(await page.$eval('#waiting-text', (n) => n.textContent), /Waiting for study to begin/);
  assert.equal(await page.$eval('#page-frame', (n) => getComputedStyle(n).display), 'none', 'no page should be shown before the study opens');
  assert.equal(await page.$eval('#page-frame', (n) => n.hasAttribute('src')), false);
  // The waiting message is a status region, so a screen reader user is told
  // rather than left on a silent screen.
  assert.equal(await page.$eval('#waiting-text', (n) => n.closest('[role]') && n.closest('[role]').getAttribute('role')), null);
  assert.equal(await page.$eval('#announcer', (n) => n.getAttribute('aria-live')), 'assertive');
  await shot('01-waiting');
});

test('the client starts on its own when the operator opens the study', async () => {
  await ctl('open', { open: true });
  // Opening the flag is not enough - the console has to be watching.
  await sleep(400);
  assert.equal(await page.$eval('#waiting', (n) => !n.hidden), true, 'client moved on before a console stream existed');

  controlReq = http.request({ host: '127.0.0.1', port: PORT, path: '/api/control/events', headers: { Cookie: sid } }, (res) => res.resume());
  controlReq.end();

  await until(async () => (await page.$eval('#page-frame', (n) => !n.hidden)), 'page frame to appear');
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'task line');
  // The header says which task, and deliberately not which criterion: naming
  // the success criterion on screen tells the participant what to go looking
  // for. It is in the payload, and on the operator's console.
  assert.doesNotMatch(await page.$eval('#taskline', (n) => n.textContent), /WCAG|\d\.\d\.\d/,
    'the header must not name the success criterion');
  // Not `hidden` on its own: a class rule with an explicit `display` outranks
  // the user-agent's `[hidden] { display: none }`, so the panel can carry the
  // attribute and still be painted over the page. Ask for the computed style.
  assert.equal(await page.$eval('#waiting', (n) => getComputedStyle(n).display), 'none',
    'the waiting panel is still covering the page');
  assert.ok(await page.$eval('#page-frame', (n) => n.getBoundingClientRect().height > 400),
    'the page frame has no height');
});

test('the highlight lands on the target and is hidden from assistive technology', async () => {
  const doc = await until(async () => {
    const f = frameDoc();
    if (!f) return null;
    const has = await f.$('#a11ystudy-highlight-ring').catch(() => null);
    return has ? f : null;
  }, 'highlight ring inside the page');

  const geom = await doc.evaluate((xpath) => {
    var resolve = window.parent.resolveStudyXpath;
    var el = resolve(xpath, document);
    var ring = document.getElementById('a11ystudy-highlight-ring');
    var r = el.getBoundingClientRect(), g = ring.getBoundingClientRect();
    return {
      ringAriaHidden: ring.getAttribute('aria-hidden'),
      ringRole: ring.getAttribute('role'),
      ringTabindex: ring.getAttribute('tabindex'),
      ringText: ring.textContent,
      display: getComputedStyle(ring).display,
      // The ring is drawn 3px outside the element on every side - except where
      // that would put it off the screen, which is the case for anything that
      // reaches the edge of the frame. Compute the box that is actually
      // expected rather than assuming the element is comfortably inland.
      expected: (function () {
        var INSET = 16, TOUCH = 2;
        var w = Math.max(r.width, 8), h = Math.max(r.height, 8);
        var left = r.left - 3, top = r.top - 3, right = r.left + w + 3, bottom = r.top + h + 3;
        var on = r.left < innerWidth && r.top < innerHeight && r.left + w > 0 && r.top + h > 0;
        if (on) {
          if (r.left <= TOUCH) left = INSET;
          if (r.top <= TOUCH) top = INSET;
          if (r.left + w >= innerWidth - TOUCH) right = innerWidth - INSET;
          if (r.top + h >= innerHeight - TOUCH) bottom = innerHeight - INSET;
        }
        return { left: left, top: top, width: Math.max(right - left, 8), height: Math.max(bottom - top, 8) };
      })(),
      got: { left: g.left, top: g.top, width: g.width, height: g.height },
      inViewport: r.top >= -2 && r.bottom <= innerHeight + 2,
      targetAttrs: el.getAttributeNames(),
      attrs: { role: el.getAttribute('role'), 'aria-label': el.getAttribute('aria-label'), title: el.getAttribute('title'), alt: el.getAttribute('alt') },
    };
  }, CASE_UNFOCUSABLE.xpath);

  assert.equal(geom.ringAriaHidden, 'true', 'the highlight must be aria-hidden');
  assert.equal(geom.ringRole, null, 'the highlight must not carry a role');
  assert.equal(geom.ringTabindex, null, 'the highlight must not be focusable');
  assert.equal(geom.ringText, '', 'the highlight must contribute no text');
  assert.equal(geom.display, 'block');
  for (const side of ['left', 'top', 'width', 'height']) {
    assert.ok(Math.abs(geom.got[side] - geom.expected[side]) <= 1,
      `ring ${side} is ${geom.got[side]}, expected ${geom.expected[side]} (got ${JSON.stringify(geom.got)}, want ${JSON.stringify(geom.expected)})`);
  }
  assert.ok(geom.inViewport, 'the target was not scrolled into view');
  // Nothing was added to the target that a screen reader would read out. The
  // reference is the element as the enrichment pass saw it, before any study
  // code touched the page.
  const src = CASE_UNFOCUSABLE.element;
  assert.equal(geom.attrs.role, src.roleAttr, 'the study changed the target\'s role');
  assert.equal(geom.attrs['aria-label'], src.ariaLabel, 'the study changed the target\'s aria-label');
  assert.equal(geom.attrs.title, src.title, 'the study changed the target\'s title');
  assert.equal(geom.attrs.alt, src.alt, 'the study changed the target\'s alt');
  for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-details', 'aria-live', 'aria-roledescription']) {
    assert.ok(!geom.targetAttrs.includes(attr), `the study added ${attr} to the target`);
  }
  // Before Shift+Enter nothing at all has been added, not even the tabindex.
  assert.ok(!geom.targetAttrs.includes('data-a11ystudy-temp-tabindex'),
    'the study mutated the target just to display the highlight');
  await shot('02-highlight');

  // The decisive check: the browser's own accessibility tree does not contain
  // the ring, so no screen reader can perceive it.
  const ringHandle = await doc.$('#a11ystudy-highlight-ring');
  const ax = await page.accessibility.snapshot({ root: ringHandle, interestingOnly: false });
  assert.ok(ax === null || ax.role === 'none' || ax.role === 'presentation' || ax.ignored,
    `the highlight is exposed to assistive technology as ${JSON.stringify(ax)}`);
  await ringHandle.dispose();
});

test('the tool view shows what each checker said, in that checker\'s own words', async () => {
  // The popup is up from the page load. What is on screen has to be the
  // sentences the sample holds for the tools behind those letters - a card that
  // says "reports a problem here" and nothing else asks the participant to
  // agree with an assertion instead of judging a finding.
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view on load', 30000);
  const view = (await get(`/api/client/task?t=${encodeURIComponent(participant.token)}`)).task;
  const shown = await page.$eval('#tool-grid', (n) => n.textContent.replace(/\s+/g, ' '));
  const mapping = await mappingFor(participant.id);

  for (const col of view.tools.columns) {
    const expected = CASE_UNFOCUSABLE.tools[mapping[col.label]];
    assert.equal(col.reason, expected.flagged ? (expected.reason || '') : '',
      `column ${col.label} was sent the wrong sentence`);
    if (col.reason) {
      assert.ok(shown.includes(col.reason.replace(/\s+/g, ' ')),
        `the sentence for column ${col.label} is not on screen: ${col.reason}`);
    }
  }
  assert.ok(view.tools.columns.some((c) => c.reason), 'this case should have had at least one sentence to show');
  // A tool with no lane for this criterion used to be labelled as not checking
  // it. That note is gone from the participant's screen; `evaluates` still
  // travels with the payload and is still on the operator's console.
  assert.ok(!/does not check/i.test(shown), 'the "does not check" note is still being shown');
  assert.equal(typeof view.tools.columns[0].evaluates, 'boolean');
  await shot('02b-tool-view-reasons');
});

test('Shift+Enter closes the tool view instead of stranding the keyboard behind it', async () => {
  // The tool view is modal. Moving focus into the page while it is open used to
  // leave the participant unable to close anything from the keyboard: every key
  // then goes to the page's own document, and Escape there is never turned into
  // a close request for a dialog in the parent. So Shift+Enter has to take the
  // popup down on its way to the element.
  const doc = frameDoc();
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view to be open');
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');

  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view to close');
  await until(async () => doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    return document.activeElement === el;
  }, CASE_UNFOCUSABLE.xpath), 'focus to reach the target');

  // ...and from there the keyboard still works, which is the whole point.
  await page.keyboard.press('Escape');
  await until(async () => doc.evaluate(() => getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).display === 'none'),
    'Escape from inside the page to hide the highlight');
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await until(async () => doc.evaluate(() => getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).display === 'block'),
    'Shift+Enter from inside the page to bring the highlight back');
});

test('the highlight blinks when it appears, and settles back to how it was', async () => {
  // A ring that simply exists is easy to miss on a busy page, so it blinks
  // twice. The blink is a Web Animation on the ring itself: nothing is added to
  // the page under evaluation, and when it ends the ring is left with exactly
  // the styles it had.
  const doc = frameDoc();
  await page.evaluate(() => { const d = document.getElementById('tool-dialog'); if (d.open) d.close(); });
  await page.keyboard.press('Escape');
  await until(async () => doc.evaluate(() => getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).display === 'none'), 'the ring to be hidden');
  await page.click('#toggle-focus');

  const running = await until(async () => doc.evaluate(() => {
    const r = document.getElementById('a11ystudy-highlight-ring');
    return r && r.getAnimations && r.getAnimations().length ? true : null;
  }), 'the blink to start');
  assert.equal(running, true);

  const samples = [];
  for (let i = 0; i < 10; i++) {
    samples.push(await doc.evaluate(() => Math.round(parseFloat(getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).opacity) * 100)));
    await sleep(80);
  }
  assert.ok(new Set(samples).size > 2, `the ring never changed opacity: ${samples.join(',')}`);
  assert.ok(Math.min(...samples) < 90, `the ring never dimmed: ${samples.join(',')}`);

  // It has to stop, and stop at full strength.
  await until(async () => doc.evaluate(() => {
    const r = document.getElementById('a11ystudy-highlight-ring');
    return r.getAnimations().length === 0 ? true : null;
  }), 'the blink to finish');
  assert.equal(await doc.evaluate(() => getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).opacity), '1');
});

test('Escape hides the highlight and still reaches the page', async () => {
  const doc = frameDoc();
  // The tool view opens itself on every page load and takes Escape while it is
  // up, so close it first - this test is about the highlight, not the popup.
  await page.evaluate(() => { const d = document.getElementById('tool-dialog'); if (d.open) d.close(); });
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view to be closed');
  await doc.evaluate(() => { window.__sawEscape = 0; document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.__sawEscape++; }); });
  await page.focus('#page-frame');
  await doc.evaluate(() => document.body.focus && document.body.focus());
  await page.keyboard.press('Escape');
  await until(async () => (await doc.evaluate(() => getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).display === 'none')), 'ring to hide');
  assert.equal(await doc.evaluate(() => window.__sawEscape), 1,
    'Escape must not be swallowed - several tasks are about what the page does with it');
  await until(async () => (await page.$eval('#announcer', (n) => /Highlight hidden/.test(n.textContent))),
    'the "highlight hidden" announcement');
  await shot('03-escape-dismissed');
});

test('Shift+Enter focuses a target that is not natively focusable, then cleans up', async () => {
  const doc = frameDoc();
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');

  const focused = await until(async () => doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    return document.activeElement === el ? {
      tabindex: el.getAttribute('tabindex'),
      temp: el.getAttribute('data-a11ystudy-temp-tabindex'),
      ring: getComputedStyle(document.getElementById('a11ystudy-highlight-ring')).display,
    } : null;
  }, CASE_UNFOCUSABLE.xpath), 'focus to reach the target');

  assert.equal(focused.tabindex, '-1', 'a non-focusable target needs tabindex="-1" to receive focus');
  assert.equal(focused.temp, '1', 'the added tabindex must be marked as the study\'s own');
  assert.equal(focused.ring, 'block', 'returning to the target should bring the highlight back');
  await shot('04-shift-enter-focused');

  // Escape hides the box, but must not throw the participant off the element
  // they were on - so the tabindex stays while it still holds focus...
  await page.keyboard.press('Escape');
  await until(async () => (await page.$eval('#announcer', (n) => /Highlight hidden/.test(n.textContent))), 'the dismissal announcement');
  assert.ok(await doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    return document.activeElement === el && el.getAttribute('tabindex') === '-1';
  }, CASE_UNFOCUSABLE.xpath), 'dismissing the highlight must not blur the element the participant is on');

  // ...and is given back the moment focus moves away.
  await page.evaluate(() => document.querySelector('.skiplink').focus());
  await until(async () => doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    return !el.hasAttribute('tabindex') && !el.hasAttribute('data-a11ystudy-temp-tabindex');
  }, CASE_UNFOCUSABLE.xpath), 'the temporary tabindex to be removed once focus left');
});

test('the operator sees where the participant is', async () => {
  // Put focus back on the target first: this asserts what the console shows
  // for a participant who is ON the target, so it must not read whatever the
  // previous test happened to leave behind.
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  const f = await until(async () => {
    const s = await ctl('state');
    const p = s.json.participants.find((x) => x.id === participant.id);
    return p && p.focus && p.focus.isTarget ? p.focus : null;
  }, 'a focus report showing the participant on the target');
  assert.equal(f.isTarget, true, 'the console should show the participant is on the target');
  assert.equal(f.where, 'page');
  assert.equal(f.xpath, CASE_UNFOCUSABLE.xpath);
});

test('Next moves the client on, and a natively focusable target is left untouched', async () => {
  await ctl('nav', { participant: participant.id, action: 'next' });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 2 of 4/.test(n.textContent))), 'task 2');
  const doc = await until(async () => {
    const f = frameDoc();
    if (!f || !f.url().includes(encodeURIComponent(CASE_FOCUSABLE.page.file))) return null;
    return (await f.$('#a11ystudy-highlight-ring')) ? f : null;
  }, 'task 2 to render with a highlight', 30000);

  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  const state = await until(async () => doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    return document.activeElement === el ? { temp: el.getAttribute('data-a11ystudy-temp-tabindex'), tabindex: el.getAttribute('tabindex') } : null;
  }, CASE_FOCUSABLE.xpath), 'focus on the focusable target');
  assert.equal(state.temp, null, 'an already-focusable target must not be given a tabindex by the study');
  await shot('05-task2-focusable');
});

test('a page-scope task renders the page with no highlight', async () => {
  await ctl('nav', { participant: participant.id, action: 'next' });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 3 of 4/.test(n.textContent))), 'task 3');
  assert.match(await page.$eval('#taskline', (n) => n.textContent), /whole page/);
  const doc = await until(async () => {
    const f = frameDoc();
    return f && f.url().includes(encodeURIComponent(CASE_PAGE_SCOPE.page.file)) ? f : null;
  }, 'the page-scope page to load', 40000);
  await until(async () => (await page.$eval('#announcer', (n) => /whole page/.test(n.textContent))), 'the whole-page announcement');
  assert.equal(await doc.$('#a11ystudy-highlight-ring'), null, 'a page-scope task must not draw a highlight');
  await shot('06-page-scope');
});

test('Prev goes back and Reload re-renders the same task', async () => {
  await ctl('nav', { participant: participant.id, action: 'prev' });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 2 of 4/.test(n.textContent))), 'back on task 2');

  const doc = await until(async () => {
    const f = frameDoc();
    return f && f.url().includes(encodeURIComponent(CASE_FOCUSABLE.page.file)) && (await f.$('#a11ystudy-highlight-ring')) ? f : null;
  }, 'task 2 highlight before reload', 30000);
  await doc.evaluate(() => { window.__beforeReload = 1; });

  await ctl('nav', { participant: participant.id, action: 'reload' });
  await until(async () => {
    const f = frameDoc();
    if (!f) return false;
    const gone = await f.evaluate(() => window.__beforeReload === undefined).catch(() => false);
    return gone;
  }, 'the frame to actually reload', 30000);
  await until(async () => {
    const f = frameDoc();
    return f && (await f.$('#a11ystudy-highlight-ring'));
  }, 'the highlight to be re-placed after the reload', 30000);
  assert.match(await page.$eval('#taskline', (n) => n.textContent), /Task 2 of 4/);
  await shot('07-after-reload');
});

// --- the blinded tool view ------------------------------------------------

test('the tool view opens by itself when a page loads', async () => {
  await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'task 1');
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view to open on load', 30000);

  // A native <dialog> opened modally, so the page behind it is inert and focus
  // is trapped - both for free, and both things a hand-rolled overlay gets wrong.
  assert.equal(await page.$eval('#tool-dialog', (n) => n.matches(':modal')), true, 'the dialog is not modal');
  assert.equal(await page.$eval('#toggle-tools', (n) => n.getAttribute('aria-pressed')), 'true');
  await shot('09-tool-view');
});

test('the columns show the checkers without naming them', async () => {
  const cards = await page.$$eval('#tool-grid .tool-card', (nodes) => nodes.map((n) => ({
    letter: n.querySelector('.tool-letter').textContent,
    verdict: n.querySelector('.tool-verdict').textContent,
    value: n.querySelector('input').value,
  })));
  const c = CASE_UNFOCUSABLE;
  const unanimous = ['ALL_ISSUE', 'ALL_CLEAN'].includes(c.stratum);
  if (unanimous) {
    assert.equal(cards.length, 1, 'all three agreed, so there should be one column');
    assert.equal(cards[0].letter, '1, 2, 3');
    assert.equal(cards[0].value, 'all');
  } else {
    assert.equal(cards.length, 3);
    assert.deepEqual(cards.map((x) => x.letter), ['1', '2', '3']);
  }
  // Nothing anywhere on the participant's screen may name a tool.
  const shown = await page.evaluate(() => document.body.innerText);
  assert.ok(!/\b(harness|gena11y|axe|ALL_ISSUE|ALL_CLEAN|DIFFER)\b/i.test(shown),
    'the participant screen names a tool or a stratum');
  const markup = await page.$eval('#tool-dialog', (n) => n.outerHTML);
  assert.ok(!/\b(harness|gena11y|axe)\b/i.test(markup), 'the dialog markup carries a tool name');
});

test('Escape and the X both close the tool view, and neither hides the highlight', async () => {
  const doc = frameDoc();
  // Establish the precondition rather than inheriting it from whatever the
  // previous test left behind.
  if (!(await page.$eval('#tool-dialog', (n) => n.open))) await page.click('#toggle-tools');
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the tool view to be open');
  const ringVisible = () => doc.evaluate(() => {
    const r = document.getElementById('a11ystudy-highlight-ring');
    return !!r && getComputedStyle(r).display !== 'none';
  });
  assert.equal(await ringVisible(), true, 'the highlight should be up before we start');

  await page.keyboard.press('Escape');
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the dialog to close on Escape');
  assert.equal(await ringVisible(), true,
    'Escape closing the popup must not also pull the highlight away');
  // `open` is cleared synchronously but the `close` event is queued, so the
  // button catches up a tick later; wait for it rather than racing the spec.
  await until(async () => (await page.$eval('#toggle-tools', (n) => n.getAttribute('aria-pressed'))) === 'false',
    'the toolbar toggle to catch up with the closed dialog');

  await page.click('#toggle-tools');
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the dialog to reopen from the toolbar');
  await page.click('#tool-close');
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the dialog to close from the X');
  assert.equal(await ringVisible(), true);
});

test('the toolbar button always reflects whether the dialog is actually open', async () => {
  // The button state is derived from the dialog, so it cannot drift no matter
  // how the popup was opened or closed. Check it across every route.
  const state = async () => page.evaluate(() => ({
    open: document.getElementById('tool-dialog').open,
    pressed: document.getElementById('toggle-tools').getAttribute('aria-pressed') === 'true',
    label: document.getElementById('toggle-tools-label').textContent,
    key: document.getElementById('toggle-tools-key').textContent,
  }));
  // The label stays "Evaluate"; what tracks the dialog is aria-pressed and the
  // shortcut printed on it - the key that will act next.
  const agrees = (s) => s.pressed === s.open && s.label === 'Evaluate' &&
    (s.open ? s.key === 'Esc' : s.key !== 'Esc' && s.key.length > 0);

  for (const route of [
    () => page.click('#toggle-tools'),
    () => page.keyboard.press('Escape'),
    () => page.click('#toggle-tools'),
    () => page.click('#tool-close'),
    () => page.click('#toggle-tools'),
    () => page.click('#tool-dismiss'),
    () => ctl('popup', { participant: participant.id, action: 'show' }),
    () => ctl('popup', { participant: participant.id, action: 'hide' }),
  ]) {
    await route();
    await sleep(250);
    const s = await state();
    assert.ok(agrees(s), `toolbar out of step with the dialog: ${JSON.stringify(s)}`);
  }
});

test('the focus button does what the key printed on it does, and says which', async () => {
  // Three states, and the button has to be honest about all of them: the label
  // is the action and the key beside it is the shortcut for that same action.
  // "Re-focus" is the one that matters - a participant who tabbed away to try
  // the page needs to get back, and a button still offering "Hide focus" is
  // offering the one thing they did not want.
  const doc = frameDoc();
  const ringVisible = () => doc.evaluate(() => {
    const r = document.getElementById('a11ystudy-highlight-ring');
    return !!r && getComputedStyle(r).display !== 'none';
  });
  const button = () => page.evaluate(() => ({
    label: document.getElementById('toggle-focus-label').textContent,
    key: document.getElementById('toggle-focus-key').textContent,
    pressed: document.getElementById('toggle-focus').getAttribute('aria-pressed'),
  }));
  const onTarget = () => doc.evaluate((xpath) => {
    const el = window.parent.resolveStudyXpath(xpath, document);
    return !!el && document.activeElement === el;
  }, CASE_UNFOCUSABLE.xpath);

  // Clicking it moves focus, exactly as Shift+Enter does.
  await page.click('#toggle-focus');
  await until(async () => onTarget(), 'the button to move focus to the target');
  assert.ok(await ringVisible());
  let b = await button();
  assert.equal(b.label, 'Hide focus', 'standing on the target, the offer is to put it away');
  assert.equal(b.key, 'Esc');
  assert.equal(b.pressed, 'true');

  // Focus moves off on its own: the button must follow.
  await page.evaluate(() => document.querySelector('.skiplink').focus());
  await until(async () => (await button()).label === 'Re-focus', 'the button to offer the way back');
  b = await button();
  assert.notEqual(b.key, 'Esc', 'coming back is the Shift+Enter shortcut, not Escape');
  assert.ok(await ringVisible(), 'losing focus must not hide the highlight');

  // ...and it takes them back.
  await page.click('#toggle-focus');
  await until(async () => onTarget(), 'the button to bring focus back');

  // Escape still hides it whatever the button happens to say.
  await page.keyboard.press('Escape');
  await until(async () => !(await ringVisible()), 'Escape to hide the highlight');
  b = await button();
  assert.equal(b.label, 'Show focus');
  assert.equal(b.pressed, 'false');
});

test('an answer needs a choice, and disagreeing needs a comment', async () => {
  await openEvaluation('the dialog');

  // Continue is not live until something is chosen, and it says so - but it is
  // still reachable and still explains itself, which a `disabled` button cannot
  // do. Both routes to it have to produce the same sentence.
  assert.equal(await page.$eval('#tool-continue', (n) => n.getAttribute('aria-disabled')), 'true',
    'Continue must report itself unavailable with nothing chosen');

  // Taking Enter over for the blocked case must not take it away from the
  // buttons: Enter on Dismiss is that button's own activation and still has to
  // dismiss, with nothing chosen or not.
  await page.focus('#tool-dismiss');
  await page.keyboard.press('Enter');
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'Enter on Dismiss to close the view');
  await openEvaluation('the dialog again');

  await page.click('#tool-continue');
  await until(async () => (await page.$eval('#tool-error', (n) => /Choose a result/.test(n.textContent))), 'the missing-choice error');
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), true, 'an invalid answer must not close the dialog');

  // The error is the participant's only feedback, so it has to be spoken as
  // well as shown: one node carrying both, declared as a live region.
  const live = await page.$eval('#tool-error', (n) => ({
    role: n.getAttribute('role'), live: n.getAttribute('aria-live'), atomic: n.getAttribute('aria-atomic'),
  }));
  assert.deepEqual(live, { role: 'alert', live: 'assertive', atomic: 'true' });

  // Enter is printed on Continue, so Enter has to behave like Continue - a key
  // that silently does nothing is the same dead end as an unexplained button.
  await page.evaluate(() => { document.getElementById('tool-error').textContent = ''; });
  await page.focus('#choice-disagree');
  await page.keyboard.press('Enter');
  await until(async () => (await page.$eval('#tool-error', (n) => /Choose a result/.test(n.textContent))), 'Enter to raise the same error');
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), true, 'Enter must not close the dialog either');

  await page.click('#choice-disagree');
  await until(async () => (await page.$eval('#comment-field', (n) => !n.hidden)), 'the comment box to appear');
  await page.click('#tool-continue');
  await until(async () => (await page.$eval('#tool-error', (n) => /what you found instead/.test(n.textContent))), 'the missing-comment error');
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), true);
});

test('a submitted answer reaches the operator with the tool name resolved', async () => {
  // Announcements have to be collected as they happen, not read off the node
  // afterwards. Continue now advances, so the confirmation is overwritten by
  // the next task's announcement within a few hundred milliseconds - polling
  // the node would be a race that passes or fails on how fast a page loads.
  await page.evaluate(() => {
    window.__ann = [];
    const n = document.getElementById('announcer');
    new MutationObserver(() => { if (n.textContent) window.__ann.push(n.textContent); })
      .observe(n, { childList: true, characterData: true, subtree: true });
  });
  await page.type('#disagree-comment', 'the alt text describes the wrong thing');
  await page.click('#tool-continue');
  await until(async () => (await page.evaluate(() => window.__ann.some((t) => /Answer recorded/.test(t)))), 'the confirmation');

  const p = await until(async () => {
    const s = await ctl('state');
    const x = s.json.participants.find((y) => y.id === participant.id);
    return x && Object.keys(x.responses).length ? x : null;
  }, 'the answer to reach the console');
  const answer = p.responses[CASE_UNFOCUSABLE.caseId];
  assert.deepEqual(answer.choices, ['disagree']);
  assert.deepEqual(answer.tools, []);
  assert.equal(answer.comment, 'the alt text describes the wrong thing');
  assert.deepEqual(Object.values(p.toolLabels).slice().sort(), ['axe', 'gena11y', 'harness']);
  await shot('10-answered');

  // Continue continues: the answer lands and the participant is on the next
  // task, without waiting to be moved. It is the same cursor the operator's
  // Next drives, so the console sees the move like any other.
  await until(async () => (await page.$eval('#taskline', (n) => /Task 2 of 4/.test(n.textContent))), 'Continue to advance the client');
  const moved = await until(async () => {
    const s = await ctl('state');
    const x = s.json.participants.find((y) => y.id === participant.id);
    return x && x.cursor === 1 ? x : null;
  }, 'the console to see the participant move');
  assert.equal(moved.cursor, 1);

  // Put it back for the tests that follow, which are written against task 1.
  await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'back on task 1');
});

test('two columns can be agreed with at once, and disagreeing clears them', async () => {
  // The columns are checkboxes, and "I disagree with all of them" is the one
  // exclusive answer - ticking it must clear the rest rather than sitting
  // alongside them and being refused at the server.
  await openEvaluation('the evaluation view');
  const boxes = await page.$$eval('#tool-grid input[name="choice"]', (n) => n.map((x) => ({ value: x.value, type: x.type })));
  assert.ok(boxes.every((b) => b.type === 'checkbox'), 'the columns must be checkboxes');

  // Opening it puts focus on the first option, and the number keys work from
  // there. They are <input>s, so a guard that skipped inputs wholesale stopped
  // the keys working exactly where focus lands.
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.name), 'choice',
    'focus should start on an option, not the close button');
  // This task already has an answer from the previous test, so the form comes
  // back with it filled in. Start from whatever is on screen rather than
  // assuming a blank one.
  const wasDisagree = await page.$eval('#choice-disagree', (n) => n.checked);
  await page.keyboard.press('4');
  assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), !wasDisagree, '4 must toggle the disagreement');
  await page.keyboard.press('4');
  assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), wasDisagree, 'and toggle it back');

  const firstKey = boxes[0].value === 'all' ? '1' : boxes[0].value;
  await page.keyboard.press('4');
  await page.keyboard.press(firstKey);
  assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), false,
    'ticking a column with the keyboard must clear the disagreement');
  assert.equal(await page.$$eval('#tool-grid input:checked', (n) => n.length), 1, 'the number key should tick its own option');
  await page.keyboard.press(firstKey);
  assert.equal(await page.$$eval('#tool-grid input:checked', (n) => n.length), 0, 'pressing it again should untick it');

  // Escape inside the comment box steps out of the field, and does NOT take the
  // dialog and the half-written reason with it.
  await page.click('#choice-disagree');
  await until(async () => (await page.$eval('#comment-field', (n) => !n.hidden)), 'the comment box');
  // The box comes back holding this task's earlier answer, so clear it before
  // typing - otherwise this asserts on the concatenation of the two.
  await page.$eval('#disagree-comment', (n) => { n.value = ''; });
  await page.click('#disagree-comment');
  await page.keyboard.type('half a th');
  await page.keyboard.press('Escape');
  await sleep(200);
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), true, 'Escape in the comment box must not close the dialog');
  assert.equal(await page.$eval('#disagree-comment', (n) => n.value), 'half a th', 'the half-written reason must survive');
  assert.notEqual(await page.evaluate(() => document.activeElement && document.activeElement.id), 'disagree-comment',
    'Escape should step out of the field');
  await page.keyboard.press('Escape');
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'a second Escape to close it');
  await openEvaluation('the evaluation view again');

  if (boxes.length >= 2) {
    await page.click('#choice-' + boxes[0].value);
    await page.click('#choice-' + boxes[1].value);
    assert.equal(await page.$$eval('#tool-grid input:checked', (n) => n.length), 2, 'two columns should be selectable at once');
    await page.click('#choice-disagree');
    assert.equal(await page.$$eval('#tool-grid input:checked', (n) => n.length), 0,
      'disagreeing with all of them must clear the columns');
    assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), true);
    await page.click('#choice-' + boxes[0].value);
    assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), false,
      'agreeing with a column must clear the disagreement');

    await page.click('#tool-continue');
    // Not "the dialog closes": Continue advances, and the view reopens by
    // itself on the next task - so a closed dialog is a window a poll can miss.
    // The answer reaching the console is the thing this test is about anyway.
    const p2 = await until(async () => {
      const st = await ctl('state');
      const x = st.json.participants.find((y) => y.id === participant.id);
      const a = x && x.responses[CASE_UNFOCUSABLE.caseId];
      return a && a.choices && a.choices[0] === boxes[0].value ? x : null;
    }, 'the multi answer to reach the console');
    const a2 = p2.responses[CASE_UNFOCUSABLE.caseId];
    assert.deepEqual(a2.choices, [boxes[0].value]);
    assert.equal(a2.tools.length, a2.choices[0] === 'all' ? 3 : 1, 'the letters must come back resolved to tools');

    // Put back the answer this task had before, so the test that checks a
    // previous answer is restored is still testing what it was written to test
    // rather than whatever this one happened to leave behind.
    await page.evaluate(async (caseId, comment) => {
      await fetch('/api/client/response', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseId, choices: ['disagree'], comment: comment }),
      });
    }, CASE_UNFOCUSABLE.caseId, 'the alt text describes the wrong thing');
    await until(async () => {
      const st = await ctl('state');
      const x = st.json.participants.find((y) => y.id === participant.id);
      const a = x && x.responses[CASE_UNFOCUSABLE.caseId];
      return a && a.choices && a.choices[0] === 'disagree' ? true : null;
    }, 'the earlier answer to be put back');

    // ...and put the cursor back too, for the same reason: Continue moved them
    // on, and the tests below are written against task 1. Wait for the move to
    // land before undoing it - `advance` is a second request that follows the
    // answer, so a goto issued too early is simply overtaken by it.
    await until(async () => (await page.$eval('#taskline', (n) => /Task 2 of 4/.test(n.textContent))), 'the advance to land', 40000);
    await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
    await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'back on task 1', 40000);
  }
});

test('the operator can open and close the evaluation view remotely', async () => {
  await ctl('popup', { participant: participant.id, action: 'show' });
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the operator to open it');
  await until(async () => {
    const s = await ctl('state');
    const x = s.json.participants.find((y) => y.id === participant.id);
    return x && x.ui && x.ui.popupOpen === true;
  }, 'the console to show the tool view as open');

  await ctl('popup', { participant: participant.id, action: 'hide' });
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the operator to close it');
  await until(async () => {
    const s = await ctl('state');
    const x = s.json.participants.find((y) => y.id === participant.id);
    return x && x.ui && x.ui.popupOpen === false;
  }, 'the console to show it as closed');
});

test('a page that reloads itself does not wipe a half-made answer', async () => {
  // Several snapshots navigate themselves a second or two after `load`, and
  // every load reopens this view. Rebuilding it then would clear a selection
  // the participant had already made on the task they are still on.
  await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'task 1', 40000);
  await openEvaluation('the evaluation view');
  const box = await page.$eval('#tool-grid input[name="choice"]', (n) => n.id);
  await page.click('#' + box);
  assert.equal(await page.$eval('#' + box, (n) => n.checked), true);

  // The operator's "show" runs the same open path a second load would.
  await ctl('popup', { participant: participant.id, action: 'show' });
  await sleep(300);
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), true, 'the view must stay open');
  assert.equal(await page.$eval('#' + box, (n) => n.checked), true, 'reopening the same task must not clear the answer');

  await page.keyboard.press('Escape');
  await until(async () => !(await page.$eval('#tool-dialog', (n) => n.open)), 'the view to close');
  await openEvaluation('the evaluation view again');
  assert.equal(await page.$eval('#' + box, (n) => n.checked), false,
    'closing and reopening must rebuild from the recorded answer, not keep the scratch state');
});

test('a previous answer comes back when the participant returns to a task', async () => {
  // Start from a known task rather than from wherever the last test left the
  // cursor: `next` clamps at the end, so inheriting a cursor silently turns
  // this into a test of a different task.
  await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'task 1', 40000);
  await ctl('nav', { participant: participant.id, action: 'next' });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 2 of 4/.test(n.textContent))), 'task 2', 40000);
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the evaluation view on task 2', 40000);
  assert.equal(await page.$eval('#disagree-comment', (n) => n.value), '', 'task 2 must start with a blank form');

  await ctl('nav', { participant: participant.id, action: 'prev' });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'back on task 1', 40000);
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the evaluation view on task 1', 40000);
  await until(async () => (await page.$eval('#disagree-comment', (n) => n.value === 'the alt text describes the wrong thing')),
    'the previous answer to be restored');
  assert.equal(await page.$eval('#choice-disagree', (n) => n.checked), true);
});

// Runs late on purpose: it records a new answer on C144, which is assigned at
// both index 0 and index 3, and the restore test above reads that answer back.
test('Continue on the last task records it and says so, without wrapping', async () => {
  const last = 3;
  await ctl('nav', { participant: participant.id, action: 'goto', index: last });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 4 of 4/.test(n.textContent))), 'the last task');
  // Wait for the page to actually finish loading before touching the form. The
  // view opens by itself at the load event, and opening it rebuilds the cards
  // and clears the form - so a test that forced it open early and started
  // ticking would have its answer wiped out from under it by the load.
  await until(async () => {
    const f = frameDoc();
    return f && f.url().includes(encodeURIComponent(CASE_FULL_BLEED.page.file));
  }, 'the last task to load', 30000);
  await until(async () => (await page.$eval('#tool-dialog', (n) => n.open)), 'the view to open on its own', 30000);
  await until(async () => { const f = frameDoc(); return f && (await f.$('#a11ystudy-highlight-ring')); },
    'the last task to settle', 30000);

  await page.evaluate(() => {
    window.__ann2 = [];
    const n = document.getElementById('announcer');
    new MutationObserver(() => { if (n.textContent) window.__ann2.push(n.textContent); })
      .observe(n, { childList: true, characterData: true, subtree: true });
  });
  // This fixture assigns the same case at index 0 and 3 - C144 is both the
  // not-natively-focusable target and the full-bleed one - so task 4 comes back
  // carrying task 1's answer. Work from what is on screen rather than assuming
  // a blank form, and send a distinctive comment so the assertion below proves
  // this submission landed rather than reading the earlier one back.
  if (!(await page.$eval('#choice-disagree', (n) => n.checked))) {
    await page.click('#choice-disagree');
    await until(async () => (await page.$eval('#comment-field', (n) => !n.hidden)), 'the comment box');
  }
  await page.$eval('#disagree-comment', (n) => { n.value = ''; });
  await page.type('#disagree-comment', 'nothing after this one');
  await page.click('#tool-continue');

  await until(async () => (await page.evaluate(() => window.__ann2.some((t) => /last task/.test(t)))), 'the end-of-run confirmation');
  // Nothing to advance to, so the view stays shut and the cursor stays put -
  // wrapping round to task 1 would look exactly like a re-run of the study.
  assert.equal(await page.$eval('#tool-dialog', (n) => n.open), false, 'the view must not reopen on the last task');
  const s = await ctl('state');
  const x = s.json.participants.find((y) => y.id === participant.id);
  assert.equal(x.cursor, last, 'the last task must not wrap');
  assert.equal(x.responses[CASE_FULL_BLEED.caseId].comment, 'nothing after this one',
    'the answer given on the last task must be the one recorded');

  await ctl('nav', { participant: participant.id, action: 'goto', index: 0 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 1 of 4/.test(n.textContent))), 'back on task 1');
});

test('closing the study returns the client to waiting', async () => {
  await ctl('open', { open: false });
  await until(async () => (await page.$eval('#waiting', (n) => !n.hidden)), 'the waiting panel to come back');
  assert.equal(await page.$eval('#page-frame', (n) => getComputedStyle(n).display), 'none');
  await shot('08-closed-again');
});

test('an element that reaches the edge of the frame is ringed just inside it', async () => {
  // Three pixels outside a full-bleed element is off the screen, and a marker
  // nobody can see is worse than no marker: the participant is told something
  // is highlighted and finds a bare page. Every side that would fall outside
  // the viewport is pulled back inside instead - far enough in that the white
  // and black halo, which is what makes the ring readable over a photograph,
  // is drawn too.
  await ctl('nav', { participant: participant.id, action: 'goto', index: 3 });
  await until(async () => (await page.$eval('#taskline', (n) => /Task 4 of 4/.test(n.textContent))), 'task 4', 40000);
  const doc = await until(async () => {
    const f = frameDoc();
    if (!f || !f.url().includes(encodeURIComponent(CASE_FULL_BLEED.page.file))) return null;
    return (await f.$('#a11ystudy-highlight-ring')) ? f : null;
  }, 'task 4 to render with a highlight', 40000);

  const g = await until(async () => doc.evaluate((xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    var ring = document.getElementById('a11ystudy-highlight-ring');
    if (!el || !ring || getComputedStyle(ring).display !== 'block') return null;
    var r = el.getBoundingClientRect(), b = ring.getBoundingClientRect();
    return { el: { l: r.left, t: r.top, w: r.width, h: r.height }, ring: { l: b.left, t: b.top, r: b.right, b: b.bottom }, vw: innerWidth, vh: innerHeight };
  }, CASE_FULL_BLEED.xpath), 'the ring on the full-bleed element');

  assert.ok(g.el.w >= g.vw - 1 || g.el.h >= g.vh - 1,
    `this case is meant to reach the frame edge but is ${g.el.w}x${g.el.h} in a ${g.vw}x${g.vh} frame`);
  const INSET = 16, TOUCH = 2;
  if (g.el.l <= TOUCH) assert.ok(Math.abs(g.ring.l - INSET) <= 1, `left edge not pulled inside: ${g.ring.l}`);
  if (g.el.t <= TOUCH) assert.ok(Math.abs(g.ring.t - INSET) <= 1, `top edge not pulled inside: ${g.ring.t}`);
  if (g.el.l + g.el.w >= g.vw - TOUCH) assert.ok(Math.abs(g.ring.r - (g.vw - INSET)) <= 1, `right edge not pulled inside: ${g.ring.r} of ${g.vw}`);
  if (g.el.t + g.el.h >= g.vh - TOUCH) assert.ok(Math.abs(g.ring.b - (g.vh - INSET)) <= 1, `bottom edge not pulled inside: ${g.ring.b} of ${g.vh}`);
  // Whatever else it does, the whole marker has to be on screen.
  assert.ok(g.ring.l >= 0 && g.ring.t >= 0 && g.ring.r <= g.vw && g.ring.b <= g.vh,
    `the marker is off screen: ${JSON.stringify(g.ring)} in ${g.vw}x${g.vh}`);

  await shot('13-full-bleed-ring');

  // ...and the marker tracks the page as it scrolls. The offset between the
  // element and the ring has to stay put, whether the element scrolls with the
  // document or is fixed and stays where it is.
  const tracked = await doc.evaluate(async (xpath) => {
    var el = window.parent.resolveStudyXpath(xpath, document);
    var ring = document.getElementById('a11ystudy-highlight-ring');
    var wait = function () { return new Promise(function (r) { setTimeout(r, 250); }); };
    var out = [];
    for (var i = 0; i < 3; i++) {
      window.scrollTo(0, [0, 400, 1200][i]);
      await wait();
      var r = el.getBoundingClientRect(), b = ring.getBoundingClientRect();
      out.push({ dl: Math.round(b.left - r.left), dt: Math.round(b.top - r.top), display: getComputedStyle(ring).display });
    }
    window.scrollTo(0, 0);
    return out;
  }, CASE_FULL_BLEED.xpath);
  for (const t of tracked) {
    assert.equal(t.display, 'block', 'the marker went missing while scrolling');
    assert.equal(t.dl, tracked[0].dl, `the marker drifted horizontally while scrolling: ${JSON.stringify(tracked)}`);
    assert.equal(t.dt, tracked[0].dt, `the marker drifted vertically while scrolling: ${JSON.stringify(tracked)}`);
  }
});

test('the marker says so when the page draws its own content over the target', async () => {
  // This page keeps the target where it is and scrolls its content across it,
  // so the ring ends up framing a screenful of something else. The marker stays
  // where the element is - the participant still needs to know that - but goes
  // dashed, and the study's own header says why. Neither is in the page.
  const doc = await until(async () => {
    const f = frameDoc();
    if (!f || !f.url().includes(encodeURIComponent(CASE_FULL_BLEED.page.file))) return null;
    return (await f.$('#a11ystudy-highlight-ring')) ? f : null;
  }, 'the full-bleed task', 40000);

  const read = async (y) => {
    await doc.evaluate((ys) => window.scrollTo(0, ys), y);
    // the check is throttled and then has to hold, so give it room to settle
    await sleep(1400);
    const inPage = await doc.evaluate((xpath) => {
      var el = window.parent.resolveStudyXpath(xpath, document);
      var ring = document.getElementById('a11ystudy-highlight-ring');
      var r = el.getBoundingClientRect();
      var hit = 0, tot = 0;
      for (var gx = 1; gx <= 5; gx++) {
        for (var gy = 1; gy <= 5; gy++) {
          var x = r.left + r.width * gx / 6, y = r.top + r.height * gy / 6;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          tot++;
          var top = document.elementFromPoint(x, y);
          if (top === el || (top && el.contains(top))) hit++;
        }
      }
      // Measure how much of the OUTLINE is dashed, by length. Counting
      // segments would make one dashed corner look the same as a whole
      // perimeter, and the point of the change is that the dashing follows
      // where the covering actually is.
      var lines = ring.querySelectorAll('line');
      var total = 0, dashedLen = 0;
      for (var k = 0; k < lines.length; k++) {
        var l = lines[k];
        if (l.getAttribute('stroke') !== '#ff7a00') continue; // count each edge once
        var len = Math.abs(+l.getAttribute('x2') - +l.getAttribute('x1')) +
                  Math.abs(+l.getAttribute('y2') - +l.getAttribute('y1'));
        total += len;
        if (l.getAttribute('stroke-dasharray')) dashedLen += len;
      }
      return { visible: tot ? hit / tot : null, segments: lines.length,
               dashedFraction: total ? dashedLen / total : 0,
               display: getComputedStyle(ring).display };
    }, CASE_FULL_BLEED.xpath);
    const note = await page.$eval('#cover-note', (n) => getComputedStyle(n).display !== 'none');
    return { ...inPage, note };
  };

  const top = await read(0);
  assert.ok(top.visible > 0.25, `this case is meant to start visible, measured ${top.visible}`);
  assert.ok(top.segments >= 8, `the outline should be drawn as segments, got ${top.segments}`);
  // Deliberately not "almost nothing dashed". On this page the site header sits
  // over the top edge of the target and the cookie banner over the bottom, so
  // about half the outline IS over covering content even though 84% of the
  // element's area is visible - and showing that is the whole point. What must
  // hold is that some of it is still solid, and that being buried changes it.
  assert.ok(top.dashedFraction < 0.8,
    `a mostly visible target should keep some solid outline, ${Math.round(top.dashedFraction * 100)}% was dashed`);
  assert.equal(top.note, false, 'the header note should be off while the target is visible');

  const buried = await read(1200);
  assert.ok(buried.visible < 0.10, `this case is meant to be covered further down, measured ${buried.visible}`);
  assert.equal(buried.display, 'block', 'the marker must stay on screen when the target is covered');
  assert.ok(buried.dashedFraction > 0.9,
    `a covered target's outline should be dashed nearly all the way round, got ${Math.round(buried.dashedFraction * 100)}%`);
  assert.ok(buried.dashedFraction > top.dashedFraction + 0.3,
    'being covered should visibly change how much of the outline is dashed');
  assert.equal(buried.note, true, 'the header should say the target is behind the content');
  await shot('14-target-covered');

  // ...and back, so the participant is not left reading a stale warning.
  const again = await read(0);
  assert.ok(Math.abs(again.dashedFraction - top.dashedFraction) < 0.2,
    `the outline should go back to how it was when the target is visible again (${Math.round(again.dashedFraction * 100)}% vs ${Math.round(top.dashedFraction * 100)}%)`);
  assert.equal(again.note, false, 'the header note should clear once the target is visible again');
});
