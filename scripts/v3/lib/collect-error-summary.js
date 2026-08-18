'use strict';
// SC 3.3.1 — ERROR SUMMARY vs FLAGGED STATE coherence.
//
// The 3.3.1 evidence lane is entirely PER-FIELD: `probeFormError` submits an invalid value and asks whether
// THAT field's error surfaced and is associated. A page-level ERROR SUMMARY — the GOV.UK-style `role="alert"`
// block listing "There is a problem" with links to each bad field — is invisible to it. So a summary that
// names the WRONG fields is unobservable: every field the probe examines is individually fine or individually
// broken, and the disagreement between the summary and reality lives in neither.
//
// That disagreement matters. 3.3.1's Understanding frames the intent as ensuring "users are aware that an
// error has occurred and can determine what is wrong". A `role="alert"` that tells a screen-reader user to fix
// two fields which are valid, while never mentioning the one that is not, defeats determining what is wrong
// even though every individual field is marked up correctly.
//
// This reports the CORRESPONDENCE as a fact — which fields the summary names, which are actually flagged, and
// the two set differences. It decides nothing: a summary may legitimately name a field whose error is
// server-side and not yet reflected in `aria-invalid`, and that judgment is the rubric's.
function collectErrorSummary() {
  const MAX = 12;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const visible = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // A SUMMARY is a block that (a) presents itself as an error announcement, and (b) points at fields. The
  // second half is what makes the correspondence checkable — a bare "something went wrong" banner names
  // nothing and is not in scope here.
  const SUMMARY_SEL = '[role="alert"], [role="alertdialog"], [class*="error-summary" i], [class*="errorsummary" i], [id*="error-summary" i]';
  const FIELD_SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea';

  const fields = [...document.querySelectorAll(FIELD_SEL)].filter(visible);
  const flagged = fields.filter((f) => {
    if (f.getAttribute('aria-invalid') === 'true') return true;
    // an associated, non-empty error description counts as flagged even without aria-invalid
    const ids = ((f.getAttribute('aria-errormessage') || '') + ' ' + (f.getAttribute('aria-describedby') || '')).split(/\s+/).filter(Boolean);
    for (const id of ids) {
      const n = document.getElementById(id);
      if (n && /error|invalid|problem|must|required/i.test(norm(n.textContent)) && norm(n.textContent).length > 0) return true;
    }
    return false;
  });
  const idOf = (f) => f.id || f.getAttribute('name') || xpathOf(f);
  // The correspondence is keyed by `idOf`, which is the right identity for SET arithmetic but is not resolvable
  // by a downstream consumer: the collected element records carry neither `id` nor `name`, so a per-field
  // consumer (the 3.3.1 rubric judges ONE field at a time) could not tell which of these keys is the field in
  // front of it, except in the id-less case where the key happens to BE an xpath. Publish the xpath ALONGSIDE
  // every key so that join is exact for every field. First-wins on a duplicate key, matching the Set below, so
  // `flaggedFields[i]` and `flaggedFieldsXpath[i]` stay index-aligned by construction.
  const flaggedByKey = new Map();
  for (const f of flagged) { const k = idOf(f); if (!flaggedByKey.has(k)) flaggedByKey.set(k, xpathOf(f)); }
  const flaggedIds = new Set(flaggedByKey.keys());

  const out = [];
  for (const box of document.querySelectorAll(SUMMARY_SEL)) {
    if (!visible(box)) continue;
    if (box.querySelector(FIELD_SEL)) continue;                 // a form section, not a summary ABOUT one
    // Which fields does it NAME? Two mechanisms, both common: in-page links to a field id, and plain text
    // that matches a field's visible label.
    const named = new Set();
    const namedVia = [];
    for (const a of box.querySelectorAll('a[href^="#"]')) {
      const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!target) continue;
      const field = target.matches(FIELD_SEL) ? target : target.querySelector(FIELD_SEL);
      // `fieldXpath` is the element this entry RESOLVED to. It matters most on this branch: `text` here is the
      // summary link's own prose (a whole instruction sentence), not the field's label, so a consumer cannot
      // join on it without guessing — and one summary line routinely contains ANOTHER field's label, so the
      // guess would be wrong rather than merely absent. A wrong correspondence is worse than none.
      if (field) { named.add(idOf(field)); namedVia.push({ via: 'link', text: norm(a.textContent).slice(0, 70), field: idOf(field), fieldXpath: xpathOf(field) }); }
    }
    if (!named.size) {
      // No links — match the summary's text against each field's visible label.
      const summaryText = norm(box.textContent).toLowerCase();
      for (const f of fields) {
        const lab = f.labels && f.labels[0] ? norm(f.labels[0].textContent) : '';
        if (lab.length >= 3 && summaryText.includes(lab.toLowerCase())) {
          named.add(idOf(f));
          namedVia.push({ via: 'label-text', text: lab.slice(0, 70), field: idOf(f), fieldXpath: xpathOf(f) });
        }
      }
    }
    // PHANTOM ENTRIES — a summary line that names a field which does not exist on the page at all. A set
    // difference over EXISTING fields structurally cannot show this (there is nothing to difference
    // against), and it is a real shape: a summary listing a requirement for a field the form does not have
    // sends the user hunting for a control that is not there. Reported separately for that reason.
    const unresolved = [];
    for (const li of box.querySelectorAll('li, p')) {
      const t = norm(li.textContent);
      if (t.length < 6) continue;
      if (li.querySelector('a[href^="#"]')) continue;            // a link entry: resolution already attempted
      const claimsField = /\b(is required|must be|enter|choose|select|provide|missing|invalid)\b/i.test(t);
      if (!claimsField) continue;
      const matchesAField = fields.some((f) => {
        const lab = f.labels && f.labels[0] ? norm(f.labels[0].textContent).toLowerCase() : '';
        return lab.length >= 3 && t.toLowerCase().includes(lab.toLowerCase());
      });
      if (!matchesAField) unresolved.push(t.slice(0, 90));
    }
    if (!named.size && !unresolved.length) continue;              // names nothing resolvable ⇒ not checkable
    const namedNotFlagged = [...named].filter((k) => !flaggedIds.has(k));
    const flaggedNotNamed = [...flaggedIds].filter((k) => !named.has(k));
    out.push({
      xpath: xpathOf(box),
      role: box.getAttribute('role') || null,
      text: norm(box.textContent).slice(0, 160),
      namedFields: [...named].slice(0, MAX),
      flaggedFields: [...flaggedIds].slice(0, MAX),
      // index-aligned with `flaggedFields`. A field that is FLAGGED but never NAMED appears in no `namedVia`
      // entry at all, so this is the ONLY way to resolve it to an element — and that is exactly the
      // `flaggedButNotNamed` shape the correspondence exists to report.
      flaggedFieldsXpath: [...flaggedByKey.values()].slice(0, MAX),
      namedButNotFlagged: namedNotFlagged.slice(0, MAX),
      flaggedButNotNamed: flaggedNotNamed.slice(0, MAX),
      // a summary line naming a field the form does not contain — see the comment above
      namedFieldNotOnPage: unresolved.slice(0, 6),
      coherent: namedNotFlagged.length === 0 && flaggedNotNamed.length === 0 && unresolved.length === 0,
      namedVia: namedVia.slice(0, MAX),
    });
    if (out.length >= 4) break;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SC 3.3.1 — THE ERROR STATE THAT IS ALREADY PRESENT AT REST (server-rendered redisplay).
//
// WHY THIS EXISTS. The 3.3.1 evidence lane is a BEFORE/AFTER driver: submit an invalid value, then ask whether
// the field's error surfaced and is associated. On a server-rendered redisplay that driver is guaranteed to
// abstain and, worse, to destroy the evidence. These pages carry the error state AS LOADED — the form came
// back from the server with the bad value still in the box, an error class on it, and a message beside it —
// and they have no client-side validation to trigger: no script at all, and `novalidate` on the form. Driving
// an interaction on them does not reveal anything; it CLEARS things. Observed on such pages: after the probe,
// "the card number field emptied" and "the date field cleared to its placeholder". The barrier only ever
// existed in the state the page loaded in, and every lane that could have seen it was pointed at a later one.
//
// So state the at-rest observation directly: is this field flagged AS LOADED, does it still hold the value
// that was rejected, and is there error TEXT with it. That is the observation the judgment actually needs
// here, and it is available without touching the page.
//
// GATED so it is not a tax on every form: records are emitted only for a form in which at least one field is
// flagged at rest. A form that loads clean has no at-rest error state to describe and gets nothing. Within
// such a form EVERY field is described, because "this field is NOT the flagged one" is the fact that stops a
// neighbouring field's red border being read onto it.
//
// DECIDES NOTHING. Whether the error is identified adequately — whether the text says what is wrong, whether
// it is associated, whether an icon alone would do — is the rubric's.
//
// Self-contained so it serializes through page.evaluate.
function collectAtRestErrorState() {
  const MAX_FIELDS = 14, MAX_TEXT = 160;
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.documentElement) return '/html';
    if (e === document.body && e.tagName === 'BODY') return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const clip = (s, n) => norm(s).slice(0, n);
  const visible = (e) => {
    if (!e || !e.tagName) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // TIGHT on purpose. A first pass used a loose word list (`must`, `check`, `required`) and reported ordinary
  // prose as an error announcement — a printed booking policy ("requests must be made at least 14 days in
  // advance") and a checkout step header both matched. Saying "this page announces an error" when it does not
  // is the exact over-claim that would let a silent redisplay be read as a page that reports its errors.
  const ERROR_WORD = /\b(error|errors|invalid|not valid|isn't valid|incorrect|problem|problems|went wrong|failed|rejected|unable to|please (correct|fix|re-?enter)|try again)\b/i;
  // `err` is in the list as its own TOKEN (batch-3 #1b): the abbreviated class (`err`, `err-msg`, `field_err`)
  // is a common authoring shorthand, and missing it made this collector report "no error text" on a redisplay
  // whose message block carried exactly that class. The token delimiters keep it a whole-token match — an
  // unrelated word that merely CONTAINS the letters (an errand, a deferred flag) cannot fire it.
  const ERROR_CLASS = /(^|[-_ ])(err|error|invalid|danger|warn|warning|has-error|is-invalid|field-error)([-_ ]|$)/i;
  const classesOf = (e) => (e && e.classList ? Array.prototype.slice.call(e.classList, 0, 8) : []);
  const anyErrorClass = (e) => classesOf(e).some((c) => ERROR_CLASS.test(c));
  const idsText = (e, attr) => {
    const v = e.getAttribute(attr);
    if (!v) return null;
    let t = '', ok = false;
    for (const id of v.trim().split(/\s+/).slice(0, 4)) {
      let n = null;
      try { n = document.getElementById(id); } catch (err) { n = null; }
      if (n) { ok = true; t += ' ' + (n.textContent || ''); }
    }
    return ok ? clip(t, MAX_TEXT) : null;
  };
  const hasIcon = (e) => !!(e && e.querySelector && e.querySelector('img, svg, [role="img"]'));
  // The visual signature of the flagged state, as loaded — kept per side because a one-sided accent bar is a
  // real idiom, and collapsed to one string when the four sides agree (which is most of the byte budget).
  const borderSig = (cs) => {
    const s = [];
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const st = cs['border' + side + 'Style'];
      const w = parseFloat(cs['border' + side + 'Width']) || 0;
      s.push((st === 'none' || st === 'hidden' || w === 0) ? 'none' : (Math.round(w * 10) / 10) + 'px ' + st + ' ' + cs['border' + side + 'Color']);
    }
    return new Set(s).size === 1 ? s[0] : s.join(' | ');
  };

  const FIELD_SEL = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea';
  const fields = [].slice.call(document.querySelectorAll(FIELD_SEL)).filter(visible);
  if (!fields.length) return [];

  // PAGE SHAPE — the two facts that say a before/after driver cannot help here. Counted, not judged.
  const scriptCount = document.querySelectorAll('script').length;

  const facts = fields.map((el) => {
    const cs = getComputedStyle(el);
    const block = el.parentElement;
    let form = null; try { form = el.closest('form'); } catch (err) { form = null; }
    let cssInvalid = false; try { cssInvalid = el.matches(':invalid'); } catch (err) { cssInvalid = false; }
    // The error TEXT that travels with this field: programmatically associated first, then a visible sibling
    // that reads as an error. The distinction is reported, never collapsed — an unassociated message is
    // exactly the shape 3.3.1 is about.
    const errMsg = idsText(el, 'aria-errormessage');
    const describedBy = idsText(el, 'aria-describedby');
    let adjacentText = null, adjacentXpath = null;
    if (block) {
      for (const n of block.querySelectorAll('*')) {
        if (n === el || n.matches(FIELD_SEL)) continue;
        const t = norm(n.textContent);
        if (!t || t.length < 3 || t.length > 200) continue;
        if (!visible(n)) continue;
        if (anyErrorClass(n) || ERROR_WORD.test(t)) { adjacentText = clip(t, MAX_TEXT); adjacentXpath = xpathOf(n); break; }
      }
    }
    const associatedErrorText = (errMsg && ERROR_WORD.test(errMsg) ? errMsg : null)
      || (describedBy && ERROR_WORD.test(describedBy) ? describedBy : null);
    const indicators = [];
    if (el.getAttribute('aria-invalid') === 'true') indicators.push('aria-invalid=true');
    if (anyErrorClass(el)) indicators.push('error class on the control');
    if (block && anyErrorClass(block)) indicators.push('error class on the containing block');
    if (errMsg) indicators.push('aria-errormessage');
    if (associatedErrorText) indicators.push('associated error text');
    if (!associatedErrorText && adjacentText) indicators.push('adjacent error text (not programmatically associated)');
    // The icon is NOT judged here. Whether an image beside a field means "error" is only decidable by
    // comparing it with the other fields of the same form — an icon every field carries is furniture — so the
    // comparison happens below, with the border one, and only the raw presence and its alt are recorded now.
    const icon = block ? block.querySelector('img, svg, [role="img"]') : null;
    const value = (el.tagName.toLowerCase() === 'select')
      ? clip((el.selectedOptions && el.selectedOptions[0] && el.selectedOptions[0].textContent) || '', 60)
      : clip(el.value || '', 60);
    return {
      el, form, cs,
      xpath: xpathOf(el),
      label: (() => {
        let lab = null;
        try { if (el.labels && el.labels.length) lab = el.labels[0]; } catch (err) { lab = null; }
        if (!lab) { try { lab = el.closest('label'); } catch (err) { lab = null; } }
        return lab ? clip(lab.textContent, 80) : clip(el.getAttribute('aria-label') || '', 80) || null;
      })(),
      border: borderSig(cs), background: cs.backgroundColor, color: cs.color,
      appearance: borderSig(cs) + ' / bg ' + cs.backgroundColor,
      blockHasIcon: !!icon,
      blockIconAlt: icon ? clip(icon.getAttribute('alt') != null ? icon.getAttribute('alt') : (icon.getAttribute('aria-label') || ''), 60) : null,
      retainedValue: value || null,
      hasRetainedValue: !!value,
      cssInvalid,
      associatedErrorText,
      adjacentErrorText: associatedErrorText ? null : adjacentText,
      adjacentErrorTextXpath: associatedErrorText ? null : adjacentXpath,
      indicators,
      flagged: indicators.length > 0,
    };
  });

  // Is there error-shaped TEXT anywhere on the page at all? In the SILENT redisplay shape this is false, and
  // that is the whole observation: the form came back carrying the rejected values with nothing anywhere
  // saying so. Counted over the document, not the form, because a summary block usually sits outside it.
  let pageErrorText = null;
  for (const n of document.querySelectorAll('p, div, span, li, strong, h1, h2, h3, [role="alert"], [role="status"]')) {
    if (n.querySelector && n.querySelector(FIELD_SEL)) continue;
    if (!visible(n)) continue;
    const t = norm(n.textContent);
    if (t.length < 4 || t.length > 200) continue;
    // role="status" is deliberately NOT enough on its own: a status region reading "Thank you — your order is
    // being processed" is not an error announcement, and counting it as one would let the very page shape this
    // exists for (a redisplay whose banner reads as success) look like a page that reports its errors.
    const announces = String(n.getAttribute('role') || '').toLowerCase() === 'alert';
    if (announces || anyErrorClass(n) || ERROR_WORD.test(t)) { pageErrorText = clip(t, MAX_TEXT); break; }
  }

  // THE GATE + the peer reading. Two shapes qualify, and the second one is why the gate is not simply
  // "something is flagged":
  //   · a field is FLAGGED as loaded — the ordinary server redisplay with its errors rendered; and
  //   · the form is NOT PRISTINE — it already holds values as loaded while nothing at all is flagged. That is
  //     the SILENT redisplay, where the barrier is precisely the ABSENCE of any indication, so a gate keyed on
  //     an indication being present is guaranteed to describe every page except the ones that need it.
  // A form that loads empty and clean matches neither and costs its prompts nothing.
  const byForm = new Map();
  for (const f of facts) {
    const k = f.form ? xpathOf(f.form) : 'document';
    if (!byForm.has(k)) byForm.set(k, []);
    byForm.get(k).push(f);
  }
  // THE BASELINE a visually-marked field is different FROM. Two rules, in this order, and the order matters:
  //   1. the border shared by the fields that carry NO marked-up indicator at all. That is the DEFAULT
  //      appearance by definition.
  //   2. only when NOTHING on the form is marked up — the pure-colour page, where rule 1 has no clean set to
  //      read — the modal border, requiring a real majority.
  // Doing it the other way round inverts on a form where MOST fields are in the error state: measured on a
  // five-field form with three fields flagged in red, the mode IS the red border, and the two ordinary fields
  // get reported as the ones that look different. Telling a judge that a clean field is visually marked is
  // precisely the false counter-fact this whole lane exists to remove.
  // Computed BEFORE the gate, because a border delta is itself one of the things the gate opens on.
  const peerBorderOf = new Map();
  for (const [k, group] of byForm) {
    let peer = null;
    const clean = group.filter((f) => f.indicators.length === 0);
    if (clean.length >= 2 && new Set(clean.map((f) => f.appearance)).size === 1) peer = clean[0].appearance;
    else if (!group.some((f) => f.indicators.length) && group.length >= 3) {
      const tally = new Map();
      for (const f of group) tally.set(f.appearance, (tally.get(f.appearance) || 0) + 1);
      let best = 0;
      for (const [b, n] of tally) if (n > best) { best = n; peer = b; }
      if (!(best >= 2 && best >= Math.ceil(group.length * 0.6))) peer = null;
    }
    peerBorderOf.set(k, peer);
    // ...and the same comparison for an ICON sitting with the field. An icon EVERY field carries is form
    // furniture; an icon only some fields carry is a marker. Only the minority side is marked, and only when
    // there is a genuine majority without one.
    const withIcon = group.filter((f) => f.blockHasIcon).length;
    const iconMarks = group.length >= 2 && withIcon > 0 && withIcon <= Math.floor(group.length / 2);
    for (const f of group) {
      if (peer != null && f.appearance !== peer) { f.indicators.push('border/background differs from the other fields of this form'); f.flagged = true; }
      if (iconMarks && f.blockHasIcon) { f.indicators.push('an image/icon sits with this field and not with the other fields of this form'); f.flagged = true; }
    }
  }
  const out = [];
  for (const [k, group] of byForm) {
    const peerBorder = peerBorderOf.get(k) || null;
    const anyFlagged = group.some((f) => f.flagged);
    const prefilled = group.filter((f) => f.hasRetainedValue).length;
    if (!anyFlagged && !prefilled) continue;
    for (const f of group) {
      if (out.length >= MAX_FIELDS) break;
      const differs = peerBorder != null && f.appearance !== peerBorder;
      out.push({
        xpath: f.xpath,
        label: f.label,
        flaggedAtRest: f.flagged,
        indicators: f.indicators,
        retainedValue: f.retainedValue,
        hasRetainedValue: f.hasRetainedValue,
        cssInvalid: f.cssInvalid,
        border: f.border,
        background: f.background,
        blockHasIcon: f.blockHasIcon,
        blockIconAlt: f.blockIconAlt,
        peerFieldAppearance: peerBorder,
        appearanceDiffersFromPeers: peerBorder == null ? null : differs,
        associatedErrorText: f.associatedErrorText,
        adjacentErrorText: f.adjacentErrorText,
        adjacentErrorTextXpath: f.adjacentErrorTextXpath,
        formFieldCount: group.length,
        flaggedFieldCount: group.filter((x) => x.flagged).length,
        prefilledFieldCount: prefilled,
        pageErrorTextPresent: pageErrorText != null,
        pageErrorTextSample: pageErrorText,
        pageScriptCount: scriptCount,
        formNoValidate: !!(f.form && f.form.hasAttribute('novalidate')),
        uncertainReason: 'this is the state the page was ALREADY IN when it loaded, read off the live DOM before any '
          + 'interaction. On a form the server re-renders with the submitted values, the error state exists ONLY here: '
          + 'there is nothing to trigger, and a before/after interaction probe does not reveal it, it DESTROYS it — '
          + 'submitting or retyping clears the retained value and the message that came back with it. So a probe that '
          + '"found nothing after interacting", or a driver transcript showing the field emptying, has established '
          + 'NOTHING about this page; it is the probe erasing the evidence. `pageScriptCount` and `formNoValidate` say '
          + 'whether client-side validation could exist here at all. `flaggedAtRest`/`indicators` is what marks THIS '
          + 'field; `peerFieldAppearance`/`appearanceDiffersFromPeers` is the measured comparison with the other fields of the '
          + 'same form; `associatedErrorText` vs `adjacentErrorText` separates a message the control points at from one '
          + 'merely sitting beside it. `prefilledFieldCount` > 0 with nothing flagged and `pageErrorTextPresent` false '
          + 'is a form carrying values with no indication of any kind — which is what a silent redisplay looks like AND '
          + 'what an ordinary pre-filled form looks like, so it is not on its own evidence that anything was rejected. '
          + 'These are facts, not a verdict: whether an error occurred and is adequately IDENTIFIED is yours to judge.',
      });
    }
  }
  return out;
}

module.exports = { collectErrorSummary, collectAtRestErrorState };
