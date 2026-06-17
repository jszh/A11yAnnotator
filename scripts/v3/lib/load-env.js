'use strict';
// Minimal, dependency-free .env loader. Populates process.env from <root>/.env for keys NOT already set in
// the real environment (real env always wins), so a real LLM run can read CLAUDE_CODE_OAUTH_TOKEN without the
// secret ever being committed. Best-effort: a missing/unreadable .env is a no-op (the gate-OFF path is
// unaffected). NEVER logs values. Quotes are stripped; everything after `=` on a line is the value.
const fs = require('fs');
const path = require('path');

function loadEnv(root) {
  try {
    const txt = fs.readFileSync(path.join(root, '.env'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
      if (!m) continue; // blank / comment / malformed
      const key = m[1];
      if (process.env[key] != null) continue; // real env takes precedence
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[key] = val;
    }
  } catch (e) { /* no .env ⇒ nothing to load */ }
}

module.exports = { loadEnv };
