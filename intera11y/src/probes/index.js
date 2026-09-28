'use strict';
// Probe registry. A probe runs at most once per page (memoised), on its own fresh page, under the single step
// time limit. Its result always carries `completeness`: complete | truncated | failed. Every probe declares the
// shape of an empty result (`empty()`) and records what it has observed so far into `partial` as it goes, so a
// probe that runs out of time or fails still hands the criteria everything it saw, in the same shape.
const { Deadline } = require('../core/deadline.js');
const { CONFIG } = require('../core/config.js');

const PROBES = ['keyboard', 'pointer', 'activation', 'forms', 'styles', 'content'];
const load = (name) => require(`./${name}.js`);

function makeProbeRunner(session, model) {
  const memo = new Map();
  const run = (name) => {
    if (!memo.has(name)) {
      if (!PROBES.includes(name)) throw new Error(`unknown probe ${name}`);
      const probe = load(name);
      const deadline = new Deadline(CONFIG.unitDeadlineMs);
      const t0 = Date.now();
      const partial = probe.empty();
      memo.set(name, deadline.run(() => probe.run({ session, model, deadline, partial })).then((r) => {
        const ms = Date.now() - t0;
        if (r.timedOut) return { ...probe.empty(), ...partial, completeness: 'truncated', reason: 'time limit', ms };
        if (r.error) return { ...probe.empty(), ...partial, completeness: 'failed', reason: String((r.error && r.error.stack) || r.error).slice(0, 500), ms };
        return { ...probe.empty(), completeness: 'complete', ...r.value, ms };
      }));
    }
    return memo.get(name);
  };
  const get = async (names) => Object.fromEntries(await Promise.all(names.map(async (n) => [n, await run(n)])));
  return { get };
}

module.exports = { makeProbeRunner, PROBES };
