'use strict';
// C8 — a bundle of small deterministic accessibility SIGNALS (Phase-1 "targeted small signals"). Each decides the
// clear deterministic case and routes the semantic part (does the iframe title DESCRIBE the content; is the glyph
// MEANINGFUL) to the rubric.

function detectSignal(sel, aspect) {
  const el = sel && sel.startsWith('//') ? document.evaluate(sel, document, null, 9, null).singleNodeValue : document.querySelector(sel || 'body');
  if (!el) return { decided: false, reason: 'not-found' };
  const txt = (n) => n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const accName = (n) => n.getAttribute('aria-label') || (n.getAttribute('aria-labelledby') ? n.getAttribute('aria-labelledby').split(/\s+/).map((i) => txt(document.getElementById(i))).join(' ').trim() : '') || (n.getAttribute('alt') || '') || (n.getAttribute('title') || '');
  // accessible text = textContent EXCLUDING aria-hidden subtrees (an aria-hidden icon is not part of the name).
  const accTextOf = (n) => { if (!n) return ''; let s = ''; const walk = (node) => { for (const c of node.childNodes) { if (c.nodeType === 3) s += c.textContent; else if (c.nodeType === 1 && c.getAttribute('aria-hidden') !== 'true') walk(c); } }; walk(n); return s.replace(/\s+/g, ' ').trim(); };

  if (aspect === 'positive-tabindex-f44') {
    const ti = parseInt(el.getAttribute('tabindex'), 10);
    if (Number.isFinite(ti) && ti > 0) {
      // F44 is about DISRUPTING the order — needs ≥2 focusable elements for an order to disrupt.
      const focusables = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [tabindex]')].filter((n) => { const c = getComputedStyle(n); return c.display !== 'none' && c.visibility !== 'hidden' && n.tabIndex >= 0; });
      if (focusables.length < 2) return { decided: true, verdict: 'pass', reason: 'positive tabindex but only one focusable element — no order to disrupt' };
      // 2.4.3 fails ONLY when the resulting tab order DIFFERS from DOM order (F44 reorders meaning). The browser
      // visits positive-tabindex elements first (ascending value, DOM order ties), THEN tabindex=0/natural in DOM
      // order. A positive tabindex that happens to match DOM order preserves meaning ⇒ not a failure (avoid the
      // contrived false barrier; the corpus's real F44 cases all genuinely reorder).
      const withIdx = focusables.map((n, i) => ({ n, i, ti: n.tabIndex || 0 }));
      const tabOrder = [...withIdx].sort((a, b) => { if (a.ti > 0 && b.ti > 0) return (a.ti - b.ti) || (a.i - b.i); if (a.ti > 0) return -1; if (b.ti > 0) return 1; return a.i - b.i; }).map((x) => x.n);
      if (!focusables.some((n, i) => n !== tabOrder[i])) return { decided: true, verdict: 'pass', reason: 'positive tabindex but the resulting tab order matches DOM order — meaning preserved, no disruption' };
      return { decided: true, verdict: 'fail', reason: 'tabindex="' + ti + '" > 0 reorders focus vs DOM order, disrupting meaning (F44)' };
    }
    return { decided: true, verdict: 'pass', reason: 'no positive tabindex' };
  }

  if (aspect === 'pointer-only-handler') {
    const tag = el.tagName.toLowerCase();
    const nativeInteractive = /^(a|button|input|select|textarea|summary)$/.test(tag) && !(tag === 'a' && !el.hasAttribute('href'));
    const inlinePointer = ['onclick', 'onmousedown', 'onmouseup', 'onpointerdown', 'onpointerup'].some((h) => el.hasAttribute(h));
    const inlineKey = ['onkeydown', 'onkeyup', 'onkeypress'].some((h) => el.hasAttribute(h));
    const focusable = el.tabIndex >= 0;
    const hasWidgetRole = /^(button|link|menuitem|tab|checkbox|switch|radio|option)$/.test(el.getAttribute('role') || '');
    if (nativeInteractive) return { decided: true, verdict: 'pass', reason: 'native interactive element (keyboard-operable by the UA)' };
    if (inlinePointer && !focusable && !inlineKey) return { decided: true, verdict: 'fail', reason: 'pointer handler (' + tag + ') with NO keyboard path: not focusable (tabindex), no key handler' + (hasWidgetRole ? '' : ', no widget role') };
    if (inlinePointer && (focusable || inlineKey)) return { decided: false, abstain: true, uncertainReason: 'a non-native control with a pointer handler is focusable / has a key handler — whether the keyboard behavior is EQUIVALENT is a judgment; defer' };
    return { decided: false, abstain: true, uncertainReason: 'no inline pointer handler detected (a listener added via addEventListener is invisible to a static check) — defer to the keyboard runner' };
  }

  if (aspect === 'glyph-substitution') {
    // aria-hidden glyph is removed from AT — decorative, correctly hidden (the meaning is in the sibling text).
    if (el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]')) return { decided: true, verdict: 'pass', reason: 'glyph is aria-hidden (decorative / removed from AT)' };
    const t = txt(el);
    // PUA / homoglyph are judged on the ACCESSIBLE text (aria-hidden subtrees excluded) — an aria-hidden PUA icon next
    // to real text is decorative, so it must not count. Then if the accessible text has real WORD characters beyond the
    // glyph, the element is named and the (now-excluded) glyph is supplementary → falls through to pass.
    const at = accTextOf(el);
    const hasPUA = [...at].some((ch) => { const c = ch.codePointAt(0); return (c >= 0xE000 && c <= 0xF8FF) || (c >= 0xF0000 && c <= 0xFFFFD) || (c >= 0x100000 && c <= 0x10FFFD); });
    const homoglyph = /[Ѐ-ӿͰ-Ͽ]/.test(at) && /[a-zA-Z]/.test(at); // Cyrillic/Greek mixed with Latin
    const beforeC = getComputedStyle(el, '::before').content; const afterC = getComputedStyle(el, '::after').content;
    const pseudoContent = (c) => c && c !== 'none' && c !== 'normal' && c !== '""' && c !== "''" && !/^attr\(/.test(c);
    const pseudoGlyph = pseudoContent(beforeC) || pseudoContent(afterC);
    const name = accName(el);
    const hiddenText = !!el.querySelector('.sr-only, .visually-hidden, [class*=visually-hidden]');
    // the meaning may be carried by an accessible-name-providing CONTAINER (a link/button whose text labels it).
    const container = el.closest('a[href], button, [role=button], [role=link], label');
    const containerText = container && container !== el ? txt(container).replace(t, '').trim() : '';
    if (containerText) return { decided: true, verdict: 'pass', reason: 'the glyph is inside a control whose accessible text carries the meaning' };
    if (hasPUA && !name && !hiddenText) return { decided: true, verdict: 'fail', reason: 'icon-font (PUA) glyph in the element\'s own text with NO text alternative (aria-label/visually-hidden text)' };
    if (homoglyph) return { decided: false, abstain: true, uncertainReason: 'text mixes Cyrillic/Greek lookalike characters with Latin — whether it MISLEADS is a judgment; defer', facts: { text: t } };
    // a meaning-bearing ::before/::after symbol is a SEMANTIC judgment (decorative bullet vs star-rating/required/
    // directional-arrow cue) ⇒ defer — UNLESS sr-only text genuinely carries it. A bare accessible NAME does NOT
    // settle it: the pseudo can add info the name omits (case-24: a directional ::after arrow on a named control).
    if (pseudoGlyph && !hiddenText) return { decided: false, abstain: true, uncertainReason: 'meaning may be conveyed by a ::before/::after pseudo-element glyph — whether it is informative (star rating, required, directional arrow) beyond the accessible name vs decorative is a judgment; defer', facts: { before: beforeC, after: afterC, name } };
    if (hasPUA || pseudoGlyph) return { decided: true, verdict: 'pass', reason: 'glyph has a text alternative' };
    return { decided: true, verdict: 'pass', reason: 'real text content (no substituted glyph)' };
  }

  if (aspect === 'long-description-presence') {
    // complex image?
    const complex = (el.tagName === 'IMG' || el.getAttribute('role') === 'img' || el.tagName === 'SVG' || el.tagName === 'CANVAS') && (el.getBoundingClientRect().width >= 150 && el.getBoundingClientRect().height >= 120 || /chart|graph|diagram|figure|plot|map/i.test((el.className || '') + (el.getAttribute('alt') || '')));
    if (!complex) return { decided: false, abstain: true, uncertainReason: 'not detected as a complex image needing a long description — defer' };
    const describedby = (el.getAttribute('aria-describedby') || '').split(/\s+/).map((i) => txt(document.getElementById(i))).join(' ').trim();
    const figcap = el.closest('figure') ? txt(el.closest('figure').querySelector('figcaption')) : '';
    const details = el.closest('details') || (el.parentElement && el.parentElement.querySelector('details'));
    const longdesc = el.getAttribute('longdesc');
    const adjacentTable = el.parentElement && el.parentElement.querySelector('table');
    // a visible "Long description" link immediately after the image, resolving to an in-page section, is a recognised
    // long-description location — walk a few following siblings for a description link → a substantial in-page target.
    let longdescLink = '';
    let sib = el.nextElementSibling; let hops = 0;
    while (sib && hops < 4) {
      const a = (sib.matches && sib.matches('a[href^="#"]')) ? sib : (sib.querySelector ? sib.querySelector('a[href^="#"]') : null);
      if (a && /(long\s*desc|description|full\s*desc|details?|text alternative)/i.test(a.textContent || '')) { const tgt = document.getElementById((a.getAttribute('href') || '').slice(1)); if (tgt && txt(tgt).length > 60) { longdescLink = txt(tgt); break; } }
      sib = sib.nextElementSibling; hops++;
    }
    const hasSource = !!(describedby || (figcap && figcap.length > 40) || details || longdesc || adjacentTable || longdescLink);
    if (!hasSource) return { decided: true, verdict: 'fail', reason: 'complex image with NO long-description source (describedby/figcaption/details/adjacent-table/longdesc/description-link)' };
    return { decided: false, abstain: true, uncertainReason: 'a long-description source exists — whether it is COMPLETE/adequate is the long-description rubric\'s judgment; defer', facts: { describedby: describedby.slice(0, 80), figcap: figcap.slice(0, 80), hasDetails: !!details, hasTable: !!adjacentTable } };
  }

  if (aspect === 'iframe-name-vs-content') {
    if (el.tagName !== 'IFRAME') return { decided: false, abstain: true, uncertainReason: 'not an iframe' };
    const labelledby = (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((i) => txt(document.getElementById(i))).join(' ').trim();
    const title = (el.getAttribute('title') || el.getAttribute('aria-label') || labelledby || '').trim();
    if (!title) return { decided: true, verdict: 'fail', reason: 'iframe has NO title/aria-label/aria-labelledby (H64)' };
    if (/^(frame|iframe|content|embed|widget|ad|advertisement|untitled)\d*$/i.test(title)) return { decided: true, verdict: 'fail', reason: 'iframe title is generic/non-descriptive: "' + title + '"' };
    return { decided: false, abstain: true, uncertainReason: 'iframe has a title — whether it DESCRIBES the frame content is a semantic judgment; defer with the title + a content summary', facts: { title } };
  }

  if (aspect === 'multipart-field-grouping') {
    const parent = el.closest('fieldset, [role=group], form, div');
    const sibs = parent ? [...parent.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')] : [el];
    const splitInputs = sibs.filter((i) => { const ml = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(ml) && ml <= 6; });
    if (splitInputs.length < 2) return { decided: false, abstain: true, uncertainReason: 'not a multi-part (split) field — defer' };
    const fset = el.closest('fieldset'); const legend = fset ? txt(fset.querySelector('legend')) : '';
    const grp = el.closest('[role=group],[role=radiogroup]'); const grpName = grp ? (grp.getAttribute('aria-label') || (grp.getAttribute('aria-labelledby') ? grp.getAttribute('aria-labelledby').split(/\s+/).map((i) => txt(document.getElementById(i))).join(' ') : '')) : '';
    const groupName = legend || grpName;
    const namedFor = (i) => i.id && (() => { const l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(i.id) : i.id) + '"]'); return l && txt(l).length > 0; })();
    const namedWrap = (i) => { const wl = i.closest('label'); return wl && txt(wl).replace(i.value || '', '').trim().length > 0; };
    const eachNamed = splitInputs.every((i) => accName(i) || namedFor(i) || namedWrap(i));
    if (!groupName && !eachNamed) return { decided: true, verdict: 'fail', reason: 'split field (' + splitInputs.length + ' parts) has NO group label (legend/aria-label) and sub-fields lack individual names' };
    if (eachNamed) return { decided: true, verdict: 'pass', reason: 'each sub-field is individually named' };
    // a group NAME exists but the sub-fields are individually unnamed — whether the group name + position is
    // SUFFICIENT (vs each part needing a name) is a judgment ⇒ defer to the rubric.
    return { decided: false, abstain: true, uncertainReason: 'split field has a group name but the parts are individually unnamed — whether the group name alone is sufficient is a judgment; defer', facts: { groupName, parts: splitInputs.length } };
  }

  return { decided: false, abstain: true, uncertainReason: 'unhandled signal aspect' };
}

async function runSmallSignal(page, { aspect, targetSelector } = {}) {
  const r = await page.evaluate(detectSignal, targetSelector, aspect).catch(() => ({ decided: false, reason: 'eval-failed' }));
  return { aspect, ...r };
}

module.exports = { runSmallSignal, detectSignal };
