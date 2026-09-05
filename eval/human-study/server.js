#!/usr/bin/env node
/**
 * server.js - the human-study apparatus: one operator console, N participant
 * clients, and the 56 saved pages served underneath them.
 *
 * Layout
 *   /control            operator console (password)
 *   /s/<token>          participant client (unguessable per-participant URL)
 *   /api/control/*      operator API (session cookie)
 *   /api/client/*       participant API (token cookie or ?t=)
 *   /static/*           study assets
 *   everything else     reverse-proxied to the page server (default :3001)
 *
 * Why proxy instead of pointing the iframe at :3001 directly: the client has to
 * reach into the page's document to place the highlight, move focus, and watch
 * focus events. A different port is a different origin, so contentDocument
 * would be null. Proxying puts the page on the study's own origin, and it also
 * means the study reuses the page server's offline serving (CDN rewrites, CSP,
 * console guard, noscript mode) rather than reimplementing it and drifting.
 *
 * Usage:
 *   node eval/human-study/server.js [--port=4100] [--asset-port=3001]
 *                                   [--password=...] [--sample=<file>]
 *                                   [--state=<file>] [--no-spawn]
 * The control password may also come from STUDY_PASSWORD; with neither, one is
 * generated and printed at startup.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Store, FileBackend, GcsBackend, LABELS, TOOLS } = require('./lib/store');
const { Journal } = require('./lib/journal');
const { GcsBucket } = require('./lib/gcs');
const { selectCases, split, rng, shuffled } = require('./lib/assign');

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(__dirname, 'public');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
// PORT (unprefixed) is what Cloud Run injects; STUDY_PORT stays for local runs.
const PORT = Number(args.port || process.env.PORT || process.env.STUDY_PORT || 4100);
// Bind loopback by default so a workstation run is not exposed on the LAN, and
// all interfaces in a container, where loopback would make the service
// unreachable from outside it.
const HOST = args.host || process.env.HOST || (process.env.K_SERVICE ? '0.0.0.0' : '127.0.0.1');
const ASSET_PORT = Number(args['asset-port'] || 3001);
const ASSET_HOST = args['asset-host'] || '127.0.0.1';
const SAMPLE_FILE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');
const STATE_FILE = path.resolve(ROOT, args.state || 'eval/human-study/data/study-state.json');
const SPAWN_ASSETS = !args['no-spawn'];

// Durable storage. With a bucket the state snapshot and the journal both live
// in Cloud Storage, which is the only thing that survives a Cloud Run instance
// being replaced; without one everything falls back to local files.
const BUCKET_NAME = args.bucket || process.env.STUDY_BUCKET || null;
const STATE_OBJECT = args['state-object'] || process.env.STUDY_STATE_OBJECT || 'state/study-state.json';
const JOURNAL_PREFIX = args['journal-prefix'] || process.env.STUDY_JOURNAL_PREFIX || 'journal';
const JOURNAL_FILE = args['journal-file'] || process.env.STUDY_JOURNAL_FILE ||
  (BUCKET_NAME ? null : path.join(path.dirname(STATE_FILE), 'journal.jsonl'));
const REVISION = process.env.K_REVISION || null;

// --- sample ---------------------------------------------------------------
const sample = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8'));
// One sentence per success criterion, in WCAG's own words, shown as the first
// line of the evaluation view. Loaded here rather than baked into the sample so
// there is a single copy of it; `build-sc-guidance.js` writes the file.
const GUIDANCE_FILE = args.guidance || path.join(__dirname, 'sc-guidance.json');
const GUIDANCE = JSON.parse(fs.readFileSync(GUIDANCE_FILE, 'utf8')).guidance;

const CASES = new Map(sample.cases.map((c) => [c.caseId, c]));
if (!CASES.size) throw new Error(`${SAMPLE_FILE} has no cases`);
{
  // Refuse to start rather than let a participant open the evaluation view to a
  // blank first line - nobody would notice until it had happened to somebody.
  const noText = [...new Set([...CASES.values()].map((c) => c.sc))].filter((sc) => !GUIDANCE[sc]);
  if (noText.length) throw new Error(`no WCAG sentence for ${noText.join(', ')} - run eval/human-study/build-sc-guidance.js`);
}

const bucket = BUCKET_NAME ? new GcsBucket(BUCKET_NAME) : null;
const journal = new Journal({ bucket, prefix: JOURNAL_PREFIX, file: JOURNAL_FILE });
const store = new Store(
  bucket ? new GcsBackend(bucket, STATE_OBJECT) : new FileBackend(STATE_FILE),
  journal,
);

// --- auth -----------------------------------------------------------------
const PASSWORD = String(args.password || process.env.STUDY_PASSWORD || '') || crypto.randomBytes(6).toString('base64url');
const PW_GENERATED = !(args.password || process.env.STUDY_PASSWORD);
const PW_SALT = crypto.randomBytes(16);
const PW_HASH = crypto.scryptSync(PASSWORD, PW_SALT, 32);
const checkPassword = (given) => {
  try {
    const h = crypto.scryptSync(String(given == null ? '' : given), PW_SALT, 32);
    return crypto.timingSafeEqual(h, PW_HASH);
  } catch (e) { return false; }
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const sessions = new Map(); // sid -> { createdAt, lastSeen }
const newSession = () => {
  const sid = crypto.randomBytes(24).toString('base64url');
  sessions.set(sid, { createdAt: Date.now(), lastSeen: Date.now() });
  return sid;
};
const validSession = (sid) => {
  const s = sid && sessions.get(sid);
  if (!s) return false;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) { sessions.delete(sid); return false; }
  s.lastSeen = Date.now();
  return true;
};

// A control session existing is not the same as an operator being present, and
// the participant client is supposed to sit at "waiting for study to begin"
// until someone is actually watching. So the gate is: at least one live control
// SSE connection, and the operator has opened the study.
const controlStreams = new Set();
const clientStreams = new Map(); // participantId -> Set(res)
const controlLoggedIn = () => controlStreams.size > 0;
const studyLive = () => controlLoggedIn() && store.state.studyOpen;

// --- tiny http helpers ----------------------------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const NO_STORE = { 'Cache-Control': 'no-store, must-revalidate' };

function sendJson(res, code, obj, headers = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...NO_STORE, ...headers });
  res.end(body);
}
function sendText(res, code, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, ...NO_STORE });
  res.end(text);
}
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error(`invalid JSON body: ${e.message}`)); }
    });
    req.on('error', reject);
  });
}

// --- SSE ------------------------------------------------------------------
function openStream(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': open\n\n');
}
function push(res, event, data) {
  try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) { /* client gone */ }
}
const broadcastControl = (event, data) => { for (const r of controlStreams) push(r, event, data); };
function pushClient(participantId, event, data) {
  const set = clientStreams.get(participantId);
  if (!set) return 0;
  for (const r of set) push(r, event, data);
  return set.size;
}
const broadcastClients = (event, data) => { for (const id of clientStreams.keys()) pushClient(id, event, data); };

// --- views ----------------------------------------------------------------
/**
 * The three tools' results for one case, blinded.
 *
 * The participant sees letters, never tool names, and the letters mean
 * something different for each participant. What is deliberately NOT sent is
 * anything that would let them work out which tool is which or what the study
 * expects: no tool names, no rule ids (axe's are recognisable on sight), no
 * stratum, no claim family.
 *
 * `evaluates: false` means that tool has no rule for this criterion at all,
 * which is different from checking and finding nothing - the participant is
 * being asked to judge these tools, so flattening those two would misrepresent
 * them. It is still counted as "reports no problem" for agreement, which is the
 * same convention the sample was drawn on.
 */
/**
 * The letters in a stored answer, old shape or new.
 *
 * Answers recorded before multiple selection carry a single `choice`; nothing
 * rewrites them, so every reader goes through here instead of each one deciding
 * for itself what an old row means.
 */
function answerChoices(r) {
  if (!r) return [];
  if (Array.isArray(r.choices)) return r.choices;
  return r.choice ? [r.choice] : [];
}

function answerTools(r) {
  if (!r) return [];
  if (Array.isArray(r.tools)) return r.tools;
  return r.tool ? [r.tool] : [];
}

/**
 * Record an answer, from whoever gave it.
 *
 * Both the participant's own submission and the operator entering one on their
 * behalf come through here, so the validation, the resolution of numbers to
 * tools, and what reaches the journal cannot drift apart between the two. The
 * `via` field is written down: an answer typed by the operator is a different
 * kind of measurement from one the participant gave, and the analysis has to be
 * able to tell them apart.
 *
 * @returns {Promise<{error?: string, status?: number, choices?: string[], comment?: string}>}
 */
async function recordAnswer(p, caseId, body, via) {
  const c = CASES.get(caseId);
  if (!c) return { status: 400, error: 'no such case' };
  if (!p.taskIds.includes(caseId)) return { status: 403, error: 'that case is not assigned to them' };

  // A set, not one answer: the columns are not mutually exclusive, and someone
  // who thinks two of them got it right should be able to say so.
  const raw = Array.isArray(body.choices) ? body.choices : (body.choice ? [body.choice] : []);
  const choices = [...new Set(raw.map((x) => String(x)))];
  const allowed = [...LABELS, 'all', 'disagree'];
  const bad = choices.filter((x) => !allowed.includes(x));
  if (bad.length) return { status: 400, error: `choices must be from ${allowed.join(', ')} (got ${JSON.stringify(bad)})` };
  if (!choices.length) return { status: 400, error: 'choose at least one result, or say you disagree with all of them' };
  const disagrees = choices.includes('disagree');
  if (disagrees && choices.length > 1) {
    return { status: 400, error: 'disagreeing with all of them cannot be combined with agreeing with one' };
  }
  const comment = String(body.comment == null ? '' : body.comment).slice(0, 4000);
  if (disagrees && !comment.trim()) return { status: 400, error: 'disagreeing needs a comment' };

  const blinded = blindedTools(c, p);
  // "all" is the single-column case: the three agreed, so the answer stands for
  // every tool rather than one of them.
  const tools = disagrees ? []
    : choices.flatMap((x) => (x === 'all' ? [...TOOLS] : [p.toolLabels[x]]));
  const previous = p.responses[caseId] || null;
  p.responses[caseId] = {
    choices, tools, comment, via,
    agreed: blinded.agree,
    at: new Date().toISOString(),
    revision: previous ? (previous.revision || 1) + 1 : 1,
  };
  store.logEvent('response', {
    participantId: p.id, participant: p.name, caseId, sc: c.sc, page: c.page.file,
    choices, tools, comment, via, agreed: blinded.agree,
    // The whole mapping, on every answer: the journal has to be readable on its
    // own, without joining back to a state file that may have moved on.
    toolLabels: p.toolLabels,
    verdicts: blinded.columns,
    previous: previous ? { choices: answerChoices(previous), tools: answerTools(previous), comment: previous.comment, via: previous.via || 'participant' } : null,
  });
  await store.save(true);
  broadcastControl('state', controlState());
  return { choices, comment };
}

function blindedTools(c, p) {
  const columns = LABELS.map((label) => {
    const tool = p.toolLabels[label];
    const flagged = !!c.tools[tool].flagged;
    return {
      label,
      verdict: flagged ? 'problem' : 'clear',
      evaluates: !!c.lanes[tool],
      // The sentence the tool gave for flagging it, so the participant judges a
      // finding rather than a bare assertion. Only on a column that reports a
      // problem: a tool that reported nothing has nothing to say, and inventing
      // a sentence for it would be the study talking, not the tool.
      reason: flagged ? (c.tools[tool].reason || '') : '',
    };
  });
  return { columns, agree: columns.every((x) => x.verdict === columns[0].verdict) };
}

/** What the participant is allowed to see about a task: the page and the target. */
function clientTaskView(p) {
  const total = p.taskIds.length;
  if (!total) return { index: 0, total: 0, task: null };
  const idx = Math.max(0, Math.min(p.cursor, total - 1));
  const c = CASES.get(p.taskIds[idx]);
  if (!c) return { index: idx, total, task: null };
  return {
    index: idx,
    total,
    task: {
      caseId: c.caseId,
      sc: c.sc,
      scope: c.scope,
      // Deliberately NOT sent: stratum, pattern, tool verdicts, claim family.
      // The participant is the ground truth; telling them what three tools
      // already said would be the fastest way to destroy the measurement.
      pageTitle: c.page.name,
      pageUrl: `/assets/${c.page.assetDir}/${encodeURIComponent(c.page.file)}${c.page.query}`,
      xpath: c.scope === 'page' ? null : c.xpath,
      status: p.status[c.caseId] || null,
      tools: blindedTools(c, p),
      // What the criterion asks for, in WCAG's words. The number itself stays
      // on the server: naming "1.4.3" tells a participant what to go looking
      // for in a way the sentence does not.
      guidance: (GUIDANCE[c.sc] || {}).sentence || '',
      // Their own previous answer, so returning to a task shows what they said
      // rather than an empty form.
      response: p.responses[c.caseId] ? { choices: answerChoices(p.responses[c.caseId]), comment: p.responses[c.caseId].comment || '', at: p.responses[c.caseId].at } : null,
    },
  };
}

/** Everything the operator is allowed to see - which is everything. */
function controlParticipantView(p) {
  return {
    id: p.id, name: p.name, token: p.token,
    url: `/s/${p.token}`,
    createdAt: p.createdAt,
    taskIds: p.taskIds,
    taskCount: p.taskIds.length,
    cursor: p.cursor,
    connected: (clientStreams.get(p.id) || new Set()).size,
    lastSeen: p.lastSeen,
    focus: p.focus,
    notes: p.notes,
    status: p.status,
    toolLabels: p.toolLabels,
    responses: p.responses,
    ui: p.ui || null,
    answeredCount: Object.keys(p.responses || {}).length,
    // What is left to do. `status`/`doneCount` is the operator's own manual
    // flag and is not set by answering, so it cannot stand in for this.
    unansweredCount: p.taskIds.filter((id) => !p.responses[id]).length,
    // What kind of work this participant is holding, so an assignment by
    // ability can be read back rather than taken on trust.
    abilityMix: p.taskIds.reduce((m, id) => {
      const c = CASES.get(id);
      if (c) m[c.ability || 'untagged'] = (m[c.ability || 'untagged'] || 0) + 1;
      return m;
    }, {}),
    doneCount: Object.values(p.status).filter((s) => s === 'done').length,
    current: (() => {
      const v = clientTaskView(p);
      if (!v.task) return null;
      const c = CASES.get(v.task.caseId);
      return {
        index: v.index, total: v.total, caseId: c.caseId, sc: c.sc, scope: c.scope,
        page: c.page.file, xpath: c.xpath, stratum: c.stratum, pattern: c.pattern,
        lanes: c.lanes, tools: c.tools, element: c.element || null,
        note: p.notes[c.caseId] || '',
        // The same columns the participant is looking at, with the mapping
        // spelled out - the operator has to be able to read their screen.
        blinded: blindedTools(c, p),
        response: p.responses[c.caseId] || null,
      };
    })(),
  };
}
const controlState = () => ({
  studyOpen: store.state.studyOpen,
  live: studyLive(),
  sample: {
    file: path.relative(ROOT, SAMPLE_FILE), cases: sample.cases.length, totals: sample.totals, seed: sample.seed,
    // How big each ability pool is. Three numbers rather than making the
    // console pull all 200 cases down to count them itself.
    abilityTotals: sample.cases.reduce((m, c) => { m[c.ability || 'untagged'] = (m[c.ability || 'untagged'] || 0) + 1; return m; }, {}),
  },
  participants: store.participants().map((p) => controlParticipantView(store.ensureParticipantShape(p))),
});

// --- control API ----------------------------------------------------------
async function handleControlApi(req, res, url, body) {
  const rest = url.pathname.slice('/api/control/'.length);

  if (rest === 'login' && req.method === 'POST') {
    if (!checkPassword(body.password)) {
      // Uniform delay on failure so the endpoint is not a timing oracle and a
      // scripted guesser gets no more than ~2 tries a second.
      await new Promise((r) => setTimeout(r, 500));
      return sendJson(res, 401, { error: 'wrong password' });
    }
    const sid = newSession();
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `study_sid=${sid}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}` });
  }

  const sid = parseCookies(req).study_sid;
  if (!validSession(sid)) return sendJson(res, 401, { error: 'not logged in' });

  switch (`${req.method} ${rest}`) {
    case 'POST logout':
      sessions.delete(sid);
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'study_sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' });

    case 'GET state':
      return sendJson(res, 200, controlState());

    case 'GET sample': {
      // Full sample including tool verdicts - operator eyes only.
      const q = url.searchParams;
      const sel = { pages: q.get('pages'), scs: q.get('scs'), strata: q.get('strata') };
      for (const k of Object.keys(sel)) if (!sel[k]) delete sel[k]; else sel[k] = sel[k].split(',');
      const { caseIds } = Object.keys(sel).length ? selectCases(sample.cases, sel) : { caseIds: [...CASES.keys()] };
      return sendJson(res, 200, { totals: sample.totals, perSc: sample.perSc, cases: caseIds.map((id) => CASES.get(id)) });
    }

    case 'POST open':
      store.setOpen(body.open !== false);
      broadcastClients('state', { live: studyLive() });
      broadcastControl('state', controlState());
      return sendJson(res, 200, { studyOpen: store.state.studyOpen, live: studyLive() });

    case 'POST participants': { // create
      const names = Array.isArray(body.names) ? body.names : (body.name ? [body.name] : []);
      const count = Number(body.count || 0);
      const made = [];
      for (const n of names) made.push(store.addParticipant(n));
      for (let i = 0; i < count; i++) made.push(store.addParticipant(`P${store.participants().length + 1}`));
      if (!made.length) return sendJson(res, 400, { error: 'give names[] or count' });
      broadcastControl('state', controlState());
      return sendJson(res, 200, { participants: made.map(controlParticipantView) });
    }

    case 'POST participant-remove': {
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      pushClient(p.id, 'revoked', {});
      store.removeParticipant(p.id);
      clientStreams.delete(p.id);
      broadcastControl('state', controlState());
      return sendJson(res, 200, { ok: true });
    }

    case 'POST participant-rotate': {
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      pushClient(p.id, 'revoked', {});
      store.rotateToken(p.id);
      clientStreams.delete(p.id);
      broadcastControl('state', controlState());
      return sendJson(res, 200, { participant: controlParticipantView(store.byId(p.id)) });
    }

    case 'POST split': { // divide the sample across participants
      const pool = body.selection ? selectCases(sample.cases, body.selection).caseIds.map((id) => CASES.get(id)) : sample.cases;
      let targets = (body.participants || []).map((r) => store.resolve(r)).filter(Boolean);
      if (!targets.length) targets = store.participants();
      if (!targets.length) return sendJson(res, 400, { error: 'no participants to split across' });
      const lists = split(pool, { n: targets.length, mode: body.mode, anchor: body.anchor, seed: body.seed });
      targets.forEach((p, i) => { p.taskIds = lists[i]; p.cursor = 0; });
      store.logEvent('split', {
        mode: body.mode || 'interleave', anchor: Number(body.anchor || 0), seed: body.seed || null, pool: pool.length,
        assignments: targets.map((p) => ({ participantId: p.id, participant: p.name, taskIds: p.taskIds })),
      });
      await store.save(true);
      for (const p of targets) pushClient(p.id, 'task', clientTaskView(p));
      broadcastControl('state', controlState());
      return sendJson(res, 200, { assigned: targets.map(controlParticipantView) });
    }

    case 'POST assign-by-ability': {
      // Staff the study by what a participant can actually do. The operator
      // picks some participants and one or more ability types; the pool of
      // cases needing those abilities is then either divided between them or
      // given to each of them whole.
      const ABILITIES = ['vision', 'screenreader', 'other'];
      const want = [...new Set((Array.isArray(body.abilities) ? body.abilities : [body.abilities])
        .filter(Boolean).map(String))];
      const unknown = want.filter((a) => !ABILITIES.includes(a));
      if (unknown.length) return sendJson(res, 400, { error: `unknown ability ${unknown.join(', ')} (expected ${ABILITIES.join(', ')})` });
      if (!want.length) return sendJson(res, 400, { error: 'choose at least one ability type' });

      const refs = Array.isArray(body.participants) ? body.participants : [body.participants].filter(Boolean);
      const targets = [], missing = [];
      for (const r of refs) { const p = store.resolve(r); if (p) targets.push(p); else missing.push(String(r)); }
      if (missing.length) return sendJson(res, 404, { error: `no such participant: ${missing.join(', ')}` });
      if (!targets.length) return sendJson(res, 400, { error: 'choose at least one participant' });

      const pool = sample.cases.filter((c) => want.includes(c.ability));
      if (!pool.length) return sendJson(res, 400, { error: 'no cases need those abilities' });

      // 'each' gives every one of them the same pool - that is the shape for
      // measuring agreement between people with the same ability. 'split'
      // divides it, which is the shape for covering ground.
      const each = body.mode === 'each';
      const lists = each
        ? targets.map((_, i) => shuffled(pool, rng(Number(body.seed || 20260825) + i)).map((c) => c.caseId))
        : split(pool, { n: targets.length, mode: body.order, anchor: body.anchor, seed: body.seed });

      // Reassigning never deletes an answer, but it can leave one attached to a
      // case the participant no longer has. Say so rather than letting it be
      // discovered at analysis time.
      const orphaned = [];
      targets.forEach((p, i) => {
        const now = new Set(lists[i]);
        const lost = Object.keys(p.responses || {}).filter((id) => !now.has(id));
        if (lost.length) orphaned.push({ participant: p.name, answers: lost.length, caseIds: lost });
        p.taskIds = lists[i];
        p.cursor = 0;
      });

      store.logEvent('assign-by-ability', {
        abilities: want, mode: each ? 'each' : 'split', pool: pool.length,
        seed: body.seed || null, anchor: Number(body.anchor || 0),
        assignments: targets.map((p) => ({ participantId: p.id, participant: p.name, taskIds: p.taskIds })),
        orphaned,
      });
      await store.save(true);
      for (const p of targets) pushClient(p.id, 'task', clientTaskView(p));
      broadcastControl('state', controlState());
      return sendJson(res, 200, {
        abilities: want, mode: each ? 'each' : 'split', pool: pool.length,
        assigned: targets.map(controlParticipantView), orphaned,
      });
    }

    case 'POST assign': { // apply a JSON selection dict, keyed by participant
      const dict = body.selection || body.dict || body;
      if (!dict || typeof dict !== 'object') return sendJson(res, 400, { error: 'expected a selection object' });
      const applied = [], problems = [];
      for (const [ref, sel] of Object.entries(dict)) {
        if (ref === 'selection' || ref === 'dict') continue;
        const p = store.resolve(ref);
        if (!p) { problems.push({ participant: ref, error: 'no such participant' }); continue; }
        const { caseIds, missing } = selectCases(sample.cases, sel);
        if (missing.length) problems.push({ participant: ref, unknownCases: missing });
        if (!caseIds.length) { problems.push({ participant: ref, error: 'selection matched no cases' }); continue; }
        p.taskIds = caseIds;
        p.cursor = 0;
        applied.push(p);
      }
      store.logEvent('assign', {
        assignments: applied.map((p) => ({ participantId: p.id, participant: p.name, taskIds: p.taskIds })),
        problems,
      });
      await store.save(true);
      for (const p of applied) pushClient(p.id, 'task', clientTaskView(p));
      broadcastControl('state', controlState());
      return sendJson(res, applied.length ? 200 : 400, { assigned: applied.map(controlParticipantView), problems });
    }

    case 'POST nav': { // prev / next / goto / reload, driven from the console
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      const total = p.taskIds.length;
      if (body.action === 'reload') {
        pushClient(p.id, 'reload', {});
        store.logEvent('nav', { participantId: p.id, participant: p.name, action: 'reload', caseId: p.taskIds[p.cursor] || null });
        return sendJson(res, 200, { ok: true, reloaded: true });
      }
      if (!total) return sendJson(res, 400, { error: 'participant has no tasks' });
      const before = p.cursor;
      if (body.action === 'next') p.cursor = Math.min(total - 1, p.cursor + 1);
      else if (body.action === 'prev') p.cursor = Math.max(0, p.cursor - 1);
      else if (body.action === 'goto') p.cursor = Math.max(0, Math.min(total - 1, Number(body.index) || 0));
      else if (body.action === 'next-unanswered') {
        // Forward from where they are, then wrap. Wrapping matters: a
        // participant who worked to the end and left three behind is at the
        // last task, and "next" from there is nothing at all - which is exactly
        // when the operator needs this button. An answer, not the operator's
        // own `done` flag, is what counts as finished.
        const open = (i) => !p.responses[p.taskIds[i]];
        let target = -1;
        for (let i = p.cursor + 1; i < total && target < 0; i++) if (open(i)) target = i;
        for (let i = 0; i <= p.cursor && target < 0; i++) if (open(i)) target = i;
        if (target < 0) return sendJson(res, 200, { ...clientTaskView(p), allAnswered: true, moved: false });
        p.cursor = target;
      }
      else return sendJson(res, 400, { error: `unknown action ${body.action}` });
      store.logEvent('nav', {
        participantId: p.id, participant: p.name, action: body.action,
        from: before, to: p.cursor, caseId: p.taskIds[p.cursor] || null,
      });
      store.save();
      pushClient(p.id, 'task', clientTaskView(p));
      broadcastControl('state', controlState());
      return sendJson(res, 200, clientTaskView(p));
    }

    case 'POST note': {
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      const caseId = body.caseId || (p.taskIds[p.cursor] || null);
      if (!caseId || !CASES.has(caseId)) return sendJson(res, 400, { error: 'no such case' });
      const text = String(body.note == null ? '' : body.note);
      const before = p.notes[caseId] || '';
      if (text) p.notes[caseId] = text; else delete p.notes[caseId];
      if (body.status === 'done' || body.status === 'skipped') p.status[caseId] = body.status;
      else if (body.status === null || body.status === '') delete p.status[caseId];
      // A note is the one thing in this study that cannot be re-created: the
      // participant's session is over. Journal the full text on every edit,
      // including what it replaced, and flush the snapshot without waiting for
      // the debounce.
      store.logEvent('note', {
        participantId: p.id, participant: p.name, caseId,
        sc: CASES.get(caseId).sc, page: CASES.get(caseId).page.file,
        note: text, previous: before, status: p.status[caseId] || null,
      });
      await store.save(true);
      broadcastControl('state', controlState());
      return sendJson(res, 200, { ok: true, caseId, note: p.notes[caseId] || '', status: p.status[caseId] || null });
    }

    case 'POST highlight': { // re-place or dismiss the highlight remotely
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      pushClient(p.id, 'highlight', { action: body.action === 'dismiss' ? 'dismiss' : 'show', focus: !!body.focus });
      return sendJson(res, 200, { ok: true });
    }

    case 'POST answer': {
      // The operator entering an answer for a participant - reading it out over
      // a call, or working through a case with them. It goes through the same
      // recorder as the participant's own submission, and is written down as
      // theirs rather than silently indistinguishable from it.
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      store.ensureParticipantShape(p);
      const caseId = String(body.caseId || p.taskIds[p.cursor] || '');
      const out = await recordAnswer(p, caseId, body, 'operator');
      if (out.error) return sendJson(res, out.status, { error: out.error });
      pushClient(p.id, 'task', clientTaskView(p));
      return sendJson(res, 200, { ok: true, caseId, choices: out.choices });
    }

    case 'POST popup': {
      const p = store.resolve(body.participant);
      if (!p) return sendJson(res, 404, { error: 'no such participant' });
      const action = body.action === 'hide' ? 'hide' : 'show';
      pushClient(p.id, 'popup', { action });
      store.logEvent('popup-command', { participantId: p.id, participant: p.name, action });
      return sendJson(res, 200, { ok: true, action });
    }

    case 'GET export': {
      const rows = [];
      for (const p of store.participants()) {
        p.taskIds.forEach((id, i) => {
          const c = CASES.get(id);
          if (!c) return;
          rows.push({
            participant: p.name, participantId: p.id, position: i + 1,
            caseId: c.caseId, sc: c.sc, scope: c.scope, page: c.page.file, xpath: c.xpath,
            stratum: c.stratum, pattern: c.pattern,
            harnessFlagged: c.tools.harness.flagged, gena11yFlagged: c.tools.gena11y.flagged, axeFlagged: c.tools.axe.flagged,
            harnessLane: c.lanes.harness, gena11yLane: c.lanes.gena11y, axeLane: c.lanes.axe,
            label1: p.toolLabels['1'], label2: p.toolLabels['2'], label3: p.toolLabels['3'],
            responseChoice: answerChoices(p.responses[id]).join(' '),
            responseTool: answerTools(p.responses[id]).join(' '),
            responseComment: (p.responses[id] || {}).comment || '',
            responseAt: (p.responses[id] || {}).at || '',
            status: p.status[id] || '', note: p.notes[id] || '',
          });
        });
      }
      if (url.searchParams.get('format') === 'csv') {
        const cols = Object.keys(rows[0] || { participant: '', caseId: '' });
        const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="study-notes.csv"', ...NO_STORE });
        return res.end(csv);
      }
      // Content-Disposition, like the CSV branch above. Without it the browser
      // treats this as a page it could render, and `<a download>` on a
      // `no-store` JSON response is exactly the combination Chrome refuses with
      // "file not available" - the request succeeds, the download does not.
      return sendJson(res, 200, { exportedAt: new Date().toISOString(), sample: path.relative(ROOT, SAMPLE_FILE), rows },
        { 'Content-Disposition': 'attachment; filename="study-export.json"' });
    }

    case 'GET events': {
      openStream(res);
      controlStreams.add(res);
      push(res, 'state', controlState());
      broadcastClients('state', { live: studyLive() }); // first operator in opens the door
      const beat = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) { /* gone */ } }, 20000);
      req.on('close', () => {
        clearInterval(beat);
        controlStreams.delete(res);
        broadcastClients('state', { live: studyLive() }); // last operator out closes it
      });
      return undefined;
    }

    default:
      return sendJson(res, 404, { error: `unknown control endpoint ${req.method} ${rest}` });
  }
}

// --- client API -----------------------------------------------------------
function participantFor(req, url) {
  const token = url.searchParams.get('t') || parseCookies(req).study_token;
  const p = token ? store.byToken(token) : null;
  return p ? store.ensureParticipantShape(p) : null;
}

async function handleClientApi(req, res, url, body) {
  const rest = url.pathname.slice('/api/client/'.length);
  const p = participantFor(req, url);
  if (!p) return sendJson(res, 401, { error: 'unknown or revoked participant link' });
  p.lastSeen = new Date().toISOString();

  if (rest === 'events' && req.method === 'GET') {
    openStream(res);
    if (!clientStreams.has(p.id)) clientStreams.set(p.id, new Set());
    clientStreams.get(p.id).add(res);
    push(res, 'state', { live: studyLive() });
    if (studyLive()) push(res, 'task', clientTaskView(p));
    broadcastControl('state', controlState());
    const beat = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) { /* gone */ } }, 20000);
    req.on('close', () => {
      clearInterval(beat);
      const set = clientStreams.get(p.id);
      if (set) { set.delete(res); if (!set.size) clientStreams.delete(p.id); }
      store.save();
      broadcastControl('state', controlState());
    });
    return undefined;
  }

  if (rest === 'task' && req.method === 'GET') {
    if (!studyLive()) return sendJson(res, 200, { live: false });
    return sendJson(res, 200, { live: true, ...clientTaskView(p) });
  }

  if (rest === 'focus' && req.method === 'POST') {
    // The participant's current focus, for the operator's monitor. Kept to what
    // identifies the element - never keystrokes, never form values.
    p.focus = {
      at: new Date().toISOString(),
      caseId: body.caseId || null,
      xpath: typeof body.xpath === 'string' ? body.xpath.slice(0, 600) : null,
      tag: typeof body.tag === 'string' ? body.tag.slice(0, 40) : null,
      role: typeof body.role === 'string' ? body.role.slice(0, 60) : null,
      name: typeof body.name === 'string' ? body.name.slice(0, 200) : null,
      isTarget: !!body.isTarget,
      where: body.where === 'shell' ? 'shell' : 'page',
      highlightVisible: !!body.highlightVisible,
      popupOpen: !!body.popupOpen,
    };
    // Journalled but not flushed: focus moves arrive continuously, and the
    // journal batches them. The behavioural trace is worth keeping; forcing a
    // snapshot write per focus change is not.
    store.logEvent('focus', { participantId: p.id, participant: p.name, ...p.focus });
    store.save();
    broadcastControl('focus', { participantId: p.id, focus: p.focus });
    return sendJson(res, 200, { ok: true });
  }

  if (rest === 'response' && req.method === 'POST') {
    // The participant's answer: which lettered column they agree with, or that
    // they disagree with all of them and why. This is the study's primary
    // measurement, so it is journalled with the label AND the tool it stood for
    // - a record that only said "chose B" would be unreadable once the blind is
    // gone - and the snapshot is flushed before the request is answered.
    const caseId = String(body.caseId || '');
    const c = CASES.get(caseId);
    if (!c) return sendJson(res, 400, { error: 'no such case' });
    if (!p.taskIds.includes(caseId)) return sendJson(res, 403, { error: 'that case is not assigned to you' });

    const outcome = await recordAnswer(p, caseId, body, 'participant');
    if (outcome.error) return sendJson(res, outcome.status, { error: outcome.error });
    return sendJson(res, 200, { ok: true, caseId, choices: outcome.choices, comment: outcome.comment });
  }

  if (rest === 'advance' && req.method === 'POST') {
    // Continue moves the participant on. Navigation used to belong entirely to
    // the operator, which made every answer a two-person handshake: the
    // participant finished, then waited to be moved. The operator keeps prev /
    // next / goto - this is the same cursor, moved by the person doing the
    // work, and it is journalled as a nav event like any other so the trace
    // still says who moved them.
    const total = p.taskIds.length;
    if (!total) return sendJson(res, 400, { error: 'no tasks assigned' });
    const from = p.cursor;
    const atEnd = from >= total - 1;
    if (!atEnd) {
      p.cursor = from + 1;
      store.logEvent('nav', {
        participantId: p.id, participant: p.name, action: 'next', via: 'participant',
        from, to: p.cursor, caseId: p.taskIds[p.cursor] || null,
      });
      store.save();
      pushClient(p.id, 'task', clientTaskView(p));
      broadcastControl('state', controlState());
    }
    return sendJson(res, 200, { ok: true, advanced: !atEnd, atEnd, index: p.cursor, total });
  }

  if (rest === 'ui' && req.method === 'POST') {
    // Whether the evaluation view is open on the participant's screen, so the
    // operator can see what they are looking at before nudging them.
    p.ui = {
      at: new Date().toISOString(),
      popupOpen: !!body.popupOpen,
      highlightVisible: !!body.highlightVisible,
      caseId: body.caseId || null,
    };
    store.save();
    broadcastControl('ui', { participantId: p.id, ui: p.ui });
    return sendJson(res, 200, { ok: true });
  }

  if (rest === 'progress' && req.method === 'POST') {
    // The client reports which task it is actually showing, so a reload or a
    // participant-driven move stays in sync with the console.
    const idx = Number(body.index);
    if (Number.isFinite(idx) && idx >= 0 && idx < p.taskIds.length && idx !== p.cursor) {
      p.cursor = idx;
      store.logEvent('progress', { participantId: p.id, participant: p.name, index: idx, caseId: p.taskIds[idx] || null });
      store.save();
      broadcastControl('state', controlState());
    }
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: `unknown client endpoint ${req.method} ${rest}` });
}

// --- static ---------------------------------------------------------------
function serveStatic(res, rel) {
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) return sendText(res, 403, 'Forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return sendText(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', ...NO_STORE });
    res.end(buf);
  });
}

// --- proxy to the page server --------------------------------------------
function proxy(req, res, url) {
  const opts = {
    host: ASSET_HOST,
    port: ASSET_PORT,
    method: req.method,
    path: url.pathname + url.search,
    headers: { ...req.headers, host: `${ASSET_HOST}:${ASSET_PORT}` },
  };
  delete opts.headers.cookie; // never leak study cookies into the page under test
  const up = http.request(opts, (r) => {
    const headers = { ...r.headers };
    // The page server's CSP is written for its own origin; 'self' means this
    // origin once proxied, which is what we want. Drop framing bans in case a
    // snapshot carried one, since the whole client is an iframe.
    delete headers['x-frame-options'];
    res.writeHead(r.statusCode || 502, headers);
    r.pipe(res);
  });
  up.on('error', (e) => {
    if (res.headersSent) { try { res.end(); } catch (_) {} return; }
    sendText(res, 502, `page server unreachable at ${ASSET_HOST}:${ASSET_PORT} (${e.message})`);
  });
  req.pipe(up);
}

// --- routing --------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  try {
    if (p === '/' ) return sendText(res, 200, 'A11y human study server. Operator console: /control', 'text/plain; charset=utf-8');

    // /healthz as well as /_status because the two are not interchangeable:
    // Cloud Run reserves /healthz at its front end and answers it itself, so a
    // deployed service is only reachable at /_status, while /healthz is the
    // conventional name to reach for locally. Both are served here so the same
    // check works in both places.
    if (p === '/_status' || p === '/healthz') {
      // Unauthenticated on purpose - it is the container's liveness signal and
      // says nothing about the study beyond whether storage is working.
      // Errors SINCE the last successful save, not errors ever. "It saved once,
      // hours ago, and every write since has been refused" is the failure this
      // has to catch, and a cumulative counter reports that as healthy.
      const ok = store.stats.errorsSinceSave === 0;
      return sendJson(res, ok ? 200 : 500, {
        ok,
        revision: REVISION,
        storage: { backend: store.backend.kind, at: store.backend.describe, ...store.stats },
        journal: { runId: journal.runId, ...journal.stats },
        participants: store.participants().length,
        studyOpen: store.state.studyOpen,
        consoleConnected: controlStreams.size,
        uptimeSec: Math.round(process.uptime()),
      });
    }
    if (p === '/control' || p === '/control/') return serveStatic(res, 'control.html');
    if (p.startsWith('/static/')) return serveStatic(res, p.slice('/static/'.length));

    if (p.startsWith('/s/')) { // participant entry point: set the cookie, serve the shell
      const token = decodeURIComponent(p.slice('/s/'.length).replace(/\/$/, ''));
      const participant = store.byToken(token);
      if (!participant) return sendText(res, 404, 'This study link is not valid. Please ask the study operator for a new one.', 'text/plain; charset=utf-8');
      const html = fs.readFileSync(path.join(PUBLIC, 'client.html'), 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': `study_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict`,
        ...NO_STORE,
      });
      return res.end(html);
    }

    if (p.startsWith('/api/')) {
      let body = {};
      if (req.method === 'POST') {
        try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      }
      if (p.startsWith('/api/control/')) return await handleControlApi(req, res, url, body);
      if (p.startsWith('/api/client/')) return await handleClientApi(req, res, url, body);
      return sendJson(res, 404, { error: 'unknown api' });
    }

    // Pages and their subresources. Gated: the corpus is 51 snapshots of real
    // websites, and the service is public so participants can reach it by
    // link, so anything that is not a signed-in operator or a participant
    // holding a live token gets nothing.
    const cookies = parseCookies(req);
    const asParticipant = cookies.study_token ? store.byToken(cookies.study_token) : null;
    if (!asParticipant && !validSession(cookies.study_sid)) {
      return sendText(res, 403, 'The study pages are only served to a signed-in operator or an active participant link.');
    }
    return proxy(req, res, url);
  } catch (e) {
    console.error('[study] unhandled', e);
    if (!res.headersSent) sendJson(res, 500, { error: String(e && e.message || e) });
    else try { res.end(); } catch (_) { /* already gone */ }
  }
});

// --- page server lifecycle ------------------------------------------------
let shuttingDown = false;

function probeAssets() {
  return new Promise((resolve) => {
    const r = http.get({ host: ASSET_HOST, port: ASSET_PORT, path: '/assets/pages.json', timeout: 1500 }, (x) => {
      x.resume();
      resolve(x.statusCode === 200);
    });
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
  });
}

let assetChild = null;
let assetRestarts = 0;
async function ensureAssets() {
  if (await probeAssets()) { console.log(`[study] page server already up on ${ASSET_HOST}:${ASSET_PORT}`); return; }
  if (!SPAWN_ASSETS) { console.warn(`[study] no page server on ${ASSET_HOST}:${ASSET_PORT} and --no-spawn is set - pages will 502`); return; }
  console.log('[study] starting page server (node server.js)');
  assetChild = spawn(process.execPath, [path.join(ROOT, 'server.js')], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  assetChild.stdout.on('data', (d) => process.stdout.write(`[pages] ${d}`));
  assetChild.stderr.on('data', (d) => process.stderr.write(`[pages] ${d}`));
  assetChild.on('exit', (code) => {
    assetChild = null;
    if (shuttingDown) return;
    // The page server dying mid-study would leave every participant looking at
    // a blank frame, and a study session can run for hours. Bring it back,
    // backing off so a crash loop does not become a busy loop.
    assetRestarts++;
    const wait = Math.min(30000, 500 * Math.pow(2, Math.min(assetRestarts, 6)));
    console.error(`[study] page server exited (${code}); restart ${assetRestarts} in ${wait}ms`);
    journal.append('page-server-exit', { code, restart: assetRestarts });
    setTimeout(() => { if (!shuttingDown && !assetChild) ensureAssets().catch(() => {}); }, wait);
  });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await probeAssets()) { console.log('[study] page server ready'); return; }
  }
  console.warn('[study] page server did not come up in 10s');
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  // Cloud Run sends SIGTERM and then waits ~10s, so the flush has to be
  // bounded: a hung network write must not cost us the local mirror and the
  // clean exit. Whatever cannot be written here is already in Cloud Logging,
  // which the journal writes to synchronously on every event.
  console.log(`[study] ${signal || 'shutdown'} - flushing state and journal`);
  const deadline = new Promise((r) => setTimeout(() => r('timeout'), 8000));
  try {
    const how = await Promise.race([store.close().then(() => 'flushed'), deadline]);
    console.log(`[study] shutdown ${how}; saves=${store.stats.saves} journalled=${journal.stats.appended} batches=${journal.stats.batches} errors=${store.stats.errors + journal.stats.errors}`);
  } catch (e) {
    console.error(`[study] shutdown flush failed: ${e && e.message}`);
  }
  if (assetChild) { try { assetChild.kill('SIGTERM'); } catch (e) { /* already gone */ } }
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
// A crash that takes the process down still gets one attempt at the journal.
process.on('uncaughtException', (e) => {
  console.error('[study] uncaught exception', e);
  journal.append('uncaught-exception', { message: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 2000) });
  shutdown('uncaughtException');
});

(async () => {
  // Load the state before anything can mutate it. If storage is unreachable or
  // holds something unreadable, fail here rather than serving an empty study
  // and overwriting a real one on the first save.
  try {
    await store.init();
  } catch (e) {
    console.error(`[study] FATAL ${e.message}`);
    process.exit(1);
  }
  await ensureAssets();
  server.listen(PORT, HOST, () => {
    const shown = HOST === '0.0.0.0' ? `port ${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`\n  human study server  ${shown}`);
    if (HOST !== '0.0.0.0') console.log(`  operator console    http://${HOST}:${PORT}/control`);
    console.log(`  control password    ${PW_GENERATED ? `${PASSWORD}   (generated - pass --password=... or set STUDY_PASSWORD to pin it)` : '(from --password / STUDY_PASSWORD)'}`);
    console.log(`  sample              ${path.relative(ROOT, SAMPLE_FILE)}  (${sample.cases.length} cases)`);
    console.log(`  state               ${store.backend.describe}  (${store.participants().length} participant(s))`);
    console.log(`  journal             ${bucket ? `gs://${BUCKET_NAME}/${JOURNAL_PREFIX}/${journal.runId}/` : JOURNAL_FILE} + stdout`);
    if (REVISION) console.log(`  revision            ${REVISION}`);
    console.log('');
    journal.append('server-start', { revision: REVISION, port: PORT, backend: store.backend.kind, sample: path.relative(ROOT, SAMPLE_FILE), cases: sample.cases.length });
  });
})();

module.exports = { server, store, CASES };
