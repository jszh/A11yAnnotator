'use strict';
// FORMS probe — put each form into its error state the way a user would, and record how the page reports it.
//
// Forms: <form> elements, and form-like groups outside a <form> (fields plus a button in one container).
// Per form, two scenarios, each on a fresh page (navigation blocked, so a submission that goes through is
// recorded rather than followed):
//   empty    — every field cleared, then submitted with the form's own submit control;
//   invalid  — fields with a checkable constraint (email, url, tel, number, pattern, min/max length) get a value
//              that violates it, every other required field gets a plausible valid value, then submit;
//   valid    — every field gets a plausible valid value, then submit (success and progress messages appear here).
// After each: which fields the page flags as invalid (native constraint validation, aria-invalid, :invalid, a
// changed border/label colour), the browser's own validation message, error text the page shows and how it is
// tied to the field (aria-describedby / aria-errormessage / inside the label / nearby), new text and whether it
// landed in a live region, where focus went, native alert() text, whether the submission went through, and
// crops of the form before and after.
const png = require('../lib/png.js');
const { LIVE_SEL, snapBefore, snapAfter, guardNavigation, settleMutations } = require('./delta.js');

const FIELD_SEL = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),select,textarea,[role="textbox"],[role="combobox"],[role="spinbutton"],[contenteditable="true"]';

// in-page: the forms on the page and their fields
function findForms(fieldSel) {
  const X = window.__ia.xpathOf;
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const fieldsIn = (root) => [...root.querySelectorAll(fieldSel)].filter((f) => vis(f) && !f.disabled && !f.readOnly);
  const submitOf = (form) => {
    const cands = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],[role="button"]')].filter(vis);
    return cands.find((b) => (b.tagName === 'BUTTON' && (!b.getAttribute('type') || b.getAttribute('type') === 'submit')) || b.type === 'submit' || b.type === 'image')
      || cands.find((b) => /submit|send|sign|log ?in|register|continue|next|save|apply|search|subscribe|pay|order|book|go\b/i.test(b.innerText || b.value || b.getAttribute('aria-label') || ''))
      || cands[cands.length - 1] || null;
  };
  const out = [];
  const seen = new Set();
  for (const form of document.querySelectorAll('form')) {
    const fields = fieldsIn(form);
    if (!fields.length) continue;
    fields.forEach((f) => seen.add(f));
    const sub = submitOf(form);
    out.push({ xpath: X(form), kind: 'form', submit: sub ? X(sub) : null, novalidate: form.noValidate, fieldXpaths: fields.map(X) });
  }
  // form-like groups: unclaimed fields grouped by the nearest ancestor that also holds a button
  const loose = [...document.querySelectorAll(fieldSel)].filter((f) => vis(f) && !seen.has(f) && !f.disabled);
  const groups = new Map();
  for (const f of loose) {
    let g = f.parentElement;
    for (let d = 0; g && d < 6 && !g.querySelector('button,[role="button"],input[type="button"]'); d++) g = g.parentElement;
    if (!g || g === document.body) continue;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  }
  for (const [g, fs] of groups) {
    const sub = submitOf(g);
    out.push({ xpath: X(g), kind: 'group', submit: sub ? X(sub) : null, novalidate: true, fieldXpaths: fs.map(X) });
  }
  return out;
}

// in-page: a field's constraints and label
function fieldFacts(xp) {
  const f = window.__ia.resolve(xp);
  if (!f) return null;
  const lab = (f.labels && f.labels[0]) || f.closest('label');
  const ids = (a) => (f.getAttribute(a) || '').split(/\s+/).filter(Boolean);
  return {
    xpath: xp, tag: f.tagName.toLowerCase(), type: f.getAttribute('type') || (f.tagName === 'INPUT' ? 'text' : null),
    name: f.getAttribute('name') || f.id || null,
    label: lab ? (lab.innerText || lab.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100) : (f.getAttribute('aria-label') || f.getAttribute('placeholder') || null),
    required: f.required === true || f.getAttribute('aria-required') === 'true',
    pattern: f.getAttribute('pattern'), min: f.getAttribute('min'), max: f.getAttribute('max'),
    minlength: f.getAttribute('minlength'), maxlength: f.getAttribute('maxlength'), inputmode: f.getAttribute('inputmode'),
    autocomplete: f.getAttribute('autocomplete'),
    describedby: ids('aria-describedby'), errormessage: ids('aria-errormessage'),
    options: f.tagName === 'SELECT' ? [...f.options].slice(0, 8).map((o) => o.value) : undefined,
    value: 'value' in f ? String(f.value).slice(0, 60) : null,
  };
}

// in-page: set a field's value as a user would see it change (input + change events)
function setField(xp, value, mode) {
  const f = window.__ia.resolve(xp);
  if (!f) return false;
  if (f.tagName === 'SELECT') {
    const opts = [...f.options];
    const pick = mode === 'empty' ? opts.find((o) => o.value === '') || null : opts.find((o) => o.value && !o.disabled) || null;
    if (pick) f.value = pick.value; else if (mode === 'empty') f.selectedIndex = -1;
  } else if (f.type === 'checkbox' || f.type === 'radio') {
    f.checked = mode !== 'empty' && f.required;
  } else if (f.isContentEditable) {
    f.textContent = mode === 'empty' ? '' : value;
  } else {
    const proto = f.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    try { setter.call(f, mode === 'empty' ? '' : value); } catch (e) { return false; }
  }
  f.dispatchEvent(new Event('input', { bubbles: true }));
  f.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

// in-page: how the page now reports each field
function fieldStates(xps) {
  const vis = (el) => { try { return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }); } catch (e) { return false; } };
  const txt = (el) => (el ? (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200) : '');
  return xps.map((xp) => {
    const f = window.__ia.resolve(xp);
    if (!f) return { xpath: xp, missing: true };
    const cs = getComputedStyle(f);
    const byIds = (a) => (f.getAttribute(a) || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter((n) => n && vis(n)).map(txt).filter(Boolean);
    const lab = (f.labels && f.labels[0]) || f.closest('label');
    return {
      xpath: xp,
      constraintValid: f.validity ? f.validity.valid : null,
      validationMessage: f.validationMessage || null,
      ariaInvalid: f.getAttribute('aria-invalid'),
      cssInvalid: f.matches(':invalid'),
      borderColor: cs.borderTopColor, outline: cs.outlineStyle + ' ' + cs.outlineColor, background: cs.backgroundColor,
      label: lab ? txt(lab) : null,
      describedByText: byIds('aria-describedby'),
      errorMessageText: byIds('aria-errormessage'),
      value: 'value' in f ? String(f.value).slice(0, 60) : null,
    };
  });
}

function invalidValueFor(ff) {
  const t = (ff.type || '').toLowerCase();
  if (t === 'email') return 'not-an-email';
  if (t === 'url') return 'not a url';
  if (t === 'tel') return 'abc';
  if (t === 'number' || t === 'range') return ff.max ? String(Number(ff.max) + 1000) : ff.min ? String(Number(ff.min) - 1000) : null;
  if (t === 'date' || t === 'time' || t === 'datetime-local' || t === 'month' || t === 'week') return null;
  if (ff.pattern) return 'zz##!!';
  if (ff.minlength && Number(ff.minlength) > 1) return 'a';
  if (/e-?mail/i.test(`${ff.name} ${ff.label} ${ff.autocomplete}`)) return 'not-an-email';
  if (/phone|tel\b|mobile/i.test(`${ff.name} ${ff.label} ${ff.autocomplete}`)) return 'abc';
  if (/zip|postal|postcode/i.test(`${ff.name} ${ff.label} ${ff.autocomplete}`)) return 'ZZZZZ!';
  if (/card|cvv|cvc|expir/i.test(`${ff.name} ${ff.label} ${ff.autocomplete}`)) return '12';
  return null;
}

function validValueFor(ff) {
  const t = (ff.type || '').toLowerCase();
  const hint = `${ff.name} ${ff.label} ${ff.autocomplete}`;
  if (t === 'email' || /e-?mail/i.test(hint)) return 'test.user@example.com';
  if (t === 'url') return 'https://example.com';
  if (t === 'tel' || /phone|tel\b|mobile/i.test(hint)) return '2065550123';
  if (t === 'number' || t === 'range') return ff.min ? String(ff.min) : '1';
  if (t === 'date') return '2026-01-15';
  if (t === 'password') return 'Correct-Horse-9';
  if (/zip|postal/i.test(hint)) return '98105';
  if (/name/i.test(hint)) return 'Alex Tester';
  return 'Test value';
}

const grow = (r, m) => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m });

async function formCrop(page, formXp) {
  const r = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el) return null; el.scrollIntoView({ block: 'start' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, formXp);
  if (!r) return null;
  const vp = page.viewport();
  const shot = png.decode(await page.screenshot({ type: 'png', encoding: 'base64', captureBeyondViewport: false }));
  const box = grow(r, 16);
  const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), w: Math.min(vp.width, box.x + box.w) - Math.max(0, box.x), h: Math.min(vp.height, box.y + box.h) - Math.max(0, box.y) };
  if (clip.w < 4 || clip.h < 4) return null;
  return png.cropBase64(shot, clip);
}

async function scenario(session, form, fields, mode) {
  return session.withFreshPage(async (page) => {
    const blocked = await guardNavigation(page);
    const plan = [];
    for (const ff of fields) {
      if (mode === 'empty') plan.push([ff.xpath, '', 'empty']);
      else if (mode === 'valid') plan.push([ff.xpath, validValueFor(ff), 'valid']);
      else {
        const bad = invalidValueFor(ff);
        plan.push([ff.xpath, bad !== null ? bad : validValueFor(ff), bad !== null ? 'invalid' : 'valid']);
      }
    }
    if (mode === 'invalid' && !plan.some((p) => p[2] === 'invalid')) return { mode, skipped: 'no field with a checkable constraint' };
    for (const [xp, v, how] of plan) await page.evaluate(setField, xp, v, how === 'empty' ? 'empty' : 'fill');
    const before = await page.evaluate(snapBefore, LIVE_SEL);
    const imageBefore = await formCrop(page, form.xpath).catch(() => null);
    const statesBefore = await page.evaluate(fieldStates, fields.map((f) => f.xpath));
    // submit the way a user does: click the form's submit control (or Enter in the last field)
    let how = null;
    if (form.submit) {
      const pt = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, form.submit);
      if (pt) { await page.mouse.click(pt.x, pt.y); how = `click ${form.submit}`; }
    }
    if (!how) {
      const last = fields[fields.length - 1];
      await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (el) el.focus(); }, last.xpath);
      await page.keyboard.press('Enter');
      how = `Enter in ${last.xpath}`;
    }
    await settleMutations(page, 500, 3000);
    const after = await page.evaluate(snapAfter, LIVE_SEL, form.submit || fields[0].xpath);
    const states = await page.evaluate(fieldStates, fields.map((f) => f.xpath));
    const imageAfter = await formCrop(page, form.xpath).catch(() => null);
    const nav = blocked();
    const flagged = states.filter((s, i) => s.constraintValid === false || s.ariaInvalid === 'true'
      || (statesBefore[i] && (s.borderColor !== statesBefore[i].borderColor || s.outline !== statesBefore[i].outline || s.background !== statesBefore[i].background)));
    return {
      mode, filled: plan.map(([xp, v, h]) => ({ xpath: xp, value: v, as: h })), submittedBy: how,
      submissionWentThrough: nav.length > 0, navigationBlocked: nav,
      fieldsFlagged: flagged.map((s) => s.xpath),
      fieldStates: states, fieldStatesBefore: statesBefore,
      newText: after.newText, revealed: after.revealed.map((r) => ({ xpath: r.xpath, text: r.text.slice(0, 160) })),
      liveRegionChanges: after.liveRegionChanges, visualChanges: after.visualChanges, timeline: after.timeline,
      focusAfter: after.active, liveRegionsBefore: before.liveRegions,
      nativeDialogs: (page.__dialogs || []).slice(),
      images: { before: imageBefore, after: imageAfter },
    };
  });
}

// in-page: visible text in or near a form that reads as an error or instruction message, as the page is loaded
function restingMessages(formXp) {
  const form = window.__ia.resolve(formXp);
  if (!form) return [];
  const vis = (el) => { try { const r = el.getBoundingClientRect(); return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const scope = form.parentElement || form;
  const out = [];
  for (const el of scope.querySelectorAll('[role="alert"],[aria-live],[class*="error" i],[class*="invalid" i],[id*="error" i],p,span,div,li,small')) {
    if (!vis(el) || el.children.length > 3) continue;
    const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 300) continue;
    const errorish = /error|invalid|required|must|please (enter|provide|select|choose)|incorrect|not valid|problem|fix|try again|too (short|long)|at least|format/i.test(t)
      || /error|invalid/i.test(el.className + ' ' + el.id) || el.getAttribute('role') === 'alert';
    if (!errorish) continue;
    if (out.some((o) => o.el.contains(el))) continue;
    out.push({ el, xpath: window.__ia.xpathOf(el), text: t.slice(0, 200), role: el.getAttribute('role'), live: el.getAttribute('aria-live') });
    if (out.length >= 15) break;
  }
  return out.map(({ el, ...rest }) => rest);
}

const empty = () => ({ forms: [] });

async function run({ session, deadline, partial }) {
  const forms = await session.page.evaluate(findForms, FIELD_SEL);
  const out = partial.forms;
  let truncated = false;
  // how each form presents itself before anyone touches it (a page re-displayed after a failed submit shows its
  // errors at rest)
  const atRest = await session.withFreshPage(async (page) => {
    const m = {};
    for (const form of forms) {
      m[form.xpath] = {
        fieldStates: await page.evaluate(fieldStates, form.fieldXpaths),
        styleOutliers: await page.evaluate((xps) => {
          const els = xps.map((x) => window.__ia.resolve(x)).filter(Boolean);
          const groupOf = (e) => (/^(checkbox|radio)$/.test(e.type) ? e.type : e.tagName === 'SELECT' ? 'select' : 'text-like');
          const out = [];
          const groups = new Map();
          for (const e of els) { const g = groupOf(e); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e); }
          for (const g of groups.values()) {
            if (g.length < 2) continue;
            const sig = (e) => { const cs = getComputedStyle(e); return cs.borderTopColor + '|' + cs.backgroundColor + '|' + cs.outlineColor; };
            const tally = new Map(); for (const e of g) tally.set(sig(e), (tally.get(sig(e)) || 0) + 1);
            const common = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
            for (const e of g) if (sig(e) !== common && tally.get(sig(e)) < g.length / 2) out.push({ xpath: window.__ia.xpathOf(e), style: sig(e), peersStyle: common });
          }
          return out;
        }, form.fieldXpaths),
        messages: await page.evaluate(restingMessages, form.xpath),
        image: await formCrop(page, form.xpath).catch(() => null),
      };
    }
    return m;
  }).catch(() => ({}));
  for (const form of forms) {
    if (deadline.remaining() < 45000) { truncated = true; break; }
    const fields = (await Promise.all(form.fieldXpaths.map((x) => session.page.evaluate(fieldFacts, x)))).filter(Boolean);
    const rec = { ...form, fields, atRest: atRest[form.xpath] || null, scenarios: [] };
    for (const mode of ['empty', 'invalid', 'valid']) {
      if (deadline.remaining() < 30000) { truncated = true; break; }
      try { rec.scenarios.push(await scenario(session, form, fields, mode)); } catch (e) { rec.scenarios.push({ mode, error: String(e && e.message || e).slice(0, 200) }); }
    }
    out.push(rec);
  }
  return { completeness: truncated ? 'truncated' : 'complete', forms: out };
}

module.exports = { run, empty };
