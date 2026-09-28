'use strict';
// 4.1.3 Status Messages — a status message can be presented to assistive technology without receiving focus.
const { labelOf } = require('./common.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

// Every user action (activating a control, submitting a form) — and the page left alone — that changed text, a
// live region (including emptying it) or a status icon without the user asking to open anything.
function actions(activation, forms) {
  const out = [];
  const changed = (k) => k && ((k.newText && k.newText.length) || (k.liveRegionChanges && k.liveRegionChanges.length) || (k.visualChanges && k.visualChanges.length));
  for (const c of (activation && activation.controls) || []) {
    const k = c.keyboard && c.keyboard.effect ? c.keyboard : c.pointer && c.pointer.effect ? c.pointer : null;
    if (!changed(k)) continue;
    out.push({ trigger: c.xpath, how: k.mode === 'keyboard' ? `${k.key} on the control` : 'mouse click on the control', k, disclosure: c.kind === 'disclosure' });
  }
  for (const t of (activation && activation.typed) || []) out.push({ trigger: t.xpath, how: `${t.typed} in the field`, k: t, typed: true });
  const idle = activation && activation.idle;
  if (idle && !idle.error && changed(idle)) out.push({ trigger: null, how: `no user action — the page left alone for ${Math.round(idle.waitedMs / 1000)} s after load`, k: idle, idle: true });
  for (const f of (forms && forms.forms) || []) {
    for (const s of f.scenarios || []) {
      if (s.error || s.skipped || !changed(s)) continue;
      out.push({ trigger: f.submit || f.xpath, how: `${s.mode} form submission (${s.submittedBy})`, k: { newText: s.newText, liveRegionChanges: s.liveRegionChanges, visualChanges: s.visualChanges, timeline: s.timeline, focus: { after: s.focusAfter }, revealed: s.revealed, nativeDialogs: s.nativeDialogs, navigationBlocked: s.navigationBlocked, liveRegionsBefore: s.liveRegionsBefore }, form: true });
    }
  }
  return out;
}

module.exports = {
  sc: '4.1.3', title: 'Status Messages',
  probes: ['activation', 'forms'],
  tools: toolsOf('4.1.3'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.any(S.live, S.formish, S.interactive) },

  identify(model, { activation, forms }) {
    const out = [];
    for (const a of actions(activation, forms)) {
      const k = a.k;
      const f = k.focus && k.focus.after;
      const focused = (x) => !!f && (x === f || x.startsWith(f + '/') || f.startsWith(x + '/'));
      const base = a.idle ? 'without-user-action' : a.typed ? 'after-typing' : a.form ? 'after-submission' : 'after-activation';
      const texts = (k.newText || []).filter((t) => !focused(t.xpath));
      // each change is its own candidate: new text outside any live region that existed before; each live region
      // whose content changed (including being emptied); each icon/image that changed
      for (const t of texts.filter((t) => !(t.liveRegion && t.liveRegion.preExisted)).slice(0, 6)) out.push({ xpath: t.xpath, kind: `${base}:text`, a, texts: [t], regions: [], icons: [] });
      for (const r of (k.liveRegionChanges || []).filter((r) => !focused(r.xpath)).slice(0, 4)) out.push({ xpath: r.xpath, kind: `${base}:live-region`, a, texts: texts.filter((t) => t.xpath === r.xpath || t.xpath.startsWith(r.xpath + '/')), regions: [r], icons: [] });
      for (const i of (k.visualChanges || []).slice(0, 4)) out.push({ xpath: i.xpath, kind: `${base}:icon`, a, texts: [], regions: [], icons: [i] });
      if ((k.newText || []).length && !texts.length) out.push({ xpath: k.newText[0].xpath, kind: 'focused-content', a, texts: k.newText, regions: [], icons: [] });
    }
    return out;
  },

  assess(c) {
    const { k, disclosure } = c.a;
    if (c.kind === 'focused-content') return { status: 'NOT_APPLICABLE', rule: 'content-receives-focus', reason: 'Focus moves to the new content, so it is not a status message (4.1.3 covers messages that do not receive focus).' };
    if (k.navigationBlocked && k.navigationBlocked.length) return { status: 'NOT_APPLICABLE', rule: 'change-of-context', reason: `The action navigates (${k.navigationBlocked[0]}); a new page is a change of context, not a status message.` };
    const inModal = (x) => k.modal && (x === k.modal || x.startsWith(k.modal + '/'));
    if (k.modal && c.texts.length && c.texts.every((t) => inModal(t.xpath)) && !c.regions.length && !c.icons.length) return { status: 'NOT_APPLICABLE', rule: 'dialog-opened', reason: 'The new text is the content of a dialog the action opened, not a status message.' };
    if (disclosure && c.texts.length && c.texts.every((t) => t.cause === 'revealed') && !c.regions.length && !c.icons.length) return { status: 'NOT_APPLICABLE', rule: 'disclosed-content', reason: 'The control is a disclosure and the text is the content it discloses, not a status message.' };
    // whether this is a status message, and whether assistive technology gets it (a live region existing is not
    // enough — what it announces depends on atomicity, timing, removal, and whether the visible message matches)
    return { status: 'OPEN', rule: 'possible-status-message' };
  },

  evidence(c, obs, model) {
    const { k } = c.a;
    return {
      facts: {
        action: c.a.trigger ? `${c.a.how}: ${c.a.trigger} "${labelOf(model, c.a.trigger)}"` : c.a.how,
        thisChange: c.regions.length ? { liveRegionUpdate: c.regions[0] } : c.icons.length ? { iconOrImageChange: c.icons[0] } : { text: c.texts[0], insideALiveRegionThatExistedBefore: !!(c.texts[0] && c.texts[0].liveRegion && c.texts[0].liveRegion.preExisted) },
        textsInThisChange: c.texts.slice(0, 8).map((t) => ({ path: t.xpath, text: t.text, cause: t.cause, liveRegion: t.liveRegion })),
        otherChangesFromTheSameAction: { newText: (k.newText || []).filter((t) => !c.texts.includes(t)).slice(0, 8).map((t) => ({ path: t.xpath, text: t.text.slice(0, 80), liveRegion: t.liveRegion ? t.liveRegion.politeness : null })), liveRegionUpdates: (k.liveRegionChanges || []).filter((r) => !c.regions.includes(r)).length },
        liveRegionsBeforeTheAction: (k.liveRegionsBefore || []).slice(0, 10),
        timelineDuringTheAction: (k.timeline || []).slice(0, 25),
        revealedRegions: (k.revealed || []).map((r) => ({ path: r.xpath, text: (r.text || '').slice(0, 100) })),
        focusAfter: k.focus && k.focus.after,
        nativeDialogs: k.nativeDialogs && k.nativeDialogs.length ? k.nativeDialogs : undefined,
      },
    };
  },
};
