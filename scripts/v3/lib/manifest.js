// Harness 3.0 — mandatory ATTESTED run-manifest (plan Rule 17; audit V3R4-H7).
//
// The trusted orchestrator finalizes a run-manifest that binds the run/page identity AND a content
// hash of every stage artifact, then signs it with the trust-anchor key. The builder recomputes the
// hashes and verifies the signature, so:
//   • TAMPER with any stage artifact changes its content hash ⇒ the manifest no longer matches ⇒
//     the build is refused (the bundle is not the one the orchestrator produced);
//   • a FORGED bundle author cannot sign a valid manifest without the key ⇒ stays shadow;
//   • the manifest is the single canonical place the observed source-page identity is recorded, so
//     every stage and every result's attestation is checked against ONE page identity.
// Hashing is over a CANONICAL serialization (stableStringify) so on-disk formatting is irrelevant and
// replay is byte-identical (the builder only recomputes + verifies a frozen manifest).
'use strict';

const crypto = require('crypto');
const attest = require('./attestation.js');

// stages the manifest hashes — the complete lineage. The manifest never hashes ITSELF. `judgments`
// is deliberately EXCLUDED: it is a Phase-3, non-authoritative artifact produced by the builder
// AFTER the orchestrator finalizes this manifest, so hashing it would make any future judgments-
// bearing replay fail "manifest hashes an absent stage" / "missing a hash for present stage". It
// rides the bundle as an optional, non-integrity-bound stage instead (audit V3R5-C1/M3).
const HASHED_STAGES = ['collect', 'drive', 'candidates', 'plan', 'experiments', 'claimProposals', 'applicability'];

const sha256 = (s) => 'sha256:' + crypto.createHash('sha256').update(s).digest('hex');
const hmac = (key, msg) => crypto.createHmac('sha256', String(key)).update(msg).digest('hex');
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function artifactHash(stage) { return sha256(attest.stableStringify(stage)); }

// Derive the manifest's observed page identity from the runner's OWN per-result observations rather
// than copying the collector's claimed digest (audit V3R5-M1). Returns the single digest all signed
// results agree on, or null when there are no results, an attestation/observed digest is missing, or
// the results disagree — fail-closed: the caller then records null, which fails the manifest schema
// (a manifest cannot claim an observed identity it did not independently observe).
function deriveObservedPageDigest(experiments) {
  const results = experiments && Array.isArray(experiments.results) ? experiments.results : null;
  if (!results || results.length === 0) return null;
  const observed = new Set();
  for (const r of results) {
    const d = r && r.attestation && r.attestation.runIdentity && r.attestation.runIdentity.observedPageDigest;
    if (!d) return null; // an unobserved/unsigned result cannot corroborate the page identity
    observed.add(d);
  }
  return observed.size === 1 ? [...observed][0] : null; // disagreement ⇒ fail closed
}

// Build (and, with a key, sign) a run-manifest for a complete bundle. `observedPageDigest` is
// undefined-distinguishing (audit V3R5-M1): OMITTED ⇒ fall back to the collector's digest (back-compat
// for callers that don't independently observe); PASSED (incl. null) ⇒ honored verbatim, so a caller
// that derived a null identity cannot silently fall back to the collector's unattested claim. The
// existing verifyManifest identity gate then refuses any manifest whose observed digest != collect's.
function buildManifest(bundle, { key, environment = null, observedPageDigest, runnerVersion = null, catalogVersion = null } = {}) {
  const c = bundle.collect || {};
  const pageDigest = (observedPageDigest !== undefined ? observedPageDigest : c.pageDigest) || null;
  const artifacts = {};
  for (const s of HASHED_STAGES) if (bundle[s] != null) artifacts[s] = artifactHash(bundle[s]);
  const base = {
    file: c.file || null, runId: c.runId || null, pageDigest,
    observedPageDigest: pageDigest, environment, catalogVersion, runnerVersion, artifacts,
  };
  if (!key) return base; // unsigned ⇒ the builder keeps it shadow-only
  const signedDigest = sha256(attest.stableStringify(base));
  return { ...base, attestation: { signedDigest, mac: hmac(key, signedDigest) } };
}

// Verify a bundle's manifest. Returns { present, valid, integrityBroken, errors[] }. `integrityBroken`
// means the bundle's CONTENT does not match the manifest (a hash/identity/signedDigest mismatch — a
// corrupt or wrong bundle the builder should REFUSE outright); a manifest that is merely unsigned /
// not-our-key is `valid:false` without `integrityBroken` (it just cannot publish authoritative).
function verifyManifest(bundle, key) {
  const m = bundle && bundle.manifest;
  if (m == null) return { present: false, valid: false, integrityBroken: false, errors: ['no manifest in bundle'] };
  const E = []; let integrityBroken = false;
  const brk = (msg) => { integrityBroken = true; E.push(msg); };
  if (typeof m !== 'object' || !m.artifacts || typeof m.artifacts !== 'object') return { present: true, valid: false, integrityBroken: true, errors: ['manifest malformed (no artifacts map)'] };
  // every PRESENT lineage stage must be hashed, and every HASHED stage must be present + match.
  for (const s of HASHED_STAGES) {
    const present = bundle[s] != null, hashed = m.artifacts[s] != null;
    if (present && !hashed) brk(`manifest is missing a hash for present stage "${s}"`);
    else if (!present && hashed) brk(`manifest hashes an absent stage "${s}"`);
    else if (present && hashed && artifactHash(bundle[s]) !== m.artifacts[s]) brk(`manifest artifact hash mismatch for "${s}" (tampered or wrong bundle)`);
  }
  // identity: the manifest's observed page identity must match the collector's declared identity.
  const c = bundle.collect || {};
  if (m.file !== c.file || m.runId !== c.runId) brk('manifest identity (file/runId) != collect identity');
  if (!m.observedPageDigest || m.observedPageDigest !== c.pageDigest) brk('manifest observedPageDigest != collect.pageDigest');
  // attestation MAC over the manifest sans its own attestation.
  const at = m.attestation;
  if (!key) E.push('no trust-anchor key configured to verify the manifest');
  else if (!at || typeof at !== 'object' || typeof at.mac !== 'string' || typeof at.signedDigest !== 'string') E.push('manifest is unsigned');
  else {
    const { attestation, ...base } = m;
    const digest = sha256(attest.stableStringify(base));
    if (!eq(digest, at.signedDigest)) brk('manifest signedDigest does not match its content (tampered)');
    else if (!eq(at.mac, hmac(key, digest))) E.push('manifest MAC invalid (not signed by the trust-anchor key)');
  }
  return { present: true, valid: E.length === 0, integrityBroken, errors: E };
}

// schema check for a present manifest (closed shape).
function validateManifestShape(m) {
  const E = [];
  if (m == null) return E;
  const isStr = (v) => typeof v === 'string' && v.length > 0;
  const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(m)) return ['manifest: must be an object'];
  const KEYS = ['file', 'runId', 'pageDigest', 'observedPageDigest', 'environment', 'catalogVersion', 'runnerVersion', 'artifacts', 'attestation'];
  for (const k of Object.keys(m)) if (!KEYS.includes(k)) E.push(`manifest: unknown key ${JSON.stringify(k)}`);
  for (const f of ['file', 'runId', 'pageDigest', 'observedPageDigest']) if (!isStr(m[f])) E.push(`manifest.${f} must be a non-empty string`);
  if (!isObj(m.artifacts)) E.push('manifest.artifacts must be an object');
  else for (const [k, v] of Object.entries(m.artifacts)) { if (!HASHED_STAGES.includes(k)) E.push(`manifest.artifacts: unknown stage ${JSON.stringify(k)}`); if (!isStr(v)) E.push(`manifest.artifacts.${k} must be a non-empty hash string`); }
  if (m.attestation != null) {
    if (!isObj(m.attestation)) E.push('manifest.attestation must be an object');
    else { for (const k of Object.keys(m.attestation)) if (!['signedDigest', 'mac'].includes(k)) E.push(`manifest.attestation: unknown key ${JSON.stringify(k)}`); for (const f of ['signedDigest', 'mac']) if (!isStr(m.attestation[f])) E.push(`manifest.attestation.${f} must be a non-empty string`); }
  }
  return E;
}

module.exports = { HASHED_STAGES, artifactHash, buildManifest, verifyManifest, validateManifestShape, deriveObservedPageDigest };
