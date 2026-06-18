'use strict';
// Node-side manager for the PP-OCRv6 Python sidecar (scripts/v3/ocr/ocr_sidecar.py) used by the
// non-authoritative `ocr_image_text` shadow tool. The heavy paddlepaddle dependency lives in an ISOLATED
// venv (scripts/v3/ocr/.venv) — this module only spawns/talks to it. Design:
//   - LAZY: the process is spawned on the FIRST recognize() (model warmup is slow) and REUSED for the session.
//   - NEWLINE-JSON: write `{"id",image_b64}\n` to stdin, match `{"id","ok","text","lines"}\n` from stdout.
//   - GRACEFUL: if the venv/script is absent or the process dies, recognize() returns {error:...} — it never
//     throws, so a missing OCR setup degrades to INCONCLUSIVE in the model's reasoning, never a crash.
//   - The verdict stays the model's: this returns RAW recognised text + boxes + confidences, never pass/fail.
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const OCR_DIR = path.join(__dirname, '..', 'ocr');
const DEFAULT_PY = path.join(OCR_DIR, '.venv', 'bin', 'python');
const DEFAULT_SCRIPT = path.join(OCR_DIR, 'ocr_sidecar.py');

function makeOcrSidecar(opts = {}) {
  const python = opts.python || process.env.V3_OCR_PYTHON || DEFAULT_PY;
  const script = opts.script || process.env.V3_OCR_SCRIPT || DEFAULT_SCRIPT;
  const startupTimeoutMs = opts.startupTimeoutMs || +(process.env.V3_OCR_STARTUP_TIMEOUT_MS || 180000);
  const callTimeoutMs = opts.callTimeoutMs || +(process.env.V3_OCR_CALL_TIMEOUT_MS || 30000);

  let proc = null, ready = null, dead = false, buf = '', seq = 0;
  const pending = new Map(); // id -> { resolve, timer }

  const available = () => fs.existsSync(python) && fs.existsSync(script);

  const start = () => {
    if (ready) return ready;
    ready = new Promise((resolve) => {
      let settled = false;
      if (!available()) { dead = true; return resolve({ ok: false, error: 'ocr-venv-missing' }); }
      try { proc = spawn(python, [script], { stdio: ['pipe', 'pipe', 'pipe'] }); }
      catch (e) { dead = true; return resolve({ ok: false, error: 'ocr-spawn-failed:' + (e && e.message) }); }
      const startupTimer = setTimeout(() => { if (!settled) { settled = true; dead = true; try { proc.kill('SIGKILL'); } catch (e) {} resolve({ ok: false, error: 'ocr-startup-timeout' }); } }, startupTimeoutMs);
      proc.stdout.setEncoding('utf8');
      proc.stdout.on('data', (chunk) => {
        buf += chunk;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (!line.trim()) continue;
          let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
          if (!settled && msg.ready !== undefined) { // the startup readiness line
            settled = true; clearTimeout(startupTimer);
            if (msg.ready) resolve({ ok: true });
            else { dead = true; resolve({ ok: false, error: msg.error || 'ocr-engine-load-failed' }); }
            continue;
          }
          if (msg.id != null && pending.has(msg.id)) {
            const { resolve: res, timer } = pending.get(msg.id); clearTimeout(timer); pending.delete(msg.id);
            res(msg);
          }
        }
      });
      proc.on('exit', () => { dead = true; for (const { resolve: res, timer } of pending.values()) { clearTimeout(timer); res({ ok: false, error: 'ocr-process-exited' }); } pending.clear(); });
      proc.on('error', () => { dead = true; });
    });
    return ready;
  };

  return {
    available,
    async recognize(imageB64) {
      const r = await start();
      if (!r.ok || dead || !proc) return { error: r.error || 'ocr-unavailable' };
      const id = ++seq;
      return new Promise((resolve) => {
        const timer = setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ error: 'ocr-call-timeout' }); } }, callTimeoutMs);
        pending.set(id, { resolve: (msg) => resolve(msg.ok ? { text: msg.text, lines: msg.lines } : { error: msg.error || 'ocr-failed' }), timer });
        try { proc.stdin.write(JSON.stringify({ id, image_b64: imageB64 }) + '\n'); }
        catch (e) { clearTimeout(timer); pending.delete(id); resolve({ error: 'ocr-write-failed' }); }
      });
    },
    async close() {
      if (proc && !dead) { try { proc.stdin.end(); } catch (e) {} try { proc.kill('SIGTERM'); } catch (e) {} }
      dead = true;
      for (const { resolve: res, timer } of pending.values()) { clearTimeout(timer); res({ error: 'ocr-closed' }); }
      pending.clear();
    },
  };
}

module.exports = { makeOcrSidecar, DEFAULT_PY, DEFAULT_SCRIPT, OCR_DIR };
