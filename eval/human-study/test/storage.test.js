/**
 * storage.test.js - the durability layer.
 *
 * On Cloud Run the container's disk is gone the moment the instance is
 * replaced, so these are the guarantees the study's data actually rests on:
 * state is never silently reset, a second writer cannot clobber the snapshot,
 * and a failed journal upload retries rather than dropping events.
 *
 * The GCS behaviour is exercised against a fake bucket that implements the same
 * generation-precondition semantics, so the contract is tested without a
 * network. `STUDY_TEST_BUCKET=<name>` additionally runs a live round trip
 * against real Cloud Storage.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { Store, FileBackend, GcsBackend } = require('../lib/store');
const { Journal } = require('../lib/journal');

const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-store-'));

/** Same read/write/generation contract as GcsBucket, in memory. */
class FakeBucket {
  constructor() { this.bucket = 'fake'; this.objects = new Map(); this.gen = 0; this.failNext = 0; this.writes = 0; }

  async read(name) {
    const o = this.objects.get(name);
    return o ? { text: o.text, generation: o.generation } : null;
  }

  async write(name, text, { ifGenerationMatch = null } = {}) {
    if (this.failNext > 0) { this.failNext--; throw new Error('simulated network failure'); }
    this.writes++;
    const cur = this.objects.get(name);
    if (ifGenerationMatch !== null) {
      const have = cur ? String(cur.generation) : '0';
      if (String(ifGenerationMatch) !== have) return null; // precondition failed
    }
    const generation = String(++this.gen);
    this.objects.set(name, { text, generation });
    return generation;
  }
}

// --- file backend ---------------------------------------------------------

test('a missing state file starts an empty study rather than failing', async () => {
  const store = new Store(new FileBackend(path.join(tmpdir(), 'state.json')));
  await store.init();
  assert.equal(store.participants().length, 0);
  assert.equal(store.state.studyOpen, false);
});

test('unreadable state is refused, not overwritten', async () => {
  const dir = tmpdir();
  const file = path.join(dir, 'state.json');
  fs.writeFileSync(file, '{ this is not json');
  const store = new Store(new FileBackend(file));
  await assert.rejects(() => store.init(), /not valid JSON/);
  // The point of refusing: the bad file is still there to be recovered.
  assert.equal(fs.readFileSync(file, 'utf8'), '{ this is not json');
});

test('state written by a future schema is refused', async () => {
  const file = path.join(tmpdir(), 'state.json');
  fs.writeFileSync(file, JSON.stringify({ schema: 'human-study-state/2', participants: [] }));
  const store = new Store(new FileBackend(file));
  await assert.rejects(() => store.init(), /schema human-study-state\/2/);
});

test('a note is on disk before the request is answered', async () => {
  const file = path.join(tmpdir(), 'state.json');
  const store = new Store(new FileBackend(file));
  await store.init();
  const p = store.addParticipant('Robin');
  p.notes.C001 = 'a real barrier';
  await store.save(true);
  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(onDisk.participants[0].notes.C001, 'a real barrier');
});

// --- gcs backend ----------------------------------------------------------

test('the first write only succeeds if the object does not already exist', async () => {
  const bucket = new FakeBucket();
  const store = new Store(new GcsBackend(bucket, 'state/study-state.json'));
  await store.init();
  store.addParticipant('Robin');
  await store.flush();
  assert.equal(store.stats.errors, 0);
  const saved = JSON.parse((await bucket.read('state/study-state.json')).text);
  assert.equal(saved.participants[0].name, 'Robin');
});

test('a stale writer is refused, then re-reads and takes the object back', async () => {
  const events = [];
  const bucket = new FakeBucket();
  const a = new Store(new GcsBackend(bucket, 'state/study-state.json'), { append: (kind, d) => events.push({ kind, ...d }), close: async () => {} });
  await a.init();
  a.addParticipant('Robin');
  await a.flush();

  // Someone else - the revision being replaced, writing once more on its way
  // out - moves the object under us.
  await bucket.write('state/study-state.json', JSON.stringify({ schema: 'human-study-state/1', createdAt: '', studyOpen: false, participants: [], log: [] }));

  a.addParticipant('Sam');
  await a.flush();

  // Refused first, which is the point of the precondition...
  assert.equal(a.stats.conflicts, 1, 'the stale write should have been refused');
  // ...and then recovered, because an instance that never refreshes the
  // generation it holds stops writing the snapshot for the rest of its life.
  assert.equal(a.stats.reclaims, 1, 'the writer should have re-read and retried');
  assert.equal(a.stats.errors, 0, 'a reclaimed write is not an error');
  const now = JSON.parse((await bucket.read('state/study-state.json')).text);
  assert.equal(now.participants.length, 2, 'the surviving writer should own the snapshot again');

  // And it is on the record, including that the object we took was further
  // along than what we held - the journal is what makes that recoverable.
  const said = events.filter((e) => e.kind === 'state-reclaimed');
  assert.equal(said.length, 1, 'reclaiming must be journalled');
  assert.equal(said[0].mine.participants, 2);
  assert.equal(said[0].theirs.participants, 0);
  assert.equal(typeof said[0].behind, 'boolean');
});

test('a writer that stays contested keeps trying rather than giving up', async () => {
  // While the other instance is still alive every retry loses too. The store
  // must stay dirty so the next mutation tries again, instead of deciding the
  // snapshot is somebody else's problem now.
  const bucket = new FakeBucket();
  const a = new Store(new GcsBackend(bucket, 'state/study-state.json'));
  await a.init();
  a.addParticipant('Robin');
  await a.flush();

  const realWrite = bucket.write.bind(bucket);
  bucket.write = async (name, text, opts) => {
    // Somebody else gets there first, every single time.
    await realWrite(name, JSON.stringify({ schema: 'human-study-state/1', createdAt: '', studyOpen: false, participants: [], log: [] }));
    return null;
  };
  a.addParticipant('Sam');
  await a.flush();
  assert.ok(a.stats.conflicts >= 1);
  assert.ok(a.stats.errors >= 1, 'a write that is still contested is an error worth reporting');
  assert.equal(a._dirty, true, 'the pending state must be kept for the next attempt');

  // Once the other writer stops, the very next flush lands.
  bucket.write = realWrite;
  a.addParticipant('Kim');
  await a.flush();
  const now = JSON.parse((await bucket.read('state/study-state.json')).text);
  assert.equal(now.participants.length, 3, 'the snapshot should catch up as soon as it is uncontested');
});

test('a process that restarts picks up the state that is there', async () => {
  const bucket = new FakeBucket();
  const a = new Store(new GcsBackend(bucket, 'state/study-state.json'));
  await a.init();
  const p = a.addParticipant('Robin');
  p.notes.C007 = 'contrast looks fine to me';
  await a.save(true);

  const b = new Store(new GcsBackend(bucket, 'state/study-state.json'));
  await b.init();
  assert.equal(b.participants().length, 1);
  assert.equal(b.participants()[0].notes.C007, 'contrast looks fine to me');
  assert.equal(b.participants()[0].token, p.token, 'a restart must not invalidate links already handed out');

  // ...and can then write again, having read the current generation.
  b.addParticipant('Sam');
  await b.flush();
  assert.equal(b.stats.conflicts, 0);
  assert.equal(JSON.parse((await bucket.read('state/study-state.json')).text).participants.length, 2);
});

test('a transient upload failure is retried, not dropped', async () => {
  const bucket = new FakeBucket();
  const store = new Store(new GcsBackend(bucket, 'state/study-state.json'));
  await store.init();
  store.addParticipant('Robin');
  bucket.failNext = 1;
  await store.flush();
  assert.equal(store.stats.errors, 1);
  assert.ok(store._dirty, 'a failed save must leave the state marked dirty');
  await store.save(true);
  assert.equal(JSON.parse((await bucket.read('state/study-state.json')).text).participants.length, 1);
});

// --- journal --------------------------------------------------------------

test('every event reaches the local mirror', async () => {
  const file = path.join(tmpdir(), 'journal.jsonl');
  const j = new Journal({ file });
  j.append('note', { participant: 'Robin', note: 'alt text repeats the caption' });
  j.append('nav', { participant: 'Robin', action: 'next' });
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].event, 'note');
  assert.equal(lines[0].note, 'alt text repeats the caption');
  assert.equal(lines[0].seq, 1);
  assert.equal(lines[1].seq, 2, 'events must be sequenced so a gap is visible');
  assert.ok(lines[0].runId && lines[0].at);
});

test('notes are uploaded immediately; telemetry is batched', async () => {
  const bucket = new FakeBucket();
  const j = new Journal({ bucket, file: null });
  j.append('focus', { participant: 'Robin' });
  j.append('focus', { participant: 'Robin' });
  assert.equal(bucket.writes, 0, 'focus moves should not each cost an upload');

  j.append('note', { participant: 'Robin', note: 'keep this' });
  await j.flush();
  assert.equal(bucket.writes, 1);
  const batch = [...bucket.objects.values()][0].text.trim().split('\n').map(JSON.parse);
  assert.deepEqual(batch.map((e) => e.event), ['focus', 'focus', 'note'],
    'the batch a note forces must carry everything buffered before it');
});

test('a failed batch is retried on the next flush rather than lost', async () => {
  const bucket = new FakeBucket();
  const j = new Journal({ bucket, file: null });
  bucket.failNext = 1;
  j.append('note', { note: 'first' });
  await j.flush();
  assert.equal(j.stats.errors, 1);
  assert.equal(j.stats.flushed, 0);

  j.append('note', { note: 'second' });
  await j.flush();
  const all = [...bucket.objects.values()].flatMap((o) => o.text.trim().split('\n')).map(JSON.parse);
  assert.deepEqual(all.map((e) => e.note), ['first', 'second'], 'the failed batch should have been re-sent');
});

test('journal objects are written once and never rewritten', async () => {
  const bucket = new FakeBucket();
  const j = new Journal({ bucket, file: null, runId: 'run-1' });
  j.append('note', { note: 'a' });
  await j.flush();
  j.append('note', { note: 'b' });
  await j.flush();
  const names = [...bucket.objects.keys()].sort();
  assert.deepEqual(names, ['journal/run-1/000000.jsonl', 'journal/run-1/000001.jsonl']);
  assert.equal(j.stats.batches, 2);
});

test('removing a participant puts their notes in the journal before dropping them', async () => {
  const bucket = new FakeBucket();
  const j = new Journal({ bucket, file: null });
  const store = new Store(new GcsBackend(bucket, 'state.json'), j);
  await store.init();
  const p = store.addParticipant('Robin');
  p.notes.C001 = 'the only copy of this sentence';
  await store.save(true);
  store.removeParticipant(p.id);
  await store.close();

  const events = [...bucket.objects.entries()]
    .filter(([name]) => name.startsWith('journal/'))
    .flatMap(([, o]) => o.text.trim().split('\n')).map(JSON.parse);
  const removal = events.find((e) => e.event === 'participant-removed');
  assert.ok(removal, 'no participant-removed event was journalled');
  assert.equal(removal.notes.C001, 'the only copy of this sentence');
});

// --- live Cloud Storage (opt-in) -----------------------------------------

test('live Cloud Storage round trip', { skip: !process.env.STUDY_TEST_BUCKET }, async () => {
  const { GcsBucket } = require('../lib/gcs');
  const bucket = new GcsBucket(process.env.STUDY_TEST_BUCKET);
  const key = `selftest/${Date.now()}-${Math.random().toString(16).slice(2)}.json`;

  assert.equal(await bucket.read(key), null, 'a fresh key should not exist');
  const gen = await bucket.write(key, JSON.stringify({ hello: 'world' }), { ifGenerationMatch: 0 });
  assert.ok(gen, 'first write should succeed');

  const got = await bucket.read(key);
  assert.equal(JSON.parse(got.text).hello, 'world');
  assert.equal(got.generation, gen);

  assert.equal(await bucket.write(key, '{}', { ifGenerationMatch: 0 }), null,
    'writing with a stale precondition must be refused');
  assert.ok(await bucket.write(key, JSON.stringify({ hello: 'again' }), { ifGenerationMatch: gen }),
    'writing with the current generation must succeed');

  const listed = await bucket.list('selftest/');
  assert.ok(listed.some((o) => o.name === key));
});
