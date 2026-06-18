'use strict';
// Harness 3.1 §5.2.2 — the action→announcement instrument (WCAG 4.1.3 Status Messages). v2.9's
// drive-page triggered an action and checked whether a live region announced; v3 had the VSR but no
// such instrument. This adds it: drive each safe, AT-PERCEIVABLE trigger, observe the DOM change it
// causes, and flag a SOUND barrier — a status message that APPEARS (newly, not re-parented existing
// content) without being in a live region AND without focus moving to it, so a screen-reader user is
// never notified. Sound-first: a false positive (flagging a valid pattern) is the cardinal sin, so we
// flag only when content DEMONSTRABLY newly appeared and was DEMONSTRABLY not announced. Each trigger
// is driven in its OWN page.evaluate so a navigating control cannot discard the findings already
// collected (it just ends the sweep). Non-authoritative shadow signal (memory: vsr-is-harness-instrument).

const LIMITS = require('./limits.js'); // status-detector probe cap (tier F)

// the in-page positional XPath helper, shared by both passes.
const XPATH_FN = `function getXPath(e){
  if(!e||!e.tagName) return '';
  if(e===document.body) return '/html/body';
  if(e===document.documentElement) return '/html';
  var t=e.tagName.toLowerCase(),idx=1,sib=e.previousElementSibling;
  while(sib){ if(sib.tagName===e.tagName) idx++; sib=sib.previousElementSibling; }
  return getXPath(e.parentElement)+'/'+t+'['+idx+']';
}`;

// Detect 4.1.3 status-message gaps. opts: { maxTriggers=25, settleMs=300, minTextLen=3 }.
// COVERAGE (Harness 3.3 A4 / Decision C): this instrument is INSERTION-ONLY — it observes content that is
// newly ADDED to the DOM, so a status revealed by toggling `hidden`/`display`/`aria-hidden` on a
// PRE-RENDERED node (addedCount=0) is invisible to it (audit B3). That class is NOT covered here; the
// returned `coverageMode:'insertion-only'` makes the limitation explicit rather than silently complete.
async function detectStatusMessages(page, opts = {}) {
  const maxTriggers = Number.isFinite(opts.maxTriggers) ? opts.maxTriggers : LIMITS.instruments.statusMaxTriggers; // A4: ≥12 (the old cap truncated coverage)
  const settleMs = Number.isFinite(opts.settleMs) ? opts.settleMs : 300;
  const minTextLen = Number.isFinite(opts.minTextLen) ? opts.minTextLen : 3;

  // PASS 1 (Node-side list): enumerate the SAFE + AT-PERCEIVABLE trigger xpaths up front, so the driving
  // loop is one isolated evaluate per trigger (navigation-resilient). A trigger is excluded when it is
  // not in the a11y tree (display:none / visibility:hidden / opacity:0 / inside aria-hidden) — a control
  // no AT user can reach cannot present a 4.1.3 barrier (adversarial B-HIGH-1/2) — or when it would
  // navigate (submit/reset/href/scripted location change), which would end the page. A4: the selector is
  // widened beyond buttons to other activatable controls (checkbox/radio/switch/tab/menuitem/link), and
  // the total count is returned so truncation past the cap is reported, not silently dropped.
  const enumed = await page.evaluate((maxTriggers, XPATH_SRC) => {
    eval(XPATH_SRC); // eslint-disable-line no-eval — defines getXPath in this scope
    const NAV_RE = /location\s*[.=]|\.href|window\.open|\.submit\s*\(|history\.(push|replace|go|back|forward)/i;
    const isPerceivable = (el) => {
      if (el.closest && el.closest('[aria-hidden="true"]')) return false;
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false; // display:none
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      return true;
    };
    const isSafe = (el) => {
      const type = (el.getAttribute('type') || el.type || '').toLowerCase();
      if (el.tagName === 'A' && el.getAttribute('href')) return false;
      if (type === 'submit' || type === 'reset' || type === 'image') return false;
      if (el.tagName === 'BUTTON' && !type && el.form) return false; // default-submit inside a form
      if (el.disabled) return false;
      const oc = el.getAttribute('onclick') || '';
      if (NAV_RE.test(oc)) return false;                 // inline scripted navigation — would end the page
      if (el.closest && el.closest('a[href]')) return false; // nested inside a link
      return true;
    };
    const SEL = 'button,[role="button"],input[type="button"],input[type="checkbox"],input[type="radio"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="link"]';
    const all = [...document.querySelectorAll(SEL)].filter((el) => isPerceivable(el) && isSafe(el));
    return { xpaths: all.slice(0, maxTriggers).map((el) => getXPath(el)), total: all.length };
  }, maxTriggers, XPATH_FN).catch(() => ({ xpaths: [], total: 0 }));
  const xpaths = enumed.xpaths;

  // PASS 2 (one isolated evaluate per trigger): drive it, observe the change, judge soundly.
  const findings = [];
  for (const xp of xpaths) {
    let res;
    try {
      res = await page.evaluate(async (xp, settleMs, minTextLen, XPATH_SRC) => {
        eval(XPATH_SRC); // eslint-disable-line no-eval
        const LIVE = '[aria-live="polite"],[aria-live="assertive"],[role="status"],[role="alert"],[role="log"],[role="alertdialog"],output';
        const toEl = (n) => { while (n && n.nodeType !== 1) n = n.parentNode; return n; };
        const inLiveRegion = (n) => { const e = toEl(n); return !!(e && e.closest && e.closest(LIVE)); };
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const trig = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!trig) return { finding: null };

        // snapshot what is ALREADY on the page, so re-parenting / revealing pre-existing visible content
        // is not mistaken for a NEW status message (adversarial B-HIGH-3).
        const beforeText = norm(document.body.innerText).toLowerCase();
        const added = [];
        const obs = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.type === 'childList') for (const n of m.addedNodes) { const t = norm(n.textContent); if (t) added.push({ node: n, text: t }); }
            else if (m.type === 'characterData') { const t = norm(m.target.textContent); if (t) added.push({ node: m.target, text: t }); }
          }
        });
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        const focusBefore = document.activeElement;
        try { trig.click(); } catch (e) { /* a handler threw — no judgement */ }
        await new Promise((r) => setTimeout(r, settleMs));
        obs.disconnect();

        let msgs = added.filter((a) => a.text.length >= minTextLen
          && a.node !== trig && !(trig.contains && trig.contains(a.node))
          && !beforeText.includes(a.text.toLowerCase())); // genuinely NEW text, not pre-existing/relocated
        // DISCLOSURE / TAB exclusion (A4 / audit B3): a control that EXPANDS its own aria-controls target
        // (aria-expanded toggled true) or reveals its tabpanel is rendering PRIMARY content, not a 4.1.3
        // status message — exclude content inside that controlled region (lazy-rendered disclosure bodies).
        const role = (trig.getAttribute('role') || '').toLowerCase();
        const expandedNow = trig.getAttribute('aria-expanded') === 'true';
        const controlsEls = (trig.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
        const isDisclosureReveal = (node) => {
          const e = toEl(node); if (!e) return false;
          if ((expandedNow || role === 'tab') && controlsEls.some((c) => c === e || c.contains(e))) return true;
          if (role === 'tab' && e.closest && e.closest('[role="tabpanel"]')) return true;
          return false;
        };
        msgs = msgs.filter((a) => !isDisclosureReveal(a.node));
        if (!msgs.length) return { finding: null }; // nothing new appeared (or only disclosure/tab content) → not a status (sound)
        if (msgs.some((a) => inLiveRegion(a.node))) return { finding: null }; // announced via a live region
        const focusEl = document.activeElement;
        const focusMovedToMsg = focusEl && focusEl !== focusBefore && msgs.some((a) => { const e = toEl(a.node); return e && (e === focusEl || e.contains(focusEl) || (focusEl.contains && focusEl.contains(e))); });
        if (focusMovedToMsg) return { finding: null }; // perceivable: focus moved into the new content

        const target = toEl(msgs[0].node) || trig;
        return { finding: {
          sc: '4.1.3', kind: 'status-not-announced',
          xpath: getXPath(target), trigger: getXPath(trig),
          detail: `activating ${JSON.stringify(norm(trig.innerText || trig.textContent).slice(0, 40))} added new visible text that is NOT in a live region and did NOT move focus — a screen-reader user is not notified (message: ${JSON.stringify(msgs[0].text.slice(0, 60))})`,
        } };
      }, xp, settleMs, minTextLen, XPATH_FN);
    } catch (e) { break; } // the page navigated / context was destroyed — keep the findings gathered so far
    if (res && res.finding) findings.push(res.finding);
  }
  // A4: report coverage honestly — how many triggers were probed, whether the cap truncated the sweep, and
  // that this instrument only sees INSERTED status (not hidden/display toggles on pre-rendered nodes).
  const coverageTruncated = enumed.total > xpaths.length;
  return { findings, coverageMode: 'insertion-only', triggersProbed: xpaths.length, triggersTotal: enumed.total, coverageTruncated, unprobedTriggers: Math.max(0, enumed.total - xpaths.length) };
}

module.exports = { detectStatusMessages };
