/**
 * journal.js - the append-only record of everything that happened in a study.
 *
 * The state snapshot answers "where is the study now"; the journal answers
 * "what did each participant actually do", which is the part a study cannot
 * reconstruct after the fact. It is written three ways on purpose, because the
 * failure modes are different:
 *
 *   1. stdout, as one structured JSON line per event. On Cloud Run this lands
 *      in Cloud Logging within seconds with no code of ours in the path, so
 *      even a container that is killed mid-write has already shipped its
 *      events. This is the copy that survives us being wrong about the others.
 *   2. Google Cloud Storage, batched into objects that are written once and
 *      never rewritten. Cheap to keep, easy to replay, and immune to a bad
 *      snapshot write clobbering history.
 *   3. A local file, which is all there is when running on a workstation.
 *
 * Batching to GCS is bounded by BOTH size and time, and any event marked
 * `durable` forces an immediate flush. Notes are the irreplaceable data in this
 * study - a participant's session cannot be re-run - so they never sit in a
 * buffer waiting for a timer.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FLUSH_MS = 5000;
const FLUSH_EVENTS = 50;

// Events whose loss would cost real data rather than a bit of telemetry.
const DURABLE_KINDS = new Set(['note', 'status', 'assign', 'split', 'participant-added', 'participant-removed', 'participant-rotated', 'study-open']);

class Journal {
  /**
   * @param {object} opts
   * @param {import('./gcs').GcsBucket|null} opts.bucket
   * @param {string} opts.prefix   object prefix, e.g. "journal"
   * @param {string|null} opts.file  local mirror path
   * @param {string} opts.runId    identifies this process's batches
   */
  constructor({ bucket = null, prefix = 'journal', file = null, runId = null } = {}) {
    this.bucket = bucket;
    this.prefix = prefix.replace(/\/$/, '');
    this.file = file;
    this.runId = runId || `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
    this.seq = 0;        // event counter, monotonic for this process
    this.batchNo = 0;    // object counter
    this.buffer = [];
    this.timer = null;
    this.pending = Promise.resolve();
    this.stats = { appended: 0, flushed: 0, batches: 0, errors: 0, lastError: null, lastFlushAt: null };
    if (this.file) fs.mkdirSync(path.dirname(this.file), { recursive: true });
  }

  append(kind, detail) {
    const ev = {
      // A flat, greppable shape: these lines are read in Cloud Logging as much
      // as they are replayed from GCS.
      severity: 'INFO',
      component: 'a11y-human-study',
      event: kind,
      runId: this.runId,
      seq: ++this.seq,
      at: new Date().toISOString(),
      ...detail,
    };
    this.stats.appended++;

    // (1) stdout -> Cloud Logging. Synchronous and first, so it happens even if
    // everything below throws.
    try { process.stdout.write(`${JSON.stringify(ev)}\n`); } catch (e) { /* stdout closed */ }

    // (3) local mirror, appended synchronously - it is the only copy on a
    // workstation and an append is cheap.
    if (this.file) {
      try { fs.appendFileSync(this.file, `${JSON.stringify(ev)}\n`); } catch (e) { /* disk full / read-only */ }
    }

    // (2) GCS, batched.
    if (this.bucket) {
      this.buffer.push(ev);
      if (DURABLE_KINDS.has(kind) || this.buffer.length >= FLUSH_EVENTS) this.flush();
      else if (!this.timer) this.timer = setTimeout(() => this.flush(), FLUSH_MS);
    }
    return ev;
  }

  /** Flush the buffer as one immutable object. Serialised so batches keep order. */
  flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.bucket || !this.buffer.length) return this.pending;
    const batch = this.buffer;
    this.buffer = [];
    const n = this.batchNo++;
    const name = `${this.prefix}/${this.runId}/${String(n).padStart(6, '0')}.jsonl`;
    this.pending = this.pending.then(async () => {
      try {
        // ifGenerationMatch: 0 - "only if this object does not exist". A batch
        // number is never reused, so this can only fire if two processes share
        // a runId, and refusing is the right answer if they do.
        await this.bucket.write(name, batch.map((e) => JSON.stringify(e)).join('\n') + '\n', {
          contentType: 'application/x-ndjson', ifGenerationMatch: 0,
        });
        this.stats.flushed += batch.length;
        this.stats.batches++;
        this.stats.lastFlushAt = new Date().toISOString();
      } catch (e) {
        this.stats.errors++;
        this.stats.lastError = String(e && e.message || e);
        // Put them back so the next flush retries rather than dropping them.
        this.buffer = batch.concat(this.buffer);
        console.error(`[journal] batch ${name} failed: ${this.stats.lastError}`);
      }
    });
    return this.pending;
  }

  async close() {
    await this.flush();
    await this.pending;
  }
}

module.exports = { Journal, DURABLE_KINDS };
