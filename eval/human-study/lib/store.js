/**
 * store.js - the study's whole mutable state, and where it is kept.
 *
 * A study session is a long, interruptible thing run by one operator against a
 * handful of participants, so every mutation is written through and the server
 * can be restarted mid-session without losing assignments or notes. On a
 * workstation "written through" means a file; on Cloud Run the container's disk
 * is gone the moment the instance is replaced, so it means an object in Google
 * Cloud Storage.
 *
 * Two things make that safe rather than merely working:
 *
 *   - Writes carry the generation the state was read at, so a write from a
 *     process holding a stale copy is refused rather than silently winning.
 *     The service runs single-instance, so this should never fire in steady
 *     state; it does fire on every deployment, because the outgoing revision
 *     keeps serving for a few seconds after the incoming one has read the
 *     state. That is handled by re-reading and reclaiming, not by giving up:
 *     an instance that holds a generation which can never match again stops
 *     writing the snapshot altogether while the study carries on around it.
 *   - Every mutation also appends to the journal (lib/journal.js), which is
 *     append-only and independent. The snapshot can be rebuilt from it; a bad
 *     snapshot write cannot destroy the history.
 *
 * Notes and statuses flush immediately. Everything else is debounced, because
 * cursor moves and focus reports arrive constantly and are recoverable.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** The three lanes the study compares, in their canonical order. */
const TOOLS = ['harness', 'gena11y', 'axe'];

/**
 * A random A/B/C -> tool assignment. Fisher-Yates over crypto bytes rather than
 * Math.random: this is the blind in a study, so it should not come from a
 * generator that is seeded predictably.
 */
function randomLabels() {
  const order = TOOLS.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { 1: order[0], 2: order[1], 3: order[2] };
}

/** The participant-facing labels, in the order they are shown. */
const LABELS = ['1', '2', '3'];

const EMPTY = () => ({
  schema: 'human-study-state/1',
  createdAt: new Date().toISOString(),
  studyOpen: false,
  participants: [],
  log: [],
});

// --- backends -------------------------------------------------------------

class FileBackend {
  constructor(file) { this.file = file; this.kind = 'file'; this.describe = file; }

  async load() {
    try {
      return { text: fs.readFileSync(this.file, 'utf8'), generation: null };
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      return null;
    }
  }

  async save(text) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, this.file); // atomic: a crash mid-write cannot truncate the state
    return { generation: null };
  }
}

class GcsBackend {
  constructor(bucket, object) {
    this.bucket = bucket;
    this.object = object;
    this.kind = 'gcs';
    this.describe = `gs://${bucket.bucket}/${object}`;
    this.generation = null;
  }

  async load() {
    const got = await this.bucket.read(this.object);
    if (!got) return null;
    this.generation = got.generation;
    return got;
  }

  async save(text) {
    // null generation means "we have never seen this object", which must only
    // succeed if it still does not exist.
    const precondition = this.generation === null ? 0 : this.generation;
    const gen = await this.bucket.write(this.object, text, { ifGenerationMatch: precondition });
    if (gen === null) {
      const conflict = new Error(`state at ${this.describe} was written by someone else (had generation ${precondition})`);
      conflict.code = 'GENERATION_CONFLICT';
      throw conflict;
    }
    this.generation = gen;
    return { generation: gen };
  }
}

// --- store ----------------------------------------------------------------

class Store {
  /**
   * @param {FileBackend|GcsBackend} backend
   * @param {import('./journal').Journal|null} journal
   */
  constructor(backend, journal = null) {
    this.backend = backend;
    this.journal = journal;
    this.state = EMPTY();
    this._timer = null;
    this._dirty = false;
    this._writing = Promise.resolve();
    this.stats = { saves: 0, errors: 0, errorsSinceSave: 0, lastError: null, lastSaveAt: null, conflicts: 0, reclaims: 0 };
  }

  async init() {
    let got = null;
    try {
      got = await this.backend.load();
    } catch (e) {
      // Refusing to start beats starting empty and overwriting a live study on
      // the first save.
      throw new Error(`could not read study state from ${this.backend.describe}: ${e.message}`);
    }
    if (!got) {
      this.state = EMPTY();
      if (this.journal) this.journal.append('state-init', { backend: this.backend.kind, at: this.backend.describe, existing: false });
      return this.state;
    }
    let parsed = null;
    try { parsed = JSON.parse(got.text); } catch (e) {
      throw new Error(`study state at ${this.backend.describe} is not valid JSON (${e.message}); refusing to start and overwrite it`);
    }
    if (!parsed || parsed.schema !== 'human-study-state/1') {
      throw new Error(`study state at ${this.backend.describe} has schema ${parsed && parsed.schema}, expected human-study-state/1`);
    }
    this.state = parsed;
    if (this.journal) {
      this.journal.append('state-init', {
        backend: this.backend.kind, at: this.backend.describe, existing: true,
        participants: this.state.participants.length,
        notes: this.state.participants.reduce((n, p) => n + Object.keys(p.notes || {}).length, 0),
      });
    }
    return this.state;
  }

  /** Debounced write-through. `now` skips the debounce for data we cannot lose. */
  save(now = false) {
    this._dirty = true;
    if (now) {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      return this.flush();
    }
    if (this._timer) return this._writing;
    this._timer = setTimeout(() => { this._timer = null; this.flush(); }, 400);
    return this._writing;
  }

  flush() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (!this._dirty) return this._writing;
    this._dirty = false;
    const text = JSON.stringify(this.state, null, 2);
    this._writing = this._writing.then(async () => {
      try {
        await this.backend.save(text);
        this.stats.saves++;
        this.stats.errorsSinceSave = 0;
        this.stats.lastSaveAt = new Date().toISOString();
        return;
      } catch (e) {
        if (e.code !== 'GENERATION_CONFLICT') {
          this.stats.errors++;
          this.stats.errorsSinceSave++;
          this.stats.lastError = String(e && e.message || e);
          console.error(`[store] save failed: ${this.stats.lastError}`);
          this._dirty = true; // try again on the next save
          return;
        }
        this.stats.conflicts++;
        this.stats.lastError = String(e && e.message || e);
        // Someone wrote the object between our read and our write. Refusing is
        // right; refusing FOREVER is not, and that is what happens if the
        // generation we hold is never refreshed - which is exactly the state a
        // fresh instance is left in when the revision it replaced writes once
        // more on its way out. So find out where the object actually is, say so
        // in the journal, and take it.
        if (!(await this._reclaim(e))) {
          this.stats.errors++;
          this.stats.errorsSinceSave++;
          this._dirty = true;
          return;
        }
        try {
          await this.backend.save(text);
          this.stats.saves++;
          this.stats.reclaims++;
          this.stats.errorsSinceSave = 0;
          this.stats.lastSaveAt = new Date().toISOString();
        } catch (again) {
          // Still contested: the other writer is alive and writing. One retry
          // per flush, so this cannot become a fight; the next mutation tries
          // again, and it converges the moment the other one stops.
          this.stats.errors++;
          this.stats.errorsSinceSave++;
          this.stats.lastError = String(again && again.message || again);
          this._dirty = true;
        }
      }
    });
    return this._writing;
  }

  /**
   * Re-read the snapshot after a refused write, so the next attempt carries a
   * generation that can succeed.
   *
   * This deliberately does NOT merge. The two records are independent on
   * purpose: the journal is append-only and holds everything both writers did,
   * and `fetch-data.js` rebuilds the results from it and reports any drift
   * against the snapshot. What matters here is that the snapshot keeps moving.
   * If the object we found is further along than what we hold, that is a real
   * two-writer situation and is journalled as such rather than smoothed over.
   *
   * @returns {Promise<boolean>} whether a retry is worth making
   */
  async _reclaim(err) {
    let got = null;
    try {
      got = await this.backend.load();
    } catch (e) {
      console.error(`[store] could not re-read ${this.backend.describe} after a conflict: ${e.message}`);
      return false;
    }
    let theirs = null;
    if (got) { try { theirs = JSON.parse(got.text); } catch (e) { theirs = null; } }
    const count = (st) => (st && st.participants ? st.participants.reduce((n, p) => n + Object.keys(p.notes || {}).length, 0) : 0);
    const mine = { participants: this.state.participants.length, notes: count(this.state), log: this.state.log.length };
    const other = theirs
      ? { participants: theirs.participants.length, notes: count(theirs), log: (theirs.log || []).length }
      : null;
    const behind = !!(other && other.log > mine.log);
    console.error(`[store] ${err.message} - re-read and reclaiming${behind ? ' (the object was AHEAD of us; see the journal)' : ''}`);
    this.logEvent('state-reclaimed', { message: String(err && err.message || err), mine, theirs: other, behind });
    return true;
  }

  async close() {
    await this.flush();
    await this._writing;
    if (this.journal) await this.journal.close();
  }

  // --- participants -------------------------------------------------------
  participants() { return this.state.participants; }

  byId(id) { return this.state.participants.find((p) => p.id === id) || null; }

  byToken(token) { return this.state.participants.find((p) => p.token === token) || null; }

  byName(name) {
    const n = String(name || '').trim().toLowerCase();
    return this.state.participants.find((p) => p.name.toLowerCase() === n) || null;
  }

  /** Resolve an id or a name to a participant, so control payloads can use either. */
  resolve(ref) { return this.byId(ref) || this.byName(ref) || null; }

  addParticipant(name) {
    const id = `p_${crypto.randomBytes(4).toString('hex')}`;
    const p = {
      id,
      name: String(name || id).trim() || id,
      // 128 bits: the client URL is the only credential a participant has, so
      // it must not be guessable or shoulder-surfable.
      token: crypto.randomBytes(16).toString('base64url'),
      createdAt: new Date().toISOString(),
      taskIds: [],
      cursor: 0,
      notes: {},
      status: {},          // caseId -> 'done' | 'skipped'
      responses: {},       // caseId -> { choice, tool, comment, at }
      // Which of 1/2/3 is which tool, drawn once per participant. The
      // participant only ever sees the numbers; the mapping is theirs alone, so
      // one participant working out that "2 is the slow one" says nothing about
      // what 2 means for anybody else. It is stored rather than derived so the
      // results stay interpretable years later, and journalled at creation so
      // it exists in the append-only record too.
      toolLabels: randomLabels(),
      focus: null,         // last reported focus, for the operator's monitor
      lastSeen: null,
      connected: 0,
    };
    this.state.participants.push(p);
    this.logEvent('participant-added', { participantId: p.id, name: p.name, toolLabels: p.toolLabels });
    this.save(true);
    return p;
  }

  removeParticipant(id) {
    const i = this.state.participants.findIndex((p) => p.id === id);
    if (i < 0) return false;
    const [gone] = this.state.participants.splice(i, 1);
    // The notes go with them from the live state, so put them in the journal
    // where they can still be recovered if the removal was a mistake.
    this.logEvent('participant-removed', { participantId: gone.id, name: gone.name, notes: gone.notes, status: gone.status, taskIds: gone.taskIds });
    this.save(true);
    return true;
  }

  rotateToken(id) {
    const p = this.byId(id);
    if (!p) return null;
    p.token = crypto.randomBytes(16).toString('base64url');
    this.logEvent('participant-rotated', { participantId: p.id, name: p.name });
    this.save(true);
    return p;
  }

  setOpen(open) {
    this.state.studyOpen = !!open;
    this.logEvent('study-open', { open: this.state.studyOpen });
    this.save(true);
    return this.state.studyOpen;
  }

  /** Append to the journal and keep a bounded tail in the snapshot for the console. */
  logEvent(kind, detail) {
    if (this.journal) this.journal.append(kind, detail);
    this.state.log.push({ at: new Date().toISOString(), kind, ...detail });
    if (this.state.log.length > 2000) this.state.log.splice(0, this.state.log.length - 2000);
  }
}

/**
 * Participants created before responses and blinding existed are missing those
 * fields; fill them in on read so the rest of the code never has to check.
 */
Store.prototype.ensureParticipantShape = function ensureParticipantShape(p) {
  let changed = false;
  if (!p.responses) { p.responses = {}; changed = true; }
  if (!p.toolLabels) {
    p.toolLabels = randomLabels();
    this.logEvent('tool-labels-assigned', { participantId: p.id, name: p.name, toolLabels: p.toolLabels });
    changed = true;
  }
  // The columns used to be lettered. A participant part-way through a session
  // keeps the mapping they were drawn - 1 gets whatever A stood for - because
  // re-drawing it would silently change what their earlier answers meant.
  if (p.toolLabels && p.toolLabels.A && !p.toolLabels['1']) {
    const was = p.toolLabels;
    p.toolLabels = { 1: was.A, 2: was.B, 3: was.C };
    this.logEvent('tool-labels-renumbered', { participantId: p.id, name: p.name, from: was, to: p.toolLabels });
    changed = true;
  }
  if (changed) this.save(true);
  return p;
};

module.exports = { Store, FileBackend, GcsBackend, EMPTY, TOOLS, LABELS, randomLabels };
