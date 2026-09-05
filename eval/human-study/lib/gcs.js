/**
 * gcs.js - the small slice of Google Cloud Storage this study needs.
 *
 * Hand-rolled rather than pulling in @google-cloud/storage: the study writes
 * two shapes of object, both small - a state snapshot of a few hundred KB and
 * journal batches of a few KB - so simple media uploads cover it, and a
 * research artifact is easier to trust and to run offline without a
 * two-hundred-package dependency tree underneath it. What the official client
 * would give us and a naive fetch would not is retries and correct handling of
 * the generation precondition, so both are here explicitly.
 *
 * Credentials come from the metadata server on Cloud Run, or from
 * `gcloud auth print-access-token` when running on a workstation, so the same
 * code path can be exercised locally before it is deployed.
 */
const https = require('https');
const http = require('http');
const { execFile } = require('child_process');

const METADATA_HOST = 'metadata.google.internal';
const SCOPE = 'https://www.googleapis.com/auth/devstorage.read_write';

class TransientError extends Error {}

function requestJson(opts, body) {
  return new Promise((resolve, reject) => {
    const mod = opts.protocol === 'http:' ? http : https;
    const req = mod.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        const status = res.statusCode || 0;
        // 408/429 and the whole 5xx family are worth another try; everything
        // else is a decision the caller has to make (404 is often expected,
        // 412 means someone else wrote first, 403 means the wrong identity).
        if (status === 408 || status === 429 || status >= 500) {
          return reject(Object.assign(new TransientError(`GCS ${status}: ${text.slice(0, 300)}`), { status }));
        }
        resolve({ status, text, headers: res.headers });
      });
    });
    req.on('error', (e) => reject(Object.assign(new TransientError(e.message), { cause: e })));
    req.setTimeout(30000, () => { req.destroy(new TransientError('request timed out')); });
    if (body != null) req.write(body);
    req.end();
  });
}

async function withRetry(what, fn, tries = 5) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      if (!(e instanceof TransientError)) throw e;
      lastErr = e;
      // 250ms, 500ms, 1s, 2s - plus jitter so parallel writers do not line up.
      const wait = 250 * Math.pow(2, i) + Math.floor(Math.random() * 200);
      if (i < tries - 1) await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error(`${what} failed after ${tries} attempts: ${lastErr && lastErr.message}`);
}

// --- credentials ----------------------------------------------------------
let cached = { token: null, expiresAt: 0 };

function metadataToken() {
  return requestJson({
    protocol: 'http:', host: METADATA_HOST, path: `/computeMetadata/v1/instance/service-accounts/default/token?scopes=${encodeURIComponent(SCOPE)}`,
    method: 'GET', headers: { 'Metadata-Flavor': 'Google' },
  }).then((r) => {
    if (r.status !== 200) throw new Error(`metadata server ${r.status}`);
    const j = JSON.parse(r.text);
    return { token: j.access_token, expiresIn: Number(j.expires_in || 3600) };
  });
}

function gcloudToken() {
  return new Promise((resolve, reject) => {
    execFile('gcloud', ['auth', 'print-access-token'], { timeout: 20000 }, (err, out) => {
      if (err) return reject(new Error(`gcloud auth print-access-token: ${err.message}`));
      const token = String(out).trim();
      if (!token) return reject(new Error('gcloud returned an empty token'));
      resolve({ token, expiresIn: 3000 });
    });
  });
}

async function accessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60000) return cached.token;
  let got = null;
  try { got = await metadataToken(); } catch (e) { got = null; }
  if (!got) got = await gcloudToken(); // workstation
  cached = { token: got.token, expiresAt: Date.now() + got.expiresIn * 1000 };
  return cached.token;
}

// --- object operations ----------------------------------------------------
class GcsBucket {
  constructor(bucket) {
    if (!bucket) throw new Error('GcsBucket needs a bucket name');
    this.bucket = bucket;
  }

  /** Returns { text, generation } or null when the object does not exist. */
  async read(name) {
    return withRetry(`read gs://${this.bucket}/${name}`, async () => {
      const token = await accessToken();
      const r = await requestJson({
        host: 'storage.googleapis.com',
        path: `/storage/v1/b/${encodeURIComponent(this.bucket)}/o/${encodeURIComponent(name)}?alt=media`,
        method: 'GET', headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 404) return null;
      if (r.status !== 200) throw new Error(`read ${name}: ${r.status} ${r.text.slice(0, 200)}`);
      return { text: r.text, generation: r.headers['x-goog-generation'] || null };
    });
  }

  /**
   * Write an object. `ifGenerationMatch` makes this a compare-and-swap: pass
   * the generation you read, or 0 to mean "only if it does not exist yet".
   * Returns the new generation, or null if the precondition failed.
   */
  async write(name, text, { contentType = 'application/json', ifGenerationMatch = null } = {}) {
    return withRetry(`write gs://${this.bucket}/${name}`, async () => {
      const token = await accessToken();
      const body = Buffer.from(text, 'utf8');
      const q = [`uploadType=media`, `name=${encodeURIComponent(name)}`];
      if (ifGenerationMatch !== null) q.push(`ifGenerationMatch=${ifGenerationMatch}`);
      const r = await requestJson({
        host: 'storage.googleapis.com',
        path: `/upload/storage/v1/b/${encodeURIComponent(this.bucket)}/o?${q.join('&')}`,
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType, 'Content-Length': body.length },
      }, body);
      if (r.status === 412) return null; // someone else wrote first
      if (r.status !== 200) throw new Error(`write ${name}: ${r.status} ${r.text.slice(0, 300)}`);
      return JSON.parse(r.text).generation || null;
    });
  }

  async exists(name) {
    const token = await accessToken();
    const r = await requestJson({
      host: 'storage.googleapis.com',
      path: `/storage/v1/b/${encodeURIComponent(this.bucket)}/o/${encodeURIComponent(name)}`,
      method: 'GET', headers: { Authorization: `Bearer ${token}` },
    });
    return r.status === 200;
  }

  async list(prefix, max = 1000) {
    const token = await accessToken();
    const r = await requestJson({
      host: 'storage.googleapis.com',
      path: `/storage/v1/b/${encodeURIComponent(this.bucket)}/o?prefix=${encodeURIComponent(prefix)}&maxResults=${max}`,
      method: 'GET', headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status !== 200) throw new Error(`list ${prefix}: ${r.status}`);
    return (JSON.parse(r.text).items || []).map((o) => ({ name: o.name, size: Number(o.size), updated: o.updated }));
  }
}

module.exports = { GcsBucket, accessToken, TransientError };
