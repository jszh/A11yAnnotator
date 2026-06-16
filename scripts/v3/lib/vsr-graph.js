'use strict';
// Harness 3.0 — VSR navigation INTEGRITY / trap detection. The keyboard analog (kbd-graph) checks that
// focus can ESCAPE a region by Tab/Shift+Tab/Esc (LOTUS reachability). The VSR cursor is tree traversal,
// not keyboard events, so it does NOT honour a page's JS focus trap — a "VSR trap" is the reading cursor
// genuinely unable to make progress: it cannot advance forward to end-of-document, or cannot retreat
// backward to the start, or it cycles. We collect BOTH directions (the backward-edge pass the keyboard
// graph has via Shift+Tab) and classify. This is the SR-navigation analog of WCAG 2.1.2 (no trap) and a
// soundness check on the reading order the 1.3.2 check consumes.
const { collectVsrTranscript, ensureVsr } = require('./vsr-collect.js');

// Pure classifier: given the forward transcript result and the backward-walk result, decide traps.
//   forward: { reachedEnd, stoppedEarly, wrapped, stuckXpath }   (from collectVsrTranscript)
//   backward: { ok, reachedStart, stuckXpath }                   (from the previous()-walk)
function classifyVsrTraps(forward, backward) {
  const fwd = forward || {};
  const back = backward || {};
  // A forward trap requires a REAL stuck node (stuckXpath). A deadline/cap timeout (timedOut, no stuck
  // node) is "didn't finish", NOT a trap — never flag it (audit: long-page / pure-timeout false positive).
  const forwardTrap = !fwd.reachedEnd && !!fwd.stuckXpath;
  const backwardTrap = back.ok === true && back.reachedStart !== true && !!back.stuckXpath;
  const cycle = fwd.wrapped === true;
  const traps = [];
  if (forwardTrap) traps.push({ kind: 'vsr-forward-trap', sc: '2.1.2', xpath: fwd.stuckXpath || null, detail: 'the SR reading cursor could not advance to end-of-document' });
  if (backwardTrap) traps.push({ kind: 'vsr-backward-trap', sc: '2.1.2', xpath: back.stuckXpath || null, detail: 'the SR reading cursor could not retreat to the start of the document' });
  if (cycle) traps.push({ kind: 'vsr-cycle', sc: '2.1.2', xpath: null, detail: 'the SR reading cursor re-read an identical announcement before reaching the end (reading-order cycle)' });
  return { forwardTrap, backwardTrap, cycle, traps };
}

// Backward pass: position the cursor at the END of the document, then drive previous() back toward the
// start. reachedStart = the cursor announced the document/web-area container (or ran off the front);
// stuckXpath = the cursor stopped advancing backward before the start (a backward VSR trap).
async function backwardWalk(page, opts = {}) {
  const ok = await ensureVsr(page);
  if (!ok) return { ok: false, reason: 'vsr-injection-failed', reachedStart: false, stuckXpath: null, steps: 0 };
  const cap = Number.isFinite(opts.maxSteps) ? opts.maxSteps : 6000;
  const deadlineMs = Number.isFinite(opts.deadlineMs) ? opts.deadlineMs : 30000;
  return page.evaluate(async (cap, deadlineMs) => {
    const vsr = window.__vsr;
    const toEl = (n) => { while (n && !n.tagName) n = n.parentNode; return n; };
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      const ns = e.namespaceURI; const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
      const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + "]");
    };
    try { await vsr.start({ container: document.body }); } catch (e) { return { ok: false, reason: 'vsr-start-failed', reachedStart: false, stuckXpath: null, steps: 0 }; }
    const t0 = Date.now();
    // 1) advance to end-of-document — bounded: break if next() is a no-op (don't burn the whole deadline).
    for (let i = 0; i < cap && Date.now() - t0 < deadlineMs; i++) {
      const p = (await vsr.lastSpokenPhrase() || '').toLowerCase();
      if (p === 'end of document' || p.startsWith('end of web area')) break;
      const before = vsr.activeNode;
      await vsr.next();
      if (!vsr.activeNode || vsr.activeNode === before) break;
    }
    // 2) retreat to start via previous()
    let steps = 0, reachedStart = false, stuckXpath = null;
    for (let j = 0; j < cap && Date.now() - t0 < deadlineMs; j++) {
      const before = vsr.activeNode;
      await vsr.previous();
      const a = vsr.activeNode;
      const low = (await vsr.lastSpokenPhrase() || '').toLowerCase();
      if (!a) { reachedStart = true; break; }              // ran off the front cleanly
      if (a === before) { stuckXpath = getXPath(toEl(a)); break; } // BACKWARD VSR TRAP: did not retreat
      if (low === 'document' || low === 'web area') { reachedStart = true; break; }
      steps++;
    }
    try { await vsr.stop(); } catch (e) {}
    return { ok: true, reachedStart, stuckXpath, steps };
  }, cap, deadlineMs).catch((e) => ({ ok: false, reason: 'evaluate-failed: ' + (e && e.message), reachedStart: false, stuckXpath: null, steps: 0 }));
}

// Full integrity check: forward transcript + backward walk → trap classification.
async function vsrNavigationIntegrity(page, opts = {}) {
  const forward = await collectVsrTranscript(page, opts);
  // Degenerate/empty document: no navigable content ⇒ not a trap, and skip the backward walk (which
  // would otherwise spin on the empty cursor). audit: empty <body> false positive + 30s hang.
  const content = (forward.steps || []).filter((s) => !s.boundary);
  if (content.length === 0) {
    return { forward, backward: { ok: true, reachedStart: true, stuckXpath: null, steps: 0, empty: true }, forwardTrap: false, backwardTrap: false, cycle: false, traps: [], empty: true };
  }
  const backward = await backwardWalk(page, opts);
  const cls = classifyVsrTraps(forward, backward);
  return { forward, backward, ...cls };
}

module.exports = { classifyVsrTraps, backwardWalk, vsrNavigationIntegrity };
