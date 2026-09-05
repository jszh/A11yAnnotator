/**
 * server.test.js - the study server over real HTTP.
 *
 * Runs the actual CLI against a scratch state file so the tests exercise the
 * same startup path the operator uses. The page server is not spawned
 * (--no-spawn): nothing here needs the 56 pages, and the end-to-end test that
 * does starts its own.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const SERVER = path.join(ROOT, 'eval/human-study/server.js');
const PASSWORD = 'test-password-do-not-reuse';

let child = null;
let PORT = 0;
let stateFile = '';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });
}

function request(method, urlPath, { body, cookie, raw } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port: PORT, method, path: urlPath,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* not json */ }
        resolve({ status: res.statusCode, headers: res.headers, text, json: raw ? null : json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Open an SSE stream and collect events; resolve on the first matching event. */
function stream(urlPath, cookie) {
  const events = [];
  let req = null;
  const waiters = [];
  const p = new Promise((resolve, reject) => {
    req = http.request({ host: '127.0.0.1', port: PORT, path: urlPath, headers: cookie ? { Cookie: cookie } : {} }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`stream ${urlPath} -> ${res.statusCode}`));
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => {
        buf += c;
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const ev = /^event: (.+)$/m.exec(block);
          const data = /^data: (.+)$/m.exec(block);
          if (ev && data) {
            const rec = { event: ev[1], data: JSON.parse(data[1]) };
            events.push(rec);
            for (let w = waiters.length - 1; w >= 0; w--) {
              if (waiters[w].match(rec)) { waiters[w].resolve(rec); waiters.splice(w, 1); }
            }
          }
        }
      });
      resolve();
    });
    req.on('error', reject);
    req.end();
  });
  return {
    ready: p,
    events,
    close: () => { try { req.destroy(); } catch (e) { /* already gone */ } },
    waitFor: (match, ms = 4000) => new Promise((resolve, reject) => {
      const hit = events.find(match);
      if (hit) return resolve(hit);
      const w = { match, resolve };
      waiters.push(w);
      setTimeout(() => {
        const i = waiters.indexOf(w);
        if (i >= 0) waiters.splice(i, 1);
        reject(new Error(`timed out waiting for event on ${urlPath}; saw ${JSON.stringify(events.map((e) => e.event))}`));
      }, ms);
    }),
  };
}

test.before(async () => {
  PORT = await freePort();
  stateFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-study-')), 'state.json');
  child = spawn(process.execPath, [SERVER, `--port=${PORT}`, `--password=${PASSWORD}`, `--state=${stateFile}`, '--no-spawn'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 15000);
    child.stdout.on('data', (d) => { if (String(d).includes('human study server')) { clearTimeout(t); resolve(); } });
    child.on('exit', (c) => { clearTimeout(t); reject(new Error(`server exited ${c}`)); });
  });
});

test.after(() => { if (child) child.kill('SIGTERM'); });

// --- auth -----------------------------------------------------------------
test('control API refuses everything without a session', async () => {
  for (const [method, p] of [['GET', 'state'], ['POST', 'open'], ['GET', 'export'], ['GET', 'sample']]) {
    const r = await request(method, `/api/control/${p}`, { body: method === 'POST' ? {} : undefined });
    assert.equal(r.status, 401, `${method} ${p} should be 401`);
  }
});

test('wrong password is rejected', async () => {
  const r = await request('POST', '/api/control/login', { body: { password: 'nope' } });
  assert.equal(r.status, 401);
  assert.ok(!r.headers['set-cookie'], 'a rejected login must not set a session cookie');
});

let sid = '';
test('correct password issues an HttpOnly session cookie', async () => {
  const r = await request('POST', '/api/control/login', { body: { password: PASSWORD } });
  assert.equal(r.status, 200);
  const c = (r.headers['set-cookie'] || [])[0] || '';
  assert.match(c, /^study_sid=/);
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Strict/);
  sid = c.split(';')[0];
});

test('an unknown participant link is not served', async () => {
  const r = await request('GET', '/s/definitely-not-a-token');
  assert.equal(r.status, 404);
  assert.ok(!(r.headers['set-cookie'] || []).length, 'a bad link must not set a token cookie');
});

// --- participants and the waiting gate ------------------------------------
let p1 = null;
let p2 = null;
test('participants get unguessable links', async () => {
  const r = await request('POST', '/api/control/participants', { body: { names: ['Alice', 'Bob'] }, cookie: sid });
  assert.equal(r.status, 200);
  [p1, p2] = r.json.participants;
  assert.equal(p1.name, 'Alice');
  assert.ok(p1.token.length >= 20, 'token too short to be unguessable');
  assert.notEqual(p1.token, p2.token);
  assert.equal(p1.url, `/s/${p1.token}`);
});

test('the client link serves the shell and sets a token cookie', async () => {
  const r = await request('GET', p1.url);
  assert.equal(r.status, 200);
  assert.match(r.text, /Waiting for study to begin/);
  const c = (r.headers['set-cookie'] || [])[0] || '';
  assert.match(c, /^study_token=/);
  assert.match(c, /HttpOnly/);
});

test('a participant sees no task until the operator opens the study', async () => {
  const r = await request('GET', `/api/client/task?t=${encodeURIComponent(p1.token)}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.live, false, 'study must not be live before the operator opens it');
});

let controlStream = null;
test('opening the study needs BOTH an open flag and a live console', async () => {
  // Flag on, but no console stream connected yet -> still not live.
  let r = await request('POST', '/api/control/open', { body: { open: true }, cookie: sid });
  assert.equal(r.json.studyOpen, true);
  assert.equal(r.json.live, false, 'no console stream is connected, so the study is not live');

  controlStream = stream('/api/control/events', sid);
  await controlStream.ready;
  await controlStream.waitFor((e) => e.event === 'state');

  r = await request('GET', `/api/client/task?t=${encodeURIComponent(p1.token)}`);
  assert.equal(r.json.live, true, 'with the flag set and a console connected the study is live');
});

test('closing the study puts participants back to waiting', async () => {
  await request('POST', '/api/control/open', { body: { open: false }, cookie: sid });
  const r = await request('GET', `/api/client/task?t=${encodeURIComponent(p1.token)}`);
  assert.equal(r.json.live, false);
  await request('POST', '/api/control/open', { body: { open: true }, cookie: sid });
});

// --- assignment -----------------------------------------------------------
test('split divides the sample across participants', async () => {
  const r = await request('POST', '/api/control/split', { body: { mode: 'interleave', anchor: 6, seed: 5 }, cookie: sid });
  assert.equal(r.status, 200);
  const [a, b] = r.json.assigned;
  assert.equal(a.taskCount + b.taskCount, 200 + 6, 'anchor cases are the only ones assigned twice');
  const shared = a.taskIds.filter((id) => b.taskIds.includes(id));
  assert.equal(shared.length, 6);
});

test('a JSON selection dict assigns per participant', async () => {
  const r = await request('POST', '/api/control/assign', {
    body: { selection: { Alice: { scs: ['1.1.1'], strata: ['ALL_ISSUE'] }, Bob: { pages: ['Kahoot!.htm'] }, Nobody: { scs: ['1.1.1'] } } },
    cookie: sid,
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.assigned.length, 2);
  const alice = r.json.assigned.find((p) => p.name === 'Alice');
  assert.ok(alice.taskCount > 0);
  assert.deepEqual(r.json.problems, [{ participant: 'Nobody', error: 'no such participant' }]);
});

test('assign by ability hands out only what that ability can judge', async () => {
  // Its own participants, created and removed here: these tests reassign task
  // lists and record answers, and doing that to the shared fixtures made the
  // count assertions in unrelated tests depend on this file's running order.
  const sample = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/human-study/sample/study-sample-200.json'), 'utf8'));
  const pool = (a) => sample.cases.filter((c) => a.includes(c.ability)).map((c) => c.caseId);
  const byId = new Map(sample.cases.map((c) => [c.caseId, c]));
  const made = (await request('POST', '/api/control/participants', { body: { names: ['AbA', 'AbB'] }, cookie: sid })).json.participants;

  try {
    let r = await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['AbA', 'AbB'], abilities: ['vision'], mode: 'split' }, cookie: sid,
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.pool, pool(['vision']).length);
    const [a, b] = r.json.assigned;
    assert.equal(a.taskCount + b.taskCount, r.json.pool, 'dividing must hand out every case exactly once');
    for (const p of [a, b]) {
      for (const id of p.taskIds) assert.equal(byId.get(id).ability, 'vision', `${id} is not a vision case`);
      assert.deepEqual(Object.keys(p.abilityMix), ['vision'], 'the console must be able to read the mix back');
    }
    assert.equal(new Set([...a.taskIds, ...b.taskIds]).size, r.json.pool, 'dividing must not duplicate');

    // Two abilities at once, and 'each' gives them the same pool, not a share.
    r = await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['AbA', 'AbB'], abilities: ['screenreader', 'other'], mode: 'each' }, cookie: sid,
    });
    const want = pool(['screenreader', 'other']);
    assert.equal(r.json.pool, want.length);
    for (const p of r.json.assigned) {
      assert.equal(p.taskCount, want.length, "'each' gives everybody the whole pool");
      assert.deepEqual([...p.taskIds].sort(), [...want].sort());
    }
    // Same set, different order - order effects must not line up across people.
    assert.notDeepEqual(r.json.assigned[0].taskIds, r.json.assigned[1].taskIds);

    // Refusals rather than a silent empty assignment.
    r = await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['AbA'], abilities: ['telepathy'] }, cookie: sid,
    });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /unknown ability/);
    r = await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['Nobody'], abilities: ['vision'] }, cookie: sid,
    });
    assert.equal(r.status, 404);
  } finally {
    for (const m of made) await request('POST', '/api/control/participant-remove', { body: { participant: m.id }, cookie: sid });
  }
});

test('reassigning by ability reports answers it leaves behind', async () => {
  // Answers are never deleted, but reassigning can strand one on a case the
  // participant no longer holds. That is the one consequence of reassigning
  // that reassigning again does not undo, so it has to be said out loud.
  const p = (await request('POST', '/api/control/participants', { body: { names: ['AbC'] }, cookie: sid })).json.participants[0];
  try {
    await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['AbC'], abilities: ['screenreader'], mode: 'each' }, cookie: sid,
    });
    const before = (await request('GET', '/api/control/state', { cookie: sid })).json
      .participants.find((x) => x.id === p.id);
    const stranded = before.taskIds[0];
    await request('POST', '/api/control/answer', {
      body: { participant: p.id, caseId: stranded, choices: ['disagree'], comment: 'x' }, cookie: sid,
    });

    const r = await request('POST', '/api/control/assign-by-ability', {
      body: { participants: ['AbC'], abilities: ['vision'], mode: 'each' }, cookie: sid,
    });
    assert.equal(r.json.orphaned.length, 1, 'the stranded answer must be reported');
    assert.equal(r.json.orphaned[0].participant, 'AbC');
    assert.ok(r.json.orphaned[0].caseIds.includes(stranded));

    const after = (await request('GET', '/api/control/state', { cookie: sid })).json
      .participants.find((x) => x.id === p.id);
    assert.ok(after.responses[stranded], 'and the answer itself must still be there');
  } finally {
    await request('POST', '/api/control/participant-remove', { body: { participant: p.id }, cookie: sid });
  }
});

test('a selection that matches nothing is reported, not silently applied', async () => {
  const before = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice').taskCount;
  const r = await request('POST', '/api/control/assign', { body: { selection: { Alice: { scs: ['9.9.9'] } } }, cookie: sid });
  assert.equal(r.status, 400);
  assert.match(JSON.stringify(r.json.problems), /matched no cases/);
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice').taskCount;
  assert.equal(after, before, 'a failed selection must leave the previous assignment alone');
});

// --- what the participant is allowed to see -------------------------------
test('the client task view carries the checker results but never their identity', async () => {
  // The participant is now shown what each checker said - that is the point of
  // the tool view - so the invariant is no longer "no tool information". It is
  // that nothing in the payload reveals WHICH checker is which, or what the
  // sample expects the answer to be.
  const r = await request('GET', `/api/client/task?t=${encodeURIComponent(p1.token)}`);
  assert.equal(r.json.live, true);
  const keys = Object.keys(r.json.task);
  for (const forbidden of ['stratum', 'pattern', 'lanes', 'claimFamily', 'element']) {
    assert.ok(!keys.includes(forbidden), `client task view leaks "${forbidden}"`);
  }
  const payload = JSON.stringify(r.json);
  // Word-bounded on purpose. The payload now carries sentences written about
  // real pages, and a substring match rejects "difference" as if it were the
  // DIFFER stratum - a test that fails on the content of a checker's prose
  // would be a test that has to be edited every time the corpus changes.
  assert.ok(!/\b(harness|gena11y|axe|ALL_ISSUE|ALL_CLEAN|DIFFER)\b/i.test(payload),
    'client payload names a tool or a stratum');

  const cols = r.json.task.tools.columns;
  assert.deepEqual(cols.map((c) => c.label), ['1', '2', '3']);
  for (const c of cols) {
    assert.ok(c.verdict === 'problem' || c.verdict === 'clear');
    assert.equal(typeof c.evaluates, 'boolean');
    assert.deepEqual(Object.keys(c).sort(), ['evaluates', 'label', 'reason', 'verdict']);
    assert.equal(typeof c.reason, 'string');
    // A tool that reported nothing has nothing to say. Filling that in would be
    // the study putting words in a checker's mouth.
    if (c.verdict === 'clear') assert.equal(c.reason, '', 'a clear column carries a reason');
  }
  assert.equal(r.json.task.tools.agree, cols.every((c) => c.verdict === cols[0].verdict));
  assert.ok(r.json.task.pageUrl.startsWith('/assets/'));
  assert.ok(r.json.task.sc);
});

test('each participant gets their own random 1/2/3 mapping', async () => {
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  for (const p of state.participants) {
    assert.deepEqual(Object.keys(p.toolLabels).sort(), ['1', '2', '3']);
    assert.deepEqual(Object.values(p.toolLabels).slice().sort(), ['axe', 'gena11y', 'harness'],
      'a mapping must be a permutation of the three tools, not a repeat');
  }
  // Over many draws the mapping must actually vary, or the blind is cosmetic.
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const made = await request('POST', '/api/control/participants', { body: { names: [`perm${i}`] }, cookie: sid });
    const p = made.json.participants[0];
    seen.add(['1', '2', '3'].map((l) => p.toolLabels[l]).join('-'));
    await request('POST', '/api/control/participant-remove', { body: { participant: p.id }, cookie: sid });
  }
  assert.ok(seen.size >= 4, `only ${seen.size} distinct mappings in 30 draws - the shuffle looks stuck`);
});

test('the verdicts shown match what the sample says the tools reported', async () => {
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  const p = state.participants.find((x) => x.id === p1.id);
  const cur = p.current;
  for (const col of cur.blinded.columns) {
    const tool = p.toolLabels[col.label];
    assert.equal(col.verdict, cur.tools[tool].flagged ? 'problem' : 'clear', `column ${col.label} misreports ${tool}`);
    assert.equal(col.evaluates, cur.lanes[tool], `column ${col.label} misreports whether ${tool} has a lane`);
    // The sentence has to be the one that tool actually gave, or the
    // participant is judging a finding nobody made.
    assert.equal(col.reason, cur.tools[tool].flagged ? (cur.tools[tool].reason || '') : '',
      `column ${col.label} shows the wrong sentence for ${tool}`);
  }
});

test('a response is recorded against the tool the number stood for', async () => {
  const before = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((x) => x.id === p1.id);
  const caseId = before.current.caseId;
  const r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choice: '2', comment: '' },
  });
  assert.equal(r.status, 200);
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((x) => x.id === p1.id);
  assert.deepEqual(after.responses[caseId].choices, ['2']);
  assert.deepEqual(after.responses[caseId].tools, [before.toolLabels['2']],
    'the stored answer must name the tool, not just the number the participant saw');
  assert.equal(after.answeredCount, 1);
});

test('a participant can agree with more than one of them', async () => {
  // The columns are not mutually exclusive - two checkers can both be right
  // about the same element - so an answer is a set, and it has to come back
  // resolved to the tools those letters stood for.
  const before = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((x) => x.id === p1.id);
  const caseId = before.current.caseId;
  const r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choices: ['1', '3'], comment: '' },
  });
  assert.equal(r.status, 200);
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((x) => x.id === p1.id);
  assert.deepEqual(after.responses[caseId].choices, ['1', '3']);
  assert.deepEqual(after.responses[caseId].tools, [before.toolLabels['1'], before.toolLabels['3']]);

  // ...and "I disagree with all of them" is the one answer that cannot be
  // combined with agreeing with one of them.
  const bad = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choices: ['1', 'disagree'], comment: 'both somehow' },
  });
  assert.equal(bad.status, 400);
  assert.match(bad.json.error, /cannot be combined/);

  const empty = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choices: [], comment: '' },
  });
  assert.equal(empty.status, 400);
  assert.match(empty.json.error, /at least one/);
});

test('disagreeing requires a comment', async () => {
  const caseId = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((x) => x.id === p1.id).current.caseId;
  let r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choice: 'disagree', comment: '   ' },
  });
  assert.equal(r.status, 400);
  assert.match(r.json.error, /needs a comment/);

  r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, {
    body: { caseId, choice: 'disagree', comment: 'the alt text is present but wrong' },
  });
  assert.equal(r.status, 200);
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((x) => x.id === p1.id);
  assert.deepEqual(after.responses[caseId].tools, [], 'disagreeing does not stand for any tool');
  assert.equal(after.responses[caseId].comment, 'the alt text is present but wrong');
  assert.ok(after.responses[caseId].revision >= 2, 'answering again must be recorded as a revision');
});

test('a nonsense choice, or one for somebody else\'s task, is refused', async () => {
  const caseId = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((x) => x.id === p1.id).current.caseId;
  let r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, { body: { caseId, choice: '9' } });
  assert.equal(r.status, 400);
  r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, { body: { caseId: 'C999', choice: '1' } });
  assert.equal(r.status, 400);
  // A case that exists but was never assigned to this participant.
  const mine = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((x) => x.id === p1.id).taskIds;
  const notMine = [...Array(200).keys()].map((i) => `C${String(i + 1).padStart(3, '0')}`).find((id) => !mine.includes(id));
  r = await request('POST', `/api/client/response?t=${encodeURIComponent(p1.token)}`, { body: { caseId: notMine, choice: 'A' } });
  assert.equal(r.status, 403);
});

test('the operator can see and drive the tool view', async () => {
  const client = stream(`/api/client/events?t=${encodeURIComponent(p1.token)}`);
  await client.ready;
  await client.waitFor((e) => e.event === 'task');

  await request('POST', '/api/control/popup', { body: { participant: 'Alice', action: 'show' }, cookie: sid });
  const shown = await client.waitFor((e) => e.event === 'popup');
  assert.equal(shown.data.action, 'show');
  await request('POST', '/api/control/popup', { body: { participant: 'Alice', action: 'hide' }, cookie: sid });
  await client.waitFor((e) => e.event === 'popup' && e.data.action === 'hide');

  await request('POST', `/api/client/ui?t=${encodeURIComponent(p1.token)}`, { body: { popupOpen: true, highlightVisible: false } });
  const ev = await controlStream.waitFor((e) => e.event === 'ui');
  assert.equal(ev.data.ui.popupOpen, true);
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  assert.equal(state.participants.find((x) => x.id === p1.id).ui.popupOpen, true);
  client.close();
});

// --- navigation, notes, focus --------------------------------------------
test('prev / next / goto move the participant and push the new task', async () => {
  const client = stream(`/api/client/events?t=${encodeURIComponent(p1.token)}`);
  await client.ready;
  await client.waitFor((e) => e.event === 'task');

  let r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'next' }, cookie: sid });
  assert.equal(r.json.index, 1);
  const pushed = await client.waitFor((e) => e.event === 'task' && e.data.index === 1);
  assert.equal(pushed.data.task.caseId, r.json.task.caseId);

  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'prev' }, cookie: sid });
  assert.equal(r.json.index, 0);
  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'goto', index: 3 }, cookie: sid });
  assert.equal(r.json.index, 3);
  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'goto', index: 9999 }, cookie: sid });
  assert.ok(r.json.index < r.json.total, 'goto must clamp instead of running off the end');

  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'reload' }, cookie: sid });
  assert.equal(r.status, 200);
  await client.waitFor((e) => e.event === 'reload');
  client.close();
});

test('the participant can advance themselves, and cannot run off the end', async () => {
  // Continue moves them on. It is the same cursor prev/next drives, so it has
  // to push the new task down the client stream and show up in the console -
  // otherwise the operator's view silently drifts from the participant's.
  await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'goto', index: 0 }, cookie: sid });
  const client = stream(`/api/client/events?t=${encodeURIComponent(p1.token)}`);
  await client.ready;
  await client.waitFor((e) => e.event === 'task');

  let r = await request('POST', '/api/client/advance', { body: {}, cookie: `study_token=${p1.token}` });
  assert.equal(r.status, 200);
  assert.equal(r.json.advanced, true);
  assert.equal(r.json.index, 1);
  const pushed = await client.waitFor((e) => e.event === 'task' && e.data.index === 1);
  assert.ok(pushed.data.task, 'advancing must push the task the participant is now on');

  const seen = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((x) => x.name === 'Alice');
  assert.equal(seen.cursor, 1, 'the console must see a participant-driven move');

  // The last task is the end of the road: advancing there is a no-op, not a
  // clamp that silently re-serves the same task as if they had moved.
  const total = seen.taskIds.length;
  await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'goto', index: total - 1 }, cookie: sid });
  r = await request('POST', '/api/client/advance', { body: {}, cookie: `study_token=${p1.token}` });
  assert.equal(r.json.advanced, false);
  assert.equal(r.json.atEnd, true);
  assert.equal(r.json.index, total - 1);
  client.close();
});

test('next-unanswered finds the gaps, wraps, and stops when there are none', async () => {
  // The operator could only ever see the task a participant happened to be on,
  // so gaps left behind were invisible. Wrapping is the point of the button:
  // someone who worked to the end and skipped three sits on the LAST task,
  // where plain "next" has nowhere to go.
  const alice = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice');
  const ids = alice.taskIds;
  assert.ok(ids.length >= 4, 'this test needs a few tasks');

  // Answer everything except positions 1 and 3 (0-based), then park at the end.
  for (let i = 0; i < ids.length; i++) {
    if (i === 1 || i === 3) continue;
    await request('POST', '/api/client/response', {
      body: { caseId: ids[i], choices: ['disagree'], comment: 'x' },
      cookie: `study_token=${p1.token}`,
    });
  }
  await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'goto', index: ids.length - 1 }, cookie: sid });

  // From the last task there is nothing ahead, so it has to wrap to find 1.
  let r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'next-unanswered' }, cookie: sid });
  assert.equal(r.json.index, 1, 'should wrap round to the first gap');
  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'next-unanswered' }, cookie: sid });
  assert.equal(r.json.index, 3, 'and then find the next one forward');

  const seen = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice');
  assert.equal(seen.unansweredCount, 2, 'the console needs the outstanding count to label the button');

  // Fill the last two: the action must then report there is nothing to go to
  // rather than moving somewhere arbitrary.
  for (const i of [1, 3]) {
    await request('POST', '/api/client/response', {
      body: { caseId: ids[i], choices: ['disagree'], comment: 'x' },
      cookie: `study_token=${p1.token}`,
    });
  }
  const before = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice').cursor;
  r = await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'next-unanswered' }, cookie: sid });
  assert.equal(r.json.allAnswered, true);
  assert.equal(r.json.moved, false);
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json
    .participants.find((p) => p.name === 'Alice');
  assert.equal(after.cursor, before, 'with nothing outstanding the cursor must not move');
  assert.equal(after.unansweredCount, 0);
});

test('notes are stored per participant per case and survive navigation', async () => {
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  const alice = state.participants.find((p) => p.name === 'Alice');
  const caseId = alice.taskIds[0];
  await request('POST', '/api/control/note', { body: { participant: 'Alice', caseId, note: 'looks like a real barrier', status: 'done' }, cookie: sid });
  await request('POST', '/api/control/nav', { body: { participant: 'Alice', action: 'next' }, cookie: sid });
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json.participants.find((p) => p.name === 'Alice');
  assert.equal(after.notes[caseId], 'looks like a real barrier');
  assert.equal(after.status[caseId], 'done');
  assert.equal(after.doneCount, 1);
});

test('focus reports reach the console', async () => {
  await request('POST', `/api/client/focus?t=${encodeURIComponent(p1.token)}`, {
    body: { xpath: '/html/body/div[2]/a[1]', tag: 'a', role: 'link', name: 'Contact us', isTarget: true, where: 'page', highlightVisible: true },
  });
  const ev = await controlStream.waitFor((e) => e.event === 'focus');
  assert.equal(ev.data.participantId, p1.id);
  assert.equal(ev.data.focus.name, 'Contact us');
  assert.equal(ev.data.focus.isTarget, true);
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  assert.equal(state.participants.find((p) => p.id === p1.id).focus.tag, 'a');
});

test('focus reports are capped so a hostile client cannot fill the state file', async () => {
  await request('POST', `/api/client/focus?t=${encodeURIComponent(p1.token)}`, {
    body: { xpath: 'x'.repeat(5000), tag: 'y'.repeat(500), name: 'z'.repeat(5000) },
  });
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  const f = state.participants.find((p) => p.id === p1.id).focus;
  assert.ok(f.xpath.length <= 600 && f.tag.length <= 40 && f.name.length <= 200);
});

// --- export ---------------------------------------------------------------
test('export carries the note, the ground-truth strata and the tool verdicts', async () => {
  const r = await request('GET', '/api/control/export', { cookie: sid });
  assert.equal(r.status, 200);
  const row = r.json.rows.find((x) => x.note);
  assert.ok(row, 'no exported row carries the note that was written');
  for (const k of ['stratum', 'pattern', 'harnessFlagged', 'gena11yFlagged', 'axeFlagged', 'harnessLane', 'sc', 'page', 'xpath',
    'label1', 'label2', 'label3', 'responseChoice', 'responseTool', 'responseComment']) {
    assert.ok(k in row, `export row missing ${k}`);
  }
  const csv = await request('GET', '/api/control/export?format=csv', { cookie: sid, raw: true });
  assert.match(csv.headers['content-type'], /text\/csv/);
  assert.match(csv.text.split('\n')[0], /participant,participantId,position,caseId/);
});

// --- link lifecycle -------------------------------------------------------
test('both exports download as files rather than rendering in the tab', async () => {
  // The JSON export used to send no Content-Disposition while the CSV one did.
  // The request succeeded either way, so nothing looked broken from here - but
  // `<a download>` on a `no-store` JSON response is the combination Chrome
  // refuses with "file not available", and the operator could not get their
  // data out.
  for (const [q, name, type] of [['', 'study-export.json', /application\/json/], ['?format=csv', 'study-notes.csv', /text\/csv/]]) {
    const r = await request('GET', `/api/control/export${q}`, { cookie: sid, raw: q !== '' });
    assert.equal(r.status, 200, `${name} should be served`);
    assert.match(String(r.headers['content-type']), type);
    assert.equal(r.headers['content-disposition'], `attachment; filename="${name}"`,
      `${name} must be sent as a download`);
  }
});

test('rotating a link kills the old one', async () => {
  const old = p2.token;
  const r = await request('POST', '/api/control/participant-rotate', { body: { participant: 'Bob' }, cookie: sid });
  assert.equal(r.status, 200);
  assert.notEqual(r.json.participant.token, old);
  const dead = await request('GET', `/api/client/task?t=${encodeURIComponent(old)}`);
  assert.equal(dead.status, 401);
  p2 = r.json.participant;
});

test('removing a participant removes their access and their rows', async () => {
  await request('POST', '/api/control/participant-remove', { body: { participant: 'Bob' }, cookie: sid });
  const dead = await request('GET', `/api/client/task?t=${encodeURIComponent(p2.token)}`);
  assert.equal(dead.status, 401);
  const state = (await request('GET', '/api/control/state', { cookie: sid })).json;
  assert.ok(!state.participants.some((p) => p.name === 'Bob'));
});

test('state survives a restart', async () => {
  const before = (await request('GET', '/api/control/state', { cookie: sid })).json;
  child.kill('SIGTERM');
  await new Promise((r) => child.on('exit', r));
  child = spawn(process.execPath, [require('path').join(ROOT, 'eval/human-study/server.js'), `--port=${PORT}`, `--password=${PASSWORD}`, `--state=${stateFile}`, '--no-spawn'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('restart failed')), 15000);
    child.stdout.on('data', (d) => { if (String(d).includes('human study server')) { clearTimeout(t); resolve(); } });
  });
  const login = await request('POST', '/api/control/login', { body: { password: PASSWORD } });
  sid = (login.headers['set-cookie'][0] || '').split(';')[0];
  const after = (await request('GET', '/api/control/state', { cookie: sid })).json;
  assert.equal(after.participants.length, before.participants.length);
  const a = after.participants.find((p) => p.name === 'Alice');
  const b = before.participants.find((p) => p.name === 'Alice');
  assert.deepEqual(a.taskIds, b.taskIds);
  assert.deepEqual(a.notes, b.notes);
  assert.equal(a.token, b.token, 'a restart must not invalidate the links already handed out');
});
