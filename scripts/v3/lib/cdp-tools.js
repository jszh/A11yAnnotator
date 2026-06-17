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
// set_state_and_capture — MUTATING (fresh clone): drive ONE element into a named INTERACTION STATE the frozen
// transition table doesn't cover (focus / hover / checked / open / expanded / placeholder-shown), then
// re-capture the SAME clip before/after + a read-only computed-style DELTA over a fixed allowlist. For
// state-specific indicators (1.4.11 non-text contrast, 1.4.1 use-of-color, 1.4.3 state-only text). Returns the
// after-frame PIXELS (the sound datum) — NEVER a synthesized used-colour pair (unsound on the surfaces that
// reach this lane). `stateReached`/`textVisible` are load-bearing: a state that did not reproduce returns
// stateReached:false so the model cannot read a PASS from a state never seen.
const STYLE_KEYS = ['textDecorationLine', 'fontWeight', 'fontStyle', 'fontSize', 'outlineStyle', 'outlineWidth', 'outlineColor', 'borderStyle', 'borderTopWidth', 'borderColor', 'backgroundColor', 'boxShadow'];
async function setStateAndCapture(page, args, ctx) {
  const { targetXpath, state } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  const allowed = ['focus', 'hover', 'checked', 'open', 'expanded', 'placeholder-shown'];
  if (!allowed.includes(state)) return { error: `state must be one of: ${allowed.join(', ')}` };
  const live = ctx && typeof ctx.freshClone === 'function' ? await ctx.freshClone() : page;
  const ownClone = !!(ctx && typeof ctx.freshClone === 'function');
  try {
    const meta = await live.evaluate((xp, keys) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return null;
      el.setAttribute('data-v3-state-target', '1');
      try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el); const style = {}; for (const k of keys) style[k] = cs[k];
      return { box: { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), w: Math.min(innerWidth, r.width + 12), h: Math.min(innerHeight, r.height + 12) }, style };
    }, targetXpath, STYLE_KEYS);
    if (!meta || !(meta.box.w > 0 && meta.box.h > 0)) return { stateReached: false, reason: 'target not found or has no rendered box' };
    const clip = { x: Math.round(meta.box.x), y: Math.round(meta.box.y), width: Math.round(meta.box.w), height: Math.round(meta.box.h) };
    const before = await live.screenshot({ encoding: 'base64', clip });
    // drive the state on the clone (pseudo / native property / activation — all reload-isolated)
    let driven = { reached: false };
    if (state === 'hover') {
      await live.mouse.move(clip.x + clip.width / 2, clip.y + clip.height / 2);
      driven = { reached: null }; // hover-reached is judged by the style/pixel delta below
    } else {
      driven = await live.evaluate((st) => {
        const el = document.querySelector('[data-v3-state-target="1"]'); if (!el) return { reached: false };
        if (st === 'focus') { el.focus({ preventScroll: true }); return { reached: document.activeElement === el }; }
        if (st === 'checked') {
          if ('checked' in el) { el.checked = true; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return { reached: !!el.checked }; }
          const role = el.getAttribute('role');
          if (role === 'checkbox' || role === 'switch' || el.hasAttribute('aria-checked')) { const b = el.getAttribute('aria-checked'); el.click(); return { reached: el.getAttribute('aria-checked') !== b }; }
          return { reached: false }; // not a checkable element — honest "not reproduced"
        }
        if (st === 'placeholder-shown') { if ('value' in el && el.value) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); return { reached: el.value === '' }; } return { reached: false }; }
        if (st === 'open' || st === 'expanded') {
          const det = el.tagName === 'SUMMARY' ? el.parentElement : (el.tagName === 'DETAILS' ? el : null);
          if (det) { const was = det.open; el.click(); return { reached: det.open !== was }; }
          if (el.hasAttribute('aria-expanded')) { const b = el.getAttribute('aria-expanded'); el.click(); return { reached: el.getAttribute('aria-expanded') !== b }; }
          return { reached: false }; // nothing exposes an expanded state — honest "not reproduced"
        }
        return { reached: false };
      }, state).catch(() => ({ reached: false }));
    }
    await new Promise((r) => setTimeout(r, 220));
    const afterMeta = await live.evaluate((keys) => {
      const el = document.querySelector('[data-v3-state-target="1"]'); if (!el) return null;
      const cs = getComputedStyle(el); const style = {}; for (const k of keys) style[k] = cs[k];
      const r = el.getBoundingClientRect();
      return { style, hasText: !!((el.innerText || el.textContent || '').trim()), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
    }, STYLE_KEYS).catch(() => null);
    const after = await live.screenshot({ encoding: 'base64', clip });
    const styleDelta = {};
    if (afterMeta) for (const k of STYLE_KEYS) if (meta.style[k] !== afterMeta.style[k]) styleDelta[k] = { before: meta.style[k], after: afterMeta.style[k] };
    const pixelsChanged = before !== after;
    const stateReached = state === 'hover' ? (Object.keys(styleDelta).length > 0 || pixelsChanged) : !!(driven && driven.reached);
    return {
      stateReached,
      textVisible: !!(afterMeta && afterMeta.hasText),
      styleDelta,            // which allowlisted props changed (read-only) — NO synthesized fg/bg pair
      pixelsChanged,
      indicatorBox: afterMeta ? afterMeta.box : null,
      screenshots: { before, after }, // judge the AFTER pixels; the runner abandoned this surface for a reason
      ...(stateReached ? {} : { note: `state '${state}' did not reproduce — do not read a pass from it` }),
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
    tool('set_state_and_capture', 'Mutating (FRESH clone): drive ONE element into an interaction state (focus|hover|checked|open|expanded|placeholder-shown) and return before/after screenshots of the same region + the computed-style DELTA (which outline/border/decoration/background props changed) + stateReached/textVisible. Use for state-specific indicators (1.4.11/1.4.1/1.4.3). Returns PIXELS + objective style deltas, never a contrast number or a verdict; if stateReached is false, do not infer a pass.',
      { targetXpath: z.string(), state: z.enum(['focus', 'hover', 'checked', 'open', 'expanded', 'placeholder-shown']) }, (a) => wrap(setStateAndCapture, a)),
  ];
  return createSdkMcpServer({ name: 'cdp', version: '1.0.0', tools });
}

module.exports = { queryAxNode, observeStateAfterActivation, setStateAndCapture, buildCdpToolServer, resolveXpath };
