'use strict';
// A deadline shared by everything one (page, criterion) unit does. `run` bounds a step by the remaining time
// and reports whether it finished, so a step that ran out is recorded as truncated — never as an empty result.

class Deadline {
  constructor(ms) { this.at = Date.now() + ms; }
  remaining() { return Math.max(0, this.at - Date.now()); }
  expired() { return this.remaining() === 0; }
  async run(promiseOrFn) {
    const p = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    let timer;
    const timeout = new Promise((r) => { timer = setTimeout(() => r({ timedOut: true }), this.remaining()); });
    try {
      const v = await Promise.race([p.then((value) => ({ value }), (error) => ({ error })), timeout]);
      return v;
    } finally { clearTimeout(timer); }
  }
}

// Any single awaited step, bounded: resolves with the step's value, or with `onTimeout` once `ms` has passed
// (the step is abandoned, not cancelled). Every await on the page or on a tool goes through a bound, so one hung
// call cannot hold a page — or a shared pool slot — forever.
async function bounded(p, ms, onTimeout) {
  let timer;
  const t = new Promise((r) => { timer = setTimeout(() => r(onTimeout), Math.max(0, ms)); });
  try { return await Promise.race([p, t]); } finally { clearTimeout(timer); }
}

// Bounded-concurrency pool.
function makePool(limit) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= limit || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(resolve, reject).finally(() => { active--; next(); });
  };
  return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}

module.exports = { Deadline, makePool, bounded };
