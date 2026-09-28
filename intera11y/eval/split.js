'use strict';
// Development / test split of the validated cases (ACT subset; human-annotated supplementary 585), fixed before any
// tuning. Within each ACT rule and each 585 aspect, cases are ordered by a hash of their id and the first quarter
// (at least one case per stratum) goes to development; everything else is test. Cases already examined during
// development before this split existed are forced into development.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOUCHED_FILE = path.join(__dirname, 'touched-before-split.txt');
const DEV_FRACTION = 0.25;

const h = (s) => crypto.createHash('sha1').update(`intera11y-split-v1|${s}`).digest('hex');

function assign(cases, stratumOf) {
  const touched = new Set(fs.existsSync(TOUCHED_FILE) ? fs.readFileSync(TOUCHED_FILE, 'utf8').split(/\s+/).filter(Boolean) : []);
  const strata = new Map();
  for (const c of cases) { const k = stratumOf(c); if (!strata.has(k)) strata.set(k, []); strata.get(k).push(c); }
  const split = new Map();
  for (const list of strata.values()) {
    list.sort((a, b) => h(a.id).localeCompare(h(b.id)));
    const nDev = Math.max(1, Math.round(list.length * DEV_FRACTION));
    list.forEach((c, i) => split.set(c.id, i < nDev || touched.has(c.id) ? 'dev' : 'test'));
  }
  return split;
}

module.exports = { assign };
