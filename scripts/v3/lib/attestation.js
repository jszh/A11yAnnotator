// Harness 3.0 — EVIDENCE ATTESTATION / publication lineage (audit V3R3-C1).
//
// The third-pass audit showed the publication boundary authenticated ASSERTIONS, not lineage: a
// hand-authored bundle could set `valid:true`/`completed:true` and invent typed-outcome flags, and
// the builder would publish it once promoted. The fix is a trust anchor OUTSIDE the bundle.
//
// A real catalog runner, when it executes, HMAC-signs the lineage-bearing subset of each result
// with a SECRET KEY the runner holds (env V3_ATTEST_KEY / an injected key). The builder, at the
// PUBLICATION boundary only, recomputes the digest from the result's own content and verifies the
// MAC with the same key (loaded from a protected location, NEVER from the bundle). Consequences:
//   • a bundle author who lacks the key cannot forge a valid attestation ⇒ stays shadow;
//   • tampering with ANY covered field (an outcome flag, valid, scope, applicabilityEvidence)
//     changes the digest ⇒ the MAC no longer verifies ⇒ stays shadow;
//   • `valid`/`completed`/applicability are now ATTESTED facts (covered by the MAC), not mutable
//     fields trusted from the same bundle.
// Attestation is checked ONLY when a claim is otherwise about to publish AUTHORITATIVE — so the
// default-shadow path (no key configured) is unchanged: gate-passing observations are still
// recorded as shadow; only the leap to authoritative additionally requires verified lineage.
//
// Promotion provenance (gold/sealed/rater/measurement-suite) is verified the same way in spirit: an
// artifact VERIFIER resolves each named ref to bytes on disk and checks its sha256 — so a promotion
// cannot rest on a fictional reference. The disk verifier is supplied by the production CLI.
'use strict';

const crypto = require('crypto');

// The exact lineage fields the MAC covers. Anything outside this set (display labels, measurement
// scratch) is NOT attested and cannot influence a publication decision.
const DIGEST_VERSION = 'v3-attest-1';

// Deterministic, key-sorted JSON so the digest is independent of property insertion order (the same
// logical result always hashes identically — required for byte-identical replay).
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

// The canonical lineage object for a result: identity, the measured outcome, applicability, the
// valid/completed facts, the observation scope, the runner identity/version, the RUN/PAGE identity
// the runner observed (so an attested result cannot be REPLAYED into a foreign bundle for a never-
// measured page — audit V3R3 red-team), and the AT baseline (the Rule-12 publication gate, which
// claims.js reads — so it cannot be injected after signing — audit V3R3 red-team). Every fact a
// publication decision rests on is bound by the MAC.
function lineageOf(result) {
  const r = result || {};
  const a = r.attestation || {};
  return {
    v: DIGEST_VERSION,
    experimentId: r.experimentId || null,
    claimId: r.claimId || null,
    targetXpath: r.targetXpath || null,
    sc: r.sc || null,
    observationScope: r.observationScope || null,
    outcome: r.outcome || null,
    applicabilityEvidence: r.applicabilityEvidence || null,
    atBaseline: r.atBaseline == null ? null : r.atBaseline, // AT-baseline gate — bound so it can't be injected
    valid: r.valid === true,
    completed: r.completed === true,
    runner: a.runner || null,
    runnerVersion: a.runnerVersion || null,
    runIdentity: a.runIdentity || null, // {file, runId, pageDigest} the runner actually observed
  };
}

// Does an attested result's SIGNED run identity match the bundle this build is over? Replay defence:
// even a genuinely-signed result only counts inside the exact run/page it was produced for.
function boundToRun(result, collect) {
  const ri = result && result.attestation && result.attestation.runIdentity;
  if (!ri || !collect) return false;
  // FAIL-CLOSED: every identity field must be present AND equal (no undefined===undefined binding).
  for (const f of ['file', 'runId', 'pageDigest']) { if (!ri[f] || !collect[f] || ri[f] !== collect[f]) return false; }
  return true;
}

function digestResult(result) {
  return 'sha256:' + crypto.createHash('sha256').update(stableStringify(lineageOf(result))).digest('hex');
}

function hmac(key, message) {
  return crypto.createHmac('sha256', String(key)).update(message).digest('hex');
}

// Attach an attestation to a result. `runner`/`runnerVersion` become part of the signed lineage, so
// the builder can also confirm the evidence was produced by the cited catalog runner at a version.
function signResult(result, key, { runner, runnerVersion, runIdentity } = {}) {
  if (!key) return result; // no key ⇒ unsigned ⇒ the builder will keep it shadow-only
  const ri = runIdentity ? { file: runIdentity.file, runId: runIdentity.runId, pageDigest: runIdentity.pageDigest } : null;
  const withRunner = {
    ...result,
    attestation: { runner: runner || result.experimentId || null, runnerVersion: runnerVersion || null, runIdentity: ri },
  };
  const resultDigest = digestResult(withRunner);
  withRunner.attestation = { ...withRunner.attestation, resultDigest, mac: hmac(key, resultDigest) };
  return withRunner;
}

const timingSafeEqualStr = (a, b) => {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// Verify a result's attestation against the trust-anchor key. FAIL-CLOSED: no key, no/!object
// attestation, a digest that does not match the result's CURRENT content (tamper), or a bad MAC ⇒
// false. A true return means the bundle's lineage fields are exactly what a key-holder signed.
function verifyResult(result, key) {
  if (!key || !result || typeof result !== 'object') return false;
  const a = result.attestation;
  if (!a || typeof a !== 'object') return false;
  if (typeof a.resultDigest !== 'string' || typeof a.mac !== 'string') return false;
  const expectDigest = digestResult(result);          // recomputed from the result's OWN content
  if (!timingSafeEqualStr(a.resultDigest, expectDigest)) return false; // tamper-evident
  return timingSafeEqualStr(a.mac, hmac(key, expectDigest));           // key-bound
}

// ---- promotion-artifact verification (provenance refs → bytes on disk → sha256) ----
// A production verifier resolves a provenance ref to a file under `rootDir` and checks its hash
// against the registry-declared hash. Refs use a `scheme://path` shape; the path is taken relative
// to rootDir. Missing file / unreadable / hash mismatch ⇒ false (fail-closed).
function makeDiskArtifactVerifier(rootDir, { fs = require('fs'), path = require('path') } = {}) {
  return (name, ref, expectedHash) => {
    if (typeof ref !== 'string' || !ref.trim()) return false;
    if (typeof expectedHash !== 'string' || !/^sha256:[0-9a-f]{64}$/i.test(expectedHash)) return false;
    const rel = ref.replace(/^[a-z0-9.+-]+:\/\//i, '');
    const file = path.resolve(rootDir, rel);
    if (!path.resolve(file).startsWith(path.resolve(rootDir))) return false; // no path escape
    let bytes;
    try { bytes = fs.readFileSync(file); } catch (e) { return false; }
    const got = 'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex');
    return timingSafeEqualStr(got, expectedHash);
  };
}

// Load the trust-anchor key from a PROTECTED location — never the bundle. Explicit opt wins, then
// the environment. Returns null when no key is configured (⇒ nothing publishes authoritative).
function loadKey(opts = {}) {
  if (opts.attestationKey) return opts.attestationKey;
  if (process.env.V3_ATTEST_KEY) return process.env.V3_ATTEST_KEY;
  return null;
}

module.exports = {
  DIGEST_VERSION, stableStringify, lineageOf, digestResult, boundToRun,
  signResult, verifyResult, makeDiskArtifactVerifier, loadKey,
};
