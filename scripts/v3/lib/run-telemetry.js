'use strict';
// Small runtime-telemetry helpers for a live progress monitor:
//   • makeSemaphore(n) — a GLOBAL async gate. Page-parallelism multiplies per-page LLM concurrency, so the
//     true concurrent-LLM count is pageConcurrency × llmConcurrency. A subscription wants ONE global cap on
//     in-flight model calls (the real governor is 429 backoff, but a hard global gate keeps us civil). Wrap
//     every runAgent call in sem.run(fn) and at most n run at once regardless of how many pages are in flight.
//   • sampleMemory(browserPid) — Node RSS + system used/total + a best-effort Chrome process-TREE RSS (the
//     dominant cost under many tabs — the stress finding was ~105 MB/tab). One `ps` call/sample; null on failure.
const os = require('os');
const { execFile } = require('child_process');

function makeSemaphore(max) {
  const n = Math.max(1, Number(max) || 1);
  let active = 0;
  const waiters = [];
  const next = () => {
    if (active >= n || !waiters.length) return;
    active++;
    const w = waiters.shift();
    w();
  };
  return {
    inFlight: () => active,
    queued: () => waiters.length,
    async run(fn) {
      await new Promise((resolve) => { waiters.push(resolve); next(); });
      try { return await fn(); }
      finally { active--; next(); }
    },
  };
}

// True AVAILABLE bytes. os.freemem() on darwin counts only wired-free pages (cache/purgeable excluded) ⇒ it
// reads ~full always; parse `vm_stat` for the Activity-Monitor view (free+inactive+speculative+purgeable).
// Linux/other: os.freemem() is already meaningful. Resolves null → caller falls back to os.freemem().
function availMemBytes() {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') return resolve(null);
    execFile('vm_stat', [], (err, stdout) => {
      if (err) return resolve(null);
      const txt = String(stdout);
      const page = (/page size of (\d+) bytes/.exec(txt) || [])[1];
      const pg = page ? +page : 4096;
      const get = (label) => { const m = new RegExp(label + ':\\s+(\\d+)\\.').exec(txt); return m ? +m[1] : 0; };
      const free = get('Pages free') + get('Pages inactive') + get('Pages speculative') + get('Pages purgeable');
      resolve(free > 0 ? free * pg : null);
    });
  });
}

// One `ps` snapshot → sum RSS (KB) of `rootPid` and all its descendants. darwin/linux. Resolves null on any error.
function processTreeRssKb(rootPid) {
  return new Promise((resolve) => {
    if (!rootPid) return resolve(null);
    execFile('ps', ['-axo', 'pid=,ppid=,rss='], { maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve(null);
      const children = new Map(); // ppid -> [pid]
      const rss = new Map();      // pid -> kb
      for (const line of String(stdout).trim().split('\n')) {
        const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(line);
        if (!m) continue;
        const pid = +m[1], ppid = +m[2], kb = +m[3];
        rss.set(pid, kb);
        if (!children.has(ppid)) children.set(ppid, []);
        children.get(ppid).push(pid);
      }
      let total = 0; const stack = [Number(rootPid)]; const seen = new Set();
      while (stack.length) {
        const pid = stack.pop();
        if (seen.has(pid)) continue;
        seen.add(pid);
        total += rss.get(pid) || 0;
        for (const c of (children.get(pid) || [])) stack.push(c);
      }
      resolve(seen.size > 1 || rss.has(Number(rootPid)) ? total : null);
    });
  });
}

async function sampleMemory(browserPid) {
  const mu = process.memoryUsage();
  const sysTotal = os.totalmem();
  const avail = await availMemBytes().catch(() => null);
  const sysFree = avail == null ? os.freemem() : avail;
  const chromeKb = await processTreeRssKb(browserPid).catch(() => null);
  return {
    nodeRssMb: +(mu.rss / 1048576).toFixed(1),
    nodeHeapMb: +(mu.heapUsed / 1048576).toFixed(1),
    sysUsedMb: Math.round((sysTotal - sysFree) / 1048576),
    sysTotalMb: Math.round(sysTotal / 1048576),
    sysPct: +(100 * (sysTotal - sysFree) / sysTotal).toFixed(1),
    chromeRssMb: chromeKb == null ? null : +(chromeKb / 1024).toFixed(1),
  };
}

module.exports = { makeSemaphore, sampleMemory, processTreeRssKb, availMemBytes };
