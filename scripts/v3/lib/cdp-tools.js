'use strict';
// Harness 3.4 Phase 2 — IN-PROCESS CDP TOOLS for the multi-turn LLM judge. These are the "interactive
// repertoire" a human auditor uses (activate a control, resolve a node, drive a state) that the FROZEN
// evidence bundle cannot contain (docs/analysis/coverage/LLM-INTERACTIVE-TOOLS.md). The Agent SDK lets the
// model CALL them mid-reasoning over the LIVE page.
//
// DESIGN: the tool LOGIC lives here as plain async functions `(page, args, ctx) -> objective result` — pure
// CDP/DOM measurement, unit-testable against a puppeteer page with NO SDK and NO model. A thin ESM binding
// (`buildCdpToolServer`) wraps them as SDK tools. SOUNDNESS RAILS (the report's invariants):
//   1. OBJECTIVE RETURN, NEVER AN INTERPRETATION — a tool returns a measurement/observation (a box, a delta,
//      an AX fact), never pass/fail/equivalent/barrier. The judgment stays in the model's (shadow) reasoning.
//   2. READ-ONLY by default. A MUTATING tool (activate / state-set) runs on a FRESH page clone (ctx.freshClone)
//      so it can never corrupt the frozen bundle or a later subject's evidence.
//   3. The verdict stays canary-capped shadow regardless of tool use — tools only widen what the model SEES.

// Resolve an xpath to a node handle (read-only). Returns the puppeteer ElementHandle or null.
async function resolveXpath(page, xpath) {
  if (typeof xpath !== 'string' || !xpath) return null;
  try {
    const handles = await page.$x ? await page.$x(xpath) : [];
    return handles && handles[0] ? handles[0] : null;
  } catch (e) {
    // Puppeteer dropped page.$x in newer versions — fall back to an evaluate-based marker.
    try {
      const ok = await page.evaluate((xp) => !!document.evaluate(xp, document, null, 9, null).singleNodeValue, xpath);
      return ok ? { __viaEval: true, xpath } : null;
    } catch (e2) { return null; }
  }
}

// ============================================================================================
// query_ax_node — READ-ONLY live AX introspection (1.3.1 coordinate path, 4.1.2 provenance, 2.4.4 link name)
// ============================================================================================
// Resolve an LLM-targeted node (by xpath OR by a screenshot pixel) to its live accessibility facts: role +
// role source, heading level, name provenance (nameFrom), aria-labelledby/describedby IDREF resolve status,
// required-states present/missing, focusability, aria-hidden suppression. The accessible-name STRING is NOT
// re-emitted as a second authority — only flags. Pure read; no DOM mutation, no focus/hover side effects.
async function queryAxNode(page, args) {
  const { targetXpath, x, y } = args || {};
  const cdp = await page.createCDPSession();
  try {
    await cdp.send('DOM.enable').catch(() => {});
    await cdp.send('Accessibility.enable').catch(() => {});
    await cdp.send('DOM.getDocument', { depth: -1 }).catch(() => {}); // prime the node map for getNodeForLocation
    let backendNodeId = null, resolvedXpath = targetXpath || null;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      const { backendNodeId: b } = await cdp.send('DOM.getNodeForLocation', { x: Math.round(x), y: Math.round(y), includeUserAgentShadowDOM: false }).catch(() => ({}));
      backendNodeId = b || null;
      if (backendNodeId) { try { const { object } = await cdp.send('DOM.resolveNode', { backendNodeId }); if (object && object.objectId) { /* objectId available */ } } catch (e) {} }
    } else if (typeof targetXpath === 'string' && targetXpath) {
      const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var r=document.evaluate(${JSON.stringify(targetXpath)},document,null,9,null);return r.singleNodeValue;})()`, returnByValue: false }).catch(() => ({}));
      if (ev && ev.result && ev.result.objectId) { const { node } = await cdp.send('DOM.describeNode', { objectId: ev.result.objectId }).catch(() => ({})); backendNodeId = node ? node.backendNodeId : null; }
    }
    if (!backendNodeId) return { resolved: false, reason: 'node not found at the given xpath/coordinate' };
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId, fetchRelatives: false }).catch(() => ({ nodes: [] }));
    const ax = (nodes || [])[0];
    if (!ax) return { resolved: true, inTree: false, reason: 'node has no accessibility object (ignored / presentational)' };
    const prop = (name) => { const p = (ax.properties || []).find((q) => q.name === name); return p ? p.value && p.value.value : undefined; };
    const nameFrom = ((ax.name && ax.name.sources) || []).filter((s) => s && (s.value || s.attribute)).map((s) => s.type || s.attribute).filter(Boolean);
    // resolve aria-labelledby / aria-describedby idref status (read-only, against the live DOM)
    const idrefStatus = async (attr) => {
      const raw = await page.evaluate((xp, bId, a) => {
        let el = null;
        // locate via xpath if available, else this is the coordinate path (skip)
        if (xp) { el = document.evaluate(xp, document, null, 9, null).singleNodeValue; }
        if (!el) return null;
        const v = el.getAttribute(a);
        if (!v) return null;
        return v.trim().split(/\s+/).map((id) => ({ id, present: !!document.getElementById(id), hasText: !!(document.getElementById(id) && (document.getElementById(id).textContent || '').trim()) }));
      }, resolvedXpath, backendNodeId, attr).catch(() => null);
      return raw;
    };
    const labelledby = await idrefStatus('aria-labelledby');
    const describedby = await idrefStatus('aria-describedby');
    return {
      resolved: true,
      inTree: !ax.ignored,
      role: ax.role && ax.role.value || null,
      roleSource: ax.role && ax.role.type || null,
      headingLevel: prop('level') != null ? prop('level') : null,
      nameFrom,
      labelledby, describedby,
      focusable: prop('focusable') === true,
      isAriaHidden: (ax.ignoredReasons || []).some((r) => r && r.name === 'ariaHiddenElement'),
      requiredStatesPresent: ['checked', 'expanded', 'pressed', 'selected'].filter((s) => prop(s) !== undefined),
      ignoredReasons: (ax.ignoredReasons || []).map((r) => r && r.name).filter(Boolean),
    };
  } finally { try { await cdp.detach(); } catch (e) {} }
}

// ============================================================================================
// observe_state_after_activation — MUTATING (fresh clone): ONE activation, objective before/after delta
// (4.1.3 insertion-only gap, 2.4.10/1.4.10 reveal, 1.1.1 carousel). Reports WHAT changed and HOW content
// became visible (inserted vs un-hidden) — the insertion-only blind spot of the static status detector.
// ============================================================================================
async function observeStateAfterActivation(page, args, ctx) {
  const { targetXpath } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  // ALWAYS on a fresh clone — activation mutates the page.
  const live = ctx && typeof ctx.freshClone === 'function' ? await ctx.freshClone() : page;
  const ownClone = !!(ctx && typeof ctx.freshClone === 'function');
  try {
    const snapshot = () => live.evaluate((xp) => {
      const visText = () => { const s = new Set(); for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) s.add(n.textContent.trim()); } return [...s]; };
      const xpathOf = (el) => { if (!el || el.nodeType !== 1) return null; const parts = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; parts.unshift(n.tagName.toLowerCase() + '[' + i + ']'); } return '/' + parts.join('/'); };
      const liveRegions = [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log],output')];
      return { url: location.href, active: xpathOf(document.activeElement), texts: visText(), inLive: liveRegions.map((r) => r.textContent.trim()) };
    }, targetXpath);

    const before = await snapshot();
    let navigated = false, newWindow = false;
    live.once('framenavigated', () => { navigated = true; });
    live.once('popup', () => { newWindow = true; });
    // activate exactly ONCE: a real click (covers button/link/checkbox); guard external nav.
    const acted = await live.evaluate((xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return false;
      window.__obsNav = false;
      // guard ONLY a real navigating link (don't leave the page); a plain button/checkbox click is NOT navigation.
      const g = (e) => {
        if (!(e.target === el || (el.contains && el.contains(e.target)))) return;
        const a = el.closest && el.closest('a[href]');
        const href = a && a.getAttribute('href');
        if (href && !href.startsWith('#')) { window.__obsNav = true; if (e.cancelable) e.preventDefault(); }
      };
      document.addEventListener('click', g, true);
      el.click();
      document.removeEventListener('click', g, true);
      return true;
    }, targetXpath).catch(() => false);
    if (!acted) return { error: 'target not found on the live clone' };
    await new Promise((r) => setTimeout(r, 350)); // settle async DOM/aria updates
    const after = await snapshot();
    const navIntent = await live.evaluate(() => window.__obsNav === true).catch(() => false);

    const beforeSet = new Set(before.texts);
    const newTexts = after.texts.filter((t) => !beforeSet.has(t));
    // classify HOW each new text became visible: inserted (new node) vs un-hidden (display/visibility/aria-hidden toggle)
    const newlyVisible = await live.evaluate((newT) => {
      const out = [];
      const xpathOf = (el) => { if (!el || el.nodeType !== 1) return null; const parts = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; parts.unshift(n.tagName.toLowerCase() + '[' + i + ']'); } return '/' + parts.join('/'); };
      for (const t of newT.slice(0, 12)) {
        let host = null; for (const el of document.querySelectorAll('body *')) { for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim() === t) { host = el; break; } if (host) break; }
        if (!host) continue;
        const inLive = !!host.closest('[aria-live],[role=status],[role=alert],[role=log],output');
        out.push({ xpath: xpathOf(host), text: t.slice(0, 80), inLiveRegion: inLive });
      }
      return out;
    }, newTexts).catch(() => []);

    return {
      activeElementChanged: before.active !== after.active,
      activeElementAfter: after.active,
      urlChanged: before.url !== after.url,
      navigated: navigated || navIntent,
      newWindow,
      newlyVisibleNodes: newlyVisible,
      newVisibleTextCount: newTexts.length,
      anyNewTextInLiveRegion: newlyVisible.some((n) => n.inLiveRegion),
    };
  } finally { if (ownClone) { try { await live.close(); } catch (e) {} } }
}

// ============================================================================================
// SDK binding — wrap the raw tool functions as an in-process MCP server over the live page `session`.
// `session` = { page, freshClone:()=>Promise<page> }. Lazy-imports the SDK (ESM) + zod. Each tool returns
// the JSON-stringified OBJECTIVE result as MCP text content — never a verdict.
// ============================================================================================
async function buildCdpToolServer(session) {
  const { tool, createSdkMcpServer } = await import('@anthropic-ai/claude-agent-sdk');
  const { z } = await import('zod');
  const page = session.page;
  const ctx = { freshClone: session.freshClone };
  const wrap = (fn, args) => fn(page, args, ctx).then((r) => ({ content: [{ type: 'text', text: JSON.stringify(r) }] })).catch((e) => ({ content: [{ type: 'text', text: JSON.stringify({ error: String(e && e.message || e) }) }], isError: true }));
  const tools = [
    tool('query_ax_node', 'Read-only: resolve a node (by xpath OR by a screenshot pixel x/y) to its live accessibility facts — role, role source, heading level, name provenance (nameFrom), aria-labelledby/describedby IDREF resolve status, required states, focusability, aria-hidden. Returns raw facts, NEVER a pass/fail.',
      { targetXpath: z.string().optional(), x: z.number().optional(), y: z.number().optional() }, (a) => wrap(queryAxNode, a)),
    tool('observe_state_after_activation', 'Mutating (runs on a FRESH page clone): activate ONE control (by xpath) and return the OBJECTIVE before/after delta — what newly-visible text appeared, whether it appeared inside a live region, whether focus moved, whether the page navigated/opened a window. Reports WHAT changed and HOW, never whether it is conformant.',
      { targetXpath: z.string() }, (a) => wrap(observeStateAfterActivation, a)),
  ];
  return createSdkMcpServer({ name: 'cdp', version: '1.0.0', tools });
}

module.exports = { queryAxNode, observeStateAfterActivation, buildCdpToolServer, resolveXpath };
