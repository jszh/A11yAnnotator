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
      const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var r=document.evaluate(${JSON.stringify(targetXpath)},document,null,9,null);return r.singleNodeValue;})()`, returnByValue: false }).catch(() => ({}));
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
      const live = await page.evaluate((xp, attrs) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; const present = {}; for (const a of attrs) present[a] = el.hasAttribute(a); return { present, explicitRole: el.getAttribute('role') }; }, resolvedXpath, STATE_ATTRS).catch(() => null);
      if (live) {
        requiredStatesPresent = STATE_ATTRS.filter((a) => live.present[a]).map((a) => a.replace('aria-', ''));
        const need = live.explicitRole ? (ROLE_REQUIRES[role] || []) : []; // only an EXPLICIT aria role must author its state
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
      return { url: location.href, active: _xp(document.activeElement), texts: [...texts], tgtPerceivable };
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
    const res = await live.evaluate(async (xp) => {
      const v = window.__vsr;
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      if (!el) return { found: false };
      try { await v.start({ container: document.body }); } catch (e) { return { found: true, started: false }; }
      try { await v.clearSpokenPhraseLog(); } catch (e) {}
      el.click(); // trigger the action; the VSR's live-region observer voices any change
      await new Promise((r) => setTimeout(r, 1400)); // settle the politeness queue
      let log = [];
      try { log = await v.spokenPhraseLog(); } catch (e) {}
      try { await v.stop(); } catch (e) {}
      return { found: true, started: true, log: Array.isArray(log) ? log.map(String) : [] };
    }, triggerXpath);
    if (!res || !res.found) return { error: 'trigger not found', probeFailed: true };
    if (!res.started) return { error: 'vsr-start-failed', probeFailed: true };
    const announcements = (res.log || []).filter(Boolean);
    // Only POLITE/ASSERTIVE live-region phrases bear on 4.1.3 — focus/change-of-context phrases (e.g. a moved
    // focus reading its name+role) are explicitly out of 4.1.3 scope. Surface BOTH: the full queue (transparency)
    // and the live-region subset (the 4.1.3-relevant datum). emptyQueue reflects the FULL queue; the model uses
    // noLiveRegionAnnouncement for 4.1.3 (and an un-hide / fresh-container insert may voice nothing ⇒ INCONCLUSIVE).
    const liveRegionAnnouncements = announcements.filter((a) => /^(polite|assertive)\b/i.test(a));
    return { announcements, announcementCount: announcements.length, emptyQueue: announcements.length === 0, liveRegionAnnouncements, noLiveRegionAnnouncement: liveRegionAnnouncements.length === 0 };
  } finally { try { await live.close(); } catch (e) {} }
}

// ============================================================================================
// measure_geometry_live — READ-ONLY (shared base page; no viewport/render change ⇒ concurrency-safe): box +
// horizontal-overflow + overflow culprit for one element, and the overlap/gap between TWO named elements
// (1.4.13 occlusion; 1.4.10 sub-element overflow). Raw measured numbers; marks an ambiguous case rather than
// inventing a value; never pass/fail. (For a popup that only exists on hover/focus, drive the state with
// set_state_and_capture first; for a non-collected viewport width, that's a clone op — out of this tool.)
async function measureGeometryLive(page, args) {
  const { targetXpath, otherXpath } = args || {};
  if (typeof targetXpath !== 'string' || !targetXpath) return { error: 'targetXpath required' };
  const r = await page.evaluate((xp, oxp) => {
    const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
    if (!el) return { found: false };
    const b = el.getBoundingClientRect();
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
    return { found: true, box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowsHorizontally: overflowsH, overflowPx: Math.max(0, el.scrollWidth - el.clientWidth), overflowCulprit: culprit, overlap, viewportWidthUsed: window.innerWidth, ambiguous, ambiguityReason: ambiguous ? 'degenerate box (<6px)' : undefined };
  }, targetXpath, otherXpath || null).catch(() => null);
  if (!r) return { error: 'measurement failed' };
  if (!r.found) return { error: 'target not found' };
  return { ...r, targetXpath, stateUsed: 'as-loaded(shared-page)' }; // echo the subject + the state the numbers were measured in
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
    const screenshot = await live.screenshot({ encoding: 'base64', clip }).catch(() => null);
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
    await new Promise((r) => setTimeout(r, 160));
    let clip;
    if (typeof targetXpath === 'string' && targetXpath) {
      const meta = await live.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (!el) return null; try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {} const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height }; }, targetXpath).catch(() => null);
      if (meta && meta.w > 0 && meta.h > 0) clip = { x: Math.round(meta.x), y: Math.round(meta.y), width: Math.round(meta.w), height: Math.round(meta.h) };
    }
    const screenshot = await live.screenshot({ encoding: 'base64', ...(clip ? { clip } : {}) }).catch(() => null);
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
    const used = (xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; return el ? getComputedStyle(el).color : null; };
    return { a: used(xa), b: used(xb) };
  }, nodeAXpath, nodeBXpath).catch(() => null);
  if (!cols || !cols.a || !cols.b) return { error: 'one or both nodes not found' };
  const pa = A.parseRGB(cols.a), pb = A.parseRGB(cols.b);
  if (!pa || !pb) return { inconclusive: 'unparseable-color', colorA: cols.a, colorB: cols.b };
  if ((pa.a != null && pa.a < 1) || (pb.a != null && pb.a < 1)) return { inconclusive: 'alpha-unresolved', note: 'a translucent colour cannot be reduced to a sound ratio — defer to the perceptual rubric' };
  const rawRatio = A.contrastRatioRaw([pa.r, pa.g, pa.b], [pb.r, pb.g, pb.b]);
  const th = Number.isFinite(threshold) ? threshold : 3;
  // `passes` compares the UNROUNDED ratio (WCAG "do not round up": 2.998 must NOT pass 3:1); contrastRatio is
  // the 2-dp DISPLAY value only.
  return { colorA: cols.a, colorB: cols.b, source: 'cssom', contrastRatio: +rawRatio.toFixed(2), threshold: th, passes: rawRatio >= th, note: 'WCAG ratio of two FLAT used-colours (G183); `passes` is a mechanical compare on the unrounded ratio, not an SC disposition.' };
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
    return { part: el.tagName.toLowerCase(), color: cs.color, backgroundColor: cs.backgroundColor, borderTopColor: cs.borderTopColor, outlineColor: cs.outlineColor, fill: cs.fill, stroke: cs.stroke };
  }, x, y).catch(() => null);
  if (!cssInfo) return { error: 'no element at the given point' };
  // rendered pixel: screenshot a 5x5 clip at the point, decode the centre via an in-page canvas (the data
  // URI is same-origin, so getImageData is allowed) — no PNG-decoder dependency needed.
  const clip = { x: Math.max(0, Math.round(x) - 2), y: Math.max(0, Math.round(y) - 2), width: 5, height: 5 };
  const shot = await page.screenshot({ encoding: 'base64', clip }).catch(() => null);
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
  return { ...cssInfo, renderedPixelRGBA, cssVsRenderedDivergence: divergence, note: 'BOTH the CSS used-colours AND the rendered pixel are returned; cssVsRenderedDivergence.sourceProperty is the used-colour the pixel best matches. If divergent is true, NO CSS used-colour explains the rendered pixel (the CSS is misleading / it false-clears) — treat the colour as INCONCLUSIVE.' };
}

// ============================================================================================
// resolve_destination — fetches a SAME-ORIGIN link's settled destination in an isolated, read-only incognito
// GET, returning a RAW fingerprint (finalUrl/httpStatus/title/h1/mainFirstParagraph). NO "equivalent"/"same"
// verdict — that IS the 2.4.4 judgment the model is graded on, so computing it here would launder the
// conclusion. SAME-ORIGIN ONLY (http(s) same origin, or file:// same directory for the local mirror):
// following arbitrary external hrefs is SSRF/exfil surface and breaks the saved-dataset determinism. GET only,
// depth 0, never the audited session/cookies.
async function resolveDestination(page, args) {
  const { linkXpath } = args || {};
  if (typeof linkXpath !== 'string' || !linkXpath) return { error: 'linkXpath required' };
  const info = await page.evaluate((xp) => {
    const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
    if (!el) return { found: false };
    const a = (el.closest && el.closest('a[href]')) || el;
    return { found: true, href: a.href || null, pageUrl: location.href };
  }, linkXpath).catch(() => null);
  if (!info || !info.found) return { error: 'link not found' };
  if (!info.href) return { error: 'no href on the target' };
  let target, base;
  try { target = new URL(info.href); base = new URL(info.pageUrl); } catch (e) { return { refused: 'unparseable-url' }; }
  if (!/^https?:$/.test(target.protocol) && target.protocol !== 'file:') return { refused: 'non-http-or-file' };
  const dir = (u) => u.pathname.slice(0, u.pathname.lastIndexOf('/') + 1);
  const sameOrigin = target.protocol === 'file:' ? (base.protocol === 'file:' && dir(target) === dir(base)) : (target.origin === base.origin);
  if (!sameOrigin) return { refused: 'cross-origin', destinationOrigin: target.origin };
  const browser = page.browser();
  let ctx = null, p = null;
  try {
    ctx = browser.createBrowserContext ? await browser.createBrowserContext() : await browser.createIncognitoBrowserContext();
    p = await ctx.newPage();
    // PRE-FLIGHT same-origin guard (SSRF / tracking): abort any request to a foreign origin BEFORE it leaves the
    // machine — so a 3xx redirect to another origin never even fires the outbound GET. The post-goto check below
    // is then only defense-in-depth. We only need the main document; a cross-origin sub-resource is both
    // irrelevant to the fingerprint and exactly the leak we refuse.
    await p.setRequestInterception(true).catch(() => {});
    p.on('request', (req) => {
      let ok = false;
      try {
        const u = new URL(req.url());
        if (u.protocol === 'data:' || u.protocol === 'about:' || u.protocol === 'blob:') ok = true;
        else if (target.protocol === 'file:') ok = (u.protocol === 'file:' && dir(u) === dir(target));
        else ok = (u.origin === target.origin);
      } catch (e) { ok = false; }
      if (ok) req.continue().catch(() => {}); else req.abort().catch(() => {});
    });
    const resp = await p.goto(target.href, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    // REDIRECT GUARD (adversarial verify): the static-href check only validated the LINK; a 3xx can land on
    // ANOTHER origin. Re-validate the SETTLED url — refuse rather than fingerprint a foreign origin (SSRF).
    let finalU = null; try { finalU = new URL(p.url()); } catch (e) {}
    const finalSameOrigin = finalU && (target.protocol === 'file:' ? (finalU.protocol === 'file:' && dir(finalU) === dir(base)) : (finalU.origin === base.origin));
    if (!finalSameOrigin) return { refused: 'cross-origin-redirect', finalOrigin: finalU ? finalU.origin : null };
    const fp = await p.evaluate(() => {
      const m = document.querySelector('main') || document.body;
      const para = m && m.querySelector('p');
      return { title: document.title, h1: (document.querySelector('h1') || {}).textContent || null, mainFirstParagraph: para ? (para.textContent || '').trim().slice(0, 160) : null };
    }).catch(() => ({}));
    return { finalUrl: p.url().slice(0, 300), httpStatus: resp ? resp.status() : null, title: (fp.title || '').slice(0, 200), h1: fp.h1 ? String(fp.h1).trim().slice(0, 160) : null, mainFirstParagraph: fp.mainFirstParagraph || null, note: 'raw destination fingerprint (same-origin only); the model judges "same purpose?" — this tool never returns equivalent/same/different.' };
  } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
  finally { try { if (p) await p.close(); } catch (e) {} try { if (ctx && ctx.close) await ctx.close(); } catch (e) {} }
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
  const shot = await page.screenshot({ encoding: 'base64', clip, captureBeyondViewport: true }).catch(() => null);
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
  const b64 = await page.screenshot({ encoding: 'base64', clip, captureBeyondViewport: true }).catch(() => null);
  if (!b64) return { error: 'capture failed' };
  const r = await ctx.ocr.recognize(b64);
  if (r.error) return { error: r.error, note: 'OCR could not run — do NOT infer the crop is empty; treat as INCONCLUSIVE.' };
  return { text: r.text || '', lines: r.lines || [], lineCount: (r.lines || []).length, engine: (ctx.ocr && ctx.ocr.engine && ctx.ocr.engine()) || null, ...(clampedToViewport ? { clampedToViewport: true } : {}), note: 'recognised text + per-line boxes/confidence (PP-OCRv6) — an objective reading of the rendered pixels. Empty text ≠ "no text" on a low-res crop (try request_hi_res_crop first). NEVER a verdict.' };
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
    tool('measure_geometry_live', 'Read-only: measured geometry for an element — bounding box, horizontal overflow (scrollWidth vs clientWidth) + the overflow culprit, and (if otherXpath is given) the overlap area/fraction and gap between the two boxes (1.4.13 occlusion, 1.4.10 sub-element overflow). Raw numbers only; marks ambiguous (degenerate) boxes instead of inventing a value; never a pass/fail.',
      { targetXpath: z.string(), otherXpath: z.string().optional() }, (a) => wrap(measureGeometryLive, a)),
    tool('request_hi_res_crop', 'Mutating (FRESH clone): re-raster ONE element at a higher DEVICE scale (2-4x, NOT page zoom) and return the PNG + the actual scale + CSS-pixel and device-pixel sizes. Use when a small wordmark/chart label is unreadable in the 1x crop (1.1.1/1.4.5). Covers the whole element. If the result is still illegible, return PARTIAL — never invent text.',
      { targetXpath: z.string(), scale: z.number().optional() }, (a) => wrap(requestHiResCrop, a)),
    tool('render_with_overrides', 'Mutating (FRESH clone): re-render under ONE transform (grayscale|protanopia|deuteranopia|tritanopia|forced-colors|no-author-css) and return the screenshot (whole element if targetXpath given, else viewport). For 1.4.1 (which colour cue is load-bearing after grayscale/CVD) and forced-colors survival. Judge from pixels; never assert a numeric ratio from a transformed image.',
      { transform: z.enum(['grayscale', 'protanopia', 'deuteranopia', 'tritanopia', 'forced-colors', 'no-author-css']), targetXpath: z.string().optional() }, (a) => wrap(renderWithOverrides, a)),
    tool('compute_contrast_ratio', 'Read-only: the WCAG contrast ratio for TWO flat used-colours the model chooses (e.g. an in-text link colour vs the surrounding text colour — G183 for 1.4.1). Returns colorA/colorB/contrastRatio/threshold/passes from CSSOM. REFUSES (inconclusive) translucent/unparseable colours — it never sweeps a photo/gradient. `passes` is a mechanical compare, not a verdict.',
      { nodeAXpath: z.string(), nodeBXpath: z.string(), threshold: z.number().optional() }, (a) => wrap(computeContrastRatio, a)),
    tool('resolve_part_color', 'Read-only: for a NON-TEXT part at a screenshot pixel (x,y) — a border/indicator/SVG fill — return the CSS used-colours there AND the RENDERED pixel AND a divergence flag (1.4.11/1.4.1). ALWAYS returns both: if cssVsRenderedDivergence.divergent the CSS colour is misleading (it false-clears) — treat as INCONCLUSIVE. Raw RGBA + flags, never a ratio or verdict.',
      { x: z.number(), y: z.number() }, (a) => wrap(resolvePartColor, a)),
    tool('resolve_destination', 'Read-only: follow a SAME-ORIGIN link (by xpath) in an isolated incognito GET and return a RAW fingerprint (finalUrl/httpStatus/title/h1/mainFirstParagraph) — for 2.4.4 (do two same-named links go to different destinations). NEVER returns same/equivalent/different — that is your judgment. Cross-origin/non-http links are refused.',
      { linkXpath: z.string() }, (a) => wrap(resolveDestination, a)),
    tool('compare_named_regions', 'Read-only: for an image/chart, given >=2 named regions (each {name,x,y,w,h} as fractions 0-1 of the element), return each region MEAN colour (+ colorSpread; high ⇒ multi-coloured, mean unrepresentative) and the perceptual ΔE2000 + luminanceDelta + perceptiblyDistinct between them (1.1.1 F13 — a colour-encoded distinction the alt omits). Derived measure only — never raw pixels, never a contrast ratio, never a verdict.',
      { targetXpath: z.string(), regions: z.array(z.object({ name: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number() })) }, (a) => wrap(compareNamedRegions, a)),
    tool('ocr_image_text', 'Read-only: OCR a crop of the page — an element (targetXpath) OR an explicit x/y/width/height rect — via PP-OCRv6 and return the recognised text + per-line boxes + confidences. For images-of-text (1.4.5), a wordmark/label the vision pass cannot read, or comparing rendered text to the alt/accessible name. Objective reading of the pixels, NEVER a verdict; empty text on a low-res crop does NOT mean "no text" (use request_hi_res_crop first). Returns {error} when the OCR sidecar is not set up — treat as INCONCLUSIVE.',
      { targetXpath: z.string().optional(), x: z.number().optional(), y: z.number().optional(), width: z.number().optional(), height: z.number().optional() }, (a) => wrap(ocrImageText, a)),
  ];
  return createSdkMcpServer({ name: 'cdp', version: '1.0.0', tools });
}

module.exports = { queryAxNode, observeStateAfterActivation, setStateAndCapture, probeScreenReaderAfterAction, measureGeometryLive, requestHiResCrop, renderWithOverrides, computeContrastRatio, resolvePartColor, resolveDestination, compareNamedRegions, ocrImageText, buildCdpToolServer };
