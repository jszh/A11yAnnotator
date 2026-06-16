'use strict';
// Harness 3.0 — up-front VSR (virtual screen reader) COLLECTION (plan: collect VSR info at the start).
// Runs ONE forward reading-order pass over the page with the Guidepup VSR and emits the baseline
// transcript every VSR-dependent check consumes: an ordered list of
//   { index, xpath, tag, phrase, role, name, states, boundary }
// plus whether the cursor reached end-of-document cleanly. The VSR is an INSTRUMENT the harness uses
// to assess the page (it is NOT the harness's ground truth — see memory vsr-is-harness-instrument).
//
// server.js (the annotator SR tool) has hard-won special handling for VSR. We PORT THE ARTIFACT FIXES:
//   • skip <noscript> raw-markup nodes — the parser stores a <noscript>'s children as one raw TEXT node
//     when scripting is enabled; Chrome's AX tree ignores it but the VSR prunes by computed style only
//     and would "speak" the literal markup (server.js:640-647);
//   • recognize the "end of X" / "document" structural boundary announcements (server.js:692-694).
//
// Harness 3.1 §5.2.0 — we NOW ADOPT the v2.9 CDP accessible-name CORRECTION (server.js:494-510), which
// an earlier v3 draft wrongly skipped. Guidepup follows ARIA mechanically and mis-voices the NAME slot
// in ways no shipping AT does (it duplicates nameFrom:contents — "link, About, About" — and for
// nameFrom:n/a roles like paragraph/list it voices the bare role instead of the text). The harness
// models what a real screen-reader USER HEARS, so the announced name the 1.3.2/4.1.2 checks (and the
// §3 LLM lane) judge must be the REAL accessible name. We substitute Chrome's authoritative CDP `axName`
// into the NAME slot, fall back to textContent for bare-role nodes, and KEEP the role + states the VSR
// voiced. Crucially we correct the NAME ONLY (our parse already isolates role/name/states explicitly,
// so we avoid the server.js prefix-match state-drop hazard, §5.2.0 port hazard) and retain the original
// `rawPhrase`/`rawName` so a genuine role/state divergence is still inspectable.
const fs = require('fs');

// Roles that READ THEIR TEXT as the announced name (nameFrom:contents / text). For these, an empty CDP
// axName means "fall back to textContent", NOT "no accessible name". LANDMARKS + containers
// (main/nav/region/list/table/group/section/…) are DELIBERATELY EXCLUDED: an unlabeled landmark
// genuinely has NO accessible name, and folding its whole subtree into a "name" is noise, not realism
// (probe-confirmed: an unlabeled <main> otherwise absorbs the entire page text). This is a refinement
// over server.js:514's blanket list, which was written for a single queried element, not a full walk.
// ONLY leaf-ish nameFrom:contents roles whose text IS their name and is bounded. Sectioning/grouping
// containers (article/blockquote/figure/caption/note/tooltip) are EXCLUDED — they nest other content
// and would fold a whole subtree into a bogus "name" (adversarial A-LOW-1).
const TEXT_FALLBACK_ROLES = /^(paragraph|listitem|cell|columnheader|rowheader|term|definition|code|emphasis|strong|mark|time|deletion|insertion|subscript|superscript|heading)$/i;

// Resolve ONE element's authoritative accessible name via CDP (the same path server.js + eval-page.js
// use): xpath → objectId → backendNodeId → Accessibility.getAXNodeAndAncestors → name.value. Returns
// null on a resolution failure (caller keeps the raw VSR name), '' when the AX node has no name.
async function cdpAxName(cdp, xpath) {
  let objectId = null;
  try {
    const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var r=document.evaluate(${JSON.stringify(xpath)},document,null,9,null);return r.singleNodeValue;})()`, returnByValue: false });
    if (!ev.result || !ev.result.objectId) return null;
    objectId = ev.result.objectId;
    const { node } = await cdp.send('DOM.describeNode', { objectId });
    if (!node || node.backendNodeId == null) return null;
    const { nodes } = await cdp.send('Accessibility.getAXNodeAndAncestors', { backendNodeId: node.backendNodeId });
    const ax = nodes && nodes[0];
    if (!ax || ax.ignored) return ''; // ignored / nameless ⇒ no announced name
    return ax.name && ax.name.value != null ? String(ax.name.value) : '';
  } catch (e) { return null; }
  finally { if (objectId) await cdp.send('Runtime.releaseObject', { objectId }).catch(() => {}); }
}

// Apply the CDP name-slot correction to a collected transcript IN PLACE (Node-side; CDP is unavailable
// inside page.evaluate). Bounded by a deadline so a huge page cannot stall collection.
async function correctNamesViaCdp(page, result, opts = {}) {
  if (!result || !result.ok || !Array.isArray(result.steps) || !page || typeof page.target !== 'function') return result;
  const cdp = await page.target().createCDPSession().catch(() => null);
  if (!cdp) return result;
  try {
    await cdp.send('Accessibility.enable').catch(() => {});
    const deadline = Date.now() + (Number.isFinite(opts.cdpDeadlineMs) ? opts.cdpDeadlineMs : 15000);
    for (const step of result.steps) {
      step.rawPhrase = step.phrase; step.rawName = step.name; step.axName = null;
      if (step.boundary || !step.xpath) continue;
      if (Date.now() > deadline) continue;
      const ax = await cdpAxName(cdp, step.xpath);
      if (ax == null) continue;                 // resolution failed — keep the raw VSR name
      step.axName = ax;
      if (ax !== '') step.name = ax;            // real accessible name → name slot (role + states kept)
      else if (TEXT_FALLBACK_ROLES.test(step.role || '')) step.name = step.visibleText || ''; // nameFrom:contents → read the text
      else step.name = '';                       // AX confirms NO accessible name (e.g. unlabeled control / landmark)
    }
    result.cdpCorrected = true;
  } finally { await cdp.detach().catch(() => {}); }
  return result;
}

// the self-contained ~393KB browser ESM bundle (the same build server.js injects).
const VSR_BUILD = require.resolve('@guidepup/virtual-screen-reader/browser.js');
let vsrSrc = null;
function vsrSource() { if (vsrSrc == null) vsrSrc = fs.readFileSync(VSR_BUILD, 'utf8'); return vsrSrc; }

// Inject the VSR into a Puppeteer page via a blob-URL ESM import — no HTTP server / annotator coupling.
// Idempotent: a page that already has window.__vsr is left alone. Returns true on success.
async function ensureVsr(page) {
  const has = await page.evaluate(() => !!window.__vsr).catch(() => false);
  if (has) return true;
  return page.evaluate(async (src) => {
    try {
      const blob = new Blob([src], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const mod = await import(url);
      window.__vsr = mod.virtual;
      return !!window.__vsr;
    } catch (e) { return false; }
  }, vsrSource()).catch(() => false);
}

// Role tokens a VSR phrase can LEAD with, so we can split "role, name, states/value" from a bare text
// node (a paragraph's contents read verbatim has no role prefix). Broad on purpose; `phrase` is ALWAYS
// preserved raw, so a parse miss never loses information.
const ROLE_LEAD = '^(heading|navigation|link|button|textbox|searchbox|checkbox|radio|switch|combobox|listbox|list|listitem|article|region|main|banner|contentinfo|complementary|form|search|figure|table|row|cell|columnheader|rowheader|dialog|alertdialog|menu|menuitem|menubar|menuitemcheckbox|menuitemradio|tab|tablist|tabpanel|slider|spinbutton|progressbar|status|alert|img|image|separator|group|document|application|tooltip|tree|treeitem|grid|gridcell|option|paragraph|blockquote|code|emphasis|strong|note|term|definition|generic|section|heading level)\\b';

// Collect the full forward reading-order transcript. opts: { maxSteps=6000, deadlineMs=30000 }.
// Returns { ok, steps[], totalSteps, reachedEnd, stoppedEarly, wrapped, stuckXpath, reason? }.
// reachedEnd=true means the cursor walked off the end cleanly (no forward VSR trap). stoppedEarly /
// wrapped flag a cursor that could not advance / cycled before the end — the seed of VSR-trap detection.
async function collectVsrTranscript(page, opts = {}) {
  const ok = await ensureVsr(page);
  if (!ok) return { ok: false, reason: 'vsr-injection-failed', steps: [], totalSteps: 0, reachedEnd: false, stoppedEarly: false, wrapped: false, stuckXpath: null };
  const cap = Number.isFinite(opts.maxSteps) ? opts.maxSteps : 6000;
  const deadlineMs = Number.isFinite(opts.deadlineMs) ? opts.deadlineMs : 30000;
  const result = await page.evaluate(async (cap, deadlineMs, ROLE_SRC) => {
    const ROLE_RE = new RegExp(ROLE_SRC, 'i');
    const vsr = window.__vsr;
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      if (e === document.documentElement) return '/html';
      const ns = e.namespaceURI;
      const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
      const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + ']');
    };
    const toEl = (n) => { while (n && !n.tagName) n = n.parentNode; return n; };
    const inNoscript = (n) => { const e = toEl(n); return !!(e && e.closest && e.closest('noscript')); };

    // ARIA STATE / value tokens the VSR appends after the name. Critically, when a widget has NO name
    // the VSR voices "role, <state>…", so the FIRST trailing segment can be a state — it must NOT be
    // mistaken for the accessible name (audit: nameless combobox false-negative).
    const STATE_RE = /^(has popup\b|not expanded|expanded|collapsed|not checked|checked|partially checked|mixed|not selected|selected|not pressed|pressed|disabled|required|invalid|busy|read[ -]?only|multi[ -]?line|not editable|editable|current\b|level \d|position \d|set ?size \d|out of \d|orientation\b|value \d)/i;
    // Parse a raw VSR phrase. `phrase` is preserved verbatim; role/name/states are best-effort.
    // `states` holds the trailing announced segment(s) after the name (ARIA states AND/OR a value).
    const parse = (phrase) => {
      const p = (phrase || '').trim();
      const low = p.toLowerCase();
      if (low === 'document' || low === 'web area') return { boundary: 'enter', role: low, name: '', states: '' };
      if (low.startsWith('end of ')) return { boundary: 'exit', role: low.slice(7), name: '', states: '' };
      const ci = p.indexOf(', ');
      if (ci > 0 && ROLE_RE.test(p.slice(0, ci))) {
        const role = p.slice(0, ci);
        const parts = p.slice(ci + 2).split(', ');
        // if the first trailing segment is an ARIA state, the widget has NO name (state, not name).
        if (STATE_RE.test(parts[0] || '')) return { boundary: null, role, name: '', states: parts.join(', ') };
        return { boundary: null, role, name: parts[0] || '', states: parts.slice(1).join(', ') };
      }
      if (ROLE_RE.test(p) && !p.includes(' ')) return { boundary: null, role: p, name: '', states: '' };
      return { boundary: null, role: '', name: p, states: '' }; // bare text node (read verbatim)
    };

    try { await vsr.start({ container: document.body }); }
    catch (e) { return { ok: false, reason: 'vsr-start-failed', steps: [], totalSteps: 0, reachedEnd: false, stoppedEarly: false, wrapped: false, stuckXpath: null }; }

    const steps = [];
    const seenKeys = new Set(); // (xpath|phrase) of recorded announcements — detects a TRUE content cycle
    // stoppedEarly is reserved STRICTLY for a genuine stuck cursor (nn===before). A deadline/cap timeout
    // sets timedOut instead — it is "didn't finish", NOT a trap (audit: long-page false positive).
    let reachedEnd = false, stoppedEarly = false, wrapped = false, stuckXpath = null, timedOut = false;
    const t0 = Date.now();
    for (let i = 0; i < cap; i++) {
      if (Date.now() - t0 > deadlineMs) { timedOut = true; break; }
      const node = vsr.activeNode;
      const phrase = await vsr.lastSpokenPhrase();
      const low = (phrase || '').toLowerCase();
      if (low === 'end of document' || low.startsWith('end of web area')) { reachedEnd = true; break; }
      if (node && inNoscript(node)) { // artifact fix: never surface <noscript> raw markup
        await vsr.next();
        if (!vsr.activeNode) { reachedEnd = true; break; }
        continue;
      }
      const el = toEl(node);
      const xp = el ? getXPath(el) : '';
      // TRUE cycle = the cursor re-reads an IDENTICAL announcement (same node AND phrase). A container's
      // enter ("navigation, Main") and exit ("end of navigation, Main") share a node but differ in phrase,
      // so keying on xpath|phrase never false-triggers — unlike raw node identity, which does.
      const key = xp + '|' + (phrase || '');
      if (seenKeys.has(key)) { wrapped = true; break; }
      seenKeys.add(key);
      const pr = parse(phrase);
      // per-element facts for the downstream order (1.3.2) + meaning (4.1.2) checks: document-relative
      // geometry (reading order vs VISUAL order), the visible text (announced-name vs meaning), and
      // whether the element is natively/ARIA interactive.
      let rect = null, visibleText = '', interactive = false;
      if (el && el.getBoundingClientRect) {
        const r = el.getBoundingClientRect();
        // position:fixed/sticky elements (OR any element under a fixed/sticky ANCESTOR — e.g. links in a
        // pinned nav) are visually PERSISTENT, so adding scrollY would mis-rank them far down the page
        // (audit: tab/reading-order false positive on a scrolled page).
        let pinned = false;
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const pos = getComputedStyle(e).position;
          if (pos === 'fixed' || pos === 'sticky') { pinned = true; break; }
        }
        rect = { x: Math.round(pinned ? r.left : r.left + window.scrollX), y: Math.round(pinned ? r.top : r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
        visibleText = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        interactive = !!(el.matches && el.matches('a[href],button,input,select,textarea,summary,[tabindex],[role=button],[role=link],[role=checkbox],[role=tab],[role=menuitem],[onclick]'));
      }
      steps.push({ index: steps.length, xpath: xp, tag: (el && el.tagName) ? el.tagName.toLowerCase() : null, phrase: phrase || '', role: pr.role, name: pr.name, states: pr.states, boundary: pr.boundary, rect, visibleText, interactive });

      const before = node;
      await vsr.next();
      const nn = vsr.activeNode;
      if (!nn) { reachedEnd = true; break; }            // ran off the end cleanly
      if (nn === before) { stoppedEarly = true; stuckXpath = xp; break; } // FORWARD VSR TRAP: did not advance
    }
    try { await vsr.stop(); } catch (e) {}
    if (!reachedEnd && !stoppedEarly && !wrapped) timedOut = true; // ran out the cap without a clean end
    return { ok: true, steps, totalSteps: steps.length, reachedEnd, stoppedEarly, wrapped, stuckXpath, timedOut };
  }, cap, deadlineMs, ROLE_LEAD).catch((e) => ({ ok: false, reason: 'evaluate-failed: ' + (e && e.message), steps: [], totalSteps: 0, reachedEnd: false, stoppedEarly: false, wrapped: false, stuckXpath: null, timedOut: false }));

  // §5.2.0 — REALISM: overwrite the VSR's mis-voiced NAME slot with Chrome's authoritative CDP axName
  // (Node-side; CDP is unavailable inside the page.evaluate above). Opt-out via { cdpCorrect: false }.
  if (opts.cdpCorrect === false) return result;
  return correctNamesViaCdp(page, result, opts);
}

module.exports = { ensureVsr, collectVsrTranscript, correctNamesViaCdp, cdpAxName, TEXT_FALLBACK_ROLES, VSR_BUILD };
