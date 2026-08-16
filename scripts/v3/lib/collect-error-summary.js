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

module.exports = { collectErrorSummary };
