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
    const isCoordPath = Number.isFinite(x) && Number.isFinite(y);
    if (isCoordPath) {
      const { backendNodeId: b } = await cdp.send('DOM.getNodeForLocation', { x: Math.round(x), y: Math.round(y), includeUserAgentShadowDOM: false }).catch(() => ({}));
      backendNodeId = b || null;
    } else if (typeof targetXpath === 'string' && targetXpath) {
      // S4 (RCA R4): resolve a `>>`-pathed node by DESCENDING into same-origin iframes (frame contentDocument).
      // A cross-origin frame yields contentDocument:null ⇒ the node stays unresolved (an honest abstain, never a
      // mis-resolution). This un-deads the akn7bn cluster where in-frame `<a>`/button nodes returned "not found".
      // SVG/MathML NAMESPACE FALLBACK (parity with act-page-collect's resolveAx): a namespaced node returns null
      // from a plain document.evaluate, so when a segment fails, RETRY it with each lowercase `tag[idx]` step
      // rewritten to `*[local-name()="tag"][idx]` (per `>>` frame segment). Fallback-only — HTML xpaths resolve
      // identically via local-name(), so a successfully-resolving xpath is never perturbed.
      const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var nsf=function(s){return s.split('/').map(function(p){var m=p.match(/^([a-zA-Z][\\w-]*)(\\[[0-9]+\\])?$/);return m?'*[local-name()="'+m[1]+'"]'+(m[2]||''):p;}).join('/');};var parts=${JSON.stringify(targetXpath)}.split('>>');var doc=document,el=null;for(var i=0;i<parts.length;i++){if(!doc)return null;var r=doc.evaluate(parts[i],doc,null,9,null);el=r.singleNodeValue;if(!el){try{el=doc.evaluate(nsf(parts[i]),doc,null,9,null).singleNodeValue;}catch(e){el=null;}}if(!el)return null;if(i<parts.length-1){try{doc=el.contentDocument;}catch(e){return null;}}}return el;})()`, returnByValue: false }).catch(() => ({}));
      if (ev && ev.result && ev.result.objectId) { const { node } = await cdp.send('DOM.describeNode', { objectId: ev.result.objectId }).catch(() => ({})); backendNodeId = node ? node.backendNodeId : null; }
    }
    if (!backendNodeId) return { resolved: false, reason: 'node not found at the given xpath/coordinate' };
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId, fetchRelatives: false }).catch(() => ({ nodes: [] }));
    const ax = (nodes || [])[0];
    if (!ax) return { resolved: true, inTree: false, reason: 'node has no accessibility object (ignored / presentational)' };
    const prop = (name) => { const p = (ax.properties || []).find((q) => q.name === name); return p ? p.value && p.value.value : undefined; };
    // nameFrom: emit only the CONTRIBUTING source(s) — non-superseded slots that actually carry a value — NOT
    // every candidate slot the engine considered (otherwise a contents-named button fabricates "aria-label" too).
    const nameFrom = ((ax.name && ax.name.sources) || []).filter((s) => s && !s.superseded && s.value && s.value.value != null && String(s.value.value).length).map((s) => s.type || s.attribute).filter(Boolean);
    const role = (ax.role && ax.role.value) || null;
    // Required-state provenance (F68 / ACT 4e8ab6): the AX tree SYNTHESIZES a default (a div role=checkbox with
    // no aria-checked still reports checked:false), masking the "author omitted the required state" failure. So
    // read the LIVE author attributes and split author-PRESENT from synthesized, and compute what an EXPLICIT
    // ARIA widget role requires but the author omitted. A NATIVE control (<input type=checkbox>) conveys its
    // state natively ⇒ never "missing". option/tab are exempt (implicit aria-selected default). Coordinate path
    // cannot read the element ⇒ requiredStatesMissing:null (never a fabricated empty set).
    const ROLE_REQUIRES = { checkbox: ['aria-checked'], radio: ['aria-checked'], switch: ['aria-checked'], menuitemcheckbox: ['aria-checked'], menuitemradio: ['aria-checked'], combobox: ['aria-expanded'] };
    const STATE_ATTRS = ['aria-checked', 'aria-expanded', 'aria-pressed', 'aria-selected'];
    let requiredStatesPresent, requiredStatesMissing;
    if (!isCoordPath && resolvedXpath) {
      const live = await page.evaluate((xp, attrs) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; const present = {}; for (const a of attrs) present[a] = el.hasAttribute(a); const nativeConveys = (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) || el.tagName === 'DETAILS' || el.tagName === 'OPTION' || el.tagName === 'SELECT'; return { present, explicitRole: el.getAttribute('role'), nativeConveys }; }, resolvedXpath, STATE_ATTRS).catch(() => null);
      if (live) {
        requiredStatesPresent = STATE_ATTRS.filter((a) => live.present[a]).map((a) => a.replace('aria-', ''));
        // flag a missing required state ONLY for an EXPLICIT aria widget that does NOT natively convey the state
        // (a native checkbox/radio/details/option conveys it regardless of a redundant role); look up by the
        // RESOLVED computed role (not the raw attribute string, which may be a token list).
        const need = (live.explicitRole && !live.nativeConveys) ? (ROLE_REQUIRES[role] || []) : [];
        requiredStatesMissing = need.filter((a) => !live.present[a]).map((a) => a.replace('aria-', ''));
      } else { requiredStatesPresent = []; requiredStatesMissing = null; }
    } else {
      requiredStatesPresent = ['checked', 'expanded', 'pressed', 'selected'].filter((s) => prop(s) !== undefined); // synthesized-or-author; can't tell on coord path
      requiredStatesMissing = null;
    }
    // resolve aria-labelledby / aria-describedby idref status (xpath path; the coord path can't read the element,
    // so return an explicit token — NEVER null, which the model would misread as "no aria-labelledby attribute").
    const idrefStatus = async (attr) => {
      if (isCoordPath || !resolvedXpath) return 'unresolved-on-coordinate-path';
      const raw = await page.evaluate((xp, a) => {
        const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!el) return null;
        const v = el.getAttribute(a);
        if (!v) return null;
        return v.trim().split(/\s+/).map((id) => ({ id, present: !!document.getElementById(id), hasText: !!(document.getElementById(id) && (document.getElementById(id).textContent || '').trim()) }));
      }, resolvedXpath, attr).catch(() => null);
      return raw;
    };
    const labelledby = await idrefStatus('aria-labelledby');
    const describedby = await idrefStatus('aria-describedby');
    return {
      resolved: true,
      inTree: !ax.ignored,
      role,
      roleSource: ax.role && ax.role.type || null,
      headingLevel: prop('level') != null ? prop('level') : null,
      nameFrom,
      labelledby, describedby,
      focusable: prop('focusable') === true,
      isAriaHidden: (ax.ignoredReasons || []).some((r) => r && (r.name === 'ariaHiddenElement' || r.name === 'ariaHiddenSubtree')),
      requiredStatesPresent,
      requiredStatesMissing,
      ignoredReasons: (ax.ignoredReasons || []).map((r) => r && r.name).filter(Boolean),
      // S4 (RCA R4): a node IGNORED only because a modal dialog is open reports role:'none' / inTree:false — that
      // is NOT an authored role strip. Flag it so the judge does not misread a fully-operable control (a button
      // behind/beside an auto-opened <dialog>) as semantically neutralised (the akn7bn FP).
      ignoredByActiveModal: (ax.ignoredReasons || []).some((r) => r && (r.name === 'activeModalDialog' || r.name === 'inertSubtree')),
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
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
  // aria-live="off" does NOT announce; alertdialog DOES — match the status detector's selector exactly.
  const LIVE_SEL = '[aria-live="polite"],[aria-live="assertive"],[role=status],[role=alert],[role=log],[role=alertdialog],output';
  try {
    // BEFORE: tag every existing element (node identity that survives across evaluate calls) + record its
    // pre-activation hidden-state, so AFTER we can classify each newly-visible text as inserted vs un-hidden
    // (the tool's whole reason to exist — the insertion-only blind spot of the static detector). Tagging mutates
    // only the THROWAWAY clone. Visibility uses checkVisibility so an ANCESTOR display:none counts as hidden.
    const before = await live.evaluate((xp) => {
      const _vis = (el) => { try { return el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) && !el.closest('[aria-hidden="true"]'); } catch (e) { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'); } };
      const _xp = (el) => { if (!el || el.nodeType !== 1) return null; const p = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; p.unshift(n.tagName.toLowerCase() + '[' + i + ']'); } return '/' + p.join('/'); };
      const texts = new Set();
      for (const el of document.querySelectorAll('body *')) {
        el.setAttribute('data-v3-pre', '1');
        const cs = getComputedStyle(el);
        el.setAttribute('data-v3-pv', (cs.display === 'none' ? 'd' : '') + (cs.visibility === 'hidden' ? 'v' : '') + (el.closest('[aria-hidden="true"]') ? 'a' : ''));
        if (_vis(el)) for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) texts.add(n.textContent.trim());
      }
      // perceivability gate (isPerceivable): a hidden / zero-size control could not be activated by a user.
      const tgt = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      const r = tgt ? tgt.getBoundingClientRect() : null;
      const tgtPerceivable = !!(tgt && _vis(tgt) && r && r.width > 0 && r.height > 0);
      // isSafe awareness: classify the control so the model knows the after-delta may be a navigation/submit/
      // download (a leaving/destructive action), not just an in-page reveal. The clone contains it regardless.
      let activationKind = 'in-page';
      if (tgt) {
        const a = tgt.closest && tgt.closest('a[href]'); const href = a && a.getAttribute('href');
        if (a && a.hasAttribute('download')) activationKind = 'download-link';
        else if (href && !href.startsWith('#')) activationKind = 'navigating-link';
        else if (tgt.type === 'submit' || tgt.type === 'reset' || (tgt.tagName === 'INPUT' && tgt.type === 'submit') || (tgt.tagName === 'BUTTON' && tgt.closest('form') && (tgt.type === 'submit' || !tgt.type))) activationKind = 'form-submit';
      }
      return { url: location.href, active: _xp(document.activeElement), texts: [...texts], tgtPerceivable, activationKind };
    }, targetXpath);
    if (!before.tgtPerceivable) return { refused: 'target-not-perceivable', reason: 'the control is hidden / zero-size on a fresh load — a user could not activate it (isPerceivable gate)' };

    let navigated = false, newWindow = false;
    live.once('framenavigated', () => { navigated = true; });
    live.once('popup', () => { newWindow = true; });
    // activate exactly ONCE: a real click (covers button/link/checkbox); guard external nav.
    const acted = await live.evaluate((xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return false;
      window.__obsNav = false;
      // install a DOM-mutation watcher BEFORE the click so a reveal is caught whether it lands synchronously or on a
      // delayed timer (the node-side wait below polls these). Observing pre-click is what makes the SYNC case fast and
      // the DELAYED case not-missed — an observer installed AFTER the click cannot tell "already settled" from "delayed".
      window.__obsSaw = false; window.__obsLast = performance.now();
      try { window.__obsMO = new MutationObserver(() => { window.__obsSaw = true; window.__obsLast = performance.now(); }); window.__obsMO.observe(document, { subtree: true, childList: true, attributes: true, characterData: true }); } catch (e) {}
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
    // wait for the post-click reveal to LAND + quiesce: return once the DOM has been quiet for 250ms AFTER a change,
    // bounded [350ms floor, 2500ms ceiling]. The `__obsSaw` gate is essential — without it, "no mutation yet" reads as
    // "quiet" and the wait returns BEFORE a delayed reveal (the bug the validation harness caught). A blind fixed delay
    // fires at a wall-clock the reveal can race past under load. V3_TOOL_LEGACY_DELAY=1 = old blind 350ms (A/B hatch).
    if (process.env.V3_TOOL_LEGACY_DELAY === '1') { await new Promise((r) => setTimeout(r, 350)); }
    else await live.evaluate(async (minMs, quietMs, maxMs) => {
      const t0 = performance.now();
      for (;;) { const now = performance.now();
        if (now - t0 >= maxMs) break;                                                  // ceiling — never hang
        if (now - t0 >= minMs && window.__obsSaw && now - window.__obsLast >= quietMs) break; // a change LANDED and settled
        await new Promise((r) => requestAnimationFrame(r)); }
      try { window.__obsMO && window.__obsMO.disconnect(); } catch (e) {}
    }, 350, 250, 2500).catch(() => {});
    const navIntent = await live.evaluate(() => window.__obsNav === true).catch(() => false);

    // AFTER: find newly-visible texts and classify HOW each became visible + whether its live region pre-existed.
    const after = await live.evaluate((beforeTexts, liveSel) => {
      const _vis = (el) => { try { return el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) && !el.closest('[aria-hidden="true"]'); } catch (e) { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'); } };
      const _xp = (el) => { if (!el || el.nodeType !== 1) return null; const p = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; p.unshift(n.tagName.toLowerCase() + '[' + i + ']'); } return '/' + p.join('/'); };
      const beforeSet = new Set(beforeTexts), seen = new Set(), out = [];
      const activeEl = document.activeElement; let focusMovedToChange = false;
      for (const el of document.querySelectorAll('body *')) {
        if (!_vis(el)) continue;
        for (const n of el.childNodes) {
          if (n.nodeType !== 3) continue; const t = n.textContent.trim();
          if (!t || beforeSet.has(t) || seen.has(t)) continue; seen.add(t);
          if (out.length >= 12) continue;
          const preExisted = el.hasAttribute('data-v3-pre');
          let cause;
          if (!preExisted) cause = 'inserted';
          else { const pv = el.getAttribute('data-v3-pv') || ''; cause = pv.includes('d') ? 'display' : pv.includes('v') ? 'visibility' : pv.includes('a') ? 'aria-hidden' : 'text-changed'; }
          const liveAncestor = el.closest(liveSel);
          const inLiveRegion = !!liveAncestor;
          const liveRegionPreExisted = inLiveRegion && liveAncestor.hasAttribute('data-v3-pre'); // 4.1.3: the region must PRE-EXIST to be reliably announced
          if (activeEl && (activeEl === el || el.contains(activeEl))) focusMovedToChange = true;
          out.push({ xpath: _xp(el), text: t.slice(0, 80), visibilityCause: cause, inLiveRegion, liveRegionPreExisted });
        }
      }
      return { url: location.href, active: _xp(activeEl), newlyVisible: out, focusMovedToChange };
    }, before.texts, LIVE_SEL).catch(() => ({ url: before.url, active: null, newlyVisible: [], focusMovedToChange: false }));

    return {
      activeElementChanged: before.active !== after.active,
      activeElementAfter: after.active,
      activationKind: before.activationKind, // in-page | navigating-link | download-link | form-submit (isSafe awareness)
      focusMovedToChange: after.focusMovedToChange, // focus landed INSIDE newly-revealed content (vs elsewhere)
      urlChanged: before.url !== after.url,
      navigated: navigated || navIntent,
      newWindow,
      newlyVisibleNodes: after.newlyVisible, // each carries visibilityCause (inserted|display|visibility|aria-hidden|text-changed)
      newVisibleTextCount: after.newlyVisible.length,
      // 4.1.3 requires the live region to PRE-EXIST; text appearing in a region CREATED with its message is not
      // reliably announced — that is anyNewTextInNewLiveRegion (INCONCLUSIVE for 4.1.3), NOT a clean announcement.
      anyNewTextInLiveRegion: after.newlyVisible.some((n) => n.inLiveRegion && n.liveRegionPreExisted),
      anyNewTextInNewLiveRegion: after.newlyVisible.some((n) => n.inLiveRegion && !n.liveRegionPreExisted),
    };
  } finally { try { await live.close(); } catch (e) {} }
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
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
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
    // Park the pointer FAR away before the BEFORE frame so it is genuinely un-hovered (a prior tool / default
    // position could otherwise leave the target hovered, making hover read as a no-op pass). vision-capture does
    // the same. For hover we then move the pointer onto the element; for the others it stays parked in both frames.
    await live.mouse.move(10000, 10000).catch(() => {});
    const before = await require('./settle.js').robustScreenshot(live, { encoding: 'base64', clip });
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
          // ONLY a native checkbox/radio has a 'checked' STATE — `'checked' in el` is true for the whole
          // HTMLInputElement prototype (text/range/...), which would no-op-write and falsely report reached.
          if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) { el.checked = true; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return { reached: !!el.checked }; }
          const role = el.getAttribute('role');
          if (role === 'checkbox' || role === 'switch' || el.hasAttribute('aria-checked')) { const b = el.getAttribute('aria-checked'); el.click(); return { reached: el.getAttribute('aria-checked') !== b }; }
          return { reached: false }; // not a checkable element — honest "not reproduced"
        }
        if (st === 'placeholder-shown') {
          // placeholder-shown only exists if there IS a placeholder (an empty field with no placeholder shows nothing).
          const ph = el.getAttribute('placeholder');
          if (!ph || !('value' in el)) return { reached: false };
          if (el.value) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
          return { reached: el.value === '', placeholderText: ph };
        }
        if (st === 'open' || st === 'expanded') {
          const det = el.tagName === 'SUMMARY' ? el.parentElement : (el.tagName === 'DETAILS' ? el : null);
          if (det) { const was = det.open; el.click(); return { reached: det.open !== was }; }
          if (el.hasAttribute('aria-expanded')) { const b = el.getAttribute('aria-expanded'); el.click(); return { reached: el.getAttribute('aria-expanded') !== b }; }
          return { reached: false }; // nothing exposes an expanded state — honest "not reproduced"
        }
        return { reached: false };
      }, state).catch(() => ({ reached: false }));
    }
    await require('./settle.js').awaitSettle(live, { force: true, floorMs: 220 }); // settle the state transition's reflow before the AFTER frame (floor preserves the old 220ms transition window)
    const afterMeta = await live.evaluate((keys) => {
      const el = document.querySelector('[data-v3-state-target="1"]'); if (!el) return null;
      const cs = getComputedStyle(el); const style = {}; for (const k of keys) style[k] = cs[k];
      const r = el.getBoundingClientRect();
      return { style, hasText: !!((el.innerText || el.textContent || '').trim()), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
    }, STYLE_KEYS).catch(() => null);
    const after = await require('./settle.js').robustScreenshot(live, { encoding: 'base64', clip });
    const styleDelta = {};
    if (afterMeta) for (const k of STYLE_KEYS) if (meta.style[k] !== afterMeta.style[k]) styleDelta[k] = { before: meta.style[k], after: afterMeta.style[k] };
    const pixelsChanged = before !== after;
    const stateReached = state === 'hover' ? (Object.keys(styleDelta).length > 0 || pixelsChanged) : !!(driven && driven.reached);
    return {
      stateReached,
      textVisible: !!((afterMeta && afterMeta.hasText) || (driven && driven.placeholderText)), // a shown placeholder IS visible text
      styleDelta,            // which allowlisted props changed (read-only) — NO synthesized fg/bg pair
      pixelsChanged,
      indicatorBox: afterMeta ? afterMeta.box : null,
      screenshots: { before, after }, // judge the AFTER pixels; the runner abandoned this surface for a reason
      ...(stateReached ? {} : { note: `state '${state}' did not reproduce — do not read a pass from it` }),
    };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// probe_screen_reader_after_action — MUTATING (fresh clone): the only genuinely during-inspection SR datum.
// On a fresh clone, inject the Guidepup VSR, clear its spoken-phrase log, trigger ONE control, settle the
// politeness queue, and return the VERBATIM live-region announcement queue (4.1.3 — and the announced-after-
// submit slice of 3.3.1/3.3.3). The harness owns the AT + settle window (the model only names the trigger),
// removing the "tune the window until it announces" channel. CAVEAT (memory: vsr-is-harness-instrument): the
// VSR draws from the SAME Chromium AX tree as CDP, so an announcement is NOT an independent source — its only
// uniquely-new datum is the POST-ACTION VOICING. Raw observation only, never an "announced/adequate" verdict.
async function probeScreenReaderAfterAction(page, args, ctx) {
  const { triggerXpath } = args || {};
  if (typeof triggerXpath !== 'string' || !triggerXpath) return { error: 'triggerXpath required' };
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
  try {
    const vsr = require('./vsr-collect.js');
    const ok = await vsr.ensureVsr(live);
    if (!ok) return { error: 'vsr-injection-failed', probeFailed: true }; // instrument failure ≠ "nothing voiced" — never set emptyQueue here
    const res = await live.evaluate(async (xp, legacy) => {
      const v = window.__vsr;
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return { found: false };
      try { await v.start({ container: document.body }); } catch (e) { return { found: true, started: false }; }
      try { await v.clearSpokenPhraseLog(); } catch (e) {}
      // ARM a live-region MUTATION watcher BEFORE the click — the DETERMINISTIC signal that a 4.1.3 announcement is
      // coming (a message inserted into a PRE-EXISTING aria-live / role=status|alert region WILL be voiced). It is an
      // ADDITIONAL quiescence signal, not the sole gate: it RESETS the quiet timer exactly like a spoken phrase, so a
      // late voice that follows an in-window mutation — even with NO earlier focus phrase — is not cut off at the
      // floor (the bug the spoken-log-only poll had). ariaNotify (no DOM footprint) is still caught by the spoken-log
      // signal. A mutation that never voices (a region CREATED with its content; aria-live=off, excluded) just
      // quiesces out — bounded, never a hang. LIMIT: a mutation that first appears AFTER the floor is still missed —
      // the floor is the "wait for the announcement to START" window.
      const LIVE = '[aria-live="polite"],[aria-live="assertive"],[role=status],[role=alert],[role=log],[role=alertdialog],output';
      let liveAt = 0, sawLive = false;
      const hit = (node) => { try { const e = node && (node.nodeType === 1 ? node : node.parentElement); if (!e || !e.closest) return false; const m = e.closest(LIVE); return !!m && m.getAttribute('aria-live') !== 'off'; } catch (er) { return false; } };
      const mo = new MutationObserver((recs) => { for (const r of recs) { let h = hit(r.target); if (!h) for (const an of (r.addedNodes || [])) { if (hit(an) || (an.querySelector && an.querySelector(LIVE))) { h = true; break; } } if (h) { liveAt = performance.now(); sawLive = true; } } });
      try { mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-live'] }); } catch (e) {}
      el.click(); // trigger the action; the VSR voices any live-region change / ariaNotify
      // QUIESCENCE poll over two signals: the VSR spoken-phrase log (also catches ariaNotify) and the live-region
      // mutation time `liveAt`. KEY: when a live region has mutated but the SR has NOT voiced since (awaitingVoice),
      // we KEEP waiting for the voice — up to `voiceWindow` (3000ms) past the mutation — instead of quiescing at the
      // floor. That is the fix for a late voice with no earlier phrase (a plain reset-the-timer only buys 400ms). A
      // mutation that never voices (new region / aria-live=off) expires after voiceWindow and quiesces out — bounded.
      // floor 1400 / quiet 400 / voiceWindow 3000 / ceiling 6000 (vsr-stress measured voices at ~2.0-2.6s under load).
      { const t0 = performance.now(); let spokenAt = t0, prev = 0;
        for (;;) {
          let n = 0; try { n = (await v.spokenPhraseLog()).length; } catch (e) {}
          const now = performance.now();
          if (n !== prev) { spokenAt = now; prev = n; }
          const lastActivity = (!legacy && liveAt > spokenAt) ? liveAt : spokenAt; // V3_VSR_LEGACY=1 ⇒ spoken-log only
          const awaitingVoice = !legacy && liveAt > spokenAt && (now - liveAt) < 3000; // a live mutation not yet voiced
          if (now - t0 >= 6000) break;
          if (now - t0 >= 1400 && now - lastActivity >= 400 && !awaitingVoice) break;
          await new Promise((r) => setTimeout(r, 80));
        } }
      try { mo.disconnect(); } catch (e) {}
      let log = [];
      try { log = await v.spokenPhraseLog(); } catch (e) {}
      try { await v.stop(); } catch (e) {}
      return { found: true, started: true, sawLiveMutation: sawLive, log: Array.isArray(log) ? log.map(String) : [] };
    }, triggerXpath, process.env.V3_VSR_LEGACY === '1');
    if (!res || !res.found) return { error: 'trigger not found', probeFailed: true };
    if (!res.started) return { error: 'vsr-start-failed', probeFailed: true };
    const announcements = (res.log || []).filter(Boolean);
    // Only POLITE/ASSERTIVE live-region phrases bear on 4.1.3 — focus/change-of-context phrases (e.g. a moved
    // focus reading its name+role) are explicitly out of 4.1.3 scope. Surface BOTH: the full queue (transparency)
    // and the live-region subset (the 4.1.3-relevant datum). emptyQueue reflects the FULL queue; the model uses
    // noLiveRegionAnnouncement for 4.1.3 (and an un-hide / fresh-container insert may voice nothing ⇒ INCONCLUSIVE).
    const liveRegionAnnouncements = announcements.filter((a) => /^(polite|assertive)\b/i.test(a));
    // sawLiveMutation + noLiveRegionAnnouncement together pin the 4.1.3 INCONCLUSIVE case: a live region DID update
    // but the SR voiced nothing (a region created-with-content, an aria-live=off, or a non-perceivable change) — vs
    // a clean "nothing happened" (no mutation). The model must NOT read an un-voiced update as a pass.
    return { announcements, announcementCount: announcements.length, emptyQueue: announcements.length === 0, liveRegionAnnouncements, noLiveRegionAnnouncement: liveRegionAnnouncements.length === 0, liveRegionMutated: !!res.sawLiveMutation };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// measure_geometry_live — READ-ONLY (shared base page; no viewport/render change ⇒ concurrency-safe): box +
// horizontal-overflow + overflow culprit for one element, and the overlap/gap between TWO named elements
// (1.4.13 occlusion; 1.4.10 sub-element overflow). Raw measured numbers; marks an ambiguous case rather than
// inventing a value; never pass/fail. (For a popup that only exists on hover/focus, drive the state with
// set_state_and_capture first; for a non-collected viewport width, that's a clone op — out of this tool.)
async function measureGeometryLive(page, args, ctx) {
  const { targetXpath, otherXpath, viewportWidth } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  // For a non-collected viewport width (1.4.10 reflow), run on a CLONE with setViewport — NEVER resize the
  // SHARED page (that would corrupt concurrent peers). With no viewportWidth, stay read-only on the shared page.
  const useClone = Number.isFinite(viewportWidth) && viewportWidth > 0 && ctx && typeof ctx.freshClone === 'function';
  const live = useClone ? await ctx.freshClone() : page;
  try {
    if (useClone) { await live.setViewport({ width: Math.round(viewportWidth), height: 900, deviceScaleFactor: 1 }).catch(() => {}); await require('./settle.js').awaitSettle(live, { force: true, floorMs: 140 }); } // settle the viewport-change reflow (floor preserves old 140ms)
  const r = await live.evaluate((xp, oxp) => {
    const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
    if (!el) return { found: false };
    const b = el.getBoundingClientRect();
    // occlusion hit-test (1.4.13 Dismissible): sample a grid inside the target box; any element painting ABOVE
    // the target (topmost-first stack, and not the target's own ancestor/descendant) occludes it. Raw boxes —
    // the model applies the decorative/whitespace exception.
    const occ = new Map(), GX = 4, GY = 4;
    for (let i = 1; i <= GX; i++) for (let j = 1; j <= GY; j++) {
      const px = b.left + (b.width * i) / (GX + 1), py = b.top + (b.height * j) / (GY + 1);
      if (px < 0 || py < 0 || px >= window.innerWidth || py >= window.innerHeight) continue;
      const stack = document.elementsFromPoint(px, py);
      const ti = stack.findIndex((e) => e === el || el.contains(e) || e.contains(el));
      for (let k = 0; k < (ti < 0 ? stack.length : ti); k++) {
        const o = stack[k]; if (o === el || el.contains(o) || o.contains(el) || occ.has(o)) continue;
        const ob = o.getBoundingClientRect();
        occ.set(o, { tag: o.tagName.toLowerCase(), role: o.getAttribute('role') || null, box: { x: Math.round(ob.x), y: Math.round(ob.y), w: Math.round(ob.width), h: Math.round(ob.height) } });
      }
    }
    const occludedElements = [...occ.values()].slice(0, 8);
    const overflowsH = el.scrollWidth > el.clientWidth + 2;
    let culprit = null;
    // content-right edge must account for a left border / horizontal scroll offset, else it mis-fires.
    const contentRight = b.left + el.clientLeft + el.clientWidth - el.scrollLeft;
    if (overflowsH) { for (const d of el.querySelectorAll('*')) { const dr = d.getBoundingClientRect(); if (dr.right > contentRight + 2) { culprit = { tag: d.tagName.toLowerCase(), role: d.getAttribute('role') || null }; break; } } }
    let overlap = null;
    if (oxp) {
      const o = document.evaluate(oxp, document, null, 9, null).singleNodeValue;
      if (o) {
        const ob = o.getBoundingClientRect();
        const ix = Math.max(0, Math.min(b.right, ob.right) - Math.max(b.left, ob.left)), iy = Math.max(0, Math.min(b.bottom, ob.bottom) - Math.max(b.top, ob.top)), area = ix * iy;
        const gapX = ob.left > b.right ? ob.left - b.right : (b.left > ob.right ? b.left - ob.right : 0);
        const gapY = ob.top > b.bottom ? ob.top - b.bottom : (b.top > ob.bottom ? b.top - ob.bottom : 0);
        // BOTH fractions: of-other surfaces 1.4.13 occlusion (a small label 100%-covered understates as ~0 of the big target);
        // axis gaps (not a hypot scalar) are what the 1.4.13 Hoverable dead-zone test needs.
        overlap = {
          overlapAreaPx: Math.round(area),
          overlapFractionOfTarget: b.width * b.height ? +(area / (b.width * b.height)).toFixed(3) : 0,
          overlapFractionOfOther: ob.width * ob.height ? +(area / (ob.width * ob.height)).toFixed(3) : 0,
          gapX: Math.round(gapX), gapY: Math.round(gapY),
          overlapsOrAdjacent: area > 0 || (gapX === 0 && gapY === 0),
          otherBox: { x: Math.round(ob.x), y: Math.round(ob.y), w: Math.round(ob.width), h: Math.round(ob.height) },
        };
      }
      else overlap = { available: false, reason: 'otherXpath not found' };
    }
    const ambiguous = b.width < 6 || b.height < 6;
    return { found: true, box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowsHorizontally: overflowsH, overflowPx: Math.max(0, el.scrollWidth - el.clientWidth), overflowCulprit: culprit, overlap, occludedElements, viewportWidthUsed: window.innerWidth, ambiguous, ambiguityReason: ambiguous ? 'degenerate box (<6px)' : undefined };
  }, targetXpath, otherXpath || null).catch(() => null);
    if (!r) return { error: 'measurement failed' };
    if (!r.found) return { error: 'target not found' };
    return { ...r, targetXpath, stateUsed: useClone ? `viewport-${Math.round(viewportWidth)}px(clone)` : 'as-loaded(shared-page)' }; // echo the subject + the state the numbers were measured in
  } finally { if (useClone) { try { await live.close(); } catch (e) {} } }
}

// ============================================================================================
// request_hi_res_crop — re-raster ONE element at a higher DEVICE-scale (NOT page zoom — that reflows). Runs
// on a FRESH clone so the shared page's deviceScaleFactor isn't changed under concurrency. Always covers the
// full element bounds (the model can't crop away disconfirming detail). Returns the actual scale + CSS-pixel
// and device-pixel sizes so the model knows whether higher scale yields NEW detail (vector/font/SVG) or is
// merely upsampling an already-native raster (no new info). 1.1.1 (read a small wordmark) / 1.4.5 (chart text).
async function requestHiResCrop(page, args, ctx) {
  const { targetXpath, scale } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  const s = Math.max(1, Math.min(Number(scale) || 3, 4));
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
  try {
    const vp = live.viewport() || { width: 1280, height: 900 };
    await live.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: s }).catch(() => {});
    const meta = await live.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {} const r = el.getBoundingClientRect(); return { box: { x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height }, cssW: Math.round(r.width), cssH: Math.round(r.height) }; }, targetXpath).catch(() => null);
    if (!meta || !(meta.box.w > 0 && meta.box.h > 0)) return { error: 'target not found or zero-size' };
    const clip = { x: Math.round(meta.box.x), y: Math.round(meta.box.y), width: Math.round(meta.box.w), height: Math.round(meta.box.h) };
    const screenshot = await require('./settle.js').robustScreenshot(live, { encoding: 'base64', clip });
    if (!screenshot) return { error: 'capture failed' };
    return { screenshot, scaleUsed: s, cssPixelSize: { w: meta.cssW, h: meta.cssH }, devicePixelSize: { w: Math.round(meta.cssW * s), h: Math.round(meta.cssH * s) }, note: 'higher device-scale re-raster of the SAME layout (not page zoom); if still illegible, return PARTIAL — do not invent text' };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// render_with_overrides — MUTATING (fresh clone): re-render under ONE fixed transform from a closed enum
// (grayscale / a named CVD / forced-colors / author-CSS-off) and return the transformed screenshot. The
// model picks only WHICH transform; parameters are not tunable. For 1.4.1 (which colour cue is load-bearing,
// after grayscale/CVD) and forced-colors survival. Returns PIXELS — never a numeric ratio from a transformed
// image (the rubrics forbid that). Runs on a clone so the shared page's emulation isn't changed.
async function renderWithOverrides(page, args, ctx) {
  const { transform, targetXpath } = args || {};
  const VISION = { grayscale: 'achromatopsia', protanopia: 'protanopia', deuteranopia: 'deuteranopia', tritanopia: 'tritanopia' };
  const allowed = [...Object.keys(VISION), 'forced-colors', 'no-author-css'];
  if (!allowed.includes(transform)) return { error: `transform must be one of: ${allowed.join(', ')}` };
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
  try {
    const cdp = await live.createCDPSession();
    if (VISION[transform]) await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: VISION[transform] }).catch(() => {});
    else if (transform === 'forced-colors') await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] }).catch(() => {});
    else if (transform === 'no-author-css') await live.evaluate(() => { for (const s of [...document.querySelectorAll('style,link[rel=stylesheet]')]) { try { s.disabled = true; } catch (e) {} } }).catch(() => {});
    await require('./settle.js').awaitSettle(live, { force: true, floorMs: 160 }); // settle the media/CSS re-render reflow (floor preserves old 160ms)
    let clip;
    if (typeof targetXpath === 'string' && targetXpath) {
      const meta = await live.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {} const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height }; }, targetXpath).catch(() => null);
      // a targetXpath was given but didn't resolve ⇒ ERROR (never silently fall back to a full-viewport shot,
      // which the model would mistake for the requested element). Full-viewport is reserved for the no-target case.
      if (!meta || !(meta.w > 0 && meta.h > 0)) return { error: 'target not found or zero-size', transform };
      clip = { x: Math.round(meta.x), y: Math.round(meta.y), width: Math.round(meta.w), height: Math.round(meta.h) };
    }
    const screenshot = await require('./settle.js').robustScreenshot(live, { encoding: 'base64', ...(clip ? { clip } : {}) });
    if (!screenshot) return { error: 'capture failed', transform };
    return { transform, screenshot, note: 'rendered under one fixed transform; judge from these pixels — do NOT assert a numeric ratio from a grayscale/CVD image' };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// compute_contrast_ratio — READ-ONLY: the WCAG contrast ratio for TWO LLM-chosen FLAT used-colours (the G183
// link-vs-surrounding-text pair for 1.4.1, or an indicator-vs-adjacent-fill pair). Uses CSSOM used-colour.
// REFUSES (inconclusive) a translucent/unparseable colour — it does NOT sweep a photo/gradient (that is the
// deterministic runner's abandoned case, routed to the perceptual rubric). `passes` is a mechanical threshold
// compare, never an SC disposition.
async function computeContrastRatio(page, args) {
  const A = require('../../lib/a11y-eval.js');
  const { nodeAXpath, nodeBXpath, threshold } = args || {};
  if (typeof nodeAXpath !== 'string' || typeof nodeBXpath !== 'string') return { error: 'nodeAXpath and nodeBXpath required (the two flat colour sources to compare)' };
  const cols = await page.evaluate((xa, xb) => {
    // Normalise ANY CSS colour (incl. wide-gamut oklch()/color(srgb ...)) to sRGB rgba by painting it to a 1×1
    // canvas and reading the pixel back — so parseRGB never chokes on a syntax it doesn't recognise. Alpha is
    // preserved (the translucency refusal still fires on a<1).
    const toRgba = (c) => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d'); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(3)})`; } catch (e) { return c; } };
    const used = (xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; return el ? toRgba(getComputedStyle(el).color) : null; };
    // nodeB reader: for 1.4.3 text-vs-BACKGROUND, point nodeB at the element bearing the bg — if its OWN
    // background-color is opaque, use THAT (not its inherited text colour). A transparent own-bg means nodeB is a
    // foreground/text node (1.4.1 G183 link-vs-surrounding-text), so fall back to `color`. (Own bg, not a walked-up
    // effective bg, so 1.4.1's transparent surrounding-text node keeps using its colour, not the page background.)
    const usedB = (xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return null;
      const bg = getComputedStyle(el).backgroundColor;
      const opaque = bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(bg);
      return toRgba(opaque ? bg : getComputedStyle(el).color);
    };
    // nodeA's RENDERED font for the WCAG large-text threshold. getComputedStyle().fontSize is ALWAYS the resolved
    // USED value in px — the browser has already collapsed em/rem/pt/%/keyword to px — so no manual unit maths is
    // needed (and is wrong: `1.5em` only means px AFTER inheritance is resolved). fontWeight is likewise resolved
    // to a numeric string ('700' for bold), which contrastThresholdFor parseInts.
    const fontOf = (xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el || el.nodeType !== 1) return null;
      const cs = getComputedStyle(el);
      return { fontPx: parseFloat(cs.fontSize), fontWeight: cs.fontWeight };
    };
    // text-shadow halo (Q1): a white-on-black glow gives glyphs an effective BACKING of the shadow colour, raising
    // legibility above the flat text-vs-bg ratio — which the flat formula is blind to. Parse each shadow to its
    // normalised rgba + offsets + blur (computed `textShadow` serialises as "<color> <ox> <oy> <blur>", comma-sep).
    const shadowsOf = (xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el || el.nodeType !== 1) return [];
      const ts = getComputedStyle(el).textShadow;
      if (!ts || ts === 'none') return [];
      return ts.split(/,(?![^(]*\))/).map((p) => p.trim()).filter(Boolean).map((p) => {
        const cm = p.match(/rgba?\([^)]*\)|#[0-9a-fA-F]+/);
        const nums = (p.match(/-?[\d.]+px/g) || []).map((v) => parseFloat(v));
        return { color: cm ? toRgba(cm[0]) : null, ox: nums[0] || 0, oy: nums[1] || 0, blur: nums[2] || 0 };
      }).filter((s) => s.color);
    };
    return { a: used(xa), b: usedB(xb), fontA: fontOf(xa), shadowsA: shadowsOf(xa) };
  }, nodeAXpath, nodeBXpath).catch(() => null);
  if (!cols || !cols.a || !cols.b) return { error: 'one or both nodes not found' };
  const pa = A.parseRGB(cols.a), pb = A.parseRGB(cols.b);
  if (!pa || !pb) return { inconclusive: 'unparseable-color', colorA: cols.a, colorB: cols.b };
  if ((pa.a != null && pa.a < 1) || (pb.a != null && pb.a < 1)) return { inconclusive: 'alpha-unresolved', note: 'a translucent colour cannot be reduced to a sound ratio — defer to the perceptual rubric' };
  const rawRatio = A.contrastRatioRaw([pa.r, pa.g, pa.b], [pb.r, pb.g, pb.b]);
  // AUTHORITATIVE text threshold from nodeA's rendered font — so the model NEVER has to (mis)guess 3.0 vs 4.5
  // for large text. WCAG large text = >=18pt(24px) or >=14pt(18.67px) bold; contrastThresholdFor encodes it.
  const fontPx = cols.fontA && Number.isFinite(cols.fontA.fontPx) ? cols.fontA.fontPx : null;
  const textThreshold = fontPx != null ? A.contrastThresholdFor(fontPx, cols.fontA.fontWeight) : null;
  const isLargeText = fontPx != null ? A.isLargeText(fontPx, cols.fontA.fontWeight) : null;
  const th = Number.isFinite(threshold) ? threshold : (textThreshold != null ? textThreshold : 3);
  // TEXT-SHADOW halo (Q1 consistency): a CONTRAST-ENHANCING halo gives the glyph an effective backing of the shadow
  // colour, so legibility is bounded by text-vs-shadow, not the flat text-vs-bg. Credit a shadow ONLY when it is a
  // genuine centred halo (real blur, offset within the blur — not a one-sided drop), OPAQUE (alpha >= 0.5), AND
  // actually helps (shadow contrasts with the text MORE than the bg does). These guards stop a token/faint/drop
  // shadow from clearing real low contrast. It is an APPROXIMATION (a thin halo may not fully back the glyph) — the
  // flat `contrastRatio` is still surfaced as the worst-case, and the perceptual rubric/crop is the final arbiter.
  let shadowAdjacentRatio = null; let shadowColor = null;
  for (const sh of (cols.shadowsA || [])) {
    const ps = A.parseRGB(sh.color);
    if (!ps || (ps.a != null && ps.a < 0.5)) continue;                                  // opaque-ish only
    if (!(sh.blur >= 1 && Math.abs(sh.ox) <= sh.blur && Math.abs(sh.oy) <= sh.blur)) continue; // centred halo, real extent
    const sr = A.contrastRatioRaw([pa.r, pa.g, pa.b], [ps.r, ps.g, ps.b]);
    if (sr > rawRatio && (shadowAdjacentRatio == null || sr > shadowAdjacentRatio)) { shadowAdjacentRatio = sr; shadowColor = sh.color; }
  }
  const shadowIsContrastEnhancing = shadowAdjacentRatio != null;
  const effectiveTextRatio = shadowIsContrastEnhancing ? shadowAdjacentRatio : rawRatio;
  // `passes`/`passesAsText` compare the UNROUNDED ratio (WCAG "do not round up": 2.998 must NOT pass 3:1).
  return {
    colorA: cols.a, colorB: cols.b, source: 'cssom', contrastRatio: +rawRatio.toFixed(2),
    fontPx, isLargeText, textThreshold,
    ...(shadowIsContrastEnhancing ? { shadowColor, shadowAdjacentRatio: +shadowAdjacentRatio.toFixed(2), effectiveTextRatio: +effectiveTextRatio.toFixed(2) } : {}),
    passesAsText: textThreshold != null ? effectiveTextRatio >= textThreshold : null, // USE THIS for 1.4.3 text contrast (credits a halo text-shadow)
    threshold: th, passes: rawRatio >= th,
    note: 'WCAG ratio of two FLAT used-colours' + (shadowIsContrastEnhancing ? ', RAISED by a contrast-enhancing text-shadow halo (passesAsText/effectiveTextRatio use text-vs-shadow ' + (+shadowAdjacentRatio.toFixed(2)) + '; flat contrastRatio is the no-shadow worst case — confirm legibility from the crop)' : '') + '. For 1.4.3 TEXT contrast use passesAsText (textThreshold font-derived: ' + (isLargeText ? '3.0 large-text' : '4.5 normal') + '); `passes` honours an explicit threshold override. Not an SC disposition.',
  };
}

// ============================================================================================
// resolve_part_color — READ-ONLY: for a NON-TEXT part the model points at (a screenshot pixel), return the
// CSS used-colours of the element there (color/background/border/outline/SVG fill+stroke) AND the RENDERED
// pixel at the same point AND a divergence flag. MANDATORY both-values rule (exp-runners V3R4-H1): the
// CSS-resolved colour can false-clear (white text over a white SVG resolves the black body → fake 21:1); a
// divergence over tolerance must surface as INCONCLUSIVE, never silently resolve to the computed value.
// 1.4.11 (the harness has NO deterministic 1.4.11 runner) / 1.4.1. Raw RGBA + flags, never a ratio/verdict.
async function resolvePartColor(page, args) {
  const A = require('../../lib/a11y-eval.js');
  const { x, y } = args || {};
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: 'x,y (screenshot coordinates) required' };
  const cssInfo = await page.evaluate((px, py) => {
    const el = document.elementFromPoint(px, py);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const pc = (sel) => { const p = getComputedStyle(el, sel); return (p && p.content && p.content !== 'none' && p.content !== 'normal') ? { color: p.color, backgroundColor: p.backgroundColor } : null; };
    return {
      part: el.tagName.toLowerCase(),
      color: cs.color, backgroundColor: cs.backgroundColor, borderTopColor: cs.borderTopColor, outlineColor: cs.outlineColor, fill: cs.fill, stroke: cs.stroke,
      // reliability flags: a gradient / filter / opacity<1 means NO single flat used-colour is sound — the
      // rendered pixel is the only truth. Pseudo-element (::before/::after) colours often ARE the visible indicator.
      hasGradient: /gradient/i.test(cs.backgroundImage || ''),
      hasBackgroundImage: !!(cs.backgroundImage && cs.backgroundImage !== 'none'),
      hasFilter: !!((cs.filter && cs.filter !== 'none') || (cs.backdropFilter && cs.backdropFilter !== 'none')),
      opacity: parseFloat(cs.opacity),
      pseudo: { before: pc('::before'), after: pc('::after') },
    };
  }, x, y).catch(() => null);
  if (!cssInfo) return { error: 'no element at the given point' };
  // rendered pixel: screenshot a 5x5 clip at the point, decode the centre via an in-page canvas (the data
  // URI is same-origin, so getImageData is allowed) — no PNG-decoder dependency needed.
  const clip = { x: Math.max(0, Math.round(x) - 2), y: Math.max(0, Math.round(y) - 2), width: 5, height: 5 };
  const shot = await require('./settle.js').robustScreenshot(page, { encoding: 'base64', clip });
  let renderedPixelRGBA = null;
  if (shot) {
    renderedPixelRGBA = await page.evaluate(async (b64) => {
      try {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] };
      } catch (e) { return null; }
    }, shot).catch(() => null);
  }
  // Divergence: for a NON-TEXT part the relevant colour is the part's painting property (border/outline/fill/
  // stroke/background) — NOT cs.color (foreground). Find which CSS used-colour the rendered pixel BEST matches
  // and report that as sourceProperty; divergent ⇒ NO used-colour explains the pixel (the CSS is misleading ⇒
  // INCONCLUSIVE). This catches both the border/fill false-flag (old code diffed a purple border vs white text)
  // and the false-clear (a property that diverges from its render) directions.
  let divergence = null;
  if (renderedPixelRGBA) {
    const candidates = [['color', cssInfo.color], ['backgroundColor', cssInfo.backgroundColor], ['borderTopColor', cssInfo.borderTopColor], ['outlineColor', cssInfo.outlineColor], ['fill', cssInfo.fill], ['stroke', cssInfo.stroke]];
    let best = null;
    for (const [prop, val] of candidates) {
      const c = A.parseRGB(val);
      if (!c || c.a === 0) continue; // skip transparent / unparseable (a transparent property paints nothing here)
      const dist = Math.hypot(c.r - renderedPixelRGBA.r, c.g - renderedPixelRGBA.g, c.b - renderedPixelRGBA.b);
      if (!best || dist < best.dist) best = { prop, dist };
    }
    if (best) divergence = { sourceProperty: best.prop, distFromSourceColor: +best.dist.toFixed(1), divergent: best.dist > 40 };
  }
  // A translucent matched part-colour can't be reduced to a sound flat value; a gradient/filter/opacity<1 means
  // no single used-colour is reliable. Either ⇒ usedColourReliable:false ⇒ the model should trust ONLY the
  // rendered pixel and treat the CSS used-colour as INCONCLUSIVE.
  // ANY translucent painting property makes the flat-colour resolution unreliable — a translucent border/fill
  // composites with the backdrop, so the rendered pixel often best-matches a DIFFERENT (opaque) property than
  // the translucent one. So flag translucency across ALL painting props (0<a<1), not just the matched one.
  const PAINT_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'outlineColor', 'fill', 'stroke'];
  const translucentPart = PAINT_PROPS.some((k) => { const c = A.parseRGB(cssInfo[k]); return !!(c && c.a != null && c.a > 0 && c.a < 1); });
  const usedColourReliable = !(cssInfo.hasGradient || cssInfo.hasFilter || (Number.isFinite(cssInfo.opacity) && cssInfo.opacity < 1) || translucentPart);
  return { ...cssInfo, renderedPixelRGBA, cssVsRenderedDivergence: divergence, translucentPart, usedColourReliable, note: 'BOTH the CSS used-colours AND the rendered pixel are returned. sourceProperty is the used-colour the pixel best matches. If divergent, NO used-colour explains the pixel (CSS misleads). If usedColourReliable is false (gradient/filter/opacity<1/translucent) OR translucentPart, trust ONLY the rendered pixel and treat the CSS colour as INCONCLUSIVE. pseudo.before/after carry ::before/::after colours when those pseudo-elements paint the indicator.' };
}

// ============================================================================================
// resolve_destination — fetches a SAME-ORIGIN link's settled destination in an isolated, read-only incognito
// GET, returning a RAW fingerprint (finalUrl/httpStatus/title/h1/mainFirstParagraph). NO "equivalent"/"same"
// verdict — that IS the 2.4.4 judgment the model is graded on, so computing it here would launder the
// conclusion. SAME-ORIGIN ONLY (http(s) same origin, or file:// same directory for the local mirror):
// following arbitrary external hrefs is SSRF/exfil surface and breaks the saved-dataset determinism. GET only,
// depth 0, never the audited session/cookies.
// Process-level memo of resolved fingerprints, keyed by the FETCHED href. resolve_destination's one nondeterministic
// act is the live incognito GET (redirect/timing/server state); the same href resolved twice — within a judge, or by
// two judges in one process — must return the SAME fingerprint or it injects FP variance (R2.2b mechanism #1). Cache
// only SUCCESSFUL fingerprints (a transient network error stays retryable). Cross-PROCESS determinism still requires
// freezing the result in the evidence pack — this is the in-process building block. Bounded by # distinct corpus links.
const _DEST_CACHE = new Map();
async function resolveDestination(page, args) {
  const { linkXpath, linkXpaths } = args || {};
  const xpaths = (Array.isArray(linkXpaths) && linkXpaths.length) ? linkXpaths : (typeof linkXpath === 'string' && linkXpath ? [linkXpath] : []);
  if (!xpaths.length) return { error: 'linkXpath (string) or linkXpaths (array) required' };
  const dir = (u) => u.pathname.slice(0, u.pathname.lastIndexOf('/') + 1);
  // file:// "same origin" for the OFFLINE local mirror: a BOUNDED common-ancestor sandbox, NOT same-directory.
  // Corpus links cross sibling dirs (e.g. ../_assets/…), so same-directory wrongly refused them as "cross-origin"
  // (the 2.4.4 resolver FN + the set-equality FP). Allow a file:// target under the base file's ancestor walked up
  // ROOT_DEPTH levels — which STILL refuses arbitrary local files (…/etc/passwd) outside the corpus tree. SSRF
  // stays closed; the offline corpus opens. (http(s) is unchanged: strict same-origin.)
  const ROOT_DEPTH = 3;
  const ancestorDir = (pathname, up) => { let d = pathname.slice(0, pathname.lastIndexOf('/') + 1); for (let i = 0; i < up; i++) { const t = d.replace(/\/+$/, ''); const cut = t.lastIndexOf('/'); d = cut > 0 ? t.slice(0, cut + 1) : '/'; } return d; };
  const sameLocalRoot = (t, b) => { const root = ancestorDir(b.pathname, ROOT_DEPTH); return root.length > 1 && t.pathname.startsWith(root); };
  const browser = page.browser();
  // resolve ONE link xpath → a raw fingerprint (+ redirect timing), or {refused}/{error}. SSRF pre-flight +
  // settled-origin re-check unchanged. ACT fd3a94: only redirects that happen INSTANTLY (a 3xx, or meta-refresh
  // delay 0) count toward the link-purpose set; a delayed meta-refresh fingerprints the INTERSTITIAL page.
  const resolveOne = async (xp) => {
    const info = await page.evaluate((x) => {
      const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
      if (!el) return { found: false };
      const a = (el.closest && el.closest('a[href]')) || el;
      let href = a.href || null;
      // #11: a JS-navigation link (span/div role=link with no href) carries its destination in an onclick string
      // literal (location='…' / location.href=… / window.open(…)). Extract it and RESOLVE against the page URL so a
      // relative/root path becomes absolute (query string preserved) — then it fingerprints like any anchor link.
      if (!href) {
        const oc = (el.getAttribute && el.getAttribute('onclick')) || (a.getAttribute && a.getAttribute('onclick')) || '';
        const m = oc.match(/(?:location\.href|location\.assign|location\.replace|location|window\.open)\s*(?:=|\()\s*['"]([^'"]+)['"]/i);
        if (m) { try { href = new URL(m[1], location.href).href; } catch (e) { /* unresolvable → falls through to the no-target error */ } }
      }
      return { found: true, href, pageUrl: location.href };
    }, xp).catch(() => null);
    if (!info || !info.found) return { linkXpath: xp, error: 'link not found' };
    if (!info.href) return { linkXpath: xp, error: 'no href or onclick-nav target on the link' };
    let target, base;
    try { target = new URL(info.href); base = new URL(info.pageUrl); } catch (e) { return { linkXpath: xp, refused: 'unparseable-url' }; }
    if (!/^https?:$/.test(target.protocol) && target.protocol !== 'file:') return { linkXpath: xp, refused: 'non-http-or-file' };
    const sameOrigin = target.protocol === 'file:' ? (base.protocol === 'file:' && sameLocalRoot(target, base)) : (target.origin === base.origin);
    if (!sameOrigin) return { linkXpath: xp, refused: 'cross-origin', destinationOrigin: target.origin };
    if (_DEST_CACHE.has(target.href)) return { linkXpath: xp, ..._DEST_CACHE.get(target.href), cached: true }; // deterministic re-resolve (no second fetch)
    let bctx = null, p = null;
    try {
      bctx = browser.createBrowserContext ? await browser.createBrowserContext() : await browser.createIncognitoBrowserContext();
      p = await bctx.newPage();
      await p.setRequestInterception(true).catch(() => {});
      p.on('request', (req) => {
        let ok = false;
        try { const u = new URL(req.url()); if (u.protocol === 'data:' || u.protocol === 'about:' || u.protocol === 'blob:') ok = true; else if (target.protocol === 'file:') ok = (u.protocol === 'file:' && sameLocalRoot(u, base)); else ok = (u.origin === target.origin); } catch (e) { ok = false; }
        if (ok) req.continue().catch(() => {}); else req.abort().catch(() => {});
      });
      const resp = await p.goto(target.href, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
      let finalU = null; try { finalU = new URL(p.url()); } catch (e) {}
      const finalSameOrigin = finalU && (target.protocol === 'file:' ? (finalU.protocol === 'file:' && sameLocalRoot(finalU, base)) : (finalU.origin === base.origin));
      if (!finalSameOrigin) return { linkXpath: xp, refused: 'cross-origin-redirect', finalOrigin: finalU ? finalU.origin : null };
      const httpChain = (() => { try { return resp ? resp.request().redirectChain().length : 0; } catch (e) { return 0; } })();
      const meta = await p.evaluate(() => { const m = document.querySelector('meta[http-equiv="refresh" i]'); if (!m) return null; const c = (m.getAttribute('content') || '').trim(); const mm = c.match(/^(\d+(?:\.\d+)?)\s*(?:;|$)/); return mm ? { delay: parseFloat(mm[1]) } : null; }).catch(() => null);
      let instantRedirect = httpChain > 0, redirectDelayMs = httpChain > 0 ? 0 : null, interstitial = false;
      if (meta) { redirectDelayMs = Math.round(meta.delay * 1000); instantRedirect = httpChain > 0 || meta.delay === 0; interstitial = meta.delay > 0; }
      const fp = await p.evaluate(() => {
        // Read VISIBLE content, not DOM-order-first. Client-side JS can show one of several same-SOURCE sections
        // per ?query (e.g. contact-us.html?page=1 → "Chat", ?page=2 → "Call"); querySelector('h1') returns the
        // first heading in SOURCE regardless of display, so two query branches look identical. Visible-first h1 +
        // innerText (which omits display:none) capture the branch → two same-named links to different query pages
        // fingerprint DIFFERENTLY (the real 2.4.4 distinction the static byte-href could not show).
        const vis = (el) => { if (!el) return false; const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const m = document.querySelector('main') || document.body;
        const h1 = [...document.querySelectorAll('h1')].find(vis) || document.querySelector('h1');
        const para = [...((m || document).querySelectorAll('p'))].find(vis) || (m && m.querySelector('p'));
        const vt = ((document.body && document.body.innerText) || '').replace(/\s+/g, ' ').trim().slice(0, 240);
        return { title: document.title, h1: h1 ? h1.textContent : null, mainFirstParagraph: para ? (para.textContent || '').trim().slice(0, 160) : null, visibleText: vt };
      }).catch(() => ({}));
      const fingerprint = { finalUrl: p.url().slice(0, 300), httpStatus: resp ? resp.status() : null, title: (fp.title || '').slice(0, 200), h1: fp.h1 ? String(fp.h1).trim().slice(0, 160) : null, mainFirstParagraph: fp.mainFirstParagraph || null, visibleText: fp.visibleText || null, instantRedirect, redirectDelayMs, ...(interstitial ? { interstitialPage: true } : {}) };
      _DEST_CACHE.set(target.href, fingerprint); // memo the SUCCESSFUL fingerprint for a deterministic re-resolve
      return { linkXpath: xp, ...fingerprint };
    } catch (e) { return { linkXpath: xp, error: String(e && e.message || e).slice(0, 200) }; }
    finally { try { if (p) await p.close(); } catch (e) {} try { if (bctx && bctx.close) await bctx.close(); } catch (e) {} }
  };
  if (xpaths.length === 1) {
    const { linkXpath: _lx, ...rest } = await resolveOne(xpaths[0]);
    return { ...rest, note: 'raw destination fingerprint (same-origin only); instantRedirect=true only for a 3xx or meta-refresh delay 0 (ACT fd3a94 — only instant redirects count); a delayed redirect sets interstitialPage (the fingerprint is the PRE-redirect page). The model judges "same purpose?" — never equivalent/same/different.' };
  }
  // sibling-set (fd3a94 is a SET test): resolve each + a per-field string-EQUALITY grid (no same/different verdict).
  const fingerprints = [];
  for (const xp of xpaths.slice(0, 8)) fingerprints.push(await resolveOne(xp));
  const ok = fingerprints.filter((f) => f && !f.error && !f.refused);
  // null (NOT false) when fewer than 2 links resolved — "could not compare". The model must NOT read an unresolved
  // set as "destinations differ" (that defaulted finalUrlEqual:false and produced a 2.4.4 false positive).
  const eqOf = (field) => ok.length >= 2 ? ok.every((f) => f[field] === ok[0][field]) : null;
  return { fingerprints, resolvedCount: ok.length, equality: { finalUrlEqual: eqOf('finalUrl'), titleEqual: eqOf('title'), h1Equal: eqOf('h1'), mainFirstParagraphEqual: eqOf('mainFirstParagraph'), visibleTextEqual: eqOf('visibleText') }, note: 'each link resolved to a raw fingerprint (+ redirect timing) + a per-field byte-EQUALITY grid across the resolved set. Equality is string-equality only (the model judges "same purpose?"); an equality field is null when fewer than 2 links resolved (could not compare — NOT "different"). visibleText/h1 are read from the RENDERED page (post client-side JS), so two same-named links to different query branches differ here even when the static URL/title match.' };
}

// compare_iframe_content — READ-ONLY: for 4.1.2 (ACT 4b1c6c) — same-named iframes must serve an EQUIVALENT
// purpose. Reads each SAME-ORIGIN iframe's RENDERED contentDocument (title/h1/firstParagraph/visibleText)
// directly from the live page — what the iframe ACTUALLY shows (post client-side JS), not the raw src string —
// and returns a per-iframe fingerprint + a per-field string-EQUALITY grid across the set. NO equivalent/same/
// different verdict (that IS the 4.1.2 judgment the model is graded on). A cross-origin iframe blocks
// contentDocument: it is reported {crossOrigin:true, src} (judge from src + crops, or PARTIAL). Touches no state.
async function compareIframeContent(page, args) {
  const { iframeXpath, iframeXpaths } = args || {};
  const xpaths = (Array.isArray(iframeXpaths) && iframeXpaths.length) ? iframeXpaths : (typeof iframeXpath === 'string' && iframeXpath ? [iframeXpath] : []);
  if (!xpaths.length) return { error: 'iframeXpath (string) or iframeXpaths (array) required' };
  const frames = await page.evaluate((xps) => {
    const vis = (doc, e) => { if (!e) return false; try { const s = doc.defaultView.getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (x) { return true; } };
    return xps.slice(0, 8).map((xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el || (el.tagName !== 'IFRAME' && el.tagName !== 'FRAME')) return { iframeXpath: xp, found: false };
      const src = el.getAttribute('src') || '';
      let doc = null; try { doc = el.contentDocument; } catch (e) { doc = null; } // cross-origin throws/returns null
      if (!doc) return { iframeXpath: xp, found: true, src, crossOrigin: true };
      const h1 = [...doc.querySelectorAll('h1')].find((e) => vis(doc, e)) || doc.querySelector('h1');
      const para = [...doc.querySelectorAll('p')].find((e) => vis(doc, e)) || doc.querySelector('p');
      const text = ((doc.body && doc.body.innerText) || '').replace(/\s+/g, ' ').trim();
      return { iframeXpath: xp, found: true, src, crossOrigin: false, title: (doc.title || '').slice(0, 200), h1: h1 ? (h1.textContent || '').trim().slice(0, 160) : null, firstParagraph: para ? (para.textContent || '').trim().slice(0, 160) : null, textLen: text.length, visibleText: text.slice(0, 240) };
    });
  }, xpaths).catch(() => null);
  if (!frames) return { error: 'could not read iframes' };
  const ok = frames.filter((f) => f && f.found && f.crossOrigin === false);
  // null (NOT false) when fewer than 2 iframes were readable — "could not compare", never read as "different".
  const eqOf = (field) => ok.length >= 2 ? ok.every((f) => f[field] === ok[0][field]) : null;
  return { iframes: frames, comparedCount: ok.length, equality: { titleEqual: eqOf('title'), h1Equal: eqOf('h1'), firstParagraphEqual: eqOf('firstParagraph'), visibleTextEqual: eqOf('visibleText') }, note: 'each same-named iframe\'s RENDERED content read from its same-origin contentDocument + a per-field string-EQUALITY grid. Equality is string-equality only (you judge "equivalent purpose?"); a field is null when fewer than 2 iframes were readable (could NOT compare — NOT "different"). A crossOrigin iframe could not be read — judge it from src + crops or return PARTIAL.' };
}

// ============================================================================================
// compare_named_regions — READ-ONLY: the only surviving limb of the proposed "eyedropper". For an image/chart
// whose sub-regions only the MODEL can name, return per-region dominant colour + a DERIVED perceptual deltaE
// + perceptiblyDistinct between the named regions (1.1.1 F13 — a colour-encoded distinction the alt omits).
// The model names regions as fractional rects; the harness resolves + measures. NOT a raw-pixel stream and
// NOT a text-contrast source — returns the derived measure only, never a verdict.
function rgbToLab(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = f(r), G = f(g), B = f(b);
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const k = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = k(X), fy = k(Y), fz = k(Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), bb: 200 * (fy - fz) };
}
// CIEDE2000 (ΔE2000) — the perceptual colour-difference formula F13 mandates; CIE76 (plain Lab Euclidean)
// over-states differences in the blue/purple region and disagrees with ΔE2000 across the distinctness bound.
function deltaE2000(c1, c2) {
  const l1 = rgbToLab(c1.r, c1.g, c1.b), l2 = rgbToLab(c2.r, c2.g, c2.b);
  const d2r = (d) => d * Math.PI / 180, r2d = (r) => r * 180 / Math.PI;
  const L1 = l1.L, A1 = l1.a, B1 = l1.bb, L2 = l2.L, A2 = l2.a, B2 = l2.bb;
  const C1 = Math.hypot(A1, B1), C2 = Math.hypot(A2, B2), Cbar = (C1 + C2) / 2;
  const C7 = Math.pow(Cbar, 7), G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Math.pow(25, 7))));
  const a1p = (1 + G) * A1, a2p = (1 + G) * A2;
  const C1p = Math.hypot(a1p, B1), C2p = Math.hypot(a2p, B2);
  const hp = (b, ap) => { if (b === 0 && ap === 0) return 0; const h = r2d(Math.atan2(b, ap)); return h >= 0 ? h : h + 360; };
  const h1p = hp(B1, a1p), h2p = hp(B2, a2p);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(d2r(dhp) / 2);
  const Lbarp = (L1 + L2) / 2, Cbarp = (C1p + C2p) / 2;
  let hbarp;
  if (C1p * C2p === 0) hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
  else hbarp = (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2;
  const T = 1 - 0.17 * Math.cos(d2r(hbarp - 30)) + 0.24 * Math.cos(d2r(2 * hbarp)) + 0.32 * Math.cos(d2r(3 * hbarp + 6)) - 0.20 * Math.cos(d2r(4 * hbarp - 63));
  const dtheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7), Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const Sc = 1 + 0.045 * Cbarp, Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(d2r(2 * dtheta)) * Rc;
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh));
}

async function compareNamedRegions(page, args) {
  const { targetXpath, regions } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  if (!Array.isArray(regions) || regions.length < 2) return { error: 'at least 2 named regions required (each {name,x,y,w,h} as fractions 0-1 of the element)' };
  // DOCUMENT-RELATIVE clip (no scrollIntoView) — never mutate the SHARED page's scroll (a concurrent peer
  // reader could be screenshotting/coordinate-resolving it). captureBeyondViewport reaches a below-fold element.
  const box = await page.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x + window.scrollX), y: Math.max(0, r.y + window.scrollY), w: r.width, h: r.height }; }, targetXpath).catch(() => null);
  if (!box || !(box.w > 0 && box.h > 0)) return { error: 'target not found or zero-size' };
  const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.w), height: Math.round(box.h) };
  const shot = await require('./settle.js').robustScreenshot(page, { encoding: 'base64', clip, captureBeyondViewport: true });
  if (!shot) return { error: 'capture failed' };
  const colors = await page.evaluate(async (b64, regs) => {
    try {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return regs.map((reg) => {
        const rx = Math.max(0, Math.floor((reg.x || 0) * img.width)), ry = Math.max(0, Math.floor((reg.y || 0) * img.height));
        const rw = Math.min(img.width - rx, Math.max(1, Math.floor((reg.w || 0.2) * img.width))), rh = Math.min(img.height - ry, Math.max(1, Math.floor((reg.h || 0.2) * img.height)));
        if (rw <= 0 || rh <= 0) return { name: reg.name, error: 'region out of bounds' };
        const d = ctx.getImageData(rx, ry, rw, rh).data; let R = 0, G = 0, B = 0, R2 = 0, G2 = 0, B2 = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; R2 += d[i] * d[i]; G2 += d[i + 1] * d[i + 1]; B2 += d[i + 2] * d[i + 2]; n++; }
        const mr = R / n, mg = G / n, mb = B / n;
        const colorSpread = Math.sqrt(Math.max(0, R2 / n - mr * mr) + Math.max(0, G2 / n - mg * mg) + Math.max(0, B2 / n - mb * mb));
        // colorSpread = per-channel stddev magnitude: HIGH ⇒ the region is multi-coloured and the MEAN is not representative.
        return { name: reg.name, r: Math.round(mr), g: Math.round(mg), b: Math.round(mb), colorSpread: +colorSpread.toFixed(1) };
      });
    } catch (e) { return null; }
  }, shot, regions).catch(() => null);
  if (!colors) return { error: 'pixel sampling failed' };
  const pairs = [];
  for (let i = 0; i < colors.length; i++) for (let j = i + 1; j < colors.length; j++) {
    if (colors[i].error || colors[j].error) continue;
    const dE = deltaE2000(colors[i], colors[j]);
    const lumDelta = Math.abs(rgbToLab(colors[i].r, colors[i].g, colors[i].b).L - rgbToLab(colors[j].r, colors[j].g, colors[j].b).L);
    pairs.push({ a: colors[i].name, b: colors[j].name, deltaE2000: +dE.toFixed(1), luminanceDelta: +lumDelta.toFixed(1), perceptiblyDistinct: dE > 11 });
  }
  return { regionColors: colors, pairs, note: 'per-region MEAN colour (+ colorSpread; high spread ⇒ mean is unrepresentative) and the perceptual ΔE2000 + luminanceDelta between named regions (F13). perceptiblyDistinct = ΔE2000 > 11 (conservative "clearly distinct" bound). Derived measure only — never raw pixels, never a 1.4.3/1.4.11 contrast ratio, never a verdict.' };
}

// ============================================================================================
// ocr_image_text — READ-ONLY: OCR a crop of the live page via the PP-OCRv6 sidecar (ctx.ocr). Returns the
// RECOGNISED text + per-line boxes + confidences — an objective reading of the RENDERED pixels: images-of-text
// (1.4.5), a wordmark/label the vision pass can't resolve, or comparing rendered text to the alt/accessible
// name. NEVER a verdict (the model interprets); empty text on a low-res crop ≠ "no text" (use request_hi_res_crop
// first). Degrades to {error} when the sidecar isn't set up — the model treats that as INCONCLUSIVE, not a pass.
async function ocrImageText(page, args, ctx) {
  const { targetXpath, x, y, width, height } = args || {};
  if (!ctx || !ctx.ocr || (ctx.ocr.available && !ctx.ocr.available())) return { error: 'ocr-unavailable — PP-OCRv6 sidecar not configured (scripts/v3/ocr/.venv); treat as INCONCLUSIVE, not empty' };
  let clip = null, clampedToViewport = false;
  if (typeof targetXpath === 'string' && targetXpath) {
    // DOCUMENT-RELATIVE clip (no scrollIntoView) — never mutate the SHARED page's scroll under concurrency;
    // captureBeyondViewport reaches a below-fold element.
    const box = await page.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x + window.scrollX), y: Math.max(0, r.y + window.scrollY), w: r.width, h: r.height }; }, targetXpath).catch(() => null);
    if (!box || !(box.w > 0 && box.h > 0)) return { error: 'target not found or zero-size' };
    clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.w), height: Math.round(box.h) };
  } else if ([x, y, width, height].every((v) => Number.isFinite(v)) && width > 0 && height > 0) {
    // explicit rect: CLAMP to the page bounds so this steerable surface cannot request an arbitrary region.
    const vp = await page.evaluate(() => ({ w: Math.max(document.documentElement.scrollWidth, window.innerWidth), h: Math.max(document.documentElement.scrollHeight, window.innerHeight) })).catch(() => ({ w: 4096, h: 8192 }));
    const cx = Math.max(0, Math.round(x)), cy = Math.max(0, Math.round(y));
    const cw = Math.min(Math.round(width), vp.w - cx), ch = Math.min(Math.round(height), vp.h - cy);
    if (!(cw > 0 && ch > 0)) return { error: 'explicit rect is outside the page bounds' };
    clampedToViewport = (cx !== Math.round(x) || cy !== Math.round(y) || cw !== Math.round(width) || ch !== Math.round(height));
    clip = { x: cx, y: cy, width: cw, height: ch };
  } else {
    return { error: 'provide targetXpath OR an explicit x/y/width/height rect' };
  }
  const b64 = await require('./settle.js').robustScreenshot(page, { encoding: 'base64', clip, captureBeyondViewport: true });
  if (!b64) return { error: 'capture failed' };
  const r = await ctx.ocr.recognize(b64);
  if (r.error) return { error: r.error, note: 'OCR could not run — do NOT infer the crop is empty; treat as INCONCLUSIVE.' };
  const lines = r.lines || [];
  const scored = lines.map((l) => (typeof l.score === 'number' ? l.score : null)).filter((s) => s != null);
  const minLineScore = scored.length ? +Math.min(...scored).toFixed(3) : null;
  const lowConfidenceLineCount = lines.filter((l) => typeof l.score === 'number' && l.score < 0.6).length;
  return { text: r.text || '', lines, lineCount: lines.length, minLineScore, lowConfidenceLineCount, engine: (ctx.ocr && ctx.ocr.engine && ctx.ocr.engine()) || null, ...(clampedToViewport ? { clampedToViewport: true } : {}), note: 'recognised text + PER-LINE boxes/confidence (PP-OCRv6 is a 50-language unified model; confidence is per-LINE, not per-glyph). Empty text OR a low minLineScore/low-confidence lines ≠ "no text" — treat a low-confidence read as INCONCLUSIVE (try request_hi_res_crop). NEVER a verdict.' };
}

// ============================================================================================
// capture_full_page — the WHOLE scrollable document (below the fold included), the one gap the FN×LLM run
// surfaced: a viewport-only crop hides whether an OFF-VIEWPORT heading/element exists and WHERE it sits
// relative to content (does an h1 introduce the prose, or sit over the nav/TOC? — the 2.4.10 false-clears).
// Runs on a FRESH clone because a fullPage screenshot resizes/scrolls; the target box is reported in PAGE
// coordinates (origin = document top, measured at scrollY=0). Returns PIXELS + geometry, NEVER a verdict.
async function captureFullPage(page, args, ctx) {
  const { targetXpath } = args || {};
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this screenshot tool refuses to resize the shared page' };
  const live = await ctx.freshClone();
  try {
    const info = await live.evaluate((xp) => {
      try { window.scrollTo(0, 0); } catch (e) {}
      const doc = document.documentElement;
      const pageSize = { w: Math.max(doc.scrollWidth, window.innerWidth), h: Math.max(doc.scrollHeight, window.innerHeight) };
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      let target = null;
      if (xp) {
        const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (el && el.getBoundingClientRect) {
          const r = el.getBoundingClientRect(); // scrollY==0 ⇒ r.y IS the absolute document Y (raw — may be NEGATIVE
          // for an off-screen-above visually-hidden element; do NOT clamp, the sign is the signal)
          const offDocument = r.y < 0 || r.x < 0 || r.y > pageSize.h || r.x > pageSize.w;
          target = {
            box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
            tag: (el.tagName || '').toLowerCase(), role: el.getAttribute && el.getAttribute('role') || null,
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
            inViewport: r.y < window.innerHeight && (r.y + r.height) > 0 && r.x < window.innerWidth && (r.x + r.width) > 0,
            offDocument, // positioned OUTSIDE the document bounds (e.g. top:-9999px) ⇒ visually hidden, not in the captured pixels
            verticalPositionPct: pageSize.h ? Math.round(100 * (r.y / pageSize.h)) : null,
          };
        }
      }
      return { pageSize, viewport, target, hadTarget: !!xp };
    }, targetXpath || null).catch(() => null);
    if (!info) return { error: 'page introspection failed' };
    if (info.hadTarget && !info.target) return { error: 'target not found' };
    const screenshot = await require('./settle.js').robustScreenshot(live, { encoding: 'base64', fullPage: true });
    if (!screenshot) return { error: 'capture failed' };
    return { screenshot, fullPage: true, pageSize: info.pageSize, viewport: info.viewport, target: info.target,
      note: 'the WHOLE scrollable document (below the fold included). A target box is in PAGE coordinates (origin = document top); a NEGATIVE y or offDocument:true means the element is positioned OUTSIDE the document (e.g. top:-9999px → visually hidden) and is NOT in the captured pixels. Use to confirm an off-viewport element exists and judge WHERE it sits relative to surrounding content — never infer a barrier from position alone.' };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// press_keys_and_observe_focus — MUTATING (fresh clone): focus ONE element, dispatch ONE key combo, report
// whether focus MOVED. For 2.1.2 keyboard-trap escape: BEHAVIORALLY verify a documented non-standard exit
// ("Press Ctrl+M to Exit") actually frees focus, instead of trusting the page's JS source. A key that moves
// focus off a trapped control is a working escape; one that does nothing is a non-working / lying advisory.
// Real keypress + real document.activeElement before/after; objective observation, never a verdict.
// ============================================================================================
const _KEY_MOD = { ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', cmd: 'Meta', command: 'Meta', meta: 'Meta', win: 'Meta', super: 'Meta' };
function _normKey(k) {
  const m = { esc: 'Escape', escape: 'Escape', enter: 'Enter', return: 'Enter', tab: 'Tab', space: ' ', spacebar: ' ', del: 'Delete', delete: 'Delete', backspace: 'Backspace' };
  const low = String(k).toLowerCase();
  if (m[low]) return m[low];
  if (/^f([1-9]|1[0-2])$/i.test(k)) return k.toUpperCase();          // F1-F12
  if (k.length === 1) return /[A-Za-z]/.test(k) ? k.toLowerCase() : k; // single printable ⇒ keyname
  return k;                                                           // ArrowDown, PageUp, etc. pass through
}
async function pressKeysAndObserveFocus(page, args, ctx) {
  const { targetXpath, keys } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required (the element to focus before pressing)' };
  if (typeof keys !== 'string' || !keys.trim()) return { error: 'keys required, e.g. "Ctrl+M", "Escape", "Tab", "Alt+F6"' };
  if (!ctx || typeof ctx.freshClone !== 'function') return { error: 'fresh clone unavailable — this mutating tool refuses to touch the shared page' };
  const live = await ctx.freshClone();
  const _XP = (el) => { if (!el || el.nodeType !== 1) return null; const p = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; p.unshift(n.tagName.toLowerCase() + '[' + i + ']'); } return '/' + p.join('/'); };
  const before = await live.evaluate((xp, xpFn) => {
    const _xp = new Function('el', 'return (' + xpFn + ')(el)');
    const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
    if (!el) return { ok: false };
    try { el.focus(); } catch (e) {}
    const a = document.activeElement;
    return { ok: true, focusedTarget: a === el, active: _xp(a), tag: a ? a.tagName.toLowerCase() : null, id: a ? a.id || null : null };
  }, targetXpath, _XP.toString()).catch(() => ({ ok: false }));
  if (!before.ok) return { error: 'targetXpath did not resolve to an element' };
  if (!before.focusedTarget) return { refused: 'target-not-focusable', reason: 'the element could not take focus on a fresh load — a user could not be on it to press a key' };
  const parts = keys.split('+').map((s) => s.trim()).filter(Boolean);
  const mods = [], plain = [];
  for (const p of parts) { const mm = _KEY_MOD[p.toLowerCase()]; if (mm) { if (!mods.includes(mm)) mods.push(mm); } else plain.push(p); }
  const key = plain.length ? _normKey(plain[plain.length - 1]) : null;
  if (!key && !mods.length) return { error: `could not parse a key from "${keys}"` };
  try {
    for (const mm of mods) await live.keyboard.down(mm);
    if (key) await live.keyboard.press(key);
    for (const mm of [...mods].reverse()) await live.keyboard.up(mm);
  } catch (e) { return { error: 'keypress failed: ' + String((e && e.message) || e) }; }
  await new Promise((r) => setTimeout(r, 90)); // settle any async (setTimeout) refocus rebound
  const after = await live.evaluate((xpFn) => {
    const _xp = new Function('el', 'return (' + xpFn + ')(el)');
    const a = document.activeElement;
    return { active: _xp(a), tag: a ? a.tagName.toLowerCase() : null, id: a ? a.id || null : null, text: a ? (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : null };
  }, _XP.toString()).catch(() => ({ active: null }));
  return {
    keysPressed: keys,
    focusBefore: { xpath: before.active, tag: before.tag, id: before.id },
    focusAfter: { xpath: after.active, tag: after.tag, id: after.id, text: after.text },
    focusMoved: before.active !== after.active,
    note: 'focusMoved=true ⇒ the key changed which element holds focus (for a trapped control, evidence of a WORKING escape). focusMoved=false ⇒ the key did nothing (a non-working / lying advisory). Objective before/after focus, never a verdict.',
  };
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
  const ctx = { freshClone: session.freshClone, ocr: session.ocr };
  const wrap = (fn, args) => fn(page, args, ctx).then((r) => ({ content: [{ type: 'text', text: JSON.stringify(r) }] })).catch((e) => ({ content: [{ type: 'text', text: JSON.stringify({ error: String(e && e.message || e) }) }], isError: true }));
  const tools = [
    tool('query_ax_node', 'Read-only: resolve a node (by xpath OR by a screenshot pixel x/y) to its live accessibility facts — role, role source, heading level, name provenance (nameFrom), aria-labelledby/describedby IDREF resolve status, required states, focusability, aria-hidden. Returns raw facts, NEVER a pass/fail.',
      { targetXpath: z.string().optional(), x: z.number().optional(), y: z.number().optional() }, (a) => wrap(queryAxNode, a)),
    tool('observe_state_after_activation', 'Mutating (runs on a FRESH page clone): activate ONE control (by xpath) and return the OBJECTIVE before/after delta — each newly-visible text with its visibilityCause (inserted | display | visibility | aria-hidden | text-changed), whether it landed in a live region AND whether that region PRE-EXISTED (4.1.3: a region created with its message is NOT a reliable announcement → anyNewTextInNewLiveRegion, INCONCLUSIVE), whether focus moved into the revealed content (focusMovedToChange), and whether the page navigated/opened a window. Refuses a non-perceivable target. Reports WHAT changed and HOW, never whether it is conformant.',
      { targetXpath: z.string() }, (a) => wrap(observeStateAfterActivation, a)),
    tool('set_state_and_capture', 'Mutating (FRESH clone): drive ONE element into an interaction state (focus|hover|checked|open|expanded|placeholder-shown) and return before/after screenshots of the same region + the computed-style DELTA (which outline/border/decoration/background props changed) + stateReached/textVisible. Use for state-specific indicators (1.4.11/1.4.1/1.4.3). Returns PIXELS + objective style deltas, never a contrast number or a verdict; if stateReached is false, do not infer a pass.',
      { targetXpath: z.string(), state: z.enum(['focus', 'hover', 'checked', 'open', 'expanded', 'placeholder-shown']) }, (a) => wrap(setStateAndCapture, a)),
    tool('probe_screen_reader_after_action', 'Mutating (FRESH clone): run a screen reader, clear its log, activate ONE control (by xpath), settle, and return the VERBATIM spoken-phrase queue. Returns BOTH the full announcements queue AND liveRegionAnnouncements (the polite/assertive subset — the ONLY 4.1.3-relevant phrases; focus/change-of-context phrases are excluded by 4.1.3). emptyQueue/noLiveRegionAnnouncement flag a genuine silence; an instrument failure returns {error,probeFailed:true} instead (never a fake emptyQueue). Raw phrases, never an adequacy/announced verdict.',
      { triggerXpath: z.string() }, (a) => wrap(probeScreenReaderAfterAction, a)),
    tool('press_keys_and_observe_focus', 'Mutating (FRESH clone): focus ONE element (by xpath), dispatch ONE key combo (e.g. "Ctrl+M", "Escape", "Tab", "Alt+F6"), settle, and report whether focus MOVED (document.activeElement before vs after). For 2.1.2 keyboard-trap escape — behaviorally VERIFY a documented non-standard exit key actually frees focus instead of trusting the page JS: focusMoved=true ⇒ a WORKING escape; focusMoved=false ⇒ the key did nothing (a non-working / lying advisory). Objective before/after focus, never a verdict.',
      { targetXpath: z.string(), keys: z.string() }, (a) => wrap(pressKeysAndObserveFocus, a)),
    tool('measure_geometry_live', 'Read-only on the shared page (unless viewportWidth is given): box, horizontal overflow + culprit, occludedElements[] (what paints on top of the target — 1.4.13 Dismissible), and (if otherXpath) overlapFractionOfTarget/OfOther + gapX/gapY between the two boxes. Pass viewportWidth to re-measure on a CLONE at that width (1.4.10 reflow) — stateUsed echoes which. Raw numbers; marks degenerate boxes ambiguous; never a pass/fail.',
      { targetXpath: z.string(), otherXpath: z.string().optional(), viewportWidth: z.number().optional() }, (a) => wrap(measureGeometryLive, a)),
    tool('request_hi_res_crop', 'Mutating (FRESH clone): re-raster ONE element at a higher DEVICE scale (2-4x, NOT page zoom) and return the PNG + the actual scale + CSS-pixel and device-pixel sizes. Use when a small wordmark/chart label is unreadable in the 1x crop (1.1.1/1.4.5). Covers the whole element. If the result is still illegible, return PARTIAL — never invent text.',
      { targetXpath: z.string(), scale: z.number().optional() }, (a) => wrap(requestHiResCrop, a)),
    tool('render_with_overrides', 'Mutating (FRESH clone): re-render under ONE transform (grayscale|protanopia|deuteranopia|tritanopia|forced-colors|no-author-css) and return the screenshot (whole element if targetXpath given, else viewport). For 1.4.1 (which colour cue is load-bearing after grayscale/CVD) and forced-colors survival. Judge from pixels; never assert a numeric ratio from a transformed image.',
      { transform: z.enum(['grayscale', 'protanopia', 'deuteranopia', 'tritanopia', 'forced-colors', 'no-author-css']), targetXpath: z.string().optional() }, (a) => wrap(renderWithOverrides, a)),
    tool('compute_contrast_ratio', 'Read-only: the WCAG contrast ratio for TWO flat used-colours the model chooses (e.g. an in-text link colour vs the surrounding text colour — G183 for 1.4.1). Returns colorA/colorB/contrastRatio/threshold/passes from CSSOM. REFUSES (inconclusive) translucent/unparseable colours — it never sweeps a photo/gradient. `passes` is a mechanical compare, not a verdict.',
      { nodeAXpath: z.string(), nodeBXpath: z.string(), threshold: z.number().optional() }, (a) => wrap(computeContrastRatio, a)),
    tool('resolve_part_color', 'Read-only: for a NON-TEXT part at a screenshot pixel (x,y) — a border/indicator/SVG fill — return the CSS used-colours (incl. ::before/::after pseudo) AND the RENDERED pixel AND cssVsRenderedDivergence (sourceProperty = the used-colour the pixel best matches). usedColourReliable is false when a gradient/filter/opacity<1/translucent part means no single flat colour is sound ⇒ trust ONLY the rendered pixel. If divergent, no used-colour explains the pixel ⇒ INCONCLUSIVE. Raw RGBA + flags, never a ratio/verdict.',
      { x: z.number(), y: z.number() }, (a) => wrap(resolvePartColor, a)),
    tool('resolve_destination', 'Read-only: follow a SAME-ORIGIN link in an isolated incognito GET and return a RAW fingerprint (finalUrl/httpStatus/title/h1/mainFirstParagraph + instantRedirect/redirectDelayMs/interstitialPage) — for 2.4.4. Pass linkXpaths[] (the SET of same-named links — fd3a94 is a set test) to resolve all in one call + get a per-field byte-EQUALITY grid. instantRedirect is true only for a 3xx or meta-refresh delay-0 (only instant redirects count). NEVER same/equivalent/different — your judgment. Cross-origin/non-http refused.',
      { linkXpath: z.string().optional(), linkXpaths: z.array(z.string()).optional() }, (a) => wrap(resolveDestination, a)),
    tool('compare_iframe_content', 'Read-only: for 4.1.2 (ACT 4b1c6c — same-named iframes must serve an EQUIVALENT purpose). Pass iframeXpaths[] (the SET of same-named iframes) and get each one\'s RENDERED content read from its SAME-ORIGIN contentDocument (title/h1/firstParagraph/visibleText) + a per-field byte-EQUALITY grid across the set — the rendered-content comparison the raw `src` string cannot give (page-one.html vs page-two.html look interchangeable as strings but render DIFFERENT content). A crossOrigin iframe cannot be read (reported crossOrigin:true — judge from src/crops or PARTIAL). NEVER equivalent/same/different — your judgment.',
      { iframeXpath: z.string().optional(), iframeXpaths: z.array(z.string()).optional() }, (a) => wrap(compareIframeContent, a)),
    tool('compare_named_regions', 'Read-only: for an image/chart, given >=2 named regions (each {name,x,y,w,h} as fractions 0-1 of the element), return each region MEAN colour (+ colorSpread; high ⇒ multi-coloured, mean unrepresentative) and the perceptual ΔE2000 + luminanceDelta + perceptiblyDistinct between them (1.1.1 F13 — a colour-encoded distinction the alt omits). Derived measure only — never raw pixels, never a contrast ratio, never a verdict.',
      { targetXpath: z.string(), regions: z.array(z.object({ name: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number() })) }, (a) => wrap(compareNamedRegions, a)),
    tool('ocr_image_text', 'Read-only: OCR a crop of the page — an element (targetXpath) OR an explicit x/y/width/height rect — via PP-OCRv6 and return the recognised text + per-line boxes + confidences. For images-of-text (1.4.5), a wordmark/label the vision pass cannot read, or comparing rendered text to the alt/accessible name. Objective reading of the pixels, NEVER a verdict; empty text on a low-res crop does NOT mean "no text" (use request_hi_res_crop first). Returns {error} when the OCR sidecar is not set up — treat as INCONCLUSIVE.',
      { targetXpath: z.string().optional(), x: z.number().optional(), y: z.number().optional(), width: z.number().optional(), height: z.number().optional() }, (a) => wrap(ocrImageText, a)),
    tool('capture_full_page', 'Mutating (FRESH clone): a screenshot of the WHOLE scrollable document — beyond the viewport / below the fold. Optional targetXpath additionally returns that element\'s box in PAGE coordinates (origin = document top) + tag/role/text + verticalPositionPct + inViewport. Use to confirm an OFF-VIEWPORT heading/element exists and judge WHERE it sits relative to content (does an h1 introduce the prose or sit over the nav/TOC? — 2.4.10/2.4.6/1.3.1). Returns PIXELS + geometry, never a verdict; never infer a barrier from position alone.',
      { targetXpath: z.string().optional() }, (a) => wrap(captureFullPage, a)),
  ];
  return createSdkMcpServer({ name: 'cdp', version: '1.0.0', tools });
}

// CROSS-FAMILY tool surface (Gemini): the SAME CDP handlers + descriptions as buildCdpToolServer, exposed as Gemini
// `functionDeclarations` (JSON-Schema params) + a direct dispatcher — the Gemini transport drives a hand-rolled
// function-calling loop, not the Claude Agent SDK's MCP query() loop. `call()` returns the RAW result object; the
// Gemini loop JSON-stringifies it into a `functionResponse` exactly as the MCP `wrap` above stringifies it into text
// content, so the judge receives byte-identical tool EVIDENCE across families — only the agent-loop protocol differs.
// Descriptions are intentionally verbatim copies of buildCdpToolServer's (keep the two in sync if either changes).
function buildCdpToolDispatch(session) {
  const page = session.page;
  const ctx = { freshClone: session.freshClone, ocr: session.ocr };
  const HANDLERS = {
    query_ax_node: queryAxNode, observe_state_after_activation: observeStateAfterActivation,
    set_state_and_capture: setStateAndCapture, probe_screen_reader_after_action: probeScreenReaderAfterAction,
    press_keys_and_observe_focus: pressKeysAndObserveFocus,
    measure_geometry_live: measureGeometryLive, request_hi_res_crop: requestHiResCrop,
    render_with_overrides: renderWithOverrides, compute_contrast_ratio: computeContrastRatio,
    resolve_part_color: resolvePartColor, resolve_destination: resolveDestination,
    compare_iframe_content: compareIframeContent,
    compare_named_regions: compareNamedRegions, ocr_image_text: ocrImageText, capture_full_page: captureFullPage,
  };
  const S = (properties, required) => ({ type: 'object', properties, ...(required && required.length ? { required } : {}) });
  const declarations = [
    { name: 'query_ax_node', description: 'Read-only: resolve a node (by xpath OR by a screenshot pixel x/y) to its live accessibility facts — role, role source, heading level, name provenance (nameFrom), aria-labelledby/describedby IDREF resolve status, required states, focusability, aria-hidden. Returns raw facts, NEVER a pass/fail.',
      parameters: S({ targetXpath: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } }) },
    { name: 'observe_state_after_activation', description: 'Mutating (runs on a FRESH page clone): activate ONE control (by xpath) and return the OBJECTIVE before/after delta — each newly-visible text with its visibilityCause (inserted | display | visibility | aria-hidden | text-changed), whether it landed in a live region AND whether that region PRE-EXISTED (4.1.3: a region created with its message is NOT a reliable announcement → anyNewTextInNewLiveRegion, INCONCLUSIVE), whether focus moved into the revealed content (focusMovedToChange), and whether the page navigated/opened a window. Refuses a non-perceivable target. Reports WHAT changed and HOW, never whether it is conformant.',
      parameters: S({ targetXpath: { type: 'string' } }, ['targetXpath']) },
    { name: 'press_keys_and_observe_focus', description: 'Mutating (FRESH clone): focus ONE element (by xpath), dispatch ONE key combo (e.g. "Ctrl+M", "Escape", "Tab", "Alt+F6"), settle, and report whether focus MOVED (document.activeElement before vs after). For 2.1.2 keyboard-trap escape — behaviorally VERIFY a documented non-standard exit key actually frees focus instead of trusting the page JS: focusMoved=true ⇒ a WORKING escape; focusMoved=false ⇒ the key did nothing (a non-working / lying advisory). Objective before/after focus, never a verdict.',
      parameters: S({ targetXpath: { type: 'string' }, keys: { type: 'string' } }, ['targetXpath', 'keys']) },
    { name: 'set_state_and_capture', description: 'Mutating (FRESH clone): drive ONE element into an interaction state (focus|hover|checked|open|expanded|placeholder-shown) and return before/after screenshots of the same region + the computed-style DELTA (which outline/border/decoration/background props changed) + stateReached/textVisible. Use for state-specific indicators (1.4.11/1.4.1/1.4.3). Returns PIXELS + objective style deltas, never a contrast number or a verdict; if stateReached is false, do not infer a pass.',
      parameters: S({ targetXpath: { type: 'string' }, state: { type: 'string', enum: ['focus', 'hover', 'checked', 'open', 'expanded', 'placeholder-shown'] } }, ['targetXpath', 'state']) },
    { name: 'probe_screen_reader_after_action', description: 'Mutating (FRESH clone): run a screen reader, clear its log, activate ONE control (by xpath), settle, and return the VERBATIM spoken-phrase queue. Returns BOTH the full announcements queue AND liveRegionAnnouncements (the polite/assertive subset — the ONLY 4.1.3-relevant phrases; focus/change-of-context phrases are excluded by 4.1.3). emptyQueue/noLiveRegionAnnouncement flag a genuine silence; an instrument failure returns {error,probeFailed:true} instead (never a fake emptyQueue). Raw phrases, never an adequacy/announced verdict.',
      parameters: S({ triggerXpath: { type: 'string' } }, ['triggerXpath']) },
    { name: 'measure_geometry_live', description: 'Read-only on the shared page (unless viewportWidth is given): box, horizontal overflow + culprit, occludedElements[] (what paints on top of the target — 1.4.13 Dismissible), and (if otherXpath) overlapFractionOfTarget/OfOther + gapX/gapY between the two boxes. Pass viewportWidth to re-measure on a CLONE at that width (1.4.10 reflow) — stateUsed echoes which. Raw numbers; marks degenerate boxes ambiguous; never a pass/fail.',
      parameters: S({ targetXpath: { type: 'string' }, otherXpath: { type: 'string' }, viewportWidth: { type: 'number' } }, ['targetXpath']) },
    { name: 'request_hi_res_crop', description: 'Mutating (FRESH clone): re-raster ONE element at a higher DEVICE scale (2-4x, NOT page zoom) and return the PNG + the actual scale + CSS-pixel and device-pixel sizes. Use when a small wordmark/chart label is unreadable in the 1x crop (1.1.1/1.4.5). Covers the whole element. If the result is still illegible, return PARTIAL — never invent text.',
      parameters: S({ targetXpath: { type: 'string' }, scale: { type: 'number' } }, ['targetXpath']) },
    { name: 'render_with_overrides', description: 'Mutating (FRESH clone): re-render under ONE transform (grayscale|protanopia|deuteranopia|tritanopia|forced-colors|no-author-css) and return the screenshot (whole element if targetXpath given, else viewport). For 1.4.1 (which colour cue is load-bearing after grayscale/CVD) and forced-colors survival. Judge from pixels; never assert a numeric ratio from a transformed image.',
      parameters: S({ transform: { type: 'string', enum: ['grayscale', 'protanopia', 'deuteranopia', 'tritanopia', 'forced-colors', 'no-author-css'] }, targetXpath: { type: 'string' } }, ['transform']) },
    { name: 'compute_contrast_ratio', description: 'Read-only: the WCAG contrast ratio for TWO flat used-colours the model chooses (e.g. an in-text link colour vs the surrounding text colour — G183 for 1.4.1). Returns colorA/colorB/contrastRatio/threshold/passes from CSSOM. REFUSES (inconclusive) translucent/unparseable colours — it never sweeps a photo/gradient. `passes` is a mechanical compare, not a verdict.',
      parameters: S({ nodeAXpath: { type: 'string' }, nodeBXpath: { type: 'string' }, threshold: { type: 'number' } }, ['nodeAXpath', 'nodeBXpath']) },
    { name: 'resolve_part_color', description: 'Read-only: for a NON-TEXT part at a screenshot pixel (x,y) — a border/indicator/SVG fill — return the CSS used-colours (incl. ::before/::after pseudo) AND the RENDERED pixel AND cssVsRenderedDivergence (sourceProperty = the used-colour the pixel best matches). usedColourReliable is false when a gradient/filter/opacity<1/translucent part means no single flat colour is sound ⇒ trust ONLY the rendered pixel. If divergent, no used-colour explains the pixel ⇒ INCONCLUSIVE. Raw RGBA + flags, never a ratio/verdict.',
      parameters: S({ x: { type: 'number' }, y: { type: 'number' } }, ['x', 'y']) },
    { name: 'resolve_destination', description: 'Read-only: follow a SAME-ORIGIN link in an isolated incognito GET and return a RAW fingerprint (finalUrl/httpStatus/title/h1/mainFirstParagraph + instantRedirect/redirectDelayMs/interstitialPage) — for 2.4.4. Pass linkXpaths[] (the SET of same-named links — fd3a94 is a set test) to resolve all in one call + get a per-field byte-EQUALITY grid. instantRedirect is true only for a 3xx or meta-refresh delay-0 (only instant redirects count). NEVER same/equivalent/different — your judgment. Cross-origin/non-http refused.',
      parameters: S({ linkXpath: { type: 'string' }, linkXpaths: { type: 'array', items: { type: 'string' } } }) },
    { name: 'compare_iframe_content', description: 'Read-only: for 4.1.2 (ACT 4b1c6c — same-named iframes must serve an EQUIVALENT purpose). Pass iframeXpaths[] (the SET of same-named iframes) and get each one\'s RENDERED content read from its SAME-ORIGIN contentDocument (title/h1/firstParagraph/visibleText) + a per-field byte-EQUALITY grid across the set — the rendered-content comparison the raw `src` string cannot give (page-one.html vs page-two.html look interchangeable as strings but render DIFFERENT content). A crossOrigin iframe cannot be read (reported crossOrigin:true — judge from src/crops or PARTIAL). NEVER equivalent/same/different — your judgment.',
      parameters: S({ iframeXpath: { type: 'string' }, iframeXpaths: { type: 'array', items: { type: 'string' } } }) },
    { name: 'compare_named_regions', description: 'Read-only: for an image/chart, given >=2 named regions (each {name,x,y,w,h} as fractions 0-1 of the element), return each region MEAN colour (+ colorSpread; high ⇒ multi-coloured, mean unrepresentative) and the perceptual ΔE2000 + luminanceDelta + perceptiblyDistinct between them (1.1.1 F13 — a colour-encoded distinction the alt omits). Derived measure only — never raw pixels, never a contrast ratio, never a verdict.',
      parameters: S({ targetXpath: { type: 'string' }, regions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } }, required: ['name', 'x', 'y', 'w', 'h'] } } }, ['targetXpath', 'regions']) },
    { name: 'ocr_image_text', description: 'Read-only: OCR a crop of the page — an element (targetXpath) OR an explicit x/y/width/height rect — via PP-OCRv6 and return the recognised text + per-line boxes + confidences. For images-of-text (1.4.5), a wordmark/label the vision pass cannot read, or comparing rendered text to the alt/accessible name. Objective reading of the pixels, NEVER a verdict; empty text on a low-res crop does NOT mean "no text" (use request_hi_res_crop first). Returns {error} when the OCR sidecar is not set up — treat as INCONCLUSIVE.',
      parameters: S({ targetXpath: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } }) },
    { name: 'capture_full_page', description: 'Mutating (FRESH clone): a screenshot of the WHOLE scrollable document — beyond the viewport / below the fold. Optional targetXpath additionally returns that element\'s box in PAGE coordinates (origin = document top) + tag/role/text + verticalPositionPct + inViewport. Use to confirm an OFF-VIEWPORT heading/element exists and judge WHERE it sits relative to content (does an h1 introduce the prose or sit over the nav/TOC? — 2.4.10/2.4.6/1.3.1). Returns PIXELS + geometry, never a verdict; never infer a barrier from position alone.',
      parameters: S({ targetXpath: { type: 'string' } }) },
  ];
  // Returns the RAW result OBJECT (NOT MCP-wrapped); the Gemini loop JSON-stringifies it into a functionResponse,
  // matching how `wrap` JSON-stringifies it into MCP text content. A thrown handler ⇒ {error} (never a fake result).
  const call = async (name, args) => {
    const fn = HANDLERS[name];
    if (!fn) return { error: `unknown tool: ${name}` };
    try { return await fn(page, args || {}, ctx); }
    catch (e) { return { error: String((e && e.message) || e) }; }
  };
  return { declarations, call };
}

module.exports = { queryAxNode, observeStateAfterActivation, setStateAndCapture, probeScreenReaderAfterAction, pressKeysAndObserveFocus, measureGeometryLive, requestHiResCrop, renderWithOverrides, computeContrastRatio, resolvePartColor, resolveDestination, compareIframeContent, compareNamedRegions, ocrImageText, captureFullPage, buildCdpToolServer, buildCdpToolDispatch };
